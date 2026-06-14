import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // Get the category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', params.slug)
      .single();

    if (catError) throw catError;

    // Get subcategories for this category
    const { data: subcategories, error: subError } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', category.id)
      .order('display_order', { ascending: true });

    if (subError) throw subError;

    return NextResponse.json({ category, subcategories });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}
