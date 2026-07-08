import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Public list of student names in a class, so a child can tap their own name to
// log in. Names only (no PINs) — the PIN is the login secret.
export async function GET(req: NextRequest) {
  if (!rateLimit(`roster:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false }, { status: 500 });
  const code = (new URL(req.url).searchParams.get('code') || '').trim().toUpperCase();
  if (!code) return NextResponse.json({ ok: false, error: 'missing code' }, { status: 400 });

  const cls = (await sql`SELECT name FROM classes WHERE join_code = ${code}`) as any[];
  if (!cls.length) return NextResponse.json({ ok: false, error: 'ไม่พบรหัสห้องเรียนนี้' });
  const students = (await sql`SELECT id, name FROM students WHERE class_code = ${code} AND auth_id IS NOT NULL ORDER BY name`) as any[];
  return NextResponse.json({ ok: true, className: cls[0].name, students });
}
