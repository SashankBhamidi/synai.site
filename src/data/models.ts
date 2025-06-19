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
        description: "Most capable and intelligent model",
      },
      {
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        provider: "Anthropic",
        category: "Claude 4",
        description: "High-performance, balanced model",
      },
      // Claude 3.7 Series - Extended Thinking
      {
        id: "claude-3-7-sonnet-20250219",
        name: "Claude Sonnet 3.7",
        provider: "Anthropic",
        category: "Claude 3.7",
        description: "Early extended thinking, high intelligence",
      },
      // Claude 3.5 Series - Current Generation
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude Haiku 3.5",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Fastest model, optimized for speed",
      },
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude Sonnet 3.5 v2",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Upgraded version of Sonnet 3.5",
      },
      {
        id: "claude-3-5-sonnet-20240620",
        name: "Claude Sonnet 3.5",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Previous version of Sonnet 3.5",
      },
      // Claude 3 Series - Legacy Models
      {
        id: "claude-3-opus-20240229",
        name: "Claude Opus 3",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Powerful model for complex tasks",
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude Sonnet 3",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Balanced model",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude Haiku 3",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Compact and fast model",
      },
    ],
  },
  {
    provider: "Perplexity",
    models: [
      // Search Models (with real-time web access)
      {
        id: "sonar-pro",
        name: "Sonar Pro",
        provider: "Perplexity",
        category: "Search",
        description: "Advanced search, long-form content, complex reasoning (200k context)",
      },
      {
        id: "sonar",
        name: "Sonar",
        provider: "Perplexity",
        category: "Search",
        description: "Lightweight search, cost-effective, quick queries (128k context)",
      },
      // Reasoning Models (with search)
      {
        id: "sonar-reasoning-pro",
        name: "Sonar Reasoning Pro",
        provider: "Perplexity",
        category: "Reasoning",
        description: "Premier reasoning, multi-step problem solving with search (128k context)",
      },
      {
        id: "sonar-reasoning",
        name: "Sonar Reasoning",
        provider: "Perplexity",
        category: "Reasoning",
        description: "Fast real-time reasoning with search capabilities (128k context)",
      },
      // Research Models
      {
        id: "sonar-deep-research",
        name: "Sonar Deep Research",
        provider: "Perplexity",
        category: "Research",
        description: "Expert-level research, comprehensive reports with web access (128k context)",
      },
      // Chat Models (without web access)
      {
        id: "r1-1776",
        name: "R1-1776",
        provider: "Perplexity",
        category: "Chat",
        description: "Offline chat model, creative content without search (128k context)",
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
      return availableModels.find(model => model.id === 'sonar-pro') || 
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
