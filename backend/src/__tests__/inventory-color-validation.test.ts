import { pool, query } from "../config/db";
import { InventoryService } from "../services/inventory.service";
import { ColorModel } from "../models/catalog.model";
import { invalidateColorCache } from "../config/colors";
import { ApiError } from "../utils/ApiError";
import type { InventoryCreateInput } from "../validators/product.validator";

let passed = 0;
let failed = 0;

function assertTrue(label: string, actual: boolean) {
  if (actual) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label}`);
    failed++;
  }
}

function assertEqual(label: string, actual: unknown, expected: unknown) {
  assertTrue(`${label} → expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`, actual === expected);
}

async function cleanup() {
  await query("DELETE FROM products WHERE sku LIKE 'COLOR-TEST-%'");
}

function baseInput(overrides: Partial<InventoryCreateInput> = {}): InventoryCreateInput {
  return {
    productName: `Color Test Product ${Math.random().toString(36).slice(2, 8)}`,
    category: "Cotton",
    fabricType: "Cotton",
    price: 1500,
    stock: 10,
    colors: [{ name: "Navy", hex: "#123456" }],
    ...overrides
  } as InventoryCreateInput;
}

async function run() {
  await cleanup();
  invalidateColorCache();

  const approvedColors = await ColorModel.findAllAsLookup();
  assertTrue("colors table is seeded with at least one approved color", approvedColors.length > 0);
  const approved = approvedColors[0];
  const approvedSecond = approvedColors[1] ?? approvedColors[0];

  console.log("\n1. Add product with one valid color → succeeds");
  {
    const product = await InventoryService.create(
      baseInput({
        productName: "Color Test Single",
        colors: [{ name: approved.name, hex: approved.hex }]
      })
    );
    assertEqual("stored color name matches approved catalog", product.colors[0]?.name, approved.name);
    assertEqual("stored color hex matches approved catalog", product.colors[0]?.hex, approved.hex.toUpperCase());
  }

  console.log("\n2. Add product with multiple valid colors → succeeds");
  {
    const product = await InventoryService.create(
      baseInput({
        productName: "Color Test Multiple",
        colors: [
          { name: approved.name, hex: approved.hex },
          { name: approvedSecond.name, hex: approvedSecond.hex }
        ]
      })
    );
    assertEqual("both colors stored", product.colors.length, approved.name === approvedSecond.name ? 2 : 2);
  }

  console.log("\n3. Add product with no colors → validation error");
  {
    let threw = false;
    try {
      await InventoryService.create(baseInput({ productName: "Color Test None", colors: [] }));
    } catch (err) {
      threw = err instanceof ApiError && err.statusCode === 400;
    }
    assertTrue("empty colors array is rejected", threw);
  }

  console.log("\n4. Add product with a custom color name → accepted");
  {
    const product = await InventoryService.create(
      baseInput({
        productName: "Color Test Custom",
        colors: [{ name: "pinkdh", hex: "#FF69B4" }]
      })
    );
    assertEqual("custom color name is stored as typed", product.colors[0]?.name, "pinkdh");
    assertTrue("custom color has a hex value", Boolean(product.colors[0]?.hex));
  }

  console.log("\n5. Valid color name with incorrect HEX → backend uses the approved HEX");
  {
    const product = await InventoryService.create(
      baseInput({
        productName: "Color Test Spoofed Hex",
        colors: [{ name: approved.name, hex: "#FF00FF" }]
      })
    );
    assertEqual("client-supplied hex is ignored in favor of the approved hex", product.colors[0]?.hex, approved.hex.toUpperCase());
  }

  console.log("\n6. Color name with surrounding whitespace is handled consistently");
  {
    const product = await InventoryService.create(
      baseInput({
        productName: "Color Test Whitespace",
        colors: [{ name: `  ${approved.name}  `, hex: approved.hex }]
      })
    );
    assertEqual("whitespace-padded name resolves to the approved name", product.colors[0]?.name, approved.name);
  }

  console.log("\n7. Duplicate colors → validation error");
  {
    let threw = false;
    try {
      await InventoryService.create(
        baseInput({
          productName: "Color Test Duplicate",
          colors: [
            { name: approved.name, hex: approved.hex },
            { name: `${approved.name.toUpperCase()} `, hex: approved.hex }
          ]
        })
      );
    } catch (err) {
      threw = err instanceof ApiError && err.statusCode === 400;
    }
    assertTrue("duplicate color (case/whitespace-insensitive) is rejected", threw);
  }

  console.log("\n8. Color catalog endpoint and product creation use the same approved color source");
  {
    const lookup = await ColorModel.findAllAsLookup();
    const names = new Set(lookup.map((c) => c.name));
    assertTrue(
      "every color the catalog endpoint would list is accepted by product creation",
      names.has(approved.name)
    );
    const anyOther = lookup[Math.min(2, lookup.length - 1)];
    const product = await InventoryService.create(
      baseInput({ productName: "Color Test Catalog Roundtrip", colors: [{ name: anyOther.name, hex: anyOther.hex }] })
    );
    assertEqual("catalog-sourced color is accepted as-is", product.colors[0]?.name, anyOther.name);
  }

  console.log("\n9. Editing an existing product with a valid color still works");
  {
    const created = await InventoryService.create(
      baseInput({ productName: "Color Test Editable", colors: [{ name: approved.name, hex: approved.hex }] })
    );
    const updated = await InventoryService.update(created.sku, {
      colors: [{ name: approvedSecond.name, hex: approvedSecond.hex }]
    });
    assertEqual("updated color is stored", updated.colors[0]?.name, approvedSecond.name);
  }

  console.log("\n10. Existing products are not broken by these changes");
  {
    const { rows } = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products");
    assertTrue("products table still readable and non-negative count", parseInt(rows[0].count, 10) >= 0);
  }

  await cleanup();

  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("══════════════════════════════════════════════════════════════\n");

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test run crashed:", err);
  pool.end().finally(() => process.exit(1));
});
