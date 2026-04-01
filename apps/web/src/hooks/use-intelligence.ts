import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { IntelligenceAlert } from '@auditarmour/types';

function useIntelBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/intelligence`;
}

type AlertWithJoins = IntelligenceAlert & {
  facility_areas?: { name: string } | null;
  check_items?: { name: string } | null;
};

export function useAlerts(status?: string) {
  const base = useIntelBase();
  const query = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['alerts', base, status],
    queryFn: () =>
      apiFetch<{ data: AlertWithJoins[] }>(`${base}${query}`).then((r) => r.data),
    retry: false,
  });
}

export function useAlertCount() {
  const base = useIntelBase();
  return useQuery({
    queryKey: ['alerts', 'count', base],
    queryFn: () =>
      apiFetch<{ data: { count: number } }>(`${base}/count`).then((r) => r.data.count),
    retry: false,
  });
}

export function useAcknowledgeAlert() {
  const base = useIntelBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<{ data: IntelligenceAlert }>(`${base}/${alertId}/acknowledge`, {
        method: 'POST',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useResolveAlert() {
  const base = useIntelBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<{ data: IntelligenceAlert }>(`${base}/${alertId}/resolve`, {
        method: 'POST',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
