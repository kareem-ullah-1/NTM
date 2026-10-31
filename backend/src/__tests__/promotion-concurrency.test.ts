import { pool, query, withTransaction } from "../config/db";
import { OrderService } from "../services/order.service";
import { PromotionModel } from "../models/promotion.model";

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

async function resetPromotionData() {
  await query("DELETE FROM promotion_usages");
  await query("DELETE FROM order_items");
  await query("DELETE FROM payments");
  await query("DELETE FROM inventory_movements");
  await query("DELETE FROM orders");
  await query("DELETE FROM promotion_products");
  await query("DELETE FROM promotion_categories");
  await query("DELETE FROM promotion_fabric_types");
  await query("DELETE FROM promotions");
}

async function createTestUser(email: string): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, 'x', 'user')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    ["Test User", email]
  );
  return result.rows[0].id;
}

async function createTestProduct(sku: string): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO products (sku, slug, name, category, fabric_type, price, stock)
     VALUES ($1, $1, 'Concurrency Test Fabric', 'Cotton', 'Cotton', 1000, 1000)
     ON CONFLICT (sku) DO UPDATE SET stock = 1000
     RETURNING id`,
    [sku]
  );
  return result.rows[0].id;
}

async function createTestPromotion(opts: {
  name: string;
  usageLimit: number | null;
  perUserLimit: number | null;
}): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO promotions
       (name, description, discount_type, discount_value, min_order_amount, starts_at, expires_at,
        usage_limit, per_user_limit, is_active, target_type)
     VALUES ($1, '', 'percentage', 10, 0, now() - interval '1 day', now() + interval '1 day',
             $2, $3, true, 'ALL_PRODUCTS')
     RETURNING id`,
    [opts.name, opts.usageLimit, opts.perUserLimit]
  );
  return result.rows[0].id;
}

function orderInputFor(productId: string) {
  return {
    fullName: "Concurrency Tester",
    phone: "03001234567",
    email: "concurrency@test.local",
    address: "123 Test Street",
    city: "Faisalabad",
    postalCode: "38000",
    paymentMethod: "Cash on Delivery" as const,
    items: [{ productId, name: "Concurrency Test Fabric", quantity: 1 }]
  };
}

async function createTestProducts(prefix: string, count: number): Promise<string[]> {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(await createTestProduct(`${prefix}-${i}`));
  }
  return ids;
}

async function countUsages(promotionId: string, userId?: string): Promise<number> {
  const result = userId
    ? await query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM promotion_usages WHERE promotion_id = $1 AND user_id = $2",
        [promotionId, userId]
      )
    : await query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM promotion_usages WHERE promotion_id = $1",
        [promotionId]
      );
  return parseInt(result.rows[0]?.count ?? "0", 10);
}

async function settled(promises: Promise<unknown>[]) {
  return Promise.allSettled(promises);
}

function countFulfilled(results: PromiseSettledResult<unknown>[]) {
  return results.filter((r) => r.status === "fulfilled").length;
}

