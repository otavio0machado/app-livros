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
  ];

  return (
    <header className="bg-white border-b border-warm-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold text-warm-800 tracking-tight">
            admin
          </Link>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-warm-100 text-warm-800 font-medium'
                    : 'text-warm-500 hover:text-warm-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/loja" className="text-sm text-warm-500 hover:text-warm-700 transition-colors">
            ver site
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            sair
          </button>
        </div>
      </div>
    </header>
  );
}
