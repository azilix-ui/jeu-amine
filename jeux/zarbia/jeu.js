/* Zarbia : le dessin, les commandes, les menus, les records et la partie seule contre la machine.
   La logique est dans moteur.js (testée en Node), les joueurs de la machine dans bots.js, le jeu en ligne dans reseau.js. */
import { createMonde, ajoute, nait, pas, placeLibre, classement, elimine, N, CH, NCH, DT } from './moteur.js';
import { pense } from './bots.js';
import { Reseau } from './reseau.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const IMG = new URL('./img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };

/* ---------- les couleurs, les motifs, les personnages ---------- */
export const COULEURS = ['#c0392b', '#1f6fd8', '#2e9e6b', '#e0a21b', '#e8742a', '#7b4fb0', '#1fa3a8', '#d9466a', '#8e2441', '#2a3f9a', '#8a5a2b', '#6a8f2a', '#5f7d95', '#c2185b'];
const FAMILLE = { essil:'#2a3f9a', salma:'#2e9e6b', amine:'#7b4fb0', anis:'#1fa3a8', imen:'#d9466a' };
export const BOTS = [
  { id:'amsalah', n:'Am Salah' }, { id:'fatma', n:'Khalti Fatma' }, { id:'hedi', n:'Hédi' }, { id:'leila', n:'Leïla' }, { id:'bechir', n:'Béchir' },
  { id:'nour', n:'Rim' }, { id:'moncef', n:'Moncef' }, { id:'zohra', n:'Zohra' }, { id:'taher', n:'Taher' }, { id:'yasmine', n:'Fella' } ];
const MODES = { tranquille:{ bots:8, niveaux:['facile', 'facile', 'facile', 'facile', 'facile', 'normal', 'normal', 'normal'], but:25 },
                champion:{ bots:10, niveaux:['facile', 'normal', 'normal', 'normal', 'normal', 'normal', 'difficile', 'difficile', 'difficile', 'difficile'], but:75 } };

/* ---------- les images ---------- */
const IM = {}; const charge = src => IM[src] || (IM[src] = Object.assign(new Image(), { src, decoding:'async' }));
const pret = im => im && im.complete && im.naturalWidth > 0;
export const NMOTIFS = 11;   // 1 à 3 : tapis clairs teints ; 4 à 11 : vrais tapis de Kairouan en couleurs, dont on tourne les teintes
['sol'].concat(Array.from({ length:NMOTIFS }, (_, i) => 'zarbia' + (i + 1))).forEach(k => charge(IMG + k + '.webp'));
export function teteDe(nom, botId){
  if(botId) return IMG + 'bot-' + botId + '.webp';
  const k = String(nom || '').toLowerCase(); if(FAMILLE[k]) return AV + k + '.webp';
  const h = window.Famille && Famille.head ? Famille.head(nom) : null; return h ? h.img : null;
}

