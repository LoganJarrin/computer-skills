'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';

const AVATARS = ['🦊', '🐱', '🐼', '🦉', '🐰', '🐨', '🐧', '🦁', '🐢', '🐥'];
const MEDALS = ['🥇', '🥈', '🥉'];

type Row = { name: string; xp: number };
type State = { loading: boolean; signedIn: boolean; isStudent: boolean; className: string; me: string; rows: Row[] };

export default function Leaderboard() {
  const [s, setS] = useState<State>({ loading: true, signedIn: false, isStudent: false, className: '', me: '', rows: [] });

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => setS({ loading: false, signedIn: !!d.signedIn, isStudent: !!d.isStudent, className: d.className || '', me: d.me || '', rows: d.rows || [] }))
      .catch(() => setS((p) => ({ ...p, loading: false })));
  }, []);

  const myRank = s.rows.findIndex((r) => r.name === s.me) + 1;

  const notice = (text: string, link?: boolean) => (
    <div style={{ textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun', padding: '36px 20px', fontSize: 15 }}>
      {text}
      {link && <div style={{ marginTop: 12 }}><Link className="btn3d blue" href="/" style={{ padding: '10px 20px' }}>ไปหน้าหลัก</Link></div>}
    </div>
  );

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">
            <div className="banner gold">
              <div className="banner-orb">🏆</div>
              <div style={{ flex: 1 }}>
                <div className="banner-title">{s.className ? `ห้อง ${s.className}` : 'อันดับในห้อง'}</div>
                <div className="banner-sub" style={{ color: '#FFF3DE' }}>อันดับเพื่อนในห้องของหนู · เก็บดาวเพื่อไต่อันดับ</div>
              </div>
              {s.isStudent && (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.2)', borderRadius: 16, padding: '12px 16px' }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22 }}>#{myRank || '—'}</div>
                  <div style={{ fontFamily: 'Sarabun', fontWeight: 600, fontSize: 12, color: '#FFF3DE', marginTop: 4 }}>อันดับคุณ</div>
                </div>
              )}
            </div>

            {s.loading ? notice('กำลังโหลด…')
              : !s.signedIn ? notice('เข้าสู่ระบบด้วยรหัสห้องเรียน เพื่อดูอันดับเพื่อนในห้องของหนู', true)
              : !s.isStudent ? notice('อันดับมีเฉพาะนักเรียนในห้องเรียน')
              : s.rows.length === 0 ? notice('ยังไม่มีเพื่อนในห้อง')
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {s.rows.map((r, i) => {
                    const me = r.name === s.me;
                    return (
                      <div key={i} className={`lb-row${me ? ' me' : ''}`}>
                        <span className="lb-rank" style={i < 3 ? { fontSize: 20 } : undefined}>{i < 3 ? MEDALS[i] : i + 1}</span>
                        <span className="lb-av" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B4E6C2)' }}>{AVATARS[i % AVATARS.length]}</span>
                        <span className="lb-name">{r.name}{me && <span style={{ fontFamily: 'Sarabun', fontWeight: 700, fontSize: 12, color: '#2E8B30', background: '#fff', padding: '4px 8px', borderRadius: 99, marginLeft: 6 }}>คุณ</span>}</span>
                        <span className="lb-xp" style={me ? { color: '#2E8B30' } : undefined}>{r.xp.toLocaleString()} XP</span>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
