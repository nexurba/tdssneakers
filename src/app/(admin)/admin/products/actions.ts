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
  image: z.string().url("URL image invalide").or(z.literal("")),
  description: z.string().optional(),
  sizes: z.string().min(1, "Au moins une taille"),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
});

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
    image: formData.get("image") || "",
    description: formData.get("description") || undefined,
    sizes: formData.get("sizes"),
    isNew: formData.get("isNew") === "on" || formData.get("isNew") === "true",
    isBestSeller:
      formData.get("isBestSeller") === "on" ||
      formData.get("isBestSeller") === "true",
  };
  const parsed = productSchema.parse(raw);
  return {
    name: parsed.name,
    variant: parsed.variant,
    price: parsed.price,
    category: parsed.category,
    color: parsed.color,
    image:
      parsed.image ||
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=600&fit=crop",
    description: parsed.description ?? null,
    sizes: parsed.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    isNew: parsed.isNew,
    isBestSeller: parsed.isBestSeller,
    isActive: true,
  };
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


