import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export function getStripe(): Stripe | null {
  if (!secretKey) return null;
  return new Stripe(secretKey);
}

export function getStripeWebhookSecret(): string | null {
  return webhookSecret ?? null;
}
