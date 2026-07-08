import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { getSql } from '@/lib/db';
import { studentPassword, synthEmail, genPin } from '@/lib/students';
import { rateLimit, clientKey } from '@/lib/ratelimit';

async function adminUser() {
  const s = (await auth.getSession()) as any;
  const u = s?.data?.user ?? s?.user ?? null;
  return u && isAdmin(u.email) ? u : null;
}

// Create a real student account in a class the admin owns, returning the PIN.
export async function POST(req: NextRequest) {
  if (!rateLimit(`addstu:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });
  const user = await adminUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false }, { status: 500 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const joinCode = String(b?.joinCode ?? '').trim().toUpperCase();
  const name = String(b?.name ?? '').trim().slice(0, 60);
  if (!joinCode || !name) return NextResponse.json({ ok: false, error: 'missing name or class' }, { status: 400 });

  const owns = (await sql`SELECT 1 FROM classes WHERE join_code = ${joinCode} AND teacher_id = ${user.id}`) as any[];
  if (!owns.length) return NextResponse.json({ ok: false, error: 'ไม่ใช่ห้องของคุณ' }, { status: 403 });
  const dup = (await sql`SELECT 1 FROM students WHERE name = ${name} AND class_code = ${joinCode}`) as any[];
  if (dup.length) return NextResponse.json({ ok: false, error: 'ชื่อนี้มีในห้องแล้ว' });

  const pin = genPin();
  const email = synthEmail();
  const origin = new URL(req.url).origin;
  // Create the Neon Auth account via our own proxy; discard its Set-Cookie so
  // the teacher's session is never replaced by the new student's.
  const up = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ email, password: studentPassword(pin), name }),
  });
  if (!up.ok) {
    console.error('student signup failed:', up.status, await up.text().catch(() => ''));
    return NextResponse.json({ ok: false, error: 'สร้างบัญชีไม่สำเร็จ' }, { status: 500 });
  }
  const ud = await up.json().catch(() => null);
  let authId: string | null = ud?.user?.id ?? ud?.data?.user?.id ?? null;
  if (!authId) {
    const u = (await sql`SELECT id FROM neon_auth."user" WHERE email = ${email}`) as any[];
    authId = u[0]?.id ?? null;
  }
  if (!authId) return NextResponse.json({ ok: false, error: 'no auth id' }, { status: 500 });

  await sql`INSERT INTO students (name, class_code, auth_id, email, pin) VALUES (${name}, ${joinCode}, ${authId}, ${email}, ${pin})`;
  return NextResponse.json({ ok: true, student: { name, pin } });
}
