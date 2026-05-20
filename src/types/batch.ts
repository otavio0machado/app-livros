export type BookImageRole =
  | 'front_cover'
  | 'back_cover'
  | 'spine'
  | 'isbn_page'
  | 'defect'
  | 'other';

export interface BatchBookImage {
  id: string;
  role: BookImageRole;
  url: string;
  path: string;
  mimeType: string;
}

export interface BatchBookAIAnalysis {
  type: 'Livro' | 'Apostila';
  title: string | null;
  author: string | null;
  publisher: string | null;
  isbn: string | null;
  edition: string | null;
  year: string | null;
  language: string | null;
  category: string | null;
  cover_type: string | null;
  condition: string | null;
  visible_defects: string[];
  condition_notes: string | null;
  suggested_price_cents: number | null;
  weight_kg: number | null;
  width_cm: number | null;
  length_cm: number | null;
  height_cm: number | null;
  confidence: number;
  field_confidence: Record<string, number>;
  warnings: string[];
  needs_human_review: boolean;
}

export interface ShopeeListingDraft {
  localId: string;
  productName: string;
  description: string;
  category: string;
  categoryCode: string;
  gtin: string;
  brand: string;
  condition: 'Novo' | 'Usado';
  publisher: string;
  language: string;
  origin: 'Nacional' | 'Importado';
  isbn: string;
  editionType: string;
  coverType: string;
  year: string;
  priceCents: number;
  stock: number;
  sku: string;
  weightKg: number;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  imageUrls: string[];
  conditionNotes: string;
  confidence: number;
  warnings: string[];
}

export interface ShopeeExportValidation {
  valid: boolean;
  blockingErrors: string[];
  warnings: string[];
}
