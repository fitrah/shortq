import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlanCapabilities } from '@/lib/entitlements';
import { getEffectivePlan } from '@/lib/plans';
import DashboardClient from './ui';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) return null;
  const [links, plan] = await Promise.all([
    prisma.shortLink.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }),
    getEffectivePlan(session.userId),
  ]);
  return <DashboardClient initialLinks={links.map(({ passwordHash, ...link }) => ({
    ...link,
    createdAt: link.createdAt.toISOString(), updatedAt: link.updatedAt.toISOString(),
    expiresAt: link.expiresAt?.toISOString() || null, hasPassword: Boolean(passwordHash),
  }))} capabilities={getPlanCapabilities(plan)} />;
}
