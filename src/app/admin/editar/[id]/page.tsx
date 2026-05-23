'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import BookForm from '@/components/BookForm';
import type { Book } from '@/types';

export default function EditarLivroPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/books/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setBook(data);
      } catch {
        alert('Livro não encontrado');
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  async function handleSubmit(data: Partial<Book>) {
    const res = await fetch(`/api/admin/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erro ao salvar');
      return;
    }

    router.push('/admin');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Editar livro</h1>
      <div className="max-w-2xl">
        <BookForm initialData={book} onSubmit={handleSubmit} submitLabel="Salvar alterações" />
      </div>
    </div>
  );
}
