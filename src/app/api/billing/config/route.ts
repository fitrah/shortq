export async function GET() {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const production = process.env.MIDTRANS_IS_PRODUCTION === 'true';
  return Response.json({ configured: Boolean(clientKey && process.env.MIDTRANS_SERVER_KEY), clientKey, snapJsUrl: production ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js' });
}
