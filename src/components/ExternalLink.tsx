
import React from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-primary hover:underline inline-flex items-center gap-1 ${className}`}
    >
      {children}
      <ExternalLinkIcon size={14} />
    </a>
  );
}
