
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
}

// Export AIModel from models.ts using export type for isolated modules
export type { AIModel } from "./models";
