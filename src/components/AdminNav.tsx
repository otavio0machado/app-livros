'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/novo', label: 'Novo' },
    { href: '/admin/lote', label: 'Lote' },
    { href: '/admin/colecao', label: 'Coleção' },
  ];

  return (
    <header className="bg-white border-b border-warm-200 sticky top-0 z-40">
      {/* Top bar: logo + actions */}
      <div className="max-w-5xl mx-auto px-4 sm:px-5 h-12 sm:h-14 flex items-center justify-between">
        <Link href="/admin" className="font-semibold text-navy-700 tracking-tight text-sm sm:text-base">
          myshelf <span className="text-warm-400 font-normal">admin</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/loja" className="text-xs sm:text-sm text-warm-500 hover:text-warm-700 transition-colors">
            ver site
          </Link>
          <button
            onClick={handleLogout}
            className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            sair
          </button>
        </div>
      </div>
      {/* Nav tabs: scrollable on mobile */}
      <div className="max-w-5xl mx-auto px-4 sm:px-5">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none -mb-px">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 sm:py-2.5 rounded-t-lg text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${
                pathname === link.href
                  ? 'bg-warm-100 text-warm-800 font-medium border-b-2 border-navy-600'
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
