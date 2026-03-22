export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Site {
  id: string;
  organisation_id: string;
  name: string;
  slug: string;
  address: string | null;
  site_type: 'processing' | 'cold_chain' | 'co_manufacturer' | null;
  is_active: boolean;
  created_at: string;
}

export type UserRole = 'admin' | 'qa_manager' | 'plant_manager' | 'auditor' | 'operator';

export interface UserProfile {
  id: string;
  organisation_id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface SiteUser {
  user_id: string;
  site_id: string;
}
