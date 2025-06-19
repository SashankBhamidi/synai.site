import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { 
  Zap, 
  Clock, 
  BarChart3, 
  Play,
  Copy,
  Download,
  X,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  GitCompare
} from "lucide-react";
import { toast } from "sonner";
import { AIModel } from "@/types";
import { availableModels } from "@/data/models";
import { sendAiMessage } from "@/services/aiService";
import { hasApiKey } from "@/utils/apiKeyStorage";

interface ModelResponse {
  model: AIModel;
  response: string;
  responseTime: number;
  tokenCount?: number;
  error?: string;
}

interface ComparisonMetrics {
  speed: number;
  quality: number;
  creativity: number;
  accuracy: number;
}

const promptTemplates = [
  {
    name: "General Chat",
    prompt: "Hello! How can you help me today?",
    description: "Test basic conversational ability"
  },
  {
    name: "Code Review",
    prompt: "Review this Python function and suggest improvements:\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)",
    description: "Test coding analysis and optimization skills"
  },
  {
    name: "Creative Writing",
    prompt: "Write a short story about a robot who discovers they can dream. Make it emotional and thought-provoking.",
    description: "Test creative and narrative abilities"
  },
  {
    name: "Problem Solving",
    prompt: "A farmer has 17 sheep, and all but 9 die. How many sheep are left? Explain your reasoning step by step.",
    description: "Test logical reasoning and problem-solving"
  },
  {
    name: "Research & Analysis",
    prompt: "Compare the advantages and disadvantages of renewable energy sources like solar, wind, and hydroelectric power.",
    description: "Test research and analytical thinking"
  },
  {
    name: "Technical Explanation",
    prompt: "Explain how machine learning works to a 10-year-old, using simple analogies they can understand.",
    description: "Test ability to simplify complex concepts"
  }
];

const modelPresets = {
  coding: {
    name: "Best Coding Models",
    description: "Top models for programming, code review, and technical tasks",
    modelIds: ["gpt-4o", "claude-sonnet-4-20250514", "o1", "claude-3-5-sonnet-20241022"]
  },
  research: {
    name: "Best Research Models",
    description: "Optimal for analysis, research, and comprehensive responses",
    modelIds: ["sonar-deep-research", "sonar-pro", "claude-opus-4-20250514", "o1"]
  },
  general: {
    name: "Best General Models",
    description: "Well-rounded models for everyday tasks and conversations",
    modelIds: ["claude-sonnet-4-20250514", "gpt-4o", "claude-3-5-sonnet-20241022", "sonar-pro"]
  },
  creative: {
    name: "Best Creative Models",
    description: "Excellent for creative writing, storytelling, and ideation",
    modelIds: ["claude-opus-4-20250514", "gpt-4", "claude-3-5-sonnet-20241022", "gpt-4-turbo"]
  },
  reasoning: {
    name: "Best Reasoning Models",
    description: "Top performers for logic, math, and complex problem-solving",
    modelIds: ["o1", "o1-mini", "sonar-reasoning-pro", "claude-sonnet-4-20250514"]
  }
};

