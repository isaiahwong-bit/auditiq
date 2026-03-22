import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { Audit, Finding, FindingClauseRef } from '@auditiq/types';

function useAuditBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/audits`;
}

export function useAudits() {
  const base = useAuditBase();
  return useQuery({
    queryKey: ['audits', base],
    queryFn: () => apiFetch<{ data: Audit[] }>(base).then((r) => r.data),
  });
}

export type AuditWithFindings = Audit & {
  findings: (Finding & { finding_clause_refs: FindingClauseRef[] })[];
};

export function useAudit(auditId: string | undefined) {
  const base = useAuditBase();
  return useQuery({
    queryKey: ['audit', auditId],
    queryFn: () =>
      apiFetch<{ data: AuditWithFindings }>(`${base}/${auditId}`).then((r) => r.data),
    enabled: !!auditId,
  });
}

export function useCreateAudit() {
  const base = useAuditBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { audit_type: string }) =>
      apiFetch<{ data: Audit }>(base, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });
}

export function useStartAudit() {
  const base = useAuditBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string) =>
      apiFetch<{ data: Audit }>(`${base}/${auditId}/start`, { method: 'POST' }).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export function useCompleteAudit() {
  const base = useAuditBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (auditId: string) =>
      apiFetch<{ data: Audit }>(`${base}/${auditId}/complete`, { method: 'POST' }).then(
        (r) => r.data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

interface GenerateFindingResult {
  classification: {
    category_code: string;
    confidence: number;
    risk_rating: string;
    keywords_matched: string[];
  };
  narrative: {
    finding_title: string;
    finding_narrative: string;
    recommended_action: string;
    clause_refs: Array<{
      framework_code: string;
      clause_ref: string;
      gap_detected: boolean;
      gap_description: string | null;
      capa_urgency: string | null;
    }>;
  };
}

export function useGenerateFinding() {
  return useMutation({
    mutationFn: (params: { raw_observation: string; site_id: string; site_type?: string | null }) =>
      apiFetch<{ data: GenerateFindingResult }>('/api/v1/ai/generate-finding', {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
  });
}

export function useCreateFinding() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      audit_id: string;
      raw_observation: string;
      category_code?: string | null;
      finding_title?: string | null;
      finding_narrative?: string | null;
      recommended_action?: string | null;
      risk_rating?: string | null;
      photo_urls?: string[];
      ai_confidence?: number | null;
      clause_refs?: Array<{
        framework_code: string;
        clause_ref: string;
        gap_detected: boolean;
        gap_description: string | null;
        capa_urgency: string | null;
      }>;
    }) =>
      apiFetch<{ data: Finding }>(
        `/api/v1/org/${orgSlug}/sites/${siteSlug}/findings`,
        {
          method: 'POST',
          body: JSON.stringify(params),
        },
      ).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}
