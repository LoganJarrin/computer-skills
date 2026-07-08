'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export default function SignOutBtn() {
  const router = useRouter();
  async function out() {
    try { await authClient.signOut(); } catch {}
    router.refresh();
  }
  return <button className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14 }} onClick={out}>ออกจากระบบ</button>;
}
