/* Kelma · la tour des mots : les écrans, le doigt, les sons, les voix et la sauvegarde. Les règles sont dans regles.js. */
import * as K from './regles.js';

const $ = id => document.getElementById(id);
const IMG = 'kelma/img/', AV = 'avatars/';
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const aujourdHui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- le joueur et sa sauvegarde ---------- */
let joueur = null, sv = null;
const cle = () => 'kelma:' + joueur;
const neuf = () => ({ niv:{}, best:{}, jours:{}, reg:{ lang:'fr', com:'ar' }, t:0 });
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); if(window.Famille && Famille.score) Famille.score('kelma', 'etoiles', total(), joueur).catch(() => {}); }
const total = () => sv ? Object.values(sv.niv).reduce((a, v) => a + (v || 0), 0) : 0;
async function setJoueur(n){
  joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {}); sv.reg = Object.assign(neuf().reg, sv.reg || {});
  if(n === 'Amine' && !store.get(cle(), null)) sv.reg.com = 'fr';   // Amine apprend à lire en français : le commentaire en français (voix de Lulu)
  if(window.Famille && Famille.track){ Famille.track('kelma', n, [cle()]);
    try{ const r = await Famille.load('kelma', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); sv.reg = Object.assign(neuf().reg, d.reg || {}); store.set(cle(), sv); } }catch(e){} }
  menu(); }
async function choisirJoueur(){ if(!window.Famille){ await setJoueur('Invité'); return; }
  const n = await Famille.choosePlayer({ title:'Qui joue à Kelma ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
    avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); }
const tete = n => { const k = String(n || '').toLowerCase(); return ['essil', 'salma', 'amine', 'anis', 'imen'].includes(k) ? AV + 'reel/' + k + '.webp' : null; };

/* ---------- les lexiques (chargés à la demande) ---------- */
const LEX = {};
async function lexique(l){ if(LEX[l]) return LEX[l]; const t = await fetch('kelma/lex/' + l + '.txt').then(r => r.text()); return LEX[l] = K.lexique(l, t); }

/* ---------- les voix (ElevenLabs par explorateur.js) et les sons ---------- */
function parle(t, lang = 'fr'){ try{ if(!('speechSynthesis' in window) || !t) return; const u = new SpeechSynthesisUtterance(t); u.lang = lang === 'ar' ? 'ar' : lang === 'en' ? 'en-GB' : 'fr-FR'; speechSynthesis.speak(u); }catch(e){} }
const dit = (fr, ar) => sv && sv.reg.com === 'fr' ? parle(fr, 'fr') : parle(ar, 'ar');
let AC = null; function ac(){ try{ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume(); }catch(e){} return AC; }
function bip(f, d = .08, type = 'sine', v = .08){ const a = ac(); if(!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, a.currentTime); g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + d); }
const sons = { pose:n => bip(420 + n * 45, .06, 'triangle', .05), bon:() => { bip(660, .1); setTimeout(() => bip(880, .14), 90); }, non:() => bip(180, .18, 'sawtooth', .04), boum:() => { bip(90, .3, 'square', .06); }, ligne:() => bip(240, .12, 'square', .04) };

