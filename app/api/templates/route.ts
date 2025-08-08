import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const region = searchParams.get('region');

    const supabase = await createClerkSupabaseClient();

    let query = supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    // Filter by region if provided
    if (region) {
      query = query.eq('region', region);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return new NextResponse('Failed to fetch templates', { status: 500 });
    }

    return NextResponse.json(templates);

  } catch (error) {
    console.error('Templates API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only admin users can create templates
    const userRole = user.publicMetadata?.role || user.unsafeMetadata?.role;
    if (userRole !== 'admin') {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    const templateData = await request.json();

    const supabase = await createClerkSupabaseClient();

    const { data: template, error } = await supabase
      .from('document_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return new NextResponse('Failed to create template', { status: 500 });
    }

    return NextResponse.json(template);

  } catch (error) {
    console.error('Create template API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}