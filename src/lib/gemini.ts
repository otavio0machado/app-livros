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

export async function analyzeCollectionImage(
  imageBase64: string,
  mimeType: string,
  condition?: string
): Promise<GeminiCollectionAnalysis> {
  const ai = getAI();

  const conditionInstruction = condition
    ? `\nO vendedor já classificou a condição dos itens como: "${condition}".
Use essa informação para ajustar os preços sugeridos com precisão.`
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
Analise esta foto que contém uma COLEÇÃO de livros ou apostilas (múltiplos volumes).

Identifique:
- O nome da coleção (ex: "Bio Sanabria", "Bernoulli Matemática", "Anglo Física")
- Quantos volumes existem
- Se é Livro ou Apostila
- Informações de cada volume individualmente
${conditionInstruction}

Retorne um JSON com esta estrutura:

{
  "collection_name": "Nome da coleção",
  "total_volumes": número de volumes identificados,
  "type": "Livro" ou "Apostila",
  "volumes": [
    {
      "title": "Título do volume (incluindo número do volume)",
      "author": "Autor",
      "publisher": "Editora ou cursinho",
      "isbn": "ISBN se visível, senão string vazia",
      "volume_number": 1,
      "year": "Ano",
      "description": "Descrição atrativa de 1-2 frases para vender este volume",
      "category": "Uma de: Ficção, Não-Ficção, Infantil, Acadêmico, Autoajuda, Biografia, Romance, Terror, Fantasia, Ciência, História, Religião, Computadores e Tecnologia, Direito, Medicina, Engenharia, Vestibular, Outro",
      "language": "Português",
      "edition_type": "1ª Edição, etc.",
      "cover_type": "Brochura, Capa Dura, Espiral",
      "weight_kg": peso estimado em kg,
      "suggested_price_cents": preço sugerido por volume em centavos (SEM desconto de coleção),
      "width_cm": largura em cm,
      "length_cm": comprimento em cm,
      "height_cm": espessura em cm,
      "subject": "Matéria se apostila, senão vazio",
      "course_origin": "Cursinho se apostila, senão vazio"
    }
  ]
}

Se não conseguir identificar volumes individuais com precisão, estime com base no que é visível.
Seja o mais preciso possível nos preços, baseando-se no mercado de usados brasileiro.`,
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
  return JSON.parse(text) as GeminiCollectionAnalysis;
}