/* ---------- le menu ---------- */
const MODES_MENU = ['bordj', 'ligne', 'zarba', 'bechwaya', 'chrono', 'kenz'];
function fond(img){ document.body.style.backgroundImage = `url(${IMG}${img}.webp)`; }
function menu(){
  arrete(); ecran('e-menu'); fond('menu');
  $('qui').innerHTML = joueur ? (tete(joueur) ? `<img src="${tete(joueur)}" alt="">` : '👤') + ' ' + esc(joueur) + ' · ⭐ ' + total() : '👤 Qui joue ?';
  $('langues').innerHTML = Object.entries(K.LANGUES).map(([k, L]) => `<button data-lang="${k}" class="${sv && sv.reg.lang === k ? 'on' : ''}">${L.drapeau} ${L.nom}</button>`).join('');
  const lg = sv ? sv.reg.lang : 'fr', jour = sv && sv.jours[aujourdHui() + ':' + lg];
  $('modes').innerHTML = `<button class="mode grand" data-mode="jour"><b>📅 ${K.MODES.jour.nom}</b><span class="ar">${K.MODES.jour.ar}</span><small>${K.MODES.jour.desc}</small><span class="rec">${jour != null ? 'Ton score aujourd\'hui : ' + jour : 'Pas encore joué aujourd\'hui'}</span></button>` +
    MODES_MENU.map(m => { const M = K.MODES[m], b = sv && sv.best[m + ':' + lg]; return `<button class="mode" data-mode="${m}"><b>${M.nom}</b><span class="ar">${M.ar}</span><small>${m === 'kenz' && joueur === 'Amine' ? 'Trouve les mots des images ! 🐱🦁' : M.desc}</small><span class="rec">${b ? '🏆 ' + b : ''}</span></button>`; }).join('');
  $('mondes').innerHTML = K.MONDES.map(w => `<div class="monde" style="background-image:linear-gradient(#0006,#0008),url(${IMG}${w.img}.webp)"><h3>${esc(w.nom)} · <span style="font-family:Amiri">${w.ar}</span></h3><div class="niveaux">` +
    K.NIVEAUX.filter(n => n.monde === w.id).map((n, k, A) => { const e = sv && sv.niv[n.id + ':' + lg] || 0, prev = k === 0 ? (w.id === 'm1' || (sv && sv.niv[K.NIVEAUX[K.NIVEAUX.indexOf(n) - 1].id + ':' + lg])) : sv && sv.niv[A[k - 1].id + ':' + lg];
      return `<button class="niv" data-niv="${n.id}" ${prev || e ? '' : 'disabled'}>${n.n}<i>${'★'.repeat(e)}${'☆'.repeat(3 - e)}</i></button>`; }).join('') + '</div></div>').join('');
}
function ecran(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }

/* ---------- la partie ---------- */
let P = null;   // { lex, etat, mode, cfg, niv, r, t0, fin, timers… }
const maintenant = () => performance.now();
async function lance(mode, niv){
  if(!joueur){ await choisirJoueur(); if(!joueur) return; }
  const lang = sv.reg.lang; let lex;
  try{ voile(`<div class="carte"><h2>⏳</h2><p>On prépare les lettres…</p></div>`); lex = await lexique(lang); }catch(e){ voile(`<div class="carte"><h2>😕</h2><p>Les mots ne sont pas arrivés. Vérifie Internet.</p><button class="gros" data-va="menu">Retour</button></div>`); return; }
  voile('');
  let cfg, seed;
  if(niv){ const N = K.NIVEAUX.find(x => x.id === niv); cfg = { ...K.reglage(N.mode, joueur), briques:N.briques }; seed = N.graine + '-' + lang; mode = N.mode; P = { niv:N }; fond(K.MONDES.find(w => w.id === N.monde).img); }
  else { P = {}; seed = mode === 'jour' ? 'jour-' + aujourdHui() + '-' + lang : 'libre-' + Date.now() + '-' + Math.random();
    cfg = mode === 'kenz' && (joueur === 'Amine' || joueur === 'Salma') ? K.cfgImages(lang, joueur, K.hasard(seed), joueur === 'Amine' ? 3 : 4) : K.reglage(mode, joueur);
    fond(['m1', 'm2', 'm3', 'm4', 'm5'][MODES_MENU.indexOf(mode) % 5] || 'm4'); }
  P = Object.assign(P, { lex, lang, mode, cfg, r:K.hasard(seed + '-suite'), etat:K.nouvellePartie(cfg, lex, seed), t0:maintenant(), chemin:[], pouv:{ indice:3, melange:2, marteau:2, gel:2 }, gelJusqua:0, fin:false, tuiles:new Map(), seq:0 });
  if(mode === 'kenz' && !cfg.images){ const tous = K.cherche(P.etat, lex, { max:400, ms:800 }); P.but = Math.min(cfg.chercher || 6, tous.length); }
  if(cfg.duree) P.finA = maintenant() + cfg.duree;
  if(cfg.intervalle){ P.prochaine = maintenant() + cfg.intervalle; P.intervalle = cfg.intervalle; }
  ecran('e-jeu'); construitBas(); taille(); dessine(true); hud();
  const ann = P.niv ? [K.texteBut(P.niv.but) + ' !', K.texteButAr(P.niv.but)] : cfg.images ? ['Trouve les mots des images !', 'اِبْحَثْ عَنْ كَلِمَاتِ الصُّوَر'] : [K.MODES[mode].desc, 'هَيَّا نَلْعَب'];
  dit(ann[0], ann[1]);
  if(cfg.images) setTimeout(() => cfg.images.forEach(([m], k) => setTimeout(() => parle(m.toLowerCase(), lang), 1600 + k * 1300)), 300);
  boucle();
}
function arrete(){ if(P){ P.fin = true; cancelAnimationFrame(P.raf); } P = null; }

