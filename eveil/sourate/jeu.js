/* Rubrique « Sourate » (18/11) : la page d'Al-Fâtiḥa. Les données : fatiha.js (fabriqué par docs/eveil/sourate_fatiha.py) ;
   l'écoute de l'enfant : ecoute.js. Récitation : cheikh Mahmoud Khalil Al-Husary (murattal), accès libre (Islamic Network,
   EveryAyah) ; les mots s'allument grâce aux moments relevés par quran.com. Conteurs : papa = voix Jon (pour Amine), maman =
   Céline (Essil, Salma) ; encouragements en arabe = Mohammad. La voix artificielle ne dit jamais un verset. */
import { SOURATE, VERSETS, PHRASES } from './fatiha.js';
import { aligne, score, verdict, ecouter, peutReconnaitre } from './ecoute.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const store = { get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } }, set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
const pause = ms => new Promise(r => setTimeout(r, ms));
const arabe = n => String(n);   // chiffres 1, 2, 3 (demande du papa, 18/11)
const RECIT = [k => 'https://cdn.islamic.network/quran/audio/128/ar.husary/' + (SOURATE.avant + k) + '.mp3',
               k => 'https://mirrors.quranicaudio.com/everyayah/Husary_128kbps/' + String(SOURATE.n).padStart(3, '0') + String(k).padStart(3, '0') + '.mp3'];
const ISTIADHA = 'https://mirrors.quranicaudio.com/everyayah/Husary_128kbps/audhubillah.mp3';
const FILLES = ['Essil', 'Salma', 'Imen', 'Yasmine'];
const voixCoupee = () => !!(window.FamilleVoix && FamilleVoix.on && !FamilleVoix.on());

/* ---------- le joueur et ses progrès ---------- */
let joueur = null, sv = null;
const COURS = 'eveil-sourates', cle = () => COURS + ':' + joueur;
const vide = () => ({ s:{ [SOURATE.n]:{ v:[], seul:0 } }, com:'fr', t:0 });
const S = () => { sv.s[SOURATE.n] = sv.s[SOURATE.n] || { v:[], seul:0 }; return sv.s[SOURATE.n]; };
function sauve(){ if(!joueur) return; sv.t = Date.now(); store.set(cle(), sv); }
async function setJoueur(n){
  joueur = n; sv = Object.assign(vide(), store.get(cle(), {}) || {});
  if(window.Famille && Famille.track){ Famille.track(COURS, n, [cle()]);
    try{ const r = await Famille.load(COURS, n), d = r && r[cle()]; if(d && joueur === n && (d.t || 0) > (sv.t || 0)){ sv = Object.assign(vide(), d); store.set(cle(), sv); } }catch(e){} }
  mode = ({ Essil:'essil', Salma:'salma', Amine:'amine' })[joueur] || 'salma';
  accueil();
}
async function choisirJoueur(){
  if(!window.Famille){ await setJoueur('Invité'); return; }
  const n = await Famille.choosePlayer({ title:'Qui récite ?', cancel:!!joueur,
    extra:[{ name:'Anis', color:'#0f766e', emoji:'🧔' }, { name:'Imen', color:'#b4235a', emoji:'👩' }],
    avatar:k => `<img src="/jeux/avatars/reel/${k.name.toLowerCase()}.webp" alt="" onerror="this.replaceWith(document.createTextNode('${k.emoji}'))">` });
  if(n) await setJoueur(n);
}
const fille = () => FILLES.includes(joueur);
const conteur = () => mode === 'amine' ? 'papa' : 'maman';

