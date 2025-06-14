
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
      
      return this.cleanupReferences(responseText);
      
    } catch (error) {
      console.error('Anthropic request failed:', error);
      // Fallback to simulated response on error
      return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
    }
  }

  private convertMessagesToAnthropicFormat(messages: ApiMessage[]) {
    console.log('Converting messages to Anthropic format:', JSON.stringify(messages, null, 2));
    
    const convertedMessages = messages
      .filter(msg => msg.role !== 'system') // Anthropic doesn't use system messages in the messages array
      .map(msg => {
        // Ensure content is always a string for Anthropic
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
      })
      .filter(msg => msg.content.trim().length > 0); // Remove any empty messages
    
    console.log('Converted to Anthropic format:', JSON.stringify(convertedMessages, null, 2));
    return convertedMessages;
  }

  private validateMessageOrder(messages: any[]) {
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
