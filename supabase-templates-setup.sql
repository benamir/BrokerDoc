-- Document Template System Database Schema
-- Run this after the main supabase-setup.sql

-- Create enum types for better type safety
CREATE TYPE document_template_type AS ENUM ('purchase_agreement', 'listing_agreement', 'lease_agreement', 'disclosure');
CREATE TYPE template_region AS ENUM ('ontario', 'bc', 'alberta', 'quebec');
CREATE TYPE field_type AS ENUM ('text', 'number', 'date', 'currency', 'email', 'phone', 'address', 'boolean');
CREATE TYPE document_status AS ENUM ('draft', 'preview', 'finalized', 'sent');
CREATE TYPE validation_severity AS ENUM ('error', 'warning', 'info');
CREATE TYPE signature_type AS ENUM ('signature', 'initial', 'date');
CREATE TYPE signature_party AS ENUM ('buyer', 'seller', 'agent', 'witness');

-- Document Templates table
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type document_template_type NOT NULL,
  region template_region NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  description text,
  pdf_form_url text NOT NULL,
  required_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  optional_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  signature_locations jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Generated Documents table
CREATE TABLE public.generated_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id text NOT NULL, -- Clerk user ID
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.document_templates(id) ON DELETE RESTRICT,
  document_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  status document_status DEFAULT 'draft',
  version integer DEFAULT 1,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Document Extractions table (for tracking AI extractions)
CREATE TABLE public.document_extractions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.document_templates(id) ON DELETE RESTRICT,
  user_input text NOT NULL,
  extracted_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_scores jsonb DEFAULT '{}'::jsonb,
  missing_required_fields jsonb DEFAULT '[]'::jsonb,
  suggestions jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates (public read, admin write)
CREATE POLICY "Anyone can view active templates" ON public.document_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin users can manage templates" ON public.document_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for generated_documents (users can only access their own)
CREATE POLICY "Users can view their own generated documents" ON public.generated_documents
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create their own generated documents" ON public.generated_documents
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own generated documents" ON public.generated_documents
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own generated documents" ON public.generated_documents
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- RLS Policies for document_extractions
CREATE POLICY "Users can view their own extractions" ON public.document_extractions
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create extractions for their conversations" ON public.document_extractions
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

-- Indexes for better performance
CREATE INDEX idx_document_templates_type_region ON public.document_templates(type, region);
CREATE INDEX idx_document_templates_active ON public.document_templates(is_active);
CREATE INDEX idx_generated_documents_user_id ON public.generated_documents(user_id);
CREATE INDEX idx_generated_documents_conversation_id ON public.generated_documents(conversation_id);
CREATE INDEX idx_generated_documents_template_id ON public.generated_documents(template_id);
CREATE INDEX idx_generated_documents_status ON public.generated_documents(status);
CREATE INDEX idx_document_extractions_conversation_id ON public.document_extractions(conversation_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON public.document_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_documents_updated_at BEFORE UPDATE ON public.generated_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a storage bucket for PDF templates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pdf-templates', 'pdf-templates', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Create a storage bucket for generated documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('generated-documents', 'generated-documents', false, 52428800, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for PDF templates (public read for active templates)
CREATE POLICY "Anyone can view PDF templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'pdf-templates');

CREATE POLICY "Admin users can upload PDF templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'pdf-templates' AND auth.jwt() ->> 'role' = 'admin');

-- Set up storage policies for generated documents (user-specific access)
CREATE POLICY "Users can view their own generated PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'generated-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload generated PDFs to their folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'generated-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own generated PDFs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'generated-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own generated PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'generated-documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );