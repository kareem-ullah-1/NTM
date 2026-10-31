export type ColorWithStock = {
  name: string;
  hex: string;
  image?: string | null;
  images?: string[];
  stock?: number;
  status?: "In Stock" | "Low Stock" | "Out of Stock";
  [key: string]: unknown;
};

export function statusForStock(
  stock: number,
  lowStockThreshold: number
): "In Stock" | "Low Stock" | "Out of Stock" {
  if (stock <= 0) return "Out of Stock";
  if (stock <= lowStockThreshold) return "Low Stock";
  return "In Stock";
}

export function colorStock(color: { stock?: number } | null | undefined): number {
  if (!color || color.stock == null || Number.isNaN(Number(color.stock))) return 0;
  return Math.max(0, Math.floor(Number(color.stock)));
}

export function sumColorStocks(colors: { stock?: number }[] | null | undefined): number {
  if (!colors || colors.length === 0) return 0;
  return colors.reduce((sum, c) => sum + colorStock(c), 0);
}

export function findColor(
  colors: ColorWithStock[] | null | undefined,
  colorName: string | null | undefined
): ColorWithStock | undefined {
  if (!colors || !colorName) return undefined;
  const target = colorName.trim().toLowerCase();
  return colors.find((c) => c.name.trim().toLowerCase() === target);
}

/** Enrich colours with stock (default 0) and status for API responses. */
export function serializeColors(
  colors: ColorWithStock[] | null | undefined,
  lowStockThreshold: number
): ColorWithStock[] {
  if (!colors) return [];
  return colors.map((c) => {
    const stock = colorStock(c);
    return {
      ...c,
      stock,
      status: statusForStock(stock, lowStockThreshold)
    };
  });
}

         
export function applyColorStockDelta(
  colors: ColorWithStock[],
  colorName: string,
  delta: number
): { colors: ColorWithStock[]; totalStock: number; previousColorStock: number; newColorStock: number } | null {
  const target = colorName.trim().toLowerCase();
  let found = false;
  let previousColorStock = 0;
  let newColorStock = 0;
  const next = colors.map((c) => {
    if (c.name.trim().toLowerCase() !== target) return { ...c, stock: colorStock(c) };
    found = true;
    previousColorStock = colorStock(c);
    newColorStock = previousColorStock + delta;
    return { ...c, stock: newColorStock };
  });
  if (!found || newColorStock < 0) return null;
  return { colors: next, totalStock: sumColorStocks(next), previousColorStock, newColorStock };
}

/** Ensure every colour has a numeric stock; used when creating/updating products. */
export function ensureColorStocks(
  colors: ColorWithStock[],
  fallbackTotal?: number
): ColorWithStock[] {
  if (!colors.length) return colors;
  const hasAny = colors.some((c) => c.stock != null && !Number.isNaN(Number(c.stock)));
  if (hasAny) {
    return colors.map((c) => ({ ...c, stock: colorStock(c) }));
  }
  const n = colors.length;
  const total = Math.max(0, Math.floor(fallbackTotal ?? 0));
  const base = Math.floor(total / n);
  const rem = total % n;
  return colors.map((c, i) => ({
    ...c,
    stock: base + (i === 0 ? rem : 0)
  }));
}