/* ---------- les sons (fabriqués par le navigateur) ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function ton(f, d, type = 'sine', v = .12, f2 = 0, t0 = 0){ const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const SON = {
  capture(n){ const k = Math.min(5, 1 + Math.floor(n / 80)); [523, 659, 784, 988, 1175].slice(0, k).forEach((f, i) => ton(f, .22, 'triangle', .11, 0, i * .07)); },
  coupe(){ ton(1800, .08, 'square', .06, 600); ton(900, .18, 'sawtooth', .05, 200, .05); },
  perdu(){ ton(440, .25, 'triangle', .12, 220); ton(330, .4, 'triangle', .1, 160, .2); },
  gagne(){ [523, 659, 784, 1047, 1319].forEach((f, i) => ton(f, .35, 'triangle', .12, 0, i * .11)); },
  tap(){ ton(660, .06, 'sine', .08); },
};

/* ---------- la sauvegarde ---------- */
let joueur = null, sv = null;
const cle = () => 'zarbia:' + joueur;
const neuf = () => ({ couleur:null, motif:4, best:{ champion:0, tranquille:0 }, parties:0, kills:0, t:0 });
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
async function setJoueur(n){
  joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {});
  if(!sv.couleur) sv.couleur = FAMILLE[n.toLowerCase()] || COULEURS[(n.length * 7) % COULEURS.length];
  mode = store.get('zarbia-mode', null) || (n.toLowerCase() === 'amine' ? 'tranquille' : 'champion');
  if(window.Famille && Famille.track){ Famille.track('zarbia', n, [cle()]); try{ const r = await Famille.load('zarbia', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu();
}
async function choisir(){
  if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui tisse ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n;
}

/* ---------- le menu ---------- */
let mode = 'champion';
function menu(){
  document.body.classList.remove('jeu'); montre('menu');
  const t = joueur ? teteDe(joueur) : null;
  $('who').innerHTML = joueur ? (t ? `<img src="${t}" alt="">` : '🙂') + esc(joueur) + (sv.best.champion || sv.best.tranquille ? ` · 🏆 ${fmt(Math.max(sv.best.champion, sv.best.tranquille))}` : '') : 'Qui joue ?';
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  const col = sv ? sv.couleur : COULEURS[0], mot = sv ? sv.motif : 1;
  $('couleurs').innerHTML = COULEURS.map(c => `<button data-c="${c}" class="${c === col ? 'on' : ''}" style="background:${c}" aria-label="couleur"></button>`).join('');
  $('motifs').innerHTML = Array.from({ length:NMOTIFS }, (_, i) => i + 1).map(k => `<button data-mo="${k}" class="${k === mot ? 'on' : ''}" style="background-image:url(${apercu(col, k)})" aria-label="motif ${k}"></button>`).join('');
  records();
}
const fmt = v => (Math.round(v * 10) / 10).toString().replace('.', ',') + ' %';
async function records(){
  for(const [m, el] of [['champion', 'recC'], ['tranquille', 'recT']]){
    const rows = window.Famille ? await Famille.highscores('zarbia', m, 8).catch(() => null) : null;
    $(el).innerHTML = rows && rows.length ? rows.map(r => `<li>${esc(r.player)} — <b>${fmt(r.score / 10)}</b></li>`).join('') : '<p class="none">Personne encore : à toi !</p>';
  }
}
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }

/* ---------- les tapis teints à la couleur de chacun ---------- */
const MOTIF_PX = 132;   // taille d'un motif dans l'espace des morceaux (6 px par case)
const teints = new Map();
function tapis(couleur, motif){
  const k = couleur + motif; if(teints.has(k)) return teints.get(k);
  const im = IM[IMG + 'zarbia' + motif + '.webp'], c = document.createElement('canvas'); c.width = c.height = MOTIF_PX; const x = c.getContext('2d');
  if(pret(im)){ x.drawImage(im, 0, 0, MOTIF_PX, MOTIF_PX);
    if(motif <= 3){ x.globalCompositeOperation = 'multiply'; x.fillStyle = couleur; x.fillRect(0, 0, MOTIF_PX, MOTIF_PX); x.globalCompositeOperation = 'source-over'; }
    else recolore(x, couleur);
    teints.set(k, c); }
  else { x.fillStyle = couleur; x.fillRect(0, 0, MOTIF_PX, MOTIF_PX); }
  return c;
}
/* un vrai tapis en couleurs : on tourne toutes ses teintes pour que sa couleur principale devienne celle du joueur
   (les autres couleurs du tapis suivent : il reste un vrai tapis à plusieurs couleurs), puis on le pousse un peu vers la couleur */
function hsl(r, g, b){ r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), l = (M + m) / 2, d = M - m; if(!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1)); let h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60 < 0 ? h * 60 + 360 : h * 60, s, l]; }
function rgb(h, s, l){ const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; }
function recolore(x, couleur){
  const id = x.getImageData(0, 0, MOTIF_PX, MOTIF_PX), d = id.data;
  const [ch, cs, cl] = hsl(parseInt(couleur.slice(1, 3), 16), parseInt(couleur.slice(3, 5), 16), parseInt(couleur.slice(5, 7), 16));
  let sx = 0, sy = 0; for(let i = 0; i < d.length; i += 16){ const [h, s, l] = hsl(d[i], d[i + 1], d[i + 2]), w = s * (1 - Math.abs(2 * l - 1)); sx += Math.cos(h * Math.PI / 180) * w; sy += Math.sin(h * Math.PI / 180) * w; }
  const dom = Math.atan2(sy, sx) * 180 / Math.PI, force = Math.hypot(sx, sy) / (d.length / 16);   // la couleur principale, et à quel point le tapis est coloré
  const pousse = force < .12 ? .55 : .3;   // un tapis presque sans couleur (laine naturelle) prend plus la couleur du joueur
  for(let i = 0; i < d.length; i += 4){ let [h, s, l] = hsl(d[i], d[i + 1], d[i + 2]); h = (h + ch - dom + 720) % 360; s = Math.min(1, s * .8 + cs * .25);
    const [r, g, b] = rgb(h, s, l); const t = pousse * (1 - Math.abs(2 * l - 1) * .6);
    const mr = d[i] / 255 * parseInt(couleur.slice(1, 3), 16) * 1.25, mg = d[i + 1] / 255 * parseInt(couleur.slice(3, 5), 16) * 1.25, mb = d[i + 2] / 255 * parseInt(couleur.slice(5, 7), 16) * 1.25;
    d[i] = r * (1 - t) + mr * t; d[i + 1] = g * (1 - t) + mg * t; d[i + 2] = b * (1 - t) + mb * t; }
  x.putImageData(id, 0, 0);
}
function apercu(couleur, motif){ const c = tapis(couleur, motif); try{ return c.toDataURL('image/jpeg', .7); }catch(e){ return ''; } }

