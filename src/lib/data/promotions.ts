import "server-only";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { promotions } from "@/db/schema";

export interface AppliedPromo {
  code: string;
  discount: number;
}

/**
 * Validate a promo code against a subtotal and return the discount amount.
 * Returns null if invalid/expired/not applicable.
 */
export async function validatePromo(
  code: string,
  subtotal: number
): Promise<AppliedPromo | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  if (!isDbConfigured) {
    // Fallback demo code so the flow is testable without a DB.
    if (normalized === "BIENVENUE10") {
      return { code: normalized, discount: Math.round(subtotal * 0.1 * 100) / 100 };
    }
    return null;
  }

  const rows = await db
    .select()
    .from(promotions)
    .where(eq(promotions.code, normalized))
    .limit(1);
  const promo = rows[0];
  if (!promo || !promo.active) return null;
  if (promo.expiresAt && promo.expiresAt < new Date()) return null;
  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) return null;
  if (subtotal < Number(promo.minSubtotal ?? 0)) return null;

  const discount =
    promo.type === "percentage"
      ? (subtotal * Number(promo.value)) / 100
      : Number(promo.value);

  return {
    code: normalized,
    discount: Math.round(Math.min(discount, subtotal) * 100) / 100,
  };
}

export async function incrementPromoUsage(code: string): Promise<void> {
  if (!isDbConfigured) return;
  const normalized = code.trim().toUpperCase();
  const rows = await db
    .select()
    .from(promotions)
    .where(eq(promotions.code, normalized))
    .limit(1);
  if (rows[0]) {
    await db
      .update(promotions)
      .set({ usageCount: rows[0].usageCount + 1 })
      .where(eq(promotions.id, rows[0].id));
  }
}
