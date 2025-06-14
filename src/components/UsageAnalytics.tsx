import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  MessageSquare,
  Clock,
  Zap,
  Brain,
  Calendar,
  Download,
  Trash2,
  TrendingUp,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import {
  calculateUsageStats,
  exportUsageAnalytics,
  clearUsageAnalytics,
  UsageStats
} from '@/utils/usageAnalytics';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

function StatCard({ icon: Icon, title, value, subtitle, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
    green: 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]} transition-colors min-h-[120px] flex flex-col justify-between`}>
      <div className="flex items-center justify-between mb-3">
        <Icon size={20} className="flex-shrink-0" />
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold mb-1 truncate">{value}</div>
        <div className="text-sm opacity-75 mb-1">{title}</div>
        {subtitle && (
          <div className="text-xs opacity-60 truncate">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

export function UsageAnalytics() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setTimeout(() => {
        const newStats = calculateUsageStats();
        setStats(newStats);
        setIsLoading(false);
      }, 300);
    }
  }, [isOpen]);

  const handleExport = () => {
    try {
      exportUsageAnalytics();
      toast.success('Analytics data exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics data');
    }
  };

  const handleClearData = () => {
    try {
      clearUsageAnalytics();
      setStats(calculateUsageStats());
      toast.success('Analytics data cleared');
    } catch (error) {
      console.error('Clear failed:', error);
      toast.error('Failed to clear analytics data');
    }
  };

  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1000) return `${Math.round(milliseconds)}ms`;
    return `${(milliseconds / 1000).toFixed(1)}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <BarChart3 size={16} />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Usage Analytics
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" />
              <div className="text-sm text-muted-foreground">Loading analytics...</div>
            </div>
          </div>
        ) : stats ? (
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {stats.firstMessageDate && stats.lastMessageDate && (
                  <span>
                    Data from {stats.firstMessageDate.toLocaleDateString()} to {stats.lastMessageDate.toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleExport}>
                  <Download size={14} className="mr-2" />
                  Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Trash2 size={14} className="mr-2" />
                      Clear Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Analytics Data</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all usage analytics data. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleClearData}>
                        Clear Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={MessageSquare}
                title="Total Messages"
                value={formatNumber(stats.totalMessages)}
                subtitle={`${stats.todayMessages} today`}
                color="blue"
              />
              <StatCard
                icon={Clock}
                title="Avg Response Time"
                value={formatTime(stats.averageResponseTime)}
                subtitle={`Total: ${formatTime(stats.totalResponseTime)}`}
                color="green"
              />
              <StatCard
                icon={Brain}
                title="Most Used Model"
                value={stats.mostUsedModel || 'N/A'}
                subtitle={stats.mostUsedProvider}
                color="purple"
              />
              <StatCard
                icon={Activity}
                title="This Month"
                value={formatNumber(stats.thisMonthMessages)}
                subtitle={`${stats.thisWeekMessages} this week`}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold">Model Usage</h3>
                <div className="space-y-2">
                  {Object.entries(stats.modelUsageBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([model, count]) => {
                      const percentage = stats.totalMessages > 0 ? (count / stats.totalMessages * 100) : 0;
                      return (
                        <div key={model} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="truncate flex-1 mr-2">{model}</span>
                            <span className="text-muted-foreground">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Prompt Length:</span>
                    <span className="font-medium">{Math.round(stats.averagePromptLength)} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Response Length:</span>
                    <span className="font-medium">{Math.round(stats.averageResponseLength)} chars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regenerations:</span>
                    <span className="font-medium">{stats.regenerationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Simulated Responses:</span>
                    <span className="font-medium">{stats.simulatedResponseCount}</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p>No analytics data available yet.</p>
              <p className="text-sm">Start chatting to see your usage statistics!</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}