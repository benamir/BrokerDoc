import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table types
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          title: string;
          file_name: string;
          file_size: number;
          file_type: string;
          uploaded_by: string;
          category: string;
          status: string;
          ai_analysis: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          file_name: string;
          file_size: number;
          file_type: string;
          uploaded_by: string;
          category: string;
          status?: string;
          ai_analysis?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          uploaded_by?: string;
          category?: string;
          status?: string;
          ai_analysis?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}