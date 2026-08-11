import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { errorResponse } from '@/lib/validation';

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return errorResponse('Unauthorized', 401);
  const { id } = await params;
  const result = await prisma.apiKey.updateMany({
    where: { id, userId: session.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) return errorResponse('API key tidak ditemukan atau sudah dicabut', 404);
  return new Response(null, { status: 204 });
}
