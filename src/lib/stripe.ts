import "server-only";
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = Boolean(key && key.length > 0);

export const stripe = key
  ? new Stripe(key)
  : (null as unknown as Stripe);
