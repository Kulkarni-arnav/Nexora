"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface StartConversationProps {
  workspaceId: string;
}

export function StartConversationButton({ workspaceId }: StartConversationProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/conversations`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error || "Failed to create conversation");
      }

      const data = await response.json();
      const conversationId = data.conversation?.id || data.id;

      if (conversationId) {
        router.push(`/conversations/${conversationId}?workspaceId=${workspaceId}`);
      } else {
        router.push("/conversations");
      }
    } catch (err) {
      setError((err as Error).message || "Failed to create conversation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isSubmitting}
      className="w-full"
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {isSubmitting ? (
        <span className="animating-bounce">Start a conversation</span>
      ) : (
        "Start a conversation"
      )}
    </Button>
  );
}
