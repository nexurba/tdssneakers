import "server-only";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { promotions } from "@/db/schema";

export interface PublicPromo {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal: number;
  expiresAt: string | null;
}

/** Active, non-expired promo codes for display on the storefront. */
export async function getActivePromotions(): Promise<PublicPromo[]> {
  if (!isDbConfigured) {
    return [
      { code: "BIENVENUE10", type: "percentage", value: 10, minSubtotal: 0, expiresAt: null },
    ];
  }

  const rows = await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.active, true),
        or(isNull(promotions.expiresAt), gt(promotions.expiresAt, new Date()))
      )
    );

  return rows
    // Hide codes that have hit their usage cap.
    .filter((p) => p.usageLimit === null || p.usageCount < p.usageLimit)
    .map((p) => ({
      code: p.code,
      type: p.type,
      value: Number(p.value),
      minSubtotal: Number(p.minSubtotal ?? 0),
      expiresAt: p.expiresAt ? p.expiresAt.toISOString().slice(0, 10) : null,
    }));
}
