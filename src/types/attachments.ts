export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // For display purposes
  data?: string; // Base64 encoded content
  content?: string; // Extracted text content (for PDFs, docs)
  preview?: string; // Thumbnail or preview URL
  uploadedAt: Date;
}

export type AttachmentType = 
  | 'image'
  | 'text'
  | 'code'
  | 'pdf'
  | 'document'
  | 'other';

export interface AttachmentValidation {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxCount: number;
}

export const ATTACHMENT_CONFIG: Record<AttachmentType, AttachmentValidation> = {
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
    maxCount: 5
  },
  text: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: ['text/plain', 'text/markdown', 'text/csv', 'application/json'],
    maxCount: 3
  },
  code: {
    maxSize: 1 * 1024 * 1024, // 1MB
    allowedTypes: [
      'text/javascript', 'application/javascript',
      'text/typescript', 'application/typescript',
      'text/x-python', 'application/x-python',
      'text/html', 'text/css',
      'application/json', 'text/xml'
    ],
    maxCount: 5
  },
  pdf: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['application/pdf'],
    maxCount: 2
  },
  document: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxCount: 2
  },
  other: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: [], // Will be validated case by case
    maxCount: 3
  }
};

export const getAttachmentType = (mimeType: string): AttachmentType => {
  if (ATTACHMENT_CONFIG.image.allowedTypes.includes(mimeType)) {
    return 'image';
  }
  if (ATTACHMENT_CONFIG.text.allowedTypes.includes(mimeType)) {
    return 'text';
  }
  if (ATTACHMENT_CONFIG.code.allowedTypes.includes(mimeType)) {
    return 'code';
  }
  if (ATTACHMENT_CONFIG.pdf.allowedTypes.includes(mimeType)) {
    return 'pdf';
  }
  if (ATTACHMENT_CONFIG.document.allowedTypes.includes(mimeType)) {
    return 'document';
  }
  return 'other';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isValidAttachment = (file: File): { valid: boolean; error?: string } => {
  const attachmentType = getAttachmentType(file.type);
  const config = ATTACHMENT_CONFIG[attachmentType];
  
  if (attachmentType === 'other' && !config.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not supported` };
  }
  
  if (file.size > config.maxSize) {
    return { 
      valid: false, 
      error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size ${formatFileSize(config.maxSize)}` 
    };
  }
  
  return { valid: true };
};