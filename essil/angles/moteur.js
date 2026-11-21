/* Les angles · Essil, 5e (21/11, demandé par le papa) : le moteur des 3 leçons, copie de celui des « Triangles au compas »
   (essil/triangles/moteur.js) avec un autre atelier : des demi-droites et des droites qu'on fait tourner au doigt.
   Chaque page déclare window.ANGN, charge angles/lecons.js puis ce fichier. Suivi : clé essil-ang<n> → carte dans Progression. */
(function(){
'use strict';
const L = window.LECONS_ANG.find(x => x.n === window.ANGN), KEY = 'essil-ang' + L.n;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let D = { etoiles:{}, video:0, cartes:{}, items:{}, atelier:{}, t:0 };
try{ Object.assign(D, JSON.parse(localStorage.getItem(KEY) || '{}')); }catch(e){}
const save = () => { D.t = Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} };
if(window.Famille){ Famille.track(KEY, 'Essil', [KEY]); Famille.load(KEY, 'Essil').then(r => { const d = r && r[KEY]; if(d && (d.t || 0) > (D.t || 0)){ D = Object.assign(D, d); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} rendre(); } }).catch(() => {}); }

/* ---------- la voix (Céline, par la couche commune d'explorateur.js ; sans elle, la voix de la tablette) ---------- */
const propre = t => String(t).replace(/<[^>]+>/g, ' ').replace(/([A-Za-z])Ô([A-Za-z])/g, '$1 O $2').replace(/([A-Z])([A-Z])\u0302([A-Z])/g, '$1 $2 $3').replace(/₁/g, ' 1').replace(/₂/g, ' 2').replace(/\s\/\/\s/g, ' parallèle à ').replace(/≠/g, ' différent de ').replace(/✔|✘/g, ' ').replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ').replace(/−/g, ' moins ').replace(/\s+/g, ' ').trim();
let parleTok = 0, muet = false; try{ muet = localStorage.getItem('ang-muet') === '1'; }catch(e){}
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
const ONGLETS = [['film', '🎬 Le dessin animé'], ['video', '📺 Au tableau'], ['atelier', L.atelier.nom], ['memo', '📝 Le mémo'], ['cartes', '🃏 Flash cards'], ['ex', '✏️ Exercices'], ['bilan', '🏆 Mon bilan']];
let onglet = 'film';
const app = $('#app');
function cadre(){
  app.innerHTML = `<div class="haut"><a class="chip" href="angles.html">← Les 3 leçons</a><button class="chip" id="muet">${muet ? '🔇' : '🔊'}</button></div>
    <div class="titre"><span class="num">${L.n}</span><div><h1>${L.icon} ${L.titre}</h1><p>${L.sous}</p></div></div>
    <nav class="onglets">${ONGLETS.map(([k, n]) => `<button data-o="${k}" class="${k === onglet ? 'on' : ''}">${n}</button>`).join('')}</nav><section id="corps"></section>`;
  $('#muet').onclick = () => { muet = !muet; try{ localStorage.setItem('ang-muet', muet ? '1' : '0'); }catch(e){} $('#muet').textContent = muet ? '🔇' : '🔊'; if(muet) tais(); };
  app.querySelector('.onglets').onclick = e => { const b = e.target.closest('[data-o]'); if(!b) return; SFX.tap(); tais(); onglet = b.dataset.o; rendre(); };
}
function rendre(){ cadre(); ({ film, video, atelier, memo, cartes, ex:exercices, bilan })[onglet](); }

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

