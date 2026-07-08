(function(){
  const dlf=window.dlf={};
  let muted=false; try{muted=localStorage.getItem('dlfMute')==='1';}catch(e){}

  // text -> audio src (data URI or "audio/xxx.mp3" path). Keyed by md5(text)[:12].
  let AUD={}; try{AUD=JSON.parse(document.getElementById('dlfAudioData').textContent)||{};}catch(e){AUD={};}

  // tiny synchronous md5 (for key lookup) -----------------------------------
  function md5(s){function rl(n,c){return(n<<c)|(n>>>(32-c));}function au(x,y){var l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return(m<<16)|(l&0xFFFF);}
    function cmn(q,a,b,x,s,t){return au(rl(au(au(a,q),au(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
    function tb(str){var n=str.length,b=[];for(var i=0;i<n*8;i+=8)b[i>>5]|=(str.charCodeAt(i/8)&255)<<(i%32);return b;}
    function u8(str){var u=unescape(encodeURIComponent(str));return u;}
    function hex(num){var s='',j;for(j=0;j<=3;j++)s+=('0'+((num>>(j*8+4))&15).toString(16)+((num>>(j*8))&15).toString(16)).slice(-2);return s;}
    s=u8(s);var x=tb(s),len=s.length*8;x[len>>5]|=0x80<<(len%32);x[(((len+64)>>>9)<<4)+14]=len;
    var a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(var i=0;i<x.length;i+=16){var oa=a,ob=b,oc=c,od=d;
      a=ff(a,b,c,d,x[i],7,-680876936);d=ff(d,a,b,c,x[i+1],12,-389564586);c=ff(c,d,a,b,x[i+2],17,606105819);b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4],7,-176418897);d=ff(d,a,b,c,x[i+5],12,1200080426);c=ff(c,d,a,b,x[i+6],17,-1473231341);b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8],7,1770035416);d=ff(d,a,b,c,x[i+9],12,-1958414417);c=ff(c,d,a,b,x[i+10],17,-42063);b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682);d=ff(d,a,b,c,x[i+13],12,-40341101);c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1],5,-165796510);d=gg(d,a,b,c,x[i+6],9,-1069501632);c=gg(c,d,a,b,x[i+11],14,643717713);b=gg(b,c,d,a,x[i],20,-373897302);
      a=gg(a,b,c,d,x[i+5],5,-701558691);d=gg(d,a,b,c,x[i+10],9,38016083);c=gg(c,d,a,b,x[i+15],14,-660478335);b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9],5,568446438);d=gg(d,a,b,c,x[i+14],9,-1019803690);c=gg(c,d,a,b,x[i+3],14,-187363961);b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467);d=gg(d,a,b,c,x[i+2],9,-51403784);c=gg(c,d,a,b,x[i+7],14,1735328473);b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5],4,-378558);d=hh(d,a,b,c,x[i+8],11,-2022574463);c=hh(c,d,a,b,x[i+11],16,1839030562);b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1],4,-1530992060);d=hh(d,a,b,c,x[i+4],11,1272893353);c=hh(c,d,a,b,x[i+7],16,-155497632);b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);d=hh(d,a,b,c,x[i],11,-358537222);c=hh(c,d,a,b,x[i+3],16,-722521979);b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9],4,-640364487);d=hh(d,a,b,c,x[i+12],11,-421815835);c=hh(c,d,a,b,x[i+15],16,530742520);b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i],6,-198630844);d=ii(d,a,b,c,x[i+7],10,1126891415);c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571);d=ii(d,a,b,c,x[i+3],10,-1894986606);c=ii(c,d,a,b,x[i+10],15,-1051523);b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8],6,1873313359);d=ii(d,a,b,c,x[i+15],10,-30611744);c=ii(c,d,a,b,x[i+6],15,-1560198380);b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4],6,-145523070);d=ii(d,a,b,c,x[i+11],10,-1120210379);c=ii(c,d,a,b,x[i+2],15,718787259);b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=au(a,oa);b=au(b,ob);c=au(c,oc);d=au(d,od);}
    return hex(a)+hex(b)+hex(c)+hex(d);}

  let curAudio=null;
  function stopAudio(){if(curAudio){try{curAudio.pause();}catch(e){}curAudio=null;}try{speechSynthesis.cancel();}catch(e){}}

  // device-voice fallback
  let thaiVoice=null;
  function pickVoice(){if(!('speechSynthesis'in window))return;const vs=speechSynthesis.getVoices();
    thaiVoice=vs.find(v=>v.lang&&v.lang.toLowerCase().startsWith('th'))||vs.find(v=>/thai/i.test(v.name))||null;}
  if('speechSynthesis'in window){pickVoice();speechSynthesis.onvoiceschanged=pickVoice;}
  function tts(text,opts){if(!('speechSynthesis'in window))return;try{const u=new SpeechSynthesisUtterance(text);
    u.lang='th-TH';if(thaiVoice)u.voice=thaiVoice;u.rate=(opts&&opts.rate)||.92;u.pitch=1.05;speechSynthesis.speak(u);}catch(e){}}

  function dlfCleanKey(s){if(!s)return '';
    s=s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu,'');
    s=s.replace(/🔊/g,'');s=s.replace(/[""''`]/g,'');s=s.replace(/\s+/g,' ').trim();return s;}
  function dlfSrc(t){var c=dlfCleanKey(t);return AUD[md5(c).slice(0,12)]||AUD[c]||null;}
  function dlfPlaySrc(src,onend){try{var a=new Audio(src);curAudio=a;a.onended=onend||null;a.play().catch(function(){if(onend)onend();});return true;}catch(e){return false;}}
  // split composite text into chunks that each have a clip; play in sequence
  function dlfChunks(text){
    var c=dlfCleanKey(text);
    if(dlfSrc(c)) return [c];
    var parts=c.split(/(?<=[?!\.ฯ])\s+|\s{2,}|\s*[:：]\s*|\s*\(/).map(function(s){return dlfCleanKey(s.replace(/\)$/,''));}).filter(Boolean);
    var have=parts.filter(function(p){return dlfSrc(p);});
    if(have.length) return have;
    return [c];
  }
  dlf.speak=function(text,opts){opts=opts||{};if(muted||!text)return;
    var clean=dlfCleanKey(text);stopAudio();
    var direct=dlfSrc(clean)||AUD[md5(text.trim()).slice(0,12)]||AUD[text];
    if(direct){dlfPlaySrc(direct);return;}
    var chunks=dlfChunks(text), i=0;
    function nxt(){ if(i>=chunks.length){return;} var s=dlfSrc(chunks[i]); i++; if(s){dlfPlaySrc(s,nxt);} else {nxt();} }
    if(chunks.length && dlfSrc(chunks[0])){ nxt(); } else { tts(clean,opts); }
  };
  dlf.stop=stopAudio;
  dlf.has=function(text){var c=dlfCleanKey(text||'');return !!(AUD[md5(c).slice(0,12)]||AUD[md5((text||'').trim()).slice(0,12)]);};

  const spk=document.getElementById('dlfSpk');
  function paint(){spk.textContent=muted?'🔇':'🔊';spk.classList.toggle('muted',muted);}
  paint();
  spk.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem('dlfMute',muted?'1':'0');}catch(e){}
    if(muted){stopAudio();}else{dlf.speak('เปิดเสียงแล้ว');}paint();});

  // friendly background: soft colorful glows + gently bobbing cute icons
  const bg=document.getElementById('dlfBg');const cols=['#5BA8FF','#56D364','#C99BFF','#FFC857','#FF8FB1','#5BE0D0'];
  for(let i=0;i<6;i++){const b=document.createElement('div');b.className='dlf-blob';const sz=220+Math.random()*200;
    b.style.width=b.style.height=sz+'px';b.style.background=cols[i%cols.length];b.style.left=(Math.random()*92)+'%';
    b.style.top=(Math.random()*92)+'%';b.style.animationDelay=(-Math.random()*16)+'s';bg.appendChild(b);}
  const fl=['💻','⌨️','🖱️','🤖','⭐','🧠','🔌','📚','✨','🖥️','🎈','🌟','🧩','🚀','🎨','😊'];
  for(let i=0;i<10;i++){const e=document.createElement('div');e.className='dlf-emoji';e.textContent=fl[Math.floor(Math.random()*fl.length)];
    e.style.left=(Math.random()*94)+'%';e.style.top=(Math.random()*88)+'%';
    e.style.animationDelay=(-Math.random()*8)+'s';e.style.animationDuration=(5+Math.random()*4)+'s';
    e.style.fontSize=(26+Math.random()*16)+'px';bg.appendChild(e);}

  function confetti(n){n=n||80;for(let i=0;i<n;i++){const c=document.createElement('div');c.className='dlf-confetti';
    const s=6+Math.random()*8;c.style.width=s+'px';c.style.height=(s*.6)+'px';c.style.left=(Math.random()*100)+'vw';
    c.style.background=cols[Math.floor(Math.random()*cols.length)];c.style.opacity=.9;const d=2.4+Math.random()*1.8;
    c.style.animation=`dlfFall ${d}s linear forwards`;c.style.animationDelay=(Math.random()*.4)+'s';
    document.body.appendChild(c);setTimeout(()=>c.remove(),(d+.6)*1000);}}
  dlf.confetti=confetti;

  const cong=document.getElementById('dlfCong');
  var DLF_CHEER='';
  function dlfPlayCheer(){if(muted||!DLF_CHEER)return;try{var a=new Audio(DLF_CHEER);a.volume=0.85;a.play().catch(function(){});}catch(e){}}
  dlf.bigCongrats=function(o){o=o||{};
    document.getElementById('dlfCongTrophy').textContent=o.trophy||'🏆';
    document.getElementById('dlfCongTitle').textContent=o.title||'เยี่ยมมาก!';
    document.getElementById('dlfCongSub').textContent=o.sub||'น้องทำสำเร็จแล้ว';
    const st=Math.max(1,Math.min(3,o.stars||3));
    document.getElementById('dlfCongStars').textContent='⭐'.repeat(st)+'☆'.repeat(3-st);
    cong.classList.add('show');confetti(110);dlfPlayCheer();};
  dlf.closeCong=function(){cong.classList.remove('show');stopAudio();};

  const mini=document.getElementById('dlfMini');let miniT;
  dlf.cheer=function(msg,voice){mini.textContent=msg;mini.classList.add('show');confetti(28);
    dlfPlayCheer();clearTimeout(miniT);
    miniT=setTimeout(()=>mini.classList.remove('show'),1600);};

  const praises=['เก่งมาก!','สุดยอด!','เยี่ยมเลย!','ทำได้ดีมาก!','ยอดเยี่ยม!'];
  let lastCorrect=-1,lastStreak=-1,congShownFor=null;
  function gvar(n){try{const v=window[n];return typeof v==='number'?v:null;}catch(e){return null;}}
  function poll(){const c=gvar('correct');
    if(c!=null&&c!==lastCorrect){if(c>0&&c%3===0&&c>lastCorrect){const p=praises[Math.floor(Math.random()*praises.length)];dlf.cheer('🎉 '+p,p);}lastCorrect=c;}
    const s=gvar('streak');if(s!=null){if(s>0&&s%5===0&&s!==lastStreak)dlf.cheer('🔥 ต่อเนื่อง '+s+' ครั้ง!','สุดยอด!');lastStreak=s;}}
  setInterval(poll,500);

  const resEl=document.getElementById('results');
  function checkResults(){if(!resEl)return;
    const vis=resEl.classList.contains('active')||(getComputedStyle(resEl).display!=='none'&&resEl.offsetParent!==null);
    if(vis){if(congShownFor!=='on'){congShownFor='on';
      const t=document.getElementById('resTrophy'),ti=document.getElementById('resTitle'),su=document.getElementById('resSub');
      dlf.bigCongrats({trophy:(t&&t.textContent.trim())||'🏆',title:(ti&&ti.textContent.trim())||'จบบทเรียนแล้ว!',
        sub:(su&&su.textContent.trim())||'น้องทำสำเร็จแล้ว เก่งมาก!',stars:(window.__stars||3)});}}else congShownFor=null;}
  if(resEl){const mo=new MutationObserver(checkResults);
    mo.observe(resEl,{attributes:true,attributeFilter:['class','style']});
    mo.observe(document.body,{attributes:true,subtree:true,attributeFilter:['class','style']});}
  setInterval(checkResults,600);

  var DLF_SELS=['.intro-title','.intro-sub','.cc-title','.cc-body','.cc-tag','.q-prompt','.ch-title','.ch-desc',
    '.res-title','.res-sub','.hud-title','.dc-header','.content-card','.opt-label'];
  function dlfClean(s){
    if(!s) return '';
    s=s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu,'');
    s=s.replace(/🔊/g,'');
    s=s.replace(/[""''`]/g,'');
    s=s.replace(/\s+/g,' ').trim();
    return s;
  }
  function dlfFullText(el){
    var out='';
    el.childNodes.forEach(function(n){
      if(n.nodeType===3) out+=n.textContent;
      else if(n.nodeType===1 && !n.classList.contains('dlf-say')
              && !n.matches('[class*="score"],[class*="lives"],[class*="timer"],[class*="count"],[class*="badge"],[class*="num"],[class*="fill"],[class*="bar"]'))
        out+=n.textContent;
    });
    return dlfClean(out);
  }
  function dlfIsControl(el){
    if(el.matches('button,a,input,textarea,select,label')) return true;
    if(el.closest('button,a[href],input,.opt-btn,.btn-next,.btn-primary,.btn-ghost,.ch-card,.back-btn,[role="button"]')) return true;
    return false;
  }
  function dlfHasOwnText(el){
    for(var i=0;i<el.childNodes.length;i++){
      var n=el.childNodes[i];
      if(n.nodeType===3 && /[฀-๿]/.test(n.textContent) && n.textContent.trim().length>1) return true;
    }
    return false;
  }
  function readable(el){
    if(!el || el.nodeType!==1) return;
    if(dlfIsControl(el)) return;
    if(el.querySelector(':scope > .dlf-say')) return;
    var txt=dlfFullText(el);
    if(!txt||txt.length<2||txt.length>240) return;
    if(!/[฀-๿]/.test(txt)) return;
    var b=document.createElement('span');b.className='dlf-say';b.textContent='🔊';b.title='อ่านออกเสียง';
    b.setAttribute('data-dlf', txt);
    b.onclick=function(ev){ev.stopPropagation();
      b.classList.add('playing');dlf.speak(b.getAttribute('data-dlf'));setTimeout(function(){b.classList.remove('playing');},1200);};
    el.appendChild(b);
  }
  function decorate(){
    try{document.querySelectorAll('p,li,h1,h2,h3,h4,h5').forEach(function(el){
      if(dlfHasOwnText(el)) readable(el);
    });}catch(e){}
    DLF_SELS.forEach(function(sel){try{document.querySelectorAll(sel).forEach(readable);}catch(e){}});
  }
  setInterval(decorate,700);decorate();
})();
