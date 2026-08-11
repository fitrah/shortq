import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { userAdminUpdateSchema } from '@/lib/admin-validation';
import { errorResponse, readJson, zodError } from '@/lib/validation';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse('Forbidden', 403);
  const parsed = userAdminUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data user tidak valid', 400, zodError(parsed.error));
  const { id } = await params;
  if (id === admin.userId && (parsed.data.isActive === false || parsed.data.role === 'USER')) return errorResponse('Tidak dapat menonaktifkan atau menurunkan role akun sendiri', 409);
  const data: Prisma.UserUpdateInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.email !== undefined) data.email = parsed.data.email;
  if (parsed.data.role !== undefined) data.role = parsed.data.role;
  if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
  if (parsed.data.password) { data.passwordHash = await bcrypt.hash(parsed.data.password, 12); data.sessionVersion = { increment: 1 }; }
  if (parsed.data.isActive === false || parsed.data.role) data.sessionVersion = { increment: 1 };
  try {
    const user = await prisma.user.update({ where: { id }, data });
    const { passwordHash, ...safe } = user; void passwordHash;
    return Response.json(safe);
  } catch { return errorResponse('User tidak ditemukan atau email bentrok', 409); }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse('Forbidden', 403);
  const { id } = await params;
  if (id === admin.userId) return errorResponse('Tidak dapat menghapus akun sendiri', 409);
  const result = await prisma.user.deleteMany({ where: { id } });
  if (!result.count) return errorResponse('User tidak ditemukan', 404);
  return new Response(null, { status: 204 });
}
