-- 005_leads_and_trust.sql
-- WS1 lead capture (email list = compounding asset) + WS3 trust/reputation data (the
-- agent-toll-bridge moat seed). Both are additive and reversible.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'free-money',
  status text not null default 'new',
  created_at timestamptz not null default now(),
  constraint leads_email_unique unique (email)
);

create table if not exists public.trust_events (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null,          -- 'lead' | 'user' | 'agent' | 'service'
  actor_id text,                     -- email / user id / agent id
  event_type text not null,          -- 'lead_created' | 'claim_filed' | 'outcome_verified' | ...
  outcome text,                      -- 'new' | 'pending' | 'verified' | 'failed'
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists trust_events_actor_idx on public.trust_events (actor_type, actor_id);
create index if not exists trust_events_type_idx on public.trust_events (event_type, created_at desc);
