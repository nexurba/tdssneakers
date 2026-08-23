import { ProductCategory } from "./taxonomy";

/**
 * Style-code parsing for major brands. Runs fully offline so the admin gets
 * useful pre-fill even without a search API key configured.
 */

export interface CodeInsight {
  /** Canonical form, e.g. "DN1772305" -> "DN1772-305". */
  normalized: string;
  /** Colourway suffix when the code carries one (Nike: last 3 digits). */
  colorwayCode?: string;
  brand?: string;
  category?: ProductCategory;
  /** Confidence in the brand guess. */
  confidence: "high" | "medium" | "low";
  /** Human-readable note shown in the UI. */
  note?: string;
}

/**
 * Nike/Jordan without the dash. The colourway is always the last 3 digits,
 * so the SKU body is whatever precedes it (usually 4 digits, sometimes 3).
 * e.g. DN1772305 -> DN1772-305
 */
const NIKE_NO_DASH = /^([A-Z]{2})(\d{6,7})$/;
const NIKE_DASHED = /^([A-Z]{2})(\d{4})-(\d{3})$/;
/** Older Nike/Jordan: 6 digits + 3. e.g. 555088-125 */
const NIKE_NUMERIC = /^(\d{6})-?(\d{3})$/;
/** adidas: 1-2 letters + 4-5 digits. e.g. GY7386, HQ6448 */
const ADIDAS = /^[A-Z]{1,2}\d{4,5}$/;
/** New Balance: model digits + letters. e.g. BB550PWG, M990GL6 */
const NEW_BALANCE = /^(M|W|U|BB|GS|PS|CM|ML|MR)\d{3,4}[A-Z0-9]{0,4}$/;
/** ASICS: 4 digits + letters + digits. e.g. 1201A789-020 */
const ASICS = /^\d{4}[A-Z]\d{3}-?\d{0,3}$/;
/** Puma: 6 digits + 2 digits. e.g. 384855-01 */
const PUMA = /^\d{6}-\d{2}$/;
/** Vans: VN + alphanumerics. e.g. VN0A38EMU9C */
const VANS = /^VN[0-9A-Z]{6,}$/;

function clean(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Parse a product/style code and infer what we can without any network call.
 */
export function parseProductCode(raw: string): CodeInsight {
  const code = clean(raw);

  if (!code) {
    return { normalized: "", confidence: "low" };
  }

  // Nike/Jordan without the dash: DN1772305 -> DN1772-305
  const noDash = code.match(NIKE_NO_DASH);
  if (noDash) {
    const [, letters, digits] = noDash;
    // Colourway is the trailing 3 digits; the rest is the SKU body.
    const body = digits.slice(0, -3);
    const colorway = digits.slice(-3);
    return {
      normalized: `${letters}${body}-${colorway}`,
      colorwayCode: colorway,
      brand: "Nike",
      category: "sneakers",
      confidence: "medium",
      note: "Format Nike/Jordan détecté — tiret ajouté automatiquement.",
    };
  }

  const dashed = code.match(NIKE_DASHED);
  if (dashed) {
    return {
      normalized: code,
      colorwayCode: dashed[3],
      brand: "Nike",
      category: "sneakers",
      confidence: "high",
      note: "Format Nike/Jordan (SKU-coloris).",
    };
  }

  const numeric = code.match(NIKE_NUMERIC);
  if (numeric) {
    return {
      normalized: `${numeric[1]}-${numeric[2]}`,
      colorwayCode: numeric[2],
      brand: "Nike",
      category: "sneakers",
      confidence: "medium",
      note: "Format Nike/Jordan historique.",
    };
  }

  if (VANS.test(code)) {
    return { normalized: code, brand: "Vans", category: "sneakers", confidence: "high", note: "Format Vans." };
  }
  if (ASICS.test(code)) {
    return { normalized: code, brand: "Asics", category: "sneakers", confidence: "medium", note: "Format ASICS." };
  }
  if (PUMA.test(code)) {
    return { normalized: code, brand: "Puma", category: "sneakers", confidence: "medium", note: "Format Puma." };
  }
  if (NEW_BALANCE.test(code)) {
    return { normalized: code, brand: "New Balance", category: "sneakers", confidence: "medium", note: "Format New Balance." };
  }
  if (ADIDAS.test(code)) {
    return { normalized: code, brand: "Adidas", category: "sneakers", confidence: "medium", note: "Format adidas." };
  }

  return {
    normalized: code,
    confidence: "low",
    note: "Format non reconnu — la recherche en ligne peut aider.",
  };
}


