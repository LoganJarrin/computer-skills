// Neon Data API (PostgREST) access with a teacher's Neon Auth JWT.
// Queries run as the Postgres `authenticated` role, so RLS policies
// (auth.user_id()) enforce per-teacher row access at the database level.
const BASE = process.env.NEON_DATA_API_URL;

export function hasDataApi(): boolean {
  return !!BASE;
}

export async function restSelect(table: string, query: string, jwt: string): Promise<any[]> {
  const r = await fetch(`${BASE}/${table}?${query}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`data-api select ${table} ${r.status}`);
  return r.json();
}

type InsertResult = { rows: any[] } | { conflict: true };

export async function restInsert(table: string, row: Record<string, unknown>, jwt: string): Promise<InsertResult> {
  const r = await fetch(`${BASE}/${table}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (r.status === 409) return { conflict: true };
  if (!r.ok) throw new Error(`data-api insert ${table} ${r.status}`);
  return { rows: await r.json() };
}

// Upsert on a unique key (RLS still applies via WITH CHECK — a student can only
// write rows that belong to them).
export async function restUpsert(table: string, row: Record<string, unknown>, onConflict: string, jwt: string): Promise<void> {
  const r = await fetch(`${BASE}/${table}?on_conflict=${onConflict}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(`data-api upsert ${table} ${r.status}`);
}
