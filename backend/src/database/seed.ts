import { pool } from "../config/db";
import { env } from "../config/env";
import { hashPassword } from "../utils/password";

const fabricImage = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;

const seedCategories = [
  "Wash & Wear",
  "Premium Cotton",
  "Blended Fabric",
  "Boski",
  "Latha",
  "Summer Collection",
  "Winter Collection"
];

const seedFabricTypes = [
  "Wash & Wear Blend",
  "100% Cotton",
  "Cotton-Poly Blend",
  "Boski Silk Blend",
  "Latha Cotton",
  "Lightweight Cotton"
];

const seedColors: { name: string; hex: string }[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#000000" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "Navy", hex: "#1B2A4A" },
  { name: "Cream", hex: "#FAF8F3" },
  { name: "Charcoal", hex: "#1C1C1C" },
  { name: "Olive", hex: "#5C5A2E" },
  { name: "Maroon", hex: "#5C1F2E" },
  { name: "Sand", hex: "#B8945B" },
  { name: "Grey", hex: "#808080" },
  { name: "Brown", hex: "#6B3A2A" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "Teal", hex: "#008080" },
  { name: "Rust", hex: "#B7410E" },
  { name: "Wine", hex: "#722F37" },
  { name: "Mustard", hex: "#FFDB58" },
  { name: "Off White", hex: "#FAFAFA" },
  { name: "Light Grey", hex: "#D3D3D3" },
  { name: "Dark Green", hex: "#006400" }
];

