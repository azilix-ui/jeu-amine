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
const clean = t => String(t).replace(/<small>.*?<\/small>/g,'').replace(/<[^>]+>/g,'').replace(/_{2,}|…{1}(?=\s|$)/g,' ... ').replace(/«|»/g,'').replace(/🎟️|⭐|🔊|→/g,'').replace(/&amp;/g,'&').replace(/&#39;/g,"'").trim();
function segments(html){ const out = [], re = /<(\w+)[^>]*\blang="?(en|de|la)"?[^>]*>([\s\S]*?)<\/\1>/g; let m, last = 0; html = String(html);
  while((m = re.exec(html))){ if(m.index > last) out.push([html.slice(last, m.index), 'fr']); out.push([m[3], m[2]]); last = re.lastIndex; }
  if(last < html.length) out.push([html.slice(last), 'fr']); return out.map(([t, l]) => [clean(t), l]).filter(([t]) => t && /[\p{L}\p{N}]/u.test(t)); }
/* Les voix enregistrées (ElevenLabs) : C.voix = 'ollie' → sons famille-data/lire-voix/ollie/<clé>.mp3 (liste window.LIRE_VOIX, servis par
   ../amine/lire/son.php). Une phrase anglaise enregistrée est jouée telle quelle ; le reste est dit par la voix de la tablette, à la suite. */
const cle = t => String(t).toLowerCase().replace(/é/g, 'ee').replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const DISPO = (window.LIRE_VOIX || {})[C.voix || ''] || null, SONS = DISPO ? new Set(DISPO.k) : new Set();
const fichier = t => { const k = cle(t); return SONS.has(k) ? `../amine/lire/son.php?v=${C.voix}&k=${k}&r=${DISPO.r}` : null; };
// Le reste passe par les voix ElevenLabs du site (api/voix.php : Céline en français, Alice en anglais, gardées après la 1re fois).
// Si le site ne peut pas (pas de clé, plafond du mois), la voix de la tablette prend le relais.
const enLigne = (t, l) => `/api/voix.php?l=${l}&t=${encodeURIComponent(t)}`;
const morceaux = (t, n = 330) => { if(t.length <= n) return [t]; const out = []; let cur = ''; for(const p of t.split(/(?<=[.!?:;])\s+/)){ if((cur + ' ' + p).trim().length > n && cur){ out.push(cur.trim()); cur = p; } else cur = (cur + ' ' + p).trim(); } if(cur) out.push(cur); return out; };
const tampons = {};
function actx(){ try{ ac = ac || new (window.AudioContext||window.webkitAudioContext)(); if(ac.state === 'suspended') ac.resume(); }catch(e){} return ac; }
function tampon(f){ if(tampons[f]) return tampons[f]; const a = actx(); if(!a) return Promise.reject();
  return tampons[f] = fetch(f).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }).then(b => new Promise((ok, ko) => { const p = a.decodeAudioData(b, ok, ko); if(p && p.catch) p.catch(ko); })).catch(e => { delete tampons[f]; throw e; }); }
let jeton = 0, joueur = null;
function speak(html){
  talk(); hush(); if(muted || (window.FamilleVoix && !FamilleVoix.on())) return;   // touche V : consignes orales coupées
  const j = jeton, segs = [];
  for(const [t, l] of segments(html)) for(const m of (l === 'en' && fichier(t) ? [t] : morceaux(t))) segs.push([m, l, (l === 'en' && fichier(m)) || enLigne(m, l)]);
  segs.forEach(([, , f]) => tampon(f).catch(() => {}));   // tout se charge en même temps, puis se joue dans l'ordre
  (async () => { for(const [t, l, f] of segs){ if(j !== jeton) return;
    try{ const b = await tampon(f); if(j !== jeton) return; await new Promise(res => { const a = actx(), s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); joueur = s; s.onended = res; setTimeout(res, b.duration * 1000 + 400); s.start(); }); continue; }catch(e){}
    await dire(t, l, j); } })();
}
function dire(t, l, j){ return new Promise(res => { if(!('speechSynthesis' in window) || j !== jeton) return res();
  try{ const u = new SpeechSynthesisUtterance(t); if(l === 'en'){ u.lang = 'en-GB'; if(VE) u.voice = VE; u.rate = .82; } else if(l === 'de'){ u.lang = 'de-DE'; if(VD) u.voice = VD; u.rate = .85; } else if(l === 'la'){ u.lang = 'it-IT'; if(VI) u.voice = VI; u.rate = .85; } else { u.lang = 'fr-FR'; if(VF) u.voice = VF; u.rate = .95; } u.pitch = 1.1;
    let fait = false; const fin = () => { if(!fait){ fait = true; res(); } }; u.onend = fin; u.onerror = fin; setTimeout(fin, 1500 + t.length * 120); speechSynthesis.speak(u); }catch(e){ res(); } }); }
