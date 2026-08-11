import { UAParser } from 'ua-parser-js';
import { createHash } from 'crypto';
import { clientIp } from '@/lib/security';

export function clickMetadata(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  const parsed = UAParser(ua);
  const browser = [parsed.browser.name, parsed.browser.version].filter(Boolean).join(' ').slice(0, 100) || 'Unknown';
  const device = (parsed.device.type || (parsed.os.name ? 'desktop' : 'unknown')).slice(0, 50);
  const country = (request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || 'Unknown').slice(0, 50);
  const ip = clientIp(request);
  const salt = process.env.IP_HASH_SALT;
  if (process.env.NODE_ENV === 'production' && (!salt || salt.length < 32)) throw new Error('IP_HASH_SALT minimal 32 karakter wajib di production');
  return {
    referrer: request.headers.get('referer')?.slice(0, 500) || null,
    browser,
    device,
    country,
    ipHash: ip ? createHash('sha256').update(ip + (salt || 'development-only-ip-salt')).digest('hex') : null,
  };
}
