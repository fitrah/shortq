import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const RESERVED_ALIASES = new Set([
  'api', 'dashboard', 'login', 'register', 'forgot-password', 'reset-password',
  'admin', 'docs', 'pricing', 'favicon.ico', '_next', 'health',
]);

export function isReservedAlias(alias: string) {
  return RESERVED_ALIASES.has(alias.toLowerCase());
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function hashApiKey(key: string) {
  const pepper = process.env.API_KEY_PEPPER || process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && (!pepper || pepper.length < 32)) {
    throw new Error('API_KEY_PEPPER minimal 32 karakter wajib di production');
  }
  return createHmac('sha256', pepper || 'development-only-api-key-pepper').update(key).digest('hex');
}

export function safeEqualHex(a: string, b: string) {
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b) || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

export function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '';
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]!);
}
