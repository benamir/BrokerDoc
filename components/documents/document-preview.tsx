'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Download, 
  Edit3, 
  Check, 
  AlertCircle, 
  X,
  ExternalLink
} from 'lucide-react';
import { GeneratedDocument, DocumentPreview, ValidationIssue } from '@/types';

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./pdf-viewer').then(mod => ({ default: mod.PDFViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
      <div className="text-sm text-gray-600">Loading PDF viewer...</div>
    </div>
  )
});

interface DocumentPreviewProps {
  document: GeneratedDocument | null;
  preview?: DocumentPreview | null;
  onEdit?: (fieldName: string, value: any) => void;
  onFinalize?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
}

export function DocumentPreviewComponent({ 
  document, 
  preview, 
  onEdit, 
  onFinalize, 
  onClose,
  isLoading = false 
}: DocumentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'fields' | 'validation'>('preview');

  if (!document) {
    return null;
  }

  const fieldData = document.document_data;
  const validationIssues = preview?.validation_issues || [];
  const hasErrors = validationIssues.some(issue => issue.severity === 'error');
  const hasWarnings = validationIssues.some(issue => issue.severity === 'warning');

  return (
    <div className="w-full bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Document Preview</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Document Title and Status */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-2">
          {document.metadata?.document_title || 'Generated Document'}
        </h4>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            document.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            document.status === 'preview' ? 'bg-blue-100 text-blue-800' :
            document.status === 'finalized' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </span>
          {hasErrors && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Errors
            </span>
          )}
          {hasWarnings && !hasErrors && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Warnings
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('fields')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'fields'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fields
        </button>
        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 px-4 py-2 text-sm font-medium relative ${
            activeTab === 'validation'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Validation
          {(hasErrors || hasWarnings) && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {activeTab === 'preview' && (
          <div className="p-4">
            {document.pdf_url ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-900">PDF Document</span>
                    <Button variant="outline" size="sm" asChild>
                      <a href={document.pdf_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open PDF
                      </a>
                    </Button>
                  </div>
                  
                  {/* PDF Viewer - Simple iframe approach */}
                  <div className="border rounded-lg bg-gray-50 p-2">
                    <div className="bg-white border rounded text-center">
                      <iframe
                        src={document.pdf_url}
                        width="100%"
                        height="500"
                        style={{ border: 'none' }}
                        title="PDF Document"
                        className="rounded"
                      />
                    </div>
                  </div>
                </Card>

                {/* Key Information Summary */}
                <Card className="p-4">
                  <h5 className="font-medium text-gray-900 mb-3">Document Summary</h5>
                  <div className="space-y-2 text-sm">
                    {document.metadata?.property_address && (
                      <div>
                        <span className="font-medium text-gray-700">Property:</span>
                        <span className="ml-2 text-gray-600">{document.metadata.property_address}</span>
                      </div>
                    )}
                    {document.metadata?.transaction_value && (
                      <div>
                        <span className="font-medium text-gray-700">Price:</span>
                        <span className="ml-2 text-gray-600">
                          ${document.metadata.transaction_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {document.metadata?.parties_involved && document.metadata.parties_involved.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Parties:</span>
                        <span className="ml-2 text-gray-600">
                          {document.metadata.parties_involved.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Document is being generated...</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="p-4 space-y-3">
            {Object.entries(fieldData).map(([key, value]) => (
              <FieldDisplay
                key={key}
                fieldName={key}
                value={value}
                onEdit={onEdit}
                editable={document.status === 'draft' || document.status === 'preview'}
              />
            ))}
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="p-4 space-y-3">
            {validationIssues.length === 0 ? (
              <div className="text-center py-8">
                <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-600 font-medium">All validations passed!</p>
                <p className="text-sm text-gray-500 mt-1">
                  Your document is ready to be finalized.
                </p>
              </div>
            ) : (
              validationIssues.map((issue, index) => (
                <ValidationIssueDisplay key={index} issue={issue} />
              ))
            )}
          </div>
        )}
      </ScrollArea>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {document.pdf_url && (
          <Button variant="outline" className="w-full" asChild>
            <a href={document.pdf_url} download>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </a>
          </Button>
        )}
        
        {onFinalize && document.status === 'preview' && !hasErrors && (
          <Button 
            className="w-full" 
            onClick={onFinalize}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Finalize Document'}
          </Button>
        )}

        {hasErrors && (
          <p className="text-sm text-red-600 text-center">
            Please fix all errors before finalizing the document.
          </p>
        )}
      </div>
    </div>
  );
}

interface FieldDisplayProps {
  fieldName: string;
  value: any;
  onEdit?: (fieldName: string, value: any) => void;
  editable: boolean;
}

function FieldDisplay({ fieldName, value, onEdit, editable }: FieldDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onEdit?.(fieldName, editValue);
    setIsEditing(false);
  };

  const formatFieldName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === '') return 'Not provided';
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'number' && fieldName.includes('price')) {
      return `$${val.toLocaleString()}`;
    }
    return String(val);
  };

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h6 className="text-sm font-medium text-gray-900 mb-1">
            {formatFieldName(fieldName)}
          </h6>
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={handleSave}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(value);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">{formatValue(value)}</p>
          )}
        </div>
        {editable && !isEditing && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Card>
  );
}

interface ValidationIssueDisplayProps {
  issue: ValidationIssue;
}

function ValidationIssueDisplay({ issue }: ValidationIssueDisplayProps) {
  const getIcon = () => {
    switch (issue.severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCardStyle = () => {
    switch (issue.severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={`p-3 ${getCardStyle()}`}>
      <div className="flex items-start space-x-2">
        {getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{issue.message}</p>
          {issue.suggestion && (
            <p className="text-xs text-gray-600 mt-1">{issue.suggestion}</p>
          )}
        </div>
      </div>
    </Card>
  );
}