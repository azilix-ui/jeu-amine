/* Koora : la 3D (Three.js du site), les commandes, les menus, la sauvegarde et les records.
   Les règles et les niveaux sont dans regles.js. */
import * as THREE from '../../lib/three-0.170.0.module.min.js';
import { niveau, fusion, porte, couleur, rayon, casseMurs, etoiles, score, voieX, NIVEAUX } from './regles.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const IMG = new URL('./img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href, CORPS = new URL('../medina/', import.meta.url).href;
const VOIX = new URL('../../amine/nombres/voix/', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const FAMILLE = ['essil', 'salma', 'amine', 'anis', 'imen', 'nour', 'yasmine', 'fares'];
const TAILLE = { amine:.78, salma:.88, essil:.95, nour:.9, yasmine:.9, anis:1.06, imen:1.03, fares:1.02 };

/* ---------- les ballons (boutique) ---------- */
export const BALLONS = [
  { id:'foot', n:'Ballon de foot', prix:0 }, { id:'orange', n:'Orange', prix:60 }, { id:'citron', n:'Citron', prix:90 },
  { id:'laine', n:'Pelote de laine', prix:150 }, { id:'acier', n:'Boule de pétanque', prix:250 }, { id:'or', n:'Ballon en or', prix:500 } ];

/* ---------- les sons : bruitages ElevenLabs (son.php), voix des nombres de la Planète des Nombres, sinon le navigateur ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function ton(f, d, type = 'sine', v = .12, f2 = 0, t0 = 0){ const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const BRUIT = {}, SON_URL = new URL('./son.php', import.meta.url).href, ZSON = new URL('../zarbia/son.php', import.meta.url).href;
async function charge(url, k){ const a = ac(); if(!a) return; try{ const b = await fetch(url).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }); BRUIT[k] = await new Promise((ok, ko) => a.decodeAudioData(b, ok, ko)); }catch(e){} }
function chargeListe(base, noms){ fetch(base + '?liste=1').then(r => r.json()).then(l => { const par = {}; l.forEach(n => { const k = n.slice(0, -1); (par[k] = par[k] || []).push(n); });
  for(const k of Object.keys(par)) if(!noms || noms.includes(k)) charge(base + '?n=' + par[k][Math.floor(Math.random() * par[k].length)], k); }).catch(() => {}); }
chargeListe(SON_URL); chargeListe(ZSON, ['victoire', 'tap']);
const MAXD = { fusion:.9, plus:1.4, moins:1.4, rebond:1.2, casse:2.2, chute:2, perdu:2.6, coup:.8, tap:.4 };
function bruit(k, v = .8){ const a = ac(), b = BRUIT[k]; if(!a || !b) return false; const s = a.createBufferSource(), g = a.createGain(), t = a.currentTime, m = Math.min(b.duration, MAXD[k] || 9);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0, m - .3)); g.gain.linearRampToValueAtTime(0, t + m); s.buffer = b; s.connect(g); g.connect(a.destination); s.start(t); s.stop(t + m + .05); return true; }
const SON = {
  fusion(){ if(!bruit('fusion', .7)) ton(520, .12, 'triangle', .1, 880); },
  plus(){ if(!bruit('plus', .7)) [660, 880].forEach((f, i) => ton(f, .15, 'triangle', .1, 0, i * .08)); },
  moins(){ if(!bruit('moins', .7)) ton(400, .3, 'triangle', .1, 200); },
  rebond(){ if(!bruit('rebond', .8)) ton(300, .2, 'square', .06, 150); },
  casse(){ if(!bruit('casse', .9)){ ton(90, .4, 'sawtooth', .12, 40); } },
  chute(){ if(!bruit('chute', .8)) ton(500, .8, 'sine', .1, 80); },
  perdu(){ if(!bruit('perdu', .8)) { ton(440, .25, 'triangle', .12, 220); ton(330, .4, 'triangle', .1, 160, .2); } },
  victoire(){ if(!bruit('victoire', .8)) [523, 659, 784, 1047].forEach((f, i) => ton(f, .3, 'triangle', .12, 0, i * .1)); },
  coup(){ if(!bruit('coup', .8)) ton(180, .1, 'square', .1, 90); },
  tap(){ if(!bruit('tap', .5)) ton(660, .06, 'sine', .08); },
};
// la voix des nombres (0 à 60) : on la garde pour le mode Tranquille
const voix = {}; let voixT = 0;
function dis(n){ if(n > 60 || n < 0 || !Number.isInteger(n)) return; const now = performance.now(); if(now - voixT < 450) return; voixT = now;
  const a = voix[n] || (voix[n] = new Audio(VOIX + n + '.mp3')); try{ a.currentTime = 0; a.play().catch(() => {}); }catch(e){} }

/* ---------- la sauvegarde ---------- */
let joueur = null, sv = null, mode = 'champion';
const cle = () => 'koora:' + joueur;
const neuf = () => ({ niv:{ tranquille:1, champion:1 }, etoiles:{ tranquille:{}, champion:{} }, pieces:0, ballons:['foot'], ballon:'foot', best:{ tranquille:0, champion:0 }, parties:0, t:0 });
function valide(d){ const n = neuf(); if(!d || typeof d !== 'object') return n; const o = Object.assign(n, d);
  for(const m of ['tranquille', 'champion']){ o.niv[m] = Math.max(1, Math.min(NIVEAUX, +o.niv[m] || 1)); if(typeof o.etoiles[m] !== 'object' || !o.etoiles[m]) o.etoiles[m] = {}; }
  if(!Array.isArray(o.ballons) || !o.ballons.includes('foot')) o.ballons = ['foot']; if(!o.ballons.includes(o.ballon)) o.ballon = 'foot'; o.pieces = Math.max(0, +o.pieces || 0); return o; }
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
async function setJoueur(n){
  joueur = n; sv = valide(store.get(cle(), null));
  mode = store.get('koora-mode', null) || (n.toLowerCase() === 'amine' ? 'tranquille' : 'champion');
  if(window.Famille && Famille.track){ Famille.track('koora', n, [cle()]); try{ const r = await Famille.load('koora', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = valide(d); store.set(cle(), sv); } }catch(e){} }
  chargeCorps(); menu();
}
async function choisir(){
  if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue au ballon ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n;
}
const tete = n => { const k = String(n || '').toLowerCase(); if(['essil', 'salma', 'amine'].includes(k)) return AV + 'qui/' + k + '.webp'; if(['anis', 'imen'].includes(k)) return AV + k + '.webp'; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h ? h.img : null; };

/* ---------- le menu ---------- */
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }
function menu(){
  document.body.classList.remove('jeu'); montre('menu'); $('modal').classList.remove('on');
  const t = joueur ? tete(joueur) : null;
  $('who').innerHTML = joueur ? (t ? `<img src="${t}" alt="">` : '🙂') + esc(joueur) : 'Qui joue ?';
  $('pieces').textContent = '🪙 ' + (sv ? sv.pieces : 0);
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  const ouvert = sv ? sv.niv[mode] : 1, et = sv ? sv.etoiles[mode] : {};
  const total = Object.values(et).reduce((a, b) => a + b, 0);
  $('nivTitre').textContent = `Les niveaux · ⭐ ${total} / ${NIVEAUX * 3}`;
  $('niveaux').innerHTML = Array.from({ length:NIVEAUX }, (_, i) => { const n = i + 1, e = et[n] || 0;
    return `<button class="niv ${n > ouvert ? 'ferme' : n === ouvert && !e ? 'suivant' : ''}" data-n="${n}">${n > ouvert ? '🔒' : n}<small>${n <= ouvert ? '★'.repeat(e) : ''}</small></button>`; }).join('');
  $('boutique').innerHTML = BALLONS.map(b => { const a = sv && sv.ballons.includes(b.id), on = sv && sv.ballon === b.id;
    return `<button class="skin ${on ? 'on' : ''}" data-b="${b.id}"><i style="background-image:url(${apercuBallon(b.id)})"></i>${b.n}<small>${on ? '✔ mon ballon' : a ? 'choisir' : '🪙 ' + b.prix}</small></button>`; }).join('');
  records();
}
const fmt = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
async function records(){
  for(const [m, el] of [['champion', 'recC'], ['tranquille', 'recT']]){
    const rows = window.Famille ? await Famille.highscores('koora', m, 8).catch(() => null) : null;
    $(el).innerHTML = rows && rows.length ? rows.map(r => `<li>${esc(r.player)} — <b>${fmt(r.score)}</b></li>`).join('') : '<p class="none">Personne encore : à toi !</p>';
  }
}

