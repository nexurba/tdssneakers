"use server";

import { revalidatePath } from "next/cache";
import { db, isDbConfigured } from "@/db";
import { products } from "@/db/schema";
import { assertAdmin } from "@/lib/auth/admin";
import { isUploadAvailable } from "@/lib/storage/blob";
import { importOneRow } from "@/lib/catalog/import-write";
import {
  flagDuplicateCodes,
  parseRow,
  type ImportRow,
} from "@/lib/catalog/product-import";
import {
  MAX_IMPORT_ROWS,
  readSheetRecords,
} from "@/lib/catalog/import-read";

// ---- Parse & validate -------------------------------------------------------

export interface ParseResult {
  ok: boolean;
  error?: string;
  /** Every non-blank data row, valid or not. */
  rows: ImportRow[];
  /** Headers present in the file that we do not recognise. */
  unknownColumns: string[];
  /** Required headers the file is missing — blocks the whole import. */
  missingColumns: string[];
  /** Product codes that already exist in the catalogue, lowercased. */
  existingCodes: string[];
  sheetName?: string;
  uploadAvailable: boolean;
}

/**
 * Reads the uploaded spreadsheet, validates every row and reports which
 * product codes already exist. Performs no writes.
 */
export async function parseImportFileAction(
  formData: FormData
): Promise<ParseResult> {
  const denied = await assertAdmin();
  if (denied) {
    return {
      ok: false,
      error: denied.error,
      rows: [],
      unknownColumns: [],
      missingColumns: [],
      existingCodes: [],
      uploadAvailable: false,
    };
  }

  const empty = {
    rows: [] as ImportRow[],
    unknownColumns: [] as string[],
    missingColumns: [] as string[],
    existingCodes: [] as string[],
    uploadAvailable: isUploadAvailable(),
  };

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Aucun fichier reçu.", ...empty };
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xlsm") && !name.endsWith(".csv")) {
    return {
      ok: false,
      error: "Format non supporté. Utilisez un fichier .xlsx (ou .csv).",
      ...empty,
    };
  }

  const sheet = await readSheetRecords(
    Buffer.from(await file.arrayBuffer()),
    file.name
  );

  if (!sheet.ok) {
    return {
      ok: false,
      error: sheet.error,
      ...empty,
      unknownColumns: sheet.unknownColumns,
      missingColumns: sheet.missingColumns,
    };
  }

  const rows = sheet.records.map(({ record, rowNumber }) =>
    parseRow(record, rowNumber)
  );

  flagDuplicateCodes(rows);

  if (rows.length === 0) {
    return {
      ok: false,
      error: "Aucune ligne de produit trouvée sous la ligne d'en-têtes.",
      ...empty,
      unknownColumns: sheet.unknownColumns,
    };
  }

  // Which of these product codes already exist?
  let existingCodes: string[] = [];
  if (isDbConfigured) {
    try {
      const codes = new Set(
        rows.map((r) => r.productCode.trim().toLowerCase()).filter(Boolean)
      );
      const all = await db
        .select({ code: products.productCode })
        .from(products);
      existingCodes = all
        .map((r) => (r.code ?? "").trim().toLowerCase())
        .filter((c) => c && codes.has(c));
    } catch {
      // Duplicate detection is advisory; a failure here must not block parsing.
    }
  }

  return {
    ok: true,
    rows,
    unknownColumns: sheet.unknownColumns,
    missingColumns: [],
    existingCodes: Array.from(new Set(existingCodes)),
    sheetName: sheet.sheetName,
    uploadAvailable: isUploadAvailable(),
    error: sheet.truncated
      ? `Fichier tronqué à ${MAX_IMPORT_ROWS} lignes. Importez le reste dans un second fichier.`
      : undefined,
  };
}


/**
 * Re-runs the spreadsheet validation on a row that came back from the browser,
 * so a tampered payload cannot bypass the taxonomy rules.
 *
 * `sizeScale` is deliberately blank: sizes arriving here are already canonical,
 * and re-converting them would shift them a second time.
 */
function revalidateIncomingRow(incoming: Record<string, unknown>): ImportRow {
  const record: Record<string, string> = {
    name: String(incoming.name ?? ""),
    productCode: String(incoming.productCode ?? ""),
    price: String(incoming.price ?? ""),
    category: String(incoming.category ?? ""),
    gender: String(incoming.gender ?? ""),
    color: String(incoming.color ?? ""),
    colorHex: String(incoming.colorHex ?? ""),
    brand: String(incoming.brand ?? ""),
    description: String(incoming.description ?? ""),
    sizes: Array.isArray(incoming.sizes) ? incoming.sizes.join(",") : "",
    stock:
      incoming.stockBySize && typeof incoming.stockBySize === "object"
        ? Object.entries(incoming.stockBySize as Record<string, number>)
            .map(([s, q]) => `${s}:${q}`)
            .join(",")
        : "",
    sizeScale: "",
    isNew: incoming.isNew ? "oui" : "non",
    isBestSeller: incoming.isBestSeller ? "oui" : "non",
    isActive: incoming.isActive === false ? "non" : "oui",
  };
  return parseRow(record, Number(incoming.rowNumber) || 0);
}

// ---- Import a single row ----------------------------------------------------


export interface ImportRowResult {
  ok: boolean;
  rowNumber: number;
  productId?: number;
  /** "created" | "updated" | "skipped" */
  outcome?: "created" | "updated" | "skipped";
  imageCount?: number;
  error?: string;
  warnings?: string[];
}

/**
 * Imports one spreadsheet row together with its images.
 *
 * One call per row so the UI can show real per-item progress, and so a single
 * failure cannot abort the rest of the batch. The row arrives as JSON from the
 * browser, so it is re-validated here before anything is written.
 */
export async function importRowAction(
  formData: FormData
): Promise<ImportRowResult> {
  const denied = await assertAdmin();
  if (denied) return { ok: false, rowNumber: -1, error: denied.error };

  if (!isDbConfigured) {
    return {
      ok: false,
      rowNumber: -1,
      error: "Base de données non configurée (DATABASE_URL manquant).",
    };
  }

  let row: ImportRow;
  try {
    const raw = formData.get("row");
    if (typeof raw !== "string") throw new Error("ligne absente");
    row = revalidateIncomingRow(JSON.parse(raw) as Record<string, unknown>);
  } catch (err) {
    return {
      ok: false,
      rowNumber: -1,
      error: `Ligne illisible : ${(err as Error).message}`,
    };
  }

  if (row.errors.length > 0) {
    return { ok: false, rowNumber: row.rowNumber, error: row.errors.join(" · ") };
  }

  // Images normally arrive as URLs already uploaded from the browser; raw files
  // only appear in the development fallback when Blob is unconfigured.
  const imageUrls = formData
    .getAll("imageUrls")
    .filter((u): u is string => typeof u === "string" && u.length > 0);

  const result = await importOneRow({
    row,
    imageUrls,
    files: formData.getAll("files").filter((f): f is File => f instanceof File),
    mode: formData.get("mode") === "update" ? "update" : "skip",
  });

  return {
    ok: result.ok,
    rowNumber: row.rowNumber,
    productId: result.productId,
    outcome: result.outcome,
    imageCount: result.imageCount,
    error: result.error,
    warnings: result.warnings.length > 0 ? result.warnings : undefined,
  };
}

/** Revalidates the catalogue once, after a batch finishes. */
export async function finishImportAction(): Promise<{ ok: boolean }> {
  const denied = await assertAdmin();
  if (denied) return { ok: false };
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/boutique");
  revalidatePath("/");
  return { ok: true };
}
