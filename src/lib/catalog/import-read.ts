import "server-only";
import { Readable } from "node:stream";
import ExcelJS from "exceljs";
import {
  COLUMNS,
  isBlankRecord,
  mapHeaders,
} from "./product-import";

/** Hard ceiling so one file cannot tie up the request for too long. */
export const MAX_IMPORT_ROWS = 500;

export interface SheetReadResult {
  ok: boolean;
  error?: string;
  sheetName?: string;
  /** One flat record per non-blank data row, keyed by canonical column key. */
  records: { rowNumber: number; record: Record<string, string> }[];
  unknownColumns: string[];
  missingColumns: string[];
  truncated: boolean;
}

/** Flattens any exceljs cell value into a trimmed string. */
export function cellToString(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    // Formula results, rich text and hyperlinks.
    if ("result" in v && v.result !== undefined && v.result !== null) {
      return String(v.result).trim();
    }
    if ("text" in v && typeof v.text === "string") return v.text.trim();
    if ("richText" in v && Array.isArray(v.richText)) {
      return (v.richText as { text: string }[]).map((t) => t.text).join("").trim();
    }
    if ("hyperlink" in v && typeof v.hyperlink === "string") {
      return v.hyperlink.trim();
    }
  }
  return String(v).trim();
}

/**
 * Reads an .xlsx/.csv buffer into flat records keyed by canonical column name.
 * Pure I/O + header mapping: row validation is the caller's job, so the same
 * rules apply whether a row comes from a file or from the browser.
 */
export async function readSheetRecords(
  buffer: Buffer,
  filename: string
): Promise<SheetReadResult> {
  const empty = {
    records: [],
    unknownColumns: [],
    missingColumns: [],
    truncated: false,
  };

  const name = filename.toLowerCase();
  let worksheet: ExcelJS.Worksheet | undefined;

  try {
    const wb = new ExcelJS.Workbook();
    // Both readers take a stream. Going through Readable also sidesteps the
    // Buffer type variance between @types/node and exceljs' load(buffer).
    // Imported statically at the top: `await import("stream")` resolves to a
    // namespace whose named exports are undefined once webpack bundles this
    // for the server, which made Readable.from blow up at runtime.
    if (name.endsWith(".csv")) {
      worksheet = await wb.csv.read(Readable.from(buffer));
    } else {
      await wb.xlsx.read(Readable.from(buffer));
      // Prefer the sheet named like the template, else the first one.
      worksheet =
        wb.worksheets.find((w) => w.name.toLowerCase().startsWith("produit")) ??
        wb.worksheets[0];
    }
  } catch (err) {
    return {
      ok: false,
      error: `Lecture du fichier impossible : ${(err as Error).message}`,
      ...empty,
    };
  }

  if (!worksheet) {
    return { ok: false, error: "Le fichier ne contient aucune feuille.", ...empty };
  }

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col - 1] = cellToString(cell);
  });

  const { byIndex, missingRequired, unknown } = mapHeaders(headers);
  if (missingRequired.length > 0) {
    return {
      ok: false,
      error: `Colonnes obligatoires absentes : ${missingRequired.join(", ")}. Téléchargez le modèle pour la structure attendue.`,
      ...empty,
      sheetName: worksheet.name,
      unknownColumns: unknown,
      missingColumns: missingRequired,
    };
  }

  const records: { rowNumber: number; record: Record<string, string> }[] = [];
  let truncated = false;

  for (let n = 2; n <= worksheet.rowCount; n++) {
    if (records.length >= MAX_IMPORT_ROWS) {
      truncated = true;
      break;
    }
    const record: Record<string, string> = {};
    for (const spec of COLUMNS) record[spec.key] = "";
    worksheet.getRow(n).eachCell({ includeEmpty: true }, (cell, col) => {
      const key = byIndex[col - 1];
      if (key) record[key] = cellToString(cell);
    });

    if (isBlankRecord(record)) continue;
    // Skip the template's trailing instruction line.
    if (!record.productCode && !record.price && record.name.startsWith("↑")) continue;

    records.push({ rowNumber: n, record });
  }

  return {
    ok: true,
    sheetName: worksheet.name,
    records,
    unknownColumns: unknown,
    missingColumns: [],
    truncated,
  };
}
