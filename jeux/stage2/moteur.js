/* La Légende du Jasmin — Stage 2 : le moteur (14-15/11/2026).
   Canvas 2D, pas fixe de 1/120 s, cartes en lettres (cartes/m<n>.js), réglages dans niveaux.js.
   Le héros : marcher, sauter (↑), s'accroupir et ramper (↓), grimper aux échelles, ramasser / poser (↓ + Espace),
   lancer (Espace), passages secrets (rester accroupi), scooter et tapis volant.
   Le monde : planches, échelles, caisses, leviers et grilles, portes à clé, murs fissurés, sol glissant, sable mou, eau,
   tuiles qui s'effondrent, auvents qui font rebondir, rochers qui tombent, plateformes, trains et barques, noir des souterrains.
   Les ennemis ont des états (dort → patrouille → alerte → poursuite → étourdi → fuite) ; deux boss.
   La page (jasmin-stage2.html) fournit les écrans ; le moteur expose window.S2J. */
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
  panneau:'jasmin3/m1/panneau.webp', cactus:'jasmin2/cactus.webp', orange:'jasmin2/obj-orange.webp', braise:'jasmin2/obj-braise.webp',
  tapis:'jasmin3/m1/tapis.webp', train:'jasmin3/m1/train.webp', barque:'jasmin3/m1/barque.webp', scooter:'stage2/en/scooter.webp' };
Object.entries(BASE).forEach(([k, s]) => img(k, s + '?v=1'));
// les images des ennemis : bandes de 12 images tournées vers la droite (rows lignes), et parfois une image fixe de secours
const SPR = {
  garde:{ f:'stage2/garde-anim.webp', fixe:'stage2/en/garde.webp', h:66 }, chien:{ f:'stage2/chien-anim.webp', fixe:'stage2/en/chien.webp', h:40 },
  marchand:{ f:'stage2/marchand-anim.webp', fixe:'stage2/en/marchand.webp', h:64 },
  chat:{ f:'jasmin2/chat.webp', h:40, dy:2 }, mouette:{ f:'jasmin2/mouette.webp', h:52, dy:16 }, faucon:{ f:'jasmin2/faucon.webp', h:58, dy:18 },
  chauve:{ f:'jasmin2/chauve-souris.webp', h:40, dy:10 }, scorpion:{ f:'jasmin2/scorpion.webp', h:34, dy:2 }, crabe:{ f:'jasmin2/crabe.webp', h:30, dy:2 },
  chevre:{ f:'jasmin2/chevre-anim.webp', h:44, dy:2 }, scorpionor:{ f:'jasmin2/scorpion-or.webp', rows:3, h:128, dy:2 },
  rat:{ f:'stage2/rat-anim.webp', fixe:'stage2/en/rat.webp', h:26, dy:1 }, serpent:{ f:'stage2/serpent-anim.webp', fixe:'stage2/en/serpent.webp', h:40, dy:2 },
  voleur:{ f:'stage2/voleur-anim.webp', fixe:'stage2/en/voleur.webp', h:62 }, controleur:{ f:'stage2/controleur-anim.webp', fixe:'stage2/en/controleur.webp', h:66 }
};
function sprite(nom){ const s = SPR[nom]; if(!s) return null; if(!s.im){ s.im = img('sp_' + nom, s.f + '?v=2'); if(s.fixe) s.fx = img('spf_' + nom, s.fixe + '?v=2'); if(PRIS[nom]) s.pr = img('spp_' + nom, 'stage2/pris/' + PRIS[nom] + '.webp?v=1'); } return s; }
// 16/11 : les ennemis qu'on attrape par derrière (ou étourdis), qu'on porte au-dessus de la tête et qu'on lance ; leur image « capturé, tout triste »
const PRIS = { garde:'garde', chien:'chien', marchand:'marchand', voleur:'voleur', controleur:'controleur', rat:'rat', serpent:'serpent', chat:'chat', scorpion:'scorpion', crabe:'crabe', chevre:'chevre' };
const attrapable = e => e.vivant && e.E.type !== 'boss' && e.E.type !== 'vol' && !(e.E.type === 'serpent' && e.etat === 'cache') && !['fuite', 'porte', 'lance'].includes(e.etat);
const MI1 = MONDES[0].img;
function imagesMonde(n){ MI1.forEach(k => img('m1' + k, `stage2/m1/${k}.webp?v=2`)); const M = MONDES.find(m => m.n === n); if(n !== 1) (M.img || []).forEach(k => img('m' + n + k, `stage2/m${n}/${k}.webp?v=2`)); }
const W_ = k => { const a = IM['m' + G.n + k]; return ok(a) ? a : IM['m1' + k]; };

/* ---------- sons ---------- */
let AC = null, master = null;
function audio(){ if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .8; master.connect(AC.destination); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; }
if(window.Sons) Sons.charger('jasmin', ['saut', 'atterrir', 'piece', 'gemme', 'lampe', 'aie', 'chute', 'brique', 'ressort', 'victoire', 'bonus', 'portail', 'ecrase', 'plouf']);
function bip(f, d, type = 'triangle', v = .12, slide = 0){ if(!AC || !S2J.son) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); }
const SND = { saut:['saut', () => bip(420, .14, 'square', .07, 300)], pose:['atterrir', () => bip(160, .08)], piece:['piece', () => { bip(988, .06); bip(1318, .1); }], gemme:['gemme', () => bip(660, .4, 'sine', .15, 600)],
  lampe:['lampe', () => bip(523, .3, 'sine')], aie:['aie', () => bip(220, .25, 'sawtooth', .1, -120)], chute:['chute', () => bip(300, .6, 'triangle', .12, -250)], casse:['brique', () => bip(120, .2, 'square', .12, -60)],
  ressort:['ressort', () => bip(300, .3, 'sine', .14, 500)], victoire:['victoire', () => bip(784, .6, 'sine')], bonus:['bonus', () => bip(880, .3)], porte:['portail', () => bip(330, .4, 'sine', .12, 200)], coup:['ecrase', () => bip(180, .12, 'square', .12)],
  plouf:['plouf', () => bip(200, .3, 'sine', .14, -120)],
  prend:[null, () => bip(600, .07, 'sine', .1, 200)], lance:[null, () => bip(500, .12, 'triangle', .1, -250)], levier:[null, () => { bip(200, .05, 'square'); bip(260, .08, 'square'); }], miaou:[null, () => bip(700, .35, 'sine', .1, -300)], ouaf:[null, () => { bip(200, .08, 'square', .14); }],
  vroum:[null, () => bip(90, .5, 'sawtooth', .08, 60)], attrape:[null, () => bip(500, .3, 'sine', .1, -300)], jete:[null, () => bip(600, .25, 'triangle', .1, -400)], strike:[null, () => { bip(150, .2, 'square', .12, -80); bip(900, .15); }], fete:[null, () => bip(784, .6, 'sine')], passage:[null, () => bip(260, .4, 'sine', .12, 400)], vole:[null, () => { bip(500, .1, 'sine', .08, -200); }] };
/* 16/11 : les sons ElevenLabs du Stage 2 (stage2/son.php : ambiances des mondes 11 à 20, attraper, lancer un ennemi, strike, fête)
   et l'ambiance de chaque monde en boucle (sinon celle du Jasmin la plus proche, sons/jasmin-amb-<n>.mp3) */
const S2SON = 'stage2/son.php', BUF2 = {}; let liste2 = null;
async function listeSons(){ if(liste2) return liste2; try{ liste2 = await fetch(S2SON + '?liste=1').then(r => r.json()); }catch(e){ liste2 = []; } return liste2; }
async function tampon(url){ const a = audio(); if(!a) return null; try{ const b = await fetch(url).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }); return await new Promise((ok, ko) => a.decodeAudioData(b, ok, ko)); }catch(e){ return null; } }
async function chargeSon2(k){ if(BUF2[k] !== undefined) return BUF2[k]; BUF2[k] = null; const l = (await listeSons()).filter(n => n.slice(0, -1) === k); if(!l.length) return null; BUF2[k] = await tampon(S2SON + '?n=' + l[Math.floor(Math.random() * l.length)]); return BUF2[k]; }
['attrape', 'jete', 'strike', 'fete'].forEach(k => setTimeout(() => chargeSon2(k), 1500));
function joue2(k, v = .9){ const b = BUF2[k]; if(!b || !AC) return false; const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = v; s.buffer = b; s.connect(g); g.connect(master); s.start(); return true; }
let amb = null;
async function ambiance(M){ ambStop(); if(!M) return; const a = audio(); if(!a) return; const jeton = {}; amb = { jeton };
  let b = M.amb ? await chargeSon2(M.amb) : null; if(!b && M.ambJ) b = await tampon(`sons/jasmin-amb-${M.ambJ}.mp3`);
  if(!b || !amb || amb.jeton !== jeton) return; const src = a.createBufferSource(), g = a.createGain(); g.gain.value = 0; src.buffer = b; src.loop = true; src.connect(g); g.connect(a.destination); src.start();
  g.gain.linearRampToValueAtTime(S2J.son ? .32 : 0, a.currentTime + 1.5); amb.src = src; amb.g = g; }
function ambStop(){ if(amb && amb.src){ try{ amb.src.stop(); }catch(e){} } amb = null; }
function ambVolume(v){ if(amb && amb.g && AC){ amb.g.gain.cancelScheduledValues(AC.currentTime); amb.g.gain.setTargetAtTime(v, AC.currentTime, .2); } }
function son(k){ if(!S2J.son) return; audio(); if({ attrape:1, jete:1, strike:1, fete:1 }[k] && joue2(k)) return; const s = SND[k]; if(!s) return; if(s[0] && window.Sons && Sons.jouer(AC, master, s[0], .8)) return; s[1](); }
function dire(t){ if(!S2J.voix) return; try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[◀▶▲▼←→↑↓✋🎯★🔒🔑]/g, ' ').replace(/\+/g, ' plus ')); u.lang = 'fr-FR'; u.rate = .95; speechSynthesis.speak(u); }catch(e){} }

/* ---------- commandes (15/11, liste du papa) ----------
   ← → marcher · ↑ sauter (↑ avec ← ou → : saut en avançant ; devant une échelle : monter) · ↓ s'accroupir (↓ avec ← → : ramper)
   ↓ + Espace : ramasser / déposer · Espace : lancer (ou tirer un levier) · rester accroupi : passage secret */
const K = { l:0, r:0, u:0, d:0, run:0 }, TCH = { dx:0, dy:0, a:0 };
let saut = false, agir = false, lancer = false, tchHaut = false;
const espace = baisse => { if(baisse) agir = true; else lancer = true; };
const kd = (e, v) => { const c = e.code;
  if(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(c)) e.preventDefault();
  if(c === 'ArrowLeft' || c === 'KeyA' || c === 'KeyQ') K.l = v; if(c === 'ArrowRight' || c === 'KeyD') K.r = v;
  if(c === 'ArrowUp' || c === 'KeyW' || c === 'KeyZ'){ if(v && !K.u) saut = true; K.u = v; }
  if(c === 'ArrowDown' || c === 'KeyS') K.d = v;
  if(c === 'ShiftLeft' || c === 'ShiftRight') K.run = v;
  if(v && !e.repeat){ if(c === 'Space') espace(K.d || TCH.dy > .55); if(c === 'KeyE') agir = true; if(c === 'KeyF') lancer = true; if(c === 'Escape' || c === 'KeyP') S2J.basculePause(); } };
addEventListener('keydown', e => kd(e, 1)); addEventListener('keyup', e => kd(e, 0));
addEventListener('blur', () => { Object.keys(K).forEach(k => K[k] = 0); TCH.dx = TCH.dy = 0; TCH.a = 0; });
// le joystick (à gauche) : on pose le pouce où l'on veut ; vers le haut = sauter / monter, vers le bas = s'accroupir
(function(){
  const z = $('joy'), base = $('joyBase'), knob = $('joyKnob'); if(!z) return; let id = null, ox = 0, oy = 0;
  const R = 56, maj = (x, y) => { let dx = x - ox, dy = y - oy; const d = Math.hypot(dx, dy); if(d > R){ dx *= R / d; dy *= R / d; } knob.style.transform = `translate(${dx}px,${dy}px)`; TCH.dx = dx / R; TCH.dy = dy / R;
    const haut = TCH.dy < -.6; if(haut && !tchHaut) saut = true; tchHaut = haut; };
  z.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; const r = z.getBoundingClientRect(); ox = e.clientX; oy = e.clientY; base.style.left = (ox - r.left) + 'px'; base.style.top = (oy - r.top) + 'px'; base.classList.add('on'); maj(ox, oy); try{ z.setPointerCapture(id); }catch(_){} audio(); });
  z.addEventListener('pointermove', e => { if(e.pointerId === id) maj(e.clientX, e.clientY); });
  const fin = e => { if(e.pointerId !== id) return; id = null; TCH.dx = TCH.dy = 0; tchHaut = false; knob.style.transform = ''; base.classList.remove('on'); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => z.addEventListener(t, fin));
  const btn = (el, f, tenu) => { if(!el) return; el.addEventListener('pointerdown', e => { e.preventDefault(); audio(); el.classList.add('on'); f(); if(tenu) TCH.a = 1; try{ el.setPointerCapture(e.pointerId); }catch(_){} });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => el.addEventListener(t, () => { el.classList.remove('on'); if(tenu) TCH.a = 0; })); el.addEventListener('contextmenu', e => e.preventDefault()); };
  btn($('bSaut'), () => saut = true, true); btn($('bAgir'), () => agir = true); btn($('bLancer'), () => espace(TCH.dy > .55));
})();
let padAv = {};
function manette(){ const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null; if(!gp) return {};
  const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = i => gp.buttons[i] && gp.buttons[i].pressed;
  const s = { l:ax < -.35 || b(14), r:ax > .35 || b(15), u:ay < -.5 || b(12), d:ay > .5 || b(13), a:b(0), esp:b(1), e:b(2), p:b(9) };
  if((s.a && !padAv.a) || (s.u && !padAv.u)) saut = true; if(s.esp && !padAv.esp) espace(s.d); if(s.e && !padAv.e) agir = true; if(s.p && !padAv.p) S2J.basculePause(); padAv = s; return s; }

