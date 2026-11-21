/* Maths 5e · Essil (21/11, demandé par le papa : « mets-toi dans la peau du meilleur prof ») : le moteur commun des 10 cours.
   Chaque page déclare window.M5N (le numéro), charge lecons.js (window.LECONS_M5) puis ce fichier.
   Un cours = 5 onglets : 🎬 la vidéo (une animation pas à pas, dessinée par le code et racontée par Céline : la voix passe par
   ElevenLabs grâce à explorateur.js), 📝 le mémo (à relire, à imprimer), 🃏 les flash cards, ✏️ les exercices (3 séries : s'entraîner,
   dans la vraie vie, défi ; corrigés pas à pas), 🏆 le bilan. Suivi : clé essil-m5-<n> (Famille.track) → carte dans Progression. */
(function(){
'use strict';
const L = window.LECONS_M5.find(x => x.n === window.M5N), KEY = 'essil-m5-' + L.n;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let D = { etoiles:{}, video:0, cartes:{}, items:{}, t:0 };
try{ Object.assign(D, JSON.parse(localStorage.getItem(KEY) || '{}')); }catch(e){}
const save = () => { D.t = Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} };
if(window.Famille){ Famille.track(KEY, 'Essil', [KEY]); Famille.load(KEY, 'Essil').then(r => { const d = r && r[KEY]; if(d && (d.t || 0) > (D.t || 0)){ D = Object.assign(D, d); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} rendre(); } }).catch(() => {}); }

/* ---------- la voix (Céline, par la couche commune d'explorateur.js ; sans elle, la voix de la tablette) ---------- */
const propre = t => String(t).replace(/<[^>]+>/g, ' ').replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ').replace(/−/g, ' moins ').replace(/\s+/g, ' ').trim();
let parleTok = 0, muet = false; try{ muet = localStorage.getItem('m5-muet') === '1'; }catch(e){}
function parle(t){ const tok = ++parleTok; return new Promise(ok => {
  const txt = propre(t), min = Math.max(1800, txt.length * 62);
  if(muet || !('speechSynthesis' in window)){ setTimeout(() => ok(tok === parleTok), muet ? Math.max(2500, txt.length * 55) : min); return; }
  try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(txt); u.lang = 'fr-FR'; u.rate = 1; const t0 = Date.now(); let fini = false;
    const fin = () => { if(fini) return; fini = true; const reste = Math.max(0, 900 - (Date.now() - t0)); setTimeout(() => ok(tok === parleTok), reste); };
    u.onend = fin; u.onerror = () => setTimeout(fin, Math.max(0, min - (Date.now() - t0))); speechSynthesis.speak(u);
    setTimeout(fin, min + 25000); }catch(e){ setTimeout(() => ok(tok === parleTok), min); } }); }
const tais = () => { parleTok++; try{ speechSynthesis.cancel(); }catch(e){} };

/* ---------- les sons ---------- */
let AC = null; function ton(f, d, t = 0, v = .1){ try{ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), s = AC.currentTime + t; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(v, s); g.gain.exponentialRampToValueAtTime(.001, s + d); o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s + d + .02); }catch(e){} }
const SFX = { ok(){ ton(660, .12); ton(880, .16, .08); }, ko(){ ton(240, .25, 0, .08); }, tap(){ ton(900, .05, 0, .05); }, bravo(){ [523, 659, 784, 1047].forEach((f, i) => ton(f, .3, i * .1)); } };

