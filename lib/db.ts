import { neon } from '@neondatabase/serverless';

// Returns a Neon SQL client, or null when DATABASE_URL is not configured
// (so the app still deploys and runs — progress falls back to localStorage).
// Students identify by name+school+grade (no accounts); the admin dashboard
// reads via this owner connection and is gated in-route by isAdmin.
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}
