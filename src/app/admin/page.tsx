'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Book, MediaItem } from '@/types';

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function getMedia(book: Book): MediaItem[] {
  if (Array.isArray(book.media) && book.media.length > 0) return book.media;
  if (book.photo_url) return [{ url: book.photo_url, type: 'image', path: '' }];
  return [];
}

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  available: { label: 'Disponível', color: 'bg-green-100 text-green-700' },
  sold: { label: 'Vendido', color: 'bg-gray-100 text-gray-500' },
  reserved: { label: 'Reservado', color: 'bg-yellow-100 text-yellow-700' },
};

export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooks();
  }, []);

  async function fetchBooks() {
    try {
      const res = await fetch('/api/books?status=');
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error('Erro ao carregar livros:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    try {
      await fetch(`/api/books/${id}`, { method: 'DELETE' });
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  }

  async function toggleStatus(id: number, currentStatus: string) {
    const newStatus = currentStatus === 'available' ? 'sold' : 'available';
    try {
      await fetch(`/api/books/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus as Book['status'] } : b))
      );
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const available = books.filter((b) => b.status === 'available').length;
  const sold = books.filter((b) => b.status === 'sold').length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{books.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-green-600">{available}</p>
          <p className="text-xs text-gray-500">Disponíveis</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-400">{sold}</p>
          <p className="text-xs text-gray-500">Vendidos</p>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Seus livros</h2>
        <Link
          href="/admin/novo"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          + Novo livro
        </Link>
      </div>

      {/* Book list */}
      {books.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-gray-500">Nenhum livro cadastrado ainda.</p>
          <Link href="/admin/novo" className="text-blue-600 text-sm font-medium mt-2 inline-block">
            Adicionar primeiro livro
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {books.map((book) => {
            const statusInfo = STATUS_LABELS[book.status] || STATUS_LABELS.available;
            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3"
              >
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                  {getMedia(book)[0]?.url ? (
                    <Image src={getMedia(book)[0].url} alt={book.title} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{book.title}</h3>
                    {book.type === 'Apostila' && (
                      <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Apostila
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{book.author}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-semibold text-gray-900">{formatPrice(book.price_cents)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleStatus(book.id, book.status)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                    title={book.status === 'available' ? 'Marcar como vendido' : 'Marcar como disponível'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  {getMedia(book).length > 0 && (
                    <button
                      onClick={() => {
                        const media = getMedia(book);
                        media.forEach((item, i) => {
                          const ext = item.type === 'video' ? 'mp4' : 'jpg';
                          downloadFile(item.url, `${book.title}-${i + 1}.${ext}`);
                        });
                      }}
                      className="p-2 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition"
                      title="Baixar mídias"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                  <Link
                    href={`/admin/editar/${book.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
