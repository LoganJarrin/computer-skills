// Progress lives in localStorage (works offline / for anonymous play) and, for a
// logged-in student, is synced to the server. Sync uses only the HttpOnly session
// cookie — the browser never holds a token, and the server derives which student
// you are from the session, so a child can only ever write their own progress.

export type Student = { name: string; classCode: string; authed?: boolean };
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
  if (st?.authed) {
    // No token, no student id — the session cookie identifies the student server-side.
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ competence_code: code, area_num: areaNum, stars, correct, total }),
    }).catch(() => {});
  }
}

// Stars earned per area (sum), for showing progress on the home menu.
export function areaStars(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}

// Pull the logged-in student's saved progress from the server into localStorage
// (cross-device restore). Auth is the session cookie — no token in the browser.
export async function syncFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const st = getStudent();
  if (!st?.authed) return;
  try {
    const r = await fetch('/api/progress');
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
