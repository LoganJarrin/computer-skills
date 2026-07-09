import Link from 'next/link';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { getStudentsBySchool } from '@/lib/teacher-queries';
import AuthGate from '@/components/teacher/AuthGate';
import SignOutBtn from '@/components/teacher/SignOutBtn';

export const dynamic = 'force-dynamic';

export default async function TeacherPage() {
  const s = (await auth.getSession()) as any;
  const user = s?.data?.user ?? s?.user ?? null;
  if (!user) return <AuthGate />;
  if (!isAdmin(user.email)) {
    return (
      <div className="page">
        <div className="shell" style={{ maxWidth: 460 }}>
          <div className="appwin">
            <div className="appbody" style={{ padding: '40px 30px', textAlign: 'center' }}>
              <div style={{ fontSize: 52 }}>🔒</div>
              <h1 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 24, margin: '8px 0' }}>ไม่มีสิทธิ์เข้าถึง</h1>
              <p style={{ fontFamily: 'Sarabun', color: 'var(--muted2)', marginBottom: 20 }}>บัญชี {user.email} ไม่ใช่ผู้ดูแลระบบ</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <SignOutBtn />
                <Link className="btn-ghost3d" href="/" style={{ padding: '9px 16px', fontSize: 14 }}>หน้าหลัก</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const schools = await getStudentsBySchool();

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
            <div style={{ fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)', marginBottom: 20 }}>
              ความก้าวหน้าของนักเรียนทั้งหมด แยกตามโรงเรียนและชั้น
            </div>

            {schools.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '30px 0', fontFamily: 'Sarabun' }}>
                ยังไม่มีนักเรียน — เมื่อนักเรียนเริ่มเรียน ชื่อจะปรากฏที่นี่
              </div>
            )}

            {schools.map((sc) => (
              <div key={sc.school} style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>🏫</span>
                  <h3 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, flex: 1 }}>{sc.school}</h3>
                  <span style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>{sc.total} คน</span>
                </div>
                {sc.grades.map((g) => (
                  <div key={g.grade} style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16, color: 'var(--green-d)', margin: '0 0 8px 4px' }}>ชั้น {g.grade}</div>
                    <div className="card3d" style={{ padding: 0, overflow: 'hidden', borderBottomColor: 'var(--line-d)' }}>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sarabun' }}>
                          <thead>
                            <tr style={{ background: 'var(--cream)', textAlign: 'left', fontFamily: 'Mitr', fontSize: 14, color: 'var(--muted2)' }}>
                              <th style={{ padding: '12px 16px' }}>นักเรียน</th>
                              <th style={{ padding: '12px 16px', width: 100 }}>ดาว</th>
                              <th style={{ padding: '12px 16px', width: 100 }}>บทที่จบ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.students.map((st, i) => (
                              <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16 }}>{st.name}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--green-d)', fontWeight: 700 }}>⭐ {st.stars}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--blue)', fontWeight: 700 }}>{st.done} บท</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
