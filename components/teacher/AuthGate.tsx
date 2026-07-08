'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

const input: React.CSSProperties = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6' };

export default function AuthGate() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email || !pw) { setErr('กรอกอีเมลและรหัสผ่าน'); return; }
    setBusy(true); setErr('');
    try {
      const res: any =
        mode === 'up'
          ? await authClient.signUp.email({ email, password: pw, name: name || email })
          : await authClient.signIn.email({ email, password: pw });
      if (res?.error) { setErr(res.error.message || 'เกิดข้อผิดพลาด'); setBusy(false); return; }
      router.refresh();
    } catch (e: any) { setErr(e?.message || 'เกิดข้อผิดพลาด'); setBusy(false); }
  }

  return (
    <div className="page">
      <div className="shell" style={{ maxWidth: 460 }}>
        <div className="appwin">
          <div className="appbody" style={{ padding: '34px 30px 40px' }}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 52 }}>🧑‍🏫</div>
              <h1 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 26, marginTop: 6 }}>สำหรับคุณครู</h1>
              <p style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)', marginTop: 4 }}>
                {mode === 'in' ? 'เข้าสู่ระบบเพื่อดูความก้าวหน้าของนักเรียน' : 'สร้างบัญชีครูเพื่อเริ่มสร้างห้องเรียน'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mode === 'up' && <input style={input} placeholder="ชื่อคุณครู" value={name} onChange={(e) => setName(e.target.value)} />}
              <input style={input} type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input style={input} type="password" placeholder="รหัสผ่าน" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
              {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14 }}>{err}</div>}
              <button className="btn3d" style={{ opacity: busy ? 0.6 : 1 }} onClick={submit} disabled={busy}>
                {busy ? 'กำลังดำเนินการ…' : mode === 'in' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
              </button>
              <button className="btn-ghost3d" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); }}>
                {mode === 'in' ? 'ยังไม่มีบัญชี? สร้างบัญชีครู' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href="/" style={{ color: 'var(--muted2)', fontSize: 14 }}>← กลับหน้าหลัก</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
