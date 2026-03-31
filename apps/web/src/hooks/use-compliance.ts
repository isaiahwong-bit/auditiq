import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { Framework, SiteFramework, RectificationPlan } from '@auditiq/types';
import type { AreaGapSummary } from './use-compliance-types';

function useComplianceBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/compliance`;
}

export function useAllFrameworks() {
  return useQuery({
    queryKey: ['frameworks'],
    queryFn: () =>
      apiFetch<{ data: Framework[] }>('/api/v1/frameworks').then((r) => r.data),
    retry: false,
  });
}

export function useSiteFrameworks() {
  const base = useComplianceBase();
  return useQuery({
    queryKey: ['siteFrameworks', base],
    queryFn: () =>
      apiFetch<{ data: (SiteFramework & { frameworks: Framework })[] }>(`${base}/frameworks`).then(
        (r) => r.data,
      ),
    retry: false,
  });
}

export function useToggleFramework() {
  const base = useComplianceBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { framework_id: string; enabled: boolean }) =>
      apiFetch<{ data: SiteFramework }>(`${base}/frameworks/toggle`, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siteFrameworks'] });
      queryClient.invalidateQueries({ queryKey: ['gapAnalysis'] });
    },
  });
}

export function useGapAnalysis() {
  const base = useComplianceBase();
  return useQuery({
    queryKey: ['gapAnalysis', base],
    queryFn: () =>
      apiFetch<{
        data: {
          summary: {
            active_frameworks: number;
            total_clauses: number;
            covered: number;
            gaps: number;
            plans_in_place: number;
          };
          areas: AreaGapSummary[];
        };
      }>(`${base}/gaps`).then((r) => r.data),
    retry: false,
  });
}

export function useCreatePlan() {
  const base = useComplianceBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      clause_id: string;
      facility_area_id?: string | null;
      description: string;
      target_date?: string | null;
    }) =>
      apiFetch<{ data: RectificationPlan }>(`${base}/plans`, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gapAnalysis'] });
    },
  });
}

export function useCompletePlan() {
  const base = useComplianceBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiFetch<{ data: RectificationPlan }>(`${base}/plans/${planId}/complete`, {
        method: 'POST',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gapAnalysis'] });
    },
  });
}
