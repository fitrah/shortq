import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApi, withRateHeaders } from '@/lib/api-auth';
import { assertQuota } from '@/lib/plans';
import { getPlanCapabilities } from '@/lib/entitlements';
import { isReservedAlias } from '@/lib/security';
import { linkSchema, errorResponse, readJson, zodError } from '@/lib/validation';

function safeLink<T extends { passwordHash: string | null }>(link: T) {
  const { passwordHash, ...safe } = link;
  return { ...safe, hasPassword: Boolean(passwordHash) };
}

export async function GET(request: Request) {
  const auth = await authenticateApi(request, 'links:read');
  if ('error' in auth) return auth.error;
  const links = await prisma.shortLink.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: 'desc' } });
  return withRateHeaders(Response.json({ data: links.map(safeLink) }), auth.rateLimit);
}

export async function POST(request: Request) {
  const auth = await authenticateApi(request, 'links:write');
  if ('error' in auth) return auth.error;
  const parsed = linkSchema.safeParse(await readJson(request));
  if (!parsed.success) return withRateHeaders(errorResponse('Data link tidak valid', 400, zodError(parsed.error)), auth.rateLimit);
  const quota = await assertQuota(auth.userId, 'links');
  if (!quota.allowed) return withRateHeaders(errorResponse(`Kuota ${quota.limit} short link telah tercapai`, 403), auth.rateLimit);
  const capabilities = getPlanCapabilities(quota.plan);
  if ((parsed.data.password || parsed.data.expiresAt) && !capabilities.canUsePasswordExpiry) {
    return withRateHeaders(errorResponse('Fitur password & expiry tersedia mulai paket Pro', 403), auth.rateLimit);
  }
  const alias = parsed.data.alias || nanoid(7);
  if (isReservedAlias(alias)) return withRateHeaders(errorResponse('Alias tersebut dicadangkan', 409), auth.rateLimit);
  try {
    const link = await prisma.shortLink.create({ data: {
      userId: auth.userId, alias, targetUrl: parsed.data.targetUrl, title: parsed.data.title,
      passwordHash: parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      isActive: parsed.data.isActive ?? true,
    } });
    return withRateHeaders(Response.json({ data: safeLink(link) }, { status: 201 }), auth.rateLimit);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return withRateHeaders(errorResponse('Alias sudah digunakan', 409), auth.rateLimit);
    throw error;
  }
}
