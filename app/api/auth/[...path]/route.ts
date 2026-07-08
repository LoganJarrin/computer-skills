import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';

// Proxies all Neon Auth requests (keeps auth cookies first-party).
const handler = auth.handler();
export const GET = handler.GET;

// Guard the public sign-up endpoint: an account with an allowlisted ADMIN email
// can only be created with the shared security code (TEACHER_SIGNUP_CODE),
// forwarded by /api/teacher/register. This closes the "register a known admin
// email before the real owner does" hole — the emails are public, the code isn't.
export async function POST(req: Request, ctx: any) {
  const url = new URL(req.url);
  if (url.pathname.endsWith('/sign-up/email')) {
    const body = await req.clone().json().catch(() => null);
    const email = String(body?.email ?? '').toLowerCase();
    if (isAdmin(email)) {
      const code = req.headers.get('x-signup-code') ?? '';
      if (!process.env.TEACHER_SIGNUP_CODE || code !== process.env.TEACHER_SIGNUP_CODE) {
        return NextResponse.json({ error: 'invalid signup code' }, { status: 403 });
      }
    }
  }
  return handler.POST(req, ctx);
}
