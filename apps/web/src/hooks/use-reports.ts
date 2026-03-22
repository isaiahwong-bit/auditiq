import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';

function useReportBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/reports`;
}

export function useGenerateAuditReport() {
  const base = useReportBase();
  return useMutation({
    mutationFn: (auditId: string) =>
      apiFetch<{ data: { status: string; message: string } }>(`${base}/audit-report`, {
        method: 'POST',
        body: JSON.stringify({ audit_id: auditId }),
      }).then((r) => r.data),
  });
}

export function useGenerateCertPack() {
  const base = useReportBase();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ data: { status: string; message: string } }>(`${base}/cert-pack`, {
        method: 'POST',
      }).then((r) => r.data),
  });
}

export function useCertPackPreview() {
  const base = useReportBase();
  return useQuery({
    queryKey: ['certPackPreview', base],
    queryFn: () =>
      apiFetch<{
        data: {
          site: { name: string };
          organisation: { name: string };
          generated_at: string;
          frameworks: Array<{ code: string; name: string; version: string | null }>;
          gap_summary: { total_clauses: number; covered: number; gaps: number; plans_in_place: number };
          preop_completion: { total_sessions_30d: number; completed: number; missed: number; avg_pass_rate: number | null };
          open_capas: number;
          overdue_capas: number;
          rectification_plans: Array<{
            clause_ref: string;
            framework_code: string;
            description: string;
            status: string;
          }>;
        };
      }>(`${base}/cert-pack/preview`).then((r) => r.data),
  });
}
