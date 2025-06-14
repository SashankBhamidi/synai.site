import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Zap, 
  Code, 
  Lightbulb, 
  BookOpen, 
  PenTool,
  Calculator,
  Globe,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  prompt: string;
  category: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    id: "explain-code",
    name: "Explain Code",
    description: "Analyze and explain code snippets",
    icon: Code,
    prompt: "Please explain this code in detail, including what it does, how it works, and any important concepts:",
    category: "Programming",
    color: "bg-blue-500"
  },
  {
    id: "brainstorm",
    name: "Brainstorm Ideas",
    description: "Generate creative ideas and solutions",
    icon: Lightbulb,
    prompt: "Let's brainstorm creative ideas about:",
    category: "Creative",
    color: "bg-yellow-500"
  },
  {
    id: "summarize",
    name: "Summarize Text",
    description: "Create concise summaries",
    icon: BookOpen,
    prompt: "Please provide a clear and concise summary of the following text:",
    category: "Writing",
    color: "bg-green-500"
  },
  {
    id: "write-email",
    name: "Write Email",
    description: "Compose professional emails",
    icon: PenTool,
    prompt: "Help me write a professional email about:",
    category: "Writing",
    color: "bg-purple-500"
  },
  {
    id: "solve-math",
    name: "Solve Math",
    description: "Solve mathematical problems",
    icon: Calculator,
    prompt: "Please solve this math problem step by step:",
    category: "Academic",
    color: "bg-red-500"
  },
  {
    id: "translate",
    name: "Translate",
    description: "Translate text between languages",
    icon: Globe,
    prompt: "Please translate the following text:",
    category: "Language",
    color: "bg-indigo-500"
  },
  {
    id: "improve-writing",
    name: "Improve Writing",
    description: "Enhance grammar and style",
    icon: Sparkles,
    prompt: "Please improve the grammar, clarity, and style of this text:",
    category: "Writing",
    color: "bg-pink-500"
  },
  {
    id: "create-outline",
    name: "Create Outline",
    description: "Structure ideas and content",
    icon: MessageSquare,
    prompt: "Help me create a detailed outline for:",
    category: "Planning",
    color: "bg-teal-500"
  }
];

interface QuickActionsProps {
  onSelectAction: (prompt: string) => void;
}

export function QuickActions({ onSelectAction }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const categories = Array.from(new Set(quickActions.map(action => action.category)));

  const handleActionSelect = (action: QuickAction) => {
    onSelectAction(action.prompt);
    setIsOpen(false);
    toast.success(`Applied "${action.name}" template`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap size={16} className="mr-2" />
          Quick Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose a template to get started quickly with common tasks
          </p>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {categories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quickActions
                  .filter(action => action.category === category)
                  .map(action => (
                    <div
                      key={action.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => handleActionSelect(action)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                          <action.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">{action.name}</h4>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Dropdown version for smaller spaces
export function QuickActionsDropdown({ onSelectAction }: QuickActionsProps) {
  const handleActionSelect = (action: QuickAction) => {
    onSelectAction(action.prompt);
    toast.success(`Applied "${action.name}" template`);
  };

  const categories = Array.from(new Set(quickActions.map(action => action.category)));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Zap size={16} className="mr-2" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        {categories.map((category, categoryIndex) => (
          <div key={category}>
            {categoryIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {category}
            </DropdownMenuLabel>
            {quickActions
              .filter(action => action.category === category)
              .map(action => (
                <DropdownMenuItem 
                  key={action.id}
                  onClick={() => handleActionSelect(action)}
                  className="flex items-center gap-3 py-2"
                >
                  <div className={`w-6 h-6 ${action.color} rounded flex items-center justify-center text-white flex-shrink-0`}>
                    <action.icon size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{action.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {action.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}