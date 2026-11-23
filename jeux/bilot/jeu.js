/* Bilot (belote coinchée) : la table, les cartes, les enchères, les adversaires, les mondes, les sons, le commentaire,
   le jeu avec l'ordinateur et en ligne. Les règles sont dans regles.js ; en ligne, c'est le serveur (api/bilot.php) qui arbitre.
   Les images, les ambiances et le studio des voix viennent de la Chkobba (mêmes personnages, mêmes mondes). */
import { nouvellePartie, nouvelleManche, encherir, encheresPermises, jouer, permises, choisirEnchere, choisirCarte, vue, estime,
  coul, haut, force, points, equipe, SYM, NOMS_C, COULEURS } from './regles.js';
import * as VOIX from '../chkobba/voix.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const IMG = new URL('../chkobba/img/', import.meta.url).href, AV = new URL('../avatars/', import.meta.url).href;
const API = new URL('../../api/bilot.php', import.meta.url).href;
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const attends = ms => new Promise(r => setTimeout(r, ms));
const hasard = a => a[Math.floor(Math.random() * a.length)];

export const PERSOS = { garde:'Si Hamadi', marchand:'Am Lamine', voleur:'Fethi', controleur:'Si Mokhtar' };
const MONDES = [{ id:'sidibou', n:'Sidi Bou Saïd' }, { id:'kairouan', n:'Kairouan' }, { id:'tunis', n:'Café de la médina' }, { id:'djerba', n:'Djerba' }];
const ROUGE = c => coul(c) === 'c' || coul(c) === 'd';
const NOMH = { 7:'7', 8:'8', 9:'9', T:'10', V:'V', D:'D', R:'R', A:'A' };
const NOMH_LONG = { 7:'le 7', 8:'le 8', 9:'le 9', T:'le 10', V:'le valet', D:'la dame', R:'le roi', A:"l'as" };
const nomCarte = c => NOMH[haut(c)] + SYM[coul(c)];
const nomContrat = (v, c) => (v === 250 ? 'Capot' : v) + ' ' + SYM[c];
// ce que disent les adversaires (un peu de tunisien)
const DIT = {
  prend:['Je prends ! 💪', 'Yalla, je monte !', 'Hédhi lyya ! 😎', 'Nekhou ! 💪'],
  passe:['Passe.', 'Nfout 🙄', 'Passe, ya khouya.', 'Bla bla… passe.'],
  coinche:['Coinche ! ✋', 'Coinche, ya m\'3allem ! 😏', 'Mosta7il ! Coinche !'],
  surcoinche:['Surcoinche ! 😎', 'Surcoinche, tfarrej ! 🔥'],
  belote:['Belote ! 👑'], rebelote:['Rebelote ! 👑👑', 'Et… rebelote ! 👑'],
  pli:['Hédha mte3i ! 😁', 'Yaa sla7, el pli ! 💪', 'Mezyen ! 😏'],
  chute:['Dedans ! 😂', 'Tfarrej, dedans ! 😁', 'Ya wildi, dedans ! 😄'],
  boude:['Yaa khsara… 😤', 'Ouh, ça pique ! 😅', 'Mezyen, mezyen… 🙄'],
  gagne:['Barcha behi ! 🏆', 'Ya3tik essaha ! 👏'],
  perd:['Mabrouk ! Vous avez gagné 👏', 'Ya wildi, la prochaine fois… 😅'],
  coupe:['Je coupe ! ✂️', 'Tfadhel, coupe ! ✂️', 'Hop, coupé ! ✂️'],
};
// le commentaire (Mohammad en arabe, Céline en français, par api/voix.php) : [français, arabe]
const COUL_AR = { p:'بِيك', c:'كُور', d:'كَارُو', t:'تْرِيفْل' };
const PHRASE = {
  debut:() => ['Allez, on distribue !', 'هَيَّا، نُوَزِّعُ الوَرَق!'],
  atoi:() => ['À toi d\'annoncer : choisis un contrat et un atout, ou passe.', 'دَوْرُكَ: اِخْتَرْ عَقْدًا وَأَتُوًّا، أَوْ مُرّ.'],
  contrat:(v, c) => [v === 250 ? 'Capot à ' + NOMS_C[c] + ' !' : 'Contrat : ' + v + ' à ' + NOMS_C[c] + ' !', v === 250 ? 'كَابُو ' + COUL_AR[c] + '!' : 'العَقْدُ: ' + v + ' ' + COUL_AR[c] + '!'],
  coinche:() => ['Coinche ! Les points comptent double !', 'كْوَانْش! النِّقَاطُ مُضَاعَفَة!'],
  surcoinche:() => ['Surcoinche ! Quatre fois les points !', 'سُورْكْوَانْش! أَرْبَعَةُ أَضْعَاف!'],
  redonne:() => ['Tout le monde passe : on redistribue.', 'الجَمِيعُ مَرّ، نُعِيدُ التَّوْزِيع.'],
  belote:() => ['Belote… et rebelote !', 'بِيلُوت… وَرِيبِيلُوت!'],
  capot:() => ['Capot ! Tous les plis !', 'كَابُو! رَبِحُوا كُلَّ اللَّفَّات!'],
  fait:() => ['Contrat réussi !', 'نَجَحَ العَقْد!'],
  chute:() => ['Dedans ! Le contrat est tombé.', 'سَقَطَ العَقْد!'],
  gagne:() => ['Bravo, vous avez gagné la partie !', 'مَبْرُوك! رَبِحْتُمُ المُبَارَاة!'],
  perd:() => ['Ce sera pour la prochaine fois !', 'فِي المَرَّةِ القَادِمَة إِنْ شَاءَ الله!'],
};

/* ---------- les sons (ceux de la Chkobba) ---------- */
let AC = null; const ac = () => { if(!AC){ try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){} } if(AC && AC.state === 'suspended') AC.resume(); return AC; };
function ton(f, d, type = 'sine', v = .1, f2 = 0, t0 = 0){ const a = ac(); if(!a) return; const t = a.currentTime + t0, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + .02); }
const BRUIT = {}, SON_URL = new URL('../chkobba/son.php', import.meta.url).href, ZSON = new URL('../zarbia/son.php', import.meta.url).href;
async function chargeSon(url, k){ const a = ac(); if(!a) return; try{ const b = await fetch(url).then(r => { if(!r.ok) throw 0; return r.arrayBuffer(); }); BRUIT[k] = await new Promise((ok, ko) => a.decodeAudioData(b, ok, ko)); }catch(e){} }
function chargeListe(base, noms){ fetch(base + '?liste=1').then(r => r.json()).then(l => { const par = {}; l.forEach(n => { const k = n.slice(0, -1); (par[k] = par[k] || []).push(n); });
  for(const k of Object.keys(par)) if(!noms || noms.includes(k)) chargeSon(base + '?n=' + par[k][Math.floor(Math.random() * par[k].length)], k); }).catch(() => {}); }
let sonsCharges = false; function sons(){ if(sonsCharges) return; sonsCharges = true; chargeListe(SON_URL, ['carte', 'prise', 'distrib', 'chkobba']); chargeListe(ZSON, ['victoire', 'tap']); }
const MAXD = { carte:.8, prise:1.8, distrib:2.5, chkobba:3, tap:.4 };
function bruit(k, v = .8){ const a = ac(), b = BRUIT[k]; if(!a || !b) return false; const s = a.createBufferSource(), g = a.createGain(), t = a.currentTime, m = Math.min(b.duration, MAXD[k] || 9);
  g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + Math.max(0, m - .3)); g.gain.linearRampToValueAtTime(0, t + m); s.buffer = b; s.connect(g); g.connect(a.destination); s.start(t); s.stop(t + m + .05); return true; }
