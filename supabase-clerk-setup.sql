-- Supabase + Clerk Integration Setup
-- Run this after setting up JWT template in Clerk

-- First, let's re-enable RLS on our tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Update RLS policies to work with Clerk authentication
-- The auth.jwt() function will contain the Clerk user ID

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view documents from their conversations" ON documents;
DROP POLICY IF EXISTS "Users can insert documents to their conversations" ON documents;

-- Create new policies that work with Clerk JWTs
-- For conversations table
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can delete their own conversations" ON conversations
    FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- For messages table
CREATE POLICY "Users can view messages from their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert messages to their conversations" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id = auth.jwt() ->> 'sub'
        )
    );

-- For documents table
CREATE POLICY "Users can view documents from their conversations" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = documents.conversation_id 
            AND conversations.user_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "Users can insert documents to their conversations" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = documents.conversation_id 
            AND conversations.user_id = auth.jwt() ->> 'sub'
        )
    );

-- Note: You'll also need to configure JWT settings in Supabase Dashboard
-- Go to Authentication > Settings > JWT Settings
-- Add your Clerk JWKS URL: https://YOUR_CLERK_DOMAIN/.well-known/jwks.json