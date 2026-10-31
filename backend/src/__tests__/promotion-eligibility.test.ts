import { isProductEligibleForPromotion, describeTargeting, type PromotionTargeting } from "../services/promotion-eligibility";

let passed = 0;
let failed = 0;

function assertTrue(label: string, actual: boolean) {
  if (actual === true) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label} → expected eligible, got not eligible`);
    failed++;
  }
}

function assertFalse(label: string, actual: boolean) {
  if (actual === false) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label} → expected not eligible, got eligible`);
    failed++;
  }
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label} → expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

const cottonShirt = { id: "prod-1", category: "Cotton", fabricType: "Cotton" };
const boskiKurta = { id: "prod-2", category: "Boski", fabricType: "Boski Premium" };

console.log("\n1. ALL_PRODUCTS targeting");
const allProducts: PromotionTargeting = { targetType: "ALL_PRODUCTS", productIds: [], categories: [], fabricTypes: [] };
assertTrue("any product is eligible under ALL_PRODUCTS", isProductEligibleForPromotion(cottonShirt, allProducts));
assertTrue("any other product is eligible under ALL_PRODUCTS", isProductEligibleForPromotion(boskiKurta, allProducts));

console.log("\n2. CATEGORIES targeting");
const categoryTargeting: PromotionTargeting = {
  targetType: "CATEGORIES",
  productIds: [],
  categories: ["Cotton", "Wash & Wear"],
  fabricTypes: []
};
assertTrue("product in a matching category is eligible", isProductEligibleForPromotion(cottonShirt, categoryTargeting));
assertFalse("product outside the selected categories is not eligible", isProductEligibleForPromotion(boskiKurta, categoryTargeting));

console.log("\n3. FABRIC_TYPES targeting (the previously broken case)");
const fabricTypeTargeting: PromotionTargeting = {
  targetType: "FABRIC_TYPES",
  productIds: [],
  categories: [],
  fabricTypes: ["Boski Premium"]
};
assertTrue("product with a matching fabric type is eligible", isProductEligibleForPromotion(boskiKurta, fabricTypeTargeting));
assertFalse("product with a non-matching fabric type is not eligible", isProductEligibleForPromotion(cottonShirt, fabricTypeTargeting));

console.log("\n4. PRODUCTS (specific product) targeting");
const productTargeting: PromotionTargeting = {
  targetType: "PRODUCTS",
  productIds: ["prod-1"],
  categories: [],
  fabricTypes: []
};
assertTrue("selected product is eligible", isProductEligibleForPromotion(cottonShirt, productTargeting));
assertFalse("unselected product is not eligible", isProductEligibleForPromotion(boskiKurta, productTargeting));

console.log("\n5. Empty target lists never silently fall back to ALL_PRODUCTS");
const emptyCategoryTargeting: PromotionTargeting = { targetType: "CATEGORIES", productIds: [], categories: [], fabricTypes: [] };
assertFalse("CATEGORIES with no categories selected matches nothing", isProductEligibleForPromotion(cottonShirt, emptyCategoryTargeting));
const emptyFabricTargeting: PromotionTargeting = { targetType: "FABRIC_TYPES", productIds: [], categories: [], fabricTypes: [] };
assertFalse("FABRIC_TYPES with no fabric types selected matches nothing", isProductEligibleForPromotion(cottonShirt, emptyFabricTargeting));
const emptyProductTargeting: PromotionTargeting = { targetType: "PRODUCTS", productIds: [], categories: [], fabricTypes: [] };
assertFalse("PRODUCTS with no products selected matches nothing", isProductEligibleForPromotion(cottonShirt, emptyProductTargeting));

console.log("\n6. describeTargeting summaries");
assertEqual("ALL_PRODUCTS summary", describeTargeting(allProducts), "All Products");
assertEqual("single category summary", describeTargeting({ targetType: "CATEGORIES", productIds: [], categories: ["Cotton"], fabricTypes: [] }), "Cotton");
assertEqual("multi-category summary", describeTargeting(categoryTargeting), "2 Categories");
assertEqual("multi-product summary", describeTargeting({ targetType: "PRODUCTS", productIds: ["a", "b", "c"], categories: [], fabricTypes: [] }), "3 Products");
assertEqual("single-product summary", describeTargeting({ targetType: "PRODUCTS", productIds: ["a"], categories: [], fabricTypes: [] }), "1 Product");

console.log(`\n${"═".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
