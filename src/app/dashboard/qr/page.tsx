'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type QrRecord = {
  id: string;
  name: string;
  content: string;
  format: string;
  foreground: string;
  background: string;
  size: number;
  margin: number;
  createdAt: string;
};
type Capabilities = { canUseSvgQr: boolean };
type QrPreview = { data: string; format: string };

export default function QrPage() {
  const [history, setHistory] = useState<QrRecord[]>([]);
  const [preview, setPreview] = useState<QrPreview | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [capabilities, setCapabilities] = useState<Capabilities>({ canUseSvgQr: false });

  useEffect(() => {
    fetch('/api/qr').then((response) => response.json()).then(setHistory).catch(() => setMessage('Gagal memuat riwayat QR.'));
  }, []);

  useEffect(() => {
    fetch('/api/billing/status')
      .then((response) => response.json())
      .then((data) => setCapabilities(data.capabilities || { canUseSvgQr: false }))
      .catch(() => undefined);
  }, []);

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get('name'),
      content: form.get('content'),
      format: form.get('format'),
      foreground: form.get('foreground'),
      background: form.get('background'),
      size: Number(form.get('size')),
      margin: Number(form.get('margin')),
      save: true,
    };
    const response = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(data.error);
    setPreview({ data: data.data, format: data.format });
    setHistory((current) => [{ id: data.id, ...payload, createdAt: new Date().toISOString() } as QrRecord, ...current]);
  }

  function download() {
    if (!preview) return;
    const anchor = document.createElement('a');
    if (preview.format === 'svg') {
      anchor.href = URL.createObjectURL(new Blob([preview.data], { type: 'image/svg+xml' }));
    } else {
      anchor.href = preview.data;
    }
    anchor.download = `qr-go-proyek.${preview.format}`;
    anchor.click();
    if (preview.format === 'svg') URL.revokeObjectURL(anchor.href);
  }

  async function remove(id: string) {
    if (!confirm('Hapus QR dari riwayat?')) return;
    const response = await fetch(`/api/qr/${id}`, { method: 'DELETE' });
    if (response.ok) setHistory((current) => current.filter((item) => item.id !== id));
  }

  const previewSrc = preview?.format === 'svg' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(preview.data)}` : preview?.data;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-bold text-cyan-400">QR GENERATOR</p>
      <h1 className="text-4xl font-black">QR siap cetak</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        Download PNG bisa dipakai untuk print biasa. Untuk cetak ukuran besar, stiker, atau kebutuhan desain vektor, gunakan SVG yang tersedia mulai paket Pro.
      </p>
      {!capabilities.canUseSvgQr && (
        <Link href="/dashboard/billing" className="mt-4 inline-block rounded-xl border border-cyan-400/40 px-4 py-2 text-sm font-bold text-cyan-300">
          Upgrade ke Pro untuk SVG
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form onSubmit={generate} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <label>
            Nama
            <input name="name" defaultValue="QR Baru" required className="mt-1 w-full rounded-xl bg-slate-950 p-3" />
          </label>
          <label>
            URL atau teks
            <textarea name="content" required maxLength={2048} rows={4} className="mt-1 w-full rounded-xl bg-slate-950 p-3" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label>
              Warna depan
              <input name="foreground" type="color" defaultValue="#111827" className="mt-1 h-12 w-full" />
            </label>
            <label>
              Latar
              <input name="background" type="color" defaultValue="#ffffff" className="mt-1 h-12 w-full" />
            </label>
            <label>
              Format
              <select name="format" className="mt-1 w-full rounded-xl bg-slate-950 p-3">
                <option value="png">PNG</option>
                {capabilities.canUseSvgQr && <option value="svg">SVG</option>}
              </select>
              {!capabilities.canUseSvgQr && <span className="mt-1 block text-xs text-slate-500">SVG tersedia mulai paket Pro.</span>}
            </label>
            <label>
              Ukuran
              <select name="size" defaultValue="1024" className="mt-1 w-full rounded-xl bg-slate-950 p-3">
                <option>512</option>
                <option>1024</option>
                <option>2048</option>
              </select>
            </label>
            <label>
              Margin
              <input name="margin" type="number" min="0" max="10" defaultValue="2" className="mt-1 w-full rounded-xl bg-slate-950 p-3" />
            </label>
          </div>
          <button disabled={busy} className="rounded-xl bg-cyan-400 p-3 font-bold text-slate-950">
            {busy ? 'Membuat...' : 'Buat QR'}
          </button>
          {message && <p className="text-red-400">{message}</p>}
        </form>

        <section className="grid min-h-96 place-items-center rounded-2xl border border-slate-800 bg-white p-8">
          {previewSrc ? (
            <div className="text-center">
              <Image src={previewSrc} alt="Preview QR" width={320} height={320} unoptimized className="mx-auto max-h-80 max-w-full" />
              <button onClick={download} className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-white">
                Unduh {preview?.format.toUpperCase()}
              </button>
              <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-slate-600">
                Simpan PNG untuk cetak cepat. Pilih SVG untuk file vektor yang tetap tajam saat diperbesar.
              </p>
            </div>
          ) : (
            <p className="text-slate-500">Preview muncul di sini.</p>
          )}
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Riwayat tersimpan</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {history.map((item) => (
            <article key={item.id} className="flex justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="min-w-0">
                <b>{item.name}</b>
                <p className="truncate text-sm text-slate-500">{item.content}</p>
              </div>
              <button onClick={() => remove(item.id)} className="text-sm text-red-400">Hapus</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
