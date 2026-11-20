/* Serpent Légendes · l'Arène : le dessin, les commandes, les menus, les skins, les missions et la partie contre la machine.
   Les règles sont dans moteur.js (testé en Node : docs/arene/test-moteur.mjs), la machine dans ia.js, le jeu en ligne dans reseau.js. */
import { CFG, nouvelleArene, nouveauSerpent, placeSure, renait, pas, rayon, classement } from './moteur.js';
import { pensent } from './ia.js';
import { Reseau } from './reseau.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const IMG = new URL('./img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };

/* ---------- les têtes, les corps, les missions ---------- */
// m : la mission qui ouvre la tête (sans m : libre dès le début)
export const TETES = [
  { id:'fennec', n:'Fennec du Sahara', p:'fennec' }, { id:'chameau', n:'Chameau de Douz', p:'chameau' }, { id:'chat', n:'Chat de la médina', p:'chat' },
  { id:'chatnoir', n:'Chat noir', p:'chatnoir' }, { id:'chevre', n:'Chèvre de Zaghouan', p:'chevre' }, { id:'herisson', n:'Hérisson', p:'herisson' },
  { id:'abeille', n:'Abeille du thym', p:'abeille' }, { id:'poisson', n:'Poisson de Djerba', p:'poisson' },
  { id:'lion', n:'Lion de l\'Atlas', p:'lion', m:{ k:'parties', n:10, t:'Joue 10 parties' } },
  { id:'flamant', n:'Flamant de Tunis', p:'flamant', m:{ k:'perles', n:1000, t:'Mange 1 000 perles en tout' } },
  { id:'poulpe', n:'Poulpe de Kerkennah', p:'poulpe', m:{ k:'killsMax', n:3, t:'Fais tomber 3 serpents dans la même partie' } },
  { id:'guepard', n:'Guépard', p:'guepard', m:{ k:'survie', n:300, t:'Reste en vie 5 minutes d\'affilée' } },
  { id:'hibou', n:'Hibou de Kairouan', p:'hibou', m:{ k:'best', n:1000, t:'Atteins une longueur de 1 000' } },
  { id:'dragon', n:'Dragon bleu', p:'dragon', m:{ k:'kills', n:20, t:'Fais tomber 20 serpents en tout' } },
  { id:'zebre', n:'Tigre blanc', p:'zebre', m:{ k:'best', n:2500, t:'Atteins une longueur de 2 500' } },
];
// les têtes de la famille (les portraits « en vrai » du Jasmin), pour tout le monde
const FAM = [['essil', 'Essil'], ['salma', 'Salma'], ['amine', 'Amine'], ['anis', 'Papa Anis'], ['imen', 'Maman Imen']];
FAM.forEach(([id, n]) => TETES.push({ id:'f-' + id, n, p:id, famille:true }));
export const PEAUX = ['fennec', 'chameau', 'chat', 'chatnoir', 'chevre', 'herisson', 'abeille', 'poisson', 'lion', 'flamant', 'poulpe', 'guepard', 'hibou', 'dragon', 'zebre',
  'zellige', 'jasmin', 'harissa', 'essil', 'salma', 'amine', 'anis', 'imen'];
const NOMS_PEAUX = { zellige:'Zellige', jasmin:'Jasmin', harissa:'Harissa', essil:'Nuit étoilée', salma:'Jardin', amine:'Lune', anis:'Mer', imen:'Fleurs', zebre:'Rayures', dragon:'Écailles' };
const COUL_PERLES = ['#ff5a5a', '#ffb02e', '#ffe14d', '#59d96b', '#3fc7ff', '#6b7bff', '#d66bff', '#ff7ad1'];
const BOTS = ['Am Salah', 'Khalti Fatma', 'Hédi', 'Leïla', 'Béchir', 'Rim', 'Moncef', 'Zohra', 'Taher', 'Fella', 'Slim', 'Najet', 'Habib', 'Sonia', 'Kamel', 'Hela',
  'Ridha', 'Mongia', 'Lotfi', 'Wafa', 'Chokri', 'Samia', 'Fethi', 'Dorra', 'Nabil', 'Aziza', 'Mourad', 'Jamila'];
const MODES = { tranquille:{ bots:14, niveaux:['facile'], masse:[0, 150] }, champion:{ bots:25, niveaux:['facile', 'normal', 'normal', 'difficile', 'difficile'], masse:[0, 900] } };

/* ---------- les images ---------- */
const IM = {}; export const charge = src => IM[src] || (IM[src] = Object.assign(new Image(), { src, decoding:'async' }));
const pret = im => im && im.complete && im.naturalWidth > 0;
export const srcTete = id => id.startsWith('f-') ? AV + 'reel/' + id.slice(2) + '.webp' : IMG + 'tete_' + id + '.webp';
const srcPeau = id => IMG + 'peau_' + id + '.webp';
charge(IMG + 'sol.webp');

