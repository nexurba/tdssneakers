import "server-only";
import { eq, and } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { products, productVariants } from "@/db/schema";
import { slugify } from "@/lib/utils/slug";

export interface ProductInput {
  name: string;
  variant: string;
  price: number;
  category: "sneakers" | "vetements" | "accessoires";
  gender?: "homme" | "femme" | "enfant" | "unisex" | null;
  sizeScale?: "men" | "women" | null;
  brand?: string | null;
  productCode?: string | null;
  color: string;
  colorHex?: string | null;
  image: string;
  images?: string[];
  description?: string | null;
  sizes: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isActive?: boolean;
  stockBySize?: Record<string, number>;
}

function assertDb() {
  if (!isDbConfigured) {
    throw new Error(
      "Base de données non configurée. Renseignez DATABASE_URL dans .env.local pour activer l'écriture."
    );
  }
}

export async function createProduct(input: ProductInput): Promise<number> {
  assertDb();
  const [row] = await db
    .insert(products)
    .values({
      name: input.name,
      variant: input.variant,
      slug: slugify(input.name, input.variant, Date.now().toString(36)),
      price: String(input.price),
      category: input.category,
      gender: input.gender ?? null,
      sizeScale: input.sizeScale ?? null,
      brand: input.brand ?? null,
      productCode: input.productCode ?? null,
      color: input.color,
      colorHex: input.colorHex ?? null,
      image: input.image,
      images: input.images ?? [input.image],
      description: input.description ?? null,
      isNew: input.isNew ?? false,
      isBestSeller: input.isBestSeller ?? false,
      isActive: input.isActive ?? true,
    })
    .returning();

  if (input.sizes.length > 0) {
    await db.insert(productVariants).values(
      input.sizes.map((size) => ({
        productId: row.id,
        size,
        stock: input.stockBySize?.[size] ?? 1,
      }))
    );
  }
  return row.id;
}

export async function updateProduct(
  id: number,
  input: ProductInput
): Promise<void> {
  assertDb();
  await db
    .update(products)
    .set({
      name: input.name,
      variant: input.variant,
      price: String(input.price),
      category: input.category,
      gender: input.gender ?? null,
      sizeScale: input.sizeScale ?? null,
      brand: input.brand ?? null,
      productCode: input.productCode ?? null,
      color: input.color,
      colorHex: input.colorHex ?? null,
      image: input.image,
      images: input.images ?? [input.image],
      description: input.description ?? null,
      isNew: input.isNew ?? false,
      isBestSeller: input.isBestSeller ?? false,
      isActive: input.isActive ?? true,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  // Reconcile variants with the submitted size list, preserving existing stock.
  const existing = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id));
  const existingBySize = new Map(existing.map((v) => [v.size, v]));
  const desired = new Set(input.sizes);

  // Remove sizes that are no longer offered.
  const toRemove = existing.filter((v) => !desired.has(v.size));
  for (const v of toRemove) {
    await db.delete(productVariants).where(eq(productVariants.id, v.id));
  }

  // Add new sizes (keep existing ones untouched to preserve their stock).
  const toAdd = input.sizes.filter((s) => !existingBySize.has(s));
  if (toAdd.length > 0) {
    await db.insert(productVariants).values(
      toAdd.map((size) => ({
        productId: id,
        size,
        stock: input.stockBySize?.[size] ?? 1,
      }))
    );
  }

  // Apply explicit stock overrides when provided.
  if (input.stockBySize) {
    for (const [size, stock] of Object.entries(input.stockBySize)) {
      if (existingBySize.has(size)) {
        await db
          .update(productVariants)
          .set({ stock })
          .where(
            and(
              eq(productVariants.productId, id),
              eq(productVariants.size, size)
            )
          );
      }
    }
  }
}

export async function deleteProduct(id: number): Promise<void> {
  assertDb();
  await db.delete(products).where(eq(products.id, id));
}

export async function setVariantStock(
  productId: number,
  size: string,
  stock: number
): Promise<void> {
  assertDb();
  await db
    .update(productVariants)
    .set({ stock: Math.max(0, stock) })
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.size, size)
      )
    );
}