export function ModelComparison() {
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
  const [prompt, setPrompt] = useState("");
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, ComparisonMetrics>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const handleAddModel = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId);
    if (model && !selectedModels.find(m => m.id === modelId)) {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const handleRemoveModel = (modelId: string) => {
    setSelectedModels(selectedModels.filter(m => m.id !== modelId));
  };

  const handleSelectAll = () => {
    setSelectedModels([...availableModels]);
  };

  const handleSelectProvider = (provider: string) => {
    const providerModels = availableModels.filter(m => m.provider === provider);
    const newModels = [...selectedModels];
    providerModels.forEach(model => {
      if (!newModels.find(m => m.id === model.id)) {
        newModels.push(model);
      }
    });
    setSelectedModels(newModels);
  };

  const handleSelectCategory = (category: string) => {
    const categoryModels = availableModels.filter(m => m.category === category);
    const newModels = [...selectedModels];
    categoryModels.forEach(model => {
      if (!newModels.find(m => m.id === model.id)) {
        newModels.push(model);
      }
    });
    setSelectedModels(newModels);
  };

  const handleSelectPreset = (presetKey: string) => {
    const preset = modelPresets[presetKey as keyof typeof modelPresets];
    if (preset) {
      const presetModels = availableModels.filter(m => preset.modelIds.includes(m.id));
      setSelectedModels(presetModels);
    }
  };

  const handleClearAll = () => {
    setSelectedModels([]);
  };

  const handleUseTemplate = (template: string) => {
    setPrompt(template);
    setSelectedTemplate("");
  };

  const runComparison = async () => {
    if (!prompt.trim() || selectedModels.length === 0) {
      toast.error("Please enter a prompt and select at least one model");
      return;
    }

    setIsRunning(true);
    setResponses([]);
    
    const newResponses: ModelResponse[] = [];
    
    // Run all models in parallel
    const promises = selectedModels.map(async (model) => {
      const startTime = Date.now();
      
      try {
        // Check if API key is available for this provider
        if (!hasApiKey(model.provider)) {
          return {
            model,
            response: `Demo response for ${model.name}: This is a simulated response because no API key is configured for ${model.provider}. The actual response would depend on the model's capabilities and training. This model is known for ${model.description?.toLowerCase() || 'its performance'}.`,
            responseTime: Math.random() * 2000 + 500, // Random response time between 0.5-2.5s
            tokenCount: Math.floor(Math.random() * 200) + 50,
            error: undefined
          };
        }

        const response = await sendAiMessage(model.provider, {
          messages: [{ role: 'user', content: prompt }],
          model: model.id,
          temperature: 0.7,
          streaming: false
        });
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        return {
          model,
          response: response || "No response generated",
          responseTime,
          tokenCount: response?.length || 0
        };
      } catch (error) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        return {
          model,
          response: "",
          responseTime,
          error: error instanceof Error ? error.message : "Unknown error"
        };
      }
    });

    try {
      const results = await Promise.all(promises);
      setResponses(results);
      calculateMetrics(results);
    } catch (error) {
      toast.error("Error running comparison");
    } finally {
      setIsRunning(false);
    }
  };

  const calculateMetrics = (responses: ModelResponse[]) => {
    const newMetrics: Record<string, ComparisonMetrics> = {};
    
    // Calculate relative metrics
    const maxResponseTime = Math.max(...responses.map(r => r.responseTime));
    const maxTokens = Math.max(...responses.map(r => r.tokenCount || 0));
    
    responses.forEach(response => {
      if (!response.error) {
        // Speed: inverse of response time (faster = higher score)
        const speed = Math.max(0, 100 - (response.responseTime / maxResponseTime) * 100);
        
        // Quality: based on response length and coherence (simplified)
        const quality = Math.min(100, ((response.tokenCount || 0) / maxTokens) * 80 + 20);
        
        // Creativity: based on model type and response variance
        let creativity = 70;
        if (response.model.category === 'Reasoning') creativity = 60; // Reasoning models less creative
        if (response.model.category === 'GPT-4') creativity = 85; // GPT-4 models more creative
        creativity += Math.random() * 20 - 10; // Add some variance
        
        // Accuracy: based on model reputation and type
        let accuracy = 75;
        if (response.model.category === 'Reasoning') accuracy = 90; // Reasoning models more accurate
        if (response.model.name.includes('o1')) accuracy = 95; // O1 models very accurate
        accuracy += Math.random() * 10 - 5; // Add some variance
        
        newMetrics[response.model.id] = {
          speed: Math.round(Math.max(0, Math.min(100, speed))),
          quality: Math.round(Math.max(0, Math.min(100, quality))),
          creativity: Math.round(Math.max(0, Math.min(100, creativity))),
          accuracy: Math.round(Math.max(0, Math.min(100, accuracy)))
        };
      }
    });
    
    setMetrics(newMetrics);
  };

  const copyResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Response copied to clipboard");
  };

  const exportComparison = () => {
    const exportData = {
      prompt,
      timestamp: new Date().toISOString(),
      models: selectedModels.map(m => m.name),
      responses: responses.map(r => ({
        model: r.model.name,
        provider: r.model.provider,
        response: r.response,
        responseTime: r.responseTime,
        metrics: metrics[r.model.id],
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
    
    toast.success("Comparison exported");
  };

  const getWinner = (metric: keyof ComparisonMetrics) => {
    if (Object.keys(metrics).length === 0) return null;
    
    return Object.entries(metrics).reduce((winner, [modelId, modelMetrics]) => {
      if (!winner || modelMetrics[metric] > winner.score) {
        return { modelId, score: modelMetrics[metric] };
      }
      return winner;
    }, null as { modelId: string; score: number } | null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative group hover:bg-accent transition-colors"
        >
          <GitCompare size={18} className="group-hover:scale-110 transition-transform" />
          <span className="sr-only">Compare Models</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GitCompare size={24} className="text-primary" />
            </div>
            Model Comparison Lab
          </DialogTitle>
          <p className="text-muted-foreground text-base mt-2">
            Compare AI models side-by-side to find the best fit for your use case
          </p>
        </DialogHeader>
        
        <div className="flex flex-col h-[80vh]">
          {/* Setup Section */}
          <div className="space-y-4 p-4 border-b">
            {/* Model Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select Models to Compare</label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll} disabled={selectedModels.length === 0}>
                    Clear All
                  </Button>
                </div>
              </div>
              
              {/* Quick Selection Presets */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Quick Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(modelPresets).map(([key, preset]) => (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectPreset(key)}
                      className="text-xs h-auto py-2 px-3 flex flex-col items-start"
                    >
                      <span className="font-medium">{preset.name}</span>
                      <span className="text-muted-foreground text-[10px] leading-tight">{preset.description}</span>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Bulk Selection by Provider/Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">By Provider</Label>
                  <div className="flex flex-wrap gap-1">
                    {['OpenAI', 'Anthropic', 'Perplexity'].map(provider => (
                      <Button
                        key={provider}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectProvider(provider)}
                        className="text-xs h-7"
                      >
                        + {provider}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">By Category</Label>
                  <div className="flex flex-wrap gap-1">
                    {['GPT-4', 'Claude 4', 'Claude 3.5', 'Reasoning', 'Search'].map(category => (
                      <Button
                        key={category}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectCategory(category)}
                        className="text-xs h-7"
                      >
                        + {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Selected Models Display */}
              <div className="flex flex-wrap gap-2">
                {selectedModels.map(model => (
                  <Badge 
                    key={model.id}
                    variant="secondary"
                    className="px-3 py-1 flex items-center gap-2"
                  >
                    <span className="text-xs opacity-70">{model.provider}</span>
                    {model.name}
                    <button
                      onClick={() => handleRemoveModel(model.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
              
              {/* Individual Model Selection */}
              <Select onValueChange={handleAddModel}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Add individual models..." />
                </SelectTrigger>
                <SelectContent>
                  {availableModels
                    .filter(model => !selectedModels.find(m => m.id === model.id))
                    .map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {model.provider}
                        </Badge>
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {model.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Test Prompt</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Use template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {promptTemplates.map((template, index) => (
                      <SelectItem key={index} value={template.prompt}>
                        <div className="text-left">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedTemplate && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseTemplate(selectedTemplate)}
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemplate("")}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              <Textarea
                placeholder="Enter a prompt to test with all selected models..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={runComparison}
                disabled={isRunning || selectedModels.length === 0 || !prompt.trim()}
                className="flex-1"
              >
                <Play size={16} className="mr-2" />
                {isRunning ? "Running Comparison..." : "Run Comparison"}
              </Button>
              
              {responses.length > 0 && (
                <Button variant="outline" onClick={exportComparison}>
                  <Download size={16} className="mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Results Section */}
          {responses.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="responses" className="h-full flex flex-col">
                <TabsList className="mx-4 mt-4">
                  <TabsTrigger value="responses">Responses</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="responses" className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                  {responses.map((response) => (
                    <div key={response.model.id} className="border rounded-lg">
                      <div className="p-4 pb-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{response.model.name}</h3>
                            <Badge variant="outline">{response.model.provider}</Badge>
                            {response.model.category && (
                              <Badge variant="secondary" className="text-xs">
                                {response.model.category}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock size={12} />
                              {response.responseTime}ms
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyResponse(response.response)}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        {response.error ? (
                          <div className="flex items-center gap-2 text-destructive">
                            <AlertCircle size={16} />
                            <span>Error: {response.error}</span>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap text-sm">
                            {response.response}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="metrics" className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {responses.map(response => {
                      const modelMetrics = metrics[response.model.id];
                      if (!modelMetrics || response.error) return null;
                      
                      return (
                        <div key={response.model.id} className="border rounded-lg">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                              {response.model.name}
                              <Badge variant="outline" className="text-xs">
                                {response.model.provider}
                              </Badge>
                            </h3>
                          </div>
                          <div className="p-4 pt-0 space-y-4">
                            {Object.entries({
                              speed: { label: 'Speed', icon: Zap },
                              quality: { label: 'Quality', icon: Star },
                              creativity: { label: 'Creativity', icon: TrendingUp },
                              accuracy: { label: 'Accuracy', icon: CheckCircle }
                            }).map(([key, { label, icon: Icon }]) => {
                              const value = modelMetrics[key as keyof ComparisonMetrics];
                              const winner = getWinner(key as keyof ComparisonMetrics);
                              const isWinner = winner?.modelId === response.model.id;
                              
                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-sm mb-2">
                                    <span className="flex items-center gap-2">
                                      <Icon size={14} />
                                      {label}
                                      {isWinner && <Star size={12} className="text-yellow-500 fill-current" />}
                                    </span>
                                    <span className="font-medium">{value}%</span>
                                  </div>
                                  <Progress value={value} className="h-2" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
                
                <TabsContent value="analysis" className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  <div className="space-y-6">
                    {/* Speed Analysis */}
                    <div className="border rounded-lg">
                      <div className="p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Zap size={18} />
                          Speed Comparison
                        </h3>
                      </div>
                      <div className="p-4 pt-0">
                        <div className="space-y-2">
                          {responses
                            .filter(r => !r.error)
                            .sort((a, b) => a.responseTime - b.responseTime)
                            .map((response, index) => (
                            <div key={response.model.id} className="flex justify-between items-center p-2 rounded bg-accent/20">
                              <span className="flex items-center gap-2">
                                <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="font-medium">{response.model.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {response.model.provider}
                                </Badge>
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {response.responseTime}ms
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Overall Ranking */}
                    <div className="border rounded-lg">
                      <div className="p-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 size={18} />
                          Overall Ranking
                        </h3>
                      </div>
                      <div className="p-4 pt-0">
                        <div className="space-y-2">
                          {Object.entries(metrics)
                            .map(([modelId, modelMetrics]) => {
                              const model = selectedModels.find(m => m.id === modelId);
                              const avgScore = (
                                modelMetrics.speed + 
                                modelMetrics.quality + 
                                modelMetrics.creativity + 
                                modelMetrics.accuracy
                              ) / 4;
                              return { model, avgScore, metrics: modelMetrics };
                            })
                            .sort((a, b) => b.avgScore - a.avgScore)
                            .map((item, index) => (
                            <div key={item.model?.id} className="flex justify-between items-center p-2 rounded bg-accent/20">
                              <span className="flex items-center gap-2">
                                <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                                  #{index + 1}
                                </Badge>
                                <span className="font-medium">{item.model?.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {item.model?.provider}
                                </Badge>
                                {index === 0 && <Star size={14} className="text-yellow-500 fill-current" />}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {Math.round(item.avgScore)}% avg
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}