/* chaque morceau du corps est un disque texturé et ombré, fabriqué une fois par corps (3 variantes pour ne pas voir la répétition) */
const DISQ = new Map(), DT = 96;
function disques(peau){
  if(DISQ.has(peau)) return DISQ.get(peau);
  const im = charge(srcPeau(peau)); if(!pret(im)) return null;
  const l = [];
  for(let v = 0; v < 3; v++){ const c = document.createElement('canvas'); c.width = c.height = DT; const x = c.getContext('2d'), r = DT / 2;
    x.save(); x.beginPath(); x.arc(r, r, r - 2, 0, 6.29); x.clip();
    const s = im.naturalWidth * .45; x.drawImage(im, (v * .29) * im.naturalWidth, (v * .23) * im.naturalHeight, s, s, 0, 0, DT, DT);
    let g = x.createRadialGradient(r * .7, r * .6, r * .1, r, r, r); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.45, 'rgba(255,255,255,0)'); g.addColorStop(.85, 'rgba(0,0,0,.25)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    x.fillStyle = g; x.fillRect(0, 0, DT, DT); x.restore();
    l.push(c); }
  DISQ.set(peau, l); return l;
}
// les perles : une petite lumière par couleur
const PERLE = COUL_PERLES.map(c => { const k = document.createElement('canvas'); k.width = k.height = 48; const x = k.getContext('2d');
  let g = x.createRadialGradient(24, 24, 2, 24, 24, 24); g.addColorStop(0, c + 'cc'); g.addColorStop(.4, c + '55'); g.addColorStop(1, c + '00'); x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  g = x.createRadialGradient(20, 20, 1, 24, 24, 9); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, c); g.addColorStop(1, c); x.fillStyle = g; x.beginPath(); x.arc(24, 24, 9, 0, 6.29); x.fill(); return k; });

/* ---------- les sons : bruitages ElevenLabs du site (Zarbia, Koora, Kassar), sinon fabriqués par le navigateur ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function ton(f, d, type = 'sine', v = .1, f2 = 0, t0 = 0){ const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const BRUIT = {};
function chargeSons(jeu, garde){ const u = new URL('../' + jeu + '/son.php', import.meta.url).href;
  fetch(u + '?liste=1').then(r => r.json()).then(async l => { const a = ac(); if(!a) return; const par = {};
    l.forEach(n => { const k = n.slice(0, -1); if(garde[k]) (par[k] = par[k] || []).push(n); });
    for(const k in par){ const n = par[k][Math.floor(Math.random() * par[k].length)];
      try{ const b = await fetch(u + '?n=' + n).then(r => r.arrayBuffer()); BRUIT[garde[k]] = await new Promise((ok, ko) => a.decodeAudioData(b, ok, ko)); }catch(e){} } }).catch(() => {}); }
let sonsCharges = false;
function sons(){ if(sonsCharges) return; sonsCharges = true;
  chargeSons('zarbia', { coupe:'tombe', perdu:'perdu', victoire:'victoire', nait:'nait', invite:'invite', tap:'tap', grande:'grand' });
  chargeSons('koora', { plus:'miam', fusion:'gros' }); chargeSons('kassar', { bonus:'bonus', tir:'boost' }); }
function bruit(k, v = .8, vitesse = 1, max = 3){ const a = ac(), b = BRUIT[k]; if(!a || !b) return false; const s = a.createBufferSource(), g = a.createGain(), t = a.currentTime, m = Math.min(b.duration / vitesse, max);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0, m - .2)); g.gain.linearRampToValueAtTime(0, t + m); s.buffer = b; s.playbackRate.value = vitesse; s.connect(g); g.connect(a.destination); s.start(t); s.stop(t + m + .05); return true; }
let miamT = 0, miamN = 0;
export const SON = {
  miam(gros){ const t = performance.now(); if(t - miamT < 110) return; miamT = t; miamN = (miamN + 1) % 6; if(bruit(gros ? 'gros' : 'miam', gros ? .4 : .22, 1 + miamN * .05, .5)) return; ton(700 + miamN * 60, .07, 'sine', .05); },
  tombe(){ if(bruit('tombe', .9, 1, 1.2)) return; ton(1600, .1, 'square', .05, 500); },
  perdu(){ if(bruit('perdu', .8, 1, 2.4)) return; ton(440, .25, 'triangle', .12, 220); ton(330, .4, 'triangle', .1, 160, .2); },
  gagne(){ if(bruit('victoire', .8)) return; [523, 659, 784, 1047, 1319].forEach((f, i) => ton(f, .35, 'triangle', .12, 0, i * .11)); },
  bonus(){ if(bruit('bonus', .7, 1, 2)) return; [784, 988, 1319].forEach((f, i) => ton(f, .25, 'triangle', .1, 0, i * .09)); },
  nait(){ bruit('nait', .6, 1, 1.1); },
  boost(){ if(bruit('boost', .35, 1.3, .6)) return; ton(220, .25, 'sawtooth', .03, 520); },
  invite(){ if(bruit('invite', .8, 1, 2.2)) return; ton(880, .2, 'sine', .1); ton(660, .3, 'sine', .1, 0, .2); },
  tap(){ if(bruit('tap', .6, 1, .4)) return; ton(660, .06, 'sine', .08); },
};

/* ---------- le commentaire (en arabe par défaut, en français, ou coupé) : la voix passe par ElevenLabs (explorateur.js) ---------- */
let langue = store.get('arene-langue', 'ar');
const PHRASES = {
  go:['C\'est parti ! Mange les perles !', 'يا الله! كُلِ اللَّآلِئَ!'], tombe:['Bravo ! Tu as fait tomber {n} !', 'بْرَافُو! أَسْقَطْتَ {n}!'],
  perdu:['Oh non ! On repart !', 'أُوه! نُعَاوِدُو مِنْ جْدِيدْ!'], record:['Nouveau record !', 'رَقْمٌ قِيَاسِيٌّ جَدِيدٌ!'],
  premier:['Tu es le plus grand serpent de l\'arène !', 'أَنْتَ أَكْبَرُ ثُعْبَانٍ فِي السَّاحَةِ!'], fin:['C\'est fini ! Bravo !', 'اِنْتَهَتِ اللُّعْبَةُ! بْرَافُو!'],
  tete:['Nouvelle tête : {n} !', 'رَأْسٌ جَدِيدٌ: {n}!'] };
