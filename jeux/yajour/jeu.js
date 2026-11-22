/* Yajour : la 3D (Three.js), la visée, les écrans, les sons, le commentaire et la sauvegarde. La physique est dans monde.js. */
import * as THREE from '../../lib/three-0.170.0.module.min.js';
import RAPIER from '../../lib/rapier3d-compat-0.14.0.es.js';
import { NIVEAUX, MONDES, LANCE, PLATEAU, REGLAGES, monde, lance, pas, auRepos, arc, viser, bilan, score, etoiles, pieces } from './monde.js';

const $ = id => document.getElementById(id);
const jeuVisible = () => document.body.dataset.ecran === 'jeu';
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const IMG = 'yajour/img/', AV = '/jeux/avatars/';
const HEROS = ['amine', 'salma', 'essil', 'anis', 'imen', 'nour', 'yasmine', 'fares'];

/* ---------- le joueur ---------- */
let joueur = null, sv = null;
const neuf = () => ({ niv:{}, pieces:0, pouv:{ lourd:2, boum:2, triple:2 }, reg:{ son:true, vib:true, lang:'ar', ombres:true }, t:0 });
const cle = () => 'yajour:' + joueur;
const REG = () => (sv || neuf()).reg;
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
const totalEtoiles = () => sv ? Object.values(sv.niv).reduce((a, n) => a + (n.e || 0), 0) : 0;
function heroId(n){ const k = String(n || '').toLowerCase(); if(HEROS.includes(k)) return k; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h && HEROS.includes(h.id) ? h.id : 'nour'; }
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {}); sv.reg = Object.assign(neuf().reg, sv.reg || {}); sv.pouv = Object.assign(neuf().pouv, sv.pouv || {});
  if(window.Famille && Famille.track){ Famille.track('yajour', n, [cle()]);
    try{ const r = await Famille.load('yajour', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); sv.reg = Object.assign(neuf().reg, d.reg || {}); store.set(cle(), sv); } }catch(e){} }
  chargeHeros(); menu(); }
async function choisirJoueur(){ if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue à Yajour ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
    avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n; }

/* ---------- les sons (fabriqués par le navigateur) et le commentaire en arabe ---------- */
let AC = null, BRUIT = null;
function ac(){ try{ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume();
  if(!BRUIT){ BRUIT = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = BRUIT.getChannelData(0); for(let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } }catch(e){} return AC; }
function bruit(f, q, d, v, type = 'bandpass', f2){ if(!REG().son) return; const a = ac(); if(!a) return; const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
  s.buffer = BRUIT; fl.type = type; fl.frequency.setValueAtTime(f, t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2, t + d); fl.Q.value = q; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t, Math.random() * .5); s.stop(t + d + .05); }
