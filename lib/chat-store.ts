import { create } from 'zustand';
import { Conversation, Message, ChatDocument, ChatState, UploadProgress } from '@/types';

interface ChatActions {
  // Conversation management
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  
  // Message management
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  
  // Loading states
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  
  // File upload
  setUploadProgress: (fileId: string, progress: UploadProgress) => void;
  clearUploadProgress: (fileId: string) => void;
  
  // Actions
  createNewConversation: () => Promise<Conversation>;
  sendMessage: (content: string, file?: File) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  // State
  conversations: [],
  currentConversation: null,
  messages: [],
  isLoading: false,
  isStreaming: false,
  uploadProgress: {},

  // Conversation management
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations]
    })),
  
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),

  // Message management
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message]
    })),
  
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      )
    })),

  // Loading states
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),

  // File upload
  setUploadProgress: (fileId, progress) =>
    set((state) => ({
      uploadProgress: { ...state.uploadProgress, [fileId]: progress }
    })),
  
  clearUploadProgress: (fileId) =>
    set((state) => {
      const { [fileId]: removed, ...rest } = state.uploadProgress;
      return { uploadProgress: rest };
    }),

  // Actions
  createNewConversation: async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' })
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      
      const conversation = await response.json();
      get().addConversation(conversation);
      get().setCurrentConversation(conversation);
      get().setMessages([]);
      
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    }
  },

  sendMessage: async (content: string, file?: File) => {
    const { currentConversation } = get();
    if (!currentConversation) return;

    // Add user message immediately
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    get().addMessage(userMessage);
    get().setIsLoading(true);

    try {
      // Handle file upload if present
      let fileUrl, fileName, fileType;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', currentConversation.id);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          fileUrl = uploadResult.url;
          fileName = file.name;
          fileType = file.type;
        }
      }

      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          message: content,
          fileUrl,
          fileName,
          fileType,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Handle streaming response
      get().setIsStreaming(true);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: currentConversation.id,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };

      get().addMessage(assistantMessage);

      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantContent += parsed.content;
                get().updateMessage(assistantMessage.id, { content: assistantContent });
              }
            } catch (e) {
              // Ignore parsing errors for streaming
            }
          }
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error message
      get().addMessage({
        id: `error-${Date.now()}`,
        conversation_id: currentConversation.id,
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        created_at: new Date().toISOString(),
      });
    } finally {
      get().setIsLoading(false);
      get().setIsStreaming(false);
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      get().setIsLoading(true);
      
      const [conversationResponse, messagesResponse] = await Promise.all([
        fetch(`/api/conversations/${conversationId}`),
        fetch(`/api/conversations/${conversationId}/messages`)
      ]);

      if (!conversationResponse.ok || !messagesResponse.ok) {
        throw new Error('Failed to load conversation');
      }

      const conversation = await conversationResponse.json();
      const messages = await messagesResponse.json();

      get().setCurrentConversation(conversation);
      get().setMessages(messages);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      get().setIsLoading(false);
    }
  },
}));