const SON = {
  carte(){ if(!bruit('carte', .7)) ton(1200, .05, 'square', .05, 300); }, pli(){ if(!bruit('prise', .6)) ton(500, .15, 'triangle', .08, 900); },
  distrib(){ if(!bruit('distrib', .6)) for(let i = 0; i < 4; i++) ton(1500, .04, 'square', .03, 400, i * .08); },
  fete(){ if(!bruit('chkobba', .8)) [523, 659, 784, 1047].forEach((f, i) => ton(f, .2, 'triangle', .1, 0, i * .07)); },
  coinche(){ [880, 660].forEach((f, i) => ton(f, .18, 'square', .07, 0, i * .12)); },
  belote(){ [784, 988, 1175].forEach((f, i) => ton(f, .2, 'sine', .1, 0, i * .08)); },
  victoire(){ if(!bruit('victoire', .8)) [523, 659, 784, 1047].forEach((f, i) => ton(f, .3, 'triangle', .1, 0, i * .1)); },
  tap(){ if(!bruit('tap', .5)) ton(660, .06, 'sine', .07); },
};
let amb = null, ambMonde = null;
async function ambiance(m){ const a = ac(); if(!a) return; if(amb){ try{ amb.stop(); }catch(e){} amb = null; } ambMonde = m; if(!m) return;
  const k = 'amb' + m; if(!BRUIT[k]){ try{ const l = await fetch(SON_URL + '?liste=1').then(r => r.json()); const n = l.filter(x => x.startsWith(k)); if(!n.length) return; await chargeSon(SON_URL + '?n=' + n[Math.floor(Math.random() * n.length)], k); }catch(e){ return; } }
  if(ambMonde !== m || !BRUIT[k]) return; const s = a.createBufferSource(), g = a.createGain(); g.gain.value = .2; s.buffer = BRUIT[k]; s.loop = true; s.connect(g); g.connect(a.destination); s.start(); amb = s; }

/* ---------- la sauvegarde ---------- */
let joueur = null, sv = null;
const neuf = () => ({ jouees:0, gagnees:0, contrats:0, capots:0, monde:'sidibou', niveau:'moyen', cible:1000, aide:1, langue:'ar', ensemble:1, t:0 });
const cle = () => 'bilot:' + joueur;
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
async function setJoueur(n){ joueur = n; sv = Object.assign(neuf(), store.get(cle(), {}) || {});
  if(window.Famille && Famille.track){ Famille.track('bilot', n, [cle()]); try{ const r = await Famille.load('bilot', n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(neuf(), d); store.set(cle(), sv); } }catch(e){} }
  menu(); }
