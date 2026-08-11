import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { assertQuota } from '@/lib/plans';
import { getPlanCapabilities } from '@/lib/entitlements';
import { isReservedAlias } from '@/lib/security';
import { linkSchema, errorResponse, readJson, zodError } from '@/lib/validation';

const publicSelect = {
  id: true, alias: true, targetUrl: true, title: true, expiresAt: true,
  isActive: true, clickCount: true, createdAt: true, updatedAt: true,
  passwordHash: true,
} satisfies Prisma.ShortLinkSelect;

function serialize<T extends { passwordHash: string | null }>(link: T) {
  const { passwordHash, ...safe } = link;
  return { ...safe, hasPassword: Boolean(passwordHash) };
}

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const links = await prisma.shortLink.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    select: publicSelect,
  });
  return Response.json(links.map(serialize));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const parsed = linkSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data link tidak valid', 400, zodError(parsed.error));
  const quota = await assertQuota(session.userId, 'links');
  if (!quota.allowed) return errorResponse(`Kuota ${quota.limit} short link paket ${quota.plan.name} telah tercapai`, 403);
  const capabilities = getPlanCapabilities(quota.plan);
  if ((parsed.data.password || parsed.data.expiresAt) && !capabilities.canUsePasswordExpiry) {
    return errorResponse('Fitur password & expiry tersedia mulai paket Pro', 403);
  }
  const alias = parsed.data.alias || nanoid(7);
  if (isReservedAlias(alias)) return errorResponse('Alias tersebut dicadangkan', 409);
  try {
    const link = await prisma.shortLink.create({
      data: {
        userId: session.userId,
        alias,
        targetUrl: parsed.data.targetUrl,
        title: parsed.data.title,
        passwordHash: parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        isActive: parsed.data.isActive ?? true,
      },
      select: publicSelect,
    });
    return Response.json(serialize(link), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return errorResponse('Alias sudah digunakan', 409);
    throw error;
  }
}
