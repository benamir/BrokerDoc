'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, FileText, FolderOpen, BarChart3, Settings } from 'lucide-react';
import { useChatStore } from '@/lib/chat-store';
import { Conversation } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';

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

interface ConversationSidebarProps {
  user: UserData;
  onNewConversation: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function ConversationSidebar({ user, onNewConversation, isCollapsed = false, onToggle }: ConversationSidebarProps) {
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    loadConversation,
    setConversations,
  } = useChatStore();

  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, [setConversations]);

  const handleConversationClick = async (conversation: Conversation) => {
    if (currentConversation?.id === conversation.id) return;
    
    setCurrentConversation(conversation);
    await loadConversation(conversation.id);
  };

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        const updatedConversations = conversations.filter(c => c.id !== conversationId);
        setConversations(updatedConversations);
        
        // If this was the current conversation, clear it
        if (currentConversation?.id === conversationId) {
          setCurrentConversation(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className={`relative bg-gray-800 text-white flex flex-col h-full transition-all duration-200 ease-in-out ${
      isCollapsed ? 'w-12' : 'w-80'
    }`}>
      {/* Toggle Button */}
      <div className="absolute top-4 -right-3 z-10">
        <Button
          onClick={onToggle}
          variant="outline"
          size="sm"
          className="h-6 w-6 p-0 bg-white border border-gray-300 shadow-sm hover:bg-gray-50 text-gray-800"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Header with Logo */}
      <div className={`flex items-center border-b border-gray-700 ${isCollapsed ? 'p-2 justify-center' : 'p-4 space-x-2'}`}>
        <FileText className="h-6 w-6 text-blue-400 flex-shrink-0" />
        {!isCollapsed && <h1 className="text-lg font-bold">BrokerDoc</h1>}
      </div>

      {/* New Chat Button */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-700`}>
        {isCollapsed ? (
          <Button
            onClick={onNewConversation}
            className="w-full justify-center bg-orange-600 hover:bg-orange-700"
            size="sm"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onNewConversation}
            className="w-full justify-start gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        )}
      </div>

      {/* Navigation Menu */}
      {!isCollapsed && (
        <nav className="p-4 space-y-2 border-b border-gray-700">
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chats
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Projects
          </Button>
          <Button variant="ghost" className="w-full justify-start text-white hover:bg-gray-700" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Artifacts
          </Button>
        </nav>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-hidden">
        {!isCollapsed && (
          <>
            <div className="px-4 py-2">
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recents</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="px-2 pb-2 space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationClick(conversation)}
                      className={`group relative p-2 rounded-md cursor-pointer transition-colors ${
                        currentConversation?.id === conversation.id
                          ? 'bg-gray-700'
                          : 'hover:bg-gray-700'
                      }`}
                    >
                      <div className="pr-6">
                        <h3 className="text-sm text-white truncate">
                          {conversation.title}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </>
        )}

        {/* Collapsed state indicator */}
        {isCollapsed && conversations.length > 0 && (
          <div className="flex flex-col items-center py-4 space-y-2">
            {conversations.slice(0, 4).map((conversation) => (
              <Button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                variant="ghost"
                size="sm"
                className={`w-8 h-8 p-0 rounded-md ${
                  currentConversation?.id === conversation.id 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
                title={conversation.title}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            ))}
            {conversations.length > 4 && (
              <div className="text-xs text-gray-500 text-center mt-2">
                +{conversations.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Profile at Bottom */}
      <div className={`border-t border-gray-700 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        {isCollapsed ? (
          <div className="flex justify-center">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 cursor-pointer hover:opacity-80",
                  userButtonPopoverCard: "bg-white shadow-lg border border-gray-200",
                  userButtonPopoverActionButton: "hover:bg-gray-50 text-gray-700",
                  userButtonPopoverActionButtonIcon: "text-gray-500",
                }
              }}
              showName={false}
            />
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 cursor-pointer hover:opacity-80",
                  userButtonPopoverCard: "bg-white shadow-lg border border-gray-200",
                  userButtonPopoverActionButton: "hover:bg-gray-50 text-gray-700",
                  userButtonPopoverActionButtonIcon: "text-gray-500",
                }
              }}
              showName={false}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user.unsafeMetadata?.brokerageName || 'Pro plan'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}