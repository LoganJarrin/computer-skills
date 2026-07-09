// Progress lives in localStorage (works offline) and is synced to the server
// under the student's name + school + grade so teachers can see it. No accounts.

export type Student = { name: string; school: string; grade: string };
export type ProgressEntry = { stars: number; correct: number; total: number };

const STUDENT_KEY = 'cs_student';
const PROGRESS_KEY = 'cs_progress';

export function getStudent(): Student | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(STUDENT_KEY);
    if (!s) return null;
    const p = JSON.parse(s);
    return p && p.name && p.school && p.grade ? p : null;
  } catch { return null; }
}
export function setStudent(s: Student) {
  if (typeof window !== 'undefined') { try { localStorage.setItem(STUDENT_KEY, JSON.stringify(s)); } catch {} }
}
export function clearStudent() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(STUDENT_KEY); localStorage.removeItem(PROGRESS_KEY); } catch {}
}

export function getProgressMap(): Record<string, ProgressEntry> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}

export function saveProgress(areaNum: number, code: string, stars: number, correct: number, total: number) {
  if (typeof window === 'undefined') return;
  try {
    const map = getProgressMap();
    const prev = map[code]?.stars || 0;
    map[code] = { stars: Math.max(prev, stars), correct, total };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {}
  const st = getStudent();
  if (st) {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: st.name, school: st.school, grade: st.grade, competence_code: code, area_num: areaNum, stars, correct, total }),
    }).catch(() => {});
  }
}

// Stars earned per area (sum), for showing progress on the home menu.
export function areaStars(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}

// Pull this student's saved progress from the server into localStorage.
export async function syncFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const st = getStudent();
  if (!st) return;
  try {
    const q = `name=${encodeURIComponent(st.name)}&school=${encodeURIComponent(st.school)}&grade=${encodeURIComponent(st.grade)}`;
    const r = await fetch(`/api/progress?${q}`);
    const d = await r.json();
    if (!d?.ok || !Array.isArray(d.rows)) return;
    const map = getProgressMap();
    for (const row of d.rows) {
      const code = row.competence_code;
      const prev = map[code]?.stars || 0;
      map[code] = { stars: Math.max(prev, row.stars || 0), correct: row.correct || 0, total: row.total || 0 };
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {}
}