let parleT = 0;
function dit(k, n = '', fort = false){ if(langue === 'off') return; const t = performance.now(); if(!fort && t - parleT < 2500) return; parleT = t;
  try{ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const [fr, ar] = PHRASES[k]; const u = new SpeechSynthesisUtterance((langue === 'ar' ? ar : fr).replace('{n}', n)); u.lang = langue === 'ar' ? 'ar' : 'fr-FR'; speechSynthesis.speak(u); }catch(e){} }
function boutonLangue(){ $('langue').textContent = langue === 'ar' ? '🗣️ العربية' : langue === 'fr' ? '🗣️ Français' : '🔇 Sans voix'; }

/* ---------- la sauvegarde ---------- */
let joueur = null, sv = null, mode = 'tranquille';
const cle = () => 'arene:' + joueur;
const neuf = () => ({ tete:'fennec', peau:'fennec', best:{ champion:0, tranquille:0 }, bestAll:0, parties:0, kills:0, killsMax:0, perles:0, survie:0, ouvertes:[], t:0 });
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
const FAMILLE = ['essil', 'salma', 'amine', 'anis', 'imen'];
async function setJoueur(n){
  joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {});
  const k = n.toLowerCase(); if(!store.get(cle(), null) && FAMILLE.includes(k)){ sv.tete = 'f-' + k; sv.peau = k; }
  mode = store.get('arene-mode', null) || (k === 'amine' ? 'tranquille' : 'champion');
  if(window.Famille && Famille.track){ Famille.track('arene', n, [cle()]); try{ const r = await Famille.load('arene', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu();
}
async function choisir(){
  if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n;
}
const valeur = (m) => m.k === 'best' ? sv.bestAll : (sv[m.k] || 0);
export const ouverte = t => !t.m || (sv && (sv.ouvertes || []).includes(t.id));
// après chaque partie : les missions réussies ouvrent leur tête
function verifieMissions(){ const nv = []; for(const t of TETES){ if(!t.m || sv.ouvertes.includes(t.id)) continue; if(valeur(t.m) >= t.m.n){ sv.ouvertes.push(t.id); nv.push(t); } } if(nv.length) sauve(); return nv; }

/* ---------- le menu ---------- */
function menu(){
  document.body.classList.remove('jeu'); montre('menu'); boutonLangue();
  $('who').innerHTML = joueur ? `<img src="${srcTete(sv.tete)}" alt="" style="object-fit:contain">` + esc(joueur) + (sv.bestAll ? ` · 🏆 ${sv.bestAll}` : '') : 'Qui joue ?';
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
  const s = sv || neuf();
  $('tetes').innerHTML = TETES.map(t => `<button data-t="${t.id}" class="${t.famille ? 'rond ' : ''}${t.id === s.tete ? 'on ' : ''}${ouverte(t) ? '' : 'ferme'}" title="${esc(t.m ? t.m.t : t.n)}"><img src="${srcTete(t.id)}" alt="">${esc(t.n)}</button>`).join('');
  $('peaux').innerHTML = PEAUX.map(p => `<button data-p="${p}" class="${p === s.peau ? 'on' : ''}"><img src="${srcPeau(p)}" alt="">${esc(NOMS_PEAUX[p] || (TETES.find(t => t.id === p) || {}).n || p)}</button>`).join('');
  $('missions').innerHTML = TETES.filter(t => t.m).map(t => { const v = Math.min(t.m.n, valeur(t.m)), ok = ouverte(t);
    return `<li class="${ok ? 'ok' : ''}"><img src="${srcTete(t.id)}" alt=""><span>${esc(t.m.t)} → <b style="color:inherit">${esc(t.n)}</b><div class="barre"><i style="width:${v / t.m.n * 100}%"></i></div></span><b>${ok ? '✔ ouverte' : v + ' / ' + t.m.n}</b></li>`; }).join('');
  const tt = TETES.find(t => t.id === s.tete) || TETES[0]; $('apercuTxt').innerHTML = `<b style="font-family:'Baloo 2';font-size:22px">${esc(tt.n)}</b><br>Corps : ${esc(NOMS_PEAUX[s.peau] || (TETES.find(t => t.id === s.peau) || {}).n || s.peau)}${joueur ? '' : '<br><i>Choisis d\'abord qui joue pour garder ton serpent.</i>'}`;
  apercu(); records();
}
async function records(){
  for(const [m, el] of [['champion', 'recC'], ['tranquille', 'recT']]){
    const rows = window.Famille ? await Famille.highscores('arene', m, 8).catch(() => null) : null;
    $(el).innerHTML = rows && rows.length ? rows.map(r => `<li>${esc(r.player)} — <b>${r.score}</b></li>`).join('') : '<p class="none">Personne encore : à toi !</p>';
  }
}
export function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }
// l'aperçu du serpent choisi, en forme de S
function apercu(){
  const c = $('apercu'), x = c.getContext('2d'), s = sv || neuf(); x.clearRect(0, 0, c.width, c.height);
  const d = disques(s.peau), ti = charge(srcTete(s.tete)); if(!d || !pret(ti)){ setTimeout(apercu, 250); return; }
  const r = 30, pts = []; for(let k = 0; k <= 40; k++){ const u = k / 40; pts.push([40 + u * 380, 110 + Math.sin(u * 7) * 50 * (1 - u * .3)]); }
  for(let k = 0; k < pts.length; k++){ const [px, py] = pts[k]; x.drawImage(d[k % 3], px - r, py - r, 2 * r, 2 * r); }
  const [hx, hy] = pts[pts.length - 1]; teteSur(x, s.tete, ti, hx + 20, hy, r, 0);
}
// la tête : un animal détouré, ou un portrait de la famille dans un rond ; le haut de l'image regarde vers l'avant
function teteSur(x, id, im, hx, hy, r, a){
  x.save(); x.translate(hx, hy); x.rotate(a + Math.PI / 2);
  if(id.startsWith('f-')){ const R = r * 1.25; x.beginPath(); x.arc(0, 0, R + 3, 0, 6.29); x.fillStyle = '#fff'; x.fill();
    x.save(); x.beginPath(); x.arc(0, 0, R, 0, 6.29); x.clip(); const w = im.naturalWidth, h = im.naturalHeight, m = Math.min(w, h); x.drawImage(im, (w - m) / 2, 0, m, m, -R, -R, 2 * R, 2 * R); x.restore(); }
  else { const R = r * 1.45; x.drawImage(im, -R, -R, 2 * R, 2 * R); }
  x.restore();
}

/* ---------- la partie ---------- */
const cv = $('cv'), ctx = cv.getContext('2d'); let W = 0, H = 0, DPR = 1;
function taille(){ DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; }
addEventListener('resize', taille); taille();

let G = null;
export function nouvellePartie(o){
  const A = nouvelleArene({ graine:o.graine || ((Math.random() * 1e9) | 0), prefixe:o.prefixe || 'l', mode:o.mode });
  G = { A, mode:o.mode, net:o.net || null, moi:null, acc:0, fini:false, pause:false, cam:{ x:A.taille / 2, y:A.taille / 2, S:1 }, fx:[], debut:performance.now(), vieT:0, killsPartie:0, perlesPartie:0, premier:false, bestPartie:0, attente:0 };
  return G;
}
// un serpent avec son nom, sa tête, son corps
export function serpentDe(A, o){
  const pl = o.x != null ? o : placeSure(A); const [tete, peau] = (o.skin || 'fennec:fennec').split(':');
  const s = nouveauSerpent(A, { id:o.id, nom:o.nom, skin:o.skin, x:pl.x, y:pl.y, a:pl.a, masse:o.masse, local:o.local, bot:o.bot, niveau:o.niveau, client:o.client });
  s.tete = tete; s.peau = peau; s.img = charge(srcTete(tete)); disques(peau); return s;
}
const skinBot = i => { const t = TETES.filter(t => !t.famille), a = t[(i * 7 + 3) % t.length].id, p = PEAUX[(i * 5 + 1) % PEAUX.length]; return a + ':' + (i % 3 ? a : p); };
export const skinMoi = () => (sv ? sv.tete : 'fennec') + ':' + (sv ? sv.peau : 'fennec');
function partieSolo(){
  ac(); sons(); const cfg = MODES[mode]; const g = nouvellePartie({ mode });
  g.moi = serpentDe(g.A, { id:0, nom:joueur || 'Moi', skin:skinMoi() });
  const ordre = [...BOTS].sort(() => Math.random() - .5);
  for(let i = 0; i < cfg.bots; i++) serpentDe(g.A, { id:100 + i, nom:ordre[i % ordre.length], skin:skinBot(i + ((Math.random() * 20) | 0)), bot:true, niveau:cfg.niveaux[i % cfg.niveaux.length], masse:CFG.masse0 + Math.random() * (cfg.masse[1] - cfg.masse[0]) });
  g.A.events.length = 0; demarre();
}
export function demarre(){
  montre('-'); document.body.classList.add('jeu'); $('modal').classList.remove('on'); $('aide').style.opacity = 1; setTimeout(() => { $('aide').style.opacity = 0; }, 6000);
  G.cam.x = G.moi.x; G.cam.y = G.moi.y; G.vieT = G.A.t; last = performance.now(); SON.nait(); dit('go', '', true);
  if(!raf) raf = requestAnimationFrame(boucle);
}

/* ---------- la boucle : simulation à pas fixe (30 par seconde), dessin interpolé ---------- */
let raf = 0, last = 0, hudT = 0;
function boucle(t){
  raf = requestAnimationFrame(boucle);
  if(!G) return;
  const dt = Math.min(.1, (t - last) / 1000); last = t;
  if(!G.pause && !G.fini){
    commandes(); G.acc += dt;
    while(G.acc >= CFG.pas){ G.acc -= CFG.pas;
      pensent(G.A, CFG.pas);
      if(G.net) G.net.avant(CFG.pas);
      pas(G.A, CFG.pas);
      evenements();
      renaissances();
      if(G.fini || !G) break; }
  }
  if(G) dessine(dt);
  if(G && t - hudT > 300){ hudT = t; hud(); miniCarte(); }
}
function renaissances(){
  const A = G.A;
  for(const s of A.serpents){ if(s.vivant || !s.local) continue; s.mortT = s.mortT ?? A.t;
    if(s === G.moi){ if((G.mode === 'tranquille' || G.net) && A.t - s.mortT > 1.8 && !G.fini){ renait(A, s, placeSure(A)); s.mortT = null; G.vieT = A.t; SON.nait(); message('C\'est reparti ! 🐍'); if(G.net) G.net.nait(s); } continue; }
    if(s.bot && A.t - s.mortT > 3){ renait(A, s, placeSure(A)); s.mortT = null; s.ia = null; if(!G.net){ s.nom = BOTS[(Math.random() * BOTS.length) | 0]; const sk = skinBot((Math.random() * 40) | 0).split(':'); s.tete = sk[0]; s.peau = sk[1]; s.img = charge(srcTete(s.tete)); disques(s.peau);
      if(G.mode === 'champion') s.masse = CFG.masse0 + Math.random() * 400; } if(G.net) G.net.nait(s); }
  }
}
function evenements(){
  const A = G.A, moi = G.moi;
  for(const e of A.events){
    if(G.net) G.net.evenement(e);
    if(e.k === 'mort'){ const s = e.s;
      G.fx.push({ k:'pouf', x:s.x, y:s.y, t:0, r:rayon(s.masse) });
      if(e.par === moi && s !== moi){ G.killsPartie++; SON.tombe(); message('💥 ' + s.nom + ' est tombé !'); dit('tombe', s.nom); }
      if(s === moi){ SON.perdu(); sv && (sv.survie = Math.max(sv.survie, Math.round(A.t - G.vieT)));
        if(G.mode === 'tranquille' || G.net){ message(e.par ? 'Tu as touché ' + e.par.nom + '… on repart !' : 'Le mur du riad ! On repart !', 2200); dit('perdu'); }
        else { dit('perdu', '', true); setTimeout(() => fin(e.par ? 'Tu as touché le corps de ' + e.par.nom + '.' : 'Tu as touché le mur du riad.'), 900); } }
    }
    else if((e.k === 'mangeF' || e.k === 'mangeD') && e.s === moi){ G.perlesPartie++; SON.miam(e.p.v >= 3); }
  }
  A.events.length = 0;
  if(moi.vivant){ if(moi.masse > G.bestPartie) G.bestPartie = moi.masse;
    const cl = classement(A); if(cl[0] === moi && cl.length > 3 && moi.masse > 300 && !G.premier){ G.premier = true; SON.bonus(); message('👑 Tu es le plus grand serpent !', 3000); dit('premier', '', true); } else if(cl[0] !== moi) G.premier = false;
    if(sv && G.vieT != null && A.t - G.vieT >= 300 && sv.survie < 300){ sv.survie = 300; } }
}

/* ---------- les commandes : le rond à gauche, BOOST à droite ; souris et clavier ---------- */
const keys = new Set(); let joy = null, boostDoigt = null, souris = null, sourisBoost = false, mode_ = 'doigt';
const joyEl = $('joy'), boostEl = $('boost');
function centreJoy(){ const r = joyEl.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }
addEventListener('keydown', e => { if(!G || G.fini) return; const k = e.key.toLowerCase();
  if(k === 'escape' || k === 'p'){ togglePause(); return; }
  if(['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'q', 'd', 'a', 'z', 's', 'w'].includes(k)){ keys.add(k); if(k !== ' ') mode_ = 'clavier'; e.preventDefault(); } });
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
cv.addEventListener('pointerdown', e => { ac(); sons(); if(!G || G.fini) return;
  if(e.pointerType === 'mouse'){ document.body.classList.add('souris'); mode_ = 'souris'; souris = [e.clientX, e.clientY]; sourisBoost = true; return; }
  document.body.classList.remove('souris'); mode_ = 'doigt';
  if(joy) return;
  const [cx, cy] = centreJoy(); const pres = Math.hypot(e.clientX - cx, e.clientY - cy) < 110;
  joy = { id:e.pointerId, x0:pres ? cx : e.clientX, y0:pres ? cy : e.clientY, x:e.clientX, y:e.clientY, libre:!pres };
  if(!pres){ joyEl.style.left = (e.clientX - 70) + 'px'; joyEl.style.top = (e.clientY - 70) + 'px'; joyEl.style.bottom = 'auto'; } bougeJoy(); });
addEventListener('pointermove', e => { if(e.pointerType === 'mouse'){ souris = [e.clientX, e.clientY]; if(G && !keys.size){ mode_ = 'souris'; document.body.classList.add('souris'); } return; }
  if(joy && e.pointerId === joy.id){ joy.x = e.clientX; joy.y = e.clientY; bougeJoy(); } });
function bougeJoy(){ const dx = joy.x - joy.x0, dy = joy.y - joy.y0, d = Math.hypot(dx, dy), k = Math.min(1, 46 / (d || 1)); joyEl.firstElementChild.style.transform = `translate(${dx * k}px, ${dy * k}px)`; }
const lache = e => { if(e.pointerType === 'mouse'){ sourisBoost = false; return; }
  if(joy && e.pointerId === joy.id){ joy = null; joyEl.firstElementChild.style.transform = ''; joyEl.style.left = joyEl.style.top = joyEl.style.bottom = ''; }
  if(boostDoigt === e.pointerId){ boostDoigt = null; boostEl.classList.remove('on'); } };
addEventListener('pointerup', lache); addEventListener('pointercancel', lache);
boostEl.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); ac(); boostDoigt = e.pointerId; boostEl.classList.add('on'); if(G && G.moi.masse > CFG.masseMinBoost) SON.boost(); });
boostEl.addEventListener('contextmenu', e => e.preventDefault());
function commandes(){
  if(window.__pilote) return;
  const p = G.moi; if(!p || !p.vivant) return;
  if(mode_ === 'clavier'){ if(keys.has('arrowleft') || keys.has('q') || keys.has('a')) p.vise = p.a - .6; else if(keys.has('arrowright') || keys.has('d')) p.vise = p.a + .6; else p.vise = p.a; }
  else if(mode_ === 'souris' && souris){ const [sx, sy] = ecran(p.x, p.y); const dx = souris[0] - sx, dy = souris[1] - sy; if(Math.hypot(dx, dy) > 12) p.vise = Math.atan2(dy, dx); }
  else if(joy){ const dx = joy.x - joy.x0, dy = joy.y - joy.y0; if(Math.hypot(dx, dy) > 8) p.vise = Math.atan2(dy, dx); }
  const avant = p.veutBoost; p.veutBoost = boostDoigt != null || keys.has(' ') || keys.has('arrowup') || keys.has('z') || keys.has('w') || (mode_ === 'souris' && sourisBoost);
  if(p.veutBoost && !avant && mode_ !== 'doigt' && p.masse > CFG.masseMinBoost) SON.boost();
  boostEl.classList.toggle('vide', p.masse <= CFG.masseMinBoost);
}
document.addEventListener('visibilitychange', () => { if(document.hidden && G && !G.fini && !G.net){ G.pause = true; pauseFenetre(); } });
$('pause').onclick = () => togglePause();
function togglePause(){ if(!G || G.fini) return; if(G.net){ G.net.demandeQuitter(); return; } G.pause = !G.pause; if(G.pause) pauseFenetre(); else $('modal').classList.remove('on'); }
function pauseFenetre(){ modal(`<h2>⏸ Pause</h2><p>Ta longueur : <b>${Math.round(G.moi.masse)}</b></p><div class="rang"><button class="pill go" id="mRep">▶ Continuer</button><button class="pill" id="mQuit">🏠 Menu</button></div>`);
  $('mRep').onclick = () => { G.pause = false; $('modal').classList.remove('on'); last = performance.now(); }; $('mQuit').onclick = () => quitter(); }
export async function quitter(){ const g = G; if(g && !g.fini && !g.net){ const nv = await enregistre(g); if(nv && nv.tetes.length){ G = null; finTetes(nv.tetes); return; } } if(g && g.net) g.net.quitte(); G = null; $('modal').classList.remove('on'); document.body.classList.remove('jeu'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); menu(); }
function finTetes(tl){ document.body.classList.remove('jeu'); modal(`<h2>🎁 Nouvelle tête !</h2>${tl.map(t => `<div class="nouveau"><img src="${srcTete(t.id)}" alt="">${esc(t.n)}</div>`).join('')}<div class="rang"><button class="pill go" id="mOk">Super !</button></div>`); SON.bonus(); dit('tete', tl[0].n, true); $('mOk').onclick = () => { $('modal').classList.remove('on'); menu(); }; }
export function modal(h){ const m = $('modal'); m.innerHTML = `<div class="carte">${h}</div>`; m.classList.add('on'); }
let msgT = null; export function message(t, d = 2400){ const m = $('msg'); m.textContent = t; m.classList.add('on'); clearTimeout(msgT); msgT = setTimeout(() => m.classList.remove('on'), d); }

/* ---------- la fin, les records, les missions ---------- */
export async function enregistre(g = G, cle_ = g && g.mode){
  if(!joueur || !g || g.enregistre) return null; g.enregistre = true;
  const best = Math.round(g.bestPartie || g.moi.meilleur); sv.parties++; sv.kills += g.killsPartie; sv.perles += g.perlesPartie; sv.killsMax = Math.max(sv.killsMax, g.killsPartie);
  if(g.moi.vivant) sv.survie = Math.max(sv.survie, Math.round(g.A.t - g.vieT));
  sv.bestAll = Math.max(sv.bestAll, best);
  const record = !g.net && best > (sv.best[cle_] || 0); if(record) sv.best[cle_] = best;
  const tetes = verifieMissions(); sauve();
  let r = null; if(window.Famille && best > 0 && !g.net){ try{ r = await Famille.score('arene', cle_, best, joueur); }catch(e){} }
  return { record, r, best, tetes };
}
async function fin(pourquoi){
  if(!G || G.fini) return; G.fini = true; const g = G, moi = g.moi, duree = (performance.now() - g.debut) / 1000;
  const res = await enregistre(g);
  if(res && res.record){ SON.gagne(); dit('record', '', true); }
  const rang = res && res.r && res.r.rank ? `<span>Classement de la famille</span><b>${res.r.rank}<sup>${res.r.rank === 1 ? 'er' : 'e'}</sup></b>` : '';
  modal(`<div style="font-size:60px">🐍</div><h2>Fin de la partie</h2><p style="margin:0">${esc(pourquoi)}</p>
    <div class="res"><span>Ta plus grande longueur</span><b>${res ? res.best : Math.round(moi.meilleur)}</b><span>Serpents tombés</span><b>${g.killsPartie}</b><span>Perles mangées</span><b>${g.perlesPartie}</b><span>Durée</span><b>${Math.floor(duree / 60)}:${String(Math.floor(duree % 60)).padStart(2, '0')}</b>${rang}</div>
    ${res && res.record ? '<p style="margin:0;font-weight:800;color:#2e9e6b">⭐ Nouveau record !</p>' : ''}
    ${res && res.tetes.length ? res.tetes.map(t => `<div class="nouveau"><img src="${srcTete(t.id)}" alt="">🎁 Nouvelle tête : ${esc(t.n)}</div>`).join('') : ''}
    <div class="rang"><button class="pill go" id="mRe">🔁 Rejouer</button><button class="pill" id="mMenu">🏠 Menu</button></div>`);
  if(res && res.tetes.length) setTimeout(() => { SON.bonus(); dit('tete', res.tetes[0].n, true); }, 1500);
  $('mRe').onclick = () => { $('modal').classList.remove('on'); partieSolo(); };
  $('mMenu').onclick = () => { G = null; $('modal').classList.remove('on'); document.body.classList.remove('jeu'); menu(); };
}

/* ---------- le dessin ---------- */
function ecran(x, y){ return [(x - G.cam.x) * G.cam.S + W / 2, (y - G.cam.y) * G.cam.S + H / 2]; }
function dessine(dt){
  const A = G.A, moi = G.moi, al = G.acc / CFG.pas;
  // la caméra suit la tête (interpolée) et recule quand le serpent grossit
  let cible = moi; if(!moi.vivant && G.net){ cible = classement(A)[0] || moi; }
  const hx = cible.px + (cible.x - cible.px) * al, hy = cible.py + (cible.y - cible.py) * al;
  const k = Math.min(1, dt * 7); G.cam.x += (hx - G.cam.x) * k; G.cam.y += (hy - G.cam.y) * k;
  const S = Math.sqrt(W * H) / (620 + rayon(moi.masse) * 12); G.cam.S += (S - G.cam.S) * Math.min(1, dt * 2);
  const Sc = G.cam.S;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0f2a2e'; ctx.fillRect(0, 0, W, H);
  const [ox, oy] = ecran(0, 0), L = A.taille * Sc, sol = IM[IMG + 'sol.webp'];
  ctx.save(); ctx.beginPath(); ctx.rect(ox, oy, L, L); ctx.clip();
  if(pret(sol)){ const pat = ctx.createPattern(sol, 'repeat'), kk = 260 * Sc / sol.naturalWidth; pat.setTransform(new DOMMatrix().translate(ox, oy).scale(kk)); ctx.fillStyle = pat; } else ctx.fillStyle = '#e9d9bd';
  ctx.fillRect(ox, oy, L, L); ctx.restore();
  // le mur du riad (rouge quand on s'approche)
  const pres = moi.vivant ? Math.min(moi.x, moi.y, A.taille - moi.x, A.taille - moi.y) : 999;
  ctx.lineWidth = Math.max(6, 22 * Sc); ctx.strokeStyle = pres < 220 ? `rgba(220,60,40,${.6 + .4 * Math.sin(performance.now() / 120)})` : '#f4ead8';
  ctx.strokeRect(ox - ctx.lineWidth / 2, oy - ctx.lineWidth / 2, L + ctx.lineWidth, L + ctx.lineWidth);
  const vx0 = G.cam.x - W / 2 / Sc - 60, vx1 = G.cam.x + W / 2 / Sc + 60, vy0 = G.cam.y - H / 2 / Sc - 60, vy1 = G.cam.y + H / 2 / Sc + 60;
  // les perles
  const tt = performance.now() / 400;
  for(const p of A.perles.values()){ if(p.x < vx0 || p.x > vx1 || p.y < vy0 || p.y > vy1) continue; const [sx, sy] = ecran(p.x, p.y);
    const r = (5 + Math.min(10, p.v * 2)) * Sc * (1 + .12 * Math.sin(tt + p.x)); ctx.drawImage(PERLE[p.c % 8], sx - r * 2.6, sy - r * 2.6, r * 5.2, r * 5.2); }
  // les serpents (les plus petits dessous)
  const vis = A.serpents.filter(s => s.vivant).sort((a, b) => a.masse - b.masse);
  for(const s of vis) dessineSerpent(s, al, vx0, vx1, vy0, vy1);
  // les effets
  for(let i = G.fx.length - 1; i >= 0; i--){ const f = G.fx[i]; f.t += dt; const [sx, sy] = ecran(f.x, f.y);
    if(f.k === 'pouf'){ ctx.globalAlpha = Math.max(0, 1 - f.t / .7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(sx, sy, (f.r + f.t * 160) * Sc, 0, 6.29); ctx.stroke(); ctx.globalAlpha = 1; if(f.t > .7) G.fx.splice(i, 1); } }
}
function dessineSerpent(s, al, vx0, vx1, vy0, vy1){
  const ch = s.chemin; if(!ch.length) return;
  const r = rayon(s.masse), Sc = G.cam.S;
  const hx = s.px + (s.x - s.px) * al, hy = s.py + (s.y - s.py) * al;
  // visible ? (un point sur 8 suffit)
  let vu = false; for(let j = 0; j < ch.length; j += 8){ const q = ch[j]; if(q.x > vx0 - r && q.x < vx1 + r && q.y > vy0 - r && q.y < vy1 + r){ vu = true; break; } } if(!vu) return;
  const d = disques(s.peau), pasJ = Math.max(1, Math.round(r * .45 / CFG.ecartChemin));
  // la lumière du boost
  if(s.boost){ ctx.save(); ctx.globalAlpha = .35 + .15 * Math.sin(performance.now() / 60); ctx.strokeStyle = '#ffd36b'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = (r * 2 + 14) * Sc;
    ctx.beginPath(); const [a0, b0] = ecran(hx, hy); ctx.moveTo(a0, b0); for(let j = 1; j < ch.length; j += 2){ const [a, b] = ecran(ch[j].x, ch[j].y); ctx.lineTo(a, b); } ctx.stroke(); ctx.restore(); }
  // l'ombre
  ctx.save(); ctx.globalAlpha = .22; ctx.strokeStyle = '#000'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = r * 2 * Sc; ctx.beginPath();
  { const [a0, b0] = ecran(hx + 5, hy + 7); ctx.moveTo(a0, b0); } for(let j = 1; j < ch.length; j += 3){ const [a, b] = ecran(ch[j].x + 5, ch[j].y + 7); ctx.lineTo(a, b); } ctx.stroke(); ctx.restore();
  // les disques, de la queue vers la tête (la queue s'affine un peu)
  const n = ch.length, R = r * Sc;
  for(let j = n - 1 - ((n - 1) % pasJ); j >= pasJ; j -= pasJ){ const q = ch[j], [sx, sy] = ecran(q.x, q.y), f = j > n - 12 ? .7 + .3 * (n - j) / 12 : 1, rr = R * f;
    if(d) ctx.drawImage(d[(j / pasJ | 0) % 3], sx - rr, sy - rr, rr * 2, rr * 2); else { ctx.fillStyle = '#7a8'; ctx.beginPath(); ctx.arc(sx, sy, rr, 0, 6.29); ctx.fill(); } }
  // la tête
  const [sx, sy] = ecran(hx, hy), a = s.pa + angle(s.a - s.pa) * al;
  if(d) ctx.drawImage(d[0], sx - R, sy - R, R * 2, R * 2);
  if(pret(s.img)) teteSur(ctx, s.tete, s.img, sx, sy, R, a);
  if(s.invinc > 0){ ctx.globalAlpha = .5 + .3 * Math.sin(performance.now() / 80); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(sx, sy, R * 1.7, 0, 6.29); ctx.stroke(); ctx.globalAlpha = 1; }
  // le prénom
  const fs = Math.max(13, Math.min(22, R * .9)); ctx.font = `800 ${fs}px Nunito`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(14,38,43,.7)';
  const ny = sy - R * 1.6 - 4; ctx.strokeText(s.nom, sx, ny); ctx.fillStyle = s === G.moi ? '#ffe08a' : '#fff'; ctx.fillText(s.nom, sx, ny);
}
const angle = d => { while(d > Math.PI) d -= 2 * Math.PI; while(d < -Math.PI) d += 2 * Math.PI; return d; };
function miniCarte(){
  const c = $('carte'), g = c.getContext('2d'), A = G.A, k = c.width / A.taille; g.clearRect(0, 0, c.width, c.height);
  g.save(); g.beginPath(); g.arc(c.width / 2, c.height / 2, c.width / 2, 0, 6.29); g.clip();
  g.fillStyle = 'rgba(255,248,236,.12)'; g.fillRect(0, 0, c.width, c.height);
  for(const s of A.serpents){ if(!s.vivant || s === G.moi) continue; g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(s.x * k, s.y * k, 2 + rayon(s.masse) / 12, 0, 6.29); g.fill(); }
  if(G.moi.vivant){ g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(G.moi.x * k, G.moi.y * k, 7, 0, 6.29); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 2; g.stroke(); }
  g.restore();
}
function hud(){
  const moi = G.moi, cl = classement(G.A);
  $('masse').textContent = Math.round(moi.vivant ? moi.masse : 0); $('rangT').textContent = moi.vivant ? (cl.indexOf(moi) + 1) + '/' + cl.length : '–'; $('kills').textContent = G.killsPartie;
  const s = G.net && G.net.finT ? Math.max(0, (G.net.finT - performance.now()) / 1000) : (performance.now() - G.debut) / 1000;
  $('temps').textContent = Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); $('temps').nextElementSibling.textContent = G.net ? 'il reste' : 'temps';
  const top = cl.slice(0, 5); if(moi.vivant && !top.includes(moi)) top.push(moi);
  $('top').innerHTML = top.map(p => `<div class="${p === moi ? 'moi' : ''}">${cl.indexOf(p) + 1}. <img src="${srcTete(p.tete)}" alt="" style="${p.tete.startsWith('f-') ? '' : 'object-fit:contain;border-radius:0'}">${esc(p.nom)}<b>${Math.round(p.masse)}</b></div>`).join('');
}

/* ---------- les boutons du menu ---------- */
$('who').onclick = () => choisir();
$('langue').onclick = () => { langue = langue === 'ar' ? 'fr' : langue === 'fr' ? 'off' : 'ar'; store.set('arene-langue', langue); boutonLangue(); SON.tap(); if(langue !== 'off') dit('go', '', true); };
document.querySelectorAll('.mode').forEach(b => b.onclick = () => { mode = b.dataset.m; store.set('arene-mode', mode); SON.tap(); menu(); });
$('tetes').onclick = e => { const b = e.target.closest('[data-t]'); if(!b) return; const t = TETES.find(x => x.id === b.dataset.t); if(!sv) sv = neuf();
  if(!ouverte(t)){ message('🔒 ' + t.m.t + ' pour ouvrir ' + t.n + ' !', 3000); modal(`<h2>🔒 ${esc(t.n)}</h2><img src="${srcTete(t.id)}" alt="" style="width:120px;filter:grayscale(1)"><p>Pour l'ouvrir : <b>${esc(t.m.t)}</b>.<br>Tu en es à ${Math.min(t.m.n, valeur(t.m))} / ${t.m.n}.</p><div class="rang"><button class="pill go" id="mOk">D'accord</button></div>`); $('mOk').onclick = () => $('modal').classList.remove('on'); return; }
  sv.tete = t.id; if(!sv.peauChoisie) sv.peau = t.p; sauve(); SON.tap(); menu(); };
$('peaux').onclick = e => { const b = e.target.closest('[data-p]'); if(!b) return; if(!sv) sv = neuf(); sv.peau = b.dataset.p; sv.peauChoisie = true; sauve(); SON.tap(); menu(); };
$('jouer').onclick = async () => { if(!joueur && !(await choisir())) return; partieSolo(); };
$('ensemble').onclick = async () => { if(!joueur && !(await choisir())) return; ac(); sons(); reseau().ouvreSalon(); };
let R = null; const reseau = () => R || (R = new Reseau({ joueur:() => joueur, sv:() => sv, skin:skinMoi, tete:srcTete, montre, nouvellePartie, demarre, serpentDe, menu, message, modal, quitter, SON, G:() => G, enregistre, BOTS, skinBot, dit }));

// au démarrage : quand les corps sont chargés, on refait l'aperçu
PEAUX.forEach(p => { const im = charge(srcPeau(p)); im.onload = () => { if(sv && (p === sv.peau)) apercu(); }; });
TETES.forEach(t => charge(srcTete(t.id)));
sv = neuf(); menu();
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0);
window.__arene = { get G(){ return G; }, partieSolo, quitter, fin, get joueur(){ return joueur; }, get sv(){ return sv; }, TETES };
