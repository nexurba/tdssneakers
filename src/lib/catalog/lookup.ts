import "server-only";
import {
  ProductCategory,
  ProductGender,
  POPULAR_COLORS,
} from "./taxonomy";

/**
 * Product details inferred from a web search on a product/style code.
 * Every field is optional — the admin reviews and completes the form.
 */
export interface LookupResult {
  productCode: string;
  name?: string;
  brand?: string;
  variant?: string;
  description?: string;
  category?: ProductCategory;
  gender?: ProductGender;
  color?: string;
  price?: number;
  sourceUrl?: string;
}

export function isLookupConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID
  );
}

interface CseItem {
  title?: string;
  snippet?: string;
  link?: string;
  pagemap?: {
    product?: { name?: string; brand?: string; description?: string }[];
    offer?: { price?: string; pricecurrency?: string }[];
    metatags?: Record<string, string>[];
  };
}

const KNOWN_BRANDS = [
  "Nike", "Jordan", "Adidas", "New Balance", "Puma", "Reebok", "Vans",
  "Converse", "Asics", "Yeezy", "Carhartt", "The North Face", "Under Armour",
  "Fear of God", "Essentials", "Salomon", "Crocs", "Timberland",
];

const SHOE_HINTS = ["sneaker", "shoe", "chaussure", "trainer", "boot", "slide", "dunk", "air max", "jordan", "runner"];
const ACCESSORY_HINTS = ["cap", "hat", "casquette", "bag", "sac", "sock", "chaussette", "belt", "ceinture", "beanie", "tuque", "wallet", "scarf", "glove", "backpack"];
const CLOTHING_HINTS = ["hoodie", "tee", "t-shirt", "shirt", "jacket", "veste", "pant", "jogger", "short", "sweat", "crewneck", "coat", "manteau"];

const WOMEN_HINTS = ["women", "femme", "wmns", "female"];
const KIDS_HINTS = ["kids", "enfant", "junior", "toddler", "youth", "gs", "ps", "td", "child"];

function detectFrom(haystack: string, hints: string[]): boolean {
  return hints.some((h) => haystack.includes(h));
}

function detectCategory(text: string): ProductCategory | undefined {
  const h = text.toLowerCase();
  // Accessories first: a "cap" shouldn't be caught by clothing hints.
  if (detectFrom(h, ACCESSORY_HINTS)) return "accessoires";
  if (detectFrom(h, SHOE_HINTS)) return "sneakers";
  if (detectFrom(h, CLOTHING_HINTS)) return "vetements";
  return undefined;
}

function detectGender(text: string): ProductGender | undefined {
  const h = text.toLowerCase();
  if (detectFrom(h, KIDS_HINTS)) return "enfant";
  if (detectFrom(h, WOMEN_HINTS)) return "femme";
  return undefined;
}

function detectBrand(text: string): string | undefined {
  const h = text.toLowerCase();
  return KNOWN_BRANDS.find((b) => h.includes(b.toLowerCase()));
}

function detectColor(text: string): string | undefined {
  const h = text.toLowerCase();
  return POPULAR_COLORS.find((c) => h.includes(c.name.toLowerCase()))?.name;
}

function detectPrice(items: CseItem[]): number | undefined {
  for (const item of items) {
    const raw = item.pagemap?.offer?.[0]?.price;
    if (raw) {
      const n = Number(String(raw).replace(/[^0-9.]/g, ""));
      if (Number.isFinite(n) && n > 0) return Math.round(n);
    }
  }
  return undefined;
}

/** Strip site suffixes like " | Nike CA" or " - StockX" from a title. */
function cleanTitle(title: string): string {
  return title
    .split(/\s[|–-]\s/)[0]
    .replace(/\b(buy|shop|official|release date)\b/gi, "")
    .trim();
}

/**
 * Look up a product by its style/product code using Google Custom Search,
 * then infer structured fields from the results.
 */
export async function lookupProductByCode(
  code: string
): Promise<{ ok: true; data: LookupResult } | { ok: false; error: string }> {
  const productCode = code.trim();
  if (!productCode) {
    return { ok: false, error: "Code produit requis." };
  }
  if (!isLookupConfigured()) {
    return {
      ok: false,
      error:
        "Recherche en ligne non configurée. Ajoutez GOOGLE_CSE_API_KEY et GOOGLE_CSE_ID dans les variables d'environnement.",
    };
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", process.env.GOOGLE_CSE_API_KEY!);
  url.searchParams.set("cx", process.env.GOOGLE_CSE_ID!);
  url.searchParams.set("q", `${productCode} sneaker OR apparel product`);
  url.searchParams.set("num", "5");

  let items: CseItem[] = [];
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      return {
        ok: false,
        error: `Recherche échouée (HTTP ${res.status}). Vérifiez vos clés Google CSE.`,
      };
    }
    const json = (await res.json()) as { items?: CseItem[] };
    items = json.items ?? [];
  } catch (err) {
    return { ok: false, error: `Recherche indisponible: ${(err as Error).message}` };
  }

  if (items.length === 0) {
    return { ok: false, error: `Aucun résultat pour le code « ${productCode} ».` };
  }

  const first = items[0];
  const product = first.pagemap?.product?.[0];
  const corpus = items
    .map((i) => `${i.title ?? ""} ${i.snippet ?? ""}`)
    .join(" ");

  const rawTitle = product?.name || first.title || "";
  const title = cleanTitle(rawTitle);
  const brand = product?.brand || detectBrand(corpus);

  // Drop a leading brand from the name so "Nike Dunk Low" -> "Dunk Low".
  const name =
    brand && title.toLowerCase().startsWith(brand.toLowerCase())
      ? title.slice(brand.length).trim() || title
      : title;

  return {
    ok: true,
    data: {
      productCode,
      name: name || undefined,
      brand: brand || undefined,
      description: product?.description || first.snippet || undefined,
      category: detectCategory(corpus),
      gender: detectGender(corpus),
      color: detectColor(corpus),
      price: detectPrice(items),
      sourceUrl: first.link,
    },
  };
}
