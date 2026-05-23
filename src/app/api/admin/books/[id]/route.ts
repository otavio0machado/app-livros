import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';
import { normalizeBookPayload, parseBookId, parseMedia } from '@/lib/books';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const bookId = parseBookId(id);
  if (!bookId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
    }

    return NextResponse.json(parseMedia(data));
  } catch {
    return NextResponse.json({ error: 'Erro ao carregar livro' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const bookId = parseBookId(id);
  if (!bookId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('books')
      .update(normalizeBookPayload(body))
      .eq('id', bookId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(parseMedia(data));
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar livro' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const bookId = parseBookId(id);
  if (!bookId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: book } = await supabase
      .from('books')
      .select('media')
      .eq('id', bookId)
      .single();

    if (book?.media) {
      const paths: string[] = [];
      try {
        const mediaItems = typeof book.media === 'string' ? JSON.parse(book.media) : book.media;
        for (const item of mediaItems) {
          if (item.path) paths.push(item.path);
        }
      } catch {
        // Ignore malformed media metadata; deleting the row is still the priority.
      }
      if (paths.length > 0) {
        await supabase.storage.from('book-images').remove(paths);
      }
    }

    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir livro' }, { status: 500 });
  }
}
