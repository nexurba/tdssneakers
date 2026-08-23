"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductInput,
} from "@/lib/data/products-admin";
import { isDbConfigured } from "@/db";
import { assertAdmin } from "@/lib/auth/admin";
import { uploadProductImage, isUploadAvailable } from "@/lib/storage/blob";
import { requiresGender, requiresSizes, ONE_SIZE } from "@/lib/catalog/taxonomy";
import {
  toCanonicalSizes,
  toSizePair,
  type SizeScale,
} from "@/lib/catalog/size-conversion";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop";

const productSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  variant: z.string().optional(),
  price: z.coerce.number().min(0, "Prix invalide"),
  category: z.enum(["sneakers", "vetements", "accessoires"]),
  gender: z.enum(["homme", "femme", "enfant", "unisex"]).nullable().optional(),
  sizeScale: z.enum(["men", "women"]).optional(),
  brand: z.string().optional(),
  productCode: z.string().min(1, "Code produit requis"),
  color: z.string().min(1, "Couleur requise"),
  colorHex: z.string().optional(),
  images: z.string().optional(),
  description: z.string().optional(),
  sizes: z.string().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

function bool(fd: FormData, key: string): boolean {
  const v = str(fd, key);
  return v === "true" || v === "on";
}

/** Single quantity for categories without sizes. Defaults to 1. */
function parseQuantity(raw: FormDataEntryValue | null): number {
  if (typeof raw !== "string" || raw.trim() === "") return 1;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 1;
}

function parseStock(raw: FormDataEntryValue | null): Record<string, number> | undefined {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, number> = {};
    for (const [size, value] of Object.entries(obj)) {
      const n = Number(value);
      if (Number.isFinite(n)) out[size] = Math.max(0, Math.trunc(n));
    }
    return Object.keys(out).length > 0 ? out : undefined;
  } catch {
    return undefined;
  }
}

function parseInput(formData: FormData): ProductInput {
  const genderRaw = str(formData, "gender");
  const parsed = productSchema.parse({
    name: str(formData, "name"),
    variant: str(formData, "variant"),
    price: str(formData, "price"),
    category: str(formData, "category"),
    gender: genderRaw === "" ? null : genderRaw,
    sizeScale: str(formData, "sizeScale") || undefined,
    brand: str(formData, "brand") || undefined,
    productCode: str(formData, "productCode"),
    color: str(formData, "color"),
    colorHex: str(formData, "colorHex") || undefined,
    images: str(formData, "images"),
    description: str(formData, "description") || undefined,
    sizes: str(formData, "sizes"),
    isNew: bool(formData, "isNew"),
    isBestSeller: bool(formData, "isBestSeller"),
  });

  // One image URL per line (or comma-separated).
  const imageList = (parsed.images ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const image = imageList[0] || FALLBACK_IMAGE;

  const rawSizes = (parsed.sizes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isUnisex = parsed.gender === "unisex";
  const scale: SizeScale = parsed.sizeScale ?? "men";

  // Unisex sizes are stored on the canonical men's scale so one product can
  // be displayed on both scales; women's-scale input is converted here.
  const sizeList = isUnisex
    ? toCanonicalSizes(parsed.category, scale, rawSizes)
    : rawSizes;

  // Re-key the quantity map onto the canonical sizes.
  const rawStock = parseStock(formData.get("stockBySize"));
  const stockBySize =
    isUnisex && rawStock
      ? Object.fromEntries(
          Object.entries(rawStock).map(([size, qty]) => {
            const pair = toSizePair(parsed.category, scale, size);
            return [pair ? pair.men : size, qty];
          })
        )
      : rawStock;

  // Enforce taxonomy rules server-side: accessories carry no gender/sizes.
  const needsGender = requiresGender(parsed.category);
  const needsSizes = requiresSizes(parsed.category);

  if (needsGender && !parsed.gender) {
    throw new Error("Genre requis pour cette catégorie.");
  }
  if (needsSizes && sizeList.length === 0) {
    throw new Error("Au moins une taille est requise pour cette catégorie.");
  }

  return {
    name: parsed.name,
    // The product code doubles as the variant identifier.
    variant: (parsed.variant && parsed.variant.trim()) || parsed.productCode,
    price: parsed.price,
    category: parsed.category,
    gender: needsGender ? parsed.gender ?? null : null,
    sizeScale: needsSizes && isUnisex ? scale : null,
    brand: parsed.brand ?? null,
    productCode: parsed.productCode ?? null,
    color: parsed.color,
    colorHex: parsed.colorHex ?? null,
    image,
    images: imageList.length > 0 ? imageList : [image],
    description: parsed.description ?? null,
    // Accessories carry a single one-size variant so they still have a
    // quantity, appear in stock filtering, and can be added to the cart.
    sizes: needsSizes ? sizeList : [ONE_SIZE],
    stockBySize: needsSizes
      ? stockBySize
      : { [ONE_SIZE]: parseQuantity(formData.get("quantity")) },
    isNew: parsed.isNew,
    isBestSeller: parsed.isBestSeller,
    isActive: true,
  };
}

function refresh() {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/boutique");
  revalidatePath("/");
}

function toMessage(err: unknown): string {
  if (err instanceof z.ZodError) {
    return err.issues[0]?.message ?? "Données invalides";
  }
  return (err as Error).message ?? "Erreur";
}

export async function createProductAction(
  formData: FormData
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée (DATABASE_URL manquant)." };
  }
  try {
    await createProduct(parseInput(formData));
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function updateProductAction(
  id: number,
  formData: FormData
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée (DATABASE_URL manquant)." };
  }
  try {
    await updateProduct(id, parseInput(formData));
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée (DATABASE_URL manquant)." };
  }
  try {
    await deleteProduct(id);
    refresh();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err) };
  }
}

// ---- Media upload ------------------------------------------------------------

export async function uploadImagesAction(
  formData: FormData
): Promise<{ ok: boolean; urls: string[]; error?: string }> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, urls: [], error: denied.error };
  if (!isUploadAvailable()) {
    return {
      ok: false,
      urls: [],
      error:
        "Stockage d'images non configuré (BLOB_READ_WRITE_TOKEN). Vous pouvez coller des URLs d'images à la place.",
    };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return { ok: false, urls: [], error: "Aucun fichier reçu." };
  }

  const urls: string[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const result = await uploadProductImage(file);
    if (result.ok) urls.push(result.url);
    else errors.push(`${file.name}: ${result.error}`);
  }

  if (urls.length === 0) {
    return { ok: false, urls: [], error: errors.join(" · ") };
  }
  return {
    ok: true,
    urls,
    error: errors.length > 0 ? errors.join(" · ") : undefined,
  };
}


