import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const COVER_DIR = path.join(ROOT, 'public', 'book-covers');
const DATA_FILE = path.join(ROOT, 'src', 'data', 'listed-books.ts');
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 myshelf-catalog/1.0';
const REQUEST_TIMEOUT_MS = 15000;

const books = [
  { title: 'Pensando o melhor', author: '', category: 'Não-Ficção', query: 'Pensando o melhor livro capa' },
  { title: 'Não se leve tão a sério', author: '', category: 'Autoajuda', query: 'Não se leve tão a sério livro capa' },
  { title: 'História do pensamento ocidental', author: 'Bertrand Russell', category: 'História', query: 'História do pensamento ocidental Bertrand Russell capa' },
  { title: 'Memória', author: 'Ivan Izquierdo', category: 'Ciência', query: 'Memória Ivan Izquierdo livro capa' },
  { title: 'Vida à deriva — box (Partes 1 e 2)', author: 'Yoshihiro Tatsumi', category: 'Ficção', query: 'Vida à deriva box partes 1 e 2 capa livro', isBox: true },
  { title: 'Psicofármacos', author: '', category: 'Medicina', query: 'Psicofármacos livro capa' },
  { title: 'Dom Quixote — box (Volumes 1 e 2)', author: 'Miguel de Cervantes', category: 'Ficção', query: 'Dom Quixote box volumes 1 e 2 capa', isBox: true },
  {
    title: 'Laurentino Gomes',
    author: 'Laurentino Gomes',
    category: 'História',
    query: 'Kit 3 Livros Laurentino Gomes 1808 1822 1889 capa',
    imageIndex: 0,
    note: 'Título informado como "Laurentino Gomes"; confirmar qual obra ou edição exata.',
  },
  { title: '1822', author: 'Laurentino Gomes', category: 'História', query: '1822 Laurentino Gomes capa' },
  { title: 'O conto da aia', author: 'Margaret Atwood', category: 'Ficção', query: 'O conto da aia Margaret Atwood capa' },
  { title: 'A falência', author: 'Júlia Lopes de Almeida', category: 'Ficção', query: 'A falência Julia Lopes de Almeida capa' },
  { title: 'A terra dos mil povos', author: 'Kaká Werá Jecupé', category: 'História', query: 'A terra dos mil povos Kaká Werá capa' },
  { title: 'Guerra e paz — box (Volumes 1 e 2)', author: 'Liev Tolstói', category: 'Ficção', query: 'Guerra e paz box volumes 1 e 2 capa', isBox: true },
  { title: 'Palestina', author: 'Joe Sacco', category: 'História', query: 'Palestina Joe Sacco capa', imageIndex: 2 },
  { title: 'Breve história de quase tudo', author: 'Bill Bryson', category: 'Ciência', query: 'Breve história de quase tudo Bill Bryson capa', imageIndex: 1 },
  { title: '1984', author: 'George Orwell', category: 'Ficção', query: '1984 George Orwell capa livro' },
  { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'História', query: 'Sapiens Yuval Noah Harari capa' },
  { title: 'Precisamos falar sobre Kevin', author: 'Lionel Shriver', category: 'Ficção', query: 'Precisamos falar sobre Kevin Lionel Shriver capa intrinseca' },
  { title: 'Infâncias roubadas', author: 'Angela Marsons', category: 'Ficção', query: 'Infâncias roubadas Angela Marsons capa' },
  { title: 'A última festa', author: 'Lucy Foley', category: 'Ficção', query: 'A última festa Lucy Foley capa' },
  { title: 'Jogos malignos', author: 'Angela Marsons', category: 'Ficção', query: 'Jogos malignos Angela Marsons capa' },
  { title: 'Drácula', author: 'Bram Stoker', category: 'Terror', query: 'Drácula Bram Stoker capa livro' },
  { title: 'A lista de convidados', author: 'Lucy Foley', category: 'Ficção', query: 'A lista de convidados Lucy Foley capa' },
  { title: 'Novembro de 63', author: 'Stephen King', category: 'Ficção', query: 'Novembro de 63 Stephen King capa' },
  { title: 'Salem', author: 'Stephen King', category: 'Terror', query: 'Salem Stephen King capa livro' },
  { title: 'Sobre a escrita', author: 'Stephen King', category: 'Não-Ficção', query: 'Sobre a escrita Stephen King capa', imageIndex: 1 },
  {
    title: 'Me chame pelo seu nome',
    author: 'André Aciman',
    category: 'Romance',
    query: 'Me chame pelo seu nome André Aciman capa',
    note: 'Título interpretado a partir de "Michelle pelo seu nome" na lista original.',
  },
  { title: 'Água funda', author: 'Ruth Guimarães', category: 'Ficção', query: 'Água funda Ruth Guimarães capa' },
  { title: 'As intermitências da morte', author: 'José Saramago', category: 'Ficção', query: 'As intermitências da morte José Saramago capa', imageIndex: 1 },
  { title: 'Ensaio sobre a cegueira', author: 'José Saramago', category: 'Ficção', query: 'Ensaio sobre a cegueira José Saramago capa' },
  { title: 'A montanha é você', author: 'Brianna Wiest', category: 'Autoajuda', query: 'A montanha é você Brianna Wiest capa' },
  { title: 'Este livro é gay', author: 'Juno Dawson', category: 'Não-Ficção', query: 'Este livro é gay Juno Dawson capa', imageIndex: 1 },
  {
    title: 'Savanna Game',
    author: 'Ransuke Kuroi',
    category: 'Ficção',
    query: 'Savanna Game Ransuke Kuroi capa JBC',
    note: 'Título interpretado a partir de "Savannah game" na lista original.',
  },
  { title: 'Papéis avulsos', author: 'Machado de Assis', category: 'Ficção', query: 'Papéis avulsos Machado de Assis capa' },
  { title: 'Edgar Allan Poe', author: 'Edgar Allan Poe', category: 'Terror', query: 'Edgar Allan Poe contos capa livro' },
  { title: 'Dom Quixote — versão para criança', author: 'Miguel de Cervantes', category: 'Infantil', query: 'Dom Quixote versão para criança capa' },
  { title: 'Antes que o café esfrie', author: 'Toshikazu Kawaguchi', category: 'Ficção', query: 'Antes que o café esfrie Toshikazu Kawaguchi capa' },
  { title: 'Por que escrevo', author: 'George Orwell', category: 'Não-Ficção', query: 'Por que escrevo George Orwell capa' },
  { title: 'Vidas secas', author: 'Graciliano Ramos', category: 'Ficção', query: 'Vidas secas Graciliano Ramos capa', imageIndex: 1 },
  { title: 'O diabo no corpo', author: 'Raymond Radiguet', category: 'Ficção', query: 'O diabo no corpo Raymond Radiguet capa' },
  { title: 'Édipo Rei', author: 'Sófocles', category: 'Ficção', query: 'Édipo Rei Sófocles capa', imageIndex: 1 },
  { title: 'Antígona', author: 'Sófocles', category: 'Ficção', query: 'Antígona Sófocles capa', imageIndex: 1 },
  { title: 'Várias histórias', author: 'Machado de Assis', category: 'Ficção', query: 'Várias histórias Machado de Assis capa' },
  { title: '10 lições sobre Marx', author: 'Fernando Magalhães', category: 'Acadêmico', query: '10 lições sobre Marx Fernando Magalhães capa' },
  { title: 'O mundo assombrado pelos demônios', author: 'Carl Sagan', category: 'Ciência', query: 'O mundo assombrado pelos demônios Carl Sagan capa', imageIndex: 1 },
  { title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', category: 'Ficção', query: "Alice's Adventures in Wonderland Lewis Carroll cover" },
  { title: 'A morte de Ivan Ilitch', author: 'Liev Tolstói', category: 'Ficção', query: 'A morte de Ivan Ilitch Tolstói capa' },
  { title: 'Os miseráveis — box (Volumes 1 e 2)', author: 'Victor Hugo', category: 'Ficção', query: 'Os miseráveis box volumes 1 e 2 capa', isBox: true },
  { title: 'Problemas de gênero', author: 'Judith Butler', category: 'Acadêmico', query: 'Problemas de gênero Judith Butler capa' },
  { title: 'O mito do normal', author: 'Gabor Maté', category: 'Ciência', query: 'O mito do normal Gabor Maté capa', imageIndex: 1 },
  { title: 'Breves respostas para grandes questões', author: 'Stephen Hawking', category: 'Ciência', query: 'Breves respostas para grandes questões Stephen Hawking capa', imageIndex: 2 },
  { title: 'Sherlock Holmes — box completo', author: 'Arthur Conan Doyle', category: 'Ficção', query: 'Sherlock Holmes box completo capa', isBox: true },
  { title: 'Frankenstein', author: 'Mary Shelley', category: 'Terror', query: 'Frankenstein Mary Shelley capa livro' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Ficção', query: 'The Great Gatsby F Scott Fitzgerald cover' },
  { title: 'Moby Dick', author: 'Herman Melville', category: 'Ficção', query: 'Moby Dick Herman Melville cover' },
  { title: 'A tempestade', author: 'William Shakespeare', category: 'Ficção', query: 'A tempestade William Shakespeare capa' },
  { title: 'Hamlet', author: 'William Shakespeare', category: 'Ficção', query: 'Hamlet William Shakespeare capa', imageIndex: 2 },
  { title: 'Coral e outros poemas', author: 'Sophia de Mello Breyner Andresen', category: 'Ficção', query: 'Coral e outros poemas Sophia de Mello Breyner capa', imageIndex: 1 },
  { title: 'Algoritmos para viver', author: 'Brian Christian e Tom Griffiths', category: 'Ciência', query: 'Algoritmos para viver Brian Christian Tom Griffiths capa' },
  { title: 'Guerra sem fim', author: 'Joe Haldeman', category: 'Ficção', query: 'Guerra sem fim Joe Haldeman capa' },
  { title: 'Silêncio — Parte 1', author: 'Jeph Loeb e Jim Lee', category: 'Ficção', query: 'Batman Silêncio Parte 1 capa' },
  { title: 'HQ do Batman', author: 'DC Comics', category: 'Ficção', query: 'HQ do Batman capa' },
  { title: 'Psicopatologia da vida cotidiana e sobre os sonhos', author: 'Sigmund Freud', category: 'Acadêmico', query: 'Psicopatologia da vida cotidiana sobre os sonhos Freud capa', imageIndex: 1 },
  { title: '100 anos de solidão', author: 'Gabriel García Márquez', category: 'Ficção', query: '100 anos de solidão Gabriel García Márquez capa', imageIndex: 1 },
  { title: 'Laranja mecânica', author: 'Anthony Burgess', category: 'Ficção', query: 'Laranja mecânica Anthony Burgess capa' },
  { title: 'O corpo guarda as marcas', author: 'Bessel van der Kolk', category: 'Ciência', query: 'O corpo guarda as marcas Bessel van der Kolk capa' },
  {
    title: 'O livro da mente',
    author: '',
    category: 'Ciência',
    query: 'O livro da mente capa psicologia',
    imageIndex: 0,
    note: 'Título genérico na lista original; confirmar obra, autor e edição.',
  },
  { title: 'Longe da árvore', author: 'Andrew Solomon', category: 'Ciência', query: 'Longe da árvore Andrew Solomon capa', imageIndex: 1 },
  { title: 'Rápido e devagar', author: 'Daniel Kahneman', category: 'Ciência', query: 'Rápido e devagar Daniel Kahneman capa' },
  { title: '10% humano', author: 'Alanna Collen', category: 'Ciência', query: '10% humano Alanna Collen capa', imageIndex: 2 },
  { title: 'Devassos no paraíso', author: 'João Silvério Trevisan', category: 'História', query: 'Devassos no paraíso João Silvério Trevisan capa' },
  { title: 'Nação dopamina', author: 'Anna Lembke', category: 'Ciência', query: 'Nação dopamina Anna Lembke capa' },
  { title: 'Senhor das moscas', author: 'William Golding', category: 'Ficção', query: 'Senhor das moscas William Golding capa' },
  { title: 'Memórias póstumas de Brás Cubas', author: 'Machado de Assis', category: 'Ficção', query: 'Memórias póstumas de Brás Cubas Machado de Assis capa' },
  { title: 'Grande sertão: veredas', author: 'João Guimarães Rosa', category: 'Ficção', query: 'Grande sertão veredas João Guimarães Rosa capa' },
  { title: 'A corrente', author: 'Adrian McKinty', category: 'Ficção', query: 'A corrente Adrian McKinty capa', imageIndex: 1 },
  { title: 'Box completo do Senhor dos Anéis', author: 'J.R.R. Tolkien', category: 'Fantasia', query: 'Box completo Senhor dos Anéis Tolkien capa', isBox: true },
  { title: 'Manual de mindfulness e autocompaixão', author: 'Kristin Neff e Christopher Germer', category: 'Autoajuda', query: 'Manual de mindfulness e autocompaixão Kristin Neff capa' },
  { title: 'O dom extraordinário de ser comum', author: 'Ronald D. Siegel', category: 'Autoajuda', query: 'O dom extraordinário de ser comum Ronald Siegel capa' },
  { title: 'A geração ansiosa', author: 'Jonathan Haidt', category: 'Ciência', query: 'A geração ansiosa Jonathan Haidt capa', imageIndex: 1 },
  { title: 'Não acredite em tudo que você sente', author: 'Robert L. Leahy', category: 'Autoajuda', query: 'Não acredite em tudo que você sente Robert Leahy capa' },
  { title: 'Como aprendemos?', author: 'Benedict Carey', category: 'Ciência', query: 'Como aprendemos Benedict Carey capa livro', imageIndex: 2 },
  { title: 'Vencendo o TDAH adulto', author: 'Russell A. Barkley', category: 'Autoajuda', query: 'Vencendo o TDAH adulto Russell Barkley capa', imageIndex: 1 },
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70);
}

function imageExtension(contentType, url) {
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('gif')) return 'gif';
  const match = new URL(url).pathname.match(/\.(jpe?g|png|webp|gif)$/i);
  if (match) return match[1].replace('jpeg', 'jpg').toLowerCase();
  return 'jpg';
}

