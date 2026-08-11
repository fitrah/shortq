'use client';
import { useEffect, useState } from 'react';

type Analytics = { summary: { totalClicks: number; last30Days: number; totalLinks: number }; timeline: { date: string; value: number }[]; referrers: Item[]; browsers: Item[]; devices: Item[]; countries: Item[]; topLinks: { id: string; alias: string; title: string | null; clickCount: number }[] };
type Item = { label: string; value: number };

function Ranking({ title, items }: { title: string; items: Item[] }) { const max = Math.max(...items.map((item) => item.value), 1); return <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-bold">{title}</h2><div className="mt-4 space-y-3">{!items.length && <p className="text-sm text-slate-500">Belum ada data.</p>}{items.map((item) => <div key={item.label}><div className="flex justify-between text-sm"><span className="truncate">{item.label}</span><span>{item.value}</span></div><div className="mt-1 h-2 rounded bg-slate-800"><div className="h-2 rounded bg-cyan-400" style={{ width: `${item.value / max * 100}%` }} /></div></div>)}</div></section>; }

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null); const [error, setError] = useState('');
  useEffect(() => { fetch('/api/analytics').then(async (response) => { const json = await response.json(); if (!response.ok) throw new Error(json.error); setData(json); }).catch((reason) => setError(String(reason))); }, []);
  if (error) return <main className="mx-auto max-w-7xl p-8 text-red-400">{error}</main>;
  if (!data) return <main className="mx-auto max-w-7xl p-8 text-slate-400">Memuat analytics…</main>;
  const max = Math.max(...data.timeline.map((item) => item.value), 1);
  return <main className="mx-auto max-w-7xl px-5 py-10"><p className="text-sm font-bold text-cyan-400">ANALYTICS</p><h1 className="text-4xl font-black">Performa tautan</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><Card label="Total klik" value={data.summary.totalClicks} /><Card label="30 hari terakhir" value={data.summary.last30Days} /><Card label="Total link" value={data.summary.totalLinks} /></div>
    <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-bold">Klik 30 hari terakhir</h2><div className="mt-6 flex h-44 items-end gap-1">{data.timeline.map((item) => <div key={item.date} title={`${item.date}: ${item.value}`} className="group relative flex-1 rounded-t bg-cyan-400/70 hover:bg-cyan-300" style={{ height: `${Math.max(3, item.value / max * 100)}%` }}><span className="absolute -top-6 hidden text-xs group-hover:block">{item.value}</span></div>)}</div><div className="mt-2 flex justify-between text-xs text-slate-500"><span>{data.timeline[0]?.date}</span><span>{data.timeline.at(-1)?.date}</span></div></section>
    <div className="mt-5 grid gap-5 md:grid-cols-2"><Ranking title="Referrer" items={data.referrers} /><Ranking title="Browser" items={data.browsers} /><Ranking title="Perangkat" items={data.devices} /><Ranking title="Negara" items={data.countries} /></div>
    <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5"><h2 className="font-bold">Top links</h2>{data.topLinks.map((link) => <div key={link.id} className="mt-3 flex justify-between border-b border-slate-800 pb-3"><span className="text-cyan-400">/{link.alias}</span><b>{link.clickCount} klik</b></div>)}</section>
  </main>;
}
function Card({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5"><div className="text-3xl font-black text-cyan-400">{value.toLocaleString('id-ID')}</div><div className="text-sm text-slate-400">{label}</div></div>; }
