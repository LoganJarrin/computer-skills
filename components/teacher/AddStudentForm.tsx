'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddStudentForm({ joinCode }: { joinCode: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [added, setAdded] = useState<{ name: string; pin: string } | null>(null);

  async function add() {
    const n = name.trim();
    if (!n) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/teacher/students', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ joinCode, name: n }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'เพิ่มนักเรียนไม่สำเร็จ'); setBusy(false); return; }
      setName(''); setAdded(d.student); router.refresh();
    } catch { setErr('ผิดพลาด'); }
    setBusy(false);
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input style={{ padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6', flex: 1, minWidth: 140 }}
          placeholder="ชื่อนักเรียน" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn3d blue" style={{ padding: '11px 18px', opacity: busy ? 0.6 : 1 }} onClick={add} disabled={busy}>+ เพิ่มนักเรียน</button>
      </div>
      {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginTop: 8 }}>{err}</div>}
      {added && (
        <div style={{ background: '#EAF7EE', border: '1.5px solid #B7ECC4', borderRadius: 12, padding: '10px 14px', marginTop: 10, fontFamily: 'Sarabun', fontSize: 15 }}>
          เพิ่ม <b>{added.name}</b> แล้ว — PIN คือ <b style={{ fontFamily: 'Mitr', letterSpacing: 2, fontSize: 18 }}>{added.pin}</b> (จดไว้ให้นักเรียน)
        </div>
      )}
    </div>
  );
}
