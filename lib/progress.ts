// Progress is stored in localStorage (works with no DB) and best-effort synced
// to Neon via /api/progress when a student name is set.

export type Student = { name: string; classCode: string };
export type ProgressEntry = { stars: number; correct: number; total: number };

const STUDENT_KEY = 'cs_student';
const PROGRESS_KEY = 'cs_progress';

export function getStudent(): Student | null {
  if (typeof window === 'undefined') return null;
  try { const s = localStorage.getItem(STUDENT_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function setStudent(s: Student) {
  if (typeof window !== 'undefined') { try { localStorage.setItem(STUDENT_KEY, JSON.stringify(s)); } catch {} }
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
  if (st && st.name) {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: st.name, classCode: st.classCode, areaNum, code, stars, correct, total }),
    }).catch(() => {});
  }
}

// Stars earned per area (sum), for showing progress on the home menu.
export function areaStars(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}

// Pull a student's saved progress from the server into localStorage (cross-device
// restore when a kid logs into their class on a shared/new device).
export async function syncFromServer(name: string, classCode: string): Promise<void> {
  if (typeof window === 'undefined' || !name) return;
  try {
    const r = await fetch(`/api/progress?name=${encodeURIComponent(name)}&classCode=${encodeURIComponent(classCode)}`);
    const d = await r.json();
    if (!d?.ok || !Array.isArray(d.rows)) return;
    const map = getProgressMap();
    for (const row of d.rows) {
      const code = row.competence_code;
      const prev = map[code]?.stars || 0;
      map[code] = { stars: Math.max(prev, row.stars || 0), correct: row.correct || 0, total: row.total || 0 };
    }
    localStorage.setItem('cs_progress', JSON.stringify(map));
  } catch {}
}
