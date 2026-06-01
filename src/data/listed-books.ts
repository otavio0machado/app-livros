import type { Book } from '@/types';

const CREATED_AT = '2026-06-01T00:00:00.000Z';
const DEFAULT_CONDITION = 'Usado - Contém marcas de uso.';

interface ListedBookInput {
  title: string;
  author: string;
  category: string;
  cover: string;
  amazonPriceCents?: number;
  amazonUrl?: string;
  note?: string;
  isBox?: boolean;
}

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

const LISTED_BOOK_INPUTS: ListedBookInput[] = [
  { title: "Pensando o melhor", author: "", category: "Não-Ficção", cover: "/book-covers/01-pensando-o-melhor.webp", amazonPriceCents: 7380, amazonUrl: "https://www.amazon.com.br/dp/6558821478" },
  { title: "Não se leve tão a sério", author: "", category: "Autoajuda", cover: "/book-covers/02-nao-se-leve-tao-a-serio.jpg", amazonPriceCents: 4994, amazonUrl: "https://www.amazon.com.br/dp/854223748X" },
  { title: "História do pensamento ocidental", author: "Bertrand Russell", category: "História", cover: "/book-covers/03-historia-do-pensamento-ocidental.jpg", amazonPriceCents: 7418, amazonUrl: "https://www.amazon.com.br/dp/8520947212" },
  { title: "Memória", author: "Ivan Izquierdo", category: "Ciência", cover: "/book-covers/04-memoria.webp", amazonPriceCents: 7648, amazonUrl: "https://www.amazon.com.br/dp/8582714912" },
  { title: "Vida à deriva — box (Partes 1 e 2)", author: "Yoshihiro Tatsumi", category: "Ficção", cover: "/book-covers/05-vida-a-deriva-box-partes-1-e-2.jpg", isBox: true, amazonPriceCents: 19112, amazonUrl: "https://www.amazon.com.br/s?k=%22Vida+%C3%A0+Deriva%22+Yoshihiro+Tatsumi" },
  { title: "Psicofármacos", author: "", category: "Medicina", cover: "/book-covers/06-psicofarmacos.webp", amazonPriceCents: 10790, amazonUrl: "https://www.amazon.com.br/dp/6527072376" },
  { title: "Dom Quixote — box (Volumes 1 e 2)", author: "Miguel de Cervantes", category: "Ficção", cover: "/book-covers/07-dom-quixote-box-volumes-1-e-2.jpg", isBox: true, amazonPriceCents: 21726, amazonUrl: "https://www.amazon.com.br/dp/8520923097" },
  { title: "Laurentino Gomes", author: "Laurentino Gomes", category: "História", cover: "/book-covers/08-laurentino-gomes.jpg", note: "Título informado como \"Laurentino Gomes\"; confirmar qual obra ou edição exata.", amazonPriceCents: 19538, amazonUrl: "https://www.amazon.com.br/dp/8900004530" },
  { title: "1822", author: "Laurentino Gomes", category: "História", cover: "/book-covers/09-1822.jpg", amazonPriceCents: 7800, amazonUrl: "https://www.amazon.com.br/dp/852092817X" },
  { title: "O conto da aia", author: "Margaret Atwood", category: "Ficção", cover: "/book-covers/10-o-conto-da-aia.jpg", amazonPriceCents: 4720, amazonUrl: "https://www.amazon.com.br/dp/8532520669" },
  { title: "A falência", author: "Júlia Lopes de Almeida", category: "Ficção", cover: "/book-covers/11-a-falencia.jpg", amazonPriceCents: 1900, amazonUrl: "https://www.amazon.com.br/dp/6550970423" },
  { title: "A terra dos mil povos", author: "Kaká Werá Jecupé", category: "História", cover: "/book-covers/12-a-terra-dos-mil-povos.jpg", amazonPriceCents: 5462, amazonUrl: "https://www.amazon.com.br/dp/6586028043" },
  { title: "Guerra e paz — box (Volumes 1 e 2)", author: "Liev Tolstói", category: "Ficção", cover: "/book-covers/13-guerra-e-paz-box-volumes-1-e-2.jpg", isBox: true, amazonPriceCents: 23619, amazonUrl: "https://www.amazon.com.br/dp/8535930043" },
  { title: "Palestina", author: "Joe Sacco", category: "História", cover: "/book-covers/14-palestina.jpg", amazonPriceCents: 10678, amazonUrl: "https://www.amazon.com.br/dp/6586691400" },
  { title: "Breve história de quase tudo", author: "Bill Bryson", category: "Ciência", cover: "/book-covers/15-breve-historia-de-quase-tudo.jpg", amazonPriceCents: 3990, amazonUrl: "https://www.amazon.com.br/dp/096573840X" },
  { title: "1984", author: "George Orwell", category: "Ficção", cover: "/book-covers/16-1984.jpg", amazonPriceCents: 1900, amazonUrl: "https://www.amazon.com.br/dp/6585765389" },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "História", cover: "/book-covers/17-sapiens.jpg", amazonPriceCents: 7162, amazonUrl: "https://www.amazon.com.br/dp/8535933921" },
  { title: "Precisamos falar sobre Kevin", author: "Lionel Shriver", category: "Ficção", cover: "/book-covers/18-precisamos-falar-sobre-kevin.jpg", amazonPriceCents: 4622, amazonUrl: "https://www.amazon.com.br/s?k=Precisamos+falar+sobre+Kevin+Lionel+Shriver+livro" },
  { title: "Infâncias roubadas", author: "Angela Marsons", category: "Ficção", cover: "/book-covers/19-infancias-roubadas.jpg", amazonPriceCents: 5235, amazonUrl: "https://www.amazon.com.br/dp/6586553601" },
  { title: "A última festa", author: "Lucy Foley", category: "Ficção", cover: "/book-covers/20-a-ultima-festa.jpg", amazonPriceCents: 45600, amazonUrl: "https://www.amazon.com.br/dp/9897775110" },
  { title: "Jogos malignos", author: "Angela Marsons", category: "Ficção", cover: "/book-covers/21-jogos-malignos.webp", amazonPriceCents: 5235, amazonUrl: "https://www.amazon.com.br/dp/8582355777" },
  { title: "Drácula", author: "Bram Stoker", category: "Terror", cover: "/book-covers/22-dracula.jpg", amazonPriceCents: 1194, amazonUrl: "https://www.amazon.com.br/dp/6552941889" },
  { title: "A lista de convidados", author: "Lucy Foley", category: "Ficção", cover: "/book-covers/23-a-lista-de-convidados.jpg", amazonPriceCents: 4162, amazonUrl: "https://www.amazon.com.br/dp/6555601507" },
  { title: "Novembro de 63", author: "Stephen King", category: "Ficção", cover: "/book-covers/24-novembro-de-63.jpg", amazonPriceCents: 9210, amazonUrl: "https://www.amazon.com.br/s?k=%22Novembro+de+63%22+Stephen+King+livro" },
  { title: "Salem", author: "Stephen King", category: "Terror", cover: "/book-covers/25-salem.jpg", amazonPriceCents: 6780, amazonUrl: "https://www.amazon.com.br/dp/858105045X" },
  { title: "Sobre a escrita", author: "Stephen King", category: "Não-Ficção", cover: "/book-covers/26-sobre-a-escrita.webp", amazonPriceCents: 4743, amazonUrl: "https://www.amazon.com.br/s?k=%22Sobre+a+escrita%22+Stephen+King+livro" },
  { title: "Me chame pelo seu nome", author: "André Aciman", category: "Romance", cover: "/book-covers/27-me-chame-pelo-seu-nome.webp", note: "Título interpretado a partir de \"Michelle pelo seu nome\" na lista original.", amazonPriceCents: 3999, amazonUrl: "https://www.amazon.com.br/s?k=%22Me+chame+pelo+seu+nome%22+Andr%C3%A9+Aciman+livro" },
  { title: "Água funda", author: "Ruth Guimarães", category: "Ficção", cover: "/book-covers/28-agua-funda.jpg", amazonPriceCents: 4622, amazonUrl: "https://www.amazon.com.br/s?k=%22%C3%81gua+funda%22+Ruth+Guimar%C3%A3es+livro" },
  { title: "As intermitências da morte", author: "José Saramago", category: "Ficção", cover: "/book-covers/29-as-intermitencias-da-morte.jpg", amazonPriceCents: 5360, amazonUrl: "https://www.amazon.com.br/dp/8535930345" },
  { title: "Ensaio sobre a cegueira", author: "José Saramago", category: "Ficção", cover: "/book-covers/30-ensaio-sobre-a-cegueira.jpg", amazonPriceCents: 4874, amazonUrl: "https://www.amazon.com.br/dp/8535930310" },
  { title: "A montanha é você", author: "Brianna Wiest", category: "Autoajuda", cover: "/book-covers/31-a-montanha-e-voce.webp", amazonPriceCents: 3980, amazonUrl: "https://www.amazon.com.br/dp/8551010123" },
  { title: "Este livro é gay", author: "Juno Dawson", category: "Não-Ficção", cover: "/book-covers/32-este-livro-e-gay.jpg", amazonPriceCents: 3485, amazonUrl: "https://www.amazon.com.br/s?k=%22Este+livro+%C3%A9+gay%22+Juno+Dawson+livro" },
  { title: "Savanna Game", author: "Ransuke Kuroi", category: "Ficção", cover: "/book-covers/33-savanna-game.jpg", note: "Título interpretado a partir de \"Savannah game\" na lista original.", amazonPriceCents: 1911, amazonUrl: "https://www.amazon.com.br/dp/8569212046" },
  { title: "Papéis avulsos", author: "Machado de Assis", category: "Ficção", cover: "/book-covers/34-papeis-avulsos.webp", amazonPriceCents: 3809, amazonUrl: "https://www.amazon.com.br/dp/856356014X" },
  { title: "Edgar Allan Poe", author: "Edgar Allan Poe", category: "Terror", cover: "/book-covers/35-edgar-allan-poe.jpg", amazonPriceCents: 1238, amazonUrl: "https://www.amazon.com.br/dp/6586181127" },
  { title: "Dom Quixote — versão para criança", author: "Miguel de Cervantes", category: "Infantil", cover: "/book-covers/36-dom-quixote-versao-para-crianca.jpg", amazonPriceCents: 1990, amazonUrl: "https://www.amazon.com.br/dp/8532249922" },
  { title: "Antes que o café esfrie", author: "Toshikazu Kawaguchi", category: "Ficção", cover: "/book-covers/37-antes-que-o-cafe-esfrie.jpg", amazonPriceCents: 3175, amazonUrl: "https://www.amazon.com.br/dp/6588490364" },
  { title: "Por que escrevo", author: "George Orwell", category: "Não-Ficção", cover: "/book-covers/38-por-que-escrevo.jpg", amazonPriceCents: 3979, amazonUrl: "https://www.amazon.com.br/dp/8582851294" },
  { title: "Vidas secas", author: "Graciliano Ramos", category: "Ficção", cover: "/book-covers/39-vidas-secas.jpg", amazonPriceCents: 3790, amazonUrl: "https://www.amazon.com.br/dp/6584962121" },
  { title: "O diabo no corpo", author: "Raymond Radiguet", category: "Ficção", cover: "/book-covers/40-o-diabo-no-corpo.jpg", amazonPriceCents: 1489, amazonUrl: "https://www.amazon.com.br/dp/B0B5HPP5Y6" },
  { title: "Édipo Rei", author: "Sófocles", category: "Ficção", cover: "/book-covers/41-edipo-rei.jpg", amazonPriceCents: 7968, amazonUrl: "https://www.amazon.com.br/dp/6555800860" },
  { title: "Antígona", author: "Sófocles", category: "Ficção", cover: "/book-covers/42-antigona.jpg", amazonPriceCents: 1868, amazonUrl: "https://www.amazon.com.br/s?k=%22Ant%C3%ADgona%22+S%C3%B3focles+livro" },
  { title: "Várias histórias", author: "Machado de Assis", category: "Ficção", cover: "/book-covers/43-varias-historias.jpg", amazonPriceCents: 2489, amazonUrl: "https://www.amazon.com.br/dp/6587034330" },
  { title: "10 lições sobre Marx", author: "Fernando Magalhães", category: "Acadêmico", cover: "/book-covers/44-10-licoes-sobre-marx.webp", amazonPriceCents: 2089, amazonUrl: "https://www.amazon.com.br/dp/8532638988" },
  { title: "O mundo assombrado pelos demônios", author: "Carl Sagan", category: "Ciência", cover: "/book-covers/45-o-mundo-assombrado-pelos-demonios.jpg", amazonPriceCents: 2790, amazonUrl: "https://www.amazon.com.br/dp/6077473987" },
  { title: "Alice's Adventures in Wonderland", author: "Lewis Carroll", category: "Ficção", cover: "/book-covers/46-alice-s-adventures-in-wonderland.jpg", amazonPriceCents: 5260, amazonUrl: "https://www.amazon.com.br/dp/B095NZ9MV4" },
  { title: "A morte de Ivan Ilitch", author: "Liev Tolstói", category: "Ficção", cover: "/book-covers/47-a-morte-de-ivan-ilitch.jpg", amazonPriceCents: 3373, amazonUrl: "https://www.amazon.com.br/dp/658841045X" },
  { title: "Os miseráveis — box (Volumes 1 e 2)", author: "Victor Hugo", category: "Ficção", cover: "/book-covers/48-os-miseraveis-box-volumes-1-e-2.webp", isBox: true, amazonPriceCents: 19235, amazonUrl: "https://www.amazon.com.br/dp/8520942210" },
  { title: "Problemas de gênero", author: "Judith Butler", category: "Acadêmico", cover: "/book-covers/49-problemas-de-genero.jpg", amazonPriceCents: 5196, amazonUrl: "https://www.amazon.com.br/dp/8520006116" },
  { title: "O mito do normal", author: "Gabor Maté", category: "Ciência", cover: "/book-covers/50-o-mito-do-normal.jpg", amazonPriceCents: 4990, amazonUrl: "https://www.amazon.com.br/dp/6555646764" },
  { title: "Breves respostas para grandes questões", author: "Stephen Hawking", category: "Ciência", cover: "/book-covers/51-breves-respostas-para-grandes-questoes.jpg", amazonPriceCents: 3226, amazonUrl: "https://www.amazon.com.br/dp/8551010255" },
  { title: "Sherlock Holmes — box completo", author: "Arthur Conan Doyle", category: "Ficção", cover: "/book-covers/52-sherlock-holmes-box-completo.jpg", isBox: true, amazonPriceCents: 10934, amazonUrl: "https://www.amazon.com.br/dp/8595080836" },
  { title: "Frankenstein", author: "Mary Shelley", category: "Terror", cover: "/book-covers/53-frankenstein.jpg", amazonPriceCents: 1490, amazonUrl: "https://www.amazon.com.br/dp/8579493439" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Ficção", cover: "/book-covers/54-the-great-gatsby.jpg", amazonPriceCents: 5147, amazonUrl: "https://www.amazon.com.br/dp/B0CR5VYZ1X" },
  { title: "Moby Dick", author: "Herman Melville", category: "Ficção", cover: "/book-covers/55-moby-dick.jpg", amazonPriceCents: 5918, amazonUrl: "https://www.amazon.com.br/dp/184022830X" },
  { title: "A tempestade", author: "William Shakespeare", category: "Ficção", cover: "/book-covers/56-a-tempestade.jpg", amazonPriceCents: 4356, amazonUrl: "https://www.amazon.com.br/dp/8582852452" },
  { title: "Hamlet", author: "William Shakespeare", category: "Ficção", cover: "/book-covers/57-hamlet.jpg", amazonPriceCents: 1985, amazonUrl: "https://www.amazon.com.br/dp/6552942001" },
  { title: "Coral e outros poemas", author: "Sophia de Mello Breyner Andresen", category: "Ficção", cover: "/book-covers/58-coral-e-outros-poemas.jpg", amazonPriceCents: 7868, amazonUrl: "https://www.amazon.com.br/dp/8535930795" },
  { title: "Algoritmos para viver", author: "Brian Christian e Tom Griffiths", category: "Ciência", cover: "/book-covers/59-algoritmos-para-viver.jpg", amazonPriceCents: 9552, amazonUrl: "https://www.amazon.com.br/dp/8535929304" },
  { title: "Guerra sem fim", author: "Joe Haldeman", category: "Ficção", cover: "/book-covers/60-guerra-sem-fim.jpg", amazonPriceCents: 4170, amazonUrl: "https://www.amazon.com.br/dp/8576573946" },
  { title: "Silêncio — Parte 1", author: "Jeph Loeb e Jim Lee", category: "Ficção", cover: "/book-covers/61-silencio-parte-1.jpg", amazonPriceCents: 4978, amazonUrl: "https://www.amazon.com.br/dp/652592796X" },
  { title: "HQ do Batman", author: "DC Comics", category: "Ficção", cover: "/book-covers/62-hq-do-batman.jpg", amazonPriceCents: 3499, amazonUrl: "https://www.amazon.com.br/dp/8583683905" },
  { title: "Psicopatologia da vida cotidiana e sobre os sonhos", author: "Sigmund Freud", category: "Acadêmico", cover: "/book-covers/63-psicopatologia-da-vida-cotidiana-e-sobre-os-sonhos.jpg", amazonPriceCents: 7944, amazonUrl: "https://www.amazon.com.br/dp/6559210502" },
  { title: "100 anos de solidão", author: "Gabriel García Márquez", category: "Ficção", cover: "/book-covers/64-100-anos-de-solidao.jpg", amazonPriceCents: 4026, amazonUrl: "https://www.amazon.com.br/dp/8501012076" },
  { title: "Laranja mecânica", author: "Anthony Burgess", category: "Ficção", cover: "/book-covers/65-laranja-mecanica.jpg", amazonPriceCents: 5032, amazonUrl: "https://www.amazon.com.br/dp/8576574462" },
  { title: "O corpo guarda as marcas", author: "Bessel van der Kolk", category: "Ciência", cover: "/book-covers/66-o-corpo-guarda-as-marcas.jpg", amazonPriceCents: 5141, amazonUrl: "https://www.amazon.com.br/dp/8543110017" },
  { title: "O livro da mente", author: "", category: "Ciência", cover: "/book-covers/67-o-livro-da-mente.jpg", note: "Título genérico na lista original; confirmar obra, autor e edição.", amazonPriceCents: 6278, amazonUrl: "https://www.amazon.com.br/dp/8525062499" },
  { title: "Longe da árvore", author: "Andrew Solomon", category: "Ciência", cover: "/book-covers/68-longe-da-arvore.jpg", amazonPriceCents: 13519, amazonUrl: "https://www.amazon.com.br/dp/8535923209" },
  { title: "Rápido e devagar", author: "Daniel Kahneman", category: "Ciência", cover: "/book-covers/69-rapido-e-devagar.jpg", amazonPriceCents: 5975, amazonUrl: "https://www.amazon.com.br/dp/853900383X" },
  { title: "10% humano", author: "Alanna Collen", category: "Ciência", cover: "/book-covers/70-10-humano.jpg", amazonPriceCents: 4379, amazonUrl: "https://www.amazon.com.br/dp/8543103444" },
  { title: "Devassos no paraíso", author: "João Silvério Trevisan", category: "História", cover: "/book-covers/71-devassos-no-paraiso.jpg", amazonPriceCents: 9090, amazonUrl: "https://www.amazon.com.br/dp/8547000658" },
  { title: "Nação dopamina", author: "Anna Lembke", category: "Ciência", cover: "/book-covers/72-nacao-dopamina.jpg", amazonPriceCents: 4227, amazonUrl: "https://www.amazon.com.br/dp/B08KPKHVXQ" },
  { title: "Senhor das moscas", author: "William Golding", category: "Ficção", cover: "/book-covers/73-senhor-das-moscas.jpg", amazonPriceCents: 3364, amazonUrl: "https://www.amazon.com.br/dp/8520918433" },
  { title: "Memórias póstumas de Brás Cubas", author: "Machado de Assis", category: "Ficção", cover: "/book-covers/74-memorias-postumas-de-bras-cubas.jpg", amazonPriceCents: 1350, amazonUrl: "https://www.amazon.com.br/dp/6554700072" },
  { title: "Grande sertão: veredas", author: "João Guimarães Rosa", category: "Ficção", cover: "/book-covers/75-grande-sertao-veredas.jpg", amazonPriceCents: 7475, amazonUrl: "https://www.amazon.com.br/dp/8535931988" },
  { title: "A corrente", author: "Adrian McKinty", category: "Ficção", cover: "/book-covers/76-a-corrente.jpg", amazonPriceCents: 4626, amazonUrl: "https://www.amazon.com.br/dp/850111765X" },
  { title: "Box completo do Senhor dos Anéis", author: "J.R.R. Tolkien", category: "Fantasia", cover: "/book-covers/77-box-completo-do-senhor-dos-aneis.jpg", isBox: true, amazonPriceCents: 18990, amazonUrl: "https://www.amazon.com.br/dp/8595086354" },
  { title: "Manual de mindfulness e autocompaixão", author: "Kristin Neff e Christopher Germer", category: "Autoajuda", cover: "/book-covers/78-manual-de-mindfulness-e-autocompaixao.jpg", amazonPriceCents: 9430, amazonUrl: "https://www.amazon.com.br/dp/8582715536" },
  { title: "O dom extraordinário de ser comum", author: "Ronald D. Siegel", category: "Autoajuda", cover: "/book-covers/79-o-dom-extraordinario-de-ser-comum.webp", amazonPriceCents: 10086, amazonUrl: "https://www.amazon.com.br/dp/6558821400" },
  { title: "A geração ansiosa", author: "Jonathan Haidt", category: "Ciência", cover: "/book-covers/80-a-geracao-ansiosa.jpg", amazonPriceCents: 4332, amazonUrl: "https://www.amazon.com.br/dp/8535938532" },
  { title: "Não acredite em tudo que você sente", author: "Robert L. Leahy", category: "Autoajuda", cover: "/book-covers/81-nao-acredite-em-tudo-que-voce-sente.jpg", amazonPriceCents: 6000, amazonUrl: "https://www.amazon.com.br/s?k=%22N%C3%A3o+acredite+em+tudo+que+voc%C3%AA+sente%22+Robert+Leahy+livro" },
  { title: "Como aprendemos?", author: "Benedict Carey", category: "Ciência", cover: "/book-covers/82-como-aprendemos.jpg", amazonPriceCents: 4490, amazonUrl: "https://www.amazon.com.br/dp/0241366461" },
  { title: "Vencendo o TDAH adulto", author: "Russell A. Barkley", category: "Autoajuda", cover: "/book-covers/83-vencendo-o-tdah-adulto.jpg", amazonPriceCents: 10080, amazonUrl: "https://www.amazon.com.br/s?k=%22Vencendo+o+TDAH+adulto%22+Russell+Barkley+livro" },
];

function descriptionFor(book: ListedBookInput): string {
  const titleLine = book.author ? `${book.title}, de ${book.author}.` : `${book.title}.`;
  const boxLine = book.isBox ? 'Item cadastrado como box/conjunto, conforme a lista original. ' : '';
  const noteLine = book.note ? `${book.note} ` : '';
  const priceLine = book.amazonPriceCents
    ? `Preço definido como 30% abaixo de ${formatCents(book.amazonPriceCents)}, valor de referência encontrado na Amazon Brasil. `
    : '';

  return [
    titleLine,
    boxLine,
    noteLine,
    priceLine,
    'Capa de referência obtida na internet para identificação do título.',
    'Estado físico, edição e preço a confirmar pelo WhatsApp.',
  ].join(' ').replace(/\s+/g, ' ').trim();
}

function createBook(book: ListedBookInput, index: number): Book {
  const media = [{ url: book.cover, type: 'image' as const, path: book.cover.replace(/^\//, '') }];

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
    price_cents: book.amazonPriceCents ? Math.round(book.amazonPriceCents * 0.7) : 0,
    stock: 1,
    sku: `LISTA-${String(index + 1).padStart(3, '0')}`,
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
