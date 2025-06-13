
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

