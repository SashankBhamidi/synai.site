
import { FileAttachment } from '@/types/attachments';

export interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | { type: string; text?: string; image_url?: { url: string } }[];
  attachments?: FileAttachment[];
}

export interface AiRequestOptions {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  simulateResponse?: boolean;
  messages?: ApiMessage[];
  attachments?: FileAttachment[];
}

export interface AiResponse {
  content: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface StreamCallbacks {
  onData?: (chunk: string) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export abstract class BaseProviderService {
  protected apiKey: string | null;

  constructor(apiKey: string | null) {
    this.apiKey = apiKey;
  }

  abstract sendRequest(options: AiRequestOptions): Promise<string>;

  protected validateApiKey(): void {
    if (!this.apiKey) {
      console.warn('No API key provided. Using simulated responses.');
    }
  }

  protected handleApiError(error: unknown, providerName: string): string {
    console.error(`${providerName} API Error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage?.includes('401') || errorMessage?.includes('unauthorized')) {
      return `Authentication failed with ${providerName}. Please check your API key.`;
    }
    
    if (errorMessage?.includes('429') || errorMessage?.includes('rate limit')) {
      return `Rate limit exceeded for ${providerName}. Please try again later.`;
    }
    
    if (errorMessage?.includes('Failed to fetch') || errorMessage?.includes('network')) {
      return `Network error connecting to ${providerName}. Please check your connection and try again.`;
    }
    
    return `Error communicating with ${providerName}: ${errorMessage || 'Unknown error'}`;
  }

  abstract validateKey(apiKey: string): Promise<boolean>;
}
