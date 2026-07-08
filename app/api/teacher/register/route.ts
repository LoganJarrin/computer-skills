import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/admins';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Admin sign-up: allowlisted email + shared security code. The code is verified
// by the auth proxy guard (x-signup-code) so it holds on every path.
export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientKey(req)}`, 10, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const email = String(b?.email ?? '').trim().toLowerCase();
  const password = String(b?.password ?? '');
  const name = String(b?.name ?? '').trim() || email;
  const code = String(b?.code ?? '');

  if (!isAdmin(email))
    return NextResponse.json({ ok: false, error: 'อีเมลนี้ไม่ได้รับอนุญาต' }, { status: 403 });
  if (!code)
    return NextResponse.json({ ok: false, error: 'ต้องใส่รหัสรักษาความปลอดภัย' }, { status: 400 });
  if (password.length < 8)
    return NextResponse.json({ ok: false, error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว' }, { status: 400 });

  const origin = new URL(req.url).origin;
  const up = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin, 'x-signup-code': code },
    body: JSON.stringify({ email, name, password }),
  });
  if (!up.ok) {
    if (up.status === 403) return NextResponse.json({ ok: false, error: 'รหัสรักษาความปลอดภัยไม่ถูกต้อง' }, { status: 403 });
    const e = await up.json().catch(() => ({} as any));
    return NextResponse.json({ ok: false, error: e?.message || 'สร้างบัญชีไม่สำเร็จ' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
