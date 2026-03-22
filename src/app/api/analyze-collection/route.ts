import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { analyzeCollectionImage } from '@/lib/gemini';

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { imageBase64, mimeType, condition } = await request.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'Imagem não fornecida' },
        { status: 400 }
      );
    }

    const analysis = await analyzeCollectionImage(imageBase64, mimeType, condition);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Erro na análise de coleção:', error);
    return NextResponse.json(
      { error: 'Erro ao analisar coleção com IA' },
      { status: 500 }
    );
  }
}