/* ---------- la scène 3D ---------- */
const cv = $('cv');
const R3 = new THREE.WebGLRenderer({ canvas:cv, antialias:true }); R3.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R3.outputColorSpace = THREE.SRGBColorSpace;
R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color('#bfe0ff'); scene.fog = new THREE.Fog('#d9ecff', 40, 95);
const cam = new THREE.PerspectiveCamera(55, 1, .1, 200);
scene.add(new THREE.HemisphereLight('#ffffff', '#c8b79a', 1.15));
const sun = new THREE.DirectionalLight('#fff4dc', 1.6); sun.position.set(-6, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left:-12, right:12, top:14, bottom:-14, near:1, far:50 }); scene.add(sun, sun.target);
function taille(){ const w = innerWidth, h = innerHeight; R3.setSize(w, h, false); cam.aspect = w / h; cam.fov = w < h ? 68 : 55; cam.updateProjectionMatrix(); }
addEventListener('resize', taille); taille();

const TL = new THREE.TextureLoader();
const tex = (f, rep) => { const t = TL.load(IMG + f); t.colorSpace = THREE.SRGBColorSpace; if(rep){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } t.anisotropy = 4; return t; };
const TX = { sol:tex('sol.webp'), facade:tex('facade.webp'), facade2:tex('facade2.webp'), fond:tex('fond.webp'), bab:tex('bab.webp'), charrette:tex('charrette.webp'), chat:tex('chat.webp'), caisses:tex('caisses.webp') };
TX.sol.wrapS = TX.sol.wrapT = THREE.RepeatWrapping;

