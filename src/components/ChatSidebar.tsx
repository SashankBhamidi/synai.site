import React, { useState, useEffect, useRef } from "react";
import { 
  Sidebar, 
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { 
  MessagesSquare, 
  Plus, 
  Settings, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  MoreHorizontal,
  Edit2,
  Calendar,
  Folder,
  Star,
  Pin
} from "lucide-react";
import { toast } from "sonner";
import { Conversation, ConversationFolder } from "@/types";
import { 
  getConversations,
  getCurrentConversation,
  setCurrentConversation,
  createConversation,
  deleteConversation,
  deleteAllConversations,
  renameConversation,
  exportConversations,
  importConversations,
  searchConversations,
  getConversationStats,
  toggleConversationFavorite,
  toggleConversationPinned,
  addConversationTag,
  removeConversationTag,
  moveConversationToFolder,
  getConversationsByFolder,
  getFavoriteConversations,
  getAllTags,
  CONVERSATION_EVENTS
} from "@/utils/conversationStorage";
import { 
  getFolders,
  createFolder,
  FOLDER_EVENTS
} from "@/utils/folderStorage";
import { ConversationFilters, FilterState } from "./ConversationFilters";
import { EnhancedConversationItem } from "./EnhancedConversationItem";
import { AdvancedSearch } from "./AdvancedSearch";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

function ConversationItem({ conversation, isActive, onSelect, onRename, onDelete }: ConversationItemProps) {
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
      <div className={`group flex items-center gap-2 w-full p-2 rounded-md hover:bg-accent transition-colors ${
        isActive ? 'bg-accent' : ''
      }`}>
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
              <div className="text-sm font-medium truncate">
                {conversation.title}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(conversation.updatedAt)}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                <Edit2 size={14} className="mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(conversation.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </SidebarMenuItem>
  );
}

