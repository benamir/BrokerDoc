import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (convError) {
      return new NextResponse('Conversation not found', { status: 404 });
    }

    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return new NextResponse('Failed to fetch messages', { status: 500 });
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}