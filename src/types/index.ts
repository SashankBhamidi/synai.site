
import { AIModel } from "./models";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  model?: AIModel;
  regenerationCount?: number;
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

// Export AIModel from models.ts using export type for isolated modules
export type { AIModel } from "./models";