export function ChatSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    showFavorites: false,
    showPinned: false,
    selectedFolder: undefined,
    selectedTags: [],
    sortBy: 'date'
  });
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0 });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'replace' | 'rename'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations, folders and current conversation
  useEffect(() => {
    const loadData = () => {
      const allConversations = getConversations();
      const allFolders = getFolders();
      const currentId = getCurrentConversation();
      
      console.log('Loading data:', { 
        conversations: allConversations.length, 
        folders: allFolders.length,
        currentId 
      });
      
      setConversations(allConversations);
      setFolders(allFolders);
      setCurrentConversationId(currentId);
      
      // Update stats
      const newStats = getConversationStats();
      setStats(newStats);
    };

    loadData();

    // Listen for conversation events
    const handleConversationEvent = () => {
      loadData();
    };

    // Listen for folder events
    const handleFolderEvent = () => {
      loadData();
    };

    window.addEventListener(CONVERSATION_EVENTS.CREATED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.UPDATED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.DELETED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.SWITCHED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.CLEARED, handleConversationEvent);
    
    window.addEventListener(FOLDER_EVENTS.CREATED, handleFolderEvent);
    window.addEventListener(FOLDER_EVENTS.UPDATED, handleFolderEvent);
    window.addEventListener(FOLDER_EVENTS.DELETED, handleFolderEvent);

    return () => {
      window.removeEventListener(CONVERSATION_EVENTS.CREATED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.UPDATED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.DELETED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.SWITCHED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.CLEARED, handleConversationEvent);
      
      window.removeEventListener(FOLDER_EVENTS.CREATED, handleFolderEvent);
      window.removeEventListener(FOLDER_EVENTS.UPDATED, handleFolderEvent);
      window.removeEventListener(FOLDER_EVENTS.DELETED, handleFolderEvent);
    };
  }, []);

  // Filter and sort conversations
  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchConversations(searchQuery);
    } else {
      filtered = [...conversations];
    }

    // Apply filters
    if (filters.showFavorites) {
      filtered = filtered.filter(conv => conv.isFavorite);
    }

    if (filters.showPinned) {
      filtered = filtered.filter(conv => conv.isPinned);
    }

    if (filters.selectedFolder !== undefined) {
      filtered = filtered.filter(conv => conv.folderId === filters.selectedFolder);
    }

    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(conv => 
        conv.tags?.some(tag => filters.selectedTags.includes(tag))
      );
    }

    // Sort conversations
    if (filters.sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (filters.sortBy === 'favorites') {
      filtered.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    } else {
      // Sort by date (default) - pinned first, then most recent first
      filtered.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    return filtered;
  }, [conversations, searchQuery, filters]);

  const handleNewChat = () => {
    const newConversation = createConversation();
    console.log('Created new conversation from sidebar:', newConversation.id);
    toast.success("New chat started");
  };

  const handleSelectConversation = (conversation: Conversation) => {
    if (conversation.id !== currentConversationId) {
      setCurrentConversation(conversation.id);
      console.log('Selected conversation from sidebar:', conversation.id);
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConversation(id, newTitle);
    toast.success("Conversation renamed");
  };

  const handleDeleteConversation = (id: string) => {
    const newCurrentId = deleteConversation(id);
    console.log('Deleted conversation:', id, 'new current:', newCurrentId);
    toast.success("Conversation deleted");
  };

  // New conversation management handlers
  const handleToggleFavorite = (id: string) => {
    toggleConversationFavorite(id);
    const conversation = conversations.find(c => c.id === id);
    toast.success(conversation?.isFavorite ? "Removed from favorites" : "Added to favorites");
  };

  const handleTogglePin = (id: string) => {
    toggleConversationPinned(id);
    const conversation = conversations.find(c => c.id === id);
    toast.success(conversation?.isPinned ? "Unpinned" : "Pinned to top");
  };

  const handleMoveToFolder = (id: string, folderId?: string) => {
    moveConversationToFolder(id, folderId);
    const folderName = folderId ? folders.find(f => f.id === folderId)?.name : 'Root';
    toast.success(`Moved to ${folderName}`);
  };

  const handleAddTag = (id: string, tag: string) => {
    addConversationTag(id, tag);
    toast.success(`Added tag: ${tag}`);
  };

  const handleRemoveTag = (id: string, tag: string) => {
    removeConversationTag(id, tag);
    toast.success(`Removed tag: ${tag}`);
  };

  const handleCreateFolder = (name: string) => {
    createFolder(name);
    toast.success(`Created folder: ${name}`);
  };

  const handleClearAll = () => {
    deleteAllConversations();
    setIsSettingsOpen(false); // Close the dropdown
    toast.success("All conversations cleared");
  };

  const handleExport = () => {
    try {
      exportConversations();
      toast.success("Conversations exported successfully");
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Failed to export conversations");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // First, check if there would be conflicts
      const fileContent = await file.text();
      const importData = JSON.parse(fileContent);
      
      if (!importData.conversations || !importData.messages) {
        throw new Error('Invalid file format');
      }
      
      const existingConversations = getConversations();
      const existingIds = new Set(existingConversations.map(c => c.id));
      const conflicts = importData.conversations.filter((conv: any) => existingIds.has(conv.id));
      
      if (conflicts.length > 0) {
        // Show conflict resolution dialog
        setPendingImportFile(file);
        setShowImportDialog(true);
      } else {
        // No conflicts, import directly
        await performImport(file, 'skip');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast.error("Failed to import conversations. Please check the file format.");
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const performImport = async (file: File, resolution: 'skip' | 'replace' | 'rename') => {
    try {
      const result = await importConversations(file, { 
        merge: true, 
        conflictResolution: resolution 
      });
      
      const messages = [];
      if (result.imported > 0) messages.push(`${result.imported} imported`);
      if (result.skipped > 0) messages.push(`${result.skipped} skipped`);
      if (result.replaced > 0) messages.push(`${result.replaced} replaced`);
      if (result.renamed > 0) messages.push(`${result.renamed} renamed`);
      
      toast.success(`Import completed: ${messages.join(', ')}`);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error("Failed to import conversations. Please check the file format.");
    }
  };
  
  const handleImportConfirm = async () => {
    if (pendingImportFile) {
      await performImport(pendingImportFile, conflictResolution);
      setPendingImportFile(null);
      setShowImportDialog(false);
    }
  };

  return (
    <Sidebar className="w-64 max-w-64 min-w-64">
      <SidebarRail />
      
      <SidebarHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <MessagesSquare size={20} className="text-primary flex-shrink-0" />
            <h1 className="text-base font-semibold truncate">Synthesis AI</h1>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-full flex-shrink-0"
            onClick={handleNewChat}
            title="New chat"
          >
            <Plus size={14} />
            <span className="sr-only">New chat</span>
          </Button>
        </div>
        
        {/* Search */}
        <div className="mt-2 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          
          <ConversationFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableTags={getAllTags()}
            availableFolders={folders}
          />
          
          <AdvancedSearch 
            onSelectConversation={(conversation) => {
              setCurrentConversation(conversation.id);
              console.log('Selected conversation from advanced search:', conversation.id);
            }}
          />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 mb-2">
            <SidebarGroupLabel className="flex items-center gap-2">
              <span>Conversations</span>
              {conversations.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  {filteredConversations.length}
                </Badge>
              )}
            </SidebarGroupLabel>
            
            <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilters({...filters, sortBy: 'date'})}>
                  <Calendar size={14} className="mr-2" />
                  Sort by Date
                  {filters.sortBy === 'date' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({...filters, sortBy: 'name'})}>
                  <MessagesSquare size={14} className="mr-2" />
                  Sort by Name
                  {filters.sortBy === 'name' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({...filters, sortBy: 'favorites'})}>
                  <Star size={14} className="mr-2" />
                  Sort by Favorites
                  {filters.sortBy === 'favorites' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download size={14} className="mr-2" />
                  Export All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload size={14} className="mr-2" />
                  Import
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Clear All
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Conversations</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all {conversations.length} conversations and {stats.totalMessages} messages. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAll}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <SidebarGroupContent className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                {searchQuery ? (
                  <>
                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                    No conversations found for "{searchQuery}"
                  </>
                ) : (
                  <>
                    <MessagesSquare size={32} className="mx-auto mb-2 opacity-50" />
                    No conversations yet.<br />
                    Start chatting to create your first conversation.
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map((conversation) => {
                  const folderInfo = conversation.folderId 
                    ? folders.find(f => f.id === conversation.folderId)
                    : undefined;
                  
                  return (
                    <EnhancedConversationItem
                      key={conversation.id}
                      conversation={conversation}
                      isActive={conversation.id === currentConversationId}
                      onSelect={handleSelectConversation}
                      onToggleFavorite={handleToggleFavorite}
                      onTogglePin={handleTogglePin}
                      onMoveToFolder={handleMoveToFolder}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      onRename={handleRenameConversation}
                      onDelete={handleDeleteConversation}
                      availableFolders={folders}
                      availableTags={getAllTags()}
                      folderInfo={folderInfo}
                    />
                  );
                })}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-2 border-t">
        {stats.totalConversations > 0 && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Conversations:</span>
              <span>{stats.totalConversations}</span>
            </div>
            <div className="flex justify-between">
              <span>Messages:</span>
              <span>{stats.totalMessages}</span>
            </div>
          </div>
        )}
      </SidebarFooter>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      
      {/* Import Conflict Resolution Dialog */}
      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Conflicts Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Some conversations in the import file already exist. How would you like to handle conflicts?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 my-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="skip"
                name="conflictResolution"
                value="skip"
                checked={conflictResolution === 'skip'}
                onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'replace' | 'rename')}
                className="w-4 h-4"
              />
              <label htmlFor="skip" className="text-sm cursor-pointer">
                <strong>Skip duplicates</strong> - Keep existing conversations, ignore duplicates
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="replace"
                name="conflictResolution"
                value="replace"
                checked={conflictResolution === 'replace'}
                onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'replace' | 'rename')}
                className="w-4 h-4"
              />
              <label htmlFor="replace" className="text-sm cursor-pointer">
                <strong>Replace existing</strong> - Overwrite existing conversations with imported ones
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="rename"
                name="conflictResolution"
                value="rename"
                checked={conflictResolution === 'rename'}
                onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'replace' | 'rename')}
                className="w-4 h-4"
              />
              <label htmlFor="rename" className="text-sm cursor-pointer">
                <strong>Import as copies</strong> - Create new conversations with modified names
              </label>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowImportDialog(false);
              setPendingImportFile(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleImportConfirm}>
              Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}