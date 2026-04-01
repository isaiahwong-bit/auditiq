import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { FacilityArea, CheckItem, PreOpSession, PreOpResponse } from '@auditarmour/types';

function usePreopBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/preop`;
}

export function useFacilityAreas() {
  const base = usePreopBase();
  return useQuery({
    queryKey: ['preop', 'areas', base],
    queryFn: () => apiFetch<{ data: FacilityArea[] }>(`${base}/areas`).then((r) => r.data),
  });
}

export function useCheckItems(areaId: string | undefined) {
  const base = usePreopBase();
  return useQuery({
    queryKey: ['preop', 'items', areaId],
    queryFn: () =>
      apiFetch<{ data: CheckItem[] }>(`${base}/areas/${areaId}/items`).then((r) => r.data),
    enabled: !!areaId,
  });
}

export function useTodaySessions(areaId: string | undefined) {
  const base = usePreopBase();
  return useQuery({
    queryKey: ['preop', 'today', areaId],
    queryFn: () =>
      apiFetch<{ data: PreOpSession[] }>(`${base}/areas/${areaId}/today`).then((r) => r.data),
    enabled: !!areaId,
  });
}

export function usePreOpSession(sessionId: string | undefined) {
  const base = usePreopBase();
  return useQuery({
    queryKey: ['preop', 'session', sessionId],
    queryFn: () =>
      apiFetch<{ data: PreOpSession }>(`${base}/sessions/${sessionId}`).then((r) => r.data),
    enabled: !!sessionId,
  });
}

export function useSessionResponses(sessionId: string | undefined) {
  const base = usePreopBase();
  return useQuery({
    queryKey: ['preop', 'responses', sessionId],
    queryFn: () =>
      apiFetch<{ data: (PreOpResponse & { check_items: CheckItem })[] }>(
        `${base}/sessions/${sessionId}/responses`,
      ).then((r) => r.data),
    enabled: !!sessionId,
  });
}

export function useRecentSessions() {
  const base = usePreopBase();
  return useQuery({
    queryKey: ['preop', 'sessions', base],
    queryFn: () =>
      apiFetch<{ data: (PreOpSession & { facility_areas: { name: string } })[] }>(
        `${base}/sessions`,
      ).then((r) => r.data),
  });
}

export function useCreateSession() {
  const base = usePreopBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { facility_area_id: string; shift?: string | null }) =>
      apiFetch<{ data: PreOpSession }>(`${base}/sessions`, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preop'] });
    },
  });
}

export function useSubmitResponse(sessionId: string) {
  const base = usePreopBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      check_item_id: string;
      result: 'pass' | 'fail' | 'na';
      score?: number | null;
      notes?: string | null;
      photo_urls?: string[];
      flagged?: boolean;
    }) =>
      apiFetch<{ data: PreOpResponse }>(`${base}/sessions/${sessionId}/responses`, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preop', 'responses', sessionId] });
    },
  });
}

export function useCompleteSession(sessionId: string) {
  const base = usePreopBase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ data: PreOpSession }>(`${base}/sessions/${sessionId}/complete`, {
        method: 'POST',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preop'] });
    },
  });
}
