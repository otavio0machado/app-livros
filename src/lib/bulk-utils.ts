import type { Book, GeminiAnalysis } from '@/types';

export function resizeImageForAnalysis(file: File): Promise<{ base64: string; blob: Blob }> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 1200;
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width > height) {
          height = (height / width) * MAX_SIZE;
          width = MAX_SIZE;
        } else {
          width = (width / height) * MAX_SIZE;
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({ blob: blob!, base64 });
          };
          reader.readAsDataURL(blob!);
        },
        'image/jpeg',
        0.8
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

export function analysisToFormData(analysis: GeminiAnalysis): Partial<Book> {
  const priceCents = analysis.suggested_price_cents || 0;
  return {
    type: analysis.type || 'Livro',
    title: analysis.title || '',
    author: analysis.author || '',
    publisher: analysis.publisher || '',
    isbn: analysis.isbn || '',
    category: analysis.category || '',
    condition_detail: analysis.condition_detail || '',
    description: analysis.description || '',
    language: analysis.language || 'Português',
    edition_type: analysis.edition_type || '',
    cover_type: analysis.cover_type || '',
    year: analysis.year || '',
    weight_kg: analysis.weight_kg || 0.3,
    price_cents: priceCents,
    width_cm: analysis.width_cm || 0,
    length_cm: analysis.length_cm || 0,
    height_cm: analysis.height_cm || 0,
    subject: analysis.subject || '',
    course_origin: analysis.course_origin || '',
    origin: 'Nacional',
    stock: 1,
    quantity: 1,
    package_quantity: 1,
    custom_product: false,
    status: 'available',
  };
}

export function createConcurrencyLimiter(max: number) {
  let running = 0;
  const queue: (() => void)[] = [];

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    if (running >= max) {
      await new Promise<void>((resolve) => queue.push(resolve));
    }
    running++;
    try {
      return await fn();
    } finally {
      running--;
      queue.shift()?.();
    }
  };
}
