/* Kassar : le dessin (canvas 2D), les menus, les sons, la sauvegarde. Les règles et la physique sont dans regles.js. */
import { W, H, COLS, CW, CH, TOP, LIGNE, R, DT, RANGS, nouvellePartie, tire, pas, rappelle, guide, yDe, visible, reste, etoiles, scoreFinal, NIVEAUX, MONDES, RQ, nouvellePartieR, bougeR, lanceR, pasR, etoilesR, scoreFinalR } from './regles.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const IMG = new URL('./img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const img = n => { const i = new Image(); i.src = IMG + n + '.webp'; return i; };
const ok = i => i && i.complete && i.naturalWidth > 0;
const IM = { balle:img('balle'), bonus:img('bonus'), jarre:img('jarre'), mur:img('mur'), fonds:{}, tuiles:{} };
['turquoise', 'bleu', 'vert', 'jaune', 'rouge', 'violet', 'mosaique'].forEach(c => IM.tuiles[c] = img('z-' + c));
const COUL = { turquoise:'#2fc6c0', bleu:'#1f3fa8', vert:'#18865a', jaune:'#f0b52a', rouge:'#c9542f', violet:'#6b3fb0', mosaique:'#d9a35e' };
const fond = m => IM.fonds[m] || (IM.fonds[m] = img('fond-' + m));

/* ---------- les sons (ElevenLabs par son.php, sinon de petits bips) ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function bip(f, d = .08, type = 'triangle', v = .07, f2 = 0){ const a = ac(); if(!a) return; const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const SON_URL = new URL('./son.php', import.meta.url).href, BUF = {};
async function charge(url, k){ const a = ac(); if(!a) return; try{ const b = await fetch(url).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }); (BUF[k] = BUF[k] || []).push(await new Promise((o, x) => a.decodeAudioData(b, o, x))); }catch(e){} }
let sonsOk = false; function sons(){ if(sonsOk) return; sonsOk = true; fetch(SON_URL + '?liste=1').then(r => r.json()).then(l => l.forEach(n => charge(SON_URL + '?n=' + n, n.replace(/\d+$/, '')))).catch(() => {}); }
let dernier = {};
function joue(k, v = .7, max = 2){ const a = ac(), l = BUF[k]; if(!a || !l || !l.length) return false; const now = a.currentTime; if(now - (dernier[k] || 0) < .045) return true; dernier[k] = now;
  const s = a.createBufferSource(), g = a.createGain(), b = l[Math.floor(Math.random() * l.length)], m = Math.min(b.duration, max); s.buffer = b; g.gain.setValueAtTime(v, now); g.gain.setValueAtTime(v, now + Math.max(0, m - .15)); g.gain.linearRampToValueAtTime(0, now + m); s.connect(g); g.connect(a.destination); s.start(now); s.stop(now + m + .05); return true; }
const SON = {
  tir(){ joue('tir', .5, 1) || bip(500, .12, 'sine', .06, 900); },
  coup(hp){ joue('tuile', .35, .5) || bip(300 + Math.min(hp, 12) * 60, .05, 'square', .04); },
  casse(){ joue('casse', .6, 1.2) || bip(900, .12, 'triangle', .07, 300); },
  boum(){ joue('jarre', .8, 2) || bip(120, .35, 'sawtooth', .1, 40); },
  bonus(){ joue('bonus', .7, 1.2) || [880, 1175].forEach((f, i) => setTimeout(() => bip(f, .1, 'sine'), i * 70)); },
  descend(){ joue('descend', .45, 1.2) || bip(160, .2, 'sine', .06, 110); },
  gagne(){ joue('victoire', .8, 4) || [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => bip(f, .25, 'triangle', .09), i * 110)); },
  perdu(){ joue('perdu', .7, 2.5) || [392, 330, 262].forEach((f, i) => setTimeout(() => bip(f, .3, 'sine', .08), i * 160)); },
  raquette(){ bip(420, .06, 'triangle', .07, 620); },
  bord(){ bip(700, .03, 'sine', .025); },
};
const parle = t => { try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t.replace(/[^\p{L}\p{N} ,.!?'’:-]/gu, '')); u.lang = 'fr-FR'; u.rate = .95; speechSynthesis.speak(u); }catch(e){} };

/* ---------- la sauvegarde ---------- */
let joueur = null, sv = null;
const neuf = () => ({ niv:{}, nivR:{}, diff:'normal', t:0 });
let MODE = store.get('kassar-mode', 'tir');   // le mode choisi (tir ou raquette), gardé sur la tablette
const modeR = () => MODE === 'raquette';
const progres = () => { const s = sv || neuf(); return modeR() ? (s.nivR || (s.nivR = {})) : s.niv; };
const cle = () => 'kassar:' + joueur;
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
const totalEtoiles = () => [...Object.values((sv || neuf()).niv), ...Object.values((sv || neuf()).nivR || {})].reduce((a, n) => a + (n.e || 0), 0);
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {});
  if(window.Famille && Famille.track){ Famille.track('kassar', n, [cle()]); try{ const r = await Famille.load('kassar', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu(); }
async function choisirJoueur(){ if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue à Kassar ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n; }
const tete = n => { const k = String(n || '').toLowerCase(); if(['essil', 'salma', 'amine', 'anis', 'imen'].includes(k)) return AV + 'reel/' + k + '.webp'; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h ? AV + 'reel/' + h.id + '.webp' : null; };
let teteIm = null;

/* ---------- le menu ---------- */
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }
function menu(){
  document.body.classList.remove('jeu'); montre('menu'); $('modal').classList.remove('on'); P = null; $('aide').classList.add('off');
  const s = sv || neuf();
  $('who').innerHTML = joueur ? (tete(joueur) ? `<img src="${tete(joueur)}" alt="">` : '🙂') + esc(joueur) : 'Qui joue ?';
  $('total').textContent = '⭐ ' + totalEtoiles();
  $('diff').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.d === s.diff));
  document.querySelectorAll('.mode').forEach(b => b.classList.toggle('on', b.dataset.m === MODE));
  const nv = progres(), ouvert = i => i === 0 || (nv[i - 1] && nv[i - 1].e > 0), suivant = NIVEAUX.findIndex((_, i) => ouvert(i) && !(nv[i] && nv[i].e));
  $('niveaux').innerHTML = MONDES.map((m, mi) => { const L = NIVEAUX.map((n, i) => [n, i]).filter(([n]) => n.m === mi);
    return `<div class="monde">${mi + 1} · ${m.nom}</div><div class="niveaux">${L.length ? L.map(([n, i]) => { const e = nv[i] && nv[i].e || 0;
      return `<button class="niv ${!ouvert(i) ? 'ferme' : i === suivant ? 'suivant' : ''}" data-i="${i}" title="${esc(n.nom)}" ${ouvert(i) ? '' : 'disabled'}>${ouvert(i) ? i + 1 : '🔒'}<small>${'★'.repeat(e)}</small></button>`; }).join('')
      : '<div class="niv bientot">bientôt</div>'.repeat(3)}</div>`; }).join('');
  records();
}
async function records(){ const rows = window.Famille ? await Famille.highscores('kassar', 'etoiles', 10).catch(() => null) : null;
  $('records').innerHTML = rows && rows.length ? rows.map(r => `<li>${esc(r.player)} — <b>${r.score}</b> ⭐</li>`).join('') : '<p class="none">Personne encore : à toi !</p>'; }
