import type {
  BatchBookAIAnalysis,
  BatchBookImage,
  BookImageRole,
  ShopeeExportValidation,
  ShopeeListingDraft,
} from '@/types/batch';
import type { Book } from '@/types';

export const BOOK_IMAGE_ROLE_LABELS: Record<BookImageRole, string> = {
  front_cover: 'Capa frontal',
  back_cover: 'Contracapa',
  spine: 'Lombada',
  isbn_page: 'ISBN / ficha',
  defect: 'Defeito ou marca',
  other: 'Outra foto',
};

export const BOOK_IMAGE_ROLE_HELP: Record<BookImageRole, string> = {
  front_cover: 'Use a melhor foto da capa. Ela sera a imagem principal da planilha.',
  back_cover: 'Ajuda a confirmar sinopse, editora e estado geral.',
  spine: 'Ajuda a identificar titulo/volume quando a capa estiver ruim.',
  isbn_page: 'Use quando houver pagina com ISBN, ficha catalografica ou copyright.',
  defect: 'Amasse, rasgo, marca, anotacao, mancha ou desgaste relevante.',
  other: 'Qualquer imagem complementar que ajude na identificacao.',
};

export const SHOPEE_EXPORT_HEADERS = [
  'Nome do Produto',
  'Descricao',
  'Categoria',
  'Codigo da Categoria',
  'Marca',
  'Condicao',
  'Editora',
  'Idioma',
  'Origem',
  'ISBN',
  'Edicao',
  'Tipo de Capa',
  'Ano',
  'Preco',
  'Estoque',
  'SKU',
  'Peso (kg)',
  'Largura (cm)',
  'Comprimento (cm)',
  'Altura (cm)',
  'Imagem 1',
  'Imagem 2',
  'Imagem 3',
  'Imagem 4',
  'Imagem 5',
  'Imagem 6',
  'Imagem 7',
  'Imagem 8',
  'Imagem 9',
  'Observacoes',
];

const SHOPEE_CATEGORY_MAP: Record<string, string> = {
  'Ficção': 'Livros e Revistas > Livros > Literatura e Ficção',
  Romance: 'Livros e Revistas > Livros > Literatura e Ficção',
  Terror: 'Livros e Revistas > Livros > Literatura e Ficção',
  Fantasia: 'Livros e Revistas > Livros > Literatura e Ficção',
  'Não-Ficção': 'Livros e Revistas > Livros > Não-Ficção',
  Infantil: 'Livros e Revistas > Livros > Infantil',
  'Acadêmico': 'Livros e Revistas > Livros > Didáticos e Acadêmicos',
  Vestibular: 'Livros e Revistas > Livros > Didáticos e Acadêmicos',
  Autoajuda: 'Livros e Revistas > Livros > Autoajuda',
  Biografia: 'Livros e Revistas > Livros > Biografias',
  'Ciência': 'Livros e Revistas > Livros > Ciências',
  'História': 'Livros e Revistas > Livros > História',
  'Religião': 'Livros e Revistas > Livros > Religião e Espiritualidade',
  'Computadores e Tecnologia': 'Livros e Revistas > Livros > Computadores e Tecnologia',
  Direito: 'Livros e Revistas > Livros > Direito',
  Medicina: 'Livros e Revistas > Livros > Medicina',
  Engenharia: 'Livros e Revistas > Livros > Engenharia',
  Outro: 'Livros e Revistas > Livros > Outros',
};

function clean(value: string | null | undefined): string {
  return (value || '').trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max).trim() : value;
}

function centsToDecimal(cents: number): string {
  return (Math.max(0, cents) / 100).toFixed(2);
}

function decimalKg(value: number): string {
  return Number.isFinite(value) && value > 0 ? value.toFixed(2) : '';
}

function decimalCm(value: number): string {
  return Number.isFinite(value) && value > 0 ? value.toFixed(1) : '';
}

function inferSku(analysis: BatchBookAIAnalysis, localId: string, index: number): string {
  const isbn = clean(analysis.isbn).replace(/[^0-9Xx]/g, '');
  if (isbn) return `LIV-${isbn}`;
  const prefix = clean(analysis.title)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
    .toUpperCase();
  return `LIV-${String(index + 1).padStart(3, '0')}-${prefix || localId.slice(0, 6).toUpperCase()}`;
}

