/* La Légende du Jasmin — Stage 2 : le moteur (14/11/2026).
   Canvas 2D, pas fixe de 1/120 s, cartes en lettres (cartes/m<n>.js), réglages dans niveaux.js.
   Nouveautés par rapport au Jasmin : des niveaux sur plusieurs étages (la caméra suit en hauteur), les échelles,
   s'accroupir et ramper, ramasser / porter / poser / lancer des objets (caisse marchepied, jarre, ballon, pierre, sac, clé),
   leviers et grilles, portes à clé, murs fissurés et faux murs (passages secrets), ennemis à états
   (dort → patrouille → alerte → poursuite → étourdi → fuite), trois difficultés.
   La page (jasmin-stage2.html) fournit les écrans ; le moteur expose window.S2J (lancer, pause, reprendre, quitter). */
(function(){
'use strict';
const { PH, T, HW, HH, HHbas, ENNEMIS, OBJETS, DIFF, MONDES } = S2;
const STEP = 1 / 120, VH_CASES = 14;
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);

/* ---------- images ---------- */
const IM = {};
function img(k, src){ if(IM[k]) return IM[k]; const i = new Image(); i.src = src; IM[k] = i; return i; }
const ok = i => i && i.complete && i.naturalWidth > 0;
const BASE = { jarre:'jasmin3/m1/jarre.webp', piece:'jasmin3/m1/piece.webp', jasmin:'jasmin3/m1/jasmin_or.webp', lanterne:'jasmin3/m1/lanterne.webp',
  panneau:'jasmin3/m1/panneau.webp', cactus:'jasmin2/cactus.webp', orange:'jasmin2/obj-orange.webp', chat:'jasmin2/chat.webp', mouette:'jasmin2/mouette.webp' };
Object.entries(BASE).forEach(([k, s]) => img(k, s + '?v=1'));
const MI = ['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_fissure', 'caisse', 'ballon', 'pierre', 'cle', 'levier', 'grille', 'porte_verrou', 'porte_sortie', 'echelle', 'sac'];
const ANIM = { g:'garde', r:'garde', d:'chien', l:'marchand' };   // planches de 12 images (stage2/<nom>-anim.webp) ; sinon l'image fixe
function imagesMonde(n){ MI.forEach(k => img('m' + n + k, `stage2/m${n}/${k}.webp?v=1`)); ['garde', 'chien', 'marchand'].forEach(k => { img('a_' + k, `stage2/${k}-anim.webp?v=1`); img('f_' + k, `stage2/m1/${k}.webp?v=1`); }); }
const W_ = k => IM['m' + G.n + k];

/* ---------- sons ---------- */
let AC = null, master = null;
function audio(){ if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .8; master.connect(AC.destination); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; }
if(window.Sons) Sons.charger('jasmin', ['saut', 'atterrir', 'piece', 'gemme', 'lampe', 'aie', 'chute', 'brique', 'ressort', 'victoire', 'bonus', 'portail', 'ecrase', 'plouf']);
function bip(f, d, type = 'triangle', v = .12, slide = 0){ if(!AC || !S2J.son) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); }
const SND = { saut:['saut', () => bip(420, .14, 'square', .07, 300)], pose:['atterrir', () => bip(160, .08)], piece:['piece', () => { bip(988, .06); bip(1318, .1); }], gemme:['gemme', () => bip(660, .4, 'sine', .15, 600)],
  lampe:['lampe', () => bip(523, .3, 'sine')], aie:['aie', () => bip(220, .25, 'sawtooth', .1, -120)], chute:['chute', () => bip(300, .6, 'triangle', .12, -250)], casse:['brique', () => bip(120, .2, 'square', .12, -60)],
  ressort:['ressort', () => bip(300, .3, 'sine', .14, 500)], victoire:['victoire', () => bip(784, .6, 'sine')], bonus:['bonus', () => bip(880, .3)], porte:['portail', () => bip(330, .4, 'sine', .12, 200)], coup:['ecrase', () => bip(180, .12, 'square', .12)],
  prend:[null, () => bip(600, .07, 'sine', .1, 200)], lance:[null, () => bip(500, .12, 'triangle', .1, -250)], levier:[null, () => { bip(200, .05, 'square'); bip(260, .08, 'square'); }], miaou:[null, () => bip(700, .35, 'sine', .1, -300)], ouaf:[null, () => { bip(200, .08, 'square', .14); }] };
function son(k){ if(!S2J.son) return; audio(); const s = SND[k]; if(!s) return; if(s[0] && window.Sons && Sons.jouer(AC, master, s[0], .8)) return; s[1](); }
function dire(t){ if(!S2J.voix) return; try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[◀▶▲▼✋🎯]/g, '')); u.lang = 'fr-FR'; u.rate = .95; speechSynthesis.speak(u); }catch(e){} }

/* ---------- commandes : clavier, manette, écran tactile ---------- */
const K = { l:0, r:0, u:0, d:0, run:0, a:0 }, TCH = { dx:0, dy:0, a:0 };
let saut = false, agir = false, lancer = false;
const kd = (e, v) => { const c = e.code;
  if(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(c)) e.preventDefault();
  if(c === 'ArrowLeft' || c === 'KeyA' || c === 'KeyQ') K.l = v; if(c === 'ArrowRight' || c === 'KeyD') K.r = v;
  if(c === 'ArrowUp' || c === 'KeyW' || c === 'KeyZ') K.u = v; if(c === 'ArrowDown' || c === 'KeyS') K.d = v;
  if(c === 'ShiftLeft' || c === 'ShiftRight') K.run = v;
  if(c === 'Space'){ if(v && !K.a) saut = true; K.a = v; }
  if(v && !e.repeat){ if(c === 'KeyE') agir = true; if(c === 'KeyF') lancer = true; if(c === 'Escape' || c === 'KeyP') S2J.basculePause(); } };
