import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
// Using custom card components
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  MessageSquare,
  User,
  Bot,
  Tag,
  SortAsc,
  SortDesc,
  X
} from "lucide-react";
import { Conversation, Message } from "@/types";
import { 
  getConversations, 
  getConversationMessages, 
  getAllTags 
} from "@/utils/conversationStorage";

interface SearchFilters {
  query: string;
  tags: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  messageTypes: {
    user: boolean;
    assistant: boolean;
  };
  sortBy: 'relevance' | 'date' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface SearchResult {
  conversation: Conversation;
  matches: {
    title?: boolean;
    messages: Array<{
      message: Message;
      snippet: string;
      highlightedSnippet: string;
    }>;
  };
  score: number;
}

interface AdvancedSearchProps {
  onSelectConversation?: (conversation: Conversation) => void;
}

export function AdvancedSearch({ onSelectConversation }: AdvancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    tags: [],
    dateRange: {},
    messageTypes: { user: true, assistant: true },
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  const availableTags = getAllTags();
  const conversations = getConversations();

  // Perform search
  const performSearch = useMemo(() => {
    return (searchFilters: SearchFilters) => {
      if (!searchFilters.query.trim()) {
        setResults([]);
        setTotalMatches(0);
        return;
      }

      setIsSearching(true);
      
      const query = searchFilters.query.toLowerCase().trim();
      const searchResults: SearchResult[] = [];

      conversations.forEach(conversation => {
        const messages = getConversationMessages(conversation.id);
        let conversationScore = 0;
        const messageMatches: SearchResult['matches']['messages'] = [];

        // Check title match
        const titleMatch = conversation.title.toLowerCase().includes(query);
        if (titleMatch) {
          conversationScore += 10;
        }

        // Check tag matches
        const tagMatches = conversation.tags?.some(tag => 
          searchFilters.tags.length === 0 || searchFilters.tags.includes(tag)
        ) ?? true;

        if (!tagMatches) return;

        // Check date range
        if (searchFilters.dateRange.start || searchFilters.dateRange.end) {
          const convDate = conversation.updatedAt;
          if (searchFilters.dateRange.start && convDate < searchFilters.dateRange.start) return;
          if (searchFilters.dateRange.end && convDate > searchFilters.dateRange.end) return;
        }

        // Search through messages
        messages.forEach(message => {
          // Filter by message type
          if (message.role === 'user' && !searchFilters.messageTypes.user) return;
          if (message.role === 'assistant' && !searchFilters.messageTypes.assistant) return;

          const content = String(message.content).toLowerCase();
          if (content.includes(query)) {
            conversationScore += message.role === 'user' ? 5 : 3;
            
            // Create snippet
            const index = content.indexOf(query);
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + query.length + 50);
            const snippet = String(message.content).substring(start, end);
            
            // Highlight matches
            const highlightedSnippet = snippet.replace(
              new RegExp(`(${query})`, 'gi'),
              '<mark>$1</mark>'
            );

            messageMatches.push({
              message,
              snippet: snippet.trim(),
              highlightedSnippet: highlightedSnippet.trim()
            });
          }
        });

        // Add to results if there are matches
        if (conversationScore > 0 || messageMatches.length > 0) {
          searchResults.push({
            conversation,
            matches: {
              title: titleMatch,
              messages: messageMatches
            },
            score: conversationScore + messageMatches.length
          });
        }
      });

      // Sort results
      searchResults.sort((a, b) => {
        switch (searchFilters.sortBy) {
          case 'relevance':
            return searchFilters.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
          case 'date':
            const dateA = a.conversation.updatedAt.getTime();
            const dateB = b.conversation.updatedAt.getTime();
            return searchFilters.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
          case 'title':
            const titleA = a.conversation.title.toLowerCase();
            const titleB = b.conversation.title.toLowerCase();
            const comparison = titleA.localeCompare(titleB);
            return searchFilters.sortOrder === 'desc' ? -comparison : comparison;
          default:
            return 0;
        }
      });

      const totalMatches = searchResults.reduce((sum, result) => sum + result.matches.messages.length, 0);
      
      setResults(searchResults);
      setTotalMatches(totalMatches);
      setIsSearching(false);
    };
  }, [conversations]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters, performSearch]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      handleFilterChange('tags', [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    handleFilterChange('tags', filters.tags.filter(t => t !== tag));
  };

  const clearAllFilters = () => {
    setFilters({
      query: '',
      tags: [],
      dateRange: {},
      messageTypes: { user: true, assistant: true },
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search size={16} className="mr-2" />
          Advanced Search
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[80vh]">
          {/* Filters Sidebar */}
          <div className="w-80 border-r pr-4 space-y-4 overflow-y-auto">
            <div>
              <Label className="text-base font-semibold">Search Query</Label>
              <div className="relative mt-2">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter search terms..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange('query', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Filter by Tags</Label>
              <div className="mt-2 space-y-2">
                <Select onValueChange={addTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add tag filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter(tag => !filters.tags.includes(tag))
                      .map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {filters.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {filters.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTag(tag)}
                          className="h-4 w-4 p-0 ml-1"
                        >
                          <X size={8} />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Message Types</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-messages" className="text-sm flex items-center gap-2">
                    <User size={14} />
                    User messages
                  </Label>
                  <Switch
                    id="user-messages"
                    checked={filters.messageTypes.user}
                    onCheckedChange={(checked) => 
                      handleFilterChange('messageTypes', { ...filters.messageTypes, user: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="assistant-messages" className="text-sm flex items-center gap-2">
                    <Bot size={14} />
                    Assistant messages
                  </Label>
                  <Switch
                    id="assistant-messages"
                    checked={filters.messageTypes.assistant}
                    onCheckedChange={(checked) => 
                      handleFilterChange('messageTypes', { ...filters.messageTypes, assistant: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold">Sort Results</Label>
              <div className="mt-2 space-y-2">
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-1">
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', 'desc')}
                    className="flex-1"
                  >
                    <SortDesc size={14} className="mr-1" />
                    Desc
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', 'asc')}
                    className="flex-1"
                  >
                    <SortAsc size={14} className="mr-1" />
                    Asc
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={clearAllFilters}
              className="w-full"
            >
              Clear All Filters
            </Button>
          </div>

          {/* Results */}
          <div className="flex-1 pl-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                {isSearching ? "Searching..." : (
                  results.length > 0 
                    ? `${results.length} conversations, ${totalMatches} matches`
                    : filters.query ? "No results found" : "Enter a search query"
                )}
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto h-full">
              {results.map(result => (
                <div 
                  key={result.conversation.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => {
                    onSelectConversation?.(result.conversation);
                    setIsOpen(false);
                  }}
                >
                  <div className="pb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">
                        {result.matches.title ? (
                          <span 
                            dangerouslySetInnerHTML={{
                              __html: result.conversation.title.replace(
                                new RegExp(`(${filters.query})`, 'gi'),
                                '<mark>$1</mark>'
                              )
                            }}
                          />
                        ) : (
                          result.conversation.title
                        )}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {formatDate(result.conversation.updatedAt)}
                      </div>
                    </div>
                    {result.conversation.tags && result.conversation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.conversation.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="pt-0">
                    <div className="space-y-2">
                      {result.matches.messages.slice(0, 3).map((match, index) => (
                        <div key={index} className="text-sm border-l-2 border-muted pl-3">
                          <div className="flex items-center gap-2 mb-1">
                            {match.message.role === 'user' ? (
                              <User size={12} className="text-blue-500" />
                            ) : (
                              <Bot size={12} className="text-purple-500" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatDate(match.message.timestamp)}
                            </span>
                          </div>
                          <div 
                            className="text-muted-foreground"
                            dangerouslySetInnerHTML={{ 
                              __html: match.highlightedSnippet 
                            }}
                          />
                        </div>
                      ))}
                      {result.matches.messages.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{result.matches.messages.length - 3} more matches
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}