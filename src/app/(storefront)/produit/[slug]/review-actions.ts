"use server";

import { z } from "zod";
import { createReview } from "@/lib/data/reviews";
import { isDbConfigured } from "@/db";
import {
  CUSTOMER_MESSAGES,
  logAndMask,
  logMisconfiguration,
} from "@/lib/errors/customer-facing";

const schema = z.object({
  productId: z.number(),
  author: z.string().min(1, "Nom requis"),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

export async function submitReviewAction(input: unknown) {
  if (!isDbConfigured) {
    // Infrastructure state is an operator concern, not something a shopper
    // should read.
    logMisconfiguration("Base de données absente : avis clients désactivés");
    return { ok: false, error: CUSTOMER_MESSAGES.reviewFailed };
  }

  // Validation messages come from our own schema, so they are safe to surface:
  // they describe the shopper's input, not our internals.
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Données invalides",
    };
  }

  try {
    await createReview(parsed.data);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: logAndMask("review", err, CUSTOMER_MESSAGES.reviewFailed),
    };
  }
}