async function choisirJoueur(){ if(!window.Famille) return null;
  const n = await Famille.choosePlayer({ title:'Qui joue au Bilot ?', cancel:!!joueur, extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }], avatar:k => `<img src="${AV}reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n); return n; }
const tete = n => { const k = String(n || '').toLowerCase(); if(['essil', 'salma', 'amine', 'anis', 'imen'].includes(k)) return AV + 'reel/' + k + '.webp'; const h = window.Famille && Famille.head ? Famille.head(n) : null; return h ? AV + 'reel/' + h.id + '.webp' : null; };
const visage = (p, humeur = 'malin') => p.perso ? IMG + p.perso + '-' + humeur + '.webp' : (p.tete || tete(p.nom) || '');

/* ---------- le commentaire ---------- */
function parle(k, ...a){
  if(VOIX.dit('commentateur', k)) return;   // une voix enregistrée par la famille passe d'abord
  const L = (sv && sv.langue) || 'ar'; if(L === 'non' || !PHRASE[k]) return;
  try{ if(!('speechSynthesis' in window)) return; const [fr, ar] = PHRASE[k](...a); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(L === 'ar' ? ar : fr); u.lang = L === 'ar' ? 'ar' : 'fr-FR'; speechSynthesis.speak(u); }catch(e){}
}
VOIX.regle({ jeu:'Bilot', perso:[
  ['prend', 'Quand il prend (annonce un contrat)', '« Yalla, je monte ! »'], ['coinche', 'Quand il coinche', '« Coinche ! »'],
  ['belote', 'Quand il dit belote', '« Belote… et rebelote ! »'], ['chute', 'Quand il met les autres dedans', '« Dedans ! »'],
  ['boude', 'Quand il tombe dedans', '« Yaa khsara… »'], ['gagne', 'Quand il gagne la partie', '« Barcha behi ! »'], ['perd', 'Quand il perd la partie', '« Mabrouk ! »'],
], comm:[
  ['debut', 'Au début de chaque manche', '« Allez, on distribue ! »'], ['coinche', 'Quand quelqu\'un coinche', '« Ouh, coinche ! »'],
  ['belote', 'Belote et rebelote', '« Belote et rebelote ! »'], ['capot', 'Un capot (tous les plis)', '« Capot !!! »'],
  ['chute', 'Un contrat qui tombe', '« Dedans ! »'], ['manche', 'À la fin de chaque manche', '« On compte les points ! »'],
  ['gagne', 'Quand tu gagnes la partie', '« Bravo, champion ! »'], ['perd', 'Quand tu perds la partie', '« Ce sera pour la prochaine ! »'],
] });

/* ---------- le menu ---------- */
function montre(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); }
function fond(m){ document.body.style.backgroundImage = `url(${IMG}monde-${m || 'sidibou'}.webp)`; }
const REGLAGES = [['cNiv', 'niveau'], ['cCible', 'cible'], ['cAide', 'aide'], ['cLangue', 'langue']];
function menu(){
  document.body.classList.remove('jeu'); montre('menu'); $('modal').classList.remove('on'); P = null; ambiance(null);
  const s = sv || neuf(); fond(s.monde);
  $('who').innerHTML = joueur ? (tete(joueur) ? `<img src="${tete(joueur)}" alt="">` : '🙂') + esc(joueur) + (s.gagnees ? ` · 🏆 ${s.gagnees}` : '') : 'Qui joue ?';
  $('persos').innerHTML = Object.entries(PERSOS).map(([k, n]) => `<img src="${IMG}${k}-malin.webp" alt="${n}" title="${n}">`).join('');
  for(const [id, k] of REGLAGES) $(id).querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v == s[k]));
  $('mondes').innerHTML = MONDES.map(m => `<button class="monde ${m.id === s.monde ? 'on' : ''}" data-m="${m.id}" style="background-image:url(${IMG}monde-${m.id}.webp)"><span>${m.n}</span></button>`).join('');
  records();
}
async function records(){ const rows = window.Famille ? await Famille.highscores('bilot', 'victoires', 10).catch(() => null) : null;
  $('records').innerHTML = rows && rows.length ? rows.map(r => `<li>${esc(r.player)} — <b>${r.score}</b> partie${r.score > 1 ? 's' : ''} gagnée${r.score > 1 ? 's' : ''}</li>`).join('') : '<p class="none">Personne encore : à toi !</p>'; }
for(const [id, k] of REGLAGES) $(id).onclick = e => { const b = e.target.closest('button'); if(!b) return; if(!sv) sv = neuf(); sv[k] = (k === 'niveau' || k === 'langue') ? b.dataset.v : +b.dataset.v; sauve(); SON.tap(); menu(); };
$('mondes').onclick = e => { const b = e.target.closest('[data-m]'); if(!b) return; if(!sv) sv = neuf(); sv.monde = b.dataset.m; sauve(); SON.tap(); menu(); };
$('who').onclick = () => choisirJoueur();

/* ---------- la table (commune au jeu avec l'ordi et en ligne) ----------
   P = { mode, moi, sieges:[{nom, tete, perso, bot}], v (ce que je vois), s (moteur, jeu seul), humeur[], monde, ann[] (dernière annonce de chacun), joues[] } */
let P = null;
const rel = i => (i - P.moi + 4) % 4, POS = ['moi', 'droite', 'haut', 'gauche'];
const nous = j => equipe(j) === equipe(P.moi);
const nomEquipe = e => P.sieges.filter((_, i) => equipe(i) === e).map((p, k) => (P.moi % 2 === e && P.sieges.indexOf(p) === P.moi) ? 'Toi' : p.nom.replace(' 🤖', '')).join(' & ');
// l'ordre dans la main : les couleurs alternent (noir, rouge), l'atout d'abord, la plus forte à gauche
const ALTERNE = { p:['p', 'c', 't', 'd'], c:['c', 'p', 'd', 't'], t:['t', 'd', 'p', 'c'], d:['d', 't', 'c', 'p'] };
function range(main, atout){ const o = ALTERNE[atout || 'p']; return main.slice().sort((a, b) => (o.indexOf(coul(a)) - o.indexOf(coul(b))) || (force(b, atout || '-') - force(a, atout || '-'))); }
function carteEl(c, cls = '', atout = P && P.v && P.v.contrat && P.v.phase !== 'enchere' ? P.v.contrat.c : null){
  const h = haut(c), s = SYM[coul(c)], fig = { V:'valet', D:'dame', R:'roi' }[h];
  const centre = fig ? `<div class="fig" style="background-image:url(${IMG}${fig}.webp)"></div>` : h === 'A' ? `<div class="gros">${s}</div>` : `<div class="gros"><span><b>${NOMH[h]}</b>${s}</span></div>`;
  return `<div class="c ${ROUGE(c) ? 'rouge' : 'noir'} ${atout && coul(c) === atout ? 'atout' : ''} ${cls}" data-c="${c}" role="img" aria-label="${NOMH_LONG[h]} de ${NOMS_C[coul(c)]}"><div class="co">${NOMH[h]}<i>${s}</i></div>${centre}<div class="co b">${NOMH[h]}<i>${s}</i></div></div>`;
}
const annTexte = a => a.k === 'passe' ? 'Passe' : a.k === 'coinche' ? 'Coinche ✋' : a.k === 'surcoinche' ? 'Surcoinche 🔥' : nomContrat(a.v, a.c);
function etatConseil(){ const v = P.v, mains = []; mains[P.moi] = v.main; return { phase:v.phase, tour:v.tour, contrat:v.contrat, coinche:v.coinche, mains, pli:v.pli, joues:P.joues.slice(), encheres:v.encheres }; }
function rend(){
  if(!P) return; const v = P.v, A = v.contrat ? v.contrat.c : null, enJeu = v.phase === 'jeu', enEnch = v.phase === 'enchere';
  $('sieges').innerHTML = P.sieges.map((p, i) => { const r = rel(i), ann = enEnch && P.ann[i] ? `<span class="ann ${/♥|♦/.test(P.ann[i]) ? 'rouge' : ''}">${esc(P.ann[i])}</span>` : '';
    const sous = r === 0 ? '' : `<small>${r === 2 ? '🤝 ton équipier' : 'adversaire'}</small>`;
    return `<div class="siege s-${POS[r]} ${nous(i) ? 'eq' : ''} ${v.tour === i && (enJeu || enEnch) ? 'tour' : ''}" data-s="${i}"><div class="av" style="background-image:url('${visage(p, P.humeur[i])}')">${v.donneur === i ? '<span class="don">donne</span>' : ''}</div><div class="info"><b>${esc(r === 0 ? (p.nom || 'Toi') : p.nom)}</b>${sous}${ann}</div></div>`; }).join('');
  // le pli au milieu
  document.querySelectorAll('#tapis .slot').forEach(sl => sl.innerHTML = '');
  for(const x of v.pli){ const sl = document.querySelector(`#tapis .slot.r${rel(x.j)}`); if(sl) sl.innerHTML = carteEl(x.c); }
  $('tapis').dataset.atout = A ? SYM[A] : '';
  // ma main
  const monTour = v.tour === P.moi && enJeu && !P.occupe, ok = monTour ? (v.permises && v.permises.length ? v.permises : permisesLocales()) : [];
  const aide = !sv || sv.aide !== 0;
  $('main').classList.toggle('mon-tour', monTour);
  $('main').innerHTML = range(v.main, A).map(c => carteEl(c, monTour ? (ok.includes(c) ? 'ok' : (aide ? 'non' : 'ok')) + (P.conseil === c ? ' conseil' : '') : '')).join('');
  $('main').querySelectorAll('.c.ok').forEach(el => { el.tabIndex = 0; el.setAttribute('role', 'button'); });
  document.documentElement.style.setProperty('--mh', $('main').offsetHeight + 'px');
  // les scores
  const me = equipe(P.moi), C = v.contrat;
  $('scores').innerHTML = `<div style="opacity:.8;font-size:12px">Manche ${v.manche} · en ${v.cible} points</div><div>${esc(nomEquipe(me))} : <b>${v.total[me]}</b></div><div>${esc(nomEquipe(1 - me))} : <b>${v.total[1 - me]}</b></div>`
    + (C ? `<div class="ctr"><big class="${ROUGE(C.c + '7') ? 'rouge' : ''}">${nomContrat(C.v, C.c)}</big>${v.coinche > 1 ? ` <b>×${v.coinche}</b>` : ''}<br><small>pris par ${esc(rel(C.j) === 0 ? 'toi' : P.sieges[C.j].nom)}</small>${enJeu ? `<br><small>Plis : nous ${v.plis[me]} · eux ${v.plis[1 - me]}</small>` : ''}</div>` : '');
  // la consigne et les enchères
  let cons = '';
  if(monTour) cons = `<span>À toi ! ${aide ? 'Les cartes dorées sont permises.' : ''}</span>${aide ? '<button id="bConseil">💡 Conseil</button>' : ''}`;
  else if(enJeu && v.tour >= 0 && !P.occupe) cons = `<span>${esc(P.sieges[v.tour].nom)} réfléchit…</span>`;
  $('consigne').innerHTML = cons;
  if($('bConseil')) $('bConseil').onclick = () => { P.conseil = choisirCarte(etatConseil(), P.moi, 'moyen'); SON.tap(); rend(); };
  rendEnchere();
}
function permisesLocales(){ try{ return permises(etatConseil(), P.moi); }catch(e){ return P.v.main; } }
/* le panneau des enchères (à mon tour) */
function rendEnchere(){
  const v = P.v, el = $('enchere');
  if(v.phase !== 'enchere' || v.tour !== P.moi || P.occupe){ el.classList.remove('on'); return; }
  const L = encheresPermises(etatConseil(), P.moi), ann = L.filter(a => a.k === 'annonce'), vals = [...new Set(ann.map(a => a.v))];
  if(!vals.includes(P.eVal)) P.eVal = vals[0]; if(!P.eCoul) P.eCoul = null;
  const C = v.contrat, aide = !sv || sv.aide !== 0;
  el.innerHTML = `<h3>${C ? 'Tu montes, tu passes ou tu coinches ?' : 'À toi d\'annoncer !'}</h3>
    <p class="actuel">${C ? `Contrat actuel : <b>${nomContrat(C.v, C.c)}</b> par ${esc(rel(C.j) === 0 ? 'toi' : P.sieges[C.j].nom)}${v.coinche > 1 ? ' (coinché)' : ''}` : 'Personne n\'a encore annoncé.'}</p>
    ${vals.length ? `<div class="vals">${vals.map(x => `<button data-val="${x}" class="${x === P.eVal ? 'on' : ''}">${x === 250 ? 'Capot' : x}</button>`).join('')}</div>
    <div class="coul">${COULEURS.map(c => `<button data-coul="${c}" class="${ROUGE(c + '7') ? 'rouge' : ''} ${P.eCoul === c ? 'on' : ''}" aria-label="atout ${NOMS_C[c]}">${SYM[c]}<small>${NOMS_C[c]}</small></button>`).join('')}</div>` : ''}
    <div class="act">${vals.length ? `<button class="go" data-a="annonce" ${P.eCoul ? '' : 'disabled style="opacity:.5"'}>✅ ${P.eCoul ? 'Annoncer ' + nomContrat(P.eVal, P.eCoul) : 'Choisis l\'atout'}</button>` : ''}
      <button data-a="passe">Passer</button>${L.some(a => a.k === 'coinche') ? '<button class="coinche" data-a="coinche">✋ Coinche !</button>' : ''}${L.some(a => a.k === 'surcoinche') ? '<button class="coinche" data-a="surcoinche">🔥 Surcoinche !</button>' : ''}
      ${aide ? '<button class="conseil" data-a="conseil">💡 Conseil</button>' : ''}</div>
    <p class="astuce" id="astuce">${P.astuce || ''}</p>`;
  el.classList.add('on');
}
$('enchere').onclick = e => { const b = e.target.closest('button'); if(!b || !P || P.occupe) return; ac();
  if(b.dataset.val){ P.eVal = +b.dataset.val; SON.tap(); return rendEnchere(); }
  if(b.dataset.coul){ P.eCoul = b.dataset.coul; SON.tap(); return rendEnchere(); }
  const a = b.dataset.a; if(!a) return;
  if(a === 'conseil'){ const s = etatConseil(), c = choisirEnchere(s, P.moi, 'malin', Math.random), main = P.v.main;
    if(c.k === 'annonce'){ P.eVal = c.v; P.eCoul = c.c; const at = main.filter(x => coul(x) === c.c);
      P.astuce = `💡 Annonce ${nomContrat(c.v, c.c)} : tu as ${at.length} atout${at.length > 1 ? 's' : ''}${at.some(x => haut(x) === 'V') ? ', dont le valet' : ''}${at.some(x => haut(x) === '9') ? ' et le 9' : ''}.`; }
    else if(c.k === 'coinche') P.astuce = '💡 Coinche : tu as de quoi les empêcher de réussir !';
    else if(c.k === 'surcoinche') P.astuce = '💡 Surcoinche : ta main est très forte !';
    else { const best = COULEURS.map(x => [x, estime(main, x)]).sort((a, b) => b[1] - a[1])[0];
      P.astuce = P.v.contrat && nous(P.v.contrat.j) ? '💡 Passe : ton équipier a déjà pris, laisse-le jouer.' : `💡 Passe : ta main n'est pas assez forte (même à ${NOMS_C[best[0]]}).`; }
    SON.tap(); return rendEnchere(); }
  if(a === 'annonce' && !P.eCoul) return;
  const act = a === 'annonce' ? { k:'annonce', v:P.eVal, c:P.eCoul } : { k:a };
  P.astuce = ''; P.eCoul = null; $('enchere').classList.remove('on');
  if(P.mode === 'solo') soloAgit(P.moi, act); else LIGNE.annonce(act);
};
$('main').onclick = e => { const el = e.target.closest('[data-c]'); if(!el || !P || P.occupe || P.v.tour !== P.moi || P.v.phase !== 'jeu') return; ac(); const c = el.dataset.c;
  const ok = P.v.permises && P.v.permises.length ? P.v.permises : permisesLocales();
  if(!ok.includes(c)){ el.animate && el.animate([{ transform:'translateX(-6px)' }, { transform:'translateX(6px)' }, { transform:'none' }], { duration:220 }); SON.coinche();
    bulle(P.moi, coul(P.v.pli[0] ? P.v.pli[0].c : c) !== coul(c) && P.v.main.some(x => coul(x) === coul(P.v.pli[0].c)) ? `Il faut jouer du ${NOMS_C[coul(P.v.pli[0].c)]} ${SYM[coul(P.v.pli[0].c)]} !` : 'Cette carte n\'est pas permise.'); return; }
  P.conseil = null; if(P.mode === 'solo') soloAgit(P.moi, { carte:c }); else LIGNE.joue(c); };
