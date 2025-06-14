import { ConversationFolder } from "@/types";

const FOLDERS_KEY = 'synthesis-ai-folders';

export const FOLDER_EVENTS = {
  CREATED: 'folder-created',
  UPDATED: 'folder-updated',
  DELETED: 'folder-deleted',
  EXPANDED: 'folder-expanded'
} as const;

const dispatchFolderEvent = (eventType: string, folderId?: string, data?: unknown) => {
  window.dispatchEvent(new CustomEvent(eventType, { 
    detail: { folderId, data } 
  }));
};

export const getFolders = (): ConversationFolder[] => {
  try {
    const stored = localStorage.getItem(FOLDERS_KEY);
    if (!stored) return [];
    
    const folders = JSON.parse(stored);
    return folders.map((folder: {
      id: string;
      name: string;
      description?: string;
      color?: string;
      createdAt: string;
      updatedAt: string;
      parentId?: string;
      isExpanded?: boolean;
    }) => ({
      ...folder,
      createdAt: new Date(folder.createdAt),
      updatedAt: new Date(folder.updatedAt)
    })).sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error('Error loading folders:', error);
    return [];
  }
};

export const createFolder = (
  name: string, 
  options: {
    description?: string;
    color?: string;
    parentId?: string;
  } = {}
): ConversationFolder => {
  const newFolder: ConversationFolder = {
    id: crypto.randomUUID(),
    name,
    description: options.description,
    color: options.color,
    parentId: options.parentId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isExpanded: true
  };
  
  const folders = getFolders();
  folders.push(newFolder);
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  
  dispatchFolderEvent(FOLDER_EVENTS.CREATED, newFolder.id, newFolder);
  console.log('Created folder:', newFolder.name);
  
  return newFolder;
};

export const updateFolder = (folderId: string, updates: Partial<ConversationFolder>): void => {
  try {
    const folders = getFolders();
    const folderIndex = folders.findIndex(f => f.id === folderId);
    
    if (folderIndex >= 0) {
      folders[folderIndex] = {
        ...folders[folderIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
      dispatchFolderEvent(FOLDER_EVENTS.UPDATED, folderId, folders[folderIndex]);
      console.log('Updated folder:', folderId);
    }
  } catch (error) {
    console.error('Error updating folder:', error);
  }
};

export const deleteFolder = (folderId: string, moveConversationsTo?: string): void => {
  try {
    const folders = getFolders();
    const filtered = folders.filter(f => f.id !== folderId);
    
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(filtered));
    
    // Note: Moving conversations should be handled by the calling code
    // This is just a placeholder for the folder deletion logic
    
    dispatchFolderEvent(FOLDER_EVENTS.DELETED, folderId, { moveConversationsTo });
    console.log('Deleted folder:', folderId);
  } catch (error) {
    console.error('Error deleting folder:', error);
  }
};

export const toggleFolderExpanded = (folderId: string): void => {
  const folders = getFolders();
  const folder = folders.find(f => f.id === folderId);
  
  if (folder) {
    folder.isExpanded = !folder.isExpanded;
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    dispatchFolderEvent(FOLDER_EVENTS.EXPANDED, folderId, { isExpanded: folder.isExpanded });
  }
};

export const getFolderHierarchy = (): ConversationFolder[] => {
  const folders = getFolders();
  const rootFolders = folders.filter(f => !f.parentId);
  
  const buildHierarchy = (parentId?: string): ConversationFolder[] => {
    return folders
      .filter(f => f.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  return rootFolders.concat(folders.filter(f => f.parentId));
};

export const getDefaultFolders = (): ConversationFolder[] => {
  const folders = getFolders();
  
  if (folders.length === 0) {
    // Create default folders
    const defaultFolders = [
      { name: 'Work', color: '#3B82F6', description: 'Work-related conversations' },
      { name: 'Personal', color: '#10B981', description: 'Personal conversations' },
      { name: 'Research', color: '#8B5CF6', description: 'Research and learning' },
      { name: 'Archive', color: '#6B7280', description: 'Archived conversations' }
    ];
    
    return defaultFolders.map(folder => createFolder(folder.name, folder));
  }
  
  return folders;
};