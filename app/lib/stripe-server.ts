import 'server-only';
import { appEnv } from '@/app/lib/app-env';

export const stripeMode = appEnv;

const resolvedStripeSecretKey =
  stripeMode === 'live'
    ? process.env.STRIPE_LIVE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY
    : process.env.STRIPE_TEST_SECRET_KEY;

const resolvedStripeWebhookSecret =
  stripeMode === 'live'
    ? process.env.STRIPE_LIVE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET
    : process.env.STRIPE_TEST_WEBHOOK_SECRET;

if (!resolvedStripeSecretKey) {
  throw new Error(`Missing Stripe secret key for ${stripeMode} mode.`);
}

export const stripeSecretKey: string = resolvedStripeSecretKey;

export function getStripeWebhookSecret(): string {
  if (!resolvedStripeWebhookSecret) {
    throw new Error(`Missing Stripe webhook secret for ${stripeMode} mode.`);
  }

  return resolvedStripeWebhookSecret;
}
