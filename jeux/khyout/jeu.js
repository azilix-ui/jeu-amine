/* Khyout : les écrans, le dessin, les doigts, les sons et la sauvegarde (les règles sont dans regles.js). */
import { lire, bilan, debut, pas, fin, chemin, relie, pelote, cheminSolution, poseSolution, bonFil, hasard, cellule, dansFil } from './regles.js';
import { PETITS, NIVEAUX, PONTS } from './niveaux.js';

const $ = id => document.getElementById(id);
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const AV = '/jeux/avatars/';

// 16 couleurs bien différentes sur fond sombre, chacune avec son symbole (mode daltonien) et son nom (pour la voix)
const COUL = ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#f97316', '#22d3ee', '#ec4899', '#a855f7', '#b45309', '#f8fafc', '#a3e635', '#94a3b8', '#6366f1', '#fda4af', '#0d9488', '#9f1239'];
const SYMB = ['●', '▲', '■', '◆', '★', '✚', '▼', '⬟', '♣', '◐', '✦', '♠', '⬢', '♥', '✖', '☾'].map(s => s + '︎');
// le commentaire en arabe (17/11, demandé par le papa : voix « Mohammad - Warm Arabic » d'ElevenLabs, arabe standard)
const NOMS_AR = ['الأحمر', 'الأزرق', 'الأخضر', 'الأصفر', 'البرتقالي', 'السماوي', 'الوردي', 'البنفسجي', 'البني', 'الأبيض', 'الأخضر الفاتح', 'الرمادي', 'النيلي', 'السلموني', 'الفيروزي', 'العنابي'];
const NOMS = ['rouge', 'bleu', 'vert', 'jaune', 'orange', 'bleu ciel', 'rose', 'violet', 'marron', 'blanc', 'vert pomme', 'gris', 'bleu violet', 'saumon', 'turquoise', 'bordeaux'];
const TRANCHES = [
  { nom:'Initiation', de:0, a:30, t:'5×5' }, { nom:'Facile', de:30, a:70, t:'6×6' }, { nom:'Intermédiaire', de:70, a:110, t:'7×7' },
  { nom:'Difficile', de:110, a:150, t:'8×8' }, { nom:'Expert', de:150, a:180, t:'9×9' }, { nom:'Extrême', de:180, a:200, t:'10×10' }];

/* ---------- le joueur et sa sauvegarde ---------- */
let joueur = null, sv = null;
const neuf = () => ({ niv:{}, pet:{}, pon:{}, jours:{}, chrono:{}, reg:{ son:true, vib:true, sym:false, col:'couper', lang:'ar' }, t:0 });
const cle = () => 'khyout:' + joueur;
const REG = () => (sv || neuf()).reg;
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
const total = () => sv ? [...Object.values(sv.niv), ...Object.values(sv.pet), ...Object.values(sv.pon || {}), ...Object.values(sv.jours)].reduce((a, v) => a + (v.e || 0), 0) : 0;
const petit = () => joueur === 'Amine';
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {}); sv.reg = Object.assign(neuf().reg, sv.reg || {}); sv.pon = sv.pon || {};
  if(petit() && !store.get(cle(), null)) sv.reg.sym = true;   // pour Amine : les symboles aident à reconnaître les couleurs
  if(window.Famille && Famille.track){ Famille.track('khyout', n, [cle()]);
    try{ const r = await Famille.load('khyout', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); sv.reg = Object.assign(neuf().reg, d.reg || {}); store.set(cle(), sv); } }catch(e){} }
  if(MODE === null) MODE = 'classique'; menu(); }
async function choisirJoueur(){ if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue à Khyout ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
    avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n; }
const tete = n => { const k = String(n || '').toLowerCase(); if(['essil', 'salma', 'amine', 'anis', 'imen'].includes(k)) return AV + 'reel/' + k + '.webp'; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h ? AV + 'reel/' + h.id + '.webp' : null; };

