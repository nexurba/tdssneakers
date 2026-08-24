"use server";

import { z } from "zod";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { getProducts } from "@/lib/data/products";
import { validatePromo } from "@/lib/data/promotions";
import { computeTotals } from "@/lib/commerce/settings";
import {
  CUSTOMER_MESSAGES,
  logAndMask,
  logMisconfiguration,
} from "@/lib/errors/customer-facing";
import {
  formatAddress,
  formatPhone,
  isValidPhone,
  isValidPostalCode,
} from "@/lib/geo/types";

const cartItemSchema = z.object({
  productId: z.number(),
  size: z.string(),
  quantity: z.number().min(1),
});

const addressSchema = z.object({
  line1: z.string().min(1, "Adresse requise"),
  line2: z.string().optional(),
  city: z.string().min(1, "Ville requise"),
  province: z.string().min(2, "Province requise"),
  postalCode: z.string().refine(isValidPostalCode, "Code postal invalide"),
  country: z.string().default("CA"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  /** Whether the lookup service confirmed the address. Advisory only. */
  validated: z.boolean().optional(),
  source: z.string().optional(),
});

export type CheckoutAddress = z.infer<typeof addressSchema>;

const checkoutSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Nom requis"),
  phone: z.string().refine(isValidPhone, "Numéro de téléphone invalide"),
  address: addressSchema,
  promoCode: z.string().optional(),
  items: z.array(cartItemSchema).min(1, "Panier vide"),
});

export interface CheckoutResult {
  ok: boolean;
  url?: string;
  error?: string;
}

const promoInputSchema = z.object({
  code: z.string().min(1).max(64),
  subtotal: z.number().finite().min(0),
});

export async function applyPromoAction(
  code: unknown,
  subtotal: unknown
): Promise<{ ok: boolean; discount?: number; error?: string }> {
  // Arguments come from the browser, so they are validated rather than trusted:
  // passing a non-string previously threw inside validatePromo and returned a
  // 500 instead of a usable message.
  const parsed = promoInputSchema.safeParse({ code, subtotal });
  if (!parsed.success) {
    return { ok: false, error: "Code promo invalide ou non applicable." };
  }

  try {
    const promo = await validatePromo(parsed.data.code, parsed.data.subtotal);
    if (!promo) {
      return { ok: false, error: "Code promo invalide ou non applicable." };
    }
    return { ok: true, discount: promo.discount };
  } catch (err) {
    return {
      ok: false,
      error: logAndMask("promo", err, "Code promo invalide ou non applicable."),
    };
  }
}

export async function createCheckoutAction(
  input: unknown
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  if (!isStripeConfigured) {
    // The customer must never be told which key is missing or where it lives.
    logMisconfiguration("Clé Stripe absente : aucun paiement possible");
    return { ok: false, error: CUSTOMER_MESSAGES.paymentUnavailable };
  }

  const { email, name, phone, address, promoCode, items } = parsed.data;

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
      // Internal product IDs stay out of the response.
      return {
        ok: false,
        error: logAndMask(
          "checkout",
          `cart references unpurchasable product id ${item.productId}`,
          CUSTOMER_MESSAGES.itemUnavailable
        ),
      };
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
        phone: formatPhone(phone),
        // One-line rendering for emails and admin display.
        address: formatAddress({
          line1: address.line1,
          line2: address.line2 ?? null,
          city: address.city,
          province: address.province,
          postalCode: address.postalCode,
          country: address.country,
        }),
        // Structured fields, so the order no longer has to guess the city by
        // splitting free text on commas.
        addressLine1: address.line1,
        addressLine2: address.line2 ?? "",
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
        latitude: address.latitude !== undefined ? String(address.latitude) : "",
        longitude: address.longitude !== undefined ? String(address.longitude) : "",
        addressValidated: address.validated ? "true" : "false",
        addressSource: address.source ?? "",
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
    // Stripe messages can name parameters and limits; keep them in the log.
    return {
      ok: false,
      error: logAndMask("checkout:session", err, CUSTOMER_MESSAGES.paymentFailed),
    };
  }
}
