import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig, isSupabaseConfigured } from "./config";

export function isStorageConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(supabaseConfig.serviceRoleKey);
}

/**
 * Upload a product image to Supabase Storage and return its public URL.
 */
export async function uploadProductImage(
  file: File
): Promise<{ url: string } | { error: string }> {
  if (!isStorageConfigured()) {
    return {
      error:
        "Stockage non configuré. Renseignez SUPABASE_SERVICE_ROLE_KEY et NEXT_PUBLIC_SUPABASE_URL.",
    };
  }

  const admin = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
    auth: { persistSession: false },
  });

  const ext = file.name.split(".").pop() || "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(supabaseConfig.storageBucket)
    .upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data } = admin.storage
    .from(supabaseConfig.storageBucket)
    .getPublicUrl(path);

  return { url: data.publicUrl };
}
