import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createOrder } from "@/lib/data/orders";
import { decrementStock } from "@/lib/data/inventory";
import { incrementPromoUsage } from "@/lib/data/promotions";
import { sendOrderConfirmation } from "@/lib/email";
import { isDbConfigured } from "@/db";

export const runtime = "nodejs";

interface MetaItem {
  productId: number;
  name: string;
  variant: string;
  size: string;
  quantity: number;
  unitPrice: number;
}

function generateReference(): string {
  return `TDS-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  if (!isStripeConfigured) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback for local testing without a verified signature.
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Signature invalide: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    let items: MetaItem[] = [];
    try {
      items = JSON.parse(meta.items ?? "[]");
    } catch {
      items = [];
    }

    const reference = generateReference();
    if (isDbConfigured && items.length > 0) {
      try {
        await createOrder({
          reference,
          email: session.customer_email ?? meta.email ?? "inconnu@email.com",
          customerName: meta.customerName ?? "Client",
          phone: meta.phone || null,
          address: meta.address,
          // Only present when the checkout captured the address field by field.
          structuredAddress: meta.addressLine1
            ? {
                line1: meta.addressLine1,
                line2: meta.addressLine2 || null,
                city: meta.city ?? "",
                province: meta.province ?? "",
                postalCode: meta.postalCode ?? "",
                country: meta.country || "CA",
                latitude: meta.latitude ? Number(meta.latitude) : null,
                longitude: meta.longitude ? Number(meta.longitude) : null,
                validated: meta.addressValidated === "true",
                source: meta.addressSource || null,
              }
            : undefined,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            variant: i.variant,
            size: i.size,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          subtotal: Number(meta.subtotal ?? 0),
          shipping: Number(meta.shipping ?? 0),
          tax: Number(meta.tax ?? 0),
          discount: Number(meta.discount ?? 0),
          total: Number(meta.total ?? 0),
          stripeSessionId: session.id,
          stripePaymentIntent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined,
          paid: true,
        });

        // Decrement stock per line.
        await Promise.all(
          items.map((i) => decrementStock(i.productId, i.size, i.quantity))
        );

        // Track promo usage.
        if (meta.promoCode) {
          await incrementPromoUsage(meta.promoCode);
        }

        // Send confirmation email (non-blocking failures).
        await sendOrderConfirmation({
          reference,
          customerName: meta.customerName ?? "Client",
          email: session.customer_email ?? "inconnu@email.com",
          items,
          total: Number(meta.total ?? 0),
        });
      } catch (err) {
        console.error("Order processing failed:", err);
        return NextResponse.json({ received: true, warning: "order_failed" });
      }
    }
  }

  return NextResponse.json({ received: true });
}
