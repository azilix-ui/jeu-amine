/* Les épreuves « en vrai » (20/11) : la suite du Concours en vrai, version B (Essil a choisi : le décor en vrai, le cheval 3D des Écuries).
   Cinq épreuves dans des décors ComfyUI (FLUX.2 klein : panoramas, sols, obstacles détourés) :
   - Cross : 8 obstacles naturels dans la campagne (tronc, haie, stère, barrière fleurie), au grand galop ;
   - Hunter : on est noté sur 100 pour la régularité (bon abord, pas de rupture d'allure) ;
   - Dressage : une reprise dans un rectangle 20 × 60 avec ses lettres : changer d'allure au bon endroit ;
   - Course de galop : contre trois chevaux, en gérant le souffle (galop, trot pour souffler, « Pousse ! » à la fin) ;
   - Western : le barrel racing, trois tonneaux en trèfle : ralentir dans les virages, sinon le tonneau tombe (+5 s).
   Le cheval suit le chemin tout seul : on choisit l'allure, et le moment du saut. Records : localStorage « cev2:<épreuve> ».
   Pour les tests : window.__ep (partir, avance(sec, robot), R). */
import * as THREE from '../../lib/three-0.170.0.module.min.js';
const $ = id => document.getElementById(id);
const BASE = new URL('./', import.meta.url).href, IMG = BASE + 'img/', SON = BASE + 'sons/';
const ZONE = [2.4, 4.6];

