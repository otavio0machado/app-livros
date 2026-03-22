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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
  }

  return NextResponse.json(parseMedia(data));
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
  const body = await request.json();
  const condition = body.condition_detail?.startsWith('Novo') ? 'Novo' : 'Usado';

  const media = Array.isArray(body.media) ? JSON.stringify(body.media) : body.media || '[]';
  const photo_url = Array.isArray(body.media) && body.media.length > 0
    ? body.media[0].url
    : body.photo_url || '';

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('books')
    .update({
      ...body,
      media,
      photo_url,
      condition,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(parseMedia(data));
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
  const supabase = getSupabaseAdmin();

  // Get book to delete its media files
  const { data: book } = await supabase
    .from('books')
    .select('media, photo_url')
    .eq('id', parseInt(id))
    .single();

  if (book) {
    const paths: string[] = [];
    if (book.media) {
      try {
        const mediaItems = typeof book.media === 'string' ? JSON.parse(book.media) : book.media;
        for (const item of mediaItems) {
          if (item.path) paths.push(item.path);
        }
      } catch { /* ignore */ }
    }
    if (paths.length > 0) {
      await supabase.storage.from('book-images').remove(paths);
    }
  }

  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
