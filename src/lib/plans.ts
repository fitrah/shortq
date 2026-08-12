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

const guestFallback: EffectivePlan = {
  id: null,
  name: 'Guest',
  slug: 'guest',
  price: 0,
  linkQuota: 2,
  qrQuota: 2,
  apiRateLimit: 10,
  apiKeyQuota: 0,
  features: ['2 short links per day', '2 QR codes per day', 'Basic analytics', 'PNG QR'],
};

export function getDailyQuotaWindow(now = new Date()) {
  const jakartaOffsetMs = 7 * 60 * 60 * 1000;
  const jakartaNow = new Date(now.getTime() + jakartaOffsetMs);
  const startMs = Date.UTC(jakartaNow.getUTCFullYear(), jakartaNow.getUTCMonth(), jakartaNow.getUTCDate()) - jakartaOffsetMs;
  return { start: new Date(startMs), end: new Date(startMs + 24 * 60 * 60 * 1000) };
}

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
  return (await prisma.plan.findFirst({ where: { slug: 'guest', isActive: true } })) ?? guestFallback;
}

export async function assertQuota(userId: string, resource: 'links' | 'qr' | 'apiKeys') {
  const plan = await getEffectivePlan(userId);
  const isDailyGuestQuota = plan.slug === 'guest' && (resource === 'links' || resource === 'qr');
  const window = isDailyGuestQuota ? getDailyQuotaWindow() : null;
  const count = resource === 'links'
    ? await prisma.shortLink.count({ where: { userId, ...(window ? { createdAt: { gte: window.start, lt: window.end } } : {}) } })
    : resource === 'qr'
      ? await prisma.qrCode.count({ where: { userId, ...(window ? { createdAt: { gte: window.start, lt: window.end } } : {}) } })
      : await prisma.apiKey.count({ where: { userId, revokedAt: null } });
  const limit = resource === 'links' ? plan.linkQuota : resource === 'qr' ? plan.qrQuota : plan.apiKeyQuota;
  return { allowed: count < limit, count, limit, plan, period: window ? 'daily' as const : 'total' as const, resetsAt: window?.end ?? null };
}
