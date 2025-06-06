
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function WelcomeTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Check if this is first visit
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    
    if (!hasSeenWelcome) {
      setIsVisible(true);
      // Mark as seen for future visits
      localStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 max-w-sm bg-background/80 backdrop-blur-sm border border-border/50 p-4 rounded-lg shadow-lg z-50 animate-in fade-in duration-500">
      <button 
        onClick={() => setIsVisible(false)} 
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
      >
        <X size={16} />
        <span className="sr-only">Close</span>
      </button>
      
      <div className="space-y-3">
        <h3 className="font-medium">Welcome to Synthesis AI!</h3>
        <p className="text-sm text-muted-foreground">
          To get started:
        </p>
        <ol className="text-sm space-y-2 list-decimal pl-5">
          <li>Add your API key in Settings</li>
          <li>Select an AI provider and model</li>
          <li>Type your message and start chatting</li>
        </ol>
        <button 
          onClick={() => setIsVisible(false)}
          className="w-full mt-2 text-sm bg-primary/10 text-primary hover:bg-primary/20 py-1.5 px-3 rounded-md transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