/* ---------- les sons (discrets, fabriqués par le navigateur) ---------- */
let AC = null;
function ac(){ try{ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume(); }catch(e){} return AC; }
function bip(f, d = .08, type = 'sine', v = .06, f2){ if(!REG().son) return; const a = ac(); if(!a) return; const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const NOTES = [523, 587, 659, 698, 784, 880, 988, 1047];
const SON = {
  tic(k){ bip(NOTES[k % 8] * .75, .05, 'triangle', .035); },
  relie(k){ bip(NOTES[k % 8], .12, 'sine', .07); setTimeout(() => bip(NOTES[k % 8] * 1.5, .16, 'sine', .06), 90); },
  coupe(){ bip(220, .09, 'square', .025, 140); },
  non(){ bip(160, .08, 'triangle', .04); },
  gagne(){ [0, 2, 4, 7].forEach((q, t) => setTimeout(() => bip(NOTES[q % 8] * (q > 6 ? 1 : 1), .22, 'sine', .07), t * 110)); },
  indice(){ bip(880, .1, 'sine', .05, 1320); },
};
const vibre = ms => { if(REG().vib && navigator.vibrate) try{ navigator.vibrate(ms); }catch(e){} };
function parle(t, lang = 'fr-FR'){ try{ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = lang; speechSynthesis.speak(u); }catch(e){} }
// le commentaire : en arabe (par défaut) ou en français (⚙️ Paramètres)
const dit = (fr, ar) => REG().lang === 'fr' ? parle(fr) : parle(ar, 'ar');

/* ---------- le menu ---------- */
let MODE = null, chronoDuree = 60, chronoTaille = 'petit';
const aujourdHui = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function boutonsNiv(liste, prog, piste, de, a){   // chaque tranche s'ouvre par son premier niveau (Essil peut commencer en 8×8), puis niveau après niveau
  let s = a; for(let i = de; i < a; i++) if(!prog[i] || !prog[i].e){ s = i; break; } let h = '';
  for(let i = de; i < a; i++){ const p = prog[i], ouvert = i <= s;
    h += `<button class="niv${p && p.e ? ' fait' : ''}${i === s ? ' suivant' : ''}" data-p="${piste}" data-i="${i}" ${ouvert ? '' : 'disabled'}>${ouvert ? i + 1 : '🔒'}<small>${p && p.e ? '★'.repeat(p.e) : ''}</small></button>`; }
  return h; }
function menu(){
  montre('menu'); $('total').textContent = '⭐ ' + total();
  const t = joueur && tete(joueur); $('who').innerHTML = joueur ? (t ? `<img src="${t}" alt="">` : '') + joueur : 'Qui joue ?';
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.m === MODE));
  const P = $('panneau'), s = sv || neuf();
  if(MODE === 'classique' || MODE === null){
    let h = `<div class="tranche"><h3><span>🐣 Les petits ${petit() ? '(pour toi, Amine !)' : '(4×4 et 5×5)'}</span><span>${Object.values(s.pet).filter(v => v.e).length}/${PETITS.length}</span></h3><div class="niveaux">${boutonsNiv(PETITS, s.pet, 'pet', 0, PETITS.length)}</div></div>`;
    h += `<div class="tranche"><h3><span>🌉 Le monde des ponts (sur un pont, deux fils se croisent)</span><span>${Object.values(s.pon || {}).filter(v => v.e).length}/${PONTS.length}</span></h3><div class="niveaux">${boutonsNiv(PONTS, s.pon || {}, 'pon', 0, PONTS.length)}</div></div>`;
    h += TRANCHES.map(T => `<div class="tranche"><h3><span>${T.nom} · ${T.t}</span><span>${Object.keys(s.niv).filter(i => i >= T.de && i < T.a && s.niv[i].e).length}/${T.a - T.de}</span></h3><div class="niveaux">${boutonsNiv(NIVEAUX, s.niv, 'niv', T.de, T.a)}</div></div>`).join('');
    P.innerHTML = h;
  } else if(MODE === 'chrono'){
    const best = s.chrono || {};
    P.innerHTML = `<div class="tranche"><h3><span>Combien de temps ?</span></h3><div class="choix" id="cDuree">${[60, 120, 300].map(d => `<button data-d="${d}" class="${d === chronoDuree ? 'on' : ''}">${d / 60} min</button>`).join('')}</div></div>
      <div class="tranche"><h3><span>Quelles grilles ?</span></h3><div class="choix" id="cTaille">${[['petit', '🐣 Petites'], ['5', '5×5'], ['6', '6×6'], ['7', '7×7'], ['8', '8×8']].map(([k, l]) => `<button data-t="${k}" class="${k === chronoTaille ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <p style="color:var(--doux)">Ton record : <b style="color:#fff">${best[chronoDuree + ':' + chronoTaille] || 0}</b> grille(s) en ${chronoDuree / 60} min.</p>
      <button class="gros" id="cGo">⏱️ C'est parti !</button>`;
    $('cDuree').onclick = e => { const b = e.target.closest('[data-d]'); if(b){ chronoDuree = +b.dataset.d; menu(); } };
    $('cTaille').onclick = e => { const b = e.target.closest('[data-t]'); if(b){ chronoTaille = b.dataset.t; menu(); } };
    $('cGo').onclick = async () => { ac(); if(!joueur && !(await choisirJoueur())) return; lanceChrono(); };
  } else if(MODE === 'jour'){
    const j = aujourdHui(), fait = s.jours[j], L = [], d0 = new Date();
    for(let q = 13; q >= 0; q--){ const d = new Date(d0); d.setDate(d.getDate() - q); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); L.push(`<i class="${s.jours[k] ? 'ok' : ''}${q === 0 ? ' auj' : ''}" title="${k}">${s.jours[k] ? '★' : d.getDate()}</i>`); }
    let serie = 0; for(let q = fait ? 0 : 1; ; q++){ const d = new Date(d0); d.setDate(d.getDate() - q); const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); if(s.jours[k]) serie++; else break; }
    const dj = defiDuJour();
    P.innerHTML = `<p style="margin:14px 0 10px">Aujourd'hui : une grille <b>${dj.niv.n}×${dj.niv.n}</b> ${fait ? '— <b style="color:#4ade80">réussie ' + '★'.repeat(fait.e) + '</b>' : ''}</p>
      <button class="gros" id="jGo">${fait ? '🔁 La refaire' : '📅 Jouer le défi'}</button>
      <div class="tranche"><h3><span>Les 14 derniers jours</span><span>🔥 ${serie} jour${serie > 1 ? 's' : ''} de suite</span></h3><div class="jours">${L.join('')}</div></div>`;
    $('jGo').onclick = async () => { ac(); if(!joueur && !(await choisirJoueur())) return; const d = defiDuJour(); partie({ niv:d.niv, piste:'jour', i:d.cle, titre:'📅 Défi du jour · ' + d.niv.n + '×' + d.niv.n }); };
  } else if(MODE === 'aide'){
    P.innerHTML = `<ul class="regles">
      <li><b>Pose ton doigt</b> sur une pelote 🧶 et <b>glisse</b> jusqu'à l'autre pelote de la <b>même couleur</b>.</li>
      <li>Les fils <b>ne se croisent pas</b>. Si tu passes sur un autre fil, il est coupé (ou bloqué : ⚙️ Paramètres).</li>
      <li>Pour gagner : <b>toutes les paires reliées</b> et <b>toutes les cases remplies</b>.</li>
      <li>Reviens en arrière en glissant sur ton fil. ↶ annule, ⟲ recommence, 💡 aide : la couleur, puis le début du fil, puis le fil entier.</li>
      <li>🌉 <b>Les ponts</b> : sur un pont de pierre, un fil passe tout droit à l'horizontale et un autre tout droit à la verticale. Il faut remplir les deux !</li>
      <li>⭐⭐⭐ sans indice, ⭐⭐ avec 1 ou 2 indices, ⭐ sinon. Sur ordinateur : la souris marche aussi, et <b>V</b> coupe la voix.</li></ul>`;
  }
}
function defiDuJour(){   // la même grille pour toute la famille ce jour-là ; plus dure au fil de la semaine (lundi 5×5 → dimanche 9×9)
  const j = aujourdHui(), R = hasard([...j].reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  if(petit()) return { cle:j, niv:PETITS[(R() * PETITS.length) | 0] };
  const jour = (new Date().getDay() + 6) % 7, T = [TRANCHES[0], TRANCHES[0], TRANCHES[1], TRANCHES[1], TRANCHES[2], TRANCHES[3], TRANCHES[4]][jour];
  return { cle:j, niv:NIVEAUX[T.de + ((R() * (T.a - T.de)) | 0)] };
}
document.querySelectorAll('.mode').forEach(b => b.onclick = () => { MODE = b.dataset.m; menu(); });
$('panneau').addEventListener('click', async e => { const b = e.target.closest('.niv'); if(!b || b.disabled) return; ac(); if(!joueur && !(await choisirJoueur())) return;
  const i = +b.dataset.i, L = liste(b.dataset.p); partie({ niv:L[i], piste:b.dataset.p, i, titre:titreDe(b.dataset.p, i) }); });
function liste(piste){ return piste === 'pet' ? PETITS : piste === 'pon' ? PONTS : NIVEAUX; }
function titreDe(piste, i){ const L = liste(piste); return (piste === 'pet' ? '🐣 Petit niveau ' : piste === 'pon' ? '🌉 Pont ' : 'Niveau ') + (i + 1) + ' · ' + L[i].n + '×' + L[i].n; }
$('who').onclick = () => choisirJoueur();
$('regBtn').onclick = () => reglages();
async function records(){ const rows = window.Famille ? await Famille.highscores('khyout', 'etoiles', 10).catch(() => null) : null;
  $('records').innerHTML = rows && rows.length ? rows.map(r => `<li>${r.player} — ⭐ ${r.score}</li>`).join('') : '<p class="none">Pas encore de record : à toi de jouer !</p>'; }

/* ---------- les paramètres ---------- */
function reglages(){ const r = REG(), voix = !window.FamilleVoix || FamilleVoix.on();
  const ligne = (k, t, sous, opts) => `<div class="reg"><span>${t}<small>${sous}</small></span><div class="choix" data-k="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(r[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div></div>`;
  modal(`<h2>⚙️ Paramètres</h2>
    ${ligne('son', '🔊 Sons', 'petits bruits quand on trace', [[true, 'Oui'], [false, 'Non']])}
    ${ligne('vib', '📳 Vibrations', 'sur téléphone et tablette', [[true, 'Oui'], [false, 'Non']])}
    ${ligne('sym', '🔷 Symboles', 'un dessin sur chaque pelote (daltonien)', [[true, 'Oui'], [false, 'Non']])}
    ${ligne('lang', '🗣️ Le commentaire', 'la voix qui encourage pendant le jeu', [['ar', 'العربية'], ['fr', 'Français']])}
    ${ligne('col', '✂️ Croiser un fil', 'ce qui arrive quand on passe sur un autre fil', [['couper', 'Il est coupé'], ['bloquer', 'Bloqué']])}
    <div class="reg"><span>🗣️ Consignes orales<small>touche V sur ordinateur</small></span><div class="choix" data-k="voix"><button data-v="1" class="${voix ? 'on' : ''}">Oui</button><button data-v="0" class="${voix ? '' : 'on'}">Non</button></div></div>
    <div class="rang"><button class="gros" data-ferme>OK</button></div>`);
  $('modal').onclick = e => { const c = e.target.closest('[data-k] button'); if(c){ const k = c.parentNode.dataset.k, v = c.dataset.v;
      if(k === 'voix'){ if(window.FamilleVoix) FamilleVoix.regler(v === '1'); } else { r[k] = v === 'true' ? true : v === 'false' ? false : v; sv && sauve(); }
      reglages(); dessine(); return; }
    if(e.target.closest('[data-ferme]') || e.target === $('modal')) ferme(); };
}
function modal(html){ $('modal').innerHTML = `<div class="fenetre">${html}</div>`; $('modal').classList.add('on'); }
function ferme(){ $('modal').classList.remove('on'); $('modal').onclick = null; }
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); if(id === 'jeu') taille(); }

