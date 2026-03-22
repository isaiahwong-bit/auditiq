import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { Capa } from '@auditiq/types';

function useCapaBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/capas`;
}

type CapaWithAssignee = Capa & { user_profiles?: { full_name: string } | null };

export function useCapas(status?: string) {
  const base = useCapaBase();
  const query = status ? `?status=${status}` : '';
  return useQuery({
    queryKey: ['capas', base, status],
    queryFn: () =>
      apiFetch<{ data: CapaWithAssignee[] }>(`${base}${query}`).then((r) => r.data),
  });
}

export function useCapaCount() {
  const base = useCapaBase();
  return useQuery({
    queryKey: ['capas', 'count', base],
    queryFn: () =>
      apiFetch<{ data: { count: number } }>(`${base}/count`).then((r) => r.data.count),
  });
}

export function useCapa(capaId: string | undefined) {
  const base = useCapaBase();
  return useQuery({
    queryKey: ['capa', capaId],
    queryFn: () =>
      apiFetch<{ data: CapaWithAssignee }>(`${base}/${capaId}`).then((r) => r.data),
    enabled: !!capaId,
  });
}

export function useCreateCapa() {
  const base = useCapaBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      finding_id?: string | null;
      pre_op_response_id?: string | null;
      assigned_to?: string | null;
      title: string;
      description?: string | null;
      urgency: string;
    }) =>
      apiFetch<{ data: Capa }>(base, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
    },
  });
}

export function useUpdateCapaStatus() {
  const base = useCapaBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { capaId: string; status: string }) =>
      apiFetch<{ data: Capa }>(`${base}/${params.capaId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: params.status }),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
      queryClient.invalidateQueries({ queryKey: ['capa'] });
    },
  });
}

export function useCloseCapa() {
  const base = useCapaBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { capaId: string; evidence_urls?: string[] }) =>
      apiFetch<{ data: Capa }>(`${base}/${params.capaId}/close`, {
        method: 'POST',
        body: JSON.stringify({ evidence_urls: params.evidence_urls ?? [] }),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capas'] });
      queryClient.invalidateQueries({ queryKey: ['capa'] });
    },
  });
}
