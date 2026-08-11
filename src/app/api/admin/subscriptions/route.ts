import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { subscriptionAdminSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  return Response.json(await prisma.subscription.findMany({ include: { user: { select: { name: true, email: true } }, plan: { select: { name: true } }, order: { select: { externalId: true } } }, orderBy: { createdAt: 'desc' } }));
}
export async function POST(request: Request) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = subscriptionAdminSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data langganan tidak valid', 400, zodError(parsed.error));
  const { startsAt, endsAt, ...data } = parsed.data;
  try { return Response.json(await prisma.subscription.create({ data: { ...data, startsAt: startsAt ? new Date(startsAt) : null, endsAt: endsAt ? new Date(endsAt) : null } }), { status: 201 }); }
  catch { return errorResponse('User atau paket tidak valid', 409); }
}