/* ---------- 🎬 le dessin animé : 3 scènes ComfyUI + Wan 2.2, racontées par Céline ---------- */
function film(){
  const F = L.film, C = $('#corps'); let k = 0, joue = false, tok = 0;
  C.innerHTML = `<div class="ecran film"><div class="toile"><img id="fImg" alt=""><video id="fVid" muted loop playsinline preload="auto"></video><span class="fnum" id="fNum"></span></div><div class="sous" id="fTxt"></div>
    <div class="barre">${F.map((p, i) => `<i data-i="${i}"></i>`).join('')}</div>
    <div class="cmd"><button id="fPrev" aria-label="Scène d'avant">⏮</button><button id="fPlay" class="go">▶ Regarder</button><button id="fNext" aria-label="Scène suivante">⏭</button></div></div>`;
  const v = $('#fVid'), im = $('#fImg'); v.muted = true;
  const scene = i => { k = Math.max(0, Math.min(F.length - 1, i)); const s = F[k];
    im.src = s.img; v.classList.remove('joue'); v.onplaying = () => v.classList.add('joue'); v.onerror = () => v.classList.remove('joue');
    v.poster = s.img; v.src = s.vid; v.play().catch(() => {});
    $('#fTxt').textContent = s.t; $('#fNum').textContent = (k + 1) + ' / ' + F.length;
    C.querySelectorAll('.barre i').forEach((b, j) => b.className = j < k ? 'vu' : j === k ? 'ici' : ''); };
  async function lecture(){ const t = ++tok; while(joue && t === tok){ scene(k); const ok = await parle(F[k].t); if(!ok || !joue || t !== tok) return;
      if(k >= F.length - 1){ joue = false; $('#fPlay').textContent = '↻ Revoir'; D.etoiles.film = 3; save(); SFX.bravo(); return; } k++; } }
  $('#fPlay').onclick = () => { joue = !joue; if(joue){ if($('#fPlay').textContent.includes('Revoir')) k = 0; $('#fPlay').textContent = '⏸ Pause'; lecture(); } else { $('#fPlay').textContent = '▶ Reprendre'; tok++; tais(); } };
  $('#fPrev').onclick = () => { tais(); scene(k - 1); if(joue) lecture(); };
  $('#fNext').onclick = () => { tais(); scene(k + 1); if(joue) lecture(); };
  C.querySelectorAll('.barre i').forEach(b => b.onclick = () => { tais(); scene(+b.dataset.i); if(joue) lecture(); });
  scene(0);
}

/* ---------- 📐 l'atelier : des demi-droites et des droites qu'on fait tourner au doigt, les angles se mesurent tout seuls ----------
   rayons : [Ox) fixe, [Oy) (a) et [Oz) (b) ; croix : une droite fixe, l'autre à l'angle t ; para : (d₁) fixe, (d₂) penchée de tau, sécante d'angle s. */