$('diff').onclick = e => { const b = e.target.closest('button'); if(!b) return; if(!sv) sv = neuf(); sv.diff = b.dataset.d; sauve(); menu(); };
$('niveaux').onclick = async e => { const b = e.target.closest('[data-i]'); if(!b || b.disabled) return; ac(); sons(); if(!joueur && !(await choisirJoueur())) return; partie(+b.dataset.i); };
$('who').onclick = () => choisirJoueur();
document.querySelectorAll('.mode').forEach(b => b.onclick = () => { MODE = b.dataset.m; store.set('kassar-mode', MODE); menu(); });

/* ---------- la partie ---------- */
const cv = $('cv'), ctx = cv.getContext('2d');
let P = null, vue = { k:1, ox:0, oy:0 }, vise = null, appui = false, vitesse = 1, parts = [], secousse = 0;
function taille(){ const dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  const k = Math.min(innerWidth / W, innerHeight / (H + 20)); vue = { k:k * dpr, ox:(innerWidth - W * k) / 2 * dpr, oy:(innerHeight - H * k) / 2 * dpr, dpr }; }
addEventListener('resize', taille); taille();
function partie(i){
  const niv = NIVEAUX[i], facile = (sv || neuf()).diff === 'facile', s = modeR() ? nouvellePartieR(niv, { facile }) : nouvellePartie(niv, { facile });
  P = { i, niv, s, monde:MONDES[niv.m], t0:performance.now(), vol:0, fini:false };
  teteIm = null; const t = tete(joueur); if(t){ teteIm = new Image(); teteIm.src = t; }
  montre('-'); document.body.classList.add('jeu'); $('modal').classList.remove('on'); vitesse = 1; parts = [];
  const aide = s.mode === 'raquette' ? 'Glisse ton doigt pour bouger la raquette, et touche l’écran pour lancer la balle. Ne la laisse pas tomber !' : niv.aide;
  const a = $('aide'); a.textContent = '« ' + niv.nom + ' » — ' + aide; a.classList.remove('off'); parle(aide);
  clearTimeout(a._t); a._t = setTimeout(() => a.classList.add('off'), 7000);
}
$('aide').onclick = () => $('aide').classList.add('off');
// viser : on pose le doigt, on glisse, on lâche
const versMonde = e => { const r = cv.getBoundingClientRect(), d = vue.dpr; return [((e.clientX - r.left) * d - vue.ox) / vue.k, ((e.clientY - r.top) * d - vue.oy) / vue.k]; };
const angle = ([x, y]) => P && y < LIGNE - 8 ? Math.atan2(LIGNE - R - y, x - P.s.lx) : null;
const enR = () => P && P.s.mode === 'raquette';
cv.addEventListener('pointerdown', e => { if(enR() && !P.pause && !$('modal').classList.contains('on')){ ac(); sons(); $('aide').classList.add('off'); appui = true; bougeR(P.s, versMonde(e)[0]); try{ cv.setPointerCapture(e.pointerId); }catch(x){} return; }
  if(!P || P.s.phase !== 'vise' || $('modal').classList.contains('on')) return; ac(); sons(); $('aide').classList.add('off'); appui = true; vise = angle(versMonde(e)); try{ cv.setPointerCapture(e.pointerId); }catch(x){} });
