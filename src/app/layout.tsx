import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from '@/components/BottomNav';
import PushPrompt from '@/components/PushPrompt';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Shinnslist — Find Deals Before Anyone Else",
  description: "Real-time deal scoring across 14 verticals. Find free stuff, trading cards, sneakers, watches, cars, Legos, handbags, electronics, real estate, instruments, art, sports gear, baby gear, and rentals — beat the crowd to the best deals before they're gone.",
  openGraph: {
    title: "Shinnslist — Find Deals Before Anyone Else",
    description: "One deal score across every marketplace. 14 verticals. Instant alerts.",
    siteName: "Shinnslist",
    type: "website",
    url: "https://shinnslist.com",
    images: [{ url: "https://shinnslist.com/icon.svg", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shinnslist — Find Deals Before Anyone Else",
    description: "14 verticals. One deal score. Get alerts when underpriced items drop across marketplace platforms.",
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
        <header className="border-b border-[var(--fa-border)] bg-[var(--fa-bg)]/90 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex min-h-[48px] items-center gap-2">
              <span className="text-xl">🆓</span>
              <span className="text-lg font-bold text-white tracking-tight">
                Shinns<span className="text-[var(--fa-green)]">list</span>
              </span>
            </a>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="/" className="flex min-h-[48px] items-center hover:text-white transition-colors">Deals</a>
              <a href="/pricing" className="flex min-h-[48px] items-center hover:text-white transition-colors">Pricing</a>
              <a href="/pricing" className="flex min-h-[48px] items-center bg-[var(--fa-green)] text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-emerald-400 active:scale-[0.97] transition-all">
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
        <footer className="border-t border-[var(--fa-border)] mt-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm text-[var(--fa-muted)]">
            <div>
              <span className="font-bold text-white">Shinnslist</span>{" "}
              <span>— Free stuff alerts, faster than anyone else.</span>
            </div>
            <div className="flex gap-6">
              <a href="/how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="mailto:hello@shinnslist.com" className="hover:text-white transition-colors">Contact</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