$('main').onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ const el = e.target.closest('[data-c]'); if(el){ e.preventDefault(); el.click(); } } };

/* ---------- les animations ---------- */
function rectDe(sel){ const el = typeof sel === 'string' ? document.querySelector(sel) : sel; return el ? el.getBoundingClientRect() : null; }
function rectSiege(i){ if(i === P.moi) return rectDe('#main') || rectDe('.s-moi'); return rectDe(`.siege[data-s="${i}"] .av`); }
function lance(html, de, vers, cw, ms){
  if(!de || !vers) return Promise.resolve(); const el = document.createElement('div'); el.className = 'volant'; el.style.cssText = `left:${de.left + de.width / 2 - cw / 2}px;top:${de.top + de.height / 2 - cw * .72}px;--cw:${cw}px;transition:transform ${ms}ms cubic-bezier(.3,.8,.3,1)`;
  el.innerHTML = html; document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = `translate(${vers.left + vers.width / 2 - de.left - de.width / 2}px, ${vers.top + vers.height / 2 - de.top - de.height / 2}px) rotate(${Math.random() * 10 - 5}deg) scale(.9)`; }));
  return new Promise(r => setTimeout(() => { el.remove(); r(); }, ms + 30));
}
function bulle(i, txt, situ){ const p = P && P.sieges[i]; if(situ && p && p.perso) VOIX.dit(p.perso, situ);
  const r = rectSiege(i); if(!r) return; const b = document.createElement('div'); b.className = 'bulle'; b.textContent = txt;
  const y = i === P.moi ? r.top - 50 : r.bottom + 6; b.style.left = Math.max(8, Math.min(innerWidth - 260, r.left + r.width / 2 - 80)) + 'px'; b.style.top = Math.max(8, y) + 'px'; document.body.appendChild(b); setTimeout(() => b.remove(), 2700); }
function humeur(i, h, ms = 3200){ if(!P || !P.sieges[i] || !P.sieges[i].perso) return; P.humeur[i] = h; rend(); clearTimeout(P['hT' + i]); P['hT' + i] = setTimeout(() => { if(P){ P.humeur[i] = 'malin'; rend(); } }, ms); }
function banniere(t, ms = 1500){ const b = $('banniere'); b.textContent = t; b.classList.add('on'); setTimeout(() => b.classList.remove('on'), ms); }

