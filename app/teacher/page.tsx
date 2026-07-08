import Link from 'next/link';
import { auth } from '@/lib/auth/server';
import { isAdmin } from '@/lib/auth/admins';
import AuthGate from '@/components/teacher/AuthGate';
import SignOutBtn from '@/components/teacher/SignOutBtn';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';

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

  return <TeacherDashboard userLabel={user.name || user.email} />;
}
