import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { productVariants } from "@/db/schema";

/**
 * Decrement stock for a product/size pair. Never goes below zero.
 */
export async function decrementStock(
  productId: number,
  size: string,
  quantity: number
): Promise<void> {
  if (!isDbConfigured) return;
  await db
    .update(productVariants)
    .set({ stock: sql`GREATEST(0, ${productVariants.stock} - ${quantity})` })
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.size, size)
      )
    );
}

export async function setStock(
  productId: number,
  size: string,
  stock: number
): Promise<void> {
  if (!isDbConfigured) return;
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
