/* Concours en vrai (essai, 19/11) : une épreuve de CSO Club 3 dans une carrière « en vrai » (images ComfyUI),
   le cheval montré de trois façons : A filmé (vidéo Wan 2.2 détourée en direct), B le cheval 3D des Écuries (cheval.js, non modifié),
   C un modèle 3D fabriqué par TRELLIS.2 à partir d'une photo. Le cheval suit le parcours tout seul : on choisit l'allure et le moment du saut. */
import * as THREE from '../../lib/three-0.170.0.module.min.js';

const $ = id => document.getElementById(id);
const BASE = new URL('./', import.meta.url).href;
const IMG = BASE + 'img/', VID = BASE + 'vid/', SON = BASE + 'sons/';
const OPT = 50;                                          // temps accordé (s)
const VIT = { trot:3.6, galop:6.4 };
const ZONE = [2.4, 4.6];                                // la bonne distance d'appel avant l'obstacle (m)

/* ---------------- les sons (ElevenLabs) ---------------- */
let sonOn = true; try{ sonOn = localStorage.getItem('cev-son') !== '0'; }catch(e){}
const A = {}; ['galop', 'trot', 'saut', 'barre', 'bravo', 'cloche', 'hennit', 'refus', 'ambiance', 'musique'].forEach(n => { const a = new Audio(SON + n + '.mp3'); a.preload = 'auto'; A[n] = a; });
A.galop.loop = A.trot.loop = A.ambiance.loop = A.musique.loop = true;
A.ambiance.volume = .45; A.musique.volume = .35; A.galop.volume = .9; A.trot.volume = .8;
const play = (n, v) => { if(!sonOn) return; const a = A[n]; try{ if(v != null) a.volume = v; if(!a.loop) a.currentTime = 0; a.play().catch(() => {}); }catch(e){} };
const stop = n => { try{ A[n].pause(); }catch(e){} };
const stopAll = () => Object.keys(A).forEach(stop);
function majSon(){ $('son').textContent = sonOn ? '🔊 Son' : '🔇 Son'; if(!sonOn) stopAll(); }
$('son').onclick = () => { sonOn = !sonOn; try{ localStorage.setItem('cev-son', sonOn ? '1' : '0'); }catch(e){} majSon(); if(sonOn) play('musique'); };
majSon();
const dit = t => { try{ if(!sonOn || !window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; speechSynthesis.speak(u); }catch(e){} };

/* ---------------- la scène ---------------- */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0xdfe9f2, 70, 150);
const cam = new THREE.PerspectiveCamera(50, 1, .1, 400);
scene.add(new THREE.HemisphereLight(0xffffff, 0xb59a70, 1.6));
const sun = new THREE.DirectionalLight(0xfff1d6, 1.9); sun.position.set(-30, 50, 25); scene.add(sun);
const tl = new THREE.TextureLoader();
const tex = (n, rep) => { const t = tl.load(IMG + n); t.colorSpace = THREE.SRGBColorSpace; if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 8; } return t; };

// le ciel : le panorama ComfyUI collé à l'intérieur d'un grand cylindre
{ const t = tex('ciel.webp'); t.wrapS = THREE.RepeatWrapping; const R = 120, H = R * 2 * Math.PI / 6;
  const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 64, 1, true), new THREE.MeshBasicMaterial({ map:t, side:THREE.BackSide, fog:false }));
  m.position.y = H * .5 - H * .36; scene.add(m);
  const top = new THREE.Mesh(new THREE.CircleGeometry(R, 32), new THREE.MeshBasicMaterial({ color:0x9cc8ee, fog:false })); top.rotation.x = Math.PI / 2; top.position.y = H * .64 - .1; scene.add(top); }