async function fetchWithRetry(url, options = {}, attempts = 2) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, {
        ...options,
        signal: controller.signal,
      });
    } catch (error) {
      lastError = error;
      if (attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

async function searchImages(query) {
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
  const home = await fetchWithRetry(searchUrl, { headers: { 'User-Agent': USER_AGENT } }).then(
    (res) => res.text()
  );
  const vqd = home.match(/vqd="([^"]+)"/)?.[1] || home.match(/vqd=([\d-]+)&/)?.[1];
  if (!vqd) throw new Error(`DuckDuckGo token not found for ${query}`);

  const imageUrl =
    `https://duckduckgo.com/i.js?l=br-pt&o=json&q=${encodeURIComponent(query)}` +
    `&vqd=${encodeURIComponent(vqd)}&f=,,,,,&p=1`;
  const text = await fetchWithRetry(imageUrl, {
    headers: { 'User-Agent': USER_AGENT, Referer: 'https://duckduckgo.com/' },
  }).then((res) => res.text());
  return JSON.parse(text).results || [];
}

async function downloadImage(url, filenameBase) {
  const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) throw new Error(`Not an image: ${contentType}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < 5000) throw new Error('Image too small');

  const ext = imageExtension(contentType, url);
  const fileName = `${filenameBase}.${ext}`;
  await writeFile(path.join(COVER_DIR, fileName), buffer);
  return `/book-covers/${fileName}`;
}

async function fetchCover(book, index) {
  const results = await searchImages(book.query);
  const candidates = [
    results[book.imageIndex || 0],
    ...results.filter((_, resultIndex) => resultIndex !== (book.imageIndex || 0)),
  ].filter(Boolean);

  const filenameBase = `${String(index + 1).padStart(2, '0')}-${slugify(book.title)}`;
  for (const candidate of candidates.slice(0, 8)) {
    for (const url of [candidate.image, candidate.thumbnail].filter(Boolean)) {
      try {
        const publicPath = await downloadImage(url, filenameBase);
        return { publicPath, sourceTitle: candidate.title || '', sourceUrl: candidate.url || '' };
      } catch (error) {
        console.warn(`Skipping ${book.title}: ${url} (${error.message})`);
      }
    }
  }

  throw new Error(`No downloadable image found for ${book.title}`);
}

function jsString(value) {
  return JSON.stringify(value);
}

function buildDataFile(enrichedBooks) {
  const entries = enrichedBooks
    .map((book) => {
      const fields = [
        `title: ${jsString(book.title)}`,
        `author: ${jsString(book.author)}`,
        `category: ${jsString(book.category)}`,
        `cover: ${jsString(book.cover)}`,
        book.note ? `note: ${jsString(book.note)}` : '',
        book.isBox ? 'isBox: true' : '',
      ].filter(Boolean);
      return `  { ${fields.join(', ')} },`;
    })
    .join('\n');

  return `import type { Book } from '@/types';

const CREATED_AT = '2026-06-01T00:00:00.000Z';
const DEFAULT_CONDITION = 'Usado - Contém marcas de uso.';

interface ListedBookInput {
  title: string;
  author: string;
  category: string;
  cover: string;
  note?: string;
  isBox?: boolean;
}

const LISTED_BOOK_INPUTS: ListedBookInput[] = [
${entries}
];

function descriptionFor(book: ListedBookInput): string {
  const titleLine = book.author ? \`\${book.title}, de \${book.author}.\` : \`\${book.title}.\`;
  const boxLine = book.isBox ? 'Item cadastrado como box/conjunto, conforme a lista original. ' : '';
  const noteLine = book.note ? \`\${book.note} \` : '';

  return [
    titleLine,
    boxLine,
    noteLine,
    'Capa de referência obtida na internet para identificação do título.',
    'Estado físico, edição e preço a confirmar pelo WhatsApp.',
  ].join(' ').replace(/\\s+/g, ' ').trim();
}

function createBook(book: ListedBookInput, index: number): Book {
  const media = [{ url: book.cover, type: 'image' as const, path: book.cover.replace(/^\\//, '') }];

  return {
    id: 900001 + index,
    type: 'Livro',
    title: book.title,
    category: book.category,
    gtin: '',
    brand: '',
    condition: 'Usado',
    condition_detail: DEFAULT_CONDITION,
    condition_notes: 'Estado físico, edição e preço a confirmar.',
    publisher: '',
    language: book.title === "Alice's Adventures in Wonderland" || book.title === 'The Great Gatsby' || book.title === 'Moby Dick' ? 'Inglês' : 'Português',
    origin: 'Nacional',
    isbn: '',
    edition_type: '',
    cover_type: '',
    quantity: 1,
    year: '',
    package_size: '',
    custom_product: false,
    package_quantity: 1,
    editor: '',
    translator: '',
    version: '',
    author: book.author,
    description: descriptionFor(book),
    price_cents: 0,
    stock: 1,
    sku: \`LISTA-\${String(index + 1).padStart(3, '0')}\`,
    weight_kg: book.isBox ? 1.2 : 0.3,
    width_cm: 16,
    length_cm: 23,
    height_cm: book.isBox ? 6 : 3,
    photo_url: book.cover,
    media,
    subject: '',
    course_origin: '',
    collection_id: null,
    collection_name: null,
    collection_volume: null,
    collection_total_volumes: null,
    collection_discount_pct: null,
    status: 'available',
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  };
}

export const LISTED_BOOKS: Book[] = LISTED_BOOK_INPUTS.map(createBook);
`;
}

await mkdir(COVER_DIR, { recursive: true });

const enrichedBooks = [];
for (const [index, book] of books.entries()) {
  const cover = await fetchCover(book, index);
  enrichedBooks.push({ ...book, cover: cover.publicPath });
  console.log(`${index + 1}/${books.length} ${book.title} -> ${cover.publicPath}`);
  await new Promise((resolve) => setTimeout(resolve, 250));
}

await writeFile(DATA_FILE, buildDataFile(enrichedBooks));
console.log(`Wrote ${DATA_FILE}`);
