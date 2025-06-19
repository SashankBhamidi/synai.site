import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, Lightbulb, Clock } from "lucide-react";

interface Suggestion {
  id: string;
  text: string;
  category: string;
  frequency: number;
  lastUsed: Date;
}

interface SmartAutoCompleteProps {
  inputValue: string;
  onSuggestionSelect: (suggestion: string) => void;
  onHide?: () => void;
  className?: string;
}

const COMMON_COMPLETIONS = [
  { text: "Explain how", category: "Education" },
  { text: "What is the difference between", category: "Education" },
  { text: "Can you help me with", category: "Assistance" },
  { text: "Write a function that", category: "Programming" },
  { text: "Review this code:", category: "Programming" },
  { text: "Summarize the main points of", category: "Analysis" },
  { text: "Create a step-by-step guide for", category: "Instructions" },
  { text: "What are the pros and cons of", category: "Analysis" },
  { text: "How do I fix", category: "Problem Solving" },
  { text: "Generate ideas for", category: "Creative" },
  { text: "Translate this into", category: "Language" },
  { text: "Optimize this", category: "Improvement" },
  { text: "Debug this error:", category: "Programming" },
  { text: "Explain like I'm 5:", category: "Education" },
  { text: "Write an email about", category: "Communication" },
  { text: "Create a list of", category: "Organization" },
  { text: "Compare and contrast", category: "Analysis" },
  { text: "Help me brainstorm", category: "Creative" },
  { text: "What would happen if", category: "Hypothetical" },
  { text: "Design a", category: "Creative" }
];

export function SmartAutoComplete({ 
  inputValue, 
  onSuggestionSelect, 
  onHide, 
  className 
}: SmartAutoCompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customSuggestions, setCustomSuggestions] = useState<Suggestion[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load custom suggestions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smart-autocomplete-suggestions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((s: any) => ({
          ...s,
          lastUsed: new Date(s.lastUsed)
        }));
        setCustomSuggestions(parsed);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    }
  }, []);

  // Save custom suggestions to localStorage
  const saveCustomSuggestions = (updated: Suggestion[]) => {
    setCustomSuggestions(updated);
    localStorage.setItem('smart-autocomplete-suggestions', JSON.stringify(updated));
  };

  // Generate suggestions based on input
  useEffect(() => {
    if (!inputValue.trim() || inputValue.length < 2) {
      setSuggestions([]);
      return;
    }

    const input = inputValue.toLowerCase().trim();
    const words = input.split(' ');
    const lastWord = words[words.length - 1];
    
    // Combine common completions with custom suggestions
    const allSuggestions = [
      ...COMMON_COMPLETIONS.map(c => ({
        id: c.text,
        text: c.text,
        category: c.category,
        frequency: 1,
        lastUsed: new Date(0)
      })),
      ...customSuggestions
    ];

    // Filter and score suggestions
    const scored = allSuggestions
      .filter(suggestion => {
        const suggestionLower = suggestion.text.toLowerCase();
        
        // Exact start match
        if (suggestionLower.startsWith(input)) return true;
        
        // Word boundary match
        if (suggestionLower.includes(` ${input}`)) return true;
        
        // Last word match for continuing
        if (lastWord.length > 1 && suggestionLower.includes(lastWord)) return true;
        
        return false;
      })
      .map(suggestion => {
        const suggestionLower = suggestion.text.toLowerCase();
        let score = 0;
        
        // Scoring factors
        if (suggestionLower.startsWith(input)) score += 100;
        if (suggestionLower === input) score += 50;
        score += suggestion.frequency * 10;
        
        // Recency bonus
        const daysSinceUsed = (Date.now() - suggestion.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceUsed < 7) score += 20;
        if (daysSinceUsed < 1) score += 30;
        
        return { ...suggestion, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    setSuggestions(scored);
    setSelectedIndex(0);
  }, [inputValue, customSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Tab':
        case 'Enter':
          if (e.key === 'Tab' || (e.key === 'Enter' && e.ctrlKey)) {
            e.preventDefault();
            handleSuggestionSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          onHide?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions, selectedIndex, onHide]);

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    // Update suggestion usage
    const updated = customSuggestions.map(s => 
      s.text === suggestion.text 
        ? { ...s, frequency: s.frequency + 1, lastUsed: new Date() }
        : s
    );
    
    // Add new suggestion if it doesn't exist
    if (!customSuggestions.find(s => s.text === suggestion.text)) {
      const newSuggestion: Suggestion = {
        id: Date.now().toString(),
        text: suggestion.text,
        category: suggestion.category,
        frequency: 1,
        lastUsed: new Date()
      };
      updated.push(newSuggestion);
    }
    
    saveCustomSuggestions(updated);
    onSuggestionSelect(suggestion.text);
  };

  if (suggestions.length === 0) return null;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute z-50 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg max-w-md",
        className
      )}
    >
      <div className="p-2">
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground border-b border-border/50 mb-2">
          <Lightbulb size={12} />
          <span>Smart suggestions</span>
          <span className="ml-auto">Tab to complete</span>
        </div>
        
        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
          {suggestions.map((suggestion, index) => (
            <Button
              key={suggestion.id}
              variant="ghost"
              onClick={() => handleSuggestionSelect(suggestion)}
              className={cn(
                "w-full justify-start text-left p-2 h-auto hover:bg-accent/50 transition-colors",
                index === selectedIndex && "bg-accent/30 border border-border/50"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm truncate">{suggestion.text}</span>
                  <ChevronRight size={12} className="text-muted-foreground flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {suggestion.category}
                  </span>
                  {suggestion.frequency > 1 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={10} />
                      <span>Used {suggestion.frequency}x</span>
                    </div>
                  )}
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted/30 rounded">
          💡 Use ↑↓ to navigate, Tab/Ctrl+Enter to select, Esc to close
        </div>
      </div>
    </div>
  );
}