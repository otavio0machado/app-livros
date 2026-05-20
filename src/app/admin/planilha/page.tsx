'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type {
  BatchBookAIAnalysis,
  BatchBookImage,
  BookImageRole,
  ShopeeListingDraft,
} from '@/types/batch';
import {
  BOOK_IMAGE_ROLE_HELP,
  BOOK_IMAGE_ROLE_LABELS,
  buildShopeeListingDraft,
  validateShopeeListing,
} from '@/lib/shopee-bulk';
import { createConcurrencyLimiter, resizeImageForAnalysis } from '@/lib/bulk-utils';

const STORAGE_KEY = 'myshelf-shopee-sheet-batch-v1';

const ROLE_ORDER: BookImageRole[] = [
  'front_cover',
  'back_cover',
  'spine',
  'isbn_page',
  'defect',
  'other',
];

const CONDITIONS = [
  '',
  'Novo',
  'Usado - Excelente estado, como novo.',
  'Usado - Contém marcas de uso.',
  'Usado - Contém marcas de uso e pode conter poucos escritos ou marcações.',
  'Usado - Pode conter poucos escritos ou marcações.',
  'Usado - Contém marcas de uso, bastante marcações, escritos e/ou exercícios resolvidos.',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.',
];

type DraftStatus = 'draft' | 'uploading' | 'analyzing' | 'review' | 'ready' | 'error';
type LocalBatchBookImage = BatchBookImage & { analysisBase64?: string };

interface BatchBookDraft {
  id: string;
  condition: string;
  images: LocalBatchBookImage[];
  analysis: BatchBookAIAnalysis | null;
  listing: ShopeeListingDraft | null;
  status: DraftStatus;
  error: string;
}

interface StoredBatch {
  batchName: string;
  books: BatchBookDraft[];
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 12);
}

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2);
}

function parsePriceToCents(value: string) {
  return Math.round(Number(value.replace(',', '.')) * 100) || 0;
}

function statusLabel(status: DraftStatus) {
  const labels: Record<DraftStatus, string> = {
    draft: 'Rascunho',
    uploading: 'Enviando',
    analyzing: 'Analisando',
    review: 'Revisar',
    ready: 'Pronto',
    error: 'Erro',
  };
  return labels[status];
}

function statusClass(status: DraftStatus) {
  const classes: Record<DraftStatus, string> = {
    draft: 'bg-warm-100 text-warm-600',
    uploading: 'bg-blue-50 text-blue-700',
    analyzing: 'bg-blue-50 text-blue-700',
    review: 'bg-yellow-50 text-yellow-700',
    ready: 'bg-green-50 text-green-700',
    error: 'bg-red-50 text-red-700',
  };
  return classes[status];
}

function serializeBooks(books: BatchBookDraft[]): BatchBookDraft[] {
  return books.map((book) => ({
    ...book,
    images: book.images.map((image) => ({
      id: image.id,
      role: image.role,
      url: image.url,
      path: image.path,
      mimeType: image.mimeType,
    })),
  }));
}

