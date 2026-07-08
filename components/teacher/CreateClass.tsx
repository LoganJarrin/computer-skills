'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateClass() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function create() {
    const n = name.trim();
    if (!n) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: n }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'สร้างห้องไม่สำเร็จ'); setBusy(false); return; }
      setName('');
      router.refresh();
    } catch (e: any) { setErr(e?.message || 'ผิดพลาด'); }
    setBusy(false);
  }

  return (
    <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      <span style={{ fontSize: 26 }}>➕</span>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16 }}>สร้างห้องเรียนใหม่</div>
        <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>{err || 'ตั้งชื่อห้อง แล้วแจกรหัสให้นักเรียน'}</div>
      </div>
      <input style={{ padding: '11px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6', minWidth: 140, flex: 1 }}
        placeholder="เช่น ป.5/2" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && create()} />
      <button className="btn3d" style={{ padding: '12px 22px', opacity: busy ? 0.6 : 1 }} onClick={create} disabled={busy}>สร้าง</button>
    </div>
  );
}
