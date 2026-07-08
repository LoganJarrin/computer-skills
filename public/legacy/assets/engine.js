// ═══════════════════════════════════════════════════════════════
//  DigComp 3.0 lesson engine (shared by all area apps)
//  Reads two globals set inline per page:
//    window.AREA     = {num, mascot, title, sub}
//    window.CHAPTERS = [{code, ai, icon, th, desc, slides:[...]}]
//  Slide shapes:
//    {type:'explain', tag, icon, title, body, html?, say?}
//    {type:'quiz',    icon, q, say?, opts:[{icon,label,correct,fb}]}
// ═══════════════════════════════════════════════════════════════

// state (var → window.* so the dlf layer can auto-cheer on correct / streak)
var correct = 0;
var streak = 0;
var ci = 0, si = 0;
var chapCorrect = 0, chapTotal = 0, answered = false;

const $ = id => document.getElementById(id);
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');}
function cur(){return CHAPTERS[ci];}

// ── HOME ──
function renderHome(){
  const A = window.AREA || {num:1,mascot:'📘',title:'',sub:''};
  const pill = document.querySelector('.area-pill'); if(pill) pill.textContent = `🇪🇺 DigComp 3.0 · ด้านที่ ${A.num} · ระดับพื้นฐาน`;
  const m = document.querySelector('.intro-mascot'); if(m) m.textContent = A.mascot;
  const t = document.querySelector('.intro-title'); if(t) t.textContent = A.title;
  const s = document.querySelector('.intro-sub'); if(s) s.textContent = A.sub;
  document.title = `ด้านที่ ${A.num} · ${A.title}`;
  $('chList').innerHTML = CHAPTERS.map((c,i)=>`
    <button class="ch-card" onclick="startChapter(${i})">
      <span class="ch-emoji">${c.icon}</span>
      <span class="ch-mid">
        <span class="ch-code">${c.code}${c.ai?'<span class="ai-tag">AI</span>':''}</span>
        <span class="ch-title">${c.th}</span>
        <span class="ch-desc">${c.desc}</span>
      </span>
      <span class="ch-go">▶</span>
    </button>`).join('');
}
function goHome(){ if(window.dlf) dlf.stop(); renderHome(); show('home'); }

// ── LESSON ──
function startChapter(i){
  ci=i; si=0; chapCorrect=0; answered=false;
  chapTotal = cur().slides.filter(s=>s.type==='quiz').length;
  const c = cur(), num = (window.AREA&&window.AREA.num)||1;
  $('dcHeader').innerHTML = `DigComp 3.0 · <b>ด้านที่ ${num}</b> · ${c.code} ${c.th} · ระดับพื้นฐาน${c.ai?' · <b>AI</b>':''}`;
  $('hudTitle').textContent = `${c.code} ${c.th}`;
  updateScore();
  show('lesson');
  renderSlide();
}

function renderSlide(){
  answered=false;
  const c=cur(), s=c.slides[si];
  const fb=$('feedback'); fb.className='feedback'; fb.textContent='';
  const next=$('btnNext'); next.classList.remove('show');
  $('progFill').style.width = ((si)/(c.slides.length))*100 + '%';
  next.textContent = (si===c.slides.length-1)?'จบบท ✓':'ต่อไป →';

  if(s.type==='explain'){
    $('lessonContent').innerHTML = `<div class="content-card">
      <div class="cc-tag">${s.tag||''}</div>
      <div class="cc-icon">${s.icon||'📘'}</div>
      <div class="cc-title">${s.title}</div>
      <div class="cc-body">${s.body}</div>
      ${s.html||''}
    </div>`;
    next.classList.add('show');
  } else { // quiz
    $('lessonContent').innerHTML = `<div class="quiz-card">
      <div class="q-icon">${s.icon||'❓'}</div>
      <div class="q-prompt">${s.q}</div>
      <div class="opts">
        ${s.opts.map((o,idx)=>`<button class="opt-btn" onclick="pickOption(${idx},this)">
            <span class="opt-emoji">${o.icon}</span><span class="opt-label">${o.label}</span>
            <span class="opt-say" title="ฟังเสียง" data-say="${o.label}" onclick="event.stopPropagation();event.preventDefault();window.dlf&&dlf.speak(this.getAttribute('data-say'));">🔊</span>
          </button>`).join('')}
      </div>
    </div>`;
  }
  const sayText = s.say || (s.type==='quiz' ? s.q : (s.title+' '+s.body));
  setTimeout(()=>{ if(window.dlf) dlf.speak(sayText); }, 350);
}

function pickOption(idx, btn){
  if(answered) return; answered=true;
  const s=cur().slides[si], o=s.opts[idx];
  document.querySelectorAll('.opt-btn').forEach((b,i)=>{b.classList.add('locked'); if(s.opts[i].correct)b.classList.add('correct');});
  if(!o.correct) btn.classList.add('wrong');
  if(o.correct){correct++;streak++;chapCorrect++;} else {streak=0;}
  updateScore();
  const fb=$('feedback');
  fb.className='feedback show '+(o.correct?'ok':'err');
  fb.textContent=(o.correct?'✅ ':'❌ ')+o.fb;
  if(window.dlf){ dlf.speak(o.fb); if(o.correct) dlf.confetti(18); }
  $('btnNext').classList.add('show');
}

function nextSlide(){
  const c=cur();
  if(si>=c.slides.length-1){ finishChapter(); return; }
  si++; renderSlide();
}

function updateScore(){ $('scoreDisp').textContent = '⭐ ' + correct; }

function finishChapter(){
  $('progFill').style.width='100%';
  const stars = chapTotal===0 ? 3 : (chapCorrect>=chapTotal ? 3 : (chapCorrect>=Math.ceil(chapTotal/2) ? 2 : 1));
  window.__stars = stars;
  $('resTrophy').textContent = stars===3?'🏆':(stars===2?'🎉':'🌟');
  $('resTitle').textContent = `เยี่ยมมาก! จบบท ${cur().code}`;
  $('resSub').textContent = `น้องเรียน “${cur().th}” จบแล้ว`;
  $('rsCorrect').textContent = `${chapCorrect}/${chapTotal}`;
  $('rsStars').textContent = '⭐'.repeat(stars)+'☆'.repeat(3-stars);
  const nb=$('resNext');
  if(ci < CHAPTERS.length-1){ nb.style.display=''; nb.textContent = `บทต่อไป: ${CHAPTERS[ci+1].code} ${CHAPTERS[ci+1].th} →`; }
  else { nb.style.display='none'; }
  show('results');
}

function nextChapter(){ if(window.dlf) dlf.closeCong(); if(ci<CHAPTERS.length-1) startChapter(ci+1); else goHome(); }

// init
renderHome();
