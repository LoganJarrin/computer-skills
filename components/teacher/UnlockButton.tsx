'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UnlockButton({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    try {
      await fetch('/api/teacher/unlock', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });
      router.refresh();
    } catch {}
    setBusy(false);
  }

  return (
    <button className="btn3d blue" style={{ padding: '5px 12px', fontSize: 13, opacity: busy ? 0.6 : 1 }} onClick={unlock} disabled={busy}>
      {busy ? '…' : 'ปลดล็อก'}
    </button>
  );
}
