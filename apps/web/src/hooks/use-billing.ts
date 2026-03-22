import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

function useBillingBase() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return `/api/v1/org/${orgSlug}/billing`;
}

export interface SubscriptionStatus {
  plan: string;
  status: string;
  current_period_end: string | null;
  limits: { site_limit: number; audit_limit: number | null };
}

const DEMO_BILLING: SubscriptionStatus = {
  plan: 'professional',
  status: 'active',
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  limits: { site_limit: 1, audit_limit: null },
};

export function useSubscriptionStatus() {
  const base = useBillingBase();
  return useQuery({
    queryKey: ['billing', 'status', base],
    queryFn: async (): Promise<SubscriptionStatus> => {
      if (DEMO_MODE) return DEMO_BILLING;
      return apiFetch<{ data: SubscriptionStatus }>(`${base}/status`).then((r) => r.data);
    },
  });
}

export function useCreateCheckout() {
  const base = useBillingBase();
  return useMutation({
    mutationFn: (params: { plan: string; success_url: string; cancel_url: string }) =>
      apiFetch<{ data: { checkout_url: string } }>(`${base}/checkout`, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
  });
}

export function useCreatePortalSession() {
  const base = useBillingBase();
  return useMutation({
    mutationFn: (returnUrl: string) =>
      apiFetch<{ data: { portal_url: string } }>(`${base}/portal`, {
        method: 'POST',
        body: JSON.stringify({ return_url: returnUrl }),
      }).then((r) => r.data),
  });
}

export function useSiteLimitCheck() {
  const base = useBillingBase();
  return useQuery({
    queryKey: ['billing', 'limits', 'sites', base],
    queryFn: async () => {
      if (DEMO_MODE) return { allowed: true, current: 2, limit: 5 };
      return apiFetch<{ data: { allowed: boolean; current: number; limit: number } }>(
        `${base}/limits/sites`,
      ).then((r) => r.data);
    },
  });
}
