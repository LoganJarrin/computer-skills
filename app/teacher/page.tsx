import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import { jwtFromCookie } from '@/lib/auth/jwt';
import { getTeacherDashboard } from '@/lib/teacher-queries';
import AuthGate from '@/components/teacher/AuthGate';
import SignOutBtn from '@/components/teacher/SignOutBtn';
import CreateClassForm from '@/components/teacher/CreateClassForm';
import AddStudentForm from '@/components/teacher/AddStudentForm';

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

  const h = await headers();
  const origin = `${h.get('x-forwarded-proto') || 'https'}://${h.get('host')}`;
  const jwt = await jwtFromCookie(h.get('cookie'), origin);
  const classes = jwt ? await getTeacherDashboard(jwt) : [];

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
            <CreateClassForm />

            {classes.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '30px 0', fontFamily: 'Sarabun' }}>
                ยังไม่มีห้องเรียน — สร้างห้องแรกด้านบน
              </div>
            )}

            {classes.map((c) => (
              <div key={c.id} style={{ marginBottom: 26 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22, flex: 1 }}>{c.name}</h3>
                  <span style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>รหัสห้อง:</span>
                  <span style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 20, letterSpacing: 3, color: '#fff', background: 'linear-gradient(135deg,#5CD35B,#38A93A)', padding: '6px 16px', borderRadius: 12, boxShadow: '0 4px 0 #2E8B30' }}>{c.join_code}</span>
                </div>

                <AddStudentForm joinCode={c.join_code} />

                <div className="card3d" style={{ padding: 0, overflow: 'hidden', borderBottomColor: 'var(--line-d)' }}>
                  {c.students.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun' }}>
                      ยังไม่มีนักเรียน — เพิ่มชื่อด้านบน แล้วแจก PIN ให้เด็ก
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Sarabun' }}>
                        <thead>
                          <tr style={{ background: 'var(--cream)', textAlign: 'left', fontFamily: 'Mitr', fontSize: 14, color: 'var(--muted2)' }}>
                            <th style={{ padding: '12px 16px' }}>นักเรียน</th>
                            <th style={{ padding: '12px 16px', width: 90 }}>PIN</th>
                            <th style={{ padding: '12px 16px', width: 90 }}>ดาว</th>
                            <th style={{ padding: '12px 16px', width: 90 }}>บทที่จบ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.students.map((st, i) => (
                            <tr key={i} style={{ borderTop: '1px solid var(--line)' }}>
                              <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 16 }}>{st.name}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'Mitr', letterSpacing: 1, color: 'var(--muted2)' }}>{st.pin}</td>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
