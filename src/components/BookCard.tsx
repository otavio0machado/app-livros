'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/types';
import { useCart } from './CartProvider';

const CONDITION_COLORS: Record<string, string> = {
  'Novo': 'bg-green-100 text-green-700',
  'Usado - Excelente estado, como novo.': 'bg-blue-100 text-blue-700',
  'Usado - Pode conter poucos escritos ou marcações.': 'bg-yellow-100 text-yellow-700',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.': 'bg-orange-100 text-orange-700',
};

const CONDITION_SHORT: Record<string, string> = {
  'Novo': 'Novo',
  'Usado - Excelente estado, como novo.': 'Excelente',
  'Usado - Pode conter poucos escritos ou marcações.': 'Bom',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.': 'Aceitável',
};

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function BookCard({ book }: { book: Book }) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(book.id);

  const conditionColor = CONDITION_COLORS[book.condition_detail] || 'bg-gray-100 text-gray-700';
  const conditionShort = CONDITION_SHORT[book.condition_detail] || book.condition_detail;

  function handleAddToCart() {
    addItem({
      bookId: book.id,
      title: book.title,
      author: book.author,
      price_cents: book.price_cents,
      photo_url: book.photo_url,
      condition_detail: book.condition_detail,
      type: book.type,
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <Link href={`/livro/${book.id}`} className="block">
        <div className="relative aspect-[3/4] bg-gray-100">
          {book.photo_url ? (
            <Image
              src={book.photo_url}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {book.type === 'Apostila' && (
            <span className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              Apostila
            </span>
          )}
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1">
        <Link href={`/livro/${book.id}`}>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
            {book.title}
          </h3>
          <p className="text-gray-500 text-xs mt-1 truncate">{book.author}</p>
        </Link>

        <div className="mt-2">
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${conditionColor}`}>
            {conditionShort}
          </span>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-gray-900">{formatPrice(book.price_cents)}</span>
          <button
            onClick={handleAddToCart}
            disabled={inCart}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              inCart
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {inCart ? 'No carrinho' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
}
