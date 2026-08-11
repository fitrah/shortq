import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyMidtransSignature } from '@/lib/midtrans';
import { errorResponse, readJson } from '@/lib/validation';

const schema = z.object({
  order_id: z.string().min(1),
  status_code: z.string().min(3),
  gross_amount: z.string().min(1),
  signature_key: z.string().min(1),
  transaction_status: z.string().min(1),
  fraud_status: z.string().optional(),
  payment_type: z.string().optional(),
  transaction_id: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Payload webhook tidak valid', 400);
  if (!verifyMidtransSignature(parsed.data)) return errorResponse('Signature webhook tidak valid', 401);
  const order = await prisma.order.findUnique({ where: { externalId: parsed.data.order_id }, include: { plan: true } });
  if (!order) return errorResponse('Order tidak ditemukan', 404);
  if (Number(parsed.data.gross_amount) !== order.amount) return errorResponse('Nominal webhook tidak cocok', 400);

  const status = parsed.data.transaction_status;
  const paid = (status === 'settlement' || status === 'capture') && parsed.data.fraud_status !== 'deny';
  const orderStatus = paid ? 'PAID'
    : ['deny', 'failure'].includes(status) ? 'FAILED'
      : ['cancel', 'expire'].includes(status) ? 'EXPIRED'
        : ['refund', 'partial_refund'].includes(status) ? 'REFUNDED'
          : 'PENDING';
  const metadata = {
    paymentType: parsed.data.payment_type || null,
    transactionId: parsed.data.transaction_id || null,
    transactionStatus: status,
    fraudStatus: parsed.data.fraud_status || null,
  };

  if (paid) {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + order.plan.durationDays * 86_400_000);
    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', metadata } }),
      prisma.subscription.updateMany({ where: { userId: order.userId, status: 'ACTIVE', orderId: { not: order.id } }, data: { status: 'CANCELED' } }),
      prisma.subscription.upsert({
        where: { orderId: order.id },
        create: { orderId: order.id, userId: order.userId, planId: order.planId, status: 'ACTIVE', startsAt, endsAt },
        update: { status: 'ACTIVE', startsAt, endsAt },
      }),
    ]);
  } else {
    await prisma.order.update({ where: { id: order.id }, data: { status: orderStatus, metadata } });
    if (orderStatus === 'REFUNDED') {
      await prisma.subscription.updateMany({ where: { orderId: order.id }, data: { status: 'CANCELED', endsAt: new Date() } });
    }
  }
  return Response.json({ received: true });
}
