import { createHash } from 'crypto';
import { safeEqualHex } from '@/lib/security';

export function midtransConfigured() {
  return Boolean(process.env.MIDTRANS_SERVER_KEY && process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY);
}

export function verifyMidtransSignature(input: { order_id: string; status_code: string; gross_amount: string; signature_key: string }) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey || !input.signature_key) return false;
  const expected = createHash('sha512')
    .update(input.order_id + input.status_code + input.gross_amount + serverKey)
    .digest('hex');
  return safeEqualHex(expected, input.signature_key.toLowerCase());
}

export async function createSnapTransaction(input: {
  orderId: string;
  amount: number;
  customer: { name: string; email: string };
  item: { id: string; name: string };
}) {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error('Midtrans belum dikonfigurasi');
  const production = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  const endpoint = production ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      transaction_details: { order_id: input.orderId, gross_amount: input.amount },
      item_details: [{ id: input.item.id, price: input.amount, quantity: 1, name: input.item.name.slice(0, 50) }],
      customer_details: { first_name: input.customer.name.slice(0, 50), email: input.customer.email },
      credit_card: { secure: true },
    }),
  });
  const data = await response.json() as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!response.ok || !data.token) throw new Error(data.error_messages?.join(', ') || 'Midtrans menolak transaksi');
  return { token: data.token, redirectUrl: data.redirect_url || null };
}
