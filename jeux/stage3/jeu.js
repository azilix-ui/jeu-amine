/* Jasmin · Stage 3 — la course du TGM : dessin, commandes, sons, commentaire, sauvegarde, et la course en ligne (api/stage3.php).
   Les règles sont dans course.js. Les images : le décor « en vrai » du Jasmin 3 (jasmin3/m1), les héros « en vrai » (jasmin2/corps-*,
   stage2/heros/* pour glisser et danser), les animaux du Jasmin et du Stage 2, et les objets ComfyUI de stage3/img (docs/stage3/build_images.py). */
import { nouvellePartie, pas, resultat, PAS, MODES, dansTrou } from './course.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const API = new URL('../../api/stage3.php', import.meta.url).href;
const HEROS = [['essil', 'Essil'], ['salma', 'Salma'], ['amine', 'Amine'], ['anis', 'Papa'], ['imen', 'Maman'], ['nour', 'Nour'], ['yasmine', 'Yasmine'], ['fares', 'Farès']];
const FAMILLE = ['essil', 'salma', 'amine', 'anis', 'imen'], TAILLE = { amine:.8, salma:.9, essil:.97, nour:.92, yasmine:.92, anis:1.08, imen:1.05, fares:1.04 };
const teteDe = id => FAMILLE.includes(id) ? `avatars/${id}.webp` : `avatars/mascotte-${id}.webp`;
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ---------- le joueur, sa sauvegarde ---------- */
const prefs = Object.assign({ son:true, amb:true, com:'ar', bs:1, mode:'tranquille' }, store.get('stage3-prefs', {}));
const sauvePrefs = () => store.set('stage3-prefs', prefs);
let joueur = null, sv = null;
const cle = () => 'stage3:' + joueur;
const neuf = () => ({ heros:'', best:{}, parties:0, gagnees:0, t:0 });
function monHeros(){ const k = norm(joueur); if(FAMILLE.includes(k)) return k; const h = window.Famille && Famille.head ? Famille.head(joueur) : null; return h && TAILLE[h.id] ? h.id : 'nour'; }
function heroId(){ if(sv && TAILLE[sv.heros]) return sv.heros; const j = store.get('jasmin:' + joueur, {}) || {}; return TAILLE[j.heros] ? j.heros : monHeros(); }
function tenueDe(){ const j = store.get('jasmin:' + joueur, {}) || {}; return /^[a-z]{2,10}$/.test(j.tenue || '') ? j.tenue : 'classique'; }   // la tenue portée dans le Jasmin
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {});
  if(window.Famille && Famille.track){ Famille.track('stage3', n, [cle()]); try{ const r = await Famille.load('stage3', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu(); }
async function choisirJoueur(){ if(!window.Famille) return null; const n = await Famille.choosePlayer({ title:'Qui court après le TGM ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
  avatar:k => `<img src="avatars/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` }); if(n) await setJoueur(n); return n; }

/* ---------- les images ---------- */
const IM = {}; const img = (k, src) => { if(IM[k]) return IM[k]; const i = new Image(); i.src = src; IM[k] = i; return i; };
const ok = i => i && i.complete && i.naturalWidth > 0;
['fond', 'maisons', 't_dessus', 't_mur', 't_mer', 'piece', 'jasmin_or', 'the', 'chechia', 'lanterne'].forEach(k => img(k, `jasmin3/m1/${k}.webp`));
['tgm', 'gare', 'poubelle', 'sacs', 'cageot', 'banane', 'huile', 'barriere', 'linge'].forEach(k => img(k, `stage3/img/${k}.webp?v=1`));
const SPR = { chat:{ f:'jasmin2/chat.webp', h:40, dy:2 }, chien:{ f:'stage2/chien-anim.webp', h:42 }, mouette:{ f:'jasmin2/mouette.webp', h:52, dy:14 } };
Object.entries(SPR).forEach(([k, s]) => img('sp_' + k, s.f + '?v=2')); img('scooter', 'stage2/en/scooter.webp?v=1');
// les héros : la planche de course du Jasmin (6 × 4 : 0-11 la foulée, 12-19 le bond, 20 de profil, 21 de face) + les gestes du Stage 2 (glisser, danser)
const CORPS = {};
function corps(id, tenue){ const k = id + '|' + tenue; if(CORPS[k]) return CORPS[k]; const C = CORPS[k] = { im:null, g:null };
  const im = new Image(); im.onload = () => { const cw = im.naturalWidth / 6, ch = im.naturalHeight / 4, c = document.createElement('canvas'); c.width = cw; c.height = ch; const x = c.getContext('2d', { willReadFrequently:true }); x.drawImage(im, 2 * cw, 3 * ch, cw, ch, 0, 0, cw, ch);
    const d = x.getImageData(0, 0, cw, ch).data; let top = ch, feet = 0; for(let y = 0; y < ch; y++){ let n = 0; for(let q = 0; q < cw; q++) if(d[(y * cw + q) * 4 + 3] > 120) n++; if(n > 2){ if(y < top) top = y; feet = y; } }
    C.im = { im, cw, ch, top, feet, k:TAILLE[id] || 1 }; };
  im.onerror = () => { if(tenue !== 'classique'){ const b = corps(id, 'classique'); const t = setInterval(() => { if(b.im){ C.im = b.im; C.g = C.g || b.g; clearInterval(t); } }, 300); } };
  im.src = `jasmin2/corps-${id}${tenue === 'classique' ? '' : '-' + tenue}.webp?v=2`;
  const gk = id + (tenue === 'classique' ? '' : '-' + tenue), meta = (window.S2_GESTES || {})[gk] || (window.S2_GESTES || {})[id];
  if(meta){ const gi = new Image(); gi.onload = () => { C.g = Object.assign({ im:gi }, meta); }; gi.src = `stage2/heros/${(window.S2_GESTES || {})[gk] ? gk : id}.webp?v=${meta.v || 1}`; }
  return C; }

/* ---------- les sons ---------- */
let AC = null, master = null;
function audio(){ if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = .9; master.connect(AC.destination); if(window.Sons) Sons.charger('jasmin', ['saut', 'piece', 'aie', 'chute', 'gemme', 'bonus', 'victoire', 'ecrase', 'lampe', 'atterrir', 'amb-1']); }catch(e){} } if(AC && AC.state !== 'running') AC.resume(); return AC; }
function bip(f, d, type = 'sine', v = .08, f2 = 0, t0 = 0){ if(!AC || !prefs.son) return; const t = AC.currentTime + t0, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(master); o.start(t); o.stop(t + d + .02); }
function son(n, secours){ if(!prefs.son || !audio()) return; if(window.Sons && Sons.jouer(AC, master, n, .7)) return; secours && secours(); }
const klaxon = () => { if(!prefs.son || !audio()) return; [0, .35].forEach(t0 => { bip(440, .3, 'sawtooth', .05, 0, t0); bip(554, .3, 'sawtooth', .04, 0, t0); }); };
function ambiance(on){ if(!window.Sons || !audio()) return; if(on && prefs.amb) Sons.boucle(AC, master, 'amb-1', .35); else Sons.stop(); }

