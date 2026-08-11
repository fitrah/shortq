# go.proyek.org

Platform full-stack URL shortener, QR generator, analytics, REST API, subscription, dan administrasi berbasis Next.js 16, PostgreSQL, dan Prisma.

## Modul

- **Auth:** register/login/logout, forgot/reset melalui delivery webhook, change password, bcrypt, cookie JWT HttpOnly, dan invalidasi sesi setelah perubahan password/status user.
- **Short link:** create/read/edit/delete, alias, target, status aktif, password, expiry, kuota paket, serta halaman password untuk visitor.
- **Analytics:** click count, timeline 30 hari, referrer, browser, device, country, top link, dan salted IP hash.
- **QR:** UI preview/riwayat, kustom warna/ukuran/margin, unduh PNG atau SVG, dan quota enforcement.
- **REST API v1:** Bearer API key, scopes, PostgreSQL-backed per-minute rate limit, link CRUD, analytics, QR, serta OpenAPI 3.1 di `/api/v1/openapi.json` dan UI `/docs`.
- **API key:** secret acak hanya tampil sekali, HMAC hash-at-rest, prefix, scopes, rate limit, last-used, revoke.
- **Paket & billing:** Free/Pro/Business seed, quota, Midtrans Snap sandbox/production, order history, dan webhook dengan verifikasi signature SHA-512 + nominal.
- **Superadmin:** CRUD paket/harga/quota/features, user, subscription, order, dan site setting melalui `/admin` serta endpoint terproteksi role.

## Setup development

```bash
cp .env.example .env
# Isi DATABASE_URL dan random secret development.
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

`SUPERADMIN_EMAIL` dan `SUPERADMIN_PASSWORD` opsional saat seed; password harus minimal 12 karakter. Seed tidak membuat credential default.

## Environment penting

- `JWT_SECRET`: random minimal 32 karakter (wajib di production).
- `API_KEY_PEPPER`: random independen minimal 32 karakter (wajib di production).
- `IP_HASH_SALT`: random minimal 32 karakter (wajib di production).
- `NEXT_PUBLIC_BASE_URL`: origin publik tanpa trailing slash.
- `MIDTRANS_SERVER_KEY`: server key; jangan pernah diekspos ke browser.
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`: client key Snap yang memang bersifat publik.
- `MIDTRANS_IS_PRODUCTION`: `true` hanya untuk akun production.
- `PASSWORD_RESET_WEBHOOK_URL`: endpoint mailer internal/provider yang menerima JSON `{to, template, resetUrl, expiresInMinutes}`.
- `PASSWORD_RESET_WEBHOOK_TOKEN`: Bearer token opsional untuk delivery webhook.
- `RESEND_API_KEY`: fallback pengiriman email reset password jika webhook kosong.
- `PASSWORD_RESET_FROM_EMAIL`: sender reset password, default `go.proyek.org <noreply@notify.proyek.org>`.

Daftarkan notification URL Midtrans ke:

```text
https://go.proyek.org/api/billing/webhook
```

Webhook hanya menerima payload dengan signature Midtrans valid dan nominal yang sama dengan order lokal. Jangan menaruh secret nyata di source control.

## Quality gates

```bash
npm run db:generate
npm run lint
npm run typecheck
npm test
npm run build
```

## Production

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
pm2 start ecosystem.config.cjs
```

Gunakan TLS, PostgreSQL backup, environment secret manager, dan delivery webhook email yang terautentikasi. Migrasi awal tersedia di `prisma/migrations/20260810000000_init`.
