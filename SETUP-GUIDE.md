# BrokerDoc AI Chat System Setup Guide

## 🎯 Overview

This guide walks you through setting up the complete AI chat interface for BrokerDoc, including database setup, API configuration, and testing.

## 📋 Prerequisites

✅ BrokerDoc base application running  
✅ Clerk authentication configured  
✅ Supabase account and project created  
✅ OpenAI API account and key  

## 🗄️ Database Setup

### 1. Create Supabase Tables

1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL commands from `supabase-setup.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    extracted_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- (Continue with the full SQL from supabase-setup.sql)
```

### 2. Create Storage Bucket

1. Go to Storage → Create bucket
2. Name: `documents`
3. Public: `true`
4. Click "Create bucket"

### 3. Set Up Storage Policies

In the Storage section, create these policies for the `documents` bucket:

```sql
-- Users can upload documents
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their documents
CREATE POLICY "Users can view their documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔑 Environment Variables

Update your `.env.local` file with the required API keys:

```env
# Clerk Authentication (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Getting Your Keys:

**Supabase:**
1. Supabase Dashboard → Settings → API
2. Copy "Project URL" and "anon/public" key

**OpenAI:**
1. OpenAI Platform → API Keys
2. Create new key and copy it

## 🚀 Features Implemented

### ✅ Complete Chat Interface
- **Claude-like UI** with conversation sidebar
- **Message bubbles** with user/AI distinction
- **Real-time streaming** responses
- **Professional styling** matching BrokerDoc theme

### ✅ File Upload System
- **Drag & drop** PDF upload
- **File size validation** (max 10MB)
- **File type validation** (PDF only)
- **Visual upload progress**
- **Supabase Storage** integration

### ✅ AI Integration
- **OpenAI GPT-4** integration
- **Streaming responses** for real-time chat
- **Real estate-specific** system prompt
- **Document analysis** capabilities
- **Context-aware** conversations

### ✅ Database Management
- **Conversation persistence**
- **Message history**
- **File metadata** storage
- **User isolation** with RLS
- **Automatic cleanup** on conversation delete

### ✅ State Management
- **Zustand store** for chat state
- **Real-time updates**
- **Loading states**
- **Error handling**

## 🎨 UI Components Created

1. **`MessageBubble`** - Displays individual messages with timestamps
2. **`ChatInput`** - Input area with file upload and send functionality
3. **`ConversationSidebar`** - Lists conversations with create/delete actions
4. **`ChatInterface`** - Main chat area with welcome screen
5. **`DashboardContent`** - Wrapper component for the entire chat system

## 🔧 API Routes

- **`/api/chat`** - Handles message sending and AI responses
- **`/api/conversations`** - CRUD operations for conversations
- **`/api/conversations/[id]`** - Individual conversation management
- **`/api/conversations/[id]/messages`** - Message retrieval
- **`/api/upload`** - File upload to Supabase Storage

## 🧪 Testing the System

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Test Authentication
1. Sign up/sign in through Clerk
2. Complete onboarding process
3. Access dashboard

### 3. Test Chat Functionality
1. Click "New Conversation"
2. Send a text message
3. Wait for AI response (streaming)
4. Upload a PDF file
5. Ask questions about the uploaded document

### 4. Test File Upload
1. Drag a PDF into the upload area
2. Verify file appears in message
3. Check Supabase Storage for uploaded file
4. Verify document record in database

## 🛠️ Customization Options

### AI Personality
Edit the system prompt in `/app/api/chat/route.ts`:

```typescript
const systemPrompt = `You are BrokerDoc AI, an intelligent assistant for real estate brokers...`;
```

### File Types
Modify accepted file types in `/components/chat/chat-input.tsx`:

```typescript
accept: {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
}
```

### UI Styling
Update component styles in individual component files to match your brand.

## 🔒 Security Features

- **Row Level Security** (RLS) on all tables
- **User isolation** - users can only access their own data
- **File type validation** 
- **File size limits**
- **Authentication required** for all API routes
- **CSRF protection** built into Next.js

## 📱 Mobile Responsiveness

The chat interface is fully responsive and works on:
- ✅ Desktop computers
- ✅ Tablets
- ✅ Mobile phones

## 🚀 Next Steps

1. **Set up your API keys** in `.env.local`
2. **Run the database setup** in Supabase
3. **Test the complete flow**
4. **Customize the AI prompts** for your specific use case
5. **Add additional file types** if needed
6. **Implement document analysis features**

## 🆘 Troubleshooting

### Common Issues:

**Chat not working:**
- Check OpenAI API key in `.env.local`
- Verify Supabase connection
- Check browser console for errors

**File upload failing:**
- Verify Supabase Storage bucket exists
- Check storage policies are set correctly
- Ensure file is under 10MB and is PDF

**Database errors:**
- Verify all tables are created
- Check RLS policies are enabled
- Ensure user authentication is working

**Streaming not working:**
- Check OpenAI API key
- Verify network connection
- Check browser supports Server-Sent Events

Your BrokerDoc AI chat system is now ready for production use! 🎉