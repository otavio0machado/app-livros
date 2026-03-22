'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Book, GeminiCollectionAnalysis, MediaItem } from '@/types';
import MediaUploader from '@/components/MediaUploader';
import ConditionSelector from '@/components/ConditionSelector';
import BookForm from '@/components/BookForm';

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

type Phase = 'setup' | 'analyzing' | 'review' | 'done';
type Mode = 'with-books' | 'collection-only';

export default function ColecaoPage() {
  // Mode
  const [mode, setMode] = useState<Mode>('with-books');

  // Phase 1: Setup
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [condition, setCondition] = useState('');
  const [discountPct, setDiscountPct] = useState(15);

  // Book selection (only for with-books mode)
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(new Set());
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Phase 2+
  const [phase, setPhase] = useState<Phase>('setup');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Phase 3: Review
  const [collectionFormData, setCollectionFormData] = useState<Partial<Book> | null>(null);
  const [collectionMedia, setCollectionMedia] = useState<MediaItem[]>([]);

  // Load existing books
  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await fetch('/api/books?status=available');
        const data = await res.json();
        setAllBooks(data);
      } catch (err) {
        console.error('Erro ao carregar livros:', err);
      } finally {
        setLoadingBooks(false);
      }
    }
    loadBooks();
  }, []);

  // Filtered books
  const filteredBooks = searchQuery
    ? allBooks.filter(
        (b) =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBooks;

  const selectedBooks = allBooks.filter((b) => selectedBookIds.has(b.id));
  const hasImages = media.filter((m) => m.type === 'image').length > 0;
  const canAnalyze =
    hasImages &&
    !!condition &&
    (mode === 'collection-only' || selectedBookIds.size >= 2);

  function toggleBook(id: number) {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---------- Get image base64 ----------

  async function getFirstImageBase64(): Promise<string> {
    const images = media.filter((m) => m.type === 'image');
    const response = await fetch(images[0].url);
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  // ---------- Analyze ----------

  async function handleAnalyze() {
    if (!canAnalyze) return;

    setAnalyzing(true);
    setAnalysisError('');
    setPhase('analyzing');

    try {
      const base64 = await getFirstImageBase64();

      const booksData =
        mode === 'with-books'
          ? selectedBooks.map((b) => ({
              title: b.title,
              author: b.author,
              price_cents: b.price_cents,
            }))
          : undefined;

      const res = await fetch('/api/analyze-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
          condition,
          books: booksData,
          discountPct: mode === 'with-books' ? discountPct : undefined,
        }),
      });

      if (!res.ok) throw new Error('Erro na analise da colecao');

      const analysis: GeminiCollectionAnalysis = await res.json();

      // Build media: collection photos + individual book photos (if mode with-books)
      let allMedia = [...media];
      if (mode === 'with-books') {
        const bookPhotos: MediaItem[] = selectedBooks.flatMap((b) => {
          if (Array.isArray(b.media) && b.media.length > 0) return b.media;
          if (b.photo_url) return [{ url: b.photo_url, type: 'image' as const, path: '' }];
          return [];
        });
        allMedia = [...media, ...bookPhotos];
      }
      setCollectionMedia(allMedia);

      if (mode === 'with-books') {
        const totalWeight = selectedBooks.reduce((sum, b) => sum + (b.weight_kg || 0.3), 0);
        setCollectionFormData({
          type: selectedBooks[0]?.type || 'Livro',
          title: analysis.title,
          description: analysis.description,
          price_cents: analysis.suggested_price_cents,
          category: analysis.category,
          condition_detail: condition,
          weight_kg: analysis.weight_kg || totalWeight,
          width_cm: analysis.width_cm || 0,
          length_cm: analysis.length_cm || 0,
          height_cm: analysis.height_cm || 0,
          author: selectedBooks
            .map((b) => b.author)
            .filter((a, i, arr) => arr.indexOf(a) === i)
            .join(', '),
          publisher: selectedBooks[0]?.publisher || '',
          language: selectedBooks[0]?.language || 'Português',
          origin: 'Nacional',
          stock: 1,
          quantity: 1,
          status: 'available',
          collection_name: analysis.title,
          collection_total_volumes: selectedBooks.length,
          collection_discount_pct: discountPct,
        });
      } else {
        // Collection only - AI fills everything
        setCollectionFormData({
          type: 'Livro',
          title: analysis.title,
          description: analysis.description,
          price_cents: analysis.suggested_price_cents,
          category: analysis.category,
          condition_detail: condition,
          weight_kg: analysis.weight_kg || 0,
          width_cm: analysis.width_cm || 0,
          length_cm: analysis.length_cm || 0,
          height_cm: analysis.height_cm || 0,
          language: 'Português',
          origin: 'Nacional',
          stock: 1,
          quantity: 1,
          status: 'available',
          collection_name: analysis.title,
        });
      }

      setPhase('review');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPhase('setup');
    } finally {
      setAnalyzing(false);
    }
  }

  // ---------- Publish ----------

  async function handlePublish(data: Partial<Book>) {
    const bookData = {
      ...data,
      collection_id: `col-${Date.now()}`,
      collection_total_volumes:
        mode === 'with-books' ? selectedBooks.length : undefined,
      collection_discount_pct:
        mode === 'with-books' ? discountPct : undefined,
    };

    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookData),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Erro ao publicar');
      return;
    }

    setPhase('done');
  }

  // ---------- Render ----------

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Criar colecao</h1>
          <p className="text-sm text-warm-500 mt-1">
            Venda uma colecao de livros como um unico anuncio.
          </p>
        </div>
        <Link
          href="/admin"
          className="px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 transition"
        >
          Voltar
        </Link>
      </div>

      {/* Phase: Setup */}
      {(phase === 'setup' || phase === 'analyzing') && (
        <div className="space-y-6">
          {/* 1. Collection photo */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Fotos da colecao
            </label>
            <MediaUploader items={media} onChange={setMedia} />
          </div>

          {/* 2. Condition */}
          <ConditionSelector value={condition} onChange={setCondition} required />

          {/* 3. Mode toggle */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Os livros da colecao ja foram cadastrados individualmente?
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('with-books')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition border-2 ${
                  mode === 'with-books'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-warm-200 text-warm-500 hover:border-warm-300'
                }`}
              >
                <span className="block font-semibold">Sim, selecionar livros</span>
                <span className="block text-xs mt-0.5 opacity-70">
                  Vou escolher os livros ja cadastrados
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('collection-only')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition border-2 ${
                  mode === 'collection-only'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-warm-200 text-warm-500 hover:border-warm-300'
                }`}
              >
                <span className="block font-semibold">Nao, vender so a colecao</span>
                <span className="block text-xs mt-0.5 opacity-70">
                  A IA identifica tudo pela foto
                </span>
              </button>
            </div>
          </div>

          {/* 4. Discount (only with-books mode) */}
          {mode === 'with-books' && (
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">
                Desconto da colecao (%)
              </label>
              <input
                type="number"
                value={discountPct}
                onChange={(e) => setDiscountPct(parseInt(e.target.value) || 0)}
                min={0}
                max={50}
                className="w-24 px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200"
              />
            </div>
          )}

          {/* 5. Select books (only with-books mode) */}
          {mode === 'with-books' && (
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Selecione os livros da colecao
              </label>

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por titulo ou autor..."
                className="w-full px-4 py-2.5 rounded-xl border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200 mb-3"
              />

              {selectedBookIds.size > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                  <p className="text-sm font-medium text-purple-700">
                    {selectedBookIds.size}{' '}
                    {selectedBookIds.size === 1 ? 'livro selecionado' : 'livros selecionados'}
                  </p>
                  <p className="text-xs text-purple-500 mt-0.5">
                    Total individual:{' '}
                    {formatPrice(selectedBooks.reduce((sum, b) => sum + b.price_cents, 0))}
                    {' → '}
                    Com {discountPct}% desconto:{' '}
                    <span className="font-semibold">
                      {formatPrice(
                        Math.round(
                          selectedBooks.reduce((sum, b) => sum + b.price_cents, 0) *
                            (1 - discountPct / 100)
                        )
                      )}
                    </span>
                  </p>
                </div>
              )}

              {loadingBooks ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-3 border-navy-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredBooks.length === 0 ? (
                <p className="text-sm text-warm-400 text-center py-4">
                  {searchQuery ? 'Nenhum livro encontrado.' : 'Nenhum livro disponivel.'}
                </p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto rounded-xl border border-warm-200">
                  {filteredBooks.map((book) => {
                    const isSelected = selectedBookIds.has(book.id);
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => toggleBook(book.id)}
                        className={`w-full flex items-center gap-3 p-2.5 text-left transition ${
                          isSelected
                            ? 'bg-purple-50 border-l-4 border-purple-500'
                            : 'hover:bg-warm-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                            isSelected ? 'bg-purple-600 border-purple-600' : 'border-warm-300'
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>

                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {book.photo_url ? (
                            <Image
                              src={book.photo_url}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{book.title}</p>
                          <p className="text-xs text-gray-500 truncate">{book.author}</p>
                        </div>

                        <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                          {formatPrice(book.price_cents)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
              {!hasImages
                ? 'Adicione a foto da colecao'
                : !condition
                  ? 'Selecione a condição'
                  : mode === 'with-books' && selectedBookIds.size < 2
                    ? 'Selecione pelo menos 2 livros'
                    : ''}
            </p>
          )}

          {analyzing && (
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-blue-700 font-medium">Gerando anuncio da colecao...</p>
              <p className="text-blue-500 text-sm mt-1">
                {mode === 'with-books'
                  ? `Combinando ${selectedBookIds.size} livros com ${discountPct}% de desconto`
                  : 'Identificando volumes pela foto'}
              </p>
            </div>
          )}

          {analysisError && (
            <div className="bg-red-50 rounded-2xl p-4">
              <p className="text-red-700 text-sm font-medium">Erro na analise</p>
              <p className="text-red-500 text-sm mt-1">{analysisError}</p>
            </div>
          )}
        </div>
      )}

      {/* Phase: Review */}
      {phase === 'review' && collectionFormData && (
        <div>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-4">
            <p className="text-xs text-purple-600">
              {mode === 'with-books'
                ? `Colecao com ${selectedBooks.length} livros — ${discountPct}% de desconto. Fotos dos livros individuais foram adicionadas automaticamente.`
                : 'Colecao completa identificada pela IA. Revise os dados antes de publicar.'}
            </p>
          </div>
          <div className="max-w-2xl">
            <BookForm
              initialData={{
                ...collectionFormData,
                media: collectionMedia,
                photo_url: collectionMedia[0]?.url || '',
              }}
              onSubmit={handlePublish}
              submitLabel="Publicar colecao"
            />
          </div>
        </div>
      )}

      {/* Phase: Done */}
      {phase === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-green-800">Colecao publicada com sucesso!</p>
          <Link href="/admin" className="text-sm text-green-600 hover:underline mt-2 inline-block">
            Voltar ao Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
