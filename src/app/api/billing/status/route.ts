import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getEffectivePlan } from '@/lib/plans';
import { getPlanCapabilities } from '@/lib/entitlements';
import { errorResponse } from '@/lib/validation';

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const [plan, subscription, orders, usage] = await Promise.all([
    getEffectivePlan(session.userId),
    prisma.subscription.findFirst({ where: { userId: session.userId, status: 'ACTIVE' }, include: { plan: true }, orderBy: { endsAt: 'desc' } }),
    prisma.order.findMany({ where: { userId: session.userId }, include: { plan: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 }),
    Promise.all([
      prisma.shortLink.count({ where: { userId: session.userId } }),
      prisma.qrCode.count({ where: { userId: session.userId } }),
      prisma.apiKey.count({ where: { userId: session.userId, revokedAt: null } }),
    ]),
  ]);
  return Response.json({ plan, capabilities: getPlanCapabilities(plan), subscription, orders, usage: { links: usage[0], qr: usage[1], apiKeys: usage[2] } });
}