/* ---------- le monde ---------- */
let G = null;
const SOLIDES = '#BGDIYXU';
function tile(cx, cy){ if(cx < 0 || cx >= G.W) return '#'; if(cy < 0) return '.'; if(cy >= G.H) return '.'; return G.m[cy][cx]; }
function solide(cx, cy){ const c = tile(cx, cy);
  if(c === '#' || c === 'B' || c === 'I' || c === 'Y' || c === 'U') return true;
  if(c === 'G' || c === 'D') return !G.ouvert.has(cx + ',' + cy);
  if(c === 'X'){ const e = G.eff.get(cx + ',' + cy); return !e || e.etat !== 'tombe'; }
  return false; }
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
    ouvert:new Set(), eff:new Map(), rochers:[], vehicules:[], passages:[], attente:[], dinars:0, jasmins:new Set(), coeurs:d.coeurs, vies:d.vies, check:null, camX:0, camY:0, fini:false, perdu:false, indice:'', boss:null, bossVaincu:false };
  let ip = 0, ie = 0;
  const pl = M.plat || { dist:4, vit:.9 };
  for(let y = 0; y < G.H; y++) for(let x = 0; x < G.W; x++){
    const c = G.m[y][x], px = x * T + 16, py = (y + 1) * T;
    const vide = () => G.m[y][x] = '.';
    if(c === '@'){ G.depart = { x:px, y:py }; vide(); }
    else if(c === 'E'){ G.sortie = { x:px, y:py }; vide(); }
    else if(c === 'c'){ G.lanternes.push({ x:px, y:py, on:false }); vide(); }
    else if(c === '!'){ G.panneaux.push({ x:px, y:py, txt:'', lu:false }); vide(); }
    else if(c === '$'){ G.piecesP.push({ x:px, y:py - 12, ok:true }); vide(); }
    else if(c === '*'){ G.gemmes.push({ x:px, y:py - 14, id:x + ',' + y }); vide(); }
    else if(c === 'L'){ G.leviers.push({ x:px, y:py - 16, on:false }); vide(); }
    else if(c === 'T'){ G.passages.push({ x:px, y:py, cx:x, cy:y }); vide(); }
    else if(c === 'R'){ G.rochers.push({ x:px, y0:y * T + 4, y:y * T + 4, vy:0, etat:'attend', t:0 }); vide(); }
    else if(c === 'N' || c === 'A'){ G.vehicules.push({ k:c, x:px, y:c === 'A' ? py - 20 : py, x0:px, y0:c === 'A' ? py - 20 : py }); vide(); }
    else if(c === 'M' || c === 'V'){ G.plats.push({ x0:x * T, y0:y * T, x:x * T, y:y * T, w:2 * T, ax:c === 'M' ? 'x' : 'y', dist:pl.dist * T, vit:pl.vit, dx:0, dy:0 }); vide(); }
    else if(c === 'Q'){ G.plats.push({ x0:x * T, y0:y * T, x:x * T, y:y * T, w:5 * T, ax:'x', dist:(M.train || 12) * T, vit:.45, dx:0, dy:0, train:true }); vide(); }
    else if(OBJETS[c]){ const O = OBJETS[c]; G.objs.push({ k:c, O, x:px, y:py, x0:px, y0:py, vx:0, vy:0, etat:'pose', solide:!!O.solide, rebonds:0, resp:!!M.boss || c === 'K' }); vide(); }
    else if(ENNEMIS[c]){ const E = ENNEMIS[c]; ie++; const garde = E.type === 'boss' || (ie % 10) / 10 < d.garde || ie === 1 || E.type === 'voleur'; if(garde) G.ens.push(nouvelEnnemi(c, E, px, py)); vide(); }
  }
  // les panneaux et les passages secrets se comptent de gauche à droite (les passages vont par deux)
  G.panneaux.sort((a, b) => a.x - b.x || a.y - b.y).forEach(p => p.txt = (M.panneaux || [])[ip++] || '');
  G.passages.sort((a, b) => a.x - b.x || a.y - b.y);
  // un peu moins d'ennemis en Facile et Normal (un sur deux, un sur cinq), jamais les boss
  G.ens = G.ens.filter((e, i) => e.E.type === 'boss' || d.garde >= 1 || (d.garde >= .8 ? i % 5 !== 4 : i % 2 === 0));
  G.boss = G.ens.find(e => e.E.type === 'boss') || null; if(G.boss){ G.boss.pv = G.boss.pvMax = d.boss; M.boss = true; }
  G.objs.forEach(o => o.resp = !!G.boss || o.k === 'K');
  const h = { x:G.depart.x, y:G.depart.y, vx:0, vy:0, face:1, sol:false, coyote:0, tampon:0, tenu:false, monte:false, bas:false, porte:null, inv:0, phase:0, lance:0, mort:false, gagne:0, sur:null, sauf:{ x:G.depart.x, y:G.depart.y }, passT:0, vehicule:null, desc:0 };
  G.h = h;
  if(depuisReprise && ancien && ancien.n === n && ancien.check){ h.x = ancien.check.x; h.y = ancien.check.y; h.sauf = { x:h.x, y:h.y }; G.check = ancien.check; G.dinars = ancien.dinars; G.jasmins = ancien.jasmins; G.vies = ancien.vies;
    ancien.lanternes.forEach((l, i) => { if(l.on) G.lanternes[i].on = true; }); ancien.piecesP.forEach((p, i) => { if(i < G.piecesP.length && !p.ok) G.piecesP[i].ok = false; }); G.gemmes = G.gemmes.filter(g => !G.jasmins.has(g.id)); G.ouvert = ancien.ouvert; G.cassees = ancien.cassees; (G.cassees || []).forEach(k => { const [x, y] = k.split(',').map(Number); G.m[y][x] = '.'; }); ancien.leviers.forEach((l, i) => G.leviers[i].on = l.on); G.clesUsees = ancien.clesUsees; if(ancien.clesUsees) G.objs = G.objs.filter(o => !o.O.cle);
    if(ancien.bossVaincu){ G.bossVaincu = true; G.ens = G.ens.filter(e => e.E.type !== 'boss'); G.boss = null; } }
  G.camX = h.x - 300; G.camY = h.y - 300;
  return true;
}
function nouvelEnnemi(t, E, x, y){
  const ta = E.taille || [20, 40];
  const e = { t, E, x, y, x0:x, y0:y, vx:0, vy:0, face:-1, etat:E.dort ? 'dort' : E.suspendu ? 'pendu' : E.type === 'vol' ? 'vol' : E.type === 'serpent' ? 'cache' : E.type === 'boss' ? 'attend' : 'patrouille', pv:E.pv, w:ta[0], h:ta[1], tm:0, tir:E.tir || 0, vivant:true, sol:true, fr:0, vole:0 };
  if(E.suspendu){ e.y = y - T + 2; e.y0 = e.y; }   // la chauve-souris pend au plafond au-dessus de sa case
  return e;
}

/* ---------- la boucle ---------- */
let etat = 'menu', dernier = 0, reste = 0;
function boucle(now){
  requestAnimationFrame(boucle);
  let dt = Math.min(.1, (now - dernier) / 1000); dernier = now;
  if(etat === 'jeu' && G){ reste += dt; while(reste >= STEP){ pas(STEP); reste -= STEP; } }
  dessine(now / 1000);
}

function entrees(){
  const pad = manette();
  const dx = (K.r || pad.r ? 1 : 0) - (K.l || pad.l ? 1 : 0) + (Math.abs(TCH.dx) > .3 ? Math.sign(TCH.dx) : 0);
  const fort = (K.r || pad.r ? 1 : 0) - (K.l || pad.l ? 1 : 0) + (Math.abs(TCH.dx) > .7 ? Math.sign(TCH.dx) : 0);
  return { dir:Math.max(-1, Math.min(1, dx)), fort:Math.max(-1, Math.min(1, fort)), haut:!!(K.u || pad.u || pad.a || TCH.dy < -.6 || TCH.a), bas:!!(K.d || pad.d || TCH.dy > .55),
    court:!!(K.run || Math.abs(TCH.dx) > .95) };
}
function pas(dt){
  const g = G, h = g.h, I = entrees(); g.t += dt;
  const { dir, haut, bas } = I;
  // plateformes mobiles, tuiles qui s'effondrent, rochers
  g.plats.forEach(p => { const s = (Math.sin(g.t * p.vit + p.x0 * .01) + 1) / 2 * p.dist, nx = p.ax === 'x' ? p.x0 + s : p.x0, ny = p.ax === 'y' ? p.y0 - s : p.y0; p.dx = nx - p.x; p.dy = ny - p.y; p.x = nx; p.y = ny; });
  effondrements(dt); rochers(dt, h); attentes(dt);
  objets(dt); ennemis(dt, h); tirs(dt, h); effets(dt);
  if(h.mort){ h.mortT += dt; h.vy += PH.g * dt; h.y += h.vy * dt; if(h.mortT > 1.6) reprise(); return; }
  if(g.fini){ h.gagne += dt; return; }
  h.inv = Math.max(0, h.inv - dt); h.lance = Math.max(0, h.lance - dt); h.desc = Math.max(0, h.desc - dt);
  if(h.vehicule){ vehicule(dt, h, I); return; }
  if(dir) h.face = dir;
  const lourd = h.porte && h.porte.O.lourd;
  // ----- l'échelle : ↑ devant l'échelle (sans ← ni →) pour l'attraper, ↓ en haut pour descendre -----
  const cx = Math.floor(h.x / T), auMilieu = Math.floor((h.y - 20) / T), sousPieds = Math.floor((h.y + 2) / T);
  if(!h.monte && !lourd){
    if(haut && !I.fort && (echelle(cx, auMilieu) || echelle(cx, Math.floor((h.y - 4) / T))) && !(h.sol && !echelle(cx, auMilieu))) { h.monte = true; saut = false; }
    else if(bas && !I.fort && h.sol && echelle(cx, sousPieds) && !echelle(cx, auMilieu)){ h.monte = true; h.y += 4; }
    if(h.monte){ if(h.porte && !h.porte.O.petit){ h.monte = false; texte('Pose d’abord ' + leLa(h.porte.O.nom) + ' (↓ + Espace)', h.x, h.y - 90); } else { h.x = cx * T + 16; h.vx = 0; h.vy = 0; h.bas = false; } }
  } else if(h.monte && lourd) h.monte = false;
  if(h.monte){
    const v = (haut ? -1 : 0) + (bas ? 1 : 0); h.vy = v * PH.echelle; h.vx = 0; h.pm = (h.pm || 0) + Math.abs(h.vy) * dt; saut = false;
    const fd = I.fort; if(fd && !boite(h.x + fd * 14 - HW, h.y - HH, h.x + fd * 14 + HW, h.y - 2)){ h.monte = false; h.vx = fd * 150; h.vy = haut ? -380 : -160; h.face = fd; if(haut) son('saut'); }   // ← ou → : on lâche l'échelle
    else { const ny = h.y + h.vy * dt;
      if(v > 0 && boite(h.x - HW + 2, ny - 1, h.x + HW - 2, ny)){ h.monte = false; h.y = Math.floor(ny / T) * T; h.sol = true; h.vy = 0; }       // en bas : le sol
      else if(v < 0 && !echelle(cx, Math.floor((ny - 4) / T))){ h.monte = false; h.y = (Math.floor((ny - 4) / T) + 1) * T; h.sol = true; h.vy = 0; }   // en haut : on pose le pied sur la dernière marche
      else if(!echelle(cx, Math.floor((ny - 4) / T)) && !echelle(cx, Math.floor((ny - 30) / T))){ h.monte = false; }   // plus d'échelle : on tombe
      else h.y = ny; }
    if(h.monte){ agirLancer(h, I); return finPas(h, dt, I); }
  }
  // ----- le sol sous les pieds : glissant, sable, rebond -----
  const sous = h.sol ? tile(Math.floor(h.x / T), Math.floor((h.y + 2) / T)) : '';
  const glisse = sous === 'I', sable = sous === 'Y';
  // ----- s'accroupir, ramper -----
  const plafondBas = !!boite(h.x - HW + 2, h.y - HH, h.x + HW - 2, h.y - HHbas);
  h.bas = h.sol && !lourd && (bas || plafondBas);
  const vmax = (h.bas ? PH.rampe : I.court ? PH.course : PH.marche) * (lourd ? PH.lourd : 1) * (sable ? .6 : glisse ? 1.1 : 1);
  const acc = h.sol ? PH.acc * (glisse ? .3 : sable ? .7 : 1) : PH.accAir, frein = PH.frein * (glisse ? .07 : 1);
  if(dir){ const contre = Math.sign(h.vx) === -dir; h.vx += dir * acc * (contre && !glisse ? 2 : 1) * dt; if(Math.abs(h.vx) > vmax) h.vx = Math.sign(h.vx) * Math.max(vmax, Math.abs(h.vx) - 1200 * dt); }
  else if(h.sol){ h.vx -= Math.sign(h.vx) * Math.min(Math.abs(h.vx), frein * dt); }
  // ----- le saut (↑) -----
  if(saut){ h.tampon = PH.tampon; saut = false; } else h.tampon = Math.max(0, h.tampon - dt);
  h.coyote = h.sol ? PH.coyote : Math.max(0, h.coyote - dt);
  if(h.tampon > 0 && h.coyote > 0 && !plafondBas){ h.vy = -PH.saut * (lourd ? PH.sautLourd : 1) * (sable ? .84 : 1); h.sol = false; h.coyote = 0; h.tampon = 0; h.tenu = true; h.bas = false; son('saut'); }
  if(!haut) h.tenu = false;
  if(h.vy >= 0 || h.sol) h.ressort = false;
  h.vy = Math.min(PH.chuteMax, h.vy + (h.vy < 0 ? (h.tenu || h.ressort ? PH.gTenu : PH.gCoupe) : PH.gChute) * dt);
  if(h.sur){ h.x += h.sur.dx; h.y += h.sur.dy; }
  // ----- horizontal -----
  const hh = h.bas ? HHbas : HH;
  h.x += h.vx * dt;
  let b = boite(h.x - HW, h.y - hh, h.x + HW, h.y - 1);
  if(b){ if(b.caisse && h.sol && !h.porte){ const c = b.caisse, sens = Math.sign(c.x - h.x); if(sens === dir){ const nx = c.x + sens * PH.pousse * dt; if(!boite(nx - 15, c.y - 30, nx + 15, c.y - 1, c)){ c.x = nx; h.pousse = .2; } } }
    if(b.caisse){ const c = b.caisse; h.x = h.x < c.x ? c.x - 15 - HW - .01 : c.x + 15 + HW + .01; h.vx *= .2; }
    else { h.x = h.vx > 0 || (h.vx === 0 && b.cx * T > h.x) ? b.cx * T - HW - .01 : (b.cx + 1) * T + HW + .01; h.vx = 0;
      if(tile(b.cx, b.cy) === 'D' && !(h.porte && h.porte.O.cle)) porteFermee(b.cx, b.cy); } }
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
  // ----- ce qui est sous les pieds maintenant -----
  if(h.sol && !h.sur){ const xs = [Math.floor((h.x - HW + 3) / T), Math.floor((h.x + HW - 3) / T)], y = Math.floor((h.y + 2) / T);
    if(xs.some(x => tile(x, y) === 'U')){ h.vy = -(haut ? PH.rebondFort : PH.rebond); h.sol = false; h.tenu = true; h.ressort = true; h.coyote = 0; h.tampon = 0; saut = false; h.ecrase = .4; son('ressort'); }   // l'auvent fait rebondir
    xs.forEach(x => { if(tile(x, y) === 'X' && !g.eff.has(x + ',' + y)) g.eff.set(x + ',' + y, { etat:'tremble', t:.5 }); });
    if(h.sol && xs.every(x => solide(x, y) && tile(x, y) !== 'X') && !g.ens.some(e => Math.abs(e.x - h.x) < 3 * T && Math.abs(e.y - h.y) < T)) h.sauf = { x:h.x, y:h.y }; }
  h.phase += Math.abs(h.vx) * dt * .07;
  // ----- les passages secrets : rester accroupi sur la petite porte -----
  const ps = h.bas && Math.abs(h.vx) < 30 ? g.passages.find(p => Math.abs(p.x - h.x) < 18 && Math.abs(p.y - h.y) < 8) : null;
  if(ps){ h.passT += dt; if(h.passT > PH.passage){ const i = g.passages.indexOf(ps), autre = g.passages[i % 2 ? i - 1 : i + 1]; h.passT = 0;
      if(autre){ eclat(h.x, h.y - 20, '#ffe066', 12); h.x = autre.x; h.y = autre.y; h.vx = h.vy = 0; son('passage'); texte('✨ Passage secret !', h.x, h.y - 70, '#ffe066'); eclat(h.x, h.y - 20, '#ffe066', 12); g.camX = h.x - CW / SC / 2; } } }
  else h.passT = 0;
  agirLancer(h, I);
  // dangers : piquants, eau, chute hors du monde
  const pied = tile(Math.floor(h.x / T), Math.floor((h.y - 4) / T)), milieu = tile(Math.floor(h.x / T), Math.floor((h.y - 18) / T));
  if(pied === '^' || milieu === '^') blesse(h, true);
  if(pied === 'W' || milieu === 'W'){ plouf(h); return; }
  if(h.y > g.H * T + 60){ if(g.M.chuteDouce) plouf(h); else perdVie(); return; }
  if(h.x < HW) h.x = HW; if(h.x > g.W * T - HW) h.x = g.W * T - HW;
  // monter sur le scooter ou le tapis en le touchant
  if(!h.porte && h.desc <= 0) for(const v of g.vehicules){ if(!v.pris && Math.abs(v.x - h.x) < 26 && Math.abs(v.y - h.y) < 30){ monte(v); break; } }
  // la course fait du bruit (réveille les chats)
  if(Math.abs(h.vx) > PH.marche + 30 && h.sol) bruit(h.x, h.y, 4.5);
  finPas(h, dt, I);
}
function finPas(h, dt, I){
  const g = G;
  // ramasser les dinars, les jasmins ; les lanternes ; les panneaux ; la sortie
  g.piecesP.forEach(p => { if(p.ok && Math.abs(h.x - p.x) < 22 && Math.abs(h.y - 22 - p.y) < 36){ p.ok = false; g.dinars++; son('piece'); } });
  g.gemmes = g.gemmes.filter(j => { if(Math.abs(h.x - j.x) < 24 && Math.abs(h.y - 22 - j.y) < 36){ g.jasmins.add(j.id); son('gemme'); texte('🌼 Jasmin d’or !', j.x, j.y - 30, '#ffe066'); eclat(j.x, j.y, '#ffe066', 18); return false; } return true; });
  g.lanternes.forEach(l => { if(!l.on && Math.abs(h.x - l.x) < 28 && Math.abs(h.y - l.y) < 44){ l.on = true; g.check = { x:l.x, y:l.y }; son('lampe'); texte('Point de reprise !', l.x, l.y - 70, '#ffe066'); } });
  if(g.indiceT > 0){ g.indiceT -= dt || STEP; }
  else { g.indice = '';
    g.panneaux.forEach(p => { if(Math.abs(h.x - p.x) < 60 && Math.abs(h.y - p.y) < 70){ g.indice = p.txt; if(!p.lu){ p.lu = true; dire(p.txt); } } });
    if(!g.indice) g.indice = indiceAgir(h); }
  if(g.sortie && Math.abs(h.x - g.sortie.x) < 26 && Math.abs(h.y - g.sortie.y) < 40 && (h.sol || h.vehicule)){
    if(g.boss && !g.bossVaincu){ montreIndice('🔒 La sortie est fermée : chasse d’abord ' + g.boss.E.nom + ' !', true); }
    else gagne(); }
}
function montreIndice(t, voix){ const g = G; if(g.indice === t && g.indiceT > 0){ g.indiceT = 2; return; } g.indice = t; g.indiceT = 2.5; if(voix && g.dernierDit !== t){ g.dernierDit = t; dire(t); } }
function porteFermee(cx, cy){ const g = G; montreIndice('🔒 Cette porte est fermée à clé. Il faut trouver la clé 🔑 et revenir la toucher.', !g.porteDite); g.porteDite = true; }
function plouf(h){ const g = G; son('plouf'); eclat(h.x, h.y - 10, '#9fd6ff', 16); texte('Plouf !', h.x, h.y - 60, '#9fd6ff');
  if(h.porte && h.porte.e){ const e = h.porte.e; h.porte = null; e.etat = 'etourdi'; e.tm = .8; e.x = h.sauf.x + 40; e.y = h.sauf.y; }
  else if(h.porte){ const o = h.porte; o.etat = 'pose'; o.x = o.x0; o.y = o.y0; h.porte = null; }
  h.x = h.sauf.x; h.y = h.sauf.y; h.vx = h.vy = 0; h.monte = false; h.inv = 0; blesse(h, true); if(!h.mort){ h.vx = 0; h.vy = 0; h.x = h.sauf.x; h.y = h.sauf.y; } }

