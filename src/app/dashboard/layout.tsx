import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';

const navigation = [
  ['/dashboard', 'Links'], ['/dashboard/analytics', 'Analytics'], ['/dashboard/qr', 'QR Code'],
  ['/dashboard/api-keys', 'API Keys'], ['/dashboard/billing', 'Paket'], ['/dashboard/settings', 'Akun'],
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return <div className="min-h-screen bg-slate-950 text-white"><header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 shadow-2xl shadow-black/20 backdrop-blur"><div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-4"><Link href="/dashboard" className="mr-auto text-xl font-black"><span className="text-cyan-400">go.</span>proyek.org</Link><nav className="flex flex-wrap gap-1 text-sm">{navigation.map(([href, label]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white">{label}</Link>)}{session.role === 'SUPERADMIN' && <Link href="/admin" className="rounded-lg px-3 py-2 text-amber-300 hover:bg-slate-800">Superadmin</Link>}</nav><form action="/api/auth/logout" method="post"><button className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white">Keluar</button></form></div></header>{children}</div>;
}