// l'herbe et le sable de la carrière
{ const g = new THREE.Mesh(new THREE.CircleGeometry(118, 48), new THREE.MeshLambertMaterial({ map:tex('herbe.webp', 40) })); g.rotation.x = -Math.PI / 2; g.position.y = -.02; scene.add(g);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(76, 44), new THREE.MeshLambertMaterial({ map:tex('sable.webp', 18) })); s.rotation.x = -Math.PI / 2; scene.add(s);
  // la lice blanche
  const wm = new THREE.MeshLambertMaterial({ color:0xf4f2ec });
  const lice = (x, z, w, d) => { [.55, 1.05].forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, .1, d), wm); b.position.set(x, y, z); scene.add(b); }); };
  lice(0, -22, 76, .08); lice(0, 22, 76, .08); lice(-38, 0, .08, 44); lice(38, 0, .08, 44);
  for(let x = -38; x <= 38; x += 3.8) [-22, 22].forEach(z => { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.2, .12), wm); p.position.set(x, .6, z); scene.add(p); });
  for(let z = -22; z <= 22; z += 3.8) [-38, 38].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(.12, 1.2, .12), wm); p.position.set(x, .6, z); scene.add(p); }); }

/* ---------------- le parcours ---------------- */
const WP = [[-34, -13], [-8, -13], [10, -13], [25, -10], [30, 0], [24, 11], [8, 13], [-10, 13], [-25, 11.5], [-31, 6], [-23, 2.5], [-6, 0], [12, -4.5], [34, -9]].map(([x, z]) => new THREE.Vector3(x, 0, z));
const curve = new THREE.CatmullRomCurve3(WP, false, 'centripetal');
const LEN = curve.getLength(), N = 1600, PTS = curve.getSpacedPoints(N);
const at = s => { const u = Math.max(0, Math.min(1, s / LEN)), i = u * N, i0 = Math.floor(i), i1 = Math.min(N, i0 + 1), k = i - i0; return PTS[i0].clone().lerp(PTS[i1], k); };
const heading = s => { const a = at(s - 1.2), b = at(s + 1.2); return Math.atan2(b.x - a.x, b.z - a.z); };
const nearestS = (x, z) => { let best = 1e9, bi = 0; PTS.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if(d < best){ best = d; bi = i; } }); return bi / N * LEN; };
const OBS = [['vertical', -8, -13], ['oxer', 10, -13], ['mur', 8, 13], ['bouleau', -10, 13], ['oxer', -6, 0], ['vertical', 12, -4.5]].map(([img, x, z], i) => ({ img, i, s:nearestS(x, z) }));
const S0 = 2, SFIN = nearestS(30, -8.6);

// les obstacles : la photo détourée, plantée en travers du chemin, avec son numéro
const numTex = n => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.lineWidth = 8; g.strokeStyle = '#1f3c88'; g.stroke(); g.fillStyle = '#1f3c88'; g.font = '800 76px "Baloo 2", system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(n, 64, 70); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const shadowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 2, 32, 32, 31); r.addColorStop(0, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const zoneMat = new THREE.MeshBasicMaterial({ color:0x2fd38a, transparent:true, opacity:.28, depthWrite:false });
OBS.forEach(o => {
  const p = at(o.s), a = heading(o.s), g = new THREE.Group(); g.position.copy(p); g.rotation.y = a; scene.add(g);
  const t = tex(o.img + '.webp'); const W = 4.6;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, W * .6), new THREE.MeshLambertMaterial({ map:t, transparent:true, alphaTest:.45, side:THREE.DoubleSide }));
  t.onUpdate = null; tl.load(IMG + o.img + '.webp', im => { const r = im.image.height / im.image.width; plane.geometry.dispose(); plane.geometry = new THREE.PlaneGeometry(W, W * r); plane.position.y = W * r / 2; });
  plane.position.y = W * .3; g.add(plane);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.1, 1.6), new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .02; g.add(sh);
  const num = new THREE.Sprite(new THREE.SpriteMaterial({ map:numTex(o.i + 1), transparent:true })); num.scale.set(.8, .8, 1); num.position.set(-W / 2 - .3, 2.1, 0); g.add(num); o.num = num;
  const z = new THREE.Mesh(new THREE.PlaneGeometry(2.6, ZONE[1] - ZONE[0]), zoneMat); z.rotation.x = -Math.PI / 2; z.position.set(0, .03, -(ZONE[0] + ZONE[1]) / 2); z.visible = false; g.add(z); o.zone = z;
  o.g = g;
});
// une barre qui tombe (rouge et blanc)
const barreTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 16; const g = c.getContext('2d'); for(let i = 0; i < 8; i++){ g.fillStyle = i % 2 ? '#f6f4ee' : '#c8202f'; g.fillRect(i * 32, 0, 32, 16); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const chutes = [];
function barreTombe(o){ const m = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, 3.4, 10), new THREE.MeshLambertMaterial({ map:barreTex })); m.rotation.z = Math.PI / 2; m.position.set(0, .95, .2); o.g.add(m); chutes.push({ m, vy:0, rz:(Math.random() - .5) * .5 }); }

