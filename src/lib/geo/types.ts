/**
 * Address lookup contract.
 *
 * Deliberately provider-agnostic. The current implementation is geo.ca (free,
 * bilingual, Canadian), but a paid deliverability service such as Canada Post
 * AddressComplete can replace it by satisfying this interface — callers and the
 * checkout UI never name a provider.
 */

export interface StructuredAddress {
  line1: string;
  line2?: string | null;
  city: string;
  province: string;
  postalCode: string;
  /** ISO-3166-1 alpha-2. */
  country: string;
}

export interface AddressSuggestion {
  /** Single-line label shown in the autocomplete list. */
  label: string;
  /** Best-effort split of the label; fields the provider omits stay empty. */
  address: StructuredAddress;
  latitude: number | null;
  longitude: number | null;
  /** Which upstream dataset produced this hit, for debugging. */
  source: string;
  /**
   * True when the provider located an actual civic address rather than a
   * street, place or region. Only these are worth treating as deliverable.
   */
  precise: boolean;
}

export interface AddressLookupResult {
  ok: boolean;
  suggestions: AddressSuggestion[];
  /** Customer-safe message when the lookup could not run. */
  error?: string;
}

export interface AddressProvider {
  /** Stable identifier stored on the order as `address_source`. */
  readonly name: string;
  /** Free-text search used for autocomplete as the customer types. */
  search(query: string, lang?: "fr" | "en"): Promise<AddressLookupResult>;
}

/** Canadian provinces and territories, for the checkout select and validation. */
export const PROVINCES: { code: string; label: string }[] = [
  { code: "AB", label: "Alberta" },
  { code: "BC", label: "Colombie-Britannique" },
  { code: "MB", label: "Manitoba" },
  { code: "NB", label: "Nouveau-Brunswick" },
  { code: "NL", label: "Terre-Neuve-et-Labrador" },
  { code: "NS", label: "Nouvelle-Écosse" },
  { code: "NT", label: "Territoires du Nord-Ouest" },
  { code: "NU", label: "Nunavut" },
  { code: "ON", label: "Ontario" },
  { code: "PE", label: "Île-du-Prince-Édouard" },
  { code: "QC", label: "Québec" },
  { code: "SK", label: "Saskatchewan" },
  { code: "YT", label: "Yukon" },
];

/** Maps the province names geo.ca returns onto two-letter codes. */
const PROVINCE_BY_NAME: Record<string, string> = {
  alberta: "AB",
  "colombie-britannique": "BC",
  "british columbia": "BC",
  manitoba: "MB",
  "nouveau-brunswick": "NB",
  "new brunswick": "NB",
  "terre-neuve-et-labrador": "NL",
  "newfoundland and labrador": "NL",
  "nouvelle-ecosse": "NS",
  "nova scotia": "NS",
  "territoires du nord-ouest": "NT",
  "northwest territories": "NT",
  nunavut: "NU",
  ontario: "ON",
  "ile-du-prince-edouard": "PE",
  "prince edward island": "PE",
  quebec: "QC",
  saskatchewan: "SK",
  yukon: "YT",
};

function deaccent(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Returns the two-letter code for a province name or code, or "" if unknown. */
export function toProvinceCode(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const upper = raw.toUpperCase();
  if (PROVINCES.some((p) => p.code === upper)) return upper;
  return PROVINCE_BY_NAME[deaccent(raw)] ?? "";
}

/** Canadian postal code, with or without the middle space. */
export function isValidPostalCode(value: string): boolean {
  return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(
    value.trim()
  );
}

/** Normalises to the canonical "H2X 1K4" form. */
export function formatPostalCode(value: string): string {
  const compact = value.replace(/[\s-]/g, "").toUpperCase();
  if (compact.length !== 6) return value.trim().toUpperCase();
  return `${compact.slice(0, 3)} ${compact.slice(3)}`;
}

/**
 * North American phone number, accepting the punctuation people actually type.
 * Ten digits, optionally prefixed with a 1.
 */
export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

/** Renders a phone number as (514) 555-0142. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^1/, "");
  if (digits.length !== 10) return value.trim();
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Collapses a structured address into one line for emails and labels. */
export function formatAddress(address: StructuredAddress): string {
  const street = [address.line1, address.line2].filter(Boolean).join(", ");
  return [street, address.city, address.province, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");
}
