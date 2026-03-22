# AuditIQ — CLAUDE.md

This is the complete source of truth for the AuditIQ codebase.
Read this entire file before writing any code.
When in doubt about architecture, conventions, or behaviour — check here first.
Do not invent patterns that are not documented here.

---

## Product overview

AuditIQ is a multi-tenant B2B SaaS platform for food safety audit, compliance management,
facility intelligence, and pre-operational check programs. It serves Australian food
manufacturers, contract packers, and cold chain operators.

Primary users:
- QA Managers — run audits, manage compliance, review pre-op data, create rectification plans
- Plant Managers — read-only compliance posture, CAPA oversight, multi-site dashboards
- Food Safety Auditors — conduct formal audits, enter findings
- Operators — complete daily pre-op checks on mobile only

Core value:
- Reactive: formal audits → AI-generated findings mapped to all active frameworks simultaneously
- Proactive: daily pre-op checks → accumulating compliance intelligence, predictive alerts
- Certification-ready: evidence packages and gap reports with rectification plans for auditor visits

---

## Domain and URL structure

Marketing site (public):
  https://auditiq.com.au
  https://auditiq.com.au/pricing
  https://auditiq.com.au/book-demo

Application (authenticated):
  https://app.auditiq.com.au/login
  https://app.auditiq.com.au/[org-slug]/dashboard
  https://app.auditiq.com.au/[org-slug]/sites
  https://app.auditiq.com.au/[org-slug]/reports
  https://app.auditiq.com.au/[org-slug]/settings
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/dashboard
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/audits
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/audits/[audit-id]
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/pre-op-checks
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/pre-op-checks/[session-id]
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/capas
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/intelligence
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/settings
  https://app.auditiq.com.au/[org-slug]/sites/[site-slug]/settings/compliance
  https://app.auditiq.com.au/admin

Rules:
- All customers use app.auditiq.com.au — no per-customer subdomains at this stage
- org-slug identifies the organisation (e.g. simplot, inghams)
- site-slug identifies the physical facility (e.g. kelso-nsw, bathurst-nsw)
- Both slugs are set on creation, URL-safe, and never changed
- Org context must always be present in the URL — never infer from session alone

DNS and hosting:
- auditiq.com.au and app.auditiq.com.au both use Cloudflare DNS
- Both point to Vercel via CNAME records
- Vercel provisions SSL automatically
- API at api.auditiq.com.au points to Railway via Cloudflare

---

## Tech stack

Frontend:
- React 18 with Vite
- TypeScript — strict mode, no implicit any, no type assertions (as Type)
- Tailwind CSS — all styling, no custom CSS files, no CSS modules
- React Router v6 — all routing
- TanStack Query v5 — all server state, no useEffect for data fetching
- React Hook Form + Zod — all forms and validation
- Hosted on Vercel, auto-deploys from main branch on GitHub

Backend:
- Node.js with Express
- TypeScript — strict mode throughout
- Bull + Redis — job queues for async tasks
- Hosted on Railway, Sydney region (ap-southeast-2)
- Three Railway services: api, worker, redis

Database and storage:
- Supabase (Postgres), Sydney region (ap-southeast-2)
- Supabase Auth — all authentication and session management
- Supabase Storage — all files (photos, PDFs, uploaded documents)
- Row-level security on every table — see RLS section
- Migrations via Supabase CLI only — never edit schema in dashboard

AI:
- Anthropic Claude API
- claude-sonnet-4-6 — Step 1 classification, photo analysis, nightly intelligence
- claude-opus-4-6 — Step 2 narrative generation, report writing, document ingestion
- All Claude calls via /api/v1/ai — never from the frontend

Email:
- Resend — all transactional email
- React Email — all templates in /emails directory
- Never use nodemailer, sendgrid, or any other provider

Payments:
- Stripe — subscription billing
- Webhook handler at /api/webhooks/stripe

---

## Repository structure

