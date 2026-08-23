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
import { uploadProductImage, isBlobConfigured } from "@/lib/storage/blob";
import { lookupProductByCode, type LookupResult } from "@/lib/catalog/lookup";
import { requiresGender, requiresSizes } from "@/lib/catalog/taxonomy";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop";

const productSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  variant: z.string().min(1, "Variante requise"),
  price: z.coerce.number().min(0, "Prix invalide"),
  category: z.enum(["sneakers", "vetements", "accessoires"]),
  gender: z.enum(["homme", "femme", "enfant"]).nullable().optional(),
  brand: z.string().optional(),
  productCode: z.string().optional(),
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
    brand: str(formData, "brand") || undefined,
    productCode: str(formData, "productCode") || undefined,
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

  const sizeList = (parsed.sizes ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
    variant: parsed.variant,
    price: parsed.price,
    category: parsed.category,
    gender: needsGender ? parsed.gender ?? null : null,
    brand: parsed.brand ?? null,
    productCode: parsed.productCode ?? null,
    color: parsed.color,
    colorHex: parsed.colorHex ?? null,
    image,
    images: imageList.length > 0 ? imageList : [image],
    description: parsed.description ?? null,
    sizes: needsSizes ? sizeList : [],
    stockBySize: needsSizes ? parseStock(formData.get("stockBySize")) : undefined,
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
  if (!isBlobConfigured()) {
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

// ---- Product code lookup -----------------------------------------------------

export async function lookupProductAction(
  code: string
): Promise<{ ok: boolean; data?: LookupResult; error?: string }> {
  const result = await lookupProductByCode(code);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, data: result.data };
}
