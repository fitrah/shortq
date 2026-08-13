import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

const googleAnalyticsId = 'G-YZCLZDZXS8';

export const metadata: Metadata = {
  title: { default: 'go.proyek.org — Short Link & QR', template: '%s · go.proyek.org' },
  description: 'Short link, QR code, analytics, dan REST API untuk bisnis Indonesia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `}
      </Script>
    </html>
  );
}
