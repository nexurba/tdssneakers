/**
 * Product taxonomy: categories, genders, size charts and colour palette.
 * Shared by the admin form (client) and the server actions (validation).
 */

export type ProductCategory = "sneakers" | "vetements" | "accessoires";
export type ProductGender = "homme" | "femme" | "enfant" | "unisex";

export const CATEGORIES: {
  value: ProductCategory;
  label: string;
  /** Accessories have neither gender nor sizes. */
  requiresGender: boolean;
  requiresSizes: boolean;
}[] = [
  { value: "sneakers", label: "Chaussures", requiresGender: true, requiresSizes: true },
  { value: "vetements", label: "Vêtements", requiresGender: true, requiresSizes: true },
  { value: "accessoires", label: "Accessoires", requiresGender: false, requiresSizes: false },
];

export const GENDERS: { value: ProductGender; label: string }[] = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "enfant", label: "Enfant" },
  { value: "unisex", label: "Unisexe" },
];

export function categoryConfig(category: ProductCategory) {
  return CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0];
}

export function requiresGender(category: ProductCategory): boolean {
  return categoryConfig(category).requiresGender;
}

export function requiresSizes(category: ProductCategory): boolean {
  return categoryConfig(category).requiresSizes;
}

// ---- Size charts -------------------------------------------------------------

/** US shoe sizing (common retail range), per gender. */
const SHOE_SIZES: Record<ProductGender, string[]> = {
  homme: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"],
  femme: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "11"],
  enfant: ["10C", "11C", "12C", "13C", "1Y", "2Y", "3Y", "4Y", "5Y", "6Y", "7Y"],
  // Unisex shoes span the combined adult range (US men's scale is the norm).
  unisex: ["4", "4.5", "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13", "14"],
};

/** Apparel sizing, per gender. */
const CLOTHING_SIZES: Record<ProductGender, string[]> = {
  homme: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  femme: ["XS", "S", "M", "L", "XL", "XXL"],
  enfant: ["2T", "3T", "4T", "5-6A", "7-8A", "10-12A", "14-16A"],
  unisex: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
};

/**
 * Returns the predefined size list for a category + gender pair.
 * Accessories return an empty list (no sizing).
 */
export function getSizeOptions(
  category: ProductCategory,
  gender: ProductGender | null
): string[] {
  if (!requiresSizes(category) || !gender) return [];
  return category === "sneakers" ? SHOE_SIZES[gender] : CLOTHING_SIZES[gender];
}

export function sizeChartLabel(
  category: ProductCategory,
  gender: ProductGender | null
): string {
  if (!requiresSizes(category) || !gender) return "";
  if (category === "sneakers") {
    if (gender === "enfant") return "Pointures enfant (US)";
    if (gender === "unisex") return "Pointures US (unisexe)";
    return "Pointures US";
  }
  if (gender === "enfant") return "Tailles enfant";
  if (gender === "unisex") return "Tailles unisexe";
  return "Tailles standard";
}

// ---- Colours ----------------------------------------------------------------

export interface ColorOption {
  name: string;
  hex: string;
}

export const POPULAR_COLORS: ColorOption[] = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Gris", hex: "#9CA3AF" },
  { name: "Beige", hex: "#D4A574" },
  { name: "Marron", hex: "#8B5E3C" },
  { name: "Rouge", hex: "#DC2626" },
  { name: "Bleu", hex: "#2563EB" },
  { name: "Bleu marine", hex: "#1E3A8A" },
  { name: "Vert", hex: "#16A34A" },
  { name: "Jaune", hex: "#FACC15" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Crème", hex: "#F5F5DC" },
  { name: "Multicolore", hex: "linear-gradient" },
];

export function findColor(name: string): ColorOption | undefined {
  return POPULAR_COLORS.find(
    (c) => c.name.toLowerCase() === name.trim().toLowerCase()
  );
}

/** Basic hex validation for custom colours (#RGB or #RRGGBB). */
export function isValidHex(hex: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim());
}
