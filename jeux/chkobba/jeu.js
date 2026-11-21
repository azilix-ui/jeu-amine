/* Chkobba : la table, les cartes, les adversaires, les mondes, les sons, le jeu contre l'ordinateur et en ligne.
   Les règles sont dans regles.js ; en ligne, c'est le serveur (api/chkobba.php) qui arbitre. */
import { nouvellePartie, nouvelleManche, jouer, options, choisir, vue, val, coul } from './regles.js';
import * as VOIX from './voix.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const IMG = new URL('./img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href;
const API = new URL('../../api/chkobba.php', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const attends = ms => new Promise(r => setTimeout(r, ms));

export const PERSOS = { garde:'Si Hamadi', marchand:'Am Lamine', voleur:'Fethi', controleur:'Si Mokhtar' };
const MONDES = [{ id:'sidibou', n:'Sidi Bou Saïd' }, { id:'kairouan', n:'Kairouan' }, { id:'tunis', n:'Café de la médina' }, { id:'djerba', n:'Djerba' }];
const SYM = { d:'♦', c:'♥', p:'♠', t:'♣' }, NOMV = { 1:'A', 8:'D', 9:'V', 10:'R' };
const nomCarte = c => (NOMV[val(c)] || val(c)) + SYM[coul(c)];
// ce que disent les adversaires (un peu de tunisien)
const DIT = {
  chk:['Chkobba ! 😎', 'Chkobba, ya m\'3allem !', 'Hédhi chkobba ! 🎉', 'Tfarrej ! Chkobba !'],
  haya:['El Haya mte3i ! ⭐', 'Sab3a el hayya ! 😁'],
  boude:['Yaa khsara… 😤', 'Ouh, ça pique ! 😅', 'Mezyen, mezyen… 🙄', 'Ya wildi, t\'as de la chance !'],
  pose:['Hmm… 🤔', 'À toi, ya sghir !', 'Choufli hal… 🧐', 'Yalla, yalla !'],
  gagne:['Barcha behi ! 🏆', 'Ya3tik essaha ! 👏'],
  perd:['Mabrouk ! T\'as gagné 👏', 'Ya wildi, la prochaine fois… 😅'],
  coupe:['Je coupe ! ✂️', 'Tfadhel, coupe ! ✂️', 'Hop, coupé ! ✂️'],
};
const hasard = a => a[Math.floor(Math.random() * a.length)];

/* ---------- les sons ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function ton(f, d, type = 'sine', v = .1, f2 = 0, t0 = 0){ const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const BRUIT = {}, SON_URL = new URL('./son.php', import.meta.url).href, ZSON = new URL('../zarbia/son.php', import.meta.url).href;
async function chargeSon(url, k){ const a = ac(); if(!a) return; try{ const b = await fetch(url).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }); BRUIT[k] = await new Promise((ok, ko) => a.decodeAudioData(b, ok, ko)); }catch(e){} }
function chargeListe(base, noms){ fetch(base + '?liste=1').then(r => r.json()).then(l => { const par = {}; l.forEach(n => { const k = n.slice(0, -1); (par[k] = par[k] || []).push(n); });
  for(const k of Object.keys(par)) if(!noms || noms.includes(k)) chargeSon(base + '?n=' + par[k][Math.floor(Math.random() * par[k].length)], k); }).catch(() => {}); }
let sonsCharges = false; function sons(){ if(sonsCharges) return; sonsCharges = true; chargeListe(SON_URL); chargeListe(ZSON, ['victoire', 'tap']); }
const MAXD = { carte:.8, prise:1.8, distrib:2.5, chkobba:3, haya:2, tap:.4 };
function bruit(k, v = .8){ const a = ac(), b = BRUIT[k]; if(!a || !b) return false; const s = a.createBufferSource(), g = a.createGain(), t = a.currentTime, m = Math.min(b.duration, MAXD[k] || 9);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0, m - .3)); g.gain.linearRampToValueAtTime(0, t + m); s.buffer = b; s.connect(g); g.connect(a.destination); s.start(t); s.stop(t + m + .05); return true; }
const SON = {
  carte(){ if(!bruit('carte', .7)) ton(1200, .05, 'square', .05, 300); }, prise(){ if(!bruit('prise', .7)) ton(500, .15, 'triangle', .08, 900); },
  distrib(){ if(!bruit('distrib', .6)) for(let i = 0; i < 4; i++) ton(1500, .04, 'square', .03, 400, i * .08); },
  chkobba(){ if(!bruit('chkobba', .9)) [523, 659, 784, 1047].forEach((f, i) => ton(f, .2, 'triangle', .1, 0, i * .07)); },
  haya(){ if(!bruit('haya', .8)) [784, 988, 1175].forEach((f, i) => ton(f, .2, 'sine', .1, 0, i * .08)); },
  victoire(){ if(!bruit('victoire', .8)) [523, 659, 784, 1047].forEach((f, i) => ton(f, .3, 'triangle', .1, 0, i * .1)); },
  tap(){ if(!bruit('tap', .5)) ton(660, .06, 'sine', .07); },
};
// l'ambiance du monde (boucle douce)
let amb = null, ambMonde = null;
async function ambiance(m){ const a = ac(); if(!a) return; if(amb){ try{ amb.stop(); }catch(e){} amb = null; } ambMonde = m; if(!m) return;
  const k = 'amb' + m; if(!BRUIT[k]){ try{ const l = await fetch(SON_URL + '?liste=1').then(r => r.json()); const n = l.filter(x => x.startsWith(k)); if(!n.length) return; await chargeSon(SON_URL + '?n=' + n[Math.floor(Math.random() * n.length)], k); }catch(e){ return; } }
  if(ambMonde !== m || !BRUIT[k]) return; const s = a.createBufferSource(), g = a.createGain(); g.gain.value = .25; s.buffer = BRUIT[k]; s.loop = true; s.connect(g); g.connect(a.destination); s.start(); amb = s; }

/* ---------- la sauvegarde ---------- */
let joueur = null, sv = null;
const neuf = () => ({ jouees:0, gagnees:0, chkobbas:0, monde:'sidibou', n:2, niveau:'moyen', cible:11, t:0 });
const cle = () => 'chkobba:' + joueur;
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {});
  if(window.Famille && Famille.track){ Famille.track('chkobba', n, [cle()]); try{ const r = await Famille.load('chkobba', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu(); }
async function choisirJoueur(){ if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue à la chkobba ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n; }
// 16/11 : les portraits « en vrai » des héros du Jasmin (avatars/reel/), pour la famille et les invités
const tete = n => { const k = String(n || '').toLowerCase(); if(['essil', 'salma', 'amine', 'anis', 'imen'].includes(k)) return AV + 'reel/' + k + '.webp'; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h ? AV + 'reel/' + h.id + '.webp' : null; };
const visage = (p, humeur = 'malin') => p.perso ? IMG + p.perso + '-' + humeur + '.webp' : (p.tete || tete(p.nom) || '');

/* ---------- le menu ---------- */
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }
function fond(m){ document.body.style.backgroundImage = `url(${IMG}monde-${m || 'sidibou'}.webp)`; }
function menu(){
  document.body.classList.remove('jeu'); montre('menu'); $('modal').classList.remove('on'); P = null; ambiance(null);
  const s = sv || neuf(); fond(s.monde);
  $('who').innerHTML = joueur ? (tete(joueur) ? `<img src="${tete(joueur)}" alt="">` : '🙂') + esc(joueur) + (s.gagnees ? ` · 🏆 ${s.gagnees}` : '') : 'Qui joue ?';
  $('persos').innerHTML = Object.entries(PERSOS).map(([k, n]) => `<img src="${IMG}${k}-malin.webp" alt="${n}" title="${n}">`).join('');
  for(const [id, k] of [['cNb', 'n'], ['cNiv', 'niveau'], ['cCible', 'cible']]) $(id).querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v == s[k]));
  $('mondes').innerHTML = MONDES.map(m => `<button class="monde ${m.id === s.monde ? 'on' : ''}" data-m="${m.id}" style="background-image:url(${IMG}monde-${m.id}.webp)"><span>${m.n}</span></button>`).join('');
  records();
}
async function records(){ const rows = window.Famille ? await Famille.highscores('chkobba', 'victoires', 10).catch(() => null) : null;
  $('records').innerHTML = rows && rows.length ? rows.map(r => `<li>${esc(r.player)} — <b>${r.score}</b> partie${r.score > 1 ? 's' : ''} gagnée${r.score > 1 ? 's' : ''}</li>`).join('') : '<p class="none">Personne encore : à toi !</p>'; }
