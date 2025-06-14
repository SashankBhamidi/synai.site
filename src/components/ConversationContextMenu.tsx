import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Star, 
  Pin, 
  Folder, 
  Tag, 
  Edit2, 
  Trash2, 
  MoreHorizontal,
  Plus,
  X,
  Share2
} from "lucide-react";
import { Conversation } from "@/types";
import { ConversationSharingDialog } from "./ConversationSharingDialog";

interface ConversationContextMenuProps {
  conversation: Conversation;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onMoveToFolder: (id: string, folderId?: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  availableFolders: Array<{ id: string; name: string; color?: string }>;
  availableTags: string[];
}

export function ConversationContextMenu({
  conversation,
  onToggleFavorite,
  onTogglePin,
  onMoveToFolder,
  onAddTag,
  onRemoveTag,
  onRename,
  onDelete,
  availableFolders,
  availableTags
}: ConversationContextMenuProps) {
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !conversation.tags?.includes(tag)) {
      onAddTag(conversation.id, tag);
      setNewTag("");
      setIsTagDialogOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleFavorite(conversation.id); }}>
            <Star size={14} className={`mr-2 ${conversation.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {conversation.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onTogglePin(conversation.id); }}>
            <Pin size={14} className={`mr-2 ${conversation.isPinned ? 'fill-current' : ''}`} />
            {conversation.isPinned ? 'Unpin' : 'Pin to Top'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Move to Folder */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Folder size={14} className="mr-2" />
              Move to Folder
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onMoveToFolder(conversation.id, undefined)}>
                None (Root)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {availableFolders.map(folder => (
                <DropdownMenuItem 
                  key={folder.id}
                  onClick={() => onMoveToFolder(conversation.id, folder.id)}
                  className={conversation.folderId === folder.id ? 'bg-accent' : ''}
                >
                  <div 
                    className="w-3 h-3 rounded mr-2"
                    style={{ backgroundColor: folder.color || '#64748b' }}
                  />
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Tags */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Tag size={14} className="mr-2" />
              Tags {conversation.tags?.length ? `(${conversation.tags.length})` : ''}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setIsTagDialogOpen(true)}>
                <Plus size={14} className="mr-2" />
                Add Tag
              </DropdownMenuItem>
              
              {conversation.tags && conversation.tags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Remove Tags</DropdownMenuLabel>
                  {conversation.tags.map(tag => (
                    <DropdownMenuItem 
                      key={tag}
                      onClick={() => onRemoveTag(conversation.id, tag)}
                      className="text-destructive focus:text-destructive"
                    >
                      <X size={14} className="mr-2" />
                      {tag}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          
          <ConversationSharingDialog 
            conversation={conversation}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Share2 size={14} className="mr-2" />
                Share
              </DropdownMenuItem>
            }
          />
          
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Handle rename */ }}>
            <Edit2 size={14} className="mr-2" />
            Rename
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 size={14} className="mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Input
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            {availableTags.length > 0 && (
              <div>
                <label className="text-sm font-medium">Or select existing:</label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {availableTags
                    .filter(tag => !conversation.tags?.includes(tag))
                    .map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => {
                        onAddTag(conversation.id, tag);
                        setIsTagDialogOpen(false);
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTag} disabled={!newTag.trim()}>
              Add Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}