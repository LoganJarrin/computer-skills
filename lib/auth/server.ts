import { createNeonAuth } from '@neondatabase/auth/next/server';

// Neon Auth (Better Auth) server instance — teacher accounts.
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
