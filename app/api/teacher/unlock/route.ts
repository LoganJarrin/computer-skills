import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Admin unlocks a student whose PIN got locked (10 wrong tries). Only the admin
// who owns that student's class can do it.
export async function POST(req: NextRequest) {
  if (!rateLimit(`unlock:${clientKey(req)}`, 30, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  const s = (await auth.getSession()) as any;
  const user = s?.data?.user ?? s?.user ?? null;
  if (!user || !isAdmin(user.email))
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });

  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false }, { status: 500 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const studentId = parseInt(String(b?.studentId ?? ''), 10);
  if (!Number.isInteger(studentId)) return NextResponse.json({ ok: false }, { status: 400 });

  const owns = (await sql`
    SELECT 1 FROM students st JOIN classes c ON c.join_code = st.class_code
    WHERE st.id = ${studentId} AND c.teacher_id = ${user.id}`) as any[];
  if (!owns.length) return NextResponse.json({ ok: false, error: 'not your student' }, { status: 403 });

  await sql`UPDATE students SET pin_fails = 0 WHERE id = ${studentId}`;
  return NextResponse.json({ ok: true });
}
