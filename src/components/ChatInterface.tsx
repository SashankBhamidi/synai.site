import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, AIModel } from "@/types";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { ProviderSelector } from "./ProviderSelector";
import { TypingIndicator } from "./TypingIndicator";
import { SettingsDialog } from "./SettingsDialog";
import { ThemeToggle } from "./ThemeToggle";
import { HelpDialog } from "./HelpDialog";
import { WelcomeTooltip } from "./WelcomeTooltip";
import { getDefaultModel, getDefaultModelForProvider } from "@/data/models";
import { Button } from "@/components/ui/button";
import { Trash2, MessagesSquare } from "lucide-react";
import { sendAiMessage } from "@/services/aiService";
import { hasApiKey, getConfiguredProviders } from "@/utils/apiKeyStorage";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/contexts/SettingsContext";
import { 
  getConversations,
  getConversationMessages,
  getCurrentConversation,
  getOrCreateConversation,
  saveConversation,
  createConversation,
  setCurrentConversation,
  CONVERSATION_EVENTS
} from "@/utils/conversationStorage";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(getDefaultModel());
  const [selectedProvider, setSelectedProvider] = useState<string>(getDefaultModel().provider);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // Use settings from context
  const { temperature, enableMemory } = useSettings();

  // Initialize conversation system
  useEffect(() => {
    const initializeConversation = () => {
      const currentId = getCurrentConversation();
      const conversations = getConversations();
      
      console.log('Initializing conversation system:', { currentId, conversationCount: conversations.length });
      
      if (currentId && conversations.find(c => c.id === currentId)) {
        // Load existing current conversation
        setCurrentConversationId(currentId);
        const conversationMessages = getConversationMessages(currentId);
        setMessages(conversationMessages);
        console.log('Loaded current conversation:', currentId, 'with', conversationMessages.length, 'messages');
      } else if (conversations.length > 0) {
        // Switch to most recent conversation
        const mostRecent = conversations[0];
        setCurrentConversation(mostRecent.id);
        setCurrentConversationId(mostRecent.id);
        const conversationMessages = getConversationMessages(mostRecent.id);
        setMessages(conversationMessages);
        console.log('Loaded most recent conversation:', mostRecent.id, 'with', conversationMessages.length, 'messages');
      } else {
        // No conversations exist - start fresh (don't create one yet)
        setCurrentConversationId(null);
        setMessages([]);
        console.log('No conversations found - starting fresh');
      }
    };

    initializeConversation();
  }, []);

  // Listen for conversation events
  useEffect(() => {
    const handleConversationSwitched = (event: CustomEvent) => {
      const { conversationId } = event.detail;
      console.log('Conversation switched event:', conversationId);
      
      // Save current conversation before switching
      if (currentConversationId && messages.length > 0) {
        const conversations = getConversations();
        const currentConversation = conversations.find(c => c.id === currentConversationId);
        if (currentConversation) {
          saveConversation(currentConversation, messages);
          console.log('Saved current conversation before switching');
        }
      }
      
      // Load new conversation
      setCurrentConversationId(conversationId);
      const newMessages = getConversationMessages(conversationId);
      setMessages(newMessages);
      console.log('Switched to conversation:', conversationId, 'with', newMessages.length, 'messages');
    };

    const handleConversationDeleted = (event: CustomEvent) => {
      const { conversationId, data } = event.detail;
      console.log('Conversation deleted event:', conversationId, data);
      
      if (conversationId === currentConversationId) {
        if (data.newCurrentId) {
          // Switch to new conversation
          setCurrentConversationId(data.newCurrentId);
          const newMessages = getConversationMessages(data.newCurrentId);
          setMessages(newMessages);
        } else {
          // No conversations left
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    };

    const handleConversationsCleared = () => {
      console.log('All conversations cleared');
      setCurrentConversationId(null);
      setMessages([]);
    };

    // Add event listeners
    window.addEventListener(CONVERSATION_EVENTS.SWITCHED, handleConversationSwitched as EventListener);
    window.addEventListener(CONVERSATION_EVENTS.DELETED, handleConversationDeleted as EventListener);
    window.addEventListener(CONVERSATION_EVENTS.CLEARED, handleConversationsCleared);

    return () => {
      window.removeEventListener(CONVERSATION_EVENTS.SWITCHED, handleConversationSwitched as EventListener);
      window.removeEventListener(CONVERSATION_EVENTS.DELETED, handleConversationDeleted as EventListener);
      window.removeEventListener(CONVERSATION_EVENTS.CLEARED, handleConversationsCleared);
    };
  }, [currentConversationId, messages]);

  // Auto-save messages when they change
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const conversations = getConversations();
      const conversation = conversations.find(c => c.id === currentConversationId);
      
      if (conversation) {
        // Debounce saves
        const timeoutId = setTimeout(() => {
          saveConversation(conversation, messages);
          console.log('Auto-saved conversation:', currentConversationId, 'with', messages.length, 'messages');
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [currentConversationId, messages]);

  // Save conversation before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentConversationId && messages.length > 0) {
        const conversations = getConversations();
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation) {
          saveConversation(conversation, messages);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save on unmount
      handleBeforeUnload();
    };
  }, [currentConversationId, messages]);

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
      memoryEnabled: enableMemory
    });
    
    return apiMessages;
  };

  const handleSendMessage = async (content: string, isRegeneration: boolean = false) => {
    if (!isRegeneration) {
      setInputValue("");
    }
    
    // Get or create conversation - this ensures every message has a conversation
    const { conversation, isNew } = getOrCreateConversation(content);
    
    if (isNew || currentConversationId !== conversation.id) {
      // Save current conversation if switching
      if (currentConversationId && messages.length > 0) {
        const conversations = getConversations();
        const currentConversation = conversations.find(c => c.id === currentConversationId);
        if (currentConversation) {
          saveConversation(currentConversation, messages);
        }
      }
      
      // Switch to new/different conversation
      setCurrentConversationId(conversation.id);
      if (isNew) {
        setMessages([]);
        console.log('Created new conversation:', conversation.id, conversation.title);
      } else {
        const existingMessages = getConversationMessages(conversation.id);
        setMessages(existingMessages);
        console.log('Switched to existing conversation:', conversation.id);
      }
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
      const useSimulatedResponse = !hasApiKey(provider as 'openai' | 'anthropic' | 'perplexity');
      
      const apiMessages = convertMessagesToApiFormat(updatedMessages);
      console.log('Sending to AI:', { 
        provider, 
        model: selectedModel.id,
        messageCount: apiMessages.length,
        temperature,
        memoryEnabled: enableMemory
      });
      
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
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Immediately save the conversation with new messages
      saveConversation(conversation, finalMessages);
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
    // Save current conversation before clearing
    if (currentConversationId && messages.length > 0) {
      const conversations = getConversations();
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        saveConversation(conversation, messages);
      }
    }
    
    // Create new conversation
    const newConversation = createConversation();
    setCurrentConversationId(newConversation.id);
    setMessages([]);
    toast.success("New chat started");
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
            title="New chat"
          >
            <Trash2 size={16} />
            <span className="sr-only">New chat</span>
          </Button>
          
          <HelpDialog />
          <SettingsDialog />
          <ThemeToggle />
        </div>
      </header>
      
      {/* Scrollable Content */}
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