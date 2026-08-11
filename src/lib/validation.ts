import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(8).max(128);
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
});
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });

const httpUrl = z.string().trim().url().max(2048).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'URL harus menggunakan http atau https');

export const aliasSchema = z.string().trim().regex(/^[a-zA-Z0-9_-]{3,50}$/);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
const optionalDate = z.string().datetime().optional().nullable().refine(
  (value) => !value || new Date(value) > new Date(),
  'Waktu kedaluwarsa harus di masa depan',
);

export const linkSchema = z.object({
  targetUrl: httpUrl,
  alias: aliasSchema.optional(),
  title: optionalText(100),
  password: z.string().min(4).max(100).optional().or(z.literal('')),
  expiresAt: optionalDate,
  isActive: z.boolean().optional(),
});

export const linkUpdateSchema = linkSchema.partial().extend({
  removePassword: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Tidak ada perubahan');

export const qrSchema = z.object({
  name: z.string().trim().min(1).max(100).default('QR Code'),
  content: z.string().min(1).max(2048),
  format: z.enum(['png', 'svg']).default('png'),
  foreground: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#111827'),
  background: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  size: z.number().int().min(256).max(2048).default(1024),
  margin: z.number().int().min(0).max(10).default(2),
  save: z.boolean().default(true),
});

export const apiKeySchema = z.object({
  name: z.string().trim().min(2).max(80),
  scopes: z.array(z.enum(['links:read', 'links:write', 'analytics:read', 'qr:write'])).min(1),
  rateLimit: z.number().int().min(1).max(10000).optional(),
});

export async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return Response.json({ error: message, ...(details ? { details } : {}) }, { status });
}

export function zodError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(', ');
}
