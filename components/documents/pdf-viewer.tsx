'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface PDFViewerProps {
  file: string;
  onLoadSuccess?: ({ numPages }: { numPages: number }) => void;
  onLoadError?: (error: Error) => void;
}

export function PDFViewer({ file, onLoadSuccess, onLoadError }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(0.8);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Configure PDF.js worker
  useEffect(() => {
    // Use JSDelivr CDN which is more reliable
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    onLoadSuccess?.({ numPages });
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF loading error:', error);
    setError(error.message);
    setLoading(false);
    onLoadError?.(error);
  };

  const changePage = (delta: number) => {
    setPageNumber(prev => Math.min(Math.max(prev + delta, 1), numPages));
  };

  const changeScale = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.3), 2.0));
  };

  return (
    <div className="border rounded-lg bg-gray-50 p-2">
      {/* Controls */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => changeScale(-0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-gray-600">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" onClick={() => changeScale(0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        {numPages > 1 && (
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              {pageNumber} / {numPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-gray-600">Loading PDF...</div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-sm text-red-600">Error loading PDF: {error}</div>
        </div>
      )}
      
      {/* PDF Document */}
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading=""
      >
        <Page 
          pageNumber={pageNumber} 
          scale={scale}
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
    </div>
  );
}