const en = (t, l = 'en') => speak(`<i lang="${l}">${t}</i>`);
function hush(){ jeton++; try{ speechSynthesis.cancel(); }catch(e){} if(joueur){ try{ joueur.onended = null; joueur.stop(); }catch(e){} joueur = null; } }
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
  if(greet) speak(document.getElementById('say').innerHTML);
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
function answered(ok, item, expl, btn, goodSel){
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
    card.querySelectorAll('.ans').forEach(b => b.onclick = () => answered(b.dataset.v === String(q.good), q.item, q.expl, b, `.ans[data-v="${CSS.escape(String(q.good))}"]`));
  },
  /* un nombre au pavé : { q, body, good, item, expl } */
  nombre(q){
    const card = frame(q.q, (q.body || '') + `<div class="saisie" aria-live="polite"><span id="val">?</span></div>
      <div class="pad">${[1,2,3,4,5,6,7,8,9,0].map(n => `<button data-n="${n}">${n}</button>`).join('')}</div>
      <div class="choices"><button class="btn" id="eff" data-lock>⌫ Effacer</button><button class="btn go" id="val2" data-lock>Valider ✔</button></div>`, q.help, q.voice);
    let v = ''; const show = () => card.querySelector('#val').textContent = v || '?';
    card.querySelectorAll('.pad button').forEach(b => b.onclick = () => { if(v.length < 4){ sfx.tap(); v += b.dataset.n; v = String(+v); show(); } });
    card.querySelector('#eff').onclick = () => { v = v.slice(0, -1); show(); };
    card.querySelector('#val2').onclick = () => { if(!v) return; const ok = +v === q.good; const s = card.querySelector('.saisie'); s.classList.add(ok ? 'ok' : 'ko');
      if(!ok) s.innerHTML = `<s>${v}</s> <b>${q.good}</b>`; answered(ok, q.item, q.expl); };
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
        card.querySelector('.mot').classList.add(ok ? 'ok' : 'ko'); if(!ok) card.querySelector('.mot').insertAdjacentHTML('afterend', `<p class="corr">${esc(q.word)}</p>`);
        answered(ok, q.item, q.expl); } });
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
        phr.classList.add(ok ? 'ok' : 'ko'); if(!ok) phr.insertAdjacentHTML('afterend', `<p class="corr">${esc(order.join(' ') + (q.fin || ''))}</p>`);
        answered(ok, q.item, q.expl); } });
    card.querySelector('#eff').onclick = () => { const b = used.pop(); if(b) b.disabled = false; phr.classList.remove('ok', 'ko'); show(); };
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

window.OLLIE = { segments, rnd, pick, shuffle, esc, speak, en, hush, say, frame, answered, sfx, ASK, get S(){ return S; } };
home(false);
if(window.Famille){
  Famille.track(C.track, ENF, [KEY]);
  Famille.load(C.track, ENF).then(r => {
    const d = r && r[KEY];
    if(d && (d.t || 0) > (data.t || 0) && (d.tickets || 0) >= (data.tickets || 0)){ data = Object.assign({ stars:{}, done:{}, tickets:0, items:{} }, d); try{ localStorage.setItem(KEY, JSON.stringify(data)); }catch(e){} if(!S) home(false); }
  });
}
})();
