import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { passwordSchema, readJson, errorResponse } from '@/lib/validation';

const schema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data password tidak valid');
  if (parsed.data.currentPassword === parsed.data.newPassword) return errorResponse('Password baru harus berbeda');
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)) return errorResponse('Password saat ini salah', 400);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12), sessionVersion: { increment: 1 } },
  });
  const response = Response.json({ message: 'Password berhasil diubah. Silakan masuk kembali.' });
  response.headers.set('Set-Cookie', clearSessionCookie);
  return response;
}
