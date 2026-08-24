import "server-only";
import {
  formatPostalCode,
  isValidPostalCode,
  toProvinceCode,
  type AddressLookupResult,
  type AddressProvider,
  type AddressSuggestion,
} from "./types";

/**
 * Address lookup backed by geo.ca — the Geolocator API run by Natural Resources
 * Canada. Free for ordinary public use, bilingual, and Canada-only.
 *
 * Two limits worth knowing, both surfaced to the checkout UI rather than hidden:
 *
 *  - It geocodes, it does not certify deliverability. A hit means the civic
 *    address exists, not that a courier will reach unit 4B. Positions are often
 *    interpolated along the street rather than surveyed.
 *  - It only understands the first three characters of a postal code (the
 *    Forward Sortation Area), so it can never confirm a full "H2X 1K4". The
 *    customer's postal code is validated by format only.
 *
 * Swap in Canada Post AddressComplete by writing another AddressProvider if
 * deliverability accuracy starts costing money in failed deliveries.
 *
 * Docs: https://natural-resources.canada.ca/maps-tools-publications/satellite-elevation-air-photos/geolocation-service
 */

const ENDPOINT = "https://geolocator.api.geo.ca/";

/** Datasets that can yield a civic address. */
const KEYS = "nominatim,locate";

const TIMEOUT_MS = 4000;

/** Categories geo.ca uses for address-like hits, in French and English. */
const ADDRESS_CATEGORIES = new Set([
  "rue",
  "street",
  "adresse",
  "address",
  "lieu",
  "place",
]);

interface GeoCaResult {
  key?: string;
  name?: string | null;
  province?: string | null;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  tag?: string[] | null;
}

/** True when the label starts with a civic number, e.g. "123 Rue ...". */
function hasCivicNumber(label: string): boolean {
  return /^\d+[a-z]?[,\s]/i.test(label.trim());
}

/**
 * Splits a geo.ca label into street / city / province.
 *
 * Labels arrive in a few shapes:
 *   "123 Rue Sainte-Catherine Ouest, Montréal, Québec"
 *   "123, Rue Sainte-Catherine Ouest, Quartier des Spectacles"
 * so this is best-effort: whatever cannot be identified is left for the
 * customer to complete, and the form still requires city and province.
 */
function splitLabel(
  label: string,
  provinceHint: string
): { line1: string; city: string; province: string } {
  const parts = label
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const province = toProvinceCode(provinceHint || parts[parts.length - 1] || "");

  // Drop a trailing province name so it is not mistaken for the city.
  const withoutProvince =
    parts.length > 1 && toProvinceCode(parts[parts.length - 1]) !== ""
      ? parts.slice(0, -1)
      : parts;

  if (withoutProvince.length === 0) return { line1: label, city: "", province };
  if (withoutProvince.length === 1) {
    return { line1: withoutProvince[0], city: "", province };
  }

  // "123", "Rue X", "Ville" — rejoin a lone leading number with its street.
  if (/^\d+[a-z]?$/i.test(withoutProvince[0]) && withoutProvince.length >= 3) {
    return {
      line1: `${withoutProvince[0]} ${withoutProvince[1]}`,
      city: withoutProvince[withoutProvince.length - 1],
      province,
    };
  }

  return {
    line1: withoutProvince[0],
    city: withoutProvince[withoutProvince.length - 1],
    province,
  };
}

function toSuggestion(result: GeoCaResult): AddressSuggestion | null {
  const label = (result.name ?? "").trim();
  if (!label) return null;

  const category = (result.category ?? "").toLowerCase();
  if (!ADDRESS_CATEGORIES.has(category)) return null;

  const { line1, city, province } = splitLabel(label, result.province ?? "");

  return {
    label,
    address: {
      line1,
      line2: null,
      city,
      province,
      // geo.ca never returns a full postal code, so the customer supplies it.
      postalCode: "",
      country: "CA",
    },
    latitude: typeof result.lat === "number" ? result.lat : null,
    longitude: typeof result.lng === "number" ? result.lng : null,
    source: result.key ?? "geo.ca",
    precise: hasCivicNumber(label),
  };
}

export const geoCaProvider: AddressProvider = {
  name: "geo.ca",

  async search(query: string, lang: "fr" | "en" = "fr"): Promise<AddressLookupResult> {
    const q = query.trim();
    // Below this, results are noise and the request is wasted.
    if (q.length < 5) return { ok: true, suggestions: [] };

    const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&lang=${lang}&keys=${KEYS}`;

    let payload: unknown;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        // Identical queries are common while typing.
        next: { revalidate: 3600 },
      });
      clearTimeout(timer);

      if (!res.ok) {
        console.error(`[geo.ca] HTTP ${res.status} for "${q}"`);
        return {
          ok: false,
          suggestions: [],
          error:
            "La vérification d'adresse est momentanément indisponible. Vous pouvez saisir votre adresse manuellement.",
        };
      }
      payload = await res.json();
    } catch (err) {
      const aborted = (err as Error).name === "AbortError";
      console.error(`[geo.ca] ${aborted ? "timeout" : "failed"} for "${q}"`);
      return {
        ok: false,
        suggestions: [],
        error:
          "La vérification d'adresse est momentanément indisponible. Vous pouvez saisir votre adresse manuellement.",
      };
    }

    if (!Array.isArray(payload)) {
      return { ok: true, suggestions: [] };
    }

    const seen = new Set<string>();
    const suggestions: AddressSuggestion[] = [];
    for (const raw of payload as GeoCaResult[]) {
      const suggestion = toSuggestion(raw);
      if (!suggestion) continue;
      const dedupeKey = suggestion.label.toLowerCase();
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      suggestions.push(suggestion);
    }

    // Civic addresses first. Within those, prefer the official NRCan dataset
    // over OpenStreetMap: OSM often labels the neighbourhood as the city
    // ("Quartier des Spectacles" instead of "Montréal"), which would put the
    // wrong value in the customer's city field.
    const rank = (s: AddressSuggestion) => (s.source === "locate" ? 0 : 1);
    suggestions.sort(
      (a, b) => Number(b.precise) - Number(a.precise) || rank(a) - rank(b)
    );
    return { ok: true, suggestions: suggestions.slice(0, 8) };
  },
};

/**
 * Confirms a customer-entered address against the provider.
 *
 * Returns the matched suggestion when the provider recognises the street, plus
 * a note when nothing matched. A miss is never fatal: the customer may live
 * somewhere the open datasets do not cover, so checkout proceeds with the
 * address recorded as unverified.
 */
export async function verifyAddress(input: {
  line1: string;
  city: string;
  province: string;
}): Promise<{ match: AddressSuggestion | null; note?: string }> {
  const query = [input.line1, input.city, input.province]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(", ");

  const result = await geoCaProvider.search(query);
  if (!result.ok) return { match: null, note: result.error };

  const wantCity = input.city.trim().toLowerCase();
  const precise = result.suggestions.filter((s) => s.precise);

  // Prefer a civic hit in the city the customer named.
  const inCity = precise.find(
    (s) => s.address.city.toLowerCase() === wantCity
  );
  if (inCity) return { match: inCity };
  if (precise.length > 0) return { match: precise[0] };

  return {
    match: null,
    note: "Adresse non confirmée par le service de validation.",
  };
}

export { formatPostalCode, isValidPostalCode };
