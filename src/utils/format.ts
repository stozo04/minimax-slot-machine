const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatSignedCurrency(cents: number): string {
  const prefix = cents > 0 ? '+' : '';
  return `${prefix}${currencyFormatter.format(cents / 100)}`;
}
