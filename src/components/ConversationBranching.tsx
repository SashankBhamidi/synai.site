import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  GitBranch, 
  MessageSquare,
  ArrowRight,
  Copy,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { Message } from "@/types";
import { 
  createConversation, 
  saveConversation, 
  setCurrentConversation 
} from "@/utils/conversationStorage";

interface ConversationBranchingProps {
  message: Message;
  messages: Message[];
  messageIndex: number;
  onBranchCreated?: (conversationId: string) => void;
}

export function ConversationBranching({ 
  message, 
  messages, 
  messageIndex, 
  onBranchCreated 
}: ConversationBranchingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [branchTitle, setBranchTitle] = useState("");
  const [branchPrompt, setBranchPrompt] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBranch = async () => {
    if (!branchTitle.trim()) {
      toast.error("Branch title is required");
      return;
    }

    setIsCreating(true);
    
    try {
      // Get messages up to the selected message (inclusive)
      const branchMessages = messages.slice(0, messageIndex + 1);
      
      // Create new conversation with unique title
      const conversation = createConversation(branchTitle.trim());
      
      // If there's a new prompt, add it as a user message
      let finalMessages = [...branchMessages];
      if (branchPrompt.trim()) {
        const newUserMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: "user",
          content: branchPrompt.trim(),
          timestamp: new Date()
        };
        finalMessages.push(newUserMessage);
      }
      
      // Save the conversation with the branched messages
      try {
        saveConversation(conversation, finalMessages);
        console.log('Saved branch conversation:', conversation.id, 'with', finalMessages.length, 'messages');
      } catch (saveError) {
        console.error('Failed to save branch conversation:', saveError);
        throw new Error('Failed to save branch conversation');
      }
      
      // Switch to the new conversation
      setCurrentConversation(conversation.id);
      
      // Reset form and close dialog
      setBranchTitle("");
      setBranchPrompt("");
      setIsOpen(false);
      
      toast.success(`Created branch: ${branchTitle}`);
      
      // Notify parent component and trigger reload
      onBranchCreated?.(conversation.id);
      
      // Small delay before reload to ensure state is saved
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Failed to create branch:', error);
      toast.error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickBranch = () => {
    const defaultTitle = `Branch from "${message.content.slice(0, 30)}${message.content.length > 30 ? '...' : ''}"`;
    setBranchTitle(defaultTitle);
    handleCreateBranch();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-accent/50 rounded-md transition-colors"
          title="Branch conversation from here"
        >
          <GitBranch size={13} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch size={20} />
            Branch Conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current context preview */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <MessageSquare size={14} />
              Branching from this point
            </h4>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Message {messageIndex + 1} of {messages.length}</strong>
              </p>
              <div className="bg-background/50 rounded p-3 border">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    message.role === 'user' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {message.role === 'user' ? 'You' : 'AI'}
                  </span>
                </div>
                <p className="text-foreground/80 line-clamp-3">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
          
          {/* Branch configuration */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Branch Title</Label>
              <Input
                placeholder="Enter a title for the new branch..."
                value={branchTitle}
                onChange={(e) => setBranchTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">
                New Prompt (Optional)
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Add a new message to continue the conversation in a different direction
              </p>
              <Textarea
                placeholder="Enter a new prompt to explore a different path..."
                value={branchPrompt}
                onChange={(e) => setBranchPrompt(e.target.value)}
                rows={3}
                className="custom-scrollbar"
              />
            </div>
          </div>
          
          {/* Preview */}
          {(branchTitle || branchPrompt) && (
            <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <ArrowRight size={14} />
                Branch Preview
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Title:</strong> {branchTitle || "Untitled Branch"}
                </p>
                <p>
                  <strong>Messages:</strong> {messageIndex + 1} existing message{messageIndex !== 0 ? 's' : ''}
                  {branchPrompt && " + 1 new message"}
                </p>
                {branchPrompt && (
                  <div className="bg-background/50 rounded p-2 border mt-2">
                    <p className="text-xs text-muted-foreground mb-1">New message:</p>
                    <p className="text-foreground/80">{branchPrompt}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateBranch}
              disabled={!branchTitle.trim() || isCreating}
              className="flex-1"
            >
              {isCreating ? "Creating Branch..." : "Create Branch"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const defaultTitle = `Branch from "${message.content.slice(0, 30)}${message.content.length > 30 ? '...' : ''}"`;
                setBranchTitle(defaultTitle);
              }}
              disabled={isCreating}
            >
              <Copy size={16} className="mr-2" />
              Use Default Title
            </Button>
          </div>
          
          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted/20 rounded p-3">
            <p className="font-medium mb-1">💡 How branching works:</p>
            <ul className="space-y-1 pl-4">
              <li>• Creates a new conversation starting from this message</li>
              <li>• Preserves all context up to this point</li>
              <li>• Lets you explore different directions without losing the original</li>
              <li>• You'll be switched to the new branch automatically</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}