
export type PromotionTargetType = "ALL_PRODUCTS" | "CATEGORIES" | "FABRIC_TYPES" | "PRODUCTS";

export const PROMOTION_TARGET_TYPES: PromotionTargetType[] = [
  "ALL_PRODUCTS",
  "CATEGORIES",
  "FABRIC_TYPES",
  "PRODUCTS"
];

export interface PromotionTargeting {
  targetType: PromotionTargetType;
  productIds: string[];
  categories: string[];
  fabricTypes: string[];
}

export interface EligibilityProduct {
  id: string;
  category: string;
  fabricType: string;
}

export function isProductEligibleForPromotion(
  product: EligibilityProduct,
  targeting: PromotionTargeting
): boolean {
  switch (targeting.targetType) {
    case "ALL_PRODUCTS":
      return true;
    case "CATEGORIES":
      return targeting.categories.includes(product.category);
    case "FABRIC_TYPES":
      return targeting.fabricTypes.includes(product.fabricType);
    case "PRODUCTS":
      return targeting.productIds.includes(product.id);
    default:
      return false;
  }
}

export function describeTargeting(targeting: PromotionTargeting): string {
  switch (targeting.targetType) {
    case "ALL_PRODUCTS":
      return "All Products";
    case "CATEGORIES":
      return targeting.categories.length === 1
        ? targeting.categories[0]
        : `${targeting.categories.length} Categories`;
    case "FABRIC_TYPES":
      return targeting.fabricTypes.length === 1
        ? targeting.fabricTypes[0]
        : `${targeting.fabricTypes.length} Fabric Types`;
    case "PRODUCTS":
      return `${targeting.productIds.length} Product${targeting.productIds.length === 1 ? "" : "s"}`;
    default:
      return "—";
  }
}
