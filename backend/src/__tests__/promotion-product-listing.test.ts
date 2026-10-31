import { pool, query } from "../config/db";
import { ProductService } from "../services/product.service";

let passed = 0;
let failed = 0;

function assertEqual(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label} → expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertTrue(label: string, actual: boolean) {
  if (actual) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label}`);
    failed++;
  }
}

async function cleanup() {
  await query("DELETE FROM promotion_products");
  await query("DELETE FROM promotion_categories");
  await query("DELETE FROM promotion_fabric_types");
  await query("DELETE FROM promotion_display_products");
  await query("DELETE FROM promotions");
  await query("DELETE FROM products WHERE sku LIKE 'PROMO-LISTING-TEST-%'");
}

async function createProduct(opts: {
  sku: string;
  name: string;
  category: string;
  fabricType: string;
  price?: number;
  stock?: number;
}): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO products
       (sku, slug, name, category, fabric_type, description, price, stock, images, colors, available_lengths, specifications)
     VALUES ($1, $1, $2, $3, $4, '', $5, $6, '[]', '[{\"name\":\"Default\",\"hex\":\"#000000\"}]', '[\"4 meters\"]', '[]')
     ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category, fabric_type = EXCLUDED.fabric_type
     RETURNING id`,
    [opts.sku, opts.name, opts.category, opts.fabricType, opts.price ?? 1000, opts.stock ?? 100]
  );
  return result.rows[0].id;
}

async function createPromotion(opts: {
  name: string;
  targetType: string;
  isActive?: boolean;
  startsAt?: Date;
  expiresAt?: Date;
}): Promise<string> {
  const now = new Date();
  const startsAt = opts.startsAt ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const expiresAt = opts.expiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const result = await query<{ id: string }>(
    `INSERT INTO promotions
       (name, description, discount_type, discount_value, min_order_amount,
        starts_at, expires_at, is_active, target_type)
     VALUES ($1, '', 'percentage', 10, 0, $2, $3, $4, $5)
     RETURNING id`,
    [opts.name, startsAt, expiresAt, opts.isActive !== false, opts.targetType]
  );
  return result.rows[0].id;
}

async function addPromotionCategory(promoId: string, category: string) {
  await query(
    "INSERT INTO promotion_categories (promotion_id, category) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [promoId, category]
  );
}

async function addPromotionFabricType(promoId: string, fabricType: string) {
  await query(
    "INSERT INTO promotion_fabric_types (promotion_id, fabric_type) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [promoId, fabricType]
  );
}

async function addPromotionProduct(promoId: string, productId: string) {
  await query(
    "INSERT INTO promotion_products (promotion_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [promoId, productId]
  );
}

async function listProducts(promotionId?: string) {
  const query_: Record<string, unknown> = { page: 1, limit: 100 };
  if (promotionId) query_.promotion = promotionId;
  return ProductService.list(query_);
}

