import "server-only";
import {
  ProductCategory,
  ProductGender,
  POPULAR_COLORS,
} from "./taxonomy";
import { parseProductCode, buildSearchQueries } from "./product-code";

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
  /** Where the data came from: offline code parsing or a web search. */
  source?: "code" | "search";
  /** Human-readable context shown under the Fetch Details button. */
  note?: string;
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
  if (!code.trim()) {
    return { ok: false, error: "Code produit requis." };
  }

  // Step 1 — always available: parse the style code offline.
  const insight = parseProductCode(code);
  const productCode = insight.normalized;

  const offline: LookupResult = {
    productCode,
    brand: insight.brand,
    category: insight.category,
    source: "code",
    note: insight.note,
  };

  // Step 2 — enrich with web search when a provider is configured.
  if (!isLookupConfigured()) {
    return {
      ok: true,
      data: {
        ...offline,
        note: [
          insight.note,
          "Recherche en ligne inactive (GOOGLE_CSE_API_KEY / GOOGLE_CSE_ID non définis) — seules les infos déduites du code sont pré-remplies.",
        ]
          .filter(Boolean)
          .join(" "),
      },
    };
  }

  const queries = buildSearchQueries(code);
  let items: CseItem[] = [];
  let lastError: string | null = null;

  // Try each query variant until one returns results.
  for (const q of queries) {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", process.env.GOOGLE_CSE_API_KEY!);
    url.searchParams.set("cx", process.env.GOOGLE_CSE_ID!);
    url.searchParams.set("q", q);
    url.searchParams.set("num", "5");

    try {
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      const json = (await res.json()) as { items?: CseItem[] };
      if (json.items && json.items.length > 0) {
        items = json.items;
        break;
      }
    } catch (err) {
      lastError = (err as Error).message;
    }
  }

  // Offline insight is still valuable if the search found nothing.
  if (items.length === 0) {
    return {
      ok: true,
      data: {
        ...offline,
        note: [
          insight.note,
          lastError
            ? `Recherche en ligne indisponible (${lastError}).`
            : `Aucun résultat en ligne pour « ${productCode} ».`,
        ]
          .filter(Boolean)
          .join(" "),
      },
    };
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

  // Merge: web-search findings win, offline code insight fills the gaps.
  return {
    ok: true,
    data: {
      productCode,
      name: name || undefined,
      brand: brand || offline.brand,
      description: product?.description || first.snippet || undefined,
      category: detectCategory(corpus) ?? offline.category,
      gender: detectGender(corpus),
      color: detectColor(corpus),
      price: detectPrice(items),
      sourceUrl: first.link,
      source: "search",
      note: insight.note,
    },
  };
}
