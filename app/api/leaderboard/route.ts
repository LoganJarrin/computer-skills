import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Leaderboard scoped to the student's own school + grade (passed as query params
// from localStorage). Names + stars only.
export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, rows: [] });
  if (!rateLimit(`lb:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests', rows: [] }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const school = (searchParams.get('school') ?? '').trim().slice(0, 80);
  const grade = (searchParams.get('grade') ?? '').trim().slice(0, 20);
  if (!school || !grade) return NextResponse.json({ ok: true, scoped: false, rows: [] });

  try {
    const rows = (await sql`
      SELECT s.name, COALESCE(SUM(p.stars), 0)::int AS stars
      FROM students s LEFT JOIN progress p ON p.student_id = s.id
      WHERE s.school = ${school} AND s.grade = ${grade} AND s.name NOT LIKE '\\_\\_%'
      GROUP BY s.id, s.name
      ORDER BY stars DESC, s.name ASC
      LIMIT 50`) as any[];
    return NextResponse.json({ ok: true, scoped: true, school, grade, rows: rows.map((r) => ({ name: r.name, stars: r.stars, xp: r.stars * 20 })) });
  } catch (e) {
    console.error('leaderboard GET failed:', e);
    return NextResponse.json({ ok: false, rows: [] }, { status: 500 });
  }
}
