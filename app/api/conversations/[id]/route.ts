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
    const { data: conversation, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching conversation:', error);
      return new NextResponse('Conversation not found', { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Get conversation API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting conversation:', error);
      return new NextResponse('Failed to delete conversation', { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Delete conversation API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}