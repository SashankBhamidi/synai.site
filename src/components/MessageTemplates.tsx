import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  BookmarkPlus,
  Bookmark,
  Search,
  Edit3,
  Trash2,
  Copy,
  Star,
  Tag,
  Plus,
  X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  usageCount: number;
}

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "1",
    title: "Code Review Request",
    content: "Please review this code and suggest improvements for:\n- Performance optimization\n- Code readability\n- Best practices\n- Potential bugs\n\n[Paste your code here]",
    category: "Development",
    tags: ["code", "review", "development"],
    isFavorite: true,
    createdAt: new Date("2024-01-01"),
    usageCount: 15
  },
  {
    id: "2",
    title: "Explain Like I'm 5",
    content: "Please explain [TOPIC] in simple terms that a 5-year-old could understand, using analogies and examples.",
    category: "Education",
    tags: ["explain", "simple", "education"],
    isFavorite: true,
    createdAt: new Date("2024-01-02"),
    usageCount: 23
  },
  {
    id: "3",
    title: "Creative Writing Prompt",
    content: "Write a creative story about [SUBJECT]. Make it engaging, with:\n- Compelling characters\n- An interesting plot twist\n- Vivid descriptions\n- Emotional depth\n\nTarget length: [LENGTH]",
    category: "Creative",
    tags: ["writing", "story", "creative"],
    isFavorite: false,
    createdAt: new Date("2024-01-03"),
    usageCount: 8
  },
  {
    id: "4",
    title: "Problem Solving Framework",
    content: "Help me solve this problem using a structured approach:\n\n1. Define the problem clearly\n2. Identify possible causes\n3. Generate multiple solutions\n4. Evaluate pros and cons\n5. Recommend the best approach\n\nProblem: [DESCRIBE PROBLEM]",
    category: "Problem Solving",
    tags: ["problem", "solution", "framework"],
    isFavorite: false,
    createdAt: new Date("2024-01-04"),
    usageCount: 12
  },
  {
    id: "5",
    title: "Research Summary",
    content: "Please research and summarize information about [TOPIC]. Include:\n- Key facts and statistics\n- Recent developments\n- Different perspectives\n- Reliable sources\n- Practical implications",
    category: "Research",
    tags: ["research", "summary", "analysis"],
    isFavorite: true,
    createdAt: new Date("2024-01-05"),
    usageCount: 19
  }
];

const CATEGORIES = ["All", "Development", "Creative", "Education", "Research", "Problem Solving", "Business", "Personal"];

export function MessageTemplates({ onSelectTemplate }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  
  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    content: "",
    category: "Personal",
    tags: ""
  });

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('message-templates');
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
        setTemplates(parsed);
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates(DEFAULT_TEMPLATES);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (updatedTemplates: MessageTemplate[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('message-templates', JSON.stringify(updatedTemplates));
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === "" || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || template.isFavorite;
    
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  // Sort by usage count and favorites
  const sortedTemplates = filteredTemplates.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return b.usageCount - a.usageCount;
  });

  const handleUseTemplate = (template: MessageTemplate) => {
    // Increment usage count
    const updatedTemplates = templates.map(t => 
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    saveTemplates(updatedTemplates);
    
    onSelectTemplate(template.content);
    toast.success(`Template "${template.title}" applied`);
  };

  const handleToggleFavorite = (templateId: string) => {
    const updatedTemplates = templates.map(t => 
      t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
    );
    saveTemplates(updatedTemplates);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    toast.success("Template deleted");
  };

  const handleSaveNewTemplate = () => {
    if (!newTemplate.title.trim() || !newTemplate.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      title: newTemplate.title,
      content: newTemplate.content,
      category: newTemplate.category,
      tags: newTemplate.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      isFavorite: false,
      createdAt: new Date(),
      usageCount: 0
    };

    saveTemplates([...templates, template]);
    setNewTemplate({ title: "", content: "", category: "Personal", tags: "" });
    setIsAddingNew(false);
    toast.success("Template created");
  };

  const handleSaveEdit = () => {
    if (!editingTemplate || !editingTemplate.title.trim() || !editingTemplate.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    const updatedTemplates = templates.map(t => 
      t.id === editingTemplate.id ? editingTemplate : t
    );
    saveTemplates(updatedTemplates);
    setEditingTemplate(null);
    toast.success("Template updated");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full relative group hover:bg-accent transition-colors"
        >
          <Bookmark size={18} className="group-hover:scale-110 transition-transform" />
          <span className="sr-only">Message Templates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bookmark size={20} className="text-primary" />
            </div>
            Message Templates
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[70vh]">
          {/* Controls */}
          <div className="space-y-4 p-4 border-b">
            {/* Search and Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="icon"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title="Show favorites only"
              >
                <Star size={16} className={showFavoritesOnly ? "fill-current" : ""} />
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                New
              </Button>
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {isAddingNew && (
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 mb-4 bg-primary/5">
                <div className="space-y-3">
                  <Input
                    placeholder="Template title..."
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Select 
                      value={newTemplate.category} 
                      onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.slice(1).map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Tags (comma-separated)"
                      value={newTemplate.tags}
                      onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                  <Textarea
                    placeholder="Template content..."
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                    rows={4}
                    className="custom-scrollbar"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNewTemplate} size="sm">
                      Save Template
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingNew(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {sortedTemplates.map(template => (
                <div key={template.id} className={cn(
                  "border rounded-lg p-4 hover:shadow-md transition-all duration-200",
                  editingTemplate?.id === template.id && "border-primary bg-primary/5"
                )}>
                  {editingTemplate?.id === template.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editingTemplate.title}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Select 
                          value={editingTemplate.category} 
                          onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.slice(1).map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Tags (comma-separated)"
                          value={editingTemplate.tags.join(', ')}
                          onChange={(e) => setEditingTemplate({ 
                            ...editingTemplate, 
                            tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                          })}
                          className="flex-1"
                        />
                      </div>
                      <Textarea
                        value={editingTemplate.content}
                        onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                        rows={4}
                        className="custom-scrollbar"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} size="sm">
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setEditingTemplate(null)} size="sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground">{template.title}</h3>
                            {template.isFavorite && (
                              <Star size={14} className="text-yellow-500 fill-current" />
                            )}
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {template.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag size={10} className="mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUseTemplate(template)}
                            className="h-8 w-8"
                            title="Use template"
                          >
                            <Copy size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFavorite(template.id)}
                            className="h-8 w-8"
                            title="Toggle favorite"
                          >
                            <Star size={14} className={template.isFavorite ? "fill-current text-yellow-500" : ""} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTemplate(template)}
                            className="h-8 w-8"
                            title="Edit template"
                          >
                            <Edit3 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete template"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Used {template.usageCount} times</span>
                        <span>Created {template.createdAt.toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {sortedTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No templates found</p>
                  <p className="text-sm">Create your first template to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}