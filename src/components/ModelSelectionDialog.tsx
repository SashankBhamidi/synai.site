
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { AIModel, ModelGroup } from "@/types/models";
import { modelsByProvider, saveSelectedModel } from "@/data/models";
import { hasApiKey } from "@/utils/apiKeyStorage";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ModelSelectionDialogProps {
  selectedModel: AIModel;
  onSelectModel: (model: AIModel) => void;
}

export function ModelSelectionDialog({ selectedModel, onSelectModel }: ModelSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(selectedModel.provider);

  // Filter only providers with API keys
  const availableProviders = modelsByProvider.filter(
    (group) => hasApiKey(group.provider.toLowerCase() as 'openai' | 'anthropic' | 'perplexity')
  );

  // If no providers have API keys, show all providers
  const modelsToShow = availableProviders.length > 0 
    ? availableProviders 
    : modelsByProvider;

  const handleSelectModel = (model: AIModel) => {
    onSelectModel(model);
    saveSelectedModel(model);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings size={18} />
          <span className="sr-only">Select Model</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <DialogTitle>Select AI Model</DialogTitle>
        </DialogHeader>

        {modelsToShow.length > 0 ? (
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="w-full justify-start mb-4 overflow-x-auto">
              {modelsToShow.map((group) => (
                <TabsTrigger 
                  key={group.provider} 
                  value={group.provider}
                  className="relative"
                >
                  {group.provider}
                  {!hasApiKey(group.provider.toLowerCase() as 'openai' | 'anthropic' | 'perplexity') && (
                    <Badge 
                      variant="outline" 
                      className="absolute -top-2 -right-2 text-xs px-1 py-0"
                    >
                      Demo
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {modelsToShow.map((group) => (
              <TabsContent key={group.provider} value={group.provider} className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {group.models.map((model) => (
                    <div
                      key={model.id}
                      className={cn(
                        "p-3 rounded-md cursor-pointer border hover:bg-secondary/50 transition-colors",
                        model.id === selectedModel.id && "bg-secondary border-primary"
                      )}
                      onClick={() => handleSelectModel(model)}
                    >
                      <div className="font-medium">{model.name}</div>
                      <div className="text-xs text-muted-foreground">{model.description}</div>
                    </div>
                  ))}
                </div>
                
                {!hasApiKey(group.provider.toLowerCase() as 'openai' | 'anthropic' | 'perplexity') && (
                  <div className="text-sm text-amber-500 mt-2">
                    Using demo mode. Configure API key in settings to use actual models.
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No models available.</p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
