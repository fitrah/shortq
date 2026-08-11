import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { assertQuota } from '@/lib/plans';
import { createOpaqueToken, hashApiKey } from '@/lib/security';
import { apiKeySchema, errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const keys = await prisma.apiKey.findMany({
    where: { userId: session.userId },
    select: { id: true, name: true, keyPrefix: true, scopes: true, rateLimit: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(keys);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const parsed = apiKeySchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data API key tidak valid', 400, zodError(parsed.error));
  const quota = await assertQuota(session.userId, 'apiKeys');
  if (!quota.allowed) return errorResponse(`Kuota ${quota.limit} API key aktif paket ${quota.plan.name} telah tercapai`, 403);
  const rawKey = `gop_${createOpaqueToken(32)}`;
  const rateLimit = Math.min(parsed.data.rateLimit ?? quota.plan.apiRateLimit, quota.plan.apiRateLimit);
  const key = await prisma.apiKey.create({
    data: {
      userId: session.userId,
      name: parsed.data.name,
      keyPrefix: rawKey.slice(0, 12),
      keyHash: hashApiKey(rawKey),
      scopes: parsed.data.scopes,
      rateLimit,
    },
    select: { id: true, name: true, keyPrefix: true, scopes: true, rateLimit: true, createdAt: true },
  });
  return Response.json({ ...key, key: rawKey, warning: 'Simpan API key sekarang. Nilai lengkap tidak dapat ditampilkan lagi.' }, { status: 201 });
}
