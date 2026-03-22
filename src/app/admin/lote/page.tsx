'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Book, GeminiAnalysis, MediaItem } from '@/types';
import BulkBookCard, { type BulkDraft } from '@/components/BulkBookCard';
import ConditionSelector from '@/components/ConditionSelector';
import {
  resizeImageForAnalysis,
  analysisToFormData,
  createConcurrencyLimiter,
} from '@/lib/bulk-utils';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function LotePage() {
  const [drafts, setDrafts] = useState<BulkDraft[]>([]);
  const [batchCondition, setBatchCondition] = useState('');
  const [phase, setPhase] = useState<'select' | 'analyzing' | 'review'>('select');
  const limiterRef = useRef(createConcurrencyLimiter(3));

  // ---------- Add empty book slot ----------

  function addBookSlot() {
    setDrafts((prev) => [
      ...prev,
      {
        id: generateId(),
        imageFiles: [],
        imagePreviewUrls: [],
        imageBase64: '',
        status: 'pending',
        error: '',
        formData: {},
        uploadedMedia: [],
      },
    ]);
  }

  // ---------- Add photos to a specific book ----------

  const addPhotosToBook = useCallback(async (bookId: string, files: File[]) => {
    const newPreviewUrls = files.map((f) => URL.createObjectURL(f));

    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== bookId) return d;
        return {
          ...d,
          imageFiles: [...d.imageFiles, ...files],
          imagePreviewUrls: [...d.imagePreviewUrls, ...newPreviewUrls],
        };
      })
    );

    // Generate base64 from the first image if not yet set
    const draft = drafts.find((d) => d.id === bookId);
    const isFirstImage = !draft || draft.imageFiles.length === 0;
    if (isFirstImage && files[0]) {
      const { base64 } = await resizeImageForAnalysis(files[0]);
      setDrafts((prev) =>
        prev.map((d) => (d.id === bookId ? { ...d, imageBase64: base64 } : d))
      );
    }
  }, [drafts]);

  // ---------- Remove a photo from a book ----------

  const removePhotoFromBook = useCallback((bookId: string, photoIndex: number) => {
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.id !== bookId) return d;
        URL.revokeObjectURL(d.imagePreviewUrls[photoIndex]);
        const newFiles = d.imageFiles.filter((_, i) => i !== photoIndex);
        const newUrls = d.imagePreviewUrls.filter((_, i) => i !== photoIndex);
        return {
          ...d,
          imageFiles: newFiles,
          imagePreviewUrls: newUrls,
          // Recalculate base64 will happen on analyze
          imageBase64: photoIndex === 0 ? '' : d.imageBase64,
        };
      })
    );
  }, []);

  // ---------- Remove a book ----------

  function removeDraft(id: string) {
    setDrafts((prev) => {
      const draft = prev.find((d) => d.id === id);
      if (draft) draft.imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((d) => d.id !== id);
    });
  }

  // ---------- Analyze all ----------

  async function analyzeAll() {
    // Ensure base64 is set for all drafts with photos
    const updatedDrafts = await Promise.all(
      drafts.map(async (d) => {
        if (d.imageFiles.length > 0 && !d.imageBase64) {
          const { base64 } = await resizeImageForAnalysis(d.imageFiles[0]);
          return { ...d, imageBase64: base64 };
        }
        return d;
      })
    );
    setDrafts(updatedDrafts);

    setPhase('analyzing');
    const limit = limiterRef.current;

    const toAnalyze = updatedDrafts.filter(
      (d) => (d.status === 'pending' || d.status === 'error') && d.imageFiles.length > 0
    );

    await Promise.allSettled(
      toAnalyze.map((draft) =>
        limit(async () => {
          setDrafts((prev) =>
            prev.map((d) =>
              d.id === draft.id ? { ...d, status: 'analyzing' as const, error: '' } : d
            )
          );

          try {
            const res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: draft.imageBase64,
                mimeType: 'image/jpeg',
                condition: batchCondition,
              }),
            });

            if (!res.ok) throw new Error('Erro na analise da IA');

            const analysis: GeminiAnalysis = await res.json();
            const formData = analysisToFormData(analysis);

            setDrafts((prev) =>
              prev.map((d) =>
                d.id === draft.id
                  ? { ...d, status: 'analyzed' as const, formData }
                  : d
              )
            );
          } catch (err) {
            setDrafts((prev) =>
              prev.map((d) =>
                d.id === draft.id
                  ? {
                      ...d,
                      status: 'error' as const,
                      error: err instanceof Error ? err.message : 'Erro desconhecido',
                    }
                  : d
              )
            );
          }
        })
      )
    );

    setPhase('review');
  }

  // ---------- Retry single ----------

  async function retrySingle(id: string) {
    const draft = drafts.find((d) => d.id === id);
    if (!draft || draft.imageFiles.length === 0) return;

    // Ensure base64
    let base64 = draft.imageBase64;
    if (!base64) {
      const result = await resizeImageForAnalysis(draft.imageFiles[0]);
      base64 = result.base64;
    }

    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'analyzing' as const, error: '', imageBase64: base64 } : d
      )
    );

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg', condition: batchCondition }),
      });

      if (!res.ok) throw new Error('Erro na analise da IA');

      const analysis: GeminiAnalysis = await res.json();
      const formData = analysisToFormData(analysis);

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'analyzed' as const, formData } : d
        )
      );
    } catch (err) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'error' as const,
                error: err instanceof Error ? err.message : 'Erro desconhecido',
              }
            : d
        )
      );
    }
  }

  // ---------- Publish single ----------

  const publishSingle = useCallback(async (id: string, data: Partial<Book>) => {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'publishing' as const } : d
      )
    );

    try {
      const draft = drafts.find((d) => d.id === id);
      let media: MediaItem[] = [];

      // If the form already has uploaded media from BookForm, use those
      if (data.media && Array.isArray(data.media) && data.media.length > 0) {
        media = data.media;
      } else if (draft && draft.imageFiles.length > 0) {
        // Upload all images for this book
        for (const file of draft.imageFiles) {
          const { blob } = await resizeImageForAnalysis(file);
          const formDataUpload = new FormData();
          formDataUpload.append('file', blob, file.name);

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formDataUpload,
          });

          if (!uploadRes.ok) throw new Error('Erro no upload da imagem');

          const uploadResult = await uploadRes.json();
          media.push({ url: uploadResult.url, type: 'image', path: uploadResult.path });
        }
      }

      const bookData = {
        ...data,
        media,
        photo_url: media[0]?.url || '',
      };

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao publicar');
      }

      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'published' as const, uploadedMedia: media }
            : d
        )
      );
    } catch (err) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: 'analyzed' as const,
                error: err instanceof Error ? err.message : 'Erro ao publicar',
              }
            : d
        )
      );
      alert(`Erro ao publicar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts]);

  // ---------- Stats ----------

  const totalCount = drafts.length;
  const withPhotos = drafts.filter((d) => d.imageFiles.length > 0).length;
  const analyzedCount = drafts.filter(
    (d) => d.status === 'analyzed' || d.status === 'published' || d.status === 'publishing'
  ).length;
  const errorCount = drafts.filter((d) => d.status === 'error').length;
  const publishedCount = drafts.filter((d) => d.status === 'published').length;
  const readyCount = drafts.filter((d) => d.status === 'analyzed').length;
  const analyzingCount = drafts.filter((d) => d.status === 'analyzing').length;
  const canAnalyze = phase === 'select' && withPhotos > 0 && !!batchCondition;

  // ---------- Render ----------

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adicionar em lote</h1>
          <p className="text-sm text-warm-500 mt-1">
            Adicione livros, coloque as fotos de cada um e analise todos com IA.
          </p>
        </div>
        <Link
          href="/admin"
          className="px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 transition"
        >
          Voltar
        </Link>
      </div>

      {/* Book slots list */}
      {drafts.length > 0 && (
        <div className="space-y-3 mb-4">
          {drafts.map((draft, i) => (
            <BulkBookCard
              key={draft.id}
              draft={draft}
              index={i}
              onAddPhotos={addPhotosToBook}
              onRemovePhoto={removePhotoFromBook}
              onPublish={publishSingle}
              onRetry={retrySingle}
              onRemove={removeDraft}
            />
          ))}
        </div>
      )}

      {/* Add book button */}
      {(phase === 'select' || phase === 'review') && (
        <button
          onClick={addBookSlot}
          className="w-full py-4 border-2 border-dashed border-warm-300 rounded-2xl text-warm-500 hover:border-navy-400 hover:text-navy-600 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Adicionar livro</span>
        </button>
      )}

      {/* Condition selector for the batch */}
      {phase === 'select' && withPhotos > 0 && (
        <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
          <ConditionSelector
            value={batchCondition}
            onChange={setBatchCondition}
            required
          />
        </div>
      )}

      {/* Action bar */}
      {phase === 'select' && withPhotos > 0 && (
        <div className="mt-4 flex items-center justify-between bg-navy-50 rounded-2xl p-4">
          <p className="text-sm text-navy-700">
            <span className="font-semibold">{withPhotos}</span> {withPhotos === 1 ? 'livro' : 'livros'} com fotos
            {totalCount - withPhotos > 0 && (
              <span className="text-warm-400 ml-1">
                ({totalCount - withPhotos} sem foto)
              </span>
            )}
          </p>
          <button
            onClick={analyzeAll}
            disabled={!canAnalyze}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition ${
              canAnalyze
                ? 'bg-navy-700 text-white hover:bg-navy-600'
                : 'bg-warm-200 text-warm-400 cursor-not-allowed'
            }`}
          >
            Analisar todos com IA
          </button>
        </div>
      )}

      {/* Progress bar during analysis */}
      {(phase === 'analyzing' || (phase === 'review' && analyzingCount > 0)) && (
        <div className="mt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-navy-700">Analisando com IA...</p>
            <p className="text-sm text-warm-500">
              {analyzedCount + errorCount}/{withPhotos}
            </p>
          </div>
          <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy-600 rounded-full transition-all duration-300"
              style={{
                width: `${withPhotos > 0 ? ((analyzedCount + errorCount) / withPhotos) * 100 : 0}%`,
              }}
            />
          </div>
          {errorCount > 0 && (
            <p className="text-xs text-red-500 mt-1">
              {errorCount} {errorCount === 1 ? 'erro' : 'erros'} na analise
            </p>
          )}
        </div>
      )}

      {/* Review stats */}
      {phase === 'review' && analyzingCount === 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-gray-100 text-center">
              <p className="text-lg sm:text-xl font-bold text-green-600">{readyCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Prontos</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-gray-100 text-center">
              <p className="text-lg sm:text-xl font-bold text-blue-600">{publishedCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Publicados</p>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-gray-100 text-center">
              <p className="text-lg sm:text-xl font-bold text-red-500">{errorCount}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Erros</p>
            </div>
          </div>

          {/* All published message */}
          {publishedCount > 0 && readyCount === 0 && errorCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-green-800">
                {publishedCount} {publishedCount === 1 ? 'livro publicado' : 'livros publicados'} com sucesso!
              </p>
              <Link href="/admin" className="text-sm text-green-600 hover:underline mt-2 inline-block">
                Voltar ao Dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
