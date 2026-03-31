-- =============================================================================
-- Fix RLS infinite recursion on user_profiles
-- Creates a SECURITY DEFINER function to get the current user's org_id
-- without triggering RLS on user_profiles itself.
-- =============================================================================

-- Create security definer function that bypasses RLS
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid()
$$;

-- ─── Drop all old recursive "org isolation" policies ───────────────────────

DROP POLICY IF EXISTS "org isolation" ON public.user_profiles;
DROP POLICY IF EXISTS "org isolation" ON public.organisations;
DROP POLICY IF EXISTS "org isolation" ON public.sites;
DROP POLICY IF EXISTS "org isolation" ON public.site_users;
DROP POLICY IF EXISTS "org isolation" ON public.site_frameworks;
DROP POLICY IF EXISTS "org isolation" ON public.audits;
DROP POLICY IF EXISTS "org isolation" ON public.findings;
DROP POLICY IF EXISTS "org isolation" ON public.finding_clause_refs;
DROP POLICY IF EXISTS "org isolation" ON public.uploaded_documents;
DROP POLICY IF EXISTS "org isolation" ON public.facility_areas;
DROP POLICY IF EXISTS "org isolation" ON public.check_items;
DROP POLICY IF EXISTS "org isolation" ON public.check_item_clause_refs;
DROP POLICY IF EXISTS "org isolation" ON public.pre_op_sessions;
DROP POLICY IF EXISTS "org isolation" ON public.pre_op_responses;
DROP POLICY IF EXISTS "org isolation" ON public.capas;
DROP POLICY IF EXISTS "org isolation" ON public.rectification_plans;
DROP POLICY IF EXISTS "org isolation" ON public.intelligence_alerts;

-- ─── Recreate all policies using get_user_org_id() ─────────────────────────

CREATE POLICY "org isolation" ON public.user_profiles FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.organisations FOR ALL
USING (id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.sites FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.site_users FOR ALL
USING (
  site_id IN (SELECT id FROM public.sites WHERE organisation_id = public.get_user_org_id())
);

CREATE POLICY "org isolation" ON public.site_frameworks FOR ALL
USING (
  site_id IN (SELECT id FROM public.sites WHERE organisation_id = public.get_user_org_id())
);

CREATE POLICY "org isolation" ON public.audits FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.findings FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.finding_clause_refs FOR ALL
USING (
  finding_id IN (SELECT id FROM public.findings WHERE organisation_id = public.get_user_org_id())
);

CREATE POLICY "org isolation" ON public.uploaded_documents FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.facility_areas FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.check_items FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.check_item_clause_refs FOR ALL
USING (
  check_item_id IN (SELECT id FROM public.check_items WHERE organisation_id = public.get_user_org_id())
);

CREATE POLICY "org isolation" ON public.pre_op_sessions FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.pre_op_responses FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.capas FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.rectification_plans FOR ALL
USING (organisation_id = public.get_user_org_id());

CREATE POLICY "org isolation" ON public.intelligence_alerts FOR ALL
USING (organisation_id = public.get_user_org_id());
