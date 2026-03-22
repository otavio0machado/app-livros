import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/types';
import AddToCartButton from './AddToCartButton';

async function getBook(id: string): Promise<Book | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/books/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const CONDITION_COLORS: Record<string, string> = {
  'Novo': 'bg-green-100 text-green-700',
  'Usado - Excelente estado, como novo.': 'bg-blue-100 text-blue-700',
  'Usado - Pode conter poucos escritos ou marcações.': 'bg-yellow-100 text-yellow-700',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.': 'bg-orange-100 text-orange-700',
};

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default async function LivroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBook(id);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Livro não encontrado</p>
          <Link href="/" className="text-blue-600 text-sm mt-2 inline-block">
            Voltar à vitrine
          </Link>
        </div>
      </div>
    );
  }

  const conditionColor = CONDITION_COLORS[book.condition_detail] || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Photo */}
          <div className="relative aspect-square sm:aspect-[4/3] bg-gray-100">
            {book.photo_url ? (
              <Image
                src={book.photo_url}
                alt={book.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            {book.type === 'Apostila' && (
              <span className="absolute top-4 left-4 bg-purple-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                Apostila
              </span>
            )}
          </div>

          {/* Info */}
          <div className="p-5 space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
              <p className="text-gray-500 mt-1">{book.author}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-900">{formatPrice(book.price_cents)}</span>
              <span className={`text-sm px-3 py-1 rounded-full ${conditionColor}`}>
                {book.condition_detail}
              </span>
            </div>

            {book.condition_notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Obs:</span> {book.condition_notes}
                </p>
              </div>
            )}

            {book.description && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Descrição</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{book.description}</p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {book.publisher && (
                <div>
                  <span className="text-gray-500">Editora</span>
                  <p className="font-medium text-gray-900">{book.publisher}</p>
                </div>
              )}
              {book.isbn && (
                <div>
                  <span className="text-gray-500">ISBN</span>
                  <p className="font-medium text-gray-900">{book.isbn}</p>
                </div>
              )}
              {book.year && (
                <div>
                  <span className="text-gray-500">Ano</span>
                  <p className="font-medium text-gray-900">{book.year}</p>
                </div>
              )}
              {book.language && (
                <div>
                  <span className="text-gray-500">Idioma</span>
                  <p className="font-medium text-gray-900">{book.language}</p>
                </div>
              )}
              {book.cover_type && (
                <div>
                  <span className="text-gray-500">Capa</span>
                  <p className="font-medium text-gray-900">{book.cover_type}</p>
                </div>
              )}
              {book.category && (
                <div>
                  <span className="text-gray-500">Categoria</span>
                  <p className="font-medium text-gray-900">{book.category}</p>
                </div>
              )}
              {book.type === 'Apostila' && book.subject && (
                <div>
                  <span className="text-gray-500">Matéria</span>
                  <p className="font-medium text-gray-900">{book.subject}</p>
                </div>
              )}
              {book.type === 'Apostila' && book.course_origin && (
                <div>
                  <span className="text-gray-500">Cursinho</span>
                  <p className="font-medium text-gray-900">{book.course_origin}</p>
                </div>
              )}
            </div>

            {/* Add to Cart */}
            <AddToCartButton book={book} />
          </div>
        </div>
      </main>
    </div>
  );
}
