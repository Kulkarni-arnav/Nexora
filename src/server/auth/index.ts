import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/server/db/client";
import { AppError, NotFoundError, ForbiddenError, UnauthorizedError } from "@/server/validation/errors";
import type { MemberRole } from "@/generated/prisma";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user;
}

export async function getCurrentWorkspaceId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });

  return membership?.workspaceId ?? null;
}

export async function requireWorkspaceMember(
  workspaceId: string,
  userId?: string
) {
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : await requireUser();
  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId,
      },
    },
    include: { workspace: true },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied to this workspace");
  }

  return { membership, workspace: membership.workspace, user };
}

export async function requireWorkspaceRole(
  workspaceId: string,
  allowedRoles: MemberRole[],
  userId?: string
) {
  const { membership, workspace, user } = await requireWorkspaceMember(workspaceId, userId);

  if (!allowedRoles.includes(membership.role)) {
    throw new ForbiddenError(`Requires one of: ${allowedRoles.join(", ")}`);
  }

  return { membership, workspace, user };
}

export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, documents: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createWorkspaceForUser(
  userId: string,
  name: string,
  slug: string,
  description?: string
) {
  const existingSlug = await prisma.workspace.findUnique({ where: { slug } });
  if (existingSlug) {
    throw new AppError("Workspace slug already exists", "SLUG_EXISTS", 400);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name,
      slug,
      description,
      ownerId: userId,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
  });

  return workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  data: { name?: string; description?: string }
) {
  await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"], userId);

  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  await requireWorkspaceRole(workspaceId, ["OWNER"], userId);

  return prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function addWorkspaceMember(
  workspaceId: string,
  actorId: string,
  email: string,
  role: MemberRole = "MEMBER"
) {
  const { membership: actorMembership } = await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"], actorId);

  if (actorMembership.role === "ADMIN" && role === "OWNER") {
    throw new ForbiddenError("Admins cannot assign the owner role");
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw new NotFoundError("User", email);
  }

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing) {
    throw new AppError("User is already a member", "ALREADY_MEMBER", 400);
  }

  return prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
}

export async function updateMemberRole(
  workspaceId: string,
  actorId: string,
  targetUserId: string,
  newRole: MemberRole
) {
  const { membership: actorMembership } = await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"], actorId);

  if (targetUserId === actorId) {
    throw new AppError("Cannot change your own role", "SELF_ROLE_CHANGE", 400);
  }

  if (actorMembership.role === "ADMIN" && newRole === "OWNER") {
    throw new ForbiddenError("Admins cannot assign owner role");
  }

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!targetMembership) {
    throw new NotFoundError("Workspace member", targetUserId);
  }

  if (targetMembership.role === "OWNER" && actorMembership.role !== "OWNER") {
    throw new ForbiddenError("Cannot modify owner");
  }

  return prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    data: { role: newRole },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
}

export async function removeWorkspaceMember(
  workspaceId: string,
  actorId: string,
  targetUserId: string
) {
  await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"], actorId);

  if (targetUserId === actorId) {
    throw new AppError("Cannot remove yourself", "SELF_REMOVE", 400);
  }

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!targetMembership) {
    throw new NotFoundError("Workspace member", targetUserId);
  }

  if (targetMembership.role === "OWNER") {
    throw new ForbiddenError("Cannot remove owner");
  }

  return prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
}