/* ---------- la page ---------- */
const ONGLETS = [['video', '🎬 La vidéo'], ['memo', '📝 Le mémo'], ['cartes', '🃏 Flash cards'], ['ex', '✏️ Exercices'], ['bilan', '🏆 Mon bilan']];
let onglet = 'video';
const app = $('#app');
function cadre(){
  app.innerHTML = `<div class="haut"><a class="chip" href="maths-5e.html">← Les 10 cours</a><button class="chip" id="muet">${muet ? '🔇' : '🔊'}</button></div>
    <div class="titre"><span class="num">${L.n}</span><div><h1>${L.icon} ${L.titre}</h1><p>${L.sous}</p></div></div>
    <nav class="onglets">${ONGLETS.map(([k, n]) => `<button data-o="${k}" class="${k === onglet ? 'on' : ''}">${n}</button>`).join('')}</nav><section id="corps"></section>`;
  $('#muet').onclick = () => { muet = !muet; try{ localStorage.setItem('m5-muet', muet ? '1' : '0'); }catch(e){} $('#muet').textContent = muet ? '🔇' : '🔊'; if(muet) tais(); };
  app.querySelector('.onglets').onclick = e => { const b = e.target.closest('[data-o]'); if(!b) return; SFX.tap(); tais(); onglet = b.dataset.o; rendre(); };
}
function rendre(){ cadre(); ({ video, memo, cartes, ex:exercices, bilan })[onglet](); }

/* ---------- 🎬 la vidéo : des plans animés, la voix raconte, le plan suivant vient quand elle a fini ---------- */
function video(){
  const P = L.video, C = $('#corps'); let k = 0, joue = false, tok = 0;
  C.innerHTML = `<div class="ecran"><div class="scene" id="scene"></div><div class="sous" id="sous"></div>
    <div class="barre">${P.map((p, i) => `<i data-i="${i}" title="${esc(p.c || '')}"></i>`).join('')}</div>
    <div class="cmd"><button id="vPrev">⏮</button><button id="vPlay" class="go">▶ Regarder</button><button id="vNext">⏭</button></div>
    ${P.some(p => p.c) ? `<div class="chap">${P.map((p, i) => p.c ? `<button data-c="${i}">${esc(p.c)}</button>` : '').join('')}</div>` : ''}</div>`;
  const plan = i => { k = Math.max(0, Math.min(P.length - 1, i)); const p = P[k], s = $('#scene');
    s.innerHTML = p.v; s.classList.remove('anim'); void s.offsetWidth; s.classList.add('anim');
    $('#sous').innerHTML = p.t; C.querySelectorAll('.barre i').forEach((b, j) => b.className = j < k ? 'vu' : j === k ? 'ici' : ''); };
  async function lecture(){ const t = ++tok; while(joue && t === tok){ plan(k); const ok = await parle(P[k].t); if(!ok || !joue || t !== tok) return;
      if(k >= P.length - 1){ joue = false; $('#vPlay').textContent = '↻ Revoir'; D.video = Math.max(D.video, 1); D.etoiles.video = 3; save(); SFX.bravo(); return; } k++; } }
  $('#vPlay').onclick = () => { joue = !joue; if(joue){ if($('#vPlay').textContent.includes('Revoir')) k = 0; $('#vPlay').textContent = '⏸ Pause'; lecture(); } else { $('#vPlay').textContent = '▶ Reprendre'; tok++; tais(); } };
  $('#vPrev').onclick = () => { tais(); plan(k - 1); if(joue) lecture(); };
  $('#vNext').onclick = () => { tais(); plan(k + 1); if(joue) lecture(); };
  C.querySelectorAll('[data-c],[data-i]').forEach(b => b.onclick = () => { tais(); plan(+(b.dataset.c ?? b.dataset.i)); if(joue) lecture(); });
  plan(0);
}

/* ---------- 📝 le mémo ---------- */
function memo(){ const C = $('#corps');
  C.innerHTML = `<div class="memo">${L.memo.map(m => `<div class="bloc"><h3>${m[0]}</h3>${m[1]}</div>`).join('')}</div>
    <div class="cmd"><button id="mLire">🔊 Me le lire</button><button id="mImp">🖨️ Imprimer</button></div>`;
  $('#mLire').onclick = () => parle(L.memo.map(m => m[0] + '. ' + m[1]).join(' '));
  $('#mImp').onclick = () => window.print(); }

