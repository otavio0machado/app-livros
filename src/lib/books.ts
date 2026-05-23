import type { Book } from '@/types';

export const BOOK_STATUSES = ['available', 'sold', 'reserved'] as const;
export type BookStatus = (typeof BOOK_STATUSES)[number];

const PUBLIC_BOOK_FIELDS: (keyof Book)[] = [
  'id',
  'type',
  'title',
  'category',
  'condition_detail',
  'condition_notes',
  'publisher',
  'language',
  'isbn',
  'edition_type',
  'cover_type',
  'year',
  'author',
  'description',
  'price_cents',
  'stock',
  'weight_kg',
  'width_cm',
  'length_cm',
  'height_cm',
  'photo_url',
  'media',
  'subject',
  'course_origin',
  'collection_id',
  'collection_name',
  'collection_volume',
  'collection_total_volumes',
  'collection_discount_pct',
  'status',
  'created_at',
  'updated_at',
];

export function parseMedia<T extends Record<string, unknown>>(row: T): T {
  const mutable = row as T & { media?: unknown };

  if (typeof mutable.media === 'string') {
    try {
      mutable.media = JSON.parse(mutable.media);
    } catch {
      mutable.media = [];
    }
  }
  if (!mutable.media) mutable.media = [];
  return mutable;
}

export function sanitizePublicBook(row: Record<string, unknown>): Partial<Book> {
  const parsed = parseMedia(row);
  return Object.fromEntries(
    PUBLIC_BOOK_FIELDS.map((field) => [field, parsed[field]])
  ) as Partial<Book>;
}

export function normalizeBookPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  };

  if ('media' in body) {
    const mediaItems = Array.isArray(body.media) ? body.media : [];
    const firstMedia = mediaItems[0];
    const firstMediaUrl =
      firstMedia && typeof firstMedia === 'object' && 'url' in firstMedia
        ? String(firstMedia.url || '')
        : '';

    const explicitPhotoUrl = typeof body.photo_url === 'string' ? body.photo_url : '';
    payload.media = JSON.stringify(mediaItems);
    payload.photo_url = explicitPhotoUrl || firstMediaUrl;
  } else if ('photo_url' in body && typeof body.photo_url === 'string') {
    payload.photo_url = body.photo_url;
  }

  if ('condition_detail' in body && typeof body.condition_detail === 'string') {
    payload.condition = body.condition_detail.startsWith('Novo') ? 'Novo' : 'Usado';
  }

  return payload;
}

export function parseBookId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseBookStatus(status: string | null): BookStatus | '' | null {
  if (status === null || status === '') return '';
  return BOOK_STATUSES.includes(status as BookStatus) ? (status as BookStatus) : null;
}

export function sanitizeSearchTerm(value: string): string {
  return value.replace(/[%,()]/g, ' ').replace(/\s+/g, ' ').trim();
}
