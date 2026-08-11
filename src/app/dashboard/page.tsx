import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './ui';

export default async function Dashboard() {
  const session = await getSession();
  if (!session) return null;
  const links = await prisma.shortLink.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } });
  return <DashboardClient initialLinks={links.map(({ passwordHash, ...link }) => ({
    ...link,
    createdAt: link.createdAt.toISOString(), updatedAt: link.updatedAt.toISOString(),
    expiresAt: link.expiresAt?.toISOString() || null, hasPassword: Boolean(passwordHash),
  }))} />;
}
