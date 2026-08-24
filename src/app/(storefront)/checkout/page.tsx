import type { Metadata } from "next";
import { isStripeConfigured } from "@/lib/stripe";
import { ORDER_SUPPORT_EMAIL } from "@/lib/errors/customer-facing";
import CheckoutClient from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Commande",
  // A checkout page has nothing to offer a search engine.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  // Resolved on the server so the page can say up front whether payment is
  // possible, instead of letting the shopper fill everything in and fail.
  return (
    <CheckoutClient
      paymentAvailable={isStripeConfigured}
      supportEmail={ORDER_SUPPORT_EMAIL}
    />
  );
}
