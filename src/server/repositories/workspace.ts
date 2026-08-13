import { prisma } from "@/server/db/client";
import { AppError, NotFoundError, ForbiddenError } from "@/server/validation/errors";
import type { MemberRole } from "@/generated/prisma";

export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, documents: true, conversations: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, documents: true, conversations: true } },
    },
  });
}

export async function getWorkspaceBySlug(slug: string) {
  return prisma.workspace.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createWorkspace(userId: string, data: { name: string; slug: string; description?: string }) {
  const existingSlug = await prisma.workspace.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    throw new AppError("Workspace slug already exists", "SLUG_EXISTS", 400);
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description,
      ownerId: userId,
      members: { create: { userId, role: "OWNER" } },
    },
  });

  return workspace;
}

export async function updateWorkspace(workspaceId: string, userId: string, data: { name?: string; description?: string }) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new NotFoundError("Workspace member", userId);
  if (!["OWNER", "ADMIN"].includes(membership.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
  });
}

export async function deleteWorkspace(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new NotFoundError("Workspace member", userId);
  if (membership.role !== "OWNER") {
    throw new ForbiddenError("Only owner can delete workspace");
  }

  return prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true, image: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
}

export async function addMember(workspaceId: string, actorId: string, email: string, role: MemberRole = "MEMBER") {
  const actorMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: actorId, workspaceId } },
  });
  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  if (actorMembership.role === "ADMIN" && role === "OWNER") {
    throw new ForbiddenError("Admins cannot assign the owner role");
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new NotFoundError("User", email);

  const existing = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: user.id, workspaceId } },
  });
  if (existing) throw new AppError("User is already a member", "ALREADY_MEMBER", 400);

  return prisma.workspaceMember.create({
    data: { workspaceId, userId: user.id, role },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, image: true } } },
  });
}

export async function updateMemberRole(workspaceId: string, actorId: string, targetUserId: string, newRole: MemberRole) {
  const actorMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: actorId, workspaceId } },
  });
  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  if (targetUserId === actorId) throw new AppError("Cannot change your own role", "SELF_ROLE_CHANGE", 400);
  if (actorMembership.role === "ADMIN" && newRole === "OWNER") {
    throw new ForbiddenError("Admins cannot assign owner role");
  }

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!targetMembership) throw new NotFoundError("Workspace member", targetUserId);
  if (targetMembership.role === "OWNER" && actorMembership.role !== "OWNER") {
    throw new ForbiddenError("Cannot modify owner");
  }

  return prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    data: { role: newRole },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true, image: true } } },
  });
}

export async function removeMember(workspaceId: string, actorId: string, targetUserId: string) {
  const actorMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: actorId, workspaceId } },
  });
  if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
    throw new ForbiddenError("Insufficient permissions");
  }

  if (targetUserId === actorId) throw new AppError("Cannot remove yourself", "SELF_REMOVE", 400);

  const targetMembership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
  if (!targetMembership) throw new NotFoundError("Workspace member", targetUserId);
  if (targetMembership.role === "OWNER") throw new ForbiddenError("Cannot remove owner");

  return prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
}

export async function getUserMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    include: { workspace: true },
  });
}