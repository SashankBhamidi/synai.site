import { Conversation, Message, AIModel } from "@/types";

// Storage keys
const CONVERSATIONS_KEY = 'synthesis-ai-conversations';
const MESSAGES_KEY_PREFIX = 'synthesis-ai-messages-';
const CURRENT_CONVERSATION_KEY = 'synthesis-ai-current-conversation';

// Event names for real-time updates
export const CONVERSATION_EVENTS = {
  CREATED: 'conversation-created',
  UPDATED: 'conversation-updated',
  DELETED: 'conversation-deleted',
  SWITCHED: 'conversation-switched',
  CLEARED: 'conversations-cleared'
} as const;

// Helper to dispatch conversation events
const dispatchConversationEvent = (eventType: string, conversationId?: string, data?: unknown) => {
  window.dispatchEvent(new CustomEvent(eventType, { 
    detail: { conversationId, data } 
  }));
};

// Enhanced conversation interface
interface StoredConversation extends Conversation {
  messageCount: number;
  lastMessageAt?: Date;
  lastMessage?: string;
}

/**
 * Get all conversations from storage
 */
export const getConversations = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    if (!stored) return [];
    
    const conversations = JSON.parse(stored);
    return conversations.map((conv: {
      id: string;
      title: string;
      createdAt: string;
      updatedAt: string;
      lastMessageAt?: string;
    }) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : undefined
    })).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (error) {
    console.error('Error loading conversations:', error);
    return [];
  }
};

/**
 * Get messages for a specific conversation
 */
export const getConversationMessages = (conversationId: string): Message[] => {
  try {
    const stored = localStorage.getItem(`${MESSAGES_KEY_PREFIX}${conversationId}`);
    if (!stored) return [];
    
    const messages = JSON.parse(stored);
    return messages.map((msg: {
      id: string;
      role: string;
      content: string;
      timestamp: string;
      model?: unknown;
      regenerationCount?: number;
    }) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } catch (error) {
    console.error('Error loading conversation messages:', error);
    return [];
  }
};

/**
 * Create a new conversation
 */
export const createConversation = (initialMessage?: string): Conversation => {
  const newConversation: Conversation = {
    id: crypto.randomUUID(),
    title: initialMessage ? generateConversationTitle(initialMessage) : "New conversation",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Save to conversations list
  const conversations = getConversations();
  conversations.unshift(newConversation);
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  
  // Set as current conversation
  setCurrentConversation(newConversation.id);
  
  console.log('Created new conversation:', newConversation.id, newConversation.title);
  dispatchConversationEvent(CONVERSATION_EVENTS.CREATED, newConversation.id, newConversation);
  
  return newConversation;
};

/**
 * Save conversation with messages
 */
export const saveConversation = (conversation: Conversation, messages: Message[]): void => {
  try {
    const conversations = getConversations();
    const existingIndex = conversations.findIndex(c => c.id === conversation.id);
    
    // Calculate conversation metadata
    const lastMessage = messages[messages.length - 1];
    const updatedConversation: StoredConversation = {
      ...conversation,
      updatedAt: new Date(),
      messageCount: messages.length,
      lastMessageAt: lastMessage?.timestamp,
      lastMessage: lastMessage?.content?.substring(0, 100)
    };
    
    // Update title if it's still default and we have messages
    if (conversation.title === "New conversation" && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.role === "user");
      if (firstUserMsg) {
        updatedConversation.title = generateConversationTitle(firstUserMsg.content);
      }
    }
    
    // Update conversations list
    if (existingIndex >= 0) {
      conversations[existingIndex] = updatedConversation;
    } else {
      conversations.unshift(updatedConversation);
    }
    
    // Sort by updatedAt
    conversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    localStorage.setItem(`${MESSAGES_KEY_PREFIX}${conversation.id}`, JSON.stringify(messages));
    
    dispatchConversationEvent(CONVERSATION_EVENTS.UPDATED, conversation.id, updatedConversation);
    console.log(`Saved conversation "${updatedConversation.title}" with ${messages.length} messages`);
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
};

/**
 * Delete a conversation
 */
export const deleteConversation = (conversationId: string): string | null => {
  try {
    const conversations = getConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(filtered));
    localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${conversationId}`);
    
    // If this was the current conversation, switch to another one
    const current = getCurrentConversation();
    let newCurrentId: string | null = null;
    
    if (current === conversationId) {
      if (filtered.length > 0) {
        newCurrentId = filtered[0].id;
        setCurrentConversation(newCurrentId);
      } else {
        localStorage.removeItem(CURRENT_CONVERSATION_KEY);
      }
    }
    
    dispatchConversationEvent(CONVERSATION_EVENTS.DELETED, conversationId, { newCurrentId });
    console.log('Deleted conversation:', conversationId);
    
    return newCurrentId;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return null;
  }
};

/**
 * Delete all conversations
 */
export const deleteAllConversations = (): void => {
  try {
    const conversations = getConversations();
    
    // Remove all conversation messages
    conversations.forEach(conv => {
      localStorage.removeItem(`${MESSAGES_KEY_PREFIX}${conv.id}`);
    });
    
    // Clear conversations list and current conversation
    localStorage.removeItem(CONVERSATIONS_KEY);
    localStorage.removeItem(CURRENT_CONVERSATION_KEY);
    
    dispatchConversationEvent(CONVERSATION_EVENTS.CLEARED);
    console.log('Deleted all conversations');
  } catch (error) {
    console.error('Error deleting all conversations:', error);
  }
};

/**
 * Rename a conversation
 */
export const renameConversation = (conversationId: string, newTitle: string): void => {
  try {
    const conversations = getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.title = newTitle;
      conversation.updatedAt = new Date();
      
      // Sort by updatedAt
      conversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
      dispatchConversationEvent(CONVERSATION_EVENTS.UPDATED, conversationId, conversation);
      console.log(`Renamed conversation ${conversationId} to "${newTitle}"`);
    }
  } catch (error) {
    console.error('Error renaming conversation:', error);
  }
};

/**
 * Get current conversation ID
 */
export const getCurrentConversation = (): string | null => {
  return localStorage.getItem(CURRENT_CONVERSATION_KEY);
};

/**
 * Set current conversation
 */
export const setCurrentConversation = (conversationId: string): void => {
  const previousId = getCurrentConversation();
  localStorage.setItem(CURRENT_CONVERSATION_KEY, conversationId);
  
  if (previousId !== conversationId) {
    dispatchConversationEvent(CONVERSATION_EVENTS.SWITCHED, conversationId, { previousId });
    console.log('Switched to conversation:', conversationId);
  }
};

/**
 * Get or create conversation for messaging
 */
export const getOrCreateConversation = (initialMessage?: string): { conversation: Conversation, isNew: boolean } => {
  const currentId = getCurrentConversation();
  
  if (currentId) {
    const conversations = getConversations();
    const existing = conversations.find(c => c.id === currentId);
    if (existing) {
      return { conversation: existing, isNew: false };
    }
  }
  
  // Create new conversation
  const newConversation = createConversation(initialMessage);
  return { conversation: newConversation, isNew: true };
};

/**
 * Generate conversation title from message
 */
export const generateConversationTitle = (message: string): string => {
  try {
    // Remove markdown formatting
    let title = message.replace(/[#*`_~[\]]/g, '').trim();
    
    // Take first 50 characters
    title = title.substring(0, 50);
    
    // If it ends mid-word, cut to last complete word
    const lastSpaceIndex = title.lastIndexOf(' ');
    if (lastSpaceIndex > 20 && title.length === 50) {
      title = title.substring(0, lastSpaceIndex);
    }
    
    // Add ellipsis if truncated
    if (message.length > title.length) {
      title += '...';
    }
    
    return title || 'New conversation';
  } catch (error) {
    console.error('Error generating conversation title:', error);
    return 'New conversation';
  }
};