function bip(f, d, type, v, f2){ if(!REG().son) return; const a = ac(); if(!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const SON = {
  envol(){ bruit(400, .7, .6, .25, 'bandpass', 2400); },
  choc(t, f){ const v = Math.min(.35, .04 + f / 60); const fr = { bois:700, palmier:600, brique:420, pierre:260, marbre:320, matelas:180, zellige:300, jarre:900, feux:500, chat:900 }[t] || 400; bruit(fr, 1.2, .14, v); if(t === 'matelas') bip(220, .25, 'sine', v * .6, 520); },
  casse(){ bruit(2600, .6, .35, .35, 'highpass'); bruit(1200, 1, .2, .2); },
  boum(){ bruit(120, .6, .9, .6, 'lowpass', 40); bip(70, .6, 'sine', .4, 30); },
  sorti(){ bip(660, .08, 'triangle', .05); },
  gagne(){ [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => bip(f, .25, 'triangle', .1), i * 120)); },
  perdu(){ [392, 330, 262].forEach((f, i) => setTimeout(() => bip(f, .3, 'triangle', .08), i * 160)); },
  miaou(){ bip(700, .25, 'sawtooth', .04, 1100); setTimeout(() => bip(1000, .3, 'sawtooth', .035, 600), 220); },
};
const vibre = ms => { if(REG().vib && navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} };
function parle(t, lang){ try{ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang; speechSynthesis.speak(u); }catch(e){} }
const dit = (fr, ar) => REG().lang === 'fr' ? parle(fr, 'fr-FR') : parle(ar, 'ar');
// la mission de chaque niveau, en arabe (dite au début)
const AIDES_AR = [
  'اسْحَبْ إِصْبَعَكَ لِتُصَوِّب، ثُمَّ اتْرُكْهُ لِتَطير! أَسْقِطْ ثَلاثَ قِطَعٍ مِنَ السَّطْح.', 'جِدارٌ مِنَ الآجُرّ: صَوِّبْ نَحْوَ الوَسَط!', 'بُرْجان: هَلْ تَسْتَطيعُ إِسْقاطَهُما مَعًا؟',
  'قِطٌّ صَغيرٌ مَحْبوسٌ في قَفَص! اكْسِرِ القَفَصَ دونَ أَنْ يَسْقُطَ القِطّ.', 'أَصِبِ الجَرَّةَ الذَّهَبِيَّةَ المُخْتَبِئَةَ وَراءَ الجِدار.',
  'أَعْمِدَةُ الحَجَرِ ثَقيلَة: صَوِّبْ نَحْوَ الأَعْلى لِتُسْقِطَها.', 'الجِرارُ تَنْكَسِرُ إِذا ضَرَبْتَها بِقُوَّة. اكْسِرِ الجَرَّتَيْنِ الذَّهَبِيَّتَيْن!', 'الرُّخامُ زَلِق: ادْفَعِ القِطَعَ حَتّى الحافَّة!',
  'مُدَرَّجٌ كَما في الجَمّ: أَسْقِطْ كُلَّ شَيْء!', 'حَرِّرِ القِطَّ الصَّغير، لَكِنِ انْتَبِه: لا يَجِبُ أَنْ يَسْقُط!',
  'الصُّنْدوقُ الأَحْمَرُ مَليءٌ بِالأَلْعابِ النّارِيَّة: المِسْهُ و… بوم!', 'اقْفِزْ عَلى الفِراشِ لِتَصِلَ إِلى البُرْجِ البَعيد.', 'الجِرارُ الذَّهَبِيَّةُ قُرْبَ الواحَة. صُنْدوقُ الأَلْعابِ النّارِيَّةِ قَدْ يُساعِدُك!',
  'قافِلَةٌ كَبيرَةٌ مِنَ الصَّناديق: أَسْقِطْها كُلَّها!', 'القِطُّ الأَخيرُ في الأَعْلى! حَرِّرْهُ دونَ أَنْ يَسْقُط.'];

/* ---------- la 3D ---------- */
const cv = $('cv');
const renderer = new THREE.WebGLRenderer({ canvas:cv, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(55, 1, .1, 400);
const lumiere = new THREE.DirectionalLight(0xfff1dc, 2.4); lumiere.position.set(-8, 16, -10); lumiere.castShadow = true;
lumiere.shadow.mapSize.set(1024, 1024); Object.assign(lumiere.shadow.camera, { left:-9, right:9, top:9, bottom:-9, near:1, far:50 }); lumiere.shadow.bias = -.0006;
scene.add(lumiere, new THREE.HemisphereLight(0xcfe8ff, 0x8a6a4a, 1.1));
const TL = new THREE.TextureLoader(), TEX = {};
function tex(nom, rep = 1){ const k = nom + ':' + rep; if(TEX[k]) return TEX[k]; const t = TL.load(IMG + nom + '.webp'); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4; return TEX[k] = t; }
const MAT = {}, MREP = { brique:.35, bois:.5, pierre:.6, palmier:.6, marbre:.6, matelas:.7, feux:.8, zellige:.7, terre:1 };
function mat(t, cible){ const k = t + (cible ? '+or' : ''); if(MAT[k]) return MAT[k];
  if(t === 'jarre') return MAT[k] = new THREE.MeshStandardMaterial({ map:tex('m-terre', 1), color:cible ? 0xffd34d : 0xffffff, roughness:cible ? .3 : .85, metalness:cible ? .55 : 0, emissive:cible ? 0x553300 : 0 });
  return MAT[k] = new THREE.MeshStandardMaterial({ map:tex('m-' + t, MREP[t] || 1), roughness:t === 'marbre' ? .25 : .85 }); }
function geoJarre(){ const pts = [[0, -.45], [.18, -.45], [.27, -.32], [.31, -.1], [.29, .1], [.2, .27], [.13, .34], [.15, .42], [.17, .45]].map(([x, y]) => new THREE.Vector2(x, y)); return new THREE.LatheGeometry(pts, 24); }
let GJ = null;

let decor = null, PANO = null, SOL = null;
function construitDecor(mo){
  if(decor) scene.remove(decor); decor = new THREE.Group(); scene.add(decor);
  scene.background = new THREE.Color(mo.ciel); scene.fog = new THREE.Fog(mo.ciel, 45, 140);
  // le panorama : un grand cylindre devant le joueur
  const pano = tex('pano-' + mo.id, 1); pano.wrapS = THREE.ClampToEdgeWrapping; pano.repeat.set(-1, 1); pano.offset.set(1, 0);
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(110, 110, 94, 48, 1, true, -Math.PI * .62, Math.PI * 1.24), new THREE.MeshBasicMaterial({ map:pano, side:THREE.BackSide, fog:false }));
  cyl.position.set(0, 26, -10); decor.add(cyl);
  // le sol lointain
  // en bas : la mer à Sidi Bou Saïd, la pierre à El Jem, le sable au Sahara (plus sombre que le plateau, pour bien voir ce qui tombe)
  const sl = tex(mo.id === 'sidibou' ? 'sol-sahara' : mo.sol.replace('_', '-'), 40), loin = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ map:sl, color:mo.id === 'sidibou' ? 0x2f6fb8 : mo.id === 'eljem' ? 0x9c8b70 : 0xc79a62, roughness:mo.id === 'sidibou' ? .35 : 1 }));
  loin.rotation.x = -Math.PI / 2; loin.position.y = -4; loin.receiveShadow = true; decor.add(loin);
  // le plateau
  const dessus = tex(mo.sol.replace('_', '-'), 4), zc = tex('m-zellige', 1).clone(); zc.repeat.set(4, 1); zc.needsUpdate = true; const cote = new THREE.MeshStandardMaterial({ map:zc, roughness:.6 });
  const plat = new THREE.Mesh(new THREE.BoxGeometry(PLATEAU.demi * 2, 1, PLATEAU.demi * 2), [cote, cote, new THREE.MeshStandardMaterial({ map:dessus, roughness:.95 }), cote, cote, cote]);
  plat.position.y = -.5; plat.receiveShadow = true; decor.add(plat);
  const mur = new THREE.MeshStandardMaterial({ color:mo.id === 'sidibou' ? 0xf4f1ea : 0xd9c49a, roughness:.95 });   // le mur blanc de la terrasse (pierre à El Jem et au Sahara)
  const pied = new THREE.Mesh(new THREE.BoxGeometry(PLATEAU.demi * 2 - .2, 3.2, PLATEAU.demi * 2 - .2), mur); pied.position.y = -2.6; pied.receiveShadow = true; decor.add(pied);
  // la rosace de lancement, sur un petit socle
  const socle = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.3, LANCE.y + 4 - .42, 32), new THREE.MeshStandardMaterial({ map:tex('m-zellige', 1), roughness:.6 }));
  socle.position.set(LANCE.x, (LANCE.y - .42 - 4) / 2, LANCE.z); socle.castShadow = socle.receiveShadow = true; decor.add(socle);
  const ros = new THREE.Mesh(new THREE.CircleGeometry(1.12, 48), new THREE.MeshStandardMaterial({ map:tex('rampe', 1), transparent:true, roughness:.5 }));
  ros.rotation.x = -Math.PI / 2; ros.position.set(LANCE.x, LANCE.y - .41, LANCE.z); decor.add(ros);
}

