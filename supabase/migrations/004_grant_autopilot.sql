-- ============================================================
-- Shinnslist Grant Autopilot — product pivot migration
-- Safe to re-run. Adds grant profiles, verified opportunities,
-- applications, submission jobs, and an append-only event log.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS grant_plan TEXT NOT NULL DEFAULT 'preview'
    CHECK (grant_plan IN ('preview', 'grant_desk')),
  ADD COLUMN IF NOT EXISTS grant_submission_credits INT NOT NULL DEFAULT 0
    CHECK (grant_submission_credits >= 0);

CREATE TABLE IF NOT EXISTS grant_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  applicant_type TEXT NOT NULL CHECK (applicant_type IN ('small_business', 'nonprofit', 'individual', 'community_project')),
  legal_name TEXT NOT NULL,
  public_name TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  years_operating TEXT,
  employee_range TEXT,
  revenue_range TEXT,
  ownership_identities TEXT[] NOT NULL DEFAULT '{}',
  mission TEXT NOT NULL DEFAULT '',
  funding_use TEXT NOT NULL DEFAULT '',
  reusable_facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  document_manifest JSONB NOT NULL DEFAULT '[]'::jsonb,
  completion_score INT NOT NULL DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grant_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  funder TEXT NOT NULL,
  amount_min_cents BIGINT,
  amount_max_cents BIGINT,
  amount_label TEXT NOT NULL,
  deadline DATE,
  deadline_label TEXT NOT NULL,
  cycle_key TEXT NOT NULL DEFAULT '2026',
  status TEXT NOT NULL CHECK (status IN ('open', 'rolling', 'upcoming', 'closed', 'paused')),
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  eligibility_text TEXT NOT NULL,
  eligibility_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  effort TEXT NOT NULL CHECK (effort IN ('light', 'moderate', 'heavy')),
  fee_cents INT NOT NULL DEFAULT 0 CHECK (fee_cents >= 0),
  source_url TEXT UNIQUE NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'official',
  verified_at TIMESTAMPTZ NOT NULL,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  application_url TEXT,
  application_adapter TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grants_status_deadline ON grant_opportunities (status, deadline);
CREATE INDEX IF NOT EXISTS idx_grants_category ON grant_opportunities (category);
CREATE INDEX IF NOT EXISTS idx_grants_verified ON grant_opportunities (verified_at DESC);

CREATE TABLE IF NOT EXISTS grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grant_opportunities(id) ON DELETE RESTRICT,
  cycle_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'matched'
    CHECK (status IN ('matched', 'blocked', 'drafting', 'draft_ready', 'needs_info', 'approved', 'submitting', 'submitted', 'failed', 'withdrawn')),
  eligibility_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (eligibility_status IN ('pending', 'eligible', 'ineligible', 'needs_review')),
  match_score INT CHECK (match_score BETWEEN 0 AND 100),
  match_reasons TEXT[] NOT NULL DEFAULT '{}',
  blockers TEXT[] NOT NULL DEFAULT '{}',
  draft_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  missing_fields TEXT[] NOT NULL DEFAULT '{}',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  obligations JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  confirmation_code TEXT,
  confirmation_url TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, grant_id, cycle_key)
);

CREATE INDEX IF NOT EXISTS idx_grant_apps_user_status ON grant_applications (user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_grant_apps_deadline ON grant_applications (grant_id, status);

CREATE TABLE IF NOT EXISTS grant_submission_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL REFERENCES grant_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  adapter TEXT,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'human_gate', 'submitted', 'failed', 'cancelled')),
  attempt_count INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  browser_receipt JSONB,
  human_gate JSONB,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_jobs_queue ON grant_submission_jobs (status, next_attempt_at);