for(const [id, k] of [['cNb', 'n'], ['cNiv', 'niveau'], ['cCible', 'cible']]) $(id).onclick = e => { const b = e.target.closest('button'); if(!b) return; if(!sv) sv = neuf(); sv[k] = k === 'niveau' ? b.dataset.v : +b.dataset.v; sauve(); SON.tap(); menu(); };
$('mondes').onclick = e => { const b = e.target.closest('[data-m]'); if(!b) return; if(!sv) sv = neuf(); sv.monde = b.dataset.m; sauve(); SON.tap(); menu(); };
$('who').onclick = () => choisirJoueur();

/* ---------- la partie (commune au jeu seul et en ligne) ----------
   P = { mode, n, moi, sieges:[{nom, tete, perso, bot}], v (ce que je vois), s (moteur, jeu seul), humeur[], monde } */
let P = null;
const pos = (n, rel) => n === 2 ? ['moi', 'haut'][rel] : n === 3 ? ['moi', 'hd', 'hg'][rel] : ['moi', 'droite', 'haut', 'gauche'][rel];
function carteEl(c, cls = ''){
  const v = val(c), r = coul(c) === 'd' || coul(c) === 'c', fig = { 8:'dame', 9:'valet', 10:'roi' }[v], s = SYM[coul(c)];
  const centre = fig ? `<div class="fig" style="background-image:url(${IMG}${fig}.webp)"></div>` : `<div class="pips" style="${v > 3 ? 'grid-template-columns:1fr 1fr' : ''}">${s.repeat(v).split('').map(x => `<span>${x}</span>`).join('')}</div>`;
  return `<div class="c ${r ? 'rouge' : 'noir'} ${c === 'd7' ? 'haya' : ''} ${cls}" data-c="${c}"><div class="co">${NOMV[v] || v}<i>${s}</i></div>${centre}<div class="co b">${NOMV[v] || v}<i>${s}</i></div></div>`;
}
function rend(){
  if(!P) return; const v = P.v, n = P.n;
  // les places
  $('sieges').innerHTML = P.sieges.map((p, i) => { const rel = (i - P.moi + n) % n, ou = pos(n, rel), eq = v.equipes && rel === 2 ? ' · équipier' : '';
    const backs = rel ? `<div class="dos-m">${'<div class="c dos"></div>'.repeat(v.nMains[i] || 0)}</div>` : '';
    return `<div class="siege s-${ou} ${v.tour === i && v.phase === 'jeu' ? 'tour' : ''}" data-s="${i}"><div class="av" style="background-image:url('${visage(p, P.humeur[i])}')"></div><div class="info"><b>${esc(p.nom)}${eq}</b><small>🂠 ${v.nPris[i]} cartes prises${v.chk[i] ? ` · ${'⭐'.repeat(Math.min(5, v.chk[i]))}${v.chk[i] > 5 ? v.chk[i] : ''}` : ''}</small>${backs}</div></div>`; }).join('');
  $('centre').innerHTML = v.tapis.map(c => carteEl(c)).join('');
  $('paquet').innerHTML = v.nPaquet ? `<div class="c dos" style="--cw:46px;margin:0 auto 4px"></div>${v.nPaquet}` : '';
  const monTour = v.tour === P.moi && v.phase === 'jeu' && !P.occupe;
  $('main').classList.toggle('mon-tour', monTour);
  $('main').innerHTML = v.main.map(c => carteEl(c, P.sel === c ? 'sel' : '')).join('');
  document.documentElement.style.setProperty('--mh', $('main').offsetHeight + 'px');
  // les scores
  const E = v.equipes ? 2 : n, noms = e => v.equipes ? P.sieges.filter((_, i) => i % 2 === e).map(p => p.nom.replace(' 🤖', '')).join(' & ') : P.sieges[e].nom;
  $('scores').innerHTML = `<div style="opacity:.8;font-size:12px">Manche ${v.manche} · en ${v.cible} points</div>` + Array.from({ length:E }, (_, e) => `<div>${esc(noms(e))} : <b>${v.total[e]}</b></div>`).join('');
  // les prises possibles
  let opts = '';
  if(monTour && P.sel){ const o = options(P.sel, v.tapis);
    opts = o.length ? o.map((p, k) => `<button data-o="${k}">Prendre ${p.map(nomCarte).join(' + ')}</button>`).join('') : `<button class="pose" data-o="-1">Poser le ${nomCarte(P.sel)}</button>`;
    o.flat().forEach(c => { const el = $('centre').querySelector(`[data-c="${c}"]`); if(el) el.classList.add('cible'); }); }
  else if(monTour) opts = '<span style="color:#fff;font-weight:800;text-shadow:0 2px 6px #000;font-size:18px">À toi ! Touche une de tes cartes</span>';
  $('options').innerHTML = opts;
}
$('main').onclick = e => { const el = e.target.closest('[data-c]'); if(!el || !P || P.occupe || P.v.tour !== P.moi || P.v.phase !== 'jeu') return; ac(); const c = el.dataset.c;
  if(P.sel === c){ const o = options(c, P.v.tapis); if(o.length <= 1){ joueCoup(c, o[0] || []); return; } }
  P.sel = c; SON.tap(); rend(); };