auditiq/
├── CLAUDE.md
├── apps/
│   ├── web/                         React frontend
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── audit/
│   │   │   │   ├── preop/
│   │   │   │   ├── capa/
│   │   │   │   ├── compliance/
│   │   │   │   ├── intelligence/
│   │   │   │   └── ui/
│   │   │   ├── pages/
│   │   │   │   ├── org/
│   │   │   │   └── site/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── main.tsx
│   └── api/                         Node.js Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── audits.ts
│       │   │   ├── findings.ts
│       │   │   ├── capas.ts
│       │   │   ├── preop.ts
│       │   │   ├── intelligence.ts
│       │   │   ├── facilities.ts
│       │   │   ├── frameworks.ts
│       │   │   ├── documents.ts
│       │   │   ├── compliance.ts
│       │   │   ├── ai.ts
│       │   │   └── webhooks.ts
│       │   ├── services/
│       │   │   ├── audit.service.ts
│       │   │   ├── capa.service.ts
│       │   │   ├── compliance.service.ts
│       │   │   ├── intelligence.service.ts
│       │   │   ├── document.service.ts
│       │   │   ├── ai.service.ts
│       │   │   └── report.service.ts
│       │   ├── jobs/
│       │   │   ├── pdf.job.ts
│       │   │   ├── email.job.ts
│       │   │   ├── intelligence.job.ts
│       │   │   └── extraction.job.ts
│       │   ├── lib/
│       │   │   ├── supabase.ts
│       │   │   ├── claude.ts
│       │   │   ├── resend.ts
│       │   │   ├── stripe.ts
│       │   │   └── redis.ts
│       │   ├── middleware/
│       │   │   ├── auth.ts
│       │   │   ├── org.ts
│       │   │   ├── site.ts
│       │   │   └── errors.ts
│       │   └── index.ts
├── packages/
│   └── types/                       shared TypeScript types
├── emails/                          React Email templates
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── .github/
    └── workflows/

---

## Database schema

### Tenancy hierarchy

organisations
  sites
    facility_areas
      check_items
        check_item_clause_refs
        pre_op_sessions
          pre_op_responses
    audits
      findings
        finding_clause_refs
        capas
    rectification_plans (linked to framework_clauses + facility_areas)
    intelligence_alerts

### Core tables

organisations {
  id                  uuid PK default gen_random_uuid()
  name                text NOT NULL
  slug                text UNIQUE NOT NULL
  plan                text NOT NULL               -- 'starter' | 'professional' | 'enterprise'
  stripe_customer_id  text
  created_at          timestamptz default now()
}

sites {
  id                  uuid PK default gen_random_uuid()
  organisation_id     uuid FK -> organisations NOT NULL
  name                text NOT NULL
  slug                text NOT NULL
  address             text
  site_type           text                        -- 'processing' | 'cold_chain' | 'co_manufacturer'
  is_active           boolean default true
  created_at          timestamptz default now()
  UNIQUE (organisation_id, slug)
}

user_profiles {
  id                  uuid PK references auth.users
  organisation_id     uuid FK -> organisations NOT NULL
  role                text NOT NULL               -- 'admin' | 'qa_manager' | 'plant_manager'
                                                  -- 'auditor' | 'operator'
  full_name           text
  created_at          timestamptz default now()
}

site_users {
  user_id             uuid FK -> user_profiles
  site_id             uuid FK -> sites
  PRIMARY KEY (user_id, site_id)
}

audits {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  conducted_by        uuid FK -> user_profiles
  audit_type          text                        -- 'internal' | 'third_party' | 'supplier'
  status              text default 'draft'        -- 'draft' | 'in_progress' | 'complete' | 'reported'
  overall_score       integer
  started_at          timestamptz
  completed_at        timestamptz
  created_at          timestamptz default now()
}

findings {
  id                  uuid PK default gen_random_uuid()
  audit_id            uuid FK -> audits NOT NULL
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  raw_observation     text NOT NULL
  category_code       text FK -> finding_categories
  finding_title       text
  finding_narrative   text
  recommended_action  text
  risk_rating         text                        -- 'critical' | 'high' | 'medium' | 'low'
  photo_urls          text[]
  ai_confidence       decimal
  created_at          timestamptz default now()
}

