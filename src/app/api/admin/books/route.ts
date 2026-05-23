import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  normalizeBookPayload,
  parseBookStatus,
  parseMedia,
  sanitizeSearchTerm,
} from '@/lib/books';

export async function GET(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = sanitizeSearchTerm(searchParams.get('search') || '');
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';
    const subject = searchParams.get('subject') || '';
    const status = parseBookStatus(searchParams.get('status'));

    if (status === null) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

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
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar livros' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('books')
      .insert(normalizeBookPayload(body))
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
