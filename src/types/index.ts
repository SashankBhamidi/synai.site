
import { AIModel } from "./models";
import { FileAttachment } from "./attachments";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: AIModel;
  regenerationCount?: number;
  attachments?: FileAttachment[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  active?: boolean; // Add optional active property for UI state
  folderId?: string; // Folder organization
  tags?: string[]; // Tags for categorization
  isFavorite?: boolean; // Favorite status
  isPinned?: boolean; // Pin to top
  description?: string; // Optional description
  color?: string; // Optional color coding
}

export interface ConversationFolder {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  parentId?: string; // For nested folders
  isExpanded?: boolean; // UI state for collapsible folders
}

// Export types from other modules
export type { AIModel } from "./models";
export type { 
  FileAttachment, 
  AttachmentType, 
  AttachmentValidation 
} from "./attachments";
export { 
  ATTACHMENT_CONFIG, 
  getAttachmentType, 
  formatFileSize, 
  isValidAttachment 
} from "./attachments";
