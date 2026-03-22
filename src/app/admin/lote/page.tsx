'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Book, GeminiAnalysis, MediaItem } from '@/types';
import BulkBookCard, { type BulkDraft } from '@/components/BulkBookCard';
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
  const [phase, setPhase] = useState<'select' | 'analyzing' | 'review'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const limiterRef = useRef(createConcurrencyLimiter(3));

  // ---------- File selection ----------

  async function handleFiles(files: FileList) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newDrafts: BulkDraft[] = await Promise.all(
      imageFiles.map(async (file) => {
        const { base64, blob: _blob } = await resizeImageForAnalysis(file);
        return {
          id: generateId(),
          imageFile: file,
          imagePreviewUrl: URL.createObjectURL(file),
          imageBase64: base64,
          status: 'pending' as const,
          error: '',
          formData: {},
          uploadedMedia: [],
        };
      })
    );

    setDrafts((prev) => [...prev, ...newDrafts]);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }

  function removeDraft(id: string) {
    setDrafts((prev) => {
      const draft = prev.find((d) => d.id === id);
      if (draft) URL.revokeObjectURL(draft.imagePreviewUrl);
      return prev.filter((d) => d.id !== id);
    });
  }

  // ---------- Analyze all ----------

  async function analyzeAll() {
    setPhase('analyzing');
    const limit = limiterRef.current;

    const pendingDrafts = drafts.filter(
      (d) => d.status === 'pending' || d.status === 'error'
    );

    await Promise.allSettled(
      pendingDrafts.map((draft) =>
        limit(async () => {
          // Set analyzing
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
    if (!draft) return;

    setDrafts((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: 'analyzing' as const, error: '' } : d
      )
    );

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: draft.imageBase64,
          mimeType: 'image/jpeg',
        }),
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

      // If the form already has media from BookForm editing, use those
      if (data.media && Array.isArray(data.media) && data.media.length > 0) {
        media = data.media;
      } else if (draft) {
        // Upload the original image
        const { blob } = await resizeImageForAnalysis(draft.imageFile);
        const formDataUpload = new FormData();
        formDataUpload.append('file', blob, draft.imageFile.name);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        if (!uploadRes.ok) throw new Error('Erro no upload da imagem');

        const uploadResult = await uploadRes.json();
        media = [{ url: uploadResult.url, type: 'image', path: uploadResult.path }];
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
  const analyzedCount = drafts.filter(
    (d) => d.status === 'analyzed' || d.status === 'published' || d.status === 'publishing'
  ).length;
  const errorCount = drafts.filter((d) => d.status === 'error').length;
  const publishedCount = drafts.filter((d) => d.status === 'published').length;
  const readyCount = drafts.filter((d) => d.status === 'analyzed').length;
  const analyzingCount = drafts.filter((d) => d.status === 'analyzing').length;

  // ---------- Render ----------

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adicionar em lote</h1>
          <p className="text-sm text-warm-500 mt-1">
            Selecione uma foto de cada livro. A IA analisa todos de uma vez.
          </p>
        </div>
        <Link
          href="/admin"
          className="px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 transition"
        >
          Voltar
        </Link>
      </div>

      {/* Phase: Select photos */}
      {(phase === 'select' || (phase === 'review' && readyCount < totalCount)) && (
        <div className="mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-warm-300 rounded-2xl hover:border-navy-400 transition-colors"
          >
            <div className="py-10 flex flex-col items-center justify-center text-warm-400 px-4">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-warm-500 mb-1">
                Arraste fotos dos livros aqui
              </p>
              <p className="text-xs text-warm-400 mb-4">
                Uma foto por livro (capa ou frente). Voce pode adicionar mais fotos depois.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 text-white rounded-xl text-sm font-medium hover:bg-navy-600 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Escolher fotos
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Selected photos preview + analyze button */}
      {drafts.length > 0 && phase === 'select' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-warm-700">
              {totalCount} {totalCount === 1 ? 'foto selecionada' : 'fotos selecionadas'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  drafts.forEach((d) => URL.revokeObjectURL(d.imagePreviewUrl));
                  setDrafts([]);
                }}
                className="px-3 py-1.5 text-xs text-warm-500 hover:text-red-600 transition"
              >
                Limpar tudo
              </button>
              <button
                onClick={analyzeAll}
                className="px-4 py-2 bg-navy-700 text-white rounded-xl text-sm font-medium hover:bg-navy-600 transition"
              >
                Analisar todos com IA
              </button>
            </div>
          </div>

          {/* Photo grid preview */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {drafts.map((draft, i) => (
              <div key={draft.id} className="relative aspect-square rounded-lg overflow-hidden bg-warm-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.imagePreviewUrl}
                  alt={`Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeDraft(draft.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs hover:bg-black/80"
                >
                  &times;
                </button>
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar during analysis */}
      {(phase === 'analyzing' || (phase === 'review' && analyzingCount > 0)) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-navy-700">
              Analisando com IA...
            </p>
            <p className="text-sm text-warm-500">
              {analyzedCount + errorCount}/{totalCount}
            </p>
          </div>
          <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy-600 rounded-full transition-all duration-300"
              style={{
                width: `${totalCount > 0 ? ((analyzedCount + errorCount) / totalCount) * 100 : 0}%`,
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

      {/* Review phase: stats + cards */}
      {phase === 'review' && analyzingCount === 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
              <p className="text-xl font-bold text-green-600">{readyCount}</p>
              <p className="text-xs text-gray-500">Prontos</p>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
              <p className="text-xl font-bold text-blue-600">{publishedCount}</p>
              <p className="text-xs text-gray-500">Publicados</p>
            </div>
            <div className="bg-white rounded-2xl p-3 border border-gray-100 text-center">
              <p className="text-xl font-bold text-red-500">{errorCount}</p>
              <p className="text-xs text-gray-500">Erros</p>
            </div>
          </div>

          {readyCount > 0 && publishedCount === totalCount - errorCount ? null : readyCount > 0 ? (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-medium bg-warm-100 text-warm-700 rounded-lg hover:bg-warm-200 transition"
              >
                + Adicionar mais fotos
              </button>
            </div>
          ) : null}

          {/* All published message */}
          {publishedCount > 0 && readyCount === 0 && errorCount === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-4">
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

      {/* Draft cards list */}
      {(phase === 'analyzing' || phase === 'review') && (
        <div className="space-y-2">
          {drafts.map((draft, i) => (
            <BulkBookCard
              key={draft.id}
              draft={draft}
              index={i}
              onPublish={publishSingle}
              onRetry={retrySingle}
              onRemove={removeDraft}
            />
          ))}
        </div>
      )}
    </div>
  );
}