/* ---------- les héros (images ComfyUI) : de dos pour viser, en vol, joie, oups ---------- */
let HT = {};
function chargeHeros(){ const id = heroId(joueur); HT = {}; ['dos', 'vol', 'joie', 'oups', 'face'].forEach(p => { const t = TL.load(IMG + 'h-' + id + '-' + p + '.webp'); t.colorSpace = THREE.SRGBColorSpace; HT[p] = t; });
  $('heroMenu').src = IMG + 'h-' + id + '-face.webp'; }
function spriteHeros(pose, h){ const m = new THREE.SpriteMaterial({ map:HT[pose], transparent:true, depthWrite:false }); const s = new THREE.Sprite(m); s.userData.h = h; s.userData.pose = pose; fixeTaille(s); return s; }
function fixeTaille(s){ const im = s.material.map && s.material.map.image, h = s.userData.h; s.scale.set(im && im.width ? h * im.width / im.height : h * .55, h, 1); }
function pose(s, p){ if(s.userData.pose === p) return; s.userData.pose = p; s.material.map = HT[p]; s.material.needsUpdate = true; fixeTaille(s); }

/* ---------- une partie ---------- */
let P = null;   // { i, niv, S, meshes, etat, tirs, az, el, pouvoir, heros:[sprites], ... }
const ETATS = { INTRO:'intro', VISE:'vise', VOL:'vol', REPOS:'repos', FIN:'fin' };
const pointsArc = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.85 }), 60); pointsArc.count = 0; scene.add(pointsArc);
const viseur = new THREE.Mesh(new THREE.RingGeometry(.35, .5, 32), new THREE.MeshBasicMaterial({ color:0xffd34d, transparent:true, opacity:.9, side:THREE.DoubleSide, depthTest:false })); viseur.visible = false; scene.add(viseur);
let blocs = null;
async function partie(i){
  ferme(); const niv = NIVEAUX[i], mo = MONDES[niv.m];
  if(blocs) scene.remove(blocs); blocs = new THREE.Group(); scene.add(blocs);
  construitDecor(mo);
  const S = monde(RAPIER, niv);
  GJ = GJ || geoJarre();
  const meshes = S.corps.map(c => { const b = c.b; let m;
    if(b.chat){ m = new THREE.Sprite(new THREE.SpriteMaterial({ map:tex('chat', 1) })); m.scale.set(.75, .75, 1); m.center.set(.5, .2); }
    else if(b.forme === 'cyl') { m = new THREE.Mesh(new THREE.CylinderGeometry(b.s[0] / 2, b.s[0] / 2, b.s[1], 24), mat(b.t)); }
    else if(b.forme === 'jarre'){ m = new THREE.Mesh(GJ, mat('jarre', b.cible)); m.scale.set(b.s[0] / .62, b.s[1] / .9, b.s[2] / .62); }
    else m = new THREE.Mesh(new THREE.BoxGeometry(b.s[0] * .97, b.s[1] * .97, b.s[2] * .97), mat(b.t));
    if(m.isMesh){ m.castShadow = true; m.receiveShadow = true; }
    blocs.add(m); return m; });
  P = { i, niv, S, meshes, etat:ETATS.INTRO, tirs:niv.tirs, az:0, el:14, pouvoir:null, heros:[], tIntro:0, eclats:[], secousse:0, vite:1, sc:0, tVol:0, vue:false, cam:{ th:0, ph:.38, r:20 } };
  const h = spriteHeros('dos', 1.55); h.position.set(LANCE.x, LANCE.y - .42 + .78, LANCE.z); blocs.add(h); P.attente = h;
  renderer.shadowMap.enabled = REG().ombres; lumiere.castShadow = REG().ombres;
  montre('jeu'); hud(); taille();
  $('aideTxt').textContent = niv.aide; $('aideTxt').classList.remove('off'); clearTimeout(P.tAide); P.tAide = setTimeout(() => $('aideTxt').classList.add('off'), 6000);
  dit(niv.aide, AIDES_AR[i] || '');
}
const fixe = (id, prop, v) => { const e = $(id); if(e['_' + prop] !== v){ e['_' + prop] = v; e[prop] = v; } };   // ne réécrire que ce qui change (sinon les images clignotent)
function hud(){ if(!P) return; const b = bilan(P.S), but = P.niv.but;
  fixe('objectif', 'innerHTML', but.type === 'tomber' ? `Fais tomber <b>${but.min}</b> blocs : <b>${b.fait}/${b.total}</b>` : but.type === 'cible' ? `Casse les jarres d'or : <b>${b.fait}/${b.total}</b>` : `Libère le chaton : <b>${b.fait}/${b.total}</b> morceaux de cage`);
  fixe('score', 'textContent', '⭐ ' + score(P.S, P.tirs));
  const id = heroId(joueur); fixe('tirs', 'innerHTML', Array.from({ length:P.niv.tirs }, (_, k) => `<img src="${AV}reel/${id}.webp" class="${k >= P.tirs ? 'fait' : ''}" alt="">`).join(''));
  const pv = (sv || neuf()).pouv;
  fixe('pouv', 'innerHTML', [['lourd', '🪨'], ['boum', '💥'], ['triple', '🔱']].map(([k, e]) => `<button data-p="${k}" class="${P.pouvoir === k ? 'on' : ''}" ${pv[k] > 0 && P.etat === ETATS.VISE ? '' : 'disabled'} title="${k}">${e}<i>${pv[k] || 0}</i></button>`).join(''));
  $('lancer').disabled = P.etat !== ETATS.VISE; $('bVite').hidden = $('bPasse').hidden = !(P.etat === ETATS.VOL || P.etat === ETATS.REPOS);
  $('bVue').textContent = P.vue ? '🎯' : '👁️';
}
$('pouv').onclick = e => { const b = e.target.closest('[data-p]'); if(!b || !P || P.etat !== ETATS.VISE) return; P.pouvoir = P.pouvoir === b.dataset.p ? null : b.dataset.p; hud(); };
function tire(){ if(!P || P.etat !== ETATS.VISE) return; ac();
  const pv = sv.pouv; if(P.pouvoir && pv[P.pouvoir] > 0){ pv[P.pouvoir]--; sauve(); } else P.pouvoir = null;
  lance(P.S, P.az, P.el, P.pouvoir); P.S.tTir = P.S.t; P.tirs--; P.etat = ETATS.VOL; P.tVol = 0; P.vue = false;
  if(P.attente){ blocs.remove(P.attente); P.attente = null; }
  P.S.heros.slice(-(P.pouvoir === 'triple' ? 3 : 1)).forEach(h => { const s = spriteHeros('vol', 1.35); blocs.add(s); h.sprite = s; });
  pointsArc.count = 0; viseur.visible = false; SON.envol(); vibre(20);
  dit('Vas-y !', ['انْطَلِق!', 'هَيّا!', 'طِرْ يا بَطَل!'][P.tirs % 3]);
  P.pouvoir = null; hud(); }
