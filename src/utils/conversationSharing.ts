import { Conversation, Message } from "@/types";
import { getConversationMessages } from "./conversationStorage";

export interface ShareableConversation {
  id: string;
  title: string;
  messages: Message[];
  metadata: {
    exportedAt: string;
    messageCount: number;
    participantCount: number;
    duration?: string;
    tags?: string[];
  };
}

export interface ShareOptions {
  includeSystemMessages?: boolean;
  includeMetadata?: boolean;
  format: 'json' | 'markdown' | 'text' | 'html' | 'pdf';
  title?: string;
  description?: string;
}

/**
 * Prepare conversation for sharing
 */
export const prepareConversationForShare = (
  conversation: Conversation,
  options: ShareOptions = { format: 'json' }
): ShareableConversation => {
  const messages = getConversationMessages(conversation.id);
  
  // Filter messages based on options
  const filteredMessages = options.includeSystemMessages 
    ? messages 
    : messages.filter(msg => msg.role !== 'system');

  // Calculate metadata
  const metadata = {
    exportedAt: new Date().toISOString(),
    messageCount: filteredMessages.length,
    participantCount: new Set(filteredMessages.map(msg => msg.role)).size,
    duration: calculateConversationDuration(filteredMessages),
    tags: conversation.tags
  };

  return {
    id: conversation.id,
    title: options.title || conversation.title,
    messages: filteredMessages,
    metadata: options.includeMetadata ? metadata : {
      exportedAt: metadata.exportedAt,
      messageCount: metadata.messageCount,
      participantCount: metadata.participantCount
    }
  };
};

/**
 * Calculate conversation duration
 */
const calculateConversationDuration = (messages: Message[]): string => {
  if (messages.length < 2) return "Single message";
  
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];
  
  const durationMs = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
  const durationMinutes = Math.floor(durationMs / (1000 * 60));
  
  if (durationMinutes < 1) return "Less than a minute";
  if (durationMinutes < 60) return `${durationMinutes} minutes`;
  
  const hours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;
  
  if (hours < 24) {
    return remainingMinutes > 0 
      ? `${hours}h ${remainingMinutes}m`
      : `${hours} hours`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  return remainingHours > 0
    ? `${days}d ${remainingHours}h`
    : `${days} days`;
};

/**
 * Export conversation as JSON
 */
export const exportAsJSON = (shareableConversation: ShareableConversation): string => {
  return JSON.stringify(shareableConversation, null, 2);
};

/**
 * Export conversation as Markdown
 */
export const exportAsMarkdown = (
  shareableConversation: ShareableConversation,
  options: ShareOptions
): string => {
  const { title, messages, metadata } = shareableConversation;
  
  let markdown = `# ${title}\n\n`;
  
  if (options.description) {
    markdown += `${options.description}\n\n`;
  }
  
  if (options.includeMetadata) {
    markdown += `## Conversation Details\n\n`;
    markdown += `- **Messages:** ${metadata.messageCount}\n`;
    markdown += `- **Participants:** ${metadata.participantCount}\n`;
    markdown += `- **Duration:** ${metadata.duration}\n`;
    markdown += `- **Exported:** ${new Date(metadata.exportedAt).toLocaleString()}\n`;
    if (metadata.tags && metadata.tags.length > 0) {
      markdown += `- **Tags:** ${metadata.tags.join(', ')}\n`;
    }
    markdown += `\n---\n\n`;
  }
  
  messages.forEach((message, index) => {
    const timestamp = message.timestamp.toLocaleString();
    const role = message.role === 'user' ? '👤 **User**' : '🤖 **Assistant**';
    
    markdown += `## ${role}\n`;
    markdown += `*${timestamp}*\n\n`;
    markdown += `${message.content}\n\n`;
    
    if (index < messages.length - 1) {
      markdown += `---\n\n`;
    }
  });
  
  return markdown;
};

/**
 * Export conversation as plain text
 */
