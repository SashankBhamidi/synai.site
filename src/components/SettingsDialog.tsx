import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { saveApiKey, getApiKey, AIProvider } from "@/utils/apiKeyStorage";
import { validateApiKey } from "@/services/aiService";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

export function SettingsDialog() {
  const {
    temperature,
    setTemperature,
    streamResponses,
    setStreamResponses,
    enableMemory,
    setEnableMemory
  } = useSettings();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative group hover:bg-accent transition-colors"
        >
          <Settings size={18} className="group-hover:scale-110 transition-transform" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 py-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="temperature">Temperature</Label>
                  <div className="text-xs text-muted-foreground">
                    Controls randomness: Lower is more deterministic, higher is more creative
                  </div>
                </div>
                <span className="text-sm font-medium">{temperature.toFixed(1)}</span>
              </div>
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[temperature]}
                onValueChange={([value]) => setTemperature(value)}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Stream responses</Label>
                  <div className="text-xs text-muted-foreground">
                    Show AI responses as they're generated
                  </div>
                </div>
                <Switch 
                  checked={streamResponses} 
                  onCheckedChange={setStreamResponses}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Memory</Label>
                  <div className="text-xs text-muted-foreground">
                    Enable chat history for context
                  </div>
                </div>
                <Switch 
                  checked={enableMemory} 
                  onCheckedChange={setEnableMemory}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="apikeys" className="py-2">
            <Alert variant="default" className="bg-muted/50 mb-6">
              <AlertDescription>
                Your API keys are stored locally in your browser and are never sent to our servers.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-6">
              <ApiKeySection 
                provider="openai" 
                label="OpenAI API Key" 
                placeholder="sk-..." 
              />
              
              <ApiKeySection 
                provider="anthropic" 
                label="Anthropic API Key" 
                placeholder="sk-ant-..." 
              />
              
              <ApiKeySection 
                provider="perplexity" 
                label="Perplexity API Key" 
                placeholder="pplx-..." 
              />
            </div>
          </TabsContent>
        </Tabs>

        <Separator />
        
        <div className="pt-2 text-center text-xs text-muted-foreground">
          <div className="flex items-center justify-center gap-1">
            <span>Synthesis AI 1.0</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ApiKeySectionProps {
  provider: AIProvider;
  label: string;
  placeholder: string;
}

function ApiKeySection({ provider, label, placeholder }: ApiKeySectionProps) {
  const [apiKey, setApiKey] = useState(getApiKey(provider) || "");
  const [isValidating, setIsValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      // If key is empty, remove it
      saveApiKey(provider, ""); // Save empty string to clear the key
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
        {getApiKey(provider) ? "API key is set and stored locally" : "No API key set"}
      </div>
    </div>
  );
}
