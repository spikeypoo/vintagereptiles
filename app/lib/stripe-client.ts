'use client';

export const stripeMode =
  process.env.NEXT_PUBLIC_APP_ENV === 'live' ? 'live' : 'test';

const resolvedStripePublishableKey =
  stripeMode === 'live'
    ? process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY
    : process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY;

if (!resolvedStripePublishableKey) {
  throw new Error(
    `Missing Stripe publishable key for ${stripeMode} mode.`
  );
}

export const stripePublishableKey: string = resolvedStripePublishableKey;
