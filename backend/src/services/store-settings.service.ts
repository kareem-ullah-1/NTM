import { StoreSettingsModel, type StoreSettingsInput, type StoreSettingsRecord } from "../models/store-settings.model";

function serialize(row: StoreSettingsRecord) {
  return {
    storeName: row.store_name,
    storeLogoUrl: row.store_logo_url,
    contactEmail: row.contact_email,
    phone: row.phone,
    address: row.address,
    currency: row.currency,
    currencySymbol: row.currency_symbol,
    meta: row.meta,
    defaultLowStockThreshold: row.default_low_stock_threshold,
    updatedAt: row.updated_at.toISOString()
  };
}

export const StoreSettingsService = {
  async get() {
    const row = await StoreSettingsModel.get();
    return serialize(row);
  },

  async update(input: StoreSettingsInput) {
    const row = await StoreSettingsModel.update(input);
    return serialize(row);
  }
};
