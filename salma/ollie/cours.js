/* Le moteur commun des cours (16/11) : pour Salma (Ollie's House, La Pâtisserie d'Ollie, La Fabrique des Phrases) et pour Essil
   (Via Romana II, Deutsch Express 2 : C.enfant = 'Essil', C.prof = son dessin). Langues dans les textes : <i lang="en|de|la">.
   Repris de l'Atelier des Verbes : un chemin d'étapes qui s'ouvrent l'une après l'autre, Ollie qui parle, 1 ticket 🎟️ par bonne réponse
   (+3 pour un sans-faute) à dépenser dans Serpent Légendes, une fiche de leçon, un carnet, et la sauvegarde sur le serveur (Famille.track).
   La page déclare window.COURS = { key, track, titre, sous, bonjour, retour, CH:[{ id, name, sub, icon, edge, rule, make() }], ask:{ type(q){} }, fiche:[{ h, tag, html, lire }], revoir }
   puis charge ce fichier. Dans un texte d'Ollie, <i lang="en">…</i> est lu avec la voix anglaise. */
'use strict';
(function(){
const C = window.COURS, ENF = C.enfant || 'Salma';   // l'enfant (Salma, Essil…) ; C.prof : le dessin du prof (Ollie par défaut)
const OWL = `<svg class="owl" viewBox="0 0 120 130" aria-hidden="true">
  <ellipse cx="60" cy="124" rx="38" ry="5" fill="#0002"/>
  <path d="M22 40 L30 14 L46 32 Z M98 40 L90 14 L74 32 Z" fill="#7a4b2a"/>
  <ellipse cx="60" cy="74" rx="42" ry="50" fill="#9a6236"/>
  <ellipse cx="60" cy="88" rx="28" ry="32" fill="#f3d9b1"/>
  <path d="M44 84 q4 4 8 0 M56 92 q4 4 8 0 M68 84 q4 4 8 0 M50 100 q4 4 8 0 M62 100 q4 4 8 0" stroke="#d8b585" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="42" cy="52" r="17" fill="#fff"/><circle cx="78" cy="52" r="17" fill="#fff"/>
  <circle cx="44" cy="54" r="8" fill="#23324a"/><circle cx="76" cy="54" r="8" fill="#23324a"/>
  <circle cx="47" cy="51" r="2.5" fill="#fff"/><circle cx="79" cy="51" r="2.5" fill="#fff"/>
  <path d="M54 64 L66 64 L60 74 Z" fill="#ffb02e"/>
  <rect x="26" y="34" width="68" height="7" rx="3" fill="#23324a"/><path d="M36 34 L84 34 L60 20 Z" fill="#23324a"/>
  <path d="M84 37 q10 6 6 18" stroke="#ffc93c" stroke-width="3" fill="none"/><circle cx="90" cy="56" r="4" fill="#ffc93c"/>
  <path d="M18 74 q-6 22 10 34 M102 74 q6 22 -10 34" stroke="#7a4b2a" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M48 120 l-4 6 M52 120 l0 6 M68 120 l0 6 M72 120 l4 6" stroke="#ffb02e" stroke-width="4" stroke-linecap="round"/>
</svg>`;
const app = document.getElementById('app');
const rnd = (a,b) => a + Math.floor(Math.random()*(b-a+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { a = [...a]; for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY = C.key;
let data = { stars:{}, done:{}, tickets:0, items:{}, t:0 };
try{ Object.assign(data, JSON.parse(localStorage.getItem(KEY) || '{}')); }catch(e){}
function save(){ data.t = Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} }
const totalStars = () => Object.values(data.stars).reduce((a,b) => a + b, 0);
function note(it, ok){ if(!it) return; const v = data.items[it] || (data.items[it] = { ok:0, ko:0 }); ok ? v.ok++ : v.ko++; }

/* ---------- son et voix (français + anglais) ---------- */
let muted = false; try{ muted = localStorage.getItem(KEY + '-muet') === '1'; }catch(e){}
let ac = null, VF = null, VE = null;
function tone(f,d,t=0,type='triangle',vol=.12){ if(muted) return; try{ ac = ac || new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended') ac.resume(); const o=ac.createOscillator(),g=ac.createGain(),s=ac.currentTime+t; o.type=type;o.frequency.value=f;g.gain.setValueAtTime(vol,s);g.gain.exponentialRampToValueAtTime(.001,s+d);o.connect(g).connect(ac.destination);o.start(s);o.stop(s+d+.02); }catch(e){} }
const sfx = { ok(){ tone(660,.12); tone(880,.16,.08); }, no(){ tone(240,.25,0,'sine',.1); }, tap(){ tone(900,.05,0,'triangle',.06); }, ticket(){ tone(1046,.08,0,'square',.05); tone(1318,.1,.07,'square',.05); }, win(){ [523,659,784,1047].forEach((f,i)=>tone(f,.22,i*.1)); } };
function voices(){ try{ const vs = speechSynthesis.getVoices(), nice = v => /google|natural|samantha|daniel|amelie|thomas|female|libby|sonia/i.test(v.name);
  const best = re => { const l = vs.filter(v => re.test(v.lang.replace('_','-'))); return l.find(nice) || l[0] || null; };
  VF = best(/^fr-FR/i) || best(/^fr/i); VE = best(/^en-GB/i) || best(/^en/i); VD = best(/^de-DE/i) || best(/^de/i); VI = best(/^it/i); }catch(e){} }
let VD = null, VI = null;
if('speechSynthesis' in window){ voices(); speechSynthesis.onvoiceschanged = voices; }
const clean = t => String(t).replace(/<small>.*?<\/small>/g,'').replace(/<[^>]+>/g,'').replace(/_{2,}|…{1}(?=\s|$)/g,' ... ').replace(/«|»/g,'').replace(/🎟️|⭐|🔊|→/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/(\d) +\/ +(\d)/g,'$1 divisé par $2').replace(/(\d)\s*×\s*(\d)/g,'$1 fois $2').replace(/✔/g,'').trim();   // 20/11 : « 70 / 2 » se lit « 70 divisé par 2 »
/* 26/11 : aussi l'arabe (lang="ar", Salma & Ghazala) */
function segments(html){ const out = [], re = /<(\w+)[^>]*\blang="?(en|de|la|ar)"?[^>]*>([\s\S]*?)<\/\1>/g; let m, last = 0; html = String(html);
  while((m = re.exec(html))){ if(m.index > last) out.push([html.slice(last, m.index), 'fr']); out.push([m[3], m[2]]); last = re.lastIndex; }
  if(last < html.length) out.push([html.slice(last), 'fr']); return out.map(([t, l]) => [clean(t), l]).filter(([t]) => t && /[\p{L}\p{N}]/u.test(t)); }
/* Les voix enregistrées (ElevenLabs) : C.voix = 'ollie' → sons famille-data/lire-voix/ollie/<clé>.mp3 (liste window.LIRE_VOIX, servis par
   ../amine/lire/son.php). Une phrase anglaise enregistrée est jouée telle quelle ; le reste est dit par la voix de la tablette, à la suite. */
const cle = t => String(t).toLowerCase().replace(/é/g, 'ee').replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const DISPO = (window.LIRE_VOIX || {})[C.voix || ''] || null, SONS = DISPO ? new Set(DISPO.k) : new Set();
const fichier = t => { const k = cle(t); return SONS.has(k) ? `../amine/lire/son.php?v=${C.voix}&k=${k}&r=${DISPO.r}` : null; };
// Le reste passe par les voix ElevenLabs du site (api/voix.php : Céline en français, Alice en anglais, gardées après la 1re fois).
// Si le site ne peut pas (pas de clé, plafond du mois), la voix de la tablette prend le relais.
const enLigne = (t, l) => `/api/voix.php?l=${l}&t=${encodeURIComponent(t)}` + (l === 'fr' && C.lulu ? '&p=amine' : '');   // 21/11 : C.lulu → le français dit par Lulu (cours d'Amine)
const morceaux = (t, n = 330) => { if(t.length <= n) return [t]; const out = []; let cur = ''; for(const p of t.split(/(?<=[.!?:;])\s+/)){ if((cur + ' ' + p).trim().length > n && cur){ out.push(cur.trim()); cur = p; } else cur = (cur + ' ' + p).trim(); } if(cur) out.push(cur); return out; };
const tampons = {};
function actx(){ try{ ac = ac || new (window.AudioContext||window.webkitAudioContext)(); if(ac.state !== 'running') ac.resume().catch(() => {}); }catch(e){} return ac; }
/* 20/11 : sur iPad, un appel FaceTime (ou une alarme, Siri…) « interrompt » le son de la page ; après l'appel, le moteur audio reste
   bloqué (état « interrupted » ou « suspended ») : le texte avançait sans voix. Au premier toucher on le relance ; s'il refuse, on en
   refait un neuf (les sons déjà chargés restent bons). Et une phrase qui ne peut pas passer par lui passe par le lecteur commun. */
function reveilleAc(){ if(!ac || ac.state === 'running') return; const vieux = ac;
  try{ vieux.resume().then(() => { if(ac === vieux && vieux.state !== 'running'){ try{ vieux.close(); }catch(e){} ac = null; actx(); } }, () => { if(ac === vieux){ try{ vieux.close(); }catch(e){} ac = null; actx(); } }); }catch(e){ ac = null; } }
['touchend', 'click', 'keydown'].forEach(t => document.addEventListener(t, reveilleAc, true));
document.addEventListener('visibilitychange', () => { if(!document.hidden) reveilleAc(); });
addEventListener('pageshow', reveilleAc);
const pret = async a => { if(a.state === 'running') return true; try{ await Promise.race([a.resume(), new Promise(r => setTimeout(r, 400))]); }catch(e){} return a.state === 'running'; };
function tampon(f){ if(tampons[f]) return tampons[f]; const a = actx(); if(!a) return Promise.reject();
  return tampons[f] = fetch(f).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }).then(b => new Promise((ok, ko) => { const p = a.decodeAudioData(b, ok, ko); if(p && p.catch) p.catch(ko); })).catch(e => { delete tampons[f]; throw e; }); }
let jeton = 0, joueur = null;
/* 21/11 (demande du papa) : la barre de lecture. Quand le prof lit un texte un peu long, une barre apparaît en bas de l'écran :
   ⏪ reculer de 10 s, ⏸/▶ pause, ⏩ avancer de 10 s, et on touche la barre pour aller à un endroit du texte.
   Le texte est lu par morceaux (segs) ; dans un morceau joué par le moteur audio (Web Audio) on peut aller à la seconde près,
   sinon (lecteur commun, voix de la tablette) on passe d'un morceau à l'autre. */
const LEC = { j:-1, segs:[], cum:[], total:1, i:0, mode:'', debut:0, dur:0, ms:0, t0:0, pause:false, saut:null, fin:null, garde:0 };
let barreEl = null, barreRaf = 0;
function barreCree(){
  if(barreEl) return barreEl;
  const st = document.createElement('style');
  st.textContent = `#lecBarre{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9000;display:none;align-items:center;gap:8px;
    background:#1b1530ee;color:#fff;border-radius:999px;padding:6px 10px;box-shadow:0 8px 24px #0005;width:min(560px,calc(100vw - 24px));box-sizing:border-box;font:700 15px Nunito,system-ui,sans-serif}
    #lecBarre.on{display:flex}#lecBarre button{flex:none;width:48px;height:48px;border:0;border-radius:50%;background:#ffffff1f;color:#fff;font-size:20px;cursor:pointer;display:grid;place-items:center}
    #lecBarre button:active{background:#ffffff40}#lecBarre .pp{background:#f2c230;color:#1b1530}
    #lecBarre .rail{flex:1;height:48px;display:flex;align-items:center;cursor:pointer;touch-action:none}#lecBarre .rail i{display:block;position:relative;width:100%;height:8px;border-radius:4px;background:#ffffff33}
    #lecBarre .rail b{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:#f2c230;width:0}#lecBarre .rail b::after{content:'';position:absolute;right:-8px;top:-5px;width:18px;height:18px;border-radius:50%;background:#fff}`;
  document.head.appendChild(st);
  barreEl = document.createElement('div'); barreEl.id = 'lecBarre'; barreEl.setAttribute('role', 'group'); barreEl.setAttribute('aria-label', 'Lecture du texte');
  barreEl.innerHTML = '<button type="button" data-a="r" aria-label="Reculer de 10 secondes">⏪</button><button type="button" class="pp" data-a="p" aria-label="Pause">⏸</button><button type="button" data-a="a" aria-label="Avancer de 10 secondes">⏩</button><span class="rail" aria-label="Aller à un endroit du texte"><i><b></b></i></span>';
  barreEl.addEventListener('click', e => { const b = e.target.closest('button'); if(!b) return; e.stopPropagation(); if(b.dataset.a === 'p') lecPause(!LEC.pause); else lecSaute(b.dataset.a === 'r' ? -10 : 10); });
  const rail = barreEl.querySelector('.rail');
  rail.addEventListener('pointerdown', e => { e.stopPropagation(); const r = rail.querySelector('i').getBoundingClientRect(); lecVa(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); });
  document.body.appendChild(barreEl); return barreEl;
}
function lecFrac(){   // où en est la lecture dans le morceau en cours (0 à 1)
  const n = (LEC.segs[LEC.i] || [''])[0].length || 1;
  if(LEC.mode === 'wa' && LEC.dur && ac) return Math.max(0, Math.min(1, (ac.currentTime - LEC.debut) / LEC.dur));
  if(LEC.mode === 'fs') return Math.min(1, LEC.ms / (n * 62));
  if(LEC.mode === 'ss') return Math.min(1, (performance.now() - LEC.t0) / (n * 65));
  return 0;
}
function barre(on){
  const b = barreCree(); b.classList.toggle('on', !!on); cancelAnimationFrame(barreRaf); document.body.style.paddingBottom = on ? '84px' : '';
  if(!on) return;
  const pp = b.querySelector('.pp'), fill = b.querySelector('.rail b');
  const tour = () => { const k = Math.min(LEC.i, LEC.segs.length - 1), n = (LEC.segs[k] || [''])[0].length;
    fill.style.width = Math.min(100, ((LEC.cum[k] || 0) + n * lecFrac()) / LEC.total * 100) + '%';
    pp.textContent = LEC.pause ? '▶' : '⏸'; pp.setAttribute('aria-label', LEC.pause ? 'Reprendre' : 'Pause'); barreRaf = requestAnimationFrame(tour); };
  tour();
}
function lecArme(reste){ clearTimeout(LEC.garde); if(LEC.fin) LEC.garde = setTimeout(LEC.fin, Math.max(0, reste) * 1000 + 400); }
function lecPause(p){
  if(LEC.j !== jeton) return; LEC.pause = p;
  if(LEC.mode === 'wa' && ac){ if(p){ clearTimeout(LEC.garde); ac.suspend().catch(() => {}); } else { ac.resume().catch(() => {}); lecArme(LEC.dur - (ac.currentTime - LEC.debut)); } }
  else if(LEC.mode === 'fs' && window.FamilleSon){ p ? FamilleSon.pause() : FamilleSon.reprend(); }
  else if(LEC.mode === 'ss'){ try{ p ? speechSynthesis.pause() : speechSynthesis.resume(); }catch(e){} }
}
function lecCoupe(){   // arrête le morceau en cours ; la boucle de speak() reprend à LEC.saut
  if(LEC.pause){ LEC.pause = false; if(ac) ac.resume().catch(() => {}); try{ speechSynthesis.resume(); }catch(e){} }
  if(LEC.mode === 'wa'){ if(joueur){ try{ joueur.onended = null; joueur.stop(); }catch(e){} } if(LEC.fin) LEC.fin(); }
  else if(LEC.mode === 'fs' && window.FamilleSon) FamilleSon.stop();
  else { try{ speechSynthesis.cancel(); }catch(e){} }
}
function lecSaute(d){
  if(LEC.j !== jeton || !LEC.segs.length) return; const i = LEC.i;
  if(LEC.mode === 'wa' && LEC.dur && ac){ const t = ac.currentTime - LEC.debut + d;
    LEC.saut = t >= 0 && t < LEC.dur - .3 ? { i, off:t } : t < 0 ? (t + 10 > 2 || i === 0 ? { i, off:0 } : { i:i - 1, off:0 }) : { i:i + 1, off:0 }; }
  else LEC.saut = { i:Math.max(0, i + (d < 0 ? (lecFrac() > .25 ? 0 : -1) : 1)), off:0 };
  lecCoupe();
}
function lecVa(f){
  if(LEC.j !== jeton || !LEC.segs.length) return; const c = f * LEC.total; let k = 0;
  while(k < LEC.segs.length - 1 && LEC.cum[k + 1] <= c) k++;
  const n = LEC.segs[k][0].length || 1; LEC.saut = { i:k, frac:Math.max(0, Math.min(.98, (c - LEC.cum[k]) / n)) }; lecCoupe();
}
function joueBuffer(b, off){ return new Promise(res => { const a = actx(), s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); joueur = s;
  off = Math.max(0, Math.min(off || 0, b.duration - .05)); LEC.dur = b.duration; LEC.debut = a.currentTime - off;
  let fini = false; LEC.fin = () => { if(!fini){ fini = true; clearTimeout(LEC.garde); LEC.fin = null; res(); } }; s.onended = LEC.fin; lecArme(b.duration - off); s.start(0, off); }); }
/* 22/11 (remarque du papa) : dans les cours d'anglais de Salma et d'Amine, des mots anglais écrits sans balise de langue (« Avec <b>I</b>,
   toujours <b>am</b> », « Hello, ça veut dire bonjour », « Les couleurs : red, blue… ») étaient lus par la voix française.
   Si le cours donne C.motsEN (les mots anglais de la leçon), on les repère avant de lire : un <b> qui n'a que des mots anglais,
   et dans le texte, une suite de mots anglais (sauf ceux qui existent aussi en français : a, on, son, six…). Seulement pour la voix. */
const MOTS_EN = C.motsEN ? new Set(C.motsEN.map(w => String(w).toLowerCase())) : null;
const FR_AUSSI = new Set(['a', 'an', 'on', 'in', 'son', 'me', 'but', 'six', 'sofa', 'orange', 'pain', 'car', 'nous', 'est', 'il', 'elle', 'de', 'la', 'le', 'les', 'du', 'des', 'un', 'une', 'et', 'ou', 'en', 'ma', 'ta', 'sa', 'mon', 'ton', 'pas', 'plus', 'si', 'ne', 'je', 'tu', 'pour', 'dans', 'sur', 'avec', 'par', 'chat', 'nos', 'vos', 'bus', 'taxi', 'piano', 'radio', 'zoo', 'pizza', 'super', 'bravo', 'oui', 'non', 'sous', 'salma', 'pip', 'amine', 'kiko', 'essil', 'anis', 'imen', 'papa', 'maman']);
const AMBIGU = new Set(['a', 'an', 'on', 'in', 'me', 'but', 'six', 'sofa', 'orange', 'pain', 'car']);   // en gras, ces mots-là sont de l'anglais
const toutEN = t => { const w = t.replace(/<[^>]+>/g, ' ').match(/[A-Za-z][A-Za-z']*/g); return !!w && w.every(x => { const lw = x.toLowerCase().replace(/'s$/, ''); return MOTS_EN.has(lw) && (AMBIGU.has(lw) || !FR_AUSSI.has(lw)); }) && !/[À-ÿ]/.test(t); };
function marqueEN(html){ if(!MOTS_EN) return html;
  const estEN = w => { const lw = w.toLowerCase().replace(/'s$/, ''); return w !== 'i' && /^[a-z']+$/.test(lw) && MOTS_EN.has(lw) && !FR_AUSSI.has(lw); };
  const texte = t => { const p = t.split(/(\p{L}[\p{L}']*)/u); let out = '', run = [], sep = '';   // p : séparateur, mot, séparateur, mot…
    const vide = () => { if(run.length){ out += `<span lang="en">${run.join('')}</span>`; run = []; } };
    for(let i = 0; i < p.length; i++){ const x = p[i];
      if(i % 2){ if(estEN(x)){ if(run.length) run.push(sep); else out += sep; run.push(x); } else { vide(); out += sep + x; } sep = ''; }
      else { if(run.length && !/^[ ,]*$/.test(x)){ vide(); } sep = x; if(i === p.length - 1){ vide(); out += x; sep = ''; } } }
    return out; };
  return String(html).split(/(<(\w+)[^>]*\blang="?\w+"?[^>]*>[\s\S]*?<\/\2>)/).map((p, i) => {
    if(i % 3 === 2) return ''; if(i % 3 === 1 || !p) return p || '';
    p = p.replace(/<b>([^<]*)<\/b>/g, (m, t) => toutEN(t) ? `<b lang="en">${t}</b>` : m);
    return p.split(/(<b lang="en">[^<]*<\/b>|<[^>]+>)/).map((q, k) => k % 2 ? q : texte(q)).join(''); }).join(''); }
window.__marqueEN = marqueEN;
function speak(html){ html = marqueEN(html);
  talk(); hush(); if(muted || (window.FamilleVoix && !FamilleVoix.on())) return new Promise(r => setTimeout(r, Math.min(9000, 1200 + clean(html).length * 55)));   // touche V : consignes orales coupées (on laisse le temps de lire)
  const j = jeton, segs = [];
  for(const [t, l] of segments(html)) for(const m of (l === 'en' && fichier(t) ? [t] : morceaux(t))) segs.push([m, l, (l === 'en' && fichier(m)) || enLigne(m, l)]);
  const cum = []; let total = 0; segs.forEach(([t]) => { cum.push(total); total += t.length; });
  Object.assign(LEC, { j, segs, cum, total:total || 1, i:0, pause:false, saut:null, mode:'', dur:0 });
  /* 21/11 : avant, tous les morceaux se chargeaient en même temps : ElevenLabs refuse au-delà de quelques phrases à la fois,
     et la tablette d'Amine restait muette ou passait à la voix de la tablette. Maintenant : le morceau en cours et les 2 suivants. */
  const avance = i => segs.slice(i, i + 3).forEach(([, , f]) => tampon(f).catch(() => {}));
  if(total > 140 || segs.length > 2) barre(true);
  return (async () => { try{ while(LEC.i < segs.length){ if(j !== jeton) return; const i = LEC.i, [t, l, f] = segs[i], sa = LEC.saut; LEC.saut = null; avance(i); LEC.ms = 0;
    let ok = false;
    try{ const b = await tampon(f); if(j !== jeton) return;
      if(!(await pret(actx()))){ if(j !== jeton) return;   // moteur bloqué : le lecteur commun (avec « 🔊 Touche pour entendre » si l'iPad refuse)
        if(window.FamilleSon){ LEC.mode = 'fs'; const r = await FamilleSon.joue(f, { onTemps:ms => { LEC.ms = ms; } }); if(j !== jeton) return; if(r === false && !LEC.saut) return; if(r || LEC.saut) ok = true; } }
      else { LEC.mode = 'wa'; await joueBuffer(b, sa ? (sa.frac ? sa.frac * b.duration : sa.off) : 0); ok = true; } }catch(e){}
    if(!ok && j === jeton){ LEC.mode = 'ss'; LEC.t0 = performance.now(); await dire(t, l, j); }
    if(j !== jeton) return;
    LEC.i = LEC.saut ? LEC.saut.i : i + 1; } } finally { if(LEC.j === j){ LEC.mode = ''; barre(false); } } })();
}
function dire(t, l, j){ return new Promise(res => { if(!('speechSynthesis' in window) || j !== jeton) return res();
  try{ const u = new SpeechSynthesisUtterance(t); if(l === 'en'){ u.lang = 'en-GB'; if(VE) u.voice = VE; u.rate = .82; } else if(l === 'de'){ u.lang = 'de-DE'; if(VD) u.voice = VD; u.rate = .85; } else if(l === 'la'){ u.lang = 'it-IT'; if(VI) u.voice = VI; u.rate = .85; } else if(l === 'ar'){ u.lang = 'ar-SA'; u.rate = .85; } else { u.lang = 'fr-FR'; if(VF) u.voice = VF; u.rate = .95; } u.pitch = 1.1;
    let fait = false; const fin = () => { if(!fait){ fait = true; res(); } }; u.onend = fin; u.onerror = fin; setTimeout(fin, 1500 + t.length * 120); speechSynthesis.speak(u); }catch(e){ res(); } }); }
const en = (t, l = 'en') => speak(`<i lang="${l}">${t}</i>`);
window.__lecture = { speak, hush, LEC, lecPause, lecSaute, lecVa };   // pour les tests
function hush(){ jeton++; if(LEC.pause){ LEC.pause = false; if(ac) ac.resume().catch(() => {}); } clearTimeout(LEC.garde); try{ speechSynthesis.cancel(); }catch(e){} if(window.FamilleSon && FamilleSon.enCours()) FamilleSon.stop(); if(joueur){ try{ joueur.onended = null; joueur.stop(); }catch(e){} joueur = null; } if(LEC.fin) LEC.fin(); if(barreEl) barre(false); }
function talk(){ document.querySelectorAll('.owl').forEach(o => { o.classList.remove('talk'); void o.offsetWidth; o.classList.add('talk'); }); }
function confetti(){ for(let i=0;i<10;i++){ const s=document.createElement('span'); s.className='float'; s.textContent=pick(C.confetti || ['⭐','🎟️','🌷','🍀','🎉']); s.style.left=rnd(5,90)+'vw'; s.style.top=rnd(55,90)+'vh'; s.style.animationDelay=(i*60)+'ms'; document.body.appendChild(s); setTimeout(()=>s.remove(),1800); } }
function topbar(back){
  return `<div class="top">
    ${back ? `<button class="chip" id="back">← ${C.retour || 'Le chemin'}</button>` : `<a class="chip" href="./">← Espace ${ENF}</a>`}
    <button class="chip round" id="mute" aria-label="${muted ? 'Activer' : 'Couper'} le son">${muted ? '🔇' : '🔊'}</button>
    <div class="chip stars" aria-label="Étoiles et tickets">⭐ ${totalStars()} <span class="tk">🎟️ ${data.tickets}</span></div></div>`;
}
function wireTop(back){
  const b = document.getElementById('back'); if(b) b.onclick = () => { sfx.tap(); hush(); (back || home)(); };
  document.getElementById('mute').onclick = e => { muted = !muted; try{ localStorage.setItem(KEY+'-muet', muted?'1':'0'); }catch(_){} e.currentTarget.textContent = muted ? '🔇' : '🔊'; if(muted) hush(); };
}
const teacher = html => `<div class="teacher">${C.prof || OWL}<div class="bubble" id="say" aria-live="polite">${html}</div></div>`;
function say(html, voice=true){ const s = document.getElementById('say'); if(s) s.innerHTML = html; if(voice) speak(html); }
const unlocked = i => i === 0 || (data.stars[C.CH[i-1].id] || 0) > 0;

/* ---------- accueil : le chemin ---------- */
function home(greet){
  hush(); const CH = C.CH;
  const next = CH.findIndex((c, i) => unlocked(i) && !(data.stars[c.id] > 0));
  app.innerHTML = topbar(false) +
    `<div><h1>${C.titre}</h1><p class="lead">${C.sous}</p></div>` + (C.bandeau || '') +
    (C.histoire ? `<button class="histoire-bt" id="histoire" style="--img:url('${new URL(C.histoire.scenes[0].img, location.href).href}')"><span>🎬</span><b>L'histoire : ${C.histoire.titre}</b><small>${data.histoire ? 'Revoir le dessin animé' : 'Commence par le dessin animé !'}</small></button>` : '') +
    teacher(next === 0 && !totalStars() ? C.bonjour
      : next >= 0 ? `Tu as déjà <b>${data.tickets} tickets 🎟️</b>, ${ENF} ! Ta prochaine étape : <b class="n">${CH[next].name}</b>.` : `Tu as tout fini, ${ENF} ! Refais les étapes pour gagner 3 étoiles partout… et encore des tickets 🎟️.`) +
    `<div class="tools"><button class="btn" id="fiche">📋 Ma fiche</button><button class="btn" id="carnet">📈 Mon carnet</button><a class="btn tkbtn" href="../jeux/serpent-legendes.html">🎟️ ${data.tickets} → Serpent Légendes</a></div>` +
    `<div class="path">${CH.map((c, i) => {
      const s = data.stars[c.id] || 0, open = unlocked(i);
      return `<button class="step${i === next ? ' next' : ''}" data-i="${i}" style="--edge:${c.edge || '#0002'}" ${open ? '' : 'disabled aria-disabled="true"'}>
        <span class="ic" aria-hidden="true">${open ? c.icon : '🔒'}</span>
        <span class="tx"><span class="num">Étape ${i+1}</span><b>${c.name}</b><span class="sub">${open ? c.sub : 'Termine l\'étape d\'avant'}</span></span>
        <span class="st" aria-label="${s} étoiles sur 3">${'★'.repeat(s)}${'☆'.repeat(3-s)}</span></button>`; }).join('')}</div>`;
  wireTop();
  app.querySelectorAll('.step').forEach(b => b.onclick = () => { if(b.disabled) return; sfx.tap(); start(+b.dataset.i); });
  document.getElementById('fiche').onclick = () => { sfx.tap(); fiche(); };
  document.getElementById('carnet').onclick = () => { sfx.tap(); carnet(); };
  const hb = document.getElementById('histoire'); if(hb) hb.onclick = () => { sfx.tap(); histoire(); };
  if(greet) speak(document.getElementById('say').innerHTML);
}

/* ---------- l'histoire en dessin animé (20/11) : C.histoire = { titre, scenes:[{ vid, img, txt }] } ----------
   Chaque scène : un petit film ComfyUI en boucle (Wan 2.2), le texte écrit dessous, lu par la voix du site ; on passe à la
   scène suivante quand la voix a fini (ou avec ⏭). Le cours commence par là, pour mettre l'enfant dans le sujet. */
function histoire(auto){
  hush(); const H = C.histoire, N = H.scenes.length; let k = 0, tok = 0, pause = false;
  if(auto){   // à l'ouverture de la page, la tablette refuse le son sans un toucher : on attend « Regarder »
    app.innerHTML = topbar(false) + `<div><h1>${C.titre}</h1><p class="lead">${C.sous}</p></div><button class="ha-go" id="hgo" style="--img:url('${new URL(H.scenes[0].img, location.href).href}')"><span>▶</span><b>${H.titre}</b><small>Regarde le dessin animé avant les exercices</small></button>
      <div class="tools"><button class="btn" id="hno">Plus tard : aller aux exercices →</button></div>`;
    wireTop(); document.getElementById('hgo').onclick = () => { sfx.tap(); histoire(); }; document.getElementById('hno').onclick = () => { sfx.tap(); home(false); }; return; }
  app.innerHTML = topbar(true) + `<div class="ha"><div class="ha-ecran"><img id="hi" alt=""><video id="hv" muted loop playsinline preload="auto"></video><div class="ha-num" id="hn"></div></div>
    <p class="ha-txt" id="ht"></p><div class="ha-bt"><button class="btn" id="hp">⏮</button><button class="btn" id="hz">⏸</button><button class="btn" id="hs">⏭</button><button class="btn go" id="hf">${data.histoire ? 'Aux exercices →' : 'Passer →'}</button></div></div>`;
  wireTop(); const v = document.getElementById('hv'), im = document.getElementById('hi'); v.muted = true; v.defaultMuted = true;
  const fin = () => { tok++; hush(); try{ v.pause(); }catch(e){} data.histoire = (data.histoire || 0) + 1; save(); home(true); };
  async function scene(i){
    k = Math.max(0, i); if(k >= N) return fin(); const t = ++tok, sc = H.scenes[k];
    /* 21/11 : sur la tablette d'Amine, la 1re image restait noire (le film pas encore prêt, et l'affiche du <video> pas montrée par l'iPad).
       L'image de la scène est maintenant une vraie <img> sous le film ; le film n'apparaît qu'une fois qu'il joue vraiment. */
    im.src = sc.img; v.classList.remove('joue'); v.onplaying = () => { if(t === tok) v.classList.add('joue'); };
    v.poster = sc.img; v.onerror = () => { v.classList.remove('joue'); v.removeAttribute('src'); }; if(sc.vid){ v.src = sc.vid; v.play().catch(() => {}); } else v.removeAttribute('src');
    const sv = H.scenes[k + 1]; if(sv){ const pi = new Image(); pi.src = sv.img; }
    document.getElementById('ht').innerHTML = sc.txt; document.getElementById('hn').textContent = (k + 1) + ' / ' + N;
    await speak(sc.txt); if(t !== tok) return;
    await new Promise(r => setTimeout(r, 900)); if(t !== tok || pause) return;
    scene(k + 1);
  }
  document.getElementById('hp').onclick = () => { pause = false; scene(k - 1); };
  document.getElementById('hs').onclick = () => { pause = false; scene(k + 1); };
  document.getElementById('hz').onclick = e => { pause = !pause; e.currentTarget.textContent = pause ? '▶' : '⏸'; if(pause){ tok++; hush(); v.pause(); } else { v.play().catch(() => {}); scene(k); } };
  document.getElementById('hf').onclick = fin;
  scene(0);
}

/* ---------- une séance ---------- */
let S = null;
function start(i){
  const c = C.CH[i];
  S = { i, c, k:0, errors:0, earned:0, list:c.make() };
  if(c.rule){
    app.innerHTML = topbar(true) + teacher(`Avant de commencer, voici la leçon de l'étape <b class="n">${c.name}</b>.`) +
      `<div class="card"><div class="rule">${c.rule}</div><button class="btn go" id="go">J'ai compris, on y va !</button></div>`;
    wireTop(); speak(`Voici la leçon. ` + c.rule);
    document.getElementById('go').onclick = () => { sfx.tap(); hush(); next(); };
  } else next();
}
function dots(){ return `<div class="dots" aria-label="Question ${S.k+1} sur ${S.list.length}">${S.list.map((_, j) => `<i class="${j < S.k ? 'done' : j === S.k ? 'now' : ''}"></i>`).join('')}</div>`; }
function frame(q, body, help, voice){
  app.innerHTML = topbar(true) + teacher(q) + `<div class="card ex">${body}</div>` + (help ? `<p class="help">${help}</p>` : '') + dots();
  wireTop(); speak(voice || q);
  const r = app.querySelector('[data-redire]'); if(r) r.onclick = () => speak(voice || q);
  return app.querySelector('.card.ex');
}
function next(){
  if(S.k >= S.list.length) return finish();
  const q = S.list[S.k], f = (C.ask && C.ask[q.t]) || ASK[q.t];
  f(q);
}
/* ---------- le contrôle (20/11, C.controle) : on ne gagne pas en touchant au hasard ----------
   - les réponses ne s'allument qu'après un petit temps de lecture (C.reflexion, 1,5 s par défaut) ;
   - une erreur : on ne montre pas la réponse, un indice s'affiche, la réponse fausse est barrée et on réessaie (sans ticket) ;
   - deux erreurs : la bonne réponse est montrée et expliquée, et la question revient à la fin de la série ;
   - des réponses fausses données trop vite (moins de 1 s, deux fois de suite) : « Doucement ! » et 4 s de pause. */
const CTRL = !!C.controle;
function attendre(card){
  if(!CTRL || !card) return; const ms = C.reflexion || 1500, bts = [...card.querySelectorAll('.ans, .tile, .pad button, #val2')];
  bts.forEach(b => b.disabled = true); card.insertAdjacentHTML('afterbegin', `<div class="lis" style="--d:${ms}ms" aria-hidden="true"><i></i></div>`);
  setTimeout(() => { if(!card.isConnected) return; bts.forEach(b => { if(!b.classList.contains('barre')) b.disabled = false; }); const l = card.querySelector('.lis'); if(l) l.remove(); S.t0 = performance.now(); }, ms);
}
function controle(ok, item, expl, btn, goodSel, retry){
  if(!CTRL || ok || !retry) return false;
  const q = S.list[S.k]; q.essai = (q.essai || 0) + 1;
  const vite = S.t0 && performance.now() - S.t0 < 1000; S.vite = vite ? (S.vite || 0) + 1 : 0;
  if(q.essai >= 2) return false;   // 2e erreur : on montre la réponse (answered), et la question reviendra
  S.errors++; note(item, false); save(); sfx.no(); if(btn){ btn.classList.add('bad', 'shake', 'barre'); btn.disabled = true; }
  const card = app.querySelector('.card.ex');
  say('Pas encore. ' + (q.indice || 'Relis bien la question et réfléchis avant de répondre.') + ' Essaie encore !');
  if(S.vite >= 2){ S.vite = 0; card.insertAdjacentHTML('beforeend', `<div class="doucement">🐢 Doucement, ${ENF} ! On ne répond pas au hasard : lis, réfléchis, puis réponds.</div>`); say(`Doucement, ${ENF}. On ne répond pas au hasard. Lis bien, réfléchis, puis réponds.`);
    const bts = [...card.querySelectorAll('.ans:not(.barre), .tile, .pad button, #val2')]; bts.forEach(b => b.disabled = true);
    setTimeout(() => { bts.forEach(b => b.disabled = false); const d = card.querySelector('.doucement'); if(d) d.remove(); S.t0 = performance.now(); }, 4000); }
  else S.t0 = performance.now();
  retry(); return true;
}
function answered(ok, item, expl, btn, goodSel){
  if(CTRL){ const q = S.list[S.k];
    if(!ok && q.essai >= 2 && !q.revient){ S.list.push(Object.assign({}, q, { essai:0, revient:true })); expl = (expl || '') + ' <i>On reverra cette question à la fin.</i>'; }
    if(ok && q.essai){ app.querySelectorAll('.ans, .tile, .pad button, .ex [data-lock]').forEach(x => x.disabled = true); if(btn) btn.classList.add('good'); sfx.ok(); note(item, true); save();
      say('Oui, c\'est ça ! ' + (expl || '')); const card = app.querySelector('.card.ex');
      card.insertAdjacentHTML('beforeend', `<button class="btn ok" id="nx">${S.k + 1 < S.list.length ? 'Suivant →' : 'Terminer'}</button>`);
      const nx = document.getElementById('nx'); nx.onclick = () => { sfx.tap(); hush(); S.k++; next(); }; return; }
    if(!ok){ S.errors--; }   // la 1re erreur est déjà comptée par controle()
  }
  app.querySelectorAll('.ans, .tile, .pad button, .ex [data-lock]').forEach(x => { x.disabled = true; if(goodSel && x.matches(goodSel)) x.classList.add('good'); });
  if(ok){ S.earned++; data.tickets++; sfx.ok(); setTimeout(sfx.ticket, 220); if(btn) btn.classList.add('good'); }
  else { S.errors++; sfx.no(); if(btn){ btn.classList.add('bad'); btn.classList.add('shake'); } }
  note(item, ok); save();
  const tk = app.querySelector('.tk'); if(tk) tk.textContent = '🎟️ ' + data.tickets;
  const msg = (ok ? pick(['Bravo !', 'Exactement !', 'Super, ' + ENF + ' !', 'Oui !', 'Parfait !']) + ' <span class="plus">+1 🎟️</span> ' : 'Pas tout à fait. ') + (expl || '');
  say(msg);
  const card = app.querySelector('.card.ex');
  card.insertAdjacentHTML('beforeend', `<button class="btn ok" id="nx">${S.k + 1 < S.list.length ? 'Suivant →' : 'Terminer'}</button>`);
  const nx = document.getElementById('nx'); nx.focus({ preventScroll:true });
  nx.onclick = () => { sfx.tap(); hush(); S.k++; next(); };
}

/* ce qu'Ollie dit : la consigne, puis le mot ou la phrase à écouter (dans sa langue) */
const ecoute = q => q.en ? (q.voice || q.q) + ` <i lang="${q.lang || 'en'}">${esc(q.en)}</i>` : q.voice;
/* ---------- les types de questions communs ---------- */
const ASK = {
  /* un choix : { q, body, opts:[texte | {v, html}], good, item, expl, cols, voice, en (mot anglais à faire entendre) } */
  choix(q){
    const opts = q.opts.map(o => typeof o === 'object' ? o : { v:o, html:esc(o) });
    const card = frame(q.q, (q.body || '') + (q.en ? `<button class="btn" data-ecoute>🔊 Écouter</button>` : '') +
      `<div class="answers${q.cols === 3 ? ' ends' : ''}${q.cols === 1 ? ' one' : ''}${q.imgs ? ' imgs' : ''}">${opts.map(o => `<button class="ans" data-v="${esc(o.v)}">${o.html}</button>`).join('')}</div>`, q.help, ecoute(q));
    const e = card.querySelector('[data-ecoute]'); if(e) e.onclick = () => en(q.en, q.lang);
    card.querySelectorAll('.ans').forEach(b => b.onclick = () => { const ok = b.dataset.v === String(q.good), g = `.ans[data-v="${CSS.escape(String(q.good))}"]`;
      if(controle(ok, q.item, q.expl, b, g, () => {})) return; answered(ok, q.item, q.expl, b, g); });
    attendre(card);
  },
  /* un nombre au pavé : { q, body, good, item, expl } */
  nombre(q){
    const card = frame(q.q, (q.body || '') + `<div class="saisie" aria-live="polite"><span id="val">?</span></div>
      <div class="pad">${[1,2,3,4,5,6,7,8,9,0].map(n => `<button data-n="${n}">${n}</button>`).join('')}</div>
      <div class="choices"><button class="btn" id="eff" data-lock>⌫ Effacer</button><button class="btn go" id="val2" data-lock>Valider ✔</button></div>`, q.help, q.voice);
    let v = ''; const show = () => card.querySelector('#val').textContent = v || '?';
    card.querySelectorAll('.pad button').forEach(b => b.onclick = () => { if(v.length < 4){ sfx.tap(); v += b.dataset.n; v = String(+v); show(); } });
    card.querySelector('#eff').onclick = () => { v = v.slice(0, -1); show(); };
    card.querySelector('#val2').onclick = () => { if(!v) return; const ok = +v === q.good; const s = card.querySelector('.saisie');
      if(controle(ok, q.item, q.expl, null, null, () => { s.classList.add('ko'); setTimeout(() => s.classList.remove('ko'), 700); v = ''; show(); })) return;
      s.classList.add(ok ? 'ok' : 'ko'); if(!ok) s.innerHTML = `<s>${v}</s> <b>${q.good}</b>`; answered(ok, q.item, q.expl); };
    attendre(card);
  },
  /* épeler un mot avec des lettres : { q, body, word, item, expl, en } */
  epelle(q){
    const W = q.word.toUpperCase(), extra = shuffle('ABCDEFGHIKLMNOPRSTUW'.split('').filter(c => !W.includes(c))).slice(0, 2);
    const tiles = shuffle([...W.replace(/ /g, ''), ...extra]);
    const card = frame(q.q, (q.body || '') + (q.en ? `<button class="btn" data-ecoute>🔊 Écouter</button>` : '') +
      `<div class="mot" aria-live="polite">${[...W].map(c => c === ' ' ? '<i class="sp"></i>' : '<i></i>').join('')}</div>
      <div class="tiles">${tiles.map((c, j) => `<button class="tile" data-j="${j}">${c}</button>`).join('')}</div>
      <div class="choices"><button class="btn" id="eff" data-lock>⌫ Effacer</button></div>`, q.help, ecoute(q));
    const e = card.querySelector('[data-ecoute]'); if(e) e.onclick = () => en(q.en, q.lang);
    const slots = [...card.querySelectorAll('.mot i:not(.sp)')], used = [];
    const show = () => slots.forEach((s, k) => s.textContent = used[k] ? used[k].textContent : '');
    card.querySelectorAll('.tile').forEach(b => b.onclick = () => { if(b.disabled || used.length >= slots.length) return; sfx.tap(); used.push(b); b.disabled = true; show();
      if(used.length === slots.length){ const got = used.map(x => x.textContent).join(''), ok = got === W.replace(/ /g, '');
        if(controle(ok, q.item, q.expl, null, null, () => { card.querySelector('.mot').classList.add('ko'); setTimeout(() => { card.querySelector('.mot').classList.remove('ko'); while(used.length){ used.pop().disabled = false; } show(); }, 700); })) return;
        card.querySelector('.mot').classList.add(ok ? 'ok' : 'ko'); if(!ok) card.querySelector('.mot').insertAdjacentHTML('afterend', `<p class="corr">${esc(q.word)}</p>`);
        answered(ok, q.item, q.expl); } });
    attendre(card);
    card.querySelector('#eff').onclick = () => { const b = used.pop(); if(b) b.disabled = false; show(); };
  },
  /* remettre des mots dans l'ordre : { q, words:[…dans l'ordre], fin:'.', item, expl } */
  ordre(q){
    const order = q.words, mix = (() => { let m; do m = shuffle(order.map((w, j) => j)); while(m.every((x, j) => x === j)); return m; })();
    const card = frame(q.q, `<div class="phr" aria-live="polite"></div><div class="tiles mots">${mix.map(j => `<button class="tile" data-j="${j}">${esc(order[j])}</button>`).join('')}</div>
      <div class="choices"><button class="btn" id="eff" data-lock>⌫ Effacer</button></div>`, q.help, q.voice);
    const used = [], phr = card.querySelector('.phr');
    const show = () => phr.innerHTML = used.map(b => `<span>${esc(b.textContent)}</span>`).join(' ') + (used.length === order.length ? esc(q.fin || '') : '');
    card.querySelectorAll('.tile').forEach(b => b.onclick = () => { if(b.disabled) return; sfx.tap(); used.push(b); b.disabled = true; show();
      if(used.length === order.length){ const got = used.map(x => x.textContent).join(' '), ok = got === order.join(' ') || (q.aussi || []).includes(got);
        if(controle(ok, q.item, q.expl, null, null, () => { phr.classList.add('ko'); setTimeout(() => { phr.classList.remove('ko'); while(used.length){ used.pop().disabled = false; } show(); }, 700); })) return;
        phr.classList.add(ok ? 'ok' : 'ko'); if(!ok) phr.insertAdjacentHTML('afterend', `<p class="corr">${esc(order.join(' ') + (q.fin || ''))}</p>`);
        answered(ok, q.item, q.expl); } });
    attendre(card);
    card.querySelector('#eff').onclick = () => { const b = used.pop(); if(b) b.disabled = false; phr.classList.remove('ok', 'ko'); show(); };
  },
  /* 20/11 : RÉPÉTER à voix haute (prononciation) : { q, en:'Hello', body, item, expl, aussi:['hallo'] }
     Ollie dit le mot, l'enfant touche 🎤 et le répète ; la reconnaissance vocale de la tablette (iPad : celle d'Apple, en anglais)
     écoute et compare, avec indulgence. 3 essais au plus, puis on passe sans compter de faute (la tablette entend parfois mal).
     Sans reconnaissance (ou micro refusé) : l'enfant écoute, répète, et touche « Je l'ai dit ✔ ». */
  repete(q){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition, lang = q.lang || 'en';
    const card = frame(q.q, (q.body || '') + `<div class="dis"><b lang="${lang}">${esc(q.en)}</b>${q.phon ? `<small>${esc(q.phon)}</small>` : ''}</div>
      <div class="choices"><button class="btn" data-ecoute data-lock>🔊 Écouter</button><button class="btn go micro" id="mic" data-lock>🎤 À toi !</button></div><p class="entendu" aria-live="polite"></p>`, q.help, ecoute(q));
    const mic = card.querySelector('#mic'), ent = card.querySelector('.entendu'); let essais = 0, fini = false;
    card.querySelector('[data-ecoute]').onclick = () => en(q.en, lang);
    const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/[^a-z0-9\u0621-\u064A ]/g, ' ').replace(/\s+/g, ' ').trim();   // 26/11 : l'arabe garde ses lettres (sans les voyelles)
    const dist = (a, b) => { const d = Array.from({ length:a.length + 1 }, (_, i) => [i]); for(let j = 1; j <= b.length; j++) d[0][j] = j;
      for(let i = 1; i <= a.length; i++) for(let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
    const bon = alts => { if(C.indulgent && alts.some(t => norm(t))) return true;   // 21/11 (Amine, 5 ans) : avoir répété suffit
      const cibles = [q.en, ...(q.aussi || [])].map(norm); return alts.some(t => { t = norm(t); return cibles.some(c => t === c || t.includes(c) || dist(t, c) <= Math.max(1, Math.floor(c.length / 4))); }); };
    const passe = (ok, txt) => { fini = true; mic.disabled = true;
      if(ok) return answered(true, q.item, q.expl);
      note(q.item, false); save(); say(txt + ' ' + (q.expl || ''));
      card.insertAdjacentHTML('beforeend', `<button class="btn ok" id="nx">${S.k + 1 < S.list.length ? 'Suivant →' : 'Terminer'}</button>`);
      document.getElementById('nx').onclick = () => { sfx.tap(); hush(); S.k++; next(); }; };
    if(!SR){ mic.textContent = '✔ Je l\'ai dit'; mic.onclick = () => { if(fini) return; passe(true); }; attendre(card); return; }
    mic.onclick = async () => { if(fini) return; hush(); mic.disabled = true; mic.classList.add('ecoute'); mic.textContent = '👂 J\'écoute…'; ent.textContent = '';
      try{ if(window.FamilleSon) FamilleSon.avantMicro(); }catch(e){}
      const r = new SR(); r.lang = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-SA' : lang; r.interimResults = false; r.maxAlternatives = 5; let eu = false;
      const fin = async alts => { if(eu) return; eu = true; mic.classList.remove('ecoute'); mic.textContent = '🎤 À toi !'; try{ if(window.FamilleSon) await FamilleSon.apresMicro(); }catch(e){}
        if(alts === null){ mic.textContent = '✔ Je l\'ai dit'; mic.disabled = false; mic.onclick = () => { if(!fini) passe(true); }; say('Je n\'arrive pas à utiliser le micro. Répète à voix haute, puis touche « Je l\'ai dit ».'); return; }
        essais++; if(alts.length) ent.textContent = '👂 J\'ai entendu : « ' + alts[0] + ' »';
        if(bon(alts)) return passe(true);
        if(essais >= 3) return passe(false, 'La tablette a du mal à t\'entendre. Ce n\'est pas grave, on continue !');
        sfx.no(); say('Presque ! Écoute encore, puis répète bien fort : <i lang="' + lang + '">' + esc(q.en) + '</i>'); mic.disabled = false; };
      r.onresult = e => { const alts = []; for(const res of e.results) for(let i = 0; i < res.length; i++) alts.push(res[i].transcript); fin(alts); };
      r.onerror = e => fin(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? null : []);
      r.onend = () => fin([]);
      try{ r.start(); }catch(e){ fin(null); }
      setTimeout(() => { try{ r.stop(); }catch(e){} }, 6000); setTimeout(() => fin([]), 8500); };
    attendre(card);
  },
};

function finish(){
  const total = S.list.length, good = total - S.errors, st = S.errors === 0 ? 3 : S.errors <= 2 ? 2 : 1;
  const bonus = st === 3 ? 3 : 0;
  data.stars[S.c.id] = Math.max(data.stars[S.c.id] || 0, st); data.done[S.c.id] = (data.done[S.c.id] || 0) + 1;
  data.tickets += bonus; data.last = new Date().toISOString(); save();
  sfx.win(); confetti();
  const nextI = S.i + 1 < C.CH.length ? S.i + 1 : -1;
  const msg = (st === 3 ? `Sans faute, ${ENF} ! ` : `${good} bonnes réponses sur ${total}. `) + `Tu gagnes <b>${S.earned + bonus} tickets 🎟️</b>${bonus ? ' (dont 3 de bonus pour le sans-faute)' : ''}. Tu en as ${data.tickets} en tout pour Serpent Légendes !`;
  app.innerHTML = topbar(true) + teacher(msg) +
    `<div class="card result"><div class="big" aria-label="${st} étoiles sur 3">${'★'.repeat(st)}${'☆'.repeat(3-st)}</div>
     <b style="font-family:var(--display);font-size:26px">${S.c.name}</b>
     <div class="choices"><button class="btn" id="again">↻ Recommencer</button>${nextI >= 0 ? `<button class="btn go" id="nxt">Étape suivante →</button>` : `<button class="btn go" id="path">${C.retour || 'Le chemin'}</button>`}</div>
     <a class="btn tkbtn" href="../jeux/serpent-legendes.html">🎟️ Dépenser mes tickets dans Serpent Légendes</a></div>`;
  wireTop(); speak(msg);
  document.getElementById('again').onclick = () => { sfx.tap(); start(S.i); };
  const n = document.getElementById('nxt'); if(n) n.onclick = () => { sfx.tap(); start(nextI); };
  const pth = document.getElementById('path'); if(pth) pth.onclick = () => { sfx.tap(); home(); };
}

function fiche(){
  app.innerHTML = topbar(true) + teacher(`Voici ta fiche de leçon. Touche 🔊 pour que je la lise.`) +
    C.fiche.map((f, j) => `<div class="card fiche"><h2>${f.h}${f.tag ? ` <small>${f.tag}</small>` : ''}</h2>${f.html}<button class="btn" data-read="${j}">🔊 Lire</button></div>`).join('');
  wireTop();
  app.querySelectorAll('[data-read]').forEach(b => b.onclick = () => speak(C.fiche[+b.dataset.read].lire));
  app.querySelectorAll('[data-en]').forEach(b => b.onclick = () => en(b.dataset.en, b.dataset.lang || 'en'));
}
function carnet(){
  const review = Object.entries(data.items).filter(([, v]) => v.ko > 0).sort((a, b) => (b[1].ko - b[1].ok / 3) - (a[1].ko - a[1].ok / 3)).slice(0, 10);
  const strong = Object.entries(data.items).filter(([, v]) => v.ok >= 3 && v.ko === 0).map(([k]) => k).slice(0, 30);
  const doneN = C.CH.filter(c => data.stars[c.id] > 0).length;
  app.innerHTML = topbar(true) + teacher(`Voici ton carnet, ${ENF} : <b>${doneN} étape${doneN > 1 ? 's' : ''} sur ${C.CH.length}</b>, ${totalStars()} étoiles et ${data.tickets} tickets 🎟️.`) +
    `<div class="card carnet"><h2>Mes étapes</h2><div class="prog"><i style="width:${Math.round(doneN / C.CH.length * 100)}%"></i></div>
      <ul class="clist">${C.CH.map(c => { const s = data.stars[c.id] || 0; return `<li><span aria-hidden="true">${c.icon}</span><b>${c.name}</b><span class="st">${'★'.repeat(s)}${'☆'.repeat(3-s)}</span><small>${data.done[c.id] ? data.done[c.id] + ' fois' : 'pas encore'}</small></li>`; }).join('')}</ul></div>
    <div class="card carnet"><h2>${C.revoir || 'À revoir'}</h2>${review.length ? `<div class="vlist">${review.map(([k, v]) => `<span class="vk">${esc(k)} <small>${v.ok} ✔ · ${v.ko} ✘</small></span>`).join('')}</div>` : `<p>Rien à revoir pour l'instant. Bravo !</p>`}
      ${strong.length ? `<h2>Bien su</h2><div class="vlist">${strong.map(k => `<span class="vk ok">${esc(k)}</span>`).join('')}</div>` : ''}</div>`;
  wireTop(); speak(document.getElementById('say').innerHTML);
}

window.OLLIE = { segments, rnd, pick, shuffle, esc, speak, en, hush, say, frame, answered, controle, attendre, sfx, ASK, get S(){ return S; } };
if(C.histoire && !data.histoire) histoire(true); else home(false);
if(window.Famille){
  Famille.track(C.track, ENF, [KEY]);
  Famille.load(C.track, ENF).then(r => {
    const d = r && r[KEY];
    if(d && (d.t || 0) > (data.t || 0) && (d.tickets || 0) >= (data.tickets || 0)){ data = Object.assign({ stars:{}, done:{}, tickets:0, items:{} }, d); try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} if(!S && !document.getElementById('hv')) home(false); }
  });
}
})();
