export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  path: string;
}

export interface Book {
  id: number;
  type: 'Livro' | 'Apostila';
  title: string;
  category: string;
  gtin: string;
  brand: string;
  condition: string;
  condition_detail: string;
  condition_notes: string;
  publisher: string;
  language: string;
  origin: string;
  isbn: string;
  edition_type: string;
  cover_type: string;
  quantity: number;
  year: string;
  package_size: string;
  custom_product: boolean;
  package_quantity: number;
  editor: string;
  translator: string;
  version: string;
  author: string;
  description: string;
  price_cents: number;
  stock: number;
  sku: string;
  weight_kg: number;
  width_cm: number;
  length_cm: number;
  height_cm: number;
  photo_url: string;
  media: MediaItem[];
  subject: string;
  course_origin: string;
  status: 'available' | 'sold' | 'reserved';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  bookId: number;
  title: string;
  author: string;
  price_cents: number;
  photo_url: string;
  condition_detail: string;
  type: string;
}

export interface GeminiAnalysis {
  type: 'Livro' | 'Apostila';
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  category: string;
  condition_detail: string;
  description: string;
  language: string;
  edition_type: string;
  cover_type: string;
  year: string;
  weight_kg: number;
  suggested_price_cents: number;
  width_cm: number;
  length_cm: number;
  height_cm: number;
  subject: string;
  course_origin: string;
}
