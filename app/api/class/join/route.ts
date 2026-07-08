import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';
import crypto from 'node:crypto';

const hashPin = (p: string) => crypto.createHash('sha256').update('cs-pin:' + p).digest('hex');

export async function POST(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, error: 'no db' }, { status: 500 });
  if (!rateLimit(`join:${clientKey(req)}`, 30, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const code = String(b?.joinCode ?? '').trim().toUpperCase().slice(0, 12);
  const name = String(b?.name ?? '').trim().slice(0, 60);
  const pin = String(b?.pin ?? '').trim().slice(0, 10);
  if (!code || !name) return NextResponse.json({ ok: false, error: 'missing name or code' }, { status: 400 });

  try {
    const cls = (await sql`SELECT id, name FROM classes WHERE join_code = ${code}`) as any[];
    if (!cls.length) return NextResponse.json({ ok: false, error: 'ไม่พบรหัสห้องเรียนนี้' });

    const existing = (await sql`SELECT id, pin FROM students WHERE name = ${name} AND class_code = ${code}`) as any[];
    if (existing.length) {
      const st = existing[0];
      if (st.pin) {
        if (!pin) return NextResponse.json({ ok: false, needPin: true, error: 'ชื่อนี้มีคนใช้แล้ว ใส่ PIN เพื่อเข้า' });
        if (hashPin(pin) !== st.pin) return NextResponse.json({ ok: false, needPin: true, error: 'PIN ไม่ถูกต้อง' });
      }
      // no pin set, or pin matched → claim
    } else {
      await sql`INSERT INTO students (name, class_code, pin) VALUES (${name}, ${code}, ${pin ? hashPin(pin) : null})`;
    }
    return NextResponse.json({ ok: true, name, classCode: code, className: cls[0].name });
  } catch (e) {
    console.error('class/join failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
