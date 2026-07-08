// Generate Thai TTS MP3s for every spoken lesson string via ElevenLabs.
// Idempotent: skips strings that already have an MP3. Keys match lib/tts.ts (md5(clean(text))[:12]).
// Usage: ELEVEN=<key> node scripts/gen-audio.mjs [--dry] [--limit=N]
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'public', 'audio');
const KEY = process.env.ELEVEN;
const DRY = process.argv.includes('--dry');
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

const VOICE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah — warm female, multilingual
const MODEL = 'eleven_turbo_v2_5';

// ---- clean() + md5() must match lib/tts.ts exactly ----
function clean(s) {
  if (!s) return '';
  s = s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}‍⃣™ℹ↔-↪]/gu, '');
  s = s.replace(/[“”‘’`]/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
function md5(str) {
  function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
  function au(x, y) { const l = (x & 0xFFFF) + (y & 0xFFFF), m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); }
  function cmn(q, a, b, x, s, t) { return au(rl(au(au(a, q), au(x, t)), s), b); }
  function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t); }
  function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t); }
  function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
  function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t); }
  function tb(s) { const n = s.length, b = []; for (let i = 0; i < n * 8; i += 8) b[i >> 5] |= (s.charCodeAt(i / 8) & 255) << (i % 32); return b; }
  function hex(num) { let s = ''; for (let j = 0; j <= 3; j++) s += ('0' + ((num >> (j * 8 + 4)) & 15).toString(16) + ((num >> (j * 8)) & 15).toString(16)).slice(-2); return s; }
  const u8 = unescape(encodeURIComponent(str));
  const x = tb(u8), len = u8.length * 8;
  x[len >> 5] |= 0x80 << (len % 32); x[(((len + 64) >>> 9) << 4) + 14] = len;
  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const oa = a, ob = b, oc = c, od = d;
    a = ff(a, b, c, d, x[i], 7, -680876936); d = ff(d, a, b, c, x[i + 1], 12, -389564586); c = ff(c, d, a, b, x[i + 2], 17, 606105819); b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i + 4], 7, -176418897); d = ff(d, a, b, c, x[i + 5], 12, 1200080426); c = ff(c, d, a, b, x[i + 6], 17, -1473231341); b = ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = ff(a, b, c, d, x[i + 8], 7, 1770035416); d = ff(d, a, b, c, x[i + 9], 12, -1958414417); c = ff(c, d, a, b, x[i + 10], 17, -42063); b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = ff(a, b, c, d, x[i + 12], 7, 1804603682); d = ff(d, a, b, c, x[i + 13], 12, -40341101); c = ff(c, d, a, b, x[i + 14], 17, -1502002290); b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = gg(a, b, c, d, x[i + 1], 5, -165796510); d = gg(d, a, b, c, x[i + 6], 9, -1069501632); c = gg(c, d, a, b, x[i + 11], 14, 643717713); b = gg(b, c, d, a, x[i], 20, -373897302);
    a = gg(a, b, c, d, x[i + 5], 5, -701558691); d = gg(d, a, b, c, x[i + 10], 9, 38016083); c = gg(c, d, a, b, x[i + 15], 14, -660478335); b = gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = gg(a, b, c, d, x[i + 9], 5, 568446438); d = gg(d, a, b, c, x[i + 14], 9, -1019803690); c = gg(c, d, a, b, x[i + 3], 14, -187363961); b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = gg(a, b, c, d, x[i + 13], 5, -1444681467); d = gg(d, a, b, c, x[i + 2], 9, -51403784); c = gg(c, d, a, b, x[i + 7], 14, 1735328473); b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = hh(a, b, c, d, x[i + 5], 4, -378558); d = hh(d, a, b, c, x[i + 8], 11, -2022574463); c = hh(c, d, a, b, x[i + 11], 16, 1839030562); b = hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = hh(a, b, c, d, x[i + 1], 4, -1530992060); d = hh(d, a, b, c, x[i + 4], 11, 1272893353); c = hh(c, d, a, b, x[i + 7], 16, -155497632); b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = hh(a, b, c, d, x[i + 13], 4, 681279174); d = hh(d, a, b, c, x[i], 11, -358537222); c = hh(c, d, a, b, x[i + 3], 16, -722521979); b = hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = hh(a, b, c, d, x[i + 9], 4, -640364487); d = hh(d, a, b, c, x[i + 12], 11, -421815835); c = hh(c, d, a, b, x[i + 15], 16, 530742520); b = hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = ii(a, b, c, d, x[i], 6, -198630844); d = ii(d, a, b, c, x[i + 7], 10, 1126891415); c = ii(c, d, a, b, x[i + 14], 15, -1416354905); b = ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = ii(a, b, c, d, x[i + 12], 6, 1700485571); d = ii(d, a, b, c, x[i + 3], 10, -1894986606); c = ii(c, d, a, b, x[i + 10], 15, -1051523); b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i + 8], 6, 1873313359); d = ii(d, a, b, c, x[i + 15], 10, -30611744); c = ii(c, d, a, b, x[i + 6], 15, -1560198380); b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = ii(a, b, c, d, x[i + 4], 6, -145523070); d = ii(d, a, b, c, x[i + 11], 10, -1120210379); c = ii(c, d, a, b, x[i + 2], 15, 718787259); b = ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = au(a, oa); b = au(b, ob); c = au(c, oc); d = au(d, od);
  }
  return hex(a) + hex(b) + hex(c) + hex(d);
}
const keyOf = (s) => md5(clean(s)).slice(0, 12);

// ---- load AREAS from lib/content.ts (JSON literal) ----
const src = fs.readFileSync(path.join(ROOT, 'lib', 'content.ts'), 'utf8');
const m = src.match(/export const AREAS: Area\[\] = (\[[\s\S]*?\]);\s*\nexport const areaByNum/);
if (!m) { console.error('Could not extract AREAS from content.ts'); process.exit(1); }
const AREAS = JSON.parse(m[1]);

// ---- collect spoken strings (mirror what LessonApp calls dlf.speak with) ----
const strings = new Map(); // key -> cleanText
function add(raw) {
  const c = clean(raw);
  if (!c || c.length < 2 || !/[฀-๿]/.test(c)) return;
  strings.set(keyOf(raw), c);
}
for (const a of AREAS) {
  for (const ch of a.chapters) {
    for (const s of ch.slides) {
      if (s.type === 'explain') add(s.say || `${s.title || ''} ${s.body || ''}`);
      else {
        add(s.say || s.q || '');
        add(s.q || '');
        for (const o of (s.opts || [])) { add(o.label); add(o.fb); }
      }
    }
  }
}
const totalChars = [...strings.values()].reduce((n, t) => n + t.length, 0);
console.log(`unique strings: ${strings.size} · total chars: ${totalChars}`);

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
const manifestPath = path.join(AUDIO_DIR, 'manifest.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch {}

const pending = [...strings.entries()].filter(([k]) => !fs.existsSync(path.join(AUDIO_DIR, k + '.mp3')));
console.log(`already have: ${strings.size - pending.length} · to generate: ${pending.length}`);
if (DRY) { console.log('(dry run — nothing generated)'); process.exit(0); }
if (!KEY) { console.error('ELEVEN key not set'); process.exit(1); }

async function synth(text) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 160)}`);
  return Buffer.from(await r.arrayBuffer());
}

let ok = 0, fail = 0;
const todo = pending.slice(0, LIMIT);
for (let i = 0; i < todo.length; i++) {
  const [k, text] = todo[i];
  try {
    const buf = await synth(text);
    fs.writeFileSync(path.join(AUDIO_DIR, k + '.mp3'), buf);
    manifest[k] = `/audio/${k}.mp3`;
    ok++;
    if (ok % 20 === 0) { fs.writeFileSync(manifestPath, JSON.stringify(manifest)); console.log(`  ${ok}/${todo.length} …`); }
  } catch (e) {
    fail++;
    console.log(`  FAIL [${k}] ${String(e.message)}`);
    if (String(e.message).match(/401|402|429|quota|limit/i)) { console.log('  → stopping (auth/quota/rate).'); break; }
  }
}
// rebuild manifest from files on disk (source of truth)
manifest = {};
for (const [k] of strings) if (fs.existsSync(path.join(AUDIO_DIR, k + '.mp3'))) manifest[k] = `/audio/${k}.mp3`;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 0));
console.log(`done. generated ${ok}, failed ${fail}. manifest has ${Object.keys(manifest).length} clips.`);
