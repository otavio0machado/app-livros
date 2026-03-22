import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('books')
    .select('*')
    .eq('id', parseInt(id))
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Livro não encontrado' }, { status: 404 });
  }

  return NextResponse.json(data);
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

  const { data, error } = await supabaseAdmin
    .from('books')
    .update({
      ...body,
      condition,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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

  // Get book to delete its image
  const { data: book } = await supabaseAdmin
    .from('books')
    .select('photo_url')
    .eq('id', parseInt(id))
    .single();

  if (book?.photo_url) {
    await supabaseAdmin.storage.from('book-images').remove([book.photo_url]);
  }

  const { error } = await supabaseAdmin
    .from('books')
    .delete()
    .eq('id', parseInt(id));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
