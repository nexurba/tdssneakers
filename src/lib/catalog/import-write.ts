import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { createProduct, updateProduct } from "@/lib/data/products-admin";
import { uploadProductImage } from "@/lib/storage/blob";
import type { ImportRow } from "./product-import";

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop";

/** What to do when a row's product code already exists. */
export type DuplicateMode = "skip" | "update";

export interface ImportOutcome {
  ok: boolean;
  productId?: number;
  outcome?: "created" | "updated" | "skipped";
  /** How many images were successfully stored. */
  imageCount?: number;
  warnings: string[];
  error?: string;
}

export async function findProductIdByCode(code: string): Promise<number | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const found = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.productCode, trimmed))
    .limit(1);
  return found[0]?.id ?? null;
}

/**
 * Writes one validated row to the catalogue, uploading its images first.
 *
 * Kept out of the Server Action so it can be exercised directly against the
 * database. The caller is responsible for authorisation and for having already
 * validated `row` — `row.errors` must be empty.
 */
export async function importOneRow({
  row,
  files,
  imageUrls,
  mode,
}: {
  row: ImportRow;
  /**
   * Raw files, only used by the development fallback. In production images are
   * uploaded from the browser and arrive as `imageUrls`, because Vercel caps a
   * function request body at 4.5 MB.
   */
  files?: File[];
  /** Already-hosted image URLs, in gallery order. */
  imageUrls?: string[];
  mode: DuplicateMode;
}): Promise<ImportOutcome> {
  const warnings = [...row.warnings];

  let existingId: number | null = null;
  try {
    existingId = await findProductIdByCode(row.productCode);
  } catch {
    // Treated as "not found"; a genuine conflict surfaces on write.
  }

  if (existingId !== null && mode === "skip") {
    return {
      ok: true,
      productId: existingId,
      outcome: "skipped",
      warnings: [
        ...warnings,
        `code produit « ${row.productCode} » déjà présent — ligne ignorée`,
      ],
    };
  }

  // Browser-uploaded URLs are the normal path; raw files only appear in the
  // development fallback where Blob is not configured.
  const urls: string[] = [...(imageUrls ?? [])];
  for (const file of files ?? []) {
    const result = await uploadProductImage(file);
    if (result.ok) urls.push(result.url);
    else warnings.push(result.error);
  }

  if (urls.length === 0) {
    warnings.push("aucune image importée — image par défaut utilisée");
  }
  const images = urls.length > 0 ? urls : [FALLBACK_IMAGE];

  const input = {
    name: row.name,
    // The product code doubles as the variant identifier, as in the single
    // product form.
    variant: row.productCode,
    price: row.price,
    category: row.category,
    gender: row.gender,
    sizeScale: row.gender === "unisex" ? row.sizeScale : null,
    brand: row.brand,
    productCode: row.productCode,
    color: row.color,
    colorHex: row.colorHex,
    image: images[0],
    images,
    description: row.description,
    sizes: row.sizes,
    stockBySize: row.stockBySize ?? undefined,
    isNew: row.isNew,
    isBestSeller: row.isBestSeller,
    isActive: row.isActive,
  };

  try {
    if (existingId !== null) {
      await updateProduct(existingId, input);
      return {
        ok: true,
        productId: existingId,
        outcome: "updated",
        imageCount: urls.length,
        warnings,
      };
    }
    const id = await createProduct(input);
    return {
      ok: true,
      productId: id,
      outcome: "created",
      imageCount: urls.length,
      warnings,
    };
  } catch (err) {
    return { ok: false, warnings, error: (err as Error).message };
  }
}
