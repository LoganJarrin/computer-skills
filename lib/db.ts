import { neon } from '@neondatabase/serverless';

// Returns a Neon SQL client, or null when DATABASE_URL is not configured
// (so the app still deploys and runs — progress falls back to localStorage).
// This uses the owner role and is used only for the trusted server paths
// (anonymous student writes). Teacher/admin access goes through the Neon Data
// API with the teacher's JWT so Postgres RLS enforces per-teacher scoping —
// see lib/neon-dataapi.ts.
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}
