'use client';

import { useState, useRef } from 'react';
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
  imageFiles: File[];
  imagePreviewUrls: string[];
  imageBase64: string; // first image base64 for AI
  status: DraftStatus;
  error: string;
  formData: Partial<Book>;
  uploadedMedia: MediaItem[];
}

interface BulkBookCardProps {
  draft: BulkDraft;
  index: number;
  onAddPhotos: (id: string, files: File[]) => void;
  onRemovePhoto: (id: string, photoIndex: number) => void;
  onPublish: (id: string, data: Partial<Book>) => Promise<void>;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

export default function BulkBookCard({
  draft,
  index,
  onAddPhotos,
  onRemovePhoto,
  onPublish,
  onRetry,
  onRemove,
}: BulkBookCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, formData, error, imagePreviewUrls } = draft;

  const isFinished = status === 'published';
  const isProcessing = status === 'analyzing' || status === 'publishing';
  const hasPhotos = imagePreviewUrls.length > 0;

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const imageFiles = Array.from(e.target.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (imageFiles.length > 0) {
        onAddPhotos(draft.id, imageFiles);
      }
    }
    e.target.value = '';
  }

  // Pending state: photo upload UI
  if (status === 'pending') {
    return (
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-navy-700">{index + 1}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-900">Livro {index + 1}</h3>
              {hasPhotos && (
                <span className="text-xs text-warm-400">
                  {imagePreviewUrls.length} {imagePreviewUrls.length === 1 ? 'foto' : 'fotos'}
                </span>
              )}
            </div>
            <button
              onClick={() => onRemove(draft.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Remover livro"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Photos grid */}
          {hasPhotos && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-2 mb-3">
              {imagePreviewUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-warm-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 bg-navy-700 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                      Capa
                    </span>
                  )}
                  <button
                    onClick={() => onRemovePhoto(draft.id, i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {/* Add more photos button inline */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-warm-300 flex flex-col items-center justify-center text-warm-400 hover:border-navy-400 hover:text-navy-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[9px] mt-0.5">Mais</span>
              </button>
            </div>
          )}

          {/* Empty: add first photo */}
          {!hasPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-warm-300 rounded-xl flex flex-col items-center justify-center text-warm-400 hover:border-navy-400 hover:text-navy-600 transition-colors"
            >
              <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Adicionar fotos deste livro</span>
              <span className="text-[10px] mt-0.5">A primeira foto sera usada para analise da IA</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // Analyzing / analyzed / error / publishing / published states
  return (
    <div className={`bg-white rounded-xl border overflow-hidden transition-all ${
      isFinished ? 'border-green-200 opacity-60' : 'border-gray-100'
    }`}>
      {/* Collapsed header */}
      <div className="p-3 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-medium text-warm-500">{index + 1}</span>
        </div>

        {/* Thumbnail: show first image */}
        <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
          {imagePreviewUrls[0] ? (
            <Image
              src={imagePreviewUrls[0]}
              alt={formData.title || `Livro ${index + 1}`}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
          {imagePreviewUrls.length > 1 && (
            <span className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded">
              +{imagePreviewUrls.length - 1}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
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

        {/* Actions */}
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
