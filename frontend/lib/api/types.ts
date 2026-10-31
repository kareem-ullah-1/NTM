export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiCollectionOption = {
  id: string;
  collectionId: string;
  name: string;
  slug: string;
  isActive: boolean;
  productCount?: number;
  productIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ApiCollection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  displayOrder: number;
  isEnabled: boolean;
  navLinks?: { label: string; href: string }[];
  options?: ApiCollectionOption[];
  productCount?: number;
  productIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type ApiFabricType = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiHomeFeaturedCategory = {
  id: string;
  categoryId: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    isEnabled: boolean;
  } | null;
};

export type ApiProduct = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  fabricType: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  colors: { name: string; hex: string; image?: string | null; images?: string[]; stock?: number; status?: "In Stock" | "Low Stock" | "Out of Stock" }[];
  availableLengths: string[];
  specifications: { label: string; value: string }[];
  rating: number;
  reviewCount: number;
  stock: number;
  lowStockThreshold: number;
  featured: boolean;
  isNew: boolean;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  lastUpdated: string;
  collections: { collectionId: string; collectionOptionId: string | null }[];
};

export type InventoryMovementType = "sale" | "cancellation" | "return" | "manual_adjustment" | "restock";

export type ApiInventoryMovement = {
  id: string;
  product_id: string;
  previous_stock: number;
  quantity_change: number;
  new_stock: number;
  movement_type: InventoryMovementType;
  order_id: string | null;
  reason: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
};

export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";

export type ApiReview = {
  id: string;
  productId: string;
  userId: string | null;
  rating: number;
  comment: string;
  images: string[];
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
  isGuest: boolean;
  userName: string;
  userAvatarUrl: string | null;
};

export type ApiAdminReview = ApiReview & {
  userEmail: string | null;
  productName: string;
  productSlug: string | null;
};

export type ApiReviewStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  hidden: number;
  averageRating: number;
};

export type ApiOrderItem = {
  id?: string;
  productId: string | null;
  name: string;
  color: string | null;
  length: string | null;
  quantity: number;
  unitPrice: number;
  promoId?: string | null;
  originalUnitPrice?: number | null;
  promoDiscount?: number;
};

export type ApiOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  region: string | null;
  postalCode: string;
  deliveryNotes: string | null;

  paymentMethod: "Cash on Delivery" | "Easypaisa / JazzCash" | "Bank Transfer";
  status: "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;

  promoId?: string | null;
  promoDiscount?: number;
  walletAmountUsed?: number;
  amount: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  date: string;
  items: ApiOrderItem[];

};

export type DashboardStats = {
  totalSales: number;
  orderCount: number;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};
