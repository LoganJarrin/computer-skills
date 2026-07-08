'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Area } from '@/lib/content';
import { speak, stop, isMuted, setMuted } from '@/lib/tts';
import { saveProgress, getProgressMap } from '@/lib/progress';

type Screen = 'home' | 'lesson' | 'complete';

const CONFETTI = ['#5CD35B', '#FFC24B', '#2E9BFF', '#9A5CF0', '#FF6F6F', '#5CD35B', '#FFC24B'];

export default function LessonApp({ area }: { area: Area }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [ci, setCi] = useState(0);
  const [si, setSi] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [chapCorrect, setChapCorrect] = useState(0);
  const [lastStars, setLastStars] = useState(3);
  const [muted, setMutedState] = useState(false);
  const [progMap, setProgMap] = useState<Record<string, { stars: number }>>({});

  useEffect(() => { setMutedState(isMuted()); setProgMap(getProgressMap()); }, []);

  const chapter = area.chapters[ci];
  const slide = chapter?.slides[si];
  const quizTotal = useMemo(() => (chapter ? chapter.slides.filter((s) => s.type === 'quiz').length : 0), [chapter]);
  const correctIdx = slide?.opts?.findIndex((o) => o.correct) ?? -1;

  useEffect(() => {
    if (screen !== 'lesson' || !slide) return;
    const say = slide.say || (slide.type === 'quiz' ? slide.q : `${slide.title ?? ''} ${slide.body ?? ''}`);
    const t = setTimeout(() => speak(say ?? ''), 350);
    return () => clearTimeout(t);
  }, [screen, ci, si, slide]);

  function toggleMute() { const m = !muted; setMuted(m); setMutedState(m); }
  function startChapter(i: number) { setCi(i); setSi(0); setChapCorrect(0); setSelected(null); setAnswered(false); setScreen('lesson'); }
  function goHome() { stop(); setProgMap(getProgressMap()); setScreen('home'); }

  function check() {
    if (selected === null || answered) return;
    setAnswered(true);
    const o = slide!.opts![selected];
    if (o.correct) { setChapCorrect((c) => c + 1); confetti(); }
    speak(o.fb);
  }

  function next() {
    if (!chapter) return;
    if (si >= chapter.slides.length - 1) { finish(); return; }
    setSi(si + 1); setSelected(null); setAnswered(false);
  }

  function finish() {
    const stars = quizTotal === 0 ? 3 : chapCorrect >= quizTotal ? 3 : chapCorrect >= Math.ceil(quizTotal / 2) ? 2 : 1;
    setLastStars(stars);
    saveProgress(area.num, chapter.code, stars, chapCorrect, quizTotal);
    confetti(50);
    setScreen('complete');
  }
  function nextChapter() { if (ci < area.chapters.length - 1) startChapter(ci + 1); else goHome(); }

  const progPct = chapter ? Math.round(((si + (answered ? 1 : 0)) / chapter.slides.length) * 100) : 0;

  return (
    <div className="page">
      <button className="mutebtn" onClick={toggleMute} title="เปิด/ปิดเสียง">{muted ? '🔇' : '🔊'}</button>
      <div className="shell">

        {/* ===== AREA HOME (chapter list) ===== */}
        {screen === 'home' && (
          <>
            <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>← กลับหน้าหลัก</Link>
            <div className="appwin" style={{ background: '#FFFDF6' }}>
              <div style={{ background: 'linear-gradient(135deg,#5CD35B,#3BA93C)', padding: '30px 34px', display: 'flex', alignItems: 'center', gap: 22, color: '#fff', flexWrap: 'wrap' }}>
                <span style={{ width: 92, height: 92, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, animation: 'csfloat 3s ease-in-out infinite' }}>{area.mascot}</span>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontFamily: 'Mitr', fontWeight: 700, fontSize: 13, opacity: 0.9, marginBottom: 6 }}>DigComp 3.0 · ด้านที่ {area.num} · {area.chapters.length} บท · ระดับพื้นฐาน</div>
                  <h2 style={{ fontWeight: 700, fontSize: 28, lineHeight: 1.15, margin: '0 0 6px' }}>{area.title}</h2>
                  <p style={{ fontFamily: 'Sarabun', fontWeight: 500, fontSize: 15, opacity: 0.92, margin: 0 }}>{area.sub}</p>
                </div>
              </div>
              <div style={{ padding: '26px 30px 34px' }}>
                <h4 style={{ fontSize: 19, marginBottom: 18, color: 'var(--ink)' }}>บทเรียนในด้านนี้</h4>
                <div className="grid3">
                  {area.chapters.map((c, i) => {
                    const st = progMap[c.code]?.stars || 0;
                    const done = st > 0;
                    return (
                      <button key={c.code} className="card3d unit" onClick={() => startChapter(i)} style={{ borderBottomColor: done ? '#38A93A' : '#D8CDB6' }}>
                        <div className="unit-top">
                          <span className="unit-orb" style={{ background: c.ai ? 'linear-gradient(135deg,#ECE0FF,#C9AEFF)' : 'linear-gradient(135deg,#DFF6E4,#B0EAC1)' }}>{c.icon}</span>
                          <div>
                            <div className="unit-lbl" style={{ color: c.ai ? '#9A5CF0' : '#38A93A' }}>{c.code}{c.ai ? ' · AI' : ''}{done ? ' · ' + '⭐'.repeat(st) : ' · เริ่มเลย'}</div>
                            <div className="unit-name">{c.th}</div>
                          </div>
                        </div>
                        <div className="unit-foot">
                          <div className="prog-track" style={{ background: done ? '#E4F3E9' : '#EDF2F7' }}><div className="prog-fill" style={{ width: `${(st / 3) * 100}%`, background: '#3BA93C' }} /></div>
                          <span className="unit-go" style={{ background: 'linear-gradient(135deg,#5CD35B,#38A93A)', boxShadow: '0 5px 0 #2E8B30' }}>{done ? '✓' : '▶'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== LESSON PLAYER ===== */}
        {screen === 'lesson' && slide && (
          <div className="appwin" style={{ background: '#FFFDF6' }}>
            <div className="player-bar">
              <button className="pclose" onClick={goHome}>✕</button>
              <div className="pbar-track"><div className="pbar-fill" style={{ width: `${progPct}%` }} /></div>
              <span className="pstep">บทที่ {si + 1} จาก {chapter.slides.length}</span>
            </div>
            <div className="player-body">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div className="p-icon" style={{ background: chapter.ai ? 'linear-gradient(135deg,#ECE0FF,#C9AEFF)' : 'linear-gradient(135deg,#DCE9FF,#A9CCFF)' }}>{slide.icon || chapter.icon}</div>
                {slide.type === 'explain' ? (
                  <>
                    <h2 className="p-name">{slide.title}</h2>
                    <p className="p-concept">{slide.body}</p>
                    {slide.html && <div style={{ marginTop: 16 }} dangerouslySetInnerHTML={{ __html: slide.html }} />}
                  </>
                ) : (
                  <h2 className="p-name" style={{ fontSize: 20, color: 'var(--muted2)' }}>{chapter.code} {chapter.th}</h2>
                )}
              </div>

              {slide.type === 'quiz' && (
                <div className="q-card">
                  <div className="q-tag">ลองตอบดู 🤔</div>
                  <div className="q-text">{slide.q}<button className="osay" style={{ display: 'inline-flex', marginLeft: 8, verticalAlign: 'middle' }} onClick={() => speak(slide.q || '')}>🔊</button></div>
                  <div className="opts">
                    {slide.opts?.map((o, idx) => {
                      let cls = 'opt';
                      if (!answered) cls += idx === selected ? ' sel' : '';
                      else cls += ' locked' + (idx === correctIdx ? ' correct' : idx === selected ? ' wrong' : '');
                      return (
                        <button key={idx} className={cls} onClick={() => !answered && setSelected(idx)}>
                          <span className="oemoji">{o.icon}</span>
                          <span>{o.label}</span>
                          <span className="osay" onClick={(e) => { e.stopPropagation(); speak(o.label); }}>🔊</span>
                        </button>
                      );
                    })}
                  </div>
                  {answered && selected !== null && (
                    <div className={`explain${slide.opts?.[selected]?.correct ? '' : ' err'}`}>
                      {slide.opts?.[selected]?.correct ? '✅ ถูกต้อง! ' : '💡 '}{slide.opts?.[selected]?.fb}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="player-cta">
              {slide.type === 'explain' || answered ? (
                <button className="checkbtn next" onClick={next}>{si === chapter.slides.length - 1 ? 'จบบท ✓' : 'ต่อไป →'}</button>
              ) : (
                <button className={`checkbtn${selected !== null ? ' ready' : ''}`} onClick={check}>ตรวจคำตอบ</button>
              )}
            </div>
          </div>
        )}

        {/* ===== COMPLETE ===== */}
        {screen === 'complete' && (
          <div className="complete">
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {CONFETTI.map((c, i) => (
                <span key={i} className="confetti-pc" style={{ left: `${10 + i * 12}%`, width: 11, height: 11, borderRadius: i % 2 ? '50%' : 3, background: c, animation: `csfall ${2.4 + (i % 4) * 0.2}s ease-in ${i * 0.12}s infinite` }} />
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <div className="c-trophy">{lastStars === 3 ? '🏆' : lastStars === 2 ? '🎉' : '🌟'}</div>
              <h1 className="c-title">เก่งมาก! 🎉</h1>
              <p className="c-sub">คุณเรียนจบบท “{chapter.th}” แล้ว</p>
              <div className="c-stats">
                <div className="c-stat"><div className="v" style={{ color: 'var(--green-d)' }}>+{lastStars * 20} XP</div><div className="l">ได้รับ</div></div>
                <div className="c-stat"><div className="v" style={{ color: 'var(--amber)' }}>{'⭐'.repeat(lastStars)}{'☆'.repeat(3 - lastStars)}</div><div className="l">ดาว</div></div>
                <div className="c-stat"><div className="v" style={{ color: 'var(--blue)' }}>💎 +{lastStars * 5}</div><div className="l">เพชร</div></div>
              </div>
              <div className="c-btns">
                {ci < area.chapters.length - 1 && <button className="btn3d" onClick={nextChapter}>เรียนบทต่อไป →</button>}
                <button className="btn-ghost3d" onClick={goHome}>กลับหน้าด้านนี้</button>
                <Link className="btn-ghost3d" href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>หน้าหลัก</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function confetti(n = 20) {
  if (typeof document === 'undefined') return;
  const cols = ['#5CD35B', '#FFC24B', '#2E9BFF', '#9A5CF0', '#FF6F6F'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    const s = 7 + Math.random() * 7;
    c.style.cssText = `position:fixed;top:-14px;left:${Math.random() * 100}vw;width:${s}px;height:${s * 0.6}px;border-radius:2px;z-index:60;pointer-events:none;background:${cols[Math.floor(Math.random() * cols.length)]};`;
    const d = 2.2 + Math.random() * 1.4;
    c.style.animation = `csfall ${d}s linear forwards`;
    document.body.appendChild(c);
    setTimeout(() => c.remove(), (d + 0.6) * 1000);
  }
}
