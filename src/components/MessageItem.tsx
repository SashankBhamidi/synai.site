
import { useState, useRef, useEffect, memo, useMemo } from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { User, Bot, Check, X, Search } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyButton } from "./CopyButton";
import { MessageActions } from "./MessageActions";
import { CitationLink } from "./CitationLink";
import { AttachmentDisplay } from "./AttachmentDisplay";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MessageItemProps {
  message: Message;
  messages?: Message[];
  messageIndex?: number;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  isLastMessage?: boolean;
  onBranchCreated?: (conversationId: string) => void;
}

function MessageItemComponent({ message, messages, messageIndex, onRegenerate, onEdit, onDelete, isLastMessage, onBranchCreated }: MessageItemProps) {
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

  // Check if this is a search-enabled model response
  const isSearchModel = useMemo(() => {
    return message.model?.provider === 'Perplexity' && 
           (message.model?.category === 'Search' || 
            message.model?.category === 'Reasoning' || 
            message.model?.category === 'Research');
  }, [message.model]);

  // Memoize markdown components to prevent re-rendering
  const markdownComponents = useMemo(() => ({
    // Enhanced code blocks with syntax highlighting appearance
    code({className, children, ...props}: {
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
        <div className="bg-gray-900 dark:bg-gray-800 rounded-lg p-4 my-3 font-mono text-sm overflow-auto custom-scrollbar border relative group">
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
    h1: ({...props}: {[key: string]: unknown}) => <h1 className="text-2xl font-bold my-4 text-foreground border-b pb-2" {...props} />,
    h2: ({...props}: {[key: string]: unknown}) => <h2 className="text-xl font-bold my-3 text-foreground" {...props} />,
    h3: ({...props}: {[key: string]: unknown}) => <h3 className="text-lg font-bold my-3 text-foreground" {...props} />,
    h4: ({...props}: {[key: string]: unknown}) => <h4 className="text-md font-bold my-2 text-foreground" {...props} />,
    h5: ({...props}: {[key: string]: unknown}) => <h5 className="text-sm font-bold my-2 text-foreground" {...props} />,
    h6: ({...props}: {[key: string]: unknown}) => <h6 className="text-xs font-bold my-2 text-foreground" {...props} />,
    p: ({...props}: {[key: string]: unknown}) => <p className="my-2 leading-relaxed" {...props} />,
    ul: ({...props}: {[key: string]: unknown}) => <ul className="list-disc ml-6 my-2 space-y-1" {...props} />,
    ol: ({...props}: {[key: string]: unknown}) => <ol className="list-decimal ml-6 my-2 space-y-1" {...props} />,
    li: ({...props}: {[key: string]: unknown}) => <li className="my-1" {...props} />,
    a: ({href, children, ...props}: {href?: string; children?: React.ReactNode; [key: string]: unknown}) => {
      // Enhanced link handling for citations
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        return (
          <CitationLink href={href} {...props}>
            {children}
          </CitationLink>
        );
      }
      return (
        <a 
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors" 
          target="_blank" 
          rel="noopener noreferrer" 
          href={href}
          {...props}
        >
          {children}
        </a>
      );
    },
    blockquote: ({...props}: {[key: string]: unknown}) => (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 pl-4 py-2 my-3 italic rounded-r-md" {...props} />
    ),
    hr: ({...props}: {[key: string]: unknown}) => <hr className="my-6 border-border" {...props} />,
    em: ({...props}: {[key: string]: unknown}) => <em className="italic text-foreground" {...props} />,
    strong: ({...props}: {[key: string]: unknown}) => <strong className="font-bold text-foreground" {...props} />,
    del: ({...props}: {[key: string]: unknown}) => <del className="line-through text-muted-foreground" {...props} />,
    pre: ({...props}: {[key: string]: unknown}) => <pre className="whitespace-pre-wrap" {...props} />,
  }), []);

  return (
    <div className={cn(
      "flex gap-3 sm:gap-4 items-start group message-enter",
      isUser ? "flex-row-reverse" : ""
    )}>
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          "chat-avatar",
          isUser ? "chat-avatar-user" : "chat-avatar-ai"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
      </div>
      <div className={cn(
        "chat-bubble max-w-[85%] sm:max-w-[75%]",
        isUser ? "chat-bubble-user" : "chat-bubble-ai"
      )}>
        <div className="font-medium text-sm mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{isUser ? "You" : "Synthesis AI"}</span>
            {!isUser && isSearchModel && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                <Search size={10} className="mr-1" />
                Search
              </Badge>
            )}
          </div>
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
            <div>
              <span>{message.content}</span>
              <AttachmentDisplay attachments={message.attachments || []} isUser={true} />
            </div>
          ) : (
            <div>
              <ReactMarkdown 
                className="prose dark:prose-invert prose-sm max-w-none"
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {message.content}
              </ReactMarkdown>
              <AttachmentDisplay attachments={message.attachments || []} isUser={false} />
            </div>
          )}
        </div>
        {!isEditing && (
          <MessageActions 
            message={message}
            messages={messages}
            messageIndex={messageIndex}
            onRegenerate={onRegenerate}
            onEdit={handleEdit}
            onDelete={handleDeleteMessage}
            isLastMessage={isLastMessage}
            onBranchCreated={onBranchCreated}
          />
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders with custom comparison
export const MessageItem = memo(MessageItemComponent, (prevProps, nextProps) => {
  // Only re-render if message content, editing state, or last message status changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.regenerationCount === nextProps.message.regenerationCount &&
    prevProps.isLastMessage === nextProps.isLastMessage &&
    prevProps.onRegenerate === nextProps.onRegenerate &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
});
