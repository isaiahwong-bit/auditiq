import { requireStripe } from '../lib/stripe';
import { supabaseAdmin } from '../lib/supabase';

// ── Plan definitions ─────────────────────────────────────────────────────────

export const PLAN_LIMITS: Record<string, { site_limit: number; audit_limit: number | null }> = {
  starter: { site_limit: 1, audit_limit: 20 },
  professional: { site_limit: 1, audit_limit: null },
  enterprise: { site_limit: 5, audit_limit: null },
};

// ── Stripe customer management ──────────────────────────────────────────────

export async function getOrCreateStripeCustomer(organisationId: string, email: string) {
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('stripe_customer_id, name')
    .eq('id', organisationId)
    .single();

  if (org?.stripe_customer_id) {
    return org.stripe_customer_id;
  }

  const customer = await requireStripe().customers.create({
    email,
    name: org?.name,
    metadata: { organisation_id: organisationId },
  });

  await supabaseAdmin
    .from('organisations')
    .update({ stripe_customer_id: customer.id })
    .eq('id', organisationId);

  return customer.id;
}

// ── Checkout session creation ───────────────────────────────────────────────

export async function createCheckoutSession(params: {
  organisationId: string;
  plan: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const customerId = await getOrCreateStripeCustomer(params.organisationId, params.email);
  const limits = PLAN_LIMITS[params.plan];

  const session = await requireStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'aud',
          product_data: {
            name: `AuditArmour ${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)}`,
            description: `${limits?.site_limit ?? 1} site(s), ${limits?.audit_limit ?? 'unlimited'} audits/mo`,
          },
          unit_amount: getPlanPrice(params.plan),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        organisation_id: params.organisationId,
        plan: params.plan,
        site_limit: String(limits?.site_limit ?? 1),
        audit_limit: String(limits?.audit_limit ?? 'unlimited'),
      },
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}

function getPlanPrice(plan: string): number {
  switch (plan) {
    case 'starter': return 180000; // $1,800 AUD
    case 'professional': return 280000; // $2,800 AUD
    case 'enterprise': return 450000; // $4,500 AUD
    default: return 180000;
  }
}

// ── Customer portal ─────────────────────────────────────────────────────────

export async function createPortalSession(organisationId: string, returnUrl: string) {
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('stripe_customer_id')
    .eq('id', organisationId)
    .single();

  if (!org?.stripe_customer_id) {
    throw new Error('No Stripe customer found for this organisation');
  }

  const session = await requireStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: returnUrl,
  });

  return session;
}

// ── Subscription status ─────────────────────────────────────────────────────

export async function getSubscriptionStatus(organisationId: string) {
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('plan, stripe_customer_id')
    .eq('id', organisationId)
    .single();

  if (!org?.stripe_customer_id) {
    return { plan: org?.plan ?? 'starter', status: 'no_subscription', limits: PLAN_LIMITS[org?.plan ?? 'starter'] };
  }

  const subscriptions = await requireStripe().subscriptions.list({
    customer: org.stripe_customer_id,
    status: 'active',
    limit: 1,
  });

  const sub = subscriptions.data[0];
  return {
    plan: org.plan,
    status: sub ? sub.status : 'inactive',
    current_period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    limits: PLAN_LIMITS[org.plan ?? 'starter'],
  };
}

// ── Plan limit checks ───────────────────────────────────────────────────────

export async function checkSiteLimit(organisationId: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('plan')
    .eq('id', organisationId)
    .single();

  const limits = PLAN_LIMITS[org?.plan ?? 'starter'];
  const { count } = await supabaseAdmin
    .from('sites')
    .select('*', { count: 'exact', head: true })
    .eq('organisation_id', organisationId)
    .eq('is_active', true);

  return {
    allowed: (count ?? 0) < limits.site_limit,
    current: count ?? 0,
    limit: limits.site_limit,
  };
}

export async function checkAuditLimit(organisationId: string, siteId: string): Promise<{ allowed: boolean; current: number; limit: number | null }> {
  const { data: org } = await supabaseAdmin
    .from('organisations')
    .select('plan')
    .eq('id', organisationId)
    .single();

  const limits = PLAN_LIMITS[org?.plan ?? 'starter'];
  if (limits.audit_limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  // Count audits this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from('audits')
    .select('*', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .gte('created_at', startOfMonth.toISOString());

  return {
    allowed: (count ?? 0) < limits.audit_limit,
    current: count ?? 0,
    limit: limits.audit_limit,
  };
}

// ── Webhook handlers ────────────────────────────────────────────────────────

export async function handleSubscriptionCreated(subscription: {
  metadata: { organisation_id?: string; plan?: string };
}) {
  const orgId = subscription.metadata.organisation_id;
  const plan = subscription.metadata.plan;
  if (!orgId || !plan) return;

  await supabaseAdmin
    .from('organisations')
    .update({ plan })
    .eq('id', orgId);
}

export async function handleSubscriptionUpdated(subscription: {
  metadata: { organisation_id?: string; plan?: string };
}) {
  return handleSubscriptionCreated(subscription);
}

export async function handleSubscriptionDeleted(subscription: {
  metadata: { organisation_id?: string };
}) {
  const orgId = subscription.metadata.organisation_id;
  if (!orgId) return;

  // Suspend — retain data, but set plan to starter (most restrictive)
  await supabaseAdmin
    .from('organisations')
    .update({ plan: 'starter' })
    .eq('id', orgId);
}
