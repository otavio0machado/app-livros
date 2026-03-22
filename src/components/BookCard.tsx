'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Book } from '@/types';
import { useCart } from './CartProvider';

const CONDITION_LABEL: Record<string, string> = {
  'Novo': 'Novo',
  'Usado - Excelente estado, como novo.': 'Excelente',
  'Usado - Contém marcas de uso.': 'Marcas de uso',
  'Usado - Contém marcas de uso e pode conter poucos escritos ou marcações.': 'Marcas + escritos',
  'Usado - Pode conter poucos escritos ou marcações.': 'Poucos escritos',
  'Usado - Contém marcas de uso, bastante marcações, escritos e/ou exercícios resolvidos.': 'Bastante uso',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.': 'Com marcações',
};

function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export default function BookCard({ book }: { book: Book }) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(book.id);
  const conditionLabel = CONDITION_LABEL[book.condition_detail] || book.condition_detail;
  const hasDiscount = book.collection_discount_pct && book.collection_discount_pct > 0;

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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
    <Link href={`/livro/${book.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-warm-200/80 overflow-hidden transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-warm-100">
          {(book.media?.[0]?.url || book.photo_url) ? (
            <Image
              src={book.media?.[0]?.url || book.photo_url}
              alt={book.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-warm-300">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {hasDiscount ? (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-lg">
              -{book.collection_discount_pct}%
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3">
          <h3 className="font-medium text-warm-800 text-[13px] sm:text-sm leading-snug line-clamp-2 min-h-[2.5em]">
            {book.title}
          </h3>
          <p className="text-warm-400 text-[11px] sm:text-xs mt-0.5 truncate">{book.author}</p>

          <div className="flex items-center gap-1 mt-1.5 sm:mt-2 flex-wrap">
            <span className="text-[10px] sm:text-xs text-warm-500 bg-warm-100 px-1.5 py-0.5 rounded">
              {conditionLabel}
            </span>
            {book.type === 'Apostila' && (
              <span className="text-[10px] sm:text-xs text-olive-700 bg-olive-100 px-1.5 py-0.5 rounded">
                Apostila
              </span>
            )}
          </div>

          <div className="flex items-end justify-between mt-2 sm:mt-3 gap-1">
            <div className="min-w-0">
              {hasDiscount ? (
                <>
                  <p className="text-warm-400 text-[10px] sm:text-xs line-through">
                    R$ {formatPrice(Math.round(book.price_cents / (1 - book.collection_discount_pct! / 100)))}
                  </p>
                  <p className="text-warm-900 font-semibold text-sm sm:text-base">
                    <span className="text-[10px] sm:text-xs font-normal text-warm-500">R$</span>{' '}
                    {formatPrice(book.price_cents)}
                  </p>
                </>
              ) : (
                <p className="text-warm-900 font-semibold text-sm sm:text-base">
                  <span className="text-[10px] sm:text-xs font-normal text-warm-500">R$</span>{' '}
                  {formatPrice(book.price_cents)}
                </p>
              )}
            </div>
            <button
              onClick={handleAdd}
              disabled={inCart}
              className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-1.5 sm:py-1.5 rounded-lg font-medium transition-all flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center ${
                inCart
                  ? 'bg-warm-100 text-warm-400'
                  : 'bg-navy-700 text-white hover:bg-navy-600 active:scale-95'
              }`}
            >
              {inCart ? 'no carrinho' : '+ adicionar'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