/* couper et distribuer (3, 2, 3) : on part d'une table vide jusqu'à « cible » (ce qu'on voit après la donne) */
async function coupe(i){
  const c = rectDe('#tapis'); if(!c) return; const cw = 70, x = c.left + c.width / 2 - cw / 2, y = c.top + c.height / 2 - cw * .72;
  const tas = k => `<div class="tas" style="--cw:${cw}px">${'<div class="c dos"></div>'.repeat(k)}</div>`;
  const bas = document.createElement('div'), hautT = document.createElement('div');
  for(const [el, z] of [[bas, 1], [hautT, 2]]){ el.className = 'volant'; el.style.cssText = `left:${x}px;top:${y}px;z-index:${5 + z};transition:transform .45s cubic-bezier(.3,.8,.3,1)`; el.innerHTML = tas(5); document.body.appendChild(el); }
  SON.distrib();
  if(P.sieges[i].perso) bulle(i, hasard(DIT.coupe)); else bulle(i, i === P.moi ? '✂️ Tu coupes !' : '✂️ ' + P.sieges[i].nom.replace(' 🤖', '') + ' coupe !');
  parle('debut');
  await attends(350);
  hautT.style.transform = 'translate(95px, -40px) rotate(8deg)'; bas.style.transform = 'translate(-30px, 0)'; await attends(550);
  hautT.style.zIndex = 5; bas.style.zIndex = 6; hautT.style.transform = 'translate(0, 6px)'; bas.style.transform = 'translate(0, -6px) rotate(-3deg)'; await attends(500);
  hautT.remove(); bas.remove();
}
async function distribue(cible){
  if(!P) return; const occ = P.occupe; P.occupe = true; P.conseil = null; P.ann = [null, null, null, null]; P.joues = []; P.astuce = ''; $('modal').classList.remove('on');
  const d = cible.donneur;
  const v = P.v = { ...cible, main:[], nMains:[0, 0, 0, 0], tour:-1, pli:[], encheres:[], contrat:null, coinche:1, plis:[0, 0], phase:'donne' };
  rend();
  await coupe((d + 3) % 4);
  const src = () => rectDe('#tapis'), vols = [];
  for(const n of [3, 2, 3]) for(let k = 1; k <= 4; k++){
    const j = (d + k) % 4; if(!P || P.v !== v) return;
    ton(900 + Math.random() * 300, .04, 'triangle', .04, 400);
    vols.push(lance(`<div class="tas" style="--cw:52px">${'<div class="c dos"></div>'.repeat(n)}</div>`, src(), rectSiege(j), 52, 300).then(() => {
      if(P && P.v === v){ if(j === P.moi) v.main = cible.main.slice(0, Math.min(8, v.main.length + n)); v.nMains[j] += n; rend(); } }));
    await attends(140);
  }
  await Promise.all(vols);
  if(!P || P.v !== v) return;
  P.v = cible; P.occupe = occ; rend();
}

/* jouer les événements les uns après les autres, en mettant à jour ce qu'on voit */
async function anime(evs){
  for(const e of evs){
    if(!P) return; const v = P.v;
    if(e.k === 'enchere'){ const a = e.a, p = P.sieges[e.j], txt = annTexte(a); P.ann[e.j] = txt;
      if(a.k === 'annonce'){ v.contrat = { v:a.v, c:a.c, j:e.j }; SON.tap(); if(p.perso) humeur(e.j, 'malin'); if(p.perso) bulle(e.j, nomContrat(a.v, a.c) + ' · ' + hasard(DIT.prend), 'prend'); else if(e.j !== P.moi) bulle(e.j, txt); }
      else if(a.k === 'coinche'){ v.coinche = 2; SON.coinche(); banniere('COINCHE ! ✋', 1300); bulle(e.j, p.perso ? hasard(DIT.coinche) : 'Coinche ! ✋', 'coinche'); parle('coinche'); }
      else if(a.k === 'surcoinche'){ v.coinche = 4; SON.coinche(); banniere('SURCOINCHE ! 🔥', 1300); bulle(e.j, p.perso ? hasard(DIT.surcoinche) : 'Surcoinche ! 🔥', 'coinche'); parle('surcoinche'); }
      else { SON.tap(); if(e.j !== P.moi) bulle(e.j, p.perso ? hasard(DIT.passe) : 'Passe'); }
      v.tour = -1; rend(); await attends(a.k === 'passe' ? 450 : 900); }
    else if(e.k === 'contrat'){ v.contrat = e.contrat; v.coinche = e.coinche; v.phase = 'jeu'; rend(); banniere(nomContrat(e.contrat.v, e.contrat.c), 1400); parle('contrat', e.contrat.v, e.contrat.c); await attends(1100); }
    else if(e.k === 'redonne'){ banniere('On redonne ! 🔄', 1400); parle('redonne'); await attends(1200); if(P.mode === 'solo') await distribue(vue(P.s, P.moi)); }
    else if(e.k === 'donne'){ const j = LIGNE.salle && LIGNE.salle.jeu; if(j) await distribue({ ...j, donneur:e.donneur, manche:e.manche }); }
    else if(e.k === 'carte'){
      SON.carte(); const de = rectSiege(e.j), sl = document.querySelector(`#tapis .slot.r${rel(e.j)}`);
      if(e.j === P.moi){ v.main = v.main.filter(c => c !== e.c); } else v.nMains[e.j] = Math.max(0, v.nMains[e.j] - 1);
      v.tour = -1; rend(); await lance(carteEl(e.c), de, rectDe(sl), 64, 320);
      v.pli = [...(v.pli || []), { j:e.j, c:e.c }]; P.joues.push(e.c); rend();
      if(e.belote){ SON.belote(); const re = e.belote === 'rebelote'; banniere(re ? 'Rebelote ! 👑' : 'Belote ! 👑', 1100); if(P.sieges[e.j].perso){ humeur(e.j, 'joie'); bulle(e.j, hasard(re ? DIT.rebelote : DIT.belote), re ? '' : 'belote'); } else bulle(e.j, re ? 'Rebelote ! 👑' : 'Belote ! 👑');
        if(re) parle('belote'); await attends(700); }
      await attends(200); }
    else if(e.k === 'pli'){
      await attends(700); const A = v.contrat.c, pts = e.cartes.reduce((t, c) => t + points(c, A), 0);
      SON.pli(); const g = e.g; v.plis[equipe(g)]++;
      const cartes = v.pli.map(x => x.c); v.pli = []; rend();
      await lance(cartes.map(c => carteEl(c)).join(''), rectDe('#tapis'), rectSiege(g), 40, 380);
      if(P.sieges[g].perso && pts >= 20 && Math.random() < .5){ humeur(g, 'joie'); bulle(g, hasard(DIT.pli)); }
      if(sv && sv.aide !== 0 && g === P.moi && pts >= 10) bulle(P.moi, `+${pts} points ! 👍`);
      await attends(120); }
    else if(e.k === 'fin'){ v.total = e.total; v.points = e.points; v.phase = e.phase; v.gagnant = e.gagnant; rend(); await attends(500); finManche(e); }
  }
}
function finManche(e){
  const v = P.v, p = e.points, me = equipe(P.moi), Pr = p.preneur, eux = 1 - me;
  const fini = e.phase === 'fini', gagne = fini && e.gagnant === me;
  const ligne = (t, f) => `<tr><td>${t}</td><td>${f(me)}</td><td>${f(eux)}</td></tr>`;
  const tab = `<table class="points"><tr><th></th><th>${esc(nomEquipe(me))}</th><th>${esc(nomEquipe(eux))}</th></tr>
    ${ligne('Points des cartes (dix de der compris)', k => p.cartes[k])}${ligne('Belote-rebelote', k => p.belote[k] ? '👑 20' : '—')}
    ${ligne('Points de la manche', k => `<b>+${p.marque[k]}</b>`)}<tr class="tot"><td>Total</td><td>${e.total[me]}</td><td>${e.total[eux]}</td></tr></table>`;
  const qui = Pr === me ? 'Votre équipe' : 'L\'équipe adverse';
  const verdict = p.capot ? `🎉 Capot ! ${qui} a fait tous les plis !` : p.reussi ? `✅ ${qui} a réussi son contrat de ${p.contrat}${p.coinche > 1 ? ' (coinché ×' + p.coinche + ')' : ''} !` : `❌ ${qui} est dedans ! Contrat de ${p.contrat} raté.`;
  // les adversaires réagissent
  P.sieges.forEach((s, i) => { if(!s.perso) return; const preneur = equipe(i) === Pr;
    if(p.reussi) humeur(i, preneur ? 'joie' : 'boude', 5000);
    else { humeur(i, preneur ? 'boude' : 'joie', 5000); if(!fini && Math.random() < .6) setTimeout(() => bulle(i, hasard(preneur ? DIT.boude : DIT.chute), preneur ? 'boude' : 'chute'), 400 + i * 300); } });
  if(p.capot){ SON.fete(); parle('capot'); } else if(!fini) parle(p.reussi ? 'fait' : 'chute');
  if(fini){ if(gagne) SON.victoire(); P.sieges.forEach((s, i) => { if(s.perso){ const lui = equipe(i) === e.gagnant; humeur(i, lui ? 'joie' : 'boude', 8000); if(lui) bulle(i, hasard(DIT.gagne), 'gagne'); else setTimeout(() => bulle(i, hasard(DIT.perd), 'perd'), 2200); } });
    setTimeout(() => parle(gagne ? 'gagne' : 'perd'), 900); }
  if(sv && P.mode === 'solo' || sv && P.mode === 'ligne'){ if(Pr === me && p.reussi) sv.contrats++; if(p.capot && Pr === me) sv.capots++;
    if(fini){ sv.jouees++; if(gagne){ sv.gagnees++; if(window.Famille) Famille.score('bilot', 'victoires', sv.gagnees, joueur).catch(() => {}); } } sauve(); }
  let bas;
  if(fini) bas = `<div class="rang">${P.mode === 'solo' || LIGNE.hote ? '<button class="pill go" id="mRe">🔁 Rejouer</button>' : ''}<button class="pill" id="mMenu">🏠 Menu</button></div>`;
  else bas = P.mode === 'solo' ? '<div class="rang"><button class="pill go" id="mSuite">▶ Manche suivante</button></div>' : '<p style="font-weight:800">La manche suivante commence toute seule…</p>';
  $('modal').innerHTML = `<div class="carte-ui"><h2>${fini ? (gagne ? '🏆 Vous avez gagné !' : '😅 Perdu cette fois !') : 'Fin de la manche ' + v.manche}</h2>
    <p class="verdict">${verdict}</p><p style="margin:0">Contrat : <b>${nomContrat(p.contrat, p.atout)}</b>${p.coinche > 1 ? ' ×' + p.coinche : ''}</p>${tab}
    ${fini ? `<p style="font-size:20px;margin:4px 0">${gagne ? 'Bravo, ' + esc(joueur || 'champion') + ' !' : esc(nomEquipe(e.gagnant)) + ' a gagné la partie.'}</p>` : ''}${bas}</div>`;
  $('modal').classList.add('on');
  if($('mSuite')) $('mSuite').onclick = async () => { $('modal').classList.remove('on'); nouvelleManche(P.s); await distribue(vue(P.s, P.moi)); soloSuite(); };
  if($('mRe')) $('mRe').onclick = () => { $('modal').classList.remove('on'); if(P.mode === 'solo') partieSolo(); else LIGNE.rejouer(); };
  if($('mMenu')) $('mMenu').onclick = () => { if(P && P.mode === 'ligne') LIGNE.quitte(); menu(); };
}

