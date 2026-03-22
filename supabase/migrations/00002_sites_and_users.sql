-- Sites, user profiles, and site-user junction

CREATE TABLE public.sites (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  name                text NOT NULL,
  slug                text NOT NULL,
  address             text,
  site_type           text,
  is_active           boolean DEFAULT true,
  created_at          timestamptz DEFAULT now(),
  UNIQUE (organisation_id, slug)
);

CREATE INDEX idx_sites_organisation_id ON public.sites(organisation_id);

CREATE TABLE public.user_profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organisation_id     uuid NOT NULL REFERENCES public.organisations(id) ON DELETE CASCADE,
  role                text NOT NULL,
  full_name           text,
  created_at          timestamptz DEFAULT now()
);

CREATE INDEX idx_user_profiles_organisation_id ON public.user_profiles(organisation_id);

CREATE TABLE public.site_users (
  user_id             uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  site_id             uuid REFERENCES public.sites(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, site_id)
);

CREATE INDEX idx_site_users_site_id ON public.site_users(site_id);