/* ---------------- les sons et la voix ---------------- */
let sonOn = true; try{ sonOn = localStorage.getItem('cev-son') !== '0'; }catch(e){}
const A = {}; ['galop', 'trot', 'saut', 'barre', 'bravo', 'cloche', 'hennit', 'refus', 'ambiance', 'musique'].forEach(n => { const a = new Audio(SON + n + '.mp3'); a.preload = 'auto'; A[n] = a; });
A.ambiance.loop = true; A.ambiance.volume = .35; A.galop.loop = true; A.trot.loop = true; A.musique.loop = true; A.musique.volume = .5;
const play = (n, v) => { if(!sonOn) return; const a = A[n]; try{ if(v != null) a.volume = v; if(!a.loop) a.currentTime = 0; a.play().catch(() => {}); }catch(e){} };
const stop = n => { try{ A[n].pause(); }catch(e){} };
const stopAll = () => Object.keys(A).forEach(stop);
function majSon(){ $('son').textContent = sonOn ? '🔊 Son' : '🔇 Son'; if(!sonOn) stopAll(); }
$('son').onclick = () => { sonOn = !sonOn; try{ localStorage.setItem('cev-son', sonOn ? '1' : '0'); }catch(e){} majSon(); if(sonOn && $('menu').classList.contains('on')) play('musique'); };
majSon();
const dit = t => { try{ if(!sonOn || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; speechSynthesis.speak(u); }catch(e){} };

/* ---------------- la scène ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas:$('gl'), antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xdfe9f2, 80, 170);
const cam = new THREE.PerspectiveCamera(50, 1, .1, 400);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb59a70, 1.6));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.9); sun.position.set(-30, 50, 25); scene.add(sun);
const tl = new THREE.TextureLoader();
const tex = (n, rep) => { const t = tl.load(IMG + n); t.colorSpace = THREE.SRGBColorSpace; if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; } return t; };
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const pastille = (txt, fond = '#fff', encre = '#1f3c88', carre) => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = fond;
  if(carre) g.fillRect(8, 8, 112, 112); else { g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); } g.lineWidth = 8; g.strokeStyle = encre; if(carre) g.strokeRect(8, 8, 112, 112); else g.stroke();
  g.fillStyle = encre; g.font = '800 76px "Baloo 2", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
let decor = new THREE.Group(); scene.add(decor);

/* ---------------- les épreuves ---------------- */
const V = (x, z) => new THREE.Vector3(x, 0, z);
const cercle = (cx, cz, r, a0, a1, n) => Array.from({ length:n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.sin(a) * r, cz + Math.cos(a) * r]; });
const EP = {
  cross:{ nom:'Cross', ic:'🌳', pano:'p_cross', sol:'t_pre.webp', solRep:60, vit:{ trot:4, galop:7.6 }, allures:['trot', 'galop'], opt:52, regle:'sauts', pen:{ refus:20, faute:0 },
    WP:[[-60, -40], [-30, -44], [0, -40], [26, -30], [44, -10], [46, 14], [30, 34], [6, 42], [-20, 38], [-42, 24], [-50, 2], [-36, -14], [-10, -12], [12, 2], [26, 14]],
    obs:[['tronc', -30, -44], ['haie', 18, -34], ['stere', 45, 0], ['rustique', 30, 34], ['tronc', -8, 41], ['haie', -42, 24], ['stere', -38, -13], ['rustique', 8, -2]], fin:[24, 13],
    aide:'Au grand galop dans la campagne : 8 obstacles naturels. Saute quand le bouton devient vert. Les obstacles ne tombent pas, mais un refus coûte 20 points.' },
  hunter:{ nom:'Hunter', ic:'🎩', pano:'p_hunter', sol:'herbe.webp', solRep:40, arene:{ w:76, d:44, sol:'herbe.webp', lice:0xf4f2ec }, vit:{ trot:3.6, galop:6.2 }, allures:['trot', 'galop'], regle:'hunter',
    WP:[[-34, -13], [-8, -13], [10, -13], [25, -10], [30, 0], [24, 11], [8, 13], [-10, 13], [-25, 11.5], [-31, 6], [-23, 2.5], [-6, 0], [12, -4.5], [34, -9]],
    obs:[['rustique', -8, -13], ['haie', 10, -13], ['bouleau', 8, 13], ['rustique', -10, 13], ['vertical', -6, 0], ['oxer', 12, -4.5]], fin:[30, -8.6],
    aide:'Le juge note ta régularité sur 100 : garde le même galop tout le parcours (pas de trot !) et saute pile dans la zone verte.' },
  dressage:{ nom:'Dressage', ic:'🎼', pano:'p_dress', sol:'herbe.webp', solRep:40, arene:{ w:22, d:62, sol:'t_piste.webp', lice:0xffffff, basse:true }, vit:{ pas:1.7, trot:3.4, galop:5.2 }, allures:['pas', 'trot', 'galop'], regle:'dressage',
    WP:[[0, -40], [0, -31], [0, 0], [0, 24], [1.5, 28], [5, 29.6], [8.5, 28], [9.6, 24], [9.6, 0], [9.6, -24], [8.5, -28], [5, -29.6], [0, -30], [-5, -29.6], [-8.5, -28], [-9.6, -24], [-9.6, 0], [-9.6, 24], [-8.5, 28], [-5, 29.6], [0, 30], [5, 29.6], [8.5, 28], [9.6, 24], [0, 0], [-9.6, -24], [-8.5, -28], [-5, -29.6], [-1.5, -28], [0, -24], [0, -8], [0, -1]],
    figs:[[0, -31, 'trot', 'A : entre au trot sur la ligne du milieu'], [5, 29.6, 'pas', 'C : à gauche, au pas'], [9.6, 0, 'trot', 'E : trot de travail'], [-9.6, -24, 'galop', 'F : départ au galop'], [-9.6, 24, 'trot', 'M : trot, puis la diagonale H-X-F'], [-9.6, -24, 'pas', 'F : au pas, ligne du milieu jusqu\'à X']], fin:[0, -1],
    aide:'Une reprise : à chaque lettre, change d\'allure (pas, trot, galop) au bon endroit. Le cheval met un peu de temps à changer : anticipe ! Le juge note chaque figure sur 10.' },
  course:{ nom:'Course de galop', ic:'🏁', pano:'p_course', sol:'herbe.webp', solRep:50, vit:{ trot:5, galop:8, pousse:10 }, allures:['trot', 'galop'], regle:'course', boucle:true,
    WP:cercle(30, 0, 24, 0, Math.PI, 10).concat(cercle(-30, 0, 24, Math.PI, Math.PI * 2, 10)).map(([x, z]) => [x, -z]), tour:1,
    aide:'Une course contre trois chevaux, sur un tour de piste. Le galop fatigue ton cheval : la barre de souffle descend. Le trot la remplit. Garde du souffle pour « Pousse ! » dans la dernière ligne droite.' },
  western:{ nom:'Western : barrel race', ic:'🤠', pano:'p_west', sol:'t_ranch.webp', solRep:40, arene:{ w:44, d:40, sol:'t_ranch.webp', lice:0x7a5a3a, bois:true }, vit:{ trot:4.2, galop:8.6 }, allures:['trot', 'galop'], regle:'barils',
    barils:[[9, -2], [-9, -2], [0, 12]], aide:'Le barrel race : fais le tour des trois tonneaux en trèfle, le plus vite possible. Dans les virages (le cercle orange), passe au trot : au galop, le tonneau tombe (+5 secondes) !' },
};
// le chemin du western : la ligne de départ, le tonneau de droite (tour à droite), celui de gauche (à gauche), celui du fond (à gauche), et retour
{ const e = EP.western, [b1, b2, b3] = e.barils, r = 3;
  e.WP = [[0, -19], [0, -12], [b1[0] - r - 1.2, b1[1] - 3], ...cercle(b1[0], b1[1], r, -Math.PI / 2 - .3, Math.PI * 1.5 - .4, 10), [b2[0] + r + 1.2, b2[1] - 3], ...cercle(b2[0], b2[1], r, Math.PI / 2 + .3, -Math.PI * 1.5 + .4, 10), ...cercle(b3[0], b3[1], r, -Math.PI / 2 - .6, Math.PI * .5 + .2, 8), [0, -6], [0, -19]];
  e.fin = [0, -18]; }

