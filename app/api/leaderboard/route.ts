import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET() {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false, rows: [] });
  try {
    const rows: any[] = await sql`
      SELECT s.name, s.class_code, COALESCE(SUM(p.stars), 0)::int AS stars
      FROM students s LEFT JOIN progress p ON p.student_id = s.id
      GROUP BY s.id, s.name, s.class_code
      HAVING s.name NOT LIKE '\\_\\_%'
      ORDER BY stars DESC, s.name ASC
      LIMIT 20`;
    return NextResponse.json({ ok: true, rows: rows.map((r) => ({ name: r.name, classCode: r.class_code, stars: r.stars, xp: r.stars * 20 })) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e), rows: [] }, { status: 500 });
  }
}
