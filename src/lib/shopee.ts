import type { Book } from '@/types';

export interface ShopeeLabel {
  // Informação Básica
  productName: string;
  category: string;
  gtin: string;
  // Especificação
  brand: string;
  condition: string;
  publisher: string;
  language: string;
  origin: string;
  isbn: string;
  editionType: string;
  coverType: string;
  quantity: number;
  year: string;
  packageSize: string;
  customProduct: string;
  packageQuantity: number;
  editor: string;
  translator: string;
  version: string;
  // Descrição
  description: string;
  // Vendas
  price: string;
  stock: number;
  sku: string;
  // Envio
  weightKg: number;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
}

const SHOPEE_CATEGORY_MAP: Record<string, string> = {
  'Ficção': 'Livros e Revistas > Livros > Literatura e Ficção',
  'Romance': 'Livros e Revistas > Livros > Literatura e Ficção',
  'Terror': 'Livros e Revistas > Livros > Literatura e Ficção',
  'Fantasia': 'Livros e Revistas > Livros > Literatura e Ficção',
  'Não-Ficção': 'Livros e Revistas > Livros > Não-Ficção',
  'Infantil': 'Livros e Revistas > Livros > Infantil',
  'Acadêmico': 'Livros e Revistas > Livros > Didáticos e Acadêmicos',
  'Vestibular': 'Livros e Revistas > Livros > Didáticos e Acadêmicos',
  'Autoajuda': 'Livros e Revistas > Livros > Autoajuda',
  'Biografia': 'Livros e Revistas > Livros > Biografias',
  'Ciência': 'Livros e Revistas > Livros > Ciências',
  'História': 'Livros e Revistas > Livros > História',
  'Religião': 'Livros e Revistas > Livros > Religião e Espiritualidade',
  'Computadores e Tecnologia': 'Livros e Revistas > Livros > Computadores e Tecnologia',
  'Direito': 'Livros e Revistas > Livros > Direito',
  'Medicina': 'Livros e Revistas > Livros > Medicina',
  'Engenharia': 'Livros e Revistas > Livros > Engenharia',
};

export function generateShopeeLabel(book: Book): ShopeeLabel {
  const priceReais = (book.price_cents / 100).toFixed(2);

  return {
    productName: buildShopeeName(book).slice(0, 120),
    category: SHOPEE_CATEGORY_MAP[book.category] || 'Livros e Revistas > Livros > Outros',
    gtin: book.gtin || '',
    brand: book.brand || book.publisher || '',
    condition: book.condition_detail.startsWith('Novo') ? 'Novo' : 'Usado',
    publisher: book.publisher,
    language: book.language || 'Português',
    origin: book.origin || 'Nacional',
    isbn: book.isbn,
    editionType: book.edition_type,
    coverType: book.cover_type,
    quantity: book.quantity || 1,
    year: book.year,
    packageSize: book.package_size || '',
    customProduct: book.custom_product ? 'Sim' : 'Não',
    packageQuantity: book.package_quantity || 1,
    editor: book.editor,
    translator: book.translator,
    version: book.version,
    description: buildShopeeDescription(book),
    price: priceReais,
    stock: book.stock || 1,
    sku: book.isbn || `LIV-${book.id}`,
    weightKg: book.weight_kg,
    widthCm: book.width_cm,
    lengthCm: book.length_cm,
    heightCm: book.height_cm,
  };
}

function buildShopeeName(book: Book): string {
  if (book.type === 'Apostila') {
    const parts = ['Apostila', book.course_origin, book.subject, book.title].filter(Boolean);
    return parts.join(' - ');
  }
  return `Livro ${book.title} - ${book.author}`;
}

function buildShopeeDescription(book: Book): string {
  const lines: string[] = [];

  if (book.type === 'Apostila') {
    lines.push(`📚 Apostila: ${book.title}`);
    if (book.course_origin) lines.push(`🏫 Cursinho: ${book.course_origin}`);
    if (book.subject) lines.push(`📖 Matéria: ${book.subject}`);
  } else {
    lines.push(`📚 ${book.title}`);
    lines.push(`✍️ Autor: ${book.author}`);
  }

  if (book.publisher) lines.push(`🏢 Editora: ${book.publisher}`);
  if (book.isbn) lines.push(`📋 ISBN: ${book.isbn}`);
  if (book.year) lines.push(`📅 Ano: ${book.year}`);
  lines.push(`📦 Estado: ${book.condition_detail}`);
  if (book.condition_notes) lines.push(`📝 Obs: ${book.condition_notes}`);
  lines.push(`⚖️ Peso: ${book.weight_kg}kg`);
  lines.push(`📐 Dimensões: ${book.width_cm} x ${book.length_cm} x ${book.height_cm} cm`);
  lines.push('');
  lines.push(book.description);
  lines.push('');
  lines.push('---');
  lines.push('Envio rápido! Confira nossos outros livros disponíveis.');

  return lines.join('\n');
}

export function formatShopeeForCopy(label: ShopeeLabel): string {
  return `=== INFORMAÇÃO BÁSICA ===
Nome do Produto: ${label.productName}
Categoria: ${label.category}
GTIN (EAN): ${label.gtin || 'Item sem GTIN'}

=== ESPECIFICAÇÃO ===
Marca: ${label.brand}
Condição: ${label.condition}
Editora: ${label.publisher}
Idioma: ${label.language}
Importado/Local: ${label.origin}
ISBN: ${label.isbn}
Tipo de Edição: ${label.editionType}
Tipo de Capa: ${label.coverType}
Quantidade: ${label.quantity}
Ano: ${label.year}
Produto personalizado: ${label.customProduct}
Editor: ${label.editor}
Tradutor: ${label.translator}
Versão: ${label.version}

=== DESCRIÇÃO ===
${label.description}

=== INFORMAÇÕES DE VENDAS ===
Preço: R$ ${label.price}
Estoque: ${label.stock}
SKU: ${label.sku}

=== ENVIO ===
Peso: ${label.weightKg} kg
Largura: ${label.widthCm} cm
Comprimento: ${label.lengthCm} cm
Altura: ${label.heightCm} cm`;
}
