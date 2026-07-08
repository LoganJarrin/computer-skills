'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TopBar from '@/components/TopBar';
import { AREAS } from '@/lib/content';
import { getStudent, setStudent, getProgressMap } from '@/lib/progress';
import { computeStats, getStreak } from '@/lib/gamify';

const DAYS = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];
const inputStyle: React.CSSProperties = { padding: '11px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6', minWidth: 110, flex: 1 };

export default function Profile() {
  const [name, setName] = useState('น้องนักเรียน');
  const [nameInput, setNameInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [stars, setStars] = useState(0);
  const [gems, setGems] = useState(0);
  const [xp, setXp] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [streak, setStreak] = useState(0);
  const [avg, setAvg] = useState('0.0');
  const [badges, setBadges] = useState<{ icon: string; title: string; sub: string; on: boolean; grad: string; edge: string }[]>([]);

  useEffect(() => {
    const st = getStudent();
    if (st?.name) { setName(st.name); setNameInput(st.name); setClassInput(st.classCode || ''); }
    const s = computeStats();
    setStars(s.stars); setGems(s.gems); setXp(s.xp); setCompleted(s.completed);
    setStreak(getStreak());
    setAvg(s.completed > 0 ? (s.stars / s.completed).toFixed(1) : '0.0');

    const map = getProgressMap();
    const areaDone = (a: (typeof AREAS)[number]) => a.chapters.every((c) => (map[c.code]?.stars || 0) > 0);
    const b = [
      { icon: '🚀', title: 'ก้าวแรก', sub: 'เรียนจบบทแรก', on: s.completed > 0, grad: 'linear-gradient(135deg,#5CD35B,#38A93A)', edge: '#2E8B30' },
      { icon: '⭐', title: 'นักสะสมดาว', sub: 'สะสม 15 ดาว', on: s.stars >= 15, grad: 'linear-gradient(135deg,#FFC24B,#F0982E)', edge: '#D07E1E' },
      { icon: '🔥', title: 'สตรีค 7 วัน', sub: 'เรียน 7 วันติด', on: getStreak() >= 7, grad: 'linear-gradient(135deg,#FF8A5C,#F0662E)', edge: '#C74E1E' },
      ...AREAS.map((a) => ({ icon: a.mascot, title: a.num === 0 ? 'จบพื้นฐาน' : `จบด้าน ${a.num}`, sub: a.title.slice(0, 14), on: areaDone(a), grad: 'linear-gradient(135deg,#4FB0FF,#2E9BFF)', edge: '#2277CC' })),
    ];
    setBadges(b);
  }, []);

  function saveName() {
    const n = nameInput.trim();
    if (!n) return;
    setStudent({ name: n, classCode: classInput.trim() });
    setName(n); setSaved(true); setTimeout(() => setSaved(false), 1600);
  }

  const level = Math.floor(xp / 300) + 1;
  const nextLevelXp = level * 300;
  const pct = Math.min(100, Math.round((xp / nextLevelXp) * 100));

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">

            <div className="banner green" style={{ gap: 22 }}>
              <div style={{ width: 88, height: 88, borderRadius: 26, background: 'rgba(255,255,255,.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, boxShadow: 'inset 0 -5px 0 rgba(0,0,0,.08)' }}>🦉</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 28 }}>{name}</div>
                <div className="banner-sub">เลเวล {level} · นักสำรวจ</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '7px 13px', borderRadius: 99, background: 'rgba(255,255,255,.22)', fontFamily: 'Mitr', fontWeight: 700, fontSize: 13 }}>🛡️ ลีกบรอนซ์</span>
              </div>
              <div style={{ minWidth: 210 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Sarabun', fontWeight: 600, fontSize: 13, color: '#EAFBE6', marginBottom: 8 }}><span>สู่เลเวลถัดไป</span><span>{xp} / {nextLevelXp} XP</span></div>
                <div className="goal-track"><div className="goal-fill" style={{ width: `${pct}%` }} /></div>
              </div>
            </div>

            <div className="grid4" style={{ marginBottom: 26 }}>
              <div className="statcard" style={{ borderColor: '#F4D9A6' }}><div style={{ fontSize: 30 }}>🔥</div><div className="v" style={{ color: 'var(--amber)' }}>{streak}</div><div className="l">สตรีคปัจจุบัน</div></div>
              <div className="statcard" style={{ borderColor: '#B9EAB4' }}><div style={{ fontSize: 30 }}>💎</div><div className="v" style={{ color: 'var(--green-d)' }}>{gems}</div><div className="l">เพชรสะสม</div></div>
              <div className="statcard" style={{ borderColor: '#C9DBF6' }}><div style={{ fontSize: 30 }}>⭐</div><div className="v" style={{ color: 'var(--blue)' }}>{avg}</div><div className="l">คะแนนเฉลี่ย</div></div>
              <div className="statcard" style={{ borderColor: '#D3BBFF' }}><div style={{ fontSize: 30 }}>✅</div><div className="v" style={{ color: 'var(--purple)' }}>{completed}</div><div className="l">บทที่จบ</div></div>
            </div>

            <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 20, padding: 22, marginBottom: 26 }}>
              <h4 style={{ fontSize: 18, margin: '0 0 16px' }}>สัปดาห์นี้ 🔥</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                {DAYS.map((d, i) => {
                  const active = i < Math.min(streak, 7);
                  return (
                    <div key={d} style={{ textAlign: 'center', flex: 1 }}>
                      <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: 14, background: active ? '#FFF2DC' : '#F4F0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, opacity: active ? 1 : 0.5 }}>{active ? '🔥' : '·'}</div>
                      <div style={{ fontFamily: 'Sarabun', fontWeight: 600, fontSize: 12, color: 'var(--muted2)', marginTop: 7 }}>{d}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <h4 style={{ fontSize: 20, margin: '0 0 16px' }}>เหรียญรางวัล</h4>
            <div className="grid4">
              {badges.map((b, i) => (
                <div key={i} className="statcard" style={{ opacity: b.on ? 1 : 0.85, background: b.on ? '#fff' : '#F7F4EC', borderColor: b.on ? '#B9EAB4' : '#EBE4D4' }}>
                  <div style={{ width: 56, height: 56, margin: '0 auto', borderRadius: '50%', background: b.on ? b.grad : '#E4DCCB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: b.on ? `0 4px 0 ${b.edge}` : 'none', filter: b.on ? 'none' : 'grayscale(1)' }}>{b.icon}</div>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 14, color: b.on ? 'var(--ink)' : 'var(--muted2)', marginTop: 10 }}>{b.title}</div>
                  <div style={{ fontFamily: 'Sarabun', fontWeight: 500, fontSize: 11, color: b.on ? 'var(--muted2)' : 'var(--muted3)', marginTop: 3 }}>{b.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 26, background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 24 }}>✏️</span>
              <div style={{ flex: 1, minWidth: 150, fontFamily: 'Sarabun', fontSize: 14, color: 'var(--muted2)' }}>{saved ? 'บันทึกแล้ว ✓' : 'เปลี่ยนชื่อหรือห้อง'}</div>
              <input style={inputStyle} placeholder="ชื่อเล่น" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
              <input style={inputStyle} placeholder="ห้อง (ถ้ามี)" value={classInput} onChange={(e) => setClassInput(e.target.value)} />
              <button className="btn3d blue" style={{ padding: '12px 22px' }} onClick={saveName}>บันทึก</button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex' }}>← กลับหน้าหลัก</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
