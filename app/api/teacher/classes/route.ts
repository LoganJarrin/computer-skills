import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

async function getAdminId(): Promise<string | null> {
  const s = (await auth.getSession()) as any;
  const u = s?.data?.user ?? s?.user ?? null;
  return u && isAdmin(u.email) ? (u.id as string) : null;
}

export async function POST(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, error: 'no db' }, { status: 500 });
  const teacherId = await getAdminId();
  if (!teacherId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  if (!rateLimit(`class:${clientKey(req)}`, 30, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const name = String(b?.name ?? '').trim().slice(0, 60);
  if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

  for (let i = 0; i < 6; i++) {
    const code = genCode();
    try {
      const r = (await sql`
        INSERT INTO classes (teacher_id, name, join_code)
        VALUES (${teacherId}, ${name}, ${code})
        RETURNING id, name, join_code`) as any[];
      return NextResponse.json({ ok: true, class: r[0] });
    } catch (e: any) {
      if (String(e?.message ?? '').includes('join_code')) continue; // code collision, retry
      console.error('createClass failed:', e);
      return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: false, error: 'could not generate code' }, { status: 500 });
}
