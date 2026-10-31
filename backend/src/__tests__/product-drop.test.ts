import { pool, query } from "../config/db";
import { ProductDropModel } from "../models/product-drop.model";
import { DropNotificationModel } from "../models/drop-notification.model";

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

async function createTestProduct(sku: string): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO products (sku, slug, name, category, fabric_type, price, stock)
     VALUES ($1, $1, 'Test Fabric', 'Cotton', 'Cotton', 5000, 1000)
     ON CONFLICT (sku) DO UPDATE SET stock = 1000
     RETURNING id`,
    [sku]
  );
  return result.rows[0].id;
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

async function cleanup(productId: string) {
  await query("DELETE FROM drop_notification_subscriptions WHERE drop_id IN (SELECT id FROM product_drops WHERE product_id = $1)", [productId]);
  await query("DELETE FROM drop_purchases WHERE drop_id IN (SELECT id FROM product_drops WHERE product_id = $1)", [productId]);
  await query("DELETE FROM product_drops WHERE product_id = $1", [productId]);
}

async function run() {
  console.log("\n🧪 Product Drop Tests\n");

  console.log("1. Drop creation");
  {
    const productId = await createTestProduct("TEST-DROP-001");
    await cleanup(productId);

    const drop = await ProductDropModel.create({
      productId,
      name: "Test Drop",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      maxQuantity: 100,
      specialPrice: 3999,
    });

    assertEqual("drop created with correct name", drop.name, "Test Drop");
    assertEqual("drop has correct max_quantity", drop.max_quantity, 100);
    assertEqual("drop has correct special_price", parseFloat(drop.special_price!), 3999);
    assertEqual("drop starts as active", drop.is_active, true);
    assertEqual("drop has zero sold_quantity", drop.sold_quantity, 0);

    await cleanup(productId);
  }

  console.log("\n2. Status computation");
  {
    const productId = await createTestProduct("TEST-DROP-002");
    await cleanup(productId);

    const upcoming = await ProductDropModel.create({
      productId,
      name: "Upcoming Drop",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      maxQuantity: 50,
    });
    assertEqual("drop starts with sold_quantity 0", upcoming.sold_quantity, 0);

    const live = await ProductDropModel.create({
      productId,
      name: "Live Drop",
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      maxQuantity: 50,
    });
    const liveStatus = await ProductDropModel.findById(live.id);
    assertEqual("live drop is_active", liveStatus!.is_active, true);

    const ended = await ProductDropModel.create({
      productId,
      name: "Ended Drop",
      startsAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      endsAt: new Date(Date.now() - 86400000).toISOString(),
      maxQuantity: 50,
    });
    const endedStatus = await ProductDropModel.findById(ended.id);
    assertEqual("ended drop exists", endedStatus !== null, true);

    const disabled = await ProductDropModel.create({
      productId,
      name: "Disabled Drop",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      maxQuantity: 50,
      isActive: false,
    });
    assertEqual("disabled drop is_active is false", disabled.is_active, false);

    await cleanup(productId);
  }

  console.log("\n3. Quantity enforcement");
  {
    const productId = await createTestProduct("TEST-DROP-003");
    await cleanup(productId);

    const drop = await ProductDropModel.create({
      productId,
      name: "Qty Test Drop",
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      maxQuantity: 5,
      specialPrice: 3000,
    });

    const after3 = await ProductDropModel.decrementQuantity(drop.id, 3);
    assertEqual("after decrementing 3, sold_quantity = 3", after3!.sold_quantity, 3);
    assertEqual("after decrementing 3, remaining = 2", after3!.max_quantity - after3!.sold_quantity, 2);

    const after2 = await ProductDropModel.decrementQuantity(drop.id, 2);
    assertEqual("after decrementing 2, sold_quantity = 5", after2!.sold_quantity, 5);

    const oversell = await ProductDropModel.decrementQuantity(drop.id, 1);
    assertEqual("oversell attempt returns null", oversell, null);

    const final = await ProductDropModel.findById(drop.id);
    assertEqual("sold_quantity still 5 after oversell attempt", final!.sold_quantity, 5);

    await cleanup(productId);
  }

  console.log("\n4. Per-customer purchase limit");
  {
    const productId = await createTestProduct("TEST-DROP-004");
    await cleanup(productId);

    const drop = await ProductDropModel.create({
      productId,
      name: "Limit Test Drop",
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      maxQuantity: 100,
      perCustomerLimit: 2,
    });

    const userId = await createTestUser("limit-test@test.local");

    let count = await ProductDropModel.countDropPurchasesByUser(drop.id, userId);
    assertEqual("initial purchase count = 0", count, 0);

    await ProductDropModel.recordPurchase(drop.id, userId, "NF-TEST1", 1);
    count = await ProductDropModel.countDropPurchasesByUser(drop.id, userId);
    assertEqual("after 1 purchase, count = 1", count, 1);

    await ProductDropModel.recordPurchase(drop.id, userId, "NF-TEST2", 1);
    count = await ProductDropModel.countDropPurchasesByUser(drop.id, userId);
    assertEqual("after 2 purchases, count = 2", count, 2);

    assertEqual("per_customer_limit is 2", drop.per_customer_limit, 2);

    await cleanup(productId);
  }

  console.log("\n5. Overlapping drop prevention");
  {
    const productId = await createTestProduct("TEST-DROP-005");
    await cleanup(productId);

    const drop1 = await ProductDropModel.create({
      productId,
      name: "First Drop",
      startsAt: "2026-09-05T10:00:00Z",
      endsAt: "2026-09-10T23:59:00Z",
      maxQuantity: 100,
    });

    const overlap = await ProductDropModel.hasOverlappingDrop(
      productId,
      "2026-09-07T00:00:00Z",
      "2026-09-12T00:00:00Z"
    );
    assertEqual("overlapping drop detected", overlap !== null, true);
    assertEqual("overlapping drop is the first drop", overlap!.id, drop1.id);

    const noOverlap = await ProductDropModel.hasOverlappingDrop(
      productId,
      "2026-09-15T00:00:00Z",
      "2026-09-20T00:00:00Z"
    );
    assertEqual("non-overlapping range returns null", noOverlap, null);

    const selfExclusion = await ProductDropModel.hasOverlappingDrop(
      productId,
      "2026-09-07T00:00:00Z",
      "2026-09-12T00:00:00Z",
      drop1.id
    );
    assertEqual("self-exclusion works", selfExclusion, null);

    await ProductDropModel.setActive(drop1.id, false);
    const disabledOverlap = await ProductDropModel.hasOverlappingDrop(
      productId,
      "2026-09-07T00:00:00Z",
      "2026-09-12T00:00:00Z"
    );
    assertEqual("disabled drop not considered overlapping", disabledOverlap, null);

    await cleanup(productId);
  }

  console.log("\n6. Delete protection (purchase count)");
  {
    const productId = await createTestProduct("TEST-DROP-006");
    await cleanup(productId);

    const drop = await ProductDropModel.create({
      productId,
      name: "Delete Test Drop",
      startsAt: new Date(Date.now() - 86400000).toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      maxQuantity: 100,
    });

    let purchaseCount = await ProductDropModel.countPurchasesByDropId(drop.id);
    assertEqual("no purchases initially", purchaseCount, 0);

    await ProductDropModel.recordPurchase(drop.id, null, "NF-DEL1", 2);
    purchaseCount = await ProductDropModel.countPurchasesByDropId(drop.id);
    assertEqual("1 purchase record after recordPurchase", purchaseCount, 1);

    await cleanup(productId);
  }

  console.log("\n7. Notification subscriptions");
  {
    const productId = await createTestProduct("TEST-DROP-007");
    await cleanup(productId);

    const drop = await ProductDropModel.create({
      productId,
      name: "Notification Test Drop",
      startsAt: new Date(Date.now() + 86400000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      maxQuantity: 50,
    });

    const sub1 = await DropNotificationModel.subscribe(drop.id, "user1@test.local");
    assertEqual("first subscription created", sub1.alreadySubscribed, false);

    const sub2 = await DropNotificationModel.subscribe(drop.id, "user1@test.local");
    assertEqual("duplicate subscription detected", sub2.alreadySubscribed, true);

    const sub3 = await DropNotificationModel.subscribe(drop.id, "user2@test.local");
    assertEqual("different email creates new subscription", sub3.alreadySubscribed, false);

    const count = await DropNotificationModel.countByDropId(drop.id);
    assertEqual("total subscriptions = 2", count, 2);

    const pending = await DropNotificationModel.findPendingByDropId(drop.id);
    assertEqual("pending subscribers = 2", pending.length, 2);

    await DropNotificationModel.markNotified(sub1.record.id);
    const pendingAfter = await DropNotificationModel.findPendingByDropId(drop.id);
    assertEqual("pending after marking one notified = 1", pendingAfter.length, 1);

    const marked = await DropNotificationModel.markAllNotifiedForDrop(drop.id);
    assertEqual("markAllNotifiedForDrop returns 1 (remaining)", marked, 1);

    const markedAgain = await DropNotificationModel.markAllNotifiedForDrop(drop.id);
    assertEqual("markAllNotifiedForDrop idempotent returns 0", markedAgain, 0);

    const finalPending = await DropNotificationModel.findPendingByDropId(drop.id);
    assertEqual("no pending subscribers after marking all", finalPending.length, 0);

    await cleanup(productId);
  }

  console.log("\n8. Pagination");
  {
    const productId = await createTestProduct("TEST-DROP-008");
    await cleanup(productId);

    for (let i = 0; i < 5; i++) {
      await ProductDropModel.create({
        productId,
        name: `Pagination Drop ${i}`,
        startsAt: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        endsAt: new Date(Date.now() + (i + 2) * 86400000).toISOString(),
        maxQuantity: 10,
      });
    }

    const page1 = await ProductDropModel.findManyPaginated({ page: 1, limit: 2 });
    assertEqual("page 1 has 2 results", page1.rows.length, 2);
    assertEqual("total is 5", page1.total, 5);

    const page3 = await ProductDropModel.findManyPaginated({ page: 3, limit: 2 });
    assertEqual("page 3 has 1 result", page3.rows.length, 1);

    const searched = await ProductDropModel.findManyPaginated({
      page: 1,
      limit: 10,
      search: "Pagination Drop 2",
    });
    assertEqual("search finds 1 result", searched.rows.length, 1);
    assertEqual("search result name matches", searched.rows[0].name, "Pagination Drop 2");

    await cleanup(productId);
  }

  console.log("\n════════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("════════════════════════════════════════\n");

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Product drop test run crashed:", err);
  process.exit(1);
});
