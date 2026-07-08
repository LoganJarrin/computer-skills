// Progress lives in localStorage (works offline / for anonymous play) and, for a
// logged-in student, is synced to Neon through the authenticated Data API so RLS
// guarantees a child can only ever write their own progress.

import { authClient } from '@/lib/auth/client';

export type Student = { name: string; classCode: string; studentId?: number; authed?: boolean };
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

async function getToken(): Promise<string | null> {
  try { const t = (await authClient.token()) as any; return t?.data?.token ?? null; } catch { return null; }
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
  if (st?.authed && st.studentId) {
    getToken().then((token) => {
      if (!token) return;
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
        body: JSON.stringify({ student_id: st.studentId, competence_code: code, area_num: areaNum, stars, correct, total }),
      }).catch(() => {});
    });
  }
}

// Stars earned per area (sum), for showing progress on the home menu.
export function areaStars(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}

// Pull the logged-in student's saved progress from the server into localStorage
// (cross-device restore — their real account carries progress to any device).
export async function syncFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const st = getStudent();
  if (!st?.authed) return;
  const token = await getToken();
  if (!token) return;
  try {
    const r = await fetch('/api/progress', { headers: { authorization: 'Bearer ' + token } });
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
