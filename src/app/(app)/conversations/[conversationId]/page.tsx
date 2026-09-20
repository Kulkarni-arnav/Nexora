"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitBranch } from "lucide-react";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId") || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchingFrom, setBranchingFrom] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!conversationId || !workspaceId) return;

    fetch(`/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      });
  }, [conversationId, workspaceId]);

  const handleBranch = async (messageId: string) => {
    setBranchingFrom(messageId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !workspaceId || !branchingFrom) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: newMessage.trim(),
          parentMessageId: branchingFrom,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to send message");
      }

      const data = await response.json();
      setNewMessage("");
      setBranchingFrom(null);
      setIsSubmitting(false);

      fetch(`/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`, {
        credentials: "include",
      }).then((res) => res.json()).then((data) => {
        setMessages(data.messages || []);
      });
    } catch (err) {
      setError((err as Error).message || "Failed to send message");
      setIsSubmitting(false);
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="min-h-screen p-4 flex items-center justify-center">
        <p>Loading conversation...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.map((msg) => (
            <div key={msg.id} className="mb-4 p-3 rounded-lg bg-muted/5 border border-border">
              <p className="font-medium text-sm">{msg.role === "user" ? "You" : "Assistant"}</p>
              <p className="text-sm overflow-hidden whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBranch(msg.id)}
                  className="mt-2 text-xs text-primary"
                >
                  <GitBranch className="h-3 w-3 mr-1" /> Branch from here
                </Button>
              )}
            </div>
          ))}

          {branchingFrom && (
            <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20">
              <p className="text-xs text-primary mb-1">
                Branching from message above. Your next message will start a new branch.
              </p>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isSubmitting}
                className="w-full"
              />
            </div>
          )}

          {!branchingFrom && (
            <Button
              onClick={() => setBranchingFrom(null)}
              className="mt-2 w-full text-sm text-muted-foreground"
            >
              Start new conversation thread
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}