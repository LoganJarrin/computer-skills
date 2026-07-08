'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { AREAS } from '@/lib/content';
import { getStudent, setStudent } from '@/lib/progress';
import { computeStats, areaStarsFor, touchStreak, getStreak, getDaily } from '@/lib/gamify';

const GAMES = [
  { href: '/legacy/unit1-computer-explorer.html', emoji: '🖥️', n: 1, title: 'สำรวจคอมพิวเตอร์', orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#3A82F6', accentL: '#5CA0FF', edge: '#2E64D6' },
  { href: '/legacy/unit2-click-accuracy-trainer.html', emoji: '🖱️', n: 2, title: 'ฝึกคลิกเมาส์', orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC' },
  { href: '/legacy/unit3-keyboard-master.html', emoji: '⌨️', n: 3, title: 'ฝึกพิมพ์แป้นพิมพ์', orb: 'linear-gradient(135deg,#FFEFC7,#FFD98A)', accent: '#D9A31A', accentL: '#F0C33A', edge: '#B8880E' },
];

const AREA_STYLE: Record<number, { orb: string; accent: string; accentL: string; edge: string }> = {
  1: { orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC' },
  2: { orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#38A93A', accentL: '#5CD35B', edge: '#2E8B30' },
  3: { orb: 'linear-gradient(135deg,#ECE0FF,#C9AEFF)', accent: '#9A5CF0', accentL: '#B583F5', edge: '#7C3EE0' },
  4: { orb: 'linear-gradient(135deg,#FFE2DF,#FFC0B9)', accent: '#F0982E', accentL: '#FFB456', edge: '#D07E1E' },
  5: { orb: 'linear-gradient(135deg,#D9F3E0,#B4E6C2)', accent: '#2E9A57', accentL: '#46BD73', edge: '#227A44' },
};

const TABS = [
  { k: 'all', label: '🎯 ทั้งหมด', bg: '#4CC94D', sh: '0 6px 14px rgba(56,169,58,.4)' },
  { k: 'basics', label: '🖥️ พื้นฐาน', bg: '#3A82F6', sh: '0 6px 14px rgba(46,100,214,.4)' },
  { k: 'digcomp', label: '📚 DigComp', bg: '#38A93A', sh: '0 6px 14px rgba(56,169,58,.4)' },
];

const inputStyle: React.CSSProperties = { padding: '11px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6', minWidth: 110, flex: 1 };

export default function Home() {
  const [tab, setTab] = useState('all');
  const [stars, setStars] = useState(0);
  const [streak, setStreak] = useState(0);
  const [daily, setDaily] = useState({ done: 0, goal: 3 });
  const [areaPct, setAreaPct] = useState<Record<number, { pct: number; stars: number }>>({});
  const [name, setName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [classInput, setClassInput] = useState('');

  useEffect(() => {
    touchStreak();
    setStreak(getStreak());
    setStars(computeStats().stars);
    setDaily(getDaily());
    const m: Record<number, { pct: number; stars: number }> = {};
    for (const a of AREAS) {
      const s = areaStarsFor(a.chapters.map((c) => c.code));
      m[a.num] = { stars: s, pct: Math.round((s / (a.chapters.length * 3)) * 100) };
    }
    setAreaPct(m);
    setName(getStudent()?.name ?? null);
  }, []);

  function saveName() {
    const n = nameInput.trim();
    if (!n) return;
    setStudent({ name: n, classCode: classInput.trim() });
    setName(n);
  }

  const showBasics = tab === 'all' || tab === 'basics';
  const showDig = tab === 'all' || tab === 'digcomp';

  return (
    <div className="page">
      <div className="shell">
        <div className="appwin">
          <TopBar />
          <div className="appbody">

            <div className="banner green">
              <div className="banner-orb pulse">🔥</div>
              <div style={{ flex: 1 }}>
                <div className="banner-title">{streak > 0 ? `สตรีค ${streak} วันแล้ว${name ? ', ' + name : ''}!` : `ยินดีต้อนรับ${name ? ', ' + name : ''}!`}</div>
                <div className="banner-sub">{daily.done >= daily.goal ? 'ทำเป้าหมายวันนี้ครบแล้ว เยี่ยมมาก! 🎉' : 'เรียนอีกนิดวันนี้ เพื่อรักษาสตรีคเอาไว้'}</div>
              </div>
              <div className="goal">
                <div className="goal-lbl">เป้าหมายวันนี้</div>
                <div className="goal-track"><div className="goal-fill" style={{ width: `${Math.min(100, (daily.done / daily.goal) * 100)}%` }} /></div>
                <div className="goal-num">{daily.done} / {daily.goal} บท</div>
              </div>
            </div>

            {!name && (
              <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 30 }}>👋</span>
                <div style={{ flex: 1, minWidth: 170 }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16, color: 'var(--ink)' }}>ใส่ชื่อเพื่อบันทึกความก้าวหน้า</div>
                  <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>ไม่ใส่ก็เรียนได้ · ใส่แล้วจะขึ้นกระดานผู้นำ</div>
                </div>
                <input style={inputStyle} placeholder="ชื่อเล่น" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
                <input style={inputStyle} placeholder="ห้อง (ถ้ามี)" value={classInput} onChange={(e) => setClassInput(e.target.value)} />
                <button className="btn3d blue" style={{ padding: '12px 22px' }} onClick={saveName}>บันทึก</button>
              </div>
            )}

            <div className="tabs">
              {TABS.map((t) => (
                <button key={t.k} className={`tab${tab === t.k ? ' on' : ''}`} onClick={() => setTab(t.k)}
                  style={tab === t.k ? { background: t.bg, color: '#fff', boxShadow: t.sh } : undefined}>{t.label}</button>
              ))}
            </div>

            {showBasics && (
              <div className="section">
                <div className="sec-head">
                  <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#DCE9FF,#A9CCFF)', boxShadow: '0 5px 0 #B9D4FF' }}>🖥️</span>
                  <div style={{ flex: 1 }}>
                    <h3 className="sec-title">พื้นฐานคอมพิวเตอร์</h3>
                    <p className="sec-desc">เริ่มต้นใช้งานอุปกรณ์ของคุณ (เกมฝึกทักษะ)</p>
                  </div>
                  <span className="sec-count" style={{ color: '#fff', background: '#3A82F6', boxShadow: '0 4px 0 #2E64D6' }}>3 หน่วย</span>
                </div>
                <div className="grid3">
                  {GAMES.map((g) => (
                    <a key={g.href} className="card3d unit" href={g.href} style={{ borderBottomColor: g.edge }}>
                      <div className="unit-top">
                        <span className="unit-orb" style={{ background: g.orb }}>{g.emoji}</span>
                        <div>
                          <div className="unit-lbl" style={{ color: g.accent }}>หน่วย {g.n} · เริ่มเลย</div>
                          <div className="unit-name">{g.title}</div>
                        </div>
                      </div>
                      <div className="unit-foot">
                        <div className="prog-track" style={{ background: '#EDF2F7' }}><div className="prog-fill" style={{ width: '0%', background: g.accent }} /></div>
                        <span className="unit-go" style={{ background: `linear-gradient(135deg,${g.accentL},${g.accent})`, boxShadow: `0 5px 0 ${g.edge}` }}>▶</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {showDig && (
              <div className="section">
                <div className="sec-head">
                  <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B7ECC4)', boxShadow: '0 5px 0 #B7ECC4' }}>📚</span>
                  <div style={{ flex: 1 }}>
                    <h3 className="sec-title">บทเรียน DigComp 3.0</h3>
                    <p className="sec-desc">ทักษะดิจิทัล 5 ด้าน · 21 สมรรถนะ · มีเสียงอ่าน</p>
                  </div>
                  <span className="sec-count" style={{ color: '#fff', background: '#38A93A', boxShadow: '0 4px 0 #2E8B30' }}>{stars} / 63 ⭐</span>
                </div>
                <div className="grid3">
                  {AREAS.map((a) => {
                    const st = AREA_STYLE[a.num];
                    const p = areaPct[a.num] || { pct: 0, stars: 0 };
                    const done = p.pct >= 100;
                    return (
                      <Link key={a.num} className="card3d unit" href={`/area/${a.num}`} style={{ borderBottomColor: done ? '#38A93A' : st.edge }}>
                        <div className="unit-top">
                          <span className="unit-orb" style={{ background: st.orb }}>{a.mascot}</span>
                          <div>
                            <div className="unit-lbl" style={{ color: st.accent }}>ด้านที่ {a.num} · {done ? 'สำเร็จ' : p.pct > 0 ? `${p.pct}%` : 'เริ่มเลย'}</div>
                            <div className="unit-name">{a.title}</div>
                          </div>
                        </div>
                        <div className="unit-foot">
                          <div className="prog-track" style={{ background: p.pct > 0 ? '#E4F3E9' : '#EDF2F7' }}><div className="prog-fill" style={{ width: `${p.pct}%`, background: done ? '#3BA93C' : st.accent }} /></div>
                          <span className="unit-go" style={{ background: done ? 'linear-gradient(135deg,#5CD35B,#38A93A)' : `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${done ? '#2E8B30' : st.edge}` }}>{done ? '✓' : '▶'}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 30, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
              อ้างอิง <b>DigComp 3.0</b> (JRC, 2025) · พัฒนาโดย <b>PaoPao Punyasataporn</b>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
