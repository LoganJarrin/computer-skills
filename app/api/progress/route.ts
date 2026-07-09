import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

function clampInt(v: unknown, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Simple progress model: students identify by name + school + grade (no account,
// no login). Progress is upserted under that identity so teachers can see it.
export async function POST(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false });
  if (!rateLimit(`prog:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const name = String(b.name ?? '').trim().slice(0, 60);
  const school = String(b.school ?? '').trim().slice(0, 80);
  const grade = String(b.grade ?? '').trim().slice(0, 20);
  if (!name || !school || !grade) return NextResponse.json({ ok: false, error: 'name/school/grade required' }, { status: 400 });

  const code = String(b.competence_code ?? '').slice(0, 40);
  const areaNum = clampInt(b.area_num, 0, 99);
  const stars = clampInt(b.stars, 0, 3);
  const correct = clampInt(b.correct, 0, 999);
  const total = clampInt(b.total, 0, 999);
  if (!code) return NextResponse.json({ ok: false, error: 'code required' }, { status: 400 });

  try {
    const s = (await sql`
      INSERT INTO students (name, school, grade) VALUES (${name}, ${school}, ${grade})
      ON CONFLICT (name, school, grade) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`) as { id: number }[];
    const studentId = s[0].id;
    await sql`
      INSERT INTO progress (student_id, area_num, competence_code, stars, correct, total)
      VALUES (${studentId}, ${areaNum}, ${code}, ${stars}, ${correct}, ${total})
      ON CONFLICT (student_id, competence_code) DO UPDATE SET
        stars = GREATEST(progress.stars, EXCLUDED.stars),
        correct = EXCLUDED.correct, total = EXCLUDED.total, updated_at = now()`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('progress POST failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}

// Restore a student's progress by their name + school + grade.
export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, rows: [] });
  if (!rateLimit(`progget:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, rows: [] }, { status: 429 });
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get('name') ?? '').trim().slice(0, 60);
  const school = (searchParams.get('school') ?? '').trim().slice(0, 80);
  const grade = (searchParams.get('grade') ?? '').trim().slice(0, 20);
  if (!name || !school || !grade) return NextResponse.json({ ok: true, rows: [] });
  try {
    const rows = await sql`
      SELECT p.area_num, p.competence_code, p.stars, p.correct, p.total
      FROM progress p JOIN students s ON s.id = p.student_id
      WHERE s.name = ${name} AND s.school = ${school} AND s.grade = ${grade}`;
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    console.error('progress GET failed:', e);
    return NextResponse.json({ ok: false, rows: [] }, { status: 500 });
  }
}