addEventListener('keydown', e => kd(e, 1)); addEventListener('keyup', e => kd(e, 0));
addEventListener('blur', () => { Object.keys(K).forEach(k => K[k] = 0); TCH.dx = TCH.dy = 0; TCH.a = 0; });
// le joystick (à gauche) : on pose le pouce où l'on veut dans la zone, il suit le pouce
(function(){
  const z = $('joy'), base = $('joyBase'), knob = $('joyKnob'); if(!z) return; let id = null, ox = 0, oy = 0;
  const R = 56, maj = (x, y) => { let dx = x - ox, dy = y - oy; const d = Math.hypot(dx, dy); if(d > R){ dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; TCH.dx = dx / R; TCH.dy = dy / R; };
  z.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; const r = z.getBoundingClientRect(); ox = e.clientX; oy = e.clientY; base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px'; base.classList.add('on'); maj(ox, oy); try{ z.setPointerCapture(id); }catch(_){} audio(); });
  z.addEventListener('pointermove', e => { if(e.pointerId === id) maj(e.clientX, e.clientY); });
  const fin = e => { if(e.pointerId !== id) return; id = null; TCH.dx = TCH.dy = 0; knob.style.transform = ''; base.classList.remove('on'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => z.addEventListener(t, fin));
  const btn = (el, f, tenu) => { if(!el) return; el.addEventListener('pointerdown', e => { e.preventDefault(); audio(); el.classList.add('on'); f(); if(tenu) TCH.a = 1; try{ el.setPointerCapture(e.pointerId); }catch(_){} });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => el.addEventListener(t, () => { el.classList.remove('on'); if(tenu) TCH.a = 0; })); el.addEventListener('contextmenu', e => e.preventDefault()); };
  btn($('bSaut'), () => saut = true, true); btn($('bAgir'), () => agir = true); btn($('bLancer'), () => lancer = true);
})();
let padAv = {};
function manette(){ const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null; if(!gp) return {};
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = i => gp.buttons[i] && gp.buttons[i].pressed;
  const s = { l:ax < -.35 || b(14), r:ax > .35 || b(15), u:ay < -.5 || b(12), d:ay > .5 || b(13), a:b(0), e:b(2), f:b(1), run:b(5) || b(7), p:b(9) };
  if(s.a && !padAv.a) saut = true; if(s.e && !padAv.e) agir = true; if(s.f && !padAv.f) lancer = true; if(s.p && !padAv.p) S2J.basculePause(); padAv = s; return s; }

/* ---------- le monde ---------- */
let G = null;
const SOLIDES = '#BGDF';
function tile(cx, cy){ if(cx < 0 || cx >= G.W) return '#'; if(cy < 0) return '.'; if(cy >= G.H) return '.'; return G.m[cy][cx]; }
function solide(cx, cy){ const c = tile(cx, cy); if(c === 'F') return false; if(c === 'G') return !G.ouvert.has(cx + ',' + cy); if(c === 'D') return !G.ouvert.has(cx + ',' + cy); return c === '#' || c === 'B'; }
const echelle = (cx, cy) => tile(cx, cy) === 'H';
// les caisses posées sont solides (on peut monter dessus) ; on les ignore pour l'objet qui teste
function caisseEn(x0, y0, x1, y1, sauf){ for(const o of G.objs) if(o !== sauf && o.solide && o.etat === 'pose' && x1 > o.x - 15 && x0 < o.x + 15 && y1 > o.y - 30 && y0 < o.y) return o; return null; }
function boite(x0, y0, x1, y1, sauf){
  for(let cy = Math.floor(y0 / T); cy <= Math.floor((y1 - .01) / T); cy++) for(let cx = Math.floor(x0 / T); cx <= Math.floor((x1 - .01) / T); cx++) if(solide(cx, cy)) return { cx, cy };
  const c = caisseEn(x0, y0, x1, y1, sauf); return c ? { caisse:c } : null; }

function charger(n, diff, depuisReprise){
  const M = MONDES.find(m => m.n === n), rows = (window.S2_CARTES || {})[n]; if(!M || !rows) return false;
  imagesMonde(n);
  const d = DIFF[diff] || DIFF.normal, ancien = G;
  G = { n, M, diff, D:d, m:rows.map(r => r.split('')), W:rows[0].length, H:rows.length, t:0, objs:[], ens:[], tirs:[], parts:[], textes:[], plats:[], piecesP:[], gemmes:[], lanternes:[], panneaux:[], leviers:[], sortie:null,
    ouvert:new Set(), dinars:0, jasmins:new Set(), coeurs:d.coeurs, vies:d.vies, check:null, camX:0, camY:0, fini:false, perdu:false, cases:0, indice:'' };
  let ip = 0, ie = 0;
  for(let y = 0; y < G.H; y++) for(let x = 0; x < G.W; x++){
    const c = G.m[y][x], px = x * T + 16, py = (y + 1) * T;
    const vide = () => G.m[y][x] = '.';
    if(c === '@'){ G.depart = { x:px, y:py }; vide(); }
    else if(c === 'E'){ G.sortie = { x:px, y:py }; vide(); }
    else if(c === 'c'){ G.lanternes.push({ x:px, y:py, on:false }); vide(); }
    else if(c === '!'){ G.panneaux.push({ x:px, y:py, txt:(M.panneaux || [])[ip++] || '', lu:false }); vide(); }
    else if(c === '$'){ G.piecesP.push({ x:px, y:py - 12, ok:true }); vide(); }
    else if(c === '*'){ G.gemmes.push({ x:px, y:py - 14, id:x + ',' + y }); vide(); }
    else if(c === 'L'){ G.leviers.push({ x:px, y:py - 16, on:false }); vide(); }
    else if(c === 'M' || c === 'V'){ G.plats.push({ x0:x * T, y0:y * T, x:x * T, y:y * T, w:2 * T, ax:c === 'M' ? 'x' : 'y', dist:4 * T, dx:0, dy:0 }); vide(); }
    else if(OBJETS[c]){ const O = OBJETS[c]; G.objs.push({ k:c, O, x:px, y:py, x0:px, y0:py, vx:0, vy:0, etat:'pose', solide:!!O.solide, rebonds:0 }); vide(); }
    else if(ENNEMIS[c]){ ie++; const E = ENNEMIS[c]; if((ie % 10) / 10 < d.garde || ie === 1) G.ens.push(nouvelEnnemi(c, E, px, py)); vide(); }
  }
  // garde : on retire des ennemis de façon régulière (Facile : un sur deux, Normal : un sur cinq)
  G.ens = G.ens.filter((e, i) => d.garde >= 1 || (d.garde >= .8 ? i % 5 !== 4 : i % 2 === 0));
  const h = { x:G.depart.x, y:G.depart.y, vx:0, vy:0, face:1, sol:false, coyote:0, tampon:0, tenu:false, monte:false, bas:false, porte:null, inv:0, phase:0, lance:0, mort:false, gagne:0, aTerre:true };
  G.h = h;
  if(depuisReprise && ancien && ancien.n === n && ancien.check){ h.x = ancien.check.x; h.y = ancien.check.y; G.check = ancien.check; G.dinars = ancien.dinars; G.jasmins = ancien.jasmins; G.vies = ancien.vies;
    ancien.lanternes.forEach((l, i) => { if(l.on) G.lanternes[i].on = true; }); ancien.piecesP.forEach((p, i) => { if(!p.ok) G.piecesP[i].ok = false; }); G.gemmes = G.gemmes.filter(g => !G.jasmins.has(g.id)); G.ouvert = ancien.ouvert; G.cassees = ancien.cassees; (G.cassees || []).forEach(k => { const [x, y] = k.split(',').map(Number); G.m[y][x] = '.'; }); ancien.leviers.forEach((l, i) => G.leviers[i].on = l.on); G.clesUsees = ancien.clesUsees; G.objs = G.objs.filter((o, i) => !(o.O.cle && ancien.clesUsees)); }
  G.camX = h.x - 300; G.camY = h.y - 300;
  return true;
}
function nouvelEnnemi(t, E, x, y){
  const taille = { g:[18, 62], r:[18, 62], d:[26, 34], l:[18, 60], z:[24, 26], m:[30, 22] }[t];
  return { t, E, x, y, x0:x, y0:y, vx:0, vy:0, face:-1, etat:E.dort ? 'dort' : E.vole ? 'vol' : 'patrouille', pv:E.pv, w:taille[0], h:taille[1], tm:0, tir:E.tir || 0, vivant:true, sol:true, fr:0 };
}

/* ---------- la boucle ---------- */
let etat = 'menu', dernier = 0, reste = 0;
function boucle(now){
  requestAnimationFrame(boucle);
  let dt = Math.min(.1, (now - dernier) / 1000); dernier = now;
  if(etat === 'jeu' && G){ reste += dt; while(reste >= STEP){ pas(STEP); reste -= STEP; } }
  dessine(now / 1000);
}

function pas(dt){
  const g = G, h = g.h, pad = manette(); g.t += dt;
  const dx = (K.r || pad.r ? 1 : 0) - (K.l || pad.l ? 1 : 0) + (Math.abs(TCH.dx) > .3 ? Math.sign(TCH.dx) : 0);
  const dir = Math.max(-1, Math.min(1, dx)), haut = K.u || pad.u || TCH.dy < -.55, bas = K.d || pad.d || TCH.dy > .55;
  const court = K.run || pad.run || Math.abs(TCH.dx) > .92, tenuSaut = K.a || pad.a || TCH.a;
  // plateformes mobiles
  g.plats.forEach(p => { const s = (Math.sin(g.t * .9 + p.x0 * .01) + 1) / 2 * p.dist, nx = p.ax === 'x' ? p.x0 + s : p.x0, ny = p.ax === 'y' ? p.y0 - s : p.y0; p.dx = nx - p.x; p.dy = ny - p.y; p.x = nx; p.y = ny; });
  objets(dt); ennemis(dt, h); tirs(dt, h); effets(dt);
  if(h.mort){ h.mortT += dt; h.vy += PH.g * dt; h.y += h.vy * dt; if(h.mortT > 1.6) reprise(); return; }
  if(g.fini){ h.gagne += dt; return; }
  h.inv = Math.max(0, h.inv - dt); h.lance = Math.max(0, h.lance - dt);
  if(dir) h.face = dir;
  const lourd = h.porte && h.porte.O.lourd;
  // ----- l'échelle -----
  const cx = Math.floor(h.x / T), auMilieu = Math.floor((h.y - 20) / T), sousPieds = Math.floor((h.y + 2) / T);
  if(!h.monte && !lourd){
    if(haut && echelle(cx, auMilieu)) h.monte = true;
    else if(bas && h.sol && echelle(cx, sousPieds) && !echelle(cx, auMilieu)){ h.monte = true; h.y += 4; }
    if(h.monte){ h.x = cx * T + 16; h.vx = 0; h.vy = 0; h.bas = false; if(h.porte && !h.porte.O.petit){ h.monte = false; } }
  } else if(h.monte && lourd) h.monte = false;
  if(h.monte){
    const v = (haut ? -1 : 0) + (bas ? 1 : 0); h.vy = v * PH.echelle; h.vx = 0; h.pm = (h.pm || 0) + Math.abs(h.vy) * dt;
    if(saut){ saut = false; h.monte = false; h.vy = -320; h.vx = dir * 150; son('saut'); }
    else { const ny = h.y + h.vy * dt;
      if(v > 0 && boite(h.x - HW + 2, ny - 1, h.x + HW - 2, ny)){ h.monte = false; h.y = Math.floor(ny / T) * T; h.sol = true; h.vy = 0; }       // en bas : le sol
      else if(v < 0 && !echelle(cx, Math.floor((ny - 4) / T))){ h.monte = false; h.y = (Math.floor((ny - 4) / T) + 1) * T; h.sol = true; h.vy = 0; }   // en haut : on pose le pied sur la dernière marche
      else if(!echelle(cx, Math.floor((ny - 4) / T)) && !echelle(cx, Math.floor((ny - 30) / T))){ h.monte = false; }   // plus d'échelle : on tombe
      else h.y = ny; }
    if(h.monte) { agirLancer(h); return finPas(h); }
  }
  // ----- s'accroupir, ramper -----
  const plafondBas = !!boite(h.x - HW + 2, h.y - HH, h.x + HW - 2, h.y - HHbas);
  h.bas = h.sol && !lourd && (bas || plafondBas);
  const vmax = (h.bas ? PH.rampe : court ? PH.course : PH.marche) * (lourd ? PH.lourd : 1);
  if(dir){ const contre = Math.sign(h.vx) === -dir; h.vx += dir * (h.sol ? PH.acc * (contre ? 2 : 1) : PH.accAir) * dt; if(Math.abs(h.vx) > vmax) h.vx = Math.sign(h.vx) * Math.max(vmax, Math.abs(h.vx) - 1200 * dt); }
  else if(h.sol){ h.vx -= Math.sign(h.vx) * Math.min(Math.abs(h.vx), PH.frein * dt); }
  // ----- le saut -----
  if(saut){ h.tampon = PH.tampon; saut = false; } else h.tampon = Math.max(0, h.tampon - dt);
  h.coyote = h.sol ? PH.coyote : Math.max(0, h.coyote - dt);
  if(h.tampon > 0 && h.coyote > 0 && !plafondBas){ h.vy = -PH.saut * (lourd ? PH.sautLourd : 1); h.sol = false; h.coyote = 0; h.tampon = 0; h.tenu = true; h.bas = false; son('saut'); }
  if(!tenuSaut) h.tenu = false;
  h.vy = Math.min(PH.chuteMax, h.vy + (h.vy < 0 ? (h.tenu ? PH.gTenu : PH.gCoupe) : PH.gChute) * dt);
  if(h.sur){ h.x += h.sur.dx; h.y += h.sur.dy; }
  // ----- horizontal -----
  const hh = h.bas ? HHbas : HH;
  h.x += h.vx * dt;
  let b = boite(h.x - HW, h.y - hh, h.x + HW, h.y - 1);
  if(b){ if(b.caisse && h.sol && !h.porte){ const c = b.caisse, sens = Math.sign(c.x - h.x); if(sens === dir){ const nx = c.x + sens * PH.pousse * dt; if(!boite(nx - 15, c.y - 30, nx + 15, c.y - 1, c)){ c.x = nx; h.pousse = .2; } } }
    if(b.caisse){ const c = b.caisse; h.x = h.x < c.x ? c.x - 15 - HW - .01 : c.x + 15 + HW + .01; h.vx *= .2; }
    else { h.x = h.vx > 0 || (h.vx === 0 && b.cx * T > h.x) ? b.cx * T - HW - .01 : (b.cx + 1) * T + HW + .01; h.vx = 0; } }
  h.pousse = Math.max(0, (h.pousse || 0) - dt);
  // ----- vertical -----
  const avant = h.y, etaitSol = h.sol; h.y += h.vy * dt; h.sol = false; h.sur = null;
  if(h.vy < 0){ b = boite(h.x - HW + 3, h.y - hh, h.x + HW - 3, h.y - hh + 1); if(b){ h.y = b.caisse ? b.caisse.y + hh : (b.cy + 1) * T + hh; h.vy = 30; } }
  else {
    b = boite(h.x - HW + 2, h.y - 1, h.x + HW - 2, h.y);
    if(b){ h.y = b.caisse ? b.caisse.y - 30 : b.cy * T; h.vy = 0; h.sol = true; }
    else { // planches et haut des échelles : on s'y pose en tombant, on passe dessous en montant
      for(let x = Math.floor((h.x - HW + 2) / T); x <= Math.floor((h.x + HW - 2) / T) && !h.sol; x++){ const y = Math.floor(h.y / T), c = tile(x, y);
        const surf = c === '=' || (c === 'H' && tile(x, y - 1) !== 'H');
        if(surf && avant <= y * T + .5 && h.y >= y * T && !(bas && c === 'H')){ h.y = y * T; h.vy = 0; h.sol = true; } }
      if(!h.sol) for(const p of g.plats){ if(h.x > p.x - 6 && h.x < p.x + p.w + 6 && avant <= p.y + 1 && h.y >= p.y){ h.y = p.y; h.vy = 0; h.sol = true; h.sur = p; break; } }
    }
    if(h.sol && !etaitSol){ son('pose'); h.ecrase = .25; if(avant < h.y - 4 && h.vyAv > 350) bruit(h.x, h.y, 5); }
  }
  h.vyAv = h.vy || h.vyAv;
  h.phase += Math.abs(h.vx) * dt * .07;
  agirLancer(h);
  // dangers : cactus, chute hors du monde
  const pied = tile(Math.floor(h.x / T), Math.floor((h.y - 4) / T)), milieu = tile(Math.floor(h.x / T), Math.floor((h.y - 18) / T));
  if(pied === '^' || milieu === '^') blesse(h, true);
  if(h.y > g.H * T + 60){ perdVie(); return; }
  if(h.x < HW) h.x = HW; if(h.x > g.W * T - HW) h.x = g.W * T - HW;
  // la course fait du bruit (réveille les chats)
  if(Math.abs(h.vx) > PH.marche + 30 && h.sol) bruit(h.x, h.y, 4.5);
  finPas(h);
}
function finPas(h){
  const g = G;
  // ramasser les dinars, les jasmins ; les lanternes ; les panneaux ; la sortie
  g.piecesP.forEach(p => { if(p.ok && Math.abs(h.x - p.x) < 20 && Math.abs(h.y - 22 - p.y) < 34){ p.ok = false; g.dinars++; son('piece'); } });
  g.gemmes = g.gemmes.filter(j => { if(Math.abs(h.x - j.x) < 22 && Math.abs(h.y - 22 - j.y) < 34){ g.jasmins.add(j.id); son('gemme'); texte('🌼 Jasmin d’or !', j.x, j.y - 30, '#ffe066'); eclat(j.x, j.y, '#ffe066', 18); return false; } return true; });
  g.lanternes.forEach(l => { if(!l.on && Math.abs(h.x - l.x) < 26 && Math.abs(h.y - l.y) < 40){ l.on = true; g.check = { x:l.x, y:l.y }; son('lampe'); texte('Point de reprise !', l.x, l.y - 70, '#ffe066'); } });
  g.indice = '';
  g.panneaux.forEach(p => { if(Math.abs(h.x - p.x) < 60 && Math.abs(h.y - p.y) < 70){ g.indice = p.txt; if(!p.lu){ p.lu = true; dire(p.txt); } } });
  if(!g.indice) g.indice = indiceAgir(h);
  if(g.sortie && Math.abs(h.x - g.sortie.x) < 26 && Math.abs(h.y - g.sortie.y) < 40 && h.sol) gagne();
}

/* ---------- prendre, poser, lancer, tirer un levier ---------- */
function proche(h){
  let best = null, bd = 52;
  for(const o of G.objs){ if(o.etat !== 'pose') continue; const d = Math.abs(o.x - h.x); if(d < bd && Math.abs(o.y - h.y) < 36){ bd = d; best = { o }; } }
  for(const l of G.leviers){ const d = Math.hypot(l.x - h.x, l.y - (h.y - 36)); if(d < 52 && d < bd + 10){ bd = d; best = { l }; } }
  return best;
}
function indiceAgir(h){
  if(h.porte) return h.porte.O.cle ? '🔑 Va toucher la porte fermée avec la clé.' : `🎯 Lance ${leLa(h.porte.O.nom)} (F) · ✋ pose-${h.porte.O.nom === 'caisse' || h.porte.O.nom === 'jarre' || h.porte.O.nom === 'pierre' || h.porte.O.nom === 'clé' ? 'la' : 'le'} (E)`;
  const p = proche(h); if(!p) return '';
  if(p.o) return `✋ Prendre ${leLa(p.o.O.nom)} (E)`;
  if(p.l) return p.l.on ? '' : '✋ Tirer le levier (E)';
  return '';
}
const leLa = n => (['caisse', 'jarre', 'pierre', 'clé'].includes(n) ? 'la ' : 'le ') + n;
function agirLancer(h){
  const g = G;
  if(agir){ agir = false;
    if(h.porte){ // poser devant soi
      const o = h.porte, nx = h.x + h.face * 26;
      if(!boite(nx - 14, h.y - 30, nx + 14, h.y - 2, o)){ o.x = nx; o.y = h.y - 2; o.vx = 0; o.vy = 0; o.etat = 'pose'; h.porte = null; son('pose'); }
      else { o.x = h.x; o.y = h.y - 2; o.vx = 0; o.vy = 0; o.etat = 'pose'; h.porte = null; son('pose'); }
    } else { const p = proche(h);
      if(p && p.o){ if(h.monte && !p.o.O.petit){ texte('Descends de l’échelle d’abord', h.x, h.y - 90); } else { p.o.etat = 'porte'; h.porte = p.o; son('prend'); } }
      else if(p && p.l && !p.l.on){ levier(p.l); } } }
  if(lancer){ lancer = false;
    if(h.porte && !h.monte){ const o = h.porte, L = o.O.lance; o.etat = 'vol'; o.vx = h.face * L[0] + h.vx * .3; o.vy = L[1]; o.x = h.x + h.face * 12; o.y = h.y - (h.bas ? 30 : 70); o.lanceur = 'heros'; h.porte = null; h.lance = .25; son('lance'); }
    else if(!h.porte) texte('Prends d’abord un objet (E)', h.x, h.y - 90, '#ffffff'); }
  // la clé ouvre la porte qu'on touche
  if(h.porte && h.porte.O.cle){ for(let y = Math.floor((h.y - HH) / T); y <= Math.floor((h.y - 1) / T); y++) for(const x of [Math.floor((h.x + HW + 4) / T), Math.floor((h.x - HW - 4) / T)])
    if(tile(x, y) === 'D' && !g.ouvert.has(x + ',' + y)){ ouvrePorte(x, y); g.objs = g.objs.filter(o => o !== h.porte); h.porte = null; g.clesUsees = true; return; } }
}
function ouvrePorte(x, y){ const g = G; let y0 = y; while(tile(x, y0 - 1) === 'D') y0--; for(let k = y0; tile(x, k) === 'D'; k++) g.ouvert.add(x + ',' + k); son('porte'); texte('🔓 La porte s’ouvre !', x * T + 16, y0 * T - 20, '#ffe066'); eclat(x * T + 16, y * T, '#ffe066', 14); }
function levier(l){ const g = G; l.on = true; son('levier');
  // il ouvre les grilles les plus proches (dans les 14 cases)
  let n = 0; for(let y = 0; y < g.H; y++) for(let x = 0; x < g.W; x++) if(g.m[y][x] === 'G' && Math.abs(x * T - l.x) < 14 * T){ g.ouvert.add(x + ',' + y); n++; }
  if(n){ son('porte'); texte('La grille s’ouvre !', l.x, l.y - 40, '#ffe066'); } }

/* ---------- les objets ---------- */
function objets(dt){
  const g = G, h = g.h;
  for(const o of g.objs){
    if(o.etat === 'porte'){ const H2 = hauteurHeros(); o.x = h.x + (h.monte ? 0 : h.face * 4); o.y = h.y - (h.bas ? H2 * .6 : H2) - 2; continue; }
    if(o.etat === 'pose'){ // il tombe s'il n'a plus rien dessous
      if(!boite(o.x - 14, o.y, o.x + 14, o.y + 2, o) && !surPlanche(o.x, o.y)){ o.vy = Math.min(PH.chuteMax, o.vy + PH.g * dt); o.y += o.vy * dt; const b = boite(o.x - 14, o.y - 1, o.x + 14, o.y, o); if(b){ o.y = b.caisse ? b.caisse.y - 30 : b.cy * T; o.vy = 0; } else for(let x = Math.floor((o.x - 14) / T); x <= Math.floor((o.x + 14) / T); x++){ const y = Math.floor(o.y / T); if(tile(x, y) === '=' && o.y - o.vy * dt <= y * T + .5){ o.y = y * T; o.vy = 0; } } }
      else o.vy = 0;
      if(o.y > g.H * T + 100){ o.x = o.x0; o.y = o.y0; o.vy = 0; }   // tombé hors du monde : il revient à sa place
      continue; }
    // en vol
    o.vy += PH.g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot = (o.rot || 0) + o.vx * dt * .05;
    // un ennemi touché
    for(const e of g.ens){ if(!e.vivant || e.etat === 'fuite') continue; const ey = e.E.vole ? e.y : e.y - e.h / 2;
      if(Math.abs(o.x - e.x) < e.w / 2 + 14 && Math.abs(o.y - 12 - ey) < e.h / 2 + 14){ coup(e, o.O.lourd ? 2 : 1); o.vx *= -.3; o.vy = -150; if(o.O.casse){ casseObjet(o); } break; } }
    if(o.etat !== 'vol') continue;
    // un levier touché
    for(const l of g.leviers) if(!l.on && Math.hypot(o.x - l.x, o.y - 12 - l.y) < 40){ levier(l); o.vx *= -.4; }
    // les murs
    const b = boite(o.x - 12, o.y - 24, o.x + 12, o.y, o);
    if(b){
      if(!b.caisse && o.O.casseMur){ // un mur fissuré touché (même du bout) se casse
        let f = null; for(let cy = Math.floor((o.y - 30) / T); cy <= Math.floor((o.y + 2) / T) && !f; cy++) for(let cx = Math.floor((o.x - 18) / T); cx <= Math.floor((o.x + 18) / T); cx++) if(tile(cx, cy) === 'B'){ f = [cx, cy]; break; }
        if(f){ casseMur(f[0], f[1]); o.vx *= .3; } }
      if(o.O.casse){ casseObjet(o); continue; }
      if(o.O.rebond && o.rebonds < 4){ // le ballon rebondit
        const solSous = boite(o.x - 12, o.y - 2, o.x + 12, o.y + 1, o);
        if(solSous && o.vy > 0){ o.y = solSous.caisse ? solSous.caisse.y - 30 : solSous.cy * T; o.vy = -o.vy * o.O.rebond; o.vx *= .85; o.rebonds++; if(Math.abs(o.vy) < 90){ o.etat = 'pose'; o.rebonds = 0; } }
        else { o.x -= o.vx * dt; o.vx = -o.vx * .7; o.rebonds++; }
        continue; }
      // il tombe à plat
      const solSous = boite(o.x - 12, o.y - 2, o.x + 12, o.y + 1, o);
      if(solSous && o.vy >= 0){ o.y = solSous.caisse ? solSous.caisse.y - 30 : solSous.cy * T; }
      else o.x -= o.vx * dt;
      o.vx = 0; o.vy = 0; o.etat = 'pose'; son('pose'); bruit(o.x, o.y, 6);
    }
    if(o.y > g.H * T + 100){ o.x = o.x0; o.y = o.y0; o.vx = o.vy = 0; o.etat = 'pose'; }
  }
}
function surPlanche(x, y){ if(y % T !== 0) return false; for(let cx = Math.floor((x - 14) / T); cx <= Math.floor((x + 14) / T); cx++) if(tile(cx, y / T) === '=') return true; return false; }
function casseObjet(o){ const g = G; o.etat = 'casse'; g.objs = g.objs.filter(x => x !== o); son('casse'); eclat(o.x, o.y - 10, '#c87b3e', 12); bruit(o.x, o.y, 6);
  if(Math.random() < .6){ g.piecesP.push({ x:o.x, y:o.y - 14, ok:true, saute:1 }); } }
function casseMur(cx, cy){ const g = G, pile = [[cx, cy]], vus = new Set(); g.cassees = g.cassees || [];
  while(pile.length){ const [x, y] = pile.pop(), k = x + ',' + y; if(vus.has(k) || tile(x, y) !== 'B') continue; vus.add(k); g.m[y][x] = '.'; g.cassees.push(k); eclat(x * T + 16, y * T + 16, '#d9cbb0', 8); pile.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  son('casse'); son('bonus'); texte('✨ Un passage secret !', cx * T + 16, cy * T - 20, '#ffe066'); }

/* ---------- les ennemis : dort → patrouille → alerte → poursuite → étourdi → fuite ---------- */
function bruit(x, y, cases){ for(const e of G.ens) if(e.vivant && e.etat === 'dort' && Math.abs(e.x - x) < cases * T && Math.abs(e.y - y) < 3 * T){ e.etat = 'alerte'; e.tm = .6; e.ensuite = 'chasse'; e.reveil = 6; texte('Miaou !', e.x, e.y - 40, '#ffffff'); son('miaou'); } }
function voit(e, h){ const E = e.E, dx = h.x - e.x; return !h.mort && Math.abs(dx) < E.vue * T && Math.abs(h.y - e.y) < (E.vole ? 6 * T : 50) && (e.t === 'd' || e.t === 'l' || e.etat === 'chasse' || Math.sign(dx) === e.face || Math.abs(dx) < 2 * T); }
function devantVide(e){ const x = e.x + e.face * (e.w / 2 + 4); return !solide(Math.floor(x / T), Math.floor((e.y + 4) / T)) && tile(Math.floor(x / T), Math.floor((e.y + 4) / T)) !== '=' && tile(Math.floor(x / T), Math.floor((e.y + 4) / T)) !== 'H'; }
const murDevant = e => !!boite(e.x + e.face * (e.w / 2 + 2) - 1, e.y - e.h + 6, e.x + e.face * (e.w / 2 + 2) + 1, e.y - 4);
function ennemis(dt, h){
  const g = G, k = g.D.vit;
  for(const e of g.ens){
    if(!e.vivant) continue; const E = e.E; e.fr += dt;
    if(e.etat === 'fuite'){ e.x += e.face * 260 * dt; e.alpha = (e.alpha === undefined ? 1 : e.alpha) - dt * 1.2; if(e.alpha <= 0) e.vivant = false; continue; }
    if(e.etat === 'etourdi'){ e.tm -= dt; if(e.tm <= 0){ e.etat = E.dort ? 'dort' : E.vole ? 'vol' : 'patrouille'; } gravite(e, dt); continue; }
    if(E.vole){ // la mouette tourne, puis pique sur le héros
      if(e.etat === 'vol'){ e.x = e.x0 + Math.sin(g.t * .8 + e.x0) * 3 * T; e.face = Math.cos(g.t * .8 + e.x0) > 0 ? 1 : -1; e.y = e.y0 - T + Math.sin(g.t * 2.2) * 8; if(voit(e, h) && h.y > e.y && (e.tm -= dt) <= 0){ e.etat = 'pique'; e.cible = { x:h.x, y:h.y - 30 }; e.tm = 0; } }
      else if(e.etat === 'pique'){ const a = Math.atan2(e.cible.y - e.y, e.cible.x - e.x); e.x += Math.cos(a) * 260 * k * dt; e.y += Math.sin(a) * 260 * k * dt; e.face = Math.sign(Math.cos(a)) || e.face; if(Math.hypot(e.cible.x - e.x, e.cible.y - e.y) < 10 || e.y > e.y0 + 8 * T){ e.etat = 'remonte'; } }
      else if(e.etat === 'remonte'){ const a = Math.atan2(e.y0 - T - e.y, e.x0 - e.x); e.x += Math.cos(a) * 150 * dt; e.y += Math.sin(a) * 150 * dt; if(Math.hypot(e.x0 - e.x, e.y0 - T - e.y) < 12){ e.etat = 'vol'; e.tm = 2.5; } }
      touche(e, h); continue; }
    if(e.etat === 'dort'){ gravite(e, dt); touche(e, h); continue; }
    if(e.etat === 'alerte'){ e.tm -= dt; e.face = Math.sign(h.x - e.x) || e.face; if(e.tm <= 0) e.etat = e.ensuite || 'chasse'; gravite(e, dt); touche(e, h); continue; }
    if(e.t === 'l'){ // le marchand : il se tourne vers le héros et lance des oranges
      if(voit(e, h)){ e.face = Math.sign(h.x - e.x) || e.face; e.tir -= dt * k; if(e.tir <= 0){ e.tir = E.tir; e.lance = .35; const dx = h.x - e.x, t = Math.max(.55, Math.min(1.1, Math.abs(dx) / 300)); G.tirs.push({ x:e.x + e.face * 14, y:e.y - 50, vx:dx / t, vy:(h.y - 40 - (e.y - 50)) / t - .5 * PH.g * t, vie:3 }); son('lance'); } }
      e.lance = Math.max(0, (e.lance || 0) - dt); gravite(e, dt); touche(e, h); continue; }
    // patrouille et poursuite
    if(e.etat === 'patrouille'){ e.vx = e.face * E.vit * k; if(murDevant(e) || devantVide(e)) e.face *= -1;
      if(E.chasse && voit(e, h)){ e.etat = 'alerte'; e.tm = e.t === 'd' ? .3 : .5; e.ensuite = 'chasse'; texte('!', e.x, e.y - e.h - 10, '#ff5a5a', 26); if(e.t === 'd') son('ouaf'); } }
    else if(e.etat === 'chasse'){ const dx = h.x - e.x; e.face = Math.sign(dx) || e.face; e.vx = e.face * E.chasse * k;
      if(devantVide(e) && e.t !== 'd'){ e.vx = 0; }
      if(e.t === 'd' && e.sol && (murDevant(e) || Math.random() < dt * .8)){ e.vy = -330; e.sol = false; }
      if(e.reveil !== undefined){ e.reveil -= dt; if(e.reveil <= 0){ e.etat = 'dort'; e.vx = 0; delete e.reveil; } }
      else if(Math.abs(dx) > (E.abandon || 10) * T || Math.abs(h.y - e.y) > 3 * T || h.mort){ e.etat = 'patrouille'; } }
    if(e.etat === 'patrouille' || e.etat === 'chasse'){ const nx = e.x + e.vx * dt; if(!boite(nx - e.w / 2, e.y - e.h + 6, nx + e.w / 2, e.y - 2)) e.x = nx; else if(e.t !== 'd' || e.sol) e.face *= -1; }
    gravite(e, dt); touche(e, h);
  }
  g.ens = g.ens.filter(e => e.vivant);
}
function gravite(e, dt){ if(e.E.vole) return; e.vy = Math.min(PH.chuteMax, e.vy + PH.g * dt); const ny = e.y + e.vy * dt;
  const b = boite(e.x - e.w / 2 + 2, ny - 1, e.x + e.w / 2 - 2, ny); let pose = false;
  if(b && e.vy >= 0){ e.y = b.caisse ? b.caisse.y - 30 : b.cy * T; pose = true; }
  else { const y = Math.floor(ny / T); for(let x = Math.floor((e.x - e.w / 2) / T); x <= Math.floor((e.x + e.w / 2) / T); x++) if((tile(x, y) === '=' || (tile(x, y) === 'H' && tile(x, y - 1) !== 'H')) && e.y <= y * T + .5 && ny >= y * T){ e.y = y * T; pose = true; } }
  if(pose){ e.vy = 0; e.sol = true; } else { e.y = ny; e.sol = false; }
  if(e.y > G.H * T + 100) e.vivant = false; }
function touche(e, h){ if(h.mort || e.etat === 'etourdi' || e.etat === 'fuite' || G.fini) return;
  const ey = e.E.vole ? e.y + e.h / 2 : e.y, haut = ey - e.h;
  if(Math.abs(h.x - e.x) < e.w / 2 + HW - 2 && h.y > haut + 4 && h.y - HH < ey){
    // on lui saute dessus : il est étourdi
    if(h.vy > 60 && h.y - haut < 22){ h.vy = -420; h.tenu = true; coup(e, 1); son('coup'); return; }
    blesse(h, false, e.x); } }
function coup(e, n){ e.pv -= n; eclat(e.x, e.y - e.h / 2, '#ffffff', 10);
  if(e.pv <= 0){ e.etat = 'fuite'; e.face = Math.sign(e.x - G.h.x) || 1; texte(e.t === 'z' ? 'Miaou ! 🐾' : e.t === 'd' ? 'Ouaf… 🐕' : e.t === 'm' ? 'Cuiii !' : 'Ouste ! 💨', e.x, e.y - e.h - 16, '#ffe066', 22); G.chasses = (G.chasses || 0) + 1; }
  else { e.etat = 'etourdi'; e.tm = e.E.etourdi; e.vx = 0; texte('💫', e.x, e.y - e.h - 6, '#ffffff', 22); } }

/* ---------- les oranges lancées ---------- */
function tirs(dt, h){ const g = G;
  g.tirs = g.tirs.filter(t => { t.vy += PH.g * dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vie -= dt; t.rot = (t.rot || 0) + dt * 8;
    if(!h.mort && Math.abs(t.x - h.x) < 16 && t.y > h.y - (h.bas ? HHbas : HH) - 4 && t.y < h.y + 4){ blesse(h, false, t.x); eclat(t.x, t.y, '#ff9f1c', 10); return false; }
    if(boite(t.x - 5, t.y - 5, t.x + 5, t.y + 5)){ eclat(t.x, t.y, '#ff9f1c', 8); return false; }
    return t.vie > 0; }); }

/* ---------- les coups, les vies ---------- */
function blesse(h, cactus, depuis){ const g = G; if(h.inv > 0 || h.mort || g.fini) return;
  g.coeurs--; h.inv = 1.5; son('aie'); h.vy = -330; h.sol = false; h.monte = false; h.vx = (depuis !== undefined ? Math.sign(h.x - depuis) || -h.face : -h.face) * 220;
  if(h.porte){ h.porte.etat = 'pose'; h.porte.x = h.x; h.porte.y = h.y; h.porte = null; }
  if(g.coeurs <= 0) perdVie(); }
function perdVie(){ const g = G, h = g.h; if(h.mort) return; h.mort = true; h.mortT = 0; h.vy = -500; son('chute'); g.vies--; }
function reprise(){ const g = G; if(g.vies <= 0){ etat = 'fin'; S2J.surFin && S2J.surFin({ perdu:true, g }); return; }
  const n = g.n, d = g.diff; charger(n, d, true); G.vies = g.vies; G.dinars = g.dinars; G.coeurs = G.D.coeurs; if(!G.check) { G.h.x = G.depart.x; G.h.y = G.depart.y; } G.h.inv = 1.5; }
function gagne(){ const g = G; if(g.fini) return; g.fini = true; g.h.vx = 0; son('victoire'); eclat(g.h.x, g.h.y - 40, '#ffe066', 30);
  setTimeout(() => { etat = 'fin'; S2J.surFin && S2J.surFin({ perdu:false, g }); }, 1600); }

/* ---------- effets ---------- */
function texte(s, x, y, c = '#ffffff', taille = 18){ G.textes.push({ s, x, y, c, taille, vie:1.4 }); }
function eclat(x, y, c, n = 10){ for(let k = 0; k < n; k++) G.parts.push({ x, y, vx:(Math.random() - .5) * 360, vy:-Math.random() * 300, vie:.7 + Math.random() * .4, c, r:2 + Math.random() * 3 }); }
function effets(dt){ const g = G; g.parts = g.parts.filter(p => { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return (p.vie -= dt) > 0; }); g.textes = g.textes.filter(t => { t.y -= 30 * dt; return (t.vie -= dt) > 0; });
  g.piecesP.forEach(p => { if(p.saute){ p.saute -= dt * 2; if(p.saute < 0) p.saute = 0; } }); }

/* ---------- le héros (planches « en vrai » du Jasmin : 6 × 4 images, 0-11 la foulée, 12-19 le bond, 20 de profil, 21 de face) ---------- */
const PEOPLE = ['essil', 'salma', 'amine', 'anis', 'imen'], TAILLE2 = { amine:.8, salma:.9, essil:.97, nour:.92, yasmine:.92, anis:1.08, imen:1.05, fares:1.04 };
let corps = null;
function idDe(nom){ const k = (nom || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); if(PEOPLE.includes(k)) return k; const h = window.Famille && Famille.head ? Famille.head(nom) : null; return h && TAILLE2[h.id] ? h.id : 'nour'; }
function chargeCorps(nom, tenue){ corps = null; const id = idDe(nom), im = new Image();
  im.onload = () => { const cw = im.naturalWidth / 6, ch = im.naturalHeight / 4, c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(im, 2 * cw, 3 * ch, cw, ch, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data; let top = ch, feet = 0; for(let y = 0; y < ch; y++){ let n = 0; for(let q = 0; q < cw; q++) if(d[(y * cw + q) * 4 + 3] > 120) n++; if(n > 2){ if(y < top) top = y; feet = y; } }
    corps = { im, cw, ch, top, feet, k:TAILLE2[id] }; };
  im.onerror = () => { if(tenue && tenue !== 'classique') chargeCorps(nom, 'classique'); };
  im.src = `jasmin2/corps-${id}${tenue && tenue !== 'classique' ? '-' + tenue : ''}.webp?v=2`; }
const hauteurHeros = () => corps ? 76 * corps.k : 70;
function dessineHeros(t){
  const h = G.h; if(h.inv > 0 && Math.sin(t * 40) > 0 && !h.mort) return;
  ctx.save(); ctx.translate(h.x, h.y);
  if(h.mort) ctx.rotate(Math.min(1.4, h.mortT * 3) * -h.face);
  const sq = h.ecrase || 0; h.ecrase = Math.max(0, sq - .02);
  if(!corps){ ctx.fillStyle = '#1f5fbf'; ctx.fillRect(-10, -60, 20, 60); ctx.restore(); return; }
  const b = corps, sc = 76 * b.k / (b.feet - b.top), w = b.cw * sc, hh = b.ch * sc, run = Math.abs(h.vx) / PH.course;
  let f, sx = 1, sy = 1;
  if(h.mort) f = 15; else if(G.fini) f = 21;
  else if(h.monte){ f = 21; sx = Math.floor((h.pm || 0) / 22) % 2 ? -1 : 1; }
  else if(h.lance > 0) f = 13;
  else if(!h.sol) f = h.vy < -260 ? 13 : h.vy < -90 ? 14 : h.vy < 90 ? 15 : h.vy < 300 ? 16 : 17;
  else if(run > .08) f = Math.floor((((h.phase / (Math.PI * 2)) % 1) + 1) % 1 * 12); else f = 20;
  if(h.bas){ sy = .6; if(run > .05) sx = 1.12; }
  ctx.scale((h.face < 0 && f !== 21 ? -1 : 1) * sx * (1 + sq * .2), sy * (1 - sq * .2));
  if(G.fini) ctx.translate(0, -Math.abs(Math.sin(h.gagne * 7)) * 18);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b.im, (f % 6) * b.cw, Math.floor(f / 6) * b.ch, b.cw, b.ch, -w / 2, -b.feet * sc + 1, w, hh);
  ctx.restore();
}

/* ---------- le dessin ---------- */
let DPR = 1, CW = 0, CH = 0, SC = 1;
function taille(){ DPR = Math.min(2, devicePixelRatio || 1); CW = innerWidth; CH = innerHeight; cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR); SC = Math.min(CH / (VH_CASES * T), CW / (18 * T)); }   // en portrait : au moins 18 cases de large (on voit alors plus de ciel)
addEventListener('resize', taille); taille();
function tuileImg(im, cx, cy, x, y, n = 6){ const s = im.naturalWidth / n; ctx.drawImage(im, (((cx % n) + n) % n) * s, (((cy % n) + n) % n) * s, s, s, x, y, T + .5, T + .5); }
function dessine(t){
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if(!G){ ctx.fillStyle = '#0b1e46'; ctx.fillRect(0, 0, CW, CH); return; }
  const g = G, h = g.h, VW = CW / SC, VHp = CH / SC;
  // la caméra : elle regarde un peu devant, et suit en hauteur
  const cibleX = h.x - VW / 2 + h.face * 70, cibleY = h.y - VHp * .58;
  g.camX += (Math.max(0, Math.min(g.W * T - VW, cibleX)) - g.camX) * .1; const basEnPlus = Math.max(0, VHp - 15 * T);   // écran haut (portrait) : on laisse voir le sous-sol sous la rue, le héros reste au milieu
  g.camY += (Math.max(0, Math.min(g.H * T - VHp + basEnPlus, cibleY)) - g.camY) * .1;
  if(g.W * T < VW) g.camX = (g.W * T - VW) / 2;
  const cx0 = g.camX, cy0 = g.camY;
  // le ciel, la photo du fond (parallaxe), les façades
  const gr = ctx.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, '#7fb8ec'); gr.addColorStop(1, '#f5e6c8'); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH);
  ctx.save(); ctx.scale(SC, SC);
  const fond = W_('fond');
  if(ok(fond)){ const fh = VHp * 1.15, fw = fh * fond.naturalWidth / fond.naturalHeight, px = -(cx0 * .15) % fw, py = -((cy0 - (g.H * T - VHp)) * .25) - (fh - VHp) * .5;
    for(let x = px - fw; x < VW; x += fw) ctx.drawImage(fond, x, py, fw, fh); }
  const mais = W_('maisons');
  if(ok(mais)){ // les façades : posées sur la rue, elles glissent moins vite que le premier plan
    const mh = 10 * T, mw = mh * mais.naturalWidth / mais.naturalHeight, sol = (g.H - 3) * T, px = -(cx0 * .45) % mw, py = sol - mh - cy0 * .6 - (g.H * T - VHp - cy0) * 0;
    ctx.globalAlpha = .92; for(let x = px - mw; x < VW; x += mw) ctx.drawImage(mais, x, py + cy0 * 0 - (cy0 - cy0) , mw, mh); ctx.globalAlpha = 1; }
  ctx.translate(-Math.round(cx0 * 100) / 100, -Math.round(cy0 * 100) / 100);
  // les cases
  const x0 = Math.max(0, Math.floor(cx0 / T) - 1), x1 = Math.min(g.W - 1, Math.ceil((cx0 + VW) / T) + 1), y0 = Math.max(0, Math.floor(cy0 / T) - 1), y1 = Math.ceil((cy0 + VHp) / T) + 1;
  const mur = W_('t_mur'), dessus = W_('t_dessus'), planche = W_('t_planche'), fiss = W_('t_fissure'), ech = W_('echelle'), grille = W_('grille'), verrou = W_('porte_verrou');
  for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
    const c = y < g.H ? g.m[y][x] : (SOLIDES.includes(g.m[g.H - 1][x]) ? '#' : '.'), X = x * T, Y = y * T;
    if(c === '#' || c === 'F' || c === 'B'){
      const im = c === 'B' && ok(fiss) ? fiss : mur;
      if(ok(im)) tuileImg(im, x, y, X, Y); else { ctx.fillStyle = c === 'B' ? '#c9b48e' : '#e8dcc4'; ctx.fillRect(X, Y, T + .5, T + .5); }
      if(c === 'B' && !ok(fiss)){ ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 6, Y + 4); ctx.lineTo(X + 16, Y + 16); ctx.lineTo(X + 10, Y + 28); ctx.stroke(); }
      const dessusLibre = y < g.H && !SOLIDES.includes(tile(x, y - 1)) || tile(x, y - 1) === 'G';
      if(dessusLibre && c !== 'B'){ if(ok(dessus)) ctx.drawImage(dessus, ((x % 6) + 6) % 6 * dessus.naturalWidth / 6, 0, dessus.naturalWidth / 6, dessus.naturalHeight, X, Y - 4, T + .5, 12); else { ctx.fillStyle = '#2f8f5b'; ctx.fillRect(X, Y - 3, T + .5, 9); } }
      if(dessusLibre){ ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(X, Y + 8, T + .5, 3); }
    } else if(c === '='){ if(ok(planche)) ctx.drawImage(planche, ((x % 4) + 4) % 4 * planche.naturalWidth / 4, 0, planche.naturalWidth / 4, planche.naturalHeight / 6, X, Y, T + .5, 12); else { ctx.fillStyle = '#2b8a8a'; ctx.fillRect(X, Y, T + .5, 10); } ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(X, Y + 12, T + .5, 2); }
    else if(c === 'H'){ if(ok(ech)){ const s = ech.naturalHeight / 2; ctx.drawImage(ech, 0, (y % 2) * s, ech.naturalWidth, s, X - 4, Y, T + 8, T + .5); } else { ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X + 6, Y); ctx.lineTo(X + 6, Y + T); ctx.moveTo(X + 26, Y); ctx.lineTo(X + 26, Y + T); ctx.moveTo(X + 6, Y + 10); ctx.lineTo(X + 26, Y + 10); ctx.moveTo(X + 6, Y + 26); ctx.lineTo(X + 26, Y + 26); ctx.stroke(); } }
    else if(c === '^'){ const ca = IM.cactus; if(ok(ca)){ const hh = 40, ww = hh * ca.naturalWidth / ca.naturalHeight; ctx.drawImage(ca, X + 16 - ww / 2, Y + T - hh, ww, hh); } else { ctx.fillStyle = '#3d8b3d'; ctx.beginPath(); ctx.moveTo(X, Y + T); ctx.lineTo(X + 16, Y + 6); ctx.lineTo(X + 32, Y + T); ctx.fill(); } }
    else if(c === 'G'){ const ouv = g.ouvert.has(x + ',' + y); if(!ouv || (g.ouvreT = g.ouvreT || {})){ ctx.save(); if(ouv) ctx.globalAlpha = .18; if(ok(grille)) ctx.drawImage(grille, 0, ((y % 3) + 3) % 3 * grille.naturalHeight / 3, grille.naturalWidth, grille.naturalHeight / 3, X - 2, Y, T + 4, T + .5); else { ctx.fillStyle = '#222'; for(let k = 4; k < T; k += 9) ctx.fillRect(X + k, Y, 3, T); } ctx.restore(); } }
    else if(c === 'D'){ if(!g.ouvert.has(x + ',' + y) && tile(x, y - 1) !== 'D'){ let n = 0; while(tile(x, y + n) === 'D') n++; if(ok(verrou)) ctx.drawImage(verrou, X - 10, Y, T + 20, n * T); else { ctx.fillStyle = '#1f5fbf'; ctx.fillRect(X - 6, Y, T + 12, n * T); ctx.fillStyle = '#222'; ctx.fillRect(X + 10, Y + n * T / 2, 12, 14); } } }
  }
  // la sortie, les lanternes, les panneaux, les leviers
  if(g.sortie){ const ps = W_('porte_sortie'), w = 72, hh = 104; if(ok(ps)) ctx.drawImage(ps, g.sortie.x - w / 2, g.sortie.y - hh, w, hh); else { ctx.fillStyle = '#1f5fbf'; ctx.fillRect(g.sortie.x - 30, g.sortie.y - 90, 60, 90); }
    ctx.fillStyle = '#ffe066'; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SORTIE', g.sortie.x, g.sortie.y - hh - 6); }
  g.lanternes.forEach(l => { const im = IM.lanterne; if(l.on){ const r = ctx.createRadialGradient(l.x, l.y - 50, 4, l.x, l.y - 50, 60); r.addColorStop(0, 'rgba(255,220,120,.55)'); r.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = r; ctx.fillRect(l.x - 60, l.y - 110, 120, 120); }
    if(ok(im)){ const hh = 56, w = hh * im.naturalWidth / im.naturalHeight; ctx.save(); if(!l.on) ctx.filter = 'grayscale(.7) brightness(.8)'; ctx.drawImage(im, l.x - w / 2, l.y - hh, w, hh); ctx.restore(); } });
  g.panneaux.forEach(p => { const im = IM.panneau; if(ok(im)){ const hh = 46, w = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, p.x - w / 2, p.y - hh, w, hh); } else { ctx.fillStyle = '#8a5a2b'; ctx.fillRect(p.x - 14, p.y - 40, 28, 22); ctx.fillRect(p.x - 2, p.y - 18, 4, 18); }
    ctx.fillStyle = '#fff'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', p.x, p.y - 26); });
  g.leviers.forEach(l => { const im = W_('levier'), hh = 40; ctx.save(); ctx.translate(l.x, l.y); if(l.on) ctx.scale(1, -1); if(ok(im)){ const w = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, -w / 2, -hh / 2, w, hh); } else { ctx.fillStyle = '#555'; ctx.fillRect(-10, -8, 20, 16); ctx.fillStyle = '#c4122f'; ctx.fillRect(-3, -22, 6, 16); } ctx.restore(); });
  // les plateformes mobiles
  g.plats.forEach(p => { if(ok(planche)) ctx.drawImage(planche, 0, 0, planche.naturalWidth / 2, planche.naturalHeight / 6, p.x, p.y, p.w, 14); else { ctx.fillStyle = '#2b8a8a'; ctx.fillRect(p.x, p.y, p.w, 12); } ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(p.x, p.y + 14, p.w, 3); });
  // dinars et jasmins
  const pc = IM.piece, jo = IM.jasmin;
  g.piecesP.forEach(p => { if(!p.ok) return; const bob = Math.sin(t * 4 + p.x) * 2 - (p.saute || 0) * 20; if(ok(pc)){ const s = 22; ctx.drawImage(pc, p.x - s / 2, p.y - s / 2 + bob, s, s); } else { ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 9, 0, 7); ctx.fill(); } });
  g.gemmes.forEach(j => { const bob = Math.sin(t * 3) * 4; if(ok(jo)){ const s = 34; ctx.drawImage(jo, j.x - s / 2, j.y - s / 2 + bob, s, s); } else { ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(j.x, j.y + bob, 12, 0, 7); ctx.fill(); } });
  // les objets
  g.objs.forEach(o => dessineObjet(o));
  // les ennemis
  g.ens.forEach(e => dessineEnnemi(e, t));
  // le héros
  dessineHeros(t);
  if(g.h.porte) dessineObjet(g.h.porte, true);
  // les oranges
  g.tirs.forEach(o => { const im = IM.orange; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot); if(ok(im)) ctx.drawImage(im, -9, -9, 18, 18); else { ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); } ctx.restore(); });
  g.parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.vie * 2); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
  g.textes.forEach(x => { ctx.globalAlpha = Math.min(1, x.vie * 2); ctx.font = `800 ${x.taille}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,20,40,.7)'; ctx.strokeText(x.s, x.x, x.y); ctx.fillStyle = x.c; ctx.fillText(x.s, x.x, x.y); }); ctx.globalAlpha = 1;
  ctx.restore();
  hud(t);
}
function dessineObjet(o, porte){
  const k = o.k, im = k === 'J' ? IM.jarre : W_({ C:'caisse', O:'ballon', P:'pierre', S:'sac', K:'cle' }[k]);
  const hh = { C:32, J:38, O:24, P:22, S:32, K:18 }[k];
  ctx.save(); ctx.translate(o.x, o.y); if(o.etat === 'vol' && k !== 'C' && k !== 'S') ctx.rotate(o.rot || 0);
  if(ok(im)){ const w = Math.min(44, hh * im.naturalWidth / im.naturalHeight); ctx.drawImage(im, -w / 2, -hh, w, hh); }
  else { ctx.fillStyle = { C:'#a0703a', J:'#c87b3e', O:'#8b5a2b', P:'#888', S:'#c8a96b', K:'#333' }[k]; if(k === 'O' || k === 'P'){ ctx.beginPath(); ctx.arc(0, -hh / 2, hh / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-hh / 2, -hh, hh, hh); }
  ctx.restore();
  if(!porte && o.etat === 'pose' && G.h && !G.h.porte && Math.abs(o.x - G.h.x) < 44 && Math.abs(o.y - G.h.y) < 36){ ctx.fillStyle = '#ffe066'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✋', o.x, o.y - hh - 8 + Math.sin(performance.now() / 200) * 3); }
}
function dessineEnnemi(e, t){
  ctx.save(); if(e.alpha !== undefined) ctx.globalAlpha = Math.max(0, e.alpha);
  const ey = e.E.vole ? e.y + e.h / 2 : e.y;
  ctx.translate(e.x, ey);
  const nom = ANIM[e.t], an = nom && IM['a_' + nom], fixe = nom && IM['f_' + nom], bouge = Math.abs(e.vx) > 5 || e.E.vole;
  let hh = e.h + 4;
  if(e.t === 'z' || e.t === 'm'){ const im = e.t === 'z' ? IM.chat : IM.mouette, n = 12; hh = e.t === 'z' ? 40 : 52;
    if(ok(im)){ const cw = im.naturalWidth / n, ch = im.naturalHeight, w = hh * cw / ch, f = e.etat === 'dort' || e.etat === 'etourdi' ? 0 : Math.floor(t * 14) % n; ctx.scale(e.face < 0 ? -1 : 1, 1); ctx.drawImage(im, f * cw, 0, cw, ch, -w / 2, -hh + (e.t === 'm' ? 16 : 2), w, hh); }
    else { ctx.fillStyle = e.t === 'z' ? '#d98b3a' : '#eee'; ctx.fillRect(-e.w / 2, -e.h, e.w, e.h); } }
  else if(ok(an)){ const cw = an.naturalWidth / 12, ch = an.naturalHeight, w = hh * cw / ch, f = e.t === 'l' ? (e.lance > 0 ? 0 : Math.max(0, Math.min(11, Math.floor((1 - e.tir / e.E.tir) * 12)))) : bouge ? Math.floor(t * (e.etat === 'chasse' ? 18 : 11)) % 12 : 0; ctx.scale(e.face < 0 ? -1 : 1, 1); ctx.drawImage(an, f * cw, 0, cw, ch, -w / 2, -hh, w, hh); }
  else if(ok(fixe)){ const w = hh * fixe.naturalWidth / fixe.naturalHeight, bob = bouge ? Math.abs(Math.sin(t * 12)) * 3 : 0; ctx.scale(e.face < 0 ? -1 : 1, 1); if(e.t === 'l' && e.lance > 0) ctx.rotate(-.08); ctx.drawImage(fixe, -w / 2, -hh - bob, w, hh); }
  else { ctx.fillStyle = e.t === 'd' ? '#c9a46b' : '#7a7a7a'; ctx.fillRect(-e.w / 2, -e.h, e.w, e.h); ctx.fillStyle = '#c4122f'; if(e.t !== 'd') ctx.fillRect(-8, -e.h - 8, 16, 9); }
  ctx.restore();
  // les petits signes : z z z, !, étoiles
  ctx.save(); ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; const top = ey - hh - 8;
  if(e.etat === 'dort'){ ctx.fillStyle = '#ffffff'; ctx.fillText('z', e.x + 10 + Math.sin(t * 2) * 3, top - (t * 12 % 18)); ctx.fillText('z', e.x + 18, top - 8 - ((t * 12 + 9) % 18)); }
  if(e.etat === 'alerte'){ ctx.fillStyle = '#ff5a5a'; ctx.font = '800 26px "Baloo 2", sans-serif'; ctx.fillText('!', e.x, top); }
  if(e.etat === 'etourdi'){ for(let k = 0; k < 3; k++){ const a = t * 4 + k * 2.1; ctx.fillStyle = '#ffe066'; ctx.fillText('★', e.x + Math.cos(a) * 14, top + 6 + Math.sin(a) * 4); } }
  ctx.restore();
}
function hud(t){
  const g = G; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pad = 14 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sal')) || 0);
  ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const ligne = (s, x, y) => { ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,20,40,.65)'; ctx.strokeText(s, x, y); ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); };
  let x = pad; for(let i = 0; i < g.D.coeurs; i++){ ligne(i < g.coeurs ? '❤️' : '🤍', x, 28); x += 28; }
  ligne(`× ${g.vies}`, x + 6, 28);
  ligne(`🪙 ${g.dinars}`, pad, 62); ligne(`🌼 ${g.jasmins.size}/3`, pad + 96, 62);
  if(g.h.porte){ ctx.textAlign = 'center'; ligne(`Tu portes ${leLa(g.h.porte.O.nom)}`, CW / 2, 28); }
  if(g.indice && etat === 'jeu'){ ctx.font = '800 19px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; const w = Math.min(CW - 40, ctx.measureText(g.indice).width + 36), y = CH - (document.body.classList.contains('touch') ? 170 : 44);
    ctx.fillStyle = 'rgba(11,30,70,.82)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(CW / 2 - w / 2, y - 22, w, 44, 14) : ctx.rect(CW / 2 - w / 2, y - 22, w, 44); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.fillText(g.indice, CW / 2, y + 1, CW - 60); }
  ctx.textBaseline = 'alphabetic';
}

/* ---------- ce que la page utilise ---------- */
const S2J = window.S2J = {
  son:true, voix:true, surFin:null,
  joueur(nom, tenue){ chargeCorps(nom, tenue); },
  lancer(n, diff){ audio(); if(!charger(n, diff)) return false; etat = 'jeu'; reste = 0; dernier = performance.now(); saut = agir = lancer = false; return true; },
  pause(){ if(etat === 'jeu'){ etat = 'pause'; return true; } return false; },
  reprendre(){ if(etat === 'pause'){ etat = 'jeu'; dernier = performance.now(); } },
  basculePause(){ if(etat === 'jeu'){ etat = 'pause'; S2J.surPause && S2J.surPause(); } else if(etat === 'pause'){ S2J.surReprise && S2J.surReprise(); } },
  quitter(){ etat = 'menu'; G = null; },
  etat: () => etat, G: () => G
};
requestAnimationFrame(boucle);
})();
