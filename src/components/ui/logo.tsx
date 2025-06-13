
import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-foreground", className)}
      {...props}
    >
      {/* Robot head */}
      <rect x="6" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      
      {/* Robot eyes */}
      <circle cx="9" cy="8" r="1" fill="currentColor"/>
      <circle cx="15" cy="8" r="1" fill="currentColor"/>
      
      {/* Robot mouth */}
      <rect x="10" y="10" width="4" height="1" rx="0.5" fill="currentColor"/>
      
      {/* Robot antenna */}
      <line x1="12" y1="4" x2="12" y2="2" stroke="currentColor" strokeWidth="2"/>
      <circle cx="12" cy="2" r="1" fill="currentColor"/>
      
      {/* Robot body */}
      <rect x="8" y="14" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      
      {/* Robot arms */}
      <rect x="4" y="15" width="4" height="2" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="16" y="15" width="4" height="2" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      
      {/* Robot legs */}
      <rect x="9" y="20" width="2" height="3" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="13" y="20" width="2" height="3" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );
}
