import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'crypto';
import { createOpaqueToken, hashApiKey, hashToken, isReservedAlias } from '../src/lib/security';
import { verifyMidtransSignature } from '../src/lib/midtrans';
import { apiKeySchema, linkUpdateSchema, qrSchema } from '../src/lib/validation';
import { openapi } from '../src/lib/openapi';

afterEach(() => vi.unstubAllEnvs());

describe('security primitives', () => {
  it('creates high-entropy opaque tokens and one-way hashes', () => {
    const token = createOpaqueToken(32);
    expect(token.length).toBeGreaterThan(40);
    expect(hashToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashToken(token)).not.toContain(token);
  });

  it('hashes API keys deterministically with a pepper', () => {
    vi.stubEnv('API_KEY_PEPPER', 'a-secure-test-pepper-that-is-long-enough');
    expect(hashApiKey('gop_example')).toBe(hashApiKey('gop_example'));
    expect(hashApiKey('gop_example')).not.toContain('gop_example');
    expect(hashApiKey('gop_other')).not.toBe(hashApiKey('gop_example'));
  });

  it('blocks aliases reserved by application routes case-insensitively', () => {
    expect(isReservedAlias('API')).toBe(true);
    expect(isReservedAlias('dashboard')).toBe(true);
    expect(isReservedAlias('promo-2026')).toBe(false);
  });
});

describe('Midtrans webhook signature', () => {
  it('accepts the documented SHA-512 signature and rejects tampering', () => {
    vi.stubEnv('MIDTRANS_SERVER_KEY', 'server-key-test');
    const input = { order_id: 'GOP-123', status_code: '200', gross_amount: '99000.00' };
    const signature_key = createHash('sha512').update(input.order_id + input.status_code + input.gross_amount + 'server-key-test').digest('hex');
    expect(verifyMidtransSignature({ ...input, signature_key })).toBe(true);
    expect(verifyMidtransSignature({ ...input, gross_amount: '1.00', signature_key })).toBe(false);
  });
});

describe('expanded validation and docs', () => {
  it('validates QR customization bounds and API scopes', () => {
    expect(qrSchema.safeParse({ content: 'https://example.com', format: 'svg', foreground: '#000000', background: '#ffffff', size: 2048, margin: 10 }).success).toBe(true);
    expect(qrSchema.safeParse({ content: 'x', foreground: 'red' }).success).toBe(false);
    expect(apiKeySchema.safeParse({ name: 'CRM', scopes: ['links:read'] }).success).toBe(true);
    expect(apiKeySchema.safeParse({ name: 'CRM', scopes: ['admin:*'] }).success).toBe(false);
  });

  it('allows status/password/expiry updates but rejects empty patches', () => {
    expect(linkUpdateSchema.safeParse({ isActive: false, removePassword: true, expiresAt: null }).success).toBe(true);
    expect(linkUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('publishes an OpenAPI 3.1 document for all v1 modules', () => {
    expect(openapi.openapi).toBe('3.1.0');
    expect(Object.keys(openapi.paths)).toEqual(expect.arrayContaining(['/links', '/links/{id}', '/analytics', '/qr']));
  });
});
