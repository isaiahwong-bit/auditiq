-- Framework clauses and site-framework links

CREATE TABLE public.framework_clauses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id        uuid NOT NULL REFERENCES public.frameworks(id) ON DELETE CASCADE,
  category_id         uuid NOT NULL REFERENCES public.finding_categories(id) ON DELETE CASCADE,
  clause_ref          text NOT NULL,
  clause_title        text NOT NULL,
  requirement         text NOT NULL,
  severity            text,
  response_hours      integer,
  zero_tolerance      boolean DEFAULT false,
  notes               text
);

CREATE INDEX idx_framework_clauses_framework_id ON public.framework_clauses(framework_id);
CREATE INDEX idx_framework_clauses_category_id ON public.framework_clauses(category_id);

CREATE TABLE public.site_frameworks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  framework_id        uuid NOT NULL REFERENCES public.frameworks(id) ON DELETE CASCADE,
  enabled             boolean DEFAULT false,
  enabled_at          timestamptz,
  enabled_by          uuid REFERENCES public.user_profiles(id),
  UNIQUE (site_id, framework_id)
);

CREATE INDEX idx_site_frameworks_site_id ON public.site_frameworks(site_id);
