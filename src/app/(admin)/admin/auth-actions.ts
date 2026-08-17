"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isAdminEmail } from "@/lib/supabase/config";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signInAction(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase non configuré." };
  }
  if (!isAdminEmail(email)) {
    return { ok: false, error: "Cet email n'est pas autorisé à accéder à l'admin." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase non configuré." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error: "Identifiants invalides." };
  }
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/admin");
}
