import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/security';
import { passwordSchema, readJson, errorResponse } from '@/lib/validation';
import { z } from 'zod';

const schema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Token atau password tidak valid');
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) return errorResponse('Token reset tidak valid atau kedaluwarsa', 400);
  const user = await prisma.user.findUnique({ where: { email: reset.email } });
  if (!user?.isActive) return errorResponse('Token reset tidak valid atau kedaluwarsa', 400);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(parsed.data.password, 12), sessionVersion: { increment: 1 } },
    }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.passwordReset.updateMany({ where: { email: reset.email, usedAt: null, id: { not: reset.id } }, data: { usedAt: new Date() } }),
  ]);
  return Response.json({ message: 'Password berhasil direset. Silakan masuk kembali.' });
}
