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

// Document Template System Types
export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'purchase_agreement' | 'listing_agreement' | 'lease_agreement' | 'disclosure';
  region: 'ontario' | 'bc' | 'alberta' | 'quebec';
  version: string;
  description: string;
  pdf_form_url: string;
  required_fields: TemplateField[];
  optional_fields: TemplateField[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'email' | 'phone' | 'address' | 'boolean';
  description: string;
  validation?: {
    required: boolean;
    min_length?: number;
    max_length?: number;
    pattern?: string;
    min_value?: number;
    max_value?: number;
  };
  placeholder?: string;
  options?: string[]; // For dropdown/select fields
}

export interface ExtractedDocumentData {
  template_id: string;
  extracted_fields: Record<string, any>;
  confidence_scores: Record<string, number>;
  missing_required_fields: string[];
  suggestions: Record<string, string[]>;
  extraction_timestamp: string;
}

export interface GeneratedDocument {
  id: string;
  user_id: string;
  conversation_id: string;
  template_id: string;
  document_data: Record<string, any>;
  pdf_url?: string;
  status: 'draft' | 'preview' | 'finalized' | 'sent';
  version: number;
  created_at: string;
  updated_at: string;
  metadata: {
    property_address?: string;
    document_title?: string;
    parties_involved?: string[];
    transaction_value?: number;
  };
}

export interface DocumentPreview {
  document_id: string;
  preview_url: string;
  filled_fields: Record<string, any>;
  signature_locations: SignatureLocation[];
  validation_status: 'valid' | 'invalid' | 'warnings';
  validation_issues: ValidationIssue[];
}

export interface SignatureLocation {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'signature' | 'initial' | 'date';
  party: 'buyer' | 'seller' | 'agent' | 'witness';
  required: boolean;
}

export interface ValidationIssue {
  field_id: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}