$('lancer').onclick = () => tire();

/* ---------- la visée : glisser = tourner / monter ; toucher un bloc = viser ce bloc ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let geste = null; const doigts = new Map();
cv.addEventListener('pointerdown', e => { if(!P) return; ac(); doigts.set(e.pointerId, { x:e.clientX, y:e.clientY }); try{ cv.setPointerCapture(e.pointerId); }catch(_){}
  geste = { x:e.clientX, y:e.clientY, az:P.az, el:P.el, th:P.cam.th, ph:P.cam.ph, bouge:false, d0:null, r0:P.cam.r }; });
cv.addEventListener('pointermove', e => { if(!P || !geste || !doigts.has(e.pointerId)) return; doigts.set(e.pointerId, { x:e.clientX, y:e.clientY });
  const dx = e.clientX - geste.x, dy = e.clientY - geste.y; if(Math.hypot(dx, dy) > 6) geste.bouge = true;
  if(doigts.size === 2){ const [a, b] = [...doigts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if(!geste.d0) geste.d0 = d; P.vue = true; P.cam.r = Math.max(9, Math.min(34, geste.r0 * geste.d0 / d)); hud(); return; }
  if(P.vue || P.etat !== ETATS.VISE){ if(P.vue){ P.cam.th = geste.th - dx * .006; P.cam.ph = Math.max(.08, Math.min(1.35, geste.ph + dy * .004)); } return; }
  const k = matchMedia('(pointer:coarse)').matches ? .11 : .08;
  P.az = Math.max(-28, Math.min(28, geste.az - dx * k)); P.el = Math.max(-4, Math.min(62, geste.el - dy * k)); montreArc(); });
function fin_geste(e){ if(!P || !geste) return; doigts.delete(e.pointerId); if(doigts.size) return; const g = geste; geste = null;
  if(P.vue || P.etat !== ETATS.VISE) return;
  if(g.bouge && !g.d0){ tire(); return; }
  if(!g.bouge){   // toucher un bloc : viser ce point (tir tendu), puis LANCER
    const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(blocs.children.filter(m => m.isMesh), false)[0]; if(!hit) return;
    const v = viser(P.S, hit.point.x, hit.point.y, hit.point.z); if(!v){ toast('Trop loin !'); return; }
    P.az = v.az; P.el = v.el; montreArc(); viseur.position.copy(hit.point); viseur.lookAt(camera.position); viseur.visible = true; }
}
cv.addEventListener('pointerup', fin_geste); cv.addEventListener('pointercancel', e => { doigts.delete(e.pointerId); geste = null; });
cv.addEventListener('wheel', e => { if(!P) return; P.vue = true; P.cam.r = Math.max(9, Math.min(34, P.cam.r * (1 + Math.sign(e.deltaY) * .08))); hud(); }, { passive:true });
addEventListener('keydown', e => { if(!P || !jeuVisible()) return;
  if(e.code === 'KeyP' || e.code === 'Escape'){ P.pause ? reprend() : pause(); return; }
  if(P.etat !== ETATS.VISE) return;
  if(e.code === 'ArrowLeft') P.az = Math.min(28, P.az + 1); else if(e.code === 'ArrowRight') P.az = Math.max(-28, P.az - 1);
  else if(e.code === 'ArrowUp') P.el = Math.min(62, P.el + 1); else if(e.code === 'ArrowDown') P.el = Math.max(-4, P.el - 1);
  else if(e.code === 'Space' || e.code === 'Enter'){ e.preventDefault(); tire(); return; } else return;
  e.preventDefault(); montreArc(); });
const M4 = new THREE.Matrix4();
function montreArc(){ const pts = arc(P.S, P.az, P.el, 60, .045); pointsArc.count = pts.length; pts.forEach((p, q) => { M4.makeTranslation(p[0], p[1], p[2]); pointsArc.setMatrixAt(q, M4); }); pointsArc.instanceMatrix.needsUpdate = true; }
$('bVue').onclick = () => { if(!P) return; P.vue = !P.vue; if(!P.vue) P.cam = { th:0, ph:.38, r:20 }; hud(); };
$('bVite').onclick = () => { if(!P) return; P.vite = P.vite === 1 ? 2 : 1; $('bVite').textContent = P.vite === 2 ? '⏩×2' : '⏩'; };
$('bPasse').onclick = () => { if(!P || !(P.etat === ETATS.VOL || P.etat === ETATS.REPOS)) return; P.passe = true; };

/* ---------- la caméra ---------- */
const camPos = new THREE.Vector3(0, 5, -22), camVise = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
function cible(dt){
  const asp = W / H, recul = asp < 1 ? (1 / asp - 1) * 9 : 0;
  let pos, look;
  if(P.etat === ETATS.INTRO){ const a = -1.1 + Math.min(1, P.tIntro / 2.6) * 1.1; pos = new THREE.Vector3(Math.sin(a) * 16, 6 - P.tIntro * .6, -Math.cos(a) * 16 - 4); look = new THREE.Vector3(0, 1.2, 0); }
  else if(P.vue){ const c = P.cam; pos = new THREE.Vector3(Math.sin(c.th) * Math.cos(c.ph) * c.r, Math.sin(c.ph) * c.r + .5, -Math.cos(c.th) * Math.cos(c.ph) * c.r); look = new THREE.Vector3(0, 1, 0); }
  else if(P.etat === ETATS.VOL && P.S.heros.length){ const h = P.S.heros[P.S.heros.length - 1].rb.translation();
    if(h.z < -3 && h.y > -3){ pos = new THREE.Vector3(h.x * .6, h.y + 2.6, h.z - 6.5 - recul * .4); look = new THREE.Vector3(h.x * .5, Math.max(1, h.y * .6), h.z + 8); }
    else { pos = new THREE.Vector3(2.5, 5.5 + recul * .3, -11 - recul); look = new THREE.Vector3(0, 1, 0); } }
  else if(P.etat === ETATS.REPOS){ pos = new THREE.Vector3(2.5, 5.5 + recul * .3, -11 - recul); look = new THREE.Vector3(0, 1, 0); }
  else { pos = new THREE.Vector3(0, 4.4 + recul * .35, LANCE.z - 6.5 - recul); look = new THREE.Vector3(0, 1.4, 0); }
  const k = 1 - Math.exp(-dt * (P.etat === ETATS.VOL ? 5 : 3));
  camPos.lerp(pos, k); camVise.lerp(look, k); camera.position.copy(camPos);
  if(P.secousse > 0){ camera.position.x += (Math.random() - .5) * P.secousse; camera.position.y += (Math.random() - .5) * P.secousse; }
  camera.lookAt(camVise);
}

