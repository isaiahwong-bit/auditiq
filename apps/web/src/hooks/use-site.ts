import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Site } from '@auditarmour/types';

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

const DEMO_SITES: Record<string, Site> = {
  'kelso-nsw': {
    id: 'demo-site-1',
    organisation_id: 'demo-org-id',
    name: 'Kelso Processing',
    slug: 'kelso-nsw',
    address: '14 Industrial Ave, Kelso NSW 2795',
    site_type: 'processing',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  'bathurst-nsw': {
    id: 'demo-site-2',
    organisation_id: 'demo-org-id',
    name: 'Bathurst Cold Store',
    slug: 'bathurst-nsw',
    address: '7 Logistics Rd, Bathurst NSW 2795',
    site_type: 'cold_chain',
    is_active: true,
    created_at: new Date().toISOString(),
  },
};

export function useSite() {
  const { orgSlug, siteSlug } = useParams<{ orgSlug: string; siteSlug: string }>();

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', orgSlug, siteSlug],
    queryFn: async (): Promise<Site> => {
      if (DEMO_MODE) return DEMO_SITES[siteSlug!] ?? DEMO_SITES['kelso-nsw'];
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('slug', siteSlug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug && !!siteSlug,
  });

  return { site: site ?? null, siteSlug: siteSlug ?? null, loading: isLoading };
}