/* ---------------- construire le décor d'une épreuve ---------------- */
let E = null, curve, LEN, PTS, NPTS = 2000;
const at = s => { if(E.boucle) s = ((s % LEN) + LEN) % LEN; const u = Math.max(0, Math.min(1, s / LEN)), i = u * NPTS, i0 = Math.floor(i), i1 = Math.min(NPTS, i0 + 1), k = i - i0; return PTS[i0].clone().lerp(PTS[i1], k); };
const heading = s => { const a = at(s - 1.2), b = at(s + 1.2); return Math.atan2(b.x - a.x, b.z - a.z); };
// le premier passage du chemin près de (x, z) après « apres » (le chemin peut repasser au même endroit : on prend le premier)
const nearestS = (x, z, apres = 0) => { let best = 1e9, bi = -1, i0 = Math.ceil(apres / LEN * NPTS);
  for(let i = i0; i <= NPTS; i++){ const p = PTS[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if(d < 1.5 * 1.5){ if(d < best){ best = d; bi = i; } } else if(bi >= 0) break; }
  if(bi < 0) for(let i = i0; i <= NPTS; i++){ const p = PTS[i], d = (p.x - x) ** 2 + (p.z - z) ** 2; if(d < best){ best = d; bi = i; } }
  return bi / NPTS * LEN; };
let OBS = [], FIGS = [], BARILS = [];
function construit(id){
  E = EP[id]; E.id = id; scene.remove(decor); decor = new THREE.Group(); scene.add(decor);
  // le ciel
  { const t = tex(E.pano + '.webp'); t.wrapS = THREE.RepeatWrapping; const R = 130, H = R * 2 * Math.PI / 6;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true), new THREE.MeshBasicMaterial({ map:t, side:THREE.BackSide, fog:false })); m.position.y = H * .5 - H * .36; decor.add(m);
    const top = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.MeshBasicMaterial({ color:0x9cc8ee, fog:false })); top.rotation.x = Math.PI / 2; top.position.y = H * .64 - .1; decor.add(top); }
  const g = new THREE.Mesh(new THREE.CircleGeometry(131, 48), new THREE.MeshLambertMaterial({ map:tex(E.sol, E.solRep) })); g.rotation.x = -Math.PI / 2; g.position.y = -.02; decor.add(g);
  if(E.arene){ const a = E.arene, s = new THREE.Mesh(new THREE.PlaneGeometry(a.w, a.d), new THREE.MeshLambertMaterial({ map:tex(a.sol, Math.round(a.w / 4)) })); s.rotation.x = -Math.PI / 2; s.position.y = .005; decor.add(s);
    const wm = new THREE.MeshLambertMaterial({ color:a.lice }), hx = a.w / 2, hz = a.d / 2, Y = a.basse ? [.32] : a.bois ? [.5, .95, 1.4] : [.55, 1.05], ph = a.basse ? .4 : a.bois ? 1.55 : 1.2, ep = a.bois ? .14 : .1;
    const lice = (x, z, w, d) => Y.forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, ep, d), wm); b.position.set(x, y, z); decor.add(b); });
    const porte = id === 'dressage' ? 2.4 : 0;   // l'entrée en A
    lice(0, hz, a.w, .08); lice(-hx, 0, .08, a.d); lice(hx, 0, .08, a.d);
    if(porte){ lice(-(hx + porte / 2) / 2, -hz, hx - porte / 2, .08); lice((hx + porte / 2) / 2, -hz, hx - porte / 2, .08); } else lice(0, -hz, a.w, .08);
    for(let x = -hx; x <= hx + .01; x += 3.8) [-hz, hz].forEach(z => { if(porte && Math.abs(x) < porte) return; const p = new THREE.Mesh(new THREE.BoxGeometry(.14, ph, .14), wm); p.position.set(x, ph / 2, z); decor.add(p); });
    for(let z = -hz; z <= hz + .01; z += 3.8) [-hx, hx].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.14, ph, .14), wm); p.position.set(x, ph / 2, z); decor.add(p); }); }
  // le chemin
  curve = new THREE.CatmullRomCurve3(E.WP.map(([x, z]) => V(x, z)), !!E.boucle, 'centripetal'); LEN = curve.getLength(); PTS = curve.getSpacedPoints(NPTS);
  OBS = []; FIGS = []; BARILS = [];
  if(E.obs){ let apres = 0; OBS = E.obs.map(([img, x, z], i) => { const s = nearestS(x, z, apres); apres = s + 3; return { img, i, s }; });
    OBS.forEach(o => { const p = at(o.s), a = heading(o.s), gr = new THREE.Group(); gr.position.copy(p); gr.rotation.y = a; decor.add(gr);
      const W = /stere|tronc/.test(o.img) ? 4 : 4.6, plane = new THREE.Mesh(new THREE.PlaneGeometry(W, W * .6), new THREE.MeshLambertMaterial({ map:tex(o.img + '.webp'), transparent:true, alphaTest:.45, side:THREE.DoubleSide }));
      tl.load(IMG + o.img + '.webp', im => { const r = im.image.height / im.image.width, w = Math.min(W, 1.45 / r); plane.geometry.dispose(); plane.geometry = new THREE.PlaneGeometry(w, w * r); plane.position.y = w * r / 2; }); plane.position.y = W * .3; gr.add(plane);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.1, 1.6), new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .02; gr.add(sh);
      const num = new THREE.Sprite(new THREE.SpriteMaterial({ map:pastille(String(o.i + 1)), transparent:true })); num.scale.set(.8, .8, 1); num.position.set(-W / 2 - .3, 2.1, 0); gr.add(num); o.num = num;
      const zm = new THREE.Mesh(new THREE.PlaneGeometry(2.6, ZONE[1] - ZONE[0]), new THREE.MeshBasicMaterial({ color:0x2fd38a, transparent:true, opacity:.3, depthWrite:false })); zm.rotation.x = -Math.PI / 2; zm.position.set(0, .03, -(ZONE[0] + ZONE[1]) / 2); zm.visible = false; gr.add(zm); o.zone = zm; o.g = gr; }); }
  if(E.figs){ let apres = 0; FIGS = E.figs.map(([x, z, need, txt], i) => { const s = nearestS(x, z, apres); apres = s + 2; return { s, need, txt, i }; });
    FIGS.forEach((f, i) => { f.fin = i + 1 < FIGS.length ? FIGS[i + 1].s : nearestS(E.fin[0], E.fin[1], f.s); });
    // les lettres du rectangle de dressage
    [['A', 0, -32.4], ['K', 12.4, -24], ['E', 12.4, 0], ['H', 12.4, 24], ['C', 0, 32.4], ['M', -12.4, 24], ['B', -12.4, 0], ['F', -12.4, -24]].forEach(([l, x, z]) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:pastille(l, '#fff', '#222', true) })); sp.scale.set(1.1, 1.1, 1); sp.position.set(x, .75, z); decor.add(sp); });
    const xm = new THREE.Mesh(new THREE.RingGeometry(.3, .45, 24), new THREE.MeshBasicMaterial({ color:0xffffff })); xm.rotation.x = -Math.PI / 2; xm.position.set(0, .02, 0); decor.add(xm); }
  if(E.barils){ BARILS = E.barils.map(([x, z], i) => { const gr = new THREE.Group(); gr.position.set(x, 0, z); decor.add(gr);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1.2), new THREE.MeshLambertMaterial({ map:tex('tonneau.webp'), transparent:true, alphaTest:.45, side:THREE.DoubleSide })); pl.position.y = .6; gr.add(pl);
      const ring = new THREE.Mesh(new THREE.RingGeometry(4.2, 4.5, 40), new THREE.MeshBasicMaterial({ color:0xff9a1f, transparent:true, opacity:.6, depthWrite:false })); ring.rotation.x = -Math.PI / 2; ring.position.y = .03; gr.add(ring);
      const s0 = nearestS(x, z, i ? 0 : 0); return { x, z, gr, pl, ring, tombe:false, dedans:false }; }); }
  if(E.regle === 'course'){   // la lice blanche de la piste, dedans et dehors
    const wm = new THREE.MeshLambertMaterial({ color:0xf6f6f2 }); for(let i = 0; i < NPTS; i += 14){ const p = PTS[i], a = heading(i / NPTS * LEN), nx = Math.cos(a), nz = -Math.sin(a);
      [-5.5, 6.5].forEach(o => { const q = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.1, .12), wm); q.position.set(p.x + nx * o, .55, p.z + nz * o); decor.add(q);
        const b = new THREE.Mesh(new THREE.BoxGeometry(.08, .1, LEN / NPTS * 14 + .1), wm); b.position.set(p.x + nx * o, 1.05, p.z + nz * o); b.rotation.y = a; decor.add(b); }); }
    const arr = new THREE.Mesh(new THREE.PlaneGeometry(12, .5), new THREE.MeshBasicMaterial({ color:0xffffff })); const p0 = at(0), a0 = heading(0); arr.rotation.x = -Math.PI / 2; arr.rotation.z = a0; arr.position.set(p0.x, .03, p0.z); decor.add(arr); }
  E.sFin = E.boucle ? LEN * (E.tour || 1) : nearestS(E.fin[0], E.fin[1], OBS.length ? OBS[OBS.length - 1].s : FIGS.length ? FIGS[FIGS.length - 1].s : LEN * .8);
  if(!E.boucle) E.sFin = Math.min(E.sFin, LEN - 1.5);
}

