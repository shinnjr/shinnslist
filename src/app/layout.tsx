import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import Link from 'next/link';
import { FileCheck2 } from 'lucide-react';
import './globals.css';
import BottomNav from '@/components/BottomNav';

const archivo = Archivo({ subsets: ['latin'], variable: '--font-archivo' });

export const metadata: Metadata = {
  title: 'Shinnslist — Grants found, drafted, and ready to submit',
  description: 'Shinnslist verifies grants, checks your eligibility, drafts the application, and puts the finished submission in front of you for approval.',
  alternates: { canonical: 'https://shinnslist.com' },
  openGraph: {
    title: 'Shinnslist — Stop searching. Start submitting.',
    description: 'Verified grant matches become complete application previews, ready for your approval.',
    siteName: 'Shinnslist',
    type: 'website',
    url: 'https://shinnslist.com',
    images: [{ url: 'https://shinnslist.com/og.png', width: 1200, height: 630, alt: 'Shinnslist — Stop searching. Start submitting.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shinnslist — Your grant application queue',
    description: 'Discover, qualify, draft, approve, and submit grants without rebuilding every application from scratch.',
    images: ['https://shinnslist.com/og.png'],
  },
};

const directionContract = `
<!--
THESIS: Grant applications move like controlled flight strips from verified opportunity to approved submission; refuse the generic SaaS hero-and-card grid.
OWN-WORLD: Deep navy control bay, warm paper strips, cobalt routing marks, and green readiness stamps; square working surfaces with rounded controls only.
STORY: The visitor sees real grants already moving through qualification and drafting, trusts the safety gates, and starts a reusable applicant profile.
FIRST VIEWPORT: A direct promise and CTA occupy the left; a full-height live application strip bay owns the right and demonstrates match, draft, approval, and deadline state.
FORM: Air-traffic-control flight-strip bay, assigned grounded direction 3; seed a1bc9303.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->
`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://shinnslist.com/#org',
      name: 'Shinnslist',
      url: 'https://shinnslist.com',
      logo: 'https://shinnslist.com/icon.svg',
      description: 'Verified grant discovery and application drafting for small businesses, nonprofits, and founders.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://shinnslist.com/#website',
      url: 'https://shinnslist.com',
      name: 'Shinnslist',
      publisher: { '@id': 'https://shinnslist.com/#org' },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} grant-body`}>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <span aria-hidden="true" className="hidden" dangerouslySetInnerHTML={{ __html: directionContract }} />
        <a href="#main-content" className="grant-skip">Skip to content</a>

        <header className="grant-header">
          <div className="grant-shell grant-header-inner">
            <Link href="/" className="grant-brand" aria-label="Shinnslist home">
              <span className="grant-brand-mark"><FileCheck2 size={18} strokeWidth={2.5} /></span>
              <span>Shinnslist</span>
            </Link>
            <nav aria-label="Primary navigation" className="grant-desktop-nav">
              <Link href="/free-money">Free money</Link>
              <Link href="/re">Property data</Link>
            </nav>
            <div className="grant-header-actions">
              <Link href="/login" className="grant-login-link">Log in</Link>
              <Link href="/onboarding" className="grant-button grant-button-small">Build my profile</Link>
            </div>
          </div>
        </header>

        <main id="main-content" className="grant-main">{children}</main>

        <footer className="grant-footer">
          <div className="grant-shell grant-footer-inner">
            <div>
              <div className="grant-brand grant-brand-footer"><span className="grant-brand-mark"><FileCheck2 size={16} /></span><span>Shinnslist</span></div>
              <p>Verified grants become applications, not bookmarks.</p>
            </div>
            <div className="grant-footer-links">
              <Link href="/free-money">Free money</Link>
              <Link href="/re">Property data</Link>
              <Link href="/learn">Learn</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <a href="mailto:hello@shinnslist.com">Contact</a>
            </div>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
