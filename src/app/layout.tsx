import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata: Metadata = { title: { default: 'go.proyek.org — Short Link & QR', template: '%s · go.proyek.org' }, description: 'Short link, QR code, analytics, dan REST API untuk bisnis Indonesia.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="min-h-full">{children}</body></html>; }
