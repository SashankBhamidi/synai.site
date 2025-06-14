import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitCompare, 
  Play, 
  Copy, 
  Download,
  Zap,
  Brain,
  Code,
  FileText,
  Lightbulb,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { AIModel, availableModels } from '@/data/models';
import { sendAiMessage } from '@/services/aiService';
import { hasApiKey } from '@/utils/apiKeyStorage';
import { useSettings } from '@/contexts/SettingsContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ComparisonResult {
  model: AIModel;
  response: string;
  isLoading: boolean;
  error?: string;
  responseTime?: number;
}

interface TestPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  icon: React.ElementType;
}

const TEST_PROMPTS: TestPrompt[] = [
  {
    id: 'reasoning',
    title: 'Logic Puzzle',
    description: 'Test logical reasoning and problem-solving',
    prompt: 'Three friends - Alice, Bob, and Carol - are standing in a line. Alice is not at the front. Carol is not at the back. Bob is not in the middle. What is the order from front to back?',
    category: 'Reasoning',
    icon: Brain
  },
  {
    id: 'creative',
    title: 'Creative Writing',
    description: 'Evaluate creativity and storytelling ability',
    prompt: 'Write a short story (100-150 words) about a robot who discovers they can dream. Include themes of consciousness and humanity.',
    category: 'Creative',
    icon: Lightbulb
  },
  {
    id: 'coding',
    title: 'Code Generation',
    description: 'Test programming knowledge and code quality',
    prompt: 'Write a Python function that finds the longest palindromic substring in a given string. Include comments explaining the algorithm.',
    category: 'Coding',
    icon: Code
  },
  {
    id: 'analysis',
    title: 'Text Analysis',
    description: 'Assess analytical and comprehension skills',
    prompt: 'Analyze the pros and cons of remote work vs office work. Present your analysis in a structured format with at least 3 points for each side.',
    category: 'Analysis',
    icon: FileText
  },
  {
    id: 'math',
    title: 'Mathematical Problem',
    description: 'Test mathematical reasoning and explanation',
    prompt: 'Solve this step by step: If a train travels 120 km in 1.5 hours, and another train travels 200 km in 2.5 hours, which train is faster and by how much?',
    category: 'Math',
    icon: Brain
  },
  {
    id: 'conversation',
    title: 'Conversational',
    description: 'Evaluate natural conversation ability',
    prompt: 'I\'m feeling overwhelmed with work and personal life. I have three big projects due next week and my family wants to plan a weekend trip. How should I handle this situation?',
    category: 'Conversation',
    icon: MessageSquare
  }
];