/**
 * Export all conversations
 */
export const exportConversations = (): void => {
  try {
    const conversations = getConversations();
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      conversations: conversations,
      messages: {} as Record<string, Message[]>,
      metadata: {
        totalConversations: conversations.length,
        totalMessages: 0
      }
    };
    
    // Get all messages for each conversation
    let totalMessages = 0;
    conversations.forEach(conv => {
      const messages = getConversationMessages(conv.id);
      exportData.messages[conv.id] = messages;
      totalMessages += messages.length;
    });
    
    exportData.metadata.totalMessages = totalMessages;
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `synthesis-ai-conversations-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log(`Exported ${conversations.length} conversations with ${totalMessages} total messages`);
  } catch (error) {
    console.error('Error exporting conversations:', error);
    throw error;
  }
};

/**
 * Import conversations from file
 */
export const importConversations = async (file: File, options: { merge: boolean } = { merge: true }): Promise<{ success: boolean, imported: number, skipped: number }> => {
  try {
    const fileContent = await file.text();
    const importData = JSON.parse(fileContent);
    
    // Validate import data structure
    if (!importData.conversations || !importData.messages) {
      throw new Error('Invalid file format: missing conversations or messages');
    }
    
    const existingConversations = options.merge ? getConversations() : [];
    const existingIds = new Set(existingConversations.map(c => c.id));
    
    let imported = 0;
    let skipped = 0;
    
    // Process each conversation
    for (const conv of importData.conversations) {
      if (existingIds.has(conv.id)) {
        skipped++;
        continue;
      }
      
      // Import conversation
      const conversation: Conversation = {
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      };
      
      existingConversations.push(conversation);
      
      // Import messages if they exist
      if (importData.messages[conv.id]) {
        const messages = importData.messages[conv.id].map((msg: {
          id: string;
          role: string;
          content: string;
          timestamp: string;
          model?: unknown;
          regenerationCount?: number;
        }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        localStorage.setItem(`${MESSAGES_KEY_PREFIX}${conv.id}`, JSON.stringify(messages));
      }
      
      imported++;
    }
    
    // Sort conversations by updatedAt
    existingConversations.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(existingConversations));
    
    // Dispatch update event
    dispatchConversationEvent(CONVERSATION_EVENTS.UPDATED);
    
    console.log(`Import completed: ${imported} imported, ${skipped} skipped`);
    return { success: true, imported, skipped };
  } catch (error) {
    console.error('Error importing conversations:', error);
    throw error;
  }
};

/**
 * Search conversations
 */
export const searchConversations = (query: string): Conversation[] => {
  const conversations = getConversations();
  const lowerQuery = query.toLowerCase();
  
  return conversations.filter(conv => 
    conv.title.toLowerCase().includes(lowerQuery) ||
    conv.id.includes(lowerQuery)
  );
};

/**
 * Get conversation statistics
 */
export const getConversationStats = () => {
  const conversations = getConversations();
  let totalMessages = 0;
  
  conversations.forEach(conv => {
    const messages = getConversationMessages(conv.id);
    totalMessages += messages.length;
  });
  
  return {
    totalConversations: conversations.length,
    totalMessages,
    oldestConversation: conversations.length > 0 ? 
      conversations.reduce((oldest, conv) => 
        conv.createdAt < oldest.createdAt ? conv : oldest
      ) : null,
    newestConversation: conversations.length > 0 ? 
      conversations.reduce((newest, conv) => 
        conv.createdAt > newest.createdAt ? conv : newest
      ) : null
  };
};