const etoilesAtelier = () => { const n = Object.keys(D.atelier || {}).length, e = n >= 4 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0; D.etoiles.atelier = Math.max(D.etoiles.atelier || 0, e); save(); };
const reussi = i => { D.atelier = D.atelier || {}; D.atelier[i] = 1; etoilesAtelier(); };
function atelier(){
  const C = $('#corps'), W = 900, H = 520, ty = L.atelier.type, HT = 'Ô'; let d = 0, st = {}, drag = null, fait = {};
  C.innerHTML = `<p class="info">${L.atelier.intro}</p><div class="defis" id="dfs"></div><div class="atel"><div class="enonce" id="dEn"></div>
    <svg viewBox="0 0 ${W} ${H}" id="plan" class="plan"></svg><div class="somme" id="som"></div><div class="corr" id="aCorr"></div></div>`;
  const svgEl = $('#plan'), RED = '#d7263d', BLUE = '#1f6fd8', GREEN = '#2f9e44', GOLD = '#b8860b', VIO = '#7a4fe0', INK = '#1c2340';
  const pol = (o, r, a) => [o[0] + r * Math.cos(a * Math.PI / 180), o[1] - r * Math.sin(a * Math.PI / 180)];
  const f = v => v.toFixed(1);
  const sect = (o, r, a0, a1, col, lab, lr = 34) => { if(a1 - a0 < .5) return ''; const [x0, y0] = pol(o, r, a0), [x1, y1] = pol(o, r, a1), [lx, ly] = pol(o, r + lr, (a0 + a1) / 2);
    return `<path d="M${f(o[0])} ${f(o[1])} L${f(x0)} ${f(y0)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 0 ${f(x1)} ${f(y1)} Z" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-width="3"/>` + (lab != null ? `<text x="${f(lx)}" y="${f(ly + 9)}" font-size="26" font-weight="800" text-anchor="middle" fill="${col}">${lab}</text>` : ''); };
  const seg = (p, q, col, w = 5) => `<line x1="${f(p[0])}" y1="${f(p[1])}" x2="${f(q[0])}" y2="${f(q[1])}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const txt = (p, s, col = INK, sz = 26) => `<text x="${f(p[0])}" y="${f(p[1] + 9)}" font-size="${sz}" font-weight="800" text-anchor="middle" fill="${col}">${s}</text>`;
  const poig = (p, col, k) => `<g class="sommet" data-k="${k}"><circle cx="${f(p[0])}" cy="${f(p[1])}" r="32" fill="${col}22"/><circle cx="${f(p[0])}" cy="${f(p[1])}" r="13" fill="${col}"/></g>`;
  const O = ty === 'croix' ? [450, 260] : [450, 440], I2 = [450, 380], Y1 = 150;
  const nat = a => a === 90 ? 'droit' : a === 180 ? 'plat' : a === 0 ? 'nul' : a < 90 ? 'aigu' : 'obtus';
  const geoPara = () => { const k = (I2[1] - Y1) / Math.sin(st.s * Math.PI / 180); return { I1:pol(I2, k, st.s), k }; };
  function dessine(){ let h = '', som = ''; const df = L.atelier.defis[d];
    if(ty === 'rayons'){ const { a, b } = st, z = df.z;
      if(z){ h += sect(O, 170, 0, b, GOLD, null) + sect(O, 95, Math.min(a, b), Math.max(a, b), BLUE, Math.abs(b - a) + '°'); }
      h += sect(O, 95, 0, a, RED, a + '°');
      h += seg([O[0] - 400, O[1]], [O[0] + 410, O[1]], '#c9d1e3', 2) + seg(O, pol(O, 400, 0), INK) + txt(pol(O, 420, 0), 'x') + seg(O, pol(O, 380, a), RED) + txt(pol(O, 410, a), 'y', RED);
      if(z) h += seg(O, pol(O, 380, b), BLUE) + txt(pol(O, 410, b), 'z', BLUE) + (b > 3 ? txt(pol(O, 205, b / 2), b + '°', GOLD, 22) : '');
      h += `<circle cx="${O[0]}" cy="${O[1]}" r="8" fill="${INK}"/>` + txt([O[0] - 4, O[1] + 34], 'O');
      h += poig(pol(O, 380, a), RED, 'a') + (z ? poig(pol(O, 380, b), BLUE, 'b') : '');
      som = `<b style="color:${RED}">x${HT}y = ${a}°</b> <small>(${nat(a)})</small>` + (z ? ` · <b style="color:${BLUE}">y${HT}z = ${Math.abs(b - a)}°</b> · <b style="color:${GOLD}">x${HT}z = ${b}°</b>` + (a < b ? ' <small>(adjacents : ' + a + ' + ' + (b - a) + ' = ' + b + ')</small>' : '') : ''); }
    else if(ty === 'croix'){ const t = st.t, v = [t, 180 - t, t, 180 - t], col = [RED, BLUE, RED, BLUE], sec = [[0, t], [t, 180], [180, 180 + t], [180 + t, 360]];
      sec.forEach(([a0, a1], i) => { h += sect(O, 80, a0, a1, col[i], (i + 1) + ' : ' + v[i] + '°', 52); });
      h += seg(pol(O, 430, 180), pol(O, 430, 0), INK) + seg(pol(O, 245, t + 180), pol(O, 245, t), VIO) + `<circle cx="${O[0]}" cy="${O[1]}" r="8" fill="${INK}"/>` + txt([O[0] + 22, O[1] + 34], 'O', INK, 22);
      h += poig(pol(O, 235, t), VIO, 't') + poig(pol(O, 235, t + 180), VIO, 't');
      som = `<b style="color:${RED}">1 = 3 = ${t}°</b> (opposés) · <b style="color:${BLUE}">2 = 4 = ${180 - t}°</b> · 1 + 2 = 180°`; }
    else { const { s, tau } = st, { I1, k } = geoPara(), c5 = s - tau;
      h += sect(I1, 60, 0, s, RED, '1 : ' + s + '°', 40) + sect(I1, 60, 180, 180 + s, GREEN, '3 : ' + s + '°', 40) + sect(I2, 60, tau, s, BLUE, '5 : ' + c5 + '°', 40);
      h += seg([20, Y1], [880, Y1], INK) + txt([850, Y1 - 24], '(d₁)', INK, 22) + seg(pol(I2, 440, tau + 180), pol(I2, 440, tau), tau === 0 ? INK : '#5b6680') + txt(pol(I2, 410, tau + 4).map((v, i) => i ? v - 26 : v), '(d₂)', INK, 22);
      h += seg(pol(I2, 140, s + 180), pol(I2, k + 110, s), VIO) + `<circle cx="${f(I1[0])}" cy="${Y1}" r="7" fill="${INK}"/><circle cx="${I2[0]}" cy="${I2[1]}" r="7" fill="${INK}"/>`;
      h += poig(pol(I2, k + 100, s), VIO, 's') + poig(pol(I2, 400, tau), BLUE, 'tau');
      som = `correspondants <b style="color:${RED}">1 = ${s}°</b> et <b style="color:${BLUE}">5 = ${c5}°</b> · alternes-internes <b style="color:${GREEN}">3 = ${s}°</b> et <b style="color:${BLUE}">5 = ${c5}°</b><br>` + (tau === 0 ? '<b class="bon">(d₁) // (d₂) ✔ les angles sont égaux</b>' : '<b class="faux">angles différents → (d₁) et (d₂) ne sont pas parallèles</b>'); }
    svgEl.innerHTML = h; $('#som').innerHTML = som; verifie(); }
  function verifie(){ const df = L.atelier.defis[d]; if(fait[d] || !df.ok(st)) return; fait[d] = 1; reussi(d); SFX.bravo();
    $('#aCorr').innerHTML = `<b class="bon">✔ Réussi !</b> ${df.bilan ? df.bilan(st) : ''} ${d < L.atelier.defis.length - 1 ? '<div class="cmd"><button class="go" id="dSuite">Défi suivant →</button></div>' : 'Tous les défis sont réussis !'}`;
    parle('Réussi !'); const b = $('#dSuite'); if(b) b.onclick = () => va(d + 1); majDefis(); }
  const versSvg = e => { const r = svgEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const angDe = (c, p) => Math.atan2(c[1] - p[1], p[0] - c[0]) * 180 / Math.PI;
  const borne = (v, a, b) => Math.max(a, Math.min(b, v));
  svgEl.addEventListener('pointerdown', e => { const g = e.target.closest('.sommet'); if(!g) return; drag = g.dataset.k; svgEl.setPointerCapture(e.pointerId); e.preventDefault(); });
  svgEl.addEventListener('pointermove', e => { if(!drag) return; const p = versSvg(e); let a;
    if(ty === 'rayons'){ a = angDe(O, p); if(a < 0) a = a < -90 ? 180 : 0; st[drag] = Math.round(borne(a, 0, 180)); }
    else if(ty === 'croix'){ a = ((angDe(O, p) % 180) + 180) % 180; st.t = Math.round(borne(a, 10, 170)); }
    else if(drag === 's'){ a = angDe(I2, p); if(a < 0) a += 180; st.s = Math.round(borne(a, 40, 140)); }
    else { a = angDe(I2, p); if(a > 90) a -= 180; if(a < -90) a += 180; a = Math.round(borne(a, -25, 25)); st.tau = Math.abs(a) <= 1 ? 0 : a; }
    dessine(); });
  const lache = () => { drag = null; }; svgEl.addEventListener('pointerup', lache); svgEl.addEventListener('pointercancel', lache);
  function majDefis(){ $('#dfs').innerHTML = L.atelier.defis.map((x, i) => `<button data-d="${i}" class="${i === d ? 'on' : ''} ${(D.atelier || {})[i] ? 'fait' : ''}">${(D.atelier || {})[i] ? '✔' : i + 1}</button>`).join(''); $('#dfs').querySelectorAll('button').forEach(b => b.onclick = () => va(+b.dataset.d)); }
  function va(i){ d = i; fait[d] = 0; const df = L.atelier.defis[d]; st = Object.assign({ a:30, b:120, t:60, s:60, tau:0 }, df.init);
    $('#dEn').innerHTML = `<b>Défi ${d + 1}.</b> ${df.t}`; $('#aCorr').textContent = 'Attrape un point au bout d\'une droite et fais-la tourner.'; parle(df.t); majDefis(); dessine(); }
  va(0);
  window.__ang && (window.__ang.st = () => st);
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
function bilan(){ const C = $('#corps'), parts = [['film', 'Le dessin animé'], ['video', 'Le cours au tableau'], ['atelier', 'L\'atelier'], ['cartes', 'Les flash cards'], ['entrainement', 'Je m\'entraîne'], ['vie', 'Dans la vraie vie'], ['defi', 'Le défi']];
  const tot = parts.reduce((s, [k]) => s + (D.etoiles[k] || 0), 0);
  C.innerHTML = `<div class="bil"><div class="gros">${tot} / 21 ⭐</div>${parts.map(([k, n]) => `<div class="li"><span>${n}</span><b>${'★'.repeat(D.etoiles[k] || 0)}${'☆'.repeat(3 - (D.etoiles[k] || 0))}</b></div>`).join('')}
    <p>${tot >= 18 ? 'Cette leçon est acquise. Passe à la suivante !' : tot >= 10 ? 'C\'est bien parti : refais une série d\'exercices pour consolider.' : 'Commence par la vidéo, puis le mémo et les flash cards.'}</p>
    ${L.n < 3 ? `<a class="go lien" href="angles-${L.n + 1}.html">Leçon suivante →</a>` : ''}</div>`; }

window.__ang = { get D(){ return D; }, L, serie, rendre, va:o => { onglet = o; rendre(); } };
rendre();
})();