async function run() {
  await cleanup();

  await createProduct({
    sku: "PROMO-LISTING-TEST-COTTON-1",
    name: "Cotton Fabric",
    category: "Cotton",
    fabricType: "Cotton"
  });

  await createProduct({
    sku: "PROMO-LISTING-TEST-BOSKI-1",
    name: "Boski Fabric",
    category: "Boski",
    fabricType: "Boski Premium"
  });

  await createProduct({
    sku: "PROMO-LISTING-TEST-LATHA-1",
    name: "Latha Fabric",
    category: "Latha",
    fabricType: "Latha"
  });

  await createProduct({
    sku: "PROMO-LISTING-TEST-WASHWEAR-1",
    name: "Wash & Wear Fabric",
    category: "Wash & Wear",
    fabricType: "Wash & Wear"
  });

  console.log("\n1. Category promotion targets Cotton → only Cotton products appear");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });
    const promoId = await createPromotion({ name: "Cotton Promo", targetType: "CATEGORIES" });
    await addPromotionCategory(promoId, "Cotton");

    const result = await listProducts(promoId);
    const names = result.data.map((p) => p.name);

    assertEqual("total count is 1", result.meta?.total, 1);
    assertTrue("Cotton product appears", names.includes("Cotton Fabric"));
    assertFalse("Boski product does NOT appear", !names.includes("Boski Fabric"));
  }

  console.log("\n2. Fabric type promotion targets Boski Premium → only Boski products appear");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });
    const promoId = await createPromotion({ name: "Boski Promo", targetType: "FABRIC_TYPES" });
    await addPromotionFabricType(promoId, "Boski Premium");

    const result = await listProducts(promoId);
    const names = result.data.map((p) => p.name);

    assertEqual("total count is 1", result.meta?.total, 1);
    assertTrue("Boski product appears", names.includes("Boski Fabric"));
    assertFalse("Cotton product does NOT appear", !names.includes("Cotton Fabric"));
  }

  console.log("\n3. Specific product promotion targets product A → only product A appears");
  {
    await cleanup();
    const prodA = await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });
    const promoId = await createPromotion({ name: "Product A Promo", targetType: "PRODUCTS" });
    await addPromotionProduct(promoId, prodA);

    const result = await listProducts(promoId);
    const names = result.data.map((p) => p.name);

    assertEqual("total count is 1", result.meta?.total, 1);
    assertTrue("Product A appears", names.includes("Cotton Fabric"));
    assertFalse("Product B does NOT appear", !names.includes("Boski Fabric"));
  }

  console.log("\n4. ALL_PRODUCTS promotion → all products are shown");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });
    const promoId = await createPromotion({ name: "All Products Promo", targetType: "ALL_PRODUCTS" });

    const resultWithPromo = await listProducts(promoId);
    const resultWithoutPromo = await listProducts();

    assertEqual("ALL_PRODUCTS returns same total as no-promo query", resultWithPromo.meta?.total, resultWithoutPromo.meta?.total);
  }

  console.log("\n5. Empty targeted promotion → returns 0 products (not all)");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });

    const promoProducts = await createPromotion({ name: "Empty Products Promo", targetType: "PRODUCTS" });
    const resultProducts = await listProducts(promoProducts);
    assertEqual("PRODUCTS with empty list returns 0 products", resultProducts.meta?.total, 0);

    const promoCategories = await createPromotion({ name: "Empty Categories Promo", targetType: "CATEGORIES" });
    const resultCategories = await listProducts(promoCategories);
    assertEqual("CATEGORIES with empty list returns 0 products", resultCategories.meta?.total, 0);

    const promoFabric = await createPromotion({ name: "Empty Fabric Promo", targetType: "FABRIC_TYPES" });
    const resultFabric = await listProducts(promoFabric);
    assertEqual("FABRIC_TYPES with empty list returns 0 products", resultFabric.meta?.total, 0);
  }

  console.log("\n6. Pagination metadata reflects only promotion-eligible products");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-LATHA-1",
      name: "Latha Fabric",
      category: "Latha",
      fabricType: "Latha"
    });
    const promoId = await createPromotion({ name: "Cotton Pagination Promo", targetType: "CATEGORIES" });
    await addPromotionCategory(promoId, "Cotton");

    const result = await listProducts(promoId);

    assertEqual("meta.total is 1 (only Cotton)", result.meta?.total, 1);
    assertEqual("meta.totalPages is 1", result.meta?.totalPages, 1);
    assertEqual("data length is 1", result.data.length, 1);
  }

  console.log("\n7. Promotion + user category filter narrows within promotion scope");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-WASHWEAR-1",
      name: "Wash & Wear Fabric",
      category: "Wash & Wear",
      fabricType: "Wash & Wear"
    });
    const promoId = await createPromotion({ name: "Multi-Cat Promo", targetType: "CATEGORIES" });
    await addPromotionCategory(promoId, "Cotton");
    await addPromotionCategory(promoId, "Wash & Wear");

    const result = await ProductService.list({
      promotion: promoId,
      category: ["Cotton"],
      page: 1,
      limit: 100
    });

    assertEqual("total count is 1 (intersection of promotion + user filter)", result.meta?.total, 1);
    assertEqual("only Cotton product returned", result.data[0]?.name, "Cotton Fabric");
  }

  console.log("\n8. No promotion param → all products returned (normal shop behavior)");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    await createProduct({
      sku: "PROMO-LISTING-TEST-BOSKI-1",
      name: "Boski Fabric",
      category: "Boski",
      fabricType: "Boski Premium"
    });

    const result = await listProducts();

    assertTrue("at least 2 products returned (test data exists)", (result.meta?.total as number) >= 2);
  }

  console.log("\n9. Expired promotion → throws error");
  {
    await cleanup();
    await createProduct({
      sku: "PROMO-LISTING-TEST-COTTON-1",
      name: "Cotton Fabric",
      category: "Cotton",
      fabricType: "Cotton"
    });
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const promoId = await createPromotion({
      name: "Expired Promo",
      targetType: "ALL_PRODUCTS",
      startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      expiresAt: yesterday
    });

    let threw = false;
    try {
      await listProducts(promoId);
    } catch {
      threw = true;
    }
    assertTrue("expired promotion throws an error", threw);
  }

  console.log("\n10. Invalid promotion ID → throws error");
  {
    let threw = false;
    try {
      await listProducts("00000000-0000-0000-0000-000000000000");
    } catch {
      threw = true;
    }
    assertTrue("invalid promotion ID throws an error", threw);
  }

  await cleanup();

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("══════════════════════════════════════════════════════════════\n");

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

function assertFalse(label: string, actual: boolean) {
  if (actual) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label}`);
    failed++;
  }
}

run().catch((err) => {
  console.error("Test run crashed:", err);
  pool.end().finally(() => process.exit(1));
});
