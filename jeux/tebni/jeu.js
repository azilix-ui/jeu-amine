/* Tebni : dessin (canvas 2D), commandes (doigt, clavier, manette), sons, commentaire, sauvegarde. Règles : regles.js. */
import { L, H, PIECES, CASES, nouvellePartie, deplace, tourneP, chuteDouce, chuteRapide, reserve, pas, ombre, cases, visible, gravite } from './regles.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const KASSAR = new URL('../kassar/img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const img = u => { const i = new Image(); i.src = u; return i; };
const ok = i => i && i.complete && i.naturalWidth > 0;
// chaque pièce a son carreau de zellige (les carreaux de Kassar, ComfyUI)
const COUL = { I:'turquoise', O:'jaune', T:'violet', S:'vert', Z:'rouge', J:'bleu', L:'sable' };
const TEINTE = { I:'#2fc6c0', O:'#f0b52a', T:'#6b3fb0', S:'#18865a', Z:'#c9542f', J:'#1f3fa8', L:'#d8b46a' };
const TUILE = {}; for(const p of PIECES) TUILE[p] = img(KASSAR + 'z-' + COUL[p] + '.webp');
// le style « Classique en vrai » (20/11, demandé par le papa) : les 7 couleurs du jeu classique, en blocs de verre photographiés (ComfyUI, docs/tebni/build_images.py)
const IMGT = new URL('./img/', import.meta.url).href;
const TEINTE_C = { I:'#22d3ee', O:'#facc15', T:'#a855f7', S:'#22c55e', Z:'#ef4444', J:'#2563eb', L:'#f97316' };
const TUILE_C = {}; for(const p of PIECES) TUILE_C[p] = img(IMGT + 'c-' + p + '.webp');
const classique = () => REG().style === 'classique';
const teinte = t => (classique() ? TEINTE_C : TEINTE)[t];
function appliqueStyle(){ document.body.classList.toggle('classique', classique()); document.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', b.dataset.s === (REG().style || 'zellige'))); if($('sous')) $('sous').textContent = classique() ? 'Le jeu de briques classique, en vrais blocs de verre : complète les lignes !' : 'Empile les carreaux de zellige et complète les lignes de la terrasse !'; }

/* ---------- réglages ---------- */
// 21/11 (papa) : l'ombre de la pièce est maintenant une option, NON par défaut (même pour ceux qui avaient déjà des réglages)
{ const r0 = store.get('tebni-reg', null); if(r0 && !r0.ombre21){ r0.fantome = false; r0.ombre21 = 1; store.set('tebni-reg', r0); } }
const REG = () => Object.assign({ lang:'ar', son:true, vib:true, fantome:false, style:'zellige' }, store.get('tebni-reg', {}));
const setReg = (k, v) => { const r = REG(); r[k] = v; store.set('tebni-reg', r); };

/* ---------- les sons (fabriqués par le navigateur : courts, nets, sans téléchargement) ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function bip(f, d = .07, type = 'triangle', v = .06, f2 = 0, t0 = 0){ if(!REG().son) return; const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .02); }
function darbouka(t0 = 0, fort = 1){ if(!REG().son) return; const a = ac(); if(!a) return;   // doum (grave) + tek (claqué)
  const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(60, t + .18); g.gain.setValueAtTime(.25 * fort, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); o.connect(g).connect(a.destination); o.start(t); o.stop(t + .25); }
function tek(t0 = 0){ if(!REG().son) return; const a = ac(); if(!a) return; const t = a.currentTime + t0, n = a.createBuffer(1, a.sampleRate * .05, a.sampleRate), d = n.getChannelData(0);
  for(let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3); const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); s.buffer = n; f.type = 'highpass'; f.frequency.value = 2500; g.gain.value = .25; s.connect(f).connect(g).connect(a.destination); s.start(t); }
const HIJAZ = [293.7, 311.1, 370, 392, 440, 466.2, 523.3, 587.3];   // ré, mi bémol, fa dièse, sol, la, si bémol, do, ré
const SON = {
  bouge(){ bip(520, .025, 'square', .015); }, tourne(){ bip(760, .04, 'triangle', .03, 900); }, pose(){ tek(); }, garde(){ bip(440, .08, 'sine', .04, 660); },
  dur(){ darbouka(0, .8); },
  lignes(n){ for(let i = 0; i < n + 2; i++) bip(HIJAZ[(i * 2) % 8] * (n === 4 ? 1 : .5) * 2, .16, 'triangle', .06, 0, i * .07); if(n === 4){ [0, .12, .24, .32, .44].forEach((d, i) => i % 2 ? tek(d) : darbouka(d)); } },
  niveau(){ [0, 2, 4, 7].forEach((k, i) => bip(HIJAZ[k] * 2, .2, 'sine', .07, 0, i * .1)); },
  fin(){ [7, 5, 3, 1, 0].forEach((k, i) => bip(HIJAZ[k], .3, 'sine', .07, 0, i * .17)); },
};
const vibre = ms => { if(REG().vib && navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} };
function parle(t, lang = 'fr-FR'){ try{ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang; speechSynthesis.speak(u); }catch(e){} }
const dit = (fr, ar) => { if(!REG().son) return; REG().lang === 'fr' || joueur === 'Amine' ? parle(fr) : parle(ar, 'ar'); };

/* ---------- le joueur et la sauvegarde ---------- */
let joueur = null, sv = null, MODE = 'champion';
const neuf = () => ({ best:{}, lignes:0, parties:0, tebni:0, t:0 });
const cle = () => 'tebni:' + joueur;
const sauve = () => { if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); };
const tete = n => { const k = String(n || '').toLowerCase(); if(['essil', 'salma', 'amine', 'anis', 'imen'].includes(k)) return AV + 'reel/' + k + '.webp'; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h ? AV + 'reel/' + h.id + '.webp' : null; };
let teteIm = null;
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {}); teteIm = tete(n) ? img(tete(n)) : null;
  MODE = store.get('tebni-mode:' + n, n === 'Amine' ? 'tranquille' : 'champion');
  if(window.Famille && Famille.track){ Famille.track('tebni', n, [cle()]); try{ const r = await Famille.load('tebni', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu(); }
async function choisirJoueur(){ if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue à Tebni ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n; }

/* ---------- le menu ---------- */
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }
function menu(){
  document.body.classList.remove('jeu'); montre('menu'); $('modal').classList.remove('on'); P = null;
  $('who').innerHTML = joueur ? (tete(joueur) ? `<img src="${tete(joueur)}" alt="">` : '🙂') + esc(joueur) : 'Qui joue ?';
  document.querySelectorAll('.mode[data-m]').forEach(b => b.classList.toggle('on', b.dataset.m === MODE));
  const s = sv || neuf();
  $('moi').innerHTML = joueur ? `Meilleur score : <b>${(s.best[MODE] || 0).toLocaleString('fr-FR')}</b><br>Lignes en tout : <b>${s.lignes}</b><br>« Tebni ! » (4 lignes) : <b>${s.tebni}</b><br>Parties : <b>${s.parties}</b>` : 'Choisis qui joue.';
  records();
}
async function records(){ $('recMode').textContent = MODE === 'tranquille' ? 'Tranquille' : 'Champion';
  const rows = window.Famille ? await Famille.highscores('tebni', MODE, 8).catch(() => null) : null;
  $('records').innerHTML = rows && rows.length ? rows.map(r => `<li class="${r.player === joueur ? 'moi' : ''}">${esc(r.player)} · ${Number(r.score).toLocaleString('fr-FR')}</li>`).join('') : '<li>Pas encore de record</li>'; }
document.querySelectorAll('.mode[data-m]').forEach(b => b.onclick = () => { MODE = b.dataset.m; if(joueur) store.set('tebni-mode:' + joueur, MODE); menu(); });
$('who').onclick = () => choisirJoueur();
$('jouer').onclick = async () => { ac(); if(!joueur && !(await choisirJoueur())) return; partie(); };
$('reglages').onclick = () => reglages();
document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { setReg('style', b.dataset.s); appliqueStyle(); });
appliqueStyle();

