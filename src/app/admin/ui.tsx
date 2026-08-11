'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PLAN_FEATURES } from '@/lib/plan-features';

type Resource = 'plans' | 'users' | 'subscriptions' | 'orders' | 'settings';
type Row = Record<string, unknown>;
type RowState = { resource: Resource; rows: Row[]; loading: boolean };
const configs: Record<Resource, { label: string; template: Row; editable: string[] }> = {
  plans: { label: 'Paket & harga', template: { name: 'Pro', slug: 'pro', description: '', price: 99000, currency: 'IDR', durationDays: 30, linkQuota: 500, qrQuota: 100, apiRateLimit: 120, apiKeyQuota: 10, features: ['Custom alias', 'Advanced analytics', 'Password & expiry', 'PNG/SVG QR'], isActive: true }, editable: ['name', 'slug', 'description', 'price', 'currency', 'durationDays', 'linkQuota', 'qrQuota', 'apiRateLimit', 'apiKeyQuota', 'features', 'isActive'] },
  users: { label: 'Users', template: { name: '', email: '', password: '', role: 'USER', isActive: true }, editable: ['name', 'email', 'role', 'isActive'] },
  subscriptions: { label: 'Subscriptions', template: { userId: '', planId: '', status: 'ACTIVE', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString() }, editable: ['planId', 'status', 'startsAt', 'endsAt'] },
  orders: { label: 'Orders', template: { userId: '', planId: '', externalId: '', amount: 0, status: 'PENDING', snapToken: null, metadata: {} }, editable: ['amount', 'status', 'snapToken', 'metadata'] },
  settings: { label: 'Site settings', template: { key: 'site.name', value: 'go.proyek.org' }, editable: ['value'] },
};

function asText(value: unknown, fallback = '-') {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}
function asOptionalRow(value: unknown) { return value && typeof value === 'object' ? value as Row : null; }
function rowId(resource: Resource, row: Row, index?: number) {
  const value = resource === 'settings' ? row.key : row.id;
  return asText(value, `${resource}-${index ?? 'unknown'}`);
}
function title(resource: Resource, row: Row) {
  if (resource === 'plans') {
    const price = typeof row.price === 'number' ? row.price.toLocaleString('id-ID') : asText(row.price, '0');
    return `${asText(row.name, 'Paket tanpa nama')} · Rp${price}`;
  }
  if (resource === 'users') return `${asText(row.name, 'User tanpa nama')} · ${asText(row.email, 'email belum ada')}`;
  if (resource === 'subscriptions') {
    const user = asOptionalRow(row.user);
    const plan = asOptionalRow(row.plan);
    return `${asText(user?.email ?? row.userId, 'user belum ada')} → ${asText(plan?.name ?? row.planId, 'paket belum ada')}`;
  }
  if (resource === 'orders') return `${asText(row.externalId, 'Order tanpa external ID')} · ${asText(row.status)}`;
  return asText(row.key, 'Setting tanpa key');
}
function editablePayload(resource: Resource, row: Row) { const result: Row = {}; for (const key of configs[resource].editable) if (row[key] !== undefined) result[key] = row[key]; return result; }
function normalizeRows(data: unknown) { return Array.isArray(data) ? data.filter((row): row is Row => row !== null && typeof row === 'object') : []; }
function parsePayload(payload: string) {
  try {
    const value = JSON.parse(payload) as unknown;
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Row : null;
  } catch {
    return null;
  }
}