/* ---------- avec l'ordinateur ---------- */
async function partieSolo(){
  ac(); sons(); const s0 = sv || neuf();
  const persos = Object.keys(PERSOS).sort(() => Math.random() - .5);
  const sieges = [{ nom:joueur || 'Toi', tete:tete(joueur) }, ...persos.slice(0, 3).map(k => ({ nom:PERSOS[k], perso:k, bot:true }))];
  const s = nouvellePartie({ cible:s0.cible || 1000, seed:(Math.random() * 2 ** 31) | 0, donneur:Math.floor(Math.random() * 4) });
  P = { mode:'solo', moi:0, sieges, s, v:vue(s, 0), humeur:sieges.map(() => 'malin'), niveau:s0.niveau || 'moyen', monde:s0.monde || 'sidibou', occupe:false, ann:[], joues:[] };
  entreTable(); await distribue(vue(s, 0)); soloSuite();
}
function entreTable(){ montre('-'); document.body.classList.add('jeu'); $('modal').classList.remove('on'); fond(P.monde); ambiance(P.monde); rend(); }
async function soloAgit(j, a){
  const r = a.carte ? jouer(P.s, j, a.carte) : encherir(P.s, j, a); if(!r.ok){ console.warn(r.err); P.occupe = false; rend(); return; }
  P.occupe = true; rend(); await anime(r.ev);
  if(!P || P.mode !== 'solo') return; P.occupe = false; P.v = vue(P.s, P.moi); rend();
  if(r.ev.some(e => e.k === 'fin')) return; soloSuite();
}
let premiereAnnonce = 0;
async function soloSuite(){ if(!P || P.mode !== 'solo') return; const s = P.s; if(s.phase !== 'enchere' && s.phase !== 'jeu') return;
  const t = s.tour;
  if(t === P.moi){ if(s.phase === 'enchere' && sv && sv.aide !== 0 && premiereAnnonce !== s.manche){ premiereAnnonce = s.manche; parle('atoi'); } rend(); return; }
  await attends((s.phase === 'enchere' ? 700 : 750) + Math.random() * 500); if(!P || P.mode !== 'solo' || P.s !== s || s.tour !== t) return;
  if(s.phase === 'enchere') soloAgit(t, choisirEnchere(s, t, P.niveau)); else soloAgit(t, { carte:choisirCarte(s, t, P.niveau) }); }
$('solo').onclick = async () => { if(!joueur && !(await choisirJoueur())) return; partieSolo(); };
$('quit').onclick = () => { if(!P) return; $('modal').innerHTML = `<div class="carte-ui"><h2>Quitter la partie ?</h2><p>${P.mode === 'ligne' ? "L'ordinateur prendra ta place à la table." : 'La partie en cours sera perdue.'}</p><div class="rang"><button class="pill go" id="mReste">▶ Je reste</button><button class="pill" id="mPart">🚪 Quitter</button></div></div>`; $('modal').classList.add('on');
  $('mReste').onclick = () => $('modal').classList.remove('on'); $('mPart').onclick = () => { if(P && P.mode === 'ligne') LIGNE.quitte(); menu(); }; };
addEventListener('keydown', e => { if(e.key === 'Escape' && P && !$('modal').classList.contains('on')) $('quit').click(); });