function reglages(){
  const r = REG(), seg = (k, opts) => `<div class="seg">${opts.map(([v, t]) => `<button data-k="${k}" data-v="${v}" class="${String(r[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
  $('fen').innerHTML = `<h2>⚙️ Réglages</h2>
    <div class="reg">Le commentaire ${seg('lang', [['ar', 'العربية'], ['fr', 'Français']])}</div>
    <div class="reg">Les sons ${seg('son', [[true, 'Oui'], [false, 'Non']])}</div>
    <div class="reg">Vibrations ${seg('vib', [[true, 'Oui'], [false, 'Non']])}</div>
    <div class="reg">Ombre de la pièce (où elle va tomber) ${seg('fantome', [[false, 'Non'], [true, 'Oui']])}</div>
    <div class="reg">Le style ${seg('style', [['zellige', '🇹🇳 Zellige'], ['classique', '🎮 Classique']])}</div>
    <div class="row"><button class="pill or" id="ferme">OK</button></div>`;
  $('modal').classList.add('on');
  $('fen').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const v = b.dataset.v; setReg(b.dataset.k, v === 'true' ? true : v === 'false' ? false : v); appliqueStyle(); reglages(); });
  $('ferme').onclick = () => { $('modal').classList.remove('on'); if(P && P.pause && !P.fini) reprendre(); };
}