/* la boucle : chrono, lignes qui montent */
function boucle(){ if(!P || P.fin) return; P.raf = requestAnimationFrame(boucle);
  if(P.pause) return; const t = maintenant();
  if(P.finA){ const reste = Math.max(0, P.finA - t); const e = $('but').querySelector('.temps'); if(e) e.textContent = Math.ceil(reste / 1000) + ' s'; if(!reste) return termine(true); }
  if(P.prochaine && t >= P.prochaine && t >= P.gelJusqua){ P.intervalle = Math.max(4500, P.intervalle * (P.cfg.accel || 1)); P.prochaine = t + P.intervalle; monteLigne(); }
  else if(P.prochaine){ const e = $('but').querySelector('.barre i'); if(e) e.style.width = Math.max(0, Math.min(100, 100 - (P.prochaine - t) / P.intervalle * 100)) + '%'; }
}
function monteLigne(){ const e = K.ajouteLigne(P.etat, P.lex, P.r); sons.ligne(); if(e.perdu){ P.etat = e; return termine(false); } P.etat = e; dessine(); }

/* ---------- le dessin de la grille ---------- */
let T = 60;
function taille(){ if(!P) return; const z = $('zone').getBoundingClientRect(), W = P.etat.W, H = P.etat.H;
  T = Math.max(34, Math.min(120, Math.floor(Math.min((z.width - 16) / W, (z.height - 16) / H))));
  document.documentElement.style.setProperty('--tuile', T + 'px');
  const g = $('grille'); g.style.width = (W * T + 8) + 'px'; g.style.height = (H * T + 8) + 'px'; dessine(true); }
