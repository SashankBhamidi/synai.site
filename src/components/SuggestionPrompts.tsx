import React from 'react';
import { Button } from '@/components/ui/button';
import { AIModel } from '@/types';
import { 
  Brain, 
  Code, 
  FileText, 
  Search, 
  Lightbulb,
  MessageSquare,
  Calculator,
  Globe
} from 'lucide-react';

interface SuggestionPromptsProps {
  selectedModel: AIModel;
  onSelectPrompt: (prompt: string) => void;
}

const getPromptsForModel = (model: AIModel) => {
  const { provider, category, name } = model;
  
  // OpenAI specific prompts
  if (provider === 'OpenAI') {
    if (category === 'Reasoning' || name.includes('O1')) {
      return [
        {
          icon: Brain,
          title: "Logic Puzzle",
          prompt: "Solve this step by step: Three friends are standing in a line. Alice is not at the front. Carol is not at the back. Bob is not in the middle. What is the order from front to back?",
        },
        {
          icon: Calculator,
          title: "Math Problem",
          prompt: "Calculate the compound interest on $10,000 invested at 5% annual interest rate for 3 years, compounded quarterly. Show your work.",
        },
        {
          icon: Code,
          title: "Algorithm Design",
          prompt: "Design an efficient algorithm to find the longest palindromic substring in a given string. Explain the time complexity.",
        },
        {
          icon: FileText,
          title: "Strategic Analysis",
          prompt: "Analyze the pros and cons of remote work vs hybrid work models for a tech company with 500 employees.",
        }
      ];
    } else {
      return [
        {
          icon: Code,
          title: "Code Review",
          prompt: "Review this Python function and suggest improvements for readability and performance.",
        },
        {
          icon: FileText,
          title: "Write Summary",
          prompt: "Summarize the key points of the latest developments in artificial intelligence in 2024.",
        },
        {
          icon: Lightbulb,
          title: "Creative Writing",
          prompt: "Write a short story about a robot who discovers they can dream. Include themes of consciousness and humanity.",
        },
        {
          icon: MessageSquare,
          title: "Conversation",
          prompt: "I'm planning a career transition from marketing to data science. What steps should I take?",
        }
      ];
    }
  }
  
  // Anthropic specific prompts
  if (provider === 'Anthropic') {
    return [
      {
        icon: Brain,
        title: "Deep Analysis",
        prompt: "Analyze the philosophical implications of artificial consciousness and its potential impact on society.",
      },
      {
        icon: Code,
        title: "Code Architecture",
        prompt: "Design a scalable microservices architecture for an e-commerce platform handling 1M+ users.",
      },
      {
        icon: FileText,
        title: "Research Paper",
        prompt: "Help me outline a research paper on the environmental impact of renewable energy adoption in developing countries.",
      },
      {
        icon: Lightbulb,
        title: "Problem Solving",
        prompt: "I need to reduce my company's operational costs by 20% without laying off employees. What strategies would you recommend?",
      }
    ];
  }
  
  // Perplexity specific prompts (search-focused)
  if (provider === 'Perplexity') {
    if (category === 'Search' || category === 'Research') {
      return [
        {
          icon: Search,
          title: "Current Events",
          prompt: "What are the latest developments in artificial intelligence regulation around the world?",
        },
        {
          icon: Globe,
          title: "Market Research",
          prompt: "Research the current state of the electric vehicle market and key players in 2024.",
        },
        {
          icon: FileText,
          title: "Fact Finding",
          prompt: "Find the most recent scientific studies on the effectiveness of meditation for stress reduction.",
        },
        {
          icon: Brain,
          title: "Trend Analysis",
          prompt: "Analyze the emerging trends in remote work technology and their adoption rates.",
        }
      ];
    } else if (category === 'Reasoning') {
      return [
        {
          icon: Brain,
          title: "Research + Reasoning",
          prompt: "Research and analyze: What are the main factors contributing to the current housing affordability crisis?",
        },
        {
          icon: Calculator,
          title: "Data Analysis",
          prompt: "Find recent statistics on renewable energy adoption and calculate the projected growth rate for the next 5 years.",
        },
        {
          icon: Search,
          title: "Comparative Study",
          prompt: "Compare the healthcare systems of Nordic countries and analyze what makes them effective.",
        },
        {
          icon: Globe,
          title: "Global Insights",
          prompt: "Research and reason about the economic implications of climate change policies across different countries.",
        }
      ];
    } else {
      return [
        {
          icon: MessageSquare,
          title: "General Chat",
          prompt: "Tell me about the most interesting scientific discoveries made in the past year.",
        },
        {
          icon: Lightbulb,
          title: "Ideas & Creativity",
          prompt: "Brainstorm innovative solutions for reducing food waste in urban areas.",
        },
        {
          icon: FileText,
          title: "Explanation",
          prompt: "Explain quantum computing in simple terms and its potential real-world applications.",
        },
        {
          icon: Code,
          title: "Tech Help",
          prompt: "Help me understand the differences between React, Vue, and Angular for a new web project.",
        }
      ];
    }
  }
  
  // Default prompts
  return [
    {
      icon: MessageSquare,
      title: "General Chat",
      prompt: "Hello! How can you help me today?",
    },
    {
      icon: Code,
      title: "Coding Help",
      prompt: "I need help debugging a Python script. Can you assist?",
    },
    {
      icon: FileText,
      title: "Writing",
      prompt: "Help me write a professional email to follow up on a job application.",
    },
    {
      icon: Lightbulb,
      title: "Ideas",
      prompt: "I need creative ideas for a birthday party. Any suggestions?",
    }
  ];
};

export function SuggestionPrompts({ selectedModel, onSelectPrompt }: SuggestionPromptsProps) {
  const prompts = getPromptsForModel(selectedModel);
  
  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Suggested prompts for {selectedModel.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {selectedModel.description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
        {prompts.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          return (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-3 text-left justify-start hover:bg-accent/50 transition-colors"
              onClick={() => onSelectPrompt(suggestion.prompt)}
            >
              <div className="flex items-center gap-3 w-full">
                <IconComponent size={16} className="text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{suggestion.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.prompt.length > 60 ? suggestion.prompt.slice(0, 60) + '...' : suggestion.prompt}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}