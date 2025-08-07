// Custom hook for file uploads
import { useState, useCallback } from 'react';
import { UploadProgress } from '@/types';

export const useUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(async (files: File[]) => {
    setIsUploading(true);
    
    // Initialize progress tracking
    const initialProgress: UploadProgress[] = files.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));
    
    setUploadProgress(initialProgress);

    try {
      // TODO: Implement actual file upload logic
      // This is a placeholder that simulates upload progress
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setUploadProgress(prev => 
            prev.map((item, index) => 
              index === i 
                ? { ...item, progress }
                : item
            )
          );
        }
        
        // Mark as complete
        setUploadProgress(prev => 
          prev.map((item, index) => 
            index === i 
              ? { ...item, status: 'complete' }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => 
        prev.map(item => ({ ...item, status: 'error', error: 'Upload failed' }))
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const clearProgress = useCallback(() => {
    setUploadProgress([]);
  }, []);

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    clearProgress
  };
};