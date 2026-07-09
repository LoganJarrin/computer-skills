'use client';

import { useState } from 'react';
import { setStudent, syncFromServer } from '@/lib/progress';

const GRADES = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6', 'ม.1', 'ม.2', 'ม.3'];
const field: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 16, background: '#FFFDF6' };

export default function StudentStart({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [busy, setBusy] = useState(false);

  async function start() {
    if (!name.trim() || !school.trim() || !grade) return;
    setBusy(true);
    setStudent({ name: name.trim(), school: school.trim(), grade });
    await syncFromServer();
    onDone();
  }

  return (
    <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '18px 20px', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 30 }}>🎒</span>
        <div>
          <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 17 }}>เริ่มเรียนกันเลย!</div>
          <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>ใส่ชื่อ โรงเรียน และชั้นของหนู</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input style={field} placeholder="ชื่อของหนู" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={field} placeholder="โรงเรียน" value={school} onChange={(e) => setSchool(e.target.value)} />
        <div>
          <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)', marginBottom: 6 }}>ชั้น</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(64px,1fr))', gap: 8 }}>
            {GRADES.map((g) => (
              <button key={g} type="button" onClick={() => setGrade(g)}
                className="btn3d"
                style={{ padding: '12px 4px', fontSize: 15, background: grade === g ? 'linear-gradient(135deg,#5CD35B,#38A93A)' : '#fff', color: grade === g ? '#fff' : 'var(--ink)', boxShadow: grade === g ? '0 4px 0 #2E8B30' : '0 4px 0 var(--line-d)' }}>{g}</button>
            ))}
          </div>
        </div>
        <button className="btn3d blue" style={{ marginTop: 4, opacity: busy || !name.trim() || !school.trim() || !grade ? 0.6 : 1 }} onClick={start} disabled={busy || !name.trim() || !school.trim() || !grade}>
          {busy ? '...' : 'เริ่มเรียน'}
        </button>
      </div>
    </div>
  );
}