/* ---------- une partie ---------- */
let J = null;   // { niv, piste, i, titre, P, G, undo:[], coups, dernier, indices, hint, anim, chrono }
function partie(o){
  ferme(); montre('jeu');
  J = Object.assign({ undo:[], coups:0, dernier:-1, indices:0, hint:null, fini:false, t0:performance.now(), eclats:[], pulse:{} }, o);
  J.P = lire(o.niv);
  taille();
  $('titreJeu').textContent = o.titre; $('sChrono').hidden = !J.chrono;
  stats(); dessine();
  const premiere = o.piste === 'pet' && o.i === 0 || o.piste === 'niv' && o.i === 0;
  if(o.piste === 'pon' && o.i === 0) dit('Sur un pont, un fil passe tout droit à l\'horizontale et un autre tout droit à la verticale. Il faut remplir les deux !', 'عَلى الجِسْر، يَمُرُّ خَيْطٌ أُفُقِيٌّ وَخَيْطٌ عَمُودِيٌّ، وَلا يَلْتَفُّ أَيُّ خَيْطٍ فَوْقَه. امْلَأِ الاتِّجاهَيْنِ!');
  else if(petit() || premiere) dit(premiere ? 'Relie les deux pelotes de la même couleur, avec ton doigt. Les fils ne se croisent pas, et il faut remplir toute la grille !' : 'Relie les pelotes de la même couleur !',
    premiere ? 'صِلْ كُلَّ كُبَّةٍ بِأُخْتِها مِنْ نَفْسِ اللَّوْن، دُونَ أَنْ تَتَقاطَعَ الخُيوط، وَامْلَأِ الشَّبَكَةَ كُلَّها!' : 'صِلِ الكُبَبَ الَّتِي لَها نَفْسُ اللَّوْن!');
}
function stats(){ const b = bilan(J.P); $('sPaires').textContent = `🧶 ${b.reliees}/${b.paires}`; $('sCases').textContent = `▦ ${b.pct} %`; $('sCoups').textContent = `✋ ${J.coups}`; return b; }
function toast(t, ms = 2200){ const e = $('toast'); e.textContent = t; e.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), ms); }