/* ---------- les voix ---------- */
let jeton = 0, audio = null;
function stop(){ jeton++; if(window.FamilleSon) FamilleSon.stop(); if(audio){ try{ audio.pause(); }catch(e){} audio = null; } try{ speechSynthesis.cancel(); }catch(e){} allume(-1, -1); micro(''); }
const precharge = url => { if(window.FamilleSon) FamilleSon.precharge(url); };
function joue(url, moi, pendant){   // un mp3 jusqu'au bout ; false si interrompu, null si introuvable
  if(window.FamilleSon){   // 19/11 : sur la tablette, le lecteur unique du site (débloqué au premier toucher, voir explorateur.js)
    if(jeton !== moi) return Promise.resolve(false);
    return FamilleSon.joue(url, { onTemps:pendant }).then(r => jeton !== moi ? false : r);
  }
  return new Promise(res => { const a = audio = new Audio(url); let f = false, raf = 0;
    const fin = r => { if(!f){ f = true; cancelAnimationFrame(raf); res(r); } };
    const tic = () => { if(jeton !== moi){ try{ a.pause(); }catch(e){} return fin(false); } if(pendant) pendant(a.currentTime * 1000); raf = requestAnimationFrame(tic); };
    a.onended = () => fin(true); a.onerror = () => fin(null); a.play().then(() => { raf = requestAnimationFrame(tic); }).catch(() => fin(null)); });
}
async function dire(t, qui){   // qui : 'papa' | 'maman' | 'ar'
  const moi = jeton; if(!t) return true; montre(qui === 'ar' ? '' : t, qui === 'ar' ? t : '');
  if(voixCoupee()){ await pause(Math.max(1500, t.length * 55)); return jeton === moi; }
  const l = qui === 'ar' ? 'ar' : 'fr', v = qui === 'papa' ? '&v=jon' : '';
  const r = await joue('/api/voix.php?l=' + l + '&t=' + encodeURIComponent(t.slice(0, 380)) + v, moi);
  if(r === null && jeton === moi){   // pas de voix du site : celle de la tablette
    await new Promise(res => { try{ const u = new SpeechSynthesisUtterance(t); u.lang = l === 'ar' ? 'ar' : 'fr-FR'; u.onend = u.onerror = () => res(); speechSynthesis.speak(u); setTimeout(res, Math.max(3000, t.length * 90)); }catch(e){ res(); } });
  }
  return jeton === moi;
}
function phrase(k){   // une phrase du conteur, en français ou en arabe selon le réglage
  const p = PHRASES[k]; if(!p) return Promise.resolve(true);
  return sv.com === 'ar' ? dire(fille() ? p[2] : p[1], 'ar') : dire(p[0], conteur());
}
function montre(fr, ar){ $('dit').textContent = fr || ''; $('dit').hidden = !fr; $('ditar').textContent = ar || ''; $('ditar').hidden = !ar;
  $('conteur').src = 'prophete/img/' + conteur() + '.webp'; }
// la récitation d'un verset (k = 1..7) avec le mot qui s'allume ; repli sur le second serveur
async function recite(k){
  const moi = jeton, v = VERSETS[k - 1];
  for(const src of RECIT){
    const r = await joue(src(k), moi, ms => { const i = v.seg.findIndex(s => ms >= s[0] - 60 && ms < s[1] + 60); allume(k, i); });
    allume(-1, -1); if(r !== null) return r;
  }
  return jeton === moi;
}

