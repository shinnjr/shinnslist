import { serviceClient, userIdFromRequest } from '../../_lib/supabase';
import { json, type PagesContext } from '../../_lib/http';
import { scoreGrant } from '../../_lib/grants';

// Shinnslist is a U.S.-focused product: foreign-government and non-U.S. programs
// are never relevant and are dropped for every viewer (fixes "UK funds / international
// biennales / Iran peace grants" noise an individual in Colorado was seeing).
function isForeignGrant(grant: Record<string, unknown>): boolean {
  const rules = (grant.eligibility_rules || {}) as Record<string, unknown>;
  const geography = String(rules.geography || '');
  const sourceType = String(rules.source_type || '');
  const countries = Array.isArray(rules.countries) ? rules.countries.map(String) : [];
  return (
    geography === 'foreign' ||
    sourceType === 'foreign_gov' ||
    (countries.length > 0 && !countries.some((c) => /united states|usa|u\.s\.|america/i.test(c)))
  );
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const { request, env } = context;
  const sb = serviceClient(env);

  const COLUMNS =
    'id,slug,name,funder,amount_label,deadline,deadline_label,cycle_key,status,category,summary,eligibility_text,eligibility_rules,effort,fee_cents,source_url,verified_at,application_url';
  const PAGE = 1000;
  let grants: Record<string, unknown>[] = [];
  for (let offset = 0; offset < 10000; offset += PAGE) {
    const { data, error } = await sb
      .from('grant_opportunities')
      .select(COLUMNS)
      .in('status', ['open', 'rolling', 'upcoming'])
      .order('deadline', { ascending: true, nullsFirst: false })
      .order('slug')
      .range(offset, offset + PAGE - 1);
    if (error) return json({ error: error.message }, 500);
    if (!data || data.length === 0) break;
    grants = grants.concat(data);
    if (data.length < PAGE) break;
  }

  // Drop non-U.S. programs for everyone — the product only serves U.S. applicants.
  grants = grants.filter((grant) => !isForeignGrant(grant));

  const user = await userIdFromRequest(request, env);
  if (!user?.id) return json({ grants, personalized: false });

  const { data: profile } = await sb.from('grant_profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (!profile) return json({ grants, personalized: false });

  // Personalized: score, drop hard-ineligible matches, and surface best fits first.
  const scored = grants
    .map((grant) => ({ ...grant, match: scoreGrant(profile, grant) }))
    .filter((grant) => (grant.match as { status?: string }).status !== 'ineligible')
    .sort(
      (a, b) =>
        ((b.match as { score?: number }).score ?? 0) - ((a.match as { score?: number }).score ?? 0),
    );

  const top = scored.slice(0, 40);
  return json({ personalized: true, grants: top, total_eligible: scored.length });
}
