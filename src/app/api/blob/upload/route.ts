import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthenticated } from "@/lib/auth/admin";

/**
 * Issues short-lived tokens so the browser can upload product images straight
 * to Vercel Blob.
 *
 * Routing image bytes through a Server Action hits Vercel's hard 4.5 MB request
 * body cap — the platform answers 413 FUNCTION_PAYLOAD_TOO_LARGE before any of
 * our code runs, which no `serverActions.bodySizeLimit` can raise. Client
 * uploads bypass the function entirely, so only the resulting URLs travel
 * through our actions.
 *
 * Route handlers do not run the admin layout, so this verifies the session
 * itself. Without that check the endpoint would let anyone mint upload tokens
 * for the store's Blob bucket.
 *
 * https://vercel.com/docs/vercel-blob/client-upload
 */

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/** Matches the per-image ceiling the server-side helper enforces. */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Uploads are confined to this prefix. Kept in step with productImagePath() in
 * src/lib/storage/client-upload.ts, which is what the browser sends.
 */
const UPLOAD_PREFIX = "products";

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Stockage d'images non configuré." },
      { status: 501 }
    );
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Called for every file before a token is minted.
        if (!(await isAuthenticated())) {
          throw new Error("Non autorisé");
        }
        // The token is bound to the pathname the browser asked for — this hook
        // cannot rewrite it, so the prefix has to be enforced by rejecting
        // anything outside it. Traversal attempts are refused outright.
        if (!pathname.startsWith(`${UPLOAD_PREFIX}/`) || pathname.includes("..")) {
          throw new Error(`Chemin refusé: ${pathname}`);
        }
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          // Two products can share a filename; a suffix keeps them distinct.
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Fires from Blob's callback, not the browser. Nothing to persist here:
        // the URL is attached to a product only when the admin saves the form.
        console.log(`[blob] uploaded ${blob.pathname}`);
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = (err as Error).message;
    const unauthorized = message.includes("Non autorisé");
    console.error(`[blob] token request failed: ${message}`);
    return NextResponse.json(
      { error: unauthorized ? "Non autorisé" : "Téléversement refusé." },
      { status: unauthorized ? 401 : 400 }
    );
  }
}
