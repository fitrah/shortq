import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  return new Response(null, {
    status: 303,
    headers: { Location: '/', 'Set-Cookie': clearSessionCookie },
  });
}
