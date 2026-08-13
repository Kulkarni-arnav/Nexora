import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentWorkspaceId, getUserWorkspaces } from "@/server/auth";
import { prisma } from "@/server/db/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, FileText, MessageSquare, Plus, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

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
    take: 5,
    select: { id: true, title: true, status: true, createdAt: true, fileName: true },
  });

  const recentConversations = await prisma.conversation.findMany({
    where: { workspaceId: currentWorkspace.id },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Good morning, {session.user.name || "there"}</h1>
        <p className="text-muted-foreground mt-1">Welcome back to <span className="font-medium">{currentWorkspace.name}</span>.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documentCount}</div>
            <p className="text-xs text-muted-foreground">Total documents in workspace</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversationCount}</div>
            <p className="text-xs text-muted-foreground">Chat sessions started</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messageCount}</div>
            <p className="text-xs text-muted-foreground">Total questions to AI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Your latest uploads</CardDescription>
            </div>
            <Link href="/dashboard/documents">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {documentCount === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No documents yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Your knowledge base is empty.</p>
                <Button variant="outline" disabled>
                  Add your first document <Plus className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Coming in Phase 3</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDocuments.map((doc) => (
                  <Link key={doc.id} href={`/dashboard/documents/${doc.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">{doc.status.toLowerCase()}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>Your latest AI chats</CardDescription>
            </div>
            <Link href="/dashboard/conversations">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {conversationCount === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Start chatting with your documents.</p>
                <Button variant="outline" disabled>
                  New chat <Plus className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Coming in Phase 4</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConversations.map((conv) => (
                  <Link key={conv.id} href={`/dashboard/conversations/${conv.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium truncate max-w-[200px]">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">{conv._count.messages} messages</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary">AI Assistant</CardTitle>
            </div>
            <CardDescription>Chat with your knowledge base using RAG-powered AI</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">Ask questions, get cited answers grounded in your documents.</p>
            <Button variant="outline" disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Coming in Phase 4
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary">Document Upload</CardTitle>
            </div>
            <CardDescription>Upload PDFs, DOCX, and text files for processing</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">Drag and drop or browse files to add to your knowledge base.</p>
            <Button variant="outline" disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Coming in Phase 3
            </Button>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-primary">Conversations</CardTitle>
            </div>
            <CardDescription>Manage and continue your AI chat sessions</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">View history, branch conversations, and export chats.</p>
            <Button variant="outline" disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Coming in Phase 4
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}