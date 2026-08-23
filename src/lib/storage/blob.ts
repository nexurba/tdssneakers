import "server-only";
import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per image
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * In development we can persist to `public/uploads` so drag-and-drop works
 * with zero configuration. Serverless filesystems are read-only, so this is
 * never used in production — there, a Blob token is required.
 */
function canUseLocalDisk(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function isUploadAvailable(): boolean {
  return isBlobConfigured() || canUseLocalDisk();
}

export type UploadOutcome =
  | { ok: true; url: string }
  | { ok: false; error: string };

function validate(file: File): string | null {
  if (!ALLOWED.includes(file.type)) {
    return `format non supporté (${file.type || "inconnu"})`;
  }
  if (file.size > MAX_BYTES) {
    return `image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} Mo, max 8 Mo)`;
  }
  return null;
}

function buildKey(file: File): string {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** Save to `public/uploads` and return a site-relative URL. */
async function saveToDisk(file: File): Promise<UploadOutcome> {
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const name = buildKey(file);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), bytes);
    return { ok: true, url: `/uploads/${name}` };
  } catch (err) {
    return { ok: false, error: `écriture locale échouée: ${(err as Error).message}` };
  }
}

/**
 * Upload a product image. Uses Vercel Blob when configured, otherwise falls
 * back to the local public/uploads directory in development.
 */
export async function uploadProductImage(file: File): Promise<UploadOutcome> {
  const invalid = validate(file);
  if (invalid) return { ok: false, error: `${file.name}: ${invalid}` };

  if (isBlobConfigured()) {
    try {
      const blob = await put(`products/${buildKey(file)}`, file, {
        access: "public",
        contentType: file.type,
      });
      return { ok: true, url: blob.url };
    } catch (err) {
      return { ok: false, error: `${file.name}: ${(err as Error).message}` };
    }
  }

  if (canUseLocalDisk()) {
    return saveToDisk(file);
  }

  return {
    ok: false,
    error:
      "Stockage d'images non configuré. Ajoutez un store Blob sur Vercel (BLOB_READ_WRITE_TOKEN), ou collez une URL d'image.",
  };
}
