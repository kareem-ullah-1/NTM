export function formatCurrency(amount: number, currency = "PKR"): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));
  return `${currency} ${formatted}`;
}
