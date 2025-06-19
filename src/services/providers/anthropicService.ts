
import { BaseProviderService, AiRequestOptions, ApiMessage } from "./baseProviderService";
import Anthropic from '@anthropic-ai/sdk';

export class AnthropicService extends BaseProviderService {
  private client: Anthropic | null = null;

  constructor(apiKey: string | null) {
    super(apiKey);
    if (apiKey) {
      this.client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Required for browser usage
      });
    }
  }

  async sendRequest(options: AiRequestOptions): Promise<string> {
    const model = options.model || 'claude-3-5-sonnet-20240620';
    
    try {
      // If no API key or client, use simulated response
      if (!this.apiKey || !this.client || options.simulateResponse) {
        console.log('No Anthropic API key configured, using simulated response');
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropicFormat(options.messages || []);
      
      // Validate messages before sending
      if (anthropicMessages.length === 0) {
        // If no messages, create a simple user message
        anthropicMessages.push({
          role: 'user',
          content: options.message || 'Hello'
        });
      }
      
      // Ensure alternating user/assistant pattern (Anthropic requirement)
      const validatedMessages = this.validateMessageOrder(anthropicMessages);
      
      console.log('Sending request to Anthropic API:', { 
        model, 
        messageCount: validatedMessages.length,
        messages: JSON.stringify(validatedMessages, null, 2)
      });
      
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 4096,
        system: 'You are Synthesis AI, a helpful AI assistant. You remember previous messages in our conversation and can refer to them. Only mention your name when directly asked "who are you" or when greeting new users. Never identify as Claude, Anthropic or any other name. Provide varied and thoughtful responses.',
        messages: validatedMessages,
        temperature: options.temperature || 0.7,
      });

      // Extract text content from response
      const textOutputs = response.content
        .map((content) => (content.type === "text" ? content.text : null))
        .filter(Boolean);

      const responseText = textOutputs.join("\n");
      console.log('Received response from Anthropic API');
      
      return responseText;
      
    } catch (error) {
      console.error('Anthropic request failed:', error);
      
      // Only fall back to simulated response for network errors when no API key is configured
      if (!this.apiKey && error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('Network error with no API key - using simulated response');
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // For actual API errors with valid key, throw the error to be handled upstream
      throw new Error(this.handleApiError(error, 'Anthropic'));
    }
  }

  private convertMessagesToAnthropicFormat(messages: ApiMessage[]) {
    console.log('Converting messages to Anthropic format:', JSON.stringify(messages, null, 2));
    
    const convertedMessages = messages
      .filter(msg => msg.role !== 'system') // Anthropic doesn't use system messages in the messages array
      .map(msg => {
        // Handle multimodal content
        if (Array.isArray(msg.content)) {
          // Convert from OpenAI format to Anthropic format
          const anthropicContent = [];
          
          for (const item of msg.content) {
            if (item.type === 'text') {
              anthropicContent.push({
                type: 'text',
                text: item.text || ''
              });
            } else if (item.type === 'image_url' && item.image_url?.url) {
              // Convert base64 data URL to Anthropic format
              const imageUrl = item.image_url.url;
              if (imageUrl.startsWith('data:image/')) {
                const [mimeType, base64Data] = imageUrl.substring(5).split(';base64,');
                anthropicContent.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: base64Data
                  }
                });
              }
            }
          }
          
          // Validate we have content
          if (anthropicContent.length === 0) {
            console.warn('Empty multimodal content detected, using fallback');
            return {
              role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
              content: msg.role === 'assistant' ? 'I understand.' : 'Hello'
            };
          }
          
          return {
            role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: anthropicContent
          };
        } else {
          // Handle text-only content
          const content = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
          
          // Validate content is not empty
          if (!content.trim()) {
            console.warn('Empty message content detected, using fallback');
            return {
              role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
              content: msg.role === 'assistant' ? 'I understand.' : 'Hello'
            };
          }
          
          return {
            role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
            content: content
          };
        }
      })
      .filter(msg => {
        // Filter out empty messages
        if (typeof msg.content === 'string') {
          return msg.content.trim().length > 0;
        } else if (Array.isArray(msg.content)) {
          return msg.content.length > 0;
        }
        return false;
      });
    
    console.log('Converted to Anthropic format:', JSON.stringify(convertedMessages, null, 2));
    return convertedMessages;
  }

  private validateMessageOrder(messages: Array<{role: string; content: string | any[]}>) {
    // Anthropic requires messages to start with user and alternate user/assistant
    const validatedMessages = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      // First message must be from user
      if (i === 0 && message.role !== 'user') {
        // Skip or convert first assistant message
        continue;
      }
      
      // Check for consecutive messages from same role
      if (validatedMessages.length > 0) {
        const lastMessage = validatedMessages[validatedMessages.length - 1];
        if (lastMessage.role === message.role) {
          // Skip consecutive messages from same role
          continue;
        }
      }
      
      validatedMessages.push(message);
    }
    
    // Ensure we have at least one user message
    if (validatedMessages.length === 0) {
      validatedMessages.push({
        role: 'user',
        content: 'Hello'
      });
    }
    
    return validatedMessages;
  }


  private generateSimulatedResponse(assistantName: string, model: string, messages?: ApiMessage[]): string {
    // Use conversation context for better simulated responses
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || "Hello";
      
      // Generate varied responses to prevent repetition
      const responses = [
        `I understand you're asking: "${lastUserMessage}". I'm ${assistantName}, and I'm here to help you with any questions or tasks you have.`,
        `That's an interesting question about "${lastUserMessage}". As ${assistantName}, I'd be happy to assist you with this.`,
        `I see you're inquiring about "${lastUserMessage}". Let me help you with that as ${assistantName}.`,
        `Thank you for your question about "${lastUserMessage}". As ${assistantName}, I can provide you with comprehensive assistance on this topic.`,
        `I appreciate your inquiry regarding "${lastUserMessage}". ${assistantName} is here to provide detailed and helpful responses.`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return `${randomResponse} This is a simulated response since no Anthropic API key is configured.`;
    }
    
    return `Hello! I'm ${assistantName}, your AI assistant powered by ${model}. How can I help you today? (This is a simulated response - please configure your Anthropic API key in Settings)`;
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
      
      // Make a minimal test request
      await testClient.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      });
      
      return true;
    } catch (error) {
      console.error('Failed to validate Anthropic API key:', error);
      return false;
    }
  }
}
