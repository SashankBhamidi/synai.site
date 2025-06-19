
import React from "react";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 sm:gap-4 items-start message-enter">
      <div className="flex-shrink-0 mt-1">
        <div className="chat-avatar chat-avatar-ai">
          <Bot size={16} />
        </div>
      </div>
      <div className="chat-bubble chat-bubble-ai max-w-[75%]">
        <div className="font-medium text-sm mb-2 flex items-center gap-2">
          <span>Synthesis AI</span>
        </div>
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <span className="ml-2 text-xs">thinking...</span>
        </div>
      </div>
    </div>
  );
}
