import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { classActions } from '@/data/classActions';
import ClaimWizard from './ClaimWizard';

export const dynamicParams = false;

export function generateStaticParams() {
  return classActions.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = classActions.find((x) => x.slug === slug);
  if (!c) return {};
  return {
    title: `${c.name} — file your claim | Shinnslist`,
    description: `File your ${c.name} claim free before ${c.deadline}. Payout ${c.payout}. We can prepare and file it for you for a disclosed flat fee — or do it yourself free.`,
  };
}

export default async function FileClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = classActions.find((x) => x.slug === slug);
  if (!c) notFound();
  return <ClaimWizard slug={slug} />;
}
