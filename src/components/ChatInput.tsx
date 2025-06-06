
import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Mic } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({ onSendMessage, isLoading, value, onChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use controlled or uncontrolled input based on whether value/onChange are provided
  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : input;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInput(newValue);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentValue.trim() || isLoading) return;
    
    onSendMessage(currentValue);
    
    if (!isControlled) {
      setInput("");
    }

    // Refocus the textarea after a short delay to ensure the form submission is complete
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Focus the textarea when the component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Refocus when controlled value is cleared (indicating a message was sent)
  useEffect(() => {
    if (isControlled && value === "" && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [value, isControlled]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-2 flex items-end">
        <Textarea
          ref={textareaRef}
          value={currentValue}
          onChange={handleInputChange}
          placeholder="Message Synthesis AI..."
          className="resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[50px] max-h-[200px] overflow-y-auto"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (currentValue.trim()) {
                handleSubmit(e);
              }
            }
          }}
        />
        <div className="flex gap-2 ml-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full h-9 w-9"
          >
            <Mic size={18} className="text-muted-foreground" />
            <span className="sr-only">Voice input</span>
          </Button>
          <Button 
            type="submit"
            size="icon" 
            className="rounded-full h-9 w-9"
            disabled={!currentValue.trim() || isLoading}
          >
            <SendIcon size={18} />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
