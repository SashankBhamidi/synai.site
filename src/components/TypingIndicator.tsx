
import React from "react";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
          <Bot size={16} />
        </div>
      </div>
      <div className="flex-1 bg-secondary/50 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
        <div className="font-medium text-sm mb-1">Synthesis AI</div>
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-xs text-muted-foreground ml-2">typing...</span>
        </div>
      </div>
    </div>
  );
}
