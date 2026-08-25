// Canonical grant record — mirrors the grant_opportunities table in Supabase.
export interface GrantRecord {
  slug: string;
  name: string;
  funder: string;
  amount_label: string;
  deadline: string | null;       // YYYY-MM-DD or null (rolling)
  deadline_label: string | null;
  cycle_key: string | null;
  status: 'open' | 'rolling' | 'upcoming' | 'closed';
  category: string;
  summary: string;
  eligibility_text: string;
  eligibility_rules: Record<string, unknown>;
  effort: string;
  fee_cents: number;
  source_url: string;
  application_url: string;
  verified_at: string;
}

export interface EngineEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GRANTS_GOV_API_KEY?: string;
}

export interface IngestSummary {
  connectors: Array<{ source: string; found: number; accepted: number; note?: string }>;
  totalAccepted: number;
  upserted: number;
  error?: string;
}
