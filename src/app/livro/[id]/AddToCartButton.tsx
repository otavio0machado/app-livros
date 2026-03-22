'use client';

import { useCart } from '@/components/CartProvider';
import type { Book } from '@/types';

export default function AddToCartButton({ book }: { book: Book }) {
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(book.id);

  function handleAdd() {
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
    <button
      onClick={handleAdd}
      disabled={inCart}
      className={`w-full py-3.5 rounded-xl font-medium text-base transition-all ${
        inCart
          ? 'bg-warm-100 text-warm-400'
          : 'bg-navy-700 text-white hover:bg-navy-600 active:scale-[0.98]'
      }`}
    >
      {inCart ? 'Já está no carrinho' : 'Adicionar ao carrinho'}
    </button>
  );
}
