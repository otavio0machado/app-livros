'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import WhatsAppCheckout from '@/components/WhatsAppCheckout';
import { formatCartTotalLabel, formatPriceLabel } from '@/lib/price';

export default function CarrinhoPage() {
  const { items, removeItem, totalPrice } = useCart();
  const hasPendingPrices = items.some((item) => item.price_cents <= 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-warm-50/80 backdrop-blur-sm border-b border-warm-200/60">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center">
          <Link href="/loja" className="flex items-center gap-1.5 text-warm-600 hover:text-warm-900 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            continuar olhando
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        <h1 className="text-xl font-bold text-warm-900 mb-6">Seu carrinho</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-warm-400 text-lg mb-2">Carrinho vazio</p>
            <Link href="/loja" className="text-olive-600 text-sm font-medium hover:underline">
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
                  className="bg-white rounded-xl border border-warm-200/80 p-3 flex items-center gap-3"
                >
                  <div className="w-14 h-[4.5rem] rounded-lg bg-warm-100 overflow-hidden flex-shrink-0 relative">
                    {item.photo_url ? (
                      <Image src={item.photo_url} alt={item.title} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-warm-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-warm-800 text-sm line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-warm-400 truncate">{item.author}</p>
                    <p className="text-sm font-semibold text-warm-900 mt-1">
                      {formatPriceLabel(item.price_cents)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeItem(item.bookId)}
                    className="p-2.5 text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Remover item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t border-warm-200">
              <span className="text-warm-500 text-sm">
                Total ({items.length} {items.length === 1 ? 'item' : 'itens'})
              </span>
              <span className="text-xl font-bold text-warm-900">
                {formatCartTotalLabel(totalPrice, hasPendingPrices)}
              </span>
            </div>

            {/* WhatsApp */}
            <WhatsAppCheckout />

            <p className="text-xs text-warm-400 text-center leading-relaxed">
              Ao clicar, uma mensagem com seus livros será enviada para o meu WhatsApp.
              A gente combina pagamento e envio por lá.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
