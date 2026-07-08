import { NextRequest, NextResponse } from 'next/server';
import { jwtFromCookie } from '@/lib/auth/jwt';
import { restSelect, restUpsert } from '@/lib/neon-dataapi';
import { rateLimit, clientKey } from '@/lib/ratelimit';

function clampInt(v: unknown, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Resolve the caller's own student row via RLS (students_own_read returns only
// the row whose auth_id = auth.user_id()). The browser never names a student.
async function ownStudentId(jwt: string): Promise<number | null> {
  const me = await restSelect('students', 'select=id&limit=1', jwt);
  return me[0]?.id ?? null;
}

// Save the logged-in student's progress. Identity comes from the HttpOnly
// session cookie (server-fetched JWT), never from the request body, and RLS
// re-checks ownership — a child cannot write anyone else's progress.
export async function POST(req: NextRequest) {
  if (!rateLimit(`prog:${clientKey(req)}`, 120, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });
  const origin = new URL(req.url).origin;
  const jwt = await jwtFromCookie(req.headers.get('cookie'), origin);
  if (!jwt) return NextResponse.json({ ok: false, error: 'not signed in' }, { status: 401 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const code = String(b.competence_code ?? '').slice(0, 40);
  const areaNum = clampInt(b.area_num, 0, 99);
  const stars = clampInt(b.stars, 0, 3);
  const correct = clampInt(b.correct, 0, 999);
  const total = clampInt(b.total, 0, 999);
  if (!code) return NextResponse.json({ ok: false, error: 'code required' }, { status: 400 });

  try {
    const studentId = await ownStudentId(jwt);
    if (!studentId) return NextResponse.json({ ok: false, error: 'not a student account' }, { status: 400 });
    const cur = await restSelect('progress', `student_id=eq.${studentId}&competence_code=eq.${encodeURIComponent(code)}&select=stars`, jwt);
    const best = Math.max(stars, cur[0]?.stars ?? 0);
    await restUpsert('progress', { student_id: studentId, area_num: areaNum, competence_code: code, stars: best, correct, total }, 'student_id,competence_code', jwt);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('progress POST failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}

// The logged-in student's own progress (RLS scopes it to them).
export async function GET(req: NextRequest) {
  if (!rateLimit(`progget:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, rows: [] }, { status: 429 });
  const origin = new URL(req.url).origin;
  const jwt = await jwtFromCookie(req.headers.get('cookie'), origin);
  if (!jwt) return NextResponse.json({ ok: true, rows: [] });
  try {
    const rows = await restSelect('progress', 'select=area_num,competence_code,stars,correct,total&limit=1000', jwt);
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    console.error('progress GET failed:', e);
    return NextResponse.json({ ok: false, error: 'server error', rows: [] }, { status: 500 });
  }
}
