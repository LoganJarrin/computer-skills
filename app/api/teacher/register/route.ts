import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Admin sign-up, gated server-side to the allowlisted emails only.
export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientKey(req)}`, 10, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const email = String(b?.email ?? '').trim().toLowerCase();
  const password = String(b?.password ?? '');
  const name = String(b?.name ?? '').trim() || email;

  if (!isAdmin(email))
    return NextResponse.json({ ok: false, error: 'อีเมลนี้ไม่ได้รับอนุญาตให้สร้างบัญชี' }, { status: 403 });
  if (password.length < 8)
    return NextResponse.json({ ok: false, error: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัว' }, { status: 400 });

  try {
    const res = (await auth.signUp.email({ email, name, password })) as any;
    if (res?.error) return NextResponse.json({ ok: false, error: res.error.message || 'สร้างบัญชีไม่สำเร็จ' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('register failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
