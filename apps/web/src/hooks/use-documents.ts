import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiFetch } from '../lib/api';
import type { UploadedDocument } from '@auditarmour/types';

function useDocumentBase() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();
  return `/api/v1/org/${orgSlug}/sites/${siteSlug}/documents`;
}

// ── List documents ──────────────────────────────────────────────────────

export function useDocuments() {
  const base = useDocumentBase();
  return useQuery({
    queryKey: ['documents', base],
    queryFn: () =>
      apiFetch<{ data: UploadedDocument[] }>(base).then((r) => r.data),
    retry: false,
  });
}

// ── Get single document ─────────────────────────────────────────────────

export function useDocument(documentId: string | null) {
  const base = useDocumentBase();
  return useQuery({
    queryKey: ['documents', 'detail', documentId],
    queryFn: () =>
      apiFetch<{ data: UploadedDocument }>(`${base}/${documentId}`).then((r) => r.data),
    enabled: !!documentId,
    retry: false,
  });
}

// ── Upload / create document ────────────────────────────────────────────

export function useUploadDocument() {
  const base = useDocumentBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      file_url: string;
      file_name: string;
      document_type?: string | null;
      content?: string;
    }) =>
      apiFetch<{ data: UploadedDocument }>(base, {
        method: 'POST',
        body: JSON.stringify(params),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// ── Process document (trigger AI extraction) ────────────────────────────

export function useProcessDocument() {
  const base = useDocumentBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { documentId: string; content?: string; image_url?: string }) =>
      apiFetch<{ data: unknown }>(`${base}/${params.documentId}/process`, {
        method: 'POST',
        body: JSON.stringify({ content: params.content, image_url: params.image_url }),
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

// ── Approve document ────────────────────────────────────────────────────

export function useApproveDocument() {
  const base = useDocumentBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiFetch<{ data: { approved: boolean; areas_created: number } }>(
        `${base}/${documentId}/approve`,
        { method: 'POST' },
      ).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

// ── Delete document ─────────────────────────────────────────────────────

export function useDeleteDocument() {
  const base = useDocumentBase();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      apiFetch<{ data: UploadedDocument }>(`${base}/${documentId}`, {
        method: 'DELETE',
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