/* ---------- les effets : poussière, éclats, explosions ---------- */
const PG = new THREE.BoxGeometry(.12, .12, .12);
function eclats(x, y, z, n, couleur, force = 4){ for(let q = 0; q < n; q++){ const m = new THREE.Mesh(PG, new THREE.MeshBasicMaterial({ color:couleur, transparent:true }));
  m.position.set(x, y, z); blocs.add(m); P.eclats.push({ m, v:new THREE.Vector3((Math.random() - .5) * force, Math.random() * force, (Math.random() - .5) * force), t:0, vie:.8 + Math.random() * .6 }); } }
const COUL = { brique:0xb5532f, bois:0x2e86de, pierre:0xd8c39a, palmier:0x8b6a4a, marbre:0xf2f2f2, matelas:0xc0392b, jarre:0xd9773c, feux:0xd62828, zellige:0x2a6fdb, chat:0xffb347 };
function evenements(){ const S = P.S;
  for(const e of S.ev){
    if(e.k === 'choc' && e.f > 3){ SON.choc(e.c.b.t, e.f); if(e.f > 12){ const p = e.c.rb.translation ? e.c.rb.translation() : null; if(p && !e.c.parti) eclats(p.x, p.y, p.z, 4, 0xe9dcc5, 2); } if(e.heros) vibre(15); if(e.c.b.chat) SON.miaou(); }
    else if(e.k === 'casse'){ SON.casse(); const p = e.c.rb.translation(); eclats(p.x, p.y, p.z, 26, e.c.b.cible ? 0xffd34d : 0xd9773c, 6); vibre(30);
      if(e.c.b.cible) dit('Bravo, une jarre d’or !', 'رائِع! جَرَّةٌ ذَهَبِيَّة!'); }
    else if(e.k === 'boum'){ SON.boum(); eclats(e.p[0], e.p[1], e.p[2], 40, 0xffa62b, 9); eclats(e.p[0], e.p[1], e.p[2], 20, 0xffe66d, 7); P.secousse = .5; vibre([40, 30, 60]);
      const f = $('flash'); f.style.opacity = .55; setTimeout(() => f.style.opacity = 0, 90); }
    else if(e.k === 'sorti'){ SON.sorti(); }
    else if(e.k === 'lance'){}
  }
  S.ev.length = 0;
}

