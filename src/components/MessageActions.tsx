
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy, Edit2, Trash2 } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { VoiceOutput } from "./VoiceOutput";
import { MessageReactions } from "./MessageReactions";
import { ConversationBranching } from "./ConversationBranching";
import { Message } from "@/types";

interface MessageActionsProps {
  message: Message;
  messages?: Message[];
  messageIndex?: number;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isLastMessage?: boolean;
  onBranchCreated?: (conversationId: string) => void;
}

export function MessageActions({ message, messages, messageIndex, onRegenerate, onEdit, onDelete, isLastMessage, onBranchCreated }: MessageActionsProps) {
  const isAssistant = message.role === "assistant";
  const isUser = message.role === "user";
  const showRegenerate = isAssistant && isLastMessage && onRegenerate;

  return (
    <div className="flex items-center justify-start gap-1 mt-3 pt-2 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-all duration-200">
      <CopyButton 
        text={message.content} 
        className="h-7 w-7 hover:bg-accent/50 rounded-md transition-colors" 
      />
      
      {/* Edit button for user messages */}
      {isUser && onEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 w-7 p-0 hover:bg-accent/50 rounded-md transition-colors"
          title="Edit message"
        >
          <Edit2 size={13} />
        </Button>
      )}
      
      {/* Regenerate button for assistant messages */}
      {showRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          className="h-7 w-7 p-0 hover:bg-accent/50 rounded-md transition-colors"
          title="Regenerate response"
        >
          <RefreshCw size={13} />
        </Button>
      )}
      
      {/* Voice output for assistant messages */}
      {isAssistant && (
        <VoiceOutput 
          text={message.content} 
          className="ml-2 border-l border-border/20 pl-2" 
        />
      )}
      
      {/* Conversation branching */}
      {messages && messageIndex !== undefined && (
        <ConversationBranching
          message={message}
          messages={messages}
          messageIndex={messageIndex}
          onBranchCreated={onBranchCreated}
        />
      )}
      
      {/* Message reactions */}
      <MessageReactions 
        messageId={message.id} 
        className="ml-2 border-l border-border/20 pl-2" 
      />
      
      {/* Delete button for assistant messages only */}
      {isAssistant && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          title="Delete message"
        >
          <Trash2 size={13} />
        </Button>
      )}
    </div>
  );
}
