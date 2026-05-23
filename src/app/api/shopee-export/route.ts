import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { validateShopeeListing } from '@/lib/shopee-bulk';
import { buildShopeeXlsx } from '@/lib/shopee-xlsx';
import type { ShopeeListingDraft } from '@/types/batch';

export async function POST(request: Request) {
  const authenticated = await isAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { listings, batchName } = await request.json();

    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({ error: 'Nenhum anúncio pronto para exportar' }, { status: 400 });
    }

    const validations = (listings as ShopeeListingDraft[]).map((listing, index) => ({
      index,
      sku: listing.sku,
      validation: validateShopeeListing(listing),
    }));

    const invalid = validations.filter((item) => !item.validation.valid);
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: 'Existem anúncios com erros obrigatórios',
          invalid,
        },
        { status: 400 }
      );
    }

    const xlsx = buildShopeeXlsx(listings as ShopeeListingDraft[]);
    const safeName = String(batchName || 'lote-shopee')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60) || 'lote-shopee';

    return new NextResponse(Uint8Array.from(xlsx), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar exportação Shopee:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar XLSX' },
      { status: 500 }
    );
  }
}
