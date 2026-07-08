'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import { AREAS } from '@/lib/content';
import { getStudent, setStudent } from '@/lib/progress';
import { computeStats, areaStarsFor, touchStreak, getStreak, getDaily } from '@/lib/gamify';

const AREA_STYLE: Record<number, { orb: string; accent: string; accentL: string; edge: string; desc: string }> = {
  1: { orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC', desc: 'ค้นหา · ดูว่าจริงหรือหลอก · จัดเก็บ' },
  2: { orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#38A93A', accentL: '#5CD35B', edge: '#2E8B30', desc: 'คุย · แบ่งปัน · มารยาท · ตัวตนดิจิทัล' },
  3: { orb: 'linear-gradient(135deg,#ECE0FF,#C9AEFF)', accent: '#9A5CF0', accentL: '#B583F5', edge: '#7C3EE0', desc: 'สร้างงาน · ลิขสิทธิ์ · เขียนโปรแกรม' },
  4: { orb: 'linear-gradient(135deg,#FFE2DF,#FFC0B9)', accent: '#F0982E', accentL: '#FFB456', edge: '#D07E1E', desc: 'ปกป้องเครื่อง · ข้อมูล · สุขภาพ · สิ่งแวดล้อม' },
  5: { orb: 'linear-gradient(135deg,#D9F3E0,#B4E6C2)', accent: '#2E9A57', accentL: '#46BD73', edge: '#227A44', desc: 'แก้ปัญหาเครื่อง · เลือกเครื่องมือ · คิดใหม่' },
};

const inputStyle: React.CSSProperties = { padding: '11px 14px', border: '1.5px solid var(--line)', borderRadius: 12, fontFamily: 'Sarabun', fontSize: 15, background: '#FFFDF6', minWidth: 110, flex: 1 };

export default function Home() {
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

            <div className="section">
              <div className="sec-head">
                <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B7ECC4)', boxShadow: '0 5px 0 #B7ECC4' }}>📚</span>
                <div style={{ flex: 1 }}>
                  <h3 className="sec-title">บทเรียนทักษะดิจิทัล</h3>
                  <p className="sec-desc">DigComp 3.0 · 5 ด้าน · 21 สมรรถนะ · มีเสียงอ่านทุกบท</p>
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
                      <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>{st.desc}</div>
                      <div className="unit-foot">
                        <div className="prog-track" style={{ background: p.pct > 0 ? '#E4F3E9' : '#EDF2F7' }}><div className="prog-fill" style={{ width: `${p.pct}%`, background: done ? '#3BA93C' : st.accent }} /></div>
                        <span className="unit-go" style={{ background: done ? 'linear-gradient(135deg,#5CD35B,#38A93A)' : `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${done ? '#2E8B30' : st.edge}` }}>{done ? '✓' : '▶'}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.7 }}>
              อ้างอิง <b>DigComp 3.0</b> (JRC, 2025) · พัฒนาโดย <b>PaoPao Punyasataporn</b>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
