import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

function clampInt(v: unknown, min: number, max: number): number {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export async function POST(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false });
  if (!rateLimit(`prog:${clientKey(req)}`, 40, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  let raw: unknown;
  try { raw = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const b = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const name = String(b.name ?? '').trim().slice(0, 60);
  const classCode = String(b.classCode ?? '').trim().slice(0, 30);
  if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

  const areaNum = clampInt(b.areaNum, 0, 99);
  const code = String(b.code ?? '').slice(0, 10);
  const stars = clampInt(b.stars, 0, 3);
  const correct = clampInt(b.correct, 0, 999);
  const total = clampInt(b.total, 0, 999);

  try {
    const s = (await sql`
      INSERT INTO students (name, class_code) VALUES (${name}, ${classCode})
      ON CONFLICT (name, class_code) DO UPDATE SET name = EXCLUDED.name
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

export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false, rows: [] });
  if (!rateLimit(`progget:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests', rows: [] }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const name = (searchParams.get('name') ?? '').trim().slice(0, 60);
  const classCode = (searchParams.get('classCode') ?? '').trim().slice(0, 30);
  if (!name) return NextResponse.json({ ok: true, rows: [] });
  try {
    const rows = await sql`
      SELECT p.area_num, p.competence_code, p.stars, p.correct, p.total
      FROM progress p JOIN students s ON s.id = p.student_id
      WHERE s.name = ${name} AND s.class_code = ${classCode}
      ORDER BY p.area_num, p.competence_code`;
    return NextResponse.json({ ok: true, rows });
  } catch (e) {
    console.error('progress GET failed:', e);
    return NextResponse.json({ ok: false, error: 'server error', rows: [] }, { status: 500 });
  }
}
