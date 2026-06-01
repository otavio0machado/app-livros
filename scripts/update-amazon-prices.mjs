import { readFile, writeFile } from 'node:fs/promises';

const DATA_FILE = 'src/data/listed-books.ts';
const REPORT_FILE = 'src/data/amazon-price-sources.json';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36 myshelf-pricing/1.0';
const REQUEST_TIMEOUT_MS = 18000;

const QUERY_OVERRIDES = {
  'Pensando o melhor': '"Pensando Melhor" livro William Miller',
  'Vida à deriva — box (Partes 1 e 2)': '"Vida à Deriva" Yoshihiro Tatsumi',
  'Dom Quixote — box (Volumes 1 e 2)': '"Dom Quixote" box volumes 1 2',
  'Laurentino Gomes': 'Kit Escravidão Laurentino Gomes coleção completa',
  'O conto da aia': '"O conto da aia" Margaret Atwood livro',
  'Guerra e paz — box (Volumes 1 e 2)': '"Guerra e paz" box volumes 1 2 Tolstói',
  Sapiens: '"Sapiens" "Yuval Noah Harari" português',
  Salem: '"Salem" Stephen King livro português',
  'As intermitências da morte': '"As intermitências da morte" José Saramago livro',
  'Ensaio sobre a cegueira': '"Ensaio sobre a cegueira" José Saramago livro',
  'Savanna Game': '"Savanna Game" Vol. 1 Ransuke Kuroi',
  Antígona: '"Antígona" Sófocles livro',
  'O diabo no corpo': '"O diabo no corpo" Raymond Radiguet livro',
  'Os miseráveis — box (Volumes 1 e 2)': '"Os miseráveis" box volumes 1 2 Victor Hugo',
  'Sherlock Holmes — box completo': '"Sherlock Holmes" "Obra completa" box',
  'The Great Gatsby': '"The Great Gatsby" F Scott Fitzgerald book',
  'Moby Dick': '"Moby Dick" Herman Melville book',
  'A tempestade': '"A tempestade" William Shakespeare livro',
  'Box completo do Senhor dos Anéis': '"Senhor dos Anéis" box Tolkien Amazon',
  'HQ do Batman': 'HQ do Batman capa dura Panini',
  'O livro da mente': 'O livro da mente psicologia',
};

