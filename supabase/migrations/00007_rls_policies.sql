-- =============================================================================
-- Row-Level Security Policies
-- RLS is enabled on every table. Never disable it for any reason.
-- =============================================================================

-- ─── Enable RLS on all tables ────────────────────────────────────────────────

ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.framework_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finding_clause_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_item_clause_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_op_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_op_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rectification_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_alerts ENABLE ROW LEVEL SECURITY;

-- ─── Reference data: public read ─────────────────────────────────────────────

CREATE POLICY "public read" ON public.frameworks FOR SELECT USING (true);
CREATE POLICY "public read" ON public.finding_categories FOR SELECT USING (true);
CREATE POLICY "public read" ON public.framework_clauses FOR SELECT USING (true);

-- ─── Organisations: org isolation ────────────────────────────────────────────

CREATE POLICY "org isolation" ON public.organisations FOR ALL
USING (
  id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

-- ─── User profiles: org isolation ────────────────────────────────────────────

CREATE POLICY "org isolation" ON public.user_profiles FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

-- ─── Sites: org isolation ────────────────────────────────────────────────────

CREATE POLICY "org isolation" ON public.sites FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

-- ─── Site users: org isolation via site ──────────────────────────────────────

CREATE POLICY "org isolation" ON public.site_users FOR ALL
USING (
  site_id IN (
    SELECT id FROM public.sites
    WHERE organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
  )
);

-- ─── Site frameworks: org isolation + site access ────────────────────────────

CREATE POLICY "org isolation" ON public.site_frameworks FOR ALL
USING (
  site_id IN (
    SELECT id FROM public.sites
    WHERE organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
  )
);

CREATE POLICY "site access" ON public.site_frameworks FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Audits: org isolation + site access ─────────────────────────────────────

CREATE POLICY "org isolation" ON public.audits FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.audits FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Findings: org isolation + site access ───────────────────────────────────

CREATE POLICY "org isolation" ON public.findings FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.findings FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Finding clause refs: org isolation via finding ──────────────────────────

CREATE POLICY "org isolation" ON public.finding_clause_refs FOR ALL
USING (
  finding_id IN (
    SELECT id FROM public.findings
    WHERE organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
  )
);

-- ─── Uploaded documents: org isolation + site access ─────────────────────────

CREATE POLICY "org isolation" ON public.uploaded_documents FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.uploaded_documents FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Facility areas: org isolation + site access ─────────────────────────────

CREATE POLICY "org isolation" ON public.facility_areas FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.facility_areas FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Check items: org isolation + site access ────────────────────────────────

CREATE POLICY "org isolation" ON public.check_items FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.check_items FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Check item clause refs: access via check item ──────────────────────────

CREATE POLICY "org isolation" ON public.check_item_clause_refs FOR ALL
USING (
  check_item_id IN (
    SELECT id FROM public.check_items
    WHERE organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
  )
);

-- ─── Pre-op sessions: org isolation + site access ────────────────────────────

CREATE POLICY "org isolation" ON public.pre_op_sessions FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.pre_op_sessions FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Pre-op responses: org isolation + site access + operator insert ─────────

CREATE POLICY "org isolation" ON public.pre_op_responses FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.pre_op_responses FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

CREATE POLICY "operator insert" ON public.pre_op_responses FOR INSERT
WITH CHECK (
  session_id IN (
    SELECT id FROM public.pre_op_sessions WHERE conducted_by = auth.uid()
  )
);

-- ─── CAPAs: org isolation + site access ──────────────────────────────────────

CREATE POLICY "org isolation" ON public.capas FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.capas FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Rectification plans: org isolation + site access ────────────────────────

CREATE POLICY "org isolation" ON public.rectification_plans FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.rectification_plans FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);

-- ─── Intelligence alerts: org isolation + site access ────────────────────────

CREATE POLICY "org isolation" ON public.intelligence_alerts FOR ALL
USING (
  organisation_id = (SELECT organisation_id FROM public.user_profiles WHERE id = auth.uid())
);

CREATE POLICY "site access" ON public.intelligence_alerts FOR ALL
USING (
  site_id IN (SELECT site_id FROM public.site_users WHERE user_id = auth.uid())
);
