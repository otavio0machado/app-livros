'use client';

import { useRouter } from 'next/navigation';
import BookForm from '@/components/BookForm';
import type { Book } from '@/types';

export default function NovoLivroPage() {
  const router = useRouter();

  async function handleSubmit(data: Partial<Book>) {
    const res = await fetch('/api/books', {
      method: 'POST',
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

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Adicionar novo livro</h1>
      <div className="max-w-2xl">
        <BookForm onSubmit={handleSubmit} submitLabel="Publicar livro" />
      </div>
    </div>
  );
}
