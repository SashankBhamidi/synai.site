
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { CopyButton } from "./CopyButton";
import { MessageActions } from "./MessageActions";

interface MessageItemProps {
  message: Message;
  onRegenerate?: () => void;
  isLastMessage?: boolean;
}

export function MessageItem({ message, onRegenerate, isLastMessage }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn(
      "flex gap-4 items-start group",
      isUser ? "flex-row-reverse" : ""
    )}>
      <div className="flex-shrink-0 mt-0.5">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-blue-500 text-white" : "bg-primary text-primary-foreground"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>
      </div>
      <div className={cn(
        "rounded-2xl p-4 max-w-[80%]",
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
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <ReactMarkdown 
              className="prose dark:prose-invert prose-sm max-w-none"
              components={{
                // Enhanced code blocks with syntax highlighting appearance
                code({node, className, children, ...props}) {
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
                // Remove table rendering - convert to plain text format
                table: ({children}) => {
                  // Convert table to a simple div with monospace font
                  return (
                    <div className="my-4 p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                      {children}
                    </div>
                  );
                },
                thead: ({children}) => <div>{children}</div>,
                tbody: ({children}) => <div>{children}</div>,
                tr: ({children}) => (
                  <div className="block">
                    {children}
                  </div>
                ),
                th: ({children}) => (
                  <span className="font-bold mr-4">
                    {children}
                  </span>
                ),
                td: ({children}) => (
                  <span className="mr-4">
                    {children}
                  </span>
                ),
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4 text-foreground border-b pb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3 text-foreground" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold my-3 text-foreground" {...props} />,
                h4: ({node, ...props}) => <h4 className="text-md font-bold my-2 text-foreground" {...props} />,
                h5: ({node, ...props}) => <h5 className="text-sm font-bold my-2 text-foreground" {...props} />,
                h6: ({node, ...props}) => <h6 className="text-xs font-bold my-2 text-foreground" {...props} />,
                p: ({node, ...props}) => <p className="my-2 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 my-2 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-6 my-2 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="my-1" {...props} />,
                a: ({node, ...props}) => (
                  <a 
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    {...props} 
                  />
                ),
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 pl-4 py-2 my-3 italic rounded-r-md" {...props} />
                ),
                hr: ({node, ...props}) => <hr className="my-6 border-border" {...props} />,
                em: ({node, ...props}) => <em className="italic text-foreground" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                del: ({node, ...props}) => <del className="line-through text-muted-foreground" {...props} />,
                pre: ({node, ...props}) => <pre className="whitespace-pre-wrap" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        <MessageActions 
          message={message} 
          onRegenerate={onRegenerate}
          isLastMessage={isLastMessage}
        />
      </div>
    </div>
  );
}
