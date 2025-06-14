import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Star, Pin, Folder } from "lucide-react";
import { Conversation } from "@/types";
import { ConversationContextMenu } from "./ConversationContextMenu";

interface EnhancedConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMoveToFolder: (id: string, folderId?: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  availableFolders: Array<{ id: string; name: string; color?: string }>;
  availableTags: string[];
  folderInfo?: { name: string; color?: string };
}

export function EnhancedConversationItem({
  conversation,
  isActive,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  onMoveToFolder,
  onAddTag,
  onRemoveTag,
  onRename,
  onDelete,
  availableFolders,
  availableTags,
  folderInfo
}: EnhancedConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditTitle(conversation.title);
    setIsEditing(true);
  };

  const handleSave = () => {
    const newTitle = editTitle.trim();
    if (newTitle && newTitle !== conversation.title) {
      onRename(conversation.id, newTitle);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <SidebarMenuItem>
      <div className={`group flex flex-col gap-2 w-full p-3 rounded-md hover:bg-accent transition-colors ${
        isActive ? 'bg-accent border-l-2 border-primary' : ''
      } ${conversation.isPinned ? 'bg-accent/50' : ''}`}>
        
        {/* Header with title and actions */}
        <div className="flex items-start justify-between">
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => !isEditing && onSelect(conversation)}
          >
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="h-6 text-sm px-1"
              />
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {conversation.isPinned && (
                    <Pin size={12} className="text-primary fill-current" />
                  )}
                  {conversation.isFavorite && (
                    <Star size={12} className="text-yellow-500 fill-current" />
                  )}
                  <div className="text-sm font-medium truncate flex-1">
                    {conversation.title}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(conversation.updatedAt)}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ConversationContextMenu
              conversation={conversation}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onMoveToFolder={onMoveToFolder}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onRename={onRename}
              onDelete={onDelete}
              availableFolders={availableFolders}
              availableTags={availableTags}
            />
          </div>
        </div>

        {/* Folder indicator */}
        {folderInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Folder size={10} />
            <div 
              className="w-2 h-2 rounded"
              style={{ backgroundColor: folderInfo.color || '#64748b' }}
            />
            <span>{folderInfo.name}</span>
          </div>
        )}

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {conversation.tags.slice(0, 3).map(tag => (
              <Badge 
                key={tag}
                variant="outline"
                className="text-xs h-4 px-1"
              >
                {tag}
              </Badge>
            ))}
            {conversation.tags.length > 3 && (
              <Badge 
                variant="outline"
                className="text-xs h-4 px-1"
              >
                +{conversation.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {conversation.description && (
          <div className="text-xs text-muted-foreground truncate">
            {conversation.description}
          </div>
        )}
      </div>
    </SidebarMenuItem>
  );
}