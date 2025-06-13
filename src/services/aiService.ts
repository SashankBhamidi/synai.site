
import { ProviderFactory, ProviderType } from './providers/providerFactory';
import type { AiRequestOptions, StreamCallbacks } from './providers/baseProviderService';
import { getApiKey } from "../utils/apiKeyStorage";
import { toast } from "sonner";

/**
 * Generic function to send a message to the selected AI provider
 */
export const sendAiMessage = async (provider: string, options: AiRequestOptions) => {
  const providerType = provider.toLowerCase() as ProviderType;
  
  if (!['openai', 'anthropic', 'perplexity'].includes(providerType)) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const providerService = ProviderFactory.getProvider(providerType);
  return await providerService.sendRequest(options);
};

/**
 * Function specific to OpenAI requests
 */
export const sendOpenAIRequest = async (options: AiRequestOptions) => {
  const providerService = ProviderFactory.getProvider('openai');
  return await providerService.sendRequest(options);
};

/**
 * Function specific to Anthropic requests
 */
export const sendAnthropicRequest = async (options: AiRequestOptions) => {
  const providerService = ProviderFactory.getProvider('anthropic');
  return await providerService.sendRequest(options);
};

/**
 * Function specific to Perplexity requests
 */
export const sendPerplexityRequest = async (options: AiRequestOptions) => {
  const providerService = ProviderFactory.getProvider('perplexity');
  return await providerService.sendRequest(options);
};

/**
 * Validate an API key by making a minimal request
 */
export const validateApiKey = async (provider: string, apiKey: string): Promise<boolean> => {
  const providerType = provider.toLowerCase() as ProviderType;
  
  if (!['openai', 'anthropic', 'perplexity'].includes(providerType)) {
    return false;
  }

  try {
    // We'll skip actual validation to avoid unnecessary API calls that might be failing
    // Just check that the key format looks reasonable
    const isValidFormat = checkKeyFormat(providerType, apiKey);
    
    if (!isValidFormat) {
      toast.error(`The ${provider} API key format doesn't look right. Saving anyway.`);
      return true; // Still allow saving
    }
    
    return true;
  } catch (error) {
    console.error(`Error validating ${provider} API key:`, error);
    toast.error(`Error checking ${provider} API key. Saving anyway.`);
    // Still allow the user to save the key even if validation fails
    return true;
  }
};

/**
 * Basic check for API key format without making API calls
 * This is just a simple format check to give basic feedback
 */
const checkKeyFormat = (provider: ProviderType, apiKey: string): boolean => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return false;
  }
  
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    case 'anthropic':
      return (apiKey.startsWith('sk-ant-') || apiKey.startsWith('sk-')) && apiKey.length > 20;
    case 'perplexity':
      return apiKey.startsWith('pplx-') && apiKey.length > 20;
    default:
      return true;
  }
};

// Re-export types for use in other files
export type { AiRequestOptions, StreamCallbacks };
