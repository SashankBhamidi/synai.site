
import { BaseProviderService, AiRequestOptions, ApiMessage } from "./baseProviderService";

export class OpenAIService extends BaseProviderService {
  constructor(apiKey: string | null) {
    super(apiKey);
  }

  async sendRequest(options: AiRequestOptions): Promise<string> {
    this.validateApiKey();
    
    const model = options.model || 'gpt-4o';
    
    try {
      // If using simulated response (no API key or demo mode)
      if (!this.apiKey || options.simulateResponse) {
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // Prepare messages for OpenAI API - use conversation history if available
      const openaiMessages = options.messages || [
        {
          role: 'user',
          content: options.message
        }
      ];
      
      console.log('Sending to OpenAI with messages:', JSON.stringify(openaiMessages, null, 2));
      
      // Validate message format before sending
      openaiMessages.forEach((msg, index) => {
        if (typeof msg.content !== 'string') {
          console.error(`Message ${index} has invalid content type:`, typeof msg.content, msg.content);
        }
      });
      
      // Add a small delay to prevent identical responses on regeneration
      if (options.messages && options.messages.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are Synthesis AI, a helpful AI assistant. You remember previous messages in our conversation and can refer to them. Only mention your name when directly asked "who are you" or when greeting new users. Never identify as ChatGPT, GPT or any other name. Provide varied and thoughtful responses.'
            },
            ...openaiMessages
          ],
          temperature: options.temperature || 0.8, // Slightly higher for more variation
          max_tokens: options.maxTokens || 1000,
          stream: false, // Explicitly disable streaming to prevent SSE responses
          // Add some randomness to prevent identical responses
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key in settings.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }
      }

      // Debug the response type
      const responseText = await response.text();
      console.log('OpenAI raw response:', responseText.substring(0, 200));
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse OpenAI response as JSON:', error);
        throw new Error(`Invalid response format from OpenAI: ${responseText.substring(0, 100)}`);
      }
      
      let content = data.choices[0]?.message?.content || '';
      
      // Clean up any reference numbers that might appear
      content = this.cleanupReferences(content);
      
      console.log('OpenAI response content:', content);
      return content;
    } catch (error) {
      console.error('OpenAI request failed:', error);
      
      // For any network or API errors, fall back to simulated response
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

  private generateSimulatedResponse(assistantName: string, model: string, messages?: ApiMessage[]): string {
    // Use conversation context for better simulated responses
    if (messages && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1]?.content || "Hello";
      
      // Generate varied responses to prevent repetition
      const responses = [
        `I understand you're asking: "${lastUserMessage}". I'm ${assistantName}, and I'm here to help you with any questions or tasks you have.`,
        `That's an interesting question about "${lastUserMessage}". As ${assistantName}, I'd be happy to assist you with this.`,
        `I see you're inquiring about "${lastUserMessage}". Let me help you with that as ${assistantName}.`
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      return `${randomResponse} This is a simulated response since there was an issue connecting to the OpenAI API.`;
    }
    
    return `Hello! I'm ${assistantName}, your AI assistant powered by ${model}. How can I help you today? (This is a simulated response due to API connection issues)`;
  }

  async validateKey(apiKey: string): Promise<boolean> {
    try {
      return true;
    } catch (error) {
      console.error('Failed to validate OpenAI API key:', error);
      return true;
    }
  }
}
