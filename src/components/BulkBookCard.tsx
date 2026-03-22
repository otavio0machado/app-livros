'use client';

import { useState } from 'react';
import Image from 'next/image';
import BookForm from './BookForm';
import type { Book, MediaItem } from '@/types';

export type DraftStatus =
  | 'pending'
  | 'analyzing'
  | 'analyzed'
  | 'error'
  | 'publishing'
  | 'published';

export interface BulkDraft {
  id: string;
  imageFile: File;
  imagePreviewUrl: string;
  imageBase64: string;
  status: DraftStatus;
  error: string;
  formData: Partial<Book>;
  uploadedMedia: MediaItem[];
}

interface BulkBookCardProps {
  draft: BulkDraft;
  index: number;
  onPublish: (id: string, data: Partial<Book>) => Promise<void>;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function BulkBookCard({ draft, index, onPublish, onRetry, onRemove }: BulkBookCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { status, formData, error, imagePreviewUrl } = draft;

  const isFinished = status === 'published';
  const isProcessing = status === 'analyzing' || status === 'publishing';

  async function handleFormSubmit(data: Partial<Book>) {
    await onPublish(draft.id, data);
  }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${
      isFinished ? 'border-green-200 opacity-60' : 'border-gray-100'
    }`}>
      {/* Collapsed header — always visible */}
      <div className="p-3 flex items-center gap-3">
        {/* Index badge */}
        <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-warm-500">{index + 1}</span>
        </div>

        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
          <Image
            src={imagePreviewUrl}
            alt={formData.title || `Livro ${index + 1}`}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {status === 'pending' && (
            <p className="text-sm text-warm-400">Aguardando analise...</p>
          )}
          {status === 'analyzing' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-navy-600">Analisando com IA...</p>
            </div>
          )}
          {status === 'error' && (
            <div>
              <p className="text-sm text-red-600 font-medium">Erro na analise</p>
              <p className="text-xs text-red-400 truncate">{error}</p>
            </div>
          )}
          {(status === 'analyzed' || status === 'publishing' || status === 'published') && (
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900 text-sm truncate">
                  {formData.title || 'Sem titulo'}
                </h3>
                {formData.type === 'Apostila' && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Apostila
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{formData.author || 'Autor desconhecido'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {formData.price_cents ? (
                  <span className="text-sm font-semibold text-gray-900">
                    {formatPrice(formData.price_cents)}
                  </span>
                ) : null}
                {formData.category && (
                  <span className="text-xs text-warm-400">{formData.category}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status badge + actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {status === 'published' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Publicado
            </span>
          )}
          {status === 'publishing' && (
            <div className="flex items-center gap-1.5 text-xs text-navy-600">
              <div className="w-3.5 h-3.5 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
              Publicando...
            </div>
          )}
          {status === 'error' && (
            <button
              onClick={() => onRetry(draft.id)}
              className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              Tentar novamente
            </button>
          )}
          {status === 'analyzed' && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="px-3 py-1.5 text-xs font-medium bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition"
            >
              Revisar
            </button>
          )}
          {!isFinished && !isProcessing && (
            <button
              onClick={() => onRemove(draft.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Remover"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded: full BookForm */}
      {expanded && status === 'analyzed' && (
        <div className="border-t border-gray-100 p-4">
          <div className="max-w-2xl">
            <BookForm
              initialData={{
                ...draft.formData,
                media: draft.uploadedMedia.length > 0 ? draft.uploadedMedia : undefined,
                photo_url: draft.uploadedMedia[0]?.url || '',
              }}
              onSubmit={async (data) => {
                setExpanded(false);
                await onPublish(draft.id, data);
              }}
              submitLabel="Publicar livro"
            />
          </div>
        </div>
      )}
    </div>
  );
}
