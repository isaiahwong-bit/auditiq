-- CAPAs, rectification plans, and intelligence alerts
-- Created after pre_op_responses to resolve FK dependency

CREATE TABLE public.capas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id          uuid REFERENCES public.findings(id),
  pre_op_response_id  uuid REFERENCES public.pre_op_responses(id),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  assigned_to         uuid REFERENCES public.user_profiles(id),
  title               text NOT NULL,
  description         text,
  due_date            timestamptz,
  urgency             text,
  status              text DEFAULT 'open',
  evidence_urls       text[],
  closed_at           timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_capas_site_id ON public.capas(site_id);
CREATE INDEX idx_capas_finding_id ON public.capas(finding_id);
CREATE INDEX idx_capas_status ON public.capas(status);

CREATE TABLE public.rectification_plans (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  clause_id           uuid NOT NULL REFERENCES public.framework_clauses(id) ON DELETE CASCADE,
  facility_area_id    uuid REFERENCES public.facility_areas(id),
  description         text NOT NULL,
  target_date         date,
  status              text DEFAULT 'active',
  created_by          uuid REFERENCES public.user_profiles(id),
  created_at          timestamptz DEFAULT now(),
  completed_at        timestamptz
);

CREATE INDEX idx_rectification_plans_site_id ON public.rectification_plans(site_id);
CREATE INDEX idx_rectification_plans_clause_id ON public.rectification_plans(clause_id);

CREATE TABLE public.intelligence_alerts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  alert_type          text NOT NULL,
  category_code       text,
  facility_area_id    uuid REFERENCES public.facility_areas(id),
  check_item_id       uuid REFERENCES public.check_items(id),
  framework_codes     text[],
  title               text NOT NULL,
  description         text NOT NULL,
  severity            text,
  status              text DEFAULT 'active',
  generated_at        timestamptz DEFAULT now(),
  acknowledged_by     uuid REFERENCES public.user_profiles(id),
  acknowledged_at     timestamptz
);

CREATE INDEX idx_intelligence_alerts_site_id ON public.intelligence_alerts(site_id);
CREATE INDEX idx_intelligence_alerts_status ON public.intelligence_alerts(status);
