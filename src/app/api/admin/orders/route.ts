import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { orderAdminSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  return Response.json(await prisma.order.findMany({ include: { user: { select: { name: true, email: true } }, plan: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }));
}
export async function POST(request: Request) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = orderAdminSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data order tidak valid', 400, zodError(parsed.error));
  try { return Response.json(await prisma.order.create({ data: { ...parsed.data, metadata: parsed.data.metadata as Prisma.InputJsonValue } }), { status: 201 }); }
  catch { return errorResponse('User/paket tidak valid atau external ID sudah ada', 409); }
}
