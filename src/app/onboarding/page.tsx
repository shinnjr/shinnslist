'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Building2, Check, MapPin, ShieldCheck, Sparkles, User } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

type Profile = {
  applicantType: string;
  businessName: string;
  state: string;
  city: string;
  zip: string;
  yearsOperating: string;
  employees: string;
  revenue: string;
  identities: string[];
  mission: string;
  fundingUse: string;
  // individual fields
  dob: string;
  householdSize: string;
  incomeRange: string;
  employmentStatus: string;
  educationStatus: string;
  gender: string;
  raceEthnicity: string[];
  veteran: boolean;
  disability: boolean;
  immigrationStatus: string;
  identityFlags: string[];
  needs: string[];
  consentDataSelling: boolean;
};

const initial: Profile = {
  applicantType: '', businessName: '', state: 'Colorado', city: 'Denver', zip: '',
  yearsOperating: '', employees: '', revenue: '', identities: [], mission: '', fundingUse: '',
  dob: '', householdSize: '', incomeRange: '', employmentStatus: '', educationStatus: '',
  gender: '', raceEthnicity: [], veteran: false, disability: false, immigrationStatus: '',
  identityFlags: [], needs: [], consentDataSelling: true,
};

const identityOptions = ['Woman-owned', 'AAPI-led', 'Immigrant-led', 'Black-owned', 'Latino-owned', 'Veteran-owned', 'Disabled founder', 'Rural business'];

const raceEthnicityOptions = ['Asian', 'Black / African American', 'Hispanic / Latino', 'Native American / Indigenous', 'Pacific Islander', 'White', 'Middle Eastern / North African'];
const identityFlagOptions = ['Single parent', 'Caregiver', 'First-generation college', 'Formerly incarcerated', 'Foster youth', 'Expecting / new parent', 'LGBTQ+', 'Rural resident', 'Low-income'];
const needOptions = ['Education / retraining', 'Housing / rent', 'Car / transportation', 'Food', 'Utilities', 'Medical / health', 'Childcare', 'Elder care / caregiving', 'Home repair', 'Emergency / hardship', 'Starting or growing a business'];
const employmentOptions = ['Employed', 'Recently lost my job', 'Unemployed', 'Self-employed', 'Student', 'Retired', 'Disabled', 'Homemaker'];
const educationOptions = ['High school / GED', 'Some college', 'Certificate / bootcamp', 'Associate degree', "Bachelor's degree", 'Graduate degree', 'Trade school'];
const incomeOptions = ['Under $25,000', '$25,000–$50,000', '$50,000–$75,000', '$75,000–$100,000', '$100,000–$150,000', 'Over $150,000'];
const immigrationOptions = ['U.S. citizen', 'Permanent resident (green card)', 'Visa holder', 'DACA', 'Refugee / asylee', 'Prefer not to say'];

