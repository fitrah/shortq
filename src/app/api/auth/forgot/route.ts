import { prisma } from '@/lib/prisma';
import { createOpaqueToken, hashToken } from '@/lib/security';
import { baseUrl } from '@/lib/http';
import { emailSchema, readJson } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = emailSchema.safeParse(typeof body === 'object' && body ? (body as { email?: unknown }).email : undefined);
  const generic = { message: 'Jika email terdaftar, instruksi reset telah dikirim.' };
  if (!parsed.success) return Response.json(generic);
  const user = await prisma.user.findUnique({ where: { email: parsed.data }, select: { email: true, isActive: true } });
  if (!user?.isActive) return Response.json(generic);

  const recent = await prisma.passwordReset.findFirst({
    where: { email: user.email, createdAt: { gt: new Date(Date.now() - 60_000) }, usedAt: null },
  });
  if (recent) return Response.json(generic);

  const token = createOpaqueToken();
  await prisma.passwordReset.create({
    data: { email: user.email, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) },
  });
  const resetUrl = `${baseUrl(request)}/reset-password?token=${encodeURIComponent(token)}`;
  const webhook = process.env.PASSWORD_RESET_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(process.env.PASSWORD_RESET_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.PASSWORD_RESET_WEBHOOK_TOKEN}` } : {}) },
        body: JSON.stringify({ to: user.email, template: 'password-reset', resetUrl, expiresInMinutes: 30 }),
      });
    } catch (error) {
      console.error('Password reset webhook gagal', error);
    }
  }
  return Response.json({ ...generic, ...(process.env.NODE_ENV !== 'production' ? { resetUrl } : {}) });
}