cv.addEventListener('pointermove', e => { if(enR() && !P.pause){ if(appui || e.pointerType === 'mouse') bougeR(P.s, versMonde(e)[0]); return; }
  if(!appui || !P) return; vise = angle(versMonde(e)); });
cv.addEventListener('pointerup', e => { if(enR()){ appui = false; if(!P.pause) lanceR(P.s); return; }
  if(!appui || !P) return; appui = false; const a = vise; vise = null; if(a !== null && tire(P.s, a)){ P.vol = 0; vitesse = 1; } });
cv.addEventListener('pointercancel', () => { appui = false; vise = null; });
const touches = {}; addEventListener('keyup', e => { touches[e.code] = false; });
addEventListener('keydown', e => { if(!P) return; touches[e.code] = true; if(e.code === 'Escape' || e.code === 'KeyP') pause(); if(enR() && (e.code === 'Space' || e.code === 'ArrowUp')){ e.preventDefault(); lanceR(P.s); } });
$('pause').onclick = () => pause();
$('vite').onclick = () => { vitesse = vitesse === 1 ? 2.5 : 1; $('vite').textContent = vitesse > 1 ? '▶' : '⏩'; };
$('rappel').onclick = () => { if(P) rappelle(P.s); };
function pause(){ if(!P || $('modal').classList.contains('on')) return; P.pause = true;
  modal(`<h2>Pause</h2><div class="rang"><button class="pill go" id="mRep">▶ Reprendre</button><button class="pill" id="mRe">🔁 Recommencer</button><button class="pill" id="mMenu">🏠 Niveaux</button></div>`);
  $('mRep').onclick = () => { $('modal').classList.remove('on'); P.pause = false; }; $('mRe').onclick = () => partie(P.i); $('mMenu').onclick = () => menu(); }
function modal(h){ $('modal').innerHTML = '<div class="carte">' + h + '</div>'; $('modal').classList.add('on'); }

/* les événements du moteur : sons, éclats */
const tuileDe = b => P.monde.tuiles[Math.min(5, Math.max(0, Math.ceil(b.hp0 / 2) - 1))];
function eclats(b, n = 10){ const x = b.c * CW + CW / 2, y = yDe(P.s, b) + CH / 2, c = b.k === 'jarre' ? '#c9542f' : COUL[tuileDe(b)] || '#fff';
  for(let i = 0; i < n; i++) parts.push({ x, y, vx:(Math.random() - .5) * 260, vy:-Math.random() * 220 - 40, t:0, c, w:4 + Math.random() * 6 }); }
