// utils/stripe.ts
import Stripe from 'stripe';
import config from '../config/config';

if (!config.stripe.secretKey) {
  throw new Error('Stripe secret key is not configured');
}

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2025-03-31.basil'
});
