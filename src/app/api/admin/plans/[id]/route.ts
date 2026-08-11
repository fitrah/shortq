import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { planAdminUpdateSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = planAdminUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data paket tidak valid', 400, zodError(parsed.error));
  const { id } = await params;
  try { return Response.json(await prisma.plan.update({ where: { id }, data: parsed.data })); }
  catch { return errorResponse('Paket tidak ditemukan atau nama/slug bentrok', 409); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const { id } = await params;
  const plan = await prisma.plan.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true, orders: true } } } });
  if (!plan) return errorResponse('Paket tidak ditemukan', 404);
  if (plan.slug === 'free' || plan._count.subscriptions || plan._count.orders) return errorResponse('Paket Free atau paket yang sudah digunakan tidak dapat dihapus; nonaktifkan saja', 409);
  await prisma.plan.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
