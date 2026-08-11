import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { createToken, setSessionCookie } from '@/lib/auth';
import { registerSchema, errorResponse, readJson } from '@/lib/validation';

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data pendaftaran tidak valid');
  const { name, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) return errorResponse('Email sudah terdaftar', 409);
  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });
  const token = await createToken(user);
  const response = Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  response.headers.set('Set-Cookie', setSessionCookie(token));
  return response;
}
