import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { restSelect } from '@/lib/neon-dataapi';
import { rateLimit, clientKey } from '@/lib/ratelimit';

// Teacher dashboard data, fetched from the Neon Data API with the teacher's JWT.
// RLS scopes every row to this teacher — a teacher can never read another
// teacher's classes/students/progress, enforced by Postgres, not app code.
export async function GET(req: NextRequest) {
  if (!rateLimit(`tdata:${clientKey(req)}`, 60, 60_000))
    return NextResponse.json({ ok: false, error: 'too many requests' }, { status: 429 });

  const s = (await auth.getSession()) as any;
  const user = s?.data?.user ?? s?.user ?? null;
  if (!user || !isAdmin(user.email))
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return NextResponse.json({ ok: false, error: 'no token' }, { status: 401 });

  try {
    const [classes, students, progress] = await Promise.all([
      restSelect('classes', 'select=id,name,join_code&order=created_at.asc', jwt),
      restSelect('students', 'select=id,name,class_code,pin&auth_id=not.is.null&limit=5000', jwt),
      restSelect('progress', 'select=student_id,stars,competence_code&limit=50000', jwt),
    ]);

    const perStudent = new Map<number, { stars: number; comps: Set<string> }>();
    for (const p of progress) {
      let e = perStudent.get(p.student_id);
      if (!e) { e = { stars: 0, comps: new Set() }; perStudent.set(p.student_id, e); }
      e.stars += p.stars || 0;
      if (p.competence_code) e.comps.add(p.competence_code);
    }

    const byClass = new Map<string, { name: string; pin: string; stars: number; done: number }[]>();
    for (const st of students) {
      const agg = perStudent.get(st.id) ?? { stars: 0, comps: new Set<string>() };
      const arr = byClass.get(st.class_code) ?? [];
      arr.push({ name: st.name, pin: st.pin ?? '', stars: agg.stars, done: agg.comps.size });
      byClass.set(st.class_code, arr);
    }

    const out = classes.map((c: any) => ({
      id: c.id, name: c.name, join_code: c.join_code,
      students: (byClass.get(c.join_code) ?? []).sort((a, b) => b.stars - a.stars),
    }));
    return NextResponse.json({ ok: true, classes: out });
  } catch (e) {
    console.error('teacher/data failed:', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
