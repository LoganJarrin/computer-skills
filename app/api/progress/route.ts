import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function POST(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false });
  let b: any;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 }); }

  const name = String(b.name ?? '').trim().slice(0, 80);
  const classCode = String(b.classCode ?? '').trim().slice(0, 40);
  if (!name) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });

  const areaNum = Number(b.areaNum) || 0;
  const code = String(b.code ?? '').slice(0, 10);
  const stars = Math.max(0, Math.min(3, Number(b.stars) || 0));
  const correct = Number(b.correct) || 0;
  const total = Number(b.total) || 0;

  try {
    const s: any[] = await sql`
      INSERT INTO students (name, class_code) VALUES (${name}, ${classCode})
      ON CONFLICT (name, class_code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id`;
    const studentId = s[0].id;
    await sql`
      INSERT INTO progress (student_id, area_num, competence_code, stars, correct, total)
      VALUES (${studentId}, ${areaNum}, ${code}, ${stars}, ${correct}, ${total})
      ON CONFLICT (student_id, competence_code) DO UPDATE SET
        stars = GREATEST(progress.stars, EXCLUDED.stars),
        correct = EXCLUDED.correct, total = EXCLUDED.total, updated_at = now()`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false, rows: [] });
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get('name') ?? '').trim();
  const classCode = (searchParams.get('classCode') ?? '').trim();
  if (!name) return NextResponse.json({ ok: true, rows: [] });
  try {
    const rows: any[] = await sql`
      SELECT p.area_num, p.competence_code, p.stars, p.correct, p.total
      FROM progress p JOIN students s ON s.id = p.student_id
      WHERE s.name = ${name} AND s.class_code = ${classCode}
      ORDER BY p.area_num, p.competence_code`;
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e), rows: [] }, { status: 500 });
  }
}
