import { ApiError } from "../utils/ApiError";

export const PRODUCT_COLORS: { name: string; hex: string }[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Cream", hex: "#FAF8F3" },
  { name: "Charcoal", hex: "#1C1C1C" },
  { name: "Olive", hex: "#5C5A2E" },
  { name: "Maroon", hex: "#5C1F2E" },
  { name: "Sand", hex: "#B8945B" },
  { name: "Grey", hex: "#808080" },
  { name: "Brown", hex: "#6B3A2A" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Teal", hex: "#008080" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Wine", hex: "#722F37" },
  { name: "Mustard", hex: "#FFDB58" },
  { name: "Off White", hex: "#FAFAFA" },
  { name: "Light Grey", hex: "#D3D3D3" },
  { name: "Dark Green", hex: "#006400" }
];

function normalizeColorName(name: string): string {
  return name.trim().toLowerCase();
}

function resolveHex(name: string, hex?: string): string {
  const cleaned = (hex ?? "").trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(cleaned)) return cleaned;
  if (/^[0-9A-F]{6}$/.test(cleaned)) return `#${cleaned}`;

  const approved = PRODUCT_COLORS.find(
    (c) => normalizeColorName(c.name) === normalizeColorName(name)
  );
  if (approved) return approved.hex.toUpperCase();

  const key = normalizeColorName(name);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = key.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return `#${"000000".substring(0, 6 - c.length)}${c}`;
}

export function getApprovedHex(name: string): string | undefined {
  const target = normalizeColorName(name);
  return PRODUCT_COLORS.find((c) => normalizeColorName(c.name) === target)?.hex;
}

export function normalizeColors<T extends { name: string; hex: string }>(
  colors: T[]
): T[] {
  const seen = new Set<string>();
  return colors.map((c) => {
    const name = c.name.trim();
    if (!name) {
      throw ApiError.badRequest("Color name is required.");
    }
    const target = normalizeColorName(name);
    if (seen.has(target)) {
      throw ApiError.badRequest(`Duplicate color: "${name}" was selected more than once.`);
    }
    seen.add(target);
    const approved = PRODUCT_COLORS.find((p) => normalizeColorName(p.name) === target);
    return {
      ...c,
      name: approved?.name ?? name,
      hex: approved ? approved.hex.toUpperCase() : resolveHex(name, c.hex)
    };
  });
}

let cachedLookup: { name: string; hex: string }[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

async function getDbLookupTable(): Promise<{ name: string; hex: string }[]> {
  try {
    const { ColorModel } = await import("../models/catalog.model");
    const now = Date.now();
    if (!cachedLookup || now - cacheTimestamp > CACHE_TTL_MS) {
      cachedLookup = await ColorModel.findAllAsLookup();
      cacheTimestamp = now;
    }
    return cachedLookup;
  } catch {
    return PRODUCT_COLORS;
  }
}

export function invalidateColorCache(): void {
  cachedLookup = null;
  cacheTimestamp = 0;
}

export async function getApprovedHexFromDb(name: string): Promise<string | undefined> {
  const table = await getDbLookupTable();
  const target = normalizeColorName(name);
  const found = table.find((c) => normalizeColorName(c.name) === target);
  return found?.hex ?? getApprovedHex(name);
}

export async function normalizeColorsFromDb<T extends { name: string; hex: string }>(
  colors: T[]
): Promise<T[]> {
  const table = await getDbLookupTable();
  const seen = new Set<string>();

  return colors.map((c) => {
    const name = (c.name ?? "").trim();
    if (!name) {
      throw ApiError.badRequest("Color name is required.");
    }

    const target = normalizeColorName(name);
    if (seen.has(target)) {
      throw ApiError.badRequest(`Duplicate color: "${name}" was selected more than once.`);
    }
    seen.add(target);

    const approved =
      table.find((p) => normalizeColorName(p.name) === target) ??
      PRODUCT_COLORS.find((p) => normalizeColorName(p.name) === target);

    if (approved) {
      return { ...c, name: approved.name, hex: approved.hex.toUpperCase() };
    }

    return {
      ...c,
      name,
      hex: resolveHex(name, c.hex)
    };
  });
}