/* le ballon du joueur : une texture dessinée (foot) ou une matière ComfyUI */
const peaux = {};
function peauFoot(){ const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#f4f4f4'; x.fillRect(0, 0, 512, 256);
  x.fillStyle = '#1d1d1d'; for(let j = 0; j < 4; j++) for(let i = 0; i < 8; i++){ const cx = i * 64 + (j % 2) * 32 + 16, cy = j * 64 + 32; x.beginPath(); for(let k = 0; k < 5; k++){ const a = k * 1.2566 - 1.57; x.lineTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15 * (j === 0 || j === 3 ? .6 : 1)); } x.fill(); }
  x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; for(let i = 0; i < 16; i++){ x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32 + 16, 256); x.stroke(); } return c; }
function peau(id){ if(peaux[id]) return peaux[id]; let t; if(id === 'foot'){ t = new THREE.CanvasTexture(peauFoot()); } else { t = TL.load(IMG + 'p-' + id + '.webp'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); }
  t.colorSpace = THREE.SRGBColorSpace; return peaux[id] = t; }
function apercuBallon(id){ return id === 'foot' ? peauFoot().toDataURL('image/png') : IMG + 'p-' + id + '.webp'; }

/* les nombres : une texture par valeur (chiffres + points pour les petits nombres en Tranquille) */
const texNb = new Map();
function texteNb(txt, fond, points){ const k = txt + fond + (points || ''); if(texNb.has(k)) return texNb.get(k);
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = fond; x.beginPath(); x.arc(128, 128, 120, 0, 6.29); x.fill(); x.lineWidth = 10; x.strokeStyle = 'rgba(255,255,255,.95)'; x.stroke();
  const f = txt.length <= 2 ? 150 : txt.length === 3 ? 112 : txt.length === 4 ? 86 : 70;
  x.font = `800 ${f}px 'Baloo 2', Nunito, Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,.35)';
  x.strokeText(txt, 128, points ? 112 : 136); x.fillText(txt, 128, points ? 112 : 136);
  if(points){ x.fillStyle = '#fff'; for(let i = 0; i < points; i++){ const row = Math.floor(i / 5), col = i % 5, n = Math.min(5, points - row * 5); x.beginPath(); x.arc(128 + (col - (n - 1) / 2) * 26, 196 + row * 24, 9, 0, 6.29); x.fill(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if(texNb.size > 400) texNb.clear(); texNb.set(k, t); return t; }
const SPH = new THREE.SphereGeometry(1, 32, 20), matNb = new Map();
const mNb = col => matNb.get(col) || (matNb.set(col, new THREE.MeshStandardMaterial({ color:col, roughness:.32, metalness:.05 })), matNb.get(col));

/* les corps « en vrai » de Médina Express (vus de dos, en maillot de foot) : cases 0-11 = la foulée */
const corpsTex = {};
function chargeCorps(){ const id = String(joueur || '').toLowerCase(); if(!FAMILLE.includes(id) || corpsTex[id]) return;
  const t = TL.load(CORPS + 'corps-' + id + '-foot.webp?v=3'); t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / 6, 1 / 4); corpsTex[id] = t; }

/* ---------- la partie ---------- */
let G = null;
const monde = new THREE.Group(); scene.add(monde);
function vide(g){ while(g.children.length){ const o = g.children.pop(); o.traverse(m => { if(m.geometry && m.geometry !== SPH && m.geometry !== PL) m.geometry.dispose(); }); } }
const PL = new THREE.PlaneGeometry(1, 1);
function plan(t, w, h, opts = {}){ const m = new THREE.Mesh(PL, new THREE.MeshLambertMaterial({ map:t, transparent:!!opts.alpha, alphaTest:opts.alpha ? .4 : 0, side:opts.double ? THREE.DoubleSide : THREE.FrontSide })); m.scale.set(w, h, 1); return m; }

function construit(n, md){
  vide(monde); const L = niveau(n, md), lg = L.longueur + 60;
  // la rue : sol, trottoirs, murs des maisons, le bout de la rue
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(14, lg), new THREE.MeshLambertMaterial({ map:TX.sol })); sol.rotation.x = -Math.PI / 2; sol.position.set(0, 0, -lg / 2 + 12); sol.receiveShadow = true;
  TX.sol.repeat.set(14 / 3.5, lg / 3.5); monde.add(sol);
  for(const s of [-1, 1]){ const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .18, lg), new THREE.MeshLambertMaterial({ color:'#e9e1cf' })); b.position.set(s * 5.12, .09, -lg / 2 + 12); monde.add(b); }
  const HM = 8.5, W = HM * 1280 / 533;   // les murs des maisons, assez hauts pour cacher le ciel vide en portrait
  for(let z = 12, k = 0; z > -lg; z -= W, k++) for(const s of [-1, 1]){
    const m = plan((k + (s > 0 ? 1 : 0)) % 2 ? TX.facade2 : TX.facade, W, HM); m.position.set(s * 7, HM / 2, z - W / 2); m.rotation.y = -s * Math.PI / 2; monde.add(m); }
  const fond = plan(TX.fond, 28, 14); fond.material.fog = false; fond.position.set(0, 6, -lg + 10); monde.add(fond);
  // les objets
  const objs = [];
  for(const r of L.rangs){
    if(r.portes){ for(const p of r.portes){ const col = p.op === '+' ? '#1f9e4b' : p.op === '-' ? '#d63b3b' : '#1f5fbf';
        const g = new THREE.Group(); g.position.set(p.cote * 2.6, 0, -r.z);
        const vitre = new THREE.Mesh(PL, new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false })); vitre.scale.set(4.6, 2.6, 1); vitre.position.y = 1.4; g.add(vitre);
        const txt = new THREE.Mesh(PL, new THREE.MeshBasicMaterial({ map:texteNb((p.op === 'x' ? '×' : p.op === '-' ? '−' : '+') + p.a, col), transparent:true, depthWrite:false })); txt.scale.set(1.9, 1.9, 1); txt.position.set(0, 1.5, .02); g.add(txt);
        for(const sx of [-2.35, 2.35]){ const po = new THREE.Mesh(new THREE.BoxGeometry(.22, 3, .22), new THREE.MeshLambertMaterial({ color:'#f3efe6' })); po.position.set(sx, 1.5, 0); po.castShadow = true; g.add(po); }
        const linteau = new THREE.Mesh(new THREE.BoxGeometry(4.9, .25, .25), new THREE.MeshLambertMaterial({ color:'#f3efe6' })); linteau.position.y = 2.95; g.add(linteau);
        monde.add(g); objs.push({ t:'porte', z:r.z, cote:p.cote, op:p.op, a:p.a, o:g, fait:false }); }
      continue; }
    r.cases.forEach((c, i) => { if(!c) return; const x = voieX(i);
      if(c.t === 'nb'){ const rad = rayon(c.v), g = new THREE.Group(); g.position.set(x, rad, -r.z);
        const b = new THREE.Mesh(SPH, mNb(couleur(c.v))); b.scale.setScalar(rad); b.castShadow = true; g.add(b);
        const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map:texteNb(String(c.v), couleur(c.v), md === 'tranquille' && c.v <= 10 ? c.v : 0), depthTest:false })); lab.scale.setScalar(rad * 1.5); lab.position.y = rad * .15; lab.renderOrder = 5; g.add(lab);
        monde.add(g); objs.push({ t:'nb', v:c.v, x, z:r.z, r:rad, o:g, fait:false }); }
      else if(c.o === 'trou'){ const m = new THREE.Mesh(new THREE.CircleGeometry(.95, 28), new THREE.MeshBasicMaterial({ color:'#1a1410' })); m.rotation.x = -Math.PI / 2; m.position.set(x, .02, -r.z); monde.add(m);
        const bord = new THREE.Mesh(new THREE.RingGeometry(.95, 1.12, 28), new THREE.MeshLambertMaterial({ color:'#6b6255' })); bord.rotation.x = -Math.PI / 2; bord.position.set(x, .025, -r.z); monde.add(bord);
        objs.push({ t:'trou', x, z:r.z, r:.8, fait:false }); }
      else { const w = c.o === 'charrette' ? 2.8 : c.o === 'chat' ? 1.5 : 1.9, h = c.o === 'charrette' ? 1.75 : c.o === 'chat' ? .87 : 1.4;
        const m = plan(TX[c.o], w, h, { alpha:true }); m.position.set(x, h / 2, -r.z); m.castShadow = true; monde.add(m);
        objs.push({ t:'obst', o:m, sorte:c.o, x, x0:x, z:r.z, w:w * .42, fait:false, ph:Math.random() * 6 }); } });
  }
  // les bab
  const murs = L.murs.map((res, i) => { const z = L.longueur + 6 + i * 7, g = new THREE.Group(); g.position.set(0, 0, -z);
    const bab = plan(TX.bab, 10.4, 10.4 * 1, { alpha:true }); bab.position.y = 5; g.add(bab);
    const lab = new THREE.Mesh(PL, new THREE.MeshBasicMaterial({ map:texteNb(fmt(res), '#7a4b1c'), transparent:true })); lab.scale.set(2.4, 2.4, 1); lab.position.set(0, 7.6, .05); g.add(lab);
    monde.add(g); return { z, res, o:g, casse:false }; });
  return { L, objs, murs };
}
const fx = [];
function debris(x, y, z, col, n = 14, f = 6){ for(let i = 0; i < n; i++){ const m = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .3), new THREE.MeshLambertMaterial({ color:col })); m.position.set(x, y, z);
  fx.push({ m, v:new THREE.Vector3((Math.random() - .5) * f, Math.random() * f + 2, (Math.random() - .3) * f), t:0 }); scene.add(m); } }

const balle = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ roughness:.45 })); balle.castShadow = true; scene.add(balle);
const anneau = new THREE.Mesh(new THREE.RingGeometry(.9, 1.05, 40), new THREE.MeshBasicMaterial({ color:'#fff', transparent:true, opacity:.75 })); anneau.rotation.x = -Math.PI / 2; scene.add(anneau);
const etiq = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest:false })); etiq.renderOrder = 6; scene.add(etiq);
const enfant = new THREE.Sprite(new THREE.SpriteMaterial({ transparent:true, alphaTest:.05 })); enfant.center.set(.5, 0); scene.add(enfant);

function partie(n){
  ac(); const md = mode; $('modal').classList.remove('on');
  const C = construit(n, md);
  G = { n, mode:md, L:C.L, objs:C.objs, murs:C.murs, z:0, x:0, cible:0, v:C.L.depart, vit:0, etat:'pret', t:0, rot:0, choc:0, shake:0, mursCasses:0, vAvant:0, pause:false, chute:0, freine:0 };
  balle.material.map = peau(sv ? sv.ballon : 'foot'); balle.material.color.set('#ffffff'); balle.material.needsUpdate = true;
  const id = String(joueur || '').toLowerCase(); enfant.visible = !!corpsTex[id]; if(enfant.visible){ enfant.material.map = corpsTex[id]; enfant.material.needsUpdate = true; const k = TAILLE[id] || 1; enfant.scale.set(1.6 * k, 2.62 * k, 1); }
  majValeur(); $('nivHud').textContent = 'Niveau ' + n; $('prog').firstChild.style.width = '0';
  montre('-'); document.body.classList.add('jeu'); $('aide').style.opacity = 1; $('aide').textContent = 'Glisse le doigt pour diriger ton ballon ⚽ · touche pour commencer';
  placeCam(1);
}
function majValeur(){ $('valeur').textContent = fmt(G.v); $('valeur').style.color = couleur(G.v);
  const r = rayon(G.v); balle.scale.setScalar(r * (1 + G.choc * .25)); etiq.material.map = texteNb(fmt(G.v), couleur(G.v)); etiq.material.needsUpdate = true; etiq.scale.setScalar(.95 + r * .6); anneau.material.color.set(couleur(G.v)); anneau.scale.setScalar(r * 1.15); }
function calc(txt, bad){ const c = $('calc'); c.textContent = txt; c.classList.toggle('bad', !!bad); c.classList.add('on'); clearTimeout(calc.t); calc.t = setTimeout(() => c.classList.remove('on'), 1300); }
function placeCam(k){ const r = rayon(G.v); const tx = G.x * .45, ty = 5.2 + r * 1.6, tz = -G.z + 8.6 + r * 1.5;
  cam.position.x += (tx - cam.position.x) * k; cam.position.y += (ty - cam.position.y) * k; cam.position.z += (tz - cam.position.z) * k;
  if(G.shake > 0){ cam.position.x += (Math.random() - .5) * G.shake; cam.position.y += (Math.random() - .5) * G.shake; }
  cam.lookAt(G.x * .3, .8, -G.z - 7); sun.position.set(-6 + G.x, 14, -G.z + 6); sun.target.position.set(G.x, 0, -G.z - 4); }

/* une image de simulation (pas fixe) */
const DT = 1 / 60;
function pas(){
  const L = G.L;
  if(G.etat === 'course'){
    G.vit += (L.vitesse * (G.freine > 0 ? .55 : 1) - G.vit) * Math.min(1, DT * 3); G.freine -= DT;
    // le côté : le ballon va vers la cible (au plus 14 m/s)
    if(dirClavier) G.cible += dirClavier * 11 * DT;
    const lim = 4.6 - rayon(G.v) * .4; G.cible = Math.max(-lim, Math.min(lim, G.cible));
    const dx = G.cible - G.x; G.x += Math.sign(dx) * Math.min(Math.abs(dx), 14 * DT);
    const z0 = G.z; G.z += G.vit * DT; G.rot += G.vit * DT / rayon(G.v);
    // les objets
    const rb = rayon(G.v);
    for(const o of G.objs){ if(o.fait) continue; if(o.z > G.z + 3) break;
      if(o.t === 'obst' && (o.sorte === 'charrette' || o.sorte === 'chat')){ const amp = o.sorte === 'chat' ? 3.6 : 1.6, sp = o.sorte === 'chat' ? .5 : .7; o.x = Math.max(-4.2, Math.min(4.2, o.x0 + Math.sin(G.t * sp + o.ph) * amp)); o.o.position.x = o.x; if(o.sorte === 'chat') o.o.scale.x = Math.cos(G.t * sp + o.ph) > 0 ? 1.5 : -1.5; }
      if(!(o.z <= G.z + rb * .6 && o.z > z0 - .6)) continue;   // on regarde seulement les objets que le ballon traverse à ce pas
      if(o.t === 'porte'){ if((G.x < 0 ? -1 : 1) !== o.cote) continue; o.fait = true; const av = G.v; G.v = porte(G.v, o.op, o.a);
        calc(`${fmt(av)} ${o.op === 'x' ? '×' : o.op === '-' ? '−' : '+'} ${o.a} = ${fmt(G.v)}`, o.op === '-'); (o.op === '-' ? SON.moins : SON.plus)(); G.choc = 1; majValeur(); if(G.mode === 'tranquille') dis(G.v); continue; }
      if(o.t === 'nb'){ if(Math.abs(o.x - G.x) > o.r + rb * .85) continue;
        const f = fusion(G.v, o.v);
        if(f != null){ o.fait = true; o.o.visible = false; calc(`${fmt(G.v)} + ${fmt(o.v)} = ${fmt(f)}`); G.v = f; G.choc = 1; SON.fusion(); debris(o.x, o.r, -o.z, couleur(o.v), 8, 4); majValeur(); if(G.mode === 'tranquille') dis(G.v); }
        else if(G.mode === 'tranquille'){ o.fait = true; o.o.visible = false; SON.rebond(); calc(`${fmt(o.v)} est plus grand que ${fmt(G.v)} !`, true); G.cible = G.x + (G.x > o.x ? 1.8 : -1.8); G.freine = .6; debris(o.x, o.r, -o.z, couleur(o.v), 6, 3); }
        else { o.fait = true; fin('nombre', o.v); return; }
        continue; }
      if(o.t === 'trou'){ if(Math.abs(o.x - G.x) > .75) continue; o.fait = true; if(G.mode === 'tranquille'){ G.cible = G.x + 1.5; continue; } G.chute = .001; G.etat = 'chute'; SON.chute(); return; }
      if(o.t === 'obst'){ if(Math.abs(o.x - G.x) > o.w + rb * .7) continue; o.fait = true; SON.rebond();
        if(G.mode === 'champion' && G.v > 1){ const av = G.v; G.v = Math.max(1, Math.ceil(G.v / 2)); calc(`Aïe ! ${fmt(av)} ÷ 2 = ${fmt(G.v)}`, true); majValeur(); }
        else calc('Oups !', true);
        G.cible = G.x + (G.x >= o.x ? 2 : -2); G.freine = .8; continue; }
    }
    $('prog').firstChild.style.width = Math.min(100, G.z / L.longueur * 100) + '%';
    // les bab
    if(G.z > L.longueur){ if(!G.vAvant) G.vAvant = G.v;
      const m = G.murs.find(m => !m.casse); if(!m){ G.etat = 'fini'; setTimeout(() => fin('gagne'), 600); return; }
      if(G.z + rb >= m.z - .3){ if(G.v >= m.res){ m.casse = true; const av = G.v; G.v -= m.res; G.mursCasses++; calc(`${fmt(av)} − ${fmt(m.res)} = ${fmt(G.v)}`); SON.casse(); G.shake = .5;
          m.o.visible = false; debris(0, 3, -m.z, '#c9a46a', 26, 9); debris(0, 6, -m.z, '#8a5a2b', 10, 7); majValeur(); if(G.mode === 'tranquille') dis(G.v);
          if(G.v <= 0){ G.v = 0; G.etat = 'fini'; setTimeout(() => fin('gagne'), 900); } }
        else { G.z = m.z - rb - .3; G.etat = 'fini'; G.vit = 0; calc(`${fmt(G.v)} < ${fmt(m.res)} : le bab tient bon !`, true); setTimeout(() => fin('gagne'), 1300); } } }
  }
  else if(G.etat === 'chute'){ G.chute += DT; G.vit *= .9; G.z += G.vit * DT; if(G.chute > 1.1){ fin('trou'); return; } }
  G.t += DT; G.choc = Math.max(0, G.choc - DT * 3); G.shake = Math.max(0, G.shake - DT * 1.5);
}
function dessine(dt){
  if(!G) return;
  // 22/11 : le ballon et la caméra sont dessinés entre deux pas (écrans à plus de 60 Hz : plus d'à-coups) ; on remet les vraies valeurs à la fin
  const vx = G.x, vz = G.z, al = Math.min(1, acc / DT);
  if(G.ox !== undefined && Math.abs(G.z - G.oz) < 3 && Math.abs(G.x - G.ox) < 3){ G.x = G.ox + (vx - G.ox) * al; G.z = G.oz + (vz - G.oz) * al; }
  try { dessine0(dt); } finally { G.x = vx; G.z = vz; }
}
function dessine0(dt){
  const r = rayon(G.v), y = G.etat === 'chute' ? r - G.chute * G.chute * 6 : r;
  balle.position.set(G.x, y, -G.z); balle.rotation.set(-G.rot, 0, 0); balle.scale.setScalar(r * (1 + G.choc * .25));
  anneau.position.set(G.x, .03, -G.z); anneau.visible = G.etat !== 'chute';
  etiq.position.set(G.x, y + r + .55 + r * .25, -G.z);
  if(enfant.visible){ enfant.position.set(G.x + r * .9 + .45, 0, -G.z + r * .4 + .5); const k = G.etat === 'course' ? Math.floor(G.z * 1.6) % 12 : 0; enfant.material.map.offset.set((k % 6) / 6, 1 - (Math.floor(k / 6) + 1) / 4); }
  placeCam(Math.min(1, dt * 5));
  for(let i = fx.length - 1; i >= 0; i--){ const f = fx[i]; f.t += dt; f.v.y -= 18 * dt; f.m.position.addScaledVector(f.v, dt); f.m.rotation.x += dt * 5; if(f.m.position.y < .15){ f.m.position.y = .15; f.v.multiplyScalar(.5); } if(f.t > 2.2){ scene.remove(f.m); f.m.geometry.dispose(); fx.splice(i, 1); } }
  R3.render(scene, cam);
}
let last = performance.now(), acc = 0;
function boucle(t){ requestAnimationFrame(boucle); const dt = Math.min(.1, (t - last) / 1000); last = t;
  if(G && !G.pause){ acc += dt; while(acc >= DT){ acc -= DT; if(G && (G.etat === 'course' || G.etat === 'chute')){ G.ox = G.x; G.oz = G.z; pas(); } } }
  dessine(dt); }
requestAnimationFrame(boucle);

/* ---------- la fin d'un niveau ---------- */
async function fin(pourquoi, nb){
  if(!G || G.etat === 'fin') return; const g = G; g.etat = 'fin';
  const perdu = pourquoi !== 'gagne', k = g.mursCasses, e = perdu ? 0 : etoiles(k, g.L.murs), sc = perdu ? 0 : score(g.vAvant || g.v, k);
  let gain = 0, record = false, rang = null;
  if(perdu) SON.perdu(); else if(e > 0) SON.victoire(); else SON.perdu();
  if(joueur && !perdu){ sv.parties++; gain = k * 5 + e * 5; sv.pieces += gain; const old = sv.etoiles[g.mode][g.n] || 0; if(e > old) sv.etoiles[g.mode][g.n] = e;
    if(e > 0 && g.n === sv.niv[g.mode] && g.n < NIVEAUX) sv.niv[g.mode] = g.n + 1;
    if(sc > (sv.best[g.mode] || 0)){ sv.best[g.mode] = sc; record = true; } sauve();
    if(window.Famille && sc > 0){ try{ const r = await Famille.score('koora', g.mode, sc, joueur); rang = r && r.rank; }catch(e){} } }
  const txt = pourquoi === 'nombre' ? `Le ${fmt(nb)} est plus grand que ${fmt(g.v)} : il a arrêté ton ballon !` : pourquoi === 'trou' ? 'Ton ballon est tombé dans un trou !' : k === 0 ? `Il fallait au moins ${fmt(g.L.murs[0])} pour casser le premier bab.` : k === g.L.murs.length ? 'Tous les bab sont cassés, bravo !' : `${k} bab cassé${k > 1 ? 's' : ''} sur ${g.L.murs.length}.`;
  const st = [1, 2, 3].map(i => `<span class="${i <= e ? '' : 'off'}">⭐</span>`).join('');
  $('modal').innerHTML = `<div class="carte"><h2>${perdu ? 'Oh non !' : e ? 'Niveau ' + g.n + ' réussi !' : 'Presque !'}</h2>${perdu ? '<div style="font-size:60px">⚽</div>' : `<div class="etoiles">${st}</div>`}<p style="margin:4px 0">${esc(txt)}</p>
    ${perdu ? '' : `<div class="res"><span>Ton nombre au bout de la rue</span><b>${fmt(g.vAvant || g.v)}</b><span>Bab cassés</span><b>${k} / ${g.L.murs.length}</b><span>Score</span><b>${fmt(sc)}</b><span>Pièces gagnées</span><b>🪙 ${gain}</b>${rang ? `<span>Classement</span><b>${rang}<sup>${rang === 1 ? 'er' : 'e'}</sup></b>` : ''}</div>${record ? '<p style="margin:0;font-weight:800;color:#1f9e4b">⭐ Nouveau record !</p>' : ''}`}
    <div class="rang"><button class="pill" id="mRe">🔁 Recommencer</button>${!perdu && e > 0 && g.n < NIVEAUX ? '<button class="pill go" id="mNext">▶ Niveau suivant</button>' : ''}<button class="pill" id="mMenu">🏠 Menu</button></div></div>`;
  $('modal').classList.add('on');
  $('mRe').onclick = () => partie(g.n); if($('mNext')) $('mNext').onclick = () => partie(g.n + 1); $('mMenu').onclick = () => { G = null; vide(monde); menu(); };
}

/* ---------- les commandes ---------- */
let dirClavier = 0, glisse = null; const touches = new Set();
const majClavier = () => { dirClavier = (touches.has('right') ? 1 : 0) - (touches.has('left') ? 1 : 0); };
addEventListener('keydown', e => { if(!G) return; const k = e.key.toLowerCase();
  if(k === 'escape' || k === 'p'){ pause(); return; }
  if(['arrowleft', 'a', 'q'].includes(k)){ touches.add('left'); demarre(); } else if(['arrowright', 'd'].includes(k)){ touches.add('right'); demarre(); } else if(k === ' ' || k === 'enter') demarre(); else return;
  majClavier(); e.preventDefault(); });
addEventListener('keyup', e => { const k = e.key.toLowerCase(); if(['arrowleft', 'a', 'q'].includes(k)) touches.delete('left'); if(['arrowright', 'd'].includes(k)) touches.delete('right'); majClavier(); });
cv.addEventListener('pointerdown', e => { ac(); if(!G) return; demarre(); glisse = { id:e.pointerId, x0:e.clientX, c0:G.cible }; });
addEventListener('pointermove', e => { if(!G || !glisse || e.pointerId !== glisse.id) return; G.cible = glisse.c0 + (e.clientX - glisse.x0) * 12 / Math.min(innerWidth, 900); });
const lache = e => { if(glisse && e.pointerId === glisse.id) glisse = null; };
addEventListener('pointerup', lache); addEventListener('pointercancel', lache);
function demarre(){ if(G && G.etat === 'pret'){ G.etat = 'course'; SON.coup(); setTimeout(() => { $('aide').style.opacity = 0; }, 2500); } }
function pause(){ if(!G || G.etat === 'fin') return; G.pause = !G.pause;
  if(G.pause){ $('modal').innerHTML = `<div class="carte"><h2>⏸ Pause</h2><p>Niveau ${G.n} · ton nombre : <b>${fmt(G.v)}</b></p><div class="rang"><button class="pill go" id="mRep">▶ Continuer</button><button class="pill" id="mRe">🔁 Recommencer</button><button class="pill" id="mMenu">🏠 Menu</button></div></div>`; $('modal').classList.add('on');
    $('mRep').onclick = () => { G.pause = false; $('modal').classList.remove('on'); last = performance.now(); }; $('mRe').onclick = () => partie(G.n); $('mMenu').onclick = () => { G = null; vide(monde); menu(); }; }
  else $('modal').classList.remove('on'); }
$('pause').onclick = pause;
document.addEventListener('visibilitychange', () => { if(document.hidden && G && !G.pause && G.etat === 'course') pause(); });

/* ---------- les boutons du menu ---------- */
$('who').onclick = () => choisir();
document.querySelectorAll('.mode').forEach(b => b.onclick = () => { mode = b.dataset.m; store.set('koora-mode', mode); SON.tap(); menu(); });
$('niveaux').onclick = async e => { const b = e.target.closest('[data-n]'); if(!b) return; if(!joueur && !(await choisir())) return; const n = +b.dataset.n; if(n > sv.niv[mode]){ SON.rebond(); return; } SON.tap(); partie(n); };
$('boutique').onclick = async e => { const b = e.target.closest('[data-b]'); if(!b) return; if(!joueur && !(await choisir())) return; const B = BALLONS.find(x => x.id === b.dataset.b);
  if(!sv.ballons.includes(B.id)){ if(sv.pieces < B.prix){ SON.rebond(); alerte(`Il te faut 🪙 ${B.prix} (tu as ${sv.pieces}). Casse des bab pour gagner des pièces !`); return; } sv.pieces -= B.prix; sv.ballons.push(B.id); SON.victoire(); }
  sv.ballon = B.id; sauve(); SON.tap(); menu(); };
function alerte(t){ $('modal').innerHTML = `<div class="carte"><p style="font-size:18px">${esc(t)}</p><div class="rang"><button class="pill go" id="mOk">D'accord</button></div></div>`; $('modal').classList.add('on'); $('mOk').onclick = () => $('modal').classList.remove('on'); }

sv = neuf(); menu();
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0);
window.__koora = { get G(){ return G; }, partie, fin, set cible(v){ if(G) G.cible = v; }, demarre };
