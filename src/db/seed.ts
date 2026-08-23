import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { products as seedProducts } from "../data/products";

function slugify(name: string, variant: string): string {
  return `${name}-${variant}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL / DIRECT_URL is not set. Aborting.");
    process.exit(1);
  }
  const client = postgres(url, { max: 1 });
  const db = drizzle(client, { schema });

  console.log("Seeding products...");
  for (const p of seedProducts) {
    const [inserted] = await db
      .insert(schema.products)
      .values({
        name: p.name,
        variant: p.variant,
        slug: slugify(p.name, p.variant),
        price: String(p.price),
        category: p.category,
        color: p.color,
        image: p.image,
        images: p.images && p.images.length > 0 ? p.images : [p.image],
        isNew: p.isNew ?? false,
        isBestSeller: p.isBestSeller ?? false,
        isActive: true,
      })
      .onConflictDoNothing({ target: schema.products.slug })
      .returning();

    if (inserted) {
      await db.insert(schema.productVariants).values(
        p.sizes.map((size) => ({
          productId: inserted.id,
          size,
          stock: 25,
        }))
      );
    }
  }

  // A sample promo code.
  await db
    .insert(schema.promotions)
    .values({
      code: "BIENVENUE10",
      type: "percentage",
      value: "10",
      minSubtotal: "0",
      active: true,
    })
    .onConflictDoNothing({ target: schema.promotions.code });

  console.log("Seed complete.");
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
