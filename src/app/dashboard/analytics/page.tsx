'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type LinkOption = { id: string; alias: string; title: string | null };
type TopLink = { id: string; alias: string; title: string | null; clickCount: number };
type Item = { label: string; value: number };
type Analytics = {
  summary: { totalClicks: number; last30Days: number; totalLinks: number };
  timeline: { date: string; value: number }[];
  referrers: Item[];
  browsers: Item[];
  devices: Item[];
  countries: Item[];
  linkOptions: LinkOption[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
  topLinks: TopLink[];
};

function Ranking({ title, items }: { title: string; items: Item[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-bold">{title}</h2><div className="mt-4 space-y-3">{!items.length && <p className="text-sm text-slate-500">Belum ada data.</p>}{items.map((item) => <div key={item.label}><div className="flex justify-between gap-3 text-sm"><span className="truncate">{item.label}</span><span>{item.value}</span></div><div className="mt-1 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-cyan-400" style={{ width: `${item.value / max * 100}%` }} /></div></div>)}</div></section>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [linkId, setLinkId] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const requestAnalytics = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (linkId) params.set('linkId', linkId);
    const response = await fetch(`/api/analytics?${params.toString()}`, { cache: 'no-store' });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error);
    return json as Analytics;
  }, [linkId, page]);

  useEffect(() => {
    let active = true;
    requestAnalytics()
      .then((json) => { if (active) setData(json); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : String(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestAnalytics]);

  const selectedLabel = useMemo(() => data?.linkOptions.find((link) => link.id === linkId)?.alias, [data, linkId]);

  if (error) return <main className="mx-auto max-w-7xl p-8 text-red-400">{error}</main>;
  if (!data) return <main className="mx-auto max-w-7xl p-8 text-slate-400">Memuat analytics...</main>;

  const max = Math.max(...data.timeline.map((item) => item.value), 1);
  const { pagination } = data;

  return <main className="mx-auto max-w-7xl px-5 py-10"><div className="flex flex-wrap items-end justify-between gap-4"><section><p className="text-sm font-bold text-cyan-400">ANALYTICS</p><h1 className="text-4xl font-black">Performa tautan</h1>{selectedLabel && <p className="mt-2 text-sm text-slate-400">Filter aktif: /{selectedLabel}</p>}</section><div className="flex flex-wrap items-center gap-3"><select value={linkId} onChange={(event) => { setLoading(true); setError(''); setLinkId(event.target.value); setPage(1); }} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"><option value="">Semua link</option>{data.linkOptions.map((link) => <option key={link.id} value={link.id}>/{link.alias}{link.title ? ` - ${link.title}` : ''}</option>)}</select><button onClick={() => { setLoading(true); setError(''); requestAnalytics().then(setData).catch((reason) => setError(reason instanceof Error ? reason.message : String(reason))).finally(() => setLoading(false)); }} disabled={loading} className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">{loading ? 'Memuat...' : 'Refresh'}</button></div></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Card label="Total klik" value={data.summary.totalClicks} /><Card label="30 hari terakhir" value={data.summary.last30Days} /><Card label={linkId ? 'Link terfilter' : 'Total link'} value={data.summary.totalLinks} /></div>
    <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-bold">Klik 30 hari terakhir</h2><div className="mt-6 flex h-44 items-end gap-1">{data.timeline.map((item) => <div key={item.date} title={`${item.date}: ${item.value}`} className="group relative flex-1 rounded-t bg-cyan-400/70 hover:bg-cyan-300" style={{ height: `${Math.max(3, item.value / max * 100)}%` }}><span className="absolute -top-6 hidden text-xs group-hover:block">{item.value}</span></div>)}</div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{data.timeline[0]?.date}</span><span>{data.timeline.at(-1)?.date}</span></div></section>
    <div className="mt-5 grid gap-5 md:grid-cols-2"><Ranking title="Referrer" items={data.referrers} /><Ranking title="Browser" items={data.browsers} /><Ranking title="Perangkat" items={data.devices} /><Ranking title="Negara" items={data.countries} /></div>
    <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold">Top links</h2><p className="mt-1 text-xs text-slate-500">{pagination.total} link, halaman {pagination.page} dari {pagination.totalPages}</p></div><div className="flex items-center gap-2"><button onClick={() => { setLoading(true); setError(''); setPage((value) => Math.max(1, value - 1)); }} disabled={pagination.page <= 1 || loading} className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50">Prev</button><button onClick={() => { setLoading(true); setError(''); setPage((value) => Math.min(pagination.totalPages, value + 1)); }} disabled={pagination.page >= pagination.totalPages || loading} className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50">Next</button></div></div>{!data.topLinks.length && <p className="mt-4 text-sm text-slate-500">Belum ada link.</p>}{data.topLinks.map((link) => <div key={link.id} className="mt-3 flex flex-wrap justify-between gap-3 border-b border-slate-800 pb-3"><div className="min-w-0"><span className="block truncate text-cyan-400">/{link.alias}</span>{link.title && <span className="text-xs text-slate-500">{link.title}</span>}</div><b>{link.clickCount} klik</b></div>)}</section>
  </main>;
}

function Card({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="text-3xl font-black text-cyan-400">{value.toLocaleString('id-ID')}</div><div className="text-sm text-slate-400">{label}</div></div>;
}
