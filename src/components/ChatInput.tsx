
import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { QuickActionsDropdown } from "./QuickActions";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export function ChatInput({ onSendMessage, isLoading, value, onChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use controlled or uncontrolled input based on whether value/onChange are provided
  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : input;
  
  // Voice recording functionality using Web Speech API
  const startRecording = () => {
    try {
      // Check if Web Speech API is supported
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        toast.error("Speech recognition not supported in this browser");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsRecording(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullTranscript = finalTranscript || interimTranscript;
        if (fullTranscript) {
          if (isControlled && onChange) {
            onChange(fullTranscript);
          } else {
            setInput(fullTranscript);
          }
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        if (event.error !== 'aborted') {
          toast.error("Speech recognition failed. Please try again.");
        }
      };
      
      recognition.onend = () => {
        setIsRecording(false);
        setMediaRecorder(null);
      };
      
      recognition.start();
      setMediaRecorder(recognition as unknown as MediaRecorder);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error("Could not start speech recognition");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      if (typeof mediaRecorder.stop === 'function') {
        mediaRecorder.stop();
      } else if (typeof mediaRecorder.abort === 'function') {
        mediaRecorder.abort();
      }
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInput(newValue);
    }
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
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
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl p-3 flex items-end gap-3 shadow-sm hover:shadow-md transition-shadow">
        <Textarea
          ref={textareaRef}
          value={currentValue}
          onChange={handleInputChange}
          placeholder={isRecording ? "🎤 Recording... Click stop when finished" : "Message Synthesis AI..."}
          className="resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[50px] max-h-[200px] overflow-y-auto transition-all duration-200 placeholder:text-muted-foreground/70"
          disabled={isLoading || isRecording}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (currentValue.trim() && !isRecording) {
                handleSubmit(e);
              }
            }
          }}
        />
        <div className="flex gap-2 flex-shrink-0">
          <QuickActionsDropdown 
            onSelectAction={(prompt) => {
              if (isControlled && onChange) {
                onChange(prompt + " ");
              } else {
                setInput(prompt + " ");
              }
              // Focus the textarea after selecting an action
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  // Move cursor to end
                  const len = textareaRef.current.value.length;
                  textareaRef.current.setSelectionRange(len, len);
                }
              }, 100);
            }}
          />
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "ghost"}
            className={`rounded-full h-10 w-10 sm:h-10 sm:w-10 transition-all duration-200 ${
              isRecording ? 'animate-pulse shadow-lg' : 'hover:bg-accent'
            } touch-manipulation`}
            onClick={toggleRecording}
            disabled={isLoading}
            title={isRecording ? "Stop recording" : "Start voice input"}
          >
            {isRecording ? (
              <Square size={18} className="text-white" />
            ) : (
              <Mic size={18} className="text-muted-foreground hover:text-foreground" />
            )}
            <span className="sr-only">{isRecording ? "Stop recording" : "Voice input"}</span>
          </Button>
          <Button 
            type="submit"
            size="icon" 
            className={`rounded-full h-10 w-10 sm:h-10 sm:w-10 transition-all duration-200 touch-manipulation ${
              currentValue.trim() && !isLoading && !isRecording 
                ? 'bg-primary hover:bg-primary/90 shadow-lg scale-105' 
                : ''
            }`}
            disabled={!currentValue.trim() || isLoading || isRecording}
          >
            <SendIcon size={18} />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