$('options').onclick = e => { const b = e.target.closest('[data-o]'); if(!b || !P || !P.sel) return; const k = +b.dataset.o, o = options(P.sel, P.v.tapis); joueCoup(P.sel, k < 0 ? [] : o[k]); };
function joueCoup(c, prise){ const sel = c; P.sel = null; if(P.mode === 'solo') soloJoue(P.moi, sel, prise); else LIGNE.joue(sel, prise); }

/* ---------- les animations : une carte qui vole d'un endroit à l'autre ---------- */
function rectDe(sel){ const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return el ? el.getBoundingClientRect() : null; }
function rectSiege(i){ if(i === P.moi) return rectDe('#main') || rectDe('.s-moi'); return rectDe(`.siege[data-s="${i}"] .av`); }
async function vole(cartes, de, vers, cw = 64){
  if(!de || !vers) return; const box = document.createElement('div'); box.id = 'volant'; box.style.cssText = `left:${de.left + de.width / 2 - cw / 2}px;top:${de.top + de.height / 2 - cw * .72}px;--cw:${cw}px;display:flex;gap:4px`;
  box.innerHTML = cartes.map(c => carteEl(c)).join(''); document.body.appendChild(box); await attends(20);
  box.style.transform = `translate(${vers.left + vers.width / 2 - de.left - de.width / 2}px, ${vers.top + vers.height / 2 - de.top - de.height / 2}px) scale(.8)`;
  await attends(470); box.remove(); }
function bulle(i, txt, situ){ const p = P && P.sieges[i]; if(situ && p && p.perso) VOIX.dit(p.perso, situ);
  const r = rectSiege(i); if(!r) return; const b = document.createElement('div'); b.className = 'bulle'; b.textContent = txt;
  const y = i === P.moi ? r.top - 50 : r.bottom + 6; b.style.left = Math.max(8, Math.min(innerWidth - 260, r.left + r.width / 2 - 80)) + 'px'; b.style.top = Math.max(8, y) + 'px'; document.body.appendChild(b); setTimeout(() => b.remove(), 2700); }
function humeur(i, h, ms = 3200){ if(!P || !P.sieges[i] || !P.sieges[i].perso) return; P.humeur[i] = h; rend(); clearTimeout(P['hT' + i]); P['hT' + i] = setTimeout(() => { if(P){ P.humeur[i] = 'malin'; rend(); } }, ms); }
function banniere(t, ms = 1500){ const b = $('banniere'); b.textContent = t; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), ms); }

/* ---------- couper et distribuer ----------
   On part de ce qu'on voit, et on donne carte par carte jusqu'à « cible » (la table juste après la donne).
   premiere = début de manche : le joueur avant le donneur coupe le paquet, puis 4 cartes vont sur la table. */
