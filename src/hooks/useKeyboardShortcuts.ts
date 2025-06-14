import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  disabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      if (shortcut.disabled) continue;

      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === !!event.ctrlKey;
      const altMatches = !!shortcut.altKey === !!event.altKey;
      const shiftMatches = !!shortcut.shiftKey === !!event.shiftKey;
      const metaMatches = !!shortcut.metaKey === !!event.metaKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
}

// Helper function to format shortcut display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  // Detect if we're on Mac
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (shortcut.ctrlKey) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.metaKey) {
    parts.push(isMac ? '⌘' : 'Meta');
  }
  if (shortcut.altKey) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shiftKey) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(isMac ? '' : '+');
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  NEW_CHAT: { key: 'n', ctrlKey: true, description: 'New chat' },
  FOCUS_INPUT: { key: '/', description: 'Focus message input' },
  SEARCH: { key: 'k', ctrlKey: true, description: 'Search conversations' },
  SETTINGS: { key: ',', ctrlKey: true, description: 'Open settings' },
  SIDEBAR_TOGGLE: { key: 'b', ctrlKey: true, description: 'Toggle sidebar' },
  HELP: { key: '?', description: 'Show keyboard shortcuts' },
  ESCAPE: { key: 'Escape', description: 'Close dialogs/cancel' },
  REGENERATE: { key: 'r', ctrlKey: true, description: 'Regenerate last response' },
  EXPORT: { key: 'e', ctrlKey: true, description: 'Export conversation' },
  DELETE_CONVERSATION: { key: 'Delete', shiftKey: true, description: 'Delete current conversation' }
} as const;