/* ---------- 🃏 les flash cards : on retourne, on dit si on savait ---------- */
function cartes(){ const C = $('#corps'); const pile = shuffle(L.cartes.map((c, i) => i)); let j = 0, su = 0;
  const une = () => { if(j >= pile.length){ const p = Math.round(su / pile.length * 100); D.etoiles.cartes = Math.max(D.etoiles.cartes || 0, p >= 90 ? 3 : p >= 70 ? 2 : p >= 40 ? 1 : 0); save(); SFX.bravo();
      C.innerHTML = `<div class="fin"><b>${su} / ${pile.length}</b> cartes sues du premier coup.<p>${p >= 90 ? 'Bravo, tu connais ton cours !' : 'Relis le mémo et recommence : c\'est en répétant qu\'on retient.'}</p><button class="go" id="re">↻ Recommencer</button></div>`; $('#re').onclick = cartes; return; }
    const c = L.cartes[pile[j]];
    C.innerHTML = `<p class="info">Carte ${j + 1} / ${pile.length} · touche la carte pour la retourner</p><div class="carte" id="ca"><div class="f r">${c[0]}</div><div class="f v">${c[1]}</div></div>
      <div class="cmd" id="rep" style="visibility:hidden"><button id="non">😕 À revoir</button><button class="go" id="oui">😀 Je savais</button></div>`;
    $('#ca').onclick = () => { $('#ca').classList.toggle('tourne'); $('#rep').style.visibility = 'visible'; SFX.tap(); if($('#ca').classList.contains('tourne')) parle(c[1]); };
    $('#oui').onclick = () => { su++; D.cartes[pile[j]] = (D.cartes[pile[j]] || 0) + 1; j++; SFX.ok(); une(); };
    $('#non').onclick = () => { D.cartes[pile[j]] = 0; j++; une(); };
    parle(c[0]); };
  une(); }

/* ---------- ✏️ les exercices : 3 séries de 6, réponse au pavé (nombres, relatifs, virgule, fractions) ou au choix ---------- */
const SERIES = [['entrainement', '💪 Je m\'entraîne', 'Les bases, pas à pas'], ['vie', '🏙️ Dans la vraie vie', 'Des situations de tous les jours, en Tunisie'], ['defi', '🔥 Le défi', 'Pour aller plus loin']];
const num = s => { s = String(s).replace(',', '.').replace('−', '-').trim(); if(/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(s)){ const [a, b] = s.split('/').map(Number); return b ? a / b : NaN; } return s === '' || s === '-' ? NaN : Number(s); };
function exercices(){ const C = $('#corps');
  C.innerHTML = `<div class="series">${SERIES.map(([k, n, d]) => `<button data-s="${k}"><b>${n}</b><small>${d}</small><span>${'★'.repeat(D.etoiles[k] || 0)}${'☆'.repeat(3 - (D.etoiles[k] || 0))}</span></button>`).join('')}</div>`;
  C.querySelector('.series').onclick = e => { const b = e.target.closest('[data-s]'); if(b){ SFX.tap(); serie(b.dataset.s); } }; }
