import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { clickMetadata } from '@/lib/analytics';
import { escapeHtml } from '@/lib/security';

async function findLink(alias: string) {
  return prisma.shortLink.findUnique({ where: { alias } });
}

function unavailable() {
  return new Response('Link tidak ditemukan, dinonaktifkan, atau kedaluwarsa.', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

async function trackAndRedirect(request: Request, link: { id: string; targetUrl: string }) {
  await prisma.$transaction([
    prisma.shortLink.update({ where: { id: link.id }, data: { clickCount: { increment: 1 } } }),
    prisma.click.create({ data: { shortLinkId: link.id, ...clickMetadata(request) } }),
  ]);
  return Response.redirect(link.targetUrl, 302);
}

function passwordPage(alias: string, title: string | null, error = '') {
  const safeAlias = escapeHtml(alias);
  const safeTitle = escapeHtml(title || 'Link terproteksi');
  return new Response(`<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${safeTitle}</title><style>body{font-family:system-ui;background:#020617;color:#fff;display:grid;place-items:center;min-height:100vh;margin:0}.box{width:min(90%,420px);background:#0f172a;border:1px solid #334155;border-radius:24px;padding:32px}b{color:#22d3ee}input,button{box-sizing:border-box;width:100%;padding:13px;border-radius:12px;margin-top:14px}input{background:#020617;color:white;border:1px solid #475569}button{background:#22d3ee;border:0;font-weight:800;color:#082f49;cursor:pointer}.err{color:#f87171}</style></head><body><main class="box"><b>go.proyek.org/${safeAlias}</b><h1>${safeTitle}</h1><p>Masukkan password untuk membuka tautan.</p>${error ? `<p class="err">${escapeHtml(error)}</p>` : ''}<form method="post"><input type="password" name="password" required minlength="4" maxlength="100" autocomplete="current-password"><button type="submit">Buka link</button></form></main></body></html>`, {
    status: error ? 401 : 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const link = await findLink(alias);
  if (!link || !link.isActive || (link.expiresAt && link.expiresAt <= new Date())) return unavailable();
  if (link.passwordHash) return passwordPage(alias, link.title);
  return trackAndRedirect(request, link);
}

export async function POST(request: Request, { params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const link = await findLink(alias);
  if (!link || !link.isActive || (link.expiresAt && link.expiresAt <= new Date())) return unavailable();
  if (!link.passwordHash) return trackAndRedirect(request, link);
  const form = await request.formData();
  const password = String(form.get('password') || '');
  if (!password || !await bcrypt.compare(password, link.passwordHash)) return passwordPage(alias, link.title, 'Password salah.');
  return trackAndRedirect(request, link);
}
