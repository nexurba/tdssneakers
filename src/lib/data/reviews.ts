import "server-only";
import { eq, and, desc } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { reviews } from "@/db/schema";

export interface ReviewData {
  id: number;
  author: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
}

export async function getApprovedReviews(
  productId: number
): Promise<ReviewData[]> {
  if (!isDbConfigured) return [];
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt));
  return rows.map((r) => ({
    id: r.id,
    author: r.author,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt.toISOString().slice(0, 10),
  }));
}

export function averageRating(list: ReviewData[]): number {
  if (list.length === 0) return 0;
  return Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) / 10;
}

export async function createReview(input: {
  productId: number;
  author: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<void> {
  if (!isDbConfigured) {
    throw new Error("Base de données non configurée.");
  }
  await db.insert(reviews).values({
    productId: input.productId,
    author: input.author,
    rating: Math.max(1, Math.min(5, input.rating)),
    title: input.title ?? null,
    body: input.body ?? null,
    approved: false, // Pending admin moderation.
  });
}
