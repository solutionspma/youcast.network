// ============================================================================
// STRIPE CLIENT - Payment and Subscription Management
// ============================================================================

import Stripe from 'stripe';

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey && typeof window === 'undefined') {
  console.warn('STRIPE_SECRET_KEY not configured - payments will not work');
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null;

// Publishable key for client-side
export const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionTier {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  features: string[];
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Starter',
    priceMonthly: 0,
    priceYearly: 0,
    priceIdMonthly: null,
    priceIdYearly: null,
    features: [
      '1 channel',
      '720p streaming',
      '10GB storage',
      'Basic analytics',
      'Community support',
    ],
  },
  {
    id: 'creator',
    name: 'Creator',
    priceMonthly: 9,
    priceYearly: 90,
    priceIdMonthly: null, // Will be set after creating prices in Stripe
    priceIdYearly: null,
    features: [
      '2 channels',
      '1080p streaming',
      '100GB storage',
      'Basic analytics',
      'Email support',
      'Custom overlays',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 29,
    priceYearly: 290,
    priceIdMonthly: null,
    priceIdYearly: null,
    features: [
      '5 channels',
      '1080p streaming',
      '500GB storage',
      'Advanced analytics',
      'Monetization tools',
      'Custom branding',
      'Priority support',
      'CRM access',
    ],
  },
  {
    id: 'enterprise',
    name: 'Network',
    priceMonthly: 199,
    priceYearly: 1990,
    priceIdMonthly: null,
    priceIdYearly: null,
    features: [
      'Unlimited channels',
      '4K streaming',
      '5TB storage',
      'Enterprise analytics',
      'White-label option',
      'API access',
      'Dedicated support',
      'Multi-tenant admin',
    ],
  },
];

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function createOrRetrieveCustomer(
  email: string,
  userId: string,
  name?: string
): Promise<string | null> {
  if (!stripe) return null;

  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        userId,
        platform: 'youcast',
      },
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating/retrieving customer:', error);
    return null;
  }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

export async function createSubscription(
  customerId: string,
  priceId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return subscription;
  } catch (error) {
    console.error('Error creating subscription:', error);
    return null;
  }
}

export async function cancelSubscription(
  subscriptionId: string
): Promise<boolean> {
  if (!stripe) return false;

  try {
    await stripe.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return false;
  }
}

export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  if (!stripe) return null;

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

// ============================================================================
// PAYMENT INTENTS (One-time payments, tips, etc.)
// ============================================================================

export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<PaymentIntent | null> {
  if (!stripe) return null;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        platform: 'youcast',
        ...metadata,
      },
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return null;
  }
}

// ============================================================================
// STRIPE CONNECT (For creator payouts)
// ============================================================================

export async function createConnectAccount(
  email: string,
  userId: string,
  country: string = 'US'
): Promise<string | null> {
  if (!stripe) return null;

  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      country,
      metadata: {
        userId,
        platform: 'youcast',
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    return account.id;
  } catch (error) {
    console.error('Error creating Connect account:', error);
    return null;
  }
}

export async function createConnectAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string | null> {
  if (!stripe) return null;

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });

    return accountLink.url;
  } catch (error) {
    console.error('Error creating account link:', error);
    return null;
  }
}

export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  metadata?: Record<string, string>
): Promise<Stripe.Transfer | null> {
  if (!stripe) return null;

  try {
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination: destinationAccountId,
      metadata: {
        platform: 'youcast',
        ...metadata,
      },
    });

    return transfer;
  } catch (error) {
    console.error('Error creating transfer:', error);
    return null;
  }
}

// ============================================================================
// WEBHOOK HELPERS
// ============================================================================

export function constructEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event | null {
  if (!stripe) return null;

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return null;
  }
}
