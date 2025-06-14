import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  History, 
  Star, 
  Clock, 
  Search,
  MessageSquare,
  Calendar,
  Tag,
  Folder
} from "lucide-react";
import { Conversation } from "@/types";
import { 
  getConversations, 
  getFavoriteConversations,
  setCurrentConversation,
  CONVERSATION_EVENTS
} from "@/utils/conversationStorage";
import { getFolders } from "@/utils/folderStorage";

interface ConversationHistoryProps {
  onSelectConversation?: (conversation: Conversation) => void;
}

export function ConversationHistory({ onSelectConversation }: ConversationHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [favorites, setFavorites] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleConversationEvent = () => {
      if (isOpen) {
        loadData();
      }
    };

    window.addEventListener(CONVERSATION_EVENTS.CREATED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.UPDATED, handleConversationEvent);
    window.addEventListener(CONVERSATION_EVENTS.DELETED, handleConversationEvent);

    return () => {
      window.removeEventListener(CONVERSATION_EVENTS.CREATED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.UPDATED, handleConversationEvent);
      window.removeEventListener(CONVERSATION_EVENTS.DELETED, handleConversationEvent);
    };
  }, [isOpen]);

  const loadData = () => {
    const allConversations = getConversations();
    const favoriteConversations = getFavoriteConversations();
    const allFolders = getFolders();
    
    setConversations(allConversations);
    setFavorites(favoriteConversations);
    setFolders(allFolders);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation.id);
    onSelectConversation?.(conversation);
    setIsOpen(false);
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentConversations = filteredConversations.slice(0, 10);
  const todayConversations = conversations.filter(conv => {
    const today = new Date();
    const convDate = new Date(conv.updatedAt);
    return convDate.toDateString() === today.toDateString();
  });

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

  const ConversationItem = ({ conversation }: { conversation: Conversation }) => {
    const folderInfo = conversation.folderId 
      ? folders.find(f => f.id === conversation.folderId)
      : null;

    return (
      <div
        className="p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => handleSelectConversation(conversation)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
            {conversation.isFavorite && (
              <Star size={12} className="text-yellow-500 fill-current flex-shrink-0" />
            )}
            {conversation.isPinned && (
              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDate(conversation.updatedAt)}
          </span>
        </div>
        
        {folderInfo && (
          <div className="flex items-center gap-1 mb-2">
            <Folder size={10} />
            <div 
              className="w-2 h-2 rounded"
              style={{ backgroundColor: folderInfo.color || '#64748b' }}
            />
            <span className="text-xs text-muted-foreground">{folderInfo.name}</span>
          </div>
        )}
        
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {conversation.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs h-4 px-1">
                {tag}
              </Badge>
            ))}
            {conversation.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                +{conversation.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History size={16} className="mr-2" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Conversation History</DialogTitle>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="recent" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <TabsContent value="recent" className="overflow-y-auto max-h-[50vh] space-y-3">
            {recentConversations.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Clock size={14} />
                  <span>Last 10 conversations</span>
                </div>
                {recentConversations.map(conversation => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>No recent conversations found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="today" className="overflow-y-auto max-h-[50vh] space-y-3">
            {todayConversations.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar size={14} />
                  <span>{todayConversations.length} conversations today</span>
                </div>
                {todayConversations.map(conversation => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>No conversations today</p>
                <p className="text-sm">Start a new conversation to get going!</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="favorites" className="overflow-y-auto max-h-[50vh] space-y-3">
            {favorites.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Star size={14} />
                  <span>{favorites.length} favorite conversations</span>
                </div>
                {favorites.map(conversation => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Star size={32} className="mx-auto mb-2 opacity-50" />
                <p>No favorite conversations yet</p>
                <p className="text-sm">Mark conversations as favorites to see them here</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="all" className="overflow-y-auto max-h-[50vh] space-y-3">
            {filteredConversations.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MessageSquare size={14} />
                  <span>
                    {searchQuery 
                      ? `${filteredConversations.length} conversations matching "${searchQuery}"`
                      : `${conversations.length} total conversations`
                    }
                  </span>
                </div>
                {filteredConversations.map(conversation => (
                  <ConversationItem key={conversation.id} conversation={conversation} />
                ))}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Search size={32} className="mx-auto mb-2 opacity-50" />
                <p>No conversations found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}