capas {
  id                  uuid PK default gen_random_uuid()
  finding_id          uuid FK -> findings
  pre_op_response_id  uuid FK -> pre_op_responses
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  assigned_to         uuid FK -> user_profiles
  title               text NOT NULL
  description         text
  due_date            timestamptz
  urgency             text                        -- 'immediate' | '24hr' | '7day' | 'standard'
  status              text default 'open'         -- 'open' | 'in_progress' | 'closed' | 'overdue'
  evidence_urls       text[]
  closed_at           timestamptz
  created_at          timestamptz default now()
}

### Compliance engine tables

frameworks {
  id                  uuid PK default gen_random_uuid()
  code                text UNIQUE NOT NULL
  name                text NOT NULL
  version             text
  type                text                        -- 'international' | 'retailer' | 'regulatory'
  region              text default 'AU'
  last_updated        timestamptz
  is_active           boolean default true
}

finding_categories {
  id                  uuid PK default gen_random_uuid()
  code                text UNIQUE NOT NULL
  name                text NOT NULL
  description         text
  risk_weight         integer
  keywords            text[]
}

framework_clauses {
  id                  uuid PK default gen_random_uuid()
  framework_id        uuid FK -> frameworks NOT NULL
  category_id         uuid FK -> finding_categories NOT NULL
  clause_ref          text NOT NULL
  clause_title        text NOT NULL
  requirement         text NOT NULL
  severity            text                        -- 'critical' | 'major' | 'minor'
  response_hours      integer
  zero_tolerance      boolean default false
  notes               text
}

site_frameworks {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  framework_id        uuid FK -> frameworks NOT NULL
  enabled             boolean default false
  enabled_at          timestamptz
  enabled_by          uuid FK -> user_profiles
  UNIQUE (site_id, framework_id)
}

finding_clause_refs {
  id                  uuid PK default gen_random_uuid()
  finding_id          uuid FK -> findings NOT NULL
  clause_id           uuid FK -> framework_clauses NOT NULL
  gap_detected        boolean default false
  gap_description     text
  capa_urgency        text
  auto_mapped         boolean default true
}

rectification_plans {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  clause_id           uuid FK -> framework_clauses NOT NULL
  facility_area_id    uuid FK -> facility_areas
  description         text NOT NULL
  target_date         date
  status              text default 'active'       -- 'active' | 'completed' | 'overdue'
  created_by          uuid FK -> user_profiles
  created_at          timestamptz default now()
  completed_at        timestamptz
}

### Facility intelligence tables

uploaded_documents {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  file_url            text NOT NULL
  file_name           text NOT NULL
  document_type       text                        -- 'pre_op_checklist' | 'scope_of_works'
                                                  -- 'haccp_plan' | 'other'
  processing_status   text default 'pending'      -- 'pending' | 'processing' | 'review' | 'approved'
  extracted_json      jsonb
  uploaded_by         uuid FK -> user_profiles
  created_at          timestamptz default now()
}

facility_areas {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  name                text NOT NULL
  area_type           text                        -- 'production' | 'storage' | 'amenities'
                                                  -- 'dispatch' | 'external' | 'equipment'
  display_order       integer default 0
  is_active           boolean default true
  source_document_id  uuid FK -> uploaded_documents
  created_at          timestamptz default now()
}

check_items {
  id                  uuid PK default gen_random_uuid()
  facility_area_id    uuid FK -> facility_areas NOT NULL
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  name                text NOT NULL
  description         text
  scoring_type        text default 'pass_fail'    -- 'pass_fail' | 'numeric' | 'percentage'
  score_min           decimal
  score_max           decimal
  pass_threshold      decimal
  frequency           text default 'daily'        -- 'daily' | 'per_shift' | 'weekly' | 'monthly'
  frequency_times     integer default 1
  assignable_to       text default 'any'          -- 'qa_manager' | 'operator' | 'any'
  category_code       text FK -> finding_categories
  display_order       integer default 0
  is_active           boolean default true
  source_document_id  uuid FK -> uploaded_documents
  created_at          timestamptz default now()
}