export const exportAsText = (
  shareableConversation: ShareableConversation,
  options: ShareOptions
): string => {
  const { title, messages, metadata } = shareableConversation;
  
  let text = `${title}\n${'='.repeat(title.length)}\n\n`;
  
  if (options.description) {
    text += `${options.description}\n\n`;
  }
  
  if (options.includeMetadata) {
    text += `Conversation Details:\n`;
    text += `- Messages: ${metadata.messageCount}\n`;
    text += `- Participants: ${metadata.participantCount}\n`;
    text += `- Duration: ${metadata.duration}\n`;
    text += `- Exported: ${new Date(metadata.exportedAt).toLocaleString()}\n`;
    if (metadata.tags && metadata.tags.length > 0) {
      text += `- Tags: ${metadata.tags.join(', ')}\n`;
    }
    text += `\n${'-'.repeat(50)}\n\n`;
  }
  
  messages.forEach((message, index) => {
    const timestamp = message.timestamp.toLocaleString();
    const role = message.role === 'user' ? 'User' : 'Assistant';
    
    text += `[${timestamp}] ${role}:\n`;
    text += `${message.content}\n\n`;
  });
  
  return text;
};

/**
 * Export conversation as HTML
 */
export const exportAsHTML = (
  shareableConversation: ShareableConversation,
  options: ShareOptions
): string => {
  const { title, messages, metadata } = shareableConversation;
  
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            font-size: 2em;
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .description {
            color: #666;
            font-style: italic;
        }
        .metadata {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .metadata h3 {
            margin-top: 0;
            color: #495057;
        }
        .metadata ul {
            list-style: none;
            padding: 0;
        }
        .metadata li {
            margin: 5px 0;
        }
        .message {
            margin: 20px 0;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid;
        }
        .message.user {
            background: #e3f2fd;
            border-left-color: #2196f3;
        }
        .message.assistant {
            background: #f3e5f5;
            border-left-color: #9c27b0;
        }
        .message-header {
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .message-role {
            color: #495057;
        }
        .message-time {
            color: #868e96;
            font-size: 0.85em;
            font-weight: normal;
        }
        .message-content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
    </style>
</head>
<body>`;

  // Header
  html += `    <div class="header">
        <h1 class="title">${title}</h1>`;
  
  if (options.description) {
    html += `        <p class="description">${options.description}</p>`;
  }
  
  html += `    </div>`;
  
  // Metadata
  if (options.includeMetadata) {
    html += `    <div class="metadata">
        <h3>Conversation Details</h3>
        <ul>
            <li><strong>Messages:</strong> ${metadata.messageCount}</li>
            <li><strong>Participants:</strong> ${metadata.participantCount}</li>
            <li><strong>Duration:</strong> ${metadata.duration}</li>
            <li><strong>Exported:</strong> ${new Date(metadata.exportedAt).toLocaleString()}</li>`;
    
    if (metadata.tags && metadata.tags.length > 0) {
      html += `            <li><strong>Tags:</strong> ${metadata.tags.join(', ')}</li>`;
    }
    
    html += `        </ul>
    </div>`;
  }
  
  // Messages
  messages.forEach(message => {
    const timestamp = message.timestamp.toLocaleString();
    const roleClass = message.role === 'user' ? 'user' : 'assistant';
    const roleDisplay = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    
    html += `    <div class="message ${roleClass}">
        <div class="message-header">
            <span class="message-role">${roleDisplay}</span>
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-content">${escapeHtml(message.content)}</div>
    </div>`;
  });
  
  // Footer
  html += `    <div class="footer">
        <p>Exported from Synthesis AI on ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>`;
  
  return html;
};

/**
 * Escape HTML characters
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Generate shareable link (placeholder for future backend integration)
 */
export const generateShareableLink = (
  conversation: Conversation,
  options: ShareOptions
): Promise<string> => {
  // This would integrate with a backend service in the future
  // For now, we'll create a base64 encoded data URL
  
  const shareableConversation = prepareConversationForShare(conversation, options);
  const data = btoa(JSON.stringify(shareableConversation));
  const shareableUrl = `${window.location.origin}/shared/${data}`;
  
  return Promise.resolve(shareableUrl);
};

/**
 * Download conversation in specified format
 */
export const downloadConversation = (
  conversation: Conversation,
  options: ShareOptions
): void => {
  const shareableConversation = prepareConversationForShare(conversation, options);
  
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (options.format) {
    case 'json':
      content = exportAsJSON(shareableConversation);
      mimeType = 'application/json';
      extension = 'json';
      break;
    case 'markdown':
      content = exportAsMarkdown(shareableConversation, options);
      mimeType = 'text/markdown';
      extension = 'md';
      break;
    case 'text':
      content = exportAsText(shareableConversation, options);
      mimeType = 'text/plain';
      extension = 'txt';
      break;
    case 'html':
      content = exportAsHTML(shareableConversation, options);
      mimeType = 'text/html';
      extension = 'html';
      break;
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const filename = `${conversation.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.${extension}`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
};