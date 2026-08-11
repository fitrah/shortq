export function baseUrl(request?: Request) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  if (request) return new URL(request.url).origin;
  return 'http://localhost:3000';
}

export function publicLink(alias: string, request?: Request) {
  return `${baseUrl(request)}/${alias}`;
}