function getImageUrlsForShopee(images: LocalBatchBookImage[]) {
  const rank = new Map(ROLE_ORDER.map((role, index) => [role, index]));
  return [...images]
    .sort((a, b) => (rank.get(a.role) ?? 99) - (rank.get(b.role) ?? 99))
    .map((image) => image.url)
    .filter(Boolean)
    .slice(0, 9);
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

function TextCell({
  value,
  onChange,
  className = 'w-44',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${className} px-2 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-900 outline-none focus:ring-2 focus:ring-navy-200`}
    />
  );
}

function NumberCell({
  value,
  onChange,
  step = '1',
  className = 'w-24',
}: {
  value: number;
  onChange: (value: number) => void;
  step?: string;
  className?: string;
}) {
  return (
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(event) => onChange(Number(event.target.value))}
      className={`${className} px-2 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-900 outline-none focus:ring-2 focus:ring-navy-200`}
    />
  );
}

export default function ShopeeSheetPage() {
  const [batchName, setBatchName] = useState('Lote Shopee');
  const [books, setBooks] = useState<BatchBookDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const limiterRef = useRef(createConcurrencyLimiter(2));

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StoredBatch;
        setBatchName(parsed.batchName || 'Lote Shopee');
        setBooks(Array.isArray(parsed.books) ? parsed.books : []);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: StoredBatch = {
      batchName,
      books: serializeBooks(books),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [batchName, books, hydrated]);

  const listings = useMemo(
    () => books.map((book) => book.listing).filter(Boolean) as ShopeeListingDraft[],
    [books]
  );

  const readyListings = useMemo(
    () => listings.filter((listing) => validateShopeeListing(listing).valid),
    [listings]
  );

  const stats = useMemo(() => {
    const withImages = books.filter((book) => book.images.length > 0).length;
    const ready = books.filter((book) => book.listing && validateShopeeListing(book.listing).valid).length;
    const needsReview = books.filter((book) => book.status === 'review').length;
    const errors = books.filter((book) => book.status === 'error').length;
    return { withImages, ready, needsReview, errors };
  }, [books]);

  function addBook() {
    setBooks((prev) => [
      ...prev,
      {
        id: makeId(),
        condition: '',
        images: [],
        analysis: null,
        listing: null,
        status: 'draft',
        error: '',
      },
    ]);
  }

  function clearBatch() {
    if (!confirm('Limpar este lote e começar de novo?')) return;
    setBooks([]);
    setBatchName('Lote Shopee');
    localStorage.removeItem(STORAGE_KEY);
  }

  function removeBook(id: string) {
    setBooks((prev) => prev.filter((book) => book.id !== id));
  }

  function updateCondition(id: string, condition: string) {
    setBooks((prev) =>
      prev.map((book) => (book.id === id ? { ...book, condition } : book))
    );
  }

  async function uploadImages(bookId: string, role: BookImageRole, files: FileList | null) {
    if (!files || files.length === 0) return;

    setGlobalError('');
    setBooks((prev) =>
      prev.map((book) => (book.id === bookId ? { ...book, status: 'uploading', error: '' } : book))
    );

    try {
      const uploaded: LocalBatchBookImage[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;

        const { blob, base64 } = await resizeImageForAnalysis(file);
        const formData = new FormData();
        formData.append('file', blob, file.name.replace(/\.[^.]+$/, '.jpg'));

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao enviar imagem');
        }
        const data = await res.json();
        uploaded.push({
          id: makeId(),
          role,
          url: data.url,
          path: data.path,
          mimeType: 'image/jpeg',
          analysisBase64: base64,
        });
      }

      setBooks((prev) =>
        prev.map((book) => {
          if (book.id !== bookId) return book;
          const images = [...book.images, ...uploaded].slice(0, 9);
          return {
            ...book,
            images,
            listing: book.listing ? { ...book.listing, imageUrls: getImageUrlsForShopee(images) } : book.listing,
            status: book.listing ? 'review' : 'draft',
          };
        })
      );
    } catch (error) {
      setBooks((prev) =>
        prev.map((book) =>
          book.id === bookId
            ? { ...book, status: 'error', error: error instanceof Error ? error.message : 'Erro no upload' }
            : book
        )
      );
    }
  }

  function removeImage(bookId: string, imageId: string) {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        const images = book.images.filter((image) => image.id !== imageId);
        return {
          ...book,
          images,
          listing: book.listing ? { ...book.listing, imageUrls: getImageUrlsForShopee(images) } : book.listing,
          status: book.listing ? 'review' : 'draft',
        };
      })
    );
  }

  async function analyzeBookSnapshot(book: BatchBookDraft, index: number) {
    if (book.images.length === 0) {
      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id ? { ...item, status: 'error', error: 'Adicione pelo menos uma imagem.' } : item
        )
      );
      return;
    }

    setBooks((prev) =>
      prev.map((item) =>
        item.id === book.id ? { ...item, status: 'analyzing', error: '' } : item
      )
    );

    try {
      const images = await Promise.all(
        book.images.slice(0, 9).map(async (image) => ({
          imageBase64: image.analysisBase64 || await urlToBase64(image.url),
          mimeType: image.mimeType || 'image/jpeg',
          role: image.role,
        }))
      );

      const res = await fetch('/api/analyze-batch-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          condition: book.condition || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro na análise');
      }

      const analysis = await res.json() as BatchBookAIAnalysis;
      const listing = buildShopeeListingDraft(book.id, index, book.images, analysis);
      const validation = validateShopeeListing(listing);

      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id
            ? {
                ...item,
                analysis,
                listing,
                status: validation.valid && !analysis.needs_human_review ? 'ready' : 'review',
                error: '',
              }
            : item
        )
      );
    } catch (error) {
      setBooks((prev) =>
        prev.map((item) =>
          item.id === book.id
            ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Erro ao analisar' }
            : item
        )
      );
    }
  }

  async function analyzeBook(id: string) {
    const index = books.findIndex((book) => book.id === id);
    const book = books[index];
    if (!book) return;
    await analyzeBookSnapshot(book, index);
  }

  async function analyzeAll() {
    const targets = books
      .map((book, index) => ({ book, index }))
      .filter(({ book }) => book.images.length > 0 && book.status !== 'analyzing' && book.status !== 'uploading');

    await Promise.allSettled(
      targets.map(({ book, index }) =>
        limiterRef.current(() => analyzeBookSnapshot(book, index))
      )
    );
  }

  function updateListing<K extends keyof ShopeeListingDraft>(
    bookId: string,
    field: K,
    value: ShopeeListingDraft[K]
  ) {
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId || !book.listing) return book;
        const listing = { ...book.listing, [field]: value };
        return {
          ...book,
          listing,
          status: validateShopeeListing(listing).valid && listing.confidence >= 0.72 ? 'ready' : 'review',
        };
      })
    );
  }

  async function exportCsv() {
    setExporting(true);
    setGlobalError('');

    try {
      const res = await fetch('/api/shopee-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchName,
          listings: readyListings,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao gerar CSV');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${batchName || 'lote-shopee'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setGlobalError(error instanceof Error ? error.message : 'Erro ao exportar');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Planilha Shopee por IA</h1>
          <p className="text-sm text-warm-500 mt-1">
            Crie um lote, analise as fotos dos livros e baixe um CSV para upload em massa.
          </p>
        </div>
        <Link href="/admin" className="px-3 py-1.5 text-sm text-warm-500 hover:text-warm-700 transition">
          Voltar
        </Link>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
          <div>
            <label className="block text-xs font-medium text-warm-500 mb-1">Nome do lote</label>
            <input
              value={batchName}
              onChange={(event) => setBatchName(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-warm-200 text-warm-900 outline-none focus:ring-2 focus:ring-navy-200"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 min-w-[280px]">
            <div className="bg-warm-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-warm-900">{books.length}</p>
              <p className="text-[10px] text-warm-500">Livros</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-700">{stats.withImages}</p>
              <p className="text-[10px] text-blue-700">Com foto</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-yellow-700">{stats.needsReview}</p>
              <p className="text-[10px] text-yellow-700">Revisar</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-green-700">{stats.ready}</p>
              <p className="text-[10px] text-green-700">Prontos</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <button
            onClick={addBook}
            className="px-4 py-2.5 bg-navy-700 text-white rounded-xl text-sm font-medium hover:bg-navy-600 transition"
          >
            Adicionar livro
          </button>
          <button
            onClick={analyzeAll}
            disabled={stats.withImages === 0}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:bg-warm-200 disabled:text-warm-400 transition"
          >
            Analisar todos
          </button>
          <button
            onClick={exportCsv}
            disabled={readyListings.length === 0 || exporting}
            className="px-4 py-2.5 bg-[#EE4D2D] text-white rounded-xl text-sm font-medium hover:bg-[#d4431f] disabled:bg-warm-200 disabled:text-warm-400 transition"
          >
            {exporting ? 'Gerando...' : `Baixar CSV (${readyListings.length})`}
          </button>
          <button
            onClick={clearBatch}
            className="px-4 py-2.5 bg-warm-100 text-warm-600 rounded-xl text-sm font-medium hover:bg-warm-200 transition sm:ml-auto"
          >
            Limpar lote
          </button>
        </div>

        {globalError && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{globalError}</p>
        )}
      </section>

      {books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-warm-500">Nenhum livro neste lote ainda.</p>
          <button
            onClick={addBook}
            className="mt-3 px-4 py-2 bg-navy-700 text-white rounded-xl text-sm font-medium hover:bg-navy-600 transition"
          >
            Criar primeiro livro
          </button>
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {books.map((book, index) => {
            const imagesByRole = ROLE_ORDER.map((role) => ({
              role,
              images: book.images.filter((image) => image.role === role),
            }));

            return (
              <section key={book.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 flex flex-col lg:flex-row gap-4">
                  <div className="lg:w-60 flex-shrink-0">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Livro {index + 1}</p>
                        <p className="text-xs text-warm-500">
                          {book.images.length}/9 imagens
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass(book.status)}`}>
                        {statusLabel(book.status)}
                      </span>
                    </div>

                    <select
                      value={book.condition}
                      onChange={(event) => updateCondition(book.id, event.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-warm-200 text-sm text-warm-900 bg-white outline-none focus:ring-2 focus:ring-navy-200 mb-3"
                    >
                      <option value="">Condição geral...</option>
                      {CONDITIONS.filter(Boolean).map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => analyzeBook(book.id)}
                        disabled={book.images.length === 0 || book.status === 'analyzing' || book.status === 'uploading'}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 disabled:bg-warm-200 disabled:text-warm-400 transition"
                      >
                        {book.status === 'analyzing' ? 'Analisando...' : 'Analisar'}
                      </button>
                      <button
                        onClick={() => removeBook(book.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-medium hover:bg-red-100 transition"
                      >
                        Remover
                      </button>
                    </div>

                    {book.error && (
                      <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                        {book.error}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {imagesByRole.map(({ role, images }) => (
                      <div key={role} className="border border-warm-200 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-xs font-semibold text-warm-800">{BOOK_IMAGE_ROLE_LABELS[role]}</p>
                            <p className="text-[11px] text-warm-400 leading-snug">{BOOK_IMAGE_ROLE_HELP[role]}</p>
                          </div>
                          <label className="px-2 py-1 bg-warm-100 text-warm-700 rounded-lg text-[11px] font-medium cursor-pointer hover:bg-warm-200 transition">
                            +
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              className="hidden"
                              onChange={(event) => {
                                uploadImages(book.id, role, event.target.files);
                                event.target.value = '';
                              }}
                            />
                          </label>
                        </div>

                        {images.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {images.map((image) => (
                              <div key={image.id} className="relative w-16 h-16 rounded-lg overflow-hidden bg-warm-100 flex-shrink-0">
                                <Image src={image.url} alt={BOOK_IMAGE_ROLE_LABELS[role]} fill className="object-cover" sizes="64px" />
                                <button
                                  onClick={() => removeImage(book.id, image.id)}
                                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full text-xs"
                                  aria-label="Remover imagem"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-16 rounded-lg border border-dashed border-warm-200 flex items-center justify-center text-[11px] text-warm-400">
                            Sem imagem
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {listings.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Revisão dos anúncios</h2>
            <p className="text-sm text-warm-500 mt-1">
              Edite qualquer campo antes de baixar. Linhas com erro obrigatório não entram na exportação.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1900px] w-full text-left">
              <thead className="bg-warm-50 text-[11px] uppercase tracking-wide text-warm-500">
                <tr>
                  <th className="px-3 py-2">Livro</th>
                  <th className="px-3 py-2">Produto</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Categoria</th>
                  <th className="px-3 py-2">Código cat.</th>
                  <th className="px-3 py-2">Preço</th>
                  <th className="px-3 py-2">Estoque</th>
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">ISBN</th>
                  <th className="px-3 py-2">Editora</th>
                  <th className="px-3 py-2">Idioma</th>
                  <th className="px-3 py-2">Ano</th>
                  <th className="px-3 py-2">Peso</th>
                  <th className="px-3 py-2">L</th>
                  <th className="px-3 py-2">C</th>
                  <th className="px-3 py-2">A</th>
                  <th className="px-3 py-2">Condição</th>
                  <th className="px-3 py-2">Observações</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {books.filter((book) => book.listing).map((book, index) => {
                  const listing = book.listing!;
                  const validation = validateShopeeListing(listing);
                  return (
                    <tr key={book.id} className="align-top">
                      <td className="px-3 py-3 text-xs text-warm-500">#{index + 1}</td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.productName} onChange={(value) => updateListing(book.id, 'productName', value)} className="w-64" />
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          value={listing.description}
                          onChange={(event) => updateListing(book.id, 'description', event.target.value)}
                          rows={3}
                          className="w-72 px-2 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-900 outline-none focus:ring-2 focus:ring-navy-200 resize-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.category} onChange={(value) => updateListing(book.id, 'category', value)} className="w-64" />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.categoryCode} onChange={(value) => updateListing(book.id, 'categoryCode', value)} className="w-28" />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          value={formatPrice(listing.priceCents)}
                          onChange={(event) => updateListing(book.id, 'priceCents', parsePriceToCents(event.target.value))}
                          className="w-24 px-2 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-900 outline-none focus:ring-2 focus:ring-navy-200"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <NumberCell value={listing.stock} onChange={(value) => updateListing(book.id, 'stock', Math.max(1, Math.round(value)))} />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.sku} onChange={(value) => updateListing(book.id, 'sku', value)} />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.isbn} onChange={(value) => updateListing(book.id, 'isbn', value)} />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.publisher} onChange={(value) => updateListing(book.id, 'publisher', value)} />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.language} onChange={(value) => updateListing(book.id, 'language', value)} className="w-28" />
                      </td>
                      <td className="px-3 py-3">
                        <TextCell value={listing.year} onChange={(value) => updateListing(book.id, 'year', value)} className="w-24" />
                      </td>
                      <td className="px-3 py-3">
                        <NumberCell value={listing.weightKg} step="0.01" onChange={(value) => updateListing(book.id, 'weightKg', value)} />
                      </td>
                      <td className="px-3 py-3">
                        <NumberCell value={listing.widthCm} step="0.1" onChange={(value) => updateListing(book.id, 'widthCm', value)} className="w-20" />
                      </td>
                      <td className="px-3 py-3">
                        <NumberCell value={listing.lengthCm} step="0.1" onChange={(value) => updateListing(book.id, 'lengthCm', value)} className="w-20" />
                      </td>
                      <td className="px-3 py-3">
                        <NumberCell value={listing.heightCm} step="0.1" onChange={(value) => updateListing(book.id, 'heightCm', value)} className="w-20" />
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={listing.condition}
                          onChange={(event) => updateListing(book.id, 'condition', event.target.value as ShopeeListingDraft['condition'])}
                          className="w-28 px-2 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-900 bg-white outline-none focus:ring-2 focus:ring-navy-200"
                        >
                          <option value="Usado">Usado</option>
                          <option value="Novo">Novo</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <textarea
                          value={listing.conditionNotes}
                          onChange={(event) => updateListing(book.id, 'conditionNotes', event.target.value)}
                          rows={3}
                          className="w-60 px-2 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-900 outline-none focus:ring-2 focus:ring-navy-200 resize-none"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1 w-52">
                          <span className={`inline-flex text-xs px-2 py-1 rounded-full font-medium ${validation.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {validation.valid ? 'Exporta' : 'Corrigir'}
                          </span>
                          <p className="text-[11px] text-warm-500">
                            Confiança IA: {Math.round(listing.confidence * 100)}%
                          </p>
                          {validation.blockingErrors.map((error) => (
                            <p key={error} className="text-[11px] text-red-600">{error}</p>
                          ))}
                          {validation.warnings.slice(0, 3).map((warning) => (
                            <p key={warning} className="text-[11px] text-yellow-700">{warning}</p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
