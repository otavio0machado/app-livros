'use client';

import { useState } from 'react';
import type { Book } from '@/types';
import { generateShopeeLabel, formatShopeeForCopy } from '@/lib/shopee';

export default function ShopeeLabelPreview({ book }: { book: Book }) {
  const [copied, setCopied] = useState(false);
  const label = generateShopeeLabel(book);

  async function handleCopy() {
    const text = formatShopeeForCopy(label);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-orange-800 text-sm">Etiqueta Shopee</h3>
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-[#EE4D2D] text-white hover:bg-[#d4431f]'
          }`}
        >
          {copied ? 'Copiado!' : 'Copiar tudo'}
        </button>
      </div>

      {/* Info Básica */}
      <div>
        <p className="text-xs font-semibold text-orange-700 mb-1">INFORMAÇÃO BÁSICA</p>
        <div className="text-xs space-y-1 text-gray-700">
          <p><span className="font-medium">Nome:</span> {label.productName}</p>
          <p><span className="font-medium">Categoria:</span> {label.category}</p>
          <p><span className="font-medium">GTIN:</span> {label.gtin || 'Item sem GTIN'}</p>
        </div>
      </div>

      {/* Especificação */}
      <div>
        <p className="text-xs font-semibold text-orange-700 mb-1">ESPECIFICAÇÃO</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
          <p><span className="font-medium">Marca:</span> {label.brand}</p>
          <p><span className="font-medium">Condição:</span> {label.condition}</p>
          <p><span className="font-medium">Editora:</span> {label.publisher}</p>
          <p><span className="font-medium">Idioma:</span> {label.language}</p>
          <p><span className="font-medium">Origem:</span> {label.origin}</p>
          <p><span className="font-medium">ISBN:</span> {label.isbn}</p>
          <p><span className="font-medium">Edição:</span> {label.editionType}</p>
          <p><span className="font-medium">Capa:</span> {label.coverType}</p>
          <p><span className="font-medium">Ano:</span> {label.year}</p>
        </div>
      </div>

      {/* Vendas */}
      <div>
        <p className="text-xs font-semibold text-orange-700 mb-1">VENDAS</p>
        <div className="text-xs space-y-1 text-gray-700">
          <p><span className="font-medium">Preço:</span> R$ {label.price}</p>
          <p><span className="font-medium">Estoque:</span> {label.stock}</p>
          <p><span className="font-medium">SKU:</span> {label.sku}</p>
        </div>
      </div>

      {/* Envio */}
      <div>
        <p className="text-xs font-semibold text-orange-700 mb-1">ENVIO</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
          <p><span className="font-medium">Peso:</span> {label.weightKg} kg</p>
          <p><span className="font-medium">Largura:</span> {label.widthCm} cm</p>
          <p><span className="font-medium">Comprimento:</span> {label.lengthCm} cm</p>
          <p><span className="font-medium">Altura:</span> {label.heightCm} cm</p>
        </div>
      </div>
    </div>
  );
}