const MANUAL_PRICE_OVERRIDES = {
  'Vida à deriva — box (Partes 1 e 2)': {
    amazonTitle: 'Vida à Deriva – partes 1 e 2',
    amazonPriceCents: 19112,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Vida+%C3%A0+Deriva%22+Yoshihiro+Tatsumi',
    score: 999,
    note: 'Amazon Brasil não mostrou preço para o box; referência calculada pela soma das partes 1 e 2 encontradas na Amazon.',
  },
  'Guerra e paz — box (Volumes 1 e 2)': {
    amazonTitle: 'Guerra e paz',
    amazonPriceCents: 23619,
    amazonUrl: 'https://www.amazon.com.br/dp/8535930043',
    score: 999,
    note: 'Amazon Brasil não mostrou preço confiável para o box específico; referência usada a partir da edição disponível de Guerra e paz.',
  },
  Sapiens: {
    amazonTitle: 'Sapiens (Nova edição): Uma breve história da humanidade',
    amazonPriceCents: 7162,
    amazonUrl: 'https://www.amazon.com.br/dp/8535933921',
    score: 999,
  },
  'Precisamos falar sobre Kevin': {
    amazonTitle: 'Precisamos falar sobre o Kevin',
    amazonPriceCents: 4622,
    amazonUrl: 'https://www.amazon.com.br/s?k=Precisamos+falar+sobre+Kevin+Lionel+Shriver+livro',
    score: 999,
  },
  'Novembro de 63': {
    amazonTitle: 'Novembro de 63',
    amazonPriceCents: 9210,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Novembro+de+63%22+Stephen+King+livro',
    score: 999,
  },
  'Sobre a escrita': {
    amazonTitle: 'Sobre a escrita: A arte em memórias',
    amazonPriceCents: 4743,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Sobre+a+escrita%22+Stephen+King+livro',
    score: 999,
  },
  'Me chame pelo seu nome': {
    amazonTitle: 'Me chame pelo seu nome',
    amazonPriceCents: 3999,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Me+chame+pelo+seu+nome%22+Andr%C3%A9+Aciman+livro',
    score: 999,
  },
  'Papéis avulsos': {
    amazonTitle: 'Papéis avulsos',
    amazonPriceCents: 3809,
    amazonUrl: 'https://www.amazon.com.br/dp/856356014X',
    score: 999,
  },
  'Água funda': {
    amazonTitle: 'Água funda',
    amazonPriceCents: 4622,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22%C3%81gua+funda%22+Ruth+Guimar%C3%A3es+livro',
    score: 999,
  },
  'Este livro é gay': {
    amazonTitle: 'Este livro é gay: E hétero, e bi, e trans...',
    amazonPriceCents: 3485,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Este+livro+%C3%A9+gay%22+Juno+Dawson+livro',
    score: 999,
  },
  Antígona: {
    amazonTitle: 'Antígona',
    amazonPriceCents: 1868,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Ant%C3%ADgona%22+S%C3%B3focles+livro',
    score: 999,
  },
  'Os miseráveis — box (Volumes 1 e 2)': {
    amazonTitle: 'Box Os Miseráveis - Exclusivo Amazon',
    amazonPriceCents: 19235,
    amazonUrl: 'https://www.amazon.com.br/dp/8520942210',
    score: 999,
  },
  'Sherlock Holmes — box completo': {
    amazonTitle: 'Box Sherlock Holmes – Obra completa (Capa dura)',
    amazonPriceCents: 10934,
    amazonUrl: 'https://www.amazon.com.br/dp/8595080836',
    score: 999,
  },
  'A tempestade': {
    amazonTitle: 'A tempestade',
    amazonPriceCents: 4356,
    amazonUrl: 'https://www.amazon.com.br/dp/8582852452',
    score: 999,
  },
  'Silêncio — Parte 1': {
    amazonTitle: 'Batman: Silêncio (DC de Bolso)',
    amazonPriceCents: 4978,
    amazonUrl: 'https://www.amazon.com.br/dp/652592796X',
    score: 999,
    note: 'A parte 1 exata aparece sem preço confiável; referência usada a partir da edição Batman: Silêncio com preço na Amazon.',
  },
  'Psicopatologia da vida cotidiana e sobre os sonhos': {
    amazonTitle:
      'Freud (1901) - Obras completas volume 5: Psicopatologia da vida cotidiana e Sobre os sonhos',
    amazonPriceCents: 7944,
    amazonUrl: 'https://www.amazon.com.br/dp/6559210502',
    score: 999,
  },
  '100 anos de solidão': {
    amazonTitle: 'Cem anos de solidão',
    amazonPriceCents: 4026,
    amazonUrl: 'https://www.amazon.com.br/dp/8501012076',
    score: 999,
  },
  'Laranja mecânica': {
    amazonTitle: 'Laranja Mecânica',
    amazonPriceCents: 5032,
    amazonUrl: 'https://www.amazon.com.br/dp/8576574462',
    score: 999,
  },
  'Rápido e devagar': {
    amazonTitle: 'Rápido e devagar: Duas formas de pensar',
    amazonPriceCents: 5975,
    amazonUrl: 'https://www.amazon.com.br/dp/853900383X',
    score: 999,
  },
  'Senhor das moscas': {
    amazonTitle: 'Senhor das Moscas (Nova edição): Prêmio Nobel de Literatura',
    amazonPriceCents: 3364,
    amazonUrl: 'https://www.amazon.com.br/dp/8520918433',
    score: 999,
  },
  'Memórias póstumas de Brás Cubas': {
    amazonTitle: 'Memórias Póstumas de Brás Cubas',
    amazonPriceCents: 1350,
    amazonUrl: 'https://www.amazon.com.br/dp/6554700072',
    score: 999,
  },
  'Grande sertão: veredas': {
    amazonTitle: 'Grande sertão: veredas',
    amazonPriceCents: 7475,
    amazonUrl: 'https://www.amazon.com.br/dp/8535931988',
    score: 999,
  },
  'A corrente': {
    amazonTitle: 'A corrente',
    amazonPriceCents: 4626,
    amazonUrl: 'https://www.amazon.com.br/dp/850111765X',
    score: 999,
  },
  'Box completo do Senhor dos Anéis': {
    amazonTitle: 'Box Trilogia O Senhor dos Anéis',
    amazonPriceCents: 18990,
    amazonUrl: 'https://www.amazon.com.br/dp/8595086354',
    score: 999,
  },
  'Manual de mindfulness e autocompaixão': {
    amazonTitle:
      'Manual de Mindfulness e Autocompaixão: Um Guia para Construir Forças Internas e Prosperar na Arte de Ser Seu Melhor Amigo',
    amazonPriceCents: 9430,
    amazonUrl: 'https://www.amazon.com.br/dp/8582715536',
    score: 999,
  },
  'O dom extraordinário de ser comum': {
    amazonTitle: 'O Dom Extraordinário de Ser Comum: Encontre a Felicidade Exatamente Onde Você Está',
    amazonPriceCents: 10086,
    amazonUrl: 'https://www.amazon.com.br/dp/6558821400',
    score: 999,
  },
  'A geração ansiosa': {
    amazonTitle:
      'A geração ansiosa: Como a infância hiperconectada está causando uma epidemia de transtornos mentais',
    amazonPriceCents: 4332,
    amazonUrl: 'https://www.amazon.com.br/dp/8535938532',
    score: 999,
  },
  'Não acredite em tudo que você sente': {
    amazonTitle:
      'Não Acredite em Tudo Que Você Sente: Identifique seus Esquemas Emocionais e Liberte-se da Ansiedade e da Depressão',
    amazonPriceCents: 6000,
    amazonUrl:
      'https://www.amazon.com.br/s?k=%22N%C3%A3o+acredite+em+tudo+que+voc%C3%AA+sente%22+Robert+Leahy+livro',
    score: 999,
  },
  'Como aprendemos?': {
    amazonTitle: 'How We Learn: The Surprising Truth About When, Where, and Why It Happens',
    amazonPriceCents: 4490,
    amazonUrl: 'https://www.amazon.com.br/dp/0241366461',
    score: 999,
    note: 'A edição em português apareceu sem preço; referência usada a partir da edição original do mesmo autor com preço na Amazon.',
  },
  'Vencendo o TDAH adulto': {
    amazonTitle: 'Vencendo o TDAH Adulto: Transtorno de Déficit de Atenção/Hiperatividade',
    amazonPriceCents: 10080,
    amazonUrl: 'https://www.amazon.com.br/s?k=%22Vencendo+o+TDAH+adulto%22+Russell+Barkley+livro',
    score: 999,
  },
};