/* ---------- la partie ---------- */
let P = null, effets = [], bulle = null, humeur = 'calme', humeurT = 0, secousse = 0;
function partie(){
  P = nouvellePartie({ graine:(Date.now() & 0xffffff) + 1, mode:MODE }); P.pause = false; effets = []; bulle = null; humeur = 'calme';
  document.body.classList.add('jeu'); montre(null); $('modal').classList.remove('on'); majSon();
  dit('C\'est parti ! Complète les lignes.', 'هيّا نبنيو ! كمّل السطور');
}
function pause(){ if(!P || P.fini) return; P.pause = true; $('fen').innerHTML = `<h2>⏸ Pause</h2><p>Score : ${P.score.toLocaleString('fr-FR')}</p><div class="row"><button class="pill or" id="rep">▶ Reprendre</button><button class="pill" id="reg2">⚙️</button><button class="pill" id="quit">✕ Quitter</button></div>`;
  $('modal').classList.add('on'); $('rep').onclick = reprendre; $('reg2').onclick = reglages; $('quit').onclick = () => { finPartie(true); }; }
function reprendre(){ if(!P) return; P.pause = false; $('modal').classList.remove('on'); last = performance.now(); }
$('pause').onclick = () => P && (P.pause ? reprendre() : pause());
function majSon(){ $('son').textContent = REG().son ? '🔊' : '🔇'; }
$('son').onclick = () => { setReg('son', !REG().son); majSon(); };
addEventListener('visibilitychange', () => { if(document.hidden && P && !P.pause && !P.fini) pause(); });

function finPartie(abandon){
  if(!P || P.compte) return; P.compte = true; const s = P.score, lg = P.lignes, tb = P.tetris; const record = s > (sv.best[MODE] || 0);
  if(!abandon || lg > 0){ sv.parties++; sv.lignes += lg; sv.tebni += tb; if(record) sv.best[MODE] = s; sauve();
    if(window.Famille && joueur && s > 0) Famille.score('tebni', MODE, Math.min(999999, s), joueur).catch(() => {}); }
  if(abandon){ menu(); return; }
  SON.fin(); vibre([60, 40, 120]); humeur = 'oups'; humeurT = 99;
  dit(record ? 'Nouveau record ! Bravo !' : 'C\'est fini ! On rejoue ?', record ? 'رقم قياسي جديد ! برافو' : 'انتهت اللعبة ! نعاودو ؟');
  setTimeout(() => { $('fen').innerHTML = `<h2>${record ? '🏆 Nouveau record !' : 'La terrasse est pleine !'}</h2>
    <p>Score : <b>${s.toLocaleString('fr-FR')}</b><br>Lignes : <b>${lg}</b> · Niveau : <b>${P.niveau}</b>${tb ? `<br>« Tebni ! » : <b>${tb}</b>` : ''}</p>
    <div class="row"><button class="pill or" id="encore">🔁 Rejouer</button><button class="pill" id="aumenu">Menu</button></div>`;
    $('modal').classList.add('on'); $('encore').onclick = partie; $('aumenu').onclick = menu; }, 900);
}