export default function AdminClient() {
  const [resource, setResource] = useState<Resource>('plans'); const [rowState, setRowState] = useState<RowState>({ resource: 'plans', rows: [], loading: true }); const [selected, setSelected] = useState<string | null>(null); const [payload, setPayload] = useState(JSON.stringify(configs.plans.template, null, 2)); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const config = configs[resource];
  const rows = useMemo(() => rowState.resource === resource ? rowState.rows : [], [resource, rowState]);
  const loadingRows = rowState.resource === resource && rowState.loading;
  const parsedPayload = useMemo(() => parsePayload(payload), [payload]);
  const selectedFeatures = useMemo(() => new Set(Array.isArray(parsedPayload?.features) ? parsedPayload.features.map(String) : []), [parsedPayload]);
  async function load(target: Resource = resource) {
    setRowState({ resource: target, rows: [], loading: true });
    const response = await fetch(`/api/admin/${target}`);
    const data = await response.json();
    if (!response.ok) {
      setRowState({ resource: target, rows: [], loading: false });
      return setMessage(asText((data as Row)?.error, 'Gagal memuat data admin.'));
    }
    setRowState({ resource: target, rows: normalizeRows(data), loading: false });
  }
  useEffect(() => {
    const target = resource;
    const controller = new AbortController();
    fetch(`/api/admin/${resource}`, { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        setRowState({ resource: target, rows: [], loading: false });
        setMessage(asText(data.error, 'Gagal memuat data admin.'));
      } else setRowState({ resource: target, rows: normalizeRows(data), loading: false });
    }).catch((error) => {
      if (controller.signal.aborted || error?.name === 'AbortError') return;
      setRowState({ resource: target, rows: [], loading: false });
      setMessage('Gagal memuat data admin.');
    });
    return () => { controller.abort(); };
  }, [resource]);
  const counts = useMemo(() => rows.length, [rows]);
  function changeResource(next: Resource) { setResource(next); setRowState({ resource: next, rows: [], loading: true }); setSelected(null); setPayload(JSON.stringify(configs[next].template, null, 2)); setMessage(''); }
  function select(row: Row, index: number) { setSelected(rowId(resource, row, index)); setPayload(JSON.stringify(editablePayload(resource, row), null, 2)); }
  function reset() { setSelected(null); setPayload(JSON.stringify(config.template, null, 2)); }
  function toggleFeature(feature: string, checked: boolean) {
    const current = parsePayload(payload);
    if (!current) return setMessage('JSON tidak valid, checklist feature belum bisa mengubah payload.');
    const features = new Set(Array.isArray(current.features) ? current.features.map(String) : []);
    if (checked) features.add(feature); else features.delete(feature);
    setPayload(JSON.stringify({ ...current, features: [...features] }, null, 2));
  }
  async function save() { let data: unknown; try { data = JSON.parse(payload); } catch { return setMessage('JSON tidak valid.'); } setBusy(true); const id = selected ? encodeURIComponent(selected) : ''; const response = await fetch(selected ? `/api/admin/${resource}/${id}` : `/api/admin/${resource}`, { method: selected ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = response.status === 204 ? null : await response.json(); setBusy(false); if (!response.ok) return setMessage(result?.error + (result?.details ? `: ${result.details}` : '')); setMessage(selected ? 'Data diperbarui.' : 'Data dibuat.'); reset(); await load(); }
  async function remove(row: Row, index: number) { const id = rowId(resource, row, index); if (!confirm(`Hapus ${title(resource, row)}?`)) return; const response = await fetch(`/api/admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (!response.ok) { const data = await response.json(); return setMessage(data.error); } setMessage('Data dihapus.'); if (selected === id) reset(); await load(); }
  return <main className="min-h-screen bg-slate-950 px-5 py-8 text-white"><div className="mx-auto max-w-7xl"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold text-amber-400">SUPERADMIN</p><h1 className="text-3xl font-black">Control panel</h1></div><Link href="/dashboard" className="rounded-xl border border-slate-700 px-4 py-2">Kembali ke dashboard</Link></header><nav className="mt-8 flex flex-wrap gap-2">{(Object.keys(configs) as Resource[]).map((key) => <button key={key} onClick={() => changeResource(key)} className={`rounded-xl px-4 py-2 text-sm ${resource === key ? 'bg-amber-400 font-bold text-slate-950' : 'bg-slate-900 text-slate-300'}`}>{configs[key].label}</button>)}</nav><div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex justify-between"><h2 className="text-xl font-bold">{config.label} ({counts})</h2><button onClick={reset} className="text-sm text-cyan-400">+ Baru</button></div>{loadingRows && <p className="mt-4 text-slate-500">Memuat…</p>}<div className="mt-4 max-h-[65vh] space-y-2 overflow-auto">{rows.map((row, index) => { const id = rowId(resource, row, index); return <article key={id} className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${selected === id ? 'border-amber-400' : 'border-slate-800'}`}><button onClick={() => select(row, index)} className="min-w-0 flex-1 text-left"><b className="block truncate">{title(resource, row)}</b><span className="text-xs text-slate-500">ID: {id}{row.isActive === false ? ' · nonaktif' : ''}</span></button><button onClick={() => remove(row, index)} className="text-sm text-red-400">Hapus</button></article>; })}</div></section><section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="text-xl font-bold">{selected ? 'Edit data' : 'Buat data'}</h2><p className="mt-1 text-xs text-slate-500">Editor JSON memungkinkan seluruh field harga, quota, fitur, status, dan relasi dikelola.</p>{resource === 'plans' && <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4"><p className="text-sm font-bold text-slate-300">Features</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{PLAN_FEATURES.map((feature) => <label key={feature} className="flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2 text-sm text-slate-300"><input type="checkbox" checked={selectedFeatures.has(feature)} onChange={(event) => toggleFeature(feature, event.target.checked)} />{feature}</label>)}</div></div>}<textarea value={payload} onChange={(event) => setPayload(event.target.value)} spellCheck={false} className="mt-4 h-[52vh] w-full rounded-xl bg-slate-950 p-4 font-mono text-sm text-cyan-100" /><button disabled={busy} onClick={save} className="mt-3 w-full rounded-xl bg-amber-400 p-3 font-bold text-slate-950">{busy ? 'Menyimpan…' : selected ? 'Simpan perubahan' : 'Buat data'}</button>{message && <p className="mt-3 rounded-lg bg-slate-950 p-3 text-sm text-cyan-300">{message}</p>}</section></div></div></main>;
}
