import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CitationLinkProps {
  href: string;
  children: React.ReactNode;
  citationNumber?: number;
}

export function CitationLink({ href, children, citationNumber }: CitationLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
          onClick={handleClick}
        >
          {children}
          <ExternalLink size={12} className="inline" />
          {citationNumber && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded-full ml-1">
              {citationNumber}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-all">{href}</p>
      </TooltipContent>
    </Tooltip>
  );
}