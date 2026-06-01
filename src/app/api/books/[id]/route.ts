import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';
import { normalizeBookPayload, parseBookId, parseMedia, sanitizePublicBook } from '@/lib/books';
import { getListedBookById } from '@/lib/catalog';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bookId = parseBookId(id);
  if (!bookId) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const authenticated = await isAuthenticated();

  try {
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from('books')
      .select('*')
      .eq('id', bookId);

    if (!authenticated) query = query.eq('status', 'available');

    const { data, error } = await query.single();

    if (error || !data) {
      const listedBook = getListedBookById(bookId);
      if (listedBook) {
        return NextResponse.json(
          authenticated
            ? listedBook
            : sanitizePublicBook(listedBook as unknown as Record<string, unknown>)
        );
      }
      return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
    }

    const parsed = parseMedia(data);
    return NextResponse.json(authenticated ? parsed : sanitizePublicBook(parsed));
  } catch {
    const listedBook = getListedBookById(bookId);
    if (listedBook) {
      return NextResponse.json(
        authenticated
          ? listedBook
          : sanitizePublicBook(listedBook as unknown as Record<string, unknown>)
      );
    }
    return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
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
      .select('media, photo_url')
      .eq('id', bookId)
      .single();

    if (book) {
      const paths: string[] = [];
      if (book.media) {
        try {
          const mediaItems = typeof book.media === 'string' ? JSON.parse(book.media) : book.media;
          for (const item of mediaItems) {
            if (item.path) paths.push(item.path);
          }
        } catch {
          // Ignore malformed media metadata; deleting the row is still the priority.
        }
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
