"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  COLUMNS,
  IMAGE_EXTENSIONS,
  matchImages,
  type ImportRow,
} from "@/lib/catalog/product-import";
import { CATEGORIES } from "@/lib/catalog/taxonomy";
import { safeCall } from "@/lib/actions/safe-call";
import { uploadImagesToBlob } from "@/lib/storage/client-upload";
import {
  finishImportAction,
  importRowAction,
  parseImportFileAction,
  type ParseResult,
} from "./actions";

/** How many rows are imported at once. Keeps progress visible but not glacial. */
const CONCURRENCY = 3;

/**
 * Ceiling for the spreadsheet, kept under Vercel's ~4.5 MB function request
 * body cap so the failure is explained rather than surfacing as a raw 413.
 */
const SHEET_MAX_BYTES = 4 * 1024 * 1024;

type RowState =
  | "pending"
  | "uploading"
  | "running"
  | "created"
  | "updated"
  | "skipped"
  | "error";

interface RowStatus {
  state: RowState;
  message?: string;
  warnings?: string[];
  imageCount?: number;
  /** Images sent so far, while state is "uploading". */
  uploaded?: number;
  total?: number;
}

// ---- Small presentational helpers ------------------------------------------

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}

function StatusBadge({ status }: { status: RowStatus | undefined }) {
  if (!status || status.state === "pending") {
    return <span className="text-xs text-gray-400">en attente</span>;
  }
  if (status.state === "uploading") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-700">
        <Spinner className="w-3.5 h-3.5" />
        images {(status.uploaded ?? 0) + 1}/{status.total ?? 0}
      </span>
    );
  }
  if (status.state === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-700">
        <Spinner className="w-3.5 h-3.5" />
        import…
      </span>
    );
  }
  const map: Record<string, { cls: string; label: string }> = {
    created: { cls: "bg-green-100 text-green-800", label: "créé" },
    updated: { cls: "bg-blue-100 text-blue-800", label: "mis à jour" },
    skipped: { cls: "bg-gray-100 text-gray-600", label: "ignoré" },
    error: { cls: "bg-red-100 text-red-800", label: "échec" },
  };
  const v = map[status.state];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${v.cls}`}>
      {v.label}
    </span>
  );
}

/** Recursively pulls files out of a drop, so dragging a folder works. */
async function filesFromDataTransfer(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items)
    .map((item) => (item.kind === "file" ? item.webkitGetAsEntry?.() : null))
    .filter(Boolean) as FileSystemEntry[];

  if (entries.length === 0) return Array.from(dt.files);

  const out: File[] = [];
  async function walk(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File | null>((resolve) =>
        (entry as FileSystemFileEntry).file(resolve, () => resolve(null))
      );
      if (file) out.push(file);
      return;
    }
    if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const children = await new Promise<FileSystemEntry[]>((resolve) =>
        reader.readEntries(resolve, () => resolve([]))
      );
      for (const child of children) await walk(child);
    }
  }
  for (const entry of entries) await walk(entry);
  return out;
}

function isImageName(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.includes(ext);
}

// ---- Main component ---------------------------------------------------------

export default function BulkImport({
  dbConfigured,
  blobAvailable,
}: {
  dbConfigured: boolean;
  /** True when images can be uploaded straight from the browser to Blob. */
  blobAvailable: boolean;
}) {
  const router = useRouter();

  const [parsing, setParsing] = useState(false);
  const [parse, setParse] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fatal, setFatal] = useState<string>("");

  const [images, setImages] = useState<File[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");

  const [importing, setImporting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [statuses, setStatuses] = useState<Record<number, RowStatus>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const sheetInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [dragTarget, setDragTarget] = useState<"sheet" | "images" | null>(null);

  const rows = parse?.rows ?? [];
  const existingCodes = useMemo(
    () => new Set(parse?.existingCodes ?? []),
    [parse]
  );

  const imageMatch = useMemo(
    () => matchImages(rows, images),
    [rows, images]
  );

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalidCount = rows.length - validRows.length;

  const importableRows = useMemo(() => {
    if (duplicateMode === "update") return validRows;
    return validRows.filter(
      (r) => !existingCodes.has(r.productCode.trim().toLowerCase())
    );
  }, [validRows, duplicateMode, existingCodes]);

  // ---- Step 1: spreadsheet --------------------------------------------------

  const handleSheet = useCallback(async (file: File) => {
    setFatal("");
    setParse(null);
    setStatuses({});
    setFinished(false);
    setFileName(file.name);

    // The spreadsheet does travel through the Server Action, and a hosted
    // function rejects bodies over roughly 4.5 MB with a bare 413. Catching it
    // here gives an actionable message instead.
    if (file.size > SHEET_MAX_BYTES) {
      setFatal(
        `Ce fichier fait ${(file.size / 1024 / 1024).toFixed(1)} Mo, au-delà de la limite de 4 Mo. ` +
          `Un fichier de produits dépasse rarement quelques centaines de Ko : ` +
          `s'il est très lourd, il contient probablement des images intégrées — ` +
          `retirez-les et déposez les photos dans l'étape 2.`
      );
      return;
    }

    setParsing(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await safeCall(() => parseImportFileAction(fd));
      const parsed = result as ParseResult;
      if (!parsed.ok) {
        setFatal(parsed.error ?? "Lecture impossible.");
        // Keep partial info (missing columns) so the message is actionable.
        setParse(parsed.rows?.length ? parsed : null);
      } else {
        setParse(parsed);
      }
    } finally {
      setParsing(false);
    }
  }, []);

  // ---- Step 3: run the import ----------------------------------------------

  async function runImport() {
    if (importableRows.length === 0) return;
    setImporting(true);
    setFinished(false);

    setStatuses((prev) => {
      const next = { ...prev };
      for (const r of importableRows) next[r.rowNumber] = { state: "pending" };
      return next;
    });

    const queue = [...importableRows];

    async function worker() {
      for (;;) {
        const row = queue.shift();
        if (!row) return;
        let uploadErrors: string[] = [];

        setStatuses((s) => ({ ...s, [row.rowNumber]: { state: "running" } }));

        const fd = new FormData();
        fd.append("row", JSON.stringify(row));
        fd.append("mode", duplicateMode);

        const rowFiles = imageMatch.byRow.get(row.rowNumber) ?? [];
        if (rowFiles.length > 0) {
          if (blobAvailable) {
            // Straight from the browser to Blob. Routing these bytes through the
            // Server Action would exceed Vercel's 4.5 MB function body cap and
            // fail with a 413 before any of our code ran.
            setStatuses((s) => ({
              ...s,
              [row.rowNumber]: { state: "uploading", uploaded: 0, total: rowFiles.length },
            }));
            const { urls, errors: upErrors } = await uploadImagesToBlob(
              rowFiles,
              (index) =>
                setStatuses((s) => ({
                  ...s,
                  [row.rowNumber]: {
                    state: "uploading",
                    uploaded: index,
                    total: rowFiles.length,
                  },
                }))
            );
            for (const u of urls) fd.append("imageUrls", u.url);
            uploadErrors = upErrors;
            setStatuses((s) => ({ ...s, [row.rowNumber]: { state: "running" } }));
          } else {
            // Development fallback: no Blob token, so the action writes to disk.
            for (const file of rowFiles) fd.append("files", file);
          }
        }

        const res = (await safeCall(() => importRowAction(fd))) as Awaited<
          ReturnType<typeof importRowAction>
        >;

        setStatuses((s) => ({
          ...s,
          [row.rowNumber]: res.ok
            ? {
                state: res.outcome ?? "created",
                // Surface image failures alongside anything the server reported.
                warnings: [...uploadErrors, ...(res.warnings ?? [])],
                imageCount: res.imageCount,
              }
            : { state: "error", message: res.error ?? "Erreur inconnue" },
        }));
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker)
    );

    await safeCall(() => finishImportAction());
    setImporting(false);
    setFinished(true);
    router.refresh();
  }

  const summary = useMemo(() => {
    const values = Object.values(statuses);
    return {
      created: values.filter((s) => s.state === "created").length,
      updated: values.filter((s) => s.state === "updated").length,
      skipped: values.filter((s) => s.state === "skipped").length,
      failed: values.filter((s) => s.state === "error").length,
    };
  }, [statuses]);

  function reset() {
    setParse(null);
    setFileName("");
    setImages([]);
    setStatuses({});
    setFatal("");
    setFinished(false);
    if (sheetInput.current) sheetInput.current.value = "";
    if (imageInput.current) imageInput.current.value = "";
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Import en masse</h1>
          <p className="text-sm text-gray-500 mt-1">
            Déposez un fichier Excel, puis les images nommées d&apos;après le produit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/products/import/template"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            Télécharger le modèle
          </a>
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Retour
          </Link>
        </div>
      </div>

      {!dbConfigured && (
        <p className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
          Base de données non configurée : l&apos;import est désactivé.
        </p>
      )}

      {parse && !parse.uploadAvailable && (
        <p className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg px-4 py-3">
          Stockage d&apos;images non configuré : les produits seront créés avec
          l&apos;image par défaut. Ajoutez BLOB_READ_WRITE_TOKEN pour importer les visuels.
        </p>
      )}

      {/* Step 1 — spreadsheet */}
      <section className="bg-white rounded-xl border p-5">
        <h2 className="font-bold text-sm text-gray-900 mb-1">
          1. Fichier Excel
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Colonnes obligatoires :{" "}
          {COLUMNS.filter((c) => c.requirement === "required")
            .map((c) => c.header)
            .join(", ")}
          . Le genre et les tailles sont requis sauf pour les accessoires.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragTarget("sheet");
          }}
          onDragLeave={() => setDragTarget(null)}
          onDrop={async (e) => {
            e.preventDefault();
            setDragTarget(null);
            const dropped = Array.from(e.dataTransfer.files);
            const sheet = dropped.find((f) => /\.(xlsx|xlsm|csv)$/i.test(f.name));
            if (sheet) await handleSheet(sheet);
            else setFatal("Déposez un fichier .xlsx ou .csv.");
          }}
          onClick={() => sheetInput.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragTarget === "sheet"
              ? "border-red-500 bg-red-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            ref={sheetInput}
            type="file"
            accept=".xlsx,.xlsm,.csv"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await handleSheet(f);
            }}
          />
          {parsing ? (
            <span className="inline-flex items-center gap-2 text-sm text-gray-700">
              <Spinner />
              Analyse de {fileName}…
            </span>
          ) : fileName ? (
            <span className="text-sm text-gray-700">
              <strong>{fileName}</strong>
              {parse?.sheetName ? ` — feuille « ${parse.sheetName} »` : ""}
              <span className="block text-xs text-gray-500 mt-1">
                Cliquez ou déposez pour remplacer
              </span>
            </span>
          ) : (
            <span className="text-sm text-gray-600">
              Cliquez ou déposez le fichier .xlsx ici
            </span>
          )}
        </div>

        {fatal && (
          <p className="mt-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3">
            {fatal}
          </p>
        )}

        {parse?.ok && parse.error && (
          <p className="mt-3 bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-lg px-4 py-3">
            {parse.error}
          </p>
        )}

        {parse && parse.unknownColumns.length > 0 && (
          <p className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Colonnes ignorées : {parse.unknownColumns.join(", ")}
          </p>
        )}
      </section>

      {/* Step 2 — images */}
      {parse?.ok && (
        <section className="bg-white rounded-xl border p-5">
          <h2 className="font-bold text-sm text-gray-900 mb-1">2. Images</h2>
          <p className="text-xs text-gray-500 mb-3">
            Nommez les fichiers d&apos;après le nom du produit ou son code, suivi de
            <code className="mx-1 px-1 bg-gray-100 rounded">_1</code>,
            <code className="mx-1 px-1 bg-gray-100 rounded">_2</code>… —
            <code className="mx-1 px-1 bg-gray-100 rounded">_1</code> devient l&apos;image
            principale. Accents, espaces et majuscules sont ignorés. Formats :{" "}
            {IMAGE_EXTENSIONS.join(", ")}.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragTarget("images");
            }}
            onDragLeave={() => setDragTarget(null)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragTarget(null);
              const dropped = await filesFromDataTransfer(e.dataTransfer);
              setImages((prev) => [...prev, ...dropped.filter((f) => isImageName(f.name))]);
            }}
            onClick={() => imageInput.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragTarget === "images"
                ? "border-red-500 bg-red-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              ref={imageInput}
              type="file"
              accept={IMAGE_EXTENSIONS.map((e) => `.${e}`).join(",")}
              multiple
              className="hidden"
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                setImages((prev) => [...prev, ...picked.filter((f) => isImageName(f.name))]);
              }}
            />
            <span className="text-sm text-gray-600">
              Cliquez ou déposez les images (un dossier fonctionne aussi)
            </span>
          </div>

          {images.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-4 flex-wrap text-sm">
              <p className="text-gray-700">
                <strong>{images.length}</strong> image(s) —{" "}
                <span className="text-green-700">
                  {images.length - imageMatch.unmatched.length} associée(s)
                </span>
                {imageMatch.unmatched.length > 0 && (
                  <>
                    {" · "}
                    <span className="text-amber-700">
                      {imageMatch.unmatched.length} sans correspondance
                    </span>
                  </>
                )}
              </p>
              <button
                onClick={() => {
                  setImages([]);
                  if (imageInput.current) imageInput.current.value = "";
                }}
                className="text-xs text-gray-500 hover:text-red-600 underline"
              >
                Tout retirer
              </button>
            </div>
          )}

          {imageMatch.unmatched.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-amber-800 cursor-pointer">
                Voir les {imageMatch.unmatched.length} image(s) non associée(s)
              </summary>
              <ul className="mt-2 text-xs text-gray-600 space-y-0.5 max-h-32 overflow-y-auto">
                {imageMatch.unmatched.map((f) => (
                  <li key={f.name}>
                    {f.name} — aucun produit correspondant
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {/* Step 3 — review & import */}
      {parse?.ok && rows.length > 0 && (
        <section className="bg-white rounded-xl border overflow-hidden">
          <div className="p-5 border-b flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-bold text-sm text-gray-900">
                3. Vérification ({rows.length} ligne{rows.length > 1 ? "s" : ""})
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                <span className="text-green-700 font-medium">{validRows.length} valide(s)</span>
                {invalidCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-red-700 font-medium">
                      {invalidCount} en erreur (exclue{invalidCount > 1 ? "s" : ""})
                    </span>
                  </>
                )}
                {existingCodes.size > 0 && (
                  <>
                    {" · "}
                    <span className="text-blue-700 font-medium">
                      {existingCodes.size} code(s) déjà en base
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-end gap-3 flex-wrap">
              <label className="text-xs text-gray-700">
                <span className="block mb-1 font-medium">Codes déjà en base</span>
                <select
                  value={duplicateMode}
                  onChange={(e) => setDuplicateMode(e.target.value as "skip" | "update")}
                  disabled={importing}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="skip">Ignorer la ligne</option>
                  <option value="update">Mettre à jour le produit</option>
                </select>
              </label>

              <button
                onClick={runImport}
                disabled={!dbConfigured || importing || importableRows.length === 0}
                className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {importing && <Spinner className="w-4 h-4" />}
                {importing
                  ? "Import en cours…"
                  : `Importer ${importableRows.length} produit${importableRows.length > 1 ? "s" : ""}`}
              </button>
            </div>
          </div>

          {finished && (
            <div className="px-5 py-3 bg-gray-50 border-b text-sm flex items-center gap-4 flex-wrap">
              <strong className="text-gray-900">Terminé.</strong>
              <span className="text-green-700">{summary.created} créé(s)</span>
              <span className="text-blue-700">{summary.updated} mis à jour</span>
              <span className="text-gray-600">{summary.skipped} ignoré(s)</span>
              <span className={summary.failed > 0 ? "text-red-700" : "text-gray-600"}>
                {summary.failed} échec(s)
              </span>
              <Link href="/admin/products" className="ml-auto underline text-gray-700">
                Voir le catalogue
              </Link>
              <button onClick={reset} className="underline text-gray-700">
                Nouvel import
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Ligne</th>
                  <th className="px-3 py-2 font-semibold">Produit</th>
                  <th className="px-3 py-2 font-semibold">Catégorie</th>
                  <th className="px-3 py-2 font-semibold">Prix</th>
                  <th className="px-3 py-2 font-semibold">Tailles</th>
                  <th className="px-3 py-2 font-semibold">Stock</th>
                  <th className="px-3 py-2 font-semibold">Images</th>
                  <th className="px-3 py-2 font-semibold">Validation</th>
                  <th className="px-3 py-2 font-semibold">État</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => {
                  const status = statuses[row.rowNumber];
                  const matched = imageMatch.byRow.get(row.rowNumber) ?? [];
                  const isExisting = existingCodes.has(
                    row.productCode.trim().toLowerCase()
                  );
                  const blocked = row.errors.length > 0;
                  const open = expanded[row.rowNumber];
                  const stockTotal = row.stockBySize
                    ? Object.values(row.stockBySize).reduce((a, b) => a + b, 0)
                    : row.sizes.length;

                  return (
                    <tr
                      key={row.rowNumber}
                      className={
                        blocked
                          ? "bg-red-50/50"
                          : status?.state === "error"
                            ? "bg-red-50/50"
                            : ""
                      }
                    >
                      <td className="px-3 py-2 text-gray-500 tabular-nums">{row.rowNumber}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">
                          {row.name || <em className="text-gray-400">sans nom</em>}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {row.productCode || "—"}
                          {isExisting && (
                            <span className="ml-2 text-blue-700 font-sans">
                              déjà en base
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {CATEGORIES.find((c) => c.value === row.category)?.label ??
                          row.category}
                        {row.gender && (
                          <span className="block text-xs text-gray-500">{row.gender}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-gray-700">
                        {row.price.toFixed(2)} $
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        <span title={row.sizes.join(", ")}>{row.sizes.length}</span>
                      </td>
                      <td className="px-3 py-2 tabular-nums text-gray-700">{stockTotal}</td>
                      <td className="px-3 py-2">
                        {matched.length > 0 ? (
                          <span className="text-gray-700" title={matched.map((f) => f.name).join("\n")}>
                            {matched.length}
                          </span>
                        ) : (
                          <span className="text-amber-700 text-xs">aucune</span>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-xs">
                        {blocked ? (
                          <button
                            onClick={() =>
                              setExpanded((e) => ({ ...e, [row.rowNumber]: !open }))
                            }
                            className="text-left text-xs text-red-700"
                          >
                            {row.errors.length} erreur{row.errors.length > 1 ? "s" : ""}
                            {open ? " ▴" : " ▾"}
                            {open && (
                              <ul className="mt-1 list-disc list-inside font-normal space-y-0.5">
                                {row.errors.map((e, i) => (
                                  <li key={i}>{e}</li>
                                ))}
                              </ul>
                            )}
                          </button>
                        ) : row.warnings.length > 0 || status?.warnings?.length ? (
                          <button
                            onClick={() =>
                              setExpanded((e) => ({ ...e, [row.rowNumber]: !open }))
                            }
                            className="text-left text-xs text-amber-700"
                          >
                            {row.warnings.length + (status?.warnings?.length ?? 0)} avertissement(s)
                            {open ? " ▴" : " ▾"}
                            {open && (
                              <ul className="mt-1 list-disc list-inside font-normal space-y-0.5">
                                {[...row.warnings, ...(status?.warnings ?? [])].map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-green-700">ok</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {blocked ? (
                          <span className="text-xs text-gray-400">exclue</span>
                        ) : (
                          <>
                            <StatusBadge status={status} />
                            {status?.state === "error" && status.message && (
                              <p className="text-[11px] text-red-700 mt-1 max-w-[16rem]">
                                {status.message}
                              </p>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
