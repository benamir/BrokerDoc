'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ChatInputProps {
  onSendMessage: (content: string, file?: File) => void;
  isLoading?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ onSendMessage, isLoading = false, isStreaming = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile) || isLoading || isStreaming) {
      return;
    }

    onSendMessage(message.trim(), selectedFile || undefined);
    setMessage('');
    setSelectedFile(null);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const disabled = isLoading || isStreaming;

  return (
    <div className="bg-white p-4">
      {/* File upload area */}
      <div
        {...getRootProps()}
        className={`mb-4 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <div className="flex items-center justify-between bg-gray-100 rounded p-2">
            <div className="flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div>
            <Paperclip className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isDragActive
                ? 'Drop your PDF here...'
                : 'Drag & drop a PDF file here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF files up to 10MB</p>
          </div>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your real estate documents or upload a PDF for analysis..."
            disabled={disabled}
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
            rows={1}
          />
          
          {/* Character count or status */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {isStreaming && (
              <span className="text-blue-600">AI is responding...</span>
            )}
            {isLoading && !isStreaming && (
              <span className="text-blue-600">Sending...</span>
            )}
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={disabled || (!message.trim() && !selectedFile)}
          className="self-end"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}