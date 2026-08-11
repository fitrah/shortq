import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { settingAdminSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  return Response.json(await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } }));
}
export async function POST(request: Request) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = settingAdminSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Pengaturan tidak valid', 400, zodError(parsed.error));
  const value = parsed.data.value === null ? Prisma.JsonNull : parsed.data.value as Prisma.InputJsonValue;
  return Response.json(await prisma.siteSetting.upsert({ where: { key: parsed.data.key }, create: { key: parsed.data.key, value }, update: { value } }), { status: 201 });
}
