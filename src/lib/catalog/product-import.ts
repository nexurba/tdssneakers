/**
 * Bulk product import: column contract, row validation and image matching.
 *
 * Deliberately isomorphic — no `server-only`, no exceljs — so the admin UI and
 * the Server Action share one definition of what a valid row is. The action
 * re-validates every row before writing, because rows travel back from the
 * browser and cannot be trusted.
 */

import {
  CATEGORIES,
  GENDERS,
  ONE_SIZE,
  isValidHex,
  requiresGender,
  requiresSizes,
  type ProductCategory,
  type ProductGender,
} from "./taxonomy";
import { toCanonicalSizes, type SizeScale } from "./size-conversion";

// ---- Column contract --------------------------------------------------------

export interface ColumnSpec {
  /** Canonical key used internally. */
  key: string;
  /** Header written into the downloadable template. */
  header: string;
  /** Accepted header spellings, normalised (accent- and case-insensitive). */
  aliases: string[];
  requirement: "required" | "conditional" | "optional";
  help: string;
  example: string;
}

export const COLUMNS: ColumnSpec[] = [
  {
    key: "name",
    header: "nom",
    aliases: ["nom", "name", "produit", "product", "titre", "title"],
    requirement: "required",
    help: "Nom du produit. Sert aussi à associer les images.",
    example: "Nike Dunk Low",
  },
  {
    key: "productCode",
    header: "code_produit",
    aliases: ["code_produit", "codeproduit", "product_code", "productcode", "code", "sku", "reference", "ref"],
    requirement: "required",
    help: "Identifiant unique. Détecte les doublons et associe aussi les images.",
    example: "DD1391-100",
  },
  {
    key: "price",
    header: "prix",
    aliases: ["prix", "price", "prix_cad", "montant"],
    requirement: "required",
    help: "Nombre. La virgule décimale est acceptée (129,99).",
    example: "129.99",
  },
  {
    key: "category",
    header: "categorie",
    aliases: ["categorie", "category", "type", "famille"],
    requirement: "required",
    help: "sneakers, vetements ou accessoires (chaussures et vêtements sont acceptés).",
    example: "sneakers",
  },
  {
    key: "gender",
    header: "genre",
    aliases: ["genre", "gender", "sexe", "public"],
    requirement: "conditional",
    help: "homme, femme, enfant ou unisex. Obligatoire sauf pour les accessoires, qui doivent le laisser vide.",
    example: "homme",
  },
  {
    key: "color",
    header: "couleur",
    aliases: ["couleur", "color", "coloris"],
    requirement: "required",
    help: "Nom libre de la couleur.",
    example: "Noir",
  },
  {
    key: "colorHex",
    header: "couleur_hex",
    aliases: ["couleur_hex", "couleurhex", "color_hex", "colorhex", "hex"],
    requirement: "optional",
    help: "Code hexadécimal, ex. #000000.",
    example: "#000000",
  },
  {
    key: "brand",
    header: "marque",
    aliases: ["marque", "brand", "fabricant"],
    requirement: "optional",
    help: "Marque du produit.",
    example: "Nike",
  },
  {
    key: "description",
    header: "description",
    aliases: ["description", "desc", "details", "detail"],
    requirement: "optional",
    help: "Texte affiché sur la fiche produit.",
    example: "Silhouette basse iconique en cuir.",
  },
  {
    key: "sizes",
    header: "tailles",
    aliases: ["tailles", "sizes", "taille", "size", "pointures", "pointure"],
    requirement: "conditional",
    help: "Séparées par des virgules. Obligatoire sauf pour les accessoires.",
    example: "8,9,10,11",
  },
  {
    key: "stock",
    header: "stock",
    aliases: ["stock", "quantite", "quantites", "quantity", "qty", "inventaire"],
    requirement: "optional",
    help: "Un seul nombre pour toutes les tailles (5), ou par taille (8:3,9:2). Vide = 1.",
    example: "8:3,9:5,10:2,11:1",
  },
  {
    key: "sizeScale",
    header: "echelle_tailles",
    aliases: ["echelle_tailles", "echelletailles", "size_scale", "sizescale", "echelle", "scale"],
    requirement: "optional",
    help: "Produits unisexes seulement : men ou women, selon l'échelle utilisée dans « tailles ». Défaut men.",
    example: "men",
  },
  {
    key: "isNew",
    header: "nouveau",
    aliases: ["nouveau", "nouveaute", "is_new", "isnew", "new"],
    requirement: "optional",
    help: "oui / non.",
    example: "oui",
  },
  {
    key: "isBestSeller",
    header: "meilleure_vente",
    aliases: ["meilleure_vente", "meilleurevente", "is_best_seller", "isbestseller", "best_seller", "bestseller", "populaire"],
    requirement: "optional",
    help: "oui / non.",
    example: "non",
  },
  {
    key: "isActive",
    header: "actif",
    aliases: ["actif", "active", "is_active", "isactive", "publie", "visible"],
    requirement: "optional",
    help: "oui / non. Défaut oui.",
    example: "oui",
  },
];

