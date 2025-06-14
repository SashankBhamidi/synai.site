import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  Pin, 
  Folder, 
  Tag, 
  Archive, 
  Filter,
  X
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export interface FilterState {
  showFavorites: boolean;
  showPinned: boolean;
  selectedFolder?: string;
  selectedTags: string[];
  sortBy: 'date' | 'name' | 'favorites';
}

interface ConversationFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableTags: string[];
  availableFolders: Array<{ id: string; name: string; color?: string }>;
}

export function ConversationFilters({ 
  filters, 
  onFiltersChange, 
  availableTags,
  availableFolders 
}: ConversationFiltersProps) {
  const activeFiltersCount = 
    (filters.showFavorites ? 1 : 0) +
    (filters.showPinned ? 1 : 0) +
    (filters.selectedFolder ? 1 : 0) +
    filters.selectedTags.length;

  const clearAllFilters = () => {
    onFiltersChange({
      showFavorites: false,
      showPinned: false,
      selectedFolder: undefined,
      selectedTags: [],
      sortBy: filters.sortBy
    });
  };

  const toggleFavorites = () => {
    onFiltersChange({
      ...filters,
      showFavorites: !filters.showFavorites
    });
  };

  const togglePinned = () => {
    onFiltersChange({
      ...filters,
      showPinned: !filters.showPinned
    });
  };

  const selectFolder = (folderId?: string) => {
    onFiltersChange({
      ...filters,
      selectedFolder: folderId
    });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    
    onFiltersChange({
      ...filters,
      selectedTags: newTags
    });
  };

  const removeTag = (tag: string) => {
    onFiltersChange({
      ...filters,
      selectedTags: filters.selectedTags.filter(t => t !== tag)
    });
  };

  return (
    <div className="space-y-2">
      {/* Quick filter buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <Button
          variant={filters.showFavorites ? "default" : "outline"}
          size="sm"
          onClick={toggleFavorites}
          className="h-7 text-xs"
        >
          <Star size={12} className="mr-1" />
          Favorites
        </Button>
        
        <Button
          variant={filters.showPinned ? "default" : "outline"}
          size="sm"
          onClick={togglePinned}
          className="h-7 text-xs"
        >
          <Pin size={12} className="mr-1" />
          Pinned
        </Button>

        {/* Folders dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={filters.selectedFolder ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
            >
              <Folder size={12} className="mr-1" />
              {filters.selectedFolder 
                ? availableFolders.find(f => f.id === filters.selectedFolder)?.name || "Folder"
                : "Folders"
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Select Folder</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => selectFolder(undefined)}>
              <Archive size={14} className="mr-2" />
              All Conversations
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {availableFolders.map(folder => (
              <DropdownMenuItem 
                key={folder.id}
                onClick={() => selectFolder(folder.id)}
              >
                <div 
                  className="w-3 h-3 rounded mr-2"
                  style={{ backgroundColor: folder.color || '#64748b' }}
                />
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags dropdown */}
        {availableTags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={filters.selectedTags.length > 0 ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
              >
                <Tag size={12} className="mr-1" />
                Tags {filters.selectedTags.length > 0 && `(${filters.selectedTags.length})`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableTags.map(tag => (
                <DropdownMenuItem 
                  key={tag}
                  onClick={() => toggleTag(tag)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{tag}</span>
                    {filters.selectedTags.includes(tag) && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Clear filters */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs text-muted-foreground"
          >
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active tag badges */}
      {filters.selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.selectedTags.map(tag => (
            <Badge 
              key={tag}
              variant="secondary"
              className="text-xs h-5 pl-2 pr-1"
            >
              {tag}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTag(tag)}
                className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
              >
                <X size={8} />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}