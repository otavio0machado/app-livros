'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Book, GeminiCollectionAnalysis, MediaItem } from '@/types';
import MediaUploader from '@/components/MediaUploader';
import ConditionSelector from '@/components/ConditionSelector';
import BookForm from '@/components/BookForm';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

interface VolumeDraft {
  id: string;
  volumeNumber: number;
  formData: Partial<Book>;
  expanded: boolean;
  status: 'ready' | 'publishing' | 'published' | 'error';
  error: string;
}

type Phase = 'upload' | 'analyzing' | 'review' | 'done';

export default function ColecaoPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [condition, setCondition] = useState('');
  const [phase, setPhase] = useState<Phase>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  const [collectionName, setCollectionName] = useState('');
  const [collectionId] = useState(generateId());
  const [discountPct, setDiscountPct] = useState(15);
  const [volumes, setVolumes] = useState<VolumeDraft[]>([]);

  const hasImages = media.filter((m) => m.type === 'image').length > 0;
  const canAnalyze = hasImages && !!condition;
  const publishedCount = volumes.filter((v) => v.status === 'published').length;
  const readyCount = volumes.filter((v) => v.status === 'ready').length;

  // ---------- Analyze collection ----------

  async function handleAnalyze() {
    if (!canAnalyze) return;

    setAnalyzing(true);
    setAnalysisError('');
    setPhase('analyzing');

    try {
      const images = media.filter((m) => m.type === 'image');
      const response = await fetch(images[0].url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const res = await fetch('/api/analyze-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
          condition,
        }),
      });

      if (!res.ok) throw new Error('Erro na analise da colecao');

      const analysis: GeminiCollectionAnalysis = await res.json();

      setCollectionName(analysis.collection_name);

      const volumeDrafts: VolumeDraft[] = analysis.volumes.map((vol) => {
        const discountedPrice = Math.round(
          vol.suggested_price_cents * (1 - discountPct / 100)
        );
        return {
          id: generateId(),
          volumeNumber: vol.volume_number,
          formData: {
            type: analysis.type,
            title: vol.title,
            author: vol.author,
            publisher: vol.publisher,
            isbn: vol.isbn,
            category: vol.category,
            condition_detail: condition,
            description: vol.description,
            language: vol.language,
            edition_type: vol.edition_type,
            cover_type: vol.cover_type,
            year: vol.year,
            weight_kg: vol.weight_kg,
            price_cents: discountedPrice,
            width_cm: vol.width_cm,
            length_cm: vol.length_cm,
            height_cm: vol.height_cm,
            subject: vol.subject,
            course_origin: vol.course_origin,
            origin: 'Nacional',
            stock: 1,
            quantity: 1,
            status: 'available',
          },
          expanded: false,
          status: 'ready',
          error: '',
        };
      });

      setVolumes(volumeDrafts);
      setPhase('review');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPhase('upload');
    } finally {
      setAnalyzing(false);
    }
  }

  // ---------- Recalculate discount ----------

  function applyDiscount(newPct: number) {
    setDiscountPct(newPct);
    // We can't recalculate because we don't have the original prices anymore
    // The discount is applied at analysis time
  }

  // ---------- Add volume ----------

  function addVolume() {
    setVolumes((prev) => [
      ...prev,
      {
        id: generateId(),
        volumeNumber: prev.length + 1,
        formData: {
          type: 'Livro',
          title: '',
          author: '',
          condition_detail: condition,
          status: 'available',
          stock: 1,
          quantity: 1,
          origin: 'Nacional',
          language: 'Português',
          weight_kg: 0.3,
          price_cents: 0,
        },
        expanded: true,
        status: 'ready',
        error: '',
      },
    ]);
  }

  // ---------- Remove volume ----------

  function removeVolume(id: string) {
    setVolumes((prev) => prev.filter((v) => v.id !== id));
  }

  // ---------- Publish single volume ----------

  async function publishVolume(volId: string, data: Partial<Book>) {
    setVolumes((prev) =>
      prev.map((v) =>
        v.id === volId ? { ...v, status: 'publishing' as const, expanded: false } : v
      )
    );

    try {
      const bookData = {
        ...data,
        collection_id: collectionId,
        collection_name: collectionName,
        collection_volume: volumes.find((v) => v.id === volId)?.volumeNumber || 1,
        collection_total_volumes: volumes.length,
        collection_discount_pct: discountPct,
      };

      // If the form data doesn't have media, use the shared collection media
      if (!bookData.media || (Array.isArray(bookData.media) && bookData.media.length === 0)) {
        bookData.media = media;
        bookData.photo_url = media[0]?.url || '';
      }

      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao publicar');
      }

      setVolumes((prev) =>
        prev.map((v) =>
          v.id === volId ? { ...v, status: 'published' as const } : v
        )
      );
    } catch (err) {
      setVolumes((prev) =>
        prev.map((v) =>
          v.id === volId
            ? {
                ...v,
                status: 'ready' as const,
                error: err instanceof Error ? err.message : 'Erro ao publicar',
              }
            : v
        )
      );
      alert(`Erro ao publicar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  }

  // ---------- Check if all published ----------

  const allPublished = volumes.length > 0 && readyCount === 0 && publishedCount === volumes.length;

  if (allPublished && phase !== 'done') {
    setPhase('done');
  }

  // ---------- Render ----------

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adicionar colecao</h1>
          <p className="text-sm text-warm-500 mt-1">
            Tire uma foto da colecao e a IA identifica cada volume automaticamente.
          </p>
        </div>
        <Link
          href="/admin"
          className="px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 transition"
        >
          Voltar
        </Link>
      </div>

      {/* Phase: Upload */}
      {(phase === 'upload' || phase === 'analyzing') && (
        <div className="space-y-6">
          {/* Media upload */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Fotos da colecao
            </label>
            <MediaUploader items={media} onChange={setMedia} />
          </div>

          {/* Condition */}
          <ConditionSelector value={condition} onChange={setCondition} required />

          {/* Analyze button */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
            className={`w-full py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
              canAnalyze && !analyzing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-warm-100 text-warm-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {analyzing ? 'Analisando colecao...' : 'Analisar colecao com IA'}
          </button>
          {!canAnalyze && !analyzing && (
            <p className="text-xs text-warm-400 text-center -mt-4">
              {!hasImages && !condition
                ? 'Adicione fotos e selecione a condição para analisar'
                : !hasImages
                  ? 'Adicione pelo menos uma foto para analisar'
                  : 'Selecione a condição dos livros para analisar'}
            </p>
          )}

          {/* Analysis loading */}
          {analyzing && (
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-blue-700 font-medium">Analisando colecao com IA...</p>
              <p className="text-blue-500 text-sm mt-1">Identificando volumes individualmente</p>
            </div>
          )}

          {/* Error */}
          {analysisError && (
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-red-700 text-sm font-medium">Erro na analise</p>
              <p className="text-red-500 text-sm mt-1">{analysisError}</p>
            </div>
          )}
        </div>
      )}

      {/* Phase: Review */}
      {(phase === 'review' || phase === 'done') && (
        <div className="space-y-4">
          {/* Collection header */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Nome da colecao
                </label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">
                  Desconto da colecao (%)
                </label>
                <input
                  type="number"
                  value={discountPct}
                  onChange={(e) => applyDiscount(parseInt(e.target.value) || 0)}
                  min={0}
                  max={50}
                  className="w-full px-3 py-2 rounded-lg border border-purple-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-purple-600">
              <span>{volumes.length} volumes</span>
              <span>{publishedCount} publicados</span>
              <span>{readyCount} prontos</span>
            </div>
          </div>

          {/* Volume cards */}
          <div className="space-y-2">
            {volumes.map((vol) => (
              <div
                key={vol.id}
                className={`bg-white rounded-xl border overflow-hidden transition-all ${
                  vol.status === 'published'
                    ? 'border-green-200 opacity-60'
                    : 'border-gray-100'
                }`}
              >
                {/* Collapsed header */}
                <div className="p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-purple-700">V{vol.volumeNumber}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {vol.formData.title || `Volume ${vol.volumeNumber}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {vol.formData.price_cents ? (
                        <span className="text-sm font-semibold text-gray-900">
                          R$ {(vol.formData.price_cents / 100).toFixed(2).replace('.', ',')}
                        </span>
                      ) : null}
                      {vol.formData.author && (
                        <span className="text-xs text-warm-400 truncate">{vol.formData.author}</span>
                      )}
                    </div>
                    {vol.error && (
                      <p className="text-xs text-red-500 mt-0.5">{vol.error}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {vol.status === 'published' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        Publicado
                      </span>
                    )}
                    {vol.status === 'publishing' && (
                      <div className="flex items-center gap-1.5 text-xs text-navy-600">
                        <div className="w-3.5 h-3.5 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
                        Publicando...
                      </div>
                    )}
                    {vol.status === 'ready' && !vol.expanded && (
                      <button
                        onClick={() =>
                          setVolumes((prev) =>
                            prev.map((v) =>
                              v.id === vol.id ? { ...v, expanded: true } : v
                            )
                          )
                        }
                        className="px-3 py-1.5 text-xs font-medium bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition"
                      >
                        Revisar
                      </button>
                    )}
                    {vol.status === 'ready' && (
                      <button
                        onClick={() => removeVolume(vol.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remover volume"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: BookForm */}
                {vol.expanded && vol.status === 'ready' && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="max-w-2xl">
                      <BookForm
                        initialData={{
                          ...vol.formData,
                          media,
                          photo_url: media[0]?.url || '',
                        }}
                        onSubmit={async (data) => {
                          await publishVolume(vol.id, data);
                        }}
                        submitLabel="Publicar volume"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add volume button */}
          {phase === 'review' && (
            <button
              onClick={addVolume}
              className="w-full py-3 border-2 border-dashed border-warm-300 rounded-2xl text-warm-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium">Adicionar volume</span>
            </button>
          )}

          {/* All published */}
          {phase === 'done' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-green-800">
                Colecao &quot;{collectionName}&quot; publicada com {publishedCount} volumes!
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