/* ---------------- le cheval 3D des Écuries (et les adversaires de la course) ---------------- */
let mod = null; const CHEVAUX = {};
async function cheval(robe, equip){ if(!mod) mod = await Promise.all([import('../ecuries/cheval.js'), import('../ecuries/data.js')]);
  const [{ makeHorse }, { COAT }] = mod; const h = makeHorse(THREE, { id:'ep' + robe, n:robe, robe, t:1, s:[3, 3, 3, 3] }, COAT[robe]); h.setEquip(equip || { filet:'havane', selle:'havane', tapis:'rouge' }, { rider:true });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3), new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .03;
  return { h, sh }; }
const gaitDe = v => v < .2 ? 0 : v < 2.4 ? 1 : v < 4.6 ? 2 : 3;

/* ---------------- la partie ---------------- */
let R = null, moi = null, adv = [];
const mmsg = $('msg'); let msgT = 0;
function msg(t, k){ mmsg.textContent = t; mmsg.className = 'on ' + (k || ''); msgT = 2.1; }
function resize(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
function ecran(id){ ['menu', 'hud', 'fin'].forEach(s => $(s).classList.toggle('on', s === id)); }
const record = id => { try{ return JSON.parse(localStorage.getItem('cev2:' + id) || 'null'); }catch(e){ return null; } };

async function partir(id){
  $('load').classList.add('on'); stop('musique');
  try{ construit(id); if(!moi) moi = await cheval('bai');
    if(id === 'course'){ if(!adv.length) for(const [r, t] of [['alezan', 'bleu'], ['gris', 'vert'], ['noir', 'jaune']]) adv.push(await cheval(r, { filet:'noir', selle:'noir', tapis:t })); }
  }catch(e){ console.error(e); $('load').classList.remove('on'); msg('Cette épreuve ne démarre pas sur cet appareil', 'bad'); return; }
  $('load').classList.remove('on');
  [moi, ...adv].forEach(c => { scene.remove(c.h.root); scene.remove(c.sh); });
  scene.add(moi.h.root); scene.add(moi.sh);
  const course = E.regle === 'course';
  R = { s:E.boucle ? 0 : 2, v:0, allure:E.allures.includes('galop') && E.regle !== 'dressage' ? 'galop' : E.allures[0], t:0, pen:0, refus:0, fautes:0, next:0, air:null, airT:0, airLen:1, go:false, count:3.4, done:false, camP:null, camL:null, jumpedFor:-1,
    note:100, ruptures:0, figs:FIGS.map(() => ({ ok:0, tot:0 })), souffle:100, pousse:0, chutes:0, adv:[] };
  if(course) adv.forEach((c, i) => { scene.add(c.h.root); scene.add(c.sh); R.adv.push({ c, s:0, v:0, lane:[-3.6, 3.6, 1.2][i], base:7.75 + i * .12 + Math.random() * .2, kick:9.1 + Math.random() * .5, fini:0 }); });
  R.lane = course ? -1.2 : 0;
  BARILS.forEach(b => { b.tombe = false; b.dedans = false; b.pl.rotation.set(0, 0, 0); b.pl.position.set(0, .6, 0); b.ring.material.color.set(0xff9a1f); });
  OBS.forEach(o => { o.num.material.opacity = 1; o.zone.visible = false; });
  // les boutons de l'épreuve
  $('allures').innerHTML = E.allures.map(a => `<button type="button" data-a="${a}">${{ pas:'🚶 Pas', trot:'🐢 Trot', galop:'🐎 Galop' }[a]}</button>`).join('');
  $('allures').querySelectorAll('button').forEach(b => b.onclick = () => setAllure(b.dataset.a));
  const gros = $('saute'); gros.hidden = !(OBS.length || course); gros.textContent = course ? '🔥 Pousse !' : 'Saute !';
  $('souffle').hidden = !course; $('consigne').hidden = E.regle !== 'dressage';
  setAllure(R.allure); ecran('hud'); $('count').hidden = false;
  play('ambiance'); play('hennit', .7);
  dit(E.regle === 'dressage' ? 'Salue le juge… La reprise commence au trot, en A.' : course ? 'Sous les ordres ! Gère bien ton souffle.' : E.regle === 'barils' ? 'Prête ? Ralentis au trot dans les cercles orange.' : 'Prête ? Touche « Saute » quand le bouton devient vert.');
  majHud();
}
function setAllure(a){ if(!R || !E.allures.includes(a)) return; if(R.go && !R.done && a !== R.allure && E.regle === 'hunter' && R.s > 6){ R.ruptures++; R.note -= 5; msg('Rupture d\'allure : −5', 'bad'); }
  R.allure = a; $('allures').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.a === a)); sabots(); }
