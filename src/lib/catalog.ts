import { LISTED_BOOKS } from '@/data/listed-books';
import type { Book } from '@/types';

interface CatalogFilters {
  search?: string;
  category?: string;
  type?: string;
  subject?: string;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function titleKey(title: string): string {
  return normalizeText(title).replace(/[^a-z0-9]+/g, '');
}

function matchesSearch(book: Book, search: string): boolean {
  if (!search) return true;
  const needle = normalizeText(search);
  const haystack = normalizeText(
    [book.title, book.author, book.description, book.category].filter(Boolean).join(' ')
  );
  return haystack.includes(needle);
}

export function filterListedBooks(filters: CatalogFilters = {}): Book[] {
  const { search = '', category = '', type = '', subject = '' } = filters;

  return LISTED_BOOKS.filter((book) => {
    if (category && book.category !== category) return false;
    if (type && book.type !== type) return false;
    if (subject && book.subject !== subject) return false;
    return matchesSearch(book, search);
  });
}

export function mergeWithListedBooks(books: Book[], filters: CatalogFilters = {}): Book[] {
  const existingTitles = new Set(books.map((book) => titleKey(book.title)));
  const listedBooks = filterListedBooks(filters).filter(
    (book) => !existingTitles.has(titleKey(book.title))
  );

  return [...books, ...listedBooks];
}

export function getListedBookById(id: number): Book | null {
  return LISTED_BOOKS.find((book) => book.id === id) || null;
}
