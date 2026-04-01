import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Site } from '@auditarmour/types';

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

const DEMO_SITES: Site[] = [
  {
    id: 'demo-site-1',
    organisation_id: 'demo-org-id',
    name: 'Kelso Processing',
    slug: 'kelso-nsw',
    address: '14 Industrial Ave, Kelso NSW 2795',
    site_type: 'processing',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-site-2',
    organisation_id: 'demo-org-id',
    name: 'Bathurst Cold Store',
    slug: 'bathurst-nsw',
    address: '7 Logistics Rd, Bathurst NSW 2795',
    site_type: 'cold_chain',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export function useSites(organisationId: string | undefined) {
  const { data: sites, isLoading } = useQuery({
    queryKey: ['sites', organisationId],
    queryFn: async (): Promise<Site[]> => {
      if (DEMO_MODE) return DEMO_SITES;
      const { data, error } = await supabase
        .from('sites')
        .select('*')
        .eq('organisation_id', organisationId!)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!organisationId,
  });

  return { sites: sites ?? [], loading: isLoading };
}
