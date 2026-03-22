import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const subject = searchParams.get('subject') || '';
  const status = searchParams.get('status') || 'available';

  let query = supabaseAdmin
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  if (type) query = query.eq('type', type);
  if (subject) query = query.eq('subject', subject);
  if (search) {
    query = query.or(
      `title.ilike.%${search}%,author.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Map condition_detail to Shopee condition
    const condition = body.condition_detail?.startsWith('Novo') ? 'Novo' : 'Usado';

    const { data, error } = await supabaseAdmin
      .from('books')
      .insert({
        ...body,
        condition,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar livro' }, { status: 500 });
  }
}
