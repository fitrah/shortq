import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { authenticateApi, withRateHeaders } from '@/lib/api-auth';
import { assertQuota } from '@/lib/plans';
import { qrSchema, errorResponse, readJson, zodError } from '@/lib/validation';

export async function POST(request: Request) {
  const auth = await authenticateApi(request, 'qr:write');
  if ('error' in auth) return auth.error;
  const parsed = qrSchema.safeParse(await readJson(request));
  if (!parsed.success) return withRateHeaders(errorResponse('Data QR tidak valid', 400, zodError(parsed.error)), auth.rateLimit);
  if (parsed.data.save) {
    const quota = await assertQuota(auth.userId, 'qr');
    if (!quota.allowed) return withRateHeaders(errorResponse(`Kuota ${quota.limit} QR telah tercapai`, 403), auth.rateLimit);
  }
  const options = { color: { dark: parsed.data.foreground, light: parsed.data.background }, margin: parsed.data.margin, width: parsed.data.size, errorCorrectionLevel: 'M' as const };
  const data = parsed.data.format === 'svg'
    ? await QRCode.toString(parsed.data.content, { ...options, type: 'svg' })
    : await QRCode.toDataURL(parsed.data.content, { ...options, type: 'image/png' });
  const record = parsed.data.save ? await prisma.qrCode.create({ data: {
    userId: auth.userId, name: parsed.data.name, content: parsed.data.content,
    foreground: parsed.data.foreground, background: parsed.data.background,
    format: parsed.data.format, size: parsed.data.size, margin: parsed.data.margin,
  } }) : null;
  return withRateHeaders(Response.json({ data: { id: record?.id || null, format: parsed.data.format, content: data } }, { status: 201 }), auth.rateLimit);
}
