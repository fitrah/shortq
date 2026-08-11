import { prisma } from '@/lib/prisma';
import { createOpaqueToken, hashToken } from '@/lib/security';
import { baseUrl } from '@/lib/http';
import { emailSchema, readJson } from '@/lib/validation';

async function sendPasswordResetEmail(input: { to: string; resetUrl: string }) {
  const webhook = process.env.PASSWORD_RESET_WEBHOOK_URL;
  if (webhook) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.PASSWORD_RESET_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.PASSWORD_RESET_WEBHOOK_TOKEN}` } : {}) },
      body: JSON.stringify({ to: input.to, template: 'password-reset', resetUrl: input.resetUrl, expiresInMinutes: 30 }),
    });
    return;
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn('Password reset email tidak dikirim: PASSWORD_RESET_WEBHOOK_URL/RESEND_API_KEY belum dikonfigurasi');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.PASSWORD_RESET_FROM_EMAIL || 'go.proyek.org <noreply@notify.proyek.org>',
      to: input.to,
      subject: 'Reset password go.proyek.org',
      html: `<p>Klik tombol di bawah ini untuk reset password go.proyek.org.</p><p><a href="${input.resetUrl}" style="background:#22d3ee;color:#082f49;display:inline-block;font-weight:700;padding:12px 18px;text-decoration:none;border-radius:10px">Reset password</a></p><p>Link berlaku 30 menit. Kalau bukan kamu yang meminta, abaikan email ini.</p>`,
      text: `Reset password go.proyek.org: ${input.resetUrl}\n\nLink berlaku 30 menit. Kalau bukan kamu yang meminta, abaikan email ini.`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend gagal (${response.status}): ${detail}`);
  }
}

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
  try {
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  } catch (error) {
    console.error('Password reset email gagal', error);
  }
  return Response.json({ ...generic, ...(process.env.NODE_ENV !== 'production' ? { resetUrl } : {}) });
}
