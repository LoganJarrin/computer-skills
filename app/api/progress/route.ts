import { NextRequest, NextResponse } from 'next/server';
import { restSelect, restUpsert } from '@/lib/neon-dataapi';
import { rateLimit, clientKey } from '@/lib/ratelimit';

function clampInt(v: unknown, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function bearer(req: NextRequest): string {
  return (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
}

// Save a logged-in student's progress through the Data API with their JWT.
// RLS WITH CHECK ties every row to the caller's own student record — a child
// cannot write another child's progress even by sending a different student_id.
export async function POST(req: NextRequest) {
  if (!rateLimit(`prog:${clientKey(req)}`, 120, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });
  const jwt = bearer(req);
  if (!jwt) return NextResponse.json({ ok: false, error: 'no token' }, { status: 401 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const studentId = clampInt(b.student_id, 1, 2_000_000_000);
  const code = String(b.competence_code ?? '').slice(0, 40);
  const areaNum = clampInt(b.area_num, 0, 99);
  const stars = clampInt(b.stars, 0, 3);
  const correct = clampInt(b.correct, 0, 999);
  const total = clampInt(b.total, 0, 999);
  if (!code) return NextResponse.json({ ok: false, error: 'code required' }, { status: 400 });

  try {
    const cur = await restSelect('progress', `student_id=eq.${studentId}&competence_code=eq.${encodeURIComponent(code)}&select=stars`, jwt);
    const best = Math.max(stars, cur[0]?.stars ?? 0);
    await restUpsert('progress', { student_id: studentId, area_num: areaNum, competence_code: code, stars: best, correct, total }, 'student_id,competence_code', jwt);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('progress POST failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}

// A logged-in student's own progress (RLS scopes it to them).
export async function GET(req: NextRequest) {
  if (!rateLimit(`progget:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, rows: [] }, { status: 429 });
  const jwt = bearer(req);
  if (!jwt) return NextResponse.json({ ok: true, rows: [] });
  try {
    const rows = await restSelect('progress', 'select=area_num,competence_code,stars,correct,total&limit=1000', jwt);
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    console.error('progress GET failed:', e);
    return NextResponse.json({ ok: false, error: 'server error', rows: [] }, { status: 500 });
  }
}