/* ---------- scooter et tapis volant ---------- */
function monte(v){ const h = G.h; v.pris = true; h.vehicule = v; if(v.k === 'A') h.y -= 12; h.monte = false; h.bas = false; h.vy = 0; h.face = 1; son(v.k === 'N' ? 'vroum' : 'vole');
  texte(v.k === 'N' ? 'Vroum ! (↓ + Espace pour descendre)' : 'Le tapis s’envole ! (↓ + Espace pour descendre)', h.x, h.y - 90, '#ffe066'); }
function descend(choc){ const h = G.h, v = h.vehicule; if(!v) return; h.vehicule = null; v.pris = false; h.desc = 1.2;
  v.x = h.x - h.face * 22; v.y = v.k === 'A' ? h.y - 20 : h.y;
  if(v.k === 'N' && !boite(v.x - 20, v.y - 30, v.x + 20, v.y - 2)){ /* le scooter reste là */ } else if(v.k === 'N'){ v.x = h.x; }
  if(choc){ h.vx = -h.face * 160; h.vy = -280; texte('Boum !', h.x, h.y - 70); son('coup'); } }
function vehicule(dt, h, I){
  const g = G, v = h.vehicule, { dir, haut, bas } = I;
  if(v.k === 'N'){ // le scooter : il roule tout seul vers la droite ; → accélère, ← freine, ↑ saute
    const cible = PH.scooter * (dir > 0 ? 1.25 : dir < 0 ? .45 : 1); h.vx += (cible - h.vx) * Math.min(1, dt * 2.5); h.face = 1;
    if(saut){ h.tampon = PH.tampon; saut = false; } else h.tampon = Math.max(0, h.tampon - dt);
    h.coyote = h.sol ? PH.coyote : Math.max(0, h.coyote - dt);
    if(h.tampon > 0 && h.coyote > 0){ h.vy = -560; h.sol = false; h.coyote = 0; h.tampon = 0; h.tenu = true; son('saut'); }
    if(!haut) h.tenu = false;
    h.vy = Math.min(PH.chuteMax, h.vy + (h.vy < 0 ? (h.tenu ? PH.gTenu : PH.gCoupe) : PH.gChute) * dt);
    if(h.sur){ h.x += h.sur.dx; h.y += h.sur.dy; }
    h.x += h.vx * dt;
    if(boite(h.x - HW, h.y - HH, h.x + HW + 14, h.y - 4)){ h.x -= h.vx * dt; if(h.vx > 160){ descend(true); return finPas(h, dt, I); } h.vx = 0; }
    const avant = h.y; h.y += h.vy * dt; h.sol = false; h.sur = null;
    if(h.vy < 0){ const b = boite(h.x - HW + 3, h.y - HH, h.x + HW - 3, h.y - HH + 1); if(b){ h.y = (b.cy + 1) * T + HH; h.vy = 30; } }
    else { const b = boite(h.x - HW - 8, h.y - 1, h.x + HW + 8, h.y); if(b){ h.y = b.caisse ? b.caisse.y - 30 : b.cy * T; h.vy = 0; h.sol = true; }
      else { for(let x = Math.floor((h.x - HW) / T); x <= Math.floor((h.x + HW) / T) && !h.sol; x++){ const y = Math.floor(h.y / T); if(tile(x, y) === '=' && avant <= y * T + .5 && h.y >= y * T){ h.y = y * T; h.vy = 0; h.sol = true; } }
        if(!h.sol) for(const p of g.plats){ if(h.x > p.x - 6 && h.x < p.x + p.w + 6 && avant <= p.y + 1 && h.y >= p.y){ h.y = p.y; h.vy = 0; h.sol = true; h.sur = p; break; } } } }
    h.phase += Math.abs(h.vx) * dt * .07;
    // il renverse les ennemis (ils s'enfuient)
    for(const e of g.ens) if(e.vivant && e.E.type !== 'boss' && e.etat !== 'fuite' && e.etat !== 'cache' && Math.abs(e.x - h.x) < e.w / 2 + 18 && h.y > e.y - e.h && h.y - HH < e.y){ coup(e, 9); }
  } else { // le tapis volant : on vole dans toutes les directions
    const vy = (haut ? -1 : 0) + (bas ? 1 : 0); saut = false;
    h.vx += (dir * PH.tapis - h.vx) * Math.min(1, dt * 4); h.vy += (vy * PH.tapis * .85 - h.vy) * Math.min(1, dt * 4); if(dir) h.face = dir;
    h.x += h.vx * dt; if(boite(h.x - 24, h.y - HH, h.x + 24, h.y + 6)){ h.x -= h.vx * dt; h.vx = 0; }
    h.y += h.vy * dt; if(boite(h.x - 24, h.y - HH, h.x + 24, h.y + 6)){ h.y -= h.vy * dt; h.vy = 0; }
    if(h.y < HH + 4) h.y = HH + 4;
    h.sol = false; h.phase += dt * 3;
  }
  if(agir){ agir = false; descend(false); } lancer = false;
  const pied = tile(Math.floor(h.x / T), Math.floor((h.y - 4) / T)), milieu = tile(Math.floor(h.x / T), Math.floor((h.y - 18) / T));
  if(pied === '^' || milieu === '^'){ descend(false); blesse(h, true); }
  if(pied === 'W' || milieu === 'W'){ descend(false); plouf(h); return; }
  if(h.y > g.H * T + 60){ descend(false); perdVie(); return; }
  if(h.x < HW) h.x = HW; if(h.x > g.W * T - HW) h.x = g.W * T - HW;
  if(h.vehicule){ h.vehicule.x = h.x; h.vehicule.y = h.y; }
  finPas(h, dt, I);
}

/* ---------- prendre, poser, lancer, tirer un levier ---------- */
function proche(h){
  let best = null, bd = 52;
  for(const o of G.objs){ if(o.etat !== 'pose') continue; const d = Math.abs(o.x - h.x); if(d < bd && Math.abs(o.y - h.y) < 36){ bd = d; best = { o }; } }
  for(const l of G.leviers){ const d = Math.hypot(l.x - h.x, l.y - (h.y - 36)); if(d < 56 && d < bd + 10){ bd = d; best = { l }; } }
  for(const e of G.ens){ if(!attrapable(e) || Math.abs(e.y - h.y) > 30) continue; const dx = h.x - e.x, d = Math.abs(dx);
    const deDos = Math.sign(dx) === -e.face || e.etat === 'dort' || e.etat === 'etourdi' || e.etat === 'cache' || (e.E.type === 'serpent');
    if(d < e.w / 2 + 34 && deDos && d < bd + 6){ bd = d; best = { en:e }; } }
  return best;
}
function indiceAgir(h){
  if(h.vehicule) return '';
  if(h.porte) return h.porte.O.cle ? '🔑 Va toucher la porte fermée avec la clé.' : `Espace : lancer ${leLa(h.porte.O.nom)} · ↓ + Espace : ${h.porte.O.nom === 'clé' ? 'la' : 'le'} poser`.replace('le poser', ['caisse', 'jarre', 'pierre'].includes(h.porte.O.nom) ? 'la poser' : 'le poser');
  const p = proche(h); if(!p) return '';
  if(p.o) return `↓ + Espace : ramasser ${leLa(p.o.O.nom)}`;
  if(p.en) return `↓ + Espace : attraper ${leLa(p.en.E.nom)} !`;
  if(p.l) return p.l.on ? '' : 'Espace : tirer le levier';
  return '';
}
const leLa = n => (['caisse', 'jarre', 'pierre', 'clé', 'chèvre'].includes(n) ? 'la ' : 'le ') + n;
function agirLancer(h, I){
  const g = G;
  if(agir){ agir = false;   // ↓ + Espace : ramasser ou poser (et tirer un levier)
    if(h.porte && h.porte.e){ lacheEnnemi(h, false); }
    else if(h.porte){ const o = h.porte, nx = h.x + h.face * 26;
      if(!boite(nx - 14, h.y - 30, nx + 14, h.y - 2, o)){ o.x = nx; o.y = h.y - 2; } else { o.x = h.x; o.y = h.y - 2; }
      o.vx = 0; o.vy = 0; o.etat = 'pose'; h.porte = null; son('pose'); }
    else { const p = proche(h);
      if(p && p.o){ if(h.monte && !p.o.O.petit){ texte('Descends de l’échelle d’abord', h.x, h.y - 90); } else { p.o.etat = 'porte'; h.porte = p.o; son('prend'); } }
      else if(p && p.en && !h.monte){ attrape(h, p.en); }
      else if(p && p.l && !p.l.on){ levier(p.l); } } }
  if(lancer){ lancer = false;   // Espace : lancer (ou tirer le levier tout près)
    if(h.porte && h.porte.e && !h.monte){ lacheEnnemi(h, true); }
    else if(h.porte && !h.monte){ const o = h.porte, L = o.O.lance; o.etat = 'vol'; o.vx = h.face * L[0] + h.vx * .3; o.vy = L[1]; o.x = h.x + h.face * 12; o.y = h.y - (h.bas ? 30 : 74); o.lanceur = 'heros'; h.porte = null; h.lance = .3; son('lance'); }
    else if(!h.porte){ const p = proche(h);
      if(p && p.l && !p.l.on) levier(p.l);
      else if(p && p.o) montreIndice('Pour ramasser : accroupis-toi (↓) et appuie sur Espace', true);
      else { h.lance = .2; } } }
  // la clé ouvre la porte qu'on touche
  if(h.porte && h.porte.O.cle){ for(let y = Math.floor((h.y - HH) / T); y <= Math.floor((h.y - 1) / T); y++) for(const x of [Math.floor((h.x + HW + 4) / T), Math.floor((h.x - HW - 4) / T)])
    if(tile(x, y) === 'D' && !g.ouvert.has(x + ',' + y)){ ouvrePorte(x, y); g.objs = g.objs.filter(o => o !== h.porte); h.porte = null; g.clesUsees = true; return; } }
}
const CRI_PRIS = { garde:'Lâche-moi ! 😢', chien:'Ouin… 🐶', marchand:'Mes oranges… 😢', voleur:'Pardon, pardon ! 😭', controleur:'Mon billet… 😢', rat:'Couic… 😢', serpent:'Sss… 😢', chat:'Miaou… 😿', scorpion:'Pas juste ! 😢', crabe:'Clac… 😢', chevre:'Bêêê… 😢' };
function attrape(h, e){ const g = G; e.etat = 'porte'; e.vx = e.vy = 0; e.prisT = 0; e.face = h.face; e.lanceur = null;
  h.porte = { e, O:{ nom:e.E.nom, lance:e.w > 30 || e.h > 50 ? [340, -230] : [400, -250], lourd:false, petit:false, casseMur:e.h > 50 }, etat:'porte' };
  son('attrape'); texte(CRI_PRIS[e.E.sp] || 'Oh non… 😢', e.x, e.y - e.h - 30, '#bfe6ff', 20); h.inv = Math.max(h.inv, .3); }
