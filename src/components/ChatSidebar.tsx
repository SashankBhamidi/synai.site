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
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { Conversation } from "@/types";
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
  CONVERSATION_EVENTS
} from "@/utils/conversationStorage";

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
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations and current conversation
  useEffect(() => {
    const loadConversations = () => {
      const allConversations = getConversations();
      const currentId = getCurrentConversation();
      
      console.log('Loading conversations:', { count: allConversations.length, currentId });
      
      setConversations(allConversations);
      setCurrentConversationId(currentId);
      
      // Update stats
      const newStats = getConversationStats();
      setStats(newStats);
    };

    loadConversations();

    // Listen for conversation events
    const handleConversationEvent = () => {
      loadConversations();
    };

    window.addEventListener(CONVERSATION_EVENTS.CREATED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.UPDATED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.DELETED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.SWITCHED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.CLEARED, handleConversationEvent);

    return () => {
      window.removeEventListener(CONVERSATION_EVENTS.CREATED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.UPDATED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.DELETED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.SWITCHED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.CLEARED, handleConversationEvent);
    };
  }, []);

  // Filter and sort conversations
  const filteredConversations = React.useMemo(() => {
    let filtered = conversations;
    
    if (searchQuery.trim()) {
      filtered = searchConversations(searchQuery);
    }
    
    // Sort conversations
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    
    return filtered;
  }, [conversations, searchQuery, sortBy]);

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

  const handleClearAll = () => {
    deleteAllConversations();
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
      const result = await importConversations(file, { merge: true });
      toast.success(`Import completed: ${result.imported} imported, ${result.skipped} skipped`);
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
        <div className="mt-2 relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  <Calendar size={14} className="mr-2" />
                  Sort by Date
                  {sortBy === 'date' && <span className="ml-auto">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  <MessagesSquare size={14} className="mr-2" />
                  Sort by Name
                  {sortBy === 'name' && <span className="ml-auto">✓</span>}
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
                {filteredConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isActive={conversation.id === currentConversationId}
                    onSelect={handleSelectConversation}
                    onRename={handleRenameConversation}
                    onDelete={handleDeleteConversation}
                  />
                ))}
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
    </Sidebar>
  );
}