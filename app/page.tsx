'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AREAS } from '@/lib/content';
import { getStudent, setStudent, areaStars } from '@/lib/progress';

const ACCENTS = ['#2E7DE0', '#0EA5B7', '#8B5CF6', '#E5484D', '#F5A524'];
const AREA_DESC: Record<number, string> = {
  1: 'ค้นหา · ดูว่าจริงหรือหลอก · จัดเก็บ',
  2: 'คุย · แบ่งปัน · มารยาท · ตัวตนดิจิทัล',
  3: 'สร้างงาน · ลิขสิทธิ์ · เขียนโปรแกรม',
  4: 'ปกป้องเครื่อง · ข้อมูล · สุขภาพ · สิ่งแวดล้อม',
  5: 'แก้ปัญหาเครื่อง · เลือกเครื่องมือ · คิดใหม่',
};

const GAMES = [
  { href: '/legacy/unit1-computer-explorer.html', emoji: '🖥️', title: 'สำรวจคอมพิวเตอร์', desc: 'ส่วนต่าง ๆ ของเครื่อง' },
  { href: '/legacy/unit2-click-accuracy-trainer.html', emoji: '🖱️', title: 'ฝึกคลิกเมาส์', desc: 'คลิก ลาก และวาง' },
  { href: '/legacy/unit3-keyboard-master.html', emoji: '⌨️', title: 'ฝึกพิมพ์แป้นพิมพ์', desc: 'รู้จักและพิมพ์ตัวอักษร' },
];

export default function Home() {
  const [name, setName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [stars, setStars] = useState<Record<number, number>>({});

  useEffect(() => {
    const s = getStudent();
    if (s) { setName(s.name); setClassCode(s.classCode); setSaved(s.name); }
    const map: Record<number, number> = {};
    for (const a of AREAS) map[a.num] = areaStars(a.chapters.map((c) => c.code));
    setStars(map);
  }, []);

  function saveName() {
    const n = name.trim();
    if (!n) return;
    setStudent({ name: n, classCode: classCode.trim() });
    setSaved(n);
  }

  return (
    <div className="home-wrap">
      <div className="hero">
        <span className="hero-icon">💻</span>
        <h1 className="hero-title">ทักษะคอมพิวเตอร์</h1>
        <p className="hero-sub">บทเรียนเชิงโต้ตอบ · มีเสียงอ่านทุกข้อความ · เลือกด้านที่อยากเรียน</p>
        <span className="hero-pill">🇪🇺 อ้างอิง DigComp 3.0 · ครบทั้ง 21 สมรรถนะ</span>
      </div>

      <div className="id-card">
        {saved ? (
          <div className="id-hello">👋 สวัสดี <b>{saved}</b>{classCode ? ` · ห้อง ${classCode}` : ''} <button className="id-edit" onClick={() => setSaved(null)}>เปลี่ยน</button></div>
        ) : (
          <div className="id-form">
            <span className="id-label">ใส่ชื่อเพื่อบันทึกความก้าวหน้า (ไม่ใส่ก็เรียนได้)</span>
            <div className="id-row">
              <input className="id-input" placeholder="ชื่อเล่น" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="id-input" placeholder="ห้อง (ถ้ามี)" value={classCode} onChange={(e) => setClassCode(e.target.value)} />
              <button className="id-save" onClick={saveName}>บันทึก</button>
            </div>
          </div>
        )}
      </div>

      <div className="sec-title">🚀 เริ่มต้น: รู้จักและใช้เครื่อง</div>
      <div className="sec-desc">ทักษะพื้นฐานก่อนเริ่มเรียน 5 ด้าน — รู้จักคอมพิวเตอร์ ใช้เมาส์ และแป้นพิมพ์</div>
      <div className="grid">
        {GAMES.map((g) => (
          <a className="card" key={g.href} href={g.href} style={{ ['--accent' as any]: '#2E7DE0' }}>
            <span className="card-emoji">{g.emoji}</span>
            <span className="card-mid">
              <span className="card-tag">พื้นฐาน</span>
              <span className="card-title">{g.title}</span>
              <span className="card-desc">{g.desc}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="sec-title">📚 5 ด้านของทักษะดิจิทัล (DigComp 3.0)</div>
      <div className="sec-desc">แต่ละด้านมีบทเรียนย่อยตามสมรรถนะ · ระดับพื้นฐาน · เหมาะกับเด็กประถม–มัธยมต้น</div>
      <div className="grid">
        {AREAS.map((a, i) => (
          <Link className="card" key={a.num} href={`/area/${a.num}`} style={{ ['--accent' as any]: ACCENTS[i] }}>
            <span className="card-emoji">{a.mascot}</span>
            <span className="card-mid">
              <span className="card-tag">ด้านที่ {a.num} · {a.chapters.length} บท{stars[a.num] ? ` · ⭐ ${stars[a.num]}` : ''}</span>
              <span className="card-title">{a.title}</span>
              <span className="card-desc">{AREA_DESC[a.num]}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="footer">
        อ้างอิง <strong>DigComp 3.0</strong> — กรอบสมรรถนะดิจิทัลของสหภาพยุโรป (JRC, 2025)<br />
        พัฒนาโดย <strong>PaoPao Punyasataporn</strong> · © 2026 สงวนลิขสิทธิ์
      </div>
    </div>
  );
}
