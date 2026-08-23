import "server-only";
import { eq, desc, ilike, or, and } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { products, productVariants, type ProductRow, type ProductVariantRow } from "@/db/schema";
import { products as staticProducts, Product } from "@/data/products";
import { slugify } from "@/lib/utils/slug";
import { StoreProduct } from "./types";

// ---- Static fallback ---------------------------------------------------------

function staticToStore(p: Product): StoreProduct {
  return {
    ...p,
    slug: slugify(p.name, p.variant),
    images: p.images && p.images.length > 0 ? p.images : [p.image],
    description: null,
    stockBySize: Object.fromEntries(p.sizes.map((s) => [s, 25])),
    isActive: true,
  };
}

function getStaticProducts(): StoreProduct[] {
  return staticProducts.map(staticToStore);
}

// ---- DB mapping --------------------------------------------------------------

function rowToStore(row: ProductRow, variants: ProductVariantRow[]): StoreProduct {
  const sorted = [...variants].sort((a, b) => a.id - b.id);
  return {
    id: row.id,
    name: row.name,
    variant: row.variant,
    slug: row.slug,
    price: Number(row.price),
    image: row.image,
    images: row.images ?? [row.image],
    description: row.description,
    sizes: sorted.map((v) => v.size),
    category: row.category,
    color: row.color,
    isNew: row.isNew ?? false,
    isBestSeller: row.isBestSeller ?? false,
    isActive: row.isActive ?? true,
    stockBySize: Object.fromEntries(sorted.map((v) => [v.size, v.stock])),
  };
}

async function loadWithVariants(rows: ProductRow[]): Promise<StoreProduct[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const variants = await db
    .select()
    .from(productVariants)
    .where(
      ids.length === 1
        ? eq(productVariants.productId, ids[0])
        : or(...ids.map((id) => eq(productVariants.productId, id)))
    );
  const byProduct = new Map<number, ProductVariantRow[]>();
  for (const v of variants) {
    const list = byProduct.get(v.productId) ?? [];
    list.push(v);
    byProduct.set(v.productId, list);
  }
  return rows.map((r) => rowToStore(r, byProduct.get(r.id) ?? []));
}

// ---- Public read API ---------------------------------------------------------

export async function getProducts(options?: {
  includeInactive?: boolean;
}): Promise<StoreProduct[]> {
  if (!isDbConfigured) return getStaticProducts();

  const rows = await db
    .select()
    .from(products)
    .where(options?.includeInactive ? undefined : eq(products.isActive, true))
    .orderBy(desc(products.createdAt));
  return loadWithVariants(rows);
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  if (!isDbConfigured) {
    return getStaticProducts().find((p) => p.slug === slug) ?? null;
  }
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);
  if (rows.length === 0) return null;
  const [store] = await loadWithVariants(rows);
  return store ?? null;
}

export async function searchProducts(query: string): Promise<StoreProduct[]> {
  const q = query.trim();
  if (!q) return [];
  if (!isDbConfigured) {
    const lower = q.toLowerCase();
    return getStaticProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.variant.toLowerCase().includes(lower) ||
        p.color.toLowerCase().includes(lower)
    );
  }
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.isActive, true),
        or(
          ilike(products.name, `%${q}%`),
          ilike(products.variant, `%${q}%`),
          ilike(products.color, `%${q}%`)
        )
      )
    )
    .orderBy(desc(products.createdAt));
  return loadWithVariants(rows);
}