function lacheEnnemi(h, lance){ const e = h.porte.e; h.porte = null; if(!e) return;
  if(lance){ e.etat = 'lance'; e.vx = h.face * (e.h > 50 ? 340 : 400) + h.vx * .3; e.vy = -240; e.x = h.x + h.face * 14; e.y = h.y - hauteurHeros() * .9; e.rot = 0; h.lance = .3; son('jete'); }
  else { e.etat = 'etourdi'; e.tm = 1.2; e.x = h.x + h.face * (e.w / 2 + 16); e.y = h.y; e.vy = 0; if(boite(e.x - e.w / 2, e.y - 30, e.x + e.w / 2, e.y - 2)) e.x = h.x; son('pose'); } }
// l'ennemi porté se débat ; au bout de 6 s il s'échappe ; lancé, il chasse les autres ennemis et casse les murs fissurés
function enneMiPorte(e, h, dt){ const g = G;
  if(e.etat === 'porte'){ if(h.porte && h.porte.e === e){ const H2 = hauteurHeros(); e.x = h.x + h.face * 2; e.y = h.y - H2 * 1.12; e.face = h.face; e.prisT += dt;
      if(e.prisT > 6){ h.porte = null; e.etat = 'etourdi'; e.tm = .4; e.vy = -300; e.x = h.x - h.face * 20; texte('Il s’échappe !', e.x, e.y - 30, '#ffe066'); } }
    else { e.etat = 'etourdi'; e.tm = 1; }
    return; }
  // lancé
  e.vy += PH.g * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.rot = (e.rot || 0) + e.vx * dt * .03;
  for(const o of g.ens){ if(o === e || !o.vivant || o.etat === 'fuite' || o.etat === 'cache' || o.etat === 'porte') continue; const oy = o.E.type === 'vol' ? o.y : o.y - o.h / 2;
    if(Math.abs(o.x - e.x) < o.w / 2 + e.w / 2 && Math.abs(oy - (e.y - e.h / 2)) < o.h / 2 + e.h / 2){ coup(o, o.E.type === 'boss' ? 1 : 2); texte('Strike ! 🎳', o.x, o.y - o.h - 20, '#ffe066', 24); son('strike'); return fuitPris(e); } }
  const b = boite(e.x - e.w / 2, e.y - Math.min(e.h, 40), e.x + e.w / 2, e.y);
  if(b){ if(!b.caisse && e.h > 50){ let f = null; for(let cy = Math.floor((e.y - 40) / T); cy <= Math.floor((e.y + 2) / T) && !f; cy++) for(let cx = Math.floor((e.x - e.w) / T); cx <= Math.floor((e.x + e.w) / T); cx++) if(tile(cx, cy) === 'B'){ f = [cx, cy]; break; } if(f) casseMur(f[0], f[1]); }
    return fuitPris(e); }
  if(e.y > g.H * T + 100 || tile(Math.floor(e.x / T), Math.floor((e.y - 6) / T)) === 'W'){ eclat(e.x, e.y, '#9fd6ff', 10); e.vivant = false; G.chasses = (G.chasses || 0) + 1; } }
function fuitPris(e){ const g = G; e.etat = 'fuite'; e.vx = 0; e.rot = 0; e.face = Math.sign(e.x - g.h.x) || 1; eclat(e.x, e.y - e.h / 2, '#ffffff', 12); son('coup'); bruit(e.x, e.y, 6);
  if(e.butin){ for(let i = 0; i < e.butin; i++) g.piecesP.push({ x:e.x + (i - 1) * 18, y:e.y - 30, ok:true, saute:1 }); e.butin = 0; }
  const cri = { z:'Miaou ! 🐾', d:'Ouaf… 🐕', h:'Bêêê !', a:'Couic !' }[e.t] || 'Ouste ! 💨'; texte(cri, e.x, e.y - e.h - 16, '#ffe066', 22); g.chasses = (g.chasses || 0) + 1; }
function ouvrePorte(x, y){ const g = G; let y0 = y; while(tile(x, y0 - 1) === 'D') y0--; for(let k = y0; tile(x, k) === 'D'; k++) g.ouvert.add(x + ',' + k); son('porte'); texte('🔓 La porte s’ouvre !', x * T + 16, y0 * T - 20, '#ffe066'); eclat(x * T + 16, y * T, '#ffe066', 14); }
function levier(l){ const g = G; l.on = true; son('levier');
  // il ouvre les grilles les plus proches (dans les 14 cases)
  let n = 0; for(let y = 0; y < g.H; y++) for(let x = 0; x < g.W; x++) if(g.m[y][x] === 'G' && Math.abs(x * T - l.x) < 14 * T){ g.ouvert.add(x + ',' + y); n++; }
  if(n){ son('porte'); texte('La grille s’ouvre !', l.x, l.y - 40, '#ffe066'); } }

/* ---------- les objets ---------- */
function objets(dt){
  const g = G, h = g.h;
  for(const o of g.objs){
    if(o.etat === 'porte'){ const H2 = hauteurHeros(); o.x = h.x + (h.monte ? 0 : h.face * 3); o.y = h.y - (h.bas ? H2 * .62 : H2 * 1.12) - 2; continue; }
    if(o.etat === 'pose'){ // il tombe s'il n'a plus rien dessous
      if(!boite(o.x - 14, o.y, o.x + 14, o.y + 2, o) && !surPlanche(o.x, o.y)){ o.vy = Math.min(PH.chuteMax, o.vy + PH.g * dt); o.y += o.vy * dt; const b = boite(o.x - 14, o.y - 1, o.x + 14, o.y, o); if(b){ o.y = b.caisse ? b.caisse.y - 30 : b.cy * T; o.vy = 0; } else for(let x = Math.floor((o.x - 14) / T); x <= Math.floor((o.x + 14) / T); x++){ const y = Math.floor(o.y / T); if(tile(x, y) === '=' && o.y - o.vy * dt <= y * T + .5){ o.y = y * T; o.vy = 0; } } }
      else o.vy = 0;
      if(o.y > g.H * T + 100 || tile(Math.floor(o.x / T), Math.floor((o.y - 6) / T)) === 'W'){ revient(o); }   // tombé hors du monde ou dans l'eau : il revient à sa place
      continue; }
    // en vol
    o.vy += PH.g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot = (o.rot || 0) + o.vx * dt * .05;
    if(tile(Math.floor(o.x / T), Math.floor((o.y - 6) / T)) === 'W'){ eclat(o.x, o.y, '#9fd6ff', 8); revient(o); continue; }
    // un ennemi touché
    for(const e of g.ens){ if(!e.vivant || e.etat === 'fuite' || e.etat === 'cache') continue; const ey = e.E.type === 'vol' ? e.y : e.y - e.h / 2;
      if(Math.abs(o.x - e.x) < e.w / 2 + 14 && Math.abs(o.y - 12 - ey) < e.h / 2 + 14){ coup(e, e.E.type === 'boss' ? 1 : o.O.lourd ? 2 : 1); o.vx *= -.3; o.vy = -150; if(o.O.casse){ casseObjet(o); } break; } }
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
      o.vx = 0; o.vy = 0; o.etat = 'pose'; o.rebonds = 0; son('pose'); bruit(o.x, o.y, 6);
    }
    if(o.y > g.H * T + 100) revient(o);
  }
}
function revient(o){ o.x = o.x0; o.y = o.y0; o.vx = o.vy = 0; o.etat = 'pose'; o.rebonds = 0; if(G.h.porte === o) G.h.porte = null; }
function surPlanche(x, y){ if(y % T !== 0) return false; for(let cx = Math.floor((x - 14) / T); cx <= Math.floor((x + 14) / T); cx++) if(tile(cx, y / T) === '=') return true; return false; }
function casseObjet(o){ const g = G; o.etat = 'casse'; g.objs = g.objs.filter(x => x !== o); son('casse'); eclat(o.x, o.y - 10, '#c87b3e', 12); bruit(o.x, o.y, 6);
  if(Math.random() < .5) g.piecesP.push({ x:o.x, y:o.y - 14, ok:true, saute:1 });
  if(o.resp) g.attente.push({ t:3, f:() => { o.etat = 'pose'; o.x = o.x0; o.y = o.y0; o.vx = o.vy = 0; g.objs.push(o); eclat(o.x, o.y - 16, '#ffffff', 8); } }); }
