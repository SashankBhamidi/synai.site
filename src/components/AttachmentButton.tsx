import React from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileAttachment } from '@/types';

interface AttachmentButtonProps {
  onClick: () => void;
  disabled?: boolean;
  attachments: FileAttachment[];
  isDragOver?: boolean;
}

export function AttachmentButton({ 
  onClick, 
  disabled = false, 
  attachments, 
  isDragOver = false 
}: AttachmentButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full h-10 w-10 transition-all duration-200 hover:bg-accent hover:scale-105",
        isDragOver && "bg-primary/20 border-primary scale-110",
        attachments.length > 0 && "text-primary bg-primary/10"
      )}
      title={attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''} attached` : "Attach files"}
    >
      <Paperclip size={18} />
      {attachments.length > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
          {attachments.length}
        </span>
      )}
    </Button>
  );
}