/* ---------- l'affichage ---------- */
let mode = 'salma', cur = 1;
function allume(k, i){ document.querySelectorAll('.w.lit').forEach(e => e.classList.remove('lit')); if(k > 0 && i >= 0){ const e = document.querySelector(`.w[data-v="${k}"][data-i="${i}"]`); if(e) e.classList.add('lit'); } }
function marqueDits(k, vus){ document.querySelectorAll(`.w[data-v="${k}"]`).forEach(e => e.classList.toggle('dit', !!vus[+e.dataset.i])); }
const motTajwid = (w, k, i) => `<span class="w" data-v="${k}" data-i="${i}">${w.map(([t, c]) => c ? `<span class="tj-${c}">${esc(t)}</span>` : esc(t)).join('')}</span>`;
function dessine(){
  const v = VERSETS[cur - 1], s = S();
  $('lecon').className = 'lecon ' + mode;
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  $('com').textContent = sv.com === 'ar' ? 'عربي' : 'FR';
  $('scene').hidden = mode !== 'amine';
  if(mode === 'amine'){
    const vid = $('vid'), src = 'sourate/vid/' + v.scene + '.mp4';
    $('scene').style.backgroundImage = `url(sourate/img/${v.scene}.webp)`; vid.poster = 'sourate/img/' + v.scene + '.webp';
    if(!vid.src.endsWith(src)){ vid.hidden = false; vid.src = src; vid.onerror = () => { vid.hidden = true; }; vid.play().catch(() => {}); }
    $('page').innerHTML = `<div class="coran">${v.mots.map((m, i) => `<span class="w" data-v="${v.n}" data-i="${i}">${esc(m)}</span>`).join(' ')} <span class="fin-v">﴿${arabe(v.n)}﴾</span></div><p class="phrase">${esc(v.amine)}</p>`;
  } else if(mode === 'salma'){
    $('page').innerHTML = `<div class="duo">${v.mots.map((m, i) => `<span class="w" data-v="${v.n}" data-i="${i}"><span class="a">${esc(m)}</span><span class="l">${esc(v.tr[i])}</span></span>`).join('')}<span class="fin-v" style="font-size:36px">﴿${arabe(v.n)}﴾</span></div>
      <p class="sens">« ${esc(v.fr)} »</p>
      <div class="motbox"><span>⭐ Le mot à retenir :</span><span class="a" lang="ar">${esc(v.mot[0])}</span><b>${esc(v.mot[1])}</b><span>= ${esc(v.mot[2])}</span></div>
      <p class="note" style="color:#6b5a40">â, î, oû : son long · ḥ : un h qui souffle (ح) · ' : le son ع · gh : un r qui gratte (غ) · dh : le « th » de « this » (ذ)</p>`;
  } else {
    $('page').innerHTML = `<div class="coran">${VERSETS.map(x => `<span class="v${x.n === cur ? ' cur' : ''}">${x.tj.map((w, i) => motTajwid(w, x.n, i)).join(' ')} <span class="fin-v">﴿${arabe(x.n)}﴾</span></span>`).join(' ')}</div>
      <div class="legende"><span><b style="background:#9a948a"></b>lettre muette</span><span><b style="background:#2f80ed"></b>prolonger 2 temps</span><span><b style="background:#1b45c4"></b>2, 4 ou 6 temps à l'arrêt</span><span><b style="background:#0b1f6b"></b>6 temps obligatoires</span></div>
      <p class="expl"><b>Verset ${v.n} · </b>${esc(v.essil)}</p>
      <p class="racine"><span class="a" lang="ar">${esc(v.racine[0])}</span> ${esc(v.racine[1])}</p>`;
  }
  $('points').innerHTML = VERSETS.map(x => `<button data-v="${x.n}" class="${x.n === cur ? 'cur' : ''} ${s.v[x.n - 1] ? 'ok' : ''}">${arabe(x.n)}</button>`).join('') +
    `<button class="tout${s.seul >= .6 ? ' ok' : ''}" data-v="0">${s.seul >= .6 ? '🌟' : '☆'} Toute la sourate</button>`;
  const vc = document.querySelector('.v.cur'); if(vc && vc.scrollIntoView) try{ vc.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(e){}
  $('note').textContent = peutReconnaitre() ? '' : 'Cet appareil ne sait pas reconnaître la voix : tu t\'enregistres, puis tu te réécoutes.';
}
function micro(etat){ const m = $('micro'); m.classList.toggle('ecoute', etat === 'ecoute'); m.classList.toggle('attend', etat === 'attend'); }
function etoile(t = '⭐'){ const e = document.createElement('div'); e.className = 'etoile'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 1200); }

/* ---------- l'accueil ---------- */
const MODES = [
  ['essil', '🎨 Le tajwid en couleurs', 'Toute la sourate avec ses voyelles, les règles de lecture en couleurs, et le sens des mots.', 'Pour Essil', 'cover'],
  ['salma', '🔤 L’arabe et les lettres françaises', 'Chaque mot arabe avec ses sons en lettres françaises, le sens et un mot à retenir.', 'Pour Salma', 'sf6'],
  ['amine', '🎬 J’écoute et je répète', 'Un petit dessin animé par verset, tout à l’oreille, avec papa.', 'Pour Amine', 'sf3'],
];
function accueil(){
  stop(); ecran('e-accueil');
  $('qui').innerHTML = joueur ? `<img src="/jeux/avatars/reel/${esc(joueur.toLowerCase())}.webp" alt="" onerror="this.remove()"> ${esc(joueur)}` : '👤 Qui récite ?';
  $('savoir').textContent = SOURATE.savoir;
  $('modes').innerHTML = MODES.map(([m, t, p, pour, img]) => `<button class="mode${m === mode ? ' moi' : ''}" data-ouvre="${m}"><div class="img" style="background-image:url(sourate/img/${img}.webp)"><span>${pour}</span></div><div class="t"><h2>${t}</h2><p>${p}</p></div></button>`).join('');
  const s = sv ? S() : { v:[], seul:0 };
  $('prog').innerHTML = VERSETS.map(x => s.v[x.n - 1] ? '⭐' : '<i>☆</i>').join('') + (s.seul >= .6 ? ' 🌟' : ' <i>🌟</i>');
}
function ecran(id){ document.querySelectorAll('.ecran').forEach(e => e.classList.toggle('on', e.id === id)); window.scrollTo(0, 0); if(id !== 'e-lecon') try{ $('vid').pause(); }catch(e){} }
function ouvre(m){ stop(); mode = m; cur = cur || 1; ecran('e-lecon'); dessine(); montre(m === 'amine' ? 'Touche « Commencer » : on écoute, puis tu répètes !' : 'Touche « Commencer ».', ''); }