addEventListener('resize', () => taille());
function dessine(sansAnim){
  if(!P) return; const { W, cases } = P.etat, g = $('grille'), vus = new Set(), ar = P.lang === 'ar';
  cases.forEach((c, i) => { if(!c) return; if(!c.id) c.id = ++P.seq; vus.add(c.id);
    let el = P.tuiles.get(c.id), neufEl = !el;
    if(!el){ el = document.createElement('div'); el.className = 't neuf'; el.innerHTML = '<div class="c"></div>'; g.appendChild(el); P.tuiles.set(c.id, el); }
    const x = i % W, y = (i / W) | 0, pos = `translate(${x * T + 4}px, ${y * T + 4}px)`;
    if(neufEl && !sansAnim){ el.style.transform = `translate(${x * T + 4}px, ${(P.etat.H + 1) * T}px)`; void el.offsetWidth; }
    el.className = 't' + (ar ? ' ar' : '') + (c.b ? ' ' + c.b : '') + (P.etat.trouves && P.trouvees && P.trouvees.has(i) ? ' trouve' : '');
    el.style.setProperty('--pos', pos); el.style.transform = pos; el.dataset.i = i;
    const ic = { dl:'jasmin', tl:'jasmin', dm:'chechia', bombe:'petard' }[c.b];
    el.firstChild.innerHTML = c.b === 'brique' ? '' : esc(c.l) + (ic ? `<img class="ic" src="${IMG}${ic}.webp" alt="">` : c.b === 'col' ? '<span class="ic" style="font-size:calc(var(--tuile)*.26)">⬇️</span>' : '') + `<span class="v">${P.lex.valeur[c.l] || ''}</span>`;
  });
  for(const [id, el] of P.tuiles) if(!vus.has(id)){ el.classList.add('part'); P.tuiles.delete(id); setTimeout(() => el.remove(), reduit ? 0 : 300); }
  marque();
}
function marque(){ if(!P) return; const s = new Set(P.chemin);
  for(const el of P.tuiles.values()){ const i = +el.dataset.i; el.classList.toggle('sel', s.has(i)); el.classList.toggle('indice', !!(P.indice && P.indice.includes(i))); }
  const pts = P.chemin.map(i => `${(i % P.etat.W) * T + T / 2 + 4},${((i / P.etat.W) | 0) * T + T / 2 + 4}`).join(' ');
  $('trait').firstElementChild.setAttribute('points', pts);
  // l'aperçu du mot
  const a = $('apercu'), mot = P.chemin.map(i => P.etat.cases[i] && P.etat.cases[i].l).join('');
  a.classList.toggle('ar', P.lang === 'ar'); a.classList.remove('bon', 'mauvais');
  if(!P.chemin.length){ a.innerHTML = ''; return; }
  const v = K.verifie(P.etat, P.chemin, P.lex, maintenant() - P.t0);
  a.innerHTML = esc(mot) + (v.ok ? `<small>+${v.score}</small>` : ''); if(v.ok) a.classList.add('bon');
}
function hud(){ if(!P) return; $('score').textContent = '⭐ ' + P.etat.score;
  const b = $('but'), N = P.niv;
  if(N){ const prog = N.but.type === 'mots' ? P.etat.mots.length / N.but.n : N.but.type === 'score' ? P.etat.score / N.but.n : P.etat.mots.some(m => [...m].length >= N.but.n) ? 1 : 0;
    b.innerHTML = `${K.texteBut(N.but)}${N.but.type === 'mots' ? ' · ' + P.etat.mots.length + '/' + N.but.n : ''}<div class="barre"><i style="width:${Math.min(100, prog * 100)}%"></i></div>`; }
  else if(P.cfg.images){ b.textContent = 'Le trésor : ' + P.etat.trouves.length + ' / ' + P.cfg.images.length; }
  else if(P.mode === 'kenz'){ b.textContent = 'Le trésor : ' + P.etat.mots.length + ' / ' + P.but + ' mots'; }
  else if(P.cfg.duree){ b.innerHTML = `${K.MODES[P.mode].nom} · <span class="temps"></span> · ${P.etat.mots.length} mots`; }
  else if(P.cfg.intervalle){ b.innerHTML = `Zarba ! · ${P.etat.mots.length} mots<div class="barre"><i></i></div>`; }
  else b.textContent = K.MODES[P.mode].nom + ' · ' + P.etat.mots.length + ' mots';
  const c = $('cibles'); c.innerHTML = P.cfg.images ? P.cfg.images.map(([m, e]) => `<span class="cible${P.lang === 'ar' ? ' ar' : ''}${P.etat.trouves.includes(m) ? ' ok' : ''}" data-dire="${esc(m)}"><span>${e}</span>${esc(m)}</span>`).join('') : '';
}
function construitBas(){ const b = $('bas'), t = !!(P.cfg.duree || P.cfg.intervalle);
  b.innerHTML = `<button class="pouv" data-p="indice">💡<small>Indice ${P.pouv.indice}</small></button>` + (P.mode === 'kenz' ? '' : `<button class="pouv" data-p="melange">🔀<small>Mélange ${P.pouv.melange}</small></button><button class="pouv" data-p="marteau">🔨<small>Casse ${P.pouv.marteau}</small></button>`) +
    (t ? `<button class="pouv" data-p="gel"><img src="${IMG}glace.webp" alt="" style="width:30px;height:30px;object-fit:contain"><small>Gel ${P.pouv.gel}</small></button>` : '') +
    (P.mode === 'bechwaya' || P.mode === 'kenz' && !P.cfg.images ? `<button class="pouv" data-p="fin">🏁<small>Fini</small></button>` : '') + `<button class="pouv" data-p="effacer">✖<small>Effacer</small></button>`; }

