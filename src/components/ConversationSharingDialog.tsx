import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { 
  Share2, 
  Download, 
  Copy, 
  FileText, 
  Code, 
  Globe,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";
import { Conversation } from "@/types";
import { 
  ShareOptions, 
  downloadConversation, 
  generateShareableLink,
  prepareConversationForShare,
  exportAsMarkdown,
  exportAsText,
  exportAsHTML
} from "@/utils/conversationSharing";

interface ConversationSharingDialogProps {
  conversation: Conversation;
  trigger?: React.ReactNode;
}

export function ConversationSharingDialog({ 
  conversation, 
  trigger 
}: ConversationSharingDialogProps) {
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    format: 'markdown',
    includeSystemMessages: false,
    includeMetadata: true,
    title: conversation.title,
    description: ''
  });
  
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string>('');

  const handleOptionChange = (key: keyof ShareOptions, value: any) => {
    const newOptions = { ...shareOptions, [key]: value };
    setShareOptions(newOptions);
    
    // Update preview
    updatePreview(newOptions);
  };

  const updatePreview = (options: ShareOptions) => {
    try {
      const shareableConversation = prepareConversationForShare(conversation, options);
      
      let preview = '';
      switch (options.format) {
        case 'markdown':
          preview = exportAsMarkdown(shareableConversation, options);
          break;
        case 'text':
          preview = exportAsText(shareableConversation, options);
          break;
        case 'html':
          preview = exportAsHTML(shareableConversation, options);
          break;
        case 'json':
          preview = JSON.stringify(shareableConversation, null, 2);
          break;
        default:
          preview = 'Preview not available for this format';
      }
      
      // Limit preview to first 1000 characters
      setPreviewContent(preview.length > 1000 ? preview.substring(0, 1000) + '...' : preview);
    } catch (error) {
      setPreviewContent('Error generating preview');
    }
  };

  const handleDownload = () => {
    try {
      downloadConversation(conversation, shareOptions);
      toast.success(`Conversation downloaded as ${shareOptions.format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to download conversation");
    }
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const link = await generateShareableLink(conversation, shareOptions);
      setShareableLink(link);
      toast.success("Shareable link generated");
    } catch (error) {
      toast.error("Failed to generate shareable link");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast.success("Link copied to clipboard");
  };

  const handleCopyContent = () => {
    const shareableConversation = prepareConversationForShare(conversation, shareOptions);
    let content = '';
    
    switch (shareOptions.format) {
      case 'markdown':
        content = exportAsMarkdown(shareableConversation, shareOptions);
        break;
      case 'text':
        content = exportAsText(shareableConversation, shareOptions);
        break;
      case 'html':
        content = exportAsHTML(shareableConversation, shareOptions);
        break;
      case 'json':
        content = JSON.stringify(shareableConversation, null, 2);
        break;
    }
    
    navigator.clipboard.writeText(content);
    toast.success("Content copied to clipboard");
  };

  React.useEffect(() => {
    updatePreview(shareOptions);
  }, [conversation]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 size={16} className="mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Share Conversation</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export & Download</TabsTrigger>
            <TabsTrigger value="link">Generate Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Options Panel */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Export Options</h3>
                
                {/* Format Selection */}
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select 
                    value={shareOptions.format} 
                    onValueChange={(value) => handleOptionChange('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          Markdown (.md)
                        </div>
                      </SelectItem>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <FileText size={16} />
                          Plain Text (.txt)
                        </div>
                      </SelectItem>
                      <SelectItem value="html">
                        <div className="flex items-center gap-2">
                          <Globe size={16} />
                          HTML (.html)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <Code size={16} />
                          JSON (.json)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title Override */}
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={shareOptions.title || ''}
                    onChange={(e) => handleOptionChange('title', e.target.value)}
                    placeholder="Override conversation title"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={shareOptions.description || ''}
                    onChange={(e) => handleOptionChange('description', e.target.value)}
                    placeholder="Add a description for this conversation"
                    rows={3}
                  />
                </div>

                {/* Include Options */}
                <div className="space-y-3">
                  <Label>Include in Export</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-metadata" className="text-sm">
                      Conversation metadata
                    </Label>
                    <Switch
                      id="include-metadata"
                      checked={shareOptions.includeMetadata}
                      onCheckedChange={(checked) => handleOptionChange('includeMetadata', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-system" className="text-sm">
                      System messages
                    </Label>
                    <Switch
                      id="include-system"
                      checked={shareOptions.includeSystemMessages}
                      onCheckedChange={(checked) => handleOptionChange('includeSystemMessages', checked)}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download size={16} className="mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleCopyContent}>
                    <Copy size={16} className="mr-2" />
                    Copy
                  </Button>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="border rounded-md p-3 bg-muted/50 min-h-[400px] max-h-[400px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {previewContent}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Generate Shareable Link</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a public link that others can use to view this conversation.
                  Links are read-only and include the current export settings.
                </p>
              </div>

              {!shareableLink ? (
                <Button 
                  onClick={handleGenerateLink} 
                  disabled={isGeneratingLink}
                  className="w-full"
                >
                  <LinkIcon size={16} className="mr-2" />
                  {isGeneratingLink ? "Generating..." : "Generate Shareable Link"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <Label>Shareable Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareableLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={handleCopyLink}>
                      <Copy size={16} className="mr-2" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This link will be active for 30 days and includes the conversation 
                    with your current export settings.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}