import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getPlanCapabilities } from '@/lib/entitlements';
import { getEffectivePlan } from '@/lib/plans';
import { isReservedAlias } from '@/lib/security';
import { linkUpdateSchema, errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const { id } = await params;
  const link = await prisma.shortLink.findFirst({ where: { id, userId: session.userId } });
  if (!link) return errorResponse('Link tidak ditemukan', 404);
  const { passwordHash, ...safe } = link;
  return Response.json({ ...safe, hasPassword: Boolean(passwordHash) });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const parsed = linkUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Perubahan tidak valid', 400, zodError(parsed.error));
  const { id } = await params;
  const existing = await prisma.shortLink.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return errorResponse('Link tidak ditemukan', 404);
  if (parsed.data.alias && isReservedAlias(parsed.data.alias)) return errorResponse('Alias tersebut dicadangkan', 409);
  const capabilities = getPlanCapabilities(await getEffectivePlan(session.userId));
  if ((parsed.data.password || parsed.data.expiresAt) && !capabilities.canUsePasswordExpiry) {
    return errorResponse('Fitur password & expiry tersedia mulai paket Pro', 403);
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
    const updated = await prisma.shortLink.update({ where: { id }, data });
    const { passwordHash, ...safe } = updated;
    return Response.json({ ...safe, hasPassword: Boolean(passwordHash) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return errorResponse('Alias sudah digunakan', 409);
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const { id } = await params;
  const result = await prisma.shortLink.deleteMany({ where: { id, userId: session.userId } });
  if (!result.count) return errorResponse('Link tidak ditemukan', 404);
  return new Response(null, { status: 204 });
}
