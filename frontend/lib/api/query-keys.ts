export const queryKeys = {
  store: {
    homeFeatured: ["store", "home-featured-categories"] as const,
    categories: ["store", "categories"] as const
  },
  collections: {
    public: ["collections", "public"] as const,
    admin: ["admin-collections"] as const
  },
  catalog: {
    categories: ["admin", "catalog", "categories"] as const,
    fabricTypes: ["admin", "catalog", "fabric-types"] as const,
    colors: ["admin", "catalog", "colors"] as const,
    homeFeatured: ["admin", "catalog", "home-featured"] as const
  },
  products: {
    all: ["products"] as const,
    list: (params: Record<string, unknown>) => ["products", "list", params] as const,
    detail: (slug: string) => ["products", "detail", slug] as const,
    related: (slug: string) => ["products", "related", slug] as const,
    featured: (limit: number) => ["products", "featured", limit] as const,
    filterOptions: (params: Record<string, unknown>) => ["products", "filter-options", params] as const,
    search: (term: string) => ["products", "search", term] as const,
    suggestions: (term: string) => ["products", "suggestions", term] as const
  },
  inventory: {
    all: ["admin", "inventory"] as const,
    movements: (sku: string) => ["admin", "inventory", "movements", sku] as const
  },
  orders: {
    all: ["admin", "orders"] as const,
    list: (params: Record<string, unknown>) => ["admin", "orders", "list", params] as const,
    detail: (id: string) => ["admin", "orders", "detail", id] as const
  },
  dashboard: {
    stats: ["admin", "dashboard", "stats"] as const,
    salesSeries: (period: string) => ["admin", "dashboard", "sales-series", period] as const
  },
  adminReviews: {
    all: ["admin", "reviews"] as const,
    list: (params: Record<string, unknown>) => ["admin", "reviews", "list", params] as const
  },
  customers: {
    all: ["admin", "customers"] as const,
    list: (params: Record<string, unknown>) => ["admin", "customers", "list", params] as const
  },
  auth: {
    me: ["auth", "me"] as const
  },
  storeSettings: {
    all: ["admin", "store-settings"] as const
  },
  promotions: {
    all: ["admin", "promotions"] as const,
    active: ["promotions", "active"] as const,
    forProduct: (id: string) => ["promotions", "product", id] as const
  },
  productDrops: {
    all: ["admin", "product-drops"] as const,
    public: ["product-drops", "public"] as const,
    forProduct: (id: string) => ["product-drops", "product", id] as const
  }
};
