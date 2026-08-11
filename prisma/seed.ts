import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();
const plans = [
  { name: 'Free', slug: 'free', description: 'Untuk mencoba dan kebutuhan personal.', price: 0, linkQuota: 25, qrQuota: 10, apiRateLimit: 30, apiKeyQuota: 2, features: ['Custom alias', 'Basic analytics', 'PNG QR'] },
  { name: 'Pro', slug: 'pro', description: 'Untuk kreator dan bisnis yang sedang tumbuh.', price: 99000, linkQuota: 500, qrQuota: 100, apiRateLimit: 120, apiKeyQuota: 10, features: ['Custom alias', 'Advanced analytics', 'Password & expiry', 'PNG/SVG QR'] },
  { name: 'Business', slug: 'business', description: 'Quota besar untuk tim dan integrasi.', price: 299000, linkQuota: 5000, qrQuota: 1000, apiRateLimit: 600, apiKeyQuota: 50, features: ['Custom alias', 'Full analytics', 'Password & expiry', 'PNG/SVG QR', 'High API rate limit', 'Priority support'] },
];

async function main() {
  for (const plan of plans) await db.plan.upsert({ where: { slug: plan.slug }, update: plan, create: plan });
  await db.siteSetting.upsert({ where: { key: 'site.name' }, update: {}, create: { key: 'site.name', value: 'go.proyek.org' } });
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 12) throw new Error('SUPERADMIN_PASSWORD minimal 12 karakter');
    await db.user.upsert({
      where: { email: email.toLowerCase() }, update: { role: 'SUPERADMIN' },
      create: { name: 'Super Admin', email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), role: 'SUPERADMIN' },
    });
    console.log('Superadmin seeded:', email);
  } else console.log('SUPERADMIN_EMAIL/PASSWORD tidak diisi; hanya paket dan pengaturan yang di-seed.');
}
main().finally(() => db.$disconnect());
