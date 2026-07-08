// Best-effort in-memory sliding-window rate limiter. Persists across invocations
// on a warm serverless instance (resets on cold start; not shared across instances)
// — a lightweight throttle for an app with no auth, not a hard guarantee.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { hits.set(key, arr); return false; }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  return true;
}

export function clientKey(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  return xff.split(',')[0].trim() || 'anon';
}
