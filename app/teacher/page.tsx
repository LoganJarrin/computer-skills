import Link from 'next/link';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';
import AuthGate from '@/components/teacher/AuthGate';
import CreateClass from '@/components/teacher/CreateClass';
import SignOutBtn from '@/components/teacher/SignOutBtn';

export const dynamic = 'force-dynamic';

type ClassRow = { id: number; name: string; join_code: string };
type StudentRow = { name: string; stars: number; done: number };

export default async function TeacherPage() {
  const s = (await auth.getSession()) as any;
  const user = s?.data?.user ?? s?.user ?? null;
  if (!user) return <AuthGate />;

  const sql = getSql();
  let classes: ClassRow[] = [];
  const students: Record<number, StudentRow[]> = {};
  if (sql) {
    classes = (await sql`SELECT id, name, join_code FROM classes WHERE teacher_id = ${user.id} ORDER BY created_at`) as any[];
    for (const c of classes) {
      students[c.id] = (await sql`
        SELECT s.name, COALESCE(SUM(p.stars), 0)::int AS stars, COUNT(DISTINCT p.competence_code)::int AS done
        FROM students s LEFT JOIN progress p ON p.student_id = s.id
        WHERE s.class_code = ${c.join_code}
        GROUP BY s.id, s.name
        ORDER BY stars DESC, s.name ASC`) as any[];
    }
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
              <span style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>{user.name || user.email}</span>
              <SignOutBtn />
            </div>
          </div>
          <div className="appbody">
            <CreateClass />

            {classes.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '30px 0', fontFamily: 'Sarabun' }}>
                ยังไม่มีห้องเรียน — สร้างห้องแรกด้านบน แล้วแจกรหัสให้นักเรียนเข้าร่วม
              </div>
            )}

            {classes.map((c) => (
              <div key={c.id} style={{ marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, flex: 1 }}>{c.name}</h3>
                  <span style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>รหัสห้อง:</span>
                  <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 20, letterSpacing: 3, color: '#fff', background: 'linear-gradient(135deg,#5CD35B,#38A93A)', padding: '6px 16px', borderRadius: 12, boxShadow: '0 4px 0 #2E8B30' }}>{c.join_code}</span>
                </div>
                <div className="card3d" style={{ padding: 0, overflow: 'hidden', borderBottomColor: 'var(--line-d)' }}>
                  {(students[c.id] || []).length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun' }}>
                      ยังไม่มีนักเรียน — แจกรหัส <b>{c.join_code}</b> ให้นักเรียนใส่ในหน้าหลัก
                    </div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sarabun' }}>
                      <thead>
                        <tr style={{ background: 'var(--cream)', textAlign: 'left', fontFamily: 'Mitr', fontSize: 14, color: 'var(--muted2)' }}>
                          <th style={{ padding: '12px 16px' }}>นักเรียน</th>
                          <th style={{ padding: '12px 16px', width: 120 }}>ดาว</th>
                          <th style={{ padding: '12px 16px', width: 120 }}>บทที่จบ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students[c.id].map((st, i) => (
                          <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16 }}>{st.name}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--green-d)', fontWeight: 700 }}>⭐ {st.stars}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--blue)', fontWeight: 700 }}>{st.done} บท</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
