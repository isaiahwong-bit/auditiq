-- Documents, facility areas, check items, pre-op sessions and responses

CREATE TABLE public.uploaded_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  file_url            text NOT NULL,
  file_name           text NOT NULL,
  document_type       text,
  processing_status   text DEFAULT 'pending',
  extracted_json      jsonb,
  uploaded_by         uuid REFERENCES public.user_profiles(id),
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_uploaded_documents_site_id ON public.uploaded_documents(site_id);

CREATE TABLE public.facility_areas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name                text NOT NULL,
  area_type           text,
  display_order       integer DEFAULT 0,
  is_active           boolean DEFAULT true,
  source_document_id  uuid REFERENCES public.uploaded_documents(id),
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_facility_areas_site_id ON public.facility_areas(site_id);

CREATE TABLE public.check_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_area_id    uuid NOT NULL REFERENCES public.facility_areas(id) ON DELETE CASCADE,
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name                text NOT NULL,
  description         text,
  scoring_type        text DEFAULT 'pass_fail',
  score_min           decimal,
  score_max           decimal,
  pass_threshold      decimal,
  frequency           text DEFAULT 'daily',
  frequency_times     integer DEFAULT 1,
  assignable_to       text DEFAULT 'any',
  category_code       text REFERENCES public.finding_categories(code),
  display_order       integer DEFAULT 0,
  is_active           boolean DEFAULT true,
  source_document_id  uuid REFERENCES public.uploaded_documents(id),
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_check_items_facility_area_id ON public.check_items(facility_area_id);
CREATE INDEX idx_check_items_site_id ON public.check_items(site_id);

CREATE TABLE public.check_item_clause_refs (
  check_item_id       uuid NOT NULL REFERENCES public.check_items(id) ON DELETE CASCADE,
  clause_id           uuid NOT NULL REFERENCES public.framework_clauses(id) ON DELETE CASCADE,
  PRIMARY KEY (check_item_id, clause_id)
);

CREATE TABLE public.pre_op_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  facility_area_id    uuid NOT NULL REFERENCES public.facility_areas(id) ON DELETE CASCADE,
  conducted_by        uuid NOT NULL REFERENCES public.user_profiles(id),
  shift               text,
  session_date        date NOT NULL,
  status              text DEFAULT 'in_progress',
  overall_score       decimal,
  pass_rate           decimal,
  completed_at        timestamptz,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_pre_op_sessions_site_id ON public.pre_op_sessions(site_id);
CREATE INDEX idx_pre_op_sessions_facility_area_id ON public.pre_op_sessions(facility_area_id);

CREATE TABLE public.pre_op_responses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES public.pre_op_sessions(id) ON DELETE CASCADE,
  check_item_id       uuid NOT NULL REFERENCES public.check_items(id) ON DELETE CASCADE,
  site_id             uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  result              text,
  score               decimal,
  notes               text,
  photo_urls          text[],
  flagged             boolean DEFAULT false,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_pre_op_responses_session_id ON public.pre_op_responses(session_id);
