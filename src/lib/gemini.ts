import { GoogleGenAI } from '@google/genai';
import type { GeminiAnalysis, GeminiCollectionAnalysis } from '@/types';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

export async function analyzeBookImage(
  imageBase64: string,
  mimeType: string,
  condition?: string
): Promise<GeminiAnalysis> {
  const ai = getAI();

  const conditionInstruction = condition
    ? `\nO vendedor já classificou a condição deste item como: "${condition}".
Use essa informação para ajustar o preço sugerido com precisão — itens em melhor estado valem mais.
Para o campo "condition_detail", retorne exatamente: "${condition}".`
    : '';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          {
            text: `Você é um especialista em catalogação de livros e apostilas no mercado brasileiro.
Analise esta foto e extraia TODAS as informações possíveis.

Determine se é um LIVRO ou uma APOSTILA de cursinho.
- Apostilas geralmente têm logo de cursinho (Poliedro, Objetivo, Anglo, Etapa, COC, etc.), são encadernadas em espiral ou brochura simples, e indicam matéria/disciplina.
- Livros têm ISBN, editora comercial, autor conhecido.
${conditionInstruction}

Retorne um JSON com estes campos exatos:

{
  "type": "Livro" ou "Apostila",
  "title": "Título completo",
  "author": "Nome do autor (se apostila, pode ser o cursinho)",
  "publisher": "Editora ou cursinho",
  "isbn": "ISBN se visível, senão string vazia",
  "category": "Uma de: Ficção, Não-Ficção, Infantil, Acadêmico, Autoajuda, Biografia, Romance, Terror, Fantasia, Ciência, História, Religião, Computadores e Tecnologia, Direito, Medicina, Engenharia, Vestibular, Outro",
  "condition_detail": "Baseado no desgaste visível, escolha UMA: Novo, Usado - Excelente estado como novo., Usado - Contém marcas de uso., Usado - Contém marcas de uso e pode conter poucos escritos ou marcações., Usado - Pode conter poucos escritos ou marcações., Usado - Contém marcas de uso bastante marcações escritos e/ou exercícios resolvidos., Usado - Contém bastante marcações escritos e/ou exercícios resolvidos.",
  "description": "Descrição atrativa de 2-3 frases em português para vender este item",
  "language": "Português, Inglês, Espanhol, etc.",
  "edition_type": "1ª Edição, 2ª Edição, etc. ou vazio",
  "cover_type": "Capa Dura, Brochura, Espiral, ou vazio",
  "year": "Ano de publicação se visível, senão vazio",
  "weight_kg": peso estimado em kg (número decimal),
  "suggested_price_cents": preço sugerido em centavos de Real baseado no mercado de usados brasileiro,
  "width_cm": largura estimada em cm,
  "length_cm": comprimento estimado em cm,
  "height_cm": espessura estimada em cm,
  "subject": "Se apostila: matéria (Matemática, Física, Química, Biologia, etc.). Se livro: vazio",
  "course_origin": "Se apostila: nome do cursinho (Poliedro, Anglo, etc.). Se livro: vazio"
}

Seja o mais preciso possível. Para campos que não conseguir determinar, use estimativas razoáveis.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Sem resposta do Gemini');
  return JSON.parse(text) as GeminiAnalysis;
}

export async function analyzeCollection(
  imageBase64: string,
  mimeType: string,
  books?: { title: string; author: string; price_cents: number }[],
  condition?: string,
  discountPct?: number
): Promise<GeminiCollectionAnalysis> {
  const ai = getAI();
  const conditionLine = condition ? `Condição geral: ${condition}` : '';

  let prompt: string;

  if (books && books.length > 0) {
    // Mode: with existing books
    const discount = discountPct || 15;
    const totalIndividual = books.reduce((sum, b) => sum + b.price_cents, 0);
    const suggestedTotal = Math.round(totalIndividual * (1 - discount / 100));

    const bookList = books
      .map((b, i) => `${i + 1}. "${b.title}" por ${b.author} — R$ ${(b.price_cents / 100).toFixed(2)}`)
      .join('\n');

    prompt = `Você é um especialista em venda de livros e apostilas no mercado brasileiro.

Estou criando um anúncio de COLEÇÃO que agrupa os seguintes livros já cadastrados individualmente:

${bookList}

Soma dos preços individuais: R$ ${(totalIndividual / 100).toFixed(2)}
Desconto da coleção: ${discount}%
Preço sugerido da coleção: R$ ${(suggestedTotal / 100).toFixed(2)}
${conditionLine}

A foto anexa mostra a coleção completa.

Gere um JSON com:

{
  "title": "Título atrativo para o anúncio da coleção (máximo 120 caracteres)",
  "description": "Descrição completa e atrativa de 3-5 frases para vender a coleção. Mencione que inclui ${books.length} volumes, liste os títulos, e destaque o desconto de ${discount}%.",
  "suggested_price_cents": ${suggestedTotal},
  "category": "Uma de: Ficção, Não-Ficção, Infantil, Acadêmico, Autoajuda, Biografia, Romance, Terror, Fantasia, Ciência, História, Religião, Computadores e Tecnologia, Direito, Medicina, Engenharia, Vestibular, Outro",
  "weight_kg": soma estimada dos pesos dos ${books.length} livros,
  "width_cm": largura estimada do pacote,
  "length_cm": comprimento estimado do pacote,
  "height_cm": altura estimada do pacote empilhado
}`;
  } else {
    // Mode: collection only (no individual books)
    prompt = `Você é um especialista em venda de livros e apostilas no mercado brasileiro.

Analise esta foto de uma COLEÇÃO de livros/apostilas. Quero vender a coleção completa como um único anúncio.
${conditionLine}

Identifique todos os volumes visíveis, o nome da coleção, autores, editora, e gere um anúncio atrativo.

Retorne um JSON com:

{
  "title": "Título atrativo para o anúncio da coleção completa (máximo 120 caracteres, ex: 'Coleção Completa Bio Sanabria - 5 Volumes')",
  "description": "Descrição completa de 3-5 frases listando os volumes incluídos, autor, editora, e estado. Deve ser atrativa para venda.",
  "suggested_price_cents": preço sugerido em centavos para a coleção completa no mercado de usados brasileiro,
  "category": "Uma de: Ficção, Não-Ficção, Infantil, Acadêmico, Autoajuda, Biografia, Romance, Terror, Fantasia, Ciência, História, Religião, Computadores e Tecnologia, Direito, Medicina, Engenharia, Vestibular, Outro",
  "weight_kg": peso estimado total em kg,
  "width_cm": largura estimada do pacote,
  "length_cm": comprimento estimado do pacote,
  "height_cm": altura estimada do pacote empilhado
}

Seja preciso nos preços baseando-se no mercado brasileiro de usados.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Sem resposta do Gemini');
  return JSON.parse(text) as GeminiCollectionAnalysis;
}
