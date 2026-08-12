import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Donasi',
  description: 'Dukung Kanezza Gadget melalui QRIS resmi.',
};

export default function DonationPage() {
  return <main className="min-h-screen bg-zinc-950 text-white">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/85 shadow-2xl shadow-black/20 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="text-xl font-black"><span className="text-cyan-400">go.</span>proyek.org</Link>
        <div className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/pricing" className="hidden px-2 py-2 text-zinc-300 sm:block">Harga</Link>
          <Link href="/login" className="px-2 py-2 text-zinc-300">Masuk</Link>
          <Link href="/" className="rounded-xl bg-cyan-400 px-3 py-2 font-bold text-zinc-950 sm:px-4">ShortQ</Link>
        </div>
      </nav>
    </header>

    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-14">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-red-300">Donasi QRIS</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Dukung pengembangan Kanezza Gadget.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">Scan QRIS di halaman ini dari aplikasi pembayaran yang mendukung QRIS. QRIS ditampilkan langsung agar mudah dibuka dari browser HP maupun desktop.</p>
        <div className="mt-7 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-bold text-white">Merchant</p>
            <p className="mt-1">Kanezza - Gadget</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-bold text-white">NMID</p>
            <p className="mt-1 break-all">ID1026526822311</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="font-bold text-white">Metode</p>
            <p className="mt-1">QRIS Nasional</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white p-3 shadow-2xl shadow-black/30 sm:p-4">
        <Image
          src="/images/qris-donasi-kanezza.jpg"
          alt="QRIS donasi Kanezza Gadget"
          width={916}
          height={1280}
          priority
          className="h-auto w-full rounded-xl"
        />
      </div>
    </section>
  </main>;
}