/* ---------- en ligne : le salon (présence, invitations) et la table (le serveur arbitre) ---------- */
async function post(d){ const f = new FormData(); for(const k in d) f.append(k, d[k]); const r = await fetch(API, { method:'POST', body:f, credentials:'same-origin' }); const j = await r.json().catch(() => ({ error:'Le serveur ne répond pas.' })); if(!r.ok) throw new Error(j.error || 'Erreur'); return j; }
function clientId(){ let c = null; try{ c = localStorage.getItem('chkobba-client'); }catch(e){} if(!c || !/^[a-z0-9]{8,20}$/.test(c)){ c = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); try{ localStorage.setItem('chkobba-client', c); }catch(e){} } return c; }
const LIGNE = {
  client:clientId(), code:null, salle:null, status:'menu', online:[], lastV:0, hote:false, poll:null, enCours:false,
  async hello(){ if(!joueur || document.hidden) return; try{ const r = await post({ action:'hello', client:this.client, name:joueur, tete:tete(joueur) || '', status:this.status, code:this.code || '' });
      this.online = r.online || []; (r.invites || []).forEach(i => this.invitation(i)); if(this.status === 'salon' && !this.code) this.rendSalon(); }catch(e){} },
  invitation(i){ if(this.code === i.code || (P && P.mode === 'ligne')) return; const d = $('invit');
    d.innerHTML = `<div class="carte-ui" style="display:flex;gap:10px;align-items:center;margin:0">${i.tete ? `<img src="${esc(i.tete)}" style="width:48px;height:48px;border-radius:50%">` : '🃏'}<b>${esc(i.name)} t'invite à un Bilot !</b><button class="pill" style="background:#5a1222;color:#fff" id="invOk">Rejoindre</button><button class="pill" id="invNo">✕</button></div>`;
    d.classList.add('on'); SON.fete(); $('invOk').onclick = () => { d.classList.remove('on'); this.rejoindre(i.code); }; $('invNo').onclick = () => d.classList.remove('on'); setTimeout(() => d.classList.remove('on'), 30000); },
  ouvre(){ sons(); this.verifiePasse(); this.status = 'salon'; montre('salon'); $('salonRetour').onclick = () => { this.sort(); menu(); }; if(this.code) this.rendSalle(); else this.rendSalon(); this.hello(); },
  rendSalon(){ const gens = this.online.filter(g => g.status !== 'joue'), s = sv || neuf();
    $('salonCorps').innerHTML = `<h2>Créer une table</h2><p style="margin:0 0 8px">Tu crées la table, puis tu invites (ou tu donnes le code). Les places vides sont prises par l'ordi.</p>
      <div class="choix" id="sEns"><button data-v="1" class="${s.ensemble ? 'on' : ''}">🤝 Le 2e joueur est mon équipier</button><button data-v="0" class="${s.ensemble ? '' : 'on'}">⚔️ Le 2e joueur est contre moi</button></div>
      <button class="grand" id="sCree">🃏 Créer la table</button>
      <h2 style="margin-top:18px">Rejoindre avec un code</h2><div style="display:flex;gap:10px"><input id="sCode" maxlength="4" placeholder="ABCD" style="font:800 28px 'Baloo 2';text-transform:uppercase;width:150px;padding:6px 12px;border-radius:14px;border:3px solid #e3d6b8;letter-spacing:4px"><button class="pill" id="sJoin" style="background:#5a1222;color:#fff">Rejoindre</button></div>
      <h2 style="margin-top:18px">Au Bilot en ce moment</h2>${gens.length ? `<div class="gens">${gens.map(g => `<button disabled>${g.tete ? `<img src="${esc(g.tete)}">` : '🙂'}<span>${esc(g.name)}<small>${g.code ? 'à la table ' + g.code : 'au menu'}</small></span></button>`).join('')}</div>` : '<p class="none">Personne d\'autre pour l\'instant. Envoie le lien du Bilot à tes amis !</p>'}`;
    $('sEns').onclick = e => { const b = e.target.closest('button'); if(!b) return; if(!sv) sv = neuf(); sv.ensemble = +b.dataset.v; sauve(); this.rendSalon(); };
    $('sCree').onclick = () => this.cree(); $('sJoin').onclick = () => { const c = $('sCode').value.trim().toUpperCase(); if(c.length === 4) this.rejoindre(c); }; },
  async cree(){ const s = sv || neuf(); try{ const r = await post({ action:'create', client:this.client, name:joueur, tete:tete(joueur) || '', ensemble:s.ensemble ? 1 : 0, cible:s.cible, niveau:s.niveau, monde:s.monde }); this.code = r.code; this.suit(); }catch(e){ alert(e.message); } },
  async rejoindre(code){ try{ await post({ action:'join', code, client:this.client, name:joueur, tete:tete(joueur) || '' }); this.code = code; this.status = 'salon'; montre('salon'); this.suit(); }catch(e){ alert(e.message); } },
  suit(){ clearInterval(this.poll); this.lastV = 0; this.poll = setInterval(() => this.etat(), 1000); this.etat(); },
  sort(){ clearInterval(this.poll); this.poll = null; this.code = null; this.salle = null; this.status = 'menu'; },
  async etat(){ if(!this.code || this.enCours) return; this.enCours = true;
    try{ const r = await post({ action:'etat', code:this.code, client:this.client }); this.salle = r; this.hote = r.hote; await this.recoit(r); }catch(e){ if(/existe pas/.test(e.message)){ this.sort(); menu(); } }
    this.enCours = false; },
  async recoit(r){
    if(r.etat === 'attente'){ this.status = 'salon'; if(!$('salon').classList.contains('on')) montre('salon'); this.rendSalle(); return; }
    this.status = 'joue';
    if(!P || P.mode !== 'ligne'){   // on arrive à la table
      P = { mode:'ligne', moi:r.moi, sieges:r.sieges, v:r.jeu, humeur:r.sieges.map(() => 'malin'), monde:r.monde, occupe:false, ann:[], joues:[] };
      this.lastV = Math.max(0, ...(r.log || []).map(e => e.v)); entreTable();
      const j = r.jeu; if(j.phase === 'enchere' && !j.encheres.length && j.nMains.every(x => x === 8)){ await distribue(j); }
      else { (j.encheres || []).forEach(a => P.ann[a.j] = annTexte(a)); rend(); }
      return; }
    P.sieges = r.sieges;
    const nouveaux = (r.log || []).filter(e => e.v > this.lastV);
    if(nouveaux.length){ P.occupe = true; this.lastV = Math.max(...nouveaux.map(e => e.v));
      if(nouveaux.some(e => e.k === 'donne')) $('modal').classList.remove('on');
      await anime(nouveaux); P.occupe = false; }
    // on ne redessine que si quelque chose a changé (sinon un clic sur une carte peut tomber entre deux dessins)
    if(P && P.mode === 'ligne'){ const sig = JSON.stringify([r.jeu.version, r.jeu.tour, r.sieges.map(x => x.nom)]); if(nouveaux.length || sig !== P.sig || P.v !== r.jeu && P.v.version !== r.jeu.version){ P.sig = sig; P.v = r.jeu; rend(); } else P.v = r.jeu; } },
  // après mon coup, je n'ai plus la main tant que le serveur ne m'a pas renvoyé l'état (sa réponse est ignorée : le journal fera l'animation)
  async joue(c){ P.occupe = true; P.v.tour = -1; rend(); try{ await post({ action:'jouer', code:this.code, client:this.client, carte:c }); }catch(e){ alert(e.message); } P.occupe = false; this.etat(); },
  async annonce(a){ P.occupe = true; P.v.tour = -1; rend(); try{ await post({ action:'annonce', code:this.code, client:this.client, k:a.k, v:a.v || 0, c:a.c || '' }); }catch(e){ alert(e.message); } P.occupe = false; this.etat(); },
  rendSalle(){ const r = this.salle; if(!r) return;
    const libres = this.online.filter(g => g.status !== 'joue' && !r.sieges.some(s => s.nom === g.name));
    $('salonCorps').innerHTML = `<p style="margin:0">Code de la table :</p><div class="code">${this.code}</div>
      <h2>À la table (${r.sieges.length} / 4)</h2><div class="gens">${r.sieges.map(s => `<button disabled>${s.tete ? `<img src="${esc(s.tete)}">` : '🙂'}<span>${esc(s.nom)}<small>prêt</small></span></button>`).join('')}${Array.from({ length:4 - r.sieges.length }, () => '<button disabled>🤖<span>Place libre<small>sinon, l\'ordi</small></span></button>').join('')}</div>
      ${r.hote && this.peutPasse ? `<h2 style="margin-top:14px">Un ami qui n'a pas accès au site ?</h2><button class="grand" id="rPasse" style="background:#0f766e">📤 Inviter un ami (juste cette partie)</button><div id="rPasseBox">${this.passeCode === this.code && this.passeHtml || ''}</div>` : ''}
      ${libres.length ? `<h2 style="margin-top:14px">Inviter</h2><div class="gens">${libres.map(g => `<button data-inv="${g.client}">${g.tete ? `<img src="${esc(g.tete)}">` : '🙂'}<span>${esc(g.name)}<small>✉️ inviter</small></span></button>`).join('')}</div>` : ''}
      ${r.hote ? `<h2 style="margin-top:14px">Réglages</h2><div class="choix" id="rEns"><button data-v="1" class="${r.ensemble ? 'on' : ''}">🤝 Le 2e joueur avec moi</button><button data-v="0" class="${r.ensemble ? '' : 'on'}">⚔️ Le 2e joueur contre moi</button></div>
        <div class="choix" id="rCible">${[500, 1000, 1500].map(n => `<button data-v="${n}" class="${r.cible === n ? 'on' : ''}">${n} points</button>`).join('')}</div>
        <div class="choix" id="rNiv">${[['facile', '🐣 gentil'], ['moyen', '😏 malin'], ['malin', '🦊 très rusé']].map(([k, t]) => `<button data-v="${k}" class="${r.niveau === k ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="choix" id="rMonde">${MONDES.map(m => `<button data-v="${m.id}" class="${r.monde === m.id ? 'on' : ''}">${m.n}</button>`).join('')}</div>
        <button class="grand" id="rGo">▶ Commencer</button>` : '<p style="font-weight:800;margin-top:14px">On attend que le créateur lance la partie…</p>'}`;
    $('salonCorps').onclick = async e => { const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.inv){ try{ await post({ action:'invite', client:this.client, name:joueur, tete:tete(joueur) || '', to:b.dataset.inv, code:this.code }); b.querySelector('small').textContent = '✔ invité'; }catch(err){ alert(err.message); } return; }
      if(!r.hote) return; const g = b.parentElement && b.parentElement.id;
      if(b.id === 'rPasse'){ this.invitePasse(); return; }
      if(b.dataset.copie){ try{ await navigator.clipboard.writeText(b.dataset.copie); b.textContent = '✔ Copié'; }catch(err){} return; }
      if(b.id === 'rGo'){ try{ await post({ action:'start', code:this.code, client:this.client }); this.etat(); }catch(err){ alert(err.message); } return; }
      const k = { rEns:'ensemble', rCible:'cible', rNiv:'niveau', rMonde:'monde' }[g]; if(!k) return;
      const d = { action:'config', code:this.code, client:this.client, ensemble:r.ensemble ? 1 : 0, cible:r.cible, niveau:r.niveau, monde:r.monde }; d[k] = b.dataset.v; try{ await post(d); this.etat(); }catch(err){ alert(err.message); } }; },
  /* inviter un ami qui n'a pas accès au site, pour cette partie seulement (laissez-passer de 3 heures, api/passe.php ; seul Anis) */
  peutPasse:false,
  async verifiePasse(){ if(joueur !== 'Anis') return; try{ const f = new FormData(); f.append('action', 'peut'); const r = await fetch('/api/passe.php', { method:'POST', body:f }); if(r.ok){ this.peutPasse = !!(await r.json()).peut; if(this.salle) this.rendSalle(); } }catch(e){} },
  async invitePasse(){ const nom = (prompt('Le prénom de ton ami :') || '').trim(); if(!nom) return;
    try{ const f = new FormData(); f.append('action', 'cree'); f.append('jeu', 'bilot'); f.append('nom', nom); f.append('table', this.code);
      const r = await fetch('/api/passe.php', { method:'POST', body:f }), j = await r.json(); if(!r.ok) throw new Error(j.error || 'Erreur');
      const txt = 'Viens faire un Bilot (belote coinchée) avec moi, ' + j.nom + ' ! Ouvre ce lien (il marche 3 heures) : ';
      this.passeCode = this.code; this.passeHtml = `<p style="margin:8px 0 4px;font-weight:800">Le lien pour ${esc(j.nom)} (3 heures, un seul appareil) :</p><input readonly value="${esc(j.lien)}" style="width:100%;font:600 14px Nunito;padding:8px;border-radius:10px;border:2px solid #ddd;box-sizing:border-box"><div class="choix" style="margin-top:8px"><button data-copie="${esc(j.lien)}">📋 Copier</button><a style="display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 16px;border-radius:14px;background:#25d366;color:#fff;font-weight:800;text-decoration:none" href="https://wa.me/?text=${encodeURIComponent(txt + j.lien)}" target="_blank" rel="noopener">WhatsApp</a></div>`; $('rPasseBox').innerHTML = this.passeHtml;
      if(navigator.share) try{ await navigator.share({ title:'Un Bilot', text:txt, url:j.lien }); }catch(e){}
    }catch(e){ alert(e.message); } },
  async rejouer(){ try{ await post({ action:'rejouer', code:this.code, client:this.client }); P = null; this.lastV = 0; this.etat(); }catch(e){ alert(e.message); } },
  quitte(){ if(this.code) post({ action:'quitter', code:this.code, client:this.client }).catch(() => {}); this.sort(); },
};
setInterval(() => LIGNE.hello(), 4000);
$('voixBtn').onclick = async () => { ac(); montre('studio'); $('studioCorps').innerHTML = '<p>…</p>'; await VOIX.charge(); VOIX.studio($('studioCorps'), () => joueur); };
$('studioRetour').onclick = () => menu();
$('ligne').onclick = async () => { if(!joueur && !(await choisirJoueur())) return; LIGNE.ouvre(); };

/* ---------- au démarrage ---------- */
sv = neuf(); menu(); VOIX.init(ac).then(() => VOIX.prepare(['garde', 'marchand', 'voleur', 'controleur', 'commentateur']));
const p0 = window.Famille ? Famille.player() : null; if(p0) setJoueur(p0);
LIGNE.verifiePasse();
// un ami invité à une partie (laissez-passer) arrive avec ?table=CODE : on le fait asseoir à la table
{ const t = new URLSearchParams(location.search).get('table'); if(t && /^[A-Z0-9]{4}$/.test(t) && joueur){ LIGNE.ouvre(); LIGNE.rejoindre(t); } }
window.__bilot = { get P(){ return P; }, partieSolo, LIGNE, VOIX, set niveau(v){ if(P) P.niveau = v; } };