/* ---------- le doigt : on glisse de lettre en lettre, on relâche pour jouer ---------- */
let trace = false, marteau = false;
function caseSous(e){ const g = $('grille').getBoundingClientRect(), x = e.clientX - g.left - 4, y = e.clientY - g.top - 4, cx = Math.floor(x / T), cy = Math.floor(y / T);
  if(cx < 0 || cy < 0 || cx >= P.etat.W || cy >= P.etat.H) return -1;
  const dx = x - (cx + .5) * T, dy = y - (cy + .5) * T; return Math.hypot(dx, dy) < T * .42 ? cy * P.etat.W + cx : -2; }   // le centre de la case seulement : les diagonales passent bien
const ajoute = i => { if(!P || i < 0 || !P.etat.cases[i] || !P.etat.cases[i].l) return; const ch = P.chemin;
  if(ch.length >= 2 && ch[ch.length - 2] === i){ ch.pop(); marque(); return; }   // revenir en arrière
  if(ch.includes(i)) return; if(ch.length && !K.adjacent(P.etat.W, ch[ch.length - 1], i)) return;
  ch.push(i); sons.pose(ch.length); if(navigator.vibrate && sv.reg.vib) navigator.vibrate(8); marque(); };
$('grille').addEventListener('pointerdown', e => { if(!P || P.fin || P.pause) return; ac(); const i = caseSous(e);
  if(marteau){ if(i >= 0 && P.etat.cases[i]){ marteau = false; P.pouv.marteau--; const c = P.etat.cases.slice(); c[i] = null; P.etat = { ...P.etat, cases:K.gravite(c, P.etat.W, P.etat.H) }; sons.boum(); dessine(); construitBas(); apres(); } return; }
  trace = true; P.chemin = []; P.indice = null; try{ $('grille').setPointerCapture(e.pointerId); }catch(_){} ajoute(i); });
$('grille').addEventListener('pointermove', e => { if(!trace || !P) return; const i = caseSous(e); if(i >= 0) ajoute(i); });
const lache = () => { if(!trace || !P) return; trace = false; soumet(); };
$('grille').addEventListener('pointerup', lache); $('grille').addEventListener('pointercancel', () => { trace = false; if(P){ P.chemin = []; marque(); } });

