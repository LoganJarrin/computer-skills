// The only accounts allowed to create/hold an admin ("teacher") account.
// This is the project's two student authors, who deploy it to schools.
export const ADMIN_EMAILS = [
  'loganjarrin@gmail.com',
  'paopaopongpipat@gmail.com',
];

export function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
