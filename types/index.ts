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