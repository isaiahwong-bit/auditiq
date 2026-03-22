-- Audits, findings, and finding-clause cross-references

CREATE TABLE public.audits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  conducted_by        uuid REFERENCES public.user_profiles(id),
  audit_type          text,
  status              text DEFAULT 'draft',
  overall_score       integer,
  started_at          timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_audits_site_id ON public.audits(site_id);
CREATE INDEX idx_audits_organisation_id ON public.audits(organisation_id);
CREATE INDEX idx_audits_status ON public.audits(status);

CREATE TABLE public.findings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id            uuid NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  raw_observation     text NOT NULL,
  category_code       text REFERENCES public.finding_categories(code),
  finding_title       text,
  finding_narrative   text,
  recommended_action  text,
  risk_rating         text,
  photo_urls          text[],
  ai_confidence       decimal,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_findings_audit_id ON public.findings(audit_id);
CREATE INDEX idx_findings_site_id ON public.findings(site_id);
CREATE INDEX idx_findings_organisation_id ON public.findings(organisation_id);
CREATE INDEX idx_findings_category_code ON public.findings(category_code);

CREATE TABLE public.finding_clause_refs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id          uuid NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  clause_id           uuid NOT NULL REFERENCES public.framework_clauses(id) ON DELETE CASCADE,
  gap_detected        boolean DEFAULT false,
  gap_description     text,
  capa_urgency        text,
  auto_mapped         boolean DEFAULT true
);

CREATE INDEX idx_finding_clause_refs_finding_id ON public.finding_clause_refs(finding_id);
CREATE INDEX idx_finding_clause_refs_clause_id ON public.finding_clause_refs(clause_id);
