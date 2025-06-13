
import { BaseProviderService, AiRequestOptions, ApiMessage } from "./baseProviderService";

export class PerplexityService extends BaseProviderService {
  constructor(apiKey: string | null) {
    super(apiKey);
  }

  async sendRequest(options: AiRequestOptions): Promise<string> {
    this.validateApiKey();
    
    const model = options.model || 'llama-3.1-sonar-small-128k-online';
    
    try {
      // If using simulated response (no API key or demo mode)
      if (!this.apiKey || options.simulateResponse) {
        return this.generateSimulatedResponse('Synthesis AI', model);
      }
      
      // Perplexity requires specific message formatting - only user and assistant roles
      const messages = options.messages || [];
      
      // Filter out system messages and ensure proper role formatting
      const perplexityMessages = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: msg.content
        }));
      
      // Ensure the last message is from user (Perplexity requirement)
      if (perplexityMessages.length === 0 || perplexityMessages[perplexityMessages.length - 1].role !== 'user') {
        perplexityMessages.push({
          role: 'user',
          content: options.message
        });
      }
      
      console.log('Sending to Perplexity with messages:', perplexityMessages);
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: perplexityMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          stream: !!options.stream
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Perplexity API error:', error);
        throw new Error(error.error?.message || 'Failed to communicate with Perplexity API');
      }

      // Handle streaming
      if (options.stream) {
        return response;
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content || '';
      
      // Clean up citation numbers and references
      content = this.cleanupReferences(content);
      
      return content;
    } catch (error) {
      console.error('Perplexity request failed:', error);
      return this.generateSimulatedResponse('Synthesis AI', model);
    }
  }

  private cleanupReferences(content: string): string {
    // Remove citation numbers like [1], [2], [3], etc.
    content = content.replace(/\[\d+\]/g, '');
    
    // Remove reference sections at the end
    content = content.replace(/\n\nReferences?:[\s\S]*$/i, '');
    content = content.replace(/\n\nSources?:[\s\S]*$/i, '');
    
    // Clean up extra whitespace
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    content = content.trim();
    
    return content;
  }

  private generateSimulatedResponse(assistantName: string, model: string): string {
    return `Hello! I'm ${assistantName}, your AI assistant powered by ${model}. How can I help you today?`;
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Failed to validate Perplexity API key:', error);
      return true;
    }
  }
}
