import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const supabase = await createClerkSupabaseClient();
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return new NextResponse('Failed to fetch conversations', { status: 500 });
    }

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Conversations API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { title } = await request.json();

    const supabase = await createClerkSupabaseClient();
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title || 'New Conversation',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return new NextResponse('Failed to create conversation', { status: 500 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Create conversation API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}