
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  category?: string; // Adding category for better organization
}

export interface ModelGroup {
  provider: string;
  models: AIModel[];
}

// New interfaces for better organization
export interface ModelCategory {
  name: string;
  models: AIModel[];
}

export interface ProviderModels {
  provider: string;
  categories: ModelCategory[];
}
