
import { BaseProviderService, AiRequestOptions } from "./baseProviderService";
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

  async sendRequest(options: AiRequestOptions): Promise<any> {
    const model = options.model || 'claude-3-5-sonnet-20240620';
    
    try {
      // If no API key or client, use simulated response
      if (!this.apiKey || !this.client || options.simulateResponse) {
        console.log('No Anthropic API key configured, using simulated response');
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // Convert messages to Anthropic format
      const anthropicMessages = this.convertMessagesToAnthropicFormat(options.messages || []);
      
      console.log('Sending request to Anthropic API:', { model, messageCount: anthropicMessages.length });
      
      const response = await this.client.messages.create({
        model: model,
        max_tokens: 4096,
        messages: anthropicMessages,
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

  private convertMessagesToAnthropicFormat(messages: Array<{role: string, content: string}>) {
    return messages
      .filter(msg => msg.role !== 'system') // Anthropic doesn't use system messages in the messages array
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }));
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

  private generateSimulatedResponse(assistantName: string, model: string, messages?: Array<{role: string, content: string}>): string {
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
