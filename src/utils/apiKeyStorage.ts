/**
 * Utility functions for securely storing and retrieving API keys
 */

// Storage key constants
const STORAGE_PREFIX = 'synthesis-ai-';
const OPENAI_KEY = `${STORAGE_PREFIX}openai-key`;
const ANTHROPIC_KEY = `${STORAGE_PREFIX}anthropic-key`;
const PERPLEXITY_KEY = `${STORAGE_PREFIX}perplexity-key`;

// Provider type definition
export type AIProvider = 'openai' | 'anthropic' | 'perplexity';

/**
 * Simple encryption/decryption for API keys
 * Note: This is not truly secure but better than plaintext
 * For a production app, consider using the Web Crypto API
 */
const encryptKey = (key: string): string => {
  // Simple XOR-based obfuscation with a changing pattern
  const pattern = Date.now().toString();
  let result = '';
  for (let i = 0; i < key.length; i++) {
    const keyChar = key.charCodeAt(i);
    const patternChar = pattern.charCodeAt(i % pattern.length);
    result += String.fromCharCode(keyChar ^ patternChar);
  }
  
  // Store the pattern with the encoded result
  return btoa(`${pattern}:${result}`);
};

const decryptKey = (encoded: string): string => {
  try {
    const decoded = atob(encoded);
    const [pattern, encrypted] = decoded.split(':');
    
    let result = '';
    for (let i = 0; i < encrypted.length; i++) {
      const encryptedChar = encrypted.charCodeAt(i);
      const patternChar = pattern.charCodeAt(i % pattern.length);
      result += String.fromCharCode(encryptedChar ^ patternChar);
    }
    
    return result;
  } catch (error) {
    console.error('Failed to decrypt API key', error);
    return '';
  }
};

/**
 * Save an API key to localStorage with simple encryption
 */
export const saveApiKey = (provider: AIProvider, apiKey: string): void => {
  let storageKey = '';
  
  switch (provider) {
    case 'openai':
      storageKey = OPENAI_KEY;
      break;
    case 'anthropic':
      storageKey = ANTHROPIC_KEY;
      break;
    case 'perplexity':
      storageKey = PERPLEXITY_KEY;
      break;
    default:
      console.error('Invalid provider specified');
      return;
  }

  if (!apiKey) {
    // If key is empty, remove it
    localStorage.removeItem(storageKey);
    return;
  }

  // Apply simple encryption before storing
  const encoded = encryptKey(apiKey);
  localStorage.setItem(storageKey, encoded);
};

/**
 * Get an API key from localStorage and decrypt it
 */
export const getApiKey = (provider: AIProvider): string | null => {
  let storageKey = '';
  
  switch (provider) {
    case 'openai':
      storageKey = OPENAI_KEY;
      break;
    case 'anthropic':
      storageKey = ANTHROPIC_KEY;
      break;
    case 'perplexity':
      storageKey = PERPLEXITY_KEY;
      break;
    default:
      console.error('Invalid provider specified');
      return null;
  }

  const encoded = localStorage.getItem(storageKey);
  if (!encoded) return null;
  
  // Decode the stored key
  return decryptKey(encoded);
};

/**
 * Remove an API key from localStorage
 */
export const removeApiKey = (provider: AIProvider): void => {
  let storageKey = '';
  
  switch (provider) {
    case 'openai':
      storageKey = OPENAI_KEY;
      break;
    case 'anthropic':
      storageKey = ANTHROPIC_KEY;
      break;
    case 'perplexity':
      storageKey = PERPLEXITY_KEY;
      break;
    default:
      console.error('Invalid provider specified');
      return;
  }

  localStorage.removeItem(storageKey);
};

/**
 * Check if an API key exists for a provider
 */
export const hasApiKey = (provider: AIProvider): boolean => {
  return !!getApiKey(provider);
};

/**
 * Check if any API keys are configured
 */
export const hasAnyApiKeys = (): boolean => {
  return hasApiKey('openai') || hasApiKey('anthropic') || hasApiKey('perplexity');
};

/**
 * Get all configured providers
 */
export const getConfiguredProviders = (): AIProvider[] => {
  const providers: AIProvider[] = [];
  
  if (hasApiKey('openai')) providers.push('openai');
  if (hasApiKey('anthropic')) providers.push('anthropic');
  if (hasApiKey('perplexity')) providers.push('perplexity');
  
  return providers;
};