check_item_clause_refs {
  check_item_id       uuid FK -> check_items NOT NULL
  clause_id           uuid FK -> framework_clauses NOT NULL
  PRIMARY KEY (check_item_id, clause_id)
}

pre_op_sessions {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  facility_area_id    uuid FK -> facility_areas NOT NULL
  conducted_by        uuid FK -> user_profiles NOT NULL
  shift               text                        -- 'am' | 'pm' | 'night' | null
  session_date        date NOT NULL
  status              text default 'in_progress'  -- 'in_progress' | 'complete' | 'missed'
  overall_score       decimal
  pass_rate           decimal
  completed_at        timestamptz
  created_at          timestamptz default now()
}

pre_op_responses {
  id                  uuid PK default gen_random_uuid()
  session_id          uuid FK -> pre_op_sessions NOT NULL
  check_item_id       uuid FK -> check_items NOT NULL
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  result              text                        -- 'pass' | 'fail' | 'na'
  score               decimal
  notes               text
  photo_urls          text[]
  flagged             boolean default false
  created_at          timestamptz default now()
}

intelligence_alerts {
  id                  uuid PK default gen_random_uuid()
  site_id             uuid FK -> sites NOT NULL
  organisation_id     uuid FK -> organisations NOT NULL
  alert_type          text NOT NULL               -- 'declining_trend' | 'pattern_detected'
                                                  -- 'threshold_approaching' | 'seasonal_risk'
  category_code       text
  facility_area_id    uuid FK -> facility_areas
  check_item_id       uuid FK -> check_items
  framework_codes     text[]
  title               text NOT NULL
  description         text NOT NULL
  severity            text                        -- 'high' | 'medium' | 'low'
  status              text default 'active'       -- 'active' | 'acknowledged' | 'resolved'
  generated_at        timestamptz default now()
  acknowledged_by     uuid FK -> user_profiles
  acknowledged_at     timestamptz
}

---

## Row-level security

RLS is enabled on every table. Never disable it for any reason including debugging.
Never filter by org_id in application code — RLS handles it at the database layer.
Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend.

