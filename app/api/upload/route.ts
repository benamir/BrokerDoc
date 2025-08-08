import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

    // Validate file type (only PDFs for now)
    if (file.type !== 'application/pdf') {
      return new NextResponse('Only PDF files are supported', { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return new NextResponse('File size must be less than 10MB', { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${conversationId}/${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new NextResponse('Failed to upload file', { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Save document record to database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        conversation_id: conversationId,
        name: file.name,
        type: file.type,
        file_url: publicUrl,
        file_size: file.size,
      })
      .select()
      .single();

    if (docError) {
      console.error('Error saving document record:', docError);
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([fileName]);
      return new NextResponse('Failed to save document record', { status: 500 });
    }

    return NextResponse.json({
      id: document.id,
      url: publicUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}