import { ProductCategory } from "./taxonomy";

/**
 * Size conversion for unisex products.
 *
 * A unisex product is stored ONCE. Per industry convention (adidas, Converse,
 * Vans), unisex footwear is catalogued on the US MEN'S scale, so men's is our
 * canonical storage scale and women's equivalents are derived for display.
 *
 * US footwear: women's = men's + 1.5
 * Apparel:     women's is one step up the ladder (men's S = women's M)
 */

/** Which scale the admin typed the sizes in. */
export type SizeScale = "men" | "women";

export const SHOE_OFFSET = 1.5;

/** Apparel ladder used for step-based conversion. */
const APPAREL_LADDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];

export interface SizePair {
  /** Canonical men's-scale value (what we store). */
  men: string;
  /** Derived women's-scale value (for display). */
  women: string;
}

function isNumeric(v: string): boolean {
  return /^\d+(\.\d+)?$/.test(v.trim());
}

/** Trim trailing ".0" so 9.0 renders as 9. */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

// ---- Footwear ---------------------------------------------------------------

export function shoeMenToWomen(size: string): string | null {
  const s = size.trim();
  if (!isNumeric(s)) return null;
  return fmt(Number(s) + SHOE_OFFSET);
}

export function shoeWomenToMen(size: string): string | null {
  const s = size.trim();
  if (!isNumeric(s)) return null;
  const n = Number(s) - SHOE_OFFSET;
  return n > 0 ? fmt(n) : null;
}

// ---- Apparel ----------------------------------------------------------------

export function apparelMenToWomen(size: string): string | null {
  const i = APPAREL_LADDER.indexOf(size.trim().toUpperCase());
  if (i === -1) return null;
  return APPAREL_LADDER[Math.min(i + 1, APPAREL_LADDER.length - 1)];
}

export function apparelWomenToMen(size: string): string | null {
  const i = APPAREL_LADDER.indexOf(size.trim().toUpperCase());
  if (i === -1) return null;
  return APPAREL_LADDER[Math.max(i - 1, 0)];
}

// ---- Unified API ------------------------------------------------------------

/**
 * Normalise an admin-entered size into a men's/women's pair.
 * `scale` says which scale the input is expressed in.
 * Returns null when the value can't be converted (e.g. a custom size);
 * callers should then store it verbatim on both scales.
 */
export function toSizePair(
  category: ProductCategory,
  scale: SizeScale,
  input: string
): SizePair | null {
  const value = input.trim();
  if (!value) return null;

  if (category === "sneakers") {
    if (scale === "men") {
      const women = shoeMenToWomen(value);
      return women ? { men: value, women } : null;
    }
    const men = shoeWomenToMen(value);
    return men ? { men, women: value } : null;
  }

  if (category === "vetements") {
    if (scale === "men") {
      const women = apparelMenToWomen(value);
      return women ? { men: value.toUpperCase(), women } : null;
    }
    const men = apparelWomenToMen(value);
    return men ? { men, women: value.toUpperCase() } : null;
  }

  // Accessories carry no sizing.
  return null;
}

/**
 * Convert a list of admin-entered sizes into canonical men's-scale values,
 * preserving anything that can't be converted (custom sizes) as-is.
 */
export function toCanonicalSizes(
  category: ProductCategory,
  scale: SizeScale,
  sizes: string[]
): string[] {
  const out: string[] = [];
  for (const s of sizes) {
    const pair = toSizePair(category, scale, s);
    out.push(pair ? pair.men : s.trim());
  }
  // De-duplicate while keeping order.
  return Array.from(new Set(out.filter(Boolean)));
}

/**
 * Build the display pairs for a stored (canonical men's) size list.
 * Used on the product page for unisex items.
 */
export function toDisplayPairs(
  category: ProductCategory,
  canonicalSizes: string[]
): SizePair[] {
  return canonicalSizes.map((men) => {
    const pair = toSizePair(category, "men", men);
    return pair ?? { men, women: men };
  });
}

/** Label helper: "US 9 (H) / 10.5 (F)". */
export function formatPair(pair: SizePair): string {
  if (pair.men === pair.women) return pair.men;
  return `${pair.men} H / ${pair.women} F`;
}
