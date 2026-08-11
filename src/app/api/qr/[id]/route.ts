import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { errorResponse } from '@/lib/validation';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const { id } = await params;
  const result = await prisma.qrCode.deleteMany({ where: { id, userId: session.userId } });
  if (!result.count) return errorResponse('QR tidak ditemukan', 404);
  return new Response(null, { status: 204 });
}
