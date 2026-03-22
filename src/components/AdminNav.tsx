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
    { href: '/admin/novo', label: 'Novo Livro' },
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-bold text-gray-900">
            Admin
          </Link>
          <nav className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            Ver site
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
