import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { listDocuments, serializeDocument } from "@/server/services/documents/document-service";
import { MAX_DOCUMENT_SIZE_BYTES, SUPPORTED_FILE_ACCEPT, SUPPORTED_FILE_DESCRIPTION } from "@/server/services/documents/config";
import { DocumentsClient } from "./documents-client";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Manage documents in your NEXORA AI workspace",
};

const ROLE_ORDER = ["OWNER", "ADMIN", "MEMBER", "VIEWER"];

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const workspaceId = await getCurrentWorkspaceId();
  const memberships = await getUserWorkspaces(session.user.id);

  if (!workspaceId && memberships.length === 0) {
    redirect("/onboarding");
  }

  const currentWorkspace = workspaceId
    ? memberships.find((m) => m.workspace.id === workspaceId)?.workspace
    : memberships[0]?.workspace;

  if (!currentWorkspace) {
    redirect("/onboarding");
  }

  const membership = memberships.find((m) => m.workspace.id === currentWorkspace.id);
  const role = membership?.role ?? "VIEWER";
  const roleRank = ROLE_ORDER.indexOf(role);

  const documents = await listDocuments(currentWorkspace.id);

  return (
    <DocumentsClient
      workspace={{
        id: currentWorkspace.id,
        name: currentWorkspace.name,
        slug: currentWorkspace.slug,
        role,
      }}
      canUpload={roleRank <= ROLE_ORDER.indexOf("MEMBER")}
      canManage={roleRank <= ROLE_ORDER.indexOf("ADMIN")}
      initialDocuments={documents.map((document) => ({
        ...serializeDocument(document),
        metadata: document.metadata as Record<string, number> | null,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      }))}
      maxFileSize={MAX_DOCUMENT_SIZE_BYTES}
      accept={SUPPORTED_FILE_ACCEPT}
      supportedDescription={SUPPORTED_FILE_DESCRIPTION}
    />
  );
}
