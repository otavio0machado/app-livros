'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Book, GeminiAnalysis, GeminiCollectionAnalysis, MediaItem } from '@/types';
import MediaUploader from '@/components/MediaUploader';
import ConditionSelector from '@/components/ConditionSelector';
import BookForm from '@/components/BookForm';
import { analysisToFormData, createConcurrencyLimiter } from '@/lib/bulk-utils';

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

type Phase = 'setup' | 'analyzing' | 'review' | 'done';
type Mode = 'with-books' | 'add-and-collect' | 'collection-only';

// Individual book slot for "add-and-collect" mode
interface BookSlot {
  id: string;
  media: MediaItem[];
  condition: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'error' | 'publishing' | 'published';
  error: string;
  formData: Partial<Book>;
  expanded: boolean;
}

export default function ColecaoPage() {
  // Mode
  const [mode, setMode] = useState<Mode>('with-books');

  // Collection setup
  const [collMedia, setCollMedia] = useState<MediaItem[]>([]);
  const [collCondition, setCollCondition] = useState('');
  const [discountPct, setDiscountPct] = useState(15);

  // Mode: with-books
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(new Set());
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mode: add-and-collect
  const [bookSlots, setBookSlots] = useState<BookSlot[]>([]);
  const limiterRef = useRef(createConcurrencyLimiter(3));

  // Shared state
  const [phase, setPhase] = useState<Phase>('setup');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');

  // Collection review
  const [collFormData, setCollFormData] = useState<Partial<Book> | null>(null);
  const [collFinalMedia, setCollFinalMedia] = useState<MediaItem[]>([]);

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

  const selectedBooks = allBooks.filter((b) => selectedBookIds.has(b.id));
  const hasCollImages = collMedia.filter((m) => m.type === 'image').length > 0;
  const slotsWithMedia = bookSlots.filter((s) => s.media.length > 0 && s.condition);

  const canAnalyze =
    hasCollImages &&
    !!collCondition &&
    (mode === 'with-books'
      ? selectedBookIds.size >= 2
      : mode === 'add-and-collect'
        ? slotsWithMedia.length >= 1
        : true);

  function toggleBook(id: number) {
    setSelectedBookIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---------- Book slots (add-and-collect) ----------

  function addBookSlot() {
    setBookSlots((prev) => [
      ...prev,
      {
        id: generateId(),
        media: [],
        condition: '',
        status: 'pending',
        error: '',
        formData: {},
        expanded: false,
      },
    ]);
  }

  function removeBookSlot(id: string) {
    setBookSlots((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSlotMedia(id: string, media: MediaItem[]) {
    setBookSlots((prev) => prev.map((s) => (s.id === id ? { ...s, media } : s)));
  }

  function updateSlotCondition(id: string, condition: string) {
    setBookSlots((prev) => prev.map((s) => (s.id === id ? { ...s, condition } : s)));
  }

  // ---------- Get image base64 from URL ----------

  async function imageUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
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
      if (mode === 'add-and-collect') {
        await analyzeAddAndCollect();
      } else {
        await analyzeSimple();
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro desconhecido');
      setPhase('setup');
    } finally {
      setAnalyzing(false);
    }
  }

  // Analyze: with-books or collection-only
  async function analyzeSimple() {
    const base64 = await imageUrlToBase64(collMedia.filter((m) => m.type === 'image')[0].url);

    const booksData =
      mode === 'with-books'
        ? selectedBooks.map((b) => ({ title: b.title, author: b.author, price_cents: b.price_cents }))
        : undefined;

    const res = await fetch('/api/analyze-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: 'image/jpeg',
        condition: collCondition,
        books: booksData,
        discountPct: mode === 'with-books' ? discountPct : undefined,
      }),
    });

    if (!res.ok) throw new Error('Erro na analise da colecao');
    const analysis: GeminiCollectionAnalysis = await res.json();

    let finalMedia = [...collMedia];
    if (mode === 'with-books') {
      const bookPhotos: MediaItem[] = selectedBooks.flatMap((b) => {
        if (Array.isArray(b.media) && b.media.length > 0) return b.media;
        if (b.photo_url) return [{ url: b.photo_url, type: 'image' as const, path: '' }];
        return [];
      });
      finalMedia = [...collMedia, ...bookPhotos];
    }
    setCollFinalMedia(finalMedia);
    buildCollectionFormData(analysis, mode === 'with-books' ? selectedBooks : undefined);
    setPhase('review');
  }

  // Analyze: add-and-collect (individual books first, then collection)
  async function analyzeAddAndCollect() {
    const limit = limiterRef.current;

    // Step 1: Analyze each individual book, track results locally
    const toAnalyze = bookSlots.filter(
      (s) => (s.status === 'pending' || s.status === 'error') && s.media.length > 0 && s.condition
    );

    const results: { id: string; formData: Partial<Book>; media: MediaItem[] }[] = [];

    await Promise.allSettled(
      toAnalyze.map((slot) =>
        limit(async () => {
          setBookSlots((prev) =>
            prev.map((s) => (s.id === slot.id ? { ...s, status: 'analyzing' as const, error: '' } : s))
          );

          try {
            const images = slot.media.filter((m) => m.type === 'image');
            if (images.length === 0) throw new Error('Sem foto');
            const base64 = await imageUrlToBase64(images[0].url);

            const res = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: base64, mimeType: 'image/jpeg', condition: slot.condition }),
            });

            if (!res.ok) throw new Error('Erro na analise');
            const analysis: GeminiAnalysis = await res.json();
            const formData = analysisToFormData(analysis);
            formData.condition_detail = slot.condition;

            results.push({ id: slot.id, formData, media: slot.media });

            setBookSlots((prev) =>
              prev.map((s) => (s.id === slot.id ? { ...s, status: 'analyzed' as const, formData } : s))
            );
          } catch (err) {
            setBookSlots((prev) =>
              prev.map((s) =>
                s.id === slot.id
                  ? { ...s, status: 'error' as const, error: err instanceof Error ? err.message : 'Erro' }
                  : s
              )
            );
          }
        })
      )
    );

    // Step 2: Analyze the collection using the results we tracked
    if (results.length === 0) {
      setAnalysisError('Nenhum livro foi analisado com sucesso');
      setPhase('setup');
      return;
    }

    const base64 = await imageUrlToBase64(collMedia.filter((m) => m.type === 'image')[0].url);
    const booksData = results.map((r) => ({
      title: r.formData.title || '',
      author: r.formData.author || '',
      price_cents: r.formData.price_cents || 0,
    }));

    const res = await fetch('/api/analyze-collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        mimeType: 'image/jpeg',
        condition: collCondition,
        books: booksData,
        discountPct,
      }),
    });

    if (!res.ok) throw new Error('Erro na analise da colecao');
    const analysis: GeminiCollectionAnalysis = await res.json();

    // Build collection media: collection photos + all individual book photos
    const bookPhotos: MediaItem[] = results.flatMap((r) => r.media);
    setCollFinalMedia([...collMedia, ...bookPhotos]);
    buildCollectionFormData(analysis, undefined, results.map((r) => ({
      ...bookSlots.find((s) => s.id === r.id)!,
      formData: r.formData,
    })));
    setPhase('review');
  }

  function buildCollectionFormData(
    analysis: GeminiCollectionAnalysis,
    existingBooks?: Book[],
    slots?: BookSlot[]
  ) {
    const totalVolumes = existingBooks?.length || slots?.length || 0;
    const authors = existingBooks
      ? existingBooks.map((b) => b.author).filter((a, i, arr) => arr.indexOf(a) === i).join(', ')
      : slots
        ? [...new Set(slots.map((s) => s.formData.author).filter(Boolean))].join(', ')
        : '';

    setCollFormData({
      type: 'Livro',
      title: analysis.title,
      description: analysis.description,
      price_cents: analysis.suggested_price_cents,
      category: analysis.category,
      condition_detail: collCondition,
      weight_kg: analysis.weight_kg || 0,
      width_cm: analysis.width_cm || 0,
      length_cm: analysis.length_cm || 0,
      height_cm: analysis.height_cm || 0,
      author: authors,
      publisher: existingBooks?.[0]?.publisher || slots?.[0]?.formData.publisher || '',
      language: 'Português',
      origin: 'Nacional',
      stock: 1,
      quantity: 1,
      status: 'available',
      collection_name: analysis.title,
      collection_total_volumes: totalVolumes,
      collection_discount_pct: discountPct,
    });
  }

  // ---------- Publish individual book (add-and-collect) ----------

  const publishSlot = useCallback(async (slotId: string, data: Partial<Book>) => {
    setBookSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, status: 'publishing' as const, expanded: false } : s))
    );

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao publicar');
      }
      setBookSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: 'published' as const } : s))
      );
    } catch (err) {
      setBookSlots((prev) =>
        prev.map((s) =>
          s.id === slotId
            ? { ...s, status: 'analyzed' as const, error: err instanceof Error ? err.message : 'Erro' }
            : s
        )
      );
      alert(err instanceof Error ? err.message : 'Erro ao publicar');
    }
  }, []);

  // ---------- Publish collection ----------

  async function handlePublishCollection(data: Partial<Book>) {
    const bookData = {
      ...data,
      collection_id: `col-${Date.now()}`,
      collection_total_volumes:
        mode === 'with-books'
          ? selectedBooks.length
          : mode === 'add-and-collect'
            ? bookSlots.length
            : undefined,
      collection_discount_pct: mode !== 'collection-only' ? discountPct : undefined,
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

  // ---------- Stats ----------

  const filteredBooks = searchQuery
    ? allBooks.filter(
        (b) =>
          b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allBooks;

  const slotsAnalyzed = bookSlots.filter((s) => s.status === 'analyzed').length;
  const slotsPublished = bookSlots.filter((s) => s.status === 'published').length;
  const slotsError = bookSlots.filter((s) => s.status === 'error').length;

  const helpText = !hasCollImages
    ? 'Adicione a foto da colecao'
    : !collCondition
      ? 'Selecione a condição'
      : mode === 'with-books' && selectedBookIds.size < 2
        ? 'Selecione pelo menos 2 livros'
        : mode === 'add-and-collect' && slotsWithMedia.length < 1
          ? 'Adicione pelo menos 1 livro com foto e condição'
          : '';

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
        <Link href="/admin" className="px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 transition">
          Voltar
        </Link>
      </div>

      {/* ===== SETUP PHASE ===== */}
      {(phase === 'setup' || phase === 'analyzing') && (
        <div className="space-y-6">
          {/* 1. Collection photo */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">Fotos da colecao</label>
            <MediaUploader items={collMedia} onChange={setCollMedia} />
          </div>

          {/* 2. Collection condition */}
          <ConditionSelector value={collCondition} onChange={setCollCondition} required />

          {/* 3. Mode toggle (3 options) */}
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Os livros da colecao ja foram cadastrados individualmente?
            </label>
            <div className="space-y-2">
              {([
                {
                  key: 'with-books' as Mode,
                  title: 'Sim, selecionar livros',
                  desc: 'Vou escolher os livros ja cadastrados',
                },
                {
                  key: 'add-and-collect' as Mode,
                  title: 'Nao, quero adicionar os livros tambem',
                  desc: 'Adicionar cada livro com fotos e condição individual',
                },
                {
                  key: 'collection-only' as Mode,
                  title: 'Nao, vender so a colecao',
                  desc: 'A IA identifica tudo pela foto',
                },
              ]).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setMode(opt.key)}
                  className={`w-full text-left py-3 px-4 rounded-xl text-sm transition border-2 ${
                    mode === opt.key
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-warm-200 text-warm-500 hover:border-warm-300'
                  }`}
                >
                  <span className="font-semibold">{opt.title}</span>
                  <span className="block text-xs mt-0.5 opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Discount (with-books and add-and-collect) */}
          {mode !== 'collection-only' && (
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-1">Desconto da colecao (%)</label>
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

          {/* 5a. Select existing books (with-books mode) */}
          {mode === 'with-books' && (
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">Selecione os livros da colecao</label>
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
                    {selectedBookIds.size} {selectedBookIds.size === 1 ? 'livro selecionado' : 'livros selecionados'}
                  </p>
                  <p className="text-xs text-purple-500 mt-0.5">
                    Total: {formatPrice(selectedBooks.reduce((sum, b) => sum + b.price_cents, 0))}
                    {' → '}Com {discountPct}%:{' '}
                    <span className="font-semibold">
                      {formatPrice(Math.round(selectedBooks.reduce((sum, b) => sum + b.price_cents, 0) * (1 - discountPct / 100)))}
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
                    const isSel = selectedBookIds.has(book.id);
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => toggleBook(book.id)}
                        className={`w-full flex items-center gap-3 p-2.5 text-left transition ${
                          isSel ? 'bg-purple-50 border-l-4 border-purple-500' : 'hover:bg-warm-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${isSel ? 'bg-purple-600 border-purple-600' : 'border-warm-300'}`}>
                          {isSel && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {book.photo_url ? (
                            <Image src={book.photo_url} alt={book.title} fill className="object-cover" sizes="40px" />
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
                        <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{formatPrice(book.price_cents)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5b. Add individual books (add-and-collect mode) */}
          {mode === 'add-and-collect' && (
            <div>
              <label className="block text-sm font-medium text-warm-700 mb-2">
                Livros da colecao ({bookSlots.length})
              </label>
              <div className="space-y-3">
                {bookSlots.map((slot, i) => (
                  <div key={slot.id} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-purple-700">{i + 1}</span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900">Livro {i + 1}</h4>
                      </div>
                      <button
                        onClick={() => removeBookSlot(slot.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Book photos */}
                    <div className="mb-3">
                      <MediaUploader
                        items={slot.media}
                        onChange={(items) => updateSlotMedia(slot.id, items)}
                      />
                    </div>

                    {/* Book condition */}
                    <ConditionSelector
                      value={slot.condition}
                      onChange={(c) => updateSlotCondition(slot.id, c)}
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={addBookSlot}
                className="w-full mt-3 py-3 border-2 border-dashed border-warm-300 rounded-xl text-warm-500 hover:border-purple-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">Adicionar livro</span>
              </button>
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
            {analyzing ? 'Analisando...' : 'Analisar com IA'}
          </button>
          {helpText && !analyzing && (
            <p className="text-xs text-warm-400 text-center -mt-4">{helpText}</p>
          )}

          {analyzing && (
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-blue-700 font-medium">Analisando com IA...</p>
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

      {/* ===== REVIEW PHASE ===== */}
      {phase === 'review' && (
        <div className="space-y-6">
          {/* Individual books review (add-and-collect only) */}
          {mode === 'add-and-collect' && bookSlots.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Livros individuais ({slotsPublished}/{bookSlots.length} publicados)
              </h2>
              <div className="space-y-2">
                {bookSlots.map((slot, i) => (
                  <div
                    key={slot.id}
                    className={`bg-white rounded-xl border overflow-hidden ${
                      slot.status === 'published' ? 'border-green-200 opacity-60' : 'border-gray-100'
                    }`}
                  >
                    <div className="p-3 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-purple-700">{i + 1}</span>
                      </div>
                      <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0 relative">
                        {slot.media[0]?.url ? (
                          <Image src={slot.media[0].url} alt="" fill className="object-cover" sizes="40px" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        {slot.status === 'analyzing' && (
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-navy-600">Analisando...</span>
                          </div>
                        )}
                        {slot.status === 'error' && (
                          <p className="text-sm text-red-600">{slot.error}</p>
                        )}
                        {(slot.status === 'analyzed' || slot.status === 'publishing' || slot.status === 'published') && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">{slot.formData.title || `Livro ${i + 1}`}</p>
                            <p className="text-xs text-gray-500">{slot.formData.author}</p>
                            {slot.formData.price_cents ? (
                              <span className="text-xs font-semibold">{formatPrice(slot.formData.price_cents)}</span>
                            ) : null}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {slot.status === 'published' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Publicado</span>
                        )}
                        {slot.status === 'publishing' && (
                          <div className="flex items-center gap-1 text-xs text-navy-600">
                            <div className="w-3 h-3 border-2 border-navy-600 border-t-transparent rounded-full animate-spin" />
                            Publicando...
                          </div>
                        )}
                        {slot.status === 'analyzed' && !slot.expanded && (
                          <button
                            onClick={() => setBookSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, expanded: true } : s)))}
                            className="px-3 py-1.5 text-xs font-medium bg-navy-700 text-white rounded-lg hover:bg-navy-600 transition"
                          >
                            Revisar
                          </button>
                        )}
                      </div>
                    </div>
                    {slot.expanded && slot.status === 'analyzed' && (
                      <div className="border-t border-gray-100 p-4">
                        <div className="max-w-2xl">
                          <BookForm
                            initialData={{ ...slot.formData, media: slot.media, photo_url: slot.media[0]?.url || '' }}
                            onSubmit={async (data) => {
                              setBookSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, expanded: false } : s)));
                              await publishSlot(slot.id, data);
                            }}
                            submitLabel="Publicar livro"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collection review */}
          {collFormData && (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Anuncio da colecao</h2>
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-3">
                <p className="text-xs text-purple-600">
                  {mode === 'with-books'
                    ? `${selectedBooks.length} livros — ${discountPct}% de desconto. Fotos incluidas automaticamente.`
                    : mode === 'add-and-collect'
                      ? `${bookSlots.length} livros — ${discountPct}% de desconto. Publique os livros individuais acima e depois a colecao.`
                      : 'Colecao identificada pela IA. Revise antes de publicar.'}
                </p>
              </div>
              <div className="max-w-2xl">
                <BookForm
                  initialData={{ ...collFormData, media: collFinalMedia, photo_url: collFinalMedia[0]?.url || '' }}
                  onSubmit={handlePublishCollection}
                  submitLabel="Publicar colecao"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== DONE PHASE ===== */}
      {phase === 'done' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-green-800">Colecao publicada com sucesso!</p>
          {mode === 'add-and-collect' && slotsPublished > 0 && (
            <p className="text-sm text-green-600 mt-1">{slotsPublished} livros individuais tambem publicados.</p>
          )}
          <Link href="/admin" className="text-sm text-green-600 hover:underline mt-2 inline-block">
            Voltar ao Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
