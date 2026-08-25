'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileCheck2, Search, SlidersHorizontal, UserRound } from 'lucide-react';

const links = [
  { href: '/grants', label: 'Matches', icon: Search },
  { href: '/applications', label: 'Applications', icon: FileCheck2 },
  { href: '/onboarding', label: 'Profile', icon: UserRound },
  { href: '/pricing', label: 'Pricing', icon: SlidersHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary mobile navigation" className="grant-bottom-nav md:hidden">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : ''}>
            <Icon aria-hidden="true" size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
