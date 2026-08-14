import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { prisma } from "@/server/db/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  Building2,
  Calendar,
  FileText,
  GitBranch,
  Hash,
  Layers,
  MessageSquare,
  Settings,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import type { WorkspaceRole } from "@/components/layout/types";

const roleLabels: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  PROCESSING: { label: "Processing", className: "bg-primary/10 text-primary" },
  COMPLETED: { label: "Indexed", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  FAILED: { label: "Failed", className: "bg-destructive/10 text-destructive" },
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good evening";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const roadmap = [
  {
    phase: "Phase 3",
    icon: Upload,
    title: "Upload your first document",
    description: "Ingest PDFs, DOCX, and text files into your knowledge base.",
  },
  {
    phase: "Phase 4",
    icon: Bot,
    title: "Ask questions grounded in your documents",
    description: "Chat with your knowledge and get cited, well-sourced answers.",
  },
  {
    phase: "Phase 5",
    icon: Layers,
    title: "Explore and manage your knowledge",
    description: "Search, browse, and organize everything across your workspace.",
  },
];

export default async function DashboardPage() {
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

  const [documentCount, conversationCount, messageCount] = await Promise.all([
    prisma.document.count({ where: { workspaceId: currentWorkspace.id } }),
    prisma.conversation.count({ where: { workspaceId: currentWorkspace.id } }),
    prisma.message.count({
      where: { conversation: { workspaceId: currentWorkspace.id }, role: "USER" },
    }),
  ]);

  const recentDocuments = await prisma.document.findMany({
    where: { workspaceId: currentWorkspace.id },
    orderBy: { createdAt: "desc" },
    take: 4,
    select: { id: true, title: true, status: true, createdAt: true, fileName: true },
  });

  const recentConversations = await prisma.conversation.findMany({
    where: { workspaceId: currentWorkspace.id },
    orderBy: { updatedAt: "desc" },
    take: 4,
    select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
  });

  const isEmpty = documentCount === 0 && conversationCount === 0;

  const stats = [
    {
      label: "Documents",
      icon: FileText,
      value: documentCount,
      hint: "In your knowledge base",
    },
    {
      label: "Conversations",
      icon: MessageSquare,
      value: conversationCount,
      hint: "Chat sessions started",
    },
    {
      label: "Questions Asked",
      icon: Sparkles,
      value: messageCount,
      hint: "Queries to the assistant",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{greeting()},</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {session.user.name || "there"}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            Welcome back to
            <span className="font-medium text-foreground">{currentWorkspace.name}</span>
            {membership && (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {roleLabels[membership.role]}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3 w-3" />
              {membership?.workspace._count.members ?? 1} member
              {(membership?.workspace._count.members ?? 1) === 1 ? "" : "s"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
              Manage settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none tabular-nums">{stat.value}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {stat.label} · {stat.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Knowledge base</CardTitle>
              <CardDescription>
                Your documents and what has been indexed
              </CardDescription>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {documentCount === 0 ? (
              <div className="rounded-lg border border-dashed px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground">No documents yet</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Upload PDFs, DOCX, and text files to start building your searchable
                  knowledge base.
                </p>
                <Button variant="outline" disabled className="mt-5">
                  <Upload className="h-4 w-4" />
                  Upload a document
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Document ingestion arrives in Phase 3.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentDocuments.map((doc) => {
                  const status = statusLabels[doc.status] ?? statusLabels.PENDING;
                  return (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{doc.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {doc.fileName} · {dateFormatter.format(doc.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">AI research assistant</CardTitle>
              <CardDescription>
                Ask questions and get grounded, cited answers
              </CardDescription>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </span>
          </CardHeader>
          <CardContent>
            {conversationCount === 0 ? (
              <div className="rounded-lg border border-dashed px-6 py-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground">No conversations yet</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                  Once your knowledge base is ready, chat with it to find answers and
                  insights instantly.
                </p>
                <Button variant="outline" disabled className="mt-5">
                  <MessageSquare className="h-4 w-4" />
                  Start a conversation
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  RAG chat arrives in Phase 4.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {recentConversations.map((conv) => (
                  <li
                    key={conv.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{conv.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {conv._count.messages} message
                          {conv._count.messages === 1 ? "" : "s"} · updated{" "}
                          {dateFormatter.format(conv.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GitBranch className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-base">
                  {isEmpty ? "Get started with NEXORA" : "What&apos;s next"}
                </CardTitle>
                <CardDescription>
                  {isEmpty
                    ? "A quick roadmap to your first searchable knowledge base"
                    : "The product is being built towards these capabilities"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-0">
              {roadmap.map((step, index) => (
                <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < roadmap.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-border"
                    />
                  )}
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                    <step.icon className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{step.title}</p>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
                        {step.phase}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Workspace</CardTitle>
            <CardDescription>Current workspace details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Name" value={currentWorkspace.name} icon={Building2} />
            <Row label="Slug" value={currentWorkspace.slug} icon={Hash} />
            {membership && (
              <Row label="Your role" value={roleLabels[membership.role]} icon={Users} />
            )}
            <Row
              label="Members"
              value={String(membership?.workspace._count.members ?? 1)}
              icon={Users}
            />
            <Row
              label="Created"
              value={dateFormatter.format(currentWorkspace.createdAt)}
              icon={Calendar}
            />
            <Link
              href="/settings"
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Workspace settings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}