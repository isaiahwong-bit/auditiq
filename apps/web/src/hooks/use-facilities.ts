import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { FacilityArea, CheckItem } from '@auditarmour/types';

type FacilityAreaWithCount = FacilityArea & { check_item_count: number };

function useFacilityBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/facilities`;
}

// ── Area hooks ───────────────────────────────────────────────────────────

export function useFacilityAreas() {
  const base = useFacilityBase();
  return useQuery({
    queryKey: ['facilities', 'areas', base],
    queryFn: () =>
      apiFetch<{ data: FacilityAreaWithCount[] }>(base).then((r) => r.data),
    retry: false,
  });
}

export function useCreateArea() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      area_type?: string | null;
      display_order?: number;
    }) =>
      apiFetch<{ data: FacilityArea }>(base, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'areas'] });
    },
  });
}

export function useUpdateArea() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      areaId: string;
      name?: string;
      area_type?: string | null;
      display_order?: number;
    }) => {
      const { areaId, ...body } = params;
      return apiFetch<{ data: FacilityArea }>(`${base}/${areaId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'areas'] });
    },
  });
}

export function useDeleteArea() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (areaId: string) =>
      apiFetch<{ data: FacilityArea }>(`${base}/${areaId}`, {
        method: 'DELETE',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'areas'] });
    },
  });
}

export function useReorderAreas() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderings: Array<{ id: string; display_order: number }>) =>
      apiFetch<{ data: FacilityArea[] }>(`${base}/reorder`, {
        method: 'POST',
        body: JSON.stringify({ orderings }),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'areas'] });
    },
  });
}

// ── Check item hooks ─────────────────────────────────────────────────────

export function useCheckItems(areaId: string | null) {
  const base = useFacilityBase();
  return useQuery({
    queryKey: ['facilities', 'items', areaId],
    queryFn: () =>
      apiFetch<{ data: CheckItem[] }>(`${base}/${areaId}/items`).then((r) => r.data),
    enabled: !!areaId,
    retry: false,
  });
}

export function useCreateCheckItem() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      areaId: string;
      name: string;
      description?: string | null;
      scoring_type?: string;
      frequency?: string;
      category_code?: string | null;
      display_order?: number;
    }) => {
      const { areaId, ...body } = params;
      return apiFetch<{ data: CheckItem }>(`${base}/${areaId}/items`, {
        method: 'POST',
        body: JSON.stringify(body),
      }).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['facilities', 'areas'] });
    },
  });
}

export function useUpdateCheckItem() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      areaId: string;
      itemId: string;
      name?: string;
      description?: string | null;
      scoring_type?: string;
      frequency?: string;
      category_code?: string | null;
      display_order?: number;
    }) => {
      const { areaId, itemId, ...body } = params;
      return apiFetch<{ data: CheckItem }>(`${base}/${areaId}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'items'] });
    },
  });
}

export function useDeleteCheckItem() {
  const base = useFacilityBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { areaId: string; itemId: string }) =>
      apiFetch<{ data: CheckItem }>(`${base}/${params.areaId}/items/${params.itemId}`, {
        method: 'DELETE',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['facilities', 'areas'] });
    },
  });
}

// ── Finding categories (for dropdowns) ───────────────────────────────────

interface FindingCategoryOption {
  id: string;
  code: string;
  name: string;
}

export function useFindingCategories() {
  const base = useFacilityBase();
  return useQuery({
    queryKey: ['facilities', 'categories'],
    queryFn: () =>
      apiFetch<{ data: FindingCategoryOption[] }>(`${base}/categories`).then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 30, // categories rarely change
  });
}