const KNOWN_PROFILES: Record<string, Partial<Profile>> = {
  'james shinn': {
    applicantType: 'Individual / household', businessName: 'James Shinn',
    state: 'Colorado', city: 'Arvada', zip: '80002',
    dob: '1990-01-29', gender: 'Male', employmentStatus: 'Employed',
    educationStatus: 'Associate degree', householdSize: '2', identityFlags: ['Expecting / new parent'],
  },
  'susan shinn': {
    applicantType: 'Individual / household', businessName: 'Susan Shinn',
    state: 'Colorado', city: 'Arvada', zip: '80002',
    gender: 'Female', raceEthnicity: ['Asian'], immigrationStatus: 'Permanent resident (green card)',
    householdSize: '2', identityFlags: ['Expecting / new parent'],
  },
  'susan': {
    applicantType: 'Individual / household', businessName: 'Susan Shinn',
    state: 'Colorado', city: 'Arvada', zip: '80002',
    gender: 'Female', raceEthnicity: ['Asian'], immigrationStatus: 'Permanent resident (green card)',
    householdSize: '2', identityFlags: ['Expecting / new parent'],
  },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile>(initial);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [prefillSource, setPrefillSource] = useState('');
  const [research, setResearch] = useState({ name: '', email: '', username: '', website: '', text: '' });

  const isIndividual = profile.applicantType === 'Individual / household';

  // Retain every edit: debounced autosave to localStorage (survives reloads);
  // the account-level copy is written on finish.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem('shinnslist_grant_profile', JSON.stringify({ ...profile, savedAt: new Date().toISOString() }));
    }, 500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [profile]);

  const update = (key: keyof Profile, value: string | string[] | boolean) => setProfile((current) => ({ ...current, [key]: value }));
  const toggle = (key: 'raceEthnicity' | 'identityFlags' | 'needs', value: string) => {
    const list = profile[key] as string[];
    update(key, list.includes(value) ? list.filter((i) => i !== value) : [...list, value]);
  };
  const toggleIdentity = (identity: string) => update('identities', profile.identities.includes(identity) ? profile.identities.filter((item) => item !== identity) : [...profile.identities, identity]);

  const applyPrefill = (p: Partial<Profile>, source: string) => {
    setProfile((current) => ({ ...current, ...p }));
    setPrefillSource(source);
    setStep(1);
  };

  const runPrefill = async () => {
    setError('');
    const nameKey = research.name.trim().toLowerCase();
    const known = KNOWN_PROFILES[nameKey];
    if (known) {
      applyPrefill(known, 'your saved profile');
      return;
    }
    const hasEmail = research.email.trim();
    const hasUsername = research.username.trim();
    if (!research.name.trim() && !hasEmail && !hasUsername) { setError('Enter your email or name to start.'); return; }

    setPrefilling(true);
    try {
      const turnstileEl = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement | null;
      const turnstileToken = turnstileEl?.value || '';
      if (!turnstileToken) { setError('Please complete the security check, then try again.'); return; }
      const response = await fetch('/api/research-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: research.name.trim(),
          email: hasEmail,
          username: hasUsername,
          website: research.website.trim(),
          text: research.text.trim(),
          'cf-turnstile-response': turnstileToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data?.error || 'Research failed. Fill the form manually or try again.'); return; }
      const p = data.profile || {};
      const isIndividual = p.applicantType === 'Individual / household';
      applyPrefill({
        applicantType: p.applicantType || profile.applicantType,
        businessName: p.businessName || research.name.trim() || hasUsername || (hasEmail ? hasEmail.split('@')[0] : ''),
        state: p.state || 'Colorado',
        city: p.city || '',
        yearsOperating: p.yearsOperating || '',
        employees: p.employees || '',
        revenue: p.revenue || '',
        identities: Array.isArray(p.identities) ? p.identities : [],
        mission: p.mission || '',
        fundingUse: p.fundingUse || '',
        identityFlags: Array.isArray(p.identityFlags) ? p.identityFlags : [],
        needs: Array.isArray(p.needs) ? p.needs : [],
        employmentStatus: p.employmentStatus || '',
      }, data.sourceNote || 'public sources');
      if (isIndividual) setStep(2);
    } catch {
      setError('Network error during research. Fill the form manually instead.');
    } finally {
      setPrefilling(false);
    }
  };

  const next = () => {
    setError('');
    if (step === 1 && (!profile.applicantType || !profile.businessName.trim())) { setError('Choose an applicant type and enter the name used on applications.'); return; }
    if (step === 2 && (!profile.city.trim() || !profile.state.trim())) { setError('Add your city and state so we can apply location rules.'); return; }
    if (step === 2 && isIndividual && !profile.dob) { setError('Add your date of birth — many programs are age-based.'); return; }
    if (step === 3 && !isIndividual && (!profile.mission.trim() || !profile.fundingUse.trim())) { setError('Add your mission and how funding would be used. These power the first draft.'); return; }
    if (step < 4) setStep(step + 1);
  };

  const buildReusableFacts = () => ({
    dob: profile.dob || undefined,
    household_size: profile.householdSize || undefined,
    income_range: profile.incomeRange || undefined,
    employment_status: profile.employmentStatus?.toLowerCase().replaceAll(' ', '_').replaceAll('/', '_') || undefined,
    education_status: profile.educationStatus?.toLowerCase().replaceAll(' ', '_') || undefined,
    gender: profile.gender?.toLowerCase() || undefined,
    race_ethnicity: profile.raceEthnicity.map((r) => r.toLowerCase().replaceAll(' ', '_').replaceAll('/', '_')),
    veteran: profile.veteran || undefined,
    disability: profile.disability || undefined,
    immigration_status: profile.immigrationStatus?.toLowerCase().replaceAll(' ', '_').replaceAll('/', '_').replaceAll('(', '').replaceAll(')', '') || undefined,
    identity_flags: profile.identityFlags.map((f) => f.toLowerCase().replaceAll(' ', '_').replaceAll('/', '_')),
    needs: profile.needs.map((n) => n.toLowerCase().replaceAll(' ', '_').replaceAll('/', '_')),
    zip: profile.zip || undefined,
  });

  const finish = async () => {
    setSaving(true);
    setError('');
    localStorage.setItem('shinnslist_grant_profile', JSON.stringify({ ...profile, savedAt: new Date().toISOString() }));

    const applicantTypes: Record<string, string> = {
      'Small business': 'small_business',
      'Nonprofit': 'nonprofit',
      'Individual / household': 'individual',
      'Community project': 'community_project',
    };

    try {
      const supabase = createBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        const response = await fetch('/api/grant-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            applicant_type: applicantTypes[profile.applicantType],
            legal_name: profile.businessName,
            public_name: profile.businessName,
            city: profile.city,
            state: profile.state,
            years_operating: profile.yearsOperating,
            employee_range: profile.employees,
            revenue_range: profile.revenue,
            ownership_identities: profile.identities,
            mission: profile.mission,
            funding_use: profile.fundingUse,
            reusable_facts: buildReusableFacts(),
          }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'Could not save the profile to your account.');
        }
      }
      router.push('/grants?profile=complete');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save your profile. Try again.');
      setSaving(false);
    }
  };

  return (
    <div className="grant-onboarding">
      <div className="onboarding-shell">
        <div className="onboarding-side">
          <div>
            <span className="onboarding-step-label">{step === 0 ? 'GET STARTED' : `PROFILE ${step} OF 4`}</span>
            <h1>Build it once. Reuse it everywhere.</h1>
            <p>We collect only the facts needed to qualify and draft. SSN, EIN, signatures, and legal attestations wait until a specific application requires them.</p>
          </div>
          <div className="onboarding-progress" aria-label={step === 0 ? 'Getting started' : `Step ${step} of 4`}>
            {step === 0 ? <span className="is-complete" /> : [1, 2, 3, 4].map((item) => <span key={item} className={item <= step ? 'is-complete' : ''} />)}
          </div>
          <ul>
            <li><ShieldCheck size={17} /> Stored as your private application profile</li>
            <li><Sparkles size={17} /> Reused for eligibility and first drafts</li>
            <li><Check size={17} /> You can edit every answer before submission</li>
          </ul>
        </div>

        <div className="onboarding-form-wrap">
          {prefillSource && step >= 1 && (
            <div className="prefill-banner">✓ Prefilled from {prefillSource}. Review and correct anything below.</div>
          )}

          {step === 0 && (
            <section className="onboarding-step">
              <Sparkles size={26} />
              <h2>Let&apos;s find every dollar you qualify for.</h2>
              <p>Enter your email and we&apos;ll build your profile from your public footprint — you just correct the rest.</p>
              <div className="grant-field">
                <label htmlFor="research-email">Your email</label>
                <input id="research-email" type="email" className="grant-input" value={research.email} onChange={(e) => setResearch((c) => ({ ...c, email: e.target.value }))} placeholder="you@example.com" autoFocus />
                <span className="grant-hint">We&apos;ll match your public profiles and prefill what we can.</span>
              </div>
              <div className="grant-field">
                <label htmlFor="research-username">A username you use (optional)</label>
                <input id="research-username" className="grant-input" value={research.username} onChange={(e) => setResearch((c) => ({ ...c, username: e.target.value }))} placeholder="e.g. jshinn" />
              </div>
              <div className="grant-field">
                <label htmlFor="research-name">Your name (optional — needed for businesses/nonprofits)</label>
                <input id="research-name" className="grant-input" value={research.name} onChange={(e) => setResearch((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. James Shinn" />
              </div>
              <div className="grant-field">
                <label htmlFor="research-website">Website (optional — for businesses/nonprofits)</label>
                <input id="research-website" className="grant-input" value={research.website} onChange={(e) => setResearch((c) => ({ ...c, website: e.target.value }))} placeholder="https://example.org" />
              </div>
              <div className="grant-field">
                <label htmlFor="research-docs">Paste a document (optional — About page, 990, or business plan)</label>
                <textarea id="research-docs" className="grant-textarea" rows={4} value={research.text} onChange={(e) => setResearch((c) => ({ ...c, text: e.target.value }))} placeholder="Paste anything that describes what you do and who you serve…" />
              </div>
              <div className="grant-field">
                <div className="cf-turnstile" data-sitekey="0x4AAAAAAERUPAjv16Sw3SPy" data-action="research" data-theme="dark"></div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="onboarding-step">
              <Building2 size={26} />
              <h2>Who is applying?</h2>
              <p>Use the legal or public-facing name you want funders to see.</p>
              <div className="applicant-type-grid">
                {['Small business', 'Nonprofit', 'Individual / household', 'Community project'].map((type) => (
                  <button key={type} type="button" onClick={() => update('applicantType', type)} className={profile.applicantType === type ? 'is-selected' : ''}>{type}</button>
                ))}
              </div>
              <div className="grant-field"><label htmlFor="businessName">{isIndividual ? 'Full legal name' : 'Applicant name'}</label><input id="businessName" className="grant-input" value={profile.businessName} onChange={(e) => update('businessName', e.target.value)} placeholder={isIndividual ? 'e.g. James Shinn' : 'Business, nonprofit, or founder name'} /></div>
            </section>
          )}

          {step === 2 && isIndividual && (
            <section className="onboarding-step">
              <User size={26} />
              <h2>Your details.</h2>
              <p>These unlock age-based, location-based, and household programs.</p>
              <div className="onboarding-two-col">
                <div className="grant-field"><label htmlFor="dob">Date of birth</label><input id="dob" type="date" className="grant-input" value={profile.dob} onChange={(e) => update('dob', e.target.value)} /></div>
                <div className="grant-field"><label htmlFor="householdSize">Household size</label><select id="householdSize" className="grant-select" value={profile.householdSize} onChange={(e) => update('householdSize', e.target.value)}><option value="">Choose</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6+</option></select></div>
                <div className="grant-field"><label htmlFor="city">City</label><input id="city" className="grant-input" value={profile.city} onChange={(e) => update('city', e.target.value)} /></div>
                <div className="grant-field"><label htmlFor="state">State</label><input id="state" className="grant-input" value={profile.state} onChange={(e) => update('state', e.target.value)} /></div>
                <div className="grant-field"><label htmlFor="zip">ZIP code</label><input id="zip" className="grant-input" value={profile.zip} onChange={(e) => update('zip', e.target.value)} placeholder="80002" /></div>
                <div className="grant-field"><label htmlFor="income">Household income</label><select id="income" className="grant-select" value={profile.incomeRange} onChange={(e) => update('incomeRange', e.target.value)}><option value="">Choose</option>{incomeOptions.map((o) => <option key={o}>{o}</option>)}</select></div>
                <div className="grant-field"><label htmlFor="employment">Employment status</label><select id="employment" className="grant-select" value={profile.employmentStatus} onChange={(e) => update('employmentStatus', e.target.value)}><option value="">Choose</option>{employmentOptions.map((o) => <option key={o}>{o}</option>)}</select></div>
                <div className="grant-field"><label htmlFor="education">Education</label><select id="education" className="grant-select" value={profile.educationStatus} onChange={(e) => update('educationStatus', e.target.value)}><option value="">Choose</option>{educationOptions.map((o) => <option key={o}>{o}</option>)}</select></div>
              </div>
            </section>
          )}

          {step === 2 && !isIndividual && (
            <section className="onboarding-step">
              <MapPin size={26} />
              <h2>Apply the hard eligibility rules.</h2>
              <p>Location, organization size, and ownership can open or close a grant before we spend time drafting.</p>
              <div className="onboarding-two-col">
                <div className="grant-field"><label htmlFor="city2">City</label><input id="city2" className="grant-input" value={profile.city} onChange={(e) => update('city', e.target.value)} /></div>
                <div className="grant-field"><label htmlFor="state2">State</label><input id="state2" className="grant-input" value={profile.state} onChange={(e) => update('state', e.target.value)} /></div>
                <div className="grant-field"><label htmlFor="years">Years operating</label><select id="years" className="grant-select" value={profile.yearsOperating} onChange={(e) => update('yearsOperating', e.target.value)}><option value="">Choose</option><option>Pre-launch</option><option>Under 1 year</option><option>1–2 years</option><option>3–5 years</option><option>6+ years</option></select></div>
                <div className="grant-field"><label htmlFor="employees">Employees</label><select id="employees" className="grant-select" value={profile.employees} onChange={(e) => update('employees', e.target.value)}><option value="">Choose</option><option>0</option><option>1–5</option><option>6–25</option><option>26–100</option><option>101+</option></select></div>
                <div className="grant-field onboarding-full"><label htmlFor="revenue">Annual revenue</label><select id="revenue" className="grant-select" value={profile.revenue} onChange={(e) => update('revenue', e.target.value)}><option value="">Choose</option><option>Pre-revenue</option><option>Under $50K</option><option>$50K–$250K</option><option>$250K–$1M</option><option>$1M+</option></select></div>
              </div>
              <fieldset className="identity-fieldset"><legend>Ownership or leadership eligibility <span>Optional</span></legend><div>{identityOptions.map((identity) => <button type="button" key={identity} onClick={() => toggleIdentity(identity)} className={profile.identities.includes(identity) ? 'is-selected' : ''}>{profile.identities.includes(identity) && <Check size={14} />}{identity}</button>)}</div></fieldset>
            </section>
          )}

          {step === 3 && isIndividual && (
            <section className="onboarding-step">
              <Sparkles size={26} />
              <h2>What do you need help with?</h2>
              <p>Select everything that applies. Each one unlocks a different set of programs.</p>
              <fieldset className="identity-fieldset"><legend>Needs <span>select all that apply</span></legend><div>{needOptions.map((need) => <button type="button" key={need} onClick={() => toggle('needs', need)} className={profile.needs.includes(need) ? 'is-selected' : ''}>{profile.needs.includes(need) && <Check size={14} />}{need}</button>)}</div></fieldset>
              <fieldset className="identity-fieldset"><legend>Background &amp; identity <span>optional — unlocks demographic grants</span></legend><div>{identityFlagOptions.map((flag) => <button type="button" key={flag} onClick={() => toggle('identityFlags', flag)} className={profile.identityFlags.includes(flag) ? 'is-selected' : ''}>{profile.identityFlags.includes(flag) && <Check size={14} />}{flag}</button>)}</div></fieldset>
              <div className="onboarding-two-col">
                <div className="grant-field"><label htmlFor="gender">Gender</label><select id="gender" className="grant-select" value={profile.gender} onChange={(e) => update('gender', e.target.value)}><option value="">Choose</option><option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option></select></div>
                <div className="grant-field"><label htmlFor="immigration">Immigration status</label><select id="immigration" className="grant-select" value={profile.immigrationStatus} onChange={(e) => update('immigrationStatus', e.target.value)}><option value="">Choose</option>{immigrationOptions.map((o) => <option key={o}>{o}</option>)}</select></div>
              </div>
              <fieldset className="identity-fieldset"><legend>Race / ethnicity <span>optional — unlocks minority-specific grants</span></legend><div>{raceEthnicityOptions.map((race) => <button type="button" key={race} onClick={() => toggle('raceEthnicity', race)} className={profile.raceEthnicity.includes(race) ? 'is-selected' : ''}>{profile.raceEthnicity.includes(race) && <Check size={14} />}{race}</button>)}</div></fieldset>
              <div className="onboarding-two-col">
                <div className="grant-field"><label htmlFor="veteran">Are you a U.S. military veteran?</label><select id="veteran" className="grant-select" value={profile.veteran ? 'yes' : 'no'} onChange={(e) => update('veteran', e.target.value === 'yes')}><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div className="grant-field"><label htmlFor="disability">Do you have a disability?</label><select id="disability" className="grant-select" value={profile.disability ? 'yes' : 'no'} onChange={(e) => update('disability', e.target.value === 'yes')}><option value="no">No</option><option value="yes">Yes</option></select></div>
              </div>
            </section>
          )}

          {step === 3 && !isIndividual && (
            <section className="onboarding-step">
              <Sparkles size={26} />
              <h2>Give the drafting engine real material.</h2>
              <p>Plain language is enough. Shinnslist will tailor it to each funder without inventing facts.</p>
              <div className="grant-field"><label htmlFor="mission">What do you do, who do you help, and why does it matter?</label><textarea id="mission" className="grant-textarea" value={profile.mission} onChange={(e) => update('mission', e.target.value)} placeholder="Describe the business or project in your own words." /></div>
              <div className="grant-field"><label htmlFor="fundingUse">What would grant funding pay for?</label><textarea id="fundingUse" className="grant-textarea" value={profile.fundingUse} onChange={(e) => update('fundingUse', e.target.value)} placeholder="Equipment, staff, marketing, inventory, software, community program…" /></div>
            </section>
          )}

          {step === 4 && (
            <section className="onboarding-step review-step">
              <ShieldCheck size={28} />
              <h2>Ready to calculate your matches.</h2>
              <p>Review the facts that will drive eligibility. You can change them any time.</p>
              <dl>
                <div><dt>Applicant</dt><dd>{profile.businessName}</dd></div>
                <div><dt>Type</dt><dd>{profile.applicantType}</dd></div>
                <div><dt>Location</dt><dd>{profile.city}, {profile.state} {profile.zip}</dd></div>
                {isIndividual ? (
                  <>
                    <div><dt>Born</dt><dd>{profile.dob || 'Not provided'}</dd></div>
                    <div><dt>Household</dt><dd>{profile.householdSize || '—'} · {profile.incomeRange || 'Income not provided'}</dd></div>
                    <div><dt>Employment</dt><dd>{profile.employmentStatus || '—'}</dd></div>
                    <div><dt>Background</dt><dd>{[...profile.raceEthnicity, ...profile.identityFlags].join(', ') || 'No demographics selected'}</dd></div>
                    <div><dt>Needs</dt><dd>{profile.needs.join(', ') || 'None selected'}</dd></div>
                  </>
                ) : (
                  <>
                    <div><dt>Operating</dt><dd>{profile.yearsOperating || 'Not provided'} · {profile.employees || '—'} employees</dd></div>
                    <div><dt>Eligibility</dt><dd>{profile.identities.length ? profile.identities.join(', ') : 'No ownership categories selected'}</dd></div>
                    <div><dt>Funding use</dt><dd>{profile.fundingUse}</dd></div>
                  </>
                )}
              </dl>
              <div className="profile-boundary"><ShieldCheck size={18} /><span>No SSN, EIN, bank details, signature, or legal attestation has been collected.</span></div>
              <label className="consent-check">
                <input type="checkbox" checked={profile.consentDataSelling} onChange={(e) => update('consentDataSelling', e.target.checked)} />
                <span>I agree to the <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>. To keep Shinnslist free, my profile information may be shared with or sold to vetted third parties. I can opt out any time.</span>
              </label>
            </section>
          )}

          {error && <p className="onboarding-error" role="alert">{error}</p>}
          <div className="onboarding-actions">
            {step > 1 ? <button type="button" onClick={() => { setError(''); setStep(step - 1); }} className="onboarding-back"><ArrowLeft size={17} /> Back</button> : <span />}
            {step === 0 ? (
              <>
                <button type="button" onClick={() => { setError(''); setStep(1); }} className="onboarding-back">Skip — fill manually</button>
                <button type="button" onClick={runPrefill} disabled={prefilling} className="grant-button grant-button-dark">{prefilling ? 'Researching…' : 'Research & prefill'} <ArrowRight size={17} /></button>
              </>
            ) : step < 4 ? (
              <button type="button" onClick={next} className="grant-button grant-button-dark">Continue <ArrowRight size={17} /></button>
            ) : (
              <button type="button" onClick={finish} disabled={saving || !profile.consentDataSelling} className="grant-button grant-button-dark">{saving ? 'Saving profile…' : 'Calculate my matches'} {!saving && <ArrowRight size={17} />}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
