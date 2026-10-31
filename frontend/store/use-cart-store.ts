import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/cart";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

type AddCartItemInput = Omit<CartItem, "cartItemId">;

type AppliedCoupon = { code: string; discountAmount: number; discountType?: "percentage" | "fixed" } | null;
type AppliedPromo = { name: string; discountAmount: number } | null;

type CartState = {
  items: CartItem[];
  appliedCoupon: AppliedCoupon;
  appliedPromo: AppliedPromo;
  checkoutCity: string;
  isCartDrawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  clearLocalOnly: () => void;
  totalItems: () => number;
  subtotal: () => number;
  setAppliedCoupon: (coupon: AppliedCoupon) => void;
  setAppliedPromo: (promo: AppliedPromo) => void;
  setCheckoutCity: (city: string) => void;
};

function computeAppliedPromo(items: CartItem[]): AppliedPromo {
  const promoItems = items.filter(
    (item) => item.promoDiscountPerUnit && item.promoDiscountPerUnit > 0
  );
  if (promoItems.length === 0) return null;

  const discountAmount = promoItems.reduce(
    (sum, item) => sum + (item.promoDiscountPerUnit ?? 0) * item.quantity,
    0
  );
  const distinctNames = new Set(promoItems.map((item) => item.promotionName).filter(Boolean));
  const name =
    distinctNames.size === 1 ? (Array.from(distinctNames)[0] as string) : "Promotions";

  return { name, discountAmount };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      appliedPromo: null,
      checkoutCity: "",
      isCartDrawerOpen: false,
      openCartDrawer: () => set({ isCartDrawerOpen: true }),
      closeCartDrawer: () => set({ isCartDrawerOpen: false }),
      addItem: (item) => {
        trackEvent("add_to_cart", {
          currency: siteConfig.currency,
          value: item.unitPrice * item.quantity,
          items: [
            {
              item_id: item.productId,
              item_name: item.name,
              price: item.unitPrice,
              quantity: item.quantity
            }
          ]
        });
        const existing = get().items.find(
          (cartItem) =>
            cartItem.productId === item.productId &&
            cartItem.selectedColor === item.selectedColor &&
            cartItem.selectedLength === item.selectedLength
        );
        if (existing) {
          const items = get().items.map((cartItem) =>
            cartItem.cartItemId === existing.cartItemId
              ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
              : cartItem
          );
          set({ items, appliedPromo: computeAppliedPromo(items) });
          return;
        }
        const cartItemId = `${item.productId}-${item.selectedColor}-${item.selectedLength}-${Date.now()}`;
        const items = [...get().items, { ...item, cartItemId }];
        set({ items, appliedPromo: computeAppliedPromo(items) });
      },
      removeItem: (cartItemId) => {
        const items = get().items.filter((item) => item.cartItemId !== cartItemId);
        set({ items, appliedPromo: computeAppliedPromo(items) });
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity < 1) return;
        const items = get().items.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity } : item
        );
        set({ items, appliedPromo: computeAppliedPromo(items) });
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, appliedPromo: null, checkoutCity: "" });
      },

      clearLocalOnly: () => {
        set({ items: [], appliedCoupon: null, appliedPromo: null, checkoutCity: "" });
      },
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () => get().items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      setAppliedPromo: (promo) => set({ appliedPromo: promo }),
      setCheckoutCity: (city: string) => set({ checkoutCity: city })
    }),
    { name: "noor-fabrics-cart" }
  )
);
