
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "@/components/ExternalLink";

export function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative group hover:bg-accent transition-colors"
        >
          <HelpCircle size={18} className="group-hover:scale-110 transition-transform" />
          <span className="sr-only">Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Help & Resources</DialogTitle>
          <DialogDescription>
            Learn how to get started and make the most of Synthesis AI.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="apikeys" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="usage">Using the App</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apikeys" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">OpenAI API Keys</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  To use ChatGPT and other OpenAI models, you'll need an API key from OpenAI.
                </p>
                <ol className="text-sm space-y-1.5 list-decimal pl-5">
                  <li>Create or log in to your account at <ExternalLink href="https://platform.openai.com">platform.openai.com</ExternalLink></li>
                  <li>Navigate to the API keys section</li>
                  <li>Click "Create new secret key"</li>
                  <li>Copy the key and paste it in the app's settings</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Anthropic API Keys</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  To use Claude and other Anthropic models, get an API key from Anthropic.
                </p>
                <ol className="text-sm space-y-1.5 list-decimal pl-5">
                  <li>Sign up or log in at <ExternalLink href="https://console.anthropic.com">console.anthropic.com</ExternalLink></li>
                  <li>Navigate to the API keys section in your account</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it in the app's settings</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Perplexity API Keys</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  To use Perplexity models, obtain an API key from their platform.
                </p>
                <ol className="text-sm space-y-1.5 list-decimal pl-5">
                  <li>Create or log in to your account at <ExternalLink href="https://www.perplexity.ai/settings/api">perplexity.ai</ExternalLink></li>
                  <li>Go to your account settings</li>
                  <li>Find the API section</li>
                  <li>Generate a new API key</li>
                  <li>Copy and add it to the app's settings</li>
                </ol>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="usage" className="space-y-4 py-4">
            <div>
              <h3 className="font-medium mb-2">Getting Started</h3>
              <ol className="text-sm space-y-2 list-decimal pl-5">
                <li>Add at least one API key in Settings</li>
                <li>Select your preferred AI provider from the dropdown</li>
                <li>Choose a model from that provider</li>
                <li>Type your message in the input field and press Enter</li>
              </ol>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Managing Conversations</h3>
              <ul className="text-sm space-y-2 list-disc pl-5">
                <li>Start a new conversation with the clear button</li>
                <li>Access previous conversations in the sidebar</li>
                <li>Conversations are saved locally on your device</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Privacy</h3>
              <p className="text-sm text-muted-foreground">
                All your API keys and conversations are stored locally in your browser. 
                No data is sent to our servers - only to the AI provider's API servers when you send a message.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
