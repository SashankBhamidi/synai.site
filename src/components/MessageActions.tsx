
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { Message } from "@/types";

interface MessageActionsProps {
  message: Message;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
}

export function MessageActions({ message, onRegenerate, isLastMessage }: MessageActionsProps) {
  const isAssistant = message.role === "assistant";
  const showRegenerate = isAssistant && isLastMessage && onRegenerate;

  if (!isAssistant) return null;

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton text={message.content} className="h-6 w-6" />
      {showRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-6 w-6 p-0"
          title="Regenerate response"
        >
          <RefreshCw size={12} />
        </Button>
      )}
    </div>
  );
}