function lance(html, de, vers, cw, ms){
  const el = document.createElement('div'); el.className = 'volant'; el.style.cssText = `left:${de.left + de.width / 2 - cw / 2}px;top:${de.top + de.height / 2 - cw * .72}px;--cw:${cw}px;transition:transform ${ms}ms cubic-bezier(.3,.8,.3,1)`;
  el.innerHTML = html; document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${vers.left + vers.width / 2 - de.left - de.width / 2}px, ${vers.top + vers.height / 2 - de.top - de.height / 2}px) rotate(${Math.random() * 16 - 8}deg) scale(.85)`; }));
  return new Promise(r => setTimeout(() => { el.remove(); r(); }, ms + 30));
}
async function coupe(i){
  const c = rectDe('#centre'); if(!c) return; const cw = 70, x = c.left + c.width / 2 - cw / 2, y = c.top + c.height / 2 - cw * .72;
  const tas = k => `<div class="tas" style="--cw:${cw}px">${'<div class="c dos"></div>'.repeat(k)}</div>`;
  const bas = document.createElement('div'), haut = document.createElement('div');
  for(const [el, z] of [[bas, 1], [haut, 2]]){ el.className = 'volant coupe'; el.style.cssText = `left:${x}px;top:${y}px;z-index:${5 + z};transition:transform .45s cubic-bezier(.3,.8,.3,1)`; el.innerHTML = tas(5); document.body.appendChild(el); }
  haut.style.marginTop = '-10px';
  SON.distrib();
  if(P.sieges[i].perso) bulle(i, hasard(DIT.coupe)); else bulle(i, i === P.moi ? '✂️ Tu coupes !' : '✂️ ' + P.sieges[i].nom.replace(' 🤖', '') + ' coupe !');
  VOIX.dit('commentateur', 'debut');
  await attends(350);
  haut.style.transform = 'translate(95px, -40px) rotate(8deg)'; bas.style.transform = 'translate(-30px, 0)'; await attends(550);
  haut.style.zIndex = 5; bas.style.zIndex = 6; haut.style.transform = 'translate(0, 6px)'; bas.style.transform = 'translate(0, -6px) rotate(-3deg)'; await attends(500);
  // le paquet rejoint sa place
  const pq = rectDe('#paquet'); if(pq){ const t = `translate(${pq.left + pq.width / 2 - x - cw / 2}px, ${pq.top + 20 - y - cw * .72}px) scale(.65)`; haut.style.transform = t; bas.style.transform = t; await attends(480); }
  haut.remove(); bas.remove();
}
async function distribue(cible, premiere){
  if(!P) return; const occ = P.occupe; P.occupe = true; P.sel = null;
  const n = P.n, d = cible.donneur, z = cible.nMains.map(() => 0);
  const v = P.v = { ...cible, main:[], nMains:z.slice(), tour:-1,
    tapis:premiere ? [] : P.v.tapis.slice(), nPris:premiere ? z.slice() : P.v.nPris.slice(), chk:premiere ? z.slice() : P.v.chk.slice(),
    nPaquet:cible.nPaquet + 3 * n + (premiere ? 4 : 0) };
  rend();
  if(premiere) await coupe((d - 1 + n) % n); else SON.distrib();
  const pq = () => rectDe('#paquet') || rectDe('#centre'), vols = [];
  // une carte à la fois à chacun, en commençant par celui qui suit le donneur, trois tours
  for(let t = 0; t < 3; t++) for(let k = 1; k <= n; k++){
    const j = (d + k) % n; if(!P || P.v !== v) return; v.nPaquet--; rend();
    const vers = j === P.moi ? (rectDe('#main') || rectSiege(j)) : rectSiege(j);
    ton(900 + Math.random() * 300, .04, 'triangle', .04, 400);
    vols.push(lance('<div class="c dos"></div>', pq(), vers, 52, 300).then(() => { if(P && P.v === v){ if(j === P.moi) v.main.push(cible.main[v.main.length]); else v.nMains[j]++; rend(); } }));
    await attends(n === 4 ? 120 : 150);
  }
  await Promise.all(vols);
  if(premiere) for(const c of cible.tapis){ if(!P || P.v !== v) return; v.nPaquet--; SON.carte(); await lance(carteEl(c), pq(), rectDe('#centre'), 64, 280); v.tapis.push(c); rend(); await attends(60); }
  if(!P || P.v !== v) return;
  P.v = cible; P.occupe = occ; rend();
}

/* jouer les événements les uns après les autres, en mettant à jour ce qu'on voit */
async function anime(evs){
  for(const e of evs){
    if(!P) return;
    const v = P.v;
    if(e.k === 'pose'){ SON.carte(); if(e.j !== P.moi && P.sieges[e.j].bot && Math.random() < .25) bulle(e.j, hasard(DIT.pose), 'pose');
      await vole([e.carte], rectSiege(e.j), rectDe('#centre')); v.tapis.push(e.carte); if(e.j === P.moi) v.main = v.main.filter(c => c !== e.carte); else v.nMains[e.j] = Math.max(0, v.nMains[e.j] - 1); rend(); await attends(150); }
    else if(e.k === 'prise'){ SON.carte(); await vole([e.carte], rectSiege(e.j), rectDe('#centre'));
      if(e.j === P.moi) v.main = v.main.filter(c => c !== e.carte); else v.nMains[e.j] = Math.max(0, v.nMains[e.j] - 1);
      rend(); e.prise.forEach(c => { const el = $('centre').querySelector(`[data-c="${c}"]`); if(el) el.classList.add('cible'); }); await attends(500);
      SON.prise(); v.tapis = v.tapis.filter(c => !e.prise.includes(c)); v.nPris[e.j] += 1 + e.prise.length; rend();
      await vole([e.carte, ...e.prise].slice(0, 5), rectDe('#centre'), rectSiege(e.j), 52);
      if(e.chk){ v.chk[e.j]++; SON.chkobba(); banniere('CHKOBBA !'); const nous = e.j === P.moi || (v.equipes && e.j % 2 === P.moi % 2);
        P.sieges.forEach((p, i) => { if(!p.perso) return; if(i === e.j){ humeur(i, 'joie'); bulle(i, hasard(DIT.chk), 'chk'); } else if(nous || (v.equipes && i % 2 !== e.j % 2)) { humeur(i, 'boude'); if(Math.random() < .6) setTimeout(() => bulle(i, hasard(DIT.boude), 'boude'), 900); } });
        VOIX.dit('commentateur', 'chk');
        if(e.j === P.moi && sv){ sv.chkobbas++; sauve(); } await attends(900); }
      if([e.carte, ...e.prise].includes('d7')){ SON.haya(); if(P.sieges[e.j].perso){ humeur(e.j, 'joie'); bulle(e.j, hasard(DIT.haya), 'haya'); } else banniere('La Haya ! ⭐', 1200); VOIX.dit('commentateur', 'haya'); await attends(500); }
      rend(); }
    else if(e.k === 'redonne'){ // on redonne 3 cartes à chacun
      const c = P.mode === 'solo' ? vue(P.s, P.moi) : { ...v, main:(LIGNE.salle && LIGNE.salle.jeu.main) || [], nMains:v.nMains.map(() => 3), nPaquet:Math.max(0, v.nPaquet - 3 * P.n) };
      await distribue(c, false); }
    else if(e.k === 'donne'){ // une nouvelle manche (en ligne) : on coupe et on distribue
      $('modal').classList.remove('on'); const j = (LIGNE.salle && LIGNE.salle.jeu) || v, z = v.nMains.map(() => 0);
      await distribue({ ...j, manche:e.manche, donneur:e.donneur, tapis:e.tapis || j.tapis, main:j.main, nMains:v.nMains.map(() => 3), nPris:z, chk:z, nPaquet:40 - 4 - 3 * P.n, phase:'jeu', tour:-1 }, true); }
    else if(e.k === 'ramasse'){ if(e.cartes && e.cartes.length){ await vole(e.cartes.slice(0, 5), rectDe('#centre'), rectSiege(e.j), 52); v.tapis = []; v.nPris[e.j] += e.cartes.length; rend(); } }
    else if(e.k === 'fin'){ v.total = e.total; v.points = e.points; v.phase = e.phase; v.gagnant = e.gagnant; rend(); await attends(400); finManche(e); }
  }
}
function finManche(e){
  const v = P.v, E = v.equipes ? 2 : P.n, noms = k => v.equipes ? P.sieges.filter((_, i) => i % 2 === k).map(p => p.nom.replace(' 🤖', '')).join(' & ') : P.sieges[k].nom;
  const L = [['karta', 'Karta (le plus de cartes)', p => `${p.karta ? '✅' : ''} ${p.cartes}`], ['din', 'Dinari (le plus de ♦)', p => `${p.din ? '✅' : ''} ${p.dinari}`], ['haya', 'La Haya (7♦)', p => p.haya ? '✅ ⭐' : '—'], ['bermila', 'Bermila (le plus de 7)', p => `${p.bermila ? '✅' : ''} ${p.sept}`], ['chk', 'Chkobbas', p => p.chk ? '⭐'.repeat(Math.min(6, p.chk)) : '—']];
  const fini = e.phase === 'fini', monE = v.equipes ? P.moi % 2 : P.moi, gagne = fini && e.gagnant === monE;
  const tab = `<table class="points"><tr><th></th>${Array.from({ length:E }, (_, k) => `<th>${esc(noms(k))}</th>`).join('')}</tr>${L.map(([k, t, f]) => `<tr><td>${t}</td>${e.points.map(p => `<td>${f(p)}</td>`).join('')}</tr>`).join('')}<tr><td>Points de la manche</td>${e.points.map(p => `<td><b>+${p.total}</b></td>`).join('')}</tr><tr class="tot"><td>Total</td>${e.total.map(t => `<td>${t}</td>`).join('')}</tr></table>`;
  let bas;
  if(fini){ if(gagne) SON.victoire(); P.sieges.forEach((p, i) => { if(p.perso){ const lui = v.equipes ? i % 2 : i; humeur(i, lui === e.gagnant ? 'joie' : 'boude', 8000); if(lui === e.gagnant) bulle(i, hasard(DIT.gagne), 'gagne'); else setTimeout(() => bulle(i, hasard(DIT.perd), 'perd'), 2200); } });
    setTimeout(() => VOIX.dit('commentateur', gagne ? 'gagne' : 'perd'), 600); }
  else VOIX.dit('commentateur', 'manche');
  if(fini){
    if(P.mode === 'solo' && sv){ sv.jouees++; if(gagne){ sv.gagnees++; if(window.Famille) Famille.score('chkobba', 'victoires', sv.gagnees, joueur).catch(() => {}); } sauve(); }
    bas = `<div class="rang">${P.mode === 'solo' ? '<button class="pill go" id="mRe">🔁 Rejouer</button>' : LIGNE.hote ? '<button class="pill go" id="mRe">🔁 Rejouer</button>' : ''}<button class="pill" id="mMenu">🏠 Menu</button></div>`; }
  else bas = P.mode === 'solo' ? '<div class="rang"><button class="pill go" id="mSuite">▶ Manche suivante</button></div>' : '<p style="font-weight:800">La manche suivante commence toute seule…</p>';
  $('modal').innerHTML = `<div class="carte-ui"><h2>${fini ? (gagne ? '🏆 Vous avez gagné !' : '😅 Perdu cette fois !') : 'Fin de la manche ' + v.manche}</h2>${fini ? `<p style="font-size:20px;margin:4px 0">${gagne ? 'Bravo, ' + esc(joueur || 'champion') + ' !' : esc(noms(e.gagnant)) + ' a gagné la partie.'}</p>` : ''}${tab}${bas}</div>`;
  $('modal').classList.add('on');
  if($('mSuite')) $('mSuite').onclick = async () => { $('modal').classList.remove('on'); nouvelleManche(P.s); await distribue(vue(P.s, P.moi), true); soloSuite(); };
  if($('mRe')) $('mRe').onclick = () => { $('modal').classList.remove('on'); if(P.mode === 'solo') partieSolo(); else LIGNE.rejouer(); };
  if($('mMenu')) $('mMenu').onclick = () => { if(P && P.mode === 'ligne') LIGNE.quitte(); menu(); };
}

/* ---------- contre l'ordinateur ---------- */
async function partieSolo(){
  ac(); sons(); const s0 = sv || neuf(), n = s0.n || 2;
  const persos = Object.keys(PERSOS).sort(() => Math.random() - .5);
  const sieges = [{ nom:joueur || 'Moi', tete:tete(joueur) }];
  for(let i = 1; i < n; i++){ const k = persos[i - 1]; sieges.push({ nom:PERSOS[k], perso:k, bot:true }); }
  const s = nouvellePartie({ n, equipes:n === 4, cible:s0.cible || 11, seed:(Math.random() * 2 ** 31) | 0, donneur:Math.floor(Math.random() * n) });
  P = { mode:'solo', n, moi:0, sieges, s, v:vue(s, 0), humeur:sieges.map(() => 'malin'), niveau:s0.niveau || 'moyen', monde:s0.monde || 'sidibou', occupe:false, sel:null };
  entreTable(); await distribue(vue(s, 0), true); soloSuite();
}
function entreTable(){ montre('-'); document.body.classList.add('jeu'); $('modal').classList.remove('on'); fond(P.monde); ambiance(P.monde); rend(); }
async function soloJoue(j, c, prise){
  const r = jouer(P.s, j, c, prise); if(!r.ok){ console.warn(r.err); return; }
  P.occupe = true; P.v.tour = -1; rend(); await anime(r.ev);
  if(!P || P.mode !== 'solo') return; P.occupe = false; P.v = vue(P.s, P.moi); rend();
  if(r.ev.some(e => e.k === 'fin')) return; soloSuite();
}
async function soloSuite(){ if(!P || P.mode !== 'solo' || P.s.phase !== 'jeu') return; const t = P.s.tour; if(t === P.moi){ rend(); return; }
  await attends(900 + Math.random() * 600); if(!P || P.mode !== 'solo' || P.s.tour !== t || P.s.phase !== 'jeu') return;
  const m = choisir(P.s, t, P.niveau); soloJoue(t, m.carte, m.prise); }
$('solo').onclick = async () => { if(!joueur && !(await choisirJoueur())) return; partieSolo(); };
$('quit').onclick = () => { if(!P) return; $('modal').innerHTML = `<div class="carte-ui"><h2>Quitter la partie ?</h2><p>${P.mode === 'ligne' ? "L'ordinateur prendra ta place à la table." : 'La partie en cours sera perdue.'}</p><div class="rang"><button class="pill go" id="mReste">▶ Je reste</button><button class="pill" id="mPart">🚪 Quitter</button></div></div>`; $('modal').classList.add('on');
  $('mReste').onclick = () => $('modal').classList.remove('on'); $('mPart').onclick = () => { if(P && P.mode === 'ligne') LIGNE.quitte(); menu(); }; };

/* ---------- en ligne : le salon (présence, invitations) et la table (le serveur arbitre) ---------- */
async function post(d){ const f = new FormData(); for(const k in d) f.append(k, d[k]); const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('chkobba-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('chkobba-client', c); }catch(e){} } return c; }
const LIGNE = {
  client:clientId(), code:null, salle:null, status:'menu', online:[], lastV:0, hote:false, poll:null, enCours:false,
  async hello(){ if(!joueur || document.hidden) return; try{ const r = await post({ action:'hello', client:this.client, name:joueur, tete:tete(joueur) || '', status:this.status, code:this.code || '' });
      this.online = r.online || []; (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && !this.code) this.rendSalon(); }catch(e){} },
  invitation(i){ if(this.code === i.code || (P && P.mode === 'ligne')) return; const d = $('invit');
    d.innerHTML = `<div class="carte-ui" style="display:flex;gap:10px;align-items:center;margin:0">${i.tete ? `<img src="${esc(i.tete)}" style="width:48px;height:48px;border-radius:50%">` : '🃏'}<b>${esc(i.name)} t'invite à une chkobba !</b><button class="pill" style="background:#0f3d2e;color:#fff" id="invOk">Rejoindre</button><button class="pill" id="invNo">✕</button></div>`;
    d.classList.add('on'); SON.chkobba(); $('invOk').onclick = () => { d.classList.remove('on'); this.rejoindre(i.code); }; $('invNo').onclick = () => d.classList.remove('on'); setTimeout(() => d.classList.remove('on'), 30000); },
  ouvre(){ sons(); this.verifiePasse(); this.status = 'salon'; montre('salon'); $('salonRetour').onclick = () => { this.sort(); menu(); }; if(this.code) this.rendSalle(); else this.rendSalon(); this.hello(); },
  rendSalon(){ const gens = this.online.filter(g => g.status !== 'joue'), s = sv || neuf();
    $('salonCorps').innerHTML = `<h2>Créer une table</h2><p style="margin:0 0 8px">Tu crées la table, puis tu invites (ou tu donnes le code). Les places vides sont prises par l'ordi.</p>
      <div class="choix" id="sNb"><button data-v="2" class="${s.n == 2 ? 'on' : ''}">À 2</button><button data-v="3" class="${s.n == 3 ? 'on' : ''}">À 3</button><button data-v="4" class="${s.n == 4 ? 'on' : ''}">À 4 (2 contre 2)</button></div>
      <button class="grand" id="sCree">🃏 Créer la table</button>
      <h2 style="margin-top:18px">Rejoindre avec un code</h2><div style="display:flex;gap:10px"><input id="sCode" maxlength="4" placeholder="ABCD" style="font:800 28px 'Baloo 2';text-transform:uppercase;width:150px;padding:6px 12px;border-radius:14px;border:3px solid #e3d6b8;letter-spacing:4px"><button class="pill" id="sJoin" style="background:#0f3d2e;color:#fff">Rejoindre</button></div>
      <h2 style="margin-top:18px">Sur la Chkobba en ce moment</h2>${gens.length ? `<div class="gens">${gens.map(g => `<button disabled>${g.tete ? `<img src="${esc(g.tete)}">` : '🙂'}<span>${esc(g.name)}<small>${g.code ? 'à la table ' + g.code : 'au menu'}</small></span></button>`).join('')}</div>` : '<p class="none">Personne d\'autre pour l\'instant. Envoie le lien de la Chkobba à tes amis !</p>'}`;
    $('sNb').onclick = e => { const b = e.target.closest('button'); if(!b) return; if(!sv) sv = neuf(); sv.n = +b.dataset.v; sauve(); this.rendSalon(); };
    $('sCree').onclick = () => this.cree(); $('sJoin').onclick = () => { const c = $('sCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); }; },
  async cree(){ const s = sv || neuf(); try{ const r = await post({ action:'create', client:this.client, name:joueur, tete:tete(joueur) || '', n:s.n, cible:s.cible, niveau:s.niveau, monde:s.monde }); this.code = r.code; this.suit(); }catch(e){ alert(e.message); } },
  async rejoindre(code){ try{ await post({ action:'join', code, client:this.client, name:joueur, tete:tete(joueur) || '' }); this.code = code; this.status = 'salon'; montre('salon'); this.suit(); }catch(e){ alert(e.message); } },
  suit(){ clearInterval(this.poll); this.lastV = 0; this.poll = setInterval(() => this.etat(), 1000); this.etat(); },
  sort(){ clearInterval(this.poll); this.poll = null; this.code = null; this.salle = null; this.status = 'menu'; },
  async etat(){ if(!this.code || this.enCours) return; this.enCours = true;
    try{ const r = await post({ action:'etat', code:this.code, client:this.client }); this.salle = r; this.hote = r.hote; await this.recoit(r); }catch(e){ if(/existe pas/.test(e.message)){ this.sort(); menu(); } }
    this.enCours = false; },
  async recoit(r){
    if(r.etat === 'attente'){ this.status = 'salon'; if(!document.getElementById('salon').classList.contains('on')) montre('salon'); this.rendSalle(); return; }
    this.status = 'joue';
    if(!P || P.mode !== 'ligne'){   // on arrive à la table
      P = { mode:'ligne', n:r.n, moi:r.moi, sieges:r.sieges, v:r.jeu, humeur:r.sieges.map(() => 'malin'), monde:r.monde, occupe:false, sel:null }; this.lastV = r.jeu.version; entreTable();
      if(r.jeu.phase === 'jeu' && r.jeu.nPris.every(x => !x) && r.jeu.tapis.length === 4 && r.jeu.nMains.every(x => x === 3)){ const c = r.jeu; await distribue(c, true); P.v = c; rend(); } return; }
    P.sieges = r.sieges;
    const nouveaux = (r.log || []).filter(e => e.v > this.lastV);
    if(nouveaux.length){ P.occupe = true; this.lastV = Math.max(...r.log.map(e => e.v)); if(r.jeu.phase === 'jeu' && $('modal').classList.contains('on') && nouveaux.some(e => e.k === 'donne')) $('modal').classList.remove('on');
      await anime(nouveaux); P.occupe = false; }
    if(r.jeu.version >= this.lastV){ const garde = P.v.phase !== 'jeu' && r.jeu.phase === 'jeu'; P.v = r.jeu; if(garde) $('modal').classList.remove('on'); }
    rend(); },
  async joue(c, prise){ P.occupe = true; rend(); try{ await post({ action:'jouer', code:this.code, client:this.client, carte:c, prise:JSON.stringify(prise) }); }catch(e){ alert(e.message); } P.occupe = false; this.etat(); },
  rendSalle(){ const r = this.salle; if(!r) return;
    const libres = this.online.filter(g => g.status !== 'joue' && !r.sieges.some(s => s.nom === g.name));
    $('salonCorps').innerHTML = `<p style="margin:0">Code de la table :</p><div class="code">${this.code}</div>
      <h2>À la table (${r.sieges.length} / ${r.n})</h2><div class="gens">${r.sieges.map(s => `<button disabled>${s.tete ? `<img src="${esc(s.tete)}">` : '🙂'}<span>${esc(s.nom)}<small>prêt</small></span></button>`).join('')}${Array.from({ length:r.n - r.sieges.length }, () => '<button disabled>🤖<span>Place libre<small>sinon, l\'ordi</small></span></button>').join('')}</div>
      ${r.hote && this.peutPasse ? `<h2 style="margin-top:14px">Un ami qui n'a pas accès au site ?</h2><button class="grand" id="rPasse" style="background:#0f766e">📤 Inviter un ami (juste cette partie)</button><div id="rPasseBox">${this.passeCode === this.code && this.passeHtml || ''}</div>` : ''}
      ${libres.length ? `<h2 style="margin-top:14px">Inviter</h2><div class="gens">${libres.map(g => `<button data-inv="${g.client}">${g.tete ? `<img src="${esc(g.tete)}">` : '🙂'}<span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}
      ${r.hote ? `<h2 style="margin-top:14px">Réglages</h2><div class="choix" id="rNb">${[2, 3, 4].map(n => `<button data-v="${n}" class="${r.n === n ? 'on' : ''}">${n === 4 ? 'À 4 (2 contre 2)' : 'À ' + n}</button>`).join('')}</div>
        <div class="choix" id="rCible">${[11, 21, 31].map(n => `<button data-v="${n}" class="${r.cible === n ? 'on' : ''}">${n} points</button>`).join('')}</div>
        <div class="choix" id="rMonde">${MONDES.map(m => `<button data-v="${m.id}" class="${r.monde === m.id ? 'on' : ''}">${m.n}</button>`).join('')}</div>
        <button class="grand" id="rGo">▶ Commencer</button>` : '<p style="font-weight:800;margin-top:14px">On attend que le créateur lance la partie…</p>'}`;
    $('salonCorps').onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ try{ await post({ action:'invite', client:this.client, name:joueur, tete:tete(joueur) || '', to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ alert(err.message); } return; }
      if(!r.hote) return; const g = b.parentElement && b.parentElement.id;
      if(b.id === 'rPasse'){ this.invitePasse(); return; }
      if(b.dataset.copie){ try{ await navigator.clipboard.writeText(b.dataset.copie); b.textContent = '✔ Copié'; }catch(err){} return; }
      if(b.id === 'rGo'){ try{ await post({ action:'start', code:this.code, client:this.client }); this.etat(); }catch(err){ alert(err.message); } return; }
      const k = g === 'rNb' ? 'n' : g === 'rCible' ? 'cible' : g === 'rMonde' ? 'monde' : null; if(!k) return;
      const d = { action:'config', code:this.code, client:this.client, n:r.n, cible:r.cible, niveau:r.niveau, monde:r.monde }; d[k] = b.dataset.v; try{ await post(d); this.etat(); }catch(err){ alert(err.message); } }; },
  /* 21/11 (demande du papa) : inviter un ami qui n'a pas accès au site, pour cette partie seulement (laissez-passer de 3 heures, api/passe.php).
     Seul Anis voit le bouton (le serveur vérifie aussi). L'ami arrive directement à cette table. */
  peutPasse:false,
  async verifiePasse(){ if(joueur !== 'Anis') return; try{ const f = new FormData(); f.append('action', 'peut'); const r = await fetch('/api/passe.php', { method:'POST', body:f }); if(r.ok){ this.peutPasse = !!(await r.json()).peut; if(this.salle) this.rendSalle(); } }catch(e){} },
  async invitePasse(){ const nom = (prompt('Le prénom de ton ami :') || '').trim(); if(!nom) return;
    try{ const f = new FormData(); f.append('action', 'cree'); f.append('jeu', 'chkobba'); f.append('nom', nom); f.append('table', this.code);
      const r = await fetch('/api/passe.php', { method:'POST', body:f }), j = await r.json(); if(!r.ok) throw new Error(j.error || 'Erreur');
      const txt = 'Viens faire une partie de Chkobba avec moi, ' + j.nom + ' ! Ouvre ce lien puis touche « Jouer » (il marche 3 heures) : ';
      this.passeCode = this.code; this.passeHtml = `<p style="margin:8px 0 4px;font-weight:800">Le lien pour ${esc(j.nom)} (3 heures, un seul appareil) :</p><input readonly value="${esc(j.lien)}" style="width:100%;font:600 14px Nunito;padding:8px;border-radius:10px;border:2px solid #ddd;box-sizing:border-box"><div class="choix" style="margin-top:8px"><button data-copie="${esc(j.lien)}">📋 Copier</button><a class="btn" style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 16px;border-radius:14px;background:#25d366;color:#fff;font-weight:800;text-decoration:none" href="https://wa.me/?text=${encodeURIComponent(txt + j.lien)}" target="_blank" rel="noopener">WhatsApp</a></div>`; $('rPasseBox').innerHTML = this.passeHtml;
      if(navigator.share) try{ await navigator.share({ title:'Une partie de Chkobba', text:txt, url:j.lien }); }catch(e){}
    }catch(e){ alert(e.message); } },
  async rejouer(){ try{ await post({ action:'rejouer', code:this.code, client:this.client }); P = null; this.lastV = 0; this.etat(); }catch(e){ alert(e.message); } },
  quitte(){ if(this.code) post({ action:'quitter', code:this.code, client:this.client }).catch(() => {}); this.sort(); },
};
setInterval(() => LIGNE.hello(), 4000);
$('voixBtn').onclick = async () => { ac(); montre('studio'); $('studioCorps').innerHTML = '<p>…</p>'; await VOIX.charge(); VOIX.studio($('studioCorps'), () => joueur); };
$('studioRetour').onclick = () => menu();
$('ligne').onclick = async () => { if(!joueur && !(await choisirJoueur())) return; LIGNE.ouvre(); };

/* ---------- au démarrage ---------- */
sv = neuf(); menu(); VOIX.init(ac).then(() => VOIX.prepare(['garde', 'marchand', 'voleur', 'controleur', 'commentateur']));
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0);
LIGNE.verifiePasse();
// 21/11 : un ami invité à une partie (laissez-passer) arrive avec ?table=CODE : on le fait asseoir à la table
{ const t = new URLSearchParams(location.search).get('table'); if(t && /^[A-Z0-9]{4}$/.test(t) && joueur){ LIGNE.ouvre(); LIGNE.rejoindre(t); } }
window.__chk = { get P(){ return P; }, partieSolo, LIGNE, VOIX, set niveau(v){ if(P) P.niveau = v; } };