/* ---------- les commandes ---------- */
const appuis = {};   // répétition des touches ◀ ▶ (attente 170 ms, puis toutes les 45 ms) et ⬇
let douce = false;
function action(a){
  if(!P || P.pause || P.fini) return;
  if(a === 'g' || a === 'd'){ if(deplace(P, a === 'g' ? -1 : 1)) SON.bouge(); }
  else if(a === 't'){ if(tourneP(P, 1)) SON.tourne(); }
  else if(a === 'ti'){ if(tourneP(P, -1)) SON.tourne(); }
  else if(a === 'h'){ const n = chuteRapide(P); SON.dur(); vibre(15); secousse = Math.min(8, 2 + n * .4); }
  else if(a === 'r'){ if(reserve(P)) SON.garde(); }
}
function presse(a){ if(appuis[a]) return; action(a); if(a === 'g' || a === 'd'){ appuis[a] = { t:0, rep:false }; } if(a === 'b'){ douce = true; appuis.b = {}; } }
function lache(a){ delete appuis[a]; if(a === 'b') douce = false; }
function repete(dt){ for(const a of ['g', 'd']){ const s = appuis[a]; if(!s) continue; s.t += dt; if(!s.rep && s.t >= .17){ s.rep = true; s.t = 0; action(a); } else if(s.rep && s.t >= .045){ s.t = 0; action(a); } } }
const BOUTONS = { bG:'g', bD:'d', bT:'t', bH:'h', bR:'r', bB:'b' };
for(const [id, a] of Object.entries(BOUTONS)){ const b = $(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); ac(); b.classList.add('app'); try{ b.setPointerCapture(e.pointerId); }catch(x){} presse(a); });
  const fin = () => { b.classList.remove('app'); lache(a); }; b.addEventListener('pointerup', fin); b.addEventListener('pointercancel', fin); b.addEventListener('lostpointercapture', fin); }
const TOUCHES = { ArrowLeft:'g', ArrowRight:'d', ArrowUp:'t', KeyX:'t', KeyZ:'ti', KeyW:'ti', Space:'h', KeyC:'r', ShiftLeft:'r', ArrowDown:'b' };
addEventListener('keydown', e => { if(e.code === 'KeyP' || e.code === 'Escape'){ if(P && !P.fini){ P.pause ? reprendre() : pause(); } return; }
  const a = TOUCHES[e.code]; if(!a || !P) return; e.preventDefault(); if(e.repeat && (a === 'g' || a === 'd' || a === 'b')) return; presse(a); if(a !== 'g' && a !== 'd' && a !== 'b') lache(a); });
addEventListener('keyup', e => { const a = TOUCHES[e.code]; if(a) lache(a); });
// sur la grille : toucher = tourner ; glisser à gauche/droite = déplacer case par case ; glisser vite vers le bas = poser
const cv = $('cv'); let geste = null;
cv.addEventListener('pointerdown', e => { if(!P || P.pause || P.fini) return; ac(); geste = { x:e.clientX, y:e.clientY, x0:e.clientX, t:performance.now(), bouge:false }; });
cv.addEventListener('pointermove', e => { if(!geste || !P) return; const dx = e.clientX - geste.x, c = G.c * .9;
  if(Math.abs(dx) >= c){ const n = Math.trunc(dx / c); for(let i = 0; i < Math.abs(n); i++) action(n < 0 ? 'g' : 'd'); geste.x += n * c; geste.bouge = true; } });
cv.addEventListener('pointerup', e => { if(!geste || !P) return; const dy = e.clientY - geste.y, dt = performance.now() - geste.t, dx = Math.abs(e.clientX - geste.x0);
  if(dy > G.c * 2.5 && dt < 350 && dx < G.c * 1.5) action('h'); else if(!geste.bouge && dt < 300 && Math.abs(dy) < G.c) action('t'); geste = null; });
// manette
let manette = {};
function lisManette(){ const g = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null; if(!g) return;
  const b = i => g.buttons[i] && g.buttons[i].pressed, etat = { g:b(14) || g.axes[0] < -.5, d:b(15) || g.axes[0] > .5, t:b(0) || b(12), ti:b(2), h:b(3), r:b(4) || b(5), b:b(13) || g.axes[1] > .5 };
  for(const k in etat){ if(etat[k] && !manette[k]){ presse(k); if(!['g', 'd', 'b'].includes(k)) lache(k); } else if(!etat[k] && manette[k]) lache(k); } manette = etat; }

