-- =============================================================================
-- Clause Evidence table
-- Allows teams to attach evidence (files or text references) to framework
-- clause gaps to prove they have been addressed.
-- =============================================================================

CREATE TABLE public.clause_evidence (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id           uuid NOT NULL REFERENCES public.sites(id),
  organisation_id   uuid NOT NULL REFERENCES public.organisations(id),
  clause_id         uuid NOT NULL REFERENCES public.framework_clauses(id),
  facility_area_id  uuid REFERENCES public.facility_areas(id),
  evidence_type     text NOT NULL CHECK (evidence_type IN ('file', 'reference')),
  file_url          text,
  file_name         text,
  reference_text    text,
  description       text,
  uploaded_by       uuid REFERENCES public.user_profiles(id),
  created_at        timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clause_evidence ENABLE ROW LEVEL SECURITY;

-- Org isolation policy using security definer function
CREATE POLICY "org isolation" ON public.clause_evidence FOR ALL
USING (organisation_id = public.get_user_org_id());
