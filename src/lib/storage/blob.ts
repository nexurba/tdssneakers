import "server-only";
import { put } from "@vercel/blob";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per image
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type UploadOutcome =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload a single product image to Vercel Blob storage.
 * Validates MIME type and size before sending.
 */
export async function uploadProductImage(file: File): Promise<UploadOutcome> {
  if (!isBlobConfigured()) {
    return {
      ok: false,
      error:
        "Stockage d'images non configuré. Ajoutez un store Blob sur Vercel (BLOB_READ_WRITE_TOKEN) ou collez une URL d'image.",
    };
  }
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: `Format non supporté (${file.type || "inconnu"}).` };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `Image trop lourde (max ${MAX_BYTES / 1024 / 1024} Mo).` };
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const key = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    return { ok: false, error: `Échec du téléversement: ${(err as Error).message}` };
  }
}
