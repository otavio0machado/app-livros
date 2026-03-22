import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

function parseMedia(row: Record<string, unknown>) {
  if (row.media && typeof row.media === 'string') {
    try { row.media = JSON.parse(row.media as string); } catch { row.media = []; }
  }
  if (!row.media) row.media = [];
  return row;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const subject = searchParams.get('subject') || '';
  const status = searchParams.get('status') || 'available';

  const supabase = getSupabaseAdmin();
  let query = supabase
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

  return NextResponse.json((data || []).map(parseMedia));
}

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const condition = body.condition_detail?.startsWith('Novo') ? 'Novo' : 'Usado';

    // Serialize media array to JSON string for storage
    const media = Array.isArray(body.media) ? JSON.stringify(body.media) : '[]';
    const photo_url = Array.isArray(body.media) && body.media.length > 0
      ? body.media[0].url
      : body.photo_url || '';

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('books')
      .insert({
        ...body,
        media,
        photo_url,
        condition,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(parseMedia(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro ao criar livro' }, { status: 500 });
  }
}
