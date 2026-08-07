import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from '@/components/BottomNav';
import PushPrompt from '@/components/PushPrompt';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Shinnslist — Find Deals Before Anyone Else",
  description: "Real-time deal scoring across 10 marketplaces. Free stuff, trading cards, sneakers, watches, cars, Legos, handbags, electronics, real estate, and rentals.",
  openGraph: {
    title: "Shinnslist — Find Deals Before Anyone Else",
    description: "One deal score across every marketplace. 10 verticals. Instant alerts.",
    siteName: "Shinnslist",
    type: "website",
    url: "https://shinnslist.com",
    images: [{ url: "https://shinnslist.com/icon.svg", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shinnslist — Find Deals Before Anyone Else",
    description: "10 marketplaces. One deal score. Get alerts when underpriced items drop.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="security-txt" href="/.well-known/security.txt" />
        <meta name="theme-color" content="#FF1493" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-[var(--shinnslist-bg)] text-[var(--shinnslist-muted)] min-h-screen flex flex-col`}>
        {/* Header */}
        <header className="border-b border-[var(--shinnslist-border)] bg-[var(--shinnslist-surface)]/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex min-h-[48px] items-center gap-2">
              <span className="text-xl">🆓</span>
              <span className="text-lg font-bold text-white tracking-tight">
                Shinns<span className="text-[var(--shinnslist-pink)]">list</span>
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="/" className="flex min-h-[48px] items-center hover:text-white transition-colors">Deals</a>
              <a href="/pricing" className="flex min-h-[48px] items-center hover:text-white transition-colors">Pricing</a>
              <a href="/pricing" className="flex min-h-[48px] items-center bg-[var(--shinnslist-pink)] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-fuchsia-600 active:scale-[0.97] transition-all">
                Go Pro → $5/week
              </a>
            </nav>
          </div>
        </header>

        {children}

        {/* Mobile bottom nav */}
        <BottomNav />

        {/* Push notification prompt */}
        <PushPrompt />

        {/* Footer */}
        <footer className="border-t border-[var(--shinnslist-border)] mt-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-[var(--shinnslist-muted)]">
            <div>
              <span className="font-bold text-white">Shinnslist</span>{" "}
              <span>— One deal score. Every marketplace.</span>
            </div>
            <div className="flex gap-6">
              <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="mailto:hello@shinnslist.com" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