function sabots(){ if(!R || !R.go || R.done || R.v < .3 || R.air != null){ stop('galop'); stop('trot'); return; } if(R.v > 4.6){ stop('trot'); if(A.galop.paused) play('galop'); } else { stop('galop'); if(A.trot.paused) play('trot'); } }
function gros(){
  if(!R || !R.go || R.done) return;
  if(E.regle === 'course'){ if(R.souffle > 8){ R.pousse = 1.6; msg('Pousse !', 'good'); } else msg('Plus de souffle : trotte un peu !', 'bad'); return; }
  if(R.air != null) return; const o = OBS[R.next], d = o ? o.s - R.s : 99;
  if(R.v < 2){ msg('Il faut de l\'élan !', 'bad'); return; }
  R.air = 0; R.airT = 0; const portee = (o && d < 7 ? d : 3.4) + 3.4; R.airLen = portee / R.v; R.jumpD = d; R.jumpedFor = o && d < 7 ? R.next : -1;
  play('saut', 1); sabots();
}
$('saute').addEventListener('pointerdown', e => { e.preventDefault(); gros(); });
addEventListener('keydown', e => { if(!R) return; if(e.code === 'Space'){ e.preventDefault(); gros(); } const L = E.allures; let i = L.indexOf(R.allure);
  if(e.code === 'ArrowUp') setAllure(L[Math.min(L.length - 1, i + 1)]); if(e.code === 'ArrowDown') setAllure(L[Math.max(0, i - 1)]); });
$('quit').onclick = () => fin(true);

