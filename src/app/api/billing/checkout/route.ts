import { nanoid } from 'nanoid';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { createSnapTransaction } from '@/lib/midtrans';
import { errorResponse, readJson } from '@/lib/validation';

const schema = z.object({ planId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) return errorResponse('Paket tidak valid');
  const [plan, user] = await Promise.all([
    prisma.plan.findFirst({ where: { id: parsed.data.planId, isActive: true } }),
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, email: true } }),
  ]);
  if (!plan || !user) return errorResponse('Paket tidak ditemukan', 404);
  if (plan.price <= 0) return Response.json({ free: true, message: 'Paket Free otomatis berlaku saat tidak ada langganan aktif.' });
  const externalId = `GOP-${Date.now()}-${nanoid(8)}`;
  const order = await prisma.order.create({
    data: { userId: session.userId, planId: plan.id, externalId, amount: plan.price, metadata: { planName: plan.name } },
  });
  try {
    const snap = await createSnapTransaction({
      orderId: externalId,
      amount: plan.price,
      customer: user,
      item: { id: plan.id, name: `Paket ${plan.name}` },
    });
    await prisma.order.update({ where: { id: order.id }, data: { snapToken: snap.token } });
    return Response.json({ orderId: externalId, snapToken: snap.token, redirectUrl: snap.redirectUrl }, { status: 201 });
  } catch (error) {
    await prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } });
    return errorResponse(error instanceof Error ? error.message : 'Gagal membuat transaksi', 503);
  }
}
