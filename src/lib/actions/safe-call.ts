/**
 * Client-side wrapper for Server Action calls.
 *
 * Server Actions in this codebase return `{ ok, error }` for *business* failures
 * (validation, missing DATABASE_URL, ...). Transport failures are different:
 * they reject the promise instead. The common ones are
 *
 *   - "Server Action <id> was not found on the server" (UnrecognizedActionError).
 *     Action IDs are generated at build time, so a page loaded before a rebuild
 *     or redeploy holds IDs the running server no longer knows about. In dev
 *     this happens on any recompile; in production it happens when a deploy
 *     lands while an admin has a form open.
 *   - network drops and server restarts.
 *
 * Left unhandled these surface as the Next.js error overlay (dev) or a blank
 * failure (prod), and whatever the user was submitting is lost. Wrapping the
 * call keeps the caller on a single `{ ok, error }` code path so it can show a
 * message and leave the form intact.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/** Message fragments Next.js uses when a client's action ID is unknown. */
const STALE_ACTION_HINTS = [
  "was not found on the server",
  "Failed to find Server Action",
  "UnrecognizedActionError",
];

export const STALE_ACTION_MESSAGE =
  "L'application a été mise à jour depuis l'ouverture de cette page. " +
  "Vos modifications n'ont PAS été enregistrées : rechargez la page (⌘R), " +
  "puis réessayez.";

/** True when the rejection is a stale/unknown Server Action reference. */
export function isStaleActionError(err: unknown): boolean {
  const message =
    err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return STALE_ACTION_HINTS.some((hint) => message.includes(hint));
}

/**
 * Invokes a Server Action and normalises thrown transport errors into the same
 * `{ ok, error }` shape the actions already return.
 */
export async function safeCall<T extends ActionResult>(
  invoke: () => Promise<T>
): Promise<T | ActionResult> {
  try {
    return await invoke();
  } catch (err) {
    if (isStaleActionError(err)) {
      return { ok: false, error: STALE_ACTION_MESSAGE };
    }
    // Keep the underlying message when there is one: it is more useful than a
    // generic string for things like aborted uploads or DB timeouts.
    const detail = err instanceof Error ? err.message : "";
    return {
      ok: false,
      error: detail
        ? `La requête n'a pas abouti : ${detail}`
        : "La requête n'a pas abouti. Vérifiez votre connexion, puis réessayez.",
    };
  }
}