/* ---------- la partie ---------- */
const cv = $('cv'), ctx = cv.getContext('2d'); let W = 0, H = 0, DPR = 1;
function taille(){ DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; }
addEventListener('resize', taille); taille();

let G = null;   // la partie en cours
export function nouvellePartie(opts){
  const M = createMonde({ tranquille:opts.mode === 'tranquille', seed:opts.seed || (Date.now() & 0xffff) });
  G = { M, mode:opts.mode, net:opts.net || null, moi:null, t0:performance.now(), acc:0, fini:false, pause:false, cam:{ x:N / 2, y:N / 2, z:1 }, chunks:[], fx:[], gagne:false, victoire:false, debut:performance.now() };
  for(let i = 0; i < NCH * NCH; i++) G.chunks.push(null);
  return G;
}
function joueurDe(M, info, x, y){ const p = ajoute(M, info); p.img = charge(info.tete || ''); if(x != null) nait(M, p, x, y); return p; }

function partieSolo(){
  ac(); const cfg = MODES[mode]; const g = nouvellePartie({ mode });
  const l = placeLibre(g.M); g.moi = joueurDe(g.M, { nom:joueur || 'Moi', couleur:sv ? sv.couleur : COULEURS[1], motif:sv ? sv.motif : 1, tete:teteDe(joueur), humain:true }, l.x, l.y);
  const pris = new Set([g.moi.couleur]); const ordre = [...BOTS].sort(() => Math.random() - .5);
  for(let i = 0; i < cfg.bots; i++){ const b = ordre[i % ordre.length], c = COULEURS.find(c => !pris.has(c)) || COULEURS[i % COULEURS.length]; pris.add(c);
    const l2 = placeLibre(g.M); joueurDe(g.M, { nom:b.n, couleur:c, motif:4 + Math.floor(Math.random() * (NMOTIFS - 3)), tete:teteDe(null, b.id), bot:b.id, niveau:cfg.niveaux[i] }, l2.x, l2.y); }
  demarre();
}
export function demarre(){
  montre('-'); document.body.classList.add('jeu'); $('modal').classList.remove('on'); $('aide').style.opacity = 1; setTimeout(() => { $('aide').style.opacity = 0; }, 6000);
  G.cam.x = G.moi.x; G.cam.y = G.moi.y; G.moi.vise = G.moi.a = Math.random() * 6.28; last = performance.now();
  if(!raf) raf = requestAnimationFrame(boucle);
}

