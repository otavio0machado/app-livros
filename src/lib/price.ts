export function hasKnownPrice(cents: number): boolean {
  return cents > 0;
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function formatPriceLabel(cents: number): string {
  return hasKnownPrice(cents) ? `R$ ${formatCurrency(cents)}` : 'A combinar';
}

export function formatCartTotalLabel(totalCents: number, hasPendingPrices: boolean): string {
  if (!hasPendingPrices) return formatPriceLabel(totalCents);
  if (totalCents <= 0) return 'A combinar';
  return `${formatPriceLabel(totalCents)} + itens a combinar`;
}
