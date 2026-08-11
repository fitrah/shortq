import { z } from 'zod';
import { emailSchema, passwordSchema } from '@/lib/validation';
import { PLAN_FEATURES } from '@/lib/plan-features';

export const planAdminSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,50}$/),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.number().int().min(0).max(2_000_000_000),
  currency: z.string().trim().length(3).default('IDR'),
  durationDays: z.number().int().min(1).max(3650).default(30),
  linkQuota: z.number().int().min(0).max(10_000_000),
  qrQuota: z.number().int().min(0).max(10_000_000),
  apiRateLimit: z.number().int().min(1).max(100_000),
  apiKeyQuota: z.number().int().min(0).max(1000),
  features: z.array(z.enum(PLAN_FEATURES)).max(100),
  isActive: z.boolean().default(true),
});
export const planAdminUpdateSchema = planAdminSchema.partial();

export const userAdminSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['USER', 'SUPERADMIN']).default('USER'),
  isActive: z.boolean().default(true),
});
export const userAdminUpdateSchema = userAdminSchema.partial();

export const subscriptionAdminSchema = z.object({
  userId: z.string().min(1), planId: z.string().min(1),
  status: z.enum(['ACTIVE', 'CANCELED', 'EXPIRED', 'PENDING']).default('ACTIVE'),
  startsAt: z.string().datetime().optional().nullable(), endsAt: z.string().datetime().optional().nullable(),
});
export const subscriptionAdminUpdateSchema = subscriptionAdminSchema.omit({ userId: true }).partial();

export const orderAdminSchema = z.object({
  userId: z.string().min(1), planId: z.string().min(1), externalId: z.string().trim().min(3).max(120),
  amount: z.number().int().min(0), status: z.enum(['PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED']).default('PENDING'),
  snapToken: z.string().max(500).optional().nullable(), metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});
export const orderAdminUpdateSchema = orderAdminSchema.omit({ userId: true, planId: true, externalId: true }).partial();

export const settingAdminSchema = z.object({ key: z.string().trim().regex(/^[a-zA-Z0-9._-]{2,100}$/), value: z.unknown() });
