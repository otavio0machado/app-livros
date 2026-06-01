import { NextResponse } from 'next/server';
import type { Book } from '@/types';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';
import {
  normalizeBookPayload,
  parseMedia,
  sanitizePublicBook,
  sanitizeSearchTerm,
} from '@/lib/books';
import { mergeWithListedBooks } from '@/lib/catalog';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = sanitizeSearchTerm(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const subject = searchParams.get('subject') || '';

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from('books')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

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
      return NextResponse.json(
        mergeWithListedBooks([], { search, category, type, subject }).map((book) =>
          sanitizePublicBook(book as unknown as Record<string, unknown>)
        )
      );
    }

    const supabaseBooks = (data || []).map((row) => parseMedia(row)) as Book[];
    const books = mergeWithListedBooks(supabaseBooks, {
      search,
      category,
      type,
      subject,
    });
    return NextResponse.json(
      books.map((book) => sanitizePublicBook(book as unknown as Record<string, unknown>))
    );
  } catch {
    return NextResponse.json(
      mergeWithListedBooks([], { search, category, type, subject }).map((book) =>
        sanitizePublicBook(book as unknown as Record<string, unknown>)
      )
    );
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
