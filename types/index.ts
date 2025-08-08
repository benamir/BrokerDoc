// Global type definitions for BrokerDoc

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'broker' | 'agent' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  category: DocumentCategory;
  status: DocumentStatus;
  aiAnalysis?: AIAnalysis;
  createdAt: Date;
  updatedAt: Date;
}

export type DocumentCategory = 
  | 'contract'
  | 'listing'
  | 'inspection'
  | 'financial'
  | 'legal'
  | 'other';

export type DocumentStatus = 
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'error';

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  risks: string[];
  recommendations: string[];
  confidence: number;
  extractedData: Record<string, any>;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// Chat System Types
export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatDocument {
  id: string;
  conversation_id: string;
  name: string;
  type: string;
  file_url: string;
  file_size: number;
  extracted_data?: Record<string, any>;
  created_at: string;
}

export interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  uploadProgress: Record<string, UploadProgress>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  file?: File;
  timestamp: Date;
}