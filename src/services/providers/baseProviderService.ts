
export interface AiRequestOptions {
  message: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  simulateResponse?: boolean;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
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

  abstract sendRequest(options: AiRequestOptions): Promise<any>;

  protected validateApiKey(): void {
    if (!this.apiKey) {
      console.warn('No API key provided. Using simulated responses.');
    }
  }

  protected handleApiError(error: any, providerName: string): string {
    console.error(`${providerName} API Error:`, error);
    
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      return `Authentication failed with ${providerName}. Please check your API key.`;
    }
    
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      return `Rate limit exceeded for ${providerName}. Please try again later.`;
    }
    
    if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
      return `Network error connecting to ${providerName}. Please check your connection and try again.`;
    }
    
    return `Error communicating with ${providerName}: ${error.message || 'Unknown error'}`;
  }

  abstract validateKey(apiKey: string): Promise<boolean>;
}