function soumet(){
  if(!P || !P.chemin.length) return; const ch = P.chemin.slice(); P.chemin = [];
  if(ch.length < 2){ marque(); return; }
  const { etat, res } = K.joue(P.etat, ch, P.lex, maintenant() - P.t0);
  if(!res.ok){ sons.non(); const a = $('apercu'); a.classList.add('mauvais'); a.textContent = res.raison === 'inconnu' ? (res.mot + ' ?') : res.raison === 'trop court' ? '3 lettres au moins' : ''; setTimeout(() => P && !P.chemin.length && marque(), 900); marque(); a.classList.add('mauvais'); return; }
  if(P.cfg.images || P.mode === 'kenz'){ P.trouvees = P.trouvees || new Set(); if(P.etat.mots.includes(res.mot)){ sons.non(); bulle('Déjà trouvé'); marque(); return; } ch.forEach(i => P.trouvees.add(i)); }
  P.etat = etat; sons.bon(); parle(res.mot.toLowerCase(), P.lang); if(res.part.length > ch.length) sons.boum();
  const L = [...res.mot].length;
  bulle('+' + res.score + (res.combo > 1 ? ' · combo !' : ''));
  if(L >= 6) setTimeout(() => dit('Quel beau mot !', 'كَلِمَةٌ رَائِعَة!'), 700); else if(res.combo > 1) setTimeout(() => dit('Combo !', 'رَائِع، وَاصِل!'), 700);
  dessine(); hud(); apres();
}
// après un mot : lignes qui montent, remplissage, fin de partie
function apres(){
  if(!P) return; const c = P.cfg;
  if(P.niv && K.butAtteint(P.etat, P.niv.but)) return setTimeout(() => termine(true), 700);
  if(c.images && P.etat.fini) return setTimeout(() => termine(true), 900);
  if(P.mode === 'kenz' && !c.images && P.etat.mots.length >= P.but) return setTimeout(() => termine(true), 700);
  if(c.remplit){ P.etat = K.remplit(P.etat, P.lex, P.r); setTimeout(() => dessine(), 240); }
  if(c.parMot && P.etat.tours % c.parMot === 0) setTimeout(monteLigne, 320);
  setTimeout(() => { if(!P || P.fin) return;
    if(P.etat.fini && !c.remplit) return termine(true);
    if(!K.cherche(P.etat, P.lex, { max:1, ms:250 }).length){
      if(c.parMot || c.intervalle){ bulle('Plus de mots : une ligne arrive'); monteLigne(); }
      else if(c.remplit){ P.etat = K.melange(P.etat, P.r); dessine(); }
      else termine(P.etat.mots.length > 0); } }, 450);
}
function bulle(t){ const b = document.createElement('div'); b.className = 'bulle'; b.textContent = t; document.body.appendChild(b); setTimeout(() => b.remove(), 1200); }

/* ---------- les pouvoirs ---------- */
function pouvoir(p){
  if(!P || P.fin) return;
  if(p === 'effacer'){ P.chemin = []; P.indice = null; marque(); return; }
  if(p === 'fin') return termine(true);
  if(!(P.pouv[p] > 0)) return;
  if(p === 'indice'){ let m = K.cherche(P.etat, P.lex, { max:120, ms:600 }).filter(x => !P.etat.mots.includes(x.mot));
    if(P.cfg.images){ const reste = P.cfg.images.map(x => x[0]).filter(w => !P.etat.trouves.includes(w)); m = m.filter(x => reste.includes(x.mot)); }
    if(!m.length) return bulle('Pas d\'indice ici');
    const x = m.sort((a, b) => [...a.mot].length - [...b.mot].length || a.mot.localeCompare(b.mot))[0];   // le plus court : souvent le plus simple
    P.pouv.indice--; P.indice = joueur === 'Amine' || P.cfg.images ? x.chemin : x.chemin.slice(0, 2); marque(); parle(x.mot.toLowerCase(), P.lang); }
  if(p === 'melange'){ P.pouv.melange--; P.etat = K.melange(P.etat, P.r); dessine(); }
  if(p === 'marteau'){ marteau = true; bulle('Touche une lettre à casser'); return; }
  if(p === 'gel'){ P.pouv.gel--; const d = 5000; P.gelJusqua = maintenant() + d; if(P.finA) P.finA += d; if(P.prochaine) P.prochaine += d; bulle('🧊 Gel : 5 s'); }
  construitBas();
}

