import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { studentPassword, isValidPin } from '@/lib/students';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Child login: class code + chosen name + 4-digit PIN. The synthetic email and
// pepper-derived password never reach the browser — we sign in server-side and
// forward only the resulting first-party session cookies to the child.
export async function POST(req: NextRequest) {
  if (!rateLimit(`stulogin:${clientKey(req)}`, 20, 60_000))
    return NextResponse.json({ ok: false, error: 'ลองบ่อยเกินไป รอสักครู่' }, { status: 429 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false }, { status: 500 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const joinCode = String(b?.joinCode ?? '').trim().toUpperCase();
  const studentId = parseInt(String(b?.studentId ?? ''), 10);
  const pin = String(b?.pin ?? '').trim();
  if (!joinCode || !Number.isInteger(studentId) || !isValidPin(pin))
    return NextResponse.json({ ok: false, error: 'ข้อมูลไม่ครบ' }, { status: 400 });

  const st = (await sql`SELECT name, email FROM students WHERE id = ${studentId} AND class_code = ${joinCode} AND auth_id IS NOT NULL`) as any[];
  if (!st.length) return NextResponse.json({ ok: false, error: 'ไม่พบนักเรียน' }, { status: 404 });

  const origin = new URL(req.url).origin;
  const login = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ email: st[0].email, password: studentPassword(pin) }),
  });
  if (!login.ok) return NextResponse.json({ ok: false, error: 'PIN ไม่ถูกต้อง' }, { status: 401 });

  const res = NextResponse.json({ ok: true, studentId, name: st[0].name, classCode: joinCode });
  for (const c of (login.headers.getSetCookie?.() ?? [])) res.headers.append('set-cookie', c);
  return res;
}
