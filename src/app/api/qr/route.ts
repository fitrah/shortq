import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { ensureGuestSession, getSession } from '@/lib/auth';
import { assertQuota, getEffectivePlan } from '@/lib/plans';
import { getPlanCapabilities } from '@/lib/entitlements';
import { qrSchema, errorResponse, readJson, zodError } from '@/lib/validation';

export async function GET() {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  return Response.json(await prisma.qrCode.findMany({ where: { userId: session.userId }, orderBy: { createdAt: 'desc' } }));
}

export async function POST(request: Request) {
  const session = await getSession();
  const parsed = qrSchema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Data QR tidak valid', 400, zodError(parsed.error));
  const guest = session ? null : await ensureGuestSession();
  const userId = session?.userId ?? guest!.userId;
  const plan = await getEffectivePlan(userId);
  const capabilities = getPlanCapabilities(plan);
  if (parsed.data.format === 'svg' && !capabilities.canUseSvgQr) return errorResponse('Format SVG tersedia mulai paket Pro', 403);
  if (parsed.data.save) {
    const quota = await assertQuota(userId, 'qr');
    if (!quota.allowed) return errorResponse(`Kuota ${quota.limit} QR${quota.period === 'daily' ? '/hari' : ''} paket ${quota.plan.name} telah tercapai`, 403);
  }
  const options = {
    color: { dark: parsed.data.foreground, light: parsed.data.background },
    margin: parsed.data.margin,
    width: parsed.data.size,
    errorCorrectionLevel: 'M' as const,
  };
  const output = parsed.data.format === 'svg'
    ? await QRCode.toString(parsed.data.content, { ...options, type: 'svg' })
    : await QRCode.toDataURL(parsed.data.content, { ...options, type: 'image/png' });
  const record = parsed.data.save ? await prisma.qrCode.create({
    data: {
      userId,
      name: parsed.data.name,
      content: parsed.data.content,
      foreground: parsed.data.foreground,
      background: parsed.data.background,
      format: parsed.data.format,
      size: parsed.data.size,
      margin: parsed.data.margin,
    },
  }) : null;
  const response = Response.json({ id: record?.id || null, format: parsed.data.format, mimeType: parsed.data.format === 'svg' ? 'image/svg+xml' : 'image/png', data: output }, { status: 201 });
  if (guest?.setCookie) response.headers.append('Set-Cookie', guest.setCookie);
  return response;
}