/* ---------------- les trois chevaux ---------------- */
const HORSE = {};
// A : le film (vidéo Wan 2.2 sur fond vert, détourée par le petit programme de dessin ci-dessous)
function chroma(video){
  const t = new THREE.VideoTexture(video); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.ShaderMaterial({ transparent:true, uniforms:{ map:{ value:t } }, vertexShader:'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader:`uniform sampler2D map; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); float k = c.g - max(c.r, c.b);
        if(k > .16) discard;
        float a = 1.0 - smoothstep(.06, .16, k);
        c.g = min(c.g, max(c.r, c.b) * 1.05);
        gl_FragColor = vec4(c.rgb, a); }` });
}
function makeFilm(){
  const mk = (src, loop) => { const v = document.createElement('video'); v.src = src; v.muted = true; v.loop = loop; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.crossOrigin = 'anonymous'; return v; };
  const ext = document.createElement('video').canPlayType('video/mp4; codecs="avc1.42E01E"') ? '.mp4' : '.webm';   // sans H.264 (certains Linux, Firefox) : la version WebM
  const vg = mk(VID + 'galop' + ext, true), vs = mk(VID + 'saut' + ext, false);
  const mg = chroma(vg), ms = chroma(vs);
  const S = 3.3, root = new THREE.Group(), plane = new THREE.Mesh(new THREE.PlaneGeometry(S, S), mg); plane.position.y = S * .5 - S * .07; root.add(plane);
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.6), new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .03; root.add(sh);
  let enSaut = false;
  return { root, shadow:sh, kind:'A', start(){ vg.play().catch(() => {}); }, stop(){ vg.pause(); vs.pause(); },
    update(dt, st){ if(st.v >= .2) vg.playbackRate = Math.max(.6, Math.min(1.2, st.v / VIT.galop)); if(st.v < .2 && !vg.paused) vg.pause(); if(st.v >= .2 && vg.paused && !enSaut) vg.play().catch(() => {}); },
    jump(len){ enSaut = true; plane.material = ms; vs.currentTime = 0; vs.playbackRate = Math.max(1, Math.min(2.2, 1.75 / (len || 1))); vs.play().catch(() => {}); vg.pause(); vs.onended = () => this.land(); },
    land(){ if(!enSaut) return; enSaut = false; plane.material = mg; vg.play().catch(() => {}); },
    airY:true };
}
// B : le cheval 3D des Écuries (même code, importé tel quel)
async function makeEcuries(){
  const [{ makeHorse }, { COAT }] = await Promise.all([import('../ecuries/cheval.js'), import('../ecuries/data.js')]);
  const h = makeHorse(THREE, { id:'cev', n:'Bai', robe:'bai', t:1, s:[3, 3, 3, 3] }, COAT.bai); h.setEquip({ filet:'havane', selle:'havane', tapis:'rouge' }, { rider:true });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3), new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .03;
  const root = new THREE.Group(); root.add(h.root);
  return { root, shadow:sh, kind:'B', start(){}, stop(){}, update(dt, st){ h.update(dt, { gait:st.v < .2 ? 0 : st.v < 2.6 ? 1 : st.v < 5 ? 2 : 3, air:st.air, speedK:st.v < 5 ? st.v / 3.7 : st.v / 7 }); }, jump(){}, land(){} };
}
// C : le modèle TRELLIS.2 (une statue : on la fait galoper en la balançant)
async function makeModele(){
  const { GLTFLoader } = await import('../../lib/three-addons/GLTFLoader.js');
  const g = await new GLTFLoader().loadAsync(BASE + '3d/cheval.glb');
  const m = g.scene; const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const piv = new THREE.Group(), inner = new THREE.Group(); inner.add(m); piv.add(inner);
  const ROT = window.__cevRot != null ? window.__cevRot : CROT;   // le modèle sort de profil : on le tourne pour qu'il regarde vers +Z
  const long = Math.max(size.x, size.z), k = 2.5 / long; m.position.set(-c.x, -box.min.y, -c.z); inner.scale.setScalar(k); inner.rotation.y = ROT;
  m.traverse(o => { if(o.isMesh){ o.castShadow = false; if(o.material){ o.material.side = THREE.FrontSide; } } });
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 3), new THREE.MeshBasicMaterial({ map:shadowTex, transparent:true, depthWrite:false })); sh.rotation.x = -Math.PI / 2; sh.position.y = .03;
  const root = new THREE.Group(); root.add(piv); let ph = 0;
  return { root, shadow:sh, kind:'C', start(){}, stop(){},
    update(dt, st){ ph += dt * (st.v < .2 ? 0 : st.v < 5 ? 5.2 : 6.6); const g3 = st.v >= 5;
      piv.position.y = st.air != null ? 0 : Math.abs(Math.sin(ph)) * (g3 ? .09 : .05);
      piv.rotation.x = st.air != null ? -Math.sin(Math.PI * st.air) * .38 + .1 * st.air : Math.sin(ph * (g3 ? .5 : 1)) * (g3 ? .07 : .03); },
    jump(){}, land(){} };
}
const CROT = Math.PI / 2;

/* ---------------- la partie ---------------- */
let R = null, version = 'A', horse = null, raf = 0, last = 0;
const mmsg = $('msg'); let msgT = 0;
function msg(t, k){ mmsg.textContent = t; mmsg.className = 'on ' + (k || ''); msgT = 1.9; }
function resize(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
function screen(id){ ['menu', 'hud', 'fin'].forEach(s => $(s).classList.toggle('on', s === id)); }

async function partir(v){
  version = v; $('load').classList.add('on'); stop('musique');
  try{
    if(!HORSE[v]) HORSE[v] = v === 'A' ? makeFilm() : v === 'B' ? await makeEcuries() : await makeModele();
  }catch(e){ console.error(e); $('load').classList.remove('on'); msg('Cette version ne démarre pas sur cet appareil', 'bad'); return; }
  $('load').classList.remove('on');
  if(horse){ scene.remove(horse.root); scene.remove(horse.shadow); horse.stop(); }
  horse = HORSE[v]; scene.add(horse.root); scene.add(horse.shadow);
  chutes.splice(0).forEach(c => c.m.parent && c.m.parent.remove(c.m));
  OBS.forEach(o => { o.done = false; o.num.material.opacity = 1; o.zone.visible = false; });
  R = { s:S0, v:0, allure:'galop', t:0, pen:0, bars:0, refus:0, next:0, air:null, airT:0, airLen:1, airH:1.15, go:false, count:3.4, done:false, camP:null, camL:null, jumpedFor:-1 };
  setAllure('galop'); screen('hud'); $('count').hidden = false;
  play('ambiance'); play('hennit', .7); horse.start();
  dit('Prête ? Touche « Saute » quand le bouton devient vert, juste avant chaque obstacle.');
  if(!raf){ last = performance.now(); raf = requestAnimationFrame(loop); }
}
function setAllure(a){ if(!R) return; R.allure = a; $('bGal').classList.toggle('on', a === 'galop'); $('bTrot').classList.toggle('on', a === 'trot'); sabots(); }
function sabots(){ if(!R || !R.go || R.done || R.v < .3 || R.air != null){ stop('galop'); stop('trot'); return; } if(R.allure === 'galop'){ stop('trot'); if(A.galop.paused) play('galop'); } else { stop('galop'); if(A.trot.paused) play('trot'); } }
$('bGal').onclick = () => setAllure('galop'); $('bTrot').onclick = () => setAllure('trot');
function saute(){
  if(!R || !R.go || R.done || R.air != null) return;
  const o = OBS[R.next], d = o ? o.s - R.s : 99;
  if(R.v < 2){ msg('Il faut de l\'élan !', 'bad'); return; }
  R.air = 0; R.airT = 0; const portee = (o && d < 7 ? d : 3.4) + 3.4; R.airLen = portee / R.v; R.jumpD = d; R.jumpedFor = o && d < 7 ? R.next : -1;
  play('saut', 1); horse.jump(R.airLen); sabots();
}
$('saute').addEventListener('pointerdown', e => { e.preventDefault(); saute(); });
addEventListener('keydown', e => { if(e.code === 'Space'){ e.preventDefault(); saute(); } if(e.code === 'ArrowUp') setAllure('galop'); if(e.code === 'ArrowDown') setAllure('trot'); });
$('quit').onclick = () => fin(true);

function passe(o){
  // le cheval arrive sur l'obstacle : a-t-il sauté, et au bon moment ?
  o.done = true; o.num.material.opacity = .35; o.zone.visible = false; R.next++;
  if(R.jumpedFor !== o.i){
    R.refus++; R.pen += 4; play('refus', 1); msg(R.refus >= 3 ? 'Troisième refus : éliminée' : 'Refus ! 4 points', 'bad');
    if(R.refus >= 3){ fin(false, true); return; }
    R.next--; o.done = false; o.num.material.opacity = 1; R.s = o.s - 11; R.v = 0; R.air = null; dit('Refus. On recommence : saute un peu avant la barre.'); return;
  }
  const d = R.jumpD;
  if(d >= ZONE[0] && d <= ZONE[1]){ msg(['Sans faute !', 'Joli saut !', 'Bravo !', 'Superbe !'][Math.floor(Math.random() * 4)], 'good'); }
  else { R.bars++; R.pen += 4; barreTombe(o); setTimeout(() => play('barre', 1), 180); msg(d > ZONE[1] ? 'Un peu tôt : la barre tombe (4 points)' : 'Un peu tard : la barre tombe (4 points)', 'bad'); }
}
function fin(abandon, elim){
  if(!R || R.done) return; R.done = true; stop('galop'); stop('trot');
  if(abandon){ R = null; horse && horse.stop(); stop('ambiance'); screen('menu'); play('musique'); return; }
  const over = Math.max(0, R.t - OPT), tp = Math.ceil(over / 4), tot = R.pen + tp;
  play(elim ? 'refus' : tot === 0 ? 'bravo' : 'hennit', 1); if(!elim && tot === 0) setTimeout(() => play('bravo', 1), 900);
  $('fT').textContent = elim ? 'Éliminée…' : tot === 0 ? 'Sans faute ! 🏆' : tot <= 4 ? 'Très bien ! 🥈' : 'Parcours terminé';
  $('fR').innerHTML = elim ? 'Trois refus : on retente ?' : `Temps : <b>${R.t.toFixed(1).replace('.', ',')} s</b> (accordé : ${OPT} s)<br>Barres : <b>${R.bars}</b> · Refus : <b>${R.refus}</b>${tp ? ` · Dépassement : <b>${tp}</b> pt` : ''}<br>Total : <b>${tot} point${tot > 1 ? 's' : ''}</b>`;
  $('fFav').textContent = fav() === version ? '❤️ C\'est ta préférée' : '❤️ C\'est ma préférée (version ' + version + ')';
  setTimeout(() => { screen('fin'); dit(elim ? 'Trois refus, on retente ?' : tot === 0 ? 'Sans faute ! Bravo !' : 'Parcours terminé.'); }, 1300);
}
$('fAgain').onclick = () => partir(version);
$('fMenu').onclick = () => { R = null; horse && horse.stop(); stop('ambiance'); screen('menu'); majFav(); play('musique'); };
const fav = () => { try{ return localStorage.getItem('cev-prefere') || ''; }catch(e){ return ''; } };
function majFav(){ const f = fav(); document.querySelectorAll('.card').forEach(c => { c.classList.toggle('fav', c.dataset.v === f); c.querySelector('.pref').textContent = c.dataset.v === f ? '❤️ Ta préférée' : ''; }); }
$('fFav').onclick = () => { try{ localStorage.setItem('cev-prefere', version); }catch(e){} $('fFav').textContent = '❤️ C\'est ta préférée'; play('hennit', .8);
  try{ if(window.Famille && Famille.track) {} }catch(e){} };
document.querySelectorAll('.card .go').forEach(b => b.onclick = () => partir(b.closest('.card').dataset.v));
majFav();
// la musique démarre au premier toucher (les navigateurs l'exigent)
addEventListener('pointerdown', function premier(){ removeEventListener('pointerdown', premier); if($('menu').classList.contains('on')) play('musique'); }, { once:true });

function tick(dt){
  if(!R) return;
  if(!R.go){ R.count -= dt; $('count').textContent = Math.max(1, Math.ceil(R.count - .4)); if(R.count <= .4){ R.go = true; $('count').hidden = true; play('cloche', 1); msg('C\'est parti !', 'good'); } }
  if(R.go && !R.done) R.t += dt;
  const cible = !R.go ? 0 : R.done ? 1.6 : VIT[R.allure]; const acc = R.v < cible ? 3.2 : 5; R.v += Math.max(-acc * dt, Math.min(acc * dt, cible - R.v));
  const s0 = R.s; R.s += R.v * dt;
  if(R.air != null){ R.airT += dt; R.air = R.airT / R.airLen; if(R.air >= 1){ R.air = null; horse.land && horse.land(); sabots(); } }
  // l'obstacle suivant
  const o = OBS[R.next];
  if(o && !R.done){ const d = o.s - R.s; o.zone.visible = d < 16 && d > 0; $('saute').classList.toggle('zone', R.air == null && d >= ZONE[0] && d <= ZONE[1]);
    if(s0 < o.s - .4 && R.s >= o.s - .4) passe(o); }
  else $('saute').classList.remove('zone');
  if(!R.done && R.next >= OBS.length && R.s >= SFIN) fin(false);
  if(R.s > LEN - 1){ R.s = LEN - 1; R.v = 0; }
  if(R.go) sabots();
  // le cheval, son ombre, la caméra
  const p = at(R.s), a = heading(R.s), y = R.air != null ? Math.sin(Math.PI * R.air) * R.airH : 0;
  horse.root.position.set(p.x, horse.kind === 'A' ? y * .55 : y, p.z); horse.root.rotation.y = a; horse.shadow.position.set(p.x, .03, p.z); horse.shadow.rotation.z = -a; horse.shadow.scale.setScalar(1 - y * .25);
  horse.update(dt, { v:R.v, air:R.air });
  const fx = Math.sin(a), fz = Math.cos(a), tall = cam.aspect < .9;
  const back = tall ? 7.2 : 6.6, hi = tall ? 3.3 : 2.9;
  const P = new THREE.Vector3(p.x - fx * back, hi + y * .35, p.z - fz * back), L = new THREE.Vector3(p.x + fx * 6, 1.25 + y * .4, p.z + fz * 6);
  if(!R.camP){ R.camP = P.clone(); R.camL = L.clone(); } const k = Math.min(1, dt * 4); R.camP.lerp(P, k); R.camL.lerp(L, k); cam.position.copy(R.camP); cam.lookAt(R.camL);
  if(horse.kind === 'A') horse.root.children[0].lookAt(cam.position.x, horse.root.position.y + 1.4, cam.position.z);
  // le HUD
  $('hObs').textContent = Math.min(R.next + 1, OBS.length) + ' / ' + OBS.length; $('hTime').textContent = R.t.toFixed(1).replace('.', ',') + ' s'; $('hPen').textContent = R.pen + ' pt';
}
function loop(t){
  raf = requestAnimationFrame(loop); const dt = Math.min(.05, (t - last) / 1000 || .016); last = t;
  tick(dt);
  chutes.forEach(c => { if(c.m.position.y > .06){ c.vy -= 9.8 * dt; c.m.position.y = Math.max(.06, c.m.position.y + c.vy * dt); c.m.position.z += dt * 1.4; c.m.rotation.y += c.rz * dt; } });
  if(msgT > 0){ msgT -= dt; if(msgT <= 0) mmsg.classList.remove('on'); }
  if(!R){ const tt = t / 1000; cam.position.set(Math.sin(tt * .05) * 30, 9, Math.cos(tt * .05) * 30); cam.lookAt(0, 1, 0); }
  renderer.render(scene, cam);
}
last = performance.now(); raf = requestAnimationFrame(loop);
// pour les tests : avance(sec) fait tourner le jeu sans attendre l'affichage, robot(true) saute au milieu de chaque zone d'appel
const avance = (sec, robot) => { for(let t = 0; t < sec; t += 1 / 60){ if(robot && R && R.go && R.air == null){ const o = OBS[R.next]; if(o){ const d = o.s - R.s; if(d < 3.6 && d > 3.4) saute(); } } tick(1 / 60); } };
window.__cev = { get R(){ return R; }, partir, saute, OBS, LEN, at, setAllure, cam, scene, avance, fin };
