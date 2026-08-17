import "server-only";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { products, productVariants } from "@/db/schema";
import { slugify } from "@/lib/utils/slug";

export interface ProductInput {
  name: string;
  variant: string;
  price: number;
  category: "sneakers" | "vetements";
  color: string;
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
      color: input.color,
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
        stock: input.stockBySize?.[size] ?? 25,
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
      color: input.color,
      image: input.image,
      images: input.images ?? [input.image],
      description: input.description ?? null,
      isNew: input.isNew ?? false,
      isBestSeller: input.isBestSeller ?? false,
      isActive: input.isActive ?? true,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  // Replace variants to reflect the submitted size list.
  await db.delete(productVariants).where(eq(productVariants.productId, id));
  if (input.sizes.length > 0) {
    await db.insert(productVariants).values(
      input.sizes.map((size) => ({
        productId: id,
        size,
        stock: input.stockBySize?.[size] ?? 25,
      }))
    );
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
    .set({ stock })
    .where(eq(productVariants.productId, productId));
}