Standard org isolation (apply to every user-facing table):

  CREATE POLICY "org isolation" ON [table] FOR ALL
  USING (
    organisation_id = (
      SELECT organisation_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

Additional site access for site-scoped tables:

  CREATE POLICY "site access" ON [table] FOR ALL
  USING (
    site_id IN (SELECT site_id FROM site_users WHERE user_id = auth.uid())
  );

Operators — insert only on pre_op_responses:

  CREATE POLICY "operator insert" ON pre_op_responses FOR INSERT
  WITH CHECK (
    conducted_by = auth.uid()
  );

Frameworks and clauses — public read, admin write:

  CREATE POLICY "public read" ON frameworks FOR SELECT USING (true);
  CREATE POLICY "public read" ON framework_clauses FOR SELECT USING (true);

---

## AI prompt architecture

Two-step pattern is mandatory for all finding generation.
Never skip Step 1. Never send all framework clauses without pre-fetching by category first.

Step 1 — Classification (claude-sonnet-4-6, target under 800ms):
  Input:  raw_observation (text), site_type (text)
  System: all 40 category codes + names + keyword arrays from finding_categories table
  Output: { category_code, confidence, risk_rating, keywords_matched }
  Format: JSON only, no prose

Step 2 — Narrative generation (claude-opus-4-6):
  Pre-fetch clauses BEFORE this call:
    SELECT fc.*, f.code as framework_code, f.name as framework_name
    FROM framework_clauses fc
    JOIN frameworks f ON f.id = fc.framework_id
    JOIN site_frameworks sf ON sf.framework_id = f.id
    WHERE sf.site_id = :site_id AND sf.enabled = true
    AND fc.category_id = :category_id_from_step1
  Input:  category_code, risk_rating, raw_observation, site context, pre-fetched clauses
  Output: {
    finding_title, finding_narrative, recommended_action,
    clause_refs: [{ framework_code, clause_ref, gap_detected, gap_description, capa_urgency }]
  }
  Never ask Claude to recall clause numbers — always inject pre-fetched data

Document ingestion (claude-opus-4-6, Bull background job only, never real-time):
  Input:  uploaded document text
  Output: {
    areas: [{ name, area_type, display_order,
      check_items: [{ name, description, scoring_type, frequency,
        category_code, suggested_clause_refs }]
    }],
    coverage_gaps: [{ framework_code, category_code, description }]
  }
  Store in uploaded_documents.extracted_json
  Set status to 'review' — human must approve before facility_areas are created
  Never auto-create facility_areas or check_items without QA Manager approval

Nightly intelligence (claude-sonnet-4-6, Bull cron job):
  Analyses 30 days of pre_op_responses per site
  Detects: declining trends, shift patterns, seasonal signals, threshold proximity
  Creates intelligence_alerts records
  Emails high severity alerts only

Photo analysis (claude-sonnet-4-6 with vision):
  Output: { description, flagged_issues, suggested_category_code }
  Use suggested_category_code as hint for Step 1, not a replacement

---

## The 40 finding categories

Fixed. Never add or remove without updating AI prompts, keywords, and seed data.

pest_control, personal_hygiene, temperature_control, chemical_storage,
allergen_management, documentation, traceability, cleaning_sanitation,
equipment_maintenance, water_quality, waste_management, supplier_approval,
label_compliance, foreign_body, microbiological_risk, training_records,
ccp_monitoring, gmp_breach, facility_condition, cold_chain,
glass_brittle_plastic, metal_contamination, pest_proofing, product_recall,
environmental_monitoring, handwashing_facilities, protective_clothing,
segregation_raw_rte, cooking_temperature, cooling_temperature,
storage_conditions, receiving_inspection, dispatch_checks, calibration,
maintenance_program, non_conforming_product, customer_complaints,
internal_audit, management_review, corrective_action_effectiveness

---

## Framework codes

Use these exact strings everywhere in the codebase.

haccp         HACCP (Codex Alimentarius)
brcgs         BRCGS Food Safety Issue 9
sqf           SQF Edition 9
fssc22000     FSSC 22000 Version 6
iso22000      ISO 22000:2018
coles         Coles Supplier Requirements
woolworths    Woolworths Supplier Excellence Program
aldi          ALDI Supplier Manual
globalg_ap    GlobalG.A.P IFA
harpc         HARPC (US FSMA)

---

## CAPA rules

Urgency set by the most restrictive active framework clause on the finding or response.

immediate     within 4 hours   — zero_tolerance = true on any active clause
24hr          within 24 hours  — critical risk, or retailer response_hours <= 24
7day          within 7 days    — high risk rating
standard      within 28 days   — medium or low risk

CAPAs originate from audit findings (finding_id set) or pre-op responses (pre_op_response_id set).
On creation, Bull worker:
1. Sets due_date from urgency + created_at
2. Sends assignment email via Resend
3. Schedules reminder 24hrs before due_date
4. Escalates to plant_manager if overdue by 24hrs

---

## CAR vs NCAR logic

AuditIQ does not assign CAR or NCAR as definitive classifications.
That responsibility belongs to the auditor, not the software.

What AuditIQ surfaces:
- Gap with no rectification plan → labelled "Unaddressed — CAR risk"
- Gap with a rectification plan → labelled "NCAR eligible — plan in place"

Rectification plans are visible to auditors in two places:
1. The compliance setup page (/settings/compliance)
2. The certification evidence PDF report (dedicated "Rectification plans" section)

Never use "CAR" or "NCAR" as standalone labels in the product.
Always frame them as indicators: "CAR risk" and "NCAR eligible".

---

## Pre-op check rules

Sessions lock on completion — no editing after status = 'complete'.
Failed items with zero_tolerance clause refs create immediate urgency CAPAs automatically.
Failed items without zero_tolerance create draft CAPAs for QA Manager review.
Missed sessions (not completed by site-configured deadline) are tracked and appear
in certification evidence reports — auditors check for completion rates.
Session overall_score = (passed items / total non-NA items) * 100, rounded to 1dp.

---

## Compliance setup interface

Route: /[org]/sites/[site-slug]/settings/compliance

Framework toggle section:
- Each active framework shows live counts: covered, gaps, plans in place
- Each inactive framework shows "Not active"
- Summary bar: active count, total gaps, plans in place, unaddressed gaps

On framework activation:
1. Run background analysis comparing check_item_clause_refs against newly activated framework
2. Show immediate inline notification: requirements covered, new gaps, areas affected
3. Two CTAs: "Review gaps by area" and "Download gap report"
4. Never silently activate — always show the gap analysis result

Facility area accordions:
- Collapsed: area name + gap summary badges per active framework
- Green = fully covered, red = gaps, amber = gaps with plans
- Expanded: every clause for active frameworks relevant to this area

Per-clause states:
- Covered: green badge + name of check item that covers it + expandable full clause text
- Gap — no plan: red badge + three options: Add check item, Create plan, Mark N/A
- NCAR eligible: amber badge + rectification plan box showing plan text, author, date,
  and "Visible to auditors in report" label

When framework is toggled on, immediately analyse coverage and show notification.
When Woolworths is toggled on, show how many existing requirements are already covered
before showing the new gaps — reduces the perceived burden of adding a new standard.

---

## Navigation and UI structure

Desktop layout (QA managers, plant managers, auditors):
- Left sidebar: AuditIQ logo, org name, site switcher, current site navigation
- Site nav: Dashboard, Audits, Pre-op checks, CAPAs (with open count badge),
  Intelligence (with alert count badge), Reports, Settings
- Org nav from /[org]/dashboard: Sites, Reports, Settings
- Main content fills remaining viewport width

Mobile layout (operators and QA managers on mobile):
- Full-screen single-column only
- Bottom tab bar: Checks, CAPAs (with count), History
- Operators land on pre-op area list on login — no other screens needed
- Check item flow: area list → item by item (with progress bar) → session summary
- Operators cannot access audit data, compliance setup, or intelligence views
- QA managers on mobile get a hamburger menu for full navigation

Responsive breakpoint: 768px
- Below: mobile layout for all users
- Above: sidebar layout for non-operator roles

Colour conventions throughout the UI:
- Green (#1D9E75 / #E1F5EE) — covered, passed, complete, good
- Amber (#BA7517 / #FAEEDA) — plan in place, warning, overdue approaching
- Red (#E24B4A / #FCEBEB) — gap, failed, overdue, immediate action
- Blue (#378ADD / #E6F1FB) — in progress, informational
- Gray (#888780 / #F1EFE8) — inactive, not started, neutral

---

## User roles and access

admin          full org access, billing, user management, framework toggles
qa_manager     run audits, findings, CAPAs, pre-op review, document uploads,
               facility configuration, rectification plans, reports
plant_manager  read-only audits, CAPA management, intelligence dashboard,
               pre-op scores and trends — cannot run audits or configure site
auditor        run audits, enter findings, view own audit history
operator       complete pre-op checks only, view own session history
               no access to audit data, CAPA management, or intelligence

AuditIQ internal admin (/admin):
Protected by AUDITIQ_ADMIN_SECRET env check — not a Supabase role.
Never expose admin routes to customer sessions.

---

## Email templates in /emails

capa-assigned.tsx           to assignee on CAPA creation
capa-reminder.tsx           24hrs before due date
capa-overdue.tsx            to plant_manager when CAPA overdue
capa-closed.tsx             to qa_manager when evidence submitted
audit-complete.tsx          with PDF report when audit finalised
pre-op-missed.tsx           to qa_manager when session not completed by deadline
intelligence-alert.tsx      high severity predictive alerts
framework-updated.tsx       to site admins when framework clauses refreshed
certification-pack.tsx      with PDF certification evidence package
welcome.tsx                 on first login
invite.tsx                  org admin invites team member

---

## Stripe subscription model

starter        $1,800/mo   1 site, 20 audits/mo, manual facility setup (5 areas max),
                           basic pre-op checks, no AI insights, no document ingestion
professional   $2,800/mo   1 site, unlimited audits, document ingestion + AI facility build,
                           unlimited areas, framework mapping, predictive alerts,
                           benchmarking, certification evidence packages,
                           SafetyCulture integration, regulatory report builder
enterprise     $4,500/mo   up to 5 sites, everything in Professional,
                           multi-site dashboard, cross-site benchmarking,
                           API access, dedicated onboarding

Stripe metadata on every subscription:
  organisation_id, plan, site_limit, audit_limit

Webhook events to handle:
  customer.subscription.created    provision org access
  customer.subscription.updated    update plan and limits
  customer.subscription.deleted    suspend org, retain all data
  invoice.payment_failed           email billing contact, 7 day grace period

---

## Environment variables

Frontend (apps/web/.env):
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_API_URL=https://api.auditiq.com.au

Backend (apps/api/.env):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
  STRIPE_SECRET_KEY
  STRIPE_WEBHOOK_SECRET
  RESEND_API_KEY
  REDIS_URL
  AUDITIQ_ADMIN_SECRET
  NODE_ENV

---

## Coding conventions

TypeScript:
- Strict mode, no implicit any
- Shared types in packages/types — use across web and api
- Zod for all external inputs (request bodies, webhook payloads, AI responses)
- Never use type assertions

React:
- Functional components only
- TanStack Query for all data fetching — no useEffect for API calls
- React Hook Form for all forms
- PascalCase component names, kebab-case file names
- Pages in /pages, reusable components in /components

API:
- REST only — no GraphQL
- All routes at /api/v1/
- Auth middleware on all routes except /api/webhooks and /api/health
- Consistent error shape: { error: string, code: string }
- Log all errors with context — never swallow

Database:
- Parameterised queries only — never string interpolation in SQL
- Always go through RLS — never use service role key for user-facing queries
- Migrations via Supabase CLI only
- New tables always get RLS enabled immediately after creation

---

## Hard rules — never do these

Never call Claude from the frontend — always proxy through /api/v1/ai
Never skip Step 1 classification before Step 2 narrative generation
Never send all framework clauses to Claude — always pre-fetch by category first
Never disable RLS on any table for any reason
Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend
Never auto-create facility_areas or check_items without QA Manager document review approval
Never modify framework_clauses in application code — admin review workflow only
Never add finding categories without updating AI prompts, keywords, and seed data
Never allow editing of a pre_op_session after status = 'complete'
Never store files outside Supabase Storage
Never send email outside Resend and the /emails template directory
Never put database logic in route handlers — all DB logic goes in /services
Never use n8n — all automation lives in Bull jobs

---

## Local development

supabase start                     local Supabase (dashboard: localhost:54323)
redis-server                       Redis for Bull
cd apps/api && npm run dev         Express API on port 3001
cd apps/web && npm run dev         Vite frontend on port 5173

---

## First Claude Code session

Use this exact prompt to start the build:

"Scaffold the full monorepo structure exactly as defined in CLAUDE.md.
Then generate all Supabase migration files for the complete database schema
including RLS policies for every table. Then create the seed.sql file
with all framework codes, the 40 finding categories with keywords,
and representative clause data for HACCP, BRCGS, and Coles.
Do not build any frontend or API routes yet — foundation first."

---

## Key documentation

Supabase RLS:     https://supabase.com/docs/guides/auth/row-level-security
TanStack Query:   https://tanstack.com/query/latest
Bull queues:      https://docs.bullmq.io
React Email:      https://react.email/docs
Anthropic API:    https://docs.anthropic.com
Stripe webhooks:  https://stripe.com/docs/webhooks
Resend:           https://resend.com/docs
