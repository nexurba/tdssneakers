"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchAddressAction,
  verifyAddressAction,
} from "./address-actions";
import {
  PROVINCES,
  formatPostalCode,
  isValidPostalCode,
  type AddressSuggestion,
} from "@/lib/geo/types";

/** How long to wait after the last keystroke before querying. */
const SEARCH_DEBOUNCE_MS = 320;
const VERIFY_DEBOUNCE_MS = 700;
/** Below this, the provider returns noise. */
const MIN_QUERY = 5;

export interface AddressValue {
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  /** True once the provider has confirmed the civic address. */
  validated: boolean;
  /** Which provider confirmed it, stored on the order. */
  source: string | null;
}

export const emptyAddress: AddressValue = {
  line1: "",
  line2: "",
  city: "",
  province: "QC",
  postalCode: "",
  country: "CA",
  latitude: null,
  longitude: null,
  validated: false,
  source: null,
};

type VerifyState =
  | "idle"
  | "searching"
  | "checking"
  | "verified"
  | "unverified"
  | "unavailable";

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

export default function AddressFields({
  value,
  onChange,
  errors,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  errors: Partial<Record<keyof AddressValue, string>>;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [state, setState] = useState<VerifyState>("idle");
  const [note, setNote] = useState<string | null>(null);
  const [confirmedLabel, setConfirmedLabel] = useState<string | null>(null);

  // Discards responses from superseded requests, so a slow earlier lookup can
  // never overwrite the result of a later one.
  const searchSeq = useRef(0);
  const verifySeq = useRef(0);
  // Set when the customer picks a suggestion, so the follow-up verify is skipped.
  const justPicked = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // ---- Autocomplete as the customer types ----------------------------------
  useEffect(() => {
    const query = value.line1.trim();

    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    if (query.length < MIN_QUERY) {
      setSuggestions([]);
      setOpen(false);
      if (state === "searching") setState("idle");
      return;
    }

    const seq = ++searchSeq.current;
    setState("searching");
    const timer = setTimeout(async () => {
      // Include the city so results are biased to where the customer lives.
      const q = value.city.trim() ? `${query}, ${value.city.trim()}` : query;
      const res = await searchAddressAction({ query: q, lang: "fr" });
      if (seq !== searchSeq.current) return; // superseded

      if (!res.ok) {
        setSuggestions([]);
        setOpen(false);
        setState("unavailable");
        setNote(res.note ?? null);
        return;
      }
      setSuggestions(res.suggestions);
      setOpen(res.suggestions.length > 0);
      setHighlighted(-1);
      setState("idle");
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // `state` intentionally omitted: including it would restart the debounce on
    // every status change and loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.line1, value.city]);

  // ---- Real-time verification once the address looks complete ---------------
  useEffect(() => {
    const { line1, city, province } = value;
    if (value.validated) return; // already confirmed via a suggestion
    if (line1.trim().length < MIN_QUERY || !city.trim() || !province) {
      return;
    }

    const seq = ++verifySeq.current;
    const timer = setTimeout(async () => {
      setState("checking");
      const res = await verifyAddressAction({
        line1: line1.trim(),
        city: city.trim(),
        province,
      });
      if (seq !== verifySeq.current) return;

      if (!res.ok) {
        setState("unavailable");
        setNote(res.note ?? null);
        return;
      }
      if (res.verified && res.match) {
        setState("verified");
        setConfirmedLabel(res.match.label);
        setNote(null);
        onChange({
          ...value,
          latitude: res.match.latitude,
          longitude: res.match.longitude,
          validated: true,
          source: "geo.ca",
        });
      } else {
        setState("unverified");
        setConfirmedLabel(null);
        setNote(res.note ?? null);
      }
    }, VERIFY_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.line1, value.city, value.province, value.validated]);

  // Close the suggestion list on an outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = useCallback(
    (s: AddressSuggestion) => {
      justPicked.current = true;
      setOpen(false);
      setSuggestions([]);
      setState(s.precise ? "verified" : "unverified");
      setConfirmedLabel(s.precise ? s.label : null);
      setNote(
        s.precise
          ? null
          : "Numéro civique manquant — précisez-le pour confirmer l'adresse."
      );
      onChange({
        ...value,
        line1: s.address.line1 || value.line1,
        city: s.address.city || value.city,
        province: s.address.province || value.province,
        latitude: s.latitude,
        longitude: s.longitude,
        validated: s.precise,
        source: s.precise ? "geo.ca" : null,
      });
    },
    [onChange, value]
  );

  /** Any edit to the address invalidates a previous confirmation. */
  function edit(patch: Partial<AddressValue>) {
    onChange({
      ...value,
      ...patch,
      validated: false,
      source: null,
      latitude: null,
      longitude: null,
    });
    setConfirmedLabel(null);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      pick(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const postalValid = !value.postalCode || isValidPostalCode(value.postalCode);

  return (
    <div className="space-y-4">
      {/* Street with live autocomplete */}
      <div ref={boxRef} className="relative">
        <label htmlFor="addr-line1" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="addr-line1"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="addr-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={
              highlighted >= 0 ? `addr-option-${highlighted}` : undefined
            }
            autoComplete="off"
            value={value.line1}
            onChange={(e) => edit({ line1: e.target.value })}
            onKeyDown={onKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="123 Rue Sainte-Catherine Ouest"
            className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.line1 ? "border-red-400" : "border-gray-300"
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {(state === "searching" || state === "checking") && <Spinner />}
            {state === "verified" && (
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        </div>

        {open && suggestions.length > 0 && (
          <ul
            id="addr-suggestions"
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {suggestions.map((s, i) => (
              <li
                key={`${s.label}-${i}`}
                id={`addr-option-${i}`}
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setHighlighted(i)}
                className={`px-4 py-2.5 text-sm cursor-pointer flex items-start gap-2 ${
                  i === highlighted ? "bg-gray-50" : ""
                }`}
              >
                <svg className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="min-w-0">
                  <span className="block text-gray-900 truncate">{s.label}</span>
                  {!s.precise && (
                    <span className="block text-[11px] text-amber-700">
                      rue seulement — ajoutez le numéro civique
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {errors.line1 && <p className="text-xs text-red-600 mt-1">{errors.line1}</p>}

        {/* Live verification feedback */}
        {!errors.line1 && state === "verified" && confirmedLabel && (
          <p className="text-xs text-green-700 mt-1">
            Adresse confirmée : {confirmedLabel}
          </p>
        )}
        {!errors.line1 && state === "checking" && (
          <p className="text-xs text-gray-500 mt-1">Vérification de l&apos;adresse…</p>
        )}
        {!errors.line1 && (state === "unverified" || state === "unavailable") && note && (
          <p className="text-xs text-amber-700 mt-1">
            {note} Vous pouvez continuer : nous confirmerons avant l&apos;expédition.
          </p>
        )}
      </div>

      {/* Apartment / unit */}
      <div>
        <label htmlFor="addr-line2" className="block text-sm font-medium text-gray-700 mb-1">
          Appartement, unité, étage <span className="text-gray-400">(optionnel)</span>
        </label>
        <input
          id="addr-line2"
          type="text"
          autoComplete="address-line2"
          value={value.line2}
          onChange={(e) => onChange({ ...value, line2: e.target.value })}
          placeholder="App. 4"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* City */}
        <div>
          <label htmlFor="addr-city" className="block text-sm font-medium text-gray-700 mb-1">
            Ville <span className="text-red-500">*</span>
          </label>
          <input
            id="addr-city"
            type="text"
            autoComplete="address-level2"
            value={value.city}
            onChange={(e) => edit({ city: e.target.value })}
            placeholder="Montréal"
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.city ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
        </div>

        {/* Province */}
        <div>
          <label htmlFor="addr-province" className="block text-sm font-medium text-gray-700 mb-1">
            Province <span className="text-red-500">*</span>
          </label>
          <select
            id="addr-province"
            autoComplete="address-level1"
            value={value.province}
            onChange={(e) => edit({ province: e.target.value })}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.province ? "border-red-400" : "border-gray-300"
            }`}
          >
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Postal code */}
        <div>
          <label htmlFor="addr-postal" className="block text-sm font-medium text-gray-700 mb-1">
            Code postal <span className="text-red-500">*</span>
          </label>
          <input
            id="addr-postal"
            type="text"
            inputMode="text"
            autoComplete="postal-code"
            maxLength={7}
            value={value.postalCode}
            onChange={(e) =>
              onChange({ ...value, postalCode: e.target.value.toUpperCase() })
            }
            onBlur={() =>
              value.postalCode &&
              onChange({ ...value, postalCode: formatPostalCode(value.postalCode) })
            }
            placeholder="H2X 1K4"
            aria-invalid={!postalValid}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.postalCode || !postalValid ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.postalCode ? (
            <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
          ) : !postalValid ? (
            <p className="text-xs text-red-600 mt-1">Format attendu : H2X 1K4</p>
          ) : null}
        </div>

        {/* Country — Canada only for now */}
        <div>
          <label htmlFor="addr-country" className="block text-sm font-medium text-gray-700 mb-1">
            Pays
          </label>
          <select
            id="addr-country"
            value={value.country}
            onChange={(e) => edit({ country: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="CA">Canada</option>
          </select>
          <p className="text-[11px] text-gray-400 mt-1">
            Nous livrons uniquement au Canada pour le moment.
          </p>
        </div>
      </div>
    </div>
  );
}
