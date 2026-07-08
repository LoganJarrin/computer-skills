// Fetch the current session's JWT SERVER-SIDE from the HttpOnly session cookie,
// so a bearer token is never exposed to the browser. Used only on the server
// (route handlers, server components) to talk to the RLS-enforced Data API.
export async function jwtFromCookie(cookie: string | null, origin: string): Promise<string | null> {
  if (!cookie) return null;
  try {
    const r = await fetch(`${origin}/api/auth/token`, { headers: { cookie }, cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json().catch(() => null);
    return d?.token ?? null;
  } catch {
    return null;
  }
}
