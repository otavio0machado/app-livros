'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import WhatsAppCheckout from '@/components/WhatsAppCheckout';

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function CarrinhoPage() {
  const { items, removeItem, totalPrice } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Continuar comprando
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Seu carrinho</h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
            <Link href="/" className="text-blue-600 text-sm font-medium mt-2 inline-block">
              Ver livros disponíveis
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Items */}
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.bookId}
                  className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3"
                >
                  <div className="w-16 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                    {item.photo_url ? (
                      <Image src={item.photo_url} alt={item.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{item.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{item.author}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatPrice(item.price_cents)}</p>
                  </div>

                  <button
                    onClick={() => removeItem(item.bookId)}
                    className="p-2 text-gray-400 hover:text-red-500 transition flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total ({items.length} {items.length === 1 ? 'item' : 'itens'})</span>
                <span className="text-xl font-bold text-gray-900">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* WhatsApp Checkout */}
            <WhatsAppCheckout />

            <p className="text-xs text-gray-400 text-center">
              Ao clicar, você será redirecionado para o WhatsApp para combinar a compra e o envio.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
