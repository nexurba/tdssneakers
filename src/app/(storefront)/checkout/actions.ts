"use server";

import { z } from "zod";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getProducts } from "@/lib/data/products";
import { validatePromo } from "@/lib/data/promotions";
import { computeTotals } from "@/lib/commerce/settings";

const cartItemSchema = z.object({
  productId: z.number(),
  size: z.string(),
  quantity: z.number().min(1),
});

const checkoutSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
  address: z.string().min(1, "Adresse requise"),
  promoCode: z.string().optional(),
  items: z.array(cartItemSchema).min(1, "Panier vide"),
});

export interface CheckoutResult {
  ok: boolean;
  url?: string;
  error?: string;
}

export async function applyPromoAction(
  code: string,
  subtotal: number
): Promise<{ ok: boolean; discount?: number; error?: string }> {
  const promo = await validatePromo(code, subtotal);
  if (!promo) return { ok: false, error: "Code promo invalide ou non applicable." };
  return { ok: true, discount: promo.discount };
}

export async function createCheckoutAction(
  input: unknown
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  if (!isStripeConfigured) {
    return {
      ok: false,
      error:
        "Paiement non configuré. Renseignez STRIPE_SECRET_KEY dans .env.local pour activer le checkout.",
    };
  }

  const { email, name, address, promoCode, items } = parsed.data;

  // Re-price server-side from the catalog to prevent tampering.
  const catalog = await getProducts();
  const catalogById = new Map(catalog.map((p) => [p.id, p]));

  const lineItems: {
    productId: number;
    name: string;
    variant: string;
    size: string;
    quantity: number;
    unitPrice: number;
  }[] = [];

  for (const item of items) {
    const product = catalogById.get(item.productId);
    if (!product) {
      return { ok: false, error: `Produit indisponible (id ${item.productId}).` };
    }
    lineItems.push({
      productId: product.id,
      name: product.name,
      variant: product.variant,
      size: item.size,
      quantity: item.quantity,
      unitPrice: product.price,
    });
  }

  const subtotal = lineItems.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  let discount = 0;
  let appliedCode = "";
  if (promoCode) {
    const promo = await validatePromo(promoCode, subtotal);
    if (promo) {
      discount = promo.discount;
      appliedCode = promo.code;
    }
  }

  const totals = computeTotals(subtotal, discount);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: lineItems.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(l.unitPrice * 100),
          product_data: {
            name: `${l.name} — ${l.variant}`,
            description: `Taille: ${l.size}`,
          },
        },
      })),
      // Represent shipping + tax + discount as separate adjustment line items.
      ...(totals.shipping > 0
        ? {
            shipping_options: [
              {
                shipping_rate_data: {
                  type: "fixed_amount" as const,
                  fixed_amount: {
                    amount: Math.round(totals.shipping * 100),
                    currency: "cad",
                  },
                  display_name: "Livraison",
                },
              },
            ],
          }
        : {}),
      metadata: {
        customerName: name,
        address,
        promoCode: appliedCode,
        subtotal: String(totals.subtotal),
        discount: String(totals.discount),
        shipping: String(totals.shipping),
        tax: String(totals.tax),
        total: String(totals.total),
        items: JSON.stringify(
          lineItems.map((l) => ({
            productId: l.productId,
            name: l.name,
            variant: l.variant,
            size: l.size,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          }))
        ),
      },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout`,
    });

    return { ok: true, url: session.url ?? undefined };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
