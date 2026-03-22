'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = [
  'Todos', 'Ficção', 'Não-Ficção', 'Infantil', 'Acadêmico', 'Vestibular',
  'Autoajuda', 'Biografia', 'Romance', 'Terror', 'Fantasia', 'Ciência',
  'História', 'Religião', 'Computadores e Tecnologia', 'Direito', 'Medicina',
  'Engenharia', 'Outro'
];

const TYPES = ['Todos', 'Livro', 'Apostila'];

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [type, setType] = useState(searchParams.get('type') || '');

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      if (type) params.set('type', type);
      router.push(`/?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, category, type, router]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por título, autor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900 bg-white"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex-shrink-0 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TYPES.map((t) => (
            <option key={t} value={t === 'Todos' ? '' : t}>
              {t}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="flex-shrink-0 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c === 'Todos' ? '' : c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
