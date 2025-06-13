
import { Conversation, Message } from "@/types";

const CONVERSATIONS_KEY = 'synthesis-ai-conversations';
const MESSAGES_KEY_PREFIX = 'synthesis-ai-messages-';
const CURRENT_CONVERSATION_KEY = 'synthesis-ai-current-conversation';

export const getConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt)
    }));
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

export const saveConversation = (conversation: Conversation, messages: Message[]): void => {
  try {
    // Save conversation metadata
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    const updatedConversation = {
      ...conversation,
      updatedAt: new Date()
    };
    
    if (existingIndex >= 0) {
      conversations[existingIndex] = updatedConversation;
    } else {
      conversations.push(updatedConversation);
    }
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    
    // Save messages
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${conversation.id}`, JSON.stringify(messages));
    
    console.log(`Saved conversation "${conversation.title}" with ${messages.length} messages`);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

export const getConversationMessages = (conversationId: string): Message[] => {
  try {
    const stored = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${conversationId}`);
    if (!stored) return [];
    
    const messages = JSON.parse(stored);
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error loading conversation messages:', error);
    return [];
  }
};

export const createNewConversation = (): Conversation => {
  const newConversation: Conversation = {
    id: crypto.randomUUID(),
    title: "New conversation",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Set as current conversation
  localStorage.setItem(CURRENT_CONVERSATION_KEY, newConversation.id);
  
  console.log('Created new conversation:', newConversation.id);
  return newConversation;
};

export const getCurrentConversation = (): string | null => {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
};

export const setCurrentConversation = (conversationId: string): void => {
  localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
};

export const deleteConversation = (conversationId: string): void => {
  try {
    // Remove from conversations list
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    
    // Remove messages
    localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${conversationId}`);
    
    // If this was the current conversation, clear it
    const current = getCurrentConversation();
    if (current === conversationId) {
      localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
    
    console.log('Deleted conversation:', conversationId);
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
};

export const deleteAllConversations = (): void => {
  try {
    const conversations = getConversations();
    
    // Remove all conversation messages
    conversations.forEach(conv => {
      localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${conv.id}`);
    });
    
    // Clear conversations list
    localStorage.removeItem(CONVERSATIONS_KEY);
    
    // Clear current conversation
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    
    console.log('Deleted all conversations');
  } catch (error) {
    console.error('Error deleting all conversations:', error);
  }
};

export const renameConversation = (conversationId: string, newTitle: string): void => {
  try {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.title = newTitle;
      conversation.updatedAt = new Date();
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      console.log(`Renamed conversation ${conversationId} to "${newTitle}"`);
    }
  } catch (error) {
    console.error('Error renaming conversation:', error);
  }
};

export const exportConversations = (): void => {
  try {
    const conversations = getConversations();
    const exportData = {
      conversations: conversations,
      messages: {} as Record<string, Message[]>,
      exportDate: new Date().toISOString()
    };
    
    // Get all messages for each conversation
    conversations.forEach(conv => {
      exportData.messages[conv.id] = getConversationMessages(conv.id);
    });
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `synthesis-ai-conversations-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('Conversations exported successfully');
  } catch (error) {
    console.error('Error exporting conversations:', error);
    throw error;
  }
};

export const importConversations = async (file: File): Promise<void> => {
  try {
    const fileContent = await file.text();
    const importData = JSON.parse(fileContent);
    
    if (!importData.conversations || !importData.messages) {
      throw new Error('Invalid file format');
    }
    
    // Import conversations
    const existingConversations = getConversations();
    const newConversations = [...existingConversations];
    
    importData.conversations.forEach((conv: any) => {
      // Check if conversation already exists
      const existsIndex = newConversations.findIndex(existing => existing.id === conv.id);
      
      const conversation = {
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      };
      
      if (existsIndex >= 0) {
        newConversations[existsIndex] = conversation;
      } else {
        newConversations.push(conversation);
      }
      
      // Import messages for this conversation
      if (importData.messages[conv.id]) {
        const messages = importData.messages[conv.id].map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        localStorage.setItem(`${MESSAGES_KEY_PREFIX}${conv.id}`, JSON.stringify(messages));
      }
    });
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(newConversations));
    
    console.log('Conversations imported successfully');
  } catch (error) {
    console.error('Error importing conversations:', error);
    throw error;
  }
};

export const generateConversationTitle = (firstMessage: string): string => {
  try {
    // Take first 50 characters and clean up
    let title = firstMessage.trim().substring(0, 50);
    
    // Remove markdown formatting
    title = title.replace(/[#*`_~]/g, '');
    
    // If it ends mid-word, cut to last complete word
    const lastSpaceIndex = title.lastIndexOf(' ');
    if (lastSpaceIndex > 20 && title.length === 50) {
      title = title.substring(0, lastSpaceIndex);
    }
    
    // Add ellipsis if truncated
    if (firstMessage.length > title.length) {
      title += '...';
    }
    
    return title || 'New conversation';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return 'New conversation';
  }
};
