import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Using custom card components
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
import { 
  Keyboard, 
  MessageSquare, 
  Search, 
  Settings, 
  Navigation,
  Zap,
  Command
} from "lucide-react";
import { formatShortcut } from "@/hooks/useKeyboardShortcuts";

interface ShortcutGroup {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcuts: Array<{
    key: string;
    ctrlKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    metaKey?: boolean;
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "General",
    icon: Command,
    shortcuts: [
      { key: '?', description: 'Show keyboard shortcuts' },
      { key: 'Escape', description: 'Close dialogs/cancel actions' },
      { key: ',', ctrlKey: true, description: 'Open settings' },
      { key: '/', description: 'Focus search' }
    ]
  },
  {
    title: "Navigation",
    icon: Navigation,
    shortcuts: [
      { key: 'b', ctrlKey: true, description: 'Toggle sidebar' },
      { key: 'n', ctrlKey: true, description: 'Start new conversation' },
      { key: 'k', ctrlKey: true, description: 'Open search dialog' },
      { key: 'ArrowUp', description: 'Navigate up in conversation list' },
      { key: 'ArrowDown', description: 'Navigate down in conversation list' },
      { key: 'Enter', description: 'Select highlighted conversation' }
    ]
  },
  {
    title: "Chat Actions",
    icon: MessageSquare,
    shortcuts: [
      { key: 'Enter', description: 'Send message' },
      { key: 'Enter', shiftKey: true, description: 'Insert line break' },
      { key: 'r', ctrlKey: true, description: 'Regenerate last response' },
      { key: 'ArrowUp', description: 'Edit last message (when input is empty)' },
      { key: 'Tab', description: 'Accept suggestion' }
    ]
  },
  {
    title: "Conversation Management",
    icon: Settings,
    shortcuts: [
      { key: 'e', ctrlKey: true, description: 'Export current conversation' },
      { key: 'i', ctrlKey: true, description: 'Import conversations' },
      { key: 'f', ctrlKey: true, description: 'Add to favorites' },
      { key: 'p', ctrlKey: true, description: 'Pin conversation' },
      { key: 'Delete', shiftKey: true, description: 'Delete current conversation' },
      { key: 't', ctrlKey: true, description: 'Add tag to conversation' }
    ]
  },
  {
    title: "Quick Actions",
    icon: Zap,
    shortcuts: [
      { key: 'c', altKey: true, description: 'Copy last response' },
      { key: 's', ctrlKey: true, description: 'Save conversation' },
      { key: 'z', ctrlKey: true, description: 'Undo last action' },
      { key: 'y', ctrlKey: true, description: 'Redo last action' },
      { key: 'a', ctrlKey: true, description: 'Select all text in input' },
      { key: 'd', ctrlKey: true, description: 'Clear current conversation' }
    ]
  }
];

interface KeyboardShortcutsDialogProps {
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsDialog({ trigger }: KeyboardShortcutsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const renderShortcut = (shortcut: ShortcutGroup['shortcuts'][0]) => (
    <div key={shortcut.description} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50">
      <span className="text-sm text-muted-foreground">
        {shortcut.description}
      </span>
      <Badge variant="outline" className="text-xs font-mono">
        {formatShortcut(shortcut)}
      </Badge>
    </div>
  );

  // Detect if we're on Mac for display purposes
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Keyboard size={16} className="mr-2" />
            Shortcuts
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={20} />
            Keyboard Shortcuts
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isMac ? 'Use ⌘ (Cmd) key combinations' : 'Use Ctrl key combinations'} for most actions
          </p>
        </DialogHeader>
        
        <Tabs defaultValue="all" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="management">Management</TabsTrigger>
            <TabsTrigger value="quick">Quick</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="overflow-y-auto max-h-[60vh] mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcutGroups.map((group) => (
                <div key={group.title} className="border rounded-lg">
                  <div className="p-4 pb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <group.icon size={18} />
                      {group.title}
                    </h3>
                  </div>
                  <div className="p-4 pt-0 space-y-1">
                    {group.shortcuts.map(renderShortcut)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {shortcutGroups.map((group, index) => (
            <TabsContent 
              key={group.title}
              value={['general', 'navigation', 'chat', 'management', 'quick'][index]}
              className="overflow-y-auto max-h-[60vh] mt-4"
            >
              <div className="border rounded-lg">
                <div className="p-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <group.icon size={20} />
                    {group.title} Shortcuts
                  </h3>
                </div>
                <div className="p-4 pt-0 space-y-2">
                  {group.shortcuts.map(renderShortcut)}
                </div>
              </div>
              
              {/* Tips for specific categories */}
              {group.title === 'Chat Actions' && (
                <div className="border rounded-lg mt-4">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">💡 Chat Tips</h3>
                  </div>
                  <div className="p-4 pt-0 text-sm text-muted-foreground space-y-2">
                    <p>• Use Shift+Enter to add line breaks in your messages</p>
                    <p>• Press ↑ when the input is empty to edit your last message</p>
                    <p>• The regenerate shortcut (Ctrl+R) will retry the last AI response</p>
                    <p>• Use Tab to accept autocomplete suggestions</p>
                  </div>
                </div>
              )}
              
              {group.title === 'Navigation' && (
                <div className="border rounded-lg mt-4">
                  <div className="p-4">
                    <h3 className="text-lg font-semibold">💡 Navigation Tips</h3>
                  </div>
                  <div className="p-4 pt-0 text-sm text-muted-foreground space-y-2">
                    <p>• Use arrow keys to navigate through conversations in the sidebar</p>
                    <p>• Press Enter to select a highlighted conversation</p>
                    <p>• Ctrl+K opens a powerful search dialog with filters</p>
                    <p>• Ctrl+B toggles the sidebar for more screen space</p>
                  </div>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}