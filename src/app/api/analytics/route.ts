import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { errorResponse } from '@/lib/validation';

function counts(values: Array<string | null>) {
  const map = new Map<string, number>();
  for (const value of values) map.set(value || 'Unknown', (map.get(value || 'Unknown') || 0) + 1);
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);
}

function referrerHost(value: string | null) {
  if (!value) return 'Direct';
  try { return new URL(value).hostname || 'Direct'; } catch { return 'Unknown'; }
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const url = new URL(request.url);
  const linkId = url.searchParams.get('linkId');
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1);
  const pageSize = Math.min(25, Math.max(5, Number(url.searchParams.get('pageSize') || 10) || 10));
  const linkFilter = linkId ? { id: linkId } : {};
  if (linkId && !await prisma.shortLink.findFirst({ where: { id: linkId, userId: session.userId }, select: { id: true } })) {
    return errorResponse('Link tidak ditemukan', 404);
  }
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);
  since.setUTCHours(0, 0, 0, 0);
  const where = { userId: session.userId, ...linkFilter };
  const [clicks, linksForSummary, linkOptions, topLinks, topLinksTotal] = await Promise.all([
    prisma.click.findMany({
      where: { shortLink: where, clickedAt: { gte: since } },
      select: { clickedAt: true, referrer: true, browser: true, device: true, country: true },
      orderBy: { clickedAt: 'asc' },
    }),
    prisma.shortLink.findMany({
      where,
      select: { id: true, clickCount: true },
    }),
    prisma.shortLink.findMany({
      where: { userId: session.userId },
      select: { id: true, alias: true, title: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shortLink.findMany({
      where,
      select: { id: true, alias: true, title: true, clickCount: true },
      orderBy: { clickCount: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.shortLink.count({ where }),
  ]);
  const timeline = new Map<string, number>();
  for (let day = 0; day < 30; day++) {
    const date = new Date(since); date.setUTCDate(since.getUTCDate() + day);
    timeline.set(date.toISOString().slice(0, 10), 0);
  }
  for (const click of clicks) {
    const day = click.clickedAt.toISOString().slice(0, 10);
    timeline.set(day, (timeline.get(day) || 0) + 1);
  }
  return Response.json({
    summary: { totalClicks: linksForSummary.reduce((sum, link) => sum + link.clickCount, 0), last30Days: clicks.length, totalLinks: linksForSummary.length },
    timeline: [...timeline].map(([date, value]) => ({ date, value })),
    referrers: counts(clicks.map((click) => referrerHost(click.referrer))),
    browsers: counts(clicks.map((click) => click.browser)),
    devices: counts(clicks.map((click) => click.device)),
    countries: counts(clicks.map((click) => click.country)),
    linkOptions,
    pagination: { page, pageSize, total: topLinksTotal, totalPages: Math.max(1, Math.ceil(topLinksTotal / pageSize)) },
    topLinks,
  });
}
