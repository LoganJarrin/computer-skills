'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import SignOutBtn from '@/components/teacher/SignOutBtn';

type Student = { name: string; stars: number; done: number };
type ClassData = { id: number; name: string; join_code: string; students: Student[] };

export default function TeacherDashboard({ userLabel }: { userLabel: string }) {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const getToken = useCallback(async () => {
    const t = (await authClient.token()) as any;
    return (t?.data?.token as string | undefined) ?? undefined;
  }, []);

  const load = useCallback(async () => {
    setErr('');
    try {
      const token = await getToken();
      if (!token) { setErr('ไม่พบ token การเข้าสู่ระบบ'); setLoading(false); return; }
      const r = await fetch('/api/teacher/data', { headers: { authorization: 'Bearer ' + token } });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'โหลดข้อมูลไม่สำเร็จ'); setLoading(false); return; }
      setClasses(d.classes);
    } catch (e: any) { setErr(e?.message || 'ผิดพลาด'); }
    setLoading(false);
  }, [getToken]);

  useEffect(() => { load(); }, [load]);

  async function createClass() {
    const n = newName.trim();
    if (!n) return;
    setCreating(true); setErr('');
    try {
      const token = await getToken();
      const r = await fetch('/api/teacher/classes', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (token ?? '') },
        body: JSON.stringify({ name: n }),
      });
      const d = await r.json();
      if (!d.ok) { setErr(d.error || 'สร้างห้องไม่สำเร็จ'); setCreating(false); return; }
      setNewName('');
      await load();
    } catch (e: any) { setErr(e?.message || 'ผิดพลาด'); }
    setCreating(false);
  }

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <div className="topbar">
            <Link href="/" className="brand">
              <span className="brand-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg></span>
              <span className="brand-name">แดชบอร์ด<span>ครู</span></span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>{userLabel}</span>
              <SignOutBtn />
            </div>
          </div>
          <div className="appbody">
            <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              <span style={{ fontSize: 26 }}>➕</span>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16 }}>สร้างห้องเรียนใหม่</div>
                <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>ตั้งชื่อห้อง แล้วแจกรหัสให้นักเรียน</div>
              </div>
              <input style={{ padding: '11px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6', minWidth: 140, flex: 1 }}
                placeholder="เช่น ป.5/2" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createClass()} />
              <button className="btn3d" style={{ padding: '12px 22px', opacity: creating ? 0.6 : 1 }} onClick={createClass} disabled={creating}>สร้าง</button>
            </div>

            {err && <div style={{ color: '#C23B2A', fontFamily: 'Sarabun', fontSize: 14, marginBottom: 16 }}>{err}</div>}

            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '30px 0', fontFamily: 'Sarabun' }}>กำลังโหลด…</div>
            ) : classes.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '30px 0', fontFamily: 'Sarabun' }}>
                ยังไม่มีห้องเรียน — สร้างห้องแรกด้านบน แล้วแจกรหัสให้นักเรียนเข้าร่วม
              </div>
            ) : (
              classes.map((c) => (
                <div key={c.id} style={{ marginBottom: 26 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, flex: 1 }}>{c.name}</h3>
                    <span style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>รหัสห้อง:</span>
                    <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 20, letterSpacing: 3, color: '#fff', background: 'linear-gradient(135deg,#5CD35B,#38A93A)', padding: '6px 16px', borderRadius: 12, boxShadow: '0 4px 0 #2E8B30' }}>{c.join_code}</span>
                  </div>
                  <div className="card3d" style={{ padding: 0, overflow: 'hidden', borderBottomColor: 'var(--line-d)' }}>
                    {c.students.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun' }}>
                        ยังไม่มีนักเรียน — แจกรหัส <b>{c.join_code}</b> ให้นักเรียนใส่ในหน้าหลัก
                      </div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sarabun' }}>
                          <thead>
                            <tr style={{ background: 'var(--cream)', textAlign: 'left', fontFamily: 'Mitr', fontSize: 14, color: 'var(--muted2)' }}>
                              <th style={{ padding: '12px 16px' }}>นักเรียน</th>
                              <th style={{ padding: '12px 16px', width: 120 }}>ดาว</th>
                              <th style={{ padding: '12px 16px', width: 120 }}>บทที่จบ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {c.students.map((st, i) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16 }}>{st.name}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--green-d)', fontWeight: 700 }}>⭐ {st.stars}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--blue)', fontWeight: 700 }}>{st.done} บท</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