function attentes(dt){ const g = G; g.attente = g.attente.filter(a => { a.t -= dt; if(a.t <= 0){ a.f(); return false; } return true; }); }
function casseMur(cx, cy){ const g = G, pile = [[cx, cy]], vus = new Set(); g.cassees = g.cassees || [];
  while(pile.length){ const [x, y] = pile.pop(), k = x + ',' + y; if(vus.has(k) || tile(x, y) !== 'B') continue; vus.add(k); g.m[y][x] = '.'; g.cassees.push(k); eclat(x * T + 16, y * T + 16, '#d9cbb0', 8); pile.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  son('casse'); son('bonus'); texte('✨ Un passage secret !', cx * T + 16, cy * T - 20, '#ffe066'); }

/* ---------- tuiles qui s'effondrent, rochers qui tombent ---------- */
function effondrements(dt){ const g = G, h = g.h;
  for(const [k, e] of g.eff){ e.t -= dt;
    if(e.etat === 'tremble' && e.t <= 0){ e.etat = 'tombe'; e.t = 4; const [x, y] = k.split(',').map(Number); eclat(x * T + 16, y * T + 16, '#b5562f', 8); son('casse'); g.parts.push({ x:x * T + 16, y:y * T + 16, vx:0, vy:0, vie:.9, c:'#b5562f', r:12 }); }
    else if(e.etat === 'tombe' && e.t <= 0){ const [x, y] = k.split(',').map(Number); if(Math.abs(h.x - (x * T + 16)) > 30 || Math.abs(h.y - y * T - 16) > 50) g.eff.delete(k); else e.t = .5; } } }
function rochers(dt, h){ const g = G;
  for(const r of g.rochers){
    if(r.etat === 'attend'){ if(Math.abs(h.x - r.x) < 34 && h.y > r.y0 && h.y - r.y0 < 10 * T && !h.mort){ let libre = true; for(let y = Math.floor(r.y0 / T) + 1; y < Math.floor((h.y - HH) / T); y++) if(solide(Math.floor(r.x / T), y)) libre = false; if(libre){ r.etat = 'tremble'; r.t = .7; } } }
    else if(r.etat === 'tremble'){ r.t -= dt; if(r.t <= 0){ r.etat = 'tombe'; r.vy = 0; } }
    else if(r.etat === 'tombe'){ r.vy = Math.min(700, r.vy + PH.g * dt); r.y += r.vy * dt;
      if(Math.abs(h.x - r.x) < HW + 12 && r.y > h.y - HH && r.y - 24 < h.y) blesse(h, false, r.x);
      if(solide(Math.floor(r.x / T), Math.floor(r.y / T)) || r.y > g.H * T){ r.etat = 'parti'; r.t = 5; eclat(r.x, r.y - 10, '#9a8d7a', 12); son('casse'); } }
    else if(r.etat === 'parti'){ r.t -= dt; if(r.t <= 0){ r.etat = 'attend'; r.y = r.y0; } } } }

/* ---------- les ennemis : dort → patrouille → alerte → poursuite → étourdi → fuite ---------- */
function bruit(x, y, cases){ for(const e of G.ens) if(e.vivant && e.etat === 'dort' && Math.abs(e.x - x) < cases * T && Math.abs(e.y - y) < 3 * T){ e.etat = 'alerte'; e.tm = .6; e.ensuite = 'chasse'; e.reveil = 6; texte(e.t === 'z' ? 'Miaou !' : '!', e.x, e.y - 40, '#ffffff'); son('miaou'); } }
function voit(e, h){ const E = e.E, dx = h.x - e.x; return !h.mort && Math.abs(dx) < E.vue * T && Math.abs(h.y - e.y) < (E.type === 'vol' ? 6 * T : E.type === 'boss' ? 4 * T : 50) && (e.t === 'd' || E.type === 'tireur' || E.type === 'boss' || e.etat === 'chasse' || Math.sign(dx) === e.face || Math.abs(dx) < 2 * T); }
function devantVide(e){ const x = e.x + e.face * (e.w / 2 + 4), cx = Math.floor(x / T), cy = Math.floor((e.y + 4) / T), c = tile(cx, cy); return !solide(cx, cy) && c !== '=' && c !== 'H'; }
const murDevant = e => !!boite(e.x + e.face * (e.w / 2 + 2) - 1, e.y - Math.min(e.h, 40) + 6, e.x + e.face * (e.w / 2 + 2) + 1, e.y - 4) || tile(Math.floor((e.x + e.face * (e.w / 2 + 4)) / T), Math.floor((e.y - 4) / T)) === 'W';
function ennemis(dt, h){
  const g = G, k = g.D.vit;
  for(const e of g.ens){
    if(!e.vivant) continue; const E = e.E; e.fr += dt;
    if(e.etat === 'porte' || e.etat === 'lance'){ enneMiPorte(e, h, dt); continue; }
    if(e.etat === 'fuite'){ e.x += e.face * 260 * dt; e.alpha = (e.alpha === undefined ? 1 : e.alpha) - dt * 1.2; if(e.alpha <= 0) e.vivant = false; continue; }
    if(E.type === 'boss' && e.etat !== 'fuite'){ boss(e, h, dt, k); continue; }
    if(e.etat === 'etourdi'){ e.tm -= dt; if(e.tm <= 0){ e.etat = E.dort ? 'dort' : E.suspendu ? 'retour' : E.type === 'vol' ? 'vol' : E.type === 'serpent' ? 'rentre' : E.type === 'boss' ? 'marche' : 'patrouille'; e.tm = 1; } if(E.type !== 'vol') gravite(e, dt); else e.y += 30 * dt; continue; }
    switch(E.type){
      case 'vol': volant(e, h, dt, k); continue;
      case 'serpent': serpent(e, h, dt); continue;
      case 'boss': boss(e, h, dt, k); continue;
      case 'tireur': tireur(e, h, dt, k); continue;
      case 'chevre': if(chevre(e, h, dt, k)) continue; break;
      case 'voleur': if(voleur(e, h, dt, k)) continue; break;
    }
    if(e.etat === 'dort'){ gravite(e, dt); touche(e, h); continue; }
    if(e.etat === 'alerte'){ e.tm -= dt; e.face = Math.sign(h.x - e.x) || e.face; if(e.tm <= 0) e.etat = e.ensuite || 'chasse'; gravite(e, dt); touche(e, h); continue; }
    // patrouille et poursuite
    if(e.etat === 'patrouille'){ e.vx = e.face * E.vit * k; if(murDevant(e) || devantVide(e)) e.face *= -1;
      if(E.chasse && voit(e, h)){ e.etat = 'alerte'; e.tm = e.t === 'd' ? .3 : .5; e.ensuite = 'chasse'; texte('!', e.x, e.y - e.h - 10, '#ff5a5a', 26); if(e.t === 'd') son('ouaf'); } }
    else if(e.etat === 'chasse'){ const dx = h.x - e.x; e.face = Math.sign(dx) || e.face; e.vx = e.face * E.chasse * k;
      if(devantVide(e) && !E.bond){ e.vx = 0; }
      if(E.bond && e.sol && (murDevant(e) || Math.random() < dt * .8)){ e.vy = -330; e.sol = false; }
      if(e.reveil !== undefined){ e.reveil -= dt; if(e.reveil <= 0){ e.etat = 'dort'; e.vx = 0; delete e.reveil; } }
      else if(Math.abs(dx) > (E.abandon || 10) * T || Math.abs(h.y - e.y) > 3 * T || h.mort){ e.etat = 'patrouille'; } }
    marche(e, dt); gravite(e, dt); touche(e, h);
  }
  g.ens = g.ens.filter(e => e.vivant);
}
function marche(e, dt){ const nx = e.x + e.vx * dt; if(!boite(nx - e.w / 2, e.y - Math.min(e.h, 40) + 6, nx + e.w / 2, e.y - 2) && tile(Math.floor((nx + Math.sign(e.vx) * e.w / 2) / T), Math.floor((e.y - 4) / T)) !== 'W') e.x = nx; else if(!e.E.bond || e.sol) e.face *= -1; }
// les oiseaux et les chauves-souris : ils tournent (ou pendent au plafond), puis piquent sur le héros
function volant(e, h, dt, k){ const g = G;
  if(e.etat === 'pendu'){ if(Math.abs(h.x - e.x) < 4 * T && h.y > e.y && h.y - e.y < 7 * T){ e.etat = 'pique'; e.cible = { x:h.x, y:h.y - 30 }; texte('!', e.x, e.y + 10, '#ff5a5a', 22); } touche(e, h); return; }
  if(e.etat === 'vol'){ e.x = e.x0 + Math.sin(g.t * .8 + e.x0) * 3 * T; e.face = Math.cos(g.t * .8 + e.x0) > 0 ? 1 : -1; e.y = e.y0 - T + Math.sin(g.t * 2.2) * 8; if(voit(e, h) && h.y > e.y && (e.tm -= dt) <= 0){ e.etat = 'pique'; e.cible = { x:h.x, y:h.y - 30 }; e.tm = 0; } }
  else if(e.etat === 'pique'){ const a = Math.atan2(e.cible.y - e.y, e.cible.x - e.x), v = (e.E.suspendu ? 200 : 260) * k; e.x += Math.cos(a) * v * dt; e.y += Math.sin(a) * v * dt; e.face = Math.sign(Math.cos(a)) || e.face; if(Math.hypot(e.cible.x - e.x, e.cible.y - e.y) < 10 || e.y > e.y0 + 8 * T || boite(e.x - 6, e.y - 6, e.x + 6, e.y + 6)){ e.etat = e.E.suspendu ? 'retour' : 'remonte'; } }
  else if(e.etat === 'remonte' || e.etat === 'retour'){ const ty = e.E.suspendu ? e.y0 : e.y0 - T, a = Math.atan2(ty - e.y, e.x0 - e.x); e.x += Math.cos(a) * 150 * dt; e.y += Math.sin(a) * 150 * dt; if(Math.hypot(e.x0 - e.x, ty - e.y) < 12){ e.etat = e.E.suspendu ? 'pendu' : 'vol'; e.tm = 2.5; if(e.E.suspendu){ e.x = e.x0; e.y = e.y0; e.repos = 2; } } }
  touche(e, h); }
// le serpent : caché dans le sable, il sort quand on passe tout près
function serpent(e, h, dt){ e.tm -= dt;
  if(e.etat === 'cache'){ e.sortie = 0; if(e.tm <= 0 && Math.abs(h.x - e.x) < e.E.vue * T && Math.abs(h.y - e.y) < 40){ e.etat = 'sort'; e.tm = .35; e.face = Math.sign(h.x - e.x) || 1; son('miaou'); } return; }
  if(e.etat === 'sort'){ e.sortie = 1 - e.tm / .35; if(e.tm <= 0){ e.etat = 'dehors'; e.tm = 1.6; e.sortie = 1; } }
  else if(e.etat === 'dehors'){ e.face = Math.sign(h.x - e.x) || e.face; if(e.tm <= 0){ e.etat = 'rentre'; e.tm = .35; } }
  else if(e.etat === 'rentre'){ e.sortie = Math.max(0, e.tm / .35); if(e.tm <= 0){ e.etat = 'cache'; e.tm = 1.2; } }
  if(e.sortie > .5) touche(e, h); }
// le marchand : il se tourne vers le héros et lance des oranges
function tireur(e, h, dt, k){
  if(voit(e, h)){ e.face = Math.sign(h.x - e.x) || e.face; e.tir -= dt * k; if(e.tir <= 0){ e.tir = e.E.tir; e.lance = .35; tire(e, h, e.E.proj); } }
  e.lance = Math.max(0, (e.lance || 0) - dt); gravite(e, dt); touche(e, h); }
function tire(e, h, proj, dyTir){ const dx = h.x - e.x, t = Math.max(.55, Math.min(1.1, Math.abs(dx) / 300)), y0 = e.y - (dyTir || 50);
  G.tirs.push({ x:e.x + e.face * 14, y:y0, vx:dx / t, vy:(h.y - 40 - y0) / t - .5 * PH.g * t, vie:3, im:proj || 'orange', rot:0 }); son('lance'); }
// la chèvre : elle fonce quand elle voit le héros ; si elle se cogne au mur, elle reste étourdie
function chevre(e, h, dt, k){ const E = e.E;
  if(e.etat === 'patrouille' && voit(e, h) && Math.abs(h.y - e.y) < 40){ e.etat = 'alerte'; e.tm = .6; e.ensuite = 'charge'; e.face = Math.sign(h.x - e.x) || e.face; texte('!', e.x, e.y - e.h - 10, '#ff5a5a', 26); son('ouaf'); return false; }
  if(e.etat === 'charge'){ e.vx = e.face * E.charge * k; e.tm -= dt;
    const nx = e.x + e.vx * dt; if(boite(nx - e.w / 2, e.y - e.h + 6, nx + e.w / 2, e.y - 2)){ coup(e, 0); e.etat = 'etourdi'; e.tm = 2.2; texte('Boum ! 💫', e.x, e.y - e.h - 10, '#ffe066', 22); son('coup'); }
    else if(devantVide(e) || (e.parcours = (e.parcours || 0) + Math.abs(e.vx * dt)) > 8 * T){ e.etat = 'patrouille'; e.parcours = 0; e.face *= -1; } else e.x = nx;
    gravite(e, dt); touche(e, h); return true; }
  return false; }
// le voleur : il court vers le héros, prend des dinars et s'enfuit ; on les récupère en l'attrapant
function voleur(e, h, dt, k){ const g = G;
  if(e.etat === 'file'){ e.vx = e.face * 230 * k; marche(e, dt); gravite(e, dt); e.tm -= dt; if(e.tm <= 0){ e.etat = 'patrouille'; } touche(e, h); return true; }
  return false; }
function gravite(e, dt){ if(e.E.type === 'vol') return; e.vy = Math.min(PH.chuteMax, e.vy + PH.g * dt); const ny = e.y + e.vy * dt;
  const b = boite(e.x - e.w / 2 + 2, ny - 1, e.x + e.w / 2 - 2, ny); let pose = false;
  if(b && e.vy >= 0){ e.y = b.caisse ? b.caisse.y - 30 : b.cy * T; pose = true; }
  else { const y = Math.floor(ny / T); for(let x = Math.floor((e.x - e.w / 2) / T); x <= Math.floor((e.x + e.w / 2) / T); x++) if((tile(x, y) === '=' || (tile(x, y) === 'H' && tile(x, y - 1) !== 'H')) && e.y <= y * T + .5 && ny >= y * T){ e.y = y * T; pose = true; } }
  if(pose){ e.vy = 0; e.sol = true; } else { e.y = ny; e.sol = false; }
  if(e.y > G.H * T + 100 || tile(Math.floor(e.x / T), Math.floor((e.y - 6) / T)) === 'W'){ if(e.E.type === 'boss'){ e.x = e.x0; e.y = e.y0; e.vy = 0; } else e.vivant = false; } }
function touche(e, h){ if(h.mort || e.etat === 'porte' || e.etat === 'lance' || e.etat === 'etourdi' || e.etat === 'fuite' || e.etat === 'cache' || G.fini || h.vehicule && h.vehicule.k === 'N' && e.E.type !== 'boss' && e.E.type !== 'vol') return;
  const vol = e.E.type === 'vol', ey = vol ? e.y + e.h / 2 : e.y, haut = ey - e.h;
  if(Math.abs(h.x - e.x) < e.w / 2 + HW - 2 && h.y > haut + 4 && h.y - (h.bas ? HHbas : HH) < ey){
    // on lui saute dessus : il est étourdi (le boss, seulement quand il est déjà étourdi : voir boss())
    if(h.vy > 60 && h.y - haut < 24 && e.E.type !== 'boss'){ h.vy = -420; h.tenu = true; coup(e, 1); son('coup'); return; }
    if(e.E.type === 'voleur'){ vol_(e, h); return; }
    blesse(h, false, e.x, e.E.deg); } }
function vol_(e, h){ const g = G; if(e.etat === 'file') return; const n = Math.min(3, g.dinars); g.dinars -= n; e.butin = (e.butin || 0) + n; e.etat = 'file'; e.tm = 3; e.face = Math.sign(e.x - h.x) || 1;
  texte(n ? `Le voleur prend ${n} dinar${n > 1 ? 's' : ''} !` : 'Le voleur n’a rien trouvé !', e.x, e.y - 80, '#ffb3b3', 20); son('vole'); h.inv = Math.max(h.inv, .8); }
function coup(e, n){ const g = G; if(e.E.type === 'boss'){ if(e.inv > 0) return; e.pv -= Math.max(1, n > 0 ? 1 : 0); e.inv = .8; eclat(e.x, e.y - e.h / 2, '#ffe066', 18); son('coup');
    if(e.pv <= 0){ e.etat = 'fuite'; e.face = Math.sign(e.x - g.h.x) || 1; g.bossVaincu = true; son('victoire'); texte(`${e.E.nom.replace(/^le /, 'Le ')} s’enfuit ! 🎉`, e.x, e.y - e.h - 20, '#ffe066', 26); dire('Bravo ! ' + e.E.nom + ' s’enfuit. La sortie est ouverte !'); }
    else { e.etat = 'etourdi'; e.tm = e.E.etourdi; e.vx = 0; texte('💫', e.x, e.y - e.h - 6, '#ffffff', 26); } return; }
  e.pv -= n; eclat(e.x, e.y - e.h / 2, '#ffffff', 10);
  if(e.butin){ for(let i = 0; i < e.butin; i++) g.piecesP.push({ x:e.x + (i - 1) * 18, y:e.y - 30, ok:true, saute:1 }); texte('Tes dinars ! 🪙', e.x, e.y - 80, '#ffe066'); e.butin = 0; }
  if(e.pv <= 0){ e.etat = 'fuite'; e.face = Math.sign(e.x - g.h.x) || 1; const cri = { z:'Miaou ! 🐾', d:'Ouaf… 🐕', m:'Cuiii !', b:'Cuiii !', h:'Bêêê !', a:'Couic !', s:'Ouste ! 💨', x:'Ouste ! 💨' }[e.t] || 'Ouste ! 💨';
    texte(cri, e.x, e.y - e.h - 16, '#ffe066', 22); G.chasses = (G.chasses || 0) + 1; }
  else if(n > 0 || e.etat !== 'etourdi'){ e.etat = 'etourdi'; e.tm = e.E.etourdi; e.vx = 0; texte('💫', e.x, e.y - e.h - 6, '#ffffff', 22); } }

/* ---------- les boss : marche, charge, tir ; on les étourdit avec les objets, puis on leur saute dessus ---------- */
function boss(e, h, dt, k){ const g = G, E = e.E;
  e.inv = Math.max(0, (e.inv || 0) - dt);
  if(e.etat === 'attend'){ if(Math.abs(h.x - e.x) < 11 * T && Math.abs(h.y - e.y) < 5 * T){ e.etat = 'marche'; e.tm = 2; texte(E.nom.replace(/^le /, 'Le ') + ' !', e.x, e.y - e.h - 20, '#ff9f6b', 28); dire('Attention, voici ' + E.nom + ' ! Lance-lui des objets, puis saute-lui dessus quand il est étourdi.'); } gravite(e, dt); return; }
  e.tm -= dt; const dx = h.x - e.x;
  if(e.etat === 'etourdi'){ e.vx = 0; if(e.tm <= 0){ e.etat = 'marche'; e.tm = 1.5; } }
  else if(e.etat === 'marche'){ e.face = Math.sign(dx) || e.face; e.vx = e.face * E.vit * k; marche(e, dt); if(e.tm <= 0){ e.cycle = (e.cycle || 0) + 1; if(e.cycle % 2){ e.etat = 'tir'; e.tm = 1.6; e.tirs = 3; e.tirT = .3; } else { e.etat = 'prepare'; e.tm = .7; e.vx = 0; texte('!', e.x, e.y - e.h - 12, '#ff5a5a', 30); } } }
  else if(e.etat === 'prepare'){ e.face = Math.sign(dx) || e.face; if(e.tm <= 0){ e.etat = 'charge'; e.tm = 2.4; } }
  else if(e.etat === 'charge'){ e.vx = e.face * E.charge * k; const nx = e.x + e.vx * dt;
    if(boite(nx - e.w / 2, e.y - 40, nx + e.w / 2, e.y - 4)){ e.etat = 'etourdi'; e.tm = E.etourdi; e.vx = 0; son('coup'); texte('Boum ! 💫', e.x, e.y - e.h - 10, '#ffe066', 26); eclat(e.x + e.face * e.w / 2, e.y - 30, '#d9cbb0', 14); }
    else { e.x = nx; if(e.tm <= 0){ e.etat = 'marche'; e.tm = 2; } } }
  else if(e.etat === 'tir'){ e.vx = 0; e.face = Math.sign(dx) || e.face; e.tirT -= dt; if(e.tirT <= 0 && e.tirs > 0){ e.tirs--; e.tirT = .45; e.lance = .3; tire(e, h, E.proj, e.h * .7); } if(e.tm <= 0){ e.etat = 'marche'; e.tm = 2.2; } }
  e.lance = Math.max(0, (e.lance || 0) - dt);
  gravite(e, dt);
  // contact : si le boss est étourdi, on peut lui sauter dessus ; sinon il fait mal
  if(h.mort || g.fini) return;
  if(Math.abs(h.x - e.x) < e.w / 2 + HW - 4 && h.y > e.y - e.h + 4 && h.y - HH < e.y){
    if(e.etat === 'etourdi' && h.vy > 40 && h.y - (e.y - e.h) < 30){ h.vy = -520; h.tenu = true; coup(e, 1); }
    else if(e.etat !== 'etourdi') blesse(h, false, e.x, 1);
    else { h.vx = Math.sign(h.x - e.x) * 200; } } }

/* ---------- les projectiles (oranges, bulles, braises) ---------- */
function tirs(dt, h){ const g = G;
  g.tirs = g.tirs.filter(o => { o.vy += PH.g * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += dt * 8; o.vie -= dt;
    if(!h.mort && Math.abs(o.x - h.x) < 14 && o.y > h.y - (h.bas ? HHbas : HH) - 6 && o.y < h.y){ blesse(h, false, o.x); eclat(o.x, o.y, o.im === 'braise' ? '#ff7b1c' : o.im === 'bulle' ? '#bfe6ff' : '#ff9f1c', 8); return false; }
    if(boite(o.x - 4, o.y - 4, o.x + 4, o.y + 4)){ eclat(o.x, o.y, o.im === 'braise' ? '#ff7b1c' : o.im === 'bulle' ? '#bfe6ff' : '#ff9f1c', 6); return false; }
    return o.vie > 0; }); }

/* ---------- les coups, les vies ---------- */
function blesse(h, cactus, depuis, deg = 1){ const g = G; if(h.inv > 0 || h.mort || g.fini) return;
  g.coeurs = Math.max(0, g.coeurs - deg); g.flash = .5; h.inv = 1.5; son('aie'); h.vy = -330; h.sol = false; h.monte = false; h.vx = (depuis !== undefined ? Math.sign(h.x - depuis) || -h.face : -h.face) * 220;
  if(h.vehicule) descend(false);
  if(h.porte && h.porte.e){ const e = h.porte.e; h.porte = null; e.etat = 'etourdi'; e.tm = .8; e.y = h.y; }
  else if(h.porte){ h.porte.etat = 'pose'; h.porte.x = h.x; h.porte.y = h.y; h.porte = null; }
  if(g.coeurs <= 0) perdVie(); }
function perdVie(){ const g = G, h = g.h; if(h.mort) return; h.mort = true; h.mortT = 0; h.vy = -500; son('chute'); g.vies--; if(h.vehicule){ h.vehicule.pris = false; h.vehicule.x = h.vehicule.x0; h.vehicule.y = h.vehicule.y0; h.vehicule = null; } }
function reprise(gratuit){ const g = G; if(!gratuit && g.vies <= 0){ etat = 'fin'; ambStop(); S2J.surFin && S2J.surFin({ perdu:true, g }); return; }
  const n = g.n, d = g.diff; charger(n, d, true); G.vies = g.vies; G.dinars = g.dinars; G.coeurs = G.D.coeurs; if(!G.check) { G.h.x = G.depart.x; G.h.y = G.depart.y; } G.h.inv = 1.5; }
function gagne(){ const g = G; if(g.fini) return; g.fini = true; g.h.vx = 0; if(g.h.vehicule){ g.h.vehicule = null; } son('victoire'); setTimeout(() => son('fete'), 500); ambVolume(.08); eclat(g.h.x, g.h.y - 40, '#ffe066', 30);
  setTimeout(() => { if(G !== g) return; etat = 'fin'; ambStop(); S2J.surFin && S2J.surFin({ perdu:false, g }); }, 3200); }   // 3,2 s : le temps de danser

/* ---------- effets ---------- */
function texte(s, x, y, c = '#ffffff', taille = 18){ G.textes.push({ s, x, y, c, taille, vie:1.6 }); }
function eclat(x, y, c, n = 10){ for(let k = 0; k < n; k++) G.parts.push({ x, y, vx:(Math.random() - .5) * 360, vy:-Math.random() * 300, vie:.7 + Math.random() * .4, c, r:2 + Math.random() * 3 }); }
function effets(dt){ const g = G; g.parts = g.parts.filter(p => { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; return (p.vie -= dt) > 0; }); g.textes = g.textes.filter(t => { t.y -= 30 * dt; return (t.vie -= dt) > 0; });
  g.piecesP.forEach(p => { if(p.saute){ p.saute -= dt * 2; if(p.saute < 0) p.saute = 0; } }); g.flash = Math.max(0, (g.flash || 0) - dt); }

/* ---------- le héros (planches « en vrai » du Jasmin : 6 × 4 images, 0-11 la foulée, 12-19 le bond, 20 de profil, 21 de face)
   + les gestes du Stage 2 faits avec ComfyUI (stage2/heros/<id>.webp, 12 × 5 : grimper, ramper, accroupi, porter, lancer ; voir heros.js) ---------- */
const PEOPLE = ['essil', 'salma', 'amine', 'anis', 'imen'], TAILLE2 = { amine:.8, salma:.9, essil:.97, nour:.92, yasmine:.92, anis:1.08, imen:1.05, fares:1.04 };
let corps = null, gestes = null;
function idDe(nom){ const k = (nom || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); if(PEOPLE.includes(k)) return k; const h = window.Famille && Famille.head ? Famille.head(nom) : null; return h && TAILLE2[h.id] ? h.id : 'nour'; }
function chargeCorps(nom, tenue){ corps = null; gestes = null; const id = idDe(nom), im = new Image();
  im.onload = () => { const cw = im.naturalWidth / 6, ch = im.naturalHeight / 4, c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(im, 2 * cw, 3 * ch, cw, ch, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data; let top = ch, feet = 0; for(let y = 0; y < ch; y++){ let n = 0; for(let q = 0; q < cw; q++) if(d[(y * cw + q) * 4 + 3] > 120) n++; if(n > 2){ if(y < top) top = y; feet = y; } }
    corps = { im, cw, ch, top, feet, k:TAILLE2[id] }; };
  im.onerror = () => { if(tenue && tenue !== 'classique') chargeCorps(nom, 'classique'); };
  im.src = `jasmin2/corps-${id}${tenue && tenue !== 'classique' ? '-' + tenue : ''}.webp?v=2`;
  // les gestes (seulement s'ils existent pour cette tenue)
  const cle = id + (tenue && tenue !== 'classique' ? '-' + tenue : ''), meta = (window.S2_GESTES || {})[cle];
  if(meta){ const gi = new Image(); gi.onload = () => { gestes = Object.assign({ im:gi }, meta); }; gi.src = `stage2/heros/${cle}.webp?v=${meta.v || 1}`; } }
const hauteurHeros = () => corps ? 76 * corps.k : 70;
const GL = { grimpe:0, rampe:1, accroupi:2, porte:3, lance:4, danse:5 };
function geste(nom, f, flip){ // dessine une image des gestes (pieds en bas de la case), renvoie false si absente
  if(!gestes || !gestes.n || !gestes.n[GL[nom]]) return false; const gs = gestes, n = gs.n[GL[nom]], i = ((f % n) + n) % n, sc = 76 * corps.k / gs.ref, w = gs.cw * sc, hh = gs.ch * sc;
  ctx.save(); if(flip) ctx.scale(-1, 1); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(gs.im, i * gs.cw, GL[nom] * gs.ch, gs.cw, gs.ch, -w / 2, -hh + (gs.pied ? gs.pied * sc : 0), w, hh); ctx.restore(); return true; }
function dessineVehicule(v, t){ const h = G.h, porte = h.vehicule === v;
  ctx.save(); ctx.translate(v.x, v.y);
  if(v.k === 'N'){ const im = IM.scooter; if(ok(im)){ const hh = 46, w = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, -w / 2 + 4, -hh + 2, w, hh); } else { ctx.fillStyle = '#c4122f'; ctx.fillRect(-24, -24, 48, 16); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-16, -6, 7, 0, 7); ctx.arc(16, -6, 7, 0, 7); ctx.fill(); } }
  else { const im = IM.tapis, ond = Math.sin(t * 6) * 3; if(ok(im)){ const w = 86, hh = w * im.naturalHeight / im.naturalWidth; ctx.translate(0, ond); ctx.drawImage(im, -w / 2, -hh / 2 + (porte ? 0 : 0), w, hh); } else { ctx.fillStyle = '#b4235a'; ctx.fillRect(-40, -6 + ond, 80, 10); }
    if(!porte){ ctx.fillStyle = '#ffe066'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✨', 0, -24 + Math.sin(t * 3) * 4); } }
  ctx.restore(); }
function dessineHeros(t){
  const h = G.h; if(h.inv > 0 && Math.sin(t * 40) > 0 && !h.mort) return;
  if(h.vehicule) dessineVehicule(h.vehicule, t);
  ctx.save(); ctx.translate(h.x, h.y + (h.vehicule && h.vehicule.k === 'N' ? -18 : h.vehicule ? -6 + Math.sin(t * 6) * 3 : 0));
  if(h.mort) ctx.rotate(Math.min(1.4, h.mortT * 3) * -h.face);
  const sq = h.ecrase || 0; h.ecrase = Math.max(0, sq - .02);
  if(!corps){ ctx.fillStyle = '#1f5fbf'; ctx.fillRect(-10, -60, 20, 60); ctx.restore(); return; }
  const run = Math.abs(h.vx) / PH.course, fl = h.face < 0;
  // les gestes ComfyUI quand ils existent
  if(!h.mort && G.fini && gestes && geste('danse', Math.floor(h.gagne * 10), false)){ ctx.restore(); return; }
  if(!h.mort && !G.fini && gestes){
    let fait = false;
    if(h.monte) fait = geste('grimpe', Math.floor((h.pm || 0) / 22) % 2, false);
    else if(h.vehicule && h.vehicule.k === 'A') fait = geste('accroupi', 0, fl);
    else if(h.lance > 0 && h.lance < .3 && !h.porte) fait = geste('porte', 3, fl);   // on lance par-dessus la tête (l'image « lancer » de ComfyUI garde une balle dans la main)
    else if(h.bas && h.sol) fait = run > .05 ? geste('rampe', Math.floor(h.phase * 1.6), fl) : geste('accroupi', 0, fl);
    else if(h.porte && !h.monte) fait = geste('porte', h.sol && run > .05 ? Math.floor(h.phase * 1.9) : 0, fl);
    if(fait){ ctx.restore(); return; } }
  const b = corps, sc = 76 * b.k / (b.feet - b.top), w = b.cw * sc, hh = b.ch * sc;
  let f, sx = 1, sy = 1;
  if(h.mort) f = 15; else if(G.fini) f = 21;
  else if(h.vehicule) f = h.vehicule.k === 'N' ? 20 : 20;
  else if(h.monte){ f = 21; sx = Math.floor((h.pm || 0) / 22) % 2 ? -1 : 1; }
  else if(h.lance > 0) f = 13;
  else if(!h.sol) f = h.vy < -260 ? 13 : h.vy < -90 ? 14 : h.vy < 90 ? 15 : h.vy < 300 ? 16 : 17;
  else if(run > .08) f = Math.floor((((h.phase / (Math.PI * 2)) % 1) + 1) % 1 * 12); else f = 20;
  if(h.bas){ sy = .6; if(run > .05) sx = 1.12; }
  if(h.vehicule && h.vehicule.k === 'A') sy = .78;
  ctx.scale((h.face < 0 && f !== 21 ? -1 : 1) * sx * (1 + sq * .2), sy * (1 - sq * .2));
  if(G.fini) ctx.translate(0, -Math.abs(Math.sin(h.gagne * 7)) * 18);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b.im, (f % 6) * b.cw, Math.floor(f / 6) * b.ch, b.cw, b.ch, -w / 2, -b.feet * sc + 1, w, hh);
  ctx.restore();
}

/* ---------- le dessin ---------- */
let DPR = 1, CW = 0, CH = 0, SC = 1;
function taille(){ DPR = Math.min(2, devicePixelRatio || 1); CW = innerWidth; CH = innerHeight; cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR); SC = Math.min(CH / (VH_CASES * T), CW / (18 * T)); }   // en portrait : au moins 18 cases de large
addEventListener('resize', taille); taille();
function tuileImg(im, cx, cy, x, y, n = 6){ const s = im.naturalWidth / n; ctx.drawImage(im, (((cx % n) + n) % n) * s, (((cy % n) + n) % n) * s, s, s, x, y, T + .5, T + .5); }
const nuit = document.createElement('canvas'), nctx = nuit.getContext('2d');
function dessine(t){
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if(!G){ ctx.fillStyle = '#0b1e46'; ctx.fillRect(0, 0, CW, CH); return; }
  const g = G, h = g.h, VW = CW / SC, VHp = CH / SC, M = g.M;
  // la caméra : elle regarde un peu devant, et suit en hauteur
  const cibleX = h.x - VW / 2 + h.face * 70, cibleY = h.y - VHp * .58;
  const basEnPlus = Math.max(0, VHp - 15 * T);   // écran haut (portrait) : on laisse voir le sous-sol sous la rue
  g.camX += (Math.max(0, Math.min(g.W * T - VW, cibleX)) - g.camX) * .1; g.camY += (Math.max(0, Math.min(g.H * T - VHp + basEnPlus, cibleY)) - g.camY) * .1;
  if(g.W * T < VW) g.camX = (g.W * T - VW) / 2;
  const cx0 = g.camX, cy0 = g.camY;
  // le ciel, la photo du fond (parallaxe), les façades
  const ciel = M.ciel || ['#7fb8ec', '#f5e6c8'];
  const gr = ctx.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, ciel[0]); gr.addColorStop(1, ciel[1]); ctx.fillStyle = gr; ctx.fillRect(0, 0, CW, CH);
  ctx.save(); ctx.scale(SC, SC);
  const fond = W_('fond');
  if(ok(fond)){ const fh = VHp * 1.15, fw = fh * fond.naturalWidth / fond.naturalHeight, px = -(cx0 * .15) % fw, py = -((cy0 - (g.H * T - VHp)) * .25) - (fh - VHp) * .5;
    if(M.sombre) ctx.globalAlpha = .55; for(let x = px - fw; x < VW; x += fw) ctx.drawImage(fond, x, py, fw, fh); ctx.globalAlpha = 1; }
  const mais = (M.img || []).includes('maisons') ? W_('maisons') : null;
  if(ok(mais)){ const mh = 10 * T, mw = mh * mais.naturalWidth / mais.naturalHeight, sol = (g.H - 3) * T, px = -(cx0 * .45) % mw, py = sol - mh - cy0 * .6;
    ctx.globalAlpha = .92; for(let x = px - mw; x < VW; x += mw) ctx.drawImage(mais, x, py, mw, mh); ctx.globalAlpha = 1; }
  ctx.translate(-Math.round(cx0 * 100) / 100, -Math.round(cy0 * 100) / 100);
  // les cases
  const x0 = Math.max(0, Math.floor(cx0 / T) - 1), x1 = Math.min(g.W - 1, Math.ceil((cx0 + VW) / T) + 1), y0 = Math.max(0, Math.floor(cy0 / T) - 1), y1 = Math.ceil((cy0 + VHp) / T) + 1;
  const mur = W_('t_mur'), dessus = W_('t_dessus'), planche = W_('t_planche'), fiss = W_('t_fissure'), ech = W_('echelle'), grille = W_('grille'), verrou = W_('porte_verrou');
  const tG = W_('t_glisse'), tS = W_('t_sable'), tE = W_('t_eau'), tX = W_('t_effondre'), tU = W_('t_rebond'), pic = (M.img || []).includes('pic') ? W_('pic') : IM.cactus;
  for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){
    const c = y < g.H ? g.m[y][x] : (SOLIDES.includes(g.m[g.H - 1][x]) ? '#' : '.'), X = x * T, Y = y * T;
    if(c === '#' || c === 'F' || c === 'B' || c === 'I' || c === 'Y'){
      const im = c === 'B' && ok(fiss) ? fiss : c === 'I' && ok(tG) ? tG : c === 'Y' && ok(tS) ? tS : mur;
      if(ok(im)) tuileImg(im, x, y, X, Y); else { ctx.fillStyle = c === 'B' ? '#c9b48e' : '#e8dcc4'; ctx.fillRect(X, Y, T + .5, T + .5); }
      if(c === 'B' && !ok(fiss)){ ctx.strokeStyle = '#6b5a3e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X + 6, Y + 4); ctx.lineTo(X + 16, Y + 16); ctx.lineTo(X + 10, Y + 28); ctx.stroke(); }
      if(c === 'I'){ ctx.fillStyle = 'rgba(255,255,255,' + (.12 + .08 * Math.sin(t * 2 + x)) + ')'; ctx.fillRect(X + 4, Y + 2, T - 8, 3); }
      const dessusLibre = y < g.H && (!SOLIDES.includes(tile(x, y - 1)) || tile(x, y - 1) === 'G');
      if(dessusLibre && c !== 'B' && c !== 'I' && c !== 'Y'){ if(ok(dessus)) ctx.drawImage(dessus, ((x % 6) + 6) % 6 * dessus.naturalWidth / 6, 0, dessus.naturalWidth / 6, dessus.naturalHeight, X, Y - 4, T + .5, 12); else { ctx.fillStyle = '#2f8f5b'; ctx.fillRect(X, Y - 3, T + .5, 9); } }
      if(dessusLibre){ ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(X, Y + 8, T + .5, 3); }
    }
    else if(c === 'X'){ const e = g.eff.get(x + ',' + y); if(e && e.etat === 'tombe') continue; const dx = e ? (Math.random() - .5) * 4 : 0;
      if(ok(tX)) ctx.drawImage(tX, ((x % 3) + 3) % 3 * tX.naturalWidth / 3, 0, tX.naturalWidth / 3, tX.naturalHeight / 3, X + dx, Y, T + .5, T + .5); else { ctx.fillStyle = '#b5562f'; ctx.fillRect(X + dx + 1, Y + 1, T - 2, T - 2); ctx.strokeStyle = '#7a3418'; ctx.strokeRect(X + dx + 1, Y + 1, T - 2, T - 2); } }
    else if(c === 'U'){ const sq = Math.abs(h.x - X - 16) < 30 && Math.abs(h.y - Y) < 8 ? 4 : 0;
      if(ok(tU)) ctx.drawImage(tU, ((x % 3) + 3) % 3 * tU.naturalWidth / 3, 0, tU.naturalWidth / 3, tU.naturalHeight, X, Y + sq, T + .5, T - sq); else { ctx.fillStyle = (x % 2) ? '#d7263d' : '#fff'; ctx.fillRect(X, Y + sq, T + .5, 14); } }
    else if(c === 'W'){ const top = tile(x, y - 1) !== 'W'; ctx.save(); ctx.globalAlpha = .82;
      if(ok(tE)){ const s = tE.naturalWidth / 6, o = (t * 20) % s; ctx.drawImage(tE, ((x % 6) + 6) % 6 * s + 0, 0, s - o / 6, s, X, Y + (top ? 6 + Math.sin(t * 2 + x) * 2 : 0), T + .5, T + .5 - (top ? 6 : 0)); }
      else { ctx.fillStyle = '#2a7fb8'; ctx.fillRect(X, Y + (top ? 8 : 0), T + .5, T + .5); }
      if(top){ ctx.globalAlpha = .6; ctx.fillStyle = '#d8f1ff'; ctx.fillRect(X, Y + 6 + Math.sin(t * 2 + x) * 2, T + .5, 2); } ctx.restore(); }
    else if(c === '=' ){ if(ok(planche)) ctx.drawImage(planche, ((x % 4) + 4) % 4 * planche.naturalWidth / 4, 0, planche.naturalWidth / 4, planche.naturalHeight / 6, X, Y, T + .5, 12); else { ctx.fillStyle = '#2b8a8a'; ctx.fillRect(X, Y, T + .5, 10); } ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(X, Y + 12, T + .5, 2); }
    else if(c === 'H'){ if(ok(ech)){ const s = ech.naturalHeight / 2; ctx.drawImage(ech, 0, (y % 2) * s, ech.naturalWidth, s, X - 4, Y, T + 8, T + .5); } else { ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X + 6, Y); ctx.lineTo(X + 6, Y + T); ctx.moveTo(X + 26, Y); ctx.lineTo(X + 26, Y + T); ctx.moveTo(X + 6, Y + 10); ctx.lineTo(X + 26, Y + 10); ctx.moveTo(X + 6, Y + 26); ctx.lineTo(X + 26, Y + 26); ctx.stroke(); } }
    else if(c === '^'){ if(ok(pic)){ const hh = 40, ww = Math.min(44, hh * pic.naturalWidth / pic.naturalHeight); ctx.drawImage(pic, X + 16 - ww / 2, Y + T - hh, ww, hh); } else { ctx.fillStyle = '#3d8b3d'; ctx.beginPath(); ctx.moveTo(X, Y + T); ctx.lineTo(X + 16, Y + 6); ctx.lineTo(X + 32, Y + T); ctx.fill(); } }
    else if(c === 'G'){ const ouv = g.ouvert.has(x + ',' + y); ctx.save(); if(ouv) ctx.globalAlpha = .18; if(ok(grille)) ctx.drawImage(grille, 0, ((y % 3) + 3) % 3 * grille.naturalHeight / 3, grille.naturalWidth, grille.naturalHeight / 3, X - 2, Y, T + 4, T + .5); else { ctx.fillStyle = '#222'; for(let k = 4; k < T; k += 9) ctx.fillRect(X + k, Y, 3, T); } ctx.restore(); }
    else if(c === 'D'){ if(!g.ouvert.has(x + ',' + y) && tile(x, y - 1) !== 'D'){ let n = 0; while(tile(x, y + n) === 'D') n++; if(ok(verrou)) ctx.drawImage(verrou, X - 10, Y, T + 20, n * T); else { ctx.fillStyle = '#1f5fbf'; ctx.fillRect(X - 6, Y, T + 12, n * T); ctx.fillStyle = '#222'; ctx.fillRect(X + 10, Y + n * T / 2, 12, 14); }
      ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔒', X + 16, Y - 6); } }
  }
  // les passages secrets (petites portes basses)
  g.passages.forEach(p => { ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.moveTo(-15, 0); ctx.lineTo(-15, -18); ctx.arc(0, -18, 15, Math.PI, 0); ctx.lineTo(15, 0); ctx.fill();
    ctx.strokeStyle = '#a8865a'; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#ffe066'; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▼', 0, -8 + Math.sin(t * 4) * 2);
    if(h.passT > 0 && Math.abs(p.x - h.x) < 18){ ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -46, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * h.passT / PH.passage); ctx.stroke(); } ctx.restore(); });
  // la sortie, les lanternes, les panneaux, les leviers
  if(g.sortie){ const ps = W_('porte_sortie'), w = 72, hh = 104, ferme = g.boss && !g.bossVaincu; ctx.save(); if(ferme) ctx.filter = 'brightness(.55)'; if(ok(ps)) ctx.drawImage(ps, g.sortie.x - w / 2, g.sortie.y - hh, w, hh); else { ctx.fillStyle = '#1f5fbf'; ctx.fillRect(g.sortie.x - 30, g.sortie.y - 90, 60, 90); } ctx.restore();
    ctx.fillStyle = '#ffe066'; ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(ferme ? '🔒 SORTIE' : 'SORTIE', g.sortie.x, g.sortie.y - hh - 6); }
  g.lanternes.forEach(l => { const im = IM.lanterne; if(l.on){ const r = ctx.createRadialGradient(l.x, l.y - 50, 4, l.x, l.y - 50, 60); r.addColorStop(0, 'rgba(255,220,120,.55)'); r.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = r; ctx.fillRect(l.x - 60, l.y - 110, 120, 120); }
    if(ok(im)){ const hh = 56, w = hh * im.naturalWidth / im.naturalHeight; ctx.save(); if(!l.on) ctx.filter = 'grayscale(.7) brightness(.8)'; ctx.drawImage(im, l.x - w / 2, l.y - hh, w, hh); ctx.restore(); } });
  g.panneaux.forEach(p => { const im = IM.panneau; if(ok(im)){ const hh = 46, w = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, p.x - w / 2, p.y - hh, w, hh); } else { ctx.fillStyle = '#8a5a2b'; ctx.fillRect(p.x - 14, p.y - 40, 28, 22); ctx.fillRect(p.x - 2, p.y - 18, 4, 18); }
    ctx.fillStyle = '#fff'; ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('?', p.x, p.y - 26); });
  g.leviers.forEach(l => { const im = W_('levier'), hh = 40; ctx.save(); ctx.translate(l.x, l.y); if(l.on) ctx.scale(1, -1); if(ok(im)){ const w = hh * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, -w / 2, -hh / 2, w, hh); } else { ctx.fillStyle = '#555'; ctx.fillRect(-10, -8, 20, 16); ctx.fillStyle = '#c4122f'; ctx.fillRect(-3, -22, 6, 16); } ctx.restore(); });
  // les rochers
  g.rochers.forEach(r => { if(r.etat === 'parti') return; const sh = r.etat === 'tremble' ? (Math.random() - .5) * 5 : 0, im = W_('pierre'); ctx.save(); ctx.translate(r.x + sh, r.y);
    if(ok(im)) ctx.drawImage(im, -15, -26, 30, 30); else { ctx.fillStyle = '#8b7f6e'; ctx.beginPath(); ctx.arc(0, -12, 14, 0, 7); ctx.fill(); } ctx.restore();
    if(r.etat === 'tremble'){ ctx.fillStyle = 'rgba(200,180,150,.7)'; for(let k = 0; k < 3; k++) ctx.fillRect(r.x - 10 + Math.random() * 20, r.y + Math.random() * 30, 2, 2); } });
  // les plateformes mobiles (planches, barques, train)
  const pimg = M.platImg ? IM[M.platImg] : null, trn = W_('train');
  g.plats.forEach(p => { if(p.train){ const im = ok(trn) && (M.img || []).includes('train') ? trn : IM.train; if(ok(im)){ const hh = p.w * im.naturalHeight / im.naturalWidth; ctx.drawImage(im, p.x - 6, p.y - 8, p.w + 12, hh); } else { ctx.fillStyle = '#2f9e44'; ctx.fillRect(p.x, p.y, p.w, 40); } return; }
    if(ok(pimg)){ const hh = (p.w + 24) * pimg.naturalHeight / pimg.naturalWidth; ctx.drawImage(pimg, p.x - 12, p.y - hh * .35, p.w + 24, hh); return; }
    if(ok(planche)) ctx.drawImage(planche, 0, 0, planche.naturalWidth / 2, planche.naturalHeight / 6, p.x, p.y, p.w, 14); else { ctx.fillStyle = '#2b8a8a'; ctx.fillRect(p.x, p.y, p.w, 12); } ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(p.x, p.y + 14, p.w, 3); });
  // dinars et jasmins
  const pc = IM.piece, jo = IM.jasmin;
  g.piecesP.forEach(p => { if(!p.ok) return; const bob = Math.sin(t * 4 + p.x) * 2 - (p.saute || 0) * 20; if(ok(pc)){ const s = 22; ctx.drawImage(pc, p.x - s / 2, p.y - s / 2 + bob, s, s); } else { ctx.fillStyle = '#ffc93c'; ctx.beginPath(); ctx.arc(p.x, p.y + bob, 9, 0, 7); ctx.fill(); } });
  g.gemmes.forEach(j => { const bob = Math.sin(t * 3) * 4; if(ok(jo)){ const s = 34; ctx.drawImage(jo, j.x - s / 2, j.y - s / 2 + bob, s, s); } else { ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(j.x, j.y + bob, 12, 0, 7); ctx.fill(); } });
  // les véhicules libres, les objets, les ennemis, le héros
  g.vehicules.forEach(v => { if(!v.pris) dessineVehicule(v, t); });
  g.objs.forEach(o => { if(o.etat !== 'porte') dessineObjet(o); });
  g.ens.forEach(e => { if(e.etat === 'lance') dessinePris(e, t); else if(e.etat !== 'porte') dessineEnnemi(e, t); });
  dessineHeros(t);
  if(g.h.porte && g.h.porte.e) dessinePris(g.h.porte.e, t); else if(g.h.porte) dessineObjet(g.h.porte, true);
  // les projectiles
  g.tirs.forEach(o => { const im = IM[o.im]; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    if(o.im === 'bulle'){ ctx.fillStyle = 'rgba(190,230,255,.75)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); ctx.stroke(); }
    else if(ok(im)){ const s = o.im === 'braise' ? 22 : 18; ctx.drawImage(im, -s / 2, -s / 2, s, s * im.naturalHeight / im.naturalWidth); } else { ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill(); } ctx.restore(); });
  g.parts.forEach(p => { ctx.globalAlpha = Math.min(1, p.vie * 2); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
  // la nuit des souterrains : on voit autour du héros et des lanternes
  if(M.sombre) nuitDessine(g, cx0, cy0, VW, VHp, t);
  g.textes.forEach(x => { ctx.globalAlpha = Math.min(1, x.vie * 2); ctx.font = `800 ${x.taille}px "Baloo 2", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,20,40,.7)'; ctx.strokeText(x.s, x.x, x.y); ctx.fillStyle = x.c; ctx.fillText(x.s, x.x, x.y); }); ctx.globalAlpha = 1;
  ctx.restore();
  if(g.flash){ ctx.fillStyle = `rgba(255,60,60,${g.flash * .35})`; ctx.fillRect(0, 0, CW, CH); }
  hud(t);
}
function nuitDessine(g, cx0, cy0, VW, VHp, t){
  const w = Math.ceil(VW / 2), hh = Math.ceil(VHp / 2); if(nuit.width !== w || nuit.height !== hh){ nuit.width = w; nuit.height = hh; }
  nctx.globalCompositeOperation = 'source-over'; nctx.clearRect(0, 0, w, hh); nctx.fillStyle = 'rgba(4,6,14,.9)'; nctx.fillRect(0, 0, w, hh);
  nctx.globalCompositeOperation = 'destination-out';
  const trou = (x, y, r, a) => { const X = (x - cx0) / 2, Y = (y - cy0) / 2, R = r / 2; if(X < -R || Y < -R || X > w + R || Y > hh + R) return; const gr = nctx.createRadialGradient(X, Y, R * .25, X, Y, R); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); nctx.fillStyle = gr; nctx.fillRect(X - R, Y - R, R * 2, R * 2); };
  const h = g.h; trou(h.x, h.y - 30, 230 + Math.sin(t * 7) * 6, 1);
  g.lanternes.forEach(l => trou(l.x, l.y - 50, l.on ? 260 : 70, l.on ? 1 : .6));
  if(g.sortie) trou(g.sortie.x, g.sortie.y - 50, 120, .8);
  g.gemmes.forEach(j => trou(j.x, j.y, 60, .7)); g.tirs.forEach(o => trou(o.x, o.y, 60, .8));
  ctx.drawImage(nuit, cx0, cy0, w * 2, hh * 2); }
function dessineObjet(o, porte){
  const k = o.k, im = k === 'J' ? IM.jarre : W_({ C:'caisse', O:'ballon', P:'pierre', S:'sac', K:'cle' }[k]);
  const hh = { C:32, J:38, O:24, P:22, S:32, K:18 }[k];
  ctx.save(); ctx.translate(o.x, o.y); if(o.etat === 'vol' && k !== 'C' && k !== 'S') ctx.rotate(o.rot || 0);
  if(ok(im)){ const w = Math.min(44, hh * im.naturalWidth / im.naturalHeight); ctx.drawImage(im, -w / 2, -hh, w, hh); }
  else { ctx.fillStyle = { C:'#a0703a', J:'#c87b3e', O:'#8b5a2b', P:'#888', S:'#c8a96b', K:'#333' }[k]; if(k === 'O' || k === 'P'){ ctx.beginPath(); ctx.arc(0, -hh / 2, hh / 2, 0, 7); ctx.fill(); } else ctx.fillRect(-hh / 2, -hh, hh, hh); }
  ctx.restore();
  if(!porte && o.etat === 'pose' && G.h && !G.h.porte && !G.h.vehicule && Math.abs(o.x - G.h.x) < 52 && Math.abs(o.y - G.h.y) < 36){ ctx.fillStyle = '#ffe066'; ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('↓ + Espace', o.x, o.y - hh - 8 + Math.sin(performance.now() / 200) * 3); }
}
// l'ennemi capturé : son image « tout triste » (ComfyUI) ; sinon son image à l'envers ; il se débat de plus en plus
function dessinePris(e, t){
  const E = e.E, nom = (G.M.sprites || {})[e.t] || E.sp, sp = sprite(nom), hh = (sp ? sp.h : e.h) * 1.05, deb = e.etat === 'porte' ? Math.min(1, (e.prisT || 0) / 6) : 0;
  ctx.save(); ctx.translate(e.x, e.y); if(e.etat === 'lance') ctx.rotate(e.rot || 0); else ctx.rotate(Math.sin(t * (6 + deb * 14)) * (.05 + deb * .18));
  ctx.scale(e.face < 0 ? -1 : 1, 1);
  if(sp && ok(sp.pr)){ const iw = sp.pr.naturalWidth, ih = sp.pr.naturalHeight;
    if(ih > iw * 1.2){ // un personnage debout : on le porte couché sur les mains, comme un sac (la tête devant)
      const L = hh * .95, E = L * iw / ih; ctx.translate(0, -E / 2 + 4); ctx.rotate(-Math.PI / 2); ctx.drawImage(sp.pr, -L / 2, -E / 2, L, E); }
    else { const w = hh * iw / ih; ctx.drawImage(sp.pr, -w / 2, -hh + 6, w, hh); } }
  else if(sp && ok(sp.im)){ const cw = sp.im.naturalWidth / 12, ch = sp.im.naturalHeight / (sp.rows || 1), w = hh * cw / ch; ctx.scale(1, -1); ctx.drawImage(sp.im, 0, 0, cw, ch, -w / 2, 0, w, hh); }
  else if(sp && ok(sp.fx)){ const w = hh * sp.fx.naturalWidth / sp.fx.naturalHeight; ctx.scale(1, -1); ctx.drawImage(sp.fx, -w / 2, 0, w, hh); }
  else { ctx.fillStyle = '#7a7a7a'; ctx.fillRect(-e.w / 2, -e.h, e.w, e.h); }
  ctx.restore();
  if(e.etat === 'porte'){ ctx.save(); ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; const y = e.y - hh - 6;
    ctx.fillText('😢', e.x + 14 * Math.sin(t * 2), y); if(Math.sin(t * 5) > .3){ ctx.fillStyle = '#7fd0ff'; ctx.beginPath(); ctx.arc(e.x + 8, e.y - hh * .6 + (t * 40 % 20), 3, 0, 7); ctx.fill(); }
    if(deb > .6){ ctx.fillStyle = '#ffe066'; ctx.fillText('!', e.x - 18, y + 4); } ctx.restore(); } }
function dessineEnnemi(e, t){
  const E = e.E, nom = (G.M.sprites || {})[e.t] || E.sp, sp = sprite(nom);
  if(E.type === 'serpent' && e.etat === 'cache'){ ctx.fillStyle = 'rgba(120,90,50,.35)'; ctx.beginPath(); ctx.ellipse(e.x, e.y - 2, 12, 4, 0, 0, 7); ctx.fill(); return; }
  ctx.save(); if(e.alpha !== undefined) ctx.globalAlpha = Math.max(0, e.alpha);
  if(E.type === 'boss' && e.inv > 0 && Math.sin(t * 40) > 0) ctx.globalAlpha *= .4;
  const vol = E.type === 'vol', ey = vol ? e.y + e.h / 2 : e.y;
  ctx.translate(e.x, ey);
  if(E.type === 'serpent'){ ctx.beginPath(); ctx.rect(-60, -80, 120, 80); ctx.clip(); ctx.translate(0, (1 - (e.sortie || 0)) * 40); }
  if(e.etat === 'pendu') ctx.scale(1, -1), ctx.translate(0, e.h);
  const bouge = Math.abs(e.vx) > 5 || vol, grand = E.grand || 1;
  let hh = sp ? sp.h * grand : e.h + 4;
  const anim = sp && ok(sp.im), fixe = sp && sp.fx && ok(sp.fx);
  if(anim){ const rows = sp.rows || 1, cw = sp.im.naturalWidth / 12, ch = sp.im.naturalHeight / rows, w = hh * cw / ch;
    let f, row = 0;
    if(nom === 'marchand') f = e.lance > 0 ? 0 : Math.max(0, Math.min(11, Math.floor((1 - e.tir / E.tir) * 12)));
    else if(e.etat === 'dort' || e.etat === 'pendu') f = 0;
    else if(e.etat === 'etourdi') f = Math.floor(t * 4) % 12;
    else f = bouge || E.type === 'serpent' ? Math.floor(t * (e.etat === 'chasse' || e.etat === 'charge' || e.etat === 'file' ? 18 : 11)) % 12 : 0;
    if(nom === 'scorpionor'){ row = e.etat === 'etourdi' ? 1 : e.etat === 'tir' ? 2 : 0; f = Math.floor(t * (e.etat === 'charge' ? 20 : 10)) % 12; }
    ctx.scale(e.face < 0 ? -1 : 1, 1); ctx.drawImage(sp.im, f * cw, row * ch, cw, ch, -w / 2, -hh + (sp.dy || 0) * grand, w, hh); }
  else if(fixe){ const w = hh * sp.fx.naturalWidth / sp.fx.naturalHeight, bob = bouge ? Math.abs(Math.sin(t * 12)) * 3 : 0; ctx.scale(e.face < 0 ? -1 : 1, 1); if(e.lance > 0) ctx.rotate(-.08); ctx.drawImage(sp.fx, -w / 2, -hh - bob, w, hh); }
  else { ctx.fillStyle = { d:'#c9a46b', a:'#777', n:'#6b8e23', s:'#3b2a1a', x:'#d9481c', p:'#4a3b6b', t:'#1f3c88', h:'#eee' }[e.t] || '#7a7a7a'; ctx.fillRect(-e.w / 2, -e.h, e.w, e.h); }
  ctx.restore();
  if(e.etat === 'pendu'){ ctx.strokeStyle = 'rgba(80,60,40,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(e.x, e.y0 - 6); ctx.lineTo(e.x, e.y0 + 4); ctx.stroke(); }
  // les petits signes : z z z, !, étoiles
  ctx.save(); ctx.font = '800 16px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; const top = ey - hh - 8;
  if(e.etat === 'dort' || (e.etat === 'pendu' && Math.sin(t) > 0)){ ctx.fillStyle = '#ffffff'; ctx.fillText('z', e.x + 10 + Math.sin(t * 2) * 3, top - (t * 12 % 18)); ctx.fillText('z', e.x + 18, top - 8 - ((t * 12 + 9) % 18)); }
  if(e.etat === 'alerte' || e.etat === 'prepare'){ ctx.fillStyle = '#ff5a5a'; ctx.font = '800 26px "Baloo 2", sans-serif'; ctx.fillText('!', e.x, top); }
  if(e.etat === 'etourdi'){ for(let k = 0; k < 3; k++){ const a = t * 4 + k * 2.1; ctx.fillStyle = '#ffe066'; ctx.fillText('★', e.x + Math.cos(a) * 14 * grand, top + 6 + Math.sin(a) * 4); } }
  if(e.butin){ ctx.fillText('🪙', e.x, top - 4); }
  ctx.restore();
}
function hud(t){
  const g = G; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pad = 14 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sal')) || 0);
  ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const ligne = (s, x, y) => { ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(10,20,40,.65)'; ctx.strokeText(s, x, y); ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); };
  const barre = (x, y, w, hb, v, max, couleurs, titre) => { // une barre de vie arrondie, en morceaux
    ctx.fillStyle = 'rgba(10,20,40,.7)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 4, y - 4, w + 8, hb + 8, (hb + 8) / 2) : ctx.rect(x - 4, y - 4, w + 8, hb + 8); ctx.fill();
    const f = Math.max(0, v / max), gr = ctx.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, couleurs[0]); gr.addColorStop(1, couleurs[1]);
    ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, Math.max(hb, w * f), hb, hb / 2) : ctx.rect(x, y, w * f, hb); if(f > 0) ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + hb / 2, y + 2, Math.max(0, w * f - hb), 3);
    ctx.fillStyle = 'rgba(10,20,40,.55)'; for(let i = 1; i < max; i++) ctx.fillRect(x + w * i / max - 1, y, 2, hb);
    if(titre){ ctx.font = '800 15px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(10,20,40,.8)'; ctx.strokeText(titre, x + w / 2, y + hb / 2 + 1); ctx.fillStyle = '#fff'; ctx.fillText(titre, x + w / 2, y + hb / 2 + 1); } };
  // la barre de vie du héros, en haut au milieu
  const bw = Math.min(300, CW * .42), bx = CW / 2 - bw / 2, faible = g.coeurs / g.D.coeurs <= .34;
  ligne('❤️', bx - 34, 26); barre(bx, 16, bw, 20, g.coeurs, g.D.coeurs, faible ? ['#ff3b3b', '#ff8a5c'] : ['#e8384f', '#5ee07a'], null);
  if(faible && Math.sin(t * 8) > 0){ ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx - 6, 10, bw + 12, 32, 16) : ctx.rect(bx - 6, 10, bw + 12, 32); ctx.stroke(); }
  // la barre du boss, en dessous
  if(g.boss && g.boss.vivant && g.boss.etat !== 'attend' && !g.bossVaincu){ const w2 = Math.min(360, CW * .5); barre(CW / 2 - w2 / 2, 52, w2, 18, g.boss.pv, g.boss.pvMax, ['#ffb000', '#ff4d00'], g.boss.E.nom.replace(/^le /, 'Le ')); }
  ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'left';
  ligne(`🧒 × ${g.vies}`, pad, 28);
  ligne(`🪙 ${g.dinars}`, pad, 62); ligne(`🌼 ${g.jasmins.size}/3`, pad + 96, 62);
  if(g.h.porte){ ctx.textAlign = 'center'; ctx.font = '800 17px "Baloo 2", sans-serif'; ligne(g.h.porte.e ? `Tu as attrapé ${leLa(g.h.porte.O.nom)} ! Espace : le lancer` : `Tu portes ${leLa(g.h.porte.O.nom)}`, CW / 2, g.boss && !g.bossVaincu && g.boss.etat !== 'attend' ? 92 : 56); }
  if(g.indice && etat === 'jeu'){ ctx.font = '800 19px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; const w = Math.min(CW - 40, ctx.measureText(g.indice).width + 36), y = CH - (document.body.classList.contains('touch') ? 170 : 44);
    ctx.fillStyle = 'rgba(11,30,70,.85)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(CW / 2 - w / 2, y - 22, w, 44, 14) : ctx.rect(CW / 2 - w / 2, y - 22, w, 44); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.fillText(g.indice, CW / 2, y + 1, CW - 60); }
  ctx.textBaseline = 'alphabetic';
}

/* ---------- ce que la page utilise ---------- */
const S2J = window.S2J = {
  son:true, voix:true, surFin:null,
  joueur(nom, tenue){ chargeCorps(nom, tenue); },
  lancer(n, diff){ audio(); if(!charger(n, diff)) return false; etat = 'jeu'; reste = 0; dernier = performance.now(); saut = agir = lancer = false; ambiance(G.M); return true; },
  pause(){ if(etat === 'jeu'){ etat = 'pause'; ambVolume(0); return true; } return false; },
  reprendre(){ if(etat === 'pause'){ etat = 'jeu'; dernier = performance.now(); ambVolume(S2J.son ? .32 : 0); } },
  basculePause(){ if(etat === 'jeu'){ etat = 'pause'; ambVolume(0); S2J.surPause && S2J.surPause(); } else if(etat === 'pause'){ S2J.surReprise && S2J.surReprise(); } },
  // coincé ? on revient à la dernière lanterne (ou au départ) sans perdre de vie ; les objets reviennent à leur place
  revenir(){ if(!G) return; reprise(true); etat = 'jeu'; dernier = performance.now(); },
  quitter(){ etat = 'menu'; G = null; ambStop(); },
  sonChange(){ ambVolume(S2J.son && etat === 'jeu' ? .32 : 0); },
  etat: () => etat, G: () => G
};
requestAnimationFrame(boucle);
})();
