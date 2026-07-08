'use client';

import { useState } from 'react';
import { setStudent, syncFromServer } from '@/lib/progress';

type Roster = { id: number; name: string };

const box: React.CSSProperties = { padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 16, background: '#FFFDF6', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2, width: '100%' };

export default function StudentLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [step, setStep] = useState<'code' | 'name' | 'pin'>('code');
  const [code, setCode] = useState('');
  const [className, setClassName] = useState('');
  const [roster, setRoster] = useState<Roster[]>([]);
  const [picked, setPicked] = useState<Roster | null>(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadRoster() {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/class/roster?code=${encodeURIComponent(c)}`);
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'ไม่พบห้องเรียน'); setBusy(false); return; }
      setClassName(d.className); setRoster(d.students); setCode(c); setStep('name');
    } catch { setErr('เชื่อมต่อไม่ได้'); }
    setBusy(false);
  }

  async function submitPin(finalPin: string) {
    if (!picked) return;
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/student/login', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ joinCode: code, studentId: picked.id, pin: finalPin }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'PIN ไม่ถูกต้อง'); setPin(''); setBusy(false); return; }
      setStudent({ name: d.name, classCode: code, studentId: d.studentId, authed: true });
      await syncFromServer();
      onLoggedIn();
    } catch { setErr('เชื่อมต่อไม่ได้'); setBusy(false); }
  }

  function tapDigit(d: string) {
    if (busy) return;
    const next = (pin + d).slice(0, 4);
    setPin(next);
    if (next.length === 4) submitPin(next);
  }

  const card: React.CSSProperties = { background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '18px 20px', marginBottom: 24 };

  if (step === 'code') {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 30 }}>🎒</span>
          <div>
            <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 17 }}>เข้าเรียน</div>
            <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>ใส่รหัสห้องเรียนจากคุณครู</div>
          </div>
        </div>
        <input style={box} placeholder="รหัสห้อง" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadRoster()} />
        {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginTop: 8 }}>{err}</div>}
        <button className="btn3d blue" style={{ width: '100%', marginTop: 12, opacity: busy ? 0.6 : 1 }} onClick={loadRoster} disabled={busy}>{busy ? '...' : 'ต่อไป'}</button>
      </div>
    );
  }

  if (step === 'name') {
    return (
      <div style={card}>
        <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 17, marginBottom: 4 }}>ห้อง {className}</div>
        <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)', marginBottom: 14 }}>แตะชื่อของหนู</div>
        {roster.length === 0 ? (
          <div style={{ color: 'var(--muted2)', fontFamily: 'Sarabun', padding: '10px 0' }}>ยังไม่มีนักเรียนในห้องนี้ — บอกคุณครูให้เพิ่มชื่อ</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(110px,1fr))', gap: 10 }}>
            {roster.map((s) => (
              <button key={s.id} className="btn3d" style={{ padding: '16px 8px', fontSize: 17, background: 'linear-gradient(135deg,#5CD35B,#38A93A)', boxShadow: '0 5px 0 #2E8B30' }}
                onClick={() => { setPicked(s); setPin(''); setErr(''); setStep('pin'); }}>{s.name}</button>
            ))}
          </div>
        )}
        <button className="btn-ghost3d" style={{ width: '100%', marginTop: 14, fontSize: 14 }} onClick={() => { setStep('code'); setErr(''); }}>← เปลี่ยนรหัสห้อง</button>
      </div>
    );
  }

  // pin step
  return (
    <div style={card}>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 18 }}>สวัสดี {picked?.name} 👋</div>
        <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>ใส่รหัส PIN 4 หลัก</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: i < pin.length ? '#38A93A' : '#E0E6EC' }} />
        ))}
      </div>
      {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, textAlign: 'center', marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 260, margin: '0 auto' }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="btn3d" style={{ padding: '16px 0', fontSize: 22, background: '#fff', color: 'var(--ink)', boxShadow: '0 4px 0 var(--line-d)' }} onClick={() => tapDigit(d)}>{d}</button>
        ))}
        <button className="btn-ghost3d" style={{ padding: '16px 0', fontSize: 14 }} onClick={() => setPin(pin.slice(0, -1))}>⌫</button>
        <button className="btn3d" style={{ padding: '16px 0', fontSize: 22, background: '#fff', color: 'var(--ink)', boxShadow: '0 4px 0 var(--line-d)' }} onClick={() => tapDigit('0')}>0</button>
        <button className="btn-ghost3d" style={{ padding: '16px 0', fontSize: 13 }} onClick={() => { setStep('name'); setPin(''); setErr(''); }}>←</button>
      </div>
      {busy && <div style={{ textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun', fontSize: 13, marginTop: 10 }}>กำลังเข้าสู่ระบบ…</div>}
    </div>
  );
}
