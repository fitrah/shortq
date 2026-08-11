import Link from 'next/link';

const endpoints = [
  ['GET', '/api/v1/links', 'links:read', 'Daftar semua short link'],
  ['POST', '/api/v1/links', 'links:write', 'Buat short link'],
  ['GET/PATCH/DELETE', '/api/v1/links/{id}', 'links:read / links:write', 'Detail, edit, atau hapus link'],
  ['GET', '/api/v1/analytics', 'analytics:read', 'Ringkasan performa'],
  ['POST', '/api/v1/qr', 'qr:write', 'Generate PNG atau SVG'],
];

export default function ApiDocs() {
  return <main className="min-h-screen bg-slate-950 px-6 py-12 text-white"><div className="mx-auto max-w-5xl">
    <Link href="/" className="font-black"><span className="text-cyan-400">go.</span>proyek.org</Link>
    <div className="mt-10 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-bold text-cyan-400">REST API v1</p><h1 className="text-4xl font-black">Dokumentasi API</h1><p className="mt-3 max-w-2xl text-slate-400">Gunakan API key dari dashboard sebagai Bearer token. Scope dan rate limit diterapkan pada setiap permintaan.</p></div><a className="rounded-xl border border-slate-700 px-4 py-3 text-sm" href="/api/v1/openapi.json">Unduh OpenAPI 3.1 JSON</a></div>
    <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6"><h2 className="text-xl font-bold">Autentikasi</h2><pre className="mt-4 overflow-auto rounded-xl bg-slate-950 p-4 text-sm text-cyan-300">{`curl -H "Authorization: Bearer gop_xxx" \\\n  https://go.proyek.org/api/v1/links`}</pre><p className="mt-3 text-sm text-slate-400">Header respons mencakup X-RateLimit-Limit, X-RateLimit-Remaining, dan X-RateLimit-Reset.</p></section>
    <section className="mt-8 space-y-3">{endpoints.map(([method, path, scope, description]) => <article key={path + method} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-[170px_1fr_180px]"><div className="font-bold text-cyan-400">{method}</div><div><code>{path}</code><p className="mt-1 text-sm text-slate-400">{description}</p></div><div className="text-sm text-slate-500">Scope: {scope}</div></article>)}</section>
    <section className="mt-8 rounded-2xl border border-slate-800 p-6"><h2 className="font-bold">Contoh membuat link</h2><pre className="mt-4 overflow-auto text-sm text-slate-300">{`curl -X POST https://go.proyek.org/api/v1/links \\\n  -H "Authorization: Bearer gop_xxx" \\\n  -H "Content-Type: application/json" \\\n  -d '{"targetUrl":"https://example.com","alias":"contoh"}'`}</pre></section>
  </div></main>;
}
