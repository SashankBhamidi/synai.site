
import React, { useState, useEffect } from "react";
import { 
  Sidebar, 
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail
} from "@/components/ui/sidebar";
import { MessagesSquare, Plus, Settings, Trash2, Download, Upload, Trash, Archive, Star } from "lucide-react";
import { Button } from "./ui/button";
import { ConversationItem } from "./ConversationItem";
import { ConversationSearch } from "./ConversationSearch";
import { SettingsDialog } from "./SettingsDialog";
import { Conversation } from "@/types";
import { 
  getConversations, 
  createNewConversation, 
  deleteConversation,
  deleteAllConversations,
  exportConversations,
  importConversations,
  getCurrentConversation,
  setCurrentConversation,
  renameConversation
} from "@/utils/conversationStorage";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [showFavorites, setShowFavorites] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load conversations from storage
  useEffect(() => {
    const loadConversations = () => {
      const storedConversations = getConversations();
      const currentId = getCurrentConversation();
      
      // Mark the current conversation as active and sort
      const updatedConversations = storedConversations.map(conv => ({
        ...conv,
        active: conv.id === currentId
      }));

      // Sort conversations
      if (sortBy === 'name') {
        updatedConversations.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        updatedConversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      
      setConversations(updatedConversations);
      setCurrentConversationId(currentId);
    };
    
    loadConversations();
    
    // Set up event listener to detect changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('synthesis-ai-conversations') || e.key?.includes('synthesis-ai-current-conversation')) {
        loadConversations();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for conversation updates
    const handleConversationUpdate = () => {
      loadConversations();
    };
    
    window.addEventListener('conversation-updated', handleConversationUpdate);
    
    // Periodic refresh to ensure sync
    const intervalId = setInterval(loadConversations, 5000); // Refresh every 5 seconds
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversation-updated', handleConversationUpdate);
      clearInterval(intervalId);
    };
  }, [sortBy]);
  
  const handleNewChat = () => {
    const newChat = createNewConversation();
    
    // Update the UI state
    setConversations(prev => [
      ...prev.map(conv => ({ ...conv, active: false })),
      { ...newChat, active: true }
    ]);
    
    setCurrentConversationId(newChat.id);
    
    // Use a custom event instead of refreshing the page
    window.dispatchEvent(new CustomEvent('conversation-changed', { detail: newChat.id }));
  };
  
  const handleSelectConversation = (conversation: Conversation) => {
    // Update all conversations to mark this one as active
    setConversations(prev => 
      prev.map(conv => ({
        ...conv,
        active: conv.id === conversation.id
      }))
    );
    
    // Set as current conversation
    setCurrentConversation(conversation.id);
    setCurrentConversationId(conversation.id);
    
    // Use a custom event instead of refreshing the page
    window.dispatchEvent(new CustomEvent('conversation-changed', { detail: conversation.id }));
  };
  
  const handleRenameConversation = (id: string, newTitle: string) => {
    renameConversation(id, newTitle);
    
    // Update local state
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id ? { ...conv, title: newTitle } : conv
      )
    );
    
    toast.success("Conversation renamed");
  };
  
  const handleDeleteConversation = (id: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    deleteConversation(id);
    
    // Update UI
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // If we deleted the current conversation, create a new one
    if (currentConversationId === id) {
      const newChat = createNewConversation();
      setCurrentConversationId(newChat.id);
      
      // Use a custom event instead of refreshing the page
      window.dispatchEvent(new CustomEvent('conversation-changed', { detail: newChat.id }));
    }
    
    toast.success("Conversation deleted");
  };
  
  const handleClearAll = () => {
    deleteAllConversations();
    const newChat = createNewConversation();
    
    // Update UI
    setConversations([{ ...newChat, active: true }]);
    setCurrentConversationId(newChat.id);
    
    toast.success("All conversations cleared");
    
    // Use a custom event instead of refreshing the page
    window.dispatchEvent(new CustomEvent('conversation-changed', { detail: newChat.id }));
  };
  
  const handleExport = () => {
    exportConversations();
    toast.success("Conversations exported successfully");
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await importConversations(file);
      toast.success("Conversations imported successfully");
      
      // Reload to reflect changes without refreshing the page
      const storedConversations = getConversations();
      const currentId = getCurrentConversation();
      
      // Mark the current conversation as active
      const updatedConversations = storedConversations.map(conv => ({
        ...conv,
        active: conv.id === currentId
      }));
      
      setConversations(updatedConversations);
      setCurrentConversationId(currentId);
      
      // Use a custom event instead of refreshing the page
      window.dispatchEvent(new CustomEvent('conversation-changed', { detail: currentId }));
    } catch (error) {
      toast.error("Failed to import conversations");
      console.error("Import error:", error);
    }
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const displayedConversations = filteredConversations.length > 0 ? filteredConversations : conversations;

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
          >
            <Plus size={14} />
            <span className="sr-only">New chat</span>
          </Button>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <div className="flex items-center justify-between px-2">
            <SidebarGroupLabel>Conversations</SidebarGroupLabel>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings size={12} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  Sort by Date {sortBy === 'date' && '✓'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Sort by Name {sortBy === 'name' && '✓'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="px-2">
            <ConversationSearch 
              conversations={conversations}
              onFilter={setFilteredConversations}
            />
          </div>
          <SidebarGroupContent className="overflow-hidden">
            <SidebarMenu className="overflow-hidden">
              {displayedConversations.length > 0 ? (
                displayedConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id} className="group overflow-hidden">
                    <div className="flex w-full items-center min-w-0 max-w-full overflow-hidden">
                      <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                        <ConversationItem 
                          conversation={conversation}
                          isActive={conversation.active || false}
                          onClick={() => handleSelectConversation(conversation)}
                          onRename={handleRenameConversation}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </SidebarMenuItem>
                ))
              ) : conversations.length > 0 ? (
                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                  No conversations found
                </div>
              ) : (
                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="space-y-2 p-2">
          <div className="flex items-center justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost" 
                  size="sm"
                  className="text-xs flex items-center gap-1 text-muted-foreground"
                >
                  <Trash size={14} />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will permanently delete all your conversations and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>Delete All</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <SettingsDialog />
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs flex items-center gap-1 text-muted-foreground"
              onClick={handleExport}
            >
              <Download size={14} />
              Export
            </Button>
            <Button
              variant="ghost" 
              size="sm"
              className="text-xs flex items-center gap-1 text-muted-foreground"
              onClick={handleImportClick}
            >
              <Upload size={14} />
              Import
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
            </Button>
          </div>
          <div className="mt-4 text-xs text-center text-muted-foreground opacity-70">
            Powered by <a href="https://cygenhost.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Cygen Host</a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
