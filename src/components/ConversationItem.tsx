
import React, { useState } from "react";
import { Conversation } from "@/types";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { MessageSquare, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
  onRename?: (id: string, newTitle: string) => void;
}

export function ConversationItem({ conversation, isActive, onClick, onRename }: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename?.(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
    setEditTitle(conversation.title);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(conversation.title);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full p-2">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-6 text-xs"
          autoFocus
          onFocus={(e) => e.target.select()}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleRename}
        >
          <Check size={12} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCancel}
        >
          <X size={12} />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center w-full">
      <SidebarMenuButton 
        asChild 
        className={cn(
          "flex-1 justify-start cursor-pointer max-w-full",
          isActive && "bg-accent text-accent-foreground"
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2 w-full min-w-0 max-w-full overflow-hidden">
          <MessageSquare size={16} className="flex-shrink-0" />
          <span className="truncate text-sm font-medium max-w-full block" title={conversation.title}>
            {conversation.title}
          </span>
        </div>
      </SidebarMenuButton>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={handleEditClick}
        title="Rename conversation"
      >
        <Edit2 size={12} />
      </Button>
    </div>
  );
}
