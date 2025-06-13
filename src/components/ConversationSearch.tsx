
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Conversation } from "@/types";

interface ConversationSearchProps {
  conversations: Conversation[];
  onFilter: (filtered: Conversation[]) => void;
}

export function ConversationSearch({ conversations, onFilter }: ConversationSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!searchTerm.trim()) {
      onFilter(conversations);
      return;
    }

    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    onFilter(filtered);
  }, [searchTerm, conversations, onFilter]);

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative mb-2">
      <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search conversations..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-9 pr-8 h-8 text-sm"
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <X size={12} />
        </Button>
      )}
    </div>
  );
}
