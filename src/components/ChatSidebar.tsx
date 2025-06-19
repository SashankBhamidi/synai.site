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
  Folder
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

// ConversationItem component removed - now using EnhancedConversationItem only

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

  const handleCreateFolderClick = () => {
    // Simplified folder creation - just show a simple prompt
    const name = window.prompt('Enter folder name:');
    if (name && name.trim()) {
      createFolder(name.trim());
      toast.success(`Created folder: ${name.trim()}`);
    }
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessagesSquare size={18} className="text-primary flex-shrink-0" />
            <h1 className="text-sm font-semibold truncate">Conversations</h1>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md flex-shrink-0 hover:bg-accent"
              onClick={handleCreateFolderClick}
              title="Create folder"
            >
              <Folder size={12} />
            </Button>
            <Button
              variant="default"
              size="icon"
              className="h-6 w-6 rounded-md flex-shrink-0"
              onClick={handleNewChat}
              title="New conversation"
            >
              <Plus size={12} />
            </Button>
          </div>
        </div>
        
        {/* Local Search & Filters */}
        <div className="mt-2 space-y-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter conversations..."
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
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 mb-3">
            <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Recent Chats</span>
              {filteredConversations.length > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                  {filteredConversations.length}
                </Badge>
              )}
            </SidebarGroupLabel>
            
            <DropdownMenu open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-accent">
                  <Settings size={10} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setFilters({...filters, sortBy: 'date'})}>
                  <Calendar size={14} className="mr-2" />
                  Sort by Date
                  {filters.sortBy === 'date' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilters({...filters, sortBy: 'name'})}>
                  <MessagesSquare size={14} className="mr-2" />
                  Sort by Name
                  {filters.sortBy === 'name' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExport}>
                  <Download size={14} className="mr-2" />
                  Export Conversations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload size={14} className="mr-2" />
                  Import Conversations
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Clear All Conversations
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
              <div className="text-center text-muted-foreground text-sm py-12">
                {searchQuery ? (
                  <>
                    <Search size={24} className="mx-auto mb-3 opacity-40" />
                    <p>No matches for "{searchQuery}"</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <MessagesSquare size={24} className="mx-auto mb-3 opacity-40" />
                    <p>No conversations yet</p>
                    <p className="text-xs mt-1">Click the + button to start chatting</p>
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

      <SidebarFooter className="px-3 py-2 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          {stats.totalConversations > 0 ? (
            <span>{stats.totalConversations} conversations • {stats.totalMessages} messages</span>
          ) : (
            <span>No conversations yet</span>
          )}
        </div>
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