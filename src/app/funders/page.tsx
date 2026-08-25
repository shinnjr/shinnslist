import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, EyeOff, MapPin, Phone } from 'lucide-react';
import fundersData from '@/data/off-market-funders.json';

export const metadata: Metadata = {
  title: 'Off-Market Grant Funders — Foundations No Aggregator Has | Shinnslist',
  description:
    '6,000+ private foundations that fund farms, veterans, childcare, and 25 other causes — many with no website and no public RFP. Verified from IRS 990-PF filings. Names, phone numbers, and real grant history.',
};

const LABELS: Record<string, string> = {
  farms_ranchers: 'Farms & Ranchers',
  hunger: 'Hunger & Food Access',
  homeless: 'Homelessness & Shelter',
  homebuyers_downpayment: 'Homebuyers & Down-Payment',
  homeowners_energy: 'Home Energy & Weatherization',
  lowincome_energy: 'Low-Income Energy Aid',
  childcare: 'Childcare Providers',
  fire_departments: 'Fire & Emergency Services',
  veterans: 'Veterans',
  teachers: 'Teachers & Schools',
  seniors: 'Seniors',
  disability: 'Disability',
  mental_health: 'Mental Health',
  substance_abuse: 'Substance-Abuse Recovery',
  domestic_violence: 'Domestic-Violence Services',
  immigrants_refugees: 'Immigrants & Refugees',
  returning_citizens: 'Reentry / Returning Citizens',
  artists: 'Artists & Arts',
  historic_homeowners: 'Historic Preservation',
  disaster_recovery: 'Disaster Recovery',
  tribes: 'Tribal / Native',
  lgbtq: 'LGBTQ+',
  women_business: 'Women-Owned Business',
  minority_business: 'Minority-Owned Business',
  workforce: 'Workforce & Job Training',
  environment: 'Environment & Conservation',
  animal: 'Animal Welfare',
  youth: 'Youth',
};

type Funder = {
  ein: string;
  name: string;
  state: string;
  city: string;
  phone: string;
  website: string;
  off_market: boolean;
  n_grants: number;
  given_to_vertical: number;
  total_grants_paid: number;
};

const data = fundersData as Record<string, Funder[]>;

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function FundersPage() {
  const verticals = Object.keys(data).filter((v) => data[v]?.length > 0);
  const totalOffMarket = verticals.reduce(
    (sum, v) => sum + data[v].filter((f) => f.off_market).length,
    0,
  );
  const totalFunders = verticals.reduce((sum, v) => sum + data[v].length, 0);

  return (
    <div className="grant-page">
      <div className="grant-shell">
        <div className="grant-page-head">
          <div>
            <h1>Off-market grant funders</h1>
            <p>
              {totalFunders.toLocaleString()} private foundations that actually fund your cause — extracted from IRS
              990-PF filings. <strong>{totalOffMarket.toLocaleString()}</strong> have no website and no public RFP,
              so they never show up in any grant search. We list them anyway, with the phone number from their tax
              filing.
            </p>
          </div>
          <Link href="/grants" className="grant-button grant-button-dark">
            Find grants I qualify for <ArrowRight size={17} />
          </Link>
        </div>

        <nav className="grant-filter-bar" aria-label="Vertical index">
          {verticals.map((v) => (
            <a key={v} href={`#${v}`} className="grant-chip">
              {LABELS[v] ?? v}
            </a>
          ))}
        </nav>

        {verticals.map((v) => {
          const funders = data[v];
          const offMarket = funders.filter((f) => f.off_market);
          return (
            <section key={v} id={v} className="funder-section">
              <div className="funder-section-head">
                <h2>{LABELS[v] ?? v}</h2>
                <span>
                  {funders.length} funders · {offMarket.length} off-market · top{' '}
                  {fmtMoney(funders[0]?.given_to_vertical ?? 0)} given
                </span>
              </div>
              <div className="funder-list">
                {funders.slice(0, 12).map((f) => (
                  <div className={`funder-row${f.off_market ? ' funder-row-offmarket' : ''}`} key={f.ein}>
                    <div className="funder-name">
                      <strong>{f.name}</strong>
                      {f.off_market && (
                        <span className="funder-offmarket-badge">
                          <EyeOff size={13} /> off-market
                        </span>
                      )}
                      <p>
                        <MapPin size={13} /> {f.city ? `${f.city}, ` : ''}
                        {f.state} · {f.n_grants} grants · gave {fmtMoney(f.given_to_vertical)} to this cause
                      </p>
                    </div>
                    <div className="funder-contact">
                      {f.phone && (
                        <a href={`tel:${f.phone}`}>
                          <Phone size={14} /> {f.phone}
                        </a>
                      )}
                      {f.website && (
                        <a href={f.website} target="_blank" rel="noreferrer">
                          site
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
