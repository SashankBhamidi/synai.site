
import { BaseProviderService, AiRequestOptions, ApiMessage } from "./baseProviderService";

export class PerplexityService extends BaseProviderService {
  constructor(apiKey: string | null) {
    super(apiKey);
  }

  async sendRequest(options: AiRequestOptions): Promise<string> {
    this.validateApiKey();
    
    const model = options.model || 'llama-3.1-sonar-large-128k-online';
    
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
          stream: false // Explicitly disable streaming to prevent SSE responses
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

      // Debug the response type
      const responseText = await response.text();
      console.log('Perplexity raw response:', responseText.substring(0, 200));
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse Perplexity response as JSON:', error);
        throw new Error(`Invalid response format from Perplexity: ${responseText.substring(0, 100)}`);
      }
      
      const content = data.choices[0]?.message?.content || '';
      
      // Parse and structure citations instead of removing them
      const structuredResponse = this.parsePerplexityResponse(content);
      
      console.log('Perplexity response content:', structuredResponse);
      return structuredResponse;
    } catch (error) {
      console.error('Perplexity request failed:', error);
      
      // Only fall back to simulated response for network errors when no API key is configured
      if (!this.apiKey && error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.log('Network error with no API key - using simulated response');
        return this.generateSimulatedResponse('Synthesis AI', model, options.messages);
      }
      
      // For actual API errors with valid key, throw the error to be handled upstream
      throw new Error(this.handleApiError(error, 'Perplexity'));
    }
  }

  private parsePerplexityResponse(content: string): string {
    // Extract sources/references section if it exists
    const sourcesMatch = content.match(/\n\n(?:References?|Sources?):\s*([\s\S]*)$/i);
    let sources: string[] = [];
    let sourceUrls: Record<number, string> = {};
    
    if (sourcesMatch) {
      // Parse sources from the references section
      const sourcesText = sourcesMatch[1];
      sources = sourcesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && (line.match(/^\d+\./) || line.match(/^-/) || line.includes('http')))
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''));
      
      // Build a mapping of citation numbers to URLs
      sources.forEach((source, index) => {
        const citationNum = index + 1;
        const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          sourceUrls[citationNum] = urlMatch[1];
        }
      });
    }
    
    // Convert inline citations [1], [2] etc. to clickable links if we have URLs
    if (Object.keys(sourceUrls).length > 0) {
      content = content.replace(/\[(\d+)\]/g, (match, num) => {
        const citationNum = parseInt(num);
        const url = sourceUrls[citationNum];
        if (url) {
          return `[${num}](${url} "Source ${num}")`;
        }
        return match; // Keep original if no URL found
      });
    }
    
    // If we have sources, create a structured response with clickable citations
    if (sources.length > 0) {
      // Remove the original sources section
      content = content.replace(/\n\n(?:References?|Sources?):\s*[\s\S]*$/i, '');
      
      // Add structured sources section
      content += '\n\n---\n\n**Sources:**\n';
      sources.forEach((source, index) => {
        const citationNum = index + 1;
        // Try to extract URL if present
        const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[1];
          const title = source.replace(url, '').trim().replace(/^[-\s]*/, '').replace(/[-\s]*$/, '') || `Source ${citationNum}`;
          content += `\n${citationNum}. [${title}](${url})`;
        } else {
          content += `\n${citationNum}. ${source}`;
        }
      });
    }
    
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
