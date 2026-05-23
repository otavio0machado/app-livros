# MyShelf

Loja/admin em Next.js para cadastrar livros, analisar fotos com IA e gerar lote de produtos para a Shopee.

## Rodando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis obrigatórias

Use `.env.example` como base. O admin só entra se `JWT_SECRET`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` estiverem configurados. Sem isso, o login falha fechado.

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase público.
- `SUPABASE_SERVICE_ROLE_KEY`: acesso server-side para CRUD e uploads.
- `GEMINI_API_KEY`: análise de livros/coleções por IA.
- `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: autenticação do painel.
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: número usado no checkout por WhatsApp.

## Supabase

O schema base está em `supabase/schema.sql`. Ele cria a tabela `books`, índices principais, trigger de `updated_at` e bucket público `book-images`.

## Fluxos principais

- `/loja`: vitrine pública, somente livros disponíveis.
- `/livro/[id]`: detalhe público do livro disponível.
- `/carrinho`: checkout por WhatsApp.
- `/admin`: gestão completa do acervo.
- `/admin/lote`: cadastro em lote com análise por IA.
- `/admin/colecao`: montagem de coleção.
- `/admin/planilha`: criação de lote Shopee e exportação XLSX.

## Shopee

A Shopee aceita arquivo `.xlsx` para upload em massa. A rota `/api/shopee-export` valida os anúncios e retorna uma planilha XLSX pronta para baixar.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```
