import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, db: false, rows: [] });
  if (!rateLimit(`lb:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests', rows: [] }, { status: 429 });
  try {
    // Public board: expose only nickname + xp (no class code), top 20.
    const rows = await sql`
      SELECT s.name, COALESCE(SUM(p.stars), 0)::int AS stars
      FROM students s LEFT JOIN progress p ON p.student_id = s.id
      GROUP BY s.id, s.name
      HAVING s.name NOT LIKE '\\_\\_%'
      ORDER BY stars DESC, s.name ASC
      LIMIT 20`;
    return NextResponse.json({ ok: true, rows: rows.map((r) => ({ name: r.name, stars: r.stars, xp: r.stars * 20 })) });
  } catch (e) {
    console.error('leaderboard GET failed:', e);
    return NextResponse.json({ ok: false, error: 'server error', rows: [] }, { status: 500 });
  }
}