const seedProducts = [
  {
    sku: "NF-WW-001",
    slug: "royal-navy-wash-and-wear",
    name: "Royal Navy Wash & Wear",
    category: "Wash & Wear",
    fabricType: "Wash & Wear Blend",
    description:
      "A refined navy wash and wear fabric engineered for everyday elegance. Soft against the skin, quick to dry, and holds its shape wear after wear.",
    price: 3290,
    originalPrice: 3890,
    images: [
      fabricImage("photo-1594938298603-c8148c4dae35"),
      fabricImage("photo-1520006403909-838d6b92c22e"),
      fabricImage("photo-1618354691792-d1d42acfd860")
    ],
    colors: [
      {
        name: "Navy",
        hex: "#1B2A4A",
        image: fabricImage("photo-1594938298603-c8148c4dae35"),
        images: [fabricImage("photo-1594938298603-c8148c4dae35"), fabricImage("photo-1520006403909-838d6b92c22e")]
      },
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      },
      {
        name: "Olive",
        hex: "#5C5A2E",
        image: fabricImage("photo-1520006403909-838d6b92c22e"),
        images: [fabricImage("photo-1520006403909-838d6b92c22e")]
      }
    ],
    specifications: [
      { label: "Composition", value: "65% Polyester, 35% Cotton" },
      { label: "Weight", value: "180 GSM" },
      { label: "Finish", value: "Matte" }
    ],
    rating: 4.7,
    reviewCount: 128,
    stock: 42,
    featured: true,
    isNew: false
  },
  {
    sku: "NF-PC-002",
    slug: "classic-white-cotton",
    name: "Classic White Cotton",
    category: "Premium Cotton",
    fabricType: "100% Cotton",
    description:
      "Pure white cotton fabric with a crisp hand-feel, perfect for formal shalwar kameez and warm-weather comfort.",
    price: 2890,
    originalPrice: null,
    images: [fabricImage("photo-1618354691373-d851c5c3a990"), fabricImage("photo-1603252109303-2751441dd157")],
    colors: [
      {
        name: "Cream",
        hex: "#FAF8F3",
        image: fabricImage("photo-1603252109303-2751441dd157"),
        images: [fabricImage("photo-1603252109303-2751441dd157")]
      },
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691373-d851c5c3a990"),
        images: [fabricImage("photo-1618354691373-d851c5c3a990")]
      }
    ],
    specifications: [
      { label: "Composition", value: "100% Cotton" },
      { label: "Weight", value: "150 GSM" },
      { label: "Finish", value: "Soft" }
    ],
    rating: 4.5,
    reviewCount: 96,
    stock: 60,
    featured: true,
    isNew: false
  },
  {
    sku: "NF-BF-003",
    slug: "charcoal-grey-blended-fabric",
    name: "Charcoal Grey Blended Fabric",
    category: "Blended Fabric",
    fabricType: "Cotton-Poly Blend",
    description:
      "A versatile charcoal grey blend that transitions effortlessly from office to evening, resisting creases through the day.",
    price: 3150,
    originalPrice: null,
    images: [fabricImage("photo-1618354691792-d1d42acfd860"), fabricImage("photo-1445205170230-053b83016050")],
    colors: [
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      },
      {
        name: "Navy",
        hex: "#1B2A4A",
        image: fabricImage("photo-1594938298603-c8148c4dae35"),
        images: [fabricImage("photo-1594938298603-c8148c4dae35")]
      }
    ],
    specifications: [
      { label: "Composition", value: "55% Cotton, 45% Polyester" },
      { label: "Weight", value: "170 GSM" },
      { label: "Finish", value: "Semi-Matte" }
    ],
    rating: 4.6,
    reviewCount: 74,
    stock: 5,
    featured: false,
    isNew: false
  },
  {
    sku: "NF-WW-004",
    slug: "deep-maroon-formal-wash-and-wear",
    name: "Deep Maroon Formal Wash & Wear",
    category: "Wash & Wear",
    fabricType: "Wash & Wear Blend",
    description:
      "Deep maroon tones bring quiet richness to formal occasions, cut from a wash and wear base that keeps its structure all day.",
    price: 3390,
    originalPrice: 3790,
    images: [fabricImage("photo-1445205170230-053b83016050"), fabricImage("photo-1594938298603-c8148c4dae35")],
    colors: [
      {
        name: "Maroon",
        hex: "#5C1F2E",
        image: fabricImage("photo-1706192048459-77c9fc948ec5"),
        images: [fabricImage("photo-1706192048459-77c9fc948ec5")]
      },
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      }
    ],
    specifications: [
      { label: "Composition", value: "65% Polyester, 35% Cotton" },
      { label: "Weight", value: "185 GSM" },
      { label: "Finish", value: "Matte" }
    ],
    rating: 4.8,
    reviewCount: 152,
    stock: 30,
    featured: true,
    isNew: false
  },
  {
    sku: "NF-PC-005",
    slug: "sand-beige-premium-cotton",
    name: "Sand Beige Premium Cotton",
    category: "Premium Cotton",
    fabricType: "100% Cotton",
    description: "Warm sand beige cotton with a soft drape, suited to both casual weekend wear and relaxed office days.",
    price: 2990,
    originalPrice: null,
    images: [fabricImage("photo-1603252109303-2751441dd157"), fabricImage("photo-1618354691373-d851c5c3a990")],
    colors: [
      {
        name: "Sand",
        hex: "#B8945B",
        image: fabricImage("photo-1686806374120-e7ae3f19801d"),
        images: [fabricImage("photo-1686806374120-e7ae3f19801d")]
      },
      {
        name: "Cream",
        hex: "#FAF8F3",
        image: fabricImage("photo-1603252109303-2751441dd157"),
        images: [fabricImage("photo-1603252109303-2751441dd157")]
      }
    ],
    specifications: [
      { label: "Composition", value: "100% Cotton" },
      { label: "Weight", value: "155 GSM" },
      { label: "Finish", value: "Soft" }
    ],
    rating: 4.4,
    reviewCount: 63,
    stock: 38,
    featured: false,
    isNew: true
  },
  {
    sku: "NF-SC-006",
    slug: "olive-green-summer-fabric",
    name: "Olive Green Summer Fabric",
    category: "Summer Collection",
    fabricType: "Lightweight Cotton",
    description: "Breathable olive green fabric designed for peak summer, light enough for all-day comfort in the heat.",
    price: 2690,
    originalPrice: null,
    images: [fabricImage("photo-1520006403909-838d6b92c22e"), fabricImage("photo-1618354691792-d1d42acfd860")],
    colors: [
      {
        name: "Olive",
        hex: "#5C5A2E",
        image: fabricImage("photo-1520006403909-838d6b92c22e"),
        images: [fabricImage("photo-1520006403909-838d6b92c22e")]
      },
      {
        name: "Sand",
        hex: "#B8945B",
        image: fabricImage("photo-1686806374120-e7ae3f19801d"),
        images: [fabricImage("photo-1686806374120-e7ae3f19801d")]
      }
    ],
    specifications: [
      { label: "Composition", value: "100% Cotton, Lightweight" },
      { label: "Weight", value: "120 GSM" },
      { label: "Finish", value: "Airy" }
    ],
    rating: 4.3,
    reviewCount: 41,
    stock: 55,
    featured: false,
    isNew: true
  },
  {
    sku: "NF-BK-007",
    slug: "midnight-black-boski",
    name: "Midnight Black Boski",
    category: "Boski",
    fabricType: "Boski Silk Blend",
    description: "Midnight black boski with a subtle sheen, cut for evening wear and occasions that call for quiet distinction.",
    price: 4290,
    originalPrice: null,
    images: [fabricImage("photo-1445205170230-053b83016050"), fabricImage("photo-1603252109303-2751441dd157")],
    colors: [
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      },
      {
        name: "Navy",
        hex: "#1B2A4A",
        image: fabricImage("photo-1594938298603-c8148c4dae35"),
        images: [fabricImage("photo-1594938298603-c8148c4dae35")]
      }
    ],
    specifications: [
      { label: "Composition", value: "Boski Silk Blend" },
      { label: "Weight", value: "190 GSM" },
      { label: "Finish", value: "Subtle Sheen" }
    ],
    rating: 4.9,
    reviewCount: 88,
    stock: 18,
    featured: true,
    isNew: false
  },
  {
    sku: "NF-PC-008",
    slug: "steel-blue-cotton",
    name: "Steel Blue Cotton",
    category: "Premium Cotton",
    fabricType: "100% Cotton",
    description: "A cool steel blue cotton fabric that pairs structure with softness, ideal for everyday tailoring.",
    price: 2950,
    originalPrice: null,
    images: [fabricImage("photo-1618354691373-d851c5c3a990"), fabricImage("photo-1594938298603-c8148c4dae35")],
    colors: [
      {
        name: "Steel Blue",
        hex: "#3A5069",
        image: fabricImage("photo-1653580373915-4ddcfa0699eb"),
        images: [fabricImage("photo-1653580373915-4ddcfa0699eb")]
      },
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      }
    ],
    specifications: [
      { label: "Composition", value: "100% Cotton" },
      { label: "Weight", value: "150 GSM" },
      { label: "Finish", value: "Soft" }
    ],
    rating: 4.5,
    reviewCount: 57,
    stock: 0,
    featured: false,
    isNew: false
  },
  {
    sku: "NF-WW-009",
    slug: "pearl-grey-wash-and-wear",
    name: "Pearl Grey Wash & Wear",
    category: "Wash & Wear",
    fabricType: "Wash & Wear Blend",
    description: "Pearl grey wash and wear fabric offering a neutral, versatile base that pairs with any occasion.",
    price: 3190,
    originalPrice: null,
    images: [fabricImage("photo-1520006403909-838d6b92c22e"), fabricImage("photo-1445205170230-053b83016050")],
    colors: [
      {
        name: "Pearl Grey",
        hex: "#9B9B93",
        image: fabricImage("photo-1650406268594-c5d310f6fbce"),
        images: [fabricImage("photo-1650406268594-c5d310f6fbce")]
      },
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      }
    ],
    specifications: [
      { label: "Composition", value: "65% Polyester, 35% Cotton" },
      { label: "Weight", value: "180 GSM" },
      { label: "Finish", value: "Matte" }
    ],
    rating: 4.4,
    reviewCount: 39,
    stock: 27,
    featured: false,
    isNew: false
  },
  {
    sku: "NF-LT-010",
    slug: "cream-latha",
    name: "Cream Latha",
    category: "Latha",
    fabricType: "Latha Cotton",
    description: "Traditional cream latha fabric, valued for its everyday durability and comfortable, breathable weave.",
    price: 1990,
    originalPrice: null,
    images: [fabricImage("photo-1603252109303-2751441dd157"), fabricImage("photo-1618354691792-d1d42acfd860")],
    colors: [
      {
        name: "Cream",
        hex: "#FAF8F3",
        image: fabricImage("photo-1603252109303-2751441dd157"),
        images: [fabricImage("photo-1603252109303-2751441dd157")]
      },
      {
        name: "Sand",
        hex: "#B8945B",
        image: fabricImage("photo-1686806374120-e7ae3f19801d"),
        images: [fabricImage("photo-1686806374120-e7ae3f19801d")]
      }
    ],
    specifications: [
      { label: "Composition", value: "100% Cotton Latha" },
      { label: "Weight", value: "140 GSM" },
      { label: "Finish", value: "Everyday" }
    ],
    rating: 4.2,
    reviewCount: 34,
    stock: 70,
    featured: false,
    isNew: false
  },
  {
    sku: "NF-BF-011",
    slug: "mocha-brown-blended-fabric",
    name: "Mocha Brown Blended Fabric",
    category: "Blended Fabric",
    fabricType: "Cotton-Poly Blend",
    description: "Rich mocha brown blend fabric that balances warmth and versatility, well suited to autumn and winter wear.",
    price: 3090,
    originalPrice: null,
    images: [fabricImage("photo-1594938298603-c8148c4dae35"), fabricImage("photo-1603252109303-2751441dd157")],
    colors: [
      {
        name: "Mocha",
        hex: "#5A4632",
        image: fabricImage("photo-1619732426274-4c7a677cd6af"),
        images: [fabricImage("photo-1619732426274-4c7a677cd6af")]
      },
      {
        name: "Sand",
        hex: "#B8945B",
        image: fabricImage("photo-1686806374120-e7ae3f19801d"),
        images: [fabricImage("photo-1686806374120-e7ae3f19801d")]
      }
    ],
    specifications: [
      { label: "Composition", value: "55% Cotton, 45% Polyester" },
      { label: "Weight", value: "170 GSM" },
      { label: "Finish", value: "Semi-Matte" }
    ],
    rating: 4.3,
    reviewCount: 29,
    stock: 22,
    featured: false,
    isNew: false
  },
  {
    sku: "NF-PC-012",
    slug: "teal-green-premium-cotton",
    name: "Teal Green Premium Cotton",
    category: "Premium Cotton",
    fabricType: "100% Cotton",
    description: "A distinctive teal green cotton fabric for the man who wants his shalwar kameez to stand quietly apart.",
    price: 3050,
    originalPrice: 3350,
    images: [fabricImage("photo-1618354691373-d851c5c3a990"), fabricImage("photo-1520006403909-838d6b92c22e")],
    colors: [
      {
        name: "Teal",
        hex: "#1F4B44",
        image: fabricImage("photo-1520006403909-838d6b92c22e"),
        images: [fabricImage("photo-1520006403909-838d6b92c22e")]
      },
      {
        name: "Charcoal",
        hex: "#1C1C1C",
        image: fabricImage("photo-1618354691792-d1d42acfd860"),
        images: [fabricImage("photo-1618354691792-d1d42acfd860")]
      }
    ],
    specifications: [
      { label: "Composition", value: "100% Cotton" },
      { label: "Weight", value: "155 GSM" },
      { label: "Finish", value: "Soft" }
    ],
    rating: 4.6,
    reviewCount: 47,
    stock: 33,
    featured: true,
    isNew: true
  }
];

