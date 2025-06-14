// Usage Analytics Utility for Synthesis AI

export interface UsageSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  messagesCount: number;
  modelsUsed: string[];
  providers: string[];
}

export interface MessageMetrics {
  id: string;
  timestamp: Date;
  model: string;
  provider: string;
  promptLength: number;
  responseLength: number;
  responseTime: number;
  temperature: number;
  isRegeneration: boolean;
  isSimulated: boolean;
}

export interface UsageStats {
  totalMessages: number;
  totalConversations: number;
  totalResponseTime: number;
  averageResponseTime: number;
  mostUsedModel: string;
  mostUsedProvider: string;
  totalPromptCharacters: number;
  totalResponseCharacters: number;
  todayMessages: number;
  thisWeekMessages: number;
  thisMonthMessages: number;
  modelUsageBreakdown: Record<string, number>;
  providerUsageBreakdown: Record<string, number>;
  dailyUsage: Array<{ date: string; messages: number; conversations: number }>;
  firstMessageDate?: Date;
  lastMessageDate?: Date;
  averagePromptLength: number;
  averageResponseLength: number;
  regenerationCount: number;
  simulatedResponseCount: number;
}

// Storage keys
const USAGE_ANALYTICS_KEY = 'synthesis-ai-usage-analytics';
const CURRENT_SESSION_KEY = 'synthesis-ai-current-session';

// Get stored analytics data
export const getUsageAnalytics = (): MessageMetrics[] => {
  try {
    const stored = localStorage.getItem(USAGE_ANALYTICS_KEY);
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    return data.map((metric: any) => ({
      ...metric,
      timestamp: new Date(metric.timestamp)
    }));
  } catch (error) {
    console.error('Error loading usage analytics:', error);
    return [];
  }
};

// Save analytics data
const saveUsageAnalytics = (analytics: MessageMetrics[]): void => {
  try {
    localStorage.setItem(USAGE_ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Error saving usage analytics:', error);
  }
};

// Record a new message
export const recordMessage = (metrics: Omit<MessageMetrics, 'id' | 'timestamp'>): void => {
  const currentAnalytics = getUsageAnalytics();
  
  const newMetric: MessageMetrics = {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    ...metrics
  };
  
  // Add to analytics
  currentAnalytics.push(newMetric);
  
  // Keep only last 10,000 messages to prevent storage bloat
  if (currentAnalytics.length > 10000) {
    currentAnalytics.splice(0, currentAnalytics.length - 10000);
  }
  
  saveUsageAnalytics(currentAnalytics);
  
  console.log('Recorded message analytics:', newMetric);
};

// Get current session
export const getCurrentSession = (): UsageSession | null => {
  try {
    const stored = localStorage.getItem(CURRENT_SESSION_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    return {
      ...session,
      startTime: new Date(session.startTime),
      endTime: session.endTime ? new Date(session.endTime) : undefined
    };
  } catch (error) {
    console.error('Error loading current session:', error);
    return null;
  }
};

// Start a new session
export const startSession = (): UsageSession => {
  const session: UsageSession = {
    id: crypto.randomUUID(),
    startTime: new Date(),
    messagesCount: 0,
    modelsUsed: [],
    providers: []
  };
  
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
  return session;
};

// Update current session
export const updateSession = (updates: Partial<UsageSession>): void => {
  const currentSession = getCurrentSession();
  if (!currentSession) return;
  
  const updatedSession = { ...currentSession, ...updates };
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(updatedSession));
};

// End current session
export const endSession = (): void => {
  const currentSession = getCurrentSession();
  if (!currentSession) return;
  
  currentSession.endTime = new Date();
  localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(currentSession));
};

// Calculate comprehensive usage statistics
export const calculateUsageStats = (): UsageStats => {
  const analytics = getUsageAnalytics();
  const now = new Date();
  
  if (analytics.length === 0) {
    return {
      totalMessages: 0,
      totalConversations: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      mostUsedModel: '',
      mostUsedProvider: '',
      totalPromptCharacters: 0,
      totalResponseCharacters: 0,
      todayMessages: 0,
      thisWeekMessages: 0,
      thisMonthMessages: 0,
      modelUsageBreakdown: {},
      providerUsageBreakdown: {},
      dailyUsage: [],
      averagePromptLength: 0,
      averageResponseLength: 0,
      regenerationCount: 0,
      simulatedResponseCount: 0
    };
  }
  
  // Basic stats
  const totalMessages = analytics.length;
  const totalResponseTime = analytics.reduce((sum, m) => sum + m.responseTime, 0);
  const averageResponseTime = totalResponseTime / totalMessages;
  const totalPromptCharacters = analytics.reduce((sum, m) => sum + m.promptLength, 0);
  const totalResponseCharacters = analytics.reduce((sum, m) => sum + m.responseLength, 0);
  const averagePromptLength = totalPromptCharacters / totalMessages;
  const averageResponseLength = totalResponseCharacters / totalMessages;
  const regenerationCount = analytics.filter(m => m.isRegeneration).length;
  const simulatedResponseCount = analytics.filter(m => m.isSimulated).length;
  
  // Date calculations
  const today = new Date().toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const todayMessages = analytics.filter(m => m.timestamp.toDateString() === today).length;
  const thisWeekMessages = analytics.filter(m => m.timestamp >= weekAgo).length;
  const thisMonthMessages = analytics.filter(m => m.timestamp >= monthAgo).length;
  
  // Model and provider usage
  const modelUsageBreakdown: Record<string, number> = {};
  const providerUsageBreakdown: Record<string, number> = {};
  
  analytics.forEach(metric => {
    modelUsageBreakdown[metric.model] = (modelUsageBreakdown[metric.model] || 0) + 1;
    providerUsageBreakdown[metric.provider] = (providerUsageBreakdown[metric.provider] || 0) + 1;
  });
  
  const mostUsedModel = Object.entries(modelUsageBreakdown)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  const mostUsedProvider = Object.entries(providerUsageBreakdown)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  
  // Daily usage for the last 30 days
  const dailyUsage: Array<{ date: string; messages: number; conversations: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const dayMessages = analytics.filter(m => 
      m.timestamp.toISOString().split('T')[0] === dateStr
    ).length;
    
    dailyUsage.push({
      date: dateStr,
      messages: dayMessages,
      conversations: 0 // We'd need conversation data to calculate this properly
    });
  }
  
  return {
    totalMessages,
    totalConversations: 0, // Would need to integrate with conversation storage
    totalResponseTime,
    averageResponseTime,
    mostUsedModel,
    mostUsedProvider,
    totalPromptCharacters,
    totalResponseCharacters,
    todayMessages,
    thisWeekMessages,
    thisMonthMessages,
    modelUsageBreakdown,
    providerUsageBreakdown,
    dailyUsage,
    firstMessageDate: analytics[0]?.timestamp,
    lastMessageDate: analytics[analytics.length - 1]?.timestamp,
    averagePromptLength,
    averageResponseLength,
    regenerationCount,
    simulatedResponseCount
  };
};

// Export analytics data
export const exportUsageAnalytics = (): void => {
  const analytics = getUsageAnalytics();
  const stats = calculateUsageStats();
  
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    statistics: stats,
    rawData: analytics,
    metadata: {
      totalRecords: analytics.length,
      dateRange: {
        from: stats.firstMessageDate?.toISOString(),
        to: stats.lastMessageDate?.toISOString()
      }
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `synthesis-ai-analytics-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Clear all analytics data
export const clearUsageAnalytics = (): void => {
  localStorage.removeItem(USAGE_ANALYTICS_KEY);
  localStorage.removeItem(CURRENT_SESSION_KEY);
};