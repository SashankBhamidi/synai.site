
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { hasApiKey } from "@/utils/apiKeyStorage";
import { modelsByProvider } from "@/data/models";

interface ProviderSelectorProps {
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
}

export function ProviderSelector({ selectedProvider, onSelectProvider }: ProviderSelectorProps) {
  const [open, setOpen] = useState(false);

  const providers = modelsByProvider.map(group => ({
    name: group.provider,
    hasApiKey: hasApiKey(group.provider.toLowerCase() as 'openai' | 'anthropic' | 'perplexity')
  }));

  const handleSelectProvider = (provider: string) => {
    onSelectProvider(provider);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between border-muted text-muted-foreground"
        >
          <span>{selectedProvider}</span>
          <ChevronDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[200px] p-0 bg-background border-border">
        <div className="space-y-1 p-1">
          {providers.map((provider) => (
            <button
              key={provider.name}
              onClick={() => handleSelectProvider(provider.name)}
              className={cn(
                "w-full flex items-center gap-2 p-2 rounded-md text-left text-sm hover:bg-secondary/50",
                provider.name === selectedProvider && "bg-secondary"
              )}
            >
              <div className="flex-1 font-medium">{provider.name}</div>
              {!provider.hasApiKey && (
                <div className="text-xs text-amber-500">(Demo)</div>
              )}
              {provider.name === selectedProvider && <Check size={16} className="text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