/* ---------- la fin ---------- */
function termine(gagne){
  if(!P || P.fin) return; P.fin = true; cancelAnimationFrame(P.raf);
  const s = P.etat.score, lg = P.lang; let et = 0, msg;
  if(P.niv){ et = gagne && K.butAtteint(P.etat, P.niv.but) ? K.etoilesNiveau(P.etat, P.niv.but) : 0; const k = P.niv.id + ':' + lg; if(et > (sv.niv[k] || 0)) sv.niv[k] = et; }
  else { const k = P.mode + ':' + lg; if(s > (sv.best[k] || 0)) sv.best[k] = s; et = s >= 300 ? 3 : s >= 150 ? 2 : s > 0 ? 1 : 0; if(P.cfg.images) et = P.etat.fini ? 3 : P.etat.trouves.length ? 1 : 0; }
  if(P.mode === 'jour'){ const k = aujourdHui() + ':' + lg; if(sv.jours[k] == null || s > sv.jours[k]) sv.jours[k] = s; if(window.Famille && Famille.score) Famille.score('kelma', 'jour-' + lg, s, joueur).catch(() => {}); }
  sauve();
  msg = P.etat.perdu ? ['La tour a débordé !', 'فَاضَ البُرْج!'] : et >= 3 ? ['Bravo, trois étoiles !', 'أَحْسَنْت، ثَلَاثُ نُجُوم!'] : et ? ['Bravo !', 'أَحْسَنْت!'] : ['Essaie encore !', 'حَاوِلْ مَرَّةً أُخْرَى!'];
  dit(msg[0], msg[1]);
  const longs = [...P.etat.mots].sort((a, b) => [...b].length - [...a].length);
  voile(`<div class="carte"><h2>${esc(msg[0])}</h2><div class="et">${'⭐'.repeat(et)}${'☆'.repeat(3 - et)}</div><p><b>${s}</b> points · ${P.etat.mots.length} mots</p>
    <div class="mots"${lg === 'ar' ? ' dir="rtl" style="font-family:Amiri"' : ''}>${longs.slice(0, 24).map(m => `<span>${esc(m)}</span>`).join('')}</div>
    <button class="gros" data-va="rejoue">🔁 Rejouer</button>${P.niv && et ? `<button class="gros b" data-va="suivant">➡ Niveau suivant</button>` : ''}<button class="gros b" data-va="menu">🏠 Menu</button></div>`);
}
function voile(h){ $('voile').innerHTML = h ? `<div class="voile">${h}</div>` : ''; }
function pause(){ if(!P || P.fin) return; P.pause = true; P.pauseT = maintenant();
  voile(`<div class="carte"><h2>⏸ Pause</h2><p>On souffle un peu…</p><button class="gros" data-va="reprend">▶ Reprendre</button><button class="gros b" data-va="regles">❓ Comment jouer</button><button class="gros b" data-va="menu">🏠 Menu</button></div>`); }
function reprend(){ if(!P) return; const d = maintenant() - P.pauseT; if(P.finA) P.finA += d; if(P.prochaine) P.prochaine += d; P.pause = false; voile(''); }
function regles(){ voile(`<div class="carte" style="text-align:left"><h2>Comment jouer</h2>
  <p>Glisse ton doigt de lettre en lettre (même en diagonale) pour écrire un mot de <b>3 lettres ou plus</b>, puis lève le doigt.</p>
  <p>Les lettres du mot disparaissent et les autres tombent. Plus le mot est long, plus il rapporte !</p>
  <p><img src="${IMG}jasmin.webp" style="height:26px;vertical-align:middle"> lettre ×2 (vert) ou ×3 (or) · <img src="${IMG}chechia.webp" style="height:26px;vertical-align:middle"> mot ×2 · <img src="${IMG}petard.webp" style="height:26px;vertical-align:middle"> pétards : tout autour saute · ⬇️ toute la colonne · <img src="${IMG}brique.webp" style="height:22px;vertical-align:middle"> la brique casse quand tu fais un mot à côté.</p>
  <p>💡 indice · 🔀 mélange · 🔨 casse une lettre · <img src="${IMG}glace.webp" style="height:22px;vertical-align:middle"> gèle le temps.</p>
  <p style="text-align:center"><button class="gros" data-va="${P && !P.fin ? 'reprend' : 'ferme'}">J'ai compris !</button></p></div>`); }