/* ---------- apprendre : écouter, répéter ---------- */
let istiadha = false;
async function lecon(k, auto = true){
  stop(); const moi = jeton; cur = k; dessine(); const v = VERSETS[k - 1];
  if(k === 1 && !istiadha){ istiadha = true; montre('', 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ'); await joue(ISTIADHA, moi); if(jeton !== moi) return; }
  if(k === 1 && !S().v.some(Boolean)){ if(!await phrase('debut')) return; }
  // le sens d'abord (Amine : papa ; Essil : l'explication ; Salma : le sens)
  const sens = mode === 'amine' ? v.amine : mode === 'essil' ? v.essil : 'Le sens : ' + v.fr + '.';
  precharge(RECIT[0](k)); if(k < VERSETS.length) precharge(RECIT[0](k + 1));
  if(!await dire(sens, conteur())) return;
  for(let essai = 1; essai <= 2; essai++){
    if(!await phrase('ecoute')) return;
    montre(mode === 'amine' ? '🎧 Écoute le cheikh…' : '🎧 Cheikh Al-Husary récite…', '');
    if(!await recite(k)) return;
    const r = await repete(k, moi); if(jeton !== moi) return;
    if(r === 'bravo'){ S().v[k - 1] = true; sauve(); etoile(); dessine(); await phrase('bravo'); break; }
    if(essai === 1){ await phrase(r === 'rien' ? 'rien' : 'moitie'); if(jeton !== moi) return; }
    else { await phrase('continue'); }
  }
  if(jeton !== moi) return;
  if(auto && k < VERSETS.length){ await pause(500); if(jeton === moi) lecon(k + 1); }
  else if(k === VERSETS.length){ dessine(); montre('Bravo ! Tu peux maintenant écouter toute la sourate, ou la réciter tout seul 🌟', ''); }
}
// « À toi ! » : on écoute l'enfant ; rend 'bravo' | 'moitie' | 'rien'
async function repete(k, moi){
  const v = VERSETS[k - 1], duree = (v.seg[v.seg.length - 1][1] * 1.7) + 3500;
  if(!await phrase('atoi')) return 'rien';
  montre('🎤 À toi ! Répète…', ''); micro('ecoute'); marqueDits(k, []);
  const signal = {}; arreteEcoute = () => { signal.stop = true; };
  if(window.FamilleSon) FamilleSon.avantMicro();
  const r = await ecouter({ duree, onPartiel:t => marqueDits(k, aligne(v.mots, t)), signal });
  micro(''); arreteEcoute = null;
  if(window.FamilleSon) await FamilleSon.apresMicro();
  if(jeton !== moi) return 'rien';
  if(r.mode === 'sr'){ const sc = score(v.mots, r.textes); marqueDits(k, aligne(v.mots, r.textes)); return verdict(sc, joueur, r.aParle); }
  // sans reconnaissance : l'enfant se réécoute
  if(r.mode === 'rec' && r.url && r.aParle){ montre('👂 Écoute-toi !', ''); await joue(r.url, moi); }
  return r.aParle ? 'bravo' : 'rien';
}
let arreteEcoute = null;

async function toute(){   // toute la sourate par le cheikh, le mot qui s'allume
  stop(); const moi = jeton;
  if(mode !== 'essil'){ for(let k = 1; k <= VERSETS.length; k++){ cur = k; dessine(); montre('📖 Al-Fâtiḥa, par cheikh Al-Husary', ''); if(!await recite(k)) return; } }
  else { montre('📖 Al-Fâtiḥa, par cheikh Al-Husary', ''); for(let k = 1; k <= VERSETS.length; k++){ cur = k; document.querySelectorAll('.v').forEach((e, i) => e.classList.toggle('cur', i === k - 1)); const vc = document.querySelector('.v.cur'); if(vc) try{ vc.scrollIntoView({ block:'nearest', behavior:'smooth' }); }catch(e){} if(!await recite(k)) return; } }
  if(jeton === moi) montre('À toi maintenant : « 🌟 Je récite seul » !', '');
}
async function seul(){   // l'enfant récite toute la sourate ; les mots reconnus se soulignent
  stop(); const moi = jeton;
  if(mode !== 'essil'){ mode = mode === 'amine' ? 'amine' : 'essil'; }
  if(mode === 'amine'){ cur = 1; }
  dessine(); if(!await phrase('seul')) return;
  const tous = VERSETS.flatMap(v => v.mots), pos = VERSETS.flatMap(v => v.mots.map((_, i) => [v.n, i]));
  const marque = vus => pos.forEach(([n, i], j) => { const e = document.querySelector(`.w[data-v="${n}"][data-i="${i}"]`); if(e) e.classList.toggle('dit', !!vus[j]); });
  montre('🎤 Je t’écoute… récite toute la sourate.', ''); micro('ecoute');
  const signal = {}; arreteEcoute = () => { signal.stop = true; };
  if(window.FamilleSon) FamilleSon.avantMicro();
  const r = await ecouter({ duree:75000, silence:4000, onPartiel:t => marque(aligne(tous, t)), signal });
  micro(''); arreteEcoute = null;
  if(window.FamilleSon) await FamilleSon.apresMicro();
  if(jeton !== moi) return;
  let sc = r.mode === 'sr' ? score(tous, r.textes) : r.aParle ? .6 : 0;
  if(r.mode === 'sr') marque(aligne(tous, r.textes));
  const seuil = joueur === 'Amine' ? .3 : .6;
  if(sc >= seuil){ S().seul = Math.max(S().seul, sc >= .6 ? sc : .6); sauve(); etoile('🌟'); dessine(); marque(r.mode === 'sr' ? aligne(tous, r.textes) : []); await phrase('fin'); }
  else if(sc > 0){ await phrase('moitie'); }
  else await phrase('rien');
}

/* ---------- les boutons ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('button'); if(!b) return;
  if(b.id === 'qui') return choisirJoueur();
  if(b.dataset.ouvre) return ouvre(b.dataset.ouvre);
  if(b.dataset.mode){ mode = b.dataset.mode; stop(); dessine(); return; }
  if(b.id === 'retour') return accueil();
  if(b.id === 'com'){ sv.com = sv.com === 'ar' ? 'fr' : 'ar'; sauve(); dessine(); return; }
  if(b.id === 'go'){ return lecon(cur || 1); }
  if(b.id === 'reecoute'){ stop(); const moi = jeton; recite(cur).then(() => { if(jeton === moi) montre('À toi quand tu veux : touche le micro 🎤', ''); }); return; }
  if(b.id === 'suivant'){ return lecon(cur < VERSETS.length ? cur + 1 : 1, false); }
  if(b.id === 'tout') return toute();
  if(b.id === 'seul') return seul();
  if(b.id === 'micro'){
    if(arreteEcoute){ arreteEcoute(); return; }   // l'enfant a fini : on arrête d'écouter
    stop(); const moi = jeton, k = cur;
    repete(k, moi).then(async r => { if(jeton !== moi) return;
      if(r === 'bravo'){ S().v[k - 1] = true; sauve(); etoile(); dessine(); await phrase('bravo'); } else await phrase(r === 'rien' ? 'rien' : 'moitie'); });
    return;
  }
  if(b.closest('#points')){ const n = +b.dataset.v; if(n === 0){ return toute(); } stop(); cur = n; dessine(); return lecon(n, false); }
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') stop(); });
window.__sourate = { VERSETS, get sv(){ return sv; }, get mode(){ return mode; }, lecon, stop, setJoueur };

// au départ : le joueur de la tablette, sinon « Qui récite ? »
(async () => {
  sv = vide();
  const p = window.Famille && Famille.player && Famille.player();
  if(p) await setJoueur(p); else { accueil(); choisirJoueur(); }
})();
