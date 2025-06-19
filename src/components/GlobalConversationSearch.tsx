import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Clock, MessageSquare, ChevronRight, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Message } from "@/types";
import { getConversations, getConversationMessages, setCurrentConversation } from "@/utils/conversationStorage";

interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  message: Message;
  messageIndex: number;
  snippet: string;
  relevanceScore: number;
}

export function GlobalConversationSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useMemo(() => {
    return async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      
      try {
        const conversations = getConversations();
        const searchResults: SearchResult[] = [];
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);

        for (const conversation of conversations) {
          const messages = getConversationMessages(conversation.id);
          
          messages.forEach((message, index) => {
            const content = message.content.toLowerCase();
            let relevanceScore = 0;
            let matchedTerms = 0;

            searchTerms.forEach(term => {
              if (content.includes(term)) {
                matchedTerms++;
                if (content.includes(` ${term} `) || content.startsWith(term) || content.endsWith(term)) {
                  relevanceScore += 10;
                } else {
                  relevanceScore += 5;
                }
                
                const occurrences = (content.match(new RegExp(term, 'g')) || []).length;
                relevanceScore += occurrences * 2;
              }
            });

            if (matchedTerms > 0) {
              if (matchedTerms === searchTerms.length) {
                relevanceScore += 20;
              }

              const firstMatch = searchTerms.find(term => content.includes(term));
              const matchIndex = firstMatch ? content.indexOf(firstMatch) : 0;
              const snippetStart = Math.max(0, matchIndex - 50);
              const snippetEnd = Math.min(message.content.length, matchIndex + 150);
              const snippet = (snippetStart > 0 ? '...' : '') + 
                           message.content.slice(snippetStart, snippetEnd) + 
                           (snippetEnd < message.content.length ? '...' : '');

              searchResults.push({
                conversationId: conversation.id,
                conversationTitle: conversation.title,
                messageId: message.id,
                message,
                messageIndex: index,
                snippet,
                relevanceScore
              });
            }
          });
        }

        searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        setResults(searchResults.slice(0, 50));
      } catch (error) {
        console.error('Search error:', error);
        toast.error("Search failed");
      } finally {
        setIsSearching(false);
      }
    };
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    setCurrentConversation(result.conversationId);
    setIsOpen(false);
    window.location.reload();
  };

  const highlightSearchTerms = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    });
    
    return highlightedText;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative group hover:bg-accent transition-colors">
          <Search size={18} className="group-hover:scale-110 transition-transform" />
          <span className="sr-only">Search Conversations</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Search size={20} className="text-primary" />
            </div>
            Search Conversations
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          <div className="space-y-4 p-4 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search messages, conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4"
                autoFocus
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {searchQuery && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {isSearching ? "Searching..." : `${results.length} result${results.length !== 1 ? 's' : ''} found`}
                </p>
              </div>
            )}
            
            {results.length > 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={`${result.conversationId}-${result.messageId}`}
                    className="border rounded-lg p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn(
                          "p-1.5 rounded-full",
                          result.message.role === 'user' 
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                            : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                        )}>
                          {result.message.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </div>
                        <h4 className="font-medium text-sm truncate">
                          {result.conversationTitle}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          Message {result.messageIndex + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>{new Date(result.message.timestamp).toLocaleDateString()}</span>
                        <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                    <p 
                      className="text-sm text-muted-foreground leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerms(result.snippet, searchQuery)
                      }}
                    />
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                      <Badge variant="secondary" className="text-xs">
                        {result.message.role === 'user' ? 'You' : 'AI'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Score: {result.relevanceScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground">Try different keywords</p>
              </div>
            ) : !searchQuery ? (
              <div className="text-center py-12">
                <MessageSquare size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Search your conversations</h3>
                <p className="text-muted-foreground">
                  Find messages, topics, and discussions across all your chats
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}