function evenements(){ const s = P.s;
  for(const e of s.ev.splice(0)){
    if(e.k === 'tir') SON.tir();
    else if(e.k === 'coup') SON.coup(e.b.hp);
    else if(e.k === 'casse'){ SON.casse(); eclats(e.b); }
    else if(e.k === 'boum'){ SON.boum(); eclats(e.b, 24); secousse = .35; }
    else if(e.k === 'bonus'){ SON.bonus(); parts.push({ x:e.b.c * CW + CW / 2, y:yDe(s, e.b) + CH / 2, vx:0, vy:-60, t:0, txt:'+1' }); }
    else if(e.k === 'descend') SON.descend();
    else if(e.k === 'raquette') SON.raquette();
    else if(e.k === 'bord') SON.bord();
    else if(e.k === 'vie' && s.phase !== 'perdu'){ SON.descend(); secousse = .25; parts.push({ x:s.px, y:RQ.y - 30, vx:0, vy:-40, t:0, txt:'💔' }); }
    else if(e.k === 'gagne') fin(true);
    else if(e.k === 'perdu') fin(false);
  } }
function fin(gagne){ const s = P.s, i = P.i; P.fini = true;
  setTimeout(() => {
    if(!P || P.s !== s) return;
    const rq = s.mode === 'raquette';
    if(gagne){ SON.gagne(); const e = rq ? etoilesR(s) : etoiles(s), sc = rq ? scoreFinalR(s) : scoreFinal(s); if(!sv) sv = neuf(); const nv = rq ? (sv.nivR || (sv.nivR = {})) : sv.niv, o = nv[i] || {}; nv[i] = { e:Math.max(o.e || 0, e), sc:Math.max(o.sc || 0, sc) }; sauve();
      if(window.Famille && joueur) Famille.score('kassar', 'etoiles', totalEtoiles(), joueur).catch(() => {});
      parle(e === 3 ? 'Bravo ! Trois étoiles !' : 'Bravo, tu as tout cassé !');
      const suivant = i + 1 < NIVEAUX.length;
      modal(`<h2>🎉 Bravo${joueur ? ', ' + esc(joueur) : ''} !</h2><div class="etoiles">${[1, 2, 3].map(k => `<span class="${k <= e ? '' : 'off'}">⭐</span>`).join('')}</div>
        <p style="font-size:18px">${rq ? `Tout cassé en <b>${Math.round(s.t)}</b> secondes, ${s.viesPerdues ? `en perdant ${s.viesPerdues} balle${s.viesPerdues > 1 ? 's' : ''}` : 'sans perdre une seule balle'} (3 étoiles sans en perdre)` : `Tout cassé en <b>${s.tour}</b> tir${s.tour > 1 ? 's' : ''} (3 étoiles en ${s.niv.par} tirs ou moins)`} · ${s.casses} carreaux · score <b>${sc}</b></p>
        <div class="rang">${suivant ? '<button class="pill go" id="mSuite">▶ Niveau suivant</button>' : ''}<button class="pill" id="mRe">🔁 Rejouer</button><button class="pill" id="mMenu">🏠 Niveaux</button></div>`);
      if($('mSuite')) $('mSuite').onclick = () => partie(i + 1); }
    else { SON.perdu(); parle(rq ? 'Oh, plus de balles ! On réessaie ?' : 'Oh, les carreaux sont arrivés en bas. On réessaie ?');
      modal(`<h2>Oh non !</h2><p style="font-size:18px">${rq ? `Plus de balles ! Il restait ${reste(s)} carreaux.<br>Astuce : touche la balle avec le bord de la raquette pour l'envoyer de côté.` : `Les carreaux sont arrivés en bas. Il en restait ${reste(s)}.<br>Astuce : vise les trous pour que tes balles rebondissent derrière !`}</p>
        <div class="rang"><button class="pill go" id="mRe">🔁 Réessayer</button><button class="pill" id="mMenu">🏠 Niveaux</button></div>`); }
    $('mRe').onclick = () => partie(i); $('mMenu').onclick = () => menu();
  }, gagne ? 700 : 900); }

/* ---------- la boucle ---------- */
let avant = performance.now(), reste_ = 0;
function boucle(t){
  const dt = Math.min(.1, (t - avant) / 1000); avant = t;
  if(P && !P.pause && P.s.mode === 'raquette'){ const s = P.s;
    const dx = (touches.ArrowRight || touches.KeyD ? 1 : 0) - (touches.ArrowLeft || touches.KeyA ? 1 : 0); if(dx) bougeR(s, s.px + dx * 420 * dt);
    if(s.phase === 'jeu'){ reste_ += dt; let n = 0; while(reste_ >= DT && n++ < 60){ pasR(s); reste_ -= DT; } } else reste_ = 0;
    evenements(); $('vite').style.display = 'none'; $('rappel').style.display = 'none'; }
  else if(P && !P.pause){ const s = P.s;
    if(s.phase === 'vol'){ P.vol += dt; reste_ += dt * vitesse; let n = 0; while(reste_ >= DT && n++ < 60){ pas(s); reste_ -= DT; } if(P.vol > 40) rappelle(s); }
    else { reste_ = 0; P.vol = 0; if(vitesse !== 1){ vitesse = 1; $('vite').textContent = '⏩'; } }
    evenements();
    $('vite').style.display = s.phase === 'vol' && P.vol > 4 ? 'block' : 'none'; $('rappel').style.display = s.phase === 'vol' && P.vol > 12 ? 'block' : 'none';
  }
  for(const p of parts){ p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if(!p.txt) p.vy += 700 * dt; } parts = parts.filter(p => p.t < (p.txt ? 1 : .9));
  secousse = Math.max(0, secousse - dt);
  dessine(t / 1000);
  requestAnimationFrame(boucle);
}
requestAnimationFrame(boucle);
function cover(im, w, h){ if(!ok(im)) return false; const k = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k; ctx.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); return true; }
function dessine(t){
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if(!P){ ctx.clearRect(0, 0, cv.width, cv.height); return; }
  const s = P.s, f = fond(P.monde.id);
  ctx.fillStyle = '#0e1a2e'; ctx.fillRect(0, 0, cv.width, cv.height);
  if(cover(f, cv.width, cv.height)){ ctx.fillStyle = 'rgba(8,16,32,.55)'; ctx.fillRect(0, 0, cv.width, cv.height); }
  const sx = secousse ? (Math.random() - .5) * 8 * secousse : 0;
  ctx.setTransform(vue.k, 0, 0, vue.k, vue.ox + sx * vue.k, vue.oy);
  // l'aire de jeu : le fond du monde, un peu assombri
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  if(ok(f)){ const k = Math.max(W / f.naturalWidth, H / f.naturalHeight); ctx.drawImage(f, (W - f.naturalWidth * k) / 2, (H - f.naturalHeight * k) / 2, f.naturalWidth * k, f.naturalHeight * k); }
  ctx.fillStyle = 'rgba(10,18,36,.45)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, W, TOP);
  // la ligne de danger (où les carreaux ne doivent pas arriver)
  const lim = TOP + RANGS * CH; if(s.mode !== 'raquette'){ ctx.strokeStyle = 'rgba(255,90,90,.45)'; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(0, lim); ctx.lineTo(W, lim); ctx.stroke(); ctx.setLineDash([]); }
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, LIGNE, W, 2);
  // les carreaux
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for(const b of s.cs){ if(!visible(s, b)) continue; const x = b.c * CW + 1.5, y = yDe(s, b) + 1.5, w = CW - 3, h = CH - 3;
    if(b.k === 'bonus'){ const r = 13 + Math.sin(t * 5 + b.c) * 1.5; if(ok(IM.bonus)) ctx.drawImage(IM.bonus, x + w / 2 - r, y + h / 2 - r, r * 2, r * 2); else { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, r * .8, 0, 7); ctx.fill(); } continue; }
    if(b.k === 'jarre'){ if(ok(IM.jarre)){ const hh = h + 6, ww = hh * IM.jarre.naturalWidth / IM.jarre.naturalHeight; ctx.drawImage(IM.jarre, x + w / 2 - ww / 2, y - 4, ww, hh); } else { ctx.fillStyle = '#c9542f'; ctx.fillRect(x, y, w, h); } continue; }
    const im = b.k === 'mur' ? IM.mur : IM.tuiles[tuileDe(b)];
    ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 5) : ctx.rect(x, y, w, h); ctx.clip();
    if(ok(im)) ctx.drawImage(im, x, y, w, h); else { ctx.fillStyle = b.k === 'mur' ? '#777' : COUL[tuileDe(b)]; ctx.fillRect(x, y, w, h); }
    if(b.k === 'n' && b.hp < b.hp0){ ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); const n = Math.min(4, b.hp0 - b.hp);   // les fissures
      for(let k = 0; k < n; k++){ const a = (k * 2.1 + b.c) % 6.28; ctx.moveTo(x + w / 2, y + h / 2); ctx.lineTo(x + w / 2 + Math.cos(a) * w * .6, y + h / 2 + Math.sin(a) * h * .7); } ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, h - 1);
    if(b.k === 'n'){ ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(b.hp, x + w / 2, y + h / 2 + 1); ctx.fillStyle = '#fff'; ctx.fillText(b.hp, x + w / 2, y + h / 2 + 1); }
  }
  // le guide de visée
  if(vise !== null && s.phase === 'vise'){ const g = guide(s, vise); ctx.fillStyle = 'rgba(255,255,255,.9)'; g.pts.forEach(([x, y], i) => { if(i % 2 === 0){ ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); } });
    if(g.fin){ ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g.fin[0], g.fin[1], 6, 0, 7); ctx.stroke(); } }
  // les balles
  for(const b of s.bs){ if(!b.ok) continue; if(ok(IM.balle)) ctx.drawImage(IM.balle, b.x - R - 1, b.y - R - 1, R * 2 + 2, R * 2 + 2); else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill(); } }
  if(s.mode === 'raquette') dessineRaquette(s); else {
  // le lanceur : l'avatar, et ses balles
  const lx = s.phase === 'vol' && s.premier !== null ? s.premier : s.lx;
  if(s.phase !== 'vol' || s.aLancer > 0){ if(ok(IM.balle)) ctx.drawImage(IM.balle, s.lx - R - 1, LIGNE - 2 * R - 1, R * 2 + 2, R * 2 + 2); }
  ctx.save(); ctx.beginPath(); ctx.arc(lx, LIGNE + 22, 19, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); if(ok(teteIm)) ctx.drawImage(teteIm, lx - 19, LIGNE + 3, 38, 38); else { ctx.font = '26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🙂', lx, LIGNE + 24); } ctx.restore();
  ctx.font = '800 14px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText('×' + (s.phase === 'vol' ? s.aLancer : s.balles), lx + (lx > W - 50 ? -36 : 36), LIGNE + 22);
  }
  // les éclats
  for(const p of parts){ ctx.globalAlpha = Math.max(0, 1 - p.t / (p.txt ? 1 : .9));
    if(p.txt){ ctx.font = '800 20px "Baloo 2", sans-serif'; ctx.fillStyle = '#ffd34d'; ctx.fillText(p.txt, p.x, p.y); } else { ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.w, p.w * .7); } }
  ctx.globalAlpha = 1;
  // le bandeau du haut
  ctx.font = '800 17px "Baloo 2", sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText(`${P.i + 1} · ${P.niv.nom}`, W / 2, 20);
  ctx.font = '700 14px Nunito, sans-serif'; ctx.fillText(s.mode === 'raquette' ? `${'❤️'.repeat(Math.max(0, s.vies))} · reste ${reste(s)} carreaux · ${s.score} pts` : `Tir ${s.tour} · ⭐⭐⭐ en ${s.niv.par} · reste ${reste(s)} carreaux · ${s.score} pts`, W / 2, 44);
  ctx.restore();
}

/* la raquette : une planche de zellige doré, l'avatar du joueur dessous, et « Touche pour lancer » quand la balle attend */
function dessineRaquette(s){
  const x = s.px - s.pl / 2, y = RQ.y, w = s.pl, h = RQ.h;
  ctx.save(); ctx.shadowColor = 'rgba(255,211,77,.55)'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h); ctx.fillStyle = '#f2b632'; ctx.fill(); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h); ctx.clip(); const im = IM.tuiles.jaune; if(ok(im)) ctx.drawImage(im, x, y - 6, w, h + 12); ctx.restore();
  ctx.strokeStyle = '#7a4b12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(s.px, y + h + 20, 16, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); if(ok(teteIm)) ctx.drawImage(teteIm, s.px - 16, y + h + 4, 32, 32); else { ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🙂', s.px, y + h + 22); } ctx.restore();
  for(const b of s.bs) if(b.colle){ if(ok(IM.balle)) ctx.drawImage(IM.balle, b.x - R - 1, b.y - R - 1, R * 2 + 2, R * 2 + 2); else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, 7); ctx.fill(); } }
  if(s.phase === 'colle'){ ctx.font = '800 18px "Baloo 2", sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,' + (.6 + Math.sin(performance.now() / 250) * .3) + ')'; ctx.fillText('Touche pour lancer la balle', W / 2, RQ.y - 60); }
}

/* ---------- au démarrage ---------- */
sv = neuf(); menu();
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0);
window.__kassar = { get P(){ return P; }, partie, menu };