function reglages(){ const r = sv ? sv.reg : neuf().reg, voix = !window.FamilleVoix || FamilleVoix.on();
  const l = (k, t, o) => `<div class="l"><b>${t}</b>${o.map(([v, n]) => `<button data-reg="${k}" data-v="${v}" class="${String(r[k]) === v || (k === 'voix' && String(voix) === v) ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  voile(`<div class="carte"><h2>⚙️ Réglages</h2><div class="regl">${l('com', '🗣️ Le commentaire', [['ar', 'العربية'], ['fr', 'Français']])}${l('voix', '🔊 Les voix (touche V)', [['true', 'Oui'], ['false', 'Non']])}${l('vib', '📳 Vibrer', [['true', 'Oui'], ['false', 'Non']])}</div>
    <button class="gros" data-va="ferme">OK</button></div>`); }

/* ---------- les boutons et le clavier ---------- */
document.addEventListener('click', e => { const b = e.target.closest('button, [data-dire]'); if(!b) return; ac();
  if(b.dataset.dire && P) return parle(b.dataset.dire.toLowerCase(), P.lang);
  if(b.id === 'qui') return choisirJoueur();
  if(b.id === 'b-regl') return reglages();
  if(b.id === 'b-pause') return pause();
  if(b.dataset.lang){ if(!sv) return choisirJoueur(); sv.reg.lang = b.dataset.lang; sauve(); return menu(); }
  if(b.dataset.mode) return lance(b.dataset.mode);
  if(b.dataset.niv) return lance(null, b.dataset.niv);
  if(b.dataset.p) return pouvoir(b.dataset.p);
  if(b.dataset.reg){ const k = b.dataset.reg, v = b.dataset.v; if(k === 'voix'){ if(window.FamilleVoix) FamilleVoix.regler(v === 'true'); } else if(sv){ sv.reg[k] = v === 'true' ? true : v === 'false' ? false : v; sauve(); } return reglages(); }
  const va = b.dataset.va;
  if(va === 'menu'){ voile(''); return menu(); }
  if(va === 'ferme') return voile('');
  if(va === 'reprend') return reprend();
  if(va === 'regles') return regles();
  if(va === 'rejoue'){ voile(''); const n = P && P.niv, m = P && P.mode; return n ? lance(null, n.id) : lance(m); }
  if(va === 'suivant'){ voile(''); const i = K.NIVEAUX.indexOf(P.niv), n = K.NIVEAUX[i + 1]; return n ? lance(null, n.id) : menu(); }
});
document.addEventListener('keydown', e => { if(!P || P.fin) return;
  if(e.key === 'p' || e.key === 'P' || e.key === 'Escape'){ P.pause ? reprend() : pause(); return; }
  if(P.pause) return;
  if(e.key === 'Enter'){ soumet(); return; }
  if(e.key === 'Backspace'){ P.chemin.pop(); marque(); return; }
  // taper une lettre : elle s'ajoute si une case voisine la porte (au clavier, sans souris)
  const n = P.lang === 'fr' ? K.normFR(e.key) : P.lang === 'en' ? K.normEN(e.key) : K.normAR(e.key); if(!n || n.length !== 1) return;
  const last = P.chemin[P.chemin.length - 1], cand = P.etat.cases.map((c, i) => c && c.l === n && !P.chemin.includes(i) && (last == null || K.adjacent(P.etat.W, last, i)) ? i : -1).filter(i => i >= 0);
  if(cand.length) ajoute(cand[0]);
});
document.addEventListener('visibilitychange', () => { if(document.hidden && P && !P.fin && !P.pause) pause(); });

window.__kelma = { K, get P(){ return P; }, lance, termine, lexique, get sv(){ return sv; } };
(async () => { let n = null; try{ n = window.Famille && Famille.player ? Famille.player() : null; }catch(e){}
  if(n) await setJoueur(n); else { menu(); choisirJoueur(); } })();
