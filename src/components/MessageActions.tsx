
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Edit2, Trash2 } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { Message } from "@/types";

interface MessageActionsProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isLastMessage?: boolean;
}

export function MessageActions({ message, onRegenerate, onEdit, onDelete, isLastMessage }: MessageActionsProps) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";
  const showRegenerate = isAssistant && isLastMessage && onRegenerate;

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton text={message.content} className="h-6 w-6" />
      
      {/* Edit button for user messages */}
      {isUser && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-6 w-6 p-0"
          title="Edit message"
        >
          <Edit2 size={12} />
        </Button>
      )}
      
      {/* Regenerate button for assistant messages */}
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
      
      {/* Delete button for assistant messages only */}
      {isAssistant && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          title="Delete message"
        >
          <Trash2 size={12} />
        </Button>
      )}
    </div>
  );
}
