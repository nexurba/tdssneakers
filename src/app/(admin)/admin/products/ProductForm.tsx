"use client";

import { useState, useMemo, useRef, useTransition, useEffect } from "react";
import {
  CATEGORIES,
  GENDERS,
  POPULAR_COLORS,
  getSizeOptions,
  sizeChartLabel,
  requiresGender,
  requiresSizes,
  isValidHex,
  findColor,
  type ProductCategory,
  type ProductGender,
} from "@/lib/catalog/taxonomy";
import {
  toSizePair,
  type SizeScale,
} from "@/lib/catalog/size-conversion";
import { uploadImagesAction, analyzeProductCodeAction } from "./actions";

export interface ProductFormState {
  productCode: string;
  name: string;
  brand: string;
  variant: string;
  price: string;
  category: ProductCategory;
  gender: ProductGender | "";
  /** For unisex: which scale the admin is entering sizes in. */
  sizeScale: SizeScale;
  color: string;
  colorHex: string;
  images: string[];
  description: string;
  sizes: string[];
  stockBySize: Record<string, string>;
  isNew: boolean;
  isBestSeller: boolean;
}

export const emptyProductForm: ProductFormState = {
  productCode: "",
  name: "",
  brand: "",
  variant: "",
  price: "",
  category: "sneakers",
  // Default so the size chart is visible immediately for shoes/clothing.
  gender: "homme",
  sizeScale: "men",
  color: "",
  colorHex: "",
  images: [],
  description: "",
  sizes: [],
  stockBySize: {},
  isNew: false,
  isBestSeller: false,
};

const inputCls =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500";