async function run() {
  console.log("\n1. Same user, per_user_limit = 1, two concurrent attempts (distinct products)");
  {
    await resetPromotionData();
    const [p1, p2] = await createTestProducts("CONC-TEST-001", 2);
    const userId = await createTestUser("user-a@test.local");
    const promoId = await createTestPromotion({ name: "Test 1", usageLimit: 100, perUserLimit: 1 });

    const results = await settled([
      OrderService.create(orderInputFor(p1), userId),
      OrderService.create(orderInputFor(p2), userId)
    ]);
    const succeeded = countFulfilled(results);
    const usageCount = await countUsages(promoId, userId);

    assertEqual("promotion usage rows for this user == 1 (not 2)", usageCount, 1);
    assertEqual("at least one request completed", succeeded >= 1, true);
  }

  console.log("\n2. Same user, per_user_limit = 2, three concurrent attempts (distinct products)");
  {
    await resetPromotionData();
    const [p1, p2, p3] = await createTestProducts("CONC-TEST-002", 3);
    const userId = await createTestUser("user-b@test.local");
    const promoId = await createTestPromotion({ name: "Test 2", usageLimit: 100, perUserLimit: 2 });

    const results = await settled([
      OrderService.create(orderInputFor(p1), userId),
      OrderService.create(orderInputFor(p2), userId),
      OrderService.create(orderInputFor(p3), userId)
    ]);
    const usageCount = await countUsages(promoId, userId);

    assertEqual("promotion usage rows for this user == 2 (not 3)", usageCount, 2);
    assertEqual("all 3 orders still completed (only the discount is capped)", countFulfilled(results), 3);
  }

  console.log("\n3. Different users, per_user_limit = 1, one request each (distinct products)");
  {
    await resetPromotionData();
    const [p1, p2] = await createTestProducts("CONC-TEST-003", 2);
    const userA = await createTestUser("user-c@test.local");
    const userB = await createTestUser("user-d@test.local");
    const promoId = await createTestPromotion({ name: "Test 3", usageLimit: 100, perUserLimit: 1 });

    const results = await settled([
      OrderService.create(orderInputFor(p1), userA),
      OrderService.create(orderInputFor(p2), userB)
    ]);
    const usageA = await countUsages(promoId, userA);
    const usageB = await countUsages(promoId, userB);

    assertEqual("both requests completed", countFulfilled(results), 2);
    assertEqual("user A got exactly one usage", usageA, 1);
    assertEqual("user B got exactly one usage", usageB, 1);
  }

  console.log("\n4. Global usage_limit = 1, two different users concurrently (distinct products)");
  {
    await resetPromotionData();
    const [p1, p2] = await createTestProducts("CONC-TEST-004", 2);
    const userA = await createTestUser("user-e@test.local");
    const userB = await createTestUser("user-f@test.local");
    const promoId = await createTestPromotion({ name: "Test 4", usageLimit: 1, perUserLimit: null });

    const results = await settled([
      OrderService.create(orderInputFor(p1), userA),
      OrderService.create(orderInputFor(p2), userB)
    ]);
    const totalUsage = await countUsages(promoId);

    assertEqual("both orders still completed (order creation itself doesn't fail)", countFulfilled(results), 2);
    assertEqual("exactly one promotion usage was recorded globally", totalUsage, 1);
  }

  console.log("\n5. Rollback: usage reservation must not survive a failed order creation");
  {
    await resetPromotionData();
    await createTestProduct("CONC-TEST-005");
    const userId = await createTestUser("user-g@test.local");
    const promoId = await createTestPromotion({ name: "Test 5", usageLimit: 100, perUserLimit: 1 });

    const before = await query<{ usage_count: number }>("SELECT usage_count FROM promotions WHERE id = $1", [promoId]);
    const usageCountBefore = before.rows[0].usage_count;

    let threw = false;
    try {
      await withTransaction(async (client) => {
        const reserved = await PromotionModel.tryReserveUsage(client, promoId);
        if (!reserved) throw new Error("expected reservation to succeed");
        await PromotionModel.recordUsageRow(client, promoId, userId, "FAKE-ORDER-ID-THAT-DOES-NOT-EXIST", 100);
        throw new Error("simulated downstream order-creation failure");
      });
    } catch {
      threw = true;
    }

    const after = await query<{ usage_count: number }>("SELECT usage_count FROM promotions WHERE id = $1", [promoId]);
    const usageCountAfter = after.rows[0].usage_count;
    const usageRows = await countUsages(promoId, userId);

    assertEqual("the simulated failure actually threw", threw, true);
    assertEqual("usage_count unchanged after rollback", usageCountAfter, usageCountBefore);
    assertEqual("no orphan promotion_usages row survived rollback", usageRows, 0);
  }

  console.log("\n6. Stress: same user, per_user_limit = 1, 8 concurrent attempts, 8 distinct products");
  {
    await resetPromotionData();
    const products = await createTestProducts("CONC-TEST-006", 8);
    const userId = await createTestUser("user-h@test.local");
    const promoId = await createTestPromotion({ name: "Test 6", usageLimit: 100, perUserLimit: 1 });

    const results = await settled(products.map((pid) => OrderService.create(orderInputFor(pid), userId)));
    const usageCount = await countUsages(promoId, userId);

    assertEqual("all 8 orders completed", countFulfilled(results), 8);
    assertEqual("promotion usage rows for this user == 1 (not up to 8)", usageCount, 1);
  }

  console.log("\n════════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("════════════════════════════════════════\n");

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Concurrency test run crashed:", err);
  process.exit(1);
});