const STOP_WORDS = new Set([
  'a',
  'as',
  'o',
  'os',
  'de',
  'do',
  'da',
  'dos',
  'das',
  'e',
  'em',
  'um',
  'uma',
  'para',
  'por',
  'com',
  'sobre',
  'parte',
  'partes',
  'volume',
  'volumes',
  'box',
  'completo',
  'versao',
]);

function decodeHtml(value = '') {
  return value
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&agrave;/g, 'à')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ocirc;/g, 'ô');
}

function stripTags(value = '') {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value = '') {
  return decodeHtml(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value) {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function parseEntry(line) {
  const title = line.match(/title: "((?:\\"|[^"])*)"/)?.[1]?.replace(/\\"/g, '"');
  const author = line.match(/author: "((?:\\"|[^"])*)"/)?.[1]?.replace(/\\"/g, '"') || '';
  const isBox = /isBox: true/.test(line) || /box|kit|volumes/i.test(title || '');
  return title ? { title, author, isBox, line } : null;
}

function baseTitle(title) {
  return title.replace(/\s+—\s+.*$/, '').replace(/\s+\([^)]*\)$/, '').trim();
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseAmazonResults(html) {
  const blocks = html.split('data-component-type="s-search-result"').slice(1);

  return blocks
    .map((block) => {
      const asin = block.match(/data-asin="([^"]+)"/)?.[1] || '';
      const title =
        stripTags(block.match(/<h2[\s\S]*?<\/h2>/)?.[0]) ||
        decodeHtml(block.match(/alt="([^"]+)"/)?.[1] || '').trim();
      const whole = stripTags(block.match(/class="a-price-whole">([\s\S]*?)<\/span>/)?.[1]);
      const fraction = stripTags(
        block.match(/class="a-price-fraction">([\s\S]*?)<\/span>/)?.[1] || '00'
      );
      const wholeDigits = whole.replace(/\D/g, '');
      const fractionDigits = fraction.replace(/\D/g, '').padEnd(2, '0').slice(0, 2);
      const priceCents = wholeDigits ? Number(`${wholeDigits}${fractionDigits}`) : 0;
      const text = stripTags(block);
      const directHref = block.match(/href="([^"]*\/dp\/[A-Z0-9]{10}[^"]*)"/)?.[1] || '';
      const url = `https://www.amazon.com.br/dp/${asin}`;

      return {
        asin,
        title,
        priceCents,
        url: asin ? url : directHref,
        text,
        normalizedTitle: normalize(title),
      };
    })
    .filter((result) => result.asin && result.title && result.priceCents > 0);
}

function scoreResult(entry, result) {
  const title = baseTitle(entry.title);
  const titleNorm = normalize(title);
  const productNorm = result.normalizedTitle;
  const productText = normalize(result.text);
  const titleTokens = tokens(title);
  const productTokens = tokens(result.title);
  const authorTokens = tokens(entry.author);
  const boxExpected = entry.isBox || /laurentino gomes/i.test(entry.title);

  let score = 0;
  if (productNorm === titleNorm) score += 110;
  else if (productNorm.startsWith(titleNorm)) score += 90;
  else if (productNorm.includes(titleNorm)) score += 45;

  const matchedTitle = titleTokens.filter((token) => productNorm.includes(token));
  score += titleTokens.length ? (matchedTitle.length / titleTokens.length) * 55 : 0;

  if (titleTokens[0] && productTokens[0] === titleTokens[0]) score += 35;
  else if (titleTokens[0]) score -= 35;

  const matchedAuthor = authorTokens.filter((token) => productText.includes(token));
  score += authorTokens.length ? (matchedAuthor.length / authorTokens.length) * 30 : 0;

  if (/capa comum|capa dura|brochura|livro fisico|livro físico/.test(productText)) score += 8;
  if (/kindle|ebook|e-book|pdf|audiolivro/.test(productText)) score -= 45;
  if (/resumo|summary|analise|análise|apostila|mapa mental|study guide/.test(productNorm)) {
    score -= 70;
  }
  if (
    /em quadrinhos|graphic novel|comentad|vestibulares|adapta[cç][aã]o|trilogia tebana/.test(
      productNorm
    ) &&
    !/batman|palestina|savanna|vida a deriva/.test(normalize(entry.title))
  ) {
    score -= 45;
  }

  const productLooksBox = /box|kit|combo|obra completa|volumes|volume|livros/.test(productNorm);
  if (boxExpected && productLooksBox) score += 70;
  if (boxExpected && !productLooksBox) score -= 80;
  if (!boxExpected && productLooksBox) score -= 55;

  if (/patrocinado/.test(productText)) score -= 4;
  if (result.priceCents < 1000) score -= 80;
  if (result.priceCents > 20000 && !boxExpected) score -= 55;

  return Math.round(score);
}

async function findAmazonPrice(entry) {
  const manual = MANUAL_PRICE_OVERRIDES[entry.title];
  if (manual) {
    return {
      title: entry.title,
      query: 'manual Amazon reference',
      ...manual,
      salePriceCents: Math.round(manual.amazonPriceCents * 0.7),
      alternatives: [],
    };
  }

  const title = baseTitle(entry.title);
  const query =
    QUERY_OVERRIDES[entry.title] ||
    `"${title}" ${entry.author} ${entry.isBox ? 'box' : 'livro'}`;
  const searchUrl = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
  const response = await fetchWithTimeout(searchUrl);
  if (!response.ok) throw new Error(`Amazon HTTP ${response.status}`);

  const html = await response.text();
  const results = parseAmazonResults(html)
    .map((result) => ({ ...result, score: scoreResult(entry, result) }))
    .sort((a, b) => b.score - a.score || a.priceCents - b.priceCents);

  const chosen = results[0];
  if (!chosen || chosen.score < 25) {
    throw new Error(`No confident Amazon result for ${entry.title}`);
  }

  return {
    title: entry.title,
    query,
    amazonTitle: chosen.title,
    amazonPriceCents: chosen.priceCents,
    salePriceCents: Math.round(chosen.priceCents * 0.7),
    amazonUrl: chosen.url,
    score: chosen.score,
    alternatives: results.slice(0, 3).map((result) => ({
      title: result.title,
      amazonPriceCents: result.priceCents,
      amazonUrl: result.url,
      score: result.score,
    })),
  };
}

function withPriceFields(line, price) {
  const cleanLine = line
    .replace(/, amazonPriceCents: \d+/g, '')
    .replace(/, amazonUrl: "(?:\\"|[^"])*"/g, '');

  return cleanLine.replace(
    / }(,?)$/,
    `, amazonPriceCents: ${price.amazonPriceCents}, amazonUrl: ${JSON.stringify(price.amazonUrl)} }$1`
  );
}

const source = await readFile(DATA_FILE, 'utf8');
const lines = source.split('\n');
const entries = lines.map(parseEntry).filter(Boolean);
const prices = [];

for (const [index, entry] of entries.entries()) {
  let price;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      price = await findAmazonPrice(entry);
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  prices.push(price);
  console.log(
    `${index + 1}/${entries.length} ${entry.title}: ${price.amazonTitle} ` +
      `${(price.amazonPriceCents / 100).toFixed(2)} -> ${(price.salePriceCents / 100).toFixed(2)} ` +
      `(score ${price.score})`
  );
  await new Promise((resolve) => setTimeout(resolve, 700));
}

const priceMap = new Map(prices.map((price) => [price.title, price]));
const updatedLines = lines.map((line) => {
  const entry = parseEntry(line);
  if (!entry) return line;
  return withPriceFields(line, priceMap.get(entry.title));
});

await writeFile(DATA_FILE, updatedLines.join('\n'));
await writeFile(
  REPORT_FILE,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      rule: 'salePriceCents = round(amazonPriceCents * 0.70)',
      currency: 'BRL',
      source: 'Amazon Brasil search and product result pages',
      prices,
    },
    null,
    2
  )}\n`
);
