import { prisma } from '@/lib/prisma';

export type EffectivePlan = {
  id: string | null;
  name: string;
  slug: string;
  price: number;
  linkQuota: number;
  qrQuota: number;
  apiRateLimit: number;
  apiKeyQuota: number;
  features: unknown;
};

const freeFallback: EffectivePlan = {
  id: null,
  name: 'Free',
  slug: 'free',
  price: 0,
  linkQuota: 25,
  qrQuota: 10,
  apiRateLimit: 30,
  apiKeyQuota: 2,
  features: ['25 short links', '10 QR codes', 'Basic analytics'],
};

export async function getEffectivePlan(userId: string): Promise<EffectivePlan> {
  const now = new Date();
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      plan: { isActive: true },
    },
    include: { plan: true },
    orderBy: { endsAt: 'desc' },
  });
  if (subscription) return subscription.plan;
  return (await prisma.plan.findFirst({ where: { slug: 'free', isActive: true } })) ?? freeFallback;
}

export async function assertQuota(userId: string, resource: 'links' | 'qr' | 'apiKeys') {
  const plan = await getEffectivePlan(userId);
  const count = resource === 'links'
    ? await prisma.shortLink.count({ where: { userId } })
    : resource === 'qr'
      ? await prisma.qrCode.count({ where: { userId } })
      : await prisma.apiKey.count({ where: { userId, revokedAt: null } });
  const limit = resource === 'links' ? plan.linkQuota : resource === 'qr' ? plan.qrQuota : plan.apiKeyQuota;
  return { allowed: count < limit, count, limit, plan };
}
