/* Les Écuries d'Essil — l'interface : la cour, le club-house (cours et quiz), la sellerie, le marchand, l'écurie, les concours. */
import { FILET, SELLE, ROBES, RACES, OUTILS, ORDRE, PANSAGE_QCM, HARNAIS_QCM, CHEVAUX, STATS, COULEURS, HEX, RAYONS, NOURRITURE, EPREUVES } from './data.js';

const $ = id => document.getElementById(id);
const IMG = new URL('img/', import.meta.url).href;   // marche depuis essil/les-ecuries.html comme depuis jeux/les-ecuries.html
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;' }[c]));
const shuffle = a => { a = a.slice(); for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const RACE_IMG = { 'Connemara':'r-connemara', 'Shetland':'r-shetland', 'Haflinger':'r-haflinger', 'Camargue':'r-camargue', 'Fjord':'r-fjord', 'Barbe':'r-barbe', 'Percheron':'r-percheron', 'Appaloosa':'c-tachete', 'Selle français':'r-sellefrancais', 'Frison':'r-frison', 'Pur-sang anglais':'r-pursang', 'Pur-sang arabe':'r-arabe', 'Pure race espagnole':'r-espagnol' };
const DEF = Object.fromEntries(CHEVAUX.map(h => [h.id, h]));

/* ---------- sauvegarde ---------- */
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
let player = null, S = null;
const key = () => 'ecuries:' + player;
const newHorse = eq => ({ eq:eq || {}, dirt:.6, faim:55, moral:60, t:Date.now(), gour:[] });
const fresh = () => ({ v:1, t:0, coins:100, horses:{ noisette:newHorse({ licol:'marine', filet:'havane', selle:'havane' }) }, owned:{ 'licol:marine':1, 'filet:havane':1, 'selle:havane':1 }, cur:'noisette', best:{}, ecole:{}, n:{ quiz:0, pansages:0, concours:0 } });
function save(){ S.t = Date.now(); store.set(key(), S); }
function decay(){ const now = Date.now(); Object.values(S.horses).forEach(h => { const hrs = Math.max(0, (now - (h.t || now)) / 36e5); if(hrs < .02) return; h.dirt = Math.min(1, h.dirt + hrs / 9); h.faim = Math.max(0, h.faim - hrs * 11); h.moral = Math.max(20, h.moral - hrs * 2); h.t = now; }); }
const tracked = new Set();
async function setPlayer(name){
  player = name; S = Object.assign(fresh(), store.get(key(), null) || {});
  if(window.Famille){ if(!tracked.has(name)){ tracked.add(name); Famille.track('ecuries', name, [key()]); }
    await sync(name); }
  if(!S.horses[S.cur]) S.cur = Object.keys(S.horses)[0]; decay(); renderWho(); coins(0);
}
/* Deux appareils (PC le matin, tablette le soir) : on RÉUNIT les deux sauvegardes au lieu de garder la plus récente.
   Sinon un onglet resté ouvert sur le PC réécrivait par-dessus les achats faits sur la tablette (Essil, 11/11).
   Rien ne se perd : chevaux et matériel = tout ce qui existe d'un côté ou de l'autre, records = le meilleur, pièces = l'appareil le plus récent. */
function merge(d){
  let ch = false; const newer = (d.t || 0) > (S.t || 0);
  Object.entries(d.horses || {}).forEach(([id, h]) => { const m = S.horses[id]; if(!m){ S.horses[id] = h; ch = true; } else if((h.t || 0) > (m.t || 0)) Object.assign(m, h); });
  Object.keys(d.owned || {}).forEach(k => { if(!S.owned[k]){ S.owned[k] = 1; ch = true; } });
  Object.entries(d.best || {}).forEach(([k, v]) => { if(v != null && (S.best[k] == null || v < S.best[k])){ S.best[k] = v; ch = true; } });
  Object.entries(d.ecole || {}).forEach(([k, v]) => { if(v > (S.ecole[k] || 0)){ S.ecole[k] = v; ch = true; } });
  Object.entries(d.n || {}).forEach(([k, v]) => { if(v > (S.n[k] || 0)){ S.n[k] = v; ch = true; } });
  if(newer){ if(S.coins !== d.coins){ S.coins = d.coins; ch = true; } if(d.cur && S.horses[d.cur] && !syncedOnce) S.cur = d.cur; }
  return ch;
}
let syncedOnce = false, syncing = false;
async function sync(name){
  if(!window.Famille || !name || syncing) return; syncing = true;
  try{ const r = await Famille.load('ecuries', name), d = r && r[key()];
    if(d && player === name && S){ const had = Object.keys(S.horses).length, ch = merge(d); syncedOnce = true;
      // l'autre appareil n'a pas tout ce qu'on a ici : on renvoie la sauvegarde réunie
      const more = Object.keys(S.horses).some(id => !(d.horses || {})[id]) || Object.keys(S.owned).some(k => !(d.owned || {})[k]);
      if(ch || more){ S.t = Math.max(S.t || 0, d.t || 0); store.set(key(), S); }   // sans avancer l'heure : les pièces restent celles du dernier appareil où l'on a vraiment joué
      if(ch){ coins(0); if(Object.keys(S.horses).length > had && typeof refreshAfterSync === 'function') refreshAfterSync(); } } }catch(e){}
  syncing = false;
}
function refreshAfterSync(){ if(['hub', 'market', 'concours', 'shop'].includes(cur)) go(cur); }
// un onglet resté ouvert reprend ce qui a été fait ailleurs dès qu'on y revient, puis toutes les minutes
document.addEventListener('visibilitychange', () => { if(!document.hidden && player) sync(player); });
window.addEventListener('focus', () => { if(player) sync(player); });
setInterval(() => { if(!document.hidden && player) sync(player); }, 60000);
const KIDS = ['essil', 'salma', 'amine', 'anis', 'imen'];
const avatarOf = n => { const k = n.toLowerCase(); if(KIDS.includes(k)) return `../jeux/avatars/${k}.webp`; const h = window.Famille && Famille.head && Famille.head(n); return h ? '../jeux/' + h.img : '../jeux/avatars/mascotte-nour.webp'; };
function renderWho(){ $('who1').innerHTML = `<img src="${avatarOf(player)}" alt="">${esc(player)}`;
  const o = $('owner'); if(o) o.textContent = (/^[aeiouyhàâéèêîôû]/i.test(player) ? "d'" : 'de ') + player; }   // la page de la famille : « Les Écuries de Salma », « d'Amine »…
async function choose(){ const n = await Famille.choosePlayer({ title:'Qui monte à cheval ?', cancel:!!player, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="../jeux/avatars/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` }); if(n) await setPlayer(n); return n; }

/* ---------- sons ---------- */
let AC = null, sndOn = store.get('ecuries-son', true);
function audio(){ if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(f, d = .15, type = 'sine', vol = .15, slide = 0, when = 0){ if(!sndOn || !audio()) return; const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f * slide), t + d);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .03); }
let noiseBuf = null;
function noise(d = .08, vol = .2, freq = 900, q = 1, when = 0){ if(!sndOn || !audio()) return; if(!noiseBuf){ noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const a = noiseBuf.getChannelData(0); for(let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
  const t = AC.currentTime + when, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t, Math.random() * .5, d + .02); }
let brushT = 0;
const SFX = {
  tap(){ tone(620, .06, 'triangle', .09); }, ok(){ tone(660, .12, 'triangle', .14); tone(990, .2, 'triangle', .12, 1, .09); }, ko(){ tone(200, .22, 'sawtooth', .07, .7); },
  coin(){ tone(1320, .08, 'square', .06); tone(1760, .16, 'square', .06, 1, .07); }, brosse(){ const n = performance.now(); if(n - brushT < 110) return; brushT = n; noise(.09, .12, 2600 + Math.random() * 900, .8); },
  croque(){ for(let i = 0; i < 5; i++) noise(.07, .2, 1500, 2, i * .16); }, sabot1(){ noise(.05, .16, 300, 3); }, sabot2(){ noise(.05, .2, 340, 3); }, sabot3(){ noise(.05, .22, 280, 3); noise(.05, .18, 330, 3, .09); },
  saut(){ tone(300, .25, 'sine', .1, 2.2); }, pose(){ noise(.12, .3, 180, 2); }, barre(){ tone(520, .08, 'square', .1); tone(390, .1, 'square', .1, 1, .09); noise(.2, .25, 700, 1, .05); }, refus(){ tone(240, .3, 'sawtooth', .09, .6); },
  plouf(){ noise(.4, .3, 900, .6); }, cloche(){ tone(1568, .5, 'sine', .16); tone(2093, .5, 'sine', .08); }, bravo(){ [523, 659, 784, 1047].forEach((f, i) => tone(f, .4, 'triangle', .14, 1, i * .12)); for(let k = 0; k < 14; k++) noise(.1, .08, 2500 + Math.random() * 2000, .7, .5 + k * .06); }, fin(){ tone(392, .3, 'triangle', .12); tone(330, .4, 'triangle', .12, 1, .25); },
  hennit(){ if(!sndOn || !audio()) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(), l = AC.createOscillator(), lg = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(1500, t + .15); o.frequency.exponentialRampToValueAtTime(420, t + .9); l.frequency.value = 22; lg.gain.value = 120; l.connect(lg); lg.connect(o.frequency); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .95); o.connect(g); g.connect(AC.destination); o.start(t); l.start(t); o.stop(t + 1); l.stop(t + 1); }
};
const sfx = n => { try{ SFX[n] && SFX[n](); }catch(e){} };
function setSnd(on){ sndOn = on; store.set('ecuries-son', on); document.querySelectorAll('[data-snd]').forEach(b => b.textContent = on ? '🔊' : '🔇'); }

/* ---------- petites choses communes ---------- */
let toastT = null; function toast(m, ms = 2600){ const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function coins(n, quiet){ if(n){ S.coins = Math.max(0, S.coins + n); save(); if(n > 0 && !quiet) sfx('coin'); } document.querySelectorAll('[data-coins]').forEach(e => { e.textContent = '🪙 ' + S.coins; if(n){ e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump'); } }); }
function party(n = 40){ const P = $('party'), E = ['🏵️', '✨', '🥕', '⭐', '🍎', '🐴']; for(let i = 0; i < n; i++){ const s = document.createElement('i'); s.textContent = E[i % E.length]; s.style.left = Math.random() * 100 + 'vw'; s.style.fontSize = 18 + Math.random() * 24 + 'px'; s.style.animationDuration = 2.2 + Math.random() * 2.2 + 's'; s.style.animationDelay = Math.random() * .8 + 's'; P.appendChild(s); setTimeout(() => s.remove(), 5600); } }
function modal(html){ $('mBox').innerHTML = html; $('modal').classList.add('on'); }
const closeModal = () => $('modal').classList.remove('on');
const starsOf = n => n >= 9 ? 3 : n >= 7 ? 2 : n >= 5 ? 1 : 0, starTxt = k => '★'.repeat(k) + '☆'.repeat(3 - k);
const statBars = s => `<div class="st">${STATS.map((n, i) => `<span>${n}</span><i style="--w:${s[i] * 20}%"></i>`).join('')}</div>`;

/* =====================================================================
   LE CLUB-HOUSE : trois cours, chacun avec « J'apprends » et un quiz
   ===================================================================== */
const COURS = [
  { id:'harnais', ic:'🎗️', n:'Le filet et la selle', d:'Le nom de chaque partie, et à quoi elle sert', tabs:[['filet', 'Le filet'], ['selle', 'La selle'], ['quiz', '🎯 Le quiz']] },
  { id:'robes', ic:'🎨', n:'Les robes et les races', d:'Bai, alezan, isabelle… Frison, Barbe, Shetland…', tabs:[['robes', 'Les robes'], ['races', 'Les races'], ['quiz', '🎯 Le quiz']] },
  { id:'pansage', ic:'🧽', n:'Le pansage', d:'Chaque brosse, à quoi elle sert, et dans quel ordre', tabs:[['outils', 'Les brosses'], ['quiz', '🎯 Le quiz']] }
];
let cours = null, tab = null, Q = null;
function renderEcole(){ $('ecoleTiles').innerHTML = COURS.map((c, i) => `<button class="tile c${i + 1}" data-cours="${c.id}"><span aria-hidden="true">${c.ic}</span><div><b>${c.n}</b><small>${c.d}</small><small class="stars">${starTxt(starsOf(S.ecole[c.id] || 0))}${S.ecole[c.id] != null ? ' · meilleur quiz : ' + S.ecole[c.id] + ' / 10' : ''}</small></div></button>`).join('') +
  `<div class="tile" style="background:#fff8;box-shadow:none"><span aria-hidden="true">🪙</span><div><b>Comment gagner des pièces ?</b><small>5 pièces par bonne réponse du premier coup, 25 de plus pour un sans-faute. Et aussi en pansant tes chevaux et en concours.</small></div></div>`; }
$('ecoleTiles').onclick = e => { const b = e.target.closest('[data-cours]'); if(!b) return; sfx('tap'); openCours(b.dataset.cours); };
function openCours(id, t){ cours = COURS.find(c => c.id === id); go('lecon'); $('lTitle').textContent = cours.n; showTab(t || cours.tabs[0][0]); }
function showTab(t){ tab = t; $('lTabs').innerHTML = cours.tabs.map(([k, n]) => `<button class="chip ${k === t ? 'on' : ''}" data-tab="${k}">${n}</button>`).join(''); const B = $('lBody'); B.parentElement.scrollTop = 0;
  if(t === 'filet' || t === 'selle') diagram(B, t, t === 'filet' ? FILET : SELLE);
  else if(t === 'robes') B.innerHTML = `<div class="cards">${ROBES.map(r => `<div class="card"><img src="${IMG}c-${r.id}.webp" alt="" loading="lazy"><b>${r.n}</b><small>${r.d}</small></div>`).join('')}</div>`;
  else if(t === 'races') B.innerHTML = `<div class="cards">${RACES.map(r => `<div class="card"><img src="${IMG}r-${r.id}.webp" alt="" loading="lazy"><b>${r.n}</b><em>${r.o}</em><small>${r.d}</small></div>`).join('')}</div>`;
  else if(t === 'outils') B.innerHTML = `<p style="margin:0 0 10px;color:var(--mist)">Dans l'ordre du pansage. Ensuite, va t'entraîner pour de vrai dans nos écuries !</p><div class="cards">${OUTILS.map((o, i) => `<div class="card sq"><img src="${IMG}o-${o.id}.webp" alt="" loading="lazy"><b>${i < 7 ? (i + 1) + '. ' : ''}${o.n}</b><em>${o.ou}</em><small>${o.d}</small></div>`).join('')}</div>`;
  else startQuiz(); }
$('lTabs').onclick = e => { const b = e.target.closest('[data-tab]'); if(!b) return; sfx('tap'); showTab(b.dataset.tab); };
function pins(parts, cls = () => ''){ return parts.map((p, i) => `<button class="pin ${cls(p, i)}" style="left:${p.x}%;top:${p.y}%" data-pin="${p.id}" aria-label="Partie ${i + 1}">${i + 1}</button>`).join(''); }
function diagram(B, which, parts){
  B.innerHTML = `<div class="diagram"><img src="${IMG}${which}.webp" alt="">${pins(parts)}</div><div class="info" id="dInfo"><b>Touche un numéro</b><span>pour découvrir le nom de la partie et à quoi elle sert.</span></div>`;
  B.querySelector('.diagram').onclick = e => { const b = e.target.closest('[data-pin]'); if(!b) return; sfx('tap'); const p = parts.find(x => x.id === b.dataset.pin); B.querySelectorAll('.pin').forEach(x => x.classList.toggle('on', x === b)); $('dInfo').innerHTML = `<b>${p.n}</b><span>${p.r}</span>`; };
}
// ----- le quiz : 10 questions -----
function buildQuiz(id){
  const qcm = x => ({ type:'qcm', q:x.q, opts:shuffle(x.o).map(t => ({ t })), a:x.a, why:x.w });
  if(id === 'harnais'){ const f = pick(FILET, 4).map(p => ({ type:'pin', img:'filet', parts:FILET, target:p })), s = pick(SELLE, 3).map(p => ({ type:'pin', img:'selle', parts:SELLE, target:p }));
    return shuffle([...f, ...s]).concat(pick(HARNAIS_QCM, 3).map(qcm)); }
  if(id === 'robes'){ const one = (list, pre, x, quoi) => ({ type:'qcm', q:quoi, img:pre + x.id, opts:shuffle([x, ...pick(list.filter(y => y.id !== x.id), 3)]).map(y => ({ t:y.n })), a:x.n, why:x.n + ' : ' + x.d });
    return shuffle([...pick(ROBES, 5).map(x => one(ROBES, 'c-', x, 'Quelle est cette robe ?')), ...pick(RACES, 5).map(x => one(RACES, 'r-', x, 'Quelle est cette race ?'))]); }
  const CLUE = { curepied:'Avec quel outil enlève-t-on la terre et les cailloux sous les sabots ?', etrille:'Quel outil en caoutchouc décolle la boue séchée quand on frotte en faisant des ronds ?', bouchon:'Quelle brosse aux poils durs chasse la poussière du corps et des jambes ?', brossedouce:'Quelle est la seule brosse qu\'on a le droit de passer sur la tête ?', eponge:'Avec quoi nettoie-t-on le coin des yeux et les naseaux ?', peigne:'Avec quoi démêle-t-on la crinière et la queue, mèche par mèche ?', graisse:'Que met-on au pinceau sur les sabots propres, tout à la fin ?', couteau:'Avec quoi racle-t-on l\'eau sur le corps après la douche ?' };
  const tool = x => ({ type:'qcm', q:CLUE[x.id], pics:true, opts:shuffle([x, ...pick(OUTILS.filter(y => y.id !== x.id), 3)]).map(y => ({ t:y.n, img:'o-' + y.id })), a:x.n, why:x.n + ' : ' + x.d });
  return [...pick(OUTILS, 4).map(tool), { type:'ordre' }, ...pick(PANSAGE_QCM, 5).map(qcm)];
}
function startQuiz(){ Q = { list:buildQuiz(cours.id), i:0, good:0, gain:0 }; showQ(); }
function showQ(){
  const B = $('lBody'), q = Q.list[Q.i]; B.parentElement.scrollTop = 0; let first = true, done = false;
  const head = `<div class="qhead"><span>Question ${Q.i + 1} / ${Q.list.length}</span><div class="bar"><i style="width:${Q.i / Q.list.length * 100}%"></i></div><span>✔ ${Q.good}</span></div>`;
  const finish = (ok, why) => { if(done) return; done = true; if(ok && first){ Q.good++; Q.gain += 5; coins(5); } $('qWhy').innerHTML = (ok ? (first ? '✔ <b>Oui !</b> ' : '✔ ') : '') + why; $('qNext').hidden = false; };
  const foot = `<div class="why" id="qWhy"></div><div class="row c"><button class="pill go" id="qNext" hidden>${Q.i + 1 < Q.list.length ? 'Suivant →' : 'Voir mon résultat →'}</button></div>`;
  if(q.type === 'qcm'){
    B.innerHTML = `<div class="quiz">${head}<div class="qq">${q.q}</div>${q.img ? `<img class="qimg" src="${IMG}${q.img}.webp" alt="">` : ''}<div class="opts ${q.pics ? 'pics' : ''}">${q.opts.map(o => `<button class="opt" data-v="${esc(o.t)}">${o.img ? `<img src="${IMG}${o.img}.webp" alt="">` : ''}${o.t}</button>`).join('')}</div>${foot}</div>`;
    B.querySelector('.opts').onclick = e => { const b = e.target.closest('.opt'); if(!b || done) return; if(b.dataset.v === q.a){ b.classList.add('ok'); sfx('ok'); finish(true, q.why); } else { b.classList.add('ko'); sfx('ko'); first = false; $('qWhy').textContent = 'Pas tout à fait… essaie encore !'; } };
  } else if(q.type === 'pin'){
    B.innerHTML = `<div class="quiz" style="max-width:820px">${head}<div class="qq">Touche : <span style="color:var(--red)">${q.target.n.toLowerCase()}</span></div><div class="diagram"><img src="${IMG}${q.img}.webp" alt="">${q.parts.map(p => `<button class="pin" style="left:${p.x}%;top:${p.y}%" data-pin="${p.id}" aria-label="?">?</button>`).join('')}</div>${foot}</div>`;
    B.querySelector('.diagram').onclick = e => { const b = e.target.closest('[data-pin]'); if(!b || done) return; if(b.dataset.pin === q.target.id){ b.classList.add('ok'); b.textContent = '✔'; sfx('ok'); finish(true, q.target.n + ' — ' + q.target.r); } else { b.classList.add('ko'); sfx('ko'); first = false; const w = q.parts.find(p => p.id === b.dataset.pin); b.textContent = '✖'; $('qWhy').textContent = 'Ça, c\'est ' + w.n.toLowerCase() + '. Essaie encore !'; } };
  } else {   // remettre le pansage dans l'ordre
    let seq = []; const draw = () => { B.querySelector('.seq').innerHTML = ORDRE.map((id, k) => seq[k] ? `<img src="${IMG}o-${seq[k]}.webp" alt="">` : `<span>${k + 1}</span>`).join(''); };
    B.innerHTML = `<div class="quiz">${head}<div class="qq">Le pansage dans l'ordre : touche les outils du premier au dernier.</div><div class="seq"></div><div class="opts pics">${shuffle(ORDRE).map(id => { const o = OUTILS.find(x => x.id === id); return `<button class="opt" data-v="${id}"><img src="${IMG}o-${id}.webp" alt="">${o.n}</button>`; }).join('')}</div>${foot}</div>`; draw();
    B.querySelector('.opts').onclick = e => { const b = e.target.closest('.opt'); if(!b || done || b.disabled) return; const want = ORDRE[seq.length];
      if(b.dataset.v === want){ seq.push(want); b.disabled = true; b.classList.add('ok'); sfx('tap'); draw(); if(seq.length === ORDRE.length){ sfx('ok'); finish(true, 'Cure-pied, étrille, bouchon, brosse douce, éponge, peigne, et la graisse à la fin : parfait !'); } }
      else { b.classList.add('ko'); setTimeout(() => b.classList.remove('ko'), 600); sfx('ko'); first = false; $('qWhy').textContent = seq.length === 0 ? 'On commence toujours par les pieds…' : 'Pas encore celui-là. Pense : on décolle la saleté, on la chasse, on fait briller, puis les détails.'; } };
  }
  $('qNext').onclick = () => { sfx('tap'); Q.i++; if(Q.i < Q.list.length) showQ(); else endQuiz(); };
}
function endQuiz(){
  const n = Q.good, perfect = n === Q.list.length, st = starsOf(n); if(perfect){ Q.gain += 25; coins(25); } S.ecole[cours.id] = Math.max(S.ecole[cours.id] || 0, n); S.n.quiz++; save(); if(st >= 2) party(); sfx(st ? 'bravo' : 'fin');
  $('lBody').innerHTML = `<div class="quiz" style="text-align:center;align-items:center"><div class="medal">${perfect ? '🏆' : st >= 2 ? '🥇' : st ? '🥈' : '📚'}</div><h2 style="font-size:34px;color:var(--navy2)">${n} / ${Q.list.length} du premier coup</h2><div class="stars" style="font-size:40px">${starTxt(st)}</div>
    <p style="margin:0;font-size:19px">Tu gagnes <b>${Q.gain} pièces</b> 🪙${perfect ? ' (dont 25 pour le sans-faute !)' : ''}</p><div class="row c"><button class="pill go" id="qAgain">🔁 Encore un quiz</button><button class="pill" id="qLearn">📖 Revoir la leçon</button><button class="pill sun" data-go="hub">🏠 La cour</button></div></div>`;
  $('qAgain').onclick = () => { sfx('tap'); startQuiz(); }; $('qLearn').onclick = () => { sfx('tap'); showTab(cours.tabs[0][0]); };
}

/* =====================================================================
   LA SELLERIE ET LE MARCHAND
   ===================================================================== */
let rayon = 'tapis';
const owns = (r, c) => !!S.owned[r + ':' + c];
function renderShop(){
  $('shopTabs').innerHTML = RAYONS.map(r => `<button class="chip ${r.id === rayon ? 'on' : ''}" data-r="${r.id}">${r.ic} ${r.n}</button>`).join('');
  const r = RAYONS.find(x => x.id === rayon), cur = S.horses[S.cur], d = DEF[S.cur]; $('shopInfo').innerHTML = `${r.d} <b>${r.prix} 🪙</b> la couleur. Tu habilles : <b>${d.n}</b>.`;
  $('shopGrid').innerHTML = r.cols.map(c => { const col = COULEURS.find(x => x[0] === c), has = owns(r.id, c), on = cur.eq[r.id] === c;
    return `<div class="item"><div class="sw" style="background:${col[2]}">${r.ic}</div><b>${r.n} ${col[1].toLowerCase()}</b>${has ? `<button class="pill ${on ? 'go' : ''}" data-eq="${c}">${on ? '✔ Sur ' + d.n : 'Mettre à ' + d.n}</button>` : `<button class="pill sun" data-buy="${c}" ${S.coins < r.prix ? 'disabled' : ''}>${r.prix} 🪙</button>`}</div>`; }).join('');
}
$('shopTabs').onclick = e => { const b = e.target.closest('[data-r]'); if(!b) return; sfx('tap'); rayon = b.dataset.r; renderShop(); };
$('shopGrid').onclick = e => { const b = e.target.closest('[data-buy],[data-eq]'); if(!b) return; const r = RAYONS.find(x => x.id === rayon), cur = S.horses[S.cur];
  if(b.dataset.buy){ if(S.coins < r.prix){ sfx('ko'); return; } S.owned[r.id + ':' + b.dataset.buy] = 1; cur.eq[r.id] = b.dataset.buy; coins(-r.prix); sfx('coin'); toast(`${r.n} acheté et mis à ${DEF[S.cur].n} !`); }
  else { cur.eq[r.id] = cur.eq[r.id] === b.dataset.eq && r.id !== 'filet' && r.id !== 'selle' ? null : b.dataset.eq; sfx('tap'); save(); }
  renderShop(); };
function renderMarket(){
  $('marketGrid').innerHTML = CHEVAUX.map(h => { const has = !!S.horses[h.id];
    return `<div class="horse"><img src="${IMG}${RACE_IMG[h.race]}.webp" alt="" loading="lazy"><div><h3>${h.n}</h3><small><b>${h.race}</b> · ${h.d}</small>${statBars(h.s)}${has ? `<button class="pill go" data-see="${h.id}">✔ Dans ton écurie</button>` : `<button class="pill sun" data-buyh="${h.id}" ${S.coins < h.prix ? 'disabled' : ''}>Acheter · ${h.prix} 🪙</button>`}</div></div>`; }).join('');
}
$('marketGrid').onclick = e => { const b = e.target.closest('[data-buyh],[data-see]'); if(!b) return;
  if(b.dataset.see){ sfx('tap'); S.cur = b.dataset.see; save(); go('stable'); return; }
  const h = DEF[b.dataset.buyh]; if(S.coins < h.prix){ sfx('ko'); return; }
  modal(`<h2>Acheter ${h.n} ?</h2><img src="${IMG}${RACE_IMG[h.race]}.webp" alt="" style="width:100%;border-radius:16px"><p style="margin:0;text-align:center">${h.race} · ${h.prix} 🪙</p><div class="row c"><button class="pill go" id="mYes">Oui, bienvenue ${h.n} !</button><button class="pill" id="mNo">Pas maintenant</button></div>`);
  $('mNo').onclick = () => { sfx('tap'); closeModal(); };
  $('mYes').onclick = () => { closeModal(); const first = Object.keys(S.owned).find(k => k.startsWith('licol:')); S.horses[h.id] = newHorse({ licol:first ? first.split(':')[1] : 'marine', filet:(Object.keys(S.owned).find(k => k.startsWith('filet:')) || 'filet:havane').split(':')[1], selle:(Object.keys(S.owned).find(k => k.startsWith('selle:')) || 'selle:havane').split(':')[1] }); S.horses[h.id].dirt = .3; S.horses[h.id].faim = 70; S.cur = h.id; coins(-h.prix); sfx('hennit'); party(); toast(`${h.n} arrive dans ton écurie !`); renderMarket(); };
};

/* =====================================================================
   LA 3D : chargée seulement quand on entre à l'écurie ou en concours
   ===================================================================== */
let world = null, worldP = null;
function loadWorld(){
  if(worldP) return worldP;
  worldP = (async () => { const THREE = await import('../../lib/three-0.170.0.module.min.js'), M = await import('./monde.js'); try{ await document.fonts.load('800 50px "Baloo 2"'); }catch(e){}
    world = M.createWorld(THREE, $('gl'), { sfx, toast, hud:rideHud, finish:rideEnd, pick:i => openCare(ownedIds()[i]), spot:onSpot }); return world; })();
  worldP.catch(() => { worldP = null; }); return worldP;
}
const ownedIds = () => CHEVAUX.filter(h => S.horses[h.id]).map(h => h.id);
const formOf = id => { const h = S.horses[id]; return .82 + .1 * (1 - h.dirt) + .08 * Math.min(1, h.faim / 70) + .05 * (h.moral / 100); };

/* ---------- l'écurie ---------- */
let care = null, tool = null, feedOn = false;
const TOOLS = OUTILS.filter(o => o.id !== 'couteau');
async function openStable(sel){
  decay(); save(); $('sHint').style.display = ''; $('sHint').textContent = 'J\'ouvre les écuries…'; ['sSide', 'sNavs', 'sTray', 'sBars'].forEach(id => $(id).style.display = 'none');
  try{ await loadWorld(); }catch(e){ toast('La 3D ne démarre pas sur cet appareil.'); go('hub'); return; }
  if(cur !== 'stable') return; document.body.classList.add('g3');
  const ids = ownedIds(); world.openStable(ids.map(id => ({ def:DEF[id], eq:S.horses[id].eq, dirt:S.horses[id].dirt, id })), { at:Math.max(0, ids.indexOf(S.cur)) });
  care = null; stableUI(); if(sel) openCare(sel);
}
function stableUI(){
  const on = !!care; $('sName').textContent = on ? `${DEF[care].n} · ${DEF[care].race}` : 'Nos écuries'; ['sSide', 'sNavs', 'sTray', 'sBars'].forEach(id => $(id).style.display = on ? '' : 'none'); $('sNavs').style.display = on && ownedIds().length > 1 ? '' : 'none';
  $('sHint').style.display = on ? 'none' : ''; $('sHint').textContent = ownedIds().length > 1 ? 'Glisse pour te promener, touche un cheval pour t\'en occuper' : 'Touche ta ponette pour t\'en occuper'; if(on){ gauges(); tray(); }
}
function gauges(){ const h = S.horses[care]; $('sBars').innerHTML = [['🧼 Propreté', 100 - h.dirt * 100], ['🥕 Appétit rassasié', h.faim], ['💛 Moral', h.moral]].map(([n, v]) => `<div class="gauge">${n}<i><b style="width:${Math.round(Math.max(0, Math.min(100, v)))}%;${v < 35 ? 'background:var(--red)' : v < 65 ? 'background:var(--gold)' : ''}"></b></i></div>`).join(''); }
function tray(){
  const T = $('sTray');
  if(feedOn){ T.innerHTML = NOURRITURE.map(f => `<button class="tool" data-food="${f.id}" title="${esc(f.d)}"><span class="e">${f.ic}</span>${f.n}</button>`).join('') + `<button class="tool" data-brush="1"><span class="e">🧽</span>Les brosses</button>`; return; }
  const left = world.spotsLeft();
  T.innerHTML = TOOLS.map(o => `<button class="tool ${tool === o.id ? 'on' : ''}" data-tool="${o.id}"><img src="${IMG}o-${o.id}.webp" alt="">${o.n.replace(/^(Le |La |L')/, '')}${left[o.id] ? `<u>${left[o.id]}</u>` : ''}</button>`).join('');
}
function openCare(id){ if(!id) return; sfx('tap'); care = id; S.cur = id; save(); feedOn = false; world.select(ownedIds().indexOf(id)); world.harness(false); $('sEquip').textContent = '👗 Équiper'; tool = tool || 'curepied'; world.setTool(tool); stableUI(); if(Math.random() < .4) sfx('hennit');
  const h = S.horses[id]; if(h.dirt > .05) toast('Choisis une brosse en bas, puis frotte les taches. On commence par le cure-pied !', 3600); else toast(`${DEF[id].n} est tout propre. Tu peux le caresser avec la brosse douce 💛`); }
$('sTray').onclick = e => { const b = e.target.closest('[data-tool],[data-food],[data-brush]'); if(!b) return;
  if(b.dataset.brush){ sfx('tap'); feedOn = false; tray(); return; }
  if(b.dataset.tool){ sfx('tap'); tool = b.dataset.tool; world.setTool(tool); world.harness(false); $('sEquip').textContent = '👗 Équiper'; tray(); const o = OUTILS.find(x => x.id === tool); toast(`${o.n} : ${o.ou.toLowerCase()}.`); return; }
  const f = NOURRITURE.find(x => x.id === b.dataset.food), h = S.horses[care], now = Date.now();
  if(f.gour){ h.gour = (h.gour || []).filter(t => now - t < 36e5); if(h.gour.length >= 3){ sfx('ko'); toast('Pas trop de friandises : c\'est très sucré ! Reviens plus tard.'); return; } h.gour.push(now); }
  else if(h.faim >= 98 && f.id !== 'eau'){ sfx('ko'); toast(`${DEF[care].n} n'a plus faim.`); return; }
  h.faim = Math.min(100, h.faim + f.f); h.moral = Math.min(100, h.moral + f.m); h.t = now; save(); world.feed(); sfx('croque'); gauges(); toast(f.d, 3400); };
function onSpot(ev){
  if(ev.wrong){ const need = OUTILS.find(o => o.id === ev.need), txt = { boue:'De la boue séchée : il faut d\'abord la décoller avec l\'étrille.', poussiere:'De la poussière : c\'est le travail du bouchon.', terne:'Pour faire briller le poil (et pour la tête), prends la brosse douce.', yeux:'Les yeux et les naseaux, c\'est avec l\'éponge humide.', noeud:'Des nœuds dans les crins : prends le peigne.', pied:'Les pieds se curent avec le cure-pied.', corne:'Le sabot est propre : un coup de graisse à pieds !' }[ev.wrong]; sfx('ko'); toast(txt || ('Prends ' + need.n.toLowerCase())); return; }
  const h = S.horses[care]; if(!h) return;
  if(ev.pet){ h.moral = Math.min(100, h.moral + 2); gauges(); return; }
  if(ev.done){ sfx('ok'); const total = 16; h.dirt = Math.min(h.dirt, ev.left / total); tray(); gauges();
    if(ev.left === 0){ h.dirt = 0; h.moral = Math.min(100, h.moral + 15); h.t = Date.now(); S.n.pansages++; const gain = 30; coins(gain); party(24); sfx('bravo'); gauges(); toast(`${DEF[care].n} brille ! Pansage complet : + ${gain} pièces 🪙`, 3600); }
    save(); }
}
$('sFeed').onclick = () => { sfx('tap'); feedOn = !feedOn; tray(); };
$('sEquip').onclick = () => { sfx('tap'); world.harness(true); equipPanel(); };
function equipPanel(){
  const h = S.horses[care];
  modal(`<h2>Équiper ${DEF[care].n}</h2>${RAYONS.map(r => { const mine = r.cols.filter(c => owns(r.id, c)); return `<div class="eqrow"><span>${r.ic} ${r.n}</span><div class="row">${r.id !== 'filet' && r.id !== 'selle' ? `<button class="dot ${!h.eq[r.id] ? 'on' : ''}" data-r="${r.id}" data-c="" aria-label="Sans">✖</button>` : ''}${mine.map(c => `<button class="dot ${h.eq[r.id] === c ? 'on' : ''}" data-r="${r.id}" data-c="${c}" style="background:${HEX[c]}" aria-label="${c}"></button>`).join('')}${mine.length ? '' : '<small style="color:var(--mist)">pas encore acheté</small>'}</div></div>`; }).join('')}
    <div class="row c"><button class="pill go" id="eOk">✔ C'est bon</button><button class="pill sun" id="eShop">🛒 La sellerie</button></div>`);
  $('mBox').onclick = e => { const b = e.target.closest('[data-r]'); if(!b) return; sfx('tap'); h.eq[b.dataset.r] = b.dataset.c || null; save(); world.refreshEquip(); equipPanel(); };
  $('eOk').onclick = () => { sfx('tap'); closeModal(); $('mBox').onclick = null; $('sEquip').textContent = '👗 Équiper'; toast('Tu le vois harnaché. Touche une brosse pour le déseller.'); };
  $('eShop').onclick = () => { sfx('tap'); closeModal(); $('mBox').onclick = null; go('shop'); };
}
$('sInfo').onclick = () => { sfx('tap'); const d = DEF[care], r = RACES.find(x => d.race.startsWith(x.n.split(' ')[0]) || x.n === d.race); modal(`<h2>${d.n}</h2><img src="${IMG}${RACE_IMG[d.race]}.webp" alt="" style="width:100%;border-radius:16px"><p style="margin:0"><b>${d.race}</b> · ${d.d}</p>${r ? `<p style="margin:0;color:var(--mist);font-size:15px">${r.d}</p>` : ''}${statBars(d.s)}<div class="row c"><button class="pill go" id="mNo">Fermer</button></div>`); $('mNo').onclick = () => { sfx('tap'); closeModal(); }; };
const stepCare = d => { const ids = ownedIds(), i = (ids.indexOf(care) + d + ids.length) % ids.length; openCare(ids[i]); };
$('sPrev').onclick = () => stepCare(-1); $('sNext').onclick = () => stepCare(1);
$('sBack').onclick = () => { sfx('tap'); if(care){ care = null; world.harness(false); world.select(-1); stableUI(); } else go('hub'); };

/* ---------- les concours ---------- */
let rideEp = null;
const rankOf = id => S.best[id] == null ? 9 : S.best[id];
function renderConcours(){
  decay(); const ids = ownedIds(); $('cHorses').innerHTML = ids.map(id => `<button class="chip ${id === S.cur ? 'on' : ''}" data-h="${id}">${DEF[id].n}</button>`).join('');
  const h = S.horses[S.cur], d = DEF[S.cur], f = formOf(S.cur); $('cForm').innerHTML = `${d.race} · ${STATS.map((n, i) => n.toLowerCase() + ' ' + d.s[i]).join(', ')}. Forme du jour : <b>${f > 1 ? 'excellente' : f > .94 ? 'bonne' : f > .88 ? 'moyenne' : 'petite forme'}</b>${h.dirt > .5 ? ' (il aurait besoin d\'un bon pansage)' : ''}${h.faim < 40 ? ' (il a faim)' : ''}.`;
  $('cList').innerHTML = EPREUVES.map(ep => { const lock = ep.need && rankOf(ep.need) > 2, r = rankOf(ep.id);
    return `<button class="ep ${lock ? 'lock' : ''}" data-ep="${ep.id}"><span>${lock ? '🔒' : ep.ic}</span><div><b>${ep.n}</b><small>${lock ? 'Gagne d\'abord une médaille dans ' + EPREUVES.find(x => x.id === ep.need).n : ep.d + ' · jusqu\'à ' + ep.gain[0] + ' 🪙'}</small></div><span>${['🥇', '🥈', '🥉', '🎗️'][r] || ''}</span></button>`; }).join('');
}
$('cHorses').onclick = e => { const b = e.target.closest('[data-h]'); if(!b) return; sfx('tap'); S.cur = b.dataset.h; save(); renderConcours(); };
$('cList').onclick = e => { const b = e.target.closest('[data-ep]'); if(!b) return; const ep = EPREUVES.find(x => x.id === b.dataset.ep), h = S.horses[S.cur];
  if(ep.need && rankOf(ep.need) > 2){ sfx('ko'); toast('Cette épreuve se débloque avec une médaille dans l\'épreuve d\'avant.'); return; }
  if(!h.eq.filet || !h.eq.selle){ sfx('ko'); toast('Il faut un filet et une selle pour monter !'); return; }
  if(h.faim < 15){ sfx('ko'); toast(`${DEF[S.cur].n} a trop faim pour travailler : va le nourrir à l'écurie.`); return; }
  sfx('tap'); briefing(ep); };
function briefing(ep){
  const txt = ep.k === 'cso' ? ['Saute les obstacles <b>dans l\'ordre des numéros</b>, le fanion rouge à ta droite.', 'Appuie sur 🐎 juste avant la barre : ni trop tôt, ni trop tard.', 'Barre tombée ou refus : 4 points. 3 refus : éliminée. Le temps compte aussi.']
    : ep.k === 'cross' ? ['Suis la piste claire et saute les obstacles naturels dans l\'ordre.', 'Le gué se traverse sans sauter, entre les deux piquets.', 'Refus : 20 points. Le galop fatigue ton cheval : surveille la barre verte et repasse au trot pour qu\'il souffle.']
    : ['Suis la figure dessinée au sol, <b>à l\'allure demandée</b> : bleu = pas, jaune = trot, rose = galop.', 'Le juge note chaque figure sur 10 : plus tu es précise, mieux c\'est.', 'Pour l\'arrêt en X : passe à l\'arrêt dans le rond et ne bouge plus pendant 3 secondes.'];
  modal(`<h2>${ep.ic} ${ep.n}</h2><p style="margin:0;text-align:center;color:var(--mist)">avec ${DEF[S.cur].n}</p><ul style="margin:0;padding-left:20px;line-height:1.5;font-size:16.5px">${txt.map(t => `<li>${t}</li>`).join('')}</ul>
    <p style="margin:0;font-size:15px;color:var(--mist)">◀ ▶ pour tourner · ＋ － pour changer d'allure (pas, trot, galop)${ep.k !== 'dressage' ? ' · 🐎 pour sauter' : ''}. Au clavier : les flèches${ep.k !== 'dressage' ? ' et Espace' : ''}.</p><div class="row c"><button class="pill go" id="mYes">En selle !</button><button class="pill" id="mNo">Retour</button></div>`);
  $('mNo').onclick = () => { sfx('tap'); closeModal(); }; $('mYes').onclick = () => { sfx('tap'); closeModal(); startRide(ep); };
}
async function startRide(ep){
  rideEp = ep; go('ride'); $('count').textContent = '…';
  try{ await loadWorld(); }catch(e){ toast('La 3D ne démarre pas sur cet appareil.'); go('concours'); return; }
  if(cur !== 'ride') return; document.body.classList.add('g3'); const dres = ep.k === 'dressage';
  $('bJ').style.visibility = dres ? 'hidden' : ''; $('rmove').style.display = dres ? 'block' : 'none'; $('arrow').style.display = dres ? 'none' : ''; $('rPen').style.display = dres ? 'none' : ''; hudC = {};
  world.openRide({ def:DEF[S.cur], eq:S.horses[S.cur].eq }, ep, { form:formOf(S.cur) });
}
const GA = ['Arrêt', 'Pas', 'Trot', 'Galop']; let hudC = {}, msgT = null;
const mapX = $('map').getContext('2d');
function rideHud(o){
  if(o.msg){ const m = $('rmsg'); m.textContent = o.msg; m.className = 'on ' + (o.kind || ''); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), 1700); return; }
  if(o.halt != null && o.time == null){ if(o.halt > 0) $('rNext').innerHTML = `${Math.min(3, o.halt * 3).toFixed(1).replace('.', ',')} s<small>immobile</small>`; return; }
  const set = (k, v, f) => { if(hudC[k] !== v){ hudC[k] = v; f(v); } };
  set('t', o.time.toFixed(1), v => $('rTime').innerHTML = `${v.replace('.', ',')} s<small>${o.opt ? 'temps accordé : ' + Math.round(o.opt) + ' s' : 'temps'}</small>`);
  set('c', o.count, v => $('count').textContent = v > 0 ? v : '');
  set('g', o.gait + '|' + (o.want || 0), () => { const l = $('gaitL'); l.textContent = GA[o.gait]; l.classList.toggle('ko', !!o.want && o.gait !== o.want); });
  set('s', Math.round(o.stam / 4), () => { const i = $('stam').firstElementChild; i.style.width = o.stam + '%'; i.style.background = o.stam < 25 ? 'var(--red)' : o.stam < 55 ? 'var(--gold)' : 'var(--ok)'; });
  if(o.kind === 'dressage'){ set('m', o.mi, () => { $('rmove').innerHTML = o.move ? `<b>${o.mi + 1} / ${o.mn}</b> · ${o.move}${o.want ? ` <span style="color:${['', '#1f6fd8', '#b98a00', '#d7266d'][o.want]}">(${GA[o.want].toLowerCase()})</span>` : ''}` : 'Terminé !'; $('rNext').innerHTML = (o.notes.length ? String(o.notes[o.notes.length - 1]).replace('.', ',') : '–') + '<small>dernière note</small>'; }); }
  else { set('p', o.pen, v => $('rPen').innerHTML = `${v}<small>points</small>`); set('n', o.next, v => $('rNext').innerHTML = `${Math.min(v + 1, o.nb)} / ${o.nb}<small>obstacle</small>`);
    if(o.dir != null){ $('arrow').firstElementChild.style.transform = `rotate(${(-o.dir * 180 / Math.PI).toFixed(0)}deg)`; } }
  // la petite carte
  const g = mapX, m = o.map, b = m.b, Wm = 264, sc = Math.min(Wm / (b[1] - b[0]), Wm / (b[3] - b[2])) * .94, X = x => Wm / 2 - (x - (b[0] + b[1]) / 2) * sc, Y = z => Wm / 2 - (z - (b[2] + b[3]) / 2) * sc * -1;
  g.clearRect(0, 0, Wm, Wm); const Yf = z => Wm - Y(z);
  if(m.letters){ g.strokeStyle = '#9a8a60'; g.lineWidth = 3; g.strokeRect(X(10), Yf(20), (20) * sc, 40 * sc); g.fillStyle = '#7a6a40'; g.font = '800 20px Nunito'; g.textAlign = 'center'; g.textBaseline = 'middle'; Object.entries(m.letters).forEach(([k, [x, z]]) => { if(k !== 'X') g.fillText(k, X(x * 1.22), Yf(z * 1.1)); });
    if(m.path){ g.strokeStyle = '#ffb000'; g.lineWidth = 4; g.beginPath(); m.path.forEach(([x, z], i) => i ? g.lineTo(X(x), Yf(z)) : g.moveTo(X(x), Yf(z))); g.stroke(); } if(m.halt){ g.strokeStyle = '#ffb000'; g.lineWidth = 4; g.beginPath(); g.arc(X(m.halt[0]), Yf(m.halt[1]), 9, 0, 7); g.stroke(); } }
  m.obs.forEach(([x, z, a, st, w], i) => { g.save(); g.translate(X(x), Yf(z)); g.rotate(-a); g.fillStyle = st === 2 ? '#d7263d' : st === 1 ? '#9aa3ad' : '#1f3c88'; g.fillRect(-Math.max(7, w * sc / 2), -3, Math.max(14, w * sc), 6); g.restore(); if(st === 2){ g.strokeStyle = '#d7263d'; g.lineWidth = 3; g.beginPath(); g.arc(X(x), Yf(z), 13, 0, 7); g.stroke(); } });
  g.save(); g.translate(X(m.x), Yf(m.z)); g.rotate(-m.a + Math.PI); g.fillStyle = '#1c2340'; g.beginPath(); g.moveTo(0, 12); g.lineTo(8, -8); g.lineTo(0, -3); g.lineTo(-8, -8); g.closePath(); g.fill(); g.restore();
}
function rideEnd(res){
  const ep = rideEp, h = S.horses[S.cur], d = DEF[S.cur], rank = res.rank, gain = ep.gain[rank], better = rank < rankOf(ep.id);
  if(better) S.best[ep.id] = rank; S.n.concours++; h.dirt = Math.min(1, h.dirt + (ep.k === 'cross' ? .5 : .3)); h.faim = Math.max(0, h.faim - (ep.k === 'cross' ? 30 : 20)); h.moral = Math.min(100, h.moral + (rank < 3 ? 12 : 3)); h.t = Date.now(); coins(gain); if(rank < 3) party(); save();
  const f = n => String(Math.round(n * 10) / 10).replace('.', ',');
  const lines = res.kind === 'dressage' ? `<span>Note finale</span><b>${f(res.pct)} %</b><span>Les figures</span><b>${res.notes.map(f).join(' · ')}</b>` :
    `<span>Fautes aux obstacles</span><b>${res.jumpPen} pt${res.jumpPen > 1 ? 's' : ''}</b><span>Temps (accordé : ${Math.round(res.opt)} s)</span><b>${f(res.time)} s</b><span>Temps dépassé</span><b>${f(res.timePen)} pt${res.timePen > 1 ? 's' : ''}</b><span>Total</span><b>${f(res.pen)} pt${res.pen > 1 ? 's' : ''}</b>`;
  modal(`<div class="medal">${res.elim ? '🙈' : ['🥇', '🥈', '🥉', '🎗️'][rank]}</div><h2>${res.elim ? 'Éliminée… on réessaie !' : [res.kind === 'dressage' ? 'Première ! Quelle reprise !' : 'Première ! Sans faute !', 'Deuxième place !', 'Troisième place !', res.kind === 'dressage' ? 'Reprise terminée' : 'Parcours terminé'][rank]}</h2><p style="margin:0;text-align:center;color:var(--mist)">${ep.n} · ${d.n}</p><div class="res">${lines}<span>Gain</span><b>+ ${gain} 🪙</b></div>
    <p style="margin:0;font-size:15px;color:var(--mist);text-align:center">${d.n} a bien travaillé : il mérite un pansage et un bon repas.</p><div class="row c"><button class="pill go" id="rAgain">🔁 Rejouer</button><button class="pill sun" id="rStable">🏠 À l'écurie</button><button class="pill" id="rList">🏆 Les concours</button></div>`);
  $('rAgain').onclick = () => { sfx('tap'); closeModal(); if(h.faim < 15){ toast(`${d.n} a trop faim : direction l'écurie.`); go('stable'); } else startRide(ep); };
  $('rStable').onclick = () => { sfx('tap'); closeModal(); go('stable'); }; $('rList').onclick = () => { sfx('tap'); closeModal(); go('concours'); };
}
// les commandes
function hold(id, on, off){ const b = $(id); const dn = e => { e.preventDefault(); audio(); b.classList.add('dn'); try{ b.setPointerCapture(e.pointerId); }catch(_){} on(); }, up = () => { if(!b.classList.contains('dn')) return; b.classList.remove('dn'); off && off(); }; b.addEventListener('pointerdown', dn); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up); }
let sL = false, sR = false; const steer = () => world && world.steer((sL ? 1 : 0) - (sR ? 1 : 0));
hold('bL', () => { sL = true; steer(); }, () => { sL = false; steer(); }); hold('bR', () => { sR = true; steer(); }, () => { sR = false; steer(); });
hold('bUp', () => world && world.gaitBy(1)); hold('bDn', () => world && world.gaitBy(-1)); hold('bJ', () => world && world.jump());
addEventListener('keydown', e => { if(cur !== 'ride' || !world || $('modal').classList.contains('on')) return; const k = e.key; if(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault(); if(e.repeat) return;
  if(k === 'ArrowLeft'){ sL = true; steer(); } else if(k === 'ArrowRight'){ sR = true; steer(); } else if(k === 'ArrowUp') world.gaitBy(1); else if(k === 'ArrowDown') world.gaitBy(-1); else if(k === ' ') world.jump(); });
addEventListener('keyup', e => { if(e.key === 'ArrowLeft'){ sL = false; steer(); } else if(e.key === 'ArrowRight'){ sR = false; steer(); } });
$('rQuit').onclick = () => { sfx('tap'); go('concours'); };

/* =====================================================================
   NAVIGATION
   ===================================================================== */
let cur = 'home';
function go(name){
  if(world && name !== 'stable' && name !== 'ride'){ world.stop(); document.body.classList.remove('g3'); } if(name !== 'ride'){ sL = sR = false; }
  cur = name; document.querySelectorAll('.scr').forEach(s => s.classList.toggle('on', s.id === name)); coins(0);
  if(name === 'hub'){ decay(); const n = ownedIds().length, dirty = ownedIds().filter(id => S.horses[id].dirt > .5 || S.horses[id].faim < 40).length; $('hubStable').textContent = `${n} cheva${n > 1 ? 'ux' : 'l'} · ${dirty ? dirty + ' à soigner' : 'tous en pleine forme'}`; $('hubMarket').textContent = `${CHEVAUX.length - n} chevaux à adopter`; $('hubStars').textContent = COURS.map(c => starTxt(starsOf(S.ecole[c.id] || 0))).join('  '); }
  if(name === 'ecole') renderEcole(); if(name === 'shop') renderShop(); if(name === 'market') renderMarket(); if(name === 'concours') renderConcours(); if(name === 'stable') openStable();
}
document.addEventListener('click', e => { const s = e.target.closest('[data-snd]'); if(s){ setSnd(!sndOn); sfx('tap'); return; } const b = e.target.closest('[data-go]'); if(b){ audio(); sfx('tap'); go(b.dataset.go); } });
$('who1').onclick = async () => { sfx('tap'); await choose(); };
$('play').onclick = async () => { audio(); sfx('hennit'); if(!player && !(await choose())) return; go('hub'); };
$('modal').addEventListener('click', e => { if(e.target.id === 'modal' && $('mNo')) $('mNo').click(); });
addEventListener('pagehide', () => { if(S) save(); });
setSnd(sndOn);
(async () => { const p = window.Famille && Famille.player(); if(p) await setPlayer(p); else { player = null; $('who1').innerHTML = 'Qui joue ?'; } window.__ecu = { get S(){ return S; }, get world(){ return world; }, go, coins, save }; })();
