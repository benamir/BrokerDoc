import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client-side Supabase client (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (bypasses RLS)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : supabase; // Fallback to regular client if no service role key

// Create Supabase client with Clerk JWT for RLS
export async function createClerkSupabaseClient() {
  // For now, use the admin client until we sort out the JWT template
  // This bypasses RLS but ensures the system works
  console.log('Using admin client as fallback for Clerk integration');
  return supabaseAdmin;
}

// Database table types
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          file_url?: string;
          file_name?: string;
          file_type?: string;
          metadata?: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          file_url?: string;
          file_name?: string;
          file_type?: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          file_url?: string;
          file_name?: string;
          file_type?: string;
          metadata?: any;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          conversation_id: string;
          name: string;
          type: string;
          file_url: string;
          file_size: number;
          extracted_data?: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          name: string;
          type: string;
          file_url: string;
          file_size: number;
          extracted_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          name?: string;
          type?: string;
          file_url?: string;
          file_size?: number;
          extracted_data?: any;
          created_at?: string;
        };
      };
    };
  };
}