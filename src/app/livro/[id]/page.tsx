import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/types';
import AddToCartButton from './AddToCartButton';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getBook(id: string): Promise<Book | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error || !data) return null;
    return data as Book;
  } catch {
    return null;
  }
}

const CONDITION_LABEL: Record<string, string> = {
  'Novo': 'Novo',
  'Usado - Excelente estado, como novo.': 'Excelente estado',
  'Usado - Pode conter poucos escritos ou marcações.': 'Bom estado',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.': 'Com marcações',
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export default async function LivroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-warm-500 text-lg mb-2">Livro não encontrado</p>
          <Link href="/loja" className="text-olive-600 text-sm font-medium hover:underline">
            Voltar ao acervo
          </Link>
        </div>
      </div>
    );
  }

  const conditionLabel = CONDITION_LABEL[book.condition_detail] || book.condition_detail;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-warm-50/80 backdrop-blur-sm border-b border-warm-200/60">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/loja" className="flex items-center gap-1.5 text-warm-600 hover:text-warm-900 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            voltar
          </Link>
          <Link href="/carrinho" className="text-sm text-warm-600 hover:text-warm-900 transition-colors">
            carrinho
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6 pb-8">
        {/* Image */}
        <div className="rounded-2xl overflow-hidden bg-warm-100 border border-warm-200/80">
          <div className="relative aspect-[4/5] sm:aspect-[3/4]">
            {book.photo_url ? (
              <Image
                src={book.photo_url}
                alt={book.title}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, 600px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-warm-300">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-5 space-y-4">
          {/* Title & Price */}
          <div>
            <h1 className="text-xl font-bold text-warm-900 leading-tight">{book.title}</h1>
            <p className="text-warm-500 mt-1">{book.author}</p>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-warm-900">
              <span className="text-sm font-normal text-warm-500">R$</span> {formatPrice(book.price_cents)}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-warm-600 bg-warm-100 px-2.5 py-1 rounded-lg">
              {conditionLabel}
            </span>
            {book.type === 'Apostila' && (
              <span className="text-xs font-medium text-olive-700 bg-olive-100 px-2.5 py-1 rounded-lg">
                Apostila
              </span>
            )}
            {book.category && (
              <span className="text-xs text-warm-500 bg-warm-100 px-2.5 py-1 rounded-lg">
                {book.category}
              </span>
            )}
          </div>

          {/* Condition notes */}
          {book.condition_notes && (
            <div className="bg-warm-100/80 rounded-xl p-3.5">
              <p className="text-sm text-warm-600">
                <span className="font-medium text-warm-700">Observação:</span>{' '}
                {book.condition_notes}
              </p>
            </div>
          )}

          {/* Description */}
          {book.description && (
            <p className="text-warm-600 text-sm leading-relaxed">{book.description}</p>
          )}

          {/* Details */}
          <div className="border-t border-warm-200 pt-4">
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              {book.publisher && (
                <div>
                  <p className="text-warm-400 text-xs">Editora</p>
                  <p className="text-warm-700">{book.publisher}</p>
                </div>
              )}
              {book.isbn && (
                <div>
                  <p className="text-warm-400 text-xs">ISBN</p>
                  <p className="text-warm-700">{book.isbn}</p>
                </div>
              )}
              {book.year && (
                <div>
                  <p className="text-warm-400 text-xs">Ano</p>
                  <p className="text-warm-700">{book.year}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <p className="text-warm-400 text-xs">Idioma</p>
                  <p className="text-warm-700">{book.language}</p>
                </div>
              )}
              {book.cover_type && (
                <div>
                  <p className="text-warm-400 text-xs">Capa</p>
                  <p className="text-warm-700">{book.cover_type}</p>
                </div>
              )}
              {book.type === 'Apostila' && book.subject && (
                <div>
                  <p className="text-warm-400 text-xs">Matéria</p>
                  <p className="text-warm-700">{book.subject}</p>
                </div>
              )}
              {book.type === 'Apostila' && book.course_origin && (
                <div>
                  <p className="text-warm-400 text-xs">Cursinho</p>
                  <p className="text-warm-700">{book.course_origin}</p>
                </div>
              )}
            </div>
          </div>

          {/* Add to cart */}
          <div className="pt-2">
            <AddToCartButton book={book} />
          </div>
        </div>
      </main>
    </div>
  );
}
