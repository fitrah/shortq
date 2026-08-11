import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!value || value.length < 32)) {
    throw new Error('JWT_SECRET minimal 32 karakter wajib di production');
  }
  return new TextEncoder().encode(value || 'development-only-secret-change-me');
};

export type Session = { userId: string; email: string; role: 'USER' | 'SUPERADMIN' };

export async function createToken(user: { id: string; email: string; role: string; sessionVersion?: number }) {
  return new SignJWT({ email: user.email, role: user.role, ver: user.sessionVersion ?? 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get('session')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true, sessionVersion: true },
    });
    if (!user?.isActive || user.sessionVersion !== Number(payload.ver ?? 0)) return null;
    return { userId: user.id, email: user.email, role: user.role };
  } catch {
    return null;
  }
}

export async function requireSession() {
  return getSession();
}

export async function requireAdmin() {
  const session = await getSession();
  return session?.role === 'SUPERADMIN' ? session : null;
}

export const sessionCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export function setSessionCookie(token: string) {
  const secure = sessionCookie.secure ? '; Secure' : '';
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionCookie.maxAge}${secure}`;
}

export const clearSessionCookie = 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