function passe(o){
  o.num.material.opacity = .35; o.zone.visible = false; R.next++;
  const P = E.regle === 'hunter' ? null : E.pen;
  if(R.jumpedFor !== o.i){
    R.refus++; play('refus', 1);
    if(P){ R.pen += P.refus; msg(R.refus >= 3 ? 'Troisième refus : éliminée' : `Refus ! ${P.refus} points`, 'bad'); } else { R.note -= 30; msg('Refus : −30', 'bad'); }
    if(R.refus >= 3){ fin(false, true); return; }
    R.next--; o.num.material.opacity = 1; R.s = o.s - 11; R.v = 0; R.air = null; dit('Refus. On recommence : saute un peu avant l\'obstacle.'); return;
  }
  const d = R.jumpD;
  if(d >= ZONE[0] && d <= ZONE[1]) msg(['Joli saut !', 'Superbe !', 'Bravo !', 'Parfait !'][Math.floor(Math.random() * 4)], 'good');
  else { R.fautes++; if(P){ msg(d > ZONE[1] ? 'Un peu tôt : saut maladroit' : 'Un peu tard : saut maladroit', 'bad'); } else { R.note -= 10; msg(d > ZONE[1] ? 'Abord trop loin : −10' : 'Abord trop près : −10', 'bad'); } }
}
function fin(abandon, elim){
  if(!R || R.done) return; R.done = true; stop('galop'); stop('trot');
  if(abandon){ R = null; stop('ambiance'); ecran('menu'); menu(); play('musique'); return; }
  let titre = 'Bravo !', res = '', score = 0, mieux = (a, b) => a < b;   // le record : un temps ou des points (plus petit = mieux), ou une note (plus grand = mieux)
  const t = R.t.toFixed(1).replace('.', ',');
  if(E.regle === 'sauts'){ const over = Math.max(0, R.t - E.opt), tp = Math.ceil(over); score = R.pen + tp;
    titre = elim ? 'Éliminée…' : score === 0 ? 'Sans pénalité ! 🏆' : score <= 20 ? 'Très bien ! 🥈' : 'Cross terminé';
    res = elim ? 'Trois refus : on retente ?' : `Temps : <b>${t} s</b> (idéal : ${E.opt} s)<br>Refus : <b>${R.refus}</b> · Sauts maladroits : <b>${R.fautes}</b>${tp ? ` · Temps : <b>${tp}</b> pt` : ''}<br>Total : <b>${score} point${score > 1 ? 's' : ''}</b>`; }
  else if(E.regle === 'hunter'){ score = Math.max(0, R.note); mieux = (a, b) => a > b; titre = elim ? 'Éliminée…' : score >= 90 ? 'Magnifique ! 🏆' : score >= 75 ? 'Très joli parcours ! 🥈' : 'Parcours terminé';
    res = elim ? 'Trois refus : on retente ?' : `Note du juge : <b>${score} / 100</b><br>Abords ratés : <b>${R.fautes}</b> · Ruptures d'allure : <b>${R.ruptures}</b> · Refus : <b>${R.refus}</b>`; }
  else if(E.regle === 'dressage'){ const notes = R.figs.map(f => f.tot ? Math.round(f.ok / f.tot * 10) : 0); score = Math.round(notes.reduce((a, b) => a + b, 0) / (notes.length * 10) * 100); mieux = (a, b) => a > b;
    titre = score >= 80 ? 'Superbe reprise ! 🏆' : score >= 60 ? 'Belle reprise ! 🥈' : 'Reprise terminée';
    res = `Note : <b>${score} %</b><br><small>${FIGS.map((f, i) => `${f.txt.split(' :')[0]} : ${notes[i]}/10`).join(' · ')}</small>`; }
  else if(E.regle === 'course'){ const rang = 1 + R.adv.filter(a => a.fini && a.fini < R.t).length; score = rang; titre = rang === 1 ? 'Victoire ! 🏆' : rang === 2 ? 'Deuxième ! 🥈' : rang === 3 ? 'Troisième 🥉' : 'Quatrième';
    res = `Arrivée en <b>${t} s</b> · place : <b>${rang} / 4</b>`; }
  else if(E.regle === 'barils'){ score = +(R.t + R.chutes * 5).toFixed(1); titre = R.chutes === 0 ? 'Sans tonneau tombé ! 🏆' : 'Barrel race terminé';
    res = `Temps : <b>${t} s</b>${R.chutes ? ` + ${R.chutes} tonneau${R.chutes > 1 ? 'x' : ''} × 5 s` : ''}<br>Total : <b>${String(score).replace('.', ',')} s</b>`; }
  const rec = record(E.id); let neuf = false;
  if(!elim && (rec == null || mieux(score, rec.v))){ neuf = true; try{ localStorage.setItem('cev2:' + E.id, JSON.stringify({ v:score, d:Date.now() })); }catch(e){} }
  if(neuf && rec != null) res += '<br>🎉 <b>Nouveau record !</b>';
  play(elim ? 'refus' : 'bravo', 1); setTimeout(() => play('hennit', .8), 900);
  $('fT').textContent = titre; $('fR').innerHTML = res;
  setTimeout(() => { ecran('fin'); dit(titre.replace(/[🏆🥈🥉]/gu, '')); }, 1300);
}
$('fAgain').onclick = () => partir(E.id);
$('fMenu').onclick = () => { R = null; stop('ambiance'); ecran('menu'); menu(); play('musique'); };

