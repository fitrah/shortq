import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, setSessionCookie } from '@/lib/auth';
import { loginSchema, errorResponse, readJson } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data login tidak valid');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive || !await bcrypt.compare(parsed.data.password, user.passwordHash)) {
    return errorResponse('Email atau password salah', 401);
  }
  const token = await createToken(user);
  const response = Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  response.headers.set('Set-Cookie', setSessionCookie(token));
  return response;
}
