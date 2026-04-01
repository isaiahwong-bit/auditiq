import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { Framework, SiteFramework, RectificationPlan, ClauseEvidence } from '@auditarmour/types';
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

// ── Clause evidence hooks ──────────────────────────────────────────────────

export function useClauseEvidence(clauseId: string | null) {
  const base = useComplianceBase();
  return useQuery({
    queryKey: ['clauseEvidence', base, clauseId],
    queryFn: () =>
      apiFetch<{ data: ClauseEvidence[] }>(`${base}/evidence/${clauseId}`).then(
        (r) => r.data,
      ),
    enabled: !!clauseId,
    retry: false,
  });
}

export function useUploadEvidence() {
  const base = useComplianceBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      clause_id: string;
      facility_area_id?: string | null;
      file_url: string;
      file_name: string;
      description?: string | null;
    }) =>
      apiFetch<{ data: ClauseEvidence }>(`${base}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          ...params,
          evidence_type: 'file' as const,
        }),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauseEvidence'] });
      queryClient.invalidateQueries({ queryKey: ['gapAnalysis'] });
    },
  });
}

export function useAddReference() {
  const base = useComplianceBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      clause_id: string;
      facility_area_id?: string | null;
      reference_text: string;
      description?: string | null;
    }) =>
      apiFetch<{ data: ClauseEvidence }>(`${base}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          ...params,
          evidence_type: 'reference' as const,
        }),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauseEvidence'] });
      queryClient.invalidateQueries({ queryKey: ['gapAnalysis'] });
    },
  });
}

export function useDeleteEvidence() {
  const base = useComplianceBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evidenceId: string) =>
      apiFetch<{ data: { deleted: boolean } }>(`${base}/evidence/${evidenceId}`, {
        method: 'DELETE',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clauseEvidence'] });
      queryClient.invalidateQueries({ queryKey: ['gapAnalysis'] });
    },
  });
}
