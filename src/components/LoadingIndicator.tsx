
import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  type?: "dots" | "spinner" | "bar";
  className?: string;
}

export function LoadingIndicator({ type = "dots", className }: LoadingIndicatorProps) {
  if (type === "spinner") {
    return (
      <div className={cn("animate-spin", className)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }
  
  if (type === "bar") {
    return (
      <div className={cn("h-1 w-full bg-secondary overflow-hidden rounded-full", className)}>
        <div className="h-full bg-primary animate-shimmer relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent"></div>
      </div>
    );
  }
  
  // Default: dots
  return (
    <div className={cn("loading-dots inline-flex", className)}>
      <span style={{ "--dot-index": 0 } as React.CSSProperties} 
            className="animate-blink"></span>
      <span style={{ "--dot-index": 1 } as React.CSSProperties} 
            className="animate-blink"></span>
      <span style={{ "--dot-index": 2 } as React.CSSProperties} 
            className="animate-blink"></span>
    </div>
  );
}
