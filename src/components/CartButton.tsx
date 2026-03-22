'use client';

import Link from 'next/link';
import { useCart } from './CartProvider';
import { usePathname } from 'next/navigation';

export default function CartButton() {
  const { totalItems } = useCart();
  const pathname = usePathname();

  // Hide on landing, cart, login and admin pages
  if (pathname === '/' || pathname === '/carrinho' || pathname.startsWith('/admin') || pathname === '/login') {
    return null;
  }

  if (totalItems === 0) return null;

  return (
    <Link
      href="/carrinho"
      className="fixed bottom-6 right-5 z-50 bg-navy-700 text-white h-12 pl-4 pr-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-navy-600 active:scale-95 transition-all"
    >
      <span className="text-sm font-medium">Carrinho</span>
      <span className="bg-white text-navy-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {totalItems}
      </span>
    </Link>
  );
}
