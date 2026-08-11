import ResetForm from './ui';
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token = '' } = await searchParams; return <ResetForm token={token} />; }
