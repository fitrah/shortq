import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/security';
import { getEffectivePlan } from '@/lib/plans';
import { errorResponse } from '@/lib/validation';

export type ApiScope = 'links:read' | 'links:write' | 'analytics:read' | 'qr:write';

export async function authenticateApi(request: Request, requiredScope: ApiScope) {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return { error: errorResponse('API key diperlukan', 401) } as const;
  const raw = authorization.slice(7).trim();
  if (!raw.startsWith('gop_') || raw.length < 30) return { error: errorResponse('API key tidak valid', 401) } as const;
  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hashApiKey(raw) },
    include: { user: { select: { id: true, isActive: true } } },
  });
  if (!key || key.revokedAt || !key.user.isActive) return { error: errorResponse('API key tidak valid atau dicabut', 401) } as const;
  if (!key.scopes.includes(requiredScope)) return { error: errorResponse(`Scope ${requiredScope} diperlukan`, 403) } as const;

  const plan = await getEffectivePlan(key.userId);
  const limit = Math.max(1, Math.min(key.rateLimit, plan.apiRateLimit));
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setSeconds(0, 0);
  const bucket = await prisma.apiRateBucket.upsert({
    where: { apiKeyId_windowStart: { apiKeyId: key.id, windowStart } },
    create: { apiKeyId: key.id, windowStart, requestCount: 1 },
    update: { requestCount: { increment: 1 } },
  });
  if (bucket.requestCount > limit) {
    const response = errorResponse('Rate limit terlampaui', 429);
    response.headers.set('Retry-After', String(60 - now.getSeconds()));
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', '0');
    return { error: response } as const;
  }
  await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: now } });
  return {
    key,
    userId: key.userId,
    rateLimit: { limit, remaining: Math.max(0, limit - bucket.requestCount), reset: Math.floor(windowStart.getTime() / 1000) + 60 },
  } as const;
}

export function withRateHeaders(response: Response, rate: { limit: number; remaining: number; reset: number }) {
  response.headers.set('X-RateLimit-Limit', String(rate.limit));
  response.headers.set('X-RateLimit-Remaining', String(rate.remaining));
  response.headers.set('X-RateLimit-Reset', String(rate.reset));
  return response;
}