/* ---------- le dessin ---------- */
const cv = $('cv'), ctx = cv.getContext('2d'); let W = 0, H = 0, DPR = 1, geo = { x:0, y:0, c:40 };
function taille(){ DPR = Math.min(2, window.devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * DPR; cv.height = H * DPR; place(); dessine(); }
function place(){ if(!J) return; const n = J.P.n, haut = $('hautJeu').offsetHeight + 8, bas = $('basJeu').offsetHeight + 10;
  const c = Math.floor(Math.min((W - 24) / n, (H - haut - bas) / n, 110)); geo = { c, x:Math.round((W - c * n) / 2), y:Math.round(haut + (H - haut - bas - c * n) / 2) }; }
addEventListener('resize', () => { if($('jeu').classList.contains('on')) taille(); });
const centre = i => [geo.x + (i % J.P.n + .5) * geo.c, geo.y + (((i / J.P.n) | 0) + .5) * geo.c];
function hexA(h, a){ const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
let doigt = null;
/* les images (ComfyUI) : la pelote grise et le brin de laine sont teints à la couleur de chaque fil */
const IMG = {}; let TEINTES = null;
['pelote', 'brin', 'bois', 'pont'].forEach(k => { const im = new Image(); im.onload = () => { TEINTES = null; }; im.src = 'khyout/img/' + k + '.webp'; IMG[k] = im; });
const pret = im => im && im.complete && im.naturalWidth > 0;
function teinte(im, col){ const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d');
  x.drawImage(im, 0, 0); x.globalCompositeOperation = 'multiply'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'screen'; x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0); return c; }
function teintes(){ if(TEINTES) return TEINTES; if(!pret(IMG.pelote) || !pret(IMG.brin)) return null;
  TEINTES = { pel:COUL.map(c => teinte(IMG.pelote, c)), brin:COUL.map(c => teinte(IMG.brin, c)) }; return TEINTES; }
let motifBois = null;
function dessine(){
  if(!J || !W) return; const t = performance.now() / 1000, P = J.P, n = P.n, c = geo.c, T = teintes();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  // le plateau : une planche de noyer
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8;
  if(pret(IMG.bois)){ motifBois = motifBois || ctx.createPattern(IMG.bois, 'repeat'); ctx.fillStyle = motifBois; } else ctx.fillStyle = '#3b2616';
  rond(geo.x - 10, geo.y - 10, c * n + 20, c * n + 20, 18); ctx.fill(); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(255,220,170,.25)'; ctx.lineWidth = 2; rond(geo.x - 9, geo.y - 9, c * n + 18, c * n + 18, 17); ctx.stroke(); ctx.restore();
  // les cases remplies (couleur pâle)
  P.ch.forEach((ch, k) => { ctx.fillStyle = hexA(COUL[k], relie(P, k) ? .30 : .18); const vues = new Set(); ch.forEach(nd => { const i = cellule(P, nd); if(vues.has(i)) return; vues.add(i); ctx.fillRect(geo.x + (i % n) * c, geo.y + ((i / n) | 0) * c, c, c); }); });
  // la grille, creusée dans le bois
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2; ctx.beginPath();
  for(let q = 1; q < n; q++){ ctx.moveTo(geo.x + q * c, geo.y); ctx.lineTo(geo.x + q * c, geo.y + n * c); ctx.moveTo(geo.x, geo.y + q * c); ctx.lineTo(geo.x + n * c, geo.y + q * c); }
  ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,170,.10)'; ctx.lineWidth = 1; ctx.beginPath();
  for(let q = 1; q < n; q++){ ctx.moveTo(geo.x + q * c + 1.5, geo.y); ctx.lineTo(geo.x + q * c + 1.5, geo.y + n * c); ctx.moveTo(geo.x, geo.y + q * c + 1.5); ctx.lineTo(geo.x + n * c, geo.y + q * c + 1.5); }
  ctx.stroke();
  // les ponts de pierre
  P.G.ponts.forEach(i => { const x = geo.x + (i % n) * c, y = geo.y + ((i / n) | 0) * c;
    if(pret(IMG.pont)) ctx.drawImage(IMG.pont, x + c * .04, y + c * .04, c * .92, c * .92); else { ctx.fillStyle = '#d9cbb0'; ctx.fillRect(x + 4, y + 4, c - 8, c - 8); } });
  // l'indice : le début du fil en pointillés
  if(J.hint && J.hint.cases){ ctx.save(); ctx.setLineDash([6, 6]); ctx.lineWidth = Math.max(3, c * .12); ctx.lineCap = 'round'; ctx.strokeStyle = hexA(COUL[J.hint.k], .6 + .3 * Math.sin(t * 5)); ctx.beginPath(); J.hint.cases.forEach((nd, q) => { const [x, y] = centre(cellule(P, nd)); q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore(); }
  // les fils de laine : d'abord tous, puis par-dessus la voie horizontale des ponts (le fil passe « sur » le pont)
  const fil = (k, pts) => { if(pts.length < 2) return; const e = c * .30;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = c * .12; ctx.shadowOffsetY = c * .05;
    ctx.strokeStyle = COUL[k]; ctx.lineWidth = e; ctx.beginPath(); pts.forEach(([x, y], q) => q ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
    if(T){ for(let q = 1; q < pts.length; q++){ const [x0, y0] = pts[q - 1], [x1, y1] = pts[q], L = Math.hypot(x1 - x0, y1 - y0);
        ctx.save(); ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, x1 - x0)); ctx.drawImage(T.brin[k], 0, 0, T.brin[k].width * (L / (c * 2.2)), T.brin[k].height, -e * .1, -e / 2, L + e * .2, e); ctx.restore(); } } };
  P.ch.forEach((ch, k) => fil(k, ch.map(nd => centre(cellule(P, nd)))));
  P.ch.forEach((ch, k) => ch.forEach((nd, q) => { if(nd < n * n || (nd - n * n) % 2 !== 0) return;   // voie horizontale d'un pont
    const a = ch[q - 1], b = ch[q + 1], pts = [a, nd, b].filter(x => x != null).map(x => centre(cellule(P, x)));
    if(pts.length >= 2){ const [cx, cy] = centre(cellule(P, nd)); const mi = (p0, p1) => [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2]; fil(k, [mi(pts[0], [cx, cy]), [cx, cy], mi([cx, cy], pts[pts.length - 1])]); } }));
  // les pelotes de laine
  P.pel.forEach((pp, k) => pp.forEach(i => { const [x, y] = centre(i), pu = J.pulse[k] ? Math.max(0, J.pulse[k] - t) : 0, h = J.hint && J.hint.k === k && !J.hint.cases ? .5 + .5 * Math.sin(t * 8) : 0;
    const r = c * (.40 + .07 * Math.sin(pu * 12) * (pu > 0) + .06 * h);
    ctx.save(); ctx.shadowColor = h ? COUL[k] : 'rgba(0,0,0,.6)'; ctx.shadowBlur = c * (.18 + h * .6); ctx.shadowOffsetY = h ? 0 : c * .06;
    if(T){ const im = T.pel[k], s2 = r * 2.1, rr = im.height / im.width; ctx.drawImage(im, x - s2 / 2, y - s2 * rr / 2, s2, s2 * rr); }
    else { ctx.fillStyle = COUL[k]; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    ctx.restore();
    if(REG().sym){ ctx.save(); ctx.fillStyle = k === 9 || k === 3 || k === 13 ? '#1f1a3d' : '#fff'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 4; ctx.font = `800 ${Math.round(r * .95)}px "Segoe UI Symbol", "Apple Symbols", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(SYMB[k], x, y + r * .04); ctx.restore(); }
  }));
  // le doigt
  if(doigt && J.G){ ctx.fillStyle = hexA(COUL[J.G.k], .28); ctx.beginPath(); ctx.arc(doigt.x, doigt.y, c * .6, 0, 7); ctx.fill(); }
  // les éclats de la victoire
  J.eclats.forEach(p => { ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - p.t / 1.6); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); ctx.restore(); }); ctx.globalAlpha = 1;
}
function rond(x, y, w, h, r){ ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
let derniere = performance.now();
function boucle(now){ const dt = Math.min(.05, (now - derniere) / 1000); derniere = now;
  if(J){ J.eclats.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.r += p.vr * dt; }); J.eclats = J.eclats.filter(p => p.t < 1.6);
    if(J.chrono && !J.pause && !J.chrono.fini){ const reste = Math.max(0, J.chrono.fin - now); $('sChrono').textContent = '⏱️ ' + Math.floor(reste / 60000) + ':' + String(Math.floor(reste / 1000) % 60).padStart(2, '0'); if(reste <= 0) finChrono(); }
    if($('jeu').classList.contains('on')) dessine(); }
  requestAnimationFrame(boucle); }
requestAnimationFrame(boucle);

/* ---------- les doigts et la souris ---------- */
function caseDe(e){ const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, n = J.P.n, cx = Math.floor((x - geo.x) / geo.c), cy = Math.floor((y - geo.y) / geo.c);
  return { x, y, i:cx >= 0 && cy >= 0 && cx < n && cy < n ? cy * n + cx : -1 }; }
cv.addEventListener('pointerdown', e => { if(!J || J.fini || J.pause) return; ac(); const q = caseDe(e); if(q.i < 0) return;
  const avant = J.P.ch.map(c => c.slice()), G = debut(J.P, q.i, REG().col); if(!G){ return; }
  J.G = G; J.G.av = avant; J.hint = J.hint && J.hint.k === G.k ? null : J.hint; doigt = q; try{ cv.setPointerCapture(e.pointerId); }catch(_){} SON.tic(G.k); stats(); });
cv.addEventListener('pointermove', e => { if(!J || !J.G) return; const q = caseDe(e); doigt = q; if(q.i < 0) return;
  const P = J.P, c = P.ch[J.G.k], h = cellule(P, c[c.length - 1]); if(q.i === h) return;
  const coupees = P.ch.map(x => x.length);
  let bouge = false;
  if(dansFil(P, J.G.k, q.i) >= 0 && !P.G.estPont(q.i)) bouge = pas(P, J.G, q.i);
  else for(const i of chemin(P.n, h, q.i)){ if(pas(P, J.G, i)) bouge = true; else { if(bouge === false) SON.non(); break; } }
  if(!bouge) return;
  const k = J.G.k; if(P.ch.some((x, d) => d !== k && x.length < coupees[d])) SON.coupe(); else SON.tic(k);
  if(relie(P, k) && !J.G.reliee){ J.G.reliee = true; SON.relie(k); vibre(18); J.pulse[k] = performance.now() / 1000 + .35; if(!bilan(P).gagne && Math.random() < .5) dit('Le fil ' + NOMS[k] + ' est relié !', 'أَحْسَنْت! الخَيْطُ ' + NOMS_AR[k] + ' مَوْصُول.'); } else if(!relie(P, k)) J.G.reliee = false;
  stats(); });
function lache(){ if(!J || !J.G) return; const G = J.G; J.G = null; doigt = null;
  if(fin(J.P, G)){ J.undo.push(G.av); if(G.k !== J.dernier){ J.coups++; J.dernier = G.k; } }
  const b = stats(); if(b.gagne) victoire(); else if(b.toutesReliees){ toast('Tous les fils sont reliés… mais il reste des cases vides ! ▦'); dit('Bravo ! Maintenant, il faut remplir toutes les cases.', 'رائِع! لَكِنْ بَقِيَتْ مُرَبَّعاتٌ فارِغَة، امْلَأْها كُلَّها.'); } }
cv.addEventListener('pointerup', lache); cv.addEventListener('pointercancel', lache);

$('bAnnule').onclick = () => { if(!J || J.fini || !J.undo.length) return; J.P.ch = J.undo.pop(); J.hint = null; stats(); };
$('bRecommence').onclick = () => { if(!J || J.fini) return; if(J.P.ch.some(c => c.length)) J.undo.push(J.P.ch.map(c => c.slice())); J.P.ch = J.P.pel.map(() => []); J.hint = null; J.coups = 0; J.dernier = -1; stats(); };
$('bIndice').onclick = () => { if(!J || J.fini) return; const P = J.P; SON.indice();
  // 1er appui : quelle couleur ; 2e : le début du fil ; 3e : le fil entier (toujours la solution vérifiée)
  if(J.hint && J.hint.etape === 1){ const s = cheminSolution(P, J.hint.k); J.hint = { k:J.hint.k, etape:2, cases:s.slice(0, Math.max(2, Math.ceil(s.length / 2))) }; J.indices++; toast('Voici le début du fil ' + NOMS[J.hint.k] + ' 👀'); dit('Voici le début du fil ' + NOMS[J.hint.k] + '.', 'هَذِهِ بِدايَةُ الخَيْطِ ' + NOMS_AR[J.hint.k] + '.'); return; }
  if(J.hint && J.hint.etape === 2){ J.undo.push(P.ch.map(c => c.slice())); poseSolution(P, J.hint.k); J.pulse[J.hint.k] = performance.now() / 1000 + .35; J.hint = null; J.indices++; const b = stats(); if(b.gagne) victoire(); return; }
  let k = P.pel.findIndex((_, d) => !P.ch[d].length && !bonFil(P, d)); if(k < 0) k = P.pel.findIndex((_, d) => !bonFil(P, d)); if(k < 0) return;
  J.hint = { k, etape:1 }; J.indices++; toast('Essaie le fil ' + NOMS[k] + ' ' + SYMB[k]); dit('Essaie le fil ' + NOMS[k] + ' !', 'جَرِّبِ الخَيْطَ ' + NOMS_AR[k] + '!'); };
$('bPause').onclick = () => pause();
function pause(){ if(!J || J.fini) return; J.pause = performance.now();
  modal(`<h2>⏸ Pause</h2><p>${J.titre}</p><div class="rang"><button class="gros" data-r>▶ Reprendre</button><button class="btn" data-m>🏠 Menu</button><button class="btn" data-g>⚙️</button></div>`);
  $('modal').onclick = e => { if(e.target.closest('[data-r]')) reprend(); else if(e.target.closest('[data-m]')){ ferme(); J = null; menu(); records(); } else if(e.target.closest('[data-g]')) reglages(); }; }
function reprend(){ if(J && J.pause){ if(J.chrono) J.chrono.fin += performance.now() - J.pause; J.pause = 0; } ferme(); }
addEventListener('keydown', e => { if(!J || !$('jeu').classList.contains('on')) return;
  if(e.code === 'KeyP' || e.code === 'Escape'){ if(J.pause) reprend(); else pause(); }
  else if((e.ctrlKey || e.metaKey) && e.code === 'KeyZ'){ e.preventDefault(); $('bAnnule').click(); }
  else if(e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) $('bRecommence').click();
  else if(e.code === 'KeyH' || e.code === 'KeyI') $('bIndice').click(); });

/* ---------- la victoire ---------- */
function eclats(){ const n = J.P.n; for(let q = 0; q < 90; q++){ const k = q % J.P.pel.length; J.eclats.push({ x:geo.x + Math.random() * geo.c * n, y:geo.y + geo.c * n * .5, vx:(Math.random() - .5) * 600, vy:-200 - Math.random() * 500, r:Math.random() * 6, vr:(Math.random() - .5) * 12, w:6 + Math.random() * 8, t:0, c:COUL[k] }); } }
function victoire(){
  J.fini = true; SON.gagne(); vibre([30, 40, 30]); eclats();
  const e = J.indices === 0 ? 3 : J.indices <= 2 ? 2 : 1;
  if(J.chrono){ J.chrono.n++; toast('Bravo ! ' + J.chrono.n + ' grille' + (J.chrono.n > 1 ? 's' : '') + ' ✔', 1200); setTimeout(() => { if(J && J.chrono && !J.chrono.fini) prochaineChrono(); }, 900); return; }
  if(!sv) sv = neuf();
  if(J.piste === 'jour'){ const o = sv.jours[J.i] || {}; sv.jours[J.i] = { e:Math.max(o.e || 0, e) }; }
  else { const prog = J.piste === 'pet' ? sv.pet : J.piste === 'pon' ? (sv.pon || (sv.pon = {})) : sv.niv, o = prog[J.i] || {}; prog[J.i] = { e:Math.max(o.e || 0, e), c:Math.min(o.c || 1e9, J.coups) }; }
  sauve(); if(window.Famille && joueur) Famille.score('khyout', 'etoiles', total(), joueur).catch(() => {});
  dit(e === 3 ? 'Bravo ! Trois étoiles !' : 'Bravo, tu as réussi !', e === 3 ? 'مُمْتاز! ثَلاثُ نُجوم!' : 'أَحْسَنْت، لَقَدْ نَجَحْت!');
  const L = liste(J.piste), suivant = J.piste !== 'jour' && J.i + 1 < L.length;
  setTimeout(() => {
    modal(`<h2>Bravo${joueur ? ', ' + joueur : ''} !</h2><div class="etoiles">${'⭐'.repeat(e)}${'<span style="opacity:.25">⭐</span>'.repeat(3 - e)}</div>
      <p>${J.coups} coup${J.coups > 1 ? 's' : ''}${J.indices ? ' · ' + J.indices + ' indice' + (J.indices > 1 ? 's' : '') : ' · sans indice'}</p>
      <div class="rang">${suivant ? '<button class="gros" data-s>Niveau suivant ▶</button>' : ''}<button class="btn" data-r>⟲ Rejouer</button><button class="btn" data-m>🏠 Menu</button></div>`);
    $('modal').onclick = ev => { const o = J; if(ev.target.closest('[data-s]')){ const i = o.i + 1; partie({ niv:L[i], piste:o.piste, i, titre:titreDe(o.piste, i) }); }
      else if(ev.target.closest('[data-r]')) partie({ niv:o.niv, piste:o.piste, i:o.i, titre:o.titre });
      else if(ev.target.closest('[data-m]')){ ferme(); J = null; menu(); records(); } };
  }, 1100);
}

/* ---------- le chrono ---------- */
function poolChrono(){ if(chronoTaille === 'petit') return PETITS; const n = +chronoTaille; return NIVEAUX.filter(l => l.n === n); }
function lanceChrono(){ const ch = { fin:performance.now() + chronoDuree * 1000, n:0, fini:false, deja:new Set() }; J = null; prochaineChrono(ch); }
function prochaineChrono(ch){ ch = ch || J.chrono; const pool = poolChrono(); let q; do{ q = (Math.random() * pool.length) | 0; }while(ch.deja.has(q) && ch.deja.size < pool.length); ch.deja.add(q);
  partie({ niv:pool[q], piste:'chrono', i:q, titre:'⏱️ Chrono · grille ' + (ch.n + 1), chrono:ch }); }
function finChrono(){ const ch = J.chrono; ch.fini = true; J.fini = true; SON.gagne();
  const k = chronoDuree + ':' + chronoTaille; if(!sv) sv = neuf(); const avant = sv.chrono[k] || 0; if(ch.n > avant){ sv.chrono[k] = ch.n; sauve(); }
  dit('Temps écoulé ! Tu as fini ' + ch.n + ' grille' + (ch.n > 1 ? 's' : '') + '.', 'انْتَهى الوَقْت! عَدَدُ الشَّبَكاتِ الَّتِي أَنْهَيْتَها: ' + ch.n);
  modal(`<h2>⏱️ Temps écoulé !</h2><div class="etoiles">${ch.n}</div><p>grille${ch.n > 1 ? 's' : ''} terminée${ch.n > 1 ? 's' : ''} en ${chronoDuree / 60} min${ch.n > avant && ch.n ? ' — <b style="color:#4ade80">nouveau record !</b>' : avant ? ' · record : ' + avant : ''}</p>
    <div class="rang"><button class="gros" data-r>🔁 Encore</button><button class="btn" data-m>🏠 Menu</button></div>`);
  $('modal').onclick = e => { if(e.target.closest('[data-r]')){ ferme(); lanceChrono(); } else if(e.target.closest('[data-m]')){ ferme(); J = null; menu(); records(); } }; }

/* ---------- au démarrage ---------- */
window.__khyout = { get J(){ return J; }, partie, PETITS, NIVEAUX, PONTS, menu, victoire };
const p0 = window.Famille ? Famille.player() : null;
if(p0) setJoueur(p0); else { MODE = 'classique'; menu(); }
records();
