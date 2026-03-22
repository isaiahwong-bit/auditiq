-- Standalone tables with no foreign key dependencies

CREATE TABLE public.organisations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  slug                text UNIQUE NOT NULL,
  plan                text NOT NULL DEFAULT 'starter',
  stripe_customer_id  text,
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE public.frameworks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text UNIQUE NOT NULL,
  name                text NOT NULL,
  version             text,
  type                text,
  region              text DEFAULT 'AU',
  last_updated        timestamptz,
  is_active           boolean DEFAULT true
);

CREATE TABLE public.finding_categories (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                text UNIQUE NOT NULL,
  name                text NOT NULL,
  description         text,
  risk_weight         integer,
  keywords            text[]
);
