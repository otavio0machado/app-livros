import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { analyzeBookImagesForBatch } from '@/lib/gemini';
import type { BookImageRole } from '@/types/batch';

const ALLOWED_ROLES: BookImageRole[] = [
  'front_cover',
  'back_cover',
  'spine',
  'isbn_page',
  'defect',
  'other',
];

interface AnalyzeBatchImagePayload {
  imageBase64: string;
  mimeType: string;
  role: BookImageRole;
}

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { images, condition } = await request.json();

    if (!Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Envie pelo menos uma imagem' }, { status: 400 });
    }

    if (images.length > 9) {
      return NextResponse.json({ error: 'Máximo de 9 imagens por livro' }, { status: 400 });
    }

    const normalizedImages = images.map((image: AnalyzeBatchImagePayload) => {
      if (!image.imageBase64 || !image.mimeType || !ALLOWED_ROLES.includes(image.role)) {
        throw new Error('Imagem inválida');
      }
      return image;
    });

    const analysis = await analyzeBookImagesForBatch(normalizedImages, condition);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erro na análise do livro em lote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao analisar livro' },
      { status: 500 }
    );
  }
}
