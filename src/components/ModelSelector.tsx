
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AIModel } from "@/types/models";
import { cn } from "@/lib/utils";
import { saveSelectedModel, getModelsByCategory } from "@/data/models";
import { Separator } from "@/components/ui/separator";

interface ModelSelectorProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export function ModelSelector({ selectedModel, onSelectModel }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  
  // Get models grouped by category for the current provider
  const modelsByCategory = getModelsByCategory(selectedModel.provider);
  const categories = Object.keys(modelsByCategory); // Already ordered by getModelsByCategory

  const handleSelectModel = (model: AIModel) => {
    onSelectModel(model);
    saveSelectedModel(model);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-muted text-muted-foreground"
        >
          <span>{selectedModel.name}</span>
          <ChevronDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] p-0 bg-background border-border max-h-[400px] overflow-y-auto">
        <div className="space-y-1 p-1">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <div key={category}>
                {index > 0 && <Separator className="my-1" />}
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{category}</div>
                
                {modelsByCategory[category].map((model) => (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-md text-left text-sm hover:bg-secondary/50",
                      model.id === selectedModel.id && "bg-secondary"
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{model.description}</div>
                    </div>
                    {model.id === selectedModel.id && <Check size={16} className="text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No models available for this provider</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