export default function ProductForm({
  value,
  onChange,
  mode,
}: {
  value: ProductFormState;
  onChange: (next: ProductFormState) => void;
  mode: "add" | "edit";
}) {
  const [isPending, startTransition] = useTransition();
  const [lookupMsg, setLookupMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [customColorName, setCustomColorName] = useState("");
  const [customColorHex, setCustomColorHex] = useState("#000000");
  const [customSize, setCustomSize] = useState("");
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsGender = requiresGender(value.category);
  const needsSizes = requiresSizes(value.category);
  const isUnisex = value.gender === "unisex";

  // For unisex, show the chart matching the scale the admin is typing in.
  const chartGender: ProductGender | null = isUnisex
    ? value.sizeScale === "women"
      ? "femme"
      : "homme"
    : ((value.gender || null) as ProductGender | null);

  const sizeOptions = useMemo(
    () => getSizeOptions(value.category, chartGender),
    [value.category, chartGender]
  );

  // Custom sizes are the selected ones absent from the predefined chart.
  const customSizes = useMemo(
    () => value.sizes.filter((s) => !sizeOptions.includes(s)),
    [value.sizes, sizeOptions]
  );

  function set<K extends keyof ProductFormState>(key: K, v: ProductFormState[K]) {
    onChange({ ...value, [key]: v });
  }

  // Clear gender/sizes when switching to a category that doesn't use them.
  useEffect(() => {
    if (!needsGender && value.gender !== "") {
      onChange({ ...value, gender: "", sizes: [], stockBySize: {} });
      return;
    }
    if (!needsSizes && value.sizes.length > 0) {
      onChange({ ...value, sizes: [], stockBySize: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.category]);

  // ---- Product code analysis (local) -----------------------------------------

  function analyzeCode() {
    if (!value.productCode.trim()) {
      setLookupMsg({ type: "err", text: "Entrez un code produit." });
      return;
    }
    setLookupMsg(null);
    startTransition(async () => {
      const res = await analyzeProductCodeAction(value.productCode);
      if (!res.ok || !res.data) {
        setLookupMsg({ type: "err", text: res.error ?? "Analyse impossible." });
        return;
      }
      const d = res.data;
      const next: ProductFormState = { ...value };
      const filled: string[] = [];

      // Normalised code (e.g. DN1772305 -> DN1772-305).
      if (d.productCode && d.productCode !== value.productCode) {
        next.productCode = d.productCode;
        filled.push("code normalisé");
      }
      if (d.brand && !value.brand) { next.brand = d.brand; filled.push("marque"); }
      if (d.category) { next.category = d.category; filled.push("catégorie"); }

      onChange(next);

      const parts: string[] = [];
      parts.push(
        filled.length
          ? `Appliqué: ${filled.join(", ")}.`
          : "Rien à compléter (champs déjà remplis)."
      );
      if (d.note) parts.push(d.note);

      setLookupMsg({ type: filled.length ? "ok" : "info", text: parts.join(" ") });
    });
  }

  // ---- Image upload ----------------------------------------------------------

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    setUploading(true);
    setUploadMsg(null);
    startTransition(async () => {
      const res = await uploadImagesAction(fd);
      setUploading(false);
      if (res.urls.length > 0) {
        onChange({ ...value, images: [...value.images, ...res.urls] });
      }
      if (!res.ok) setUploadMsg({ type: "err", text: res.error ?? "Échec du téléversement." });
      else if (res.error) setUploadMsg({ type: "err", text: res.error });
      else setUploadMsg({ type: "ok", text: `${res.urls.length} image(s) téléversée(s).` });
    });
  }

  function addUrl() {
    const url = urlDraft.trim();
    if (!url) return;
    onChange({ ...value, images: [...value.images, url] });
    setUrlDraft("");
  }

  function removeImage(i: number) {
    set("images", value.images.filter((_, idx) => idx !== i));
  }

  function moveImage(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.images.length) return;
    const next = [...value.images];
    [next[i], next[j]] = [next[j], next[i]];
    set("images", next);
  }

  // ---- Colours ---------------------------------------------------------------

  function pickColor(name: string, hex: string) {
    onChange({ ...value, color: name, colorHex: hex });
  }

  function addCustomColor() {
    const name = customColorName.trim();
    if (!name) return;
    if (!isValidHex(customColorHex)) return;
    pickColor(name, customColorHex);
    setCustomColorName("");
    setCustomColorOpen(false);
  }

  // ---- Sizes -----------------------------------------------------------------

  function toggleSize(size: string) {
    const has = value.sizes.includes(size);
    const sizes = has
      ? value.sizes.filter((s) => s !== size)
      : [...value.sizes, size];
    const stockBySize = { ...value.stockBySize };
    if (has) delete stockBySize[size];
    onChange({ ...value, sizes, stockBySize });
  }

  function addCustomSize() {
    const s = customSize.trim();
    if (!s || value.sizes.includes(s)) {
      setCustomSize("");
      return;
    }
    onChange({ ...value, sizes: [...value.sizes, s] });
    setCustomSize("");
  }

  function selectAllSizes() {
    const merged = Array.from(new Set([...value.sizes, ...sizeOptions]));
    onChange({ ...value, sizes: merged });
  }

  return (
    <div className="space-y-6">
      {/* ---- Code analysis (local) ---- */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">Analyse du code produit</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={value.productCode}
            onChange={(e) => set("productCode", e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); analyzeCode(); } }}
            className={`${inputCls} font-mono`}
            placeholder="Code produit / style (ex: DN1772305)"
          />
          <button
            type="button"
            onClick={analyzeCode}
            disabled={isPending}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isPending ? "Analyse..." : "Analyser le code"}
          </button>
        </div>
        {lookupMsg && (
          <p
            className={`text-xs mt-2 ${
              lookupMsg.type === "ok"
                ? "text-green-600"
                : lookupMsg.type === "info"
                ? "text-gray-600"
                : "text-amber-700"
            }`}
          >
            {lookupMsg.text}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-1.5">
          Normalise le format (ex: DN1772305 → DN1772-305) et déduit la marque et la catégorie
          à partir du code. Traitement local, aucun service externe.
        </p>
      </section>

      {/* ---- Category (drives the rest of the form) ---- */}
      <section>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Type de produit <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("category", c.value)}
              className={`px-3 py-3 rounded-lg border text-sm font-medium transition-colors ${
                value.category === c.value
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {!needsGender && (
          <p className="text-[11px] text-gray-500 mt-1.5">
            Les accessoires n&apos;ont ni genre ni taille.
          </p>
        )}
      </section>

      {/* ---- Gender (conditional) ---- */}
      {needsGender && (
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Genre <span className="text-red-500">*</span>
          </label>
          <select
            value={value.gender}
            onChange={(e) => {
              // Changing gender invalidates previously picked chart sizes.
              const g = e.target.value as ProductGender | "";
              const keep = value.sizes.filter(
                (s) => !getSizeOptions(value.category, (value.gender || null) as ProductGender | null).includes(s)
              );
              onChange({ ...value, gender: g, sizes: keep, stockBySize: {} });
            }}
            className={inputCls}
          >
            <option value="">Sélectionner un genre…</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </section>
      )}

      {/* ---- Core details ---- */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nom" required>
          <input value={value.name} onChange={(e) => set("name", e.target.value)} className={inputCls} placeholder="Air Jordan 1 Retro High" />
        </Field>
        <Field label="Marque">
          <input value={value.brand} onChange={(e) => set("brand", e.target.value)} className={inputCls} placeholder="Nike" />
        </Field>
        <Field label="Code produit" required>
          <input
            value={value.productCode}
            onChange={(e) => set("productCode", e.target.value)}
            className={`${inputCls} font-mono`}
            placeholder="DN1772-305"
          />
        </Field>
        <Field label="Prix (CAD)" required>
          <input type="number" min="0" step="0.01" value={value.price} onChange={(e) => set("price", e.target.value)} className={inputCls} placeholder="220" />
        </Field>
      </section>

      <Field label="Description">
        <textarea value={value.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} placeholder="Détails, matériaux, coupe…" />
      </Field>

      {/* ---- Colour ---- */}
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Couleur <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_COLORS.map((c) => {
            const selected = value.color.toLowerCase() === c.name.toLowerCase();
            const isGradient = c.hex === "linear-gradient";
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => pickColor(c.name, isGradient ? "" : c.hex)}
                title={c.name}
                className={`flex items-center gap-1.5 pl-1.5 pr-2.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  selected ? "border-gray-900 ring-2 ring-gray-900/15" : "border-gray-300 hover:border-gray-500"
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                  style={
                    isGradient
                      ? { background: "conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }
                      : { backgroundColor: c.hex }
                  }
                />
                {c.name}
              </button>
            );
          })}

          {/* Custom colour chip (when active and not a predefined one) */}
          {value.color && !findColor(value.color) && (
            <span className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-full border border-gray-900 ring-2 ring-gray-900/15 text-xs font-medium">
              <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: value.colorHex || "#ccc" }} />
              {value.color}
              <button type="button" onClick={() => pickColor("", "")} className="text-gray-400 hover:text-red-600" aria-label="Retirer la couleur">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={() => setCustomColorOpen((s) => !s)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-dashed border-gray-400 text-xs font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Couleur perso
          </button>
        </div>

        {customColorOpen && (
          <div className="mt-3 flex flex-wrap items-end gap-2 bg-gray-50 border rounded-lg p-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Nom</label>
              <input
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomColor(); } }}
                className="px-2.5 py-1.5 border rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Sarcelle"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">Teinte</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={isValidHex(customColorHex) ? customColorHex : "#000000"}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="w-9 h-9 rounded border cursor-pointer"
                />
                <input
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-lg text-sm w-24 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="#0d9488"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={addCustomColor}
              disabled={!customColorName.trim() || !isValidHex(customColorHex)}
              className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              Ajouter
            </button>
          </div>
        )}
      </section>

      {/* ---- Sizes (conditional on category + gender) ---- */}
      {needsSizes && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Tailles <span className="text-red-500">*</span>
              {value.gender && (
                <span className="ml-2 text-[11px] font-normal text-gray-500">
                  {sizeChartLabel(value.category, value.gender as ProductGender)}
                </span>
              )}
            </label>
            {sizeOptions.length > 0 && (
              <button type="button" onClick={selectAllSizes} className="text-[11px] font-medium text-primary hover:underline">
                Tout sélectionner
              </button>
            )}
          </div>

          {/* Unisex: choose the input scale; conversion is automatic. */}
          {isUnisex && (
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-2">
                Produit unisexe — saisissez les tailles dans l&apos;échelle de votre choix.
                La conversion est automatique et le produit sera visible côté Homme et Femme.
              </p>
              <div className="flex gap-2">
                {([
                  { v: "men" as SizeScale, label: "Échelle Homme" },
                  { v: "women" as SizeScale, label: "Échelle Femme" },
                ]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => set("sizeScale", opt.v)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      value.sizeScale === opt.v
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-800 border-blue-300 hover:border-blue-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {value.sizes.length > 0 && (
                <p className="text-[11px] text-blue-800 mt-2">
                  Équivalences :{" "}
                  {value.sizes
                    .map((s) => {
                      const pair = toSizePair(value.category, value.sizeScale, s);
                      return pair ? `${pair.men}H↔${pair.women}F` : `${s} (tel quel)`;
                    })
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          {!value.gender ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Sélectionnez d&apos;abord un genre pour afficher les tailles disponibles.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`min-w-[3rem] px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      value.sizes.includes(s)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-900"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Custom sizes */}
              {customSizes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customSizes.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-gray-900 bg-gray-900 text-white text-sm font-medium">
                      {s}
                      <button type="button" onClick={() => toggleSize(s)} className="opacity-70 hover:opacity-100" aria-label={`Retirer ${s}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <input
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                  className="px-3 py-2 border rounded-lg text-sm w-40 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Taille perso (ex: 15)"
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  disabled={!customSize.trim()}
                  className="px-3 py-2 border border-dashed border-gray-400 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40"
                >
                  + Ajouter la taille
                </button>
              </div>

              {/* Stock per selected size */}
              {value.sizes.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Quantité par taille</p>
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...value,
                          stockBySize: Object.fromEntries(value.sizes.map((s) => [s, "1"])),
                        })
                      }
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Tout mettre à 1
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {value.sizes.map((s) => {
                      const pair = isUnisex
                        ? toSizePair(value.category, value.sizeScale, s)
                        : null;
                      return (
                        <div key={s} className="flex items-center gap-1.5 border rounded-lg px-2 py-1">
                          <span className="text-xs font-medium text-gray-600 min-w-[2rem]">
                            {pair ? `${pair.men}H/${pair.women}F` : s}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={value.stockBySize[s] ?? ""}
                            onChange={(e) =>
                              onChange({
                                ...value,
                                stockBySize: { ...value.stockBySize, [s]: e.target.value },
                              })
                            }
                            placeholder="1"
                            className="w-16 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Quantité par défaut : 1. {mode === "edit" ? "Laissez vide pour conserver la quantité actuelle." : ""}
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ---- Images: drag & drop ---- */}
      <section>
        <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>

        <div
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragActive ? "border-primary bg-red-50" : "border-gray-300 hover:border-gray-400 bg-gray-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-sm font-medium text-gray-700">
            {uploading ? "Téléversement en cours…" : "Glissez-déposez vos images ici"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            ou cliquez pour parcourir · JPG, PNG, WebP, AVIF · max 8 Mo
          </p>
        </div>

        {uploadMsg && (
          <p className={`text-xs mt-2 ${uploadMsg.type === "ok" ? "text-green-600" : "text-amber-700"}`}>
            {uploadMsg.text}
          </p>
        )}

        {/* Paste-a-URL fallback */}
        <div className="flex gap-2 mt-3">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
            className={inputCls}
            placeholder="…ou collez une URL d'image"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlDraft.trim()}
            className="shrink-0 px-3 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>

        {/* Gallery with ordering */}
        {value.images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
            {value.images.map((src, i) => (
              <div key={`${src}-${i}`} className="relative group rounded-lg overflow-hidden border bg-gray-100 aspect-square">
                <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    PRINCIPALE
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="text-white disabled:opacity-30 p-0.5" aria-label="Déplacer à gauche">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button type="button" onClick={() => removeImage(i)} className="text-white hover:text-red-400 p-0.5" aria-label="Supprimer">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <button type="button" onClick={() => moveImage(i, 1)} disabled={i === value.images.length - 1} className="text-white disabled:opacity-30 p-0.5" aria-label="Déplacer à droite">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- Flags ---- */}
      <section className="flex gap-6 pt-2 border-t">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={value.isNew} onChange={(e) => set("isNew", e.target.checked)} className="w-4 h-4 accent-red-500 rounded" />
          <span className="text-sm">Nouveauté</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={value.isBestSeller} onChange={(e) => set("isBestSeller", e.target.checked)} className="w-4 h-4 accent-red-500 rounded" />
          <span className="text-sm">Best seller</span>
        </label>
      </section>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
