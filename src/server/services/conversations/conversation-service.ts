import "server-only";
import { prisma } from "@/server/db/client";
import { ForbiddenError } from "@/server/validation/errors";

export interface Conversation {
  id: string;
  workspaceId: string;
  documentId: string | null;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Creates a new conversation in the workspace. */
export async function createConversation(
  workspaceId: string,
  userId: string,
  title: string
): Promise<Conversation> {
  // Check user is a member of the workspace
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (!membership) {
    throw new ForbiddenError("Access denied to this workspace");
  }

  if (!["OWNER", "ADMIN", "MEMBER"].includes(membership.role)) {
    throw new ForbiddenError("Insufficient permissions to create conversations");
  }

  const conversation = await prisma.conversation.create({
    data: {
      workspaceId,
      title,
      documentId: null,
    },
    select: {
      id: true,
      workspaceId: true,
      documentId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: conversation.id,
    workspaceId: conversation.workspaceId,
    documentId: conversation.documentId,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

/** List conversations for a workspace */
export async function listConversations(
  workspaceId: string,
  userId: string
): Promise<Conversation[]> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
  });

  if (!membership) {
    return [];
  }

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      workspaceId: true,
      documentId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return conversations;
}

/** Get a conversation by ID */
export async function getConversation(
  workspaceId: string,
  conversationId: string
): Promise<Conversation | null> {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      workspaceId,
    },
    select: {
      id: true,
      workspaceId: true,
      documentId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return conversation || null;
}

/** Update conversation title */
export async function updateConversation(
  workspaceId: string,
  conversationId: string,
  title: string
): Promise<Conversation | null> {
  try {
    const conversation = await prisma.conversation.update({
      where: {
        id: conversationId,
        workspaceId,
      },
      data: { title },
      select: {
        id: true,
        workspaceId: true,
        documentId: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return conversation;
  } catch {
    return null;
  }
}

/** Delete a conversation */
export async function deleteConversation(
  workspaceId: string,
  conversationId: string
): Promise<boolean> {
  try {
    await prisma.conversation.delete({
      where: {
        id: conversationId,
        workspaceId,
      },
    });
    return true;
  } catch {
    return false;
  }
}