const availableLengths = ["4 meters", "4.5 meters", "5 meters"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function seedCollections(): Promise<void> {
  const collectionsData = [
    {
      name: "New Arrival",
      slug: "new-arrival",
      description: "The latest fabrics added to our collection.",
      displayOrder: 0,
      options: [
        { name: "Cotton", slug: "cotton", displayOrder: 0 },
        { name: "Wash & Wear", slug: "wash-wear", displayOrder: 1 },
        { name: "Blended Fabric", slug: "blended-fabric", displayOrder: 2 },
        { name: "Boski", slug: "boski", displayOrder: 3 },
        { name: "Latha", slug: "latha", displayOrder: 4 }
      ]
    },
    {
      name: "Summer Collection",
      slug: "summer-collection",
      description: "Lightweight fabrics perfect for the summer season.",
      displayOrder: 1,
      options: [
        { name: "Cotton", slug: "cotton", displayOrder: 0 },
        { name: "Wash & Wear", slug: "wash-wear", displayOrder: 1 },
        { name: "Blended Fabric", slug: "blended-fabric", displayOrder: 2 },
        { name: "Boski", slug: "boski", displayOrder: 3 },
        { name: "Latha", slug: "latha", displayOrder: 4 }
      ]
    },
    {
      name: "Winter Collection",
      slug: "winter-collection",
      description: "Warm and cozy fabrics for the winter season.",
      displayOrder: 2,
      options: [
        { name: "Wash & Wear", slug: "wash-wear", displayOrder: 0 },
        { name: "Blended Fabric", slug: "blended-fabric", displayOrder: 1 },
        { name: "Boski", slug: "boski", displayOrder: 2 },
        { name: "Latha", slug: "latha", displayOrder: 3 }
      ]
    }
  ];

  for (const collection of collectionsData) {
    const existing = await pool.query("SELECT id FROM collections WHERE slug = $1", [collection.slug]);
    let collectionId: string;

    if (existing.rowCount && existing.rowCount > 0) {
      collectionId = existing.rows[0].id;
      console.log(`Collection "${collection.name}" already exists, skipping.`);
    } else {
      const result = await pool.query(
        `INSERT INTO collections (name, slug, description, display_order, is_enabled)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [collection.name, collection.slug, collection.description, collection.displayOrder]
      );
      collectionId = result.rows[0].id;
      console.log(`Created collection "${collection.name}"`);
    }

    for (const option of collection.options) {
      const existingOption = await pool.query(
        "SELECT id FROM collection_options WHERE collection_id = $1 AND slug = $2",
        [collectionId, option.slug]
      );
      if (existingOption.rowCount && existingOption.rowCount > 0) {
        continue;
      }
      await pool.query(
        `INSERT INTO collection_options (collection_id, name, slug, display_order, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [collectionId, option.name, option.slug, option.displayOrder]
      );
    }
    console.log(`  -> Options ensured for "${collection.name}"`);
  }
}

async function seedCatalogTables(): Promise<void> {

  for (const name of seedCategories) {
    const slug = slugify(name);
    await pool.query(
      `INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [name, slug]
    );
  }
  console.log(`Seeded ${seedCategories.length} categories (skipping duplicates).`);

  for (const name of seedFabricTypes) {
    const slug = slugify(name);
    await pool.query(
      `INSERT INTO fabric_types (name, slug) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [name, slug]
    );
  }
  console.log(`Seeded ${seedFabricTypes.length} fabric types (skipping duplicates).`);

  for (const color of seedColors) {
    await pool.query(
      `INSERT INTO colors (name, hex) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
      [color.name, color.hex.toUpperCase()]
    );
  }
  console.log(`Seeded ${seedColors.length} colors (skipping duplicates).`);
}

async function seed(): Promise<void> {
  console.log("Seeding database...");

  const existingAdmin = await pool.query("SELECT id FROM users WHERE email = $1", [env.adminSeedEmail]);
  if (existingAdmin.rowCount === 0) {
    const passwordHash = await hashPassword(env.adminSeedPassword);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
      [env.adminSeedName, env.adminSeedEmail, passwordHash]
    );
    console.log(`Admin user created: ${env.adminSeedEmail}`);
  } else {
    console.log("Admin user already exists, skipping.");
  }

  await seedCatalogTables();

  await seedCollections();

  for (const product of seedProducts) {
    const existing = await pool.query("SELECT id FROM products WHERE sku = $1", [product.sku]);
    if (existing.rowCount && existing.rowCount > 0) continue;

    await pool.query(
      `INSERT INTO products
        (sku, slug, name, category, fabric_type, description, price, original_price,
         images, colors, available_lengths, specifications, rating, review_count, stock, featured, is_new)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
      [
        product.sku,
        product.slug,
        product.name,
        product.category,
        product.fabricType,
        product.description,
        product.price,
        product.originalPrice,
        JSON.stringify(product.images),
        JSON.stringify(product.colors),
        JSON.stringify(availableLengths),
        JSON.stringify(product.specifications),
        product.rating,
        product.reviewCount,
        product.stock,
        product.featured,
        product.isNew
      ]
    );
  }
  console.log(`Seeded ${seedProducts.length} products (skipping duplicates).`);

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
