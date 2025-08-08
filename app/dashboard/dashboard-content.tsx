'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { DocumentPreviewComponent } from '@/components/documents/document-preview';
// Removed DocumentTestButton import - using real AI chat flow now
import { useChatStore } from '@/lib/chat-store';
import { useDocumentStore } from '@/lib/document-store';
// Define a simplified user type for client components
interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: {
    id: string;
    emailAddress: string;
  }[];
  unsafeMetadata: Record<string, any>;
}

interface DashboardContentProps {
  user: UserData;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { createNewConversation } = useChatStore();
  const { 
    currentDocument, 
    currentPreview, 
    isPreviewOpen, 
    isGenerating,
    setPreviewOpen,
    updateDocumentField,
    finalizeDocument,
    resetDocumentState
  } = useDocumentStore();

  const handleNewConversation = async () => {
    try {
      // Reset document state when starting a new conversation
      resetDocumentState();
      await createNewConversation();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  return (
    <div className="flex h-full relative">
      {/* Left Sidebar - Claude-like narrow width */}
      <ConversationSidebar 
        user={user}
        onNewConversation={handleNewConversation}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex h-full min-w-0">
        {/* Chat Interface - Takes remaining space when no preview */}
        <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${
          isPreviewOpen && currentDocument ? 'w-[35%]' : 'w-full'
        }`}>
          <ChatInterface />
        </div>
        
        {/* Document Preview Panel - Larger right panel for better document viewing */}
        {isPreviewOpen && currentDocument && (
          <div className="w-[49%] h-full border-l border-gray-200 bg-white flex-shrink-0">
            <DocumentPreviewComponent
              document={currentDocument}
              preview={currentPreview}
              onEdit={updateDocumentField}
              onFinalize={finalizeDocument}
              onClose={handleClosePreview}
              isLoading={isGenerating}
            />
          </div>
        )}
      </div>
    </div>
  );
}