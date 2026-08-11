import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { orderAdminUpdateSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = orderAdminUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data order tidak valid', 400, zodError(parsed.error));
  const { id } = await params;
  try { return Response.json(await prisma.order.update({ where: { id }, data: { ...parsed.data, metadata: parsed.data.metadata as Prisma.InputJsonValue } })); }
  catch { return errorResponse('Order tidak ditemukan', 404); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { subscription: true } });
  if (!order) return errorResponse('Order tidak ditemukan', 404);
  if (order.subscription) return errorResponse('Order dengan langganan terkait tidak dapat dihapus', 409);
  await prisma.order.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
