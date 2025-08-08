'use client';

import { Message } from '@/types';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <Avatar className="h-8 w-8">
            <div className="bg-blue-600 text-white h-full w-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </Avatar>
        ) : (
          <Avatar className="h-8 w-8">
            <div className="bg-purple-600 text-white h-full w-full flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
          </Avatar>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
        <Card className={`${
          isUser 
            ? 'bg-blue-600 text-white border-blue-600' 
            : isSystem 
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
        }`}>
          <CardContent className="p-3">
            {/* File attachment preview */}
            {message.file_name && (
              <div className={`flex items-center gap-2 mb-2 p-2 rounded ${
                isUser ? 'bg-blue-700' : 'bg-gray-100'
              }`}>
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{message.file_name}</span>
              </div>
            )}
            
            {/* Message text */}
            <div className={`text-sm whitespace-pre-wrap ${
              isUser 
                ? 'text-white' 
                : isSystem 
                  ? 'text-amber-800'
                  : 'text-gray-800'
            }`}>
              {message.content}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-current opacity-75 animate-pulse ml-1" />
              )}
            </div>
            
            {/* Timestamp */}
            <div className={`text-xs mt-2 ${
              isUser 
                ? 'text-blue-100' 
                : isSystem 
                  ? 'text-amber-600'
                  : 'text-gray-500'
            }`}>
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}