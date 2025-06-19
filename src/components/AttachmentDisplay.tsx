import React from 'react';
import { FileAttachment, getAttachmentType, formatFileSize } from '@/types';
import { 
  File, 
  Image as ImageIcon, 
  FileText, 
  Code, 
  FileImage,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttachmentDisplayProps {
  attachments: FileAttachment[];
  isUser?: boolean;
}

export function AttachmentDisplay({ attachments, isUser = false }: AttachmentDisplayProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  const getFileIcon = (type: string) => {
    const attachmentType = getAttachmentType(type);
    switch (attachmentType) {
      case 'image':
        return <ImageIcon size={14} className="text-blue-500" />;
      case 'code':
        return <Code size={14} className="text-green-500" />;
      case 'text':
        return <FileText size={14} className="text-gray-500" />;
      case 'pdf':
        return <FileImage size={14} className="text-red-500" />;
      default:
        return <File size={14} className="text-gray-400" />;
    }
  };

  const downloadAttachment = (attachment: FileAttachment) => {
    if (attachment.data) {
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const viewAttachment = (attachment: FileAttachment) => {
    if (attachment.data || attachment.preview) {
      const url = attachment.preview || attachment.data;
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment) => {
        const attachmentType = getAttachmentType(attachment.type);
        
        if (attachmentType === 'image' && attachment.preview) {
          // Display image preview
          return (
            <div
              key={attachment.id}
              className={cn(
                "attachment-preview max-w-sm group cursor-pointer",
                isUser ? "border-white/20" : "border-border"
              )}
              onClick={() => viewAttachment(attachment)}
            >
              <img
                src={attachment.preview}
                alt={attachment.name}
                className="w-full h-auto max-h-64 object-cover"
              />
              <div className="attachment-overlay">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewAttachment(attachment);
                    }}
                    className="h-8 px-3 bg-white/90 hover:bg-white text-gray-800"
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadAttachment(attachment);
                    }}
                    className="h-8 px-3 bg-white/90 hover:bg-white text-gray-800"
                  >
                    <Download size={14} className="mr-1" />
                    Save
                  </Button>
                </div>
              </div>
              <div className={cn(
                "absolute bottom-0 left-0 right-0 p-2 text-xs text-white bg-gradient-to-t from-black/60 to-transparent"
              )}>
                <div className="font-medium truncate">{attachment.name}</div>
                <div className="opacity-90">{formatFileSize(attachment.size)}</div>
              </div>
            </div>
          );
        } else {
          // Display file attachment
          return (
            <div
              key={attachment.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-muted/30",
                isUser ? "border-white/20 bg-white/10" : "border-border"
              )}
            >
              <div className="flex-shrink-0">
                {getFileIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm truncate",
                  isUser ? "text-white" : "text-foreground"
                )}>
                  {attachment.name}
                </div>
                <div className={cn(
                  "text-xs",
                  isUser ? "text-white/70" : "text-muted-foreground"
                )}>
                  {formatFileSize(attachment.size)}
                  {attachment.content && (
                    <span className="ml-2">
                      • {attachment.content.split(/\s+/).length} words
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                {(attachment.preview || attachment.data) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => viewAttachment(attachment)}
                    className={cn(
                      "h-8 w-8 p-0",
                      isUser ? "hover:bg-white/20 text-white/70 hover:text-white" : ""
                    )}
                    title="View file"
                  >
                    <Eye size={14} />
                  </Button>
                )}
                {attachment.data && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => downloadAttachment(attachment)}
                    className={cn(
                      "h-8 w-8 p-0",
                      isUser ? "hover:bg-white/20 text-white/70 hover:text-white" : ""
                    )}
                    title="Download file"
                  >
                    <Download size={14} />
                  </Button>
                )}
              </div>
            </div>
          );
        }
      })}
    </div>
  );
}