import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { planAdminSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  return Response.json(await prisma.plan.findMany({ orderBy: { price: 'asc' }, include: { _count: { select: { subscriptions: true, orders: true } } } }));
}
export async function POST(request: Request) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = planAdminSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data paket tidak valid', 400, zodError(parsed.error));
  try { return Response.json(await prisma.plan.create({ data: parsed.data }), { status: 201 }); }
  catch { return errorResponse('Nama atau slug paket sudah digunakan', 409); }
}
