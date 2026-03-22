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

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `https://${process.env.VERCEL_URL || 'localhost:3000'}`
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

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const books = await getBooks(params);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-gray-900">
            Livros & Apostilas
          </Link>
          <Link
            href="/carrinho"
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            Carrinho
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6">
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
