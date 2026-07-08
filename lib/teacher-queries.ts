import { restSelect } from '@/lib/neon-dataapi';

export type TeacherStudent = { id: number; name: string; pin: string; stars: number; done: number; locked: boolean };
export type TeacherClass = { id: number; name: string; join_code: string; students: TeacherStudent[] };

// Aggregate a teacher's classes + roster + progress through the Data API with
// their JWT. RLS scopes every row to this teacher — there is no WHERE teacher_id.
export async function getTeacherDashboard(jwt: string): Promise<TeacherClass[]> {
  const [classes, students, progress] = await Promise.all([
    restSelect('classes', 'select=id,name,join_code&order=created_at.asc', jwt),
    restSelect('students', 'select=id,name,class_code,pin,pin_fails&auth_id=not.is.null&limit=5000', jwt),
    restSelect('progress', 'select=student_id,stars,competence_code&limit=50000', jwt),
  ]);

  const perStudent = new Map<number, { stars: number; comps: Set<string> }>();
  for (const p of progress) {
    let e = perStudent.get(p.student_id);
    if (!e) { e = { stars: 0, comps: new Set() }; perStudent.set(p.student_id, e); }
    e.stars += p.stars || 0;
    if (p.competence_code) e.comps.add(p.competence_code);
  }

  const byClass = new Map<string, TeacherStudent[]>();
  for (const st of students) {
    const agg = perStudent.get(st.id) ?? { stars: 0, comps: new Set<string>() };
    const arr = byClass.get(st.class_code) ?? [];
    arr.push({ id: st.id, name: st.name, pin: st.pin ?? '', stars: agg.stars, done: agg.comps.size, locked: (st.pin_fails ?? 0) >= 10 });
    byClass.set(st.class_code, arr);
  }

  return classes.map((c: any) => ({
    id: c.id, name: c.name, join_code: c.join_code,
    students: (byClass.get(c.join_code) ?? []).sort((a, b) => b.stars - a.stars),
  }));
}
