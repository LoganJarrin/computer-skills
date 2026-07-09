'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopBar from '@/components/TopBar';
import StudentStart from '@/components/StudentStart';
import { AREAS } from '@/lib/content';
import { getStudent, clearStudent, type Student } from '@/lib/progress';
import { areaStarsFor, touchStreak, getStreak, getDaily } from '@/lib/gamify';

type Style = { orb: string; accent: string; accentL: string; edge: string; desc: string };
const AREA_STYLE: Record<number, Style> = {
  0: { orb: 'linear-gradient(135deg,#DCE9FF,#A9CCFF)', accent: '#3A82F6', accentL: '#5CA0FF', edge: '#2E64D6', desc: 'รู้จักเครื่อง · เมาส์ · แป้นพิมพ์' },
  1: { orb: 'linear-gradient(135deg,#CFE9FF,#9CCBFF)', accent: '#2E9BFF', accentL: '#4FB0FF', edge: '#2277CC', desc: 'ค้นหา · ดูว่าจริงหรือหลอก · จัดเก็บ' },
  2: { orb: 'linear-gradient(135deg,#DFF6E4,#B0EAC1)', accent: '#38A93A', accentL: '#5CD35B', edge: '#2E8B30', desc: 'คุย · แบ่งปัน · มารยาท · ตัวตนดิจิทัล' },
  3: { orb: 'linear-gradient(135deg,#ECE0FF,#C9AEFF)', accent: '#9A5CF0', accentL: '#B583F5', edge: '#7C3EE0', desc: 'สร้างงาน · ลิขสิทธิ์ · เขียนโปรแกรม' },
  4: { orb: 'linear-gradient(135deg,#FFE2DF,#FFC0B9)', accent: '#F0982E', accentL: '#FFB456', edge: '#D07E1E', desc: 'ปกป้องเครื่อง · ข้อมูล · สุขภาพ · สิ่งแวดล้อม' },
  5: { orb: 'linear-gradient(135deg,#D9F3E0,#B4E6C2)', accent: '#2E9A57', accentL: '#46BD73', edge: '#227A44', desc: 'แก้ปัญหาเครื่อง · เลือกเครื่องมือ · คิดใหม่' },
};

const GAMES = [
  { href: '/legacy/unit1-computer-explorer.html', icon: '🖥️', title: 'สำรวจคอมพิวเตอร์', sub: 'รู้จักส่วนต่าง ๆ ของเครื่อง', orb: 'linear-gradient(135deg,#DCE9FF,#A9CCFF)', edge: '#2E64D6' },
  { href: '/legacy/unit2-click-accuracy-trainer.html', icon: '🖱️', title: 'ฝึกคลิกเมาส์', sub: 'เล็งและคลิกให้แม่นยำ', orb: 'linear-gradient(135deg,#FFE9CC,#FFCF99)', edge: '#D07E1E' },
  { href: '/legacy/unit3-keyboard-master.html', icon: '⌨️', title: 'ฝึกพิมพ์แป้นพิมพ์', sub: 'พิมพ์ให้เร็วและถูกต้อง', orb: 'linear-gradient(135deg,#E6DCFF,#C9AEFF)', edge: '#7C3EE0' },
];

