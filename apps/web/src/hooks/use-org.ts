import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Organisation } from '@auditarmour/types';

const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

const DEMO_ORG: Organisation = {
  id: 'demo-org-id',
  name: 'Simplot Australia',
  slug: 'demo',
  plan: 'professional',
  stripe_customer_id: null,
  created_at: new Date().toISOString(),
};

export function useOrg() {
  const { orgSlug } = useParams<{ orgSlug: string }>();

  const { data: org, isLoading } = useQuery({
    queryKey: ['org', orgSlug],
    queryFn: async (): Promise<Organisation> => {
      if (DEMO_MODE) return DEMO_ORG;
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('slug', orgSlug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgSlug,
  });

  return { org: org ?? null, orgSlug: orgSlug ?? null, loading: isLoading };
}