function majHud(){
  if(!R) return; const r = E.regle;
  $('hObs').textContent = OBS.length ? Math.min(R.next + 1, OBS.length) + ' / ' + OBS.length : r === 'course' ? Math.max(0, Math.round(E.sFin - R.s)) + ' m' : r === 'barils' ? '🛢️ ' + BARILS.filter(b => b.fait).length + ' / 3' : '🎼 ' + Math.min(FIGS.length, (FIGS.findIndex(f => R.s < f.fin) + 1) || FIGS.length) + ' / ' + FIGS.length;
  $('hTime').textContent = R.t.toFixed(1).replace('.', ',') + ' s';
  $('hPen').textContent = r === 'hunter' ? R.note + ' / 100' : r === 'dressage' ? (() => { const n = R.figs.filter(f => f.tot); return n.length ? Math.round(n.reduce((a, f) => a + f.ok / f.tot, 0) / n.length * 100) + ' %' : '— %'; })()
    : r === 'course' ? (1 + R.adv.filter(a => a.s > R.s).length) + 'e' : r === 'barils' ? '+' + R.chutes * 5 + ' s' : R.pen + ' pt';
  if(r === 'course') $('souffle').firstElementChild.style.width = R.souffle + '%';
}
function tick(dt){
  if(!R) return;
  if(!R.go){ R.count -= dt; $('count').textContent = Math.max(1, Math.ceil(R.count - .4)); if(R.count <= .4){ R.go = true; $('count').hidden = true; play('cloche', 1); msg('C\'est parti !', 'good'); } }
  if(R.go && !R.done) R.t += dt;
  const r = E.regle;
  // la vitesse : l'allure choisie (et en course, le souffle)
  let cible = !R.go ? 0 : R.done ? 1.6 : E.vit[R.allure];
  if(r === 'course' && R.go && !R.done){ if(R.pousse > 0){ R.pousse -= dt; cible = E.vit.pousse; R.souffle -= 9 * dt; } else if(R.allure === 'galop') R.souffle -= 1.25 * dt; else R.souffle = Math.min(100, R.souffle + 6 * dt);
    if(R.souffle <= 0){ R.souffle = 0; R.pousse = 0; cible = Math.min(cible, E.vit.trot); if(R.allure === 'galop' && Math.random() < dt) msg('Il est fatigué : laisse-le trotter', 'bad'); } }
  const acc = R.v < cible ? (r === 'dressage' ? 1.6 : 3.2) : (r === 'dressage' ? 2 : 5); R.v += Math.max(-acc * dt, Math.min(acc * dt, cible - R.v));
  const s0 = R.s; R.s += R.v * dt;
  if(R.air != null){ R.airT += dt; R.air = R.airT / R.airLen; if(R.air >= 1){ R.air = null; sabots(); } }
  // les obstacles
  const o = OBS[R.next];
  if(o && !R.done){ const d = o.s - R.s; o.zone.visible = d < 16 && d > 0; $('saute').classList.toggle('zone', R.air == null && d >= ZONE[0] && d <= ZONE[1]); if(s0 < o.s - .4 && R.s >= o.s - .4) passe(o); }
  else $('saute').classList.toggle('zone', r === 'course' && R.go && !R.done && E.sFin - R.s < 120 && R.souffle > 8);
  // le dressage : la figure en cours, la consigne de la suivante
  if(r === 'dressage' && R.go && !R.done){ const i = FIGS.findIndex(f => R.s >= f.s && R.s < f.fin); const g = gaitDe(R.v), besoin = { pas:1, trot:2, galop:3 };
    if(i >= 0){ const f = R.figs[i]; f.tot += dt; if(g === besoin[FIGS[i].need]) f.ok += dt; }
    const nx = FIGS.find(f => f.s > R.s - .5), cur = FIGS[i];
    $('consigne').innerHTML = nx && nx.s - R.s < 14 ? `Bientôt ${nx.txt} <b>(${Math.max(0, Math.round(nx.s - R.s))} m)</b>` : cur ? `${cur.txt}` : '';
    if(nx && nx.s - R.s < 9 && !nx.dit){ nx.dit = true; dit(nx.txt.replace(/^\w :/, 'En ' + nx.txt[0] + ',')); } }
  // le western : les virages autour des tonneaux
  if(r === 'barils' && R.go && !R.done){ const p = at(R.s); BARILS.forEach((b, i) => { const d = Math.hypot(p.x - b.x, p.z - b.z), dedans = d < 4.35;
      if(dedans && !b.dedans){ b.dedans = true; b.ring.material.color.set(0xffd23f); }
      if(dedans && R.v > 5.4 && !b.tombe){ b.tombe = true; R.chutes++; play('barre', 1); msg('Trop vite : le tonneau tombe ! +5 s', 'bad'); }
      if(!dedans && b.dedans && !b.fait){ b.fait = true; b.ring.material.color.set(b.tombe ? 0xd7263d : 0x2fd38a); if(!b.tombe) msg(['Joli virage !', 'Bravo !', 'Bien serré !'][i], 'good'); }
      if(b.tombe && b.pl.rotation.z > -1.45){ b.pl.rotation.z -= dt * 4; b.pl.position.y = Math.max(.25, b.pl.position.y - dt); } }); }
  // la course : les adversaires
  if(r === 'course'){ R.adv.forEach(a => { const reste = E.sFin - a.s, cible = !R.go ? 0 : a.fini ? 2 : reste < 70 ? a.kick : a.base + Math.sin(R.t * .7 + a.lane) * .25;
      a.v += Math.max(-4 * dt, Math.min(3 * dt, cible - a.v)); a.s += a.v * dt; if(!a.fini && a.s >= E.sFin) a.fini = R.t;
      const p = at(a.s), h = heading(a.s), nx = Math.cos(h), nz = -Math.sin(h); a.c.h.root.position.set(p.x + nx * a.lane, 0, p.z + nz * a.lane); a.c.h.root.rotation.y = h; a.c.sh.position.set(p.x + nx * a.lane, .03, p.z + nz * a.lane); a.c.sh.rotation.z = -h;
      a.c.h.update(dt, { gait:gaitDe(a.v), speedK:a.v < 4.6 ? a.v / 3.7 : a.v / 7 }); }); }
  if(!R.done && R.s >= E.sFin && (r !== 'sauts' && r !== 'hunter' || R.next >= OBS.length)) fin(false);
  if(!E.boucle && R.s > LEN - 1){ R.s = LEN - 1; R.v = 0; }
  if(R.go) sabots();
  // le cheval, son ombre, la caméra
  const p = at(R.s), a = heading(R.s), nx = Math.cos(a), nz = -Math.sin(a), y = R.air != null ? Math.sin(Math.PI * R.air) * 1.15 : 0, px = p.x + nx * R.lane, pz = p.z + nz * R.lane;
  moi.h.root.position.set(px, y, pz); moi.h.root.rotation.y = a; moi.sh.position.set(px, .03, pz); moi.sh.rotation.z = -a; moi.sh.scale.setScalar(1 - y * .25);
  moi.h.update(dt, { gait:gaitDe(R.v), air:R.air, speedK:R.v < 4.6 ? R.v / 3.7 : R.v / 7 });
  const fx = Math.sin(a), fz = Math.cos(a), tall = cam.aspect < .9, back = tall ? 7.4 : 6.8, hi = tall ? 3.4 : 3;
  const P = new THREE.Vector3(px - fx * back, hi + y * .35, pz - fz * back), L = new THREE.Vector3(px + fx * 6, 1.25 + y * .4, pz + fz * 6);
  if(!R.camP){ R.camP = P.clone(); R.camL = L.clone(); } const k = Math.min(1, dt * 4); R.camP.lerp(P, k); R.camL.lerp(L, k); cam.position.copy(R.camP); cam.lookAt(R.camL);
  majHud();
}
let last = performance.now();
function loop(t){
  requestAnimationFrame(loop); const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
  tick(dt);
  if(msgT > 0){ msgT -= dt; if(msgT <= 0) mmsg.classList.remove('on'); }
  if(!R){ const tt = t / 1000; cam.position.set(Math.sin(tt * .05) * 34, 10, Math.cos(tt * .05) * 34); cam.lookAt(0, 1, 0); }
  renderer.render(scene, cam);
}
requestAnimationFrame(loop);