/* ---------- la boucle : simulation à pas fixe, dessin à chaque image ---------- */
let raf = 0, last = 0, botT = 0, carteT = 0;
function boucle(t){
  raf = requestAnimationFrame(boucle);
  if(!G){ return; }
  let dt = Math.min(.1, (t - last) / 1000); last = t;
  if(!G.pause && !G.fini){
    commandes();
    G.acc += dt;
    while(G.acc >= DT){ G.acc -= DT;
      const M = G.M;
      for(const p of M.joueurs){ if(p && (p.bot || (window.__pilote && p === G.moi)) && p.vivant && p.local !== false) pense(M, p, DT); }
      if(G.net) G.net.avant(DT);
      pas(M, DT);
      evenements();
      if(G.net) G.net.apres(DT);
      renaissances();
    }
  }
  dessine(dt);
  if(t - carteT > 400){ carteT = t; miniCarte(); hud(); }
}
function renaissances(){
  const M = G.M;
  for(const p of M.joueurs){ if(!p || p.vivant || p.local === false || p.libre) continue;
    if(p === G.moi){ if(G.mode === 'tranquille' && M.t - p.mort > 2.2 && !G.fini){ const l = placeLibre(M); nait(M, p, l.x, l.y); p.vise = p.a; message('C\'est reparti ! 🧶'); if(G.net) G.net.nait(p); } continue; }
    if(p.bot && M.t - p.mort > 3){ const l = placeLibre(M); nait(M, p, l.x, l.y); p.ia = null; if(G.net) G.net.nait(p); }
  }
}
function evenements(){
  const M = G.M;
  for(const e of M.events){
    if(e.k === 'capture'){ const p = M.joueurs[e.id]; if(G.net && p.local !== false) G.net.capture(p, e.cells);
      if(p === G.moi && e.gain > 0){ SON.capture(e.gain); G.fx.push({ k:'txt', x:p.x, y:p.y - 2, t:0, txt:'+' + fmt(e.gain * 100 / (N * N)), c:'#fff' }); }
    }
    if(e.k === 'mort'){ const p = M.joueurs[e.id]; if(G.net) G.net.mort(p, e.par);
      G.fx.push({ k:'pouf', x:p.x, y:p.y, t:0, c:p.couleur });
      if(e.par === G.moi.id && p !== G.moi){ SON.coupe(); message('✂️ Tu as coupé le fil de ' + p.nom + ' !'); }
      if(p === G.moi){ SON.perdu(); const q = M.joueurs[e.par];
        if(G.mode === 'tranquille') message(e.par === p.id ? 'Oups, ton propre fil !' : q ? q.nom + ' a coupé ton fil… on recommence !' : 'Ta zarbia est défaite… on recommence !');
        else if(G.net) G.net.moiMort(e.par === p.id ? 'Tu as croisé ton propre fil' : q ? q.nom + ' a coupé ton fil' : 'Ta zarbia a été prise');
        else fin(e.par === p.id ? 'Tu as croisé ton propre fil.' : q ? q.nom + ' a coupé ton fil.' : 'Ta zarbia a été prise.'); }
    }
  }
  M.events.length = 0;
  // le but du mode
  const moi = G.moi; if(!G.net && !G.victoire && moi.vivant && moi.score >= MODES[G.mode].but){ G.victoire = true; SON.gagne(); if(G.mode === 'tranquille'){ message('🎉 25 % ! Tu as gagné ! Continue si tu veux !', 4000); enregistre(); } else fin('Tu as conquis 75 % du terrain !', true); }
}

/* ---------- les commandes ---------- */
const keys = new Set(); let doigt = null, souris = null, dernier = 'souris';
addEventListener('keydown', e => { if(!G || G.fini) return; const k = e.key.toLowerCase();
  if(k === 'escape' || k === 'p'){ togglePause(); return; }
  if(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'q', 'a', 'd', 'z', 'w', 's'].includes(k)){ keys.add(k); dernier = 'clavier'; e.preventDefault(); } });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
cv.addEventListener('pointerdown', e => { ac(); if(!G || G.fini) return; if(e.pointerType === 'mouse'){ souris = [e.clientX, e.clientY]; dernier = 'souris'; return; }
  doigt = { id:e.pointerId, x0:e.clientX, y0:e.clientY, x:e.clientX, y:e.clientY }; dernier = 'doigt'; const j = $('joy'); j.style.display = 'block'; j.style.left = e.clientX + 'px'; j.style.top = e.clientY + 'px'; j.firstChild.style.transform = ''; });
addEventListener('pointermove', e => { if(e.pointerType === 'mouse'){ souris = [e.clientX, e.clientY]; if(dernier !== 'clavier' || !keys.size) dernier = 'souris'; return; }
  if(doigt && e.pointerId === doigt.id){ doigt.x = e.clientX; doigt.y = e.clientY; const dx = doigt.x - doigt.x0, dy = doigt.y - doigt.y0, d = Math.hypot(dx, dy), k = Math.min(1, 40 / (d || 1)); $('joy').firstChild.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    if(d > 60){ doigt.x0 = doigt.x - dx / d * 60; doigt.y0 = doigt.y - dy / d * 60; const j = $('joy'); j.style.left = doigt.x0 + 'px'; j.style.top = doigt.y0 + 'px'; } } });
const lache = e => { if(doigt && e.pointerId === doigt.id){ doigt = null; $('joy').style.display = 'none'; } };
addEventListener('pointerup', lache); addEventListener('pointercancel', lache);
function commandes(){
  if(window.__pilote) return;
  const p = G.moi; if(!p || !p.vivant) return;
  if(dernier === 'clavier' && keys.size){ let x = 0, y = 0; if(keys.has('arrowleft') || keys.has('q') || keys.has('a')) x--; if(keys.has('arrowright') || keys.has('d')) x++; if(keys.has('arrowup') || keys.has('z') || keys.has('w')) y--; if(keys.has('arrowdown') || keys.has('s')) y++; if(x || y) p.vise = Math.atan2(y, x); }
  else if(dernier === 'doigt' && doigt){ const dx = doigt.x - doigt.x0, dy = doigt.y - doigt.y0; if(Math.hypot(dx, dy) > 8) p.vise = Math.atan2(dy, dx); }
  else if(dernier === 'souris' && souris){ const [sx, sy] = ecran(p.x, p.y); const dx = souris[0] - sx, dy = souris[1] - sy; if(Math.hypot(dx, dy) > 10) p.vise = Math.atan2(dy, dx); }
}
document.addEventListener('visibilitychange', () => { if(document.hidden && G && !G.fini && !G.net) { G.pause = true; pauseFenetre(); } });
$('pause').onclick = () => togglePause();
function togglePause(){ if(!G || G.fini) return; if(G.net){ message('En ligne, on ne peut pas mettre en pause 🙂'); return; } G.pause = !G.pause; if(G.pause) pauseFenetre(); else $('modal').classList.remove('on'); }
function pauseFenetre(){ modal(`<h2>⏸ Pause</h2><p>Ta zarbia : <b>${fmt(G.moi.score)}</b></p><div class="rang"><button class="pill go" id="mRep">▶ Continuer</button><button class="pill" id="mQuit">🏠 Menu</button></div>`);
  $('mRep').onclick = () => { G.pause = false; $('modal').classList.remove('on'); last = performance.now(); }; $('mQuit').onclick = () => { quitter(); }; }
function quitter(){ if(G && !G.fini && !G.net) enregistre(); if(G && G.net) G.net.quitte(); G = null; $('modal').classList.remove('on'); document.body.classList.remove('jeu'); ctx.clearRect(0, 0, cv.width, cv.height); menu(); }
function modal(h){ const m = $('modal'); m.innerHTML = `<div class="carte">${h}</div>`; m.classList.add('on'); }
let msgT = null; function message(t, d = 2400){ const m = $('msg'); m.textContent = t; m.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), d); }

/* ---------- la fin ---------- */
async function enregistre(){
  if(!joueur || !G || G.enregistre) return null; G.enregistre = true;
  const best = G.moi.meilleur; sv.parties++; sv.kills += G.moi.kills; const record = best > (sv.best[G.mode] || 0); if(record) sv.best[G.mode] = best; sauve();
  let r = null; if(window.Famille && best > 0){ try{ r = await Famille.score('zarbia', G.mode, Math.round(best * 10), joueur); }catch(e){} }
  return { record, r };
}
async function fin(pourquoi, victoire){
  if(G.fini) return; G.fini = true; const moi = G.moi, duree = (performance.now() - G.debut) / 1000;
  const res = await enregistre();
  const rang = res && res.r && res.r.rank ? `<span>Classement</span><b>${res.r.rank}<sup>${res.r.rank === 1 ? 'er' : 'e'}</sup></b>` : '';
  modal(`<div style="font-size:64px">${victoire ? '🏆' : '🧶'}</div><h2>${victoire ? 'Victoire !' : 'Fin de la partie'}</h2><p style="margin:0">${esc(pourquoi)}</p>
    <div class="res"><span>Ta plus grande zarbia</span><b>${fmt(moi.meilleur)}</b><span>Fils coupés</span><b>${moi.kills}</b><span>Durée</span><b>${Math.floor(duree / 60)}:${String(Math.floor(duree % 60)).padStart(2, '0')}</b>${rang}</div>
    ${res && res.record ? '<p style="margin:0;font-weight:800;color:#2e9e6b">⭐ Nouveau record !</p>' : ''}
    <div class="rang">${G.net ? '' : '<button class="pill go" id="mRe">🔁 Rejouer</button>'}<button class="pill" id="mMenu">🏠 Menu</button></div>`);
  if($('mRe')) $('mRe').onclick = () => { $('modal').classList.remove('on'); partieSolo(); };
  $('mMenu').onclick = () => quitter();
}

