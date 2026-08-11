import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { errorResponse, readJson } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const parsed = z.object({ value: z.unknown() }).safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Pengaturan tidak valid');
  const { key } = await params;
  const value = parsed.data.value === null ? Prisma.JsonNull : parsed.data.value as Prisma.InputJsonValue;
  try { return Response.json(await prisma.siteSetting.update({ where: { key }, data: { value } })); }
  catch { return errorResponse('Pengaturan tidak ditemukan', 404); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!await requireAdmin()) return errorResponse('Forbidden', 403);
  const { key } = await params;
  const result = await prisma.siteSetting.deleteMany({ where: { key } });
  if (!result.count) return errorResponse('Pengaturan tidak ditemukan', 404);
  return new Response(null, { status: 204 });
}
