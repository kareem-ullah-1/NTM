import { query } from "../config/db";

export interface StoreSettingsRecord {
  id: string;
  store_name: string;
  store_logo_url: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  currency: string;
  currency_symbol: string;
  meta: Record<string, unknown>;
  default_low_stock_threshold: number;
  updated_at: Date;
}

export interface StoreSettingsInput {
  storeName?: string;
  storeLogoUrl?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  currency?: string;
  currencySymbol?: string;
  meta?: Record<string, unknown>;
  defaultLowStockThreshold?: number;
}

async function ensureRow(): Promise<string> {
  const existing = await query<{ id: string }>("SELECT id FROM store_settings LIMIT 1");
  if (existing.rows[0]) return existing.rows[0].id;

  const created = await query<{ id: string }>(
    "INSERT INTO store_settings (store_name) VALUES ('NTM Fabrics') RETURNING id"
  );
  return created.rows[0].id;
}

export const StoreSettingsModel = {
  async get(): Promise<StoreSettingsRecord> {
    const id = await ensureRow();
    const result = await query<StoreSettingsRecord>("SELECT * FROM store_settings WHERE id = $1", [id]);
    return result.rows[0];
  },

  async update(input: StoreSettingsInput): Promise<StoreSettingsRecord> {
    const id = await ensureRow();

    const fieldMap: Record<string, string> = {
      storeName: "store_name",
      contactEmail: "contact_email",
      phone: "phone",
      address: "address",
      currency: "currency",
      currencySymbol: "currency_symbol",
      defaultLowStockThreshold: "default_low_stock_threshold"
    };

    const setClauses: string[] = [];
    const params: unknown[] = [];

    for (const [key, column] of Object.entries(fieldMap)) {
      const value = (input as Record<string, unknown>)[key];
      if (value !== undefined) {
        params.push(value);
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if ("storeLogoUrl" in input) {
      params.push(input.storeLogoUrl ?? null);
      setClauses.push(`store_logo_url = $${params.length}`);
    }

    if (input.meta !== undefined) {
      params.push(JSON.stringify(input.meta));
      setClauses.push(`meta = $${params.length}`);
    }

    if (setClauses.length === 0) {
      const result = await query<StoreSettingsRecord>("SELECT * FROM store_settings WHERE id = $1", [id]);
      return result.rows[0];
    }

    setClauses.push("updated_at = now()");
    params.push(id);

    const result = await query<StoreSettingsRecord>(
      `UPDATE store_settings SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
      params
    );
    return result.rows[0];
  }
};
