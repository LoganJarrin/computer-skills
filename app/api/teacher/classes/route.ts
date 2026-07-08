import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { jwtFromCookie } from '@/lib/auth/jwt';
import { restInsert } from '@/lib/neon-dataapi';
import { rateLimit, clientKey } from '@/lib/ratelimit';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function genCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// Create a class. Auth comes from the HttpOnly session cookie; the JWT used for
// the RLS-enforced insert is fetched server-side. RLS WITH CHECK guarantees
// teacher_id = auth.user_id().
export async function POST(req: NextRequest) {
  if (!rateLimit(`class:${clientKey(req)}`, 30, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  const s = (await auth.getSession()) as any;
  const user = s?.data?.user ?? s?.user ?? null;
  if (!user || !isAdmin(user.email))
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });

  const origin = new URL(req.url).origin;
  const jwt = await jwtFromCookie(req.headers.get('cookie'), origin);
  if (!jwt) return NextResponse.json({ ok: false, error: 'no session' }, { status: 401 });

  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const name = String(b?.name ?? '').trim().slice(0, 60);
  if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

  try {
    for (let i = 0; i < 6; i++) {
      const code = genCode();
      const res = await restInsert('classes', { teacher_id: user.id, name, join_code: code }, jwt);
      if ('conflict' in res) continue;
      const row = res.rows[0];
      return NextResponse.json({ ok: true, class: { id: row.id, name: row.name, join_code: row.join_code } });
    }
    return NextResponse.json({ ok: false, error: 'could not generate code' }, { status: 500 });
  } catch (e) {
    console.error('createClass failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
