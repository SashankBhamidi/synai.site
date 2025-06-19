import { AIModel, ModelGroup } from "@/types/models";

export const modelsByProvider: ModelGroup[] = [
  {
    provider: "OpenAI",
    models: [
      // GPT-4 Series
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "OpenAI",
        category: "GPT-4",
        description: "Flagship multimodal model, very fast and cost-effective",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        category: "GPT-4",
        description: "Smaller GPT-4o, faster and cheaper for lightweight tasks",
      },
      {
        id: "gpt-4",
        name: "GPT-4",
        provider: "OpenAI",
        category: "GPT-4",
        description: "Original GPT-4, strong reasoning, coding, and creative writing",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        provider: "OpenAI",
        category: "GPT-4",
        description: "Cheaper and faster than Standard GPT-4",
      },
      // Reasoning Models
      {
        id: "o1",
        name: "O1",
        provider: "OpenAI",
        category: "Reasoning",
        description: "Reasoning-optimized model, excels at logic and math",
      },
      {
        id: "o1-mini",
        name: "O1 Mini",
        provider: "OpenAI",
        category: "Reasoning",
        description: "Smaller, faster version of O1 for quick reasoning tasks",
      },
    ],
  },
  {
    provider: "Anthropic",
    models: [
      // Claude 4 Series - Latest Generation
      {
        id: "claude-opus-4-20250514",
        name: "Claude Opus 4",
        provider: "Anthropic",
        category: "Claude 4",
        description: "Our most capable model with highest level of intelligence and capability",
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        provider: "Anthropic",
        category: "Claude 4",
        description: "High-performance model with high intelligence and balanced performance",
      },
      // Claude 3.5 Series - Current Generation
      // Claude 3.5 Series
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude Sonnet 3.5 v2",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Improved reasoning, faster and more capable than previous versions",
      },
      {
        id: "claude-3-5-sonnet-latest",
        name: "Claude Sonnet 3.5 v3",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Updated Claude 3.5 Sonnet with improved capabilities",
      },
      {
        id: "claude-3-5-sonnet-20240620",
        name: "Claude Sonnet 3.5",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Previous intelligent model with high level of intelligence",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude Haiku 3.5",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Intelligence at blazing speeds, our fastest model",
      },
      {
        id: "claude-3-5-haiku-latest",
        name: "Claude Haiku 3.5 v2",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Updated Haiku 3.5, better reasoning while still fast",
      },
    ],
  },
  {
    provider: "Perplexity",
    models: [
      // Search Models (with real-time web access)
      {
        id: "llama-3.1-sonar-large-128k-online",
        name: "Sonar Large Online",
        provider: "Perplexity",
        category: "Search",
        description: "Advanced search model with real-time web access and citations",
      },
      {
        id: "llama-3.1-sonar-small-128k-online",
        name: "Sonar Small Online",
        provider: "Perplexity",
        category: "Search",
        description: "Faster, cost-effective search model with web access",
      },
      {
        id: "llama-3.1-sonar-huge-128k-online",
        name: "Sonar Huge Online",
        provider: "Perplexity",
        category: "Search",
        description: "Most capable search model with comprehensive web research",
      },
      // Chat Models (without web access)
      {
        id: "llama-3.1-sonar-large-128k-chat",
        name: "Sonar Large Chat",
        provider: "Perplexity",
        category: "Chat",
        description: "Advanced chat model without search capabilities",
      },
      {
        id: "llama-3.1-sonar-small-128k-chat",
        name: "Sonar Small Chat",
        provider: "Perplexity",
        category: "Chat",
        description: "Lightweight chat model without search capabilities",
      },
      // Legacy models (keeping for compatibility)
      {
        id: "sonar-pro",
        name: "Sonar Pro (Legacy)",
        provider: "Perplexity",
        category: "Search",
        description: "Legacy model - use Sonar Large Online instead",
      },
    ],
  }
];

export const availableModels: AIModel[] = modelsByProvider.flatMap(group => group.models);

export const getDefaultModel = (): AIModel => {
  // Always default to Claude Sonnet 4 for Anthropic on fresh loads
  const claudeSonnet4 = availableModels.find(model => model.id === 'claude-sonnet-4-20250514');
  if (claudeSonnet4) {
    return claudeSonnet4;
  }
  
  // Fallback to any Anthropic model if Sonnet 4 not found
  const anthropicModel = availableModels.find(model => model.provider === 'Anthropic');
  if (anthropicModel) {
    return anthropicModel;
  }
  
  return availableModels[0]; // Final fallback
};

export const getDefaultModelForProvider = (provider: string): AIModel => {
  const lowerProvider = provider.toLowerCase();
  
  switch (lowerProvider) {
    case 'anthropic':
      return availableModels.find(model => model.id === 'claude-sonnet-4-20250514') || 
             availableModels.find(model => model.provider === 'Anthropic')!;
    case 'openai':
      return availableModels.find(model => model.id === 'gpt-4o') || 
             availableModels.find(model => model.provider === 'OpenAI')!;
    case 'perplexity':
      return availableModels.find(model => model.id === 'llama-3.1-sonar-large-128k-online') || 
             availableModels.find(model => model.provider === 'Perplexity')!;
    default:
      return getDefaultModel();
  }
};

export const saveSelectedModel = (model: AIModel): void => {
  localStorage.setItem('synthesis-ai-selected-model', model.id);
};

export const getAvailableModelsForProvider = (provider: string): AIModel[] => {
  const group = modelsByProvider.find(g => g.provider.toLowerCase() === provider.toLowerCase());
  return group?.models || [];
};

// Get models grouped by category for a specific provider
export const getModelsByCategory = (provider: string): Record<string, AIModel[]> => {
  const allModels = getAvailableModelsForProvider(provider);
  return allModels.reduce<Record<string, AIModel[]>>((acc, model) => {
    const category = model.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(model);
    return acc;
  }, {});
};
