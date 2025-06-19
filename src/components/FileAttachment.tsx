import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Paperclip, 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Code, 
  FileImage 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  FileAttachment, 
  isValidAttachment, 
  getAttachmentType, 
  formatFileSize 
} from '@/types';
import { extractTextFromPDF, generatePDFPreview } from '@/utils/pdfExtractor';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

interface FileAttachmentComponentProps {
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  maxAttachments?: number;
  disabled?: boolean;
  showButton?: boolean; // New prop to control whether to show the button
}

export function FileAttachmentComponent({ 
  attachments, 
  onAttachmentsChange, 
  maxAttachments = 10,
  disabled = false,
  showButton = true
}: FileAttachmentComponentProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    const attachmentType = getAttachmentType(type);
    switch (attachmentType) {
      case 'image':
        return <Image size={16} className="text-blue-500" />;
      case 'code':
        return <Code size={16} className="text-green-500" />;
      case 'text':
        return <FileText size={16} className="text-gray-500" />;
      case 'pdf':
        return <FileImage size={16} className="text-red-500" />;
      default:
        return <File size={16} className="text-gray-400" />;
    }
  };

  const processFile = async (file: File): Promise<FileAttachment | null> => {
    const validation = isValidAttachment(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return null;
    }

    const attachment: FileAttachment = {
      id: uuidv4(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date()
    };

    try {
      if (file.type === 'application/pdf') {
        // Handle PDF files
        const [extractionResult, preview] = await Promise.all([
          extractTextFromPDF(file),
          generatePDFPreview(file)
        ]);
        
        if (extractionResult.error) {
          toast.error(`PDF processing error: ${extractionResult.error}`);
          return null;
        }
        
        attachment.content = extractionResult.text;
        if (preview) {
          attachment.preview = preview;
        }
        
        // Also store the PDF as base64 for potential future use
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = (event) => {
            attachment.data = event.target?.result as string;
            resolve(attachment);
          };
          reader.onerror = () => {
            toast.error(`Failed to read PDF file: ${file.name}`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      } else {
        // Handle other file types
        return new Promise((resolve) => {
          const reader = new FileReader();

          reader.onload = (event) => {
            const result = event.target?.result as string;
            
            if (file.type.startsWith('image/')) {
              attachment.data = result; // Base64 for images
              attachment.preview = result; // Use same for preview
            } else if (file.type.startsWith('text/') || getAttachmentType(file.type) === 'code') {
              // For text files, store the text content
              attachment.content = result;
            } else {
              // For other files, store as base64
              attachment.data = result;
            }
            
            resolve(attachment);
          };

          reader.onerror = () => {
            toast.error(`Failed to read file: ${file.name}`);
            resolve(null);
          };

          // Read as appropriate format
          if (file.type.startsWith('text/') || getAttachmentType(file.type) === 'code') {
            reader.readAsText(file);
          } else {
            reader.readAsDataURL(file);
          }
        });
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Failed to process file: ${file.name}`);
      return null;
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;
    
    const fileArray = Array.from(files);
    
    if (attachments.length + fileArray.length > maxAttachments) {
      toast.error(`Maximum ${maxAttachments} attachments allowed`);
      return;
    }

    setIsProcessing(true);
    
    try {
      const newAttachments: FileAttachment[] = [];
      
      for (const file of fileArray) {
        const attachment = await processFile(file);
        if (attachment) {
          newAttachments.push(attachment);
        }
      }
      
      if (newAttachments.length > 0) {
        onAttachmentsChange([...attachments, ...newAttachments]);
        toast.success(`Added ${newAttachments.length} file${newAttachments.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    } finally {
      setIsProcessing(false);
    }
  }, [attachments, onAttachmentsChange, maxAttachments, disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input
    e.target.value = '';
  }, [handleFiles]);

  const removeAttachment = useCallback((attachmentId: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== attachmentId));
  }, [attachments, onAttachmentsChange]);

  return (
    <div className="space-y-2">
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.html,.css,.pdf,.doc,.docx"
      />
      
      {/* Attachment Button - only show if showButton is true */}
      {showButton && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleFileSelect}
          disabled={disabled || isProcessing || attachments.length >= maxAttachments}
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
      )}

      {/* Drag & Drop Zone (when dragging) */}
      {isDragOver && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="border-2 border-dashed border-primary bg-background rounded-xl p-8 text-center max-w-md">
            <Upload size={48} className="mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-semibold mb-2">Drop files here</h3>
            <p className="text-muted-foreground text-sm">
              Support for images, text, code, and PDF files
            </p>
          </div>
        </div>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-xl border border-border/30">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2 text-sm max-w-[220px] hover:shadow-md transition-all duration-200"
            >
              <div className="flex-shrink-0">
                {getFileIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-foreground">{attachment.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                  {attachment.content && (
                    <span className="ml-1">• {attachment.content.split(/\s+/).length} words</span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAttachment(attachment.id)}
                className="h-6 w-6 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors flex-shrink-0"
                title="Remove file"
              >
                <X size={12} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="text-xs text-muted-foreground">
          Processing files...
        </div>
      )}
    </div>
  );
}