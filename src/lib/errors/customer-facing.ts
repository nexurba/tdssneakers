import "server-only";

/**
 * Error messages for the storefront.
 *
 * Anything returned from a storefront Server Action is rendered to a shopper, so
 * it must never carry environment variable names, file paths, table or column
 * names, internal record IDs, or raw exception text. Those belong in the server
 * log, where an operator can act on them.
 *
 * Every message here tells the customer what happened and what to do next.
 */

/** Where shoppers are sent when something is wrong with an order. */
export const ORDER_SUPPORT_EMAIL = "commandes@tdssneakers.ca";
export const GENERAL_SUPPORT_EMAIL = "contact@tdssneakers.ca";

export const CUSTOMER_MESSAGES = {
  /** Payment provider unavailable or misconfigured — never say which. */
  paymentUnavailable:
    `Le paiement en ligne est momentanément indisponible. ` +
    `Votre panier est conservé — réessayez dans quelques minutes. ` +
    `Si cela persiste, écrivez-nous à ${ORDER_SUPPORT_EMAIL} et nous finalisons la commande avec vous.`,

  /** Payment provider rejected the request for reasons we can't itemise safely. */
  paymentFailed:
    `Nous n'avons pas pu ouvrir la page de paiement. ` +
    `Réessayez dans quelques instants — si le problème persiste, écrivez-nous à ${ORDER_SUPPORT_EMAIL}.`,

  /** A cart line references something no longer purchasable. */
  itemUnavailable:
    `Un article de votre panier n'est plus disponible. ` +
    `Retirez-le puis relancez la commande, ou écrivez-nous à ${ORDER_SUPPORT_EMAIL}.`,

  /** Generic fallback for unexpected server failures. */
  generic:
    `Une erreur est survenue de notre côté. ` +
    `Réessayez dans quelques instants — si cela persiste, écrivez-nous à ${GENERAL_SUPPORT_EMAIL}.`,

  /** Review submission could not be stored. */
  reviewFailed:
    `Votre avis n'a pas pu être enregistré. Réessayez dans quelques instants.`,
} as const;

/**
 * Logs the real cause for operators and returns the shopper-safe message.
 *
 * Use at every storefront boundary where an internal failure would otherwise
 * reach the browser.
 */
export function logAndMask(
  context: string,
  detail: unknown,
  customerMessage: string = CUSTOMER_MESSAGES.generic
): string {
  const cause =
    detail instanceof Error
      ? `${detail.name}: ${detail.message}`
      : String(detail);
  console.error(`[storefront:${context}] ${cause}`);
  return customerMessage;
}

/**
 * Records a configuration gap loudly. Separate from logAndMask because these
 * are operator mistakes rather than runtime failures, and they are silent to the
 * customer by design.
 */
export function logMisconfiguration(what: string): void {
  console.error(
    `[config] ${what} — la fonctionnalité est désactivée pour les clients. ` +
      `Renseignez la variable d'environnement correspondante.`
  );
}