/* ---------- le dessin ---------- */
const ctx = cv.getContext('2d'); let G = { c:30, x:0, y:0, W:0, Hh:0, port:true };
function resize(){ const dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const port = innerHeight > innerWidth * 1.05, haut = 74, bas = port ? 120 : 20, cote = port ? 118 : 210;
  const c = Math.floor(Math.min((innerHeight - haut - bas - 12) / H, (innerWidth - (port ? cote + 30 : cote * 2 + 40)) / L));
  G = { c, W:c * L, Hh:c * H, port, x:port ? Math.max(12, Math.floor((innerWidth - cote - c * L) / 2) - 4) : Math.floor((innerWidth - c * L) / 2), y:haut };
  if(!port && innerWidth < 900){ G.x = Math.floor((innerWidth - c * L) / 2); } }
addEventListener('resize', resize); resize();
function tuile(t, x, y, c, alpha = 1){
  ctx.globalAlpha = alpha; const im = (classique() ? TUILE_C : TUILE)[t];
  if(ok(im)) ctx.drawImage(im, x, y, c, c); else { ctx.fillStyle = teinte(t); ctx.fillRect(x, y, c, c); }
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, c - 1, c - 1);
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(x + c - .5, y + 1); ctx.lineTo(x + c - .5, y + c - .5); ctx.lineTo(x + 1, y + c - .5); ctx.stroke();
  ctx.globalAlpha = 1; }
function piecePetite(t, cx, cy, c){ const cs = CASES[t][0], xs = cs.map(a => a[0]), ys = cs.map(a => a[1]);
  const w = (Math.max(...xs) - Math.min(...xs) + 1) * c, h = (Math.max(...ys) - Math.min(...ys) + 1) * c;
  for(const [a, b] of cs) tuile(t, cx - w / 2 + (a - Math.min(...xs)) * c, cy - h / 2 + (b - Math.min(...ys)) * c, c); }
