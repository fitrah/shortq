import Link from 'next/link';
import GuestTools from '@/components/guest-tools';

const features = [
  ['Cepat', 'Short link langsung aktif dengan alias otomatis atau alias pilihan.'],
  ['Tanpa login', 'Guest bisa membuat 2 short link dan 2 QR setiap hari dari browser yang sama.'],
  ['QR praktis', 'Generate QR PNG untuk URL atau teks tanpa masuk dashboard.'],
  ['Upgrade rapi', 'Daftar akun saat butuh riwayat, analytics, API, atau kuota lebih besar.'],
];

const plans = [
  ['Guest', 'Gratis tanpa login', '2 short link/hari', '2 QR/hari', 'Coba langsung dari landing page'],
  ['Free', 'Gratis dengan akun', '25 short link', '10 QR tersimpan', 'Basic analytics'],
  ['Pro', 'Rp99.000/30 hari', '500 short link', '100 QR', 'Password, expiry, SVG QR'],
  ['Business', 'Rp299.000/30 hari', '5.000 short link', '1.000 QR', 'API analytics dan rate limit tinggi'],
];

export default function Home() {
  return <main className="min-h-screen bg-slate-950 text-white">
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/85 shadow-2xl shadow-black/20 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="text-xl font-black"><span className="text-cyan-400">go.</span>proyek.org</div>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <a href="#harga" className="hidden px-2 py-2 text-slate-300 sm:block">Harga</a>
          <Link href="/donasi" className="hidden px-2 py-2 text-slate-300 sm:block">Donasi</Link>
          <Link href="/login" className="px-2 py-2">Masuk</Link>
          <a href="#gratis" className="rounded-xl bg-cyan-400 px-3 py-2 font-bold text-slate-950 sm:px-4">Coba Gratis</a>
        </div>
      </nav>
    </header>

    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-20">
      <div>
        <div className="mb-5 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">Gratis tanpa login untuk mulai</div>
        <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl">Bikin short link dan QR tanpa ribet.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Langsung pakai sebagai Guest: 2 short link dan 2 QR gratis per hari, tanpa daftar akun. Upgrade kalau butuh dashboard, analytics, API, dan kuota lebih besar.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#gratis" className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950">Coba tanpa login</a>
          <a href="#harga" className="rounded-xl border border-slate-700 px-5 py-3">Lihat paket</a>
        </div>
      </div>
      <GuestTools />
    </section>

    <section id="fitur" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 className="text-3xl font-black">Yang bisa dipakai langsung</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([heading, copy]) => <article key={heading} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-lg font-bold">{heading}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
        </article>)}
      </div>
    </section>

    <section id="harga" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-cyan-300">PAKET</p>
          <h2 className="text-3xl font-black">Mulai gratis, naik saat perlu</h2>
        </div>
        <Link href="/pricing" className="text-sm font-bold text-cyan-300">Detail harga</Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map(([name, price, linkQuota, qrQuota, note]) => <article key={name} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="text-2xl font-black">{name}</h3>
          <p className="mt-2 min-h-10 text-sm text-slate-400">{price}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-200">
            <li>{linkQuota}</li>
            <li>{qrQuota}</li>
            <li>{note}</li>
          </ul>
        </article>)}
      </div>
    </section>

    <footer className="border-t border-slate-800 py-8 text-center text-sm text-slate-500">© 2026 go.proyek.org · Short link dan QR untuk bisnis modern. <Link href="/donasi" className="text-cyan-300">Donasi</Link></footer>
  </main>;
}
