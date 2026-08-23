import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "tds_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h

function getSecret(): string {
  // Derive a signing secret from the admin password (+ optional explicit secret).
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "tdssneakers-dev-secret"
  );
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function makeToken(): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payload = `${expires}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  // Constant-time comparison.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  const expires = Number(payload);
  return Number.isFinite(expires) && expires > Date.now();
}

/**
 * Validate the submitted password against ADMIN_PASSWORD (constant-time).
 */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  // When no password is configured, admin runs in open "demo mode".
  if (!isAuthConfigured()) return true;
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(COOKIE_NAME)?.value);
}

export const UNAUTHORIZED_MESSAGE =
  "Session administrateur absente ou expirée. Reconnectez-vous, puis réessayez.";

/**
 * Guard for Server Actions that mutate admin data.
 *
 * Gating the admin *pages* only stops the UI from rendering. Server Actions are
 * ordinary public HTTP endpoints: their IDs ship inside publicly served JS
 * chunks, so anyone holding an ID could invoke a mutation without ever passing
 * the login screen. Every admin action therefore has to re-check the session
 * itself.
 *
 * Returns an error result to hand straight back to the client, or null when the
 * caller is allowed through.
 */
export async function assertAdmin(): Promise<{ ok: false; error: string } | null> {
  if (await isAuthenticated()) return null;
  return { ok: false, error: UNAUTHORIZED_MESSAGE };
}