export default function Home() {
  const [streak, setStreak] = useState(0);
  const [daily, setDaily] = useState({ done: 0, goal: 3 });
  const [pct, setPct] = useState<Record<number, number>>({});
  const [totalStars, setTotalStars] = useState(0);
  const [student, setStudentState] = useState<Student | null>(null);

  function loadStats() {
    setStreak(getStreak());
    setDaily(getDaily());
    const m: Record<number, number> = {};
    for (const a of AREAS) m[a.num] = Math.round((areaStarsFor(a.chapters.map((c) => c.code)) / (a.chapters.length * 3)) * 100);
    setPct(m);
    setTotalStars(AREAS.reduce((s, a) => s + areaStarsFor(a.chapters.map((c) => c.code)), 0));
  }

  useEffect(() => {
    touchStreak();
    loadStats();
    setStudentState(getStudent());
  }, []);

  function change() {
    clearStudent();
    window.location.reload();
  }

  function areaCard(a: (typeof AREAS)[number]) {
    const st = AREA_STYLE[a.num];
    const p = pct[a.num] || 0;
    const done = p >= 100;
    const lbl = a.num === 0 ? 'เริ่มต้น' : `ด้านที่ ${a.num}`;
    return (
      <Link key={a.num} className="card3d unit" href={`/area/${a.num}`} style={{ borderBottomColor: done ? '#38A93A' : st.edge }}>
        <div className="unit-top">
          <span className="unit-orb" style={{ background: st.orb }}>{a.mascot}</span>
          <div>
            <div className="unit-lbl" style={{ color: st.accent }}>{lbl} · {done ? 'สำเร็จ' : p > 0 ? `${p}%` : 'เริ่มเลย'}</div>
            <div className="unit-name">{a.title}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>{st.desc}</div>
        <div className="unit-foot">
          <div className="prog-track" style={{ background: p > 0 ? '#E4F3E9' : '#EDF2F7' }}><div className="prog-fill" style={{ width: `${p}%`, background: done ? '#3BA93C' : st.accent }} /></div>
          <span className="unit-go" style={{ background: done ? 'linear-gradient(135deg,#5CD35B,#38A93A)' : `linear-gradient(135deg,${st.accentL},${st.accent})`, boxShadow: `0 5px 0 ${done ? '#2E8B30' : st.edge}` }}>{done ? '✓' : '▶'}</span>
        </div>
      </Link>
    );
  }

  const name = student?.name ?? null;

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

            {student ? (
              <div style={{ background: '#fff', border: '2px solid var(--line)', borderBottomWidth: 5, borderRadius: 18, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 26 }}>🙋</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 16 }}>{student.name}</div>
                  <div style={{ fontFamily: 'Sarabun', fontSize: 13, color: 'var(--muted2)' }}>{student.school} · {student.grade}</div>
                </div>
                <button className="btn-ghost3d" style={{ padding: '9px 16px', fontSize: 14 }} onClick={change}>เปลี่ยน</button>
              </div>
            ) : (
              <StudentStart onDone={() => window.location.reload()} />
            )}

            <div className="section">
              <div className="sec-head">
                <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#DFF6E4,#B7ECC4)', boxShadow: '0 5px 0 #B7ECC4' }}>📚</span>
                <div style={{ flex: 1 }}>
                  <h3 className="sec-title">คอร์สทักษะคอมพิวเตอร์</h3>
                  <p className="sec-desc">เริ่มจากพื้นฐาน แล้วเรียน DigComp 3.0 ครบทั้ง 5 ด้าน · มีเสียงอ่านทุกบท</p>
                </div>
                <span className="sec-count" style={{ color: '#fff', background: '#38A93A', boxShadow: '0 4px 0 #2E8B30' }}>{totalStars} / 72 ⭐</span>
              </div>
              <div className="grid3">{AREAS.map(areaCard)}</div>
            </div>

            <div className="section">
              <div className="sec-head">
                <span className="sec-ico" style={{ background: 'linear-gradient(135deg,#FFE9CC,#FFCF99)', boxShadow: '0 5px 0 #FFD9A6' }}>🎮</span>
                <div style={{ flex: 1 }}>
                  <h3 className="sec-title">เกมฝึกทักษะ</h3>
                  <p className="sec-desc">ฝึกใช้เมาส์ แป้นพิมพ์ และรู้จักคอมพิวเตอร์แบบสนุก ๆ</p>
                </div>
              </div>
              <div className="grid3">
                {GAMES.map((g) => (
                  <a key={g.href} className="card3d unit" href={g.href} style={{ borderBottomColor: g.edge }}>
                    <div className="unit-top">
                      <span className="unit-orb" style={{ background: g.orb }}>{g.icon}</span>
                      <div>
                        <div className="unit-lbl" style={{ color: g.edge }}>เกม</div>
                        <div className="unit-name">{g.title}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)', margin: '2px 0 14px' }}>{g.sub}</div>
                    <div className="unit-foot">
                      <div className="prog-track" style={{ background: '#EDF2F7' }}><div className="prog-fill" style={{ width: '0%' }} /></div>
                      <span className="unit-go" style={{ background: `linear-gradient(135deg,${g.orb})`, boxShadow: `0 5px 0 ${g.edge}` }}>▶</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: 30, fontSize: 13, color: 'var(--muted2)', lineHeight: 1.8 }}>
              อ้างอิง <b>DigComp 3.0</b> (JRC, 2025) · พัฒนาโดย <b>PaoPao Punyasataporn</b><br />
              <Link href="/teacher" style={{ color: 'var(--green-d)', fontWeight: 600 }}>สำหรับคุณครู →</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