/** Strip accents, lowercase, collapse separators — for header/value matching. */
export function normaliseHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s.\-/]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

/** Maps a spreadsheet header row to canonical column keys by position. */
export function mapHeaders(headerRow: string[]): {
  byIndex: (string | null)[];
  missingRequired: string[];
  unknown: string[];
} {
  const byIndex: (string | null)[] = [];
  const unknown: string[] = [];

  for (const raw of headerRow) {
    const norm = normaliseHeader(raw ?? "");
    if (!norm) {
      byIndex.push(null);
      continue;
    }
    const spec = COLUMNS.find((c) => c.aliases.includes(norm));
    if (spec) {
      byIndex.push(spec.key);
    } else {
      byIndex.push(null);
      unknown.push(raw);
    }
  }

  const found = new Set(byIndex.filter(Boolean) as string[]);
  const missingRequired = COLUMNS.filter(
    (c) => c.requirement === "required" && !found.has(c.key)
  ).map((c) => c.header);

  return { byIndex, missingRequired, unknown };
}

// ---- Value coercion ---------------------------------------------------------

const TRUTHY = new Set(["oui", "o", "yes", "y", "true", "vrai", "1", "x"]);
const FALSY = new Set(["non", "n", "no", "false", "faux", "0", ""]);

function parseBool(value: string, fallback: boolean): boolean {
  const v = normaliseHeader(value);
  if (TRUTHY.has(v)) return true;
  if (FALSY.has(v)) return false;
  return fallback;
}

