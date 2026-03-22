'use client';

import { useState } from 'react';
import type { Book, GeminiAnalysis, MediaItem } from '@/types';
import MediaUploader from './MediaUploader';
import AiAnalysisPanel from './AiAnalysisPanel';
import ShopeeLabelPreview from './ShopeeLabelPreview';

const CONDITIONS = [
  'Novo',
  'Usado - Excelente estado, como novo.',
  'Usado - Pode conter poucos escritos ou marcações.',
  'Usado - Contém bastante marcações, escritos e/ou exercícios resolvidos.',
];

const CATEGORIES = [
  'Ficção', 'Não-Ficção', 'Infantil', 'Acadêmico', 'Vestibular',
  'Autoajuda', 'Biografia', 'Romance', 'Terror', 'Fantasia', 'Ciência',
  'História', 'Religião', 'Computadores e Tecnologia', 'Direito', 'Medicina',
  'Engenharia', 'Outro'
];

function parseMedia(book?: Partial<Book>): MediaItem[] {
  if (!book) return [];
  if (book.media && Array.isArray(book.media) && book.media.length > 0) return book.media;
  if (typeof book.media === 'string') {
    try { return JSON.parse(book.media); } catch { /* ignore */ }
  }
  if (book.photo_url) return [{ url: book.photo_url, type: 'image', path: '' }];
  return [];
}

interface BookFormProps {
  initialData?: Partial<Book>;
  onSubmit: (data: Partial<Book>) => Promise<void>;
  submitLabel?: string;
}

