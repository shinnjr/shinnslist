import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, ClipboardCheck, Crown, FileCheck2, ShieldCheck } from 'lucide-react';
import { DFY } from '@/lib/dfy';

export const metadata: Metadata = {
  title: 'Pricing | Shinnslist',
  description: 'Shinnslist pricing: free membership, done-for-you filing bundle, and a $19/mo membership that cuts 75% off every done-for-you filing.',
};

export default function PricingPage() {
  return (
    <div className="grant-page learn-page">
      <div className="grant-shell">
        <div className="learn-hero">
          <h1>Free to use. Pay only if you want us to do the paperwork.</h1>
          <p>Every grant and class-action claim on Shinnslist is free to find, preview, and file yourself. Our done-for-you service prepares and files it for you for a disclosed flat fee based on the estimated work.</p>
        </div>

        <div className="learn-prose" style={{ marginTop: 32 }}>
          <div className="learn-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            <div className="learn-card">
              <FileCheck2 size={24} color="#087a55" />
              <h2>Free — everything on the site</h2>
              <p>Browse every verified grant and open settlement. File any claim yourself for free from the official site. Always.</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
                <li><Check size={14} color="#087a55" /> Verified programs &amp; settlements</li>
                <li><Check size={14} color="#087a55" /> Application previews &amp; prefill</li>
                <li><Check size={14} color="#087a55" /> Step-by-step claim wizard</li>
              </ul>
            </div>
            <div className="learn-card">
              <ClipboardCheck size={24} color="#087a55" />
              <h2>Done-for-you filing</h2>
              <p>We prepare and file it for you. Price is a rolling rate on the estimated minutes of work, and the rate slides with the value of what you're applying for — quoted up front on every item.</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
                <li><Check size={14} color="#087a55" /> Class-action claims: $1–$2.50/min by payout size ({`$${DFY.floorCents / 100}–$${DFY.capClassActionCents / 100}`})</li>
                <li><Check size={14} color="#087a55" /> Grant applications: $1.50–$4/min by award size (${DFY.capGrantCents / 100} max)</li>
                <li><Check size={14} color="#087a55" /> First cart ever: ${DFY.firstBundleCents / 100} flat — everything in it</li>
                <li><Check size={14} color="#087a55" /> Never a cut of your payout</li>
              </ul>
            </div>
            <div className="learn-card">
              <Crown size={24} color="#087a55" />
              <h2>Member — ${DFY.memberMonthlyCents / 100}/mo</h2>
              <p>First month free. Cancel anytime. Membership buys 75% off the listed done-for-you price on every future filing.</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
                <li><Check size={14} color="#087a55" /> 75% off all done-for-you prices</li>
                <li><Check size={14} color="#087a55" /> First month included with your first bundle</li>
                <li><Check size={14} color="#087a55" /> One-click cancel from any receipt</li>
              </ul>
            </div>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: '#55665c', display: 'flex', gap: 8, alignItems: 'center' }}>
            <ShieldCheck size={16} /> Shinnslist is not a law firm. We take no percentage of any settlement or award, every claim stays yours, and you can always do the same filing yourself for free.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <Link href="/free-money/class-actions" className="grant-button grant-button-primary">Browse class actions</Link>
            <Link href="/grants" className="grant-button grant-button-dark">Browse grants</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
