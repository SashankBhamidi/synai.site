import { AIModel, ModelGroup } from "@/types/models";

export const modelsByProvider: ModelGroup[] = [
  {
    provider: "OpenAI",
    models: [
      // Flagship Chat Models
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
        provider: "OpenAI",
        category: "Flagship Chat",
        description: "Long-context, complex tasks, advanced programming",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o",
        provider: "OpenAI",
        category: "Flagship Chat",
        description: "Multimodal, fast, creative, instruction-following",
      },
      {
        id: "chatgpt-4o",
        name: "ChatGPT-4o",
        provider: "OpenAI",
        category: "Flagship Chat",
        description: "Used in ChatGPT, multimodal",
      },
      // Multimodal Models
      {
        id: "gpt-4o-audio",
        name: "GPT-4o Audio",
        provider: "OpenAI",
        category: "Multimodal",
        description: "Audio input/output, conversational AI",
      },
      // Reasoning Models
      {
        id: "o3",
        name: "o3",
        provider: "OpenAI",
        category: "Reasoning",
        description: "Most powerful reasoning, logic, science, coding",
      },
      {
        id: "o3-pro",
        name: "o3 Pro",
        provider: "OpenAI",
        category: "Reasoning Pro",
        description: "Enhanced compute for even better responses",
      },
      {
        id: "o3-mini",
        name: "o3 Mini",
        provider: "OpenAI",
        category: "Reasoning Mini",
        description: "Smaller, faster, cost-effective reasoning",
      },
      {
        id: "o4-mini",
        name: "o4 Mini",
        provider: "OpenAI",
        category: "Reasoning Mini",
        description: "Fast, affordable, excels in math/coding/visual tasks",
      },
      // Cost-Optimized Models
      {
        id: "gpt-4.1-mini",
        name: "GPT-4.1 Mini",
        provider: "OpenAI",
        category: "Cost-Optimized",
        description: "Smaller, cheaper alternative for many tasks",
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
      return availableModels.find(model => model.id === 'gpt-4.1') || 
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

// Define category ordering for each provider
const categoryOrder: Record<string, string[]> = {
  'OpenAI': ['Flagship Chat', 'Multimodal', 'Reasoning', 'Reasoning Pro', 'Reasoning Mini', 'Cost-Optimized'],
  'Anthropic': ['Claude 4', 'Claude 3.7', 'Claude 3.5', 'Claude 3'],
  'Perplexity': ['Search', 'Reasoning', 'Research', 'Chat']
};

// Get models grouped by category for a specific provider
export const getModelsByCategory = (provider: string): Record<string, AIModel[]> => {
  const allModels = getAvailableModelsForProvider(provider);
  const grouped = allModels.reduce<Record<string, AIModel[]>>((acc, model) => {
    const category = model.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(model);
    return acc;
  }, {});
  
  // Return in the defined order for this provider
  const orderedCategories = categoryOrder[provider] || Object.keys(grouped).sort();
  const orderedGrouped: Record<string, AIModel[]> = {};
  
  orderedCategories.forEach(category => {
    if (grouped[category]) {
      orderedGrouped[category] = grouped[category];
    }
  });
  
  // Add any categories not in the predefined order
  Object.keys(grouped).forEach(category => {
    if (!orderedGrouped[category]) {
      orderedGrouped[category] = grouped[category];
    }
  });
  
  return orderedGrouped;
};