export default function BookForm({ initialData, onSubmit, submitLabel = 'Salvar' }: BookFormProps) {
  const [media, setMedia] = useState<MediaItem[]>(parseMedia(initialData));
  const [form, setForm] = useState<Partial<Book>>({
    type: 'Livro',
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    category: '',
    condition_detail: '',
    condition_notes: '',
    description: '',
    language: 'Português',
    origin: 'Nacional',
    edition_type: '',
    cover_type: '',
    year: '',
    weight_kg: 0.3,
    price_cents: 0,
    stock: 1,
    width_cm: 0,
    length_cm: 0,
    height_cm: 0,
    subject: '',
    course_origin: '',
    gtin: '',
    brand: '',
    quantity: 1,
    package_size: '',
    custom_product: false,
    package_quantity: 1,
    editor: '',
    translator: '',
    version: '',
    sku: '',
    status: 'available',
    ...initialData,
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showShopeeLabel, setShowShopeeLabel] = useState(false);
  const [priceDisplay, setPriceDisplay] = useState(
    initialData?.price_cents ? (initialData.price_cents / 100).toFixed(2) : ''
  );

  function updateField(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFirstImageForAI(base64: string, mimeType: string) {
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysis(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) throw new Error('Erro na análise');
      const result: GeminiAnalysis = await res.json();
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Erro ao analisar');
    } finally {
      setAnalyzing(false);
    }
  }

  function applyAnalysis() {
    if (!analysis) return;
    const priceCents = analysis.suggested_price_cents || 0;
    setForm((prev) => ({
      ...prev,
      type: analysis.type || prev.type,
      title: analysis.title || prev.title,
      author: analysis.author || prev.author,
      publisher: analysis.publisher || prev.publisher,
      isbn: analysis.isbn || prev.isbn,
      category: analysis.category || prev.category,
      condition_detail: analysis.condition_detail || prev.condition_detail,
      description: analysis.description || prev.description,
      language: analysis.language || prev.language,
      edition_type: analysis.edition_type || prev.edition_type,
      cover_type: analysis.cover_type || prev.cover_type,
      year: analysis.year || prev.year,
      weight_kg: analysis.weight_kg || prev.weight_kg,
      price_cents: priceCents,
      width_cm: analysis.width_cm || prev.width_cm,
      length_cm: analysis.length_cm || prev.length_cm,
      height_cm: analysis.height_cm || prev.height_cm,
      subject: analysis.subject || prev.subject,
      course_origin: analysis.course_origin || prev.course_origin,
    }));
    setPriceDisplay((priceCents / 100).toFixed(2));
  }

  function handlePriceChange(value: string) {
    setPriceDisplay(value);
    const cents = Math.round(parseFloat(value.replace(',', '.') || '0') * 100);
    updateField('price_cents', cents);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.condition_detail) {
      alert('Selecione a condição do produto!');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        media,
        photo_url: media[0]?.url || '',
      });
    } finally {
      setSaving(false);
    }
  }

  const isApostila = form.type === 'Apostila';
  const formAsBook = { ...form, media, photo_url: media[0]?.url || '' } as Book;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Media Upload */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">Fotos e vídeos</label>
        <MediaUploader
          items={media}
          onChange={setMedia}
          onFirstImageBase64={handleFirstImageForAI}
        />
      </div>

      {/* AI Analysis */}
      <AiAnalysisPanel
        loading={analyzing}
        analysis={analysis}
        error={analysisError}
        onApply={applyAnalysis}
      />

      {/* Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">Tipo</label>
        <div className="flex gap-2">
          {['Livro', 'Apostila'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateField('type', t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                form.type === t
                  ? 'bg-navy-700 text-white'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Condition (REQUIRED) */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">
          Condição do produto <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <label
              key={c}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                form.condition_detail === c
                  ? 'border-navy-500 bg-navy-50'
                  : 'border-warm-200 hover:border-warm-300'
              }`}
            >
              <input
                type="radio"
                name="condition_detail"
                value={c}
                checked={form.condition_detail === c}
                onChange={(e) => updateField('condition_detail', e.target.value)}
                className="w-4 h-4 text-navy-700"
              />
              <span className="text-sm text-warm-700">{c}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Condition Notes (Optional) */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">
          Observações sobre o estado (opcional)
        </label>
        <textarea
          value={form.condition_notes || ''}
          onChange={(e) => updateField('condition_notes', e.target.value)}
          placeholder="Ex: Falta a contracapa, páginas amareladas, autografado..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 focus:border-navy-200 outline-none transition text-warm-900 resize-none"
        />
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Título *</label>
          <input type="text" value={form.title || ''} onChange={(e) => updateField('title', e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 focus:border-navy-200 outline-none transition text-warm-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Autor *</label>
          <input type="text" value={form.author || ''} onChange={(e) => updateField('author', e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 focus:border-navy-200 outline-none transition text-warm-900" />
        </div>
      </div>

      {/* Apostila-specific fields */}
      {isApostila && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-olive-50 rounded-2xl">
          <div>
            <label className="block text-sm font-medium text-olive-700 mb-1">Matéria</label>
            <input type="text" value={form.subject || ''} onChange={(e) => updateField('subject', e.target.value)} placeholder="Ex: Matemática, Física..." className="w-full px-4 py-3 rounded-xl border border-olive-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-300 outline-none transition text-warm-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-olive-700 mb-1">Cursinho</label>
            <input type="text" value={form.course_origin || ''} onChange={(e) => updateField('course_origin', e.target.value)} placeholder="Ex: Poliedro, Anglo..." className="w-full px-4 py-3 rounded-xl border border-olive-200 focus:ring-2 focus:ring-olive-300 focus:border-olive-300 outline-none transition text-warm-900" />
          </div>
        </div>
      )}

      {/* Category and ISBN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Categoria</label>
          <select value={form.category || ''} onChange={(e) => updateField('category', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 bg-white">
            <option value="">Selecionar...</option>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">ISBN</label>
          <input type="text" value={form.isbn || ''} onChange={(e) => updateField('isbn', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
      </div>

      {/* Publisher and Language */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Editora</label>
          <input type="text" value={form.publisher || ''} onChange={(e) => updateField('publisher', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Idioma</label>
          <input type="text" value={form.language || ''} onChange={(e) => updateField('language', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
      </div>

      {/* Edition, Cover, Year */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Tipo de Edição</label>
          <input type="text" value={form.edition_type || ''} onChange={(e) => updateField('edition_type', e.target.value)} placeholder="Ex: 1ª Edição" className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Tipo de Capa</label>
          <select value={form.cover_type || ''} onChange={(e) => updateField('cover_type', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 bg-white">
            <option value="">Selecionar...</option>
            <option value="Capa Dura">Capa Dura</option>
            <option value="Brochura">Brochura</option>
            <option value="Espiral">Espiral</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Ano</label>
          <input type="text" value={form.year || ''} onChange={(e) => updateField('year', e.target.value)} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-1">Descrição</label>
        <textarea value={form.description || ''} onChange={(e) => updateField('description', e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 resize-none" />
      </div>

      {/* Price and Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Preço (R$) *</label>
          <input type="text" value={priceDisplay} onChange={(e) => handlePriceChange(e.target.value)} required placeholder="29.90" className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-700 mb-1">Estoque</label>
          <input type="number" value={form.stock || 1} onChange={(e) => updateField('stock', parseInt(e.target.value) || 1)} min={0} className="w-full px-4 py-3 rounded-xl border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900" />
        </div>
      </div>

      {/* Shipping */}
      <div>
        <label className="block text-sm font-medium text-warm-700 mb-2">Envio</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-warm-500 mb-1">Peso (kg)</label>
            <input type="number" step="0.01" value={form.weight_kg || ''} onChange={(e) => updateField('weight_kg', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-warm-500 mb-1">Largura (cm)</label>
            <input type="number" step="0.1" value={form.width_cm || ''} onChange={(e) => updateField('width_cm', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-warm-500 mb-1">Comprimento (cm)</label>
            <input type="number" step="0.1" value={form.length_cm || ''} onChange={(e) => updateField('length_cm', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-warm-500 mb-1">Altura (cm)</label>
            <input type="number" step="0.1" value={form.height_cm || ''} onChange={(e) => updateField('height_cm', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:ring-2 focus:ring-navy-200 outline-none transition text-warm-900 text-sm" />
          </div>
        </div>
      </div>

      {/* Extra Shopee fields */}
      <details className="bg-warm-100/60 rounded-2xl">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-warm-600 hover:text-warm-800">
          Campos extras Shopee (opcional)
        </summary>
        <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className="block text-xs text-warm-500 mb-1">GTIN (EAN)</label><input type="text" value={form.gtin || ''} onChange={(e) => updateField('gtin', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
          <div><label className="block text-xs text-warm-500 mb-1">Marca</label><input type="text" value={form.brand || ''} onChange={(e) => updateField('brand', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
          <div><label className="block text-xs text-warm-500 mb-1">Importado/Local</label><select value={form.origin || 'Nacional'} onChange={(e) => updateField('origin', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 bg-white outline-none focus:ring-2 focus:ring-navy-200"><option value="Nacional">Nacional</option><option value="Importado">Importado</option></select></div>
          <div><label className="block text-xs text-warm-500 mb-1">Editor</label><input type="text" value={form.editor || ''} onChange={(e) => updateField('editor', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
          <div><label className="block text-xs text-warm-500 mb-1">Tradutor</label><input type="text" value={form.translator || ''} onChange={(e) => updateField('translator', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
          <div><label className="block text-xs text-warm-500 mb-1">Versão</label><input type="text" value={form.version || ''} onChange={(e) => updateField('version', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
          <div><label className="block text-xs text-warm-500 mb-1">SKU</label><input type="text" value={form.sku || ''} onChange={(e) => updateField('sku', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
          <div><label className="block text-xs text-warm-500 mb-1">Quantidade</label><input type="number" value={form.quantity || 1} onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm text-warm-900 outline-none focus:ring-2 focus:ring-navy-200" /></div>
        </div>
      </details>

      {/* Shopee Label Preview */}
      {form.title && form.price_cents ? (
        <div>
          <button type="button" onClick={() => setShowShopeeLabel(!showShopeeLabel)} className="flex items-center gap-2 px-4 py-2 bg-[#EE4D2D] text-white rounded-xl text-sm font-medium hover:bg-[#d4431f] transition">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.4 2H6.6C5.16 2 4 3.16 4 4.6v14.8C4 20.84 5.16 22 6.6 22h10.8c1.44 0 2.6-1.16 2.6-2.6V4.6C20 3.16 18.84 2 17.4 2zM12 5c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm5 14H7v-1c0-2 4-3.1 5-3.1s5 1.1 5 3.1v1z"/></svg>
            {showShopeeLabel ? 'Ocultar' : 'Ver'} Etiqueta Shopee
          </button>
          {showShopeeLabel && <div className="mt-3"><ShopeeLabelPreview book={formAsBook} /></div>}
        </div>
      ) : null}

      {/* Submit */}
      <button type="submit" disabled={saving} className="w-full py-4 bg-navy-700 text-white rounded-2xl font-semibold text-lg hover:bg-navy-600 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? 'Salvando...' : submitLabel}
      </button>
    </form>
  );
}
