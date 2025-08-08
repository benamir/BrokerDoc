import { create } from 'zustand';
import { GeneratedDocument, DocumentPreview, DocumentTemplate } from '@/types';

interface DocumentState {
  // Current document being worked on
  currentDocument: GeneratedDocument | null;
  currentPreview: DocumentPreview | null;
  
  // Available templates
  templates: DocumentTemplate[];
  
  // Document generation state
  isGenerating: boolean;
  generationError: string | null;
  
  // UI state
  isPreviewOpen: boolean;
  
  // Actions
  setCurrentDocument: (document: GeneratedDocument | null) => void;
  setCurrentPreview: (preview: DocumentPreview | null) => void;
  setTemplates: (templates: DocumentTemplate[]) => void;
  setIsGenerating: (loading: boolean) => void;
  setGenerationError: (error: string | null) => void;
  setPreviewOpen: (open: boolean) => void;
  
  // API actions
  loadTemplates: () => Promise<void>;
  generateDocument: (templateId: string, data: Record<string, any>, conversationId: string) => Promise<GeneratedDocument | null>;
  updateDocumentField: (fieldName: string, value: any) => Promise<void>;
  finalizeDocument: () => Promise<void>;
  
  // Reset state
  resetDocumentState: () => void;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Initial state
  currentDocument: null,
  currentPreview: null,
  templates: [],
  isGenerating: false,
  generationError: null,
  isPreviewOpen: false,

  // Setters
  setCurrentDocument: (document) => set({ currentDocument: document }),
  setCurrentPreview: (preview) => set({ currentPreview: preview }),
  setTemplates: (templates) => set({ templates }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerationError: (generationError) => set({ generationError }),
  setPreviewOpen: (isPreviewOpen) => set({ isPreviewOpen }),

  // Load available templates
  loadTemplates: async () => {
    try {
      const response = await fetch('/api/templates?region=ontario');
      if (response.ok) {
        const templates = await response.json();
        set({ templates });
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  },

  // Generate a new document
  generateDocument: async (templateId: string, data: Record<string, any>, conversationId: string) => {
    const { setIsGenerating, setGenerationError, setCurrentDocument, setPreviewOpen } = get();
    
    try {
      setIsGenerating(true);
      setGenerationError(null);

      const response = await fetch('/api/documents/fill-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          documentData: data,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const result = await response.json();
      const document = result.document;

      setCurrentDocument(document);
      setPreviewOpen(true);
      
      return document;
    } catch (error) {
      console.error('Document generation error:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate document');
      return null;
    } finally {
      setIsGenerating(false);
    }
  },

  // Update a field in the current document
  updateDocumentField: async (fieldName: string, value: any) => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    try {
      const updatedData = {
        ...currentDocument.document_data,
        [fieldName]: value,
      };

      const response = await fetch(`/api/documents/${currentDocument.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_data: updatedData,
        }),
      });

      if (response.ok) {
        const updatedDocument = await response.json();
        set({ currentDocument: updatedDocument });
        
        // Regenerate the document with updated data
        await get().generateDocument(
          currentDocument.template_id,
          updatedData,
          currentDocument.conversation_id
        );
      }
    } catch (error) {
      console.error('Failed to update document field:', error);
    }
  },

  // Finalize the current document
  finalizeDocument: async () => {
    const { currentDocument } = get();
    if (!currentDocument) return;

    try {
      const response = await fetch(`/api/documents/${currentDocument.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'finalized',
        }),
      });

      if (response.ok) {
        const updatedDocument = await response.json();
        set({ currentDocument: updatedDocument });
      }
    } catch (error) {
      console.error('Failed to finalize document:', error);
    }
  },

  // Reset all document state
  resetDocumentState: () => {
    set({
      currentDocument: null,
      currentPreview: null,
      isGenerating: false,
      generationError: null,
      isPreviewOpen: false,
    });
  },
}));

// Helper function to get template by type and region
export function getTemplateByType(templates: DocumentTemplate[], type: string, region: string = 'ontario'): DocumentTemplate | null {
  return templates.find(template => 
    template.type === type && 
    template.region === region && 
    template.is_active
  ) || null;
}

// Helper function to validate document data against template
export function validateDocumentData(template: DocumentTemplate, data: Record<string, any>) {
  const missingRequired: string[] = [];
  const validationErrors: Array<{ field: string; message: string }> = [];

  // Check required fields
  template.required_fields.forEach(field => {
    if (!data[field.name] || data[field.name] === '') {
      missingRequired.push(field.name);
    }
  });

  // Additional validation logic can be added here
  
  return {
    isValid: missingRequired.length === 0 && validationErrors.length === 0,
    missingRequired,
    validationErrors
  };
}