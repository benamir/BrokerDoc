'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ConversationSidebar } from '@/components/chat/conversation-sidebar';
import { useChatStore } from '@/lib/chat-store';
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

  const handleNewConversation = async () => {
    try {
      await createNewConversation();
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-full relative">
      <ConversationSidebar 
        user={user}
        onNewConversation={handleNewConversation}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
      />
      <ChatInterface />
    </div>
  );
}