/* ---------- la boucle ---------- */
let W = 1, H = 1, avant = performance.now(), acc = 0;
function taille(){ W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
addEventListener('resize', taille);
// 22/11 : la position d'avant chaque pas de physique (60 par seconde), pour dessiner entre deux pas : plus d'à-coups sur les écrans à 120/144 Hz
const Q0 = new THREE.Quaternion(), Q1 = new THREE.Quaternion();
function photo(S){ for(const c of S.corps){ if(c.parti) continue; const p = c.rb.translation(), r = c.rb.rotation(); c._p = [p.x, p.y, p.z]; c._q = [r.x, r.y, r.z, r.w]; }
  for(const h of S.heros){ const p = h.rb.translation(); h._p = [p.x, p.y, p.z]; } }
const mel = (a, b, al) => a + (b - a) * al;
function boucle(now){ requestAnimationFrame(boucle); const dt = Math.min(.05, (now - avant) / 1000); avant = now;
  if(!P || !jeuVisible()) return;
  if(!P.pause){
    if(P.etat === ETATS.INTRO){ P.tIntro += dt; if(P.tIntro > 2.6){ P.etat = ETATS.VISE; montreArc(); hud(); } }
    if(P.etat === ETATS.VOL || P.etat === ETATS.REPOS){
      if(P.passe){ let n = 0; while(!auRepos(P.S) && n++ < 60 * 10) pas(P.S); P.passe = false; evenements(); }
      acc += dt * P.vite; let n = 0; while(acc >= REGLAGES.pas && n++ < 8){ photo(P.S); pas(P.S); acc -= REGLAGES.pas; } if(acc > REGLAGES.pas) acc = 0;
      evenements(); P.tVol += dt; if(P.etat === ETATS.VOL && P.tVol > 1.6) P.etat = ETATS.REPOS;
      if(P.tVol > .3 && auRepos(P.S)) evalue();
      hud();
    }
    // les corps
    const al = (P.etat === ETATS.VOL || P.etat === ETATS.REPOS) ? Math.min(1, acc / REGLAGES.pas) : 1;
    P.S.corps.forEach((c, q) => { const m = P.meshes[q]; if(c.parti){ m.visible = false; return; } const p = c.rb.translation(), r = c.rb.rotation();
      if(c._p && al < 1){ m.position.set(mel(c._p[0], p.x, al), mel(c._p[1], p.y, al), mel(c._p[2], p.z, al)); if(m.isMesh){ Q0.set(c._q[0], c._q[1], c._q[2], c._q[3]); Q1.set(r.x, r.y, r.z, r.w); m.quaternion.slerpQuaternions(Q0, Q1, al); } }
      else { m.position.set(p.x, p.y, p.z); if(m.isMesh) m.quaternion.set(r.x, r.y, r.z, r.w); } });
    P.S.heros.forEach(h => { if(!h.sprite) return; const p = h.rb.translation(); const x = h._p && al < 1 ? mel(h._p[0], p.x, al) : p.x, y = h._p && al < 1 ? mel(h._p[1], p.y, al) : p.y, z = h._p && al < 1 ? mel(h._p[2], p.z, al) : p.z;
      h.sprite.position.set(x, y + .2, z); h.sprite.visible = p.y > -3.6; });
    P.eclats.forEach(e => { e.t += dt; e.v.y -= 9.8 * dt; e.m.position.addScaledVector(e.v, dt); e.m.rotation.x += dt * 5; e.m.material.opacity = Math.max(0, 1 - e.t / e.vie); if(e.t > e.vie){ blocs.remove(e.m); e.m.material.dispose(); } });
    P.eclats = P.eclats.filter(e => e.t <= e.vie); P.secousse = Math.max(0, P.secousse - dt * 1.5);
    if(viseur.visible) viseur.rotation.z += dt * 2;
  }
  cible(dt); renderer.render(scene, camera);
}
requestAnimationFrame(boucle);

/* ---------- la fin d'un tir, la victoire, l'échec ---------- */
function evalue(){
  const b = bilan(P.S);
  // le héros se pose : sonné (oups) s'il est resté sur le plateau
  P.S.heros.forEach(h => { if(h.sprite){ const p = h.rb.translation(); if(p.y > -.6 && Math.abs(p.x) < PLATEAU.demi && Math.abs(p.z) < PLATEAU.demi){ pose(h.sprite, 'oups'); h.sprite.userData.h = 1.1; fixeTaille(h.sprite); } else h.sprite.visible = false; } });
  if(b.chatTombe){ return fin(false, 'Oh non, le chaton est tombé !', 'أَوْه! سَقَطَ القِطُّ الصَّغير!'); }
  if(b.ok) return fin(true);
  if(P.tirs <= 0) return fin(false, 'Plus de héros à lancer…', 'انْتَهَتِ المُحاوَلات… حاوِلْ مَرَّةً أُخْرى!');
  P.etat = ETATS.VISE; const h = spriteHeros('dos', 1.55); h.position.set(LANCE.x, LANCE.y - .42 + .78, LANCE.z); blocs.add(h); P.attente = h; montreArc(); hud();
  if(b.fait > 0) dit('Encore un effort !', ['أَحْسَنْت! واصِل!', 'جَيِّد! بَقِيَ القَليل!'][P.tirs % 2]);
}
function fin(gagne, pourquoi, pourquoiAr){
  P.etat = ETATS.FIN; hud();
  const id = heroId(joueur), i = P.i;
  if(gagne){
    const sc = score(P.S, P.tirs), e = etoiles(P.S, P.tirs), pc = pieces(sc);
    const o = sv.niv[i] || {}; sv.niv[i] = { e:Math.max(o.e || 0, e), sc:Math.max(o.sc || 0, sc) }; sv.pieces = (sv.pieces || 0) + pc;
    if(e === 3){ const ks = ['lourd', 'boum', 'triple'], k = ks[i % 3]; sv.pouv[k] = (sv.pouv[k] || 0) + 1; }
    sauve(); if(window.Famille && joueur) Famille.score('yajour', 'etoiles', totalEtoiles(), joueur).catch(() => {});
    SON.gagne(); vibre([30, 40, 60]);
    dit(e === 3 ? 'Bravo, super-héros ! Trois étoiles !' : 'Bravo, mission réussie !', e === 3 ? 'أَحْسَنْتَ يا بَطَل! ثَلاثُ نُجوم!' : 'أَحْسَنْت! نَجَحَتِ المُهِمَّة!');
    const suivant = i + 1 < NIVEAUX.length && ouvert(i + 1);
    setTimeout(() => modal(`<img class="heros" src="${IMG}h-${id}-joie.webp" alt=""><h2>Bravo${joueur ? ', ' + joueur : ''} !</h2>
      <div class="etoiles">${'⭐'.repeat(e)}${'<span style="opacity:.25">⭐</span>'.repeat(3 - e)}</div>
      <p>Score ${sc} · +${pc} 🪙${e === 3 ? ' · un pouvoir en cadeau !' : ''}</p>
      <div class="rang">${suivant ? '<button class="gros" data-s>Niveau suivant ▶</button>' : ''}<button class="btn" data-r>⟲ Rejouer</button><button class="btn" data-m>🗺️ Carte</button></div>`, ev => {
        if(ev.target.closest('[data-s]')) partie(i + 1); else if(ev.target.closest('[data-r]')) partie(i); else if(ev.target.closest('[data-m]')) quitte(); }), 1300);
  } else {
    SON.perdu(); dit(pourquoi, pourquoiAr);
    setTimeout(() => modal(`<img class="heros" src="${IMG}h-${id}-oups.webp" alt=""><h2>Oups !</h2><p>${pourquoi}</p>
      <div class="rang"><button class="gros" data-r>⟲ Réessayer</button><button class="btn" data-m>🗺️ Carte</button></div>`, ev => {
        if(ev.target.closest('[data-r]')) partie(i); else if(ev.target.closest('[data-m]')) quitte(); }), 900);
  }
}
function quitte(){ ferme(); P = null; if(blocs){ scene.remove(blocs); blocs = null; } menu(); records(); }
function pause(){ if(!P || P.etat === ETATS.FIN) return; P.pause = true;
  modal(`<h2>⏸ Pause</h2><p>${P.niv.nom}</p><div class="rang"><button class="gros" data-r>▶ Reprendre</button><button class="btn" data-z>⟲ Recommencer</button><button class="btn" data-m>🗺️ Carte</button></div>`, e => {
    if(e.target.closest('[data-r]')) reprend(); else if(e.target.closest('[data-z]')) partie(P.i); else if(e.target.closest('[data-m]')) quitte(); }); }
function reprend(){ if(P) P.pause = false; ferme(); }
$('bPause').onclick = () => pause();

/* ---------- les écrans ---------- */
function montre(id){ $('menu').classList.toggle('on', id === 'menu'); $('hud').classList.toggle('on', id === 'jeu'); document.body.dataset.ecran = id; }
function ouvert(i){ const niv = NIVEAUX[i]; if(niv.m === 0) return i === 0 || !!(sv && sv.niv[i - 1] && sv.niv[i - 1].e) || (sv && Object.keys(sv.niv).some(k => +k >= i));
  const deDuMonde = NIVEAUX.map((n, k) => [n, k]).filter(([n]) => n.m === niv.m - 1).filter(([, k]) => sv && sv.niv[k] && sv.niv[k].e).length;
  if(deDuMonde < 4) return false; const premier = NIVEAUX.findIndex(n => n.m === niv.m); return i === premier || !!(sv && sv.niv[i - 1] && sv.niv[i - 1].e); }
function menu(){
  montre('menu'); $('total').textContent = '⭐ ' + totalEtoiles();
  $('who').innerHTML = joueur ? `<img src="${AV}reel/${heroId(joueur)}.webp" alt="">${joueur}` : 'Qui joue ?';
  if(!joueur) $('heroMenu').src = IMG + 'h-nour-face.webp';
  $('mondes').innerHTML = MONDES.map((mo, m) => { const L = NIVEAUX.map((n, i) => [n, i]).filter(([n]) => n.m === m); const ferme = !ouvert(L[0][1]);
    return `<div class="monde${ferme ? ' ferme' : ''}" style="background-image:url(${IMG}pano-${mo.id}.webp)"><h3>${m + 1} · ${mo.nom}<small>${mo.ar}</small>${ferme ? ' 🔒' : ''}</h3>
      ${ferme ? `<div style="font-weight:800">Gagne 4 niveaux de ${MONDES[m - 1].nom} pour ouvrir ce monde.</div>` : ''}
      <div class="niveaux">${L.map(([n, i]) => { const s = sv && sv.niv[i], o = ouvert(i); return `<button class="niv${o && !(s && s.e) ? ' suivant' : ''}" data-i="${i}" ${o ? '' : 'disabled'} title="${n.nom}">${o ? i + 1 : '🔒'}<small>${s && s.e ? '★'.repeat(s.e) : ''}</small></button>`; }).join('')}</div></div>`; }).join('');
  const s = sv || neuf(); $('bourse').innerHTML = `<span>🪙 ${s.pieces || 0} pièces</span><span>🪨 lourd × ${s.pouv.lourd}</span><span>💥 boum × ${s.pouv.boum}</span><span>🔱 triple × ${s.pouv.triple}</span>`;
}
$('mondes').onclick = async e => { const b = e.target.closest('[data-i]'); if(!b || b.disabled) return; ac(); if(!joueur && !(await choisirJoueur())) return; partie(+b.dataset.i); };
$('who').onclick = () => choisirJoueur();
async function records(){ const rows = window.Famille ? await Famille.highscores('yajour', 'etoiles', 10).catch(() => null) : null;
  $('records').innerHTML = rows && rows.length ? rows.map(r => `<li>${r.player} — ⭐ ${r.score}</li>`).join('') : '<p class="none">Pas encore de record : à toi de jouer !</p>'; }
function modal(html, clic){ $('modal').innerHTML = `<div class="fenetre">${html}</div>`; $('modal').classList.add('on'); $('modal').onclick = clic || null; }
function ferme(){ $('modal').classList.remove('on'); $('modal').onclick = null; }
let tToast = 0; function toast(t){ const a = $('aideTxt'); a.textContent = t; a.classList.remove('off'); clearTimeout(tToast); tToast = setTimeout(() => a.classList.add('off'), 1800); }
$('regBtn').onclick = () => reglages();
function reglages(){ const r = REG(), voix = !window.FamilleVoix || FamilleVoix.on();
  const ligne = (k, t, sous, opts) => `<div class="reg"><span>${t}<small>${sous}</small></span><div class="choix" data-k="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(r[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  modal(`<h2>⚙️ Paramètres</h2>
    ${ligne('son', '🔊 Sons', 'chocs, explosions, envol', [[true, 'Oui'], [false, 'Non']])}
    ${ligne('vib', '📳 Vibrations', 'téléphone et tablette', [[true, 'Oui'], [false, 'Non']])}
    ${ligne('lang', '🗣️ Le commentaire', 'la voix pendant le jeu', [['ar', 'العربية'], ['fr', 'Français']])}
    ${ligne('ombres', '🌗 Ombres', 'plus joli, mais plus lourd pour les vieilles tablettes', [[true, 'Oui'], [false, 'Non']])}
    <div class="reg"><span>🔇 Couper toutes les voix<small>touche V sur ordinateur</small></span><div class="choix" data-k="voix"><button data-v="1" class="${voix ? 'on' : ''}">Voix</button><button data-v="0" class="${voix ? '' : 'on'}">Muet</button></div></div>
    <div class="rang"><button class="gros" data-ferme>OK</button></div>`, e => {
      const c = e.target.closest('[data-k] button'); if(c){ const k = c.parentNode.dataset.k, v = c.dataset.v;
        if(k === 'voix'){ if(window.FamilleVoix) FamilleVoix.regler(v === '1'); } else { r[k] = v === 'true' ? true : v === 'false' ? false : v; if(sv) sauve(); }
        reglages(); return; }
      if(e.target.closest('[data-ferme]') || e.target === $('modal')) ferme(); });
}

/* ---------- au démarrage : Rapier, puis le menu ---------- */
window.__yajour = { get P(){ return P; }, partie, NIVEAUX, tire, set aim(v){ if(P){ P.az = v[0]; P.el = v[1]; montreArc(); } } };
await RAPIER.init();
$('charge').remove();
taille();
const p0 = window.Famille ? Famille.player() : null;
if(p0) await setJoueur(p0); else { chargeHeros(); menu(); }
records();
