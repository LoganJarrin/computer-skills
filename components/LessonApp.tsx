'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Area } from '@/lib/content';
import { speak, stop, isMuted, setMuted } from '@/lib/tts';
import { saveProgress } from '@/lib/progress';

type Screen = 'home' | 'lesson' | 'results';

export default function LessonApp({ area }: { area: Area }) {
  const [screen, setScreen] = useState<Screen>('home');
  const [ci, setCi] = useState(0);
  const [si, setSi] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [chapCorrect, setChapCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [lastStars, setLastStars] = useState(3);
  const [muted, setMutedState] = useState(false);

  useEffect(() => { setMutedState(isMuted()); }, []);

  const chapter = area.chapters[ci];
  const slide = chapter?.slides[si];
  const quizTotal = useMemo(
    () => (chapter ? chapter.slides.filter((s) => s.type === 'quiz').length : 0),
    [chapter]
  );

  // auto read-aloud on each slide
  useEffect(() => {
    if (screen !== 'lesson' || !slide) return;
    const say = slide.say || (slide.type === 'quiz' ? slide.q : `${slide.title ?? ''} ${slide.body ?? ''}`);
    const t = setTimeout(() => speak(say ?? ''), 350);
    return () => clearTimeout(t);
  }, [screen, ci, si, slide]);

  function toggleMute() { const m = !muted; setMuted(m); setMutedState(m); }

  function startChapter(i: number) {
    setCi(i); setSi(0); setChapCorrect(0); setAnswered(false); setPicked(null); setScreen('lesson');
  }
  function goHome() { stop(); setScreen('home'); }

  function pick(idx: number) {
    if (answered || !slide?.opts) return;
    setAnswered(true); setPicked(idx);
    const o = slide.opts[idx];
    if (o.correct) { setCorrect((c) => c + 1); setChapCorrect((c) => c + 1); confetti(); }
    speak(o.fb);
  }

  function next() {
    if (!chapter) return;
    if (si >= chapter.slides.length - 1) { finish(); return; }
    setSi(si + 1); setAnswered(false); setPicked(null);
  }

  function finish() {
    const stars = quizTotal === 0 ? 3 : chapCorrect >= quizTotal ? 3 : chapCorrect >= Math.ceil(quizTotal / 2) ? 2 : 1;
    setLastStars(stars);
    saveProgress(area.num, chapter.code, stars, chapCorrect, quizTotal);
    confetti(60);
    setScreen('results');
  }

  function nextChapter() {
    if (ci < area.chapters.length - 1) startChapter(ci + 1);
    else goHome();
  }

  const progPct = chapter ? (si / chapter.slides.length) * 100 : 0;

  return (
    <div className="wrap">
      <button className="mute-btn" onClick={toggleMute} title="เปิด/ปิดเสียง">{muted ? '🔇' : '🔊'}</button>

      {/* HOME */}
      {screen === 'home' && (
        <div className="screen">
          <div style={{ textAlign: 'center' }}>
            <span className="area-pill">🇪🇺 DigComp 3.0 · ด้านที่ {area.num} · ระดับพื้นฐาน</span>
          </div>
          <div className="intro-card">
            <span className="intro-mascot">{area.mascot}</span>
            <div className="intro-title">{area.title}</div>
            <div className="intro-sub">{area.sub}</div>
          </div>
          <div className="ch-list">
            {area.chapters.map((c, i) => (
              <button key={c.code} className="ch-card" onClick={() => startChapter(i)}>
                <span className="ch-emoji">{c.icon}</span>
                <span className="ch-mid">
                  <span className="ch-code">{c.code}{c.ai && <span className="ai-tag">AI</span>}</span>
                  <span className="ch-title">{c.th}</span>
                  <span className="ch-desc">{c.desc}</span>
                </span>
                <span className="ch-go">▶</span>
              </button>
            ))}
          </div>
          <div className="home-foot"><Link href="/">← กลับหน้าแรก</Link></div>
        </div>
      )}

      {/* LESSON */}
      {screen === 'lesson' && slide && (
        <div className="screen">
          <div className="dc-header">
            DigComp 3.0 · <b>ด้านที่ {area.num}</b> · {chapter.code} {chapter.th} · ระดับพื้นฐาน{chapter.ai ? ' · ' : ''}{chapter.ai && <b>AI</b>}
          </div>
          <div className="hud">
            <button className="back-btn" onClick={goHome} title="กลับ">←</button>
            <div className="hud-title">{chapter.code} {chapter.th}</div>
            <div className="hud-score">⭐ {correct}</div>
          </div>
          <div className="prog"><div className="prog-fill" style={{ width: `${progPct}%` }} /></div>

          {slide.type === 'explain' ? (
            <div className="content-card">
              {slide.tag && <div className="cc-tag">{slide.tag}</div>}
              <div className="cc-icon">{slide.icon || '📘'}</div>
              <div className="cc-title">{slide.title}</div>
              <div className="cc-body">{slide.body}</div>
              {slide.html && <div dangerouslySetInnerHTML={{ __html: slide.html }} />}
              <button className="say-btn" onClick={() => speak(slide.say || `${slide.title} ${slide.body}`)}>🔊 ฟังอีกครั้ง</button>
            </div>
          ) : (
            <div className="quiz-card">
              <div className="q-icon">{slide.icon || '❓'}</div>
              <div className="q-prompt">{slide.q}<button className="say-inline" onClick={() => speak(slide.q || '')}>🔊</button></div>
              <div className="opts">
                {slide.opts?.map((o, idx) => {
                  const cls = answered ? (o.correct ? 'opt-btn locked correct' : idx === picked ? 'opt-btn locked wrong' : 'opt-btn locked') : 'opt-btn';
                  return (
                    <button key={idx} className={cls} onClick={() => pick(idx)}>
                      <span className="opt-emoji">{o.icon}</span>
                      <span className="opt-label">{o.label}</span>
                      <span className="opt-say" title="ฟังเสียง" onClick={(e) => { e.stopPropagation(); speak(o.label); }}>🔊</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {answered && slide.type === 'quiz' && picked !== null && (
            <div className={`feedback show ${slide.opts?.[picked]?.correct ? 'ok' : 'err'}`}>
              {slide.opts?.[picked]?.correct ? '✅ ' : '❌ '}{slide.opts?.[picked]?.fb}
            </div>
          )}

          {(slide.type === 'explain' || answered) && (
            <button className="btn-next" onClick={next}>
              {si === chapter.slides.length - 1 ? 'จบบท ✓' : 'ต่อไป →'}
            </button>
          )}
        </div>
      )}

      {/* RESULTS */}
      {screen === 'results' && (
        <div className="screen">
          <div className="res-card">
            <span className="res-icon">{lastStars === 3 ? '🏆' : lastStars === 2 ? '🎉' : '🌟'}</span>
            <div className="res-title">เยี่ยมมาก! จบบท {chapter.code}</div>
            <div className="res-sub">น้องเรียน “{chapter.th}” จบแล้ว</div>
            <div className="res-stats">
              <div className="rs"><div className="rs-val">{chapCorrect}/{quizTotal}</div><div className="rs-lbl">ตอบถูก</div></div>
              <div className="rs"><div className="rs-val">{'⭐'.repeat(lastStars)}{'☆'.repeat(3 - lastStars)}</div><div className="rs-lbl">ดาว</div></div>
            </div>
            <div className="res-btns">
              {ci < area.chapters.length - 1 && (
                <button className="btn-primary" onClick={nextChapter}>บทต่อไป: {area.chapters[ci + 1].code} {area.chapters[ci + 1].th} →</button>
              )}
              <button className="btn-ghost" onClick={goHome}>กลับเมนูบทเรียน</button>
              <Link className="btn-ghost" href="/" style={{ textAlign: 'center' }}>กลับหน้าแรก</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// lightweight confetti
function confetti(n = 24) {
  if (typeof document === 'undefined') return;
  const cols = ['#5BA8FF', '#56D364', '#C99BFF', '#FFC857', '#FF8FB1', '#5BE0D0'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    const s = 6 + Math.random() * 8;
    c.style.width = s + 'px'; c.style.height = s * 0.6 + 'px';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = cols[Math.floor(Math.random() * cols.length)];
    const d = 2.2 + Math.random() * 1.6;
    c.style.animation = `fall ${d}s linear forwards`;
    c.style.animationDelay = Math.random() * 0.3 + 's';
    document.body.appendChild(c);
    setTimeout(() => c.remove(), (d + 0.6) * 1000);
  }
}
