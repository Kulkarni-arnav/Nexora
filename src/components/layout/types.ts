export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type WorkspaceNavItem = {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  isOwner: boolean;
  memberCount: number;
};

export type WorkspaceInfo = WorkspaceNavItem;

export type UserNav = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
};
