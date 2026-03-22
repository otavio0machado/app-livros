import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from('book-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('book-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      path: fileName,
      url: urlData.publicUrl,
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
