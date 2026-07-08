import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Class-scoped leaderboard: a logged-in student sees only their own classmates,
// ranked by stars. Requires a student session — no global/public board.
export async function GET(req: NextRequest) {
  const sql = getSql();
  if (!sql) return NextResponse.json({ ok: false, rows: [] });
  if (!rateLimit(`lb:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests', rows: [] }, { status: 429 });

  const s = (await auth.getSession()) as any;
  const user = s?.data?.user ?? s?.user ?? null;
  if (!user) return NextResponse.json({ ok: true, rows: [], signedIn: false });

  try {
    const me = (await sql`SELECT class_code, name FROM students WHERE auth_id = ${user.id}`) as any[];
    if (!me.length) return NextResponse.json({ ok: true, rows: [], signedIn: true, isStudent: false });
    const classCode = me[0].class_code;

    const rows = (await sql`
      SELECT s.name, COALESCE(SUM(p.stars), 0)::int AS stars
      FROM students s LEFT JOIN progress p ON p.student_id = s.id
      WHERE s.class_code = ${classCode} AND s.auth_id IS NOT NULL AND s.name NOT LIKE '\\_\\_%'
      GROUP BY s.id, s.name
      ORDER BY stars DESC, s.name ASC
      LIMIT 50`) as any[];
    const cls = (await sql`SELECT name FROM classes WHERE join_code = ${classCode}`) as any[];

    return NextResponse.json({
      ok: true, signedIn: true, isStudent: true,
      className: cls[0]?.name ?? '', me: me[0].name,
      rows: rows.map((r) => ({ name: r.name, stars: r.stars, xp: r.stars * 20 })),
    });
  } catch (e) {
    console.error('leaderboard GET failed:', e);
    return NextResponse.json({ ok: false, error: 'server error', rows: [] }, { status: 500 });
  }
}
