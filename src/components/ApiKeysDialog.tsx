
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveApiKey, getApiKey, removeApiKey, AIProvider } from "@/utils/apiKeyStorage";
import { validateApiKey } from "@/services/aiService";
import { toast } from "sonner";

interface ApiKeyInputProps {
  provider: AIProvider;
  label: string;
  placeholder: string;
}

export function ApiKeysDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Key size={18} />
          <span className="sr-only">API Keys</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>API Keys Configuration</DialogTitle>
          <DialogDescription>
            Enter your API keys for AI providers. Keys are stored securely in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <Alert variant="default" className="bg-muted/50">
            <AlertDescription>
              Your API keys are stored locally in your browser and are never sent to our servers.
            </AlertDescription>
          </Alert>
          
          <ApiKeyInput 
            provider="openai" 
            label="OpenAI API Key" 
            placeholder="sk-..." 
          />
          
          <ApiKeyInput 
            provider="anthropic" 
            label="Anthropic API Key" 
            placeholder="sk-ant-..." 
          />
          
          <ApiKeyInput 
            provider="perplexity" 
            label="Perplexity API Key" 
            placeholder="pplx-..." 
          />
        </div>
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ApiKeyInput({ provider, label, placeholder }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(getApiKey(provider) || "");
  const [isValidating, setIsValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      // If key is empty, remove it
      removeApiKey(provider);
      toast.success(`Removed ${provider} API key`);
      return;
    }

    setIsValidating(true);
    try {
      const isValid = await validateApiKey(provider, apiKey);
      if (isValid) {
        saveApiKey(provider, apiKey);
        toast.success(`${provider} API key saved successfully`);
      } else {
        // Even if validation fails, give the option to save anyway
        if (window.confirm(`Could not verify ${provider} API key. Save anyway?`)) {
          saveApiKey(provider, apiKey);
          toast.success(`${provider} API key saved (unverified)`);
        } else {
          toast.error(`${provider} API key not saved`);
        }
      }
    } catch (error) {
      console.error(`Validation error for ${provider}:`, error);
      // Allow saving even when validation throws an error
      if (window.confirm(`Could not verify ${provider} API key. Save anyway?`)) {
        saveApiKey(provider, apiKey);
        toast.success(`${provider} API key saved (unverified)`);
      } else {
        toast.error(`${provider} API key not saved`);
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <Label htmlFor={`${provider}-api-key`}>{label}</Label>
        <button 
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showKey ? "Hide" : "Show"}
        </button>
      </div>
      
      <div className="flex gap-2">
        <Input 
          id={`${provider}-api-key`}
          type={showKey ? "text" : "password"} 
          value={apiKey} 
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button 
          onClick={handleSaveKey} 
          disabled={isValidating}
          size="sm"
        >
          {isValidating ? "Validating..." : apiKey ? "Save" : "Clear"}
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {apiKey ? "API key will be stored in your browser's local storage" : "No API key set"}
      </div>
    </div>
  );
}