function panneau(x, y, w, h, titre){ ctx.fillStyle = 'rgba(8,24,52,.72)'; arrondi(x, y, w, h, 16); ctx.fill(); if(titre){ ctx.fillStyle = '#ffd56a'; ctx.font = '800 15px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(titre, x + w / 2, y + 20); } }
function arrondi(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function dessine(t){
  ctx.clearRect(0, 0, innerWidth, innerHeight); if(!P) return;
  const { c } = G; let { x, y } = G;
  if(secousse > 0){ y += Math.sin(t / 20) * secousse; secousse = Math.max(0, secousse - .6); }
  // le cadre : un encadrement de faïence, et la grille sur fond nuit
  ctx.fillStyle = classique() ? '#3a3f4b' : 'rgba(255,255,255,.92)'; arrondi(x - 8, y - 8, G.W + 16, G.Hh + 16, 14); ctx.fill();
  if(classique()){ ctx.strokeStyle = '#8a93a6'; ctx.lineWidth = 2; arrondi(x - 7, y - 7, G.W + 14, G.Hh + 14, 13); ctx.stroke(); }
  ctx.fillStyle = classique() ? '#05070d' : '#0d1f3f'; ctx.fillRect(x, y, G.W, G.Hh);
  ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1;
  for(let i = 1; i < L; i++){ ctx.beginPath(); ctx.moveTo(x + i * c + .5, y); ctx.lineTo(x + i * c + .5, y + G.Hh); ctx.stroke(); }
  for(let j = 1; j < H; j++){ ctx.beginPath(); ctx.moveTo(x, y + j * c + .5); ctx.lineTo(x + G.W, y + j * c + .5); ctx.stroke(); }
  const g = visible(P); for(let j = 0; j < H; j++) for(let i = 0; i < L; i++) if(g[j][i]) tuile(g[j][i], x + i * c, y + j * c, c);
  if(!P.fini){ const p = P.piece;
    if(REG().fantome){ const oy = ombre(P); for(const [a, b] of cases(p, p.r, p.x, oy)) if(b >= 2){ ctx.strokeStyle = teinte(p.t); ctx.lineWidth = 2; ctx.globalAlpha = .7; ctx.strokeRect(x + a * c + 2, y + (b - 2) * c + 2, c - 4, c - 4); ctx.globalAlpha = .18; ctx.fillStyle = teinte(p.t); ctx.fillRect(x + a * c + 2, y + (b - 2) * c + 2, c - 4, c - 4); ctx.globalAlpha = 1; } }
    for(const [a, b] of cases(p)) if(b >= 2) tuile(p.t, x + a * c, y + (b - 2) * c, c); }
  // les lignes qui partent (éclairs blancs) et les étincelles
  effets = effets.filter(e => (e.v -= 1 / 40) > 0);
  for(const e of effets){ if(e.t === 'ligne'){ ctx.fillStyle = `rgba(255,240,180,${e.v})`; ctx.fillRect(x, y + e.y * c, G.W, c); }
    else { e.x += e.vx; e.y += e.vy; e.vy += .25; ctx.globalAlpha = e.v; ctx.fillStyle = e.col; ctx.fillRect(e.x, e.y, 5, 5); ctx.globalAlpha = 1; } }
  // les panneaux : en portrait à droite, en paysage de chaque côté
  let px, py, pw = G.port ? 110 : 190;
  const pc = Math.min(Math.max(12, Math.round(c * .6)), Math.floor((pw - 14) / 4));
  if(G.port){ px = x + G.W + 16; py = y; } else { px = x + G.W + 22; py = y; }
  panneau(px, py, pw, pc * 7.6 + 26, 'Suivantes'); P.file.slice(0, 3).forEach((t2, i) => piecePetite(t2, px + pw / 2, py + 26 + pc * 1.3 + i * pc * 2.5, pc));
  const lx = G.port ? px : x - 22 - 190, ly = G.port ? py + pc * 7.6 + 36 : y;
  panneau(lx, ly, pw, pc * 2.6 + 26, '📦 Gardée'); if(P.reserve) piecePetite(P.reserve, lx + pw / 2, ly + 26 + pc * 1.25, pc);
  // le score
  const sy = ly + pc * 2.6 + 36, sh = G.port ? 150 : 170; panneau(lx, sy, pw, sh, null);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffd56a'; ctx.font = '800 14px Nunito, sans-serif';
  [['Score', P.score.toLocaleString('fr-FR')], ['Lignes', P.lignes], ['Niveau', P.niveau]].forEach(([k, v], i) => { const yy = sy + 22 + i * (sh - 10) / 3;
    ctx.fillStyle = '#ffd56a'; ctx.font = '800 13px Nunito, sans-serif'; ctx.fillText(k, lx + pw / 2, yy); ctx.fillStyle = '#fff'; ctx.font = `800 ${G.port ? 22 : 26}px "Baloo 2", sans-serif`; ctx.fillText(v, lx + pw / 2, yy + 24); });
  // l'avatar « en vrai » qui réagit
  const ay = G.port ? sy + sh + 14 : py + pc * 7.6 + 40, ax = G.port ? px + pw / 2 : px + pw / 2, ar = G.port ? 46 : 70;
  if(ay + ar * 2 < innerHeight - (G.port ? 110 : 10)){
    humeurT -= 1 / 60; if(humeurT <= 0 && humeur !== 'oups') humeur = 'calme';
    const saut = humeur === 'joie' ? Math.abs(Math.sin(t / 110)) * 12 : humeur === 'tebni' ? Math.abs(Math.sin(t / 80)) * 22 : 0, tremble = humeur === 'oups' ? Math.sin(t / 40) * 4 : 0;
    ctx.save(); ctx.translate(ax + tremble, ay + ar - saut); ctx.beginPath(); ctx.arc(0, 0, ar, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
    if(ok(teteIm)) ctx.drawImage(teteIm, -ar, -ar, ar * 2, ar * 2); else { ctx.fillStyle = '#1f5fbf'; ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `800 ${ar}px "Baloo 2"`; ctx.fillText((joueur || '?')[0], 0, ar / 3); }
    ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = humeur === 'tebni' ? '#ffd56a' : '#fff'; ctx.beginPath(); ctx.arc(ax + tremble, ay + ar - saut, ar, 0, 7); ctx.stroke();
    if(bulle && bulle.v > 0){ bulle.v -= 1 / 90; ctx.globalAlpha = Math.min(1, bulle.v * 3); ctx.font = '800 17px Nunito, sans-serif'; const w = Math.min(G.port ? 150 : 200, ctx.measureText(bulle.t).width + 24), bx = Math.min(innerWidth - w - 6, ax - w / 2), by = ay + ar * 2 + 10 - saut;
      ctx.fillStyle = '#fff'; arrondi(bx, by, w, 34, 17); ctx.fill(); ctx.fillStyle = '#14213d'; ctx.textAlign = 'center'; ctx.fillText(bulle.t, bx + w / 2, by + 23, w - 12); ctx.globalAlpha = 1; } }
  // un grand mot au milieu (« Tebni ! », niveau)
  if(grand && grand.v > 0){ grand.v -= 1 / 70; ctx.globalAlpha = Math.min(1, grand.v * 2); ctx.textAlign = 'center'; ctx.font = `800 ${Math.round(c * 1.6)}px "Baloo 2", sans-serif`; ctx.lineWidth = 6; ctx.strokeStyle = '#0b3a82'; ctx.strokeText(grand.t, x + G.W / 2, y + G.Hh * .42); ctx.fillStyle = '#ffd56a'; ctx.fillText(grand.t, x + G.W / 2, y + G.Hh * .42);
    if(grand.ar){ ctx.font = `700 ${Math.round(c * 1.3)}px "Aref Ruqaa", serif`; ctx.strokeText(grand.ar, x + G.W / 2, y + G.Hh * .42 + c * 1.6); ctx.fillText(grand.ar, x + G.W / 2, y + G.Hh * .42 + c * 1.6); } ctx.globalAlpha = 1; }
}
let grand = null;
const BRAVO = [['Behi !', 'بهي'], ['Bravo !', 'برافو'], ['Yaa sahhit !', 'يعيشك'], ['Mezyan !', 'مزيان']];
function evenements(){
  for(const e of P.ev.splice(0)){
    if(e.t === 'lignes'){
      e.rangs.forEach(r => effets.push({ t:'ligne', y:r, v:1 }));
      for(let k = 0; k < 18 * e.n; k++) effets.push({ t:'pt', x:G.x + Math.random() * G.W, y:G.y + (e.rangs[0] + .5) * G.c, vx:(Math.random() - .5) * 6, vy:-Math.random() * 6, v:1, col:['#ffd56a', '#2fc6c0', '#fff', '#c9542f'][k % 4] });
      SON.lignes(e.n); vibre(e.n === 4 ? [40, 30, 80] : 25);
      if(e.n === 4){ grand = { t:'Tebni !', ar:'بنيت !', v:1.6 }; humeur = 'tebni'; humeurT = 2.5; bulle = { t:'Tebni ! 🎉', v:1.3 }; dit('Tebni ! Quatre lignes !', 'بنيت ! أربعة سطور'); }
      else { const b = BRAVO[Math.floor(Math.random() * BRAVO.length)]; humeur = 'joie'; humeurT = 1.4; bulle = { t:(REG().lang === 'fr' ? b[0] : b[1] + ' !') + (e.combo > 0 ? ' x' + (e.combo + 1) : ''), v:1 }; if(e.n >= 2 || e.combo > 1) dit(b[0], b[1]); }
      if(e.vide && e.n !== 4){ grand = { t:'Tout propre !', v:1.6 }; }
    } else if(e.t === 'niveau'){ SON.niveau(); grand = { t:'Niveau ' + e.n, v:1.3 }; dit('Niveau ' + e.n + ' ! Plus vite !', 'المستوى ' + e.n + ' ! أسرع'); }
    else if(e.t === 'pose' && !e.dur) SON.pose();
    else if(e.t === 'fin'){ finPartie(false); }
  }
}

/* ---------- la boucle ---------- */
let last = performance.now();
function boucle(t){
  requestAnimationFrame(boucle);
  const dt = Math.min(.05, (t - last) / 1000); last = t;
  lisManette();
  if(P && !P.pause && !P.fini){ repete(dt); pas(P, dt, douce); }
  if(P && P.ev.length) evenements();   // aussi après la fin (une chute rapide peut finir la partie entre deux images)
  dessine(t);
}
requestAnimationFrame(boucle);
window.__tebni = { get P(){ return P; }, partie, action, menu, setJoueur };
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0); else menu();
