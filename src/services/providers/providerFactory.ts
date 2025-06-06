
import { OpenAIService } from "./openaiService";
import { AnthropicService } from "./anthropicService";
import { PerplexityService } from "./perplexityService";
import { BaseProviderService } from "./baseProviderService";
import { getApiKey } from "../../utils/apiKeyStorage";

export type ProviderType = 'openai' | 'anthropic' | 'perplexity';

export class ProviderFactory {
  private static providers: Record<ProviderType, BaseProviderService | null> = {
    openai: null,
    anthropic: null,
    perplexity: null
  };

  static getProvider(type: ProviderType): BaseProviderService {
    if (!this.providers[type]) {
      const apiKey = getApiKey(type);
      
      switch (type) {
        case 'openai':
          this.providers[type] = new OpenAIService(apiKey);
          break;
        case 'anthropic':
          this.providers[type] = new AnthropicService(apiKey);
          break;
        case 'perplexity':
          this.providers[type] = new PerplexityService(apiKey);
          break;
      }
    }

    return this.providers[type]!;
  }

  static resetProvider(type: ProviderType): void {
    this.providers[type] = null;
  }

  static resetAllProviders(): void {
    this.providers.openai = null;
    this.providers.anthropic = null;
    this.providers.perplexity = null;
  }
}
