'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './message-bubble';
import { ChatInput } from './chat-input';
import { useChatStore } from '@/lib/chat-store';
import { FileText, Sparkles } from 'lucide-react';

export function ChatInterface() {
  const {
    currentConversation,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendMessage = async (content: string, file?: File) => {
    if (!currentConversation) return;
    await sendMessage(content, file);
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to BrokerDoc AI
          </h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Your intelligent assistant for real estate document preparation and analysis. 
            Start a new conversation to get help with your documents.
          </p>
          <div className="bg-white rounded-lg p-4 border border-gray-200 max-w-md mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">I can help you with:</h3>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Analyzing real estate contracts and agreements
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Extracting key information from documents
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Identifying missing required fields
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Providing compliance guidance
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b border-gray-200 p-4 bg-white">
        <h2 className="font-semibold text-gray-900 truncate">
          {currentConversation.title}
        </h2>
        <p className="text-sm text-gray-500">
          AI-powered real estate document assistant
        </p>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4 min-h-full">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start the conversation
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Upload a document or ask me anything about real estate document preparation.
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  isStreaming={
                    isStreaming && 
                    index === messages.length - 1 && 
                    message.role === 'assistant'
                  }
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200">
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
}