/* ---------- le commentaire (arabe par défaut, voix Mohammad ; français : Céline ; Lulu pour Amine) ---------- */
const PH = {
  depart:['Vite ! Le TGM part bientôt, cours à la gare !', 'أَسْرِعْ! القِطَارُ سَيَنْطَلِقُ قَرِيبًا، اُرْكُضْ إِلَى المَحَطَّة!'],
  presse:['Plus que quinze secondes !', 'بَقِيَتْ خَمْسَ عَشْرَةَ ثَانِيَة!'],
  arrive:['Bravo, tu as attrapé le TGM !', 'أَحْسَنْت! لَحِقْتَ بِالقِطَار!'],
  rate:['Oh non, le TGM est parti… Essaie encore !', 'لِلْأَسَف، اِنْطَلَقَ القِطَار… حَاوِلْ مَرَّةً أُخْرَى!'],
  ko:['Plus de vies… Ce n\'est pas grave, on recommence !', 'لَا بَأْس، نُعِيدُ مِنْ جَدِيد!'],
  jasmin:['Un jasmin doré !', 'يَاسَمِينَةٌ ذَهَبِيَّة!'],
};
function parle(k){ const L = norm(joueur) === 'amine' ? (prefs.com === 'non' ? 'non' : 'fr') : prefs.com; if(L === 'non' || !PH[k] || !('speechSynthesis' in window)) return;
  try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(L === 'ar' ? PH[k][1] : PH[k][0]); u.lang = L === 'ar' ? 'ar' : 'fr-FR'; speechSynthesis.speak(u); }catch(e){} }
let bulleT = 0; function bulle(t, ms = 1800){ const b = $('bulle'); b.textContent = t; b.classList.add('on'); clearTimeout(bulleT); bulleT = setTimeout(() => b.classList.remove('on'), ms); }

/* ---------- l'écran ---------- */
// l'échelle : au moins 330 unités de haut et 760 de large (pour voir arriver les obstacles, même en portrait) ; le sol est à 72 % de la hauteur
const cv = $('cv'), ctx = cv.getContext('2d'); let DPR = 1, CW = 0, CH = 0, SC = 1, VW = 0, GYs = 0, HAUT = 0, BAS = 0;
function resize(){ DPR = Math.min(2, devicePixelRatio || 1); CW = innerWidth; CH = innerHeight; cv.width = Math.round(CW * DPR); cv.height = Math.round(CH * DPR); SC = Math.min(CH / 330, CW / 760); VW = CW / SC; GYs = CH * (CH > CW ? .66 : .74); HAUT = GYs / SC; BAS = (CH - GYs) / SC; document.documentElement.style.setProperty('--bs', prefs.bs); }
addEventListener('resize', () => { resize(); if(document.body.classList.contains('touch') && CH > CW && etat === 'course' && !L) togglePause(); }); resize();
if(matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
function montre(id){ document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); document.body.classList.toggle('menu', id === 'menu'); }

/* ---------- la partie ---------- */
let G = null, etat = 'menu', camX = 0, acc = 0, last = 0, presse = false, depart = 0;   // etat : menu, compte, course, pause, fin
const C = { saut:false, bas:false, vite:false, lent:false }, K = {};
let L = null;   // la course en ligne (classe Ligne plus bas) ; null en solo
function partie(graine, mode){
  G = nouvellePartie(graine, mode); camX = 0; acc = 0; presse = false; G.vu = G.h.x;
  const id = heroId(), tn = tenueDe(); G.moiC = corps(id, tn); G.heros = id;
  document.body.classList.add('joue'); montre('-'); audio(); ambiance(true);
  etat = 'compte'; depart = performance.now() + 3000; $('compte').classList.add('on'); $('compte').textContent = '3';
  rendHud(); }
function lance(){ if(!joueur) return choisirJoueur().then(n => n && lance()); partie((Math.random() * 2 ** 31) | 0, prefs.mode); }

const CLAVIER = { ArrowUp:'saut', ' ':'saut', w:'saut', z:'saut', ArrowDown:'bas', s:'bas', ArrowRight:'vite', d:'vite', ArrowLeft:'lent', q:'lent', a:'lent' };
addEventListener('keydown', e => { const k = CLAVIER[e.key] || CLAVIER[e.key.toLowerCase()]; if(k && etat !== 'menu'){ K[k] = true; e.preventDefault(); }
  if((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && (etat === 'course' || etat === 'pause')) togglePause(); });
addEventListener('keyup', e => { const k = CLAVIER[e.key] || CLAVIER[e.key.toLowerCase()]; if(k) K[k] = false; });
addEventListener('blur', () => { for(const k in K) K[k] = false; if(etat === 'course' && !L) togglePause(); });
const TB = { bLent:'lent', bVite:'vite', bBas:'bas', bSaut:'saut' }, TT = {};
for(const [id, k] of Object.entries(TB)){ const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); audio(); TT[k] = true; b.classList.add('on'); try{ b.setPointerCapture(e.pointerId); }catch(er){} });
  const off = () => { TT[k] = false; b.classList.remove('on'); }; b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); }
function manette(){ const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null; if(!gp) return {}; const b = i => gp.buttons[i] && gp.buttons[i].pressed, ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
  if(b(9) && !manette.st && (etat === 'course' || etat === 'pause')) togglePause(); manette.st = b(9);
  return { saut:b(0) || b(12) || ay < -.6, bas:b(13) || ay > .6, vite:b(15) || ax > .5, lent:b(14) || ax < -.5 }; }
function lisCommandes(){ const m = manette(); for(const k of ['saut', 'bas', 'vite', 'lent']) C[k] = !!(K[k] || TT[k] || m[k]); }
function togglePause(){ if(L){ L.demandeQuitter(); return; } if(etat === 'course'){ etat = 'pause'; ambiance(false); montre('pause'); } else if(etat === 'pause'){ etat = 'course'; last = performance.now(); ambiance(true); montre('-'); } }
$('pauseB').onclick = () => { audio(); togglePause(); };
$('pReprend').onclick = () => togglePause();
$('pRecommence').onclick = () => { montre('-'); partie((Math.random() * 2 ** 31) | 0, G.P.mode); };
$('pMenu').onclick = () => quitter();
function quitter(){ etat = 'menu'; G = null; ambiance(false); document.body.classList.remove('joue'); $('compte').classList.remove('on'); if(L){ L.quitte(); L = null; } menu(); }

// les événements de la course : sons, bulles, commentaire
function evenements(){ for(const e of G.ev){
  if(e.k === 'saut') son('saut', () => bip(520, .12, 'square', .05, 880));
  else if(e.k === 'piece') son('piece', () => bip(1320, .08, 'square', .05));
  else if(e.k === 'jasmin'){ son('gemme', () => bip(990, .3, 'triangle', .08, 1480)); bulle('🌼 Un jasmin doré !'); parle('jasmin'); }
  else if(e.k === 'bonus'){ son('bonus'); bulle(e.t === 'the' ? '🍵 Thé à la menthe : turbo !' : '🎩 La chéchia te protège !'); }
  else if(e.k === 'aie'){ son('aie', () => bip(200, .2, 'sawtooth', .06, 90)); if(navigator.vibrate) try{ navigator.vibrate(60); }catch(er){} }
  else if(e.k === 'glisse'){ bulle(e.o.t === 'banane' ? '🍌 Oups, une peau de banane !' : '🫒 Attention, de l\'huile !', 1400); bip(700, .4, 'sine', .06, 200); }
  else if(e.k === 'trou'){ son('chute'); bulle('Aïe, un trou ! Saute par-dessus la prochaine fois.', 1800); }
  else if(e.k === 'linge'){ bulle('👕 Glisse sous le linge (⤓) !', 1500); }
  else if(e.k === 'renverse'){ if(e.o.t === 'poubelle') bip(160, .25, 'triangle', .07, 80); }
  else if(e.k === 'ecrase'){ son('ecrase', () => bip(300, .15, 'square', .06, 600)); }
  else if(e.k === 'bouclier'){ bulle('🎩 La chéchia t\'a protégé !'); }
  else if(e.k === 'lanterne'){ son('lampe'); bulle('🏮 Lanterne : tu repartiras d\'ici.', 1300); }
  else if(e.k === 'vie'){ if(e.vies > 0) bulle(`❤️ Il te reste ${e.vies} vie${e.vies > 1 ? 's' : ''}`, 1600); }
  else if(e.k === 'arrive'){ son('victoire'); klaxon(); parle('arrive'); G.danse = performance.now() / 1000; setTimeout(() => fin(), 3200); if(L) L.arrive(G); }
  else if(e.k === 'rate'){ klaxon(); parle('rate'); setTimeout(() => fin(), 2600); if(L) L.rate(G, 'rate'); }
  else if(e.k === 'ko'){ son('chute'); parle('ko'); setTimeout(() => fin(), 1500); if(L) L.rate(G, 'ko'); }
} G.ev.length = 0; }

function frame(now){
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if(etat === 'compte'){ const r = Math.ceil((depart - now) / 1000); $('compte').textContent = r > 0 ? r : 'Yalla !';
    if(r !== frame.r){ frame.r = r; if(r > 0) bip(660, .12, 'square', .06); else { bip(990, .3, 'square', .07); parle('depart'); } }
    if(now >= depart + 400){ etat = 'course'; $('compte').classList.remove('on'); } }
  if(G && (etat === 'course' || (etat === 'compte' && now >= depart) || etat === 'fin-attente')){
    lisCommandes(); acc += dt; while(acc >= PAS){ pas(G, G.etat === 'course' ? C : {}, PAS); acc -= PAS; } evenements();
    if(G.etat === 'course' && !presse && G.limite - G.t < 15){ presse = true; parle('presse'); klaxon(); } }
  if(G){ const cible = G.h.x - VW * .3; camX += (cible - camX) * Math.min(1, dt * 8); if(G.h.chute > 0) camX = Math.min(camX, G.h.x - VW * .3); dessine(now / 1000); rendHud(); }
  if(L && G) L.avance(dt);
  requestAnimationFrame(frame);
}

/* ---------- le dessin ---------- */
function bande(im, h, par, y){ if(!ok(im)) return; const w = h * im.naturalWidth / im.naturalHeight, p = camX * par, k0 = Math.floor(p / w);
  for(let k = k0; k * w - p < VW + w; k++){ ctx.save(); const x = k * w - p; if(k % 2){ ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(im, 0, 0, w, h); } else ctx.drawImage(im, x, y, w, h); ctx.restore(); } }
