"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession, destroySession } from "@/lib/auth/admin";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export async function signInAction(password: string): Promise<AuthResult> {
  if (!checkPassword(password)) {
    return { ok: false, error: "Mot de passe incorrect." };
  }
  await createSession();
  return { ok: true };
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/admin");
}
