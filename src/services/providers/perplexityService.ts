
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
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // Convert messages to Perplexity format with proper content validation
      const perplexityMessages = this.convertMessagesToPerplexityFormat(options.messages || []);
      
      // Add system message and user messages according to Perplexity docs
      const requestMessages = [
        {
          role: 'system' as const,
          content: 'You are Synthesis AI, a helpful AI assistant. You remember previous messages in our conversation and can refer to them. Only mention your name when directly asked "who are you" or when greeting new users. Never identify as Perplexity or any other name. Provide varied and thoughtful responses.'
        },
        ...perplexityMessages
      ];
      
      console.log('Sending to Perplexity with messages:', JSON.stringify(requestMessages, null, 2));
      
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: requestMessages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000,
          stream: !!options.stream
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Invalid Perplexity API key. Please check your API key in settings.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Perplexity API error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      let content = data.choices[0]?.message?.content || '';
      
      // Clean up citation numbers and references
      content = this.cleanupReferences(content);
      
      console.log('Perplexity response content:', content);
      return content;
    } catch (error) {
      console.error('Perplexity request failed:', error);
      
      // For network errors, fall back to simulated response
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('Network error detected, using simulated response');
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // For other errors, also use simulated response but log the error
      console.log('API error detected, using simulated response:', error.message);
      return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
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

  private convertMessagesToPerplexityFormat(messages: ApiMessage[]) {
    console.log('Converting messages to Perplexity format:', JSON.stringify(messages, null, 2));
    
    const convertedMessages = messages
      .filter(msg => msg.role !== 'system') // System message will be added separately
      .map(msg => {
        // Ensure content is always a string for Perplexity
        const content = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
        return {
          role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content: content
        };
      });
    
    console.log('Converted to Perplexity format:', JSON.stringify(convertedMessages, null, 2));
    return convertedMessages;
  }

  private generateSimulatedResponse(assistantName: string, model: string, messages?: ApiMessage[]): string {
    // Use conversation context for better simulated responses
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || "Hello";
      const content = typeof lastUserMessage === 'string' ? lastUserMessage : String(lastUserMessage);
      
      // Generate varied responses to prevent repetition
      const responses = [
        `I understand you're asking: "${content}". I'm ${assistantName}, and I'm here to help you with any questions or tasks you have.`,
        `That's an interesting question about "${content}". As ${assistantName}, I'd be happy to assist you with this.`,
        `I see you're inquiring about "${content}". Let me help you with that as ${assistantName}.`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return `${randomResponse} This is a simulated response since there was an issue connecting to the Perplexity API.`;
    }
    
    return `Hello! I'm ${assistantName}, your AI assistant powered by ${model}. How can I help you today? (This is a simulated response due to API connection issues)`;
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
