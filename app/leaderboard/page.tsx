'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { getStudent } from '@/lib/progress';
import { computeStats } from '@/lib/gamify';

const AVATARS = ['🦊', '🐱', '🐼', '🦉', '🐰', '🐨', '🐧', '🦁', '🐢', '🐥'];
const MEDALS = ['🥇', '🥈', '🥉'];
const SAMPLE = [
  { name: 'ก้อง', xp: 2450 }, { name: 'มะปราง', xp: 2180 }, { name: 'ต้นน้ำ', xp: 1990 },
  { name: 'ใบเฟิร์น', xp: 1510 }, { name: 'โฟกัส', xp: 1320 }, { name: 'น้ำหวาน', xp: 1180 }, { name: 'ปันปัน', xp: 990 },
];

type Row = { name: string; xp: number; me?: boolean };

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);

  useEffect(() => {
    const me = getStudent();
    const myXp = computeStats().xp;
    const myName = me?.name || 'คุณ';

    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        let list: Row[] = d.ok && d.rows.length ? d.rows.map((r: any) => ({ name: r.name, xp: r.xp })) : SAMPLE.slice();
        const idx = list.findIndex((r) => r.name === myName);
        if (idx >= 0) list[idx] = { ...list[idx], xp: Math.max(list[idx].xp, myXp), me: true };
        else list.push({ name: myName, xp: myXp, me: true });
        list.sort((a, b) => b.xp - a.xp);
        setRows(list);
        setMyRank(list.findIndex((r) => r.me) + 1);
      })
      .catch(() => {
        const list: Row[] = [...SAMPLE, { name: myName, xp: myXp, me: true }].sort((a, b) => b.xp - a.xp);
        setRows(list);
        setMyRank(list.findIndex((r) => r.me) + 1);
      });
  }, []);

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">
            <div className="banner gold">
              <div className="banner-orb">🏆</div>
              <div style={{ flex: 1 }}>
                <div className="banner-title">ลีกบรอนซ์</div>
                <div className="banner-sub" style={{ color: '#FFF3DE' }}>อันดับประจำสัปดาห์ · เก็บดาวเพื่อไต่อันดับ</div>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.2)', borderRadius: 16, padding: '12px 16px' }}>
                <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 22 }}>#{myRank ?? '—'}</div>
                <div style={{ fontFamily: 'Sarabun', fontWeight: 600, fontSize: 12, color: '#FFF3DE', marginTop: 4 }}>อันดับคุณ</div>
              </div>
            </div>

            <div style={{ background: '#EAFBE6', border: '2px solid #C7EEBE', borderRadius: 16, padding: '11px 16px', marginBottom: 16, fontFamily: 'Sarabun', fontWeight: 600, fontSize: 14, color: '#2E8B30' }}>🔼 อันดับ 1–3 ได้เลื่อนขึ้นสู่ลีกเงินสัปดาห์หน้า</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows.map((r, i) => (
                <div key={i} className={`lb-row${r.me ? ' me' : ''}`}>
                  <span className="lb-rank" style={i < 3 ? { fontSize: 20 } : undefined}>{i < 3 ? MEDALS[i] : i + 1}</span>
                  <span className="lb-av" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B4E6C2)' }}>{AVATARS[i % AVATARS.length]}</span>
                  <span className="lb-name">{r.name}{r.me && <span style={{ fontFamily: 'Sarabun', fontWeight: 700, fontSize: 12, color: '#2E8B30', background: '#fff', padding: '4px 8px', borderRadius: 99, marginLeft: 6 }}>คุณ</span>}</span>
                  <span className="lb-xp" style={r.me ? { color: '#2E8B30' } : undefined}>{r.xp.toLocaleString()} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