CREATE TABLE IF NOT EXISTS grant_application_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES grant_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (actor IN ('user', 'system', 'browser_worker', 'admin')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grant_events_application ON grant_application_events (application_id, created_at DESC);

ALTER TABLE grant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_submission_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_application_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grant_profiles_self ON grant_profiles;
CREATE POLICY grant_profiles_self ON grant_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS grant_opportunities_public_read ON grant_opportunities;
CREATE POLICY grant_opportunities_public_read ON grant_opportunities FOR SELECT USING (status IN ('open', 'rolling', 'upcoming'));

DROP POLICY IF EXISTS grant_applications_self ON grant_applications;
CREATE POLICY grant_applications_self ON grant_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS grant_submission_jobs_self_read ON grant_submission_jobs;
CREATE POLICY grant_submission_jobs_self_read ON grant_submission_jobs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS grant_events_self_read ON grant_application_events;
CREATE POLICY grant_events_self_read ON grant_application_events FOR SELECT USING (auth.uid() = user_id);

INSERT INTO grant_opportunities (
  slug, name, funder, amount_min_cents, amount_max_cents, amount_label, deadline, deadline_label,
  cycle_key, status, category, summary, eligibility_text, eligibility_rules, effort, fee_cents,
  source_url, verified_at, application_url
) VALUES
  (
    'tdf-aapi-circle-2026', 'Colorado AAPI Circle Fund', 'The Denver Foundation', 100000, 400000, '$1,000–$4,000', '2026-08-17', 'Aug 17, 2026',
    '2026', 'open', 'community', 'Small, community-led grants for Colorado organizations serving AANHPI communities.',
    'Colorado nonprofits or fiscally sponsored projects serving AANHPI communities.',
    '{"states":["Colorado"],"entity_types":["nonprofit","community_project"],"fiscal_sponsor_allowed":true,"service_focus":["AANHPI"]}'::jsonb,
    'moderate', 0, 'https://denverfoundation.org/funding-opportunity/asian-american-and-pacific-islander-circle-fund/', '2026-08-10T00:00:00Z',
    'https://denverfoundation.org/funding-opportunity/asian-american-and-pacific-islander-circle-fund/'
  ),
  (
    'tdf-strengthening-neighborhoods-2026', 'Strengthening Neighborhoods', 'The Denver Foundation', 50000, 500000, '$500–$5,000', '2026-10-19', 'Oct 19, 2026',
    '2026', 'open', 'community', 'Grassroots funding for resident-led projects in housing, human services, and economic opportunity across Metro Denver.',
    'Metro Denver neighborhood groups, resident associations, nonprofits, and fiscally sponsored projects.',
    '{"states":["Colorado"],"cities":["Denver","Aurora","Lakewood","Englewood","Littleton","Arvada","Westminster"],"entity_types":["nonprofit","community_project"],"fiscal_sponsor_allowed":true}'::jsonb,
    'light', 0, 'https://denverfoundation.org/funding-opportunity/strengthening-neighborhoods/', '2026-08-10T00:00:00Z',
    'https://denverfoundation.org/funding-opportunity/strengthening-neighborhoods/'
  ),
  (
    'tdf-capacity-building-2026', 'Capacity Building Fund', 'The Denver Foundation', 50000, 600000, '$500–$6,000', '2026-11-02', 'Nov 2, 2026',
    '2026', 'open', 'nonprofit', 'Funding for staff skills, board development, systems, and grant-readiness at Metro Denver nonprofits.',
    'Metro Denver nonprofits with 501(c)(3) status or a fiscal sponsor.',
    '{"states":["Colorado"],"entity_types":["nonprofit"],"fiscal_sponsor_allowed":true}'::jsonb,
    'light', 0, 'https://denverfoundation.org/funding-opportunities/', '2026-08-10T00:00:00Z',
    'https://denverfoundation.org/funding-opportunities/'
  ),
  (
    'tdf-civic-fabric-2026', 'Civic Fabric Fund', 'The Denver Foundation', 1500000, 3000000, '$15,000–$30,000', '2026-09-15', 'Sep 15, 2026',
    '2026', 'open', 'advocacy', 'Larger awards for Colorado organizations improving state and local policy through advocacy, research, and community engagement.',
    'Colorado nonprofits working on state or local policy, advocacy, research, or coalition building.',
    '{"states":["Colorado"],"entity_types":["nonprofit"],"program_focus":["policy","advocacy","research","coalition"]}'::jsonb,
    'heavy', 0, 'https://denverfoundation.org/funding-opportunity/civic-fabric-fund-state-local-policy/', '2026-08-10T00:00:00Z',
    'https://denverfoundation.org/funding-opportunity/civic-fabric-fund-state-local-policy/'
  ),
  (
    'rcf-newcomers-2026', 'Newcomers Fund', 'Rose Community Foundation', NULL, NULL, 'Amount varies', NULL, 'Rolling inquiries',
    '2026', 'rolling', 'immigrant_services', 'Funding for nonprofits meeting immigrants’ housing, health, mental-health, and basic-needs priorities in Greater Denver.',
    'Greater Denver nonprofits serving immigrants, including housing and basic needs.',
    '{"states":["Colorado"],"entity_types":["nonprofit"],"service_focus":["immigrants","housing","basic_needs"]}'::jsonb,
    'moderate', 0, 'https://rcfdenver.org/nonprofit-opportunities/funding-opportunities/', '2026-08-10T00:00:00Z',
    'https://rcfdenver.org/nonprofit-opportunities/funding-opportunities/'
  ),
  (
    'lenovo-evolve-small-2026', 'Evolve Small AI Grant', 'Lenovo', 2500000, 2500000, '$25,000 + technology', NULL, 'Rolling 2026 cycle',
    '2026', 'rolling', 'small_business', 'A cash award plus technology package for small businesses using AI to grow or improve operations.',
    'U.S. small businesses with fewer than 100 employees; Microsoft 365 account required.',
    '{"states":["all_us"],"entity_types":["small_business"],"max_employees":99,"requirements":["microsoft_365"]}'::jsonb,
    'moderate', 0, 'https://www.lenovo.com/us/en/evolvesmall', '2026-08-10T00:00:00Z',
    'https://www.lenovo.com/us/en/evolvesmall'
  ),
  (
    'breva-thrive-q4-2026', 'Thrive Grant', 'Breva', 500000, 500000, '$5,000', '2026-10-31', 'Oct 1–31, 2026',
    '2026-q4', 'upcoming', 'small_business', 'Quarterly unrestricted grant for small businesses creating measurable community impact.',
    'Small businesses with community impact; high-need or LMI areas preferred.',
    '{"states":["all_us"],"entity_types":["small_business"],"preference":["community_impact","LMI"]}'::jsonb,
    'light', 0, 'https://breva.ai/thrive-grant', '2026-08-10T00:00:00Z',
    'https://breva.ai/thrive-grant'
  ),
  (
    'freed-fellowship-monthly-2026', 'Freed Fellowship Grant', 'Freed Fellowship', 50000, 50000, '$500 monthly', NULL, 'Monthly',
    '2026-monthly', 'rolling', 'entrepreneur', 'A recurring microgrant and fellowship for under-resourced entrepreneurs building early-stage businesses.',
    'Under-resourced entrepreneurs; open to all genders.',
    '{"states":["all_us"],"entity_types":["small_business","individual"],"stage":["early_stage"]}'::jsonb,
    'light', 0, 'https://freedfellowship.com/grant', '2026-08-10T00:00:00Z',
    'https://freedfellowship.com/grant'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  funder = EXCLUDED.funder,
  amount_min_cents = EXCLUDED.amount_min_cents,
  amount_max_cents = EXCLUDED.amount_max_cents,
  amount_label = EXCLUDED.amount_label,
  deadline = EXCLUDED.deadline,
  deadline_label = EXCLUDED.deadline_label,
  cycle_key = EXCLUDED.cycle_key,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  summary = EXCLUDED.summary,
  eligibility_text = EXCLUDED.eligibility_text,
  eligibility_rules = EXCLUDED.eligibility_rules,
  effort = EXCLUDED.effort,
  fee_cents = EXCLUDED.fee_cents,
  source_url = EXCLUDED.source_url,
  verified_at = EXCLUDED.verified_at,
  application_url = EXCLUDED.application_url,
  updated_at = now();