function buildProductName(analysis: BatchBookAIAnalysis): string {
  const title = clean(analysis.title) || 'Livro usado';
  const author = clean(analysis.author);
  const parts = analysis.type === 'Apostila'
    ? ['Apostila', clean(analysis.publisher), title]
    : ['Livro', title, author];
  return truncate(parts.filter(Boolean).join(' - '), 120);
}

function buildProductNameFromBook(book: Book): string {
  if (book.type === 'Apostila') {
    return truncate(['Apostila', clean(book.course_origin), clean(book.subject), clean(book.title)].filter(Boolean).join(' - '), 120);
  }
  return truncate(['Livro', clean(book.title), clean(book.author)].filter(Boolean).join(' - '), 120);
}

function buildDescription(analysis: BatchBookAIAnalysis): string {
  const lines: string[] = [];
  const title = clean(analysis.title);

  if (title) lines.push(`${analysis.type}: ${title}`);
  if (analysis.author) lines.push(`Autor: ${analysis.author}`);
  if (analysis.publisher) lines.push(`Editora: ${analysis.publisher}`);
  if (analysis.isbn) lines.push(`ISBN: ${analysis.isbn}`);
  if (analysis.year) lines.push(`Ano: ${analysis.year}`);
  if (analysis.language) lines.push(`Idioma: ${analysis.language}`);
  if (analysis.condition) lines.push(`Estado: ${analysis.condition}`);
  if (analysis.visible_defects.length > 0) {
    lines.push(`Defeitos/marcas visiveis: ${analysis.visible_defects.join('; ')}`);
  }
  if (analysis.condition_notes) lines.push(`Observacoes: ${analysis.condition_notes}`);

  lines.push('');
  lines.push('Livro usado com fotos reais do exemplar. Envio rapido e produto embalado com cuidado.');

  return truncate(lines.join('\n'), 3000);
}

function buildDescriptionFromBook(book: Book): string {
  const lines: string[] = [];

  if (book.title) lines.push(`${book.type}: ${book.title}`);
  if (book.author) lines.push(`Autor: ${book.author}`);
  if (book.publisher) lines.push(`Editora: ${book.publisher}`);
  if (book.isbn) lines.push(`ISBN: ${book.isbn}`);
  if (book.year) lines.push(`Ano: ${book.year}`);
  if (book.language) lines.push(`Idioma: ${book.language}`);
  if (book.condition_detail) lines.push(`Estado: ${book.condition_detail}`);
  if (book.condition_notes) lines.push(`Observacoes: ${book.condition_notes}`);

  if (book.description) {
    lines.push('');
    lines.push(book.description);
  }

  lines.push('');
  lines.push('Livro usado com fotos reais do exemplar. Envio rapido e produto embalado com cuidado.');

  return truncate(lines.join('\n'), 3000);
}

function sortImagesForShopee(images: BatchBookImage[]): string[] {
  const roleRank: Record<BookImageRole, number> = {
    front_cover: 0,
    back_cover: 1,
    spine: 2,
    isbn_page: 3,
    defect: 4,
    other: 5,
  };

  return [...images]
    .filter((image) => image.url)
    .sort((a, b) => roleRank[a.role] - roleRank[b.role])
    .map((image) => image.url)
    .slice(0, 9);
}

export function buildShopeeListingDraft(
  localId: string,
  index: number,
  images: BatchBookImage[],
  analysis: BatchBookAIAnalysis
): ShopeeListingDraft {
  const category = clean(analysis.category);
  const publisher = clean(analysis.publisher);
  const conditionText = clean(analysis.condition);

  return {
    localId,
    productName: buildProductName(analysis),
    description: buildDescription(analysis),
    category: SHOPEE_CATEGORY_MAP[category] || category || 'Livros e Revistas > Livros > Outros',
    categoryCode: '',
    gtin: clean(analysis.isbn),
    brand: publisher || 'Sem marca',
    condition: conditionText.toLowerCase().startsWith('novo') ? 'Novo' : 'Usado',
    publisher,
    language: clean(analysis.language) || 'Português',
    origin: 'Nacional',
    isbn: clean(analysis.isbn),
    editionType: clean(analysis.edition),
    coverType: clean(analysis.cover_type),
    year: clean(analysis.year),
    priceCents: analysis.suggested_price_cents || 0,
    stock: 1,
    sku: inferSku(analysis, localId, index),
    weightKg: analysis.weight_kg || 0.3,
    widthCm: analysis.width_cm || 16,
    lengthCm: analysis.length_cm || 23,
    heightCm: analysis.height_cm || 3,
    imageUrls: sortImagesForShopee(images),
    conditionNotes: [
      clean(analysis.condition_notes),
      analysis.visible_defects.length > 0 ? `Defeitos/marcas: ${analysis.visible_defects.join('; ')}` : '',
    ].filter(Boolean).join('\n'),
    confidence: analysis.confidence || 0,
    warnings: analysis.warnings || [],
  };
}