let motifs = {};
function motif(k, taille){ const im = IM[k]; if(!ok(im)) return null; let p = motifs[k]; if(!p) p = motifs[k] = ctx.createPattern(im, 'repeat'); p.setTransform(new DOMMatrix().scale(taille / im.naturalWidth)); return p; }
function dessine(t){
  ctx.setTransform(DPR * SC, 0, 0, DPR * SC, 0, DPR * GYs); ctx.imageSmoothingQuality = 'high';   // y = 0 : le sol
  const ciel = ctx.createLinearGradient(0, -HAUT, 0, 0); ciel.addColorStop(0, '#5fb0ea'); ciel.addColorStop(1, '#cfe9fb'); ctx.fillStyle = ciel; ctx.fillRect(0, -HAUT, VW, HAUT + BAS);
  const hf = Math.max(260, HAUT * .9); bande(IM.fond, hf, .15, -hf - 20);
  if(ok(IM.maisons)) bande(IM.maisons, 120, .45, -112);
  ctx.save(); ctx.translate(-Math.round(camX * SC * DPR) / (SC * DPR), 0);
  const P = G.P, x0 = camX - 60, x1 = camX + VW + 60;
  // la mer au fond des trous, puis le sol (dessus en faïence, mur à la chaux)
  const mer = motif('t_mer', 80); ctx.fillStyle = mer || '#2a7fc0'; ctx.fillRect(x0, 30, x1 - x0, BAS + 10);
  const morceaux = []; let a = x0; for(const tr of P.trous){ if(tr.x + tr.w < x0 || tr.x > x1) continue; if(tr.x > a) morceaux.push([a, tr.x]); a = Math.max(a, tr.x + tr.w); } if(a < x1) morceaux.push([a, x1]);
  const mur = motif('t_mur', 90), dessus = motif('t_dessus', 40);
  for(const [u, v] of morceaux){ ctx.fillStyle = mur || '#f1ede4'; ctx.fillRect(u, 0, v - u, BAS + 10); ctx.fillStyle = dessus || '#3a6fd0'; ctx.fillRect(u, -2, v - u, 14); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(u, 12, v - u, 3); }
  // la gare et le TGM
  const gx = P.gare; if(ok(IM.gare)){ const w = 330, h = w * IM.gare.naturalHeight / IM.gare.naturalWidth; ctx.drawImage(IM.gare, gx - 300, -h + 6, w, h); }
  ctx.fillStyle = '#8a8a8a'; ctx.fillRect(gx - 40, -4, 900, 4);
  let tx = gx + 60; if(G.etat === 'rate' || (G.etat === 'arrive' && G.danse && t - G.danse > 1.6)){ G.trainT = G.trainT || t; tx += Math.pow(t - G.trainT, 2) * 160; }
  if(ok(IM.tgm)){ const w = 640, h = w * IM.tgm.naturalHeight / IM.tgm.naturalWidth; ctx.drawImage(IM.tgm, tx, -h - 2, w, h); }
  if(G.etat === 'course' && G.limite - G.t < 6 && Math.sin(t * 10) > 0){ ctx.fillStyle = '#ffdd33'; ctx.font = '800 22px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔔', tx + 40, -150); }
  // les lanternes
  for(const lx of P.lanternes) if(lx > x0 && lx < x1 && ok(IM.lanterne)){ ctx.globalAlpha = G.lanterne >= lx ? 1 : .75; ctx.drawImage(IM.lanterne, lx - 10, -92, 22, 90); ctx.globalAlpha = 1; }
  // les obstacles
  for(const o of P.obstacles){ if(o.x + o.w < x0 || o.x > x1) continue; const im = IM[o.t]; if(!ok(im)) continue; const tombe = G.tombes.has(o), glisse = G.glisses.has(o);
    if(o.glisse){ const h = o.t === 'banane' ? 12 : 24, w = o.w + 10; ctx.globalAlpha = glisse ? .5 : 1; ctx.drawImage(im, o.x - 5, -h + 4, w, h); ctx.globalAlpha = 1; continue; }
    const h = o.t === 'sacs' ? o.h + 6 : o.t === 'poubelle' ? o.h + 4 : o.double ? o.h / 2 : o.h + 4, w = h * im.naturalWidth / im.naturalHeight;
    ctx.save(); ctx.translate(o.x + o.w / 2, 0); if(tombe){ ctx.rotate(1.35); ctx.globalAlpha = .9; }
    ctx.drawImage(im, -w / 2, -h, w, h); if(o.double && !tombe) ctx.drawImage(im, -w / 2, -2 * h + 2, w, h); ctx.restore(); }
  // le linge (une corde entre deux poteaux)
  for(const l of P.linges){ if(l.x + l.w < x0 || l.x > x1) continue; const im = IM.linge; if(ok(im)){ const w = l.w + 30, h = w * im.naturalHeight / im.naturalWidth, y = -h * .98;
      ctx.drawImage(im, l.x - 15, y, w, h); ctx.strokeStyle = 'rgba(90,70,50,.8)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(l.x - 10, y + h * .17); ctx.quadraticCurveTo(l.x + l.w / 2, y + h * .24, l.x + l.w + 10, y + h * .17); ctx.stroke(); } }
  // les dinars, les jasmins, les bonus
  P.pieces.forEach((p, i) => { if(G.pris.has('p' + i) || p.x < x0 || p.x > x1) return; const s = Math.abs(Math.cos(t * 4 + i)); if(ok(IM.piece)) ctx.drawImage(IM.piece, p.x - 9 * s, p.y - 9, 18 * s + .5, 18); });
  P.jasmins.forEach((p, i) => { if(G.pris.has('j' + i) || p.x < x0 || p.x > x1) return; if(ok(IM.jasmin_or)) ctx.drawImage(IM.jasmin_or, p.x - 16, p.y - 16 + Math.sin(t * 3) * 3, 32, 32); });
  P.bonus.forEach((b, i) => { if(G.pris.has('b' + i) || b.x < x0 || b.x > x1) return; const im = IM[b.t]; if(ok(im)) ctx.drawImage(im, b.x - 14, b.y - 14 + Math.sin(t * 3) * 2, 28, 28); });
  // les ennemis
  for(const e of G.ennemis){ if(!e.actif || e.parti || e.x < x0 - 60 || e.x > x1) continue; ctx.save(); ctx.translate(e.x, e.y); if(e.etourdi > 0){ ctx.globalAlpha = .8; ctx.rotate(-.25); }
    if(e.t === 'scooter'){ const im = IM.scooter; if(ok(im)){ const h = 56, w = h * im.naturalWidth / im.naturalHeight; ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h, w, h); } }
    else { const s = SPR[e.t], im = IM['sp_' + e.t]; if(ok(im)){ const cw = im.naturalWidth / 12, ch = im.naturalHeight, w = s.h * cw / ch, f = e.etourdi > 0 ? 0 : Math.floor(t * (e.t === 'chien' ? 18 : 11)) % 12; ctx.scale(-1, 1); ctx.drawImage(im, f * cw, 0, cw, ch, -w / 2, -s.h + (s.dy || 0), w, s.h); } }
    if(e.etourdi > 0){ ctx.globalAlpha = 1; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💫', 0, -e.h - 8); }
    ctx.restore(); }
  // les autres coureurs (en ligne), en transparence, puis soi
  if(L) for(const o of L.fantomes()){ if(o.x < x0 - 60 || o.x > x1) continue; heros(o.C, { x:o.x, y:o.y, vx:o.vx, vy:o.vy, sol:o.a === 0, glisse:o.a === 2, trebuche:o.a === 3 ? 1 : 0, chute:0, inv:0 }, t, .5, o.danse ? o.danse : 0, o.nom); }
  heros(G.moiC, G.h, t, 1, G.danse || 0);
  ctx.restore();
}
function heros(Cp, h, t, alpha, danse, nom){
  const B = Cp && Cp.im; if(h.inv > 0 && Math.sin(t * 40) > 0 && alpha === 1) return;
  ctx.save(); ctx.translate(h.x, h.y); ctx.globalAlpha = alpha;
  if(!B){ ctx.fillStyle = '#1f5fbf'; ctx.fillRect(-10, -66, 20, 66); ctx.restore(); return; }
  const sc = 76 * B.k / (B.feet - B.top), gs = Cp.g;
  const geste = (ligne, f) => { if(!gs || !gs.n || !gs.n[ligne]) return false; const n = gs.n[ligne], i = ((f % n) + n) % n, s = 76 * B.k / gs.ref, w = gs.cw * s, hh = gs.ch * s; ctx.drawImage(gs.im, i * gs.cw, ligne * gs.ch, gs.cw, gs.ch, -w / 2, -hh + (gs.pied ? gs.pied * s : 0), w, hh); return true; };
  let fait = false;
  if(danse) fait = geste(5, Math.floor((t - danse) * 10));
  else if(h.glisse) fait = geste(1, Math.floor(t * 14));
  if(!fait){ let f; const air = !h.sol;
    if(h.chute > 0 || h.trebuche > 0) f = 15; else if(air) f = h.vy < -260 ? 13 : h.vy < -90 ? 14 : h.vy < 90 ? 15 : h.vy < 300 ? 16 : 17; else if(Math.abs(h.vx) > 20) f = Math.floor(t * Math.max(8, Math.abs(h.vx) / 22)) % 12; else f = 20;
    const w = B.cw * sc, hh = B.ch * sc; if(h.vx < -20) ctx.scale(-1, 1); ctx.drawImage(B.im, (f % 6) * B.cw, Math.floor(f / 6) * B.ch, B.cw, B.ch, -w / 2, -B.feet * sc, w, hh); }
  ctx.globalAlpha = 1;
  if(nom){ ctx.font = '800 12px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(11,30,70,.75)'; const w = ctx.measureText(nom).width + 12; ctx.fillRect(-w / 2, -96, w, 16); ctx.fillStyle = '#fff'; ctx.fillText(nom, 0, -84); }
  if(alpha === 1 && G.h.chechia){ ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🎩', 0, -84); }
  if(alpha === 1 && G.h.the > 0){ ctx.fillStyle = 'rgba(125,255,176,.25)'; ctx.beginPath(); ctx.arc(0, -36, 34, 0, 7); ctx.fill(); }
  ctx.restore(); }

/* ---------- le haut de l'écran ---------- */
function rendHud(){ if(!G) return; const h = G.h, M = G.M;
  let s = ''; for(let i = 0; i < M.morceaux; i++) s += `<i class="${i < h.morceaux ? '' : 'vide'}"></i>`; if($('vie').innerHTML !== s) $('vie').innerHTML = s; $('vie').classList.toggle('bas', h.morceaux <= 2);
  $('hVies').textContent = '❤️ ' + G.vies; $('hDin').textContent = '🪙 ' + G.dinars; $('hJas').textContent = '🌼 ' + G.jasmins + '/3';
  const reste = Math.max(0, G.limite - G.t), m = Math.floor(reste / 60), sec = Math.floor(reste % 60);
  $('chrono').textContent = G.etat === 'arrive' ? '🎉 Dans le TGM !' : G.etat === 'rate' ? '😢 Le TGM est parti' : `🚋 Le TGM part dans ${m}:${String(sec).padStart(2, '0')}`; $('chrono').classList.toggle('vite', G.etat === 'course' && reste < 15);
  const pos = [[teteDe(G.heros), G.h.x, true]].concat(L ? L.fantomes().map(o => [teteDe(o.heros), o.x, false]) : []);
  const piste = $('piste'); let html = '<b>🚋</b>'; for(const [im, x, moi] of pos) html += `<span class="${moi ? 'moi' : ''}" style="left:${Math.min(100, Math.max(0, x / (G.P.gare + 120) * 96))}%;background-image:url('${im}')"></span>`;
  if(piste.dataset.h !== html){ piste.innerHTML = html; piste.dataset.h = html; } }

/* ---------- la fin ---------- */
function fin(){ if(!G || etat === 'fin') return; const r = resultat(G), mode = G.P.mode; etat = 'fin'; ambiance(false);
  if(sv){ sv.parties++; if(r.gagne){ sv.gagnees++; const b = sv.best[mode] || {}; sv.best[mode] = { etoiles:Math.max(b.etoiles || 0, r.etoiles), score:Math.max(b.score || 0, r.score), reste:Math.max(b.reste || 0, r.reste), jasmins:Math.max(b.jasmins || 0, r.jasmins) };
      if(window.Famille) Famille.score('stage3', 'm1-' + mode, r.score, joueur).catch(() => {}); } sauve(); }
  if(L){ L.fin(r); return; }
  const titre = r.gagne ? '🎉 Tu as attrapé le TGM !' : G.etat === 'ko' ? '💔 Plus de vies…' : '😢 Le TGM est parti…';
  $('finBox').innerHTML = `<h2>${titre}</h2>${r.gagne ? `<div class="etoiles">${'⭐'.repeat(r.etoiles)}${'☆'.repeat(3 - r.etoiles)}</div>` : ''}
    <div class="res"><span>⏱️ Temps</span><b>${r.temps} s</b>${r.gagne ? `<span>🚋 Avance sur le départ</span><b>${r.reste} s</b>` : ''}<span>🪙 Dinars</span><b>${r.dinars} / ${r.total}</b><span>🌼 Jasmins</span><b>${r.jasmins} / 3</b>${r.gagne ? `<span>🏆 Score</span><b>${r.score}</b>` : ''}</div>
    <p>${r.gagne ? (r.etoiles < 3 ? 'Pour plus d\'étoiles : ramasse plus de dinars, et prends de l\'élan (▶) pour les jasmins tout en haut.' : 'Parfait ! Tu es le roi des rues de Sidi Bou Saïd !') : 'Saute plus tôt, glisse sous le linge, et cours plus vite (▶) quand la rue est libre.'}</p>
    <div class="rang"><button class="btn" id="fRe">↻ Recommencer</button><button class="btn gris" id="fMenu">🏠 Menu</button></div>`;
  montre('fin'); document.body.classList.remove('joue');
  $('fRe').onclick = () => partie((Math.random() * 2 ** 31) | 0, mode); $('fMenu').onclick = () => quitter(); }

/* ---------- le menu ---------- */
function menu(){ etat = 'menu'; montre('menu'); document.body.classList.remove('joue');
  $('who').innerHTML = joueur ? `<img src="${teteDe(monHeros())}" alt=""><span>${esc(joueur)}<small>Toucher pour changer de joueur</small></span>` : '<span>Qui joue ?<small>Touche pour choisir</small></span>';
  const cur = joueur ? heroId() : '';
  $('heros').innerHTML = HEROS.map(([id, n]) => `<button data-h="${id}" class="${cur === id ? 'on' : ''}"><img src="${teteDe(id)}" alt="">${n}</button>`).join('');
  $('modes').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === prefs.mode));
  const b = sv && sv.best[prefs.mode]; $('mRec').textContent = b ? `Ton record (${prefs.mode}) : ${'⭐'.repeat(b.etoiles)} · ${b.score} points · ${b.reste} s d'avance` : '';
  rendOpts(); }
