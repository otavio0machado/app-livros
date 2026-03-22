'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';

export default function CartButton() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/carrinho"
      className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
