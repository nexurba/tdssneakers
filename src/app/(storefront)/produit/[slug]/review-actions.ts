"use server";

import { z } from "zod";
import { createReview } from "@/lib/data/reviews";
import { isDbConfigured } from "@/db";

const schema = z.object({
  productId: z.number(),
  author: z.string().min(1, "Nom requis"),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

export async function submitReviewAction(input: unknown) {
  if (!isDbConfigured) {
    return { ok: false, error: "Base de données non configurée." };
  }
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  try {
    await createReview(parsed.data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
