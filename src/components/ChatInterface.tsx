import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, AIModel } from "@/types";
import { MessageItem } from "./MessageItem";
import { ChatInput } from "./ChatInput";
import { ModelSelector } from "./ModelSelector";
import { ProviderSelector } from "./ProviderSelector";
import { TypingIndicator } from "./TypingIndicator";
import { SettingsDialog } from "./SettingsDialog";
import { HelpDialog } from "./HelpDialog";
import { WelcomeTooltip } from "./WelcomeTooltip";
import { ModelComparison } from "./ModelComparison";
import { UsageAnalytics } from "./UsageAnalytics";
import { SuggestionPrompts } from "./SuggestionPrompts";
import { QuickActions } from "./QuickActions";
import { ThemeCustomizer } from "./ThemeCustomizer";
import { getDefaultModel, getDefaultModelForProvider, availableModels } from "@/data/models";
import { recordMessage } from "@/utils/usageAnalytics";
import { Button } from "@/components/ui/button";
import { Trash2, MessagesSquare } from "lucide-react";
import { sendAiMessage } from "@/services/aiService";
import { hasApiKey, getConfiguredProviders } from "@/utils/apiKeyStorage";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
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
  // Get last used model from localStorage or fallback to default
  const getLastUsedModel = (): AIModel => {
    const savedModel = localStorage.getItem('synthesis-last-used-model');
    if (savedModel) {
      try {
        const parsedModel = JSON.parse(savedModel);
        // Verify the model still exists in available models
        const modelExists = availableModels.find(m => m.id === parsedModel.id && m.provider === parsedModel.provider);
        if (modelExists) {
          return parsedModel;
        }
      } catch (error) {
        console.warn('Failed to parse saved model, using default');
      }
    }
    return getDefaultModel();
  };

  const [selectedModel, setSelectedModel] = useState<AIModel>(getLastUsedModel());
  const [selectedProvider, setSelectedProvider] = useState<string>(getLastUsedModel().provider);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toggleSidebar, state: sidebarState } = useSidebar();
  
  // Use settings from context
  const { temperature, enableMemory, streamResponses } = useSettings();

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
        
        // Reset scroll position
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0;
        }
      }
    };

    const handleConversationsCleared = () => {
      console.log('All conversations cleared');
      setCurrentConversationId(null);
      setMessages([]);
      
      // Reset scroll position
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = 0;
      }
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

  // Auto-save messages when they change (with longer debounce for better performance)
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const conversations = getConversations();
      const conversation = conversations.find(c => c.id === currentConversationId);
      
      if (conversation) {
        // Longer debounce to reduce frequency of saves
        const timeoutId = setTimeout(() => {
          saveConversation(conversation, messages);
          console.log('Auto-saved conversation:', currentConversationId, 'with', messages.length, 'messages');
        }, 3000); // Increased from 1000ms to 3000ms
        
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
      if (!lastMessage) return [];
      
      const content = typeof lastMessage.content === 'string' ? lastMessage.content : String(lastMessage.content || '');
      return [{
        role: lastMessage.role === 'assistant' ? 'assistant' as const : 'user' as const,
        content
      }];
    }
    
    // Convert all messages to API format, preserving conversation context
    const apiMessages = messages
      .filter(msg => msg.role !== 'system') // Only filter out system messages (errors)
      .map(msg => {
        // Ensure content is always a string
        const content = typeof msg.content === 'string' ? msg.content : String(msg.content || '');
        return {
          role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
          content
        };
      });
    
    console.log('Converting messages to API format:', {
      originalCount: messages.length,
      apiCount: apiMessages.length,
      memoryEnabled: enableMemory
    });
    
    return apiMessages;
  };

  const handleSendMessage = async (content: string, isRegeneration: boolean = false, initialMessages?: Message[], previousRegenerationCount?: number) => {
    // Clear input value immediately but keep focus handling separate
    if (!isRegeneration && !initialMessages) {
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
    
    let updatedMessages = initialMessages || messages;
    
    if (!isRegeneration && !initialMessages) {
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
    const startTime = Date.now();

    try {
      const provider = selectedProvider.toLowerCase();
      const useSimulatedResponse = !hasApiKey(provider as 'openai' | 'anthropic' | 'perplexity');
      
      const apiMessages = convertMessagesToApiFormat(updatedMessages);
      console.log('Sending to AI:', { 
        provider, 
        model: selectedModel.id,
        messageCount: apiMessages.length,
        temperature,
        memoryEnabled: enableMemory,
        apiMessages // Debug: log the actual messages being sent
      });
      
      const requestOptions = {
        message: content,
        model: selectedModel.id,
        temperature: temperature + (isRegeneration ? Math.random() * 0.2 : 0),
        stream: streamResponses,
        simulateResponse: useSimulatedResponse,
        messages: apiMessages
      };

      const response = await sendAiMessage(provider, requestOptions);
      const responseTime = Date.now() - startTime;

      const aiMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        model: selectedModel,
        regenerationCount: isRegeneration ? (previousRegenerationCount || 0) + 1 : undefined
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);
      
      // Record usage analytics
      recordMessage({
        model: selectedModel.name,
        provider: selectedModel.provider,
        promptLength: content.length,
        responseLength: response.length,
        responseTime,
        temperature: temperature + (isRegeneration ? Math.random() * 0.2 : 0),
        isRegeneration,
        isSimulated: useSimulatedResponse
      });
      
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
      
      // Refocus the input after the message is sent (but not for edits)
      if (!isRegeneration && !initialMessages) {
        setTimeout(() => {
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.focus();
          }
        }, 100);
      }
    }
  };

  const handleRegenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Prevent multiple regenerations at once
    if (isRegenerating || isLoading) return;
    
    setIsRegenerating(true);
    
    try {
      // Find the last AI message and its regeneration count
      const lastAIMessage = messages[messages.length - 1];
      const regenerationCount = lastAIMessage?.regenerationCount || 0;
      
      // Remove the last AI response
      const messagesWithoutLastAI = messages.slice(0, -1);
      setMessages(messagesWithoutLastAI);
      
      // Get the last user message
      const lastUserMessage = messagesWithoutLastAI[messagesWithoutLastAI.length - 1];
      if (lastUserMessage && lastUserMessage.role === "user") {
        await handleSendMessage(lastUserMessage.content, true, messagesWithoutLastAI, regenerationCount);
      }
    } catch (error) {
      console.error('Error during regeneration:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleClearChat = () => {
    // Just clear the current chat messages
    setMessages([]);
    setInputValue("");
    
    // Reset to no conversation state
    setCurrentConversationId(null);
    
    // Force scroll to reset by scrolling to top
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = 0;
    }
    
    // Removed toast - cleared state is visually obvious
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    const editedMessage = messages[messageIndex];
    
    if (!editedMessage || editedMessage.role !== 'user') return;
    
    // Update the user message
    const updatedMessage = { ...editedMessage, content: newContent };
    
    // Remove all messages after the edited message (including AI responses)
    const messagesUpToEdit = messages.slice(0, messageIndex);
    const newMessages = [...messagesUpToEdit, updatedMessage];
    
    setMessages(newMessages);
    
    // Save updated conversation
    if (currentConversationId) {
      const conversations = getConversations();
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        saveConversation(conversation, newMessages);
      }
    }
    
    // Removed toast - action is self-evident from UI changes
    
    // Regenerate AI response with the edited message
    await handleSendMessage(newContent, false, newMessages);
  };

  const handleDeleteMessage = useCallback((messageId: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    setMessages(updatedMessages);
    
    // Save updated conversation
    if (currentConversationId) {
      const conversations = getConversations();
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        saveConversation(conversation, updatedMessages);
      }
    }
    
    // Removed toast - message disappearance is visual feedback enough
  }, [currentConversationId, messages]);

  const handleModelChange = (model: AIModel) => {
    console.log(`Changing model to: ${model.name} from provider ${model.provider}`);
    setSelectedModel(model);
    setSelectedProvider(model.provider);
    
    // Save last used model to localStorage
    localStorage.setItem('synthesis-last-used-model', JSON.stringify(model));
  };

  const handleProviderChange = (provider: string) => {
    console.log(`Changing provider to: ${provider}`);
    setSelectedProvider(provider);
    
    // When provider changes, update to the default model for that provider
    const defaultModelForProvider = getDefaultModelForProvider(provider);
    setSelectedModel(defaultModelForProvider);
    
    // Save last used model to localStorage
    localStorage.setItem('synthesis-last-used-model', JSON.stringify(defaultModelForProvider));
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
    <div className="flex flex-col h-screen max-h-screen overflow-hidden relative">
      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-10">
        {/* Mobile Header */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between px-3 py-3 min-h-[56px]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost" 
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 rounded-full flex-shrink-0"
                title="Toggle Sidebar"
              >
                <MessagesSquare size={18} />
              </Button>
              <h2 className="text-base font-semibold">
                Synthesis AI
              </h2>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              <SettingsDialog />
              <ThemeCustomizer />
            </div>
          </div>
          
          {/* Mobile Second Row - Model Selection */}
          <div className="flex items-center gap-3 px-3 pb-3 border-t border-border/50">
            <div className="flex-1">
              <ProviderSelector 
                selectedProvider={selectedProvider}
                onSelectProvider={handleProviderChange}
              />
            </div>
            <div className="flex-1">
              <ModelSelector 
                selectedModel={selectedModel}
                onSelectModel={handleModelChange}
              />
            </div>
          </div>
        </div>
        
        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between px-6 py-4 min-h-[68px]">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <MessagesSquare size={20} className="text-primary" />
              </div>
              <h1 className="text-xl font-semibold">Synthesis AI</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Model Selection */}
            <div className="flex items-center gap-3">
              <div className="w-32 min-w-32">
                <ProviderSelector 
                  selectedProvider={selectedProvider}
                  onSelectProvider={handleProviderChange}
                />
              </div>
              
              <div className="w-44 min-w-44">
                <ModelSelector 
                  selectedModel={selectedModel}
                  onSelectModel={handleModelChange}
                />
              </div>
            </div>
            
            {/* Divider */}
            <div className="w-px h-8 bg-border/50" />
            
            {/* Tools & Settings */}
            <div className="flex items-center gap-2">
              <UsageAnalytics />
              <ModelComparison />
              <HelpDialog />
              <SettingsDialog />
              <ThemeCustomizer />
            </div>
          </div>
        </div>
      </header>
      
      {/* Scrollable Content */}
      <div 
        className={`flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 ${messages.length > 0 ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'}`}
        ref={messagesContainerRef}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 sm:p-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border border-primary/20 shadow-lg">
              <MessagesSquare size={32} className="text-primary sm:w-10 sm:h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Welcome to Synthesis AI</h2>
            <p className="text-muted-foreground max-w-lg text-base sm:text-lg leading-relaxed">
              Engage with powerful AI models from multiple providers. Ask questions, get insights, and explore ideas.
            </p>
            <div className="mt-6 sm:mt-8 w-full max-w-4xl">
              <SuggestionPrompts 
                selectedModel={selectedModel}
                onSelectPrompt={(prompt) => {
                  setInputValue(prompt);
                  // Auto-focus the input after setting the prompt
                  setTimeout(() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) {
                      textarea.focus();
                    }
                  }, 100);
                }}
              />
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageItem 
              key={`${message.id}-${message.timestamp.getTime()}`} // Better key for React optimization
              message={message} 
              onRegenerate={handleRegenerateResponse}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              isLastMessage={index === messages.length - 1}
            />
          ))
        )}
        
        {(isLoading || isRegenerating) && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Fixed Footer */}
      <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0 z-10">
        <div className="p-2 sm:p-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            value={inputValue}
            onChange={handleInputChange}
          />
        </div>
        
        {/* Footer Info - Mobile Optimized */}
        <div className="px-2 pb-2 sm:px-4 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 text-xs">
            <div className="text-muted-foreground flex flex-wrap items-center gap-1">
              <span className="hidden sm:inline">Model: {selectedModel.name} ({selectedModel.provider})</span>
              <span className="sm:hidden">{selectedModel.name}</span>
              {getConfiguredProviders().length === 0 && (
                <span className="text-yellow-500">(Simulated)</span>
              )}
              {!enableMemory && (
                <span className="text-orange-500">(No memory)</span>
              )}
            </div>
            <div className="text-muted-foreground hidden sm:block">
              <span className="opacity-70">Powered by <a href="https://cygenhost.com" target="_blank" rel="noopener noreferrer" className="hover:underline">Cygen Host</a></span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the welcome tooltip */}
      <WelcomeTooltip />
    </div>
  );
}