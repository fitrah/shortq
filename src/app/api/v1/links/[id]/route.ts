import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApi, withRateHeaders } from '@/lib/api-auth';
import { getPlanCapabilities } from '@/lib/entitlements';
import { getEffectivePlan } from '@/lib/plans';
import { isReservedAlias } from '@/lib/security';
import { linkUpdateSchema, errorResponse, readJson, zodError } from '@/lib/validation';

function safeLink<T extends { passwordHash: string | null }>(link: T) {
  const { passwordHash, ...safe } = link;
  return { ...safe, hasPassword: Boolean(passwordHash) };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request, 'links:read');
  if ('error' in auth) return auth.error;
  const { id } = await params;
  const link = await prisma.shortLink.findFirst({ where: { id, userId: auth.userId } });
  if (!link) return withRateHeaders(errorResponse('Link tidak ditemukan', 404), auth.rateLimit);
  return withRateHeaders(Response.json({ data: safeLink(link) }), auth.rateLimit);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request, 'links:write');
  if ('error' in auth) return auth.error;
  const parsed = linkUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return withRateHeaders(errorResponse('Perubahan tidak valid', 400, zodError(parsed.error)), auth.rateLimit);
  const { id } = await params;
  if (!await prisma.shortLink.findFirst({ where: { id, userId: auth.userId }, select: { id: true } })) return withRateHeaders(errorResponse('Link tidak ditemukan', 404), auth.rateLimit);
  if (parsed.data.alias && isReservedAlias(parsed.data.alias)) return withRateHeaders(errorResponse('Alias tersebut dicadangkan', 409), auth.rateLimit);
  const capabilities = getPlanCapabilities(await getEffectivePlan(auth.userId));
  if ((parsed.data.password || parsed.data.expiresAt) && !capabilities.canUsePasswordExpiry) {
    return withRateHeaders(errorResponse('Fitur password & expiry tersedia mulai paket Pro', 403), auth.rateLimit);
  }
  const data: Prisma.ShortLinkUpdateInput = {};
  if (parsed.data.alias !== undefined) data.alias = parsed.data.alias;
  if (parsed.data.targetUrl !== undefined) data.targetUrl = parsed.data.targetUrl;
  if (parsed.data.title !== undefined) data.title = parsed.data.title || null;
  if (parsed.data.expiresAt !== undefined) data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.removePassword) data.passwordHash = null;
  else if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    return withRateHeaders(Response.json({ data: safeLink(await prisma.shortLink.update({ where: { id }, data })) }), auth.rateLimit);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return withRateHeaders(errorResponse('Alias sudah digunakan', 409), auth.rateLimit);
    throw error;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateApi(request, 'links:write');
  if ('error' in auth) return auth.error;
  const { id } = await params;
  const result = await prisma.shortLink.deleteMany({ where: { id, userId: auth.userId } });
  if (!result.count) return withRateHeaders(errorResponse('Link tidak ditemukan', 404), auth.rateLimit);
  return withRateHeaders(new Response(null, { status: 204 }), auth.rateLimit);
}
