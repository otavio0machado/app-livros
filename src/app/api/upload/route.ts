import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAuthenticated } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50MB

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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo não permitido. Use JPG, PNG, WebP, MP4, MOV ou WebM.' },
        { status: 400 }
      );
    }

    const isVideo = VIDEO_TYPES.includes(file.type);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo ${isVideo ? '50' : '10'}MB.` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
    const fileName = `${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage
      .from('book-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('book-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      path: fileName,
      url: urlData.publicUrl,
      type: isVideo ? 'video' : 'image',
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 });
  }
}
