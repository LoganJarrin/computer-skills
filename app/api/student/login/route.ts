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

  const st = (await sql`SELECT name, email, pin_fails FROM students WHERE id = ${studentId} AND class_code = ${joinCode} AND auth_id IS NOT NULL`) as any[];
  if (!st.length) return NextResponse.json({ ok: false, error: 'ไม่พบนักเรียน' }, { status: 404 });

  // Locked after 10 wrong PINs — only an admin can unlock. Stops distributed
  // brute-force regardless of IP.
  const LOCK_AT = 10;
  if ((st[0].pin_fails ?? 0) >= LOCK_AT)
    return NextResponse.json({ ok: false, locked: true, error: 'บัญชีถูกล็อก บอกคุณครูให้ปลดล็อก' }, { status: 403 });

  const origin = new URL(req.url).origin;
  const login = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ email: st[0].email, password: studentPassword(pin) }),
  });
  if (!login.ok) {
    const nf = (st[0].pin_fails ?? 0) + 1;
    await sql`UPDATE students SET pin_fails = ${nf} WHERE id = ${studentId}`;
    let error: string;
    if (nf >= LOCK_AT) error = 'PIN ผิดหลายครั้ง บัญชีถูกล็อก บอกคุณครูให้ปลดล็อก';
    else if (nf >= 5) error = `PIN ไม่ถูก (ผิด ${nf} ครั้ง, เหลืออีก ${LOCK_AT - nf} ครั้ง) — ถ้าลืม PIN บอกคุณครูได้เลย`;
    else error = 'PIN ไม่ถูกต้อง';
    return NextResponse.json({ ok: false, locked: nf >= LOCK_AT, error }, { status: 401 });
  }

  await sql`UPDATE students SET pin_fails = 0 WHERE id = ${studentId}`; // clear on success
  const res = NextResponse.json({ ok: true, studentId, name: st[0].name, classCode: joinCode });
  for (const c of (login.headers.getSetCookie?.() ?? [])) res.headers.append('set-cookie', c);
  return res;
}
