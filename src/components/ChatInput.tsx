
import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendIcon, Mic, Square } from "lucide-react";
import { toast } from "sonner";

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
  
  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        // For now, just show a message that voice input was captured
        toast.info("Voice recorded! Speech-to-text coming soon.");
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
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
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-xl p-2 flex items-end">
        <Textarea
          ref={textareaRef}
          value={currentValue}
          onChange={handleInputChange}
          placeholder={isRecording ? "Recording... Click stop when finished" : "Message Synthesis AI..."}
          className="resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-h-[50px] max-h-[200px] overflow-y-auto transition-all duration-200"
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
        <div className="flex gap-2 ml-2">
          <Button
            type="button"
            size="icon"
            variant={isRecording ? "destructive" : "ghost"}
            className={`rounded-full h-9 w-9 transition-all duration-200 ${
              isRecording ? 'animate-pulse' : ''
            }`}
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
            className="rounded-full h-9 w-9"
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
