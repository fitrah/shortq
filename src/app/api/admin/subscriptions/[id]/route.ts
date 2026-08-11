import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { subscriptionAdminUpdateSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = subscriptionAdminUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data langganan tidak valid', 400, zodError(parsed.error));
  const { id } = await params;
  const data: Prisma.SubscriptionUpdateInput = {};
  if (parsed.data.planId) data.plan = { connect: { id: parsed.data.planId } };
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.startsAt !== undefined) data.startsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : null;
  if (parsed.data.endsAt !== undefined) data.endsAt = parsed.data.endsAt ? new Date(parsed.data.endsAt) : null;
  try { return Response.json(await prisma.subscription.update({ where: { id }, data })); }
  catch { return errorResponse('Langganan atau paket tidak ditemukan', 404); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const { id } = await params;
  const result = await prisma.subscription.deleteMany({ where: { id } });
  if (!result.count) return errorResponse('Langganan tidak ditemukan', 404);
  return new Response(null, { status: 204 });
}