/* ---------- le dessin ---------- */
const CP = 8;   // pixels par case dans les morceaux
let S = 10;     // pixels (CSS) par case à l'écran
function ecran(x, y){ return [(x - G.cam.x) * S + W / 2, (y - G.cam.y) * S + H / 2]; }
const lay = document.createElement('canvas'); lay.width = lay.height = (CH + 2) * CP; const lctx = lay.getContext('2d');
const LW = (CH + 2) * CP, layData = lctx.createImageData(LW, LW), V = new Float32Array((CH + 2) * (CH + 2));
// le contour d'une zarbia : les cases sont lissées (bilinéaire) puis coupées net à mi-hauteur → des bords arrondis et francs
const SM = new Uint8Array(256); for(let i = 0; i < 256; i++){ const v = i / 255, t = Math.max(0, Math.min(1, (v - .38) / .24)); SM[i] = Math.round(t * t * (3 - 2 * t) * 255); }
function refaitMorceau(i){
  const M = G.M, cx = i % NCH, cy = (i / NCH) | 0, x0 = cx * CH - 1, y0 = cy * CH - 1, O = M.owner;
  let c = G.chunks[i]; if(!c){ c = document.createElement('canvas'); c.width = c.height = CH * CP; G.chunks[i] = c; }
  const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
  const ids = new Set(); for(let y = Math.max(0, y0); y < Math.min(N, y0 + CH + 2); y++) for(let x = Math.max(0, x0); x < Math.min(N, x0 + CH + 2); x++){ const o = O[y * N + x]; if(o) ids.add(o); }
  if(!ids.size){ c.vide = true; return; } c.vide = false;
  for(const id of ids){ const p = M.joueurs[id]; if(!p) continue;
    const C2 = CH + 2; V.fill(0);
    for(let j = 0; j < C2; j++){ const y = y0 + j; if(y < 0 || y >= N) continue; for(let k = 0; k < C2; k++){ const x = x0 + k; if(x < 0 || x >= N) continue; if(O[y * N + x] === id) V[j * C2 + k] = 1; } }
    const d = layData.data;
    for(let py = 0; py < LW; py++){ const fy = (py + .5) / CP - .5, j = Math.max(0, Math.min(C2 - 2, Math.floor(fy))), ty = Math.max(0, Math.min(1, fy - j));
      for(let px = 0; px < LW; px++){ const fx = (px + .5) / CP - .5, k = Math.max(0, Math.min(C2 - 2, Math.floor(fx))), tx = Math.max(0, Math.min(1, fx - k)), b = j * C2 + k;
        const v = (V[b] * (1 - tx) + V[b + 1] * tx) * (1 - ty) + (V[b + C2] * (1 - tx) + V[b + C2 + 1] * tx) * ty;
        d[(py * LW + px) * 4 + 3] = SM[(v * 255) | 0]; } }
    lctx.globalCompositeOperation = 'source-over'; lctx.putImageData(layData, 0, 0);
    // le motif, aligné sur le terrain (il continue d'un morceau à l'autre)
    lctx.globalCompositeOperation = 'source-in'; const pat = lctx.createPattern(tapis(p.couleur, p.motif || 1), 'repeat');
    pat.setTransform(new DOMMatrix().translate(-(x0 * CP) % MOTIF_PX, -(y0 * CP) % MOTIF_PX)); lctx.fillStyle = pat; lctx.fillRect(0, 0, lay.width, lay.height);
    g.save(); g.shadowColor = 'rgba(60,30,10,.45)'; g.shadowBlur = 4; g.shadowOffsetY = 2; g.drawImage(lay, -CP, -CP); g.restore();
  }
}
function dessine(dt){
  const M = G.M, moi = G.moi;
  // la caméra suit le joueur, et recule un peu quand la zarbia grandit
  const chef = !moi.vivant && G.net ? classement(M)[0] : null;
  const cible = moi.vivant ? [moi.x, moi.y] : chef ? [chef.x, chef.y] : [G.cam.x, G.cam.y];
  G.cam.x += (cible[0] - G.cam.x) * Math.min(1, dt * 6); G.cam.y += (cible[1] - G.cam.y) * Math.min(1, dt * 6);
  const vue = (W < H ? 74 : 92) + Math.min(40, moi.score * 1.2); S += (Math.max(W, H) / vue - S) * Math.min(1, dt * 2);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  // le dehors (les murs de la cour) puis la terre
  ctx.fillStyle = '#8c6a44'; ctx.fillRect(0, 0, W, H);
  const [ox, oy] = ecran(0, 0), L = N * S;
  const sol = IM[IMG + 'sol.webp'];
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, L, L); ctx.clip();
  if(pret(sol)){ const pat = ctx.createPattern(sol, 'repeat'), k = 26 * S / sol.naturalWidth; pat.setTransform(new DOMMatrix().translate(ox, oy).scale(k)); ctx.fillStyle = pat; } else ctx.fillStyle = '#d8b98a';
  ctx.fillRect(ox, oy, L, L);
  // les morceaux de zarbia visibles
  const x0 = Math.max(0, Math.floor((G.cam.x - W / 2 / S) / CH)), x1 = Math.min(NCH - 1, Math.floor((G.cam.x + W / 2 / S) / CH)), y0 = Math.max(0, Math.floor((G.cam.y - H / 2 / S) / CH)), y1 = Math.min(NCH - 1, Math.floor((G.cam.y + H / 2 / S) / CH));
  let refaits = 0;
  for(let cy = y0; cy <= y1; cy++) for(let cx = x0; cx <= x1; cx++){ const i = cy * NCH + cx; if(M.dirty[i] && refaits < 8){ M.dirty[i] = 0; refaitMorceau(i); refaits++; } const c = G.chunks[i]; if(c && !c.vide){ const [sx, sy] = ecran(cx * CH, cy * CH); ctx.drawImage(c, sx, sy, CH * S + .5, CH * S + .5); } }
  ctx.restore();
  // le mur de la cour
  ctx.strokeStyle = '#f4ead8'; ctx.lineWidth = Math.max(4, S * .8); ctx.strokeRect(ox - ctx.lineWidth / 2, oy - ctx.lineWidth / 2, L + ctx.lineWidth, L + ctx.lineWidth);
  // les fils de laine
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for(const p of M.joueurs){ if(!p || !p.vivant || !p.trace.length) continue;
    ctx.beginPath(); let prem = true;
    for(let i = 0; i < p.trace.length; i++){ const c = p.trace[i]; const [sx, sy] = ecran(c % N + .5, ((c / N) | 0) + .5); if(prem){ ctx.moveTo(sx, sy); prem = false; } else ctx.lineTo(sx, sy); }
    const [hx, hy] = ecran(p.x, p.y); ctx.lineTo(hx, hy);
    ctx.strokeStyle = 'rgba(40,20,10,.35)'; ctx.lineWidth = S * .95; ctx.stroke();
    ctx.strokeStyle = p.couleur; ctx.lineWidth = S * .7; ctx.stroke();
    ctx.setLineDash([S * .35, S * .45]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = S * .22; ctx.stroke(); ctx.setLineDash([]);
  }
  // les joueurs : une pelote à leur couleur, et leur tête
  for(const p of M.joueurs){ if(!p || !p.vivant) continue; const [sx, sy] = ecran(p.x, p.y); if(sx < -60 || sy < -60 || sx > W + 60 || sy > H + 60) continue;
    const r = S * 1.5;
    ctx.save(); ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(40,20,10,.3)'; ctx.beginPath(); ctx.ellipse(0, r * .9, r * .9, r * .35, 0, 0, 6.29); ctx.fill();
    // la petite flèche de direction
    ctx.save(); ctx.rotate(p.a); ctx.fillStyle = p.couleur; ctx.beginPath(); ctx.moveTo(r * 1.65, 0); ctx.lineTo(r * 1.05, -r * .45); ctx.lineTo(r * 1.05, r * .45); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.fillStyle = p.couleur; ctx.fill();
    if(pret(p.img)){ ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * .84, 0, 6.29); ctx.clip(); const im = p.img, s = Math.min(im.naturalWidth, im.naturalHeight); ctx.drawImage(im, (im.naturalWidth - s) / 2, 0, s, s, -r * .84, -r * .84, r * 1.68, r * 1.68); ctx.restore(); }
    else { ctx.fillStyle = '#fff'; ctx.font = `800 ${r}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText((p.nom || '?')[0], 0, 1); }
    ctx.lineWidth = Math.max(2, S * .18); ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.29); ctx.stroke();
    // le prénom
    ctx.font = `800 ${Math.max(12, S * 1.05)}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,20,10,.6)'; ctx.strokeText(p.nom, 0, -r - 4); ctx.fillStyle = '#fff'; ctx.fillText(p.nom, 0, -r - 4);
    ctx.restore();
  }
  // les effets
  for(let i = G.fx.length - 1; i >= 0; i--){ const f = G.fx[i]; f.t += dt; const [sx, sy] = ecran(f.x, f.y);
    if(f.k === 'txt'){ ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4); ctx.font = `800 ${Math.max(18, S * 2)}px 'Baloo 2', Nunito`; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(40,20,10,.7)'; ctx.strokeText(f.txt, sx, sy - f.t * 40); ctx.fillStyle = f.c; ctx.fillText(f.txt, sx, sy - f.t * 40); ctx.globalAlpha = 1; if(f.t > 1.4) G.fx.splice(i, 1); }
    else if(f.k === 'pouf'){ ctx.globalAlpha = Math.max(0, 1 - f.t / .8); for(let k = 0; k < 10; k++){ const a = k * .628, d = f.t * S * 9; ctx.fillStyle = f.c; ctx.beginPath(); ctx.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d, S * .5, 0, 6.29); ctx.fill(); } ctx.globalAlpha = 1; if(f.t > .8) G.fx.splice(i, 1); }
  }
}
function miniCarte(){
  if(!G) return; const c = $('carte'), g = c.getContext('2d'), M = G.M, k = N / 120;
  const im = g.createImageData(120, 120), d = im.data, rgb = {};
  M.joueurs.forEach(p => { if(p){ const h = p.couleur; rgb[p.id] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; } });
  for(let y = 0; y < 120; y++) for(let x = 0; x < 120; x++){ const o = M.owner[Math.floor(y * k) * N + Math.floor(x * k)], i = (y * 120 + x) * 4; if(o && rgb[o]){ d[i] = rgb[o][0]; d[i + 1] = rgb[o][1]; d[i + 2] = rgb[o][2]; d[i + 3] = 255; } else { d[i] = 201; d[i + 1] = 166; d[i + 2] = 116; d[i + 3] = 255; } }
  g.putImageData(im, 0, 0);
  for(const p of M.joueurs){ if(!p || !p.vivant) continue; g.fillStyle = p === G.moi ? '#fff' : 'rgba(40,20,10,.7)'; g.beginPath(); g.arc(p.x / k, p.y / k, p === G.moi ? 3.5 : 2, 0, 6.29); g.fill(); }
}
function hud(){
  if(!G) return; const moi = G.moi, s = G.net && G.net.finT ? Math.max(0, (G.net.finT - performance.now()) / 1000) : (performance.now() - G.debut) / 1000;
  $('temps').nextElementSibling.textContent = G.net ? 'il reste' : 'temps';
  $('pct').textContent = fmt(moi.score); $('temps').textContent = Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); $('kills').textContent = moi.kills;
  const cl = classement(G.M), top = cl.slice(0, 5); if(moi.vivant && !top.includes(moi)) top.push(moi);
  $('top').innerHTML = top.map(p => `<div class="${p === moi ? 'moi' : ''}"><i style="background:${p.couleur}"></i>${cl.indexOf(p) + 1}. ${esc(p.nom)}<b>${fmt(p.score)}</b></div>`).join('');
}

