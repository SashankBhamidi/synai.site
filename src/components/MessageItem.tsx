
import { useState, useRef, useEffect, memo, useMemo } from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { User, Bot, Check, X } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from "./CopyButton";
import { MessageActions } from "./MessageActions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  isLastMessage?: boolean;
}

function MessageItemComponent({ message, onRegenerate, onEdit, onDelete, isLastMessage }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isUser = message.role === "user";

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const newContent = editContent.trim();
    if (newContent && newContent !== message.content && onEdit) {
      onEdit(message.id, newContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDeleteMessage = () => {
    if (onDelete) {
      onDelete(message.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Memoize markdown components to prevent re-rendering
  const markdownComponents = useMemo(() => ({
    // Enhanced code blocks with syntax highlighting appearance
    code({node, className, children, ...props}: {
      node?: unknown;
      className?: string;
      children?: React.ReactNode;
      [key: string]: unknown;
    }) {
      const isInlineCode = !className;
      const language = className?.replace('language-', '') || '';
      const codeContent = String(children).replace(/\n$/, '');
      
      return isInlineCode ? (
        <code className="bg-black/20 dark:bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono border" {...props}>
          {children}
        </code>
      ) : (
        <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 my-3 font-mono text-sm overflow-auto border relative group">
          <div className="flex justify-between items-center mb-2">
            {language && (
              <div className="text-gray-400 text-xs uppercase tracking-wide">
                {language}
              </div>
            )}
            <CopyButton text={codeContent} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <code className="text-gray-100 dark:text-gray-200" {...props}>
            {children}
          </code>
        </div>
      )
    },
    // Proper table rendering with styling
    table: ({children}: {children?: React.ReactNode}) => (
      <div className="my-3 sm:my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-border rounded-md text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({children}: {children?: React.ReactNode}) => (
      <thead className="bg-muted/50">
        {children}
      </thead>
    ),
    tbody: ({children}: {children?: React.ReactNode}) => (
      <tbody className="divide-y divide-border">
        {children}
      </tbody>
    ),
    tr: ({children}: {children?: React.ReactNode}) => (
      <tr className="hover:bg-muted/30">
        {children}
      </tr>
    ),
    th: ({children}: {children?: React.ReactNode}) => (
      <th className="border border-border px-2 sm:px-4 py-2 text-left font-semibold bg-muted/20 text-xs sm:text-sm">
        {children}
      </th>
    ),
    td: ({children}: {children?: React.ReactNode}) => (
      <td className="border border-border px-2 sm:px-4 py-2 text-xs sm:text-sm">
        {children}
      </td>
    ),
    h1: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <h1 className="text-2xl font-bold my-4 text-foreground border-b pb-2" {...props} />,
    h2: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <h2 className="text-xl font-bold my-3 text-foreground" {...props} />,
    h3: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <h3 className="text-lg font-bold my-3 text-foreground" {...props} />,
    h4: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <h4 className="text-md font-bold my-2 text-foreground" {...props} />,
    h5: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <h5 className="text-sm font-bold my-2 text-foreground" {...props} />,
    h6: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <h6 className="text-xs font-bold my-2 text-foreground" {...props} />,
    p: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <p className="my-2 leading-relaxed" {...props} />,
    ul: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <ul className="list-disc ml-6 my-2 space-y-1" {...props} />,
    ol: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <ol className="list-decimal ml-6 my-2 space-y-1" {...props} />,
    li: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <li className="my-1" {...props} />,
    a: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => (
      <a 
        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors" 
        target="_blank" 
        rel="noopener noreferrer" 
        {...props} 
      />
    ),
    blockquote: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 pl-4 py-2 my-3 italic rounded-r-md" {...props} />
    ),
    hr: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <hr className="my-6 border-border" {...props} />,
    em: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <em className="italic text-foreground" {...props} />,
    strong: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <strong className="font-bold text-foreground" {...props} />,
    del: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <del className="line-through text-muted-foreground" {...props} />,
    pre: ({node, ...props}: {node?: unknown; [key: string]: unknown}) => <pre className="whitespace-pre-wrap" {...props} />,
  }), []);

  return (
    <div className={cn(
      "flex gap-2 sm:gap-4 items-start group",
      isUser ? "flex-row-reverse" : ""
    )}>
      <div className="flex-shrink-0 mt-0.5">
        <div className={cn(
          "w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"
        )}>
          {isUser ? <User size={12} className="sm:w-4 sm:h-4" /> : <Bot size={12} className="sm:w-4 sm:h-4" />}
        </div>
      </div>
      <div className={cn(
        "rounded-2xl p-3 sm:p-4 max-w-[85%] sm:max-w-[80%]",
        isUser 
          ? "bg-blue-500 text-white rounded-tr-none" 
          : "bg-secondary/50 dark:bg-secondary/30 rounded-tl-none"
      )}>
        <div className="font-medium text-sm mb-1 flex items-center justify-between">
          <span>{isUser ? "You" : "Synthesis AI"}</span>
          {!isUser && message.regenerationCount && message.regenerationCount > 0 && (
            <span className="text-xs opacity-70 ml-2">
              Regenerated {message.regenerationCount} time{message.regenerationCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="text-sm markdown-content">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[100px] resize-none"
                placeholder="Edit your message..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  className="h-7"
                >
                  <Check size={14} className="mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-7"
                >
                  <X size={14} className="mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : isUser ? (
            <span>{message.content}</span>
          ) : (
            <ReactMarkdown 
              className="prose dark:prose-invert prose-sm max-w-none"
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {!isEditing && (
          <MessageActions 
            message={message} 
            onRegenerate={onRegenerate}
            onEdit={handleEdit}
            onDelete={handleDeleteMessage}
            isLastMessage={isLastMessage}
          />
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const MessageItem = memo(MessageItemComponent);
