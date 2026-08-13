'use client';
import Image from 'next/image';
import { FormEvent, useState } from 'react';

type LinkResult = { alias: string; targetUrl: string };
type QrResult = { data: string; format: string };

export default function GuestTools() {
  const [link, setLink] = useState<LinkResult | null>(null);
  const [qr, setQr] = useState<QrResult | null>(null);
  const [linkMessage, setLinkMessage] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [busy, setBusy] = useState<'link' | 'qr' | null>(null);

  async function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('link');
    setLinkMessage('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUrl: form.get('targetUrl'), alias: form.get('alias') || undefined }),
    });
    const data = await response.json();
    setBusy(null);
    if (!response.ok) return setLinkMessage(data.error || 'Gagal membuat short link.');
    setLink({ alias: data.alias, targetUrl: data.targetUrl });
    event.currentTarget.reset();
  }

  async function createQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('qr');
    setQrMessage('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Guest QR',
        content: form.get('content'),
        format: 'png',
        foreground: '#111827',
        background: '#ffffff',
        size: 512,
        margin: 2,
        save: true,
      }),
    });
    const data = await response.json();
    setBusy(null);
    if (!response.ok) return setQrMessage(data.error || 'Gagal membuat QR.');
    setQr({ data: data.data, format: data.format });
    event.currentTarget.reset();
  }

  function downloadQr() {
    if (!qr) return;
    const anchor = document.createElement('a');
    anchor.href = qr.data;
    anchor.download = 'qr-go-proyek-guest.png';
    anchor.click();
  }

  const shortUrl = link ? `${window.location.origin}/${link.alias}` : '';

  return <div id="gratis" className="grid gap-4 lg:grid-cols-2">
    <form onSubmit={createLink} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm font-bold text-cyan-300">Shortener gratis</p>
      <div className="mt-4 grid gap-3">
        <input name="targetUrl" type="url" required placeholder="https://contoh.com/promo" className="w-full rounded-xl bg-slate-950 p-3 outline-none ring-cyan-400 focus:ring-2" />
        <input name="alias" placeholder="alias opsional" pattern="[a-zA-Z0-9_-]{3,50}" className="w-full rounded-xl bg-slate-950 p-3 outline-none ring-cyan-400 focus:ring-2" />
        <button disabled={busy === 'link'} className="rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">{busy === 'link' ? 'Membuat...' : 'Buat short link'}</button>
      </div>
      {linkMessage && <p className="mt-3 text-sm text-amber-300">{linkMessage}</p>}
      {link && <div className="mt-4 rounded-xl bg-slate-950 p-4 text-sm">
        <p className="text-slate-500">Short link siap dipakai</p>
        <a href={shortUrl} className="mt-1 block break-all font-bold text-cyan-300">{shortUrl}</a>
      </div>}
    </form>
    <form onSubmit={createQr} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm font-bold text-cyan-300">QR gratis</p>
      <div className="mt-4 grid gap-3">
        <textarea name="content" required rows={3} placeholder="URL atau teks untuk QR" className="w-full rounded-xl bg-slate-950 p-3 outline-none ring-cyan-400 focus:ring-2" />
        <button disabled={busy === 'qr'} className="rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">{busy === 'qr' ? 'Membuat...' : 'Buat QR'}</button>
      </div>
      {qrMessage && <p className="mt-3 text-sm text-amber-300">{qrMessage}</p>}
      {qr && <div className="mt-4 rounded-xl bg-white p-4 text-center">
        <Image src={qr.data} alt="QR preview" width={180} height={180} unoptimized className="mx-auto" />
        <button type="button" onClick={downloadQr} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white">Download PNG</button>
        <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-slate-600">PNG bisa langsung dipakai untuk cetak biasa. Butuh file SVG/vektor yang lebih tajam untuk print besar? Daftar dan upgrade ke Pro.</p>
      </div>}
    </form>
  </div>;
}