export function buildShopeeListingDraftFromBook(
  book: Book,
  images: BatchBookImage[]
): ShopeeListingDraft {
  const category = clean(book.category);
  const imageUrls = sortImagesForShopee(images);
  const sku = clean(book.sku) || clean(book.isbn) || `LIV-${book.id}`;

  return {
    localId: `book-${book.id}`,
    productName: buildProductNameFromBook(book),
    description: buildDescriptionFromBook(book),
    category: SHOPEE_CATEGORY_MAP[category] || category || 'Livros e Revistas > Livros > Outros',
    categoryCode: '',
    gtin: clean(book.gtin || book.isbn),
    brand: clean(book.brand || book.publisher) || 'Sem marca',
    condition: book.condition_detail?.toLowerCase().startsWith('novo') ? 'Novo' : 'Usado',
    publisher: clean(book.publisher),
    language: clean(book.language) || 'Português',
    origin: book.origin === 'Importado' ? 'Importado' : 'Nacional',
    isbn: clean(book.isbn),
    editionType: clean(book.edition_type),
    coverType: clean(book.cover_type),
    year: clean(book.year),
    priceCents: book.price_cents || 0,
    stock: book.stock || 1,
    sku,
    weightKg: book.weight_kg || 0.3,
    widthCm: book.width_cm || 16,
    lengthCm: book.length_cm || 23,
    heightCm: book.height_cm || 3,
    imageUrls,
    conditionNotes: clean(book.condition_notes),
    confidence: 1,
    warnings: ['Importado do acervo do site. Revise categoria e codigo da categoria antes do upload.'],
  };
}

export function validateShopeeListing(listing: ShopeeListingDraft): ShopeeExportValidation {
  const blockingErrors: string[] = [];
  const warnings: string[] = [];

  if (!clean(listing.productName)) blockingErrors.push('Nome do produto obrigatorio.');
  if (listing.productName.length > 120) blockingErrors.push('Nome do produto acima de 120 caracteres.');
  if (!clean(listing.description)) blockingErrors.push('Descricao obrigatoria.');
  if (listing.description.length > 3000) blockingErrors.push('Descricao acima de 3000 caracteres.');
  if (!clean(listing.category)) blockingErrors.push('Categoria obrigatoria.');
  if (!listing.priceCents || listing.priceCents < 10) blockingErrors.push('Preco deve ser maior que zero.');
  if (!Number.isInteger(listing.stock) || listing.stock < 1) blockingErrors.push('Estoque deve ser inteiro e maior que zero.');
  if (!clean(listing.sku)) blockingErrors.push('SKU obrigatorio.');
  if (!listing.imageUrls.length) blockingErrors.push('Adicione pelo menos uma imagem publica.');
  if (!listing.weightKg || listing.weightKg <= 0) blockingErrors.push('Peso obrigatorio.');

  if (!clean(listing.categoryCode)) warnings.push('Codigo da categoria esta vazio; o template oficial da Shopee pode exigir esse campo.');
  if (!clean(listing.isbn)) warnings.push('ISBN ausente ou ilegivel.');
  if (listing.confidence < 0.72) warnings.push('Confianca baixa da IA; revise antes de subir na Shopee.');

  return {
    valid: blockingErrors.length === 0,
    blockingErrors,
    warnings: [...warnings, ...listing.warnings],
  };
}

export function listingToShopeeExportRow(listing: ShopeeListingDraft): string[] {
  const images = Array.from({ length: 9 }, (_, index) => listing.imageUrls[index] || '');
  return [
    listing.productName,
    listing.description,
    listing.category,
    listing.categoryCode,
    listing.brand,
    listing.condition,
    listing.publisher,
    listing.language,
    listing.origin,
    listing.isbn,
    listing.editionType,
    listing.coverType,
    listing.year,
    centsToDecimal(listing.priceCents),
    listing.stock,
    listing.sku,
    decimalKg(listing.weightKg),
    decimalCm(listing.widthCm),
    decimalCm(listing.lengthCm),
    decimalCm(listing.heightCm),
    ...images,
    listing.conditionNotes,
  ].map((value) => String(value ?? ''));
}