$('who').onclick = () => choisirJoueur();
$('heros').onclick = async e => { const b = e.target.closest('[data-h]'); if(!b) return; if(!joueur && !(await choisirJoueur())) return; sv.heros = b.dataset.h; sauve(); menu(); };
$('modes').onclick = e => { const b = e.target.closest('[data-m]'); if(!b) return; prefs.mode = b.dataset.m; sauvePrefs(); menu(); };
$('solo').onclick = () => { audio(); lance(); };
$('ligne').onclick = async () => { audio(); if(!joueur && !(await choisirJoueur())) return; Ligne.salon(); };
$('oHelp').onclick = () => montre('aide'); $('aideOk').onclick = () => menu();
$('oOpts').onclick = () => { rendOpts(); montre('opts'); }; $('optOk').onclick = () => menu();
function rendOpts(){ $('oSon').textContent = prefs.son ? 'Oui' : 'Non'; $('oSon').setAttribute('aria-pressed', prefs.son); $('oAmb').textContent = prefs.amb ? 'Oui' : 'Non'; $('oAmb').setAttribute('aria-pressed', prefs.amb);
  document.querySelectorAll('[data-com]').forEach(b => b.setAttribute('aria-pressed', b.dataset.com === prefs.com)); document.querySelectorAll('[data-bs]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.bs === prefs.bs)); resize(); }
$('oSon').onclick = () => { prefs.son = !prefs.son; sauvePrefs(); rendOpts(); }; $('oAmb').onclick = () => { prefs.amb = !prefs.amb; sauvePrefs(); rendOpts(); };
document.querySelectorAll('[data-com]').forEach(b => b.onclick = () => { prefs.com = b.dataset.com; sauvePrefs(); rendOpts(); });
document.querySelectorAll('[data-bs]').forEach(b => b.onclick = () => { prefs.bs = +b.dataset.bs; sauvePrefs(); rendOpts(); });
$('oRecs').onclick = () => { montre('recs'); records('tranquille'); }; $('recOk').onclick = () => menu();
$('recTabs').onclick = e => { const b = e.target.closest('[data-r]'); if(b) records(b.dataset.r); };
async function records(mode){ document.querySelectorAll('#recTabs button').forEach(b => b.classList.toggle('on', b.dataset.r === mode)); $('recList').innerHTML = '<span>…</span><b></b>';
  const l = window.Famille ? await Famille.highscores('stage3', 'm1-' + mode, 10).catch(() => null) : null;
  $('recList').innerHTML = !l ? '<span>Records indisponibles hors connexion.</span><b></b>' : !l.length ? '<span>Pas encore de record : à toi !</span><b></b>' : l.map((r, i) => `<span>${['🥇', '🥈', '🥉'][i] || i + 1 + '.'} ${esc(r.player)}</span><b>${r.score}</b>`).join(''); }

/* ---------- la course en ligne : le salon (comme l'Arène) et la course (chacun court sur sa tablette, les autres en transparence) ---------- */
async function post(d){ const f = new FormData(); for(const k in d) f.append(k, typeof d[k] === 'object' ? JSON.stringify(d[k]) : d[k]); const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
async function get(q){ const r = await fetch(API + '?' + new URLSearchParams(q), { credentials:'same-origin', cache:'no-store' }); const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('stage3-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('stage3-client', c); }catch(e){} } return c; }
const Ligne = {
  client:clientId(), code:null, room:null, host:null, online:[], status:'menu', poll:null,
  moi(){ return { client:this.client, nom:joueur, tete:teteDe(heroId()), heros:heroId(), tenue:tenueDe() }; },
  async hello(){ if(!joueur || document.hidden) return; try{ const r = await post({ action:'hello', client:this.client, name:joueur, tete:teteDe(heroId()), status:this.status, code:this.code || '' }); this.online = r.online || [];
    (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && !this.room) this.rendSalon(); else if(this.status === 'salon') this.rendSalle(); }catch(e){} },
  invitation(i){ if(etat !== 'menu' && etat !== 'fin' || this.code === i.code) return; const d = $('invit');
    d.innerHTML = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><img src="${esc(i.tete)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover"><b>${esc(i.name)} t'invite à courir après le TGM !</b><button class="btn" id="invOk" style="min-height:44px;font-size:18px">Courir</button><button class="btn gris" id="invNo">✕</button></div>`;
    d.classList.add('on'); bip(880, .15, 'triangle', .08); $('invOk').onclick = () => { d.classList.remove('on'); this.rejoindre(i.code); }; $('invNo').onclick = () => d.classList.remove('on'); setTimeout(() => d.classList.remove('on'), 30000); },
  salon(){ this.status = 'salon'; montre('salon'); $('salonRetour').onclick = () => { this.status = 'menu'; this.code = null; this.room = null; clearInterval(this.poll); menu(); }; if(this.room) this.rendSalle(); else this.rendSalon(); this.hello(); },
  rendSalon(){ const gens = this.online.filter(g => g.status !== 'joue');
    $('salonCorps').innerHTML = `<p>Crée une course et invite la famille : chacun court sur sa tablette, et tu vois les autres coureurs en transparence. Le premier dans le TGM gagne !</p>
      <button class="btn" id="sCree">🚋 Créer une course</button>
      <p class="lab">Rejoindre avec un code</p><div class="rang"><input id="sCode" maxlength="4" placeholder="ABCD" style="font:800 28px 'Baloo 2';text-transform:uppercase;width:150px;padding:6px 12px;border-radius:14px;border:0;letter-spacing:4px;text-align:center"><button class="btn bleu" id="sJoin">Rejoindre</button></div>
      <p class="lab">Sur le Stage 3 en ce moment</p>${gens.length ? `<div class="gens">${gens.map(g => `<button disabled><img src="${esc(g.tete)}" alt=""><span>${esc(g.name)}<small>${g.code ? 'course ' + g.code : 'au menu'}</small></span></button>`).join('')}</div>` : '<p style="color:var(--mist)">Personne d\'autre pour l\'instant : demande à la famille d\'ouvrir le Stage 3 !</p>'}`;
    $('sCree').onclick = () => this.cree(); $('sJoin').onclick = () => { const c = $('sCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); }; },
  async cree(){ try{ const st = { etat:'attente', mode:prefs.mode, graine:(Math.random() * 1e9) | 0, joueurs:[this.moi()] }; const r = await post({ action:'create', client:this.client, state:st });
      this.code = r.code; this.room = st; this.host = this.client; this.attend(); this.rendSalle(); this.hello(); }catch(e){ bulle(e.message, 3000); } },
  async rejoindre(code){ try{ const m = this.moi(); const r = await post({ action:'join', code, client:this.client, name:m.nom, tete:m.tete, heros:m.heros, tenue:m.tenue }); this.code = code; this.room = r.state; this.host = r.host; this.status = 'salon'; montre('salon');
      $('salonRetour').onclick = () => { this.status = 'menu'; this.code = null; this.room = null; clearInterval(this.poll); menu(); }; this.attend(); this.rendSalle(); this.hello(); }catch(e){ bulle(e.message, 3000); } },
  attend(){ clearInterval(this.poll); this.poll = setInterval(async () => { if(!this.code || L) return; try{ const r = await get({ action:'room', code:this.code }); this.room = r.state; this.host = r.host; if(r.state.etat === 'jeu' && r.state.n !== this.dernier) this.commence(); else this.rendSalle(); }catch(e){} }, 900); },
  rendSalle(){ const s = this.room, hote = this.host === this.client; if(!s || L) return; const libres = this.online.filter(g => g.status !== 'joue' && !s.joueurs.some(j => j.client === g.client));
    $('salonCorps').innerHTML = `<p>Code de la course :</p><div class="code">${this.code}</div>
      <p class="lab">Les coureurs (${s.joueurs.length} / 6)</p><div class="gens">${s.joueurs.map(j => `<button disabled><img src="${teteDe(j.heros)}" alt=""><span>${esc(j.nom)}<small>${j.client === this.host ? 'a créé la course' : 'prêt'}</small></span></button>`).join('')}</div>
      ${libres.length ? `<p class="lab">Inviter</p><div class="gens">${libres.map(g => `<button data-inv="${g.client}"><img src="${esc(g.tete)}" alt=""><span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}
      ${hote ? `<p class="lab">La course</p><div class="choix">${['tranquille', 'champion'].map(m => `<button data-sm="${m}" class="${s.mode === m ? 'on' : ''}">${m === 'tranquille' ? '🐢 Tranquille' : '🐆 Champion'}</button>`).join('')}</div><button class="btn" id="sGo">▶ Départ !</button>` : `<p style="font-weight:800">On attend le départ…</p>`}`;
    $('salonCorps').onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ const m = this.moi(); try{ await post({ action:'invite', client:this.client, name:m.nom, tete:m.tete, to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ bulle(err.message, 3000); } return; }
      if(!hote) return; if(b.dataset.sm) s.mode = b.dataset.sm; else if(b.id === 'sGo'){ s.etat = 'jeu'; s.graine = (Math.random() * 1e9) | 0; s.n = (s.n || 0) + 1; } else return;
      try{ await post({ action:'update', code:this.code, client:this.client, state:s }); }catch(err){ bulle(err.message, 3000); }
      if(s.etat === 'jeu') this.commence(); else this.rendSalle(); }; },
  commence(){ const s = this.room; this.dernier = s.n; L = new Course(this, s); this.status = 'joue'; partie(s.graine, s.mode); },
  quitteCourse(){ this.status = this.code ? 'salon' : 'menu'; },
};
setInterval(() => Ligne.hello(), 4000);
// une course en ligne : envoie sa position toutes les 150 ms, reçoit celles des autres
class Course {
  constructor(S, s){ this.S = S; this.s = s; this.since = 0; this.sortants = []; this.autres = {}; this.arrivees = []; this.on = true; this.fini = false;
    s.joueurs.forEach(j => { if(j.client !== S.client) this.autres[j.client] = { nom:j.nom, heros:j.heros, C:corps(j.heros, j.tenue || 'classique'), x:120, y:0, vx:0, vy:0, a:0, tx:120, ty:0, vu:performance.now(), etat:'course' }; });
    this.boucle(); }
  fantomes(){ return Object.values(this.autres).filter(o => o.etat !== 'parti'); }
  avance(dt){ for(const o of Object.values(this.autres)){ const k = Math.min(1, dt * 10); o.x += (o.tx + o.vx * .08 - o.x) * k; o.y += (o.ty - o.y) * k; } }
  async boucle(){ while(this.on){ const t0 = performance.now(), h = G && G.h;
      const p = h ? [Math.round(h.x), Math.round(h.y), h.chute > 0 || h.trebuche > 0 ? 3 : h.glisse ? 2 : h.sol ? 0 : 1, Math.round(h.vx), Math.round(h.vy), G.danse ? 1 : 0] : null;
      const e = this.sortants; this.sortants = [];
      try{ const r = await post({ action:'sync', code:this.S.code, client:this.S.client, since:this.since, msgs:{ p, e } });
        if(this.since === 0) this.since = r.id; else { this.since = r.id; r.msgs.forEach(m => this.recoit(m.c, m.m)); } }
      catch(err){ this.sortants = e.concat(this.sortants).slice(-50); }
      for(const [c, o] of Object.entries(this.autres)) if(o.etat === 'course' && performance.now() - o.vu > 9000){ o.etat = 'parti'; bulle(`${o.nom} ne répond plus`, 2000); this.majFin(); }
      const reste = 150 - (performance.now() - t0); if(reste > 0) await new Promise(r => setTimeout(r, reste)); } }
  recoit(c, m){ const o = this.autres[c]; if(!o) return; o.vu = performance.now();
    if(m.p){ const [x, y, a, vx, vy, d] = m.p; o.tx = x; o.ty = y; o.a = a; o.vx = vx; o.vy = vy; if(d && !o.danse) o.danse = performance.now() / 1000; }
    (m.e || []).forEach(e => { if(e.k === 'arrive'){ o.etat = 'arrive'; o.temps = e.t; this.arrivees.push({ nom:o.nom, heros:o.heros, temps:e.t }); bulle(`🚋 ${o.nom} est dans le TGM ! (${e.t} s)`, 2500); }
      else if(e.k === 'rate' || e.k === 'ko'){ o.etat = e.k; } else if(e.k === 'part'){ o.etat = 'parti'; bulle(`${o.nom} a quitté la course`, 2000); } this.majFin(); }); }
  arrive(g){ const t = Math.round(g.h.fin * 10) / 10; this.sortants.push({ k:'arrive', t }); this.arrivees.push({ nom:joueur, heros:heroId(), temps:t, moi:true }); }
  rate(g, k){ this.sortants.push({ k }); }
  fin(r){ this.r = r; this.fini = true; this.majFin(); }
  majFin(){ if(!this.fini) return; const tous = this.fantomes().every(o => o.etat !== 'course'), cl = [...this.arrivees].sort((a, b) => a.temps - b.temps), rang = cl.findIndex(a => a.moi) + 1;
    const r = this.r, hote = this.S.host === this.S.client;
    $('finBox').innerHTML = `<h2>${r.gagne ? (rang === 1 ? '🏆 Premier dans le TGM !' : `🚋 Dans le TGM (${rang}e)`) : '😢 Pas de TGM cette fois'}</h2>
      <div class="res">${cl.map((a, i) => `<span>${['🥇', '🥈', '🥉'][i] || (i + 1) + '.'} <img src="${teteDe(a.heros)}" alt="">${esc(a.nom)}${a.moi ? ' (toi)' : ''}</span><b>${a.temps} s</b>`).join('')}
      ${this.fantomes().filter(o => o.etat === 'course').map(o => `<span>🏃 <img src="${teteDe(o.heros)}" alt="">${esc(o.nom)}</span><b>court encore…</b>`).join('')}
      ${[...this.fantomes().filter(o => o.etat === 'rate' || o.etat === 'ko')].map(o => `<span>😢 <img src="${teteDe(o.heros)}" alt="">${esc(o.nom)}</span><b>raté</b>`).join('')}</div>
      <div class="res"><span>🪙 Tes dinars</span><b>${r.dinars} / ${r.total}</b><span>🌼 Tes jasmins</span><b>${r.jasmins} / 3</b></div>
      ${tous ? '' : '<p style="color:var(--mist)">On attend les autres coureurs…</p>'}
      <div class="rang">${hote ? '<button class="btn" id="fSalon">🚋 Une autre course</button>' : '<button class="btn" id="fSalon">🚋 Revenir au salon</button>'}<button class="btn gris" id="fMenu">🏠 Menu</button></div>`;
    montre('fin'); document.body.classList.remove('joue');
    $('fSalon').onclick = () => { this.stop(); L = null; G = null; etat = 'menu'; const S = this.S; S.room.etat = 'attente'; if(hote) post({ action:'update', code:S.code, client:S.client, state:S.room }).catch(() => {}); S.status = 'salon'; S.attend(); S.salon(); };
    $('fMenu').onclick = () => { this.partir(); quitter(); }; }
  demandeQuitter(){ $('finBox').innerHTML = `<h2>🚪 Quitter la course ?</h2><p>Les autres continuent sans toi.</p><div class="rang"><button class="btn" id="qReste">▶ Je reste</button><button class="btn gris" id="qPart">🚪 Quitter</button></div>`; montre('fin');
    $('qReste').onclick = () => montre('-'); $('qPart').onclick = () => { this.partir(); quitter(); }; }
  partir(){ if(!this.on) return; post({ action:'sync', code:this.S.code, client:this.S.client, since:this.since || 1, msgs:{ p:null, e:[{ k:'part' }] } }).catch(() => {}); this.stop(); this.S.code = null; this.S.room = null; this.S.status = 'menu'; }
  stop(){ this.on = false; }
  quitte(){ this.stop(); }
}

/* ---------- au démarrage ---------- */
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0); else menu();
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
window.__stage3 = { get G(){ return G; }, get etat(){ return etat; }, partie, C, K, get L(){ return L; }, Ligne };