function serie(k){
  const C = $('#corps'), gen = L.ex[k], liste = Array.from({ length:6 }, (_, i) => gen(i)); let i = 0, bons = 0, essai = 0;
  const q1 = () => {
    if(i >= liste.length){ const e = bons >= 6 ? 3 : bons >= 5 ? 2 : bons >= 3 ? 1 : 0; D.etoiles[k] = Math.max(D.etoiles[k] || 0, e); save(); if(e) SFX.bravo();
      C.innerHTML = `<div class="fin"><b>${bons} / 6</b> du premier coup · ${'★'.repeat(e)}${'☆'.repeat(3 - e)}<p>${e === 3 ? 'Parfait !' : e ? 'Bien joué ! Encore une série pour les trois étoiles ?' : 'Revois la vidéo et le mémo, puis réessaie : les nombres changent à chaque fois.'}</p><div class="cmd"><button class="go" id="re">↻ Une autre série</button><button id="ret">← Les séries</button></div></div>`;
      $('#re').onclick = () => serie(k); $('#ret').onclick = exercices; return; }
    const q = liste[i]; essai = 0; if(q.opts) q.opts = [...new Set(q.opts)];   // un choix en double (selon les nombres tirés) n'apparaît qu'une fois
    C.innerHTML = `<p class="info">${SERIES.find(s => s[0] === k)[1]} · question ${i + 1} / 6</p><div class="q"><div class="enonce">${q.q}</div>${q.fig || ''}
      ${q.opts ? `<div class="opts">${shuffle(q.opts).map(o => `<button data-v="${esc(o)}">${o}</button>`).join('')}</div>`
      : `<div class="saisie"><span id="val">?</span>${q.unite ? `<small>${q.unite}</small>` : ''}</div><div class="pave">${['7','8','9','4','5','6','1','2','3','−','0',',', ...(q.frac ? ['/'] : [])].map(c => `<button data-c="${c}">${c}</button>`).join('')}<button data-c="⌫">⌫</button></div><div class="cmd"><button class="go" id="valide">Valider ✔</button></div>`}
      <div class="corr" id="corr"></div></div>`;
    parle(q.dit || q.q);
    let v = ''; const montre = () => $('#val').textContent = v || '?';
    const juge = ok => { const corr = $('#corr');
      if(ok){ if(essai === 0) bons++; SFX.ok(); D.items[q.id] = (D.items[q.id] || 0) + 1; corr.innerHTML = `<b class="bon">✔ Oui !</b> ${q.expl}<div class="cmd"><button class="go" id="suite">Suivant →</button></div>`; parle('Oui ! ' + q.expl); }
      else if(essai === 0){ essai = 1; SFX.ko(); corr.innerHTML = `<b class="faux">Pas encore.</b> ${q.aide || 'Relis bien l\'énoncé.'} Essaie encore !`; parle('Pas encore. ' + (q.aide || '')); return; }
      else { SFX.ko(); D.items[q.id] = -1; corr.innerHTML = `<b class="faux">La réponse : ${q.rep}</b><br>${q.expl}<div class="cmd"><button class="go" id="suite">Suivant →</button></div>`; parle('La réponse est ' + q.rep + '. ' + q.expl); }
      save(); C.querySelectorAll('.opts button,.pave button,#valide').forEach(b => b.disabled = true); $('#suite').onclick = () => { tais(); i++; q1(); }; };
    if(q.opts) C.querySelectorAll('.opts button').forEach(b => b.onclick = () => { const ok = b.dataset.v === q.bon; b.classList.add(ok ? 'ok' : 'ko'); if(!ok && essai === 0) setTimeout(() => b.classList.remove('ko'), 900); juge(ok); });
    else { C.querySelectorAll('.pave button').forEach(b => b.onclick = () => { SFX.tap(); const c = b.dataset.c; if(c === '⌫') v = v.slice(0, -1); else if(c === '−'){ v = v.startsWith('-') ? v.slice(1) : '-' + v; } else if(v.length < 10) v += c === ',' ? ',' : c; montre(); });
      $('#valide').onclick = () => { if(!v) return; const r = num(v), ok = Math.abs(r - q.bon) < 1e-6 * Math.max(1, Math.abs(q.bon)); juge(ok); if(!ok && essai === 1){ v = ''; montre(); } }; }
  };
  q1(); }

/* ---------- 🏆 le bilan ---------- */
function bilan(){ const C = $('#corps'), parts = [['video', 'La vidéo regardée jusqu\'au bout'], ['cartes', 'Les flash cards'], ['entrainement', 'Je m\'entraîne'], ['vie', 'Dans la vraie vie'], ['defi', 'Le défi']];
  const tot = parts.reduce((s, [k]) => s + (D.etoiles[k] || 0), 0);
  C.innerHTML = `<div class="bil"><div class="gros">${tot} / 15 ⭐</div>${parts.map(([k, n]) => `<div class="li"><span>${n}</span><b>${'★'.repeat(D.etoiles[k] || 0)}${'☆'.repeat(3 - (D.etoiles[k] || 0))}</b></div>`).join('')}
    <p>${tot >= 13 ? 'Ce chapitre est acquis. Passe au suivant !' : tot >= 8 ? 'C\'est bien parti : refais une série d\'exercices pour consolider.' : 'Commence par la vidéo, puis le mémo et les flash cards.'}</p>
    ${L.n < 10 ? `<a class="go lien" href="maths-5e-${L.n + 1}.html">Cours suivant →</a>` : ''}</div>`; }

window.__m5 = { get D(){ return D; }, L, serie, rendre };
rendre();
})();
