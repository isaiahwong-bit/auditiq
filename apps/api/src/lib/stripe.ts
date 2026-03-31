import Stripe from 'stripe';

function createStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY not set — billing disabled');
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
  });
}

const _stripe = createStripe();

export const stripe = _stripe!;

export function requireStripe(): Stripe {
  if (!_stripe) throw new Error('Stripe is not configured — set STRIPE_SECRET_KEY');
  return _stripe;
}