/** Accepts "129,99", "129.99", "1 299,00 $". */
function parsePrice(value: string): number | null {
  const cleaned = value
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "")
    .replace(/,(\d{1,2})$/, ".$1")
    .replace(/,/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const CATEGORY_ALIASES: Record<string, ProductCategory> = {
  sneakers: "sneakers",
  sneaker: "sneakers",
  chaussures: "sneakers",
  chaussure: "sneakers",
  shoes: "sneakers",
  souliers: "sneakers",
  vetements: "vetements",
  vetement: "vetements",
  clothing: "vetements",
  clothes: "vetements",
  apparel: "vetements",
  accessoires: "accessoires",
  accessoire: "accessoires",
  accessories: "accessoires",
  accessory: "accessoires",
};

const GENDER_ALIASES: Record<string, ProductGender> = {
  homme: "homme",
  hommes: "homme",
  men: "homme",
  man: "homme",
  male: "homme",
  h: "homme",
  femme: "femme",
  femmes: "femme",
  women: "femme",
  woman: "femme",
  female: "femme",
  f: "femme",
  enfant: "enfant",
  enfants: "enfant",
  kids: "enfant",
  kid: "enfant",
  child: "enfant",
  junior: "enfant",
  unisex: "unisex",
  unisexe: "unisex",
  mixte: "unisex",
};

function splitList(value: string): string[] {
  return value
    .split(/[,;|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Parses the stock column. Supports a flat quantity applied to every size
 * ("5") or an explicit per-size map ("8:3, 9:2"). Returns null for "use the
 * default of 1".
 */
function parseStock(
  value: string,
  sizes: string[]
): { map: Record<string, number> | null; error?: string } {
  const raw = value.trim();
  if (!raw) return { map: null };

  // Flat quantity for every size.
  if (/^\d+$/.test(raw)) {
    const qty = Number(raw);
    const map: Record<string, number> = {};
    for (const s of sizes) map[s] = qty;
    return { map: Object.keys(map).length > 0 ? map : null };
  }

  const map: Record<string, number> = {};
  const unknownSizes: string[] = [];
  for (const part of splitList(raw)) {
    const m = part.match(/^(.+?)\s*[:=]\s*(\d+)$/);
    if (!m) return { map: null, error: `stock illisible près de « ${part} »` };
    const size = m[1].trim();
    const qty = Number(m[2]);
    if (sizes.length > 0 && !sizes.includes(size)) unknownSizes.push(size);
    map[size] = qty;
  }
  if (unknownSizes.length > 0) {
    return {
      map,
      error: `stock défini pour des tailles absentes de « tailles » : ${unknownSizes.join(", ")}`,
    };
  }
  return { map: Object.keys(map).length > 0 ? map : null };
}

// ---- Row model --------------------------------------------------------------

export interface ImportRow {
  /** 1-based spreadsheet row number, so messages point at the real line. */
  rowNumber: number;
  name: string;
  productCode: string;
  price: number;
  category: ProductCategory;
  gender: ProductGender | null;
  sizeScale: SizeScale;
  color: string;
  colorHex: string | null;
  brand: string | null;
  description: string | null;
  /** Canonical sizes (unisex already converted to the men's scale). */
  sizes: string[];
  stockBySize: Record<string, number> | null;
  isNew: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  /** Blocking problems — the row cannot be imported. */
  errors: string[];
  /** Non-blocking remarks. */
  warnings: string[];
}

const EMPTY_ROW: Omit<ImportRow, "rowNumber" | "errors" | "warnings"> = {
  name: "",
  productCode: "",
  price: 0,
  category: "sneakers",
  gender: null,
  sizeScale: "men",
  color: "",
  colorHex: null,
  brand: null,
  description: null,
  sizes: [],
  stockBySize: null,
  isNew: false,
  isBestSeller: false,
  isActive: true,
};

/** True when every mapped cell is blank, so the row can be skipped silently. */
export function isBlankRecord(record: Record<string, string>): boolean {
  return Object.values(record).every((v) => !v || !v.trim());
}

/**
 * Validates and coerces one spreadsheet record into an ImportRow.
 * Never throws: problems are collected on `errors`.
 */
export function parseRow(
  record: Record<string, string>,
  rowNumber: number
): ImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const get = (k: string) => (record[k] ?? "").toString().trim();

  const name = get("name");
  if (!name) errors.push("« nom » est vide");

  const productCode = get("productCode");
  if (!productCode) errors.push("« code_produit » est vide");

  const priceRaw = get("price");
  const price = parsePrice(priceRaw);
  if (priceRaw === "") {
    errors.push("« prix » est vide");
  } else if (price === null) {
    errors.push(`« prix » illisible : « ${priceRaw} »`);
  } else if (price < 0) {
    errors.push("« prix » ne peut pas être négatif");
  }

  const categoryRaw = get("category");
  const category = CATEGORY_ALIASES[normaliseHeader(categoryRaw)] ?? null;
  if (!categoryRaw) {
    errors.push("« categorie » est vide");
  } else if (!category) {
    errors.push(
      `« categorie » inconnue : « ${categoryRaw} » (attendu : ${CATEGORIES.map((c) => c.value).join(", ")})`
    );
  }

  const effectiveCategory = category ?? "sneakers";
  const needsGender = requiresGender(effectiveCategory);
  const needsSizes = requiresSizes(effectiveCategory);

  // Gender
  const genderRaw = get("gender");
  let gender: ProductGender | null = null;
  if (genderRaw) {
    gender = GENDER_ALIASES[normaliseHeader(genderRaw)] ?? null;
    if (!gender) {
      errors.push(
        `« genre » inconnu : « ${genderRaw} » (attendu : ${GENDERS.map((g) => g.value).join(", ")})`
      );
    }
  }
  if (category && needsGender && !gender && !genderRaw) {
    errors.push("« genre » est requis pour cette catégorie");
  }
  if (category && !needsGender && genderRaw) {
    warnings.push("les accessoires n'ont pas de genre — valeur ignorée");
    gender = null;
  }

  const color = get("color");
  if (!color) errors.push("« couleur » est vide");

  const colorHexRaw = get("colorHex");
  let colorHex: string | null = null;
  if (colorHexRaw) {
    if (isValidHex(colorHexRaw)) {
      colorHex = colorHexRaw;
    } else {
      warnings.push(`« couleur_hex » ignorée, format invalide : « ${colorHexRaw} »`);
    }
  }

  // Size scale only means something for unisex products.
  const scaleRaw = normaliseHeader(get("sizeScale"));
  let sizeScale: SizeScale = "men";
  if (scaleRaw) {
    if (["men", "homme", "hommes", "h", "m"].includes(scaleRaw)) sizeScale = "men";
    else if (["women", "femme", "femmes", "f", "w"].includes(scaleRaw)) sizeScale = "women";
    else warnings.push(`« echelle_tailles » inconnue : « ${get("sizeScale")} », men utilisé`);

    if (gender !== "unisex") {
      warnings.push("« echelle_tailles » ne s'applique qu'aux produits unisexes — ignorée");
      sizeScale = "men";
    }
  }

  // Sizes
  const sizesRaw = get("sizes");
  let sizes = splitList(sizesRaw);
  if (category && needsSizes && sizes.length === 0) {
    errors.push("« tailles » est requis pour cette catégorie");
  }
  if (category && !needsSizes) {
    if (sizes.length > 0) {
      warnings.push("les accessoires n'ont pas de tailles — valeur ignorée");
    }
    // Accessories still get the one-size sentinel so they carry stock.
    sizes = [ONE_SIZE];
  }

  const duplicateSizes = sizes.filter((s, i) => sizes.indexOf(s) !== i);
  if (duplicateSizes.length > 0) {
    warnings.push(`tailles en double ignorées : ${[...new Set(duplicateSizes)].join(", ")}`);
    sizes = [...new Set(sizes)];
  }

  // Stock, keyed on the sizes as written in the spreadsheet.
  const stockResult = parseStock(get("stock"), needsSizes ? sizes : [ONE_SIZE]);
  if (stockResult.error) warnings.push(stockResult.error);
  let stockBySize = stockResult.map;

  // Unisex sizes are stored on the canonical men's scale; re-key stock to match.
  if (category && needsSizes && gender === "unisex") {
    const canonical = toCanonicalSizes(effectiveCategory, sizeScale, sizes);
    if (stockBySize) {
      const rekeyed: Record<string, number> = {};
      sizes.forEach((original, i) => {
        const target = canonical[i] ?? original;
        if (stockBySize![original] !== undefined) {
          rekeyed[target] = stockBySize![original];
        }
      });
      stockBySize = Object.keys(rekeyed).length > 0 ? rekeyed : null;
    }
    sizes = canonical;
  }

  return {
    ...EMPTY_ROW,
    rowNumber,
    name,
    productCode,
    price: price ?? 0,
    category: effectiveCategory,
    gender: needsGender ? gender : null,
    sizeScale: needsSizes && gender === "unisex" ? sizeScale : "men",
    color,
    colorHex,
    brand: get("brand") || null,
    description: get("description") || null,
    sizes,
    stockBySize,
    isNew: parseBool(get("isNew"), false),
    isBestSeller: parseBool(get("isBestSeller"), false),
    isActive: parseBool(get("isActive"), true),
    errors,
    warnings,
  };
}

/**
 * Flags product codes repeated inside the file. Mutates rows in place so the
 * caller keeps a single list.
 */
export function flagDuplicateCodes(rows: ImportRow[]): void {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const key = row.productCode.trim().toLowerCase();
    if (!key) continue;
    const first = seen.get(key);
    if (first !== undefined) {
      row.errors.push(`« code_produit » en double dans le fichier (déjà ligne ${first})`);
    } else {
      seen.set(key, row.rowNumber);
    }
  }
}

// ---- Image matching ---------------------------------------------------------

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

/** Aggressive normalisation so "Nike Dunk Low" matches "nike-dunk-low". */
export function normaliseKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export interface ParsedImageName {
  /** Normalised product key the file claims to belong to. */
  key: string;
  /** Ordering suffix; 1 for "name_1". Missing suffix sorts last. */
  index: number;
  extension: string;
}

/**
 * Splits "Nike Dunk Low_2.jpg" into { key: "nikedunklow", index: 2 }.
 * A file with no `_N` suffix still matches, and sorts after numbered ones.
 */
export function parseImageName(filename: string): ParsedImageName | null {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return null;
  const extension = filename.slice(dot + 1).toLowerCase();
  if (!IMAGE_EXTENSIONS.includes(extension)) return null;

  const base = filename.slice(0, dot);
  const match = base.match(/^(.*?)[_\-\s]*(\d+)$/);
  if (match && match[1]) {
    return { key: normaliseKey(match[1]), index: Number(match[2]), extension };
  }
  return { key: normaliseKey(base), index: Number.MAX_SAFE_INTEGER, extension };
}

export interface ImageMatch<TFile> {
  file: TFile;
  index: number;
}

/**
 * Groups files by product, matching on the normalised product name or code.
 * Files are returned sorted by their `_N` suffix, so `_1` becomes the primary
 * image. Returns the leftovers so the UI can report unmatched files.
 */
export function matchImages<TFile extends { name: string }>(
  rows: Pick<ImportRow, "rowNumber" | "name" | "productCode">[],
  files: TFile[]
): { byRow: Map<number, TFile[]>; unmatched: TFile[] } {
  // Build a lookup from both the name and the code of every row.
  const keyToRows = new Map<string, number[]>();
  for (const row of rows) {
    for (const candidate of [row.name, row.productCode]) {
      const key = normaliseKey(candidate ?? "");
      if (!key) continue;
      const list = keyToRows.get(key) ?? [];
      if (!list.includes(row.rowNumber)) list.push(row.rowNumber);
      keyToRows.set(key, list);
    }
  }

  const staged = new Map<number, ImageMatch<TFile>[]>();
  const unmatched: TFile[] = [];

  for (const file of files) {
    const parsed = parseImageName(file.name);
    if (!parsed || !parsed.key) {
      unmatched.push(file);
      continue;
    }
    const targets = keyToRows.get(parsed.key);
    if (!targets || targets.length === 0) {
      unmatched.push(file);
      continue;
    }
    // A key can legitimately point at several rows (same name, different
    // colourway); give each of them the image.
    for (const rowNumber of targets) {
      const list = staged.get(rowNumber) ?? [];
      list.push({ file, index: parsed.index });
      staged.set(rowNumber, list);
    }
  }

  const byRow = new Map<number, TFile[]>();
  for (const [rowNumber, matches] of staged) {
    matches.sort((a, b) => a.index - b.index || a.file.name.localeCompare(b.file.name));
    byRow.set(rowNumber, matches.map((m) => m.file));
  }

  return { byRow, unmatched };
}
