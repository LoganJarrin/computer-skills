import { auth } from '@/lib/auth/server';

// Proxies all Neon Auth requests (keeps auth cookies first-party).
export const { GET, POST } = auth.handler();
