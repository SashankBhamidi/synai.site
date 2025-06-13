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
      // Legacy Models
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "OpenAI",
        category: "Legacy",
        description: "Affordable, good for chat and light reasoning",
      }
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
      // Claude 3.7 Series
      {
        id: "claude-3-7-sonnet-20250219",
        name: "Claude Sonnet 3.7",
        provider: "Anthropic",
        category: "Claude 3.7",
        description: "High-performance model with early extended thinking capabilities",
      },
      {
        id: "claude-3-7-sonnet-latest",
        name: "Claude Sonnet 3.7 (Latest)",
        provider: "Anthropic", 
        category: "Claude 3.7",
        description: "Latest Sonnet 3.7, best for advanced reasoning and coding",
      },
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
        name: "Claude Sonnet 3.5 (Latest)",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Latest Claude 3.5 Sonnet with improved capabilities",
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
        name: "Claude Haiku 3.5 (Latest)",
        provider: "Anthropic",
        category: "Claude 3.5",
        description: "Latest Haiku 3.5, better reasoning while still fast",
      },
      // Claude 3 Series - Legacy
      {
        id: "claude-3-opus-20240229",
        name: "Claude Opus 3",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Powerful model for complex tasks with top-level intelligence",
      },
      {
        id: "claude-3-opus-latest",
        name: "Claude Opus 3 (Latest)",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Latest Claude 3 Opus with top-level intelligence and understanding",
      },
      {
        id: "claude-3-sonnet-20240229",
        name: "Claude Sonnet 3",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Balanced performance/cost for general tasks",
      },
      {
        id: "claude-3-haiku-20240307",
        name: "Claude Haiku 3",
        provider: "Anthropic",
        category: "Claude 3",
        description: "Fast and compact model for near-instant responsiveness",
      }
    ],
  },
  {
    provider: "Perplexity",
    models: [
      // Search Models
      {
        id: "sonar-pro",
        name: "Sonar Pro",
        provider: "Perplexity",
        category: "Search",
        description: "Advanced search offering with grounding, supporting complex queries and follow-ups",
      },
      {
        id: "sonar",
        name: "Sonar",
        provider: "Perplexity",
        category: "Search",
        description: "Lightweight, cost-effective search model with grounding",
      },
      // Research Models
      {
        id: "sonar-deep-research",
        name: "Sonar Deep Research",
        provider: "Perplexity",
        category: "Research",
        description: "Expert-level research model conducting exhaustive searches and generating comprehensive reports",
      },
      // Reasoning Models
      {
        id: "sonar-reasoning-pro",
        name: "Sonar Reasoning Pro",
        provider: "Perplexity",
        category: "Reasoning",
        description: "Premier reasoning offering powered by DeepSeek R1 with Chain of Thought (CoT)",
      },
      {
        id: "sonar-reasoning",
        name: "Sonar Reasoning",
        provider: "Perplexity",
        category: "Reasoning",
        description: "Fast, real-time reasoning model designed for quick problem-solving with search",
      },
      // Offline Models
      {
        id: "r1-1776",
        name: "R1-1776",
        provider: "Perplexity",
        category: "Offline",
        description: "DeepSeek R1 model for uncensored, unbiased, and factual information without search",
      },
    ],
  }
];

export const availableModels: AIModel[] = modelsByProvider.flatMap(group => group.models);

export const getDefaultModel = (): AIModel => {
  const savedModelId = localStorage.getItem('synthesis-ai-selected-model');
  if (savedModelId) {
    const foundModel = availableModels.find(model => model.id === savedModelId);
    if (foundModel) {
      return foundModel;
    }
  }
  
  // Default to Claude Sonnet 4 for Anthropic
  const claudeSonnet4 = availableModels.find(model => model.id === 'claude-sonnet-4-20250514');
  if (claudeSonnet4) {
    return claudeSonnet4;
  }
  
  return availableModels[0]; // Fallback to first available model
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
