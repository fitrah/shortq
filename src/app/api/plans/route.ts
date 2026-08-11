import { prisma } from '@/lib/prisma';

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, description: true, price: true, currency: true, durationDays: true, linkQuota: true, qrQuota: true, apiRateLimit: true, apiKeyQuota: true, features: true },
    orderBy: { price: 'asc' },
  });
  return Response.json(plans);
}
