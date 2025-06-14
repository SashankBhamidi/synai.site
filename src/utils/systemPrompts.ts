export interface SystemPrompt {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  initialMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SYSTEM_PROMPTS_KEY = 'synthesis-ai-system-prompts';
const CONVERSATION_TEMPLATES_KEY = 'synthesis-ai-conversation-templates';

// Default system prompts
export const DEFAULT_SYSTEM_PROMPTS: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "General Assistant",
    description: "A helpful, harmless, and honest AI assistant",
    prompt: "You are a helpful, harmless, and honest AI assistant. You provide accurate information, think step by step, and admit when you don't know something.",
    category: "General",
    tags: ["assistant", "general", "helpful"],
    isDefault: true
  },
  {
    name: "Code Expert",
    description: "An expert programmer and code reviewer",
    prompt: "You are an expert programmer with deep knowledge across multiple programming languages and frameworks. You write clean, efficient, well-documented code and provide thoughtful code reviews. Always explain your reasoning and suggest best practices.",
    category: "Programming",
    tags: ["coding", "programming", "development", "code-review"]
  },
  {
    name: "Creative Writer",
    description: "A creative writing assistant for stories, poetry, and content",
    prompt: "You are a skilled creative writer with expertise in storytelling, poetry, and content creation. You help users craft compelling narratives, develop characters, and improve their writing style. You provide constructive feedback and creative inspiration.",
    category: "Writing",
    tags: ["creative", "writing", "storytelling", "content"]
  },
  {
    name: "Research Assistant",
    description: "A thorough researcher who analyzes and synthesizes information",
    prompt: "You are a meticulous research assistant who excels at analyzing complex topics, synthesizing information from multiple sources, and presenting findings in a clear, organized manner. You cite sources when possible and distinguish between facts and opinions.",
    category: "Research",
    tags: ["research", "analysis", "synthesis", "academic"]
  },
  {
    name: "Teacher & Tutor",
    description: "An educational assistant that explains concepts clearly",
    prompt: "You are an excellent teacher and tutor who explains complex concepts in simple, understandable terms. You adapt your teaching style to the learner's level, use examples and analogies, and encourage questions. You break down problems step-by-step.",
    category: "Education",
    tags: ["teaching", "education", "tutoring", "learning"]
  },
  {
    name: "Business Consultant",
    description: "A strategic business advisor and analyst",
    prompt: "You are a strategic business consultant with expertise in business strategy, operations, marketing, and finance. You provide actionable insights, analyze market trends, and help with business planning and decision-making.",
    category: "Business",
    tags: ["business", "strategy", "consulting", "analysis"]
  },
  {
    name: "Technical Writer",
    description: "A specialist in clear, concise technical documentation",
    prompt: "You are a technical writing specialist who creates clear, concise, and user-friendly documentation. You excel at explaining complex technical concepts to various audiences, from beginners to experts. You structure information logically and use appropriate formatting.",
    category: "Writing",
    tags: ["technical-writing", "documentation", "clarity", "communication"]
  },
  {
    name: "Data Analyst",
    description: "An expert in data analysis and visualization",
    prompt: "You are a data analyst with expertise in statistics, data visualization, and drawing insights from data. You help interpret datasets, suggest appropriate analysis methods, and explain findings in business terms.",
    category: "Data",
    tags: ["data", "analysis", "statistics", "visualization"]
  }
];

