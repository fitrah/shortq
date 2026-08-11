'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell, Input } from '@/components/auth';

export default function Register() { const [error, setError] = useState(''); const router = useRouter(); async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), email: form.get('email'), password: form.get('password') }) }); const data = await response.json(); if (!response.ok) return setError(data.error); router.push('/dashboard'); router.refresh(); } return <AuthShell title="Buat akun gratis" footer={<>Sudah punya akun? <Link className="text-cyan-400" href="/login">Masuk</Link></>}><form onSubmit={submit} className="space-y-4"><Input name="name" type="text" label="Nama" /><Input name="email" type="email" label="Email" /><Input name="password" type="password" minLength={8} label="Password (min. 8 karakter)" />{error && <p className="text-sm text-red-400">{error}</p>}<button className="w-full rounded-xl bg-cyan-400 p-3 font-bold text-slate-950">Daftar</button></form></AuthShell>; }