/* ---------------- le menu ---------------- */
function menu(){
  $('cards').innerHTML = Object.entries(EP).map(([id, e]) => { const r = record(id), v = r ? r.v : null;
    const rec = v == null ? 'Pas encore de record' : e.regle === 'hunter' ? `Record : ${v} / 100` : e.regle === 'dressage' ? `Record : ${v} %` : e.regle === 'course' ? `Meilleure place : ${v}e` : e.regle === 'barils' ? `Record : ${String(v).replace('.', ',')} s` : `Record : ${v} pt`;
    return `<div class="card"><img class="vue" src="concours-vrai/img/${e.pano}.webp" alt="" loading="lazy"><div class="l">${e.ic} <span>${e.nom}</span></div><p>${e.aide}</p><div class="pref">${rec}</div><button class="go" type="button" data-e="${id}">Partir</button></div>`; }).join('')
    + `<div class="card"><img class="vue" src="concours-vrai/img/v_b.webp" alt="" loading="lazy"><div class="l">🏇 <span>CSO</span></div><p>Le parcours de 6 obstacles en carrière, avec les barres qui tombent : c'est le premier « Concours en vrai ».</p><div class="pref"></div><a class="go" href="concours-vrai.html">Y aller</a></div>`;
  $('cards').querySelectorAll('button.go').forEach(b => b.onclick = () => partir(b.dataset.e));
}
menu(); construit('cross');
addEventListener('pointerdown', function premier(){ removeEventListener('pointerdown', premier); if($('menu').classList.contains('on')) play('musique'); }, { once:true });

// pour les tests : avance(sec, robot) fait tourner le jeu sans attendre l'affichage ; le robot saute au milieu de la zone, suit la reprise, ralentit aux tonneaux, gère le souffle
const avance = (sec, robot) => { for(let t = 0; t < sec; t += 1 / 60){
  if(robot && R && R.go && !R.done){ const o = OBS[R.next]; if(o && R.air == null){ const d = o.s - R.s; if(d < 3.6 && d > 3.4) gros(); }
    if(E.regle === 'dressage'){ const f = FIGS.find(f => f.s > R.s); const cur = FIGS.filter(f => f.s <= R.s).pop(); const prochain = f && f.s - R.s < 1.2 ? f : cur; if(prochain && R.allure !== prochain.need) setAllure(prochain.need); }
    if(E.regle === 'barils'){ const p = at(R.s + 4); const pres = BARILS.some(b => Math.hypot(p.x - b.x, p.z - b.z) < 4.6) || BARILS.some(b => { const q = at(R.s); return Math.hypot(q.x - b.x, q.z - b.z) < 4.4; }); setAllure(pres ? 'trot' : 'galop'); }
    if(E.regle === 'course'){ if(R.souffle < 30 && E.sFin - R.s > 80) setAllure('trot'); else if(R.souffle > 60 || E.sFin - R.s < 80) setAllure('galop'); if(E.sFin - R.s < 60 && R.pousse <= 0) gros(); } }
  tick(1 / 60); } };
window.__ep = { get R(){ return R; }, partir, avance, fin, EP, get FIGS(){ return FIGS; }, get OBS(){ return OBS; }, get LEN(){ return LEN; } };