/* ---------- les boutons du menu ---------- */
$('who').onclick = () => choisir();
document.querySelectorAll('.mode').forEach(b => b.onclick = () => { mode = b.dataset.m; store.set('zarbia-mode', mode); SON.tap(); menu(); });
$('couleurs').onclick = e => { const b = e.target.closest('[data-c]'); if(!b || !sv) return; sv.couleur = b.dataset.c; sauve(); SON.tap(); menu(); };
$('motifs').onclick = e => { const b = e.target.closest('[data-mo]'); if(!b || !sv) return; sv.motif = +b.dataset.mo; sauve(); SON.tap(); menu(); };
$('jouer').onclick = async () => { if(!joueur && !(await choisir())) return; partieSolo(); };
$('ensemble').onclick = async () => { if(!joueur && !(await choisir())) return; reseau().ouvreSalon(); };
let R = null; const reseau = () => R || (R = new Reseau({ joueur:() => joueur, sv:() => sv, tete:teteDe, montre, nouvellePartie, demarre, joueurDe, charge, menu, message, fin:(t, v) => fin(t, v), G:() => G, SON, modal, quitter }));

// au démarrage : les tapis teints dès que les images sont là, puis le joueur de cet appareil
Promise.all(Array.from({ length:NMOTIFS }, (_, i) => 'zarbia' + (i + 1)).map(k => new Promise(r => { const im = IM[IMG + k + '.webp']; if(pret(im)) r(); else { im.onload = r; im.onerror = r; } }))).then(() => { teints.clear(); menu(); });
sv = neuf(); menu();
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0);
window.__zarbia = { get G(){ return G; }, partieSolo, quitter, fin, get joueur(){ return joueur; } };
