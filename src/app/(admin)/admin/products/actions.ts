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

const productSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  variant: z.string().min(1, "Variante requise"),
  price: z.coerce.number().min(0, "Prix invalide"),
  category: z.enum(["sneakers", "vetements"]),
  color: z.string().min(1, "Couleur requise"),
  images: z.string().optional(),
  description: z.string().optional(),
  sizes: z.string().min(1, "Au moins une taille"),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function parseInput(formData: FormData): ProductInput {
  const raw = {
    name: formData.get("name"),
    variant: formData.get("variant"),
    price: formData.get("price"),
    category: formData.get("category"),
    color: formData.get("color"),
    images: formData.get("images") || "",
    description: formData.get("description") || undefined,
    sizes: formData.get("sizes"),
    isNew: formData.get("isNew") === "on" || formData.get("isNew") === "true",
    isBestSeller:
      formData.get("isBestSeller") === "on" ||
      formData.get("isBestSeller") === "true",
  };
  const parsed = productSchema.parse(raw);

  // Accept one image URL per line (or comma-separated).
  const imageList = (parsed.images ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const image = imageList[0] || FALLBACK_IMAGE;

  return {
    name: parsed.name,
    variant: parsed.variant,
    price: parsed.price,
    category: parsed.category,
    color: parsed.color,
    image,
    images: imageList.length > 0 ? imageList : [image],
    description: parsed.description ?? null,
    sizes: parsed.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    stockBySize: parseStock(formData.get("stockBySize")),
    isNew: parsed.isNew,
    isBestSeller: parsed.isBestSeller,
    isActive: true,
  };
}

function parseStock(
  raw: FormDataEntryValue | null
): Record<string, number> | undefined {
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

export async function createProductAction(
  formData: FormData
): Promise<ActionResult> {
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée (DATABASE_URL manquant)." };
  }
  try {
    await createProduct(parseInput(formData));
    revalidatePath("/admin/products");
    revalidatePath("/boutique");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
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
    revalidatePath("/admin/products");
    revalidatePath("/boutique");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée (DATABASE_URL manquant)." };
  }
  try {
    await deleteProduct(id);
    revalidatePath("/admin/products");
    revalidatePath("/boutique");
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}


