export type CartItem = {
  cartItemId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  selectedColor: string;
  selectedLength: string;
  quantity: number;
  unitPrice: number;
  promotionId?: string;
  promotionName?: string;
  promoDiscountPerUnit?: number;
};
