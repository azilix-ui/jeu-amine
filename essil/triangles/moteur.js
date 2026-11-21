/* Les triangles au compas · Essil (21/11, demandé par le papa) : le moteur des 3 leçons, repris de celui des Maths 5e (essil/maths5/moteur.js)
   avec deux onglets en plus : 🎬 le dessin animé (ComfyUI + Wan 2.2, raconté par Céline) et 🧭 l'atelier (le compas interactif,
   ou le triangle élastique pour les angles). Chaque page déclare window.TRIN, charge triangles/lecons.js puis ce fichier.
   Suivi : clé essil-tri<n> (Famille.track) → carte dans Progression. */
(function(){
'use strict';
const L = window.LECONS_TRI.find(x => x.n === window.TRIN), KEY = 'essil-tri' + L.n;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let D = { etoiles:{}, video:0, cartes:{}, items:{}, atelier:{}, t:0 };
try{ Object.assign(D, JSON.parse(localStorage.getItem(KEY) || '{}')); }catch(e){}
const save = () => { D.t = Date.now(); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} };
if(window.Famille){ Famille.track(KEY, 'Essil', [KEY]); Famille.load(KEY, 'Essil').then(r => { const d = r && r[KEY]; if(d && (d.t || 0) > (D.t || 0)){ D = Object.assign(D, d); try{ localStorage.setItem(KEY, JSON.stringify(D)); }catch(e){} rendre(); } }).catch(() => {}); }

/* ---------- la voix (Céline, par la couche commune d'explorateur.js ; sans elle, la voix de la tablette) ---------- */
const propre = t => String(t).replace(/<[^>]+>/g, ' ').replace(/×/g, ' fois ').replace(/÷/g, ' divisé par ').replace(/−/g, ' moins ').replace(/\s+/g, ' ').trim();
let parleTok = 0, muet = false; try{ muet = localStorage.getItem('tri-muet') === '1'; }catch(e){}
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
const ONGLETS = [['film', '🎬 Le dessin animé'], ['video', '📺 Au tableau'], ['atelier', L.atelier.type === 'compas' ? '🧭 L\'atelier du compas' : '📐 Le triangle élastique'], ['memo', '📝 Le mémo'], ['cartes', '🃏 Flash cards'], ['ex', '✏️ Exercices'], ['bilan', '🏆 Mon bilan']];
let onglet = 'film';
const app = $('#app');
function cadre(){
  app.innerHTML = `<div class="haut"><a class="chip" href="triangles.html">← Les 3 leçons</a><button class="chip" id="muet">${muet ? '🔇' : '🔊'}</button></div>
    <div class="titre"><span class="num">${L.n}</span><div><h1>${L.icon} ${L.titre}</h1><p>${L.sous}</p></div></div>
    <nav class="onglets">${ONGLETS.map(([k, n]) => `<button data-o="${k}" class="${k === onglet ? 'on' : ''}">${n}</button>`).join('')}</nav><section id="corps"></section>`;
  $('#muet').onclick = () => { muet = !muet; try{ localStorage.setItem('tri-muet', muet ? '1' : '0'); }catch(e){} $('#muet').textContent = muet ? '🔇' : '🔊'; if(muet) tais(); };
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

/* ---------- 🧭 l'atelier ---------- */
function atelier(){ (L.atelier.type === 'compas' ? atelierCompas : atelierAngles)(); }
const etoilesAtelier = () => { const n = Object.keys(D.atelier || {}).length, e = n >= 4 ? 3 : n >= 3 ? 2 : n >= 2 ? 1 : 0; D.etoiles.atelier = Math.max(D.etoiles.atelier || 0, e); save(); };
const reussi = i => { D.atelier = D.atelier || {}; D.atelier[i] = 1; etoilesAtelier(); };
const fr1 = x => String(Math.round(x * 10) / 10).replace('.', ',');

/* Le compas : 1 cm = U unités. Le premier côté [AB] est tracé ; on règle l'ouverture, on pique en A ou en B, on glisse pour tracer l'arc.
   Les arcs gardés : { c:'A'|'B', r (cm), a0, a1 (angles en degrés, a0 ≤ a1) }. */
function atelierCompas(){
  const C = $('#corps'), W = 900, H = 560, U = 60, Y = 500; let d = 0;
  const defi = () => L.atelier.defis[d];
  C.innerHTML = `<p class="info">${L.atelier.intro}</p><div class="defis" id="dfs"></div><div class="atel"><div class="enonce" id="dEn"></div>
    <svg viewBox="0 0 ${W} ${H}" id="plan" class="plan"></svg>
    <div class="regle"><label>Ouverture du compas : <b id="ouvV">5 cm</b></label><input type="range" id="ouv" min="0.5" max="12" step="0.5" value="5" aria-label="Ouverture du compas en centimètres">
      <div class="cmd"><button data-p="A">📍 Pointe en A</button><button data-p="B">📍 Pointe en B</button><button id="gomme">🧽 Effacer les arcs</button></div>
      <div class="cmd"><button id="rNon">❌ Les arcs ne se coupent pas</button><button id="rPlat">➖ Les arcs se touchent sur [AB]</button></div></div>
    <div class="corr" id="aCorr"></div></div>`;
  const svgEl = $('#plan'); let ouv = 5, centre = null, arcs = [], trace = null, fini = false, ptC = null;
  const noms = () => defi().noms || ['A', 'B', 'C'];
  const pos = () => { const ab = defi().AB, ax = W / 2 - ab * U / 2; return { A:[ax, Y], B:[ax + ab * U, Y] }; };
  const P = (c, r, a) => [c[0] + r * U * Math.cos(a * Math.PI / 180), c[1] + r * U * Math.sin(a * Math.PI / 180)];
  const arcPath = (c, r, a0, a1) => { if(a1 - a0 >= 359.5) return `M${c[0] - r * U} ${c[1]} a${r * U} ${r * U} 0 1 1 ${2 * r * U} 0 a${r * U} ${r * U} 0 1 1 ${-2 * r * U} 0`;
    const [x0, y0] = P(c, r, a0), [x1, y1] = P(c, r, a1); return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r * U} ${r * U} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`; };
  // le point où les deux cercles se coupent (au-dessus de [AB]) ; null s'ils ne se coupent pas
  const inter = (rA, rB) => { const ab = defi().AB; if(rA + rB < ab - 1e-9 || Math.abs(rA - rB) > ab + 1e-9) return null;
    const x = (rA * rA - rB * rB + ab * ab) / (2 * ab), h2 = rA * rA - x * x; return { x, h:Math.sqrt(Math.max(0, h2)), plat:h2 < 1e-6 }; };
  const couvre = (a, ang) => { for(const t of [ang, ang - 360, ang + 360]) if(t >= a.a0 - 3 && t <= a.a1 + 3) return true; return false; };
  function dessine(){
    const { A, B } = pos(), n = noms(); let h = '';
    // la règle graduée en bas
    h += `<g opacity=".55">${Array.from({ length:15 }, (_, i) => `<line x1="${30 + i * U}" y1="${H - 18}" x2="${30 + i * U}" y2="${H - 6}" stroke="#4a5672" stroke-width="2"/><text x="${30 + i * U}" y="${H - 22}" font-size="13" text-anchor="middle" fill="#4a5672">${i}</text>`).join('')}</g>`;
    arcs.forEach(a => { h += `<path d="${arcPath(a.c === 'A' ? A : B, a.r, a.a0, a.a1)}" stroke="${a.c === 'A' ? '#d7263d' : '#1f6fd8'}" stroke-width="3" fill="none"/>`; });
    if(trace) h += `<path d="${arcPath(trace.c === 'A' ? A : B, trace.r, trace.a0, trace.a1)}" stroke="${trace.c === 'A' ? '#d7263d' : '#1f6fd8'}" stroke-width="3" fill="none"/>`;
    h += `<line x1="${A[0]}" y1="${Y}" x2="${B[0]}" y2="${Y}" stroke="#1c2340" stroke-width="5" stroke-linecap="round"/><text x="${(A[0] + B[0]) / 2}" y="${Y + 30}" font-size="20" font-weight="800" text-anchor="middle" fill="#1c2340">${fr1(defi().AB)} cm</text>`;
    for(const [k, p] of [['A', A], ['B', B]]) h += `<g class="pt" data-p="${k}"><circle cx="${p[0]}" cy="${p[1]}" r="22" fill="transparent"/><circle cx="${p[0]}" cy="${p[1]}" r="7" fill="${centre === k ? '#f2b632' : '#1c2340'}"/><text x="${p[0] + (k === 'A' ? -18 : 18)}" y="${p[1] + 6}" font-size="24" font-weight="800" text-anchor="middle" fill="#1c2340">${k === 'A' ? n[0] : n[1]}</text></g>`;
    if(ptC) h += `<g id="ptC" class="cible"><circle cx="${ptC[0]}" cy="${ptC[1]}" r="26" fill="#f2b63244"/><circle cx="${ptC[0]}" cy="${ptC[1]}" r="9" fill="#f2b632"/></g>`;
    if(fini){ const c = fini; h += `<path d="M${A[0]} ${Y} L${c[0]} ${c[1]} L${B[0]} ${Y}" stroke="#7a4fe0" stroke-width="5" fill="none" stroke-linejoin="round"/><text x="${c[0]}" y="${c[1] - 16}" font-size="24" font-weight="800" text-anchor="middle" fill="#7a4fe0">${n[2]}</text>`; }
    // le compas : pointe au centre choisi, mine au bout de l'ouverture (dans la direction du tracé)
    if(centre && !fini){ const c = centre === 'A' ? A : B, ang = trace ? trace.cur : (centre === 'A' ? -60 : -120), m = P(c, ouv, ang), hx = (c[0] + m[0]) / 2, hy = Math.min(c[1], m[1]) - 60 - ouv * 6;
      h += `<g class="compas"><path d="M${c[0]} ${c[1]} L${hx} ${hy} L${m[0]} ${m[1]}" stroke="#8b93a5" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${hx}" cy="${hy}" r="11" fill="#d7263d"/><circle cx="${m[0]}" cy="${m[1]}" r="6" fill="#f2b632"/></g>`; }
    svgEl.innerHTML = h;
    svgEl.querySelectorAll('.pt').forEach(g => g.onclick = e => { e.stopPropagation(); choisit(g.dataset.p); });
    const pc = svgEl.querySelector('#ptC'); if(pc) pc.onclick = e => { e.stopPropagation(); place(); };
  }
  const choisit = k => { if(fini) return; centre = k; SFX.tap(); $('#aCorr').innerHTML = `Pointe en <b>${k === 'A' ? noms()[0] : noms()[1]}</b>, ouverture <b>${fr1(ouv)} cm</b> : glisse le doigt sur le plan pour faire tourner le crayon.`; dessine(); };
  C.querySelectorAll('[data-p]').forEach(b => b.onclick = () => choisit(b.dataset.p));
  $('#ouv').oninput = e => { ouv = +e.target.value; $('#ouvV').textContent = fr1(ouv) + ' cm'; dessine(); };
  $('#gomme').onclick = () => { arcs = []; ptC = null; fini = false; dessine(); $('#aCorr').textContent = ''; };
  const versSvg = e => { const r = svgEl.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  const angDe = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI;
  svgEl.addEventListener('pointerdown', e => { if(!centre || fini || e.target.closest('.pt,#ptC')) return; const c = pos()[centre], a = angDe(c, versSvg(e));
    trace = { c:centre, r:ouv, a0:a, a1:a, cur:a, last:a, tot:0 }; svgEl.setPointerCapture(e.pointerId); e.preventDefault(); dessine(); });
  svgEl.addEventListener('pointermove', e => { if(!trace) return; const c = pos()[trace.c]; let a = angDe(c, versSvg(e)), dl = a - trace.last; if(dl > 180) dl -= 360; if(dl < -180) dl += 360;
    trace.last = a; trace.cur += dl; trace.a0 = Math.min(trace.a0, trace.cur); trace.a1 = Math.max(trace.a1, trace.cur); if(trace.a1 - trace.a0 > 360) trace.a1 = trace.a0 + 360; dessine(); });
  const fin = () => { if(!trace) return; if(trace.a1 - trace.a0 > 4){ arcs.push({ c:trace.c, r:trace.r, a0:trace.a0, a1:trace.a1 }); SFX.tap(); } trace = null; cherche(); dessine(); };
  svgEl.addEventListener('pointerup', fin); svgEl.addEventListener('pointercancel', fin);
  // les deux derniers arcs (un de centre A, un de centre B) se coupent-ils, là où on les a tracés ?
  function cherche(){ ptC = null; const a = [...arcs].reverse().find(x => x.c === 'A'), b = [...arcs].reverse().find(x => x.c === 'B'); if(!a || !b) return;
    const I = inter(a.r, b.r); if(!I || I.plat) return; const { A } = pos(), p = [A[0] + I.x * U, Y - I.h * U];
    if(couvre(a, angDe(A, p)) && couvre(b, angDe(pos().B, p))){ ptC = p; $('#aCorr').innerHTML = '✨ Les arcs se coupent ! <b>Touche le point jaune</b> pour placer le sommet.'; parle('Les arcs se coupent ! Touche le point jaune.'); } }
  function place(){ const a = [...arcs].reverse().find(x => x.c === 'A'), b = [...arcs].reverse().find(x => x.c === 'B'), df = defi(), n = noms();
    fini = ptC; ptC = null; dessine();
    const ok = Math.abs(a.r - df.AC) < .01 && Math.abs(b.r - df.BC) < .01;
    if(ok){ SFX.bravo(); reussi(d); $('#aCorr').innerHTML = `<b class="bon">✔ Bravo !</b> ${n[0]}${n[2]} = ${fr1(a.r)} cm et ${n[1]}${n[2]} = ${fr1(b.r)} cm : c'est le bon triangle. ${d < L.atelier.defis.length - 1 ? '<div class="cmd"><button class="go" id="dSuite">Défi suivant →</button></div>' : ''}`; parle('Bravo ! C\'est le bon triangle.'); }
    else { SFX.ko(); $('#aCorr').innerHTML = `<b class="faux">Presque !</b> Ton triangle a ${n[0]}${n[2]} = ${fr1(a.r)} cm et ${n[1]}${n[2]} = ${fr1(b.r)} cm. Il fallait ${n[0]}${n[2]} = ${fr1(df.AC)} cm (pointe en ${n[0]}) et ${n[1]}${n[2]} = ${fr1(df.BC)} cm (pointe en ${n[1]}). Efface les arcs et recommence !`; parle('Presque ! Vérifie les ouvertures du compas, et recommence.'); }
    const s = $('#dSuite'); if(s) s.onclick = () => va(d + 1); majDefis(); }
  const repond = (rep) => { const df = defi(), t = [df.AB, df.AC, df.BC].sort((x, y) => x - y), s = t[0] + t[1], vrai = t[2] > s + 1e-9 ? 'non' : Math.abs(t[2] - s) < 1e-9 ? 'plat' : 'oui';
    const assez = ['A', 'B'].every(c => arcs.some(x => x.c === c));
    if(!assez){ $('#aCorr').innerHTML = 'Trace d\'abord les deux arcs (un de centre A, un de centre B) avec les bonnes ouvertures, puis observe.'; return; }
    if(rep === vrai){ SFX.bravo(); reussi(d); $('#aCorr').innerHTML = `<b class="bon">✔ Exactement !</b> ${fr1(t[0])} + ${fr1(t[1])} = ${fr1(s)} ${vrai === 'non' ? '&lt;' : '='} ${fr1(t[2])} : ${vrai === 'non' ? 'les deux petits côtés sont trop courts, ce triangle n\'existe pas.' : 'les trois points sont alignés, le triangle est aplati.'} ${d < L.atelier.defis.length - 1 ? '<div class="cmd"><button class="go" id="dSuite">Défi suivant →</button></div>' : ''}`; parle('Exactement !'); const b = $('#dSuite'); if(b) b.onclick = () => va(d + 1); majDefis(); }
    else { SFX.ko(); $('#aCorr').innerHTML = vrai === 'oui' ? '<b class="faux">Pas encore.</b> Avec ces trois longueurs, le triangle existe : vérifie les ouvertures et trace des arcs plus longs, ils vont se couper.' : '<b class="faux">Regarde bien.</b> Compare le grand côté à la somme des deux autres.'; } };
  $('#rNon').onclick = () => repond('non'); $('#rPlat').onclick = () => repond('plat');
  function majDefis(){ $('#dfs').innerHTML = L.atelier.defis.map((x, i) => `<button data-d="${i}" class="${i === d ? 'on' : ''} ${(D.atelier || {})[i] ? 'fait' : ''}">${(D.atelier || {})[i] ? '✔' : i + 1}</button>`).join(''); $('#dfs').querySelectorAll('button').forEach(b => b.onclick = () => va(+b.dataset.d)); }
  function va(i){ d = i; arcs = []; ptC = null; fini = false; centre = null; trace = null; const df = defi(), n = noms();
    $('#dEn').innerHTML = `<b>Défi ${d + 1}.</b> ${df.t}<br><small>${n[0]}${n[1]} = ${fr1(df.AB)} cm (déjà tracé) · ${n[0]}${n[2]} = ${fr1(df.AC)} cm · ${n[1]}${n[2]} = ${fr1(df.BC)} cm</small>`;
    C.querySelectorAll('.regle [data-p]').forEach(b => b.textContent = '📍 Pointe en ' + (b.dataset.p === 'A' ? n[0] : n[1])); $('#rPlat').textContent = '➖ Les arcs se touchent sur [' + n[0] + n[1] + ']';
    $('#aCorr').textContent = 'Choisis où piquer : 📍 en ' + n[0] + ' ou en ' + n[1] + '.'; parle(df.t); majDefis(); dessine(); }
  va(0);
}

/* Le triangle élastique : on fait glisser les sommets, les angles s'affichent, leur somme reste 180°. */
function atelierAngles(){
  const C = $('#corps'), W = 900, H = 560; let d = 0, pts = [[200, 470], [700, 470], [380, 120]], drag = -1, ok = {};
  C.innerHTML = `<p class="info">${L.atelier.intro}</p><div class="defis" id="dfs"></div><div class="atel"><div class="enonce" id="dEn"></div>
    <svg viewBox="0 0 ${W} ${H}" id="plan" class="plan"></svg><div class="somme" id="som"></div><div class="corr" id="aCorr"></div></div>`;
  const svgEl = $('#plan'), N = ['A', 'B', 'C'], COL = ['#d7263d', '#2f9e44', '#1f6fd8'];
  const angle = (i) => { const p = pts[i], a = pts[(i + 1) % 3], b = pts[(i + 2) % 3]; const u = [a[0] - p[0], a[1] - p[1]], v = [b[0] - p[0], b[1] - p[1]];
    return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / Math.hypot(...u) / Math.hypot(...v)))) * 180 / Math.PI; };
  const arrondis = () => { const a = [0, 1, 2].map(angle), r = a.map(Math.round); r[2] = 180 - r[0] - r[1]; return r; };
  function dessine(){ const r = arrondis(); let h = `<path d="M${pts.map(p => p.join(' ')).join(' L')} Z" fill="#f2b63222" stroke="#1c2340" stroke-width="4" stroke-linejoin="round"/>`;
    pts.forEach((p, i) => { const a = pts[(i + 1) % 3], b = pts[(i + 2) % 3], t1 = Math.atan2(a[1] - p[1], a[0] - p[0]), t2 = Math.atan2(b[1] - p[1], b[0] - p[0]);
      let s = t1, e = t2, dd = e - s; while(dd > Math.PI) dd -= 2 * Math.PI; while(dd < -Math.PI) dd += 2 * Math.PI; if(dd < 0){ [s, e] = [e, s]; dd = -dd; }
      const R = 46, x0 = p[0] + R * Math.cos(s), y0 = p[1] + R * Math.sin(s), x1 = p[0] + R * Math.cos(s + dd), y1 = p[1] + R * Math.sin(s + dd), m = s + dd / 2;
      h += `<path d="M${p[0]} ${p[1]} L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z" fill="${COL[i]}55" stroke="${COL[i]}" stroke-width="2"/><text x="${p[0] + 80 * Math.cos(m)}" y="${p[1] + 80 * Math.sin(m) + 8}" font-size="24" font-weight="800" text-anchor="middle" fill="${COL[i]}">${r[i]}°</text>`; });
    pts.forEach((p, i) => { h += `<g class="sommet" data-i="${i}"><circle cx="${p[0]}" cy="${p[1]}" r="30" fill="${COL[i]}22"/><circle cx="${p[0]}" cy="${p[1]}" r="11" fill="${COL[i]}"/><text x="${p[0]}" y="${p[1] - 22}" font-size="24" font-weight="800" text-anchor="middle" fill="#1c2340">${N[i]}</text></g>`; });
    svgEl.innerHTML = h;
    $('#som').innerHTML = r.map((x, i) => `<b style="color:${COL[i]}">${x}°</b>`).join(' + ') + ' = <b>180°</b>';
    verifie(r); }
  const BUT = { rect:r => r.some(x => Math.abs(x - 90) <= 1), iso:r => [[0, 1], [1, 2], [0, 2]].some(([i, j]) => r[i] === r[j]), obtus:r => Math.max(...r) >= 120, equi:r => r.every(x => Math.abs(x - 60) <= 1) };
  function verifie(r){ const df = L.atelier.defis[d]; if(ok[d] || !BUT[df.but](r)) return; ok[d] = 1; reussi(d); SFX.bravo();
    $('#aCorr').innerHTML = `<b class="bon">✔ Réussi !</b> ${r.join('° + ')}° = 180°. ${d < L.atelier.defis.length - 1 ? '<div class="cmd"><button class="go" id="dSuite">Défi suivant →</button></div>' : 'Tous les défis sont réussis !'}`; parle('Réussi ! Et la somme fait toujours cent quatre-vingts degrés.');
    const b = $('#dSuite'); if(b) b.onclick = () => va(d + 1); majDefis(); }
  const versSvg = e => { const r = svgEl.getBoundingClientRect(); return [Math.max(30, Math.min(W - 30, (e.clientX - r.left) / r.width * W)), Math.max(40, Math.min(H - 30, (e.clientY - r.top) / r.height * H))]; };
  svgEl.addEventListener('pointerdown', e => { const g = e.target.closest('.sommet'); if(!g) return; drag = +g.dataset.i; svgEl.setPointerCapture(e.pointerId); e.preventDefault(); });
  svgEl.addEventListener('pointermove', e => { if(drag < 0) return; pts[drag] = versSvg(e); dessine(); });
  const lache = () => { drag = -1; }; svgEl.addEventListener('pointerup', lache); svgEl.addEventListener('pointercancel', lache);
  function majDefis(){ $('#dfs').innerHTML = L.atelier.defis.map((x, i) => `<button data-d="${i}" class="${i === d ? 'on' : ''} ${(D.atelier || {})[i] ? 'fait' : ''}">${(D.atelier || {})[i] ? '✔' : i + 1}</button>`).join(''); $('#dfs').querySelectorAll('button').forEach(b => b.onclick = () => va(+b.dataset.d)); }
  function va(i){ d = i; ok[d] = 0; $('#dEn').innerHTML = `<b>Défi ${d + 1}.</b> ${L.atelier.defis[d].t}`; $('#aCorr').textContent = 'Fais glisser les sommets A, B et C.'; parle(L.atelier.defis[d].t); majDefis(); dessine(); }
  va(0);
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
    ${L.n < 3 ? `<a class="go lien" href="triangles-${L.n + 1}.html">Leçon suivante →</a>` : ''}</div>`; }

window.__tri = { get D(){ return D; }, L, serie, rendre, va:o => { onglet = o; rendre(); } };
rendre();
})();