export function ModelComparison() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const { temperature } = useSettings();
  const startTimeRef = useRef<number>(0);

  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const grouped = availableModels.reduce((acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, AIModel[]>);
    return grouped;
  }, []);

  const handleModelToggle = (model: AIModel, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, model]);
    } else {
      setSelectedModels(prev => prev.filter(m => m.id !== model.id));
    }
  };

  const handleTestPromptSelect = (testPrompt: TestPrompt) => {
    setPrompt(testPrompt.prompt);
    toast.success(`Test prompt "${testPrompt.title}" loaded`);
  };

  const runComparison = async () => {
    if (!prompt.trim() || selectedModels.length === 0) {
      toast.error('Please enter a prompt and select at least one model');
      return;
    }

    setIsRunning(true);
    setActiveTab('results');
    startTimeRef.current = Date.now();

    // Initialize results
    const initialResults: ComparisonResult[] = selectedModels.map(model => ({
      model,
      response: '',
      isLoading: true
    }));
    setResults(initialResults);

    // Run all models in parallel
    const promises = selectedModels.map(async (model, index) => {
      const startTime = Date.now();
      try {
        const provider = model.provider.toLowerCase();
        const useSimulatedResponse = !hasApiKey(provider as 'openai' | 'anthropic' | 'perplexity');
        
        const response = await sendAiMessage(provider, {
          message: prompt,
          model: model.id,
          temperature,
          simulateResponse: useSimulatedResponse,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseTime = Date.now() - startTime;

        setResults(prev => prev.map((result, i) => 
          i === index 
            ? { ...result, response, isLoading: false, responseTime }
            : result
        ));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setResults(prev => prev.map((result, i) => 
          i === index 
            ? { ...result, error: errorMessage, isLoading: false }
            : result
        ));
      }
    });

    await Promise.all(promises);
    setIsRunning(false);
    toast.success('Model comparison completed!');
  };

  const copyResult = (result: ComparisonResult) => {
    navigator.clipboard.writeText(`**${result.model.name}** (${result.model.provider}):\n\n${result.response}`);
    toast.success('Response copied to clipboard');
  };

  const exportResults = () => {
    const exportData = {
      prompt,
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        model: r.model.name,
        provider: r.model.provider,
        response: r.response,
        responseTime: r.responseTime,
        error: r.error
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `model-comparison-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Results exported successfully');
  };

  const resetComparison = () => {
    setPrompt('');
    setSelectedModels([]);
    setResults([]);
    setActiveTab('setup');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitCompare size={16} />
          Model Comparison
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare size={20} />
            Model Comparison Studio
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="results" disabled={results.length === 0}>
              Results {results.length > 0 && `(${results.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="flex-1 flex flex-col space-y-4">
            {/* Test Prompts */}
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap size={14} />
                Quick Test Prompts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {TEST_PROMPTS.map((testPrompt) => {
                  const IconComponent = testPrompt.icon;
                  return (
                    <Button
                      key={testPrompt.id}
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 text-left justify-start"
                      onClick={() => handleTestPromptSelect(testPrompt)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <IconComponent size={14} className="text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-xs">{testPrompt.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {testPrompt.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Custom Prompt */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-sm font-semibold mb-2">Custom Prompt</h3>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here or select a test prompt above..."
                className="flex-1 min-h-[120px] resize-none"
              />
            </div>

            {/* Model Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                Select Models ({selectedModels.length} selected)
              </h3>
              <ScrollArea className="h-[200px] border rounded-md p-3">
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <div key={provider} className="mb-4 last:mb-0">
                    <div className="font-medium text-sm mb-2 flex items-center gap-2">
                      {provider}
                      <Badge variant="secondary" className="text-xs">
                        {models.length} models
                      </Badge>
                    </div>
                    <div className="space-y-2 ml-2">
                      {models.map((model) => (
                        <div key={model.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={model.id}
                            checked={selectedModels.some(m => m.id === model.id)}
                            onCheckedChange={(checked) => handleModelToggle(model, !!checked)}
                          />
                          <div className="grid gap-1 leading-none">
                            <label
                              htmlFor={model.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {model.name}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {model.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={runComparison}
                disabled={!prompt.trim() || selectedModels.length === 0 || isRunning}
                className="gap-2"
              >
                <Play size={14} />
                {isRunning ? 'Running...' : 'Run Comparison'}
              </Button>
              <Button variant="outline" onClick={resetComparison}>
                Reset
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="results" className="flex-1 flex flex-col">
            {results.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Comparing {results.length} model{results.length !== 1 ? 's' : ''}
                    {!isRunning && (
                      <span className="ml-2">
                        • Completed in {((Date.now() - startTimeRef.current) / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportResults}>
                      <Download size={14} className="mr-2" />
                      Export
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActiveTab('setup')}>
                      New Comparison
                    </Button>
                  </div>
                </div>

                <div className="text-sm font-medium mb-2">Prompt:</div>
                <div className="text-sm bg-muted p-3 rounded-md mb-4">{prompt}</div>

                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {results.map((result, index) => (
                      <div key={result.model.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{result.model.provider}</Badge>
                            <span className="font-medium text-sm">{result.model.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.isLoading && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                                Loading...
                              </div>
                            )}
                            {result.error && (
                              <div className="flex items-center gap-1 text-xs text-destructive">
                                <AlertCircle size={12} />
                                Error
                              </div>
                            )}
                            {!result.isLoading && !result.error && (
                              <div className="flex items-center gap-2">
                                {result.responseTime && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock size={12} />
                                    {(result.responseTime / 1000).toFixed(1)}s
                                  </div>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyResult(result)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy size={12} />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t pt-3">
                          {result.isLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin w-6 h-6 border-2 border-current border-t-transparent rounded-full" />
                            </div>
                          ) : result.error ? (
                            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                              {result.error}
                            </div>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {result.response}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}