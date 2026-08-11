import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { userAdminSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  return Response.json(await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { links: true, qrCodes: true, apiKeys: true, subscriptions: true, orders: true } } }, orderBy: { createdAt: 'desc' } }));
}
export async function POST(request: Request) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = userAdminSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data user tidak valid', 400, zodError(parsed.error));
  try {
    const { password, ...data } = parsed.data;
    const user = await prisma.user.create({ data: { ...data, passwordHash: await bcrypt.hash(password, 12) } });
    const { passwordHash, ...safe } = user; void passwordHash;
    return Response.json(safe, { status: 201 });
  } catch { return errorResponse('Email sudah digunakan', 409); }
}
