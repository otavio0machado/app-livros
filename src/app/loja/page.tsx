import { Suspense } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import BookGrid from '@/components/BookGrid';
import type { Book } from '@/types';

async function getBooks(searchParams: Record<string, string>): Promise<Book[]> {
  const params = new URLSearchParams();
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.type) params.set('type', searchParams.type);
  params.set('status', 'available');

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const url = `${baseUrl}/api/books?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LojaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const books = await getBooks(params);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-warm-50/80 backdrop-blur-sm border-b border-warm-200/60">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="text-warm-800 font-semibold tracking-tight">
            livros do otávio
          </Link>
          <Link
            href="/carrinho"
            className="text-sm text-warm-600 hover:text-warm-900 transition-colors"
          >
            carrinho
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-5 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-warm-900 mb-1">Acervo</h1>
          <p className="text-warm-500 text-sm">
            {books.length} {books.length === 1 ? 'item disponível' : 'itens disponíveis'}
          </p>
        </div>

        <Suspense>
          <SearchBar />
        </Suspense>

        <div className="mt-6">
          <BookGrid books={books} />
        </div>
      </main>
    </div>
  );
}
