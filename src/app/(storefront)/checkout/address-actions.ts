"use server";

import { z } from "zod";
import { geoCaProvider, verifyAddress } from "@/lib/geo/geo-ca";
import type { AddressSuggestion } from "@/lib/geo/types";

/**
 * Address lookup for the checkout form.
 *
 * Proxied through a Server Action rather than called from the browser so the
 * provider can be swapped (geo.ca today, Canada Post later) without touching
 * the client, and so we can rate-limit our use of a free public service.
 */

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  lang: z.enum(["fr", "en"]).optional(),
});

const verifySchema = z.object({
  line1: z.string().min(1).max(200),
  city: z.string().min(1).max(120),
  province: z.string().min(2).max(60),
});

/**
 * Naive fixed-window limiter, keyed per server instance.
 *
 * geo.ca is free and asks that bulk use be arranged with them, so this exists to
 * stop a stuck autocomplete loop or a scripted client from hammering it. It is
 * per-instance and therefore approximate — good enough for that purpose, and not
 * a security control.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
let windowStart = Date.now();
let windowCount = 0;

function overRateLimit(): boolean {
  const now = Date.now();
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    windowCount = 0;
  }
  windowCount += 1;
  return windowCount > MAX_PER_WINDOW;
}

export interface AddressSearchResult {
  ok: boolean;
  suggestions: AddressSuggestion[];
  /** Customer-safe note when lookup is unavailable; manual entry still works. */
  note?: string;
}

const UNAVAILABLE_NOTE =
  "La vérification d'adresse est momentanément indisponible. Vous pouvez saisir votre adresse manuellement.";

export async function searchAddressAction(
  input: unknown
): Promise<AddressSearchResult> {
  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) return { ok: true, suggestions: [] };

  if (overRateLimit()) {
    console.warn("[geo] address search rate limit reached");
    return { ok: false, suggestions: [], note: UNAVAILABLE_NOTE };
  }

  try {
    const result = await geoCaProvider.search(parsed.data.query, parsed.data.lang);
    return {
      ok: result.ok,
      suggestions: result.suggestions,
      note: result.error,
    };
  } catch (err) {
    console.error("[geo] search failed:", (err as Error).message);
    return { ok: false, suggestions: [], note: UNAVAILABLE_NOTE };
  }
}

export interface AddressVerifyResult {
  ok: boolean;
  /** True when the provider recognised the civic address. */
  verified: boolean;
  match?: AddressSuggestion;
  note?: string;
}

/**
 * Confirms a typed address. A negative answer is advisory: some valid addresses
 * are missing from the open datasets, so checkout is never blocked by it.
 */
export async function verifyAddressAction(
  input: unknown
): Promise<AddressVerifyResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, verified: false, note: "Adresse incomplète." };
  }

  if (overRateLimit()) {
    return { ok: false, verified: false, note: UNAVAILABLE_NOTE };
  }

  try {
    const { match, note } = await verifyAddress(parsed.data);
    return {
      ok: true,
      verified: match !== null,
      match: match ?? undefined,
      note,
    };
  } catch (err) {
    console.error("[geo] verify failed:", (err as Error).message);
    return { ok: false, verified: false, note: UNAVAILABLE_NOTE };
  }
}
