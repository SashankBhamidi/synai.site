import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, AIModel } from "@/types";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { ProviderSelector } from "./ProviderSelector";
import { LoadingIndicator } from "./LoadingIndicator";
import { TypingIndicator } from "./TypingIndicator";
import { SettingsDialog } from "./SettingsDialog";
import { ModelSelectionDialog } from "./ModelSelectionDialog";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";
import { ThemeToggle } from "./ThemeToggle";
import { HelpDialog } from "./HelpDialog";
import { WelcomeTooltip } from "./WelcomeTooltip";
import { getDefaultModel, getAvailableModelsForProvider, getDefaultModelForProvider, modelsByProvider } from "@/data/models";
import { Button } from "@/components/ui/button";
import { Trash2, MessagesSquare, Bot as LucideBot } from "lucide-react";
import { sendAiMessage } from "@/services/aiService";
import { hasApiKey, getConfiguredProviders } from "@/utils/apiKeyStorage";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  saveConversation, 
  getConversations, 
  getConversationMessages, 
  getCurrentConversation,
  createNewConversation,
  setCurrentConversation,
  generateConversationTitle,
} from "@/utils/conversationStorage";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(getDefaultModel());
  const [selectedProvider, setSelectedProvider] = useState<string>(getDefaultModel().provider);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Use settings from context
  const { temperature, enableMemory } = useSettings();

  // Initialize conversation
  useEffect(() => {
    const loadInitialConversation = async () => {
      const currentId = getCurrentConversation();
      const existingConversations = getConversations();
      
      console.log('Loading initial conversation:', { currentId, existingConversationsCount: existingConversations.length });
      
      if (currentId) {
        // Load existing current conversation
        setCurrentConversation(currentId);
        const existingMessages = getConversationMessages(currentId);
        setMessages(existingMessages);
        console.log('Loaded current conversation with messages:', existingMessages.length);
      } else if (existingConversations.length > 0) {
        // If there's no current conversation but conversations exist, load the most recent one
        const mostRecentConversation = existingConversations.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        
        setCurrentConversation(mostRecentConversation.id);
        setCurrentConversation(mostRecentConversation.id);
        const existingMessages = getConversationMessages(mostRecentConversation.id);
        setMessages(existingMessages);
        console.log('Loaded most recent conversation with messages:', existingMessages.length);
      } else {
        // Only create a new conversation if there are no existing conversations
        const newConversation = createNewConversation();
        setCurrentConversation(newConversation.id);
        console.log('Created new conversation (no existing conversations found)');
      }
    };
    
    loadInitialConversation();
    
    // Listen for conversation changes
    const handleConversationChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const conversationId = customEvent.detail;
      
      console.log('Conversation change event received:', conversationId);
      
      // Save current conversation before switching
      if (currentConversation && messages.length > 0) {
        const conversations = getConversations();
        const conversation = conversations.find(c => c.id === currentConversation);
        if (conversation) {
          saveConversation(conversation, messages);
          console.log('Saved current conversation before switching');
        }
      }
      
      // Switch to new conversation
      setCurrentConversation(conversationId);
      const conversationMessages = getConversationMessages(conversationId);
      setMessages(conversationMessages);
      console.log('Switched to conversation with messages:', conversationMessages.length);
    };
    
    window.addEventListener('conversation-changed', handleConversationChange);
    
    return () => {
      window.removeEventListener('conversation-changed', handleConversationChange);
    };
  }, []);

  // When selected provider changes, update the model to the default for that provider
  useEffect(() => {
    const defaultModelForProvider = getDefaultModelForProvider(selectedProvider);
    setSelectedModel(defaultModelForProvider);
    console.log(`Changed model to ${defaultModelForProvider.name} from provider ${selectedProvider}`);
  }, [selectedProvider]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save messages whenever they change
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      const conversations = getConversations();
      const conversation = conversations.find(c => c.id === currentConversation);
      
      if (conversation) {
        if (conversation.title === "New conversation" && messages.length > 0) {
          const firstUserMsg = messages.find(m => m.role === "user");
          if (firstUserMsg) {
            const newTitle = generateConversationTitle(firstUserMsg.content);
            conversation.title = newTitle;
          }
        }
        
        saveConversation(conversation, messages);
        console.log('Saved conversation with messages:', messages.length);
      }
    }
  }, [messages, currentConversation]);

  const generateConversationTitle = (userMessage: string): string => {
    // Generate a smart title from the first user message
    const words = userMessage.split(' ').slice(0, 6); // Take first 6 words
    let title = words.join(' ');
    
    // If it's too long, truncate
    if (title.length > 40) {
      title = title.substring(0, 37) + "...";
    }
    
    // If it's too short, add more context
    if (title.length < 10 && userMessage.length > title.length) {
      title = userMessage.substring(0, 37) + (userMessage.length > 37 ? "..." : "");
    }
    
    return title || "New conversation";
  };

  const convertMessagesToApiFormat = (messages: Message[]) => {
    // Use enableMemory setting to control whether to send full conversation context
    if (!enableMemory) {
      // Only send the current message without context
      const lastMessage = messages[messages.length - 1];
      return lastMessage ? [{
        role: lastMessage.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: lastMessage.content
      }] : [];
    }
    
    // Convert all messages to API format, preserving conversation context
    const apiMessages = messages
      .filter(msg => msg.role !== 'system') // Only filter out system messages (errors)
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content: msg.content
      }));
    
    console.log('Converting messages to API format:', {
      originalCount: messages.length,
      apiCount: apiMessages.length,
      memoryEnabled: enableMemory,
      messages: apiMessages
    });
    
    return apiMessages;
  };

  const handleSendMessage = async (content: string, isRegeneration: boolean = false) => {
    if (!isRegeneration) {
      setInputValue("");
    }
    
    if (!currentConversation) {
      const newConversation = createNewConversation();
      // Generate a better title from the first message
      const title = generateConversationTitle(content);
      newConversation.title = title;
      setCurrentConversation(newConversation.id);
    }
    
    let updatedMessages = messages;
    
    if (!isRegeneration) {
      const userMessage: Message = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      
      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
    }
    
    setIsLoading(true);

    try {
      const provider = selectedProvider.toLowerCase();
      const useSimulatedResponse = !hasApiKey(provider as any);
      
      const apiMessages = convertMessagesToApiFormat(updatedMessages);
      console.log('Sending to AI with settings:', { 
        messageCount: apiMessages.length, 
        provider, 
        model: selectedModel.id,
        temperature,
        memoryEnabled: enableMemory,
        fullContext: enableMemory
      });
      
      // Use temperature from settings with some randomness for regeneration
      const requestOptions = {
        message: content,
        model: selectedModel.id,
        temperature: temperature + (isRegeneration ? Math.random() * 0.2 : 0),
        simulateResponse: useSimulatedResponse,
        messages: apiMessages
      };

      const response = await sendAiMessage(provider, requestOptions);

      const aiMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        model: selectedModel,
        regenerationCount: isRegeneration ? (messages[messages.length - 1]?.regenerationCount || 0) + 1 : 0
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI provider:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: "system",
        content: error instanceof Error ? error.message : 'Failed to get AI response. Please try again.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Prevent multiple regenerations at once
    if (isRegenerating || isLoading) return;
    
    setIsRegenerating(true);
    
    try {
      // Remove the last AI response
      const messagesWithoutLastAI = messages.slice(0, -1);
      setMessages(messagesWithoutLastAI);
      
      // Get the last user message
      const lastUserMessage = messagesWithoutLastAI[messagesWithoutLastAI.length - 1];
      if (lastUserMessage && lastUserMessage.role === "user") {
        await handleSendMessage(lastUserMessage.content, true);
      }
    } catch (error) {
      console.error('Error during regeneration:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleClearChat = () => {
    const newConversation = createNewConversation();
    setCurrentConversation(newConversation.id);
    setMessages([]);
    toast.success("Chat cleared");
    
    // Dispatch conversation change event
    window.dispatchEvent(new CustomEvent('conversation-changed', { detail: newConversation.id }));
  };
  
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleProviderChange = (provider: string) => {
    console.log(`Changing provider to: ${provider}`);
    setSelectedProvider(provider);
  };

  // We're no longer using keyboard shortcuts
  useKeyboardShortcuts([]);

  useEffect(() => {
    const configuredProviders = getConfiguredProviders();
    if (configuredProviders.length > 0) {
      console.log('Configured AI providers:', configuredProviders);
    } else {
      console.log('No API keys configured. Using simulated responses.');
    }
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10">
        <h2 className="text-lg font-medium">Chat</h2>
        
        <div className="flex items-center gap-2">
          <div className={`w-40 ${isMobile ? 'hidden sm:block' : ''}`}>
            <ProviderSelector 
              selectedProvider={selectedProvider}
              onSelectProvider={handleProviderChange}
            />
          </div>
          
          <div className={`w-40 ${isMobile ? 'hidden sm:block' : ''}`}>
            <ModelSelector 
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
            />
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleClearChat}
            className="rounded-full h-8 w-8"
            title="Clear chat"
          >
            <Trash2 size={16} />
            <span className="sr-only">Clear chat</span>
          </Button>
          
          <HelpDialog />
          <SettingsDialog />
          <ThemeToggle />
        </div>
      </header>
      
      {/* Scrollable Content - This is the only part that should scroll */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
        ref={messagesContainerRef}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-radial from-primary/30 to-transparent flex items-center justify-center">
              <MessagesSquare size={32} className="text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Welcome to Synthesis AI</h2>
            <p className="text-muted-foreground max-w-md">
              Ask anything or start a conversation with advanced AI models from different providers.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageItem 
              key={message.id} 
              message={message} 
              onRegenerate={handleRegenerateResponse}
              isLastMessage={index === messages.length - 1}
            />
          ))
        )}
        
        {(isLoading || isRegenerating) && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading} 
          value={inputValue}
          onChange={handleInputChange}
        />
        <div className="mt-2 flex justify-between items-center text-xs">
          <div className="text-muted-foreground flex items-center">
            <span>Model: {selectedModel.name} ({selectedModel.provider})</span>
            {getConfiguredProviders().length === 0 && (
              <span className="ml-2 text-yellow-500">(Using simulated responses)</span>
            )}
            {!enableMemory && (
              <span className="ml-2 text-orange-500">(Memory disabled)</span>
            )}
          </div>
          <div className="text-muted-foreground">
            <span className="opacity-70">Powered by <a href="https://cygenhost.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Cygen Host</a></span>
          </div>
        </div>
      </div>
      
      {/* Add the welcome tooltip */}
      <WelcomeTooltip />
    </div>
  );
}

function Bot(props: any) {
  return (
    <LucideBot {...props} />
  );
}
