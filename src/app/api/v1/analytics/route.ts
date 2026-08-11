import { prisma } from '@/lib/prisma';
import { authenticateApi, withRateHeaders } from '@/lib/api-auth';
import { getPlanCapabilities } from '@/lib/entitlements';
import { getEffectivePlan } from '@/lib/plans';
import { errorResponse } from '@/lib/validation';

export async function GET(request: Request) {
  const auth = await authenticateApi(request, 'analytics:read');
  if ('error' in auth) return auth.error;
  const capabilities = getPlanCapabilities(await getEffectivePlan(auth.userId));
  if (!capabilities.canUseApiAnalytics) return withRateHeaders(errorResponse('API analytics tersedia untuk paket Business', 403), auth.rateLimit);
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [links, recentClicks] = await Promise.all([
    prisma.shortLink.findMany({ where: { userId: auth.userId }, select: { id: true, alias: true, title: true, clickCount: true }, orderBy: { clickCount: 'desc' } }),
    prisma.click.count({ where: { shortLink: { userId: auth.userId }, clickedAt: { gte: since } } }),
  ]);
  return withRateHeaders(Response.json({ data: {
    totalClicks: links.reduce((sum, link) => sum + link.clickCount, 0),
    clicksLast30Days: recentClicks,
    totalLinks: links.length,
    topLinks: links.slice(0, 10),
  } }), auth.rateLimit);
}
