import crypto from 'node:crypto';

// A student's real Neon Auth password is derived from their 4-digit PIN plus a
// server-only pepper, so the PIN alone is never the password and the pepper
// never leaves the server. The child only ever knows the 4 digits.
export function studentPassword(pin: string): string {
  return `${pin}#${process.env.STUDENT_PEPPER ?? ''}#cs-student`;
}

// Synthetic, non-routable email — students have no real inbox.
export function synthEmail(): string {
  return `stu-${crypto.randomBytes(9).toString('hex')}@students.cs.local`;
}

export function genPin(): string {
  return String(crypto.randomInt(1000, 10000)); // 1000–9999
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}
