import { getSql } from '@/lib/db';

export type DashStudent = { name: string; stars: number; done: number };
export type GradeGroup = { grade: string; students: DashStudent[] };
export type SchoolGroup = { school: string; total: number; grades: GradeGroup[] };

// All self-identified students grouped by school → grade, with progress rollups.
// Admin-only (the /teacher page gates on isAdmin); read via the owner connection.
export async function getStudentsBySchool(): Promise<SchoolGroup[]> {
  const sql = getSql();
  if (!sql) return [];
  const rows = (await sql`
    SELECT s.school, s.grade, s.name,
      COALESCE(SUM(p.stars), 0)::int AS stars,
      COUNT(DISTINCT p.competence_code)::int AS done
    FROM students s LEFT JOIN progress p ON p.student_id = s.id
    WHERE s.school IS NOT NULL AND s.name NOT LIKE '\\_\\_%'
    GROUP BY s.id, s.school, s.grade, s.name
    ORDER BY s.school ASC, s.grade ASC, stars DESC, s.name ASC`) as any[];

  const schools = new Map<string, Map<string, DashStudent[]>>();
  for (const r of rows) {
    if (!schools.has(r.school)) schools.set(r.school, new Map());
    const grades = schools.get(r.school)!;
    if (!grades.has(r.grade)) grades.set(r.grade, []);
    grades.get(r.grade)!.push({ name: r.name, stars: r.stars, done: r.done });
  }

  return Array.from(schools.entries()).map(([school, grades]) => ({
    school,
    total: Array.from(grades.values()).reduce((n, arr) => n + arr.length, 0),
    grades: Array.from(grades.entries()).map(([grade, students]) => ({ grade, students })),
  }));
}
