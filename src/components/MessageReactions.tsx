import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Heart, Star, Zap, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reaction {
  type: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  className?: string;
}

const REACTION_TYPES = [
  { type: 'thumbsup', icon: ThumbsUp, label: 'Helpful', color: 'text-green-600' },
  { type: 'thumbsdown', icon: ThumbsDown, label: 'Not helpful', color: 'text-red-600' },
  { type: 'heart', icon: Heart, label: 'Love it', color: 'text-pink-600' },
  { type: 'star', icon: Star, label: 'Excellent', color: 'text-yellow-600' },
  { type: 'zap', icon: Zap, label: 'Fast response', color: 'text-blue-600' },
  { type: 'brain', icon: Brain, label: 'Insightful', color: 'text-purple-600' }
];

export function MessageReactions({ messageId, className }: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load reactions from localStorage
  useEffect(() => {
    const savedReactions = localStorage.getItem(`reactions-${messageId}`);
    if (savedReactions) {
      try {
        setReactions(JSON.parse(savedReactions));
      } catch (error) {
        console.error('Failed to load reactions:', error);
      }
    }
  }, [messageId]);

  // Save reactions to localStorage
  const saveReactions = (updatedReactions: Reaction[]) => {
    setReactions(updatedReactions);
    localStorage.setItem(`reactions-${messageId}`, JSON.stringify(updatedReactions));
  };

  const handleReaction = (reactionType: string) => {
    const existingReaction = reactions.find(r => r.type === reactionType);
    
    if (existingReaction) {
      if (existingReaction.userReacted) {
        // Remove reaction
        const updatedReactions = reactions.map(r => 
          r.type === reactionType 
            ? { ...r, count: Math.max(0, r.count - 1), userReacted: false }
            : r
        ).filter(r => r.count > 0);
        saveReactions(updatedReactions);
      } else {
        // Add reaction
        const updatedReactions = reactions.map(r => 
          r.type === reactionType 
            ? { ...r, count: r.count + 1, userReacted: true }
            : r
        );
        saveReactions(updatedReactions);
        
        const reactionLabel = REACTION_TYPES.find(rt => rt.type === reactionType)?.label || 'reaction';
        toast.success(`Added ${reactionLabel} reaction`);
      }
    } else {
      // First reaction of this type
      const newReaction: Reaction = {
        type: reactionType,
        count: 1,
        userReacted: true
      };
      saveReactions([...reactions, newReaction]);
      
      const reactionLabel = REACTION_TYPES.find(rt => rt.type === reactionType)?.label || 'reaction';
      toast.success(`Added ${reactionLabel} reaction`);
    }
  };

  // Get reactions with counts > 0
  const activeReactions = reactions.filter(r => r.count > 0);
  const displayedReactions = showAll ? activeReactions : activeReactions.slice(0, 3);

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {/* Quick reaction buttons */}
      <div className="flex items-center gap-1">
        {REACTION_TYPES.slice(0, 2).map(({ type, icon: Icon, label, color }) => {
          const reaction = reactions.find(r => r.type === type);
          const isActive = reaction?.userReacted || false;
          const count = reaction?.count || 0;
          
          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => handleReaction(type)}
              className={cn(
                "h-7 px-2 text-xs hover:bg-accent transition-all duration-200 gap-1",
                isActive && "bg-accent/50 border border-border/30",
                isActive && color
              )}
              title={label}
            >
              <Icon size={12} className={isActive ? color : "text-muted-foreground"} />
              {count > 0 && <span className="text-xs">{count}</span>}
            </Button>
          );
        })}
      </div>

      {/* Reaction picker dropdown */}
      <div className="relative group">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
          title="Add reaction"
        >
          <span className="text-xs">😊</span>
        </Button>
        
        {/* Dropdown menu */}
        <div className="absolute bottom-full left-0 mb-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-10">
          <div className="grid grid-cols-3 gap-1 min-w-0">
            {REACTION_TYPES.map(({ type, icon: Icon, label, color }) => {
              const reaction = reactions.find(r => r.type === type);
              const isActive = reaction?.userReacted || false;
              
              return (
                <Button
                  key={type}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReaction(type)}
                  className={cn(
                    "h-8 w-8 p-0 hover:bg-accent transition-colors",
                    isActive && "bg-accent/50 border border-border/30"
                  )}
                  title={label}
                >
                  <Icon size={14} className={isActive ? color : "text-muted-foreground"} />
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active reactions display */}
      {displayedReactions.length > 0 && (
        <div className="flex items-center gap-1 ml-2 border-l border-border/20 pl-2">
          {displayedReactions.map(reaction => {
            const reactionType = REACTION_TYPES.find(rt => rt.type === reaction.type);
            if (!reactionType) return null;
            
            const { icon: Icon, color } = reactionType;
            
            return (
              <Button
                key={reaction.type}
                variant="ghost"
                size="sm"
                onClick={() => handleReaction(reaction.type)}
                className={cn(
                  "h-6 px-2 text-xs hover:bg-accent transition-colors gap-1 rounded-full",
                  reaction.userReacted && "bg-accent/50 border border-border/30"
                )}
              >
                <Icon size={10} className={reaction.userReacted ? color : "text-muted-foreground"} />
                <span className="text-xs">{reaction.count}</span>
              </Button>
            );
          })}
          
          {activeReactions.length > 3 && !showAll && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="h-6 px-2 text-xs hover:bg-accent transition-colors rounded-full"
            >
              +{activeReactions.length - 3}
            </Button>
          )}
          
          {showAll && activeReactions.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
              className="h-6 px-2 text-xs hover:bg-accent transition-colors rounded-full"
            >
              ···
            </Button>
          )}
        </div>
      )}
    </div>
  );
}