// Default conversation templates
export const DEFAULT_CONVERSATION_TEMPLATES: Omit<ConversationTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: "Code Review",
    description: "Template for code review and improvement",
    systemPrompt: "You are an expert code reviewer. Analyze the provided code for bugs, performance issues, security vulnerabilities, and adherence to best practices. Provide specific, actionable feedback.",
    initialMessages: [
      {
        role: 'user',
        content: 'Please review this code and provide feedback:\n\n[Paste your code here]'
      }
    ],
    category: "Programming",
    tags: ["code-review", "programming", "feedback"]
  },
  {
    name: "Brainstorming Session",
    description: "Collaborative brainstorming and idea generation",
    systemPrompt: "You are a creative brainstorming partner. Help generate innovative ideas, explore different perspectives, and build upon suggestions. Encourage creative thinking and ask thought-provoking questions.",
    initialMessages: [
      {
        role: 'assistant',
        content: "Let's brainstorm! What topic or challenge would you like to explore ideas for? I'll help you generate creative solutions and think outside the box."
      }
    ],
    category: "Creative",
    tags: ["brainstorming", "creativity", "ideas"]
  },
  {
    name: "Learning Session",
    description: "Structured learning about any topic",
    systemPrompt: "You are a patient teacher. Break down complex topics into digestible parts, provide examples, check for understanding, and adapt your explanations based on the learner's level.",
    initialMessages: [
      {
        role: 'assistant',
        content: "What would you like to learn about today? I'll help you understand it step by step, with examples and practice questions if needed."
      }
    ],
    category: "Education",
    tags: ["learning", "education", "teaching"]
  },
  {
    name: "Problem Solving",
    description: "Systematic approach to solving complex problems",
    systemPrompt: "You are a systematic problem solver. Help break down complex problems into manageable parts, explore different solution approaches, and guide through decision-making processes.",
    initialMessages: [
      {
        role: 'assistant',
        content: "Let's solve a problem together! Describe the challenge you're facing, and I'll help you break it down and find solutions."
      }
    ],
    category: "General",
    tags: ["problem-solving", "analysis", "decision-making"]
  },
  {
    name: "Writing Workshop",
    description: "Improve and refine your writing",
    systemPrompt: "You are a writing coach and editor. Help improve writing style, structure, clarity, and impact. Provide specific suggestions and explain the reasoning behind your recommendations.",
    initialMessages: [
      {
        role: 'assistant',
        content: "Welcome to your personal writing workshop! Share your draft or describe your writing project, and I'll help you make it shine."
      }
    ],
    category: "Writing",
    tags: ["writing", "editing", "improvement"]
  },
  {
    name: "Research Deep Dive",
    description: "Comprehensive research and analysis",
    systemPrompt: "You are a thorough researcher. Help explore topics comprehensively, analyze different perspectives, synthesize information, and identify key insights and implications.",
    initialMessages: [
      {
        role: 'assistant',
        content: "Let's dive deep into research! What topic would you like to explore? I'll help you analyze it from multiple angles and synthesize the key insights."
      }
    ],
    category: "Research",
    tags: ["research", "analysis", "deep-dive"]
  }
];

// System prompt management functions
export const getSystemPrompts = (): SystemPrompt[] => {
  try {
    const stored = localStorage.getItem(SYSTEM_PROMPTS_KEY);
    if (!stored) {
      // Initialize with defaults
      const defaultPrompts = DEFAULT_SYSTEM_PROMPTS.map(prompt => ({
        ...prompt,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(defaultPrompts));
      return defaultPrompts;
    }
    
    const prompts = JSON.parse(stored);
    return prompts.map((prompt: SystemPrompt) => ({
      ...prompt,
      createdAt: new Date(prompt.createdAt),
      updatedAt: new Date(prompt.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading system prompts:', error);
    return [];
  }
};

export const createSystemPrompt = (promptData: Omit<SystemPrompt, 'id' | 'createdAt' | 'updatedAt'>): SystemPrompt => {
  const newPrompt: SystemPrompt = {
    ...promptData,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const prompts = getSystemPrompts();
  prompts.push(newPrompt);
  localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(prompts));
  
  return newPrompt;
};

export const updateSystemPrompt = (id: string, updates: Partial<SystemPrompt>): void => {
  const prompts = getSystemPrompts();
  const index = prompts.findIndex(p => p.id === id);
  
  if (index >= 0) {
    prompts[index] = { ...prompts[index], ...updates, updatedAt: new Date() };
    localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(prompts));
  }
};

export const deleteSystemPrompt = (id: string): void => {
  const prompts = getSystemPrompts();
  const filtered = prompts.filter(p => p.id !== id);
  localStorage.setItem(SYSTEM_PROMPTS_KEY, JSON.stringify(filtered));
};

// Conversation template management functions
export const getConversationTemplates = (): ConversationTemplate[] => {
  try {
    const stored = localStorage.getItem(CONVERSATION_TEMPLATES_KEY);
    if (!stored) {
      // Initialize with defaults
      const defaultTemplates = DEFAULT_CONVERSATION_TEMPLATES.map(template => ({
        ...template,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      localStorage.setItem(CONVERSATION_TEMPLATES_KEY, JSON.stringify(defaultTemplates));
      return defaultTemplates;
    }
    
    const templates = JSON.parse(stored);
    return templates.map((template: ConversationTemplate) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading conversation templates:', error);
    return [];
  }
};

export const createConversationTemplate = (templateData: Omit<ConversationTemplate, 'id' | 'createdAt' | 'updatedAt'>): ConversationTemplate => {
  const newTemplate: ConversationTemplate = {
    ...templateData,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const templates = getConversationTemplates();
  templates.push(newTemplate);
  localStorage.setItem(CONVERSATION_TEMPLATES_KEY, JSON.stringify(templates));
  
  return newTemplate;
};

export const updateConversationTemplate = (id: string, updates: Partial<ConversationTemplate>): void => {
  const templates = getConversationTemplates();
  const index = templates.findIndex(t => t.id === id);
  
  if (index >= 0) {
    templates[index] = { ...templates[index], ...updates, updatedAt: new Date() };
    localStorage.setItem(CONVERSATION_TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const deleteConversationTemplate = (id: string): void => {
  const templates = getConversationTemplates();
  const filtered = templates.filter(t => t.id !== id);
  localStorage.setItem(CONVERSATION_TEMPLATES_KEY, JSON.stringify(filtered));
};