"use client";

import { upload } from "@vercel/blob/client";

/**
 * Uploads product images from the browser straight to Vercel Blob.
 *
 * Server Actions cannot carry these bytes: Vercel caps a function's request
 * body at 4.5 MB and answers 413 FUNCTION_PAYLOAD_TOO_LARGE before our code
 * runs, so a handful of phone photos is enough to fail. Uploading from the
 * browser removes the function from the data path; only URLs go through the
 * actions afterwards.
 *
 * Falls back to a Server Action when Blob is not configured, which is how local
 * development works without a token (files land in public/uploads). That path is
 * still subject to the body limit, so it is only viable in dev.
 */

export interface UploadedImage {
  url: string;
  name: string;
}

export interface UploadOutcome {
  urls: UploadedImage[];
  errors: string[];
}

/** Mirrors the server-side ceiling so the failure is reported before the upload. */
const MAX_BYTES = 8 * 1024 * 1024;

const ALLOWED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/**
 * Blob pathname to request for a product image.
 *
 * The client token is bound to whatever pathname the browser asks for —
 * onBeforeGenerateToken cannot rewrite it — so the prefix has to be set here and
 * merely *verified* server-side. Must stay in step with UPLOAD_PREFIX in
 * src/app/api/blob/upload/route.ts.
 */
export function productImagePath(filename: string): string {
  const safe = filename.replace(/[^\w.\-]/g, "_").slice(-100) || "image";
  return `products/${safe}`;
}

function precheck(file: File): string | null {
  if (file.type && !ALLOWED.includes(file.type)) {
    return `${file.name} : format non supporté (${file.type})`;
  }
  if (file.size > MAX_BYTES) {
    return `${file.name} : ${(file.size / 1024 / 1024).toFixed(1)} Mo, maximum 8 Mo`;
  }
  return null;
}

/**
 * Uploads one file and reports byte progress.
 *
 * `blobAvailable` comes from the server so the browser knows whether client
 * uploads are possible; when they are not, the caller uses the action fallback.
 */
export async function uploadImageToBlob(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const invalid = precheck(file);
  if (invalid) return { ok: false, error: invalid };

  try {
    const blob = await upload(productImagePath(file.name), file, {
      access: "public",
      handleUploadUrl: "/api/blob/upload",
      contentType: file.type || undefined,
      onUploadProgress: onProgress
        ? ({ percentage }) => onProgress(percentage)
        : undefined,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    const message = (err as Error).message || "téléversement échoué";
    // The token route answers 401 when the admin session has lapsed.
    if (message.includes("401") || message.toLowerCase().includes("autoris")) {
      return {
        ok: false,
        error: `${file.name} : session expirée, reconnectez-vous puis réessayez`,
      };
    }
    return { ok: false, error: `${file.name} : ${message}` };
  }
}

/** Uploads several files, keeping their order and collecting per-file errors. */
export async function uploadImagesToBlob(
  files: File[],
  onProgress?: (fileIndex: number, percent: number) => void
): Promise<UploadOutcome> {
  const urls: UploadedImage[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadImageToBlob(file, (p) => onProgress?.(i, p));
    if (result.ok) urls.push({ url: result.url, name: file.name });
    else errors.push(result.error);
  }

  return { urls, errors };
}
