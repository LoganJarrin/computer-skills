import { getProgressMap } from './progress';
import { AREAS } from './content';

export type Stats = { stars: number; completed: number; xp: number; gems: number; totalCompetences: number };

export function computeStats(): Stats {
  const map = getProgressMap();
  let stars = 0, completed = 0;
  for (const code of Object.keys(map)) {
    const e = map[code];
    stars += e.stars || 0;
    if ((e.stars || 0) > 0) completed++;
  }
  const totalCompetences = AREAS.reduce((s, a) => s + a.chapters.length, 0);
  return { stars, completed, xp: stars * 20, gems: stars * 5, totalCompetences };
}

export function areaStarsFor(codes: string[]): number {
  const map = getProgressMap();
  return codes.reduce((s, c) => s + (map[c]?.stars || 0), 0);
}

export function getStreak(): number {
  if (typeof window === 'undefined') return 0;
  try { const raw = localStorage.getItem('cs_streak'); return raw ? (JSON.parse(raw).days || 0) : 0; } catch { return 0; }
}

export function touchStreak(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const today = new Date();
    const key = today.toISOString().slice(0, 10);
    const raw = localStorage.getItem('cs_streak');
    const st = raw ? JSON.parse(raw) : { days: 0, last: '' };
    if (st.last === key) return st.days || 1;
    const y = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    st.days = st.last === y ? (st.days || 0) + 1 : 1;
    st.last = key;
    localStorage.setItem('cs_streak', JSON.stringify(st));
    return st.days;
  } catch { return 0; }
}
