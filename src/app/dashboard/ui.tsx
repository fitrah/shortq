'use client';

import { FormEvent, useState } from 'react';

type LinkItem = { id: string; alias: string; targetUrl: string; title: string | null; clickCount: number; isActive: boolean; createdAt: string; updatedAt: string; expiresAt: string | null; hasPassword: boolean };
type Capabilities = { canUsePasswordExpiry: boolean };

const inputClass = 'rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-cyan-400';

export default function DashboardClient({ initialLinks, capabilities }: { initialLinks: LinkItem[]; capabilities: Capabilities }) {
  const [links, setLinks] = useState(initialLinks);
  const [editing, setEditing] = useState<LinkItem | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const canProtect = capabilities.canUsePasswordExpiry;

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    const expires = String(form.get('expiresAt') || '');
    const response = await fetch('/api/links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      targetUrl: form.get('targetUrl'), alias: form.get('alias') || undefined, title: form.get('title') || undefined,
      password: form.get('password') || undefined, expiresAt: expires ? new Date(expires).toISOString() : undefined,
    }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error + (data.details ? `: ${data.details}` : ''));
    setLinks([data, ...links]); event.currentTarget.reset(); setMessage('Link berhasil dibuat.');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget); const expires = String(form.get('expiresAt') || '');
    const payload = {
      targetUrl: form.get('targetUrl'), alias: form.get('alias'), title: form.get('title') || '',
      isActive: form.get('isActive') === 'on', expiresAt: expires ? new Date(expires).toISOString() : null,
      password: form.get('password') || undefined, removePassword: form.get('removePassword') === 'on',
    };
    const response = await fetch(`/api/links/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(data.error + (data.details ? `: ${data.details}` : ''));
    setLinks(links.map((link) => link.id === data.id ? data : link)); setEditing(null); setMessage('Link diperbarui.');
  }

  async function remove(link: LinkItem) {
    if (!confirm(`Hapus /${link.alias}? Analytics ikut terhapus.`)) return;
    const response = await fetch(`/api/links/${link.id}`, { method: 'DELETE' });
    if (response.ok) { setLinks(links.filter((item) => item.id !== link.id)); setMessage('Link dihapus.'); }
    else setMessage((await response.json()).error);
  }

  async function toggle(link: LinkItem) {
    const response = await fetch(`/api/links/${link.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !link.isActive }) });
    const data = await response.json();
    if (response.ok) setLinks(links.map((item) => item.id === link.id ? data : item)); else setMessage(data.error);
  }

  return <main className="mx-auto max-w-7xl px-5 py-10"><section><p className="text-sm font-bold text-cyan-400">SHORT LINKS</p><h1 className="text-4xl font-black">Kelola tautan</h1><p className="mt-2 text-slate-400">Alias, proteksi password, status, dan masa berlaku dalam satu tempat.</p></section>
    <form onSubmit={create} className="mt-8 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-2 lg:grid-cols-4">
      <input required name="targetUrl" type="url" placeholder="https://tujuan.com" className={`${inputClass} lg:col-span-2`} />
      <input name="alias" placeholder="alias-khusus" className={inputClass} /><input name="title" placeholder="Judul" className={inputClass} />
      {canProtect ? <><input name="password" type="password" minLength={4} placeholder="Password opsional" className={inputClass} />
      <label className="text-xs text-slate-400">Kedaluwarsa<input name="expiresAt" type="datetime-local" className={`mt-1 w-full ${inputClass}`} /></label></> : <p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400 md:col-span-2">Password & expiry tersedia mulai paket Pro.</p>}
      <button disabled={busy} className="rounded-xl bg-cyan-400 p-3 font-bold text-slate-950 md:col-span-2">{busy ? 'Memproses…' : 'Pendekkan link'}</button>
    </form>{message && <p className="mt-4 rounded-xl bg-slate-900 p-3 text-sm text-cyan-300">{message}</p>}
    <div className="mt-7 space-y-3">{!links.length && <div className="rounded-2xl border border-dashed border-slate-700 p-12 text-center text-slate-500">Belum ada link.</div>}{links.map((link) => <article key={link.id} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 md:grid-cols-[1fr_auto] md:items-center"><div className="min-w-0"><a href={`/${link.alias}`} target="_blank" className="font-bold text-cyan-400">/{link.alias} ↗</a><div className="truncate text-sm text-slate-500">{link.targetUrl}</div><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className={link.isActive ? 'text-emerald-400' : 'text-red-400'}>{link.isActive ? 'Aktif' : 'Nonaktif'}</span>{link.hasPassword && <span>🔒 Password</span>}{link.expiresAt && <span>Berakhir {new Date(link.expiresAt).toLocaleString('id-ID')}</span>}</div></div><div className="flex flex-wrap items-center gap-2"><div className="mr-3 text-center"><b className="block text-2xl">{link.clickCount}</b><span className="text-xs text-slate-500">klik</span></div><button onClick={() => toggle(link)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">{link.isActive ? 'Jeda' : 'Aktifkan'}</button><button onClick={() => setEditing(link)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Edit</button><button onClick={() => remove(link)} className="rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400">Hapus</button></div></article>)}</div>
    {editing && <div className="fixed inset-0 z-20 grid place-items-center bg-black/70 p-4"><form onSubmit={save} className="w-full max-w-xl space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">Edit /{editing.alias}</h2><button type="button" onClick={() => setEditing(null)}>✕</button></div><input required name="targetUrl" type="url" defaultValue={editing.targetUrl} className={`w-full ${inputClass}`} /><input required name="alias" defaultValue={editing.alias} className={`w-full ${inputClass}`} /><input name="title" defaultValue={editing.title || ''} placeholder="Judul" className={`w-full ${inputClass}`} />{canProtect ? <><input name="password" type="password" minLength={4} placeholder="Password baru (kosong = tidak berubah)" className={`w-full ${inputClass}`} /><label className="block text-sm"><input name="removePassword" type="checkbox" /> Hapus password</label><label className="block text-sm text-slate-400">Kedaluwarsa<input name="expiresAt" type="datetime-local" defaultValue={editing.expiresAt ? editing.expiresAt.slice(0, 16) : ''} className={`mt-1 w-full ${inputClass}`} /></label></> : <><p className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">Password & expiry tersedia mulai paket Pro.</p>{editing.hasPassword && <label className="block text-sm"><input name="removePassword" type="checkbox" /> Hapus password</label>}</>}<label className="block text-sm"><input name="isActive" type="checkbox" defaultChecked={editing.isActive} /> Aktif</label><button disabled={busy} className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950">Simpan perubahan</button></form></div>}
  </main>;
}
