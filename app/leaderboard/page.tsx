'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { getStudent } from '@/lib/progress';

const AVATARS = ['🦊', '🐱', '🐼', '🦉', '🐰', '🐨', '🐧', '🦁', '🐢', '🐥'];
const MEDALS = ['🥇', '🥈', '🥉'];

type Row = { name: string; xp: number };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [me, setMe] = useState('');
  const [scope, setScope] = useState('');
  const [state, setState] = useState<'loading' | 'nostudent' | 'ready'>('loading');

  useEffect(() => {
    const st = getStudent();
    if (!st) { setState('nostudent'); return; }
    setMe(st.name);
    setScope(`${st.school} · ${st.grade}`);
    fetch(`/api/leaderboard?school=${encodeURIComponent(st.school)}&grade=${encodeURIComponent(st.grade)}`)
      .then((r) => r.json())
      .then((d) => { setRows(d.rows || []); setState('ready'); })
      .catch(() => setState('ready'));
  }, []);

  const myRank = rows.findIndex((r) => r.name === me) + 1;

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">
            <div className="banner gold">
              <div className="banner-orb">🏆</div>
              <div style={{ flex: 1 }}>
                <div className="banner-title">อันดับในชั้น</div>
                <div className="banner-sub" style={{ color: '#FFF3DE' }}>{scope || 'เพื่อน ๆ ในโรงเรียนและชั้นเดียวกัน'}</div>
              </div>
              {state === 'ready' && (
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.2)', borderRadius: 16, padding: '12px 16px' }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22 }}>#{myRank || '—'}</div>
                  <div style={{ fontFamily: 'Sarabun', fontWeight: 600, fontSize: 12, color: '#FFF3DE', marginTop: 4 }}>อันดับคุณ</div>
                </div>
              )}
            </div>

            {state === 'loading' ? (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun', padding: '36px 0' }}>กำลังโหลด…</div>
            ) : state === 'nostudent' ? (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun', padding: '36px 20px' }}>
                ใส่ชื่อ โรงเรียน และชั้น ที่หน้าหลักก่อน เพื่อดูอันดับเพื่อนในชั้น
                <div style={{ marginTop: 12 }}><Link className="btn3d blue" href="/" style={{ padding: '10px 20px' }}>ไปหน้าหลัก</Link></div>
              </div>
            ) : rows.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--muted2)', fontFamily: 'Sarabun', padding: '36px 0' }}>ยังไม่มีเพื่อนในชั้น</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rows.map((r, i) => {
                  const mine = r.name === me;
                  return (
                    <div key={i} className={`lb-row${mine ? ' me' : ''}`}>
                      <span className="lb-rank" style={i < 3 ? { fontSize: 20 } : undefined}>{i < 3 ? MEDALS[i] : i + 1}</span>
                      <span className="lb-av" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B4E6C2)' }}>{AVATARS[i % AVATARS.length]}</span>
                      <span className="lb-name">{r.name}{mine && <span style={{ fontFamily: 'Sarabun', fontWeight: 700, fontSize: 12, color: '#2E8B30', background: '#fff', padding: '4px 8px', borderRadius: 99, marginLeft: 6 }}>คุณ</span>}</span>
                      <span className="lb-xp" style={mine ? { color: '#2E8B30' } : undefined}>{r.xp.toLocaleString()} XP</span>
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
