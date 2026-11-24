/* Jasmin · Stage 3 — la course du TGM : les règles, sans dessin (importable en Node : docs/stage3/test-course.mjs).
   Le héros court tout seul dans les rues de Sidi Bou Saïd pour attraper le TGM avant qu'il parte.
   Repère : x vers la droite, y vers le bas ; le sol est à y = 0 (le dessus des choses est négatif). Le héros est posé par ses pieds.
   Même graine = même parcours sur toutes les tablettes (la course en ligne). Pas fixe de 1/120 s.
   24/11 (demande du papa) : une seule vie (la barre se vide à chaque choc ; vide = c'est fini, comme au Stage 2) ; un choc fait tomber
   le héros, sonné, quelques secondes avant de se relever ; le temps accordé = le double du temps du robot (LIMITE) ; 6 mondes (DIFF). */

export const PAS = 1 / 120;
export const MODES = {
  tranquille:{ L:11000, v:250, morceaux:10, vies:1, sonne:1.5, trouMax:100, ecart:[300, 470], doubles:false },
  champion:{ L:15000, v:320, morceaux:8, vies:1, sonne:1.9, trouMax:150, ecart:[230, 380], doubles:true },
};
// la difficulté de chaque monde (1 à 6) : un peu plus long, un peu plus vite, plus de trous et d'ennemis
export const NMONDES = 21, CHAMPION_DES = 6;   // à partir du monde 6 : seulement le mode Champion (24/11)
const DIFF = m => ({ L:1 + Math.min(m - 1, 8) * .05, v:1 + Math.min(m - 1, 8) * .025 + Math.max(0, m - 9) * .008, p:Math.min(m - 1, 12) * .12 });
// le temps accordé (en secondes) = le double du temps du robot de docs/stage3/test-course.mjs (moyenne arrondie à 5 s), par monde
export const LIMITE = {
  tranquille:[0, 70, 70, 75, 75, 80],   // le Tranquille s'arrête au monde 5
  champion:[0, 80, 85, 85, 90, 95, 95, 100, 100, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105],
};
const G_ = 2300, SAUT = 790, MAINTIEN = .22, H_DEBOUT = 70, H_GLISSE = 34, DEMI = 14;

/* ---------- le hasard à graine (même suite partout) ---------- */
export function alea(graine){ let s = (graine >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* ---------- le parcours ---------- */
// obstacles : { t, x, w, h } posés au sol (pleins : poubelle, sacs, cageot, barriere) ; glissants : banane, huile (h = 0) ;
// au-dessus : linge (de y = -haut à y = -bas : il faut glisser dessous) ; trous : { x, w } ; ennemis : chat, chien, scooter, mouette
const PLEINS = { poubelle:{ w:40, h:58 }, sacs:{ w:56, h:32 }, cageot:{ w:46, h:40 }, barriere:{ w:62, h:46 } };
export function parcours(graine, mode = 'champion', monde = 1){
  const D = DIFF(monde), M = Object.assign({}, MODES[mode], { L:Math.round(MODES[mode].L * D.L / 100) * 100 }), r = alea(graine), entre = (a, b) => a + r() * (b - a), un = a => a[Math.floor(r() * a.length)];
  const P = { graine, mode, monde, L:M.L, obstacles:[], trous:[], linges:[], ennemis:[], pieces:[], jasmins:[], bonus:[], lanternes:[], gare:M.L };
  const types = ['poubelle', 'sacs', 'cageot', 'barriere', 'banane', 'huile', 'linge', 'trou', 'chat', 'chien', 'scooter', 'mouette'];
  const poids = q => { const p = q + D.p; return { poubelle:3, sacs:2, cageot:2, barriere:2, banane:1.5, huile:1.2, linge:1.5 + p, trou:1 + p * 2, chat:1.2, chien:.6 + p, scooter:.4 + p * 1.6, mouette:.8 + p }; };
  let x = 700, n = 0, dernier = '';
  while(x < M.L - 600){
    const p = x / M.L, w = poids(p); let tot = 0; for(const k of types) if(k !== dernier) tot += w[k]; let q = r() * tot, t = types[0];
    for(const k of types){ if(k === dernier) continue; q -= w[k]; if(q <= 0){ t = k; break; } }
    dernier = t; n++;
    if(PLEINS[t]){ const o = { t, x, w:PLEINS[t].w, h:PLEINS[t].h };
      if(t === 'cageot' && M.doubles && r() < .35){ o.h = 80; o.double = true; }
      P.obstacles.push(o);
      // des dinars en arc au-dessus (le sommet d'un saut)
      for(let k = 0; k < 5; k++){ const u = (k - 2) / 2; P.pieces.push({ x:x + o.w / 2 + u * 70, y:-o.h - 40 - (1 - u * u) * 50 }); }
    } else if(t === 'banane' || t === 'huile'){ P.obstacles.push({ t, x, w:t === 'banane' ? 34 : 86, h:0, glisse:true }); for(let k = 0; k < 3; k++) P.pieces.push({ x:x + 17 + (k - 1) * 60, y:-110 }); }
    else if(t === 'linge'){ P.linges.push({ x, w:130, haut:-105, bas:-46 }); for(let k = 0; k < 4; k++) P.pieces.push({ x:x + 10 + k * 36, y:-18 }); }
    else if(t === 'trou'){ const tw = entre(70, M.trouMax); P.trous.push({ x, w:tw }); for(let k = 0; k < 3; k++) P.pieces.push({ x:x + tw / 2 + (k - 1) * 40, y:-120 - (k === 1 ? 20 : 0) }); }
    else { const E = { chat:{ w:40, h:30, vx:-55 }, chien:{ w:50, h:38, vx:-150 }, scooter:{ w:72, h:52, vx:-210 }, mouette:{ w:48, h:28, vx:-140, y:-58 } }[t];
      P.ennemis.push({ t, x0:x + 260, w:E.w, h:E.h, vx:E.vx, y0:E.y || 0 }); }
    // des dinars en ligne entre deux obstacles
    const pas = entre(M.ecart[0], M.ecart[1]); if(r() < .55) for(let k = 1; k <= 3; k++) P.pieces.push({ x:x + pas * k / 4 + 30, y:-30 });
    x += pas + (t === 'trou' ? P.trous[P.trous.length - 1].w : t === 'linge' ? 130 : (PLEINS[t] || { w:40 }).w);
    if(['chien', 'scooter'].includes(t)) x += 140;   // le temps de les voir arriver
  }
  // les 3 jasmins : très haut au-dessus de trois obstacles pleins (un grand saut en courant vite), répartis sur le parcours
  const pl = P.obstacles.filter(o => !o.glisse);
  [.25, .55, .82].forEach(f => { const o = pl.reduce((b, c) => Math.abs(c.x - M.L * f) < Math.abs(b.x - M.L * f) ? c : b, pl[0]); if(o) P.jasmins.push({ x:o.x + o.w / 2, y:-o.h - 125 }); });
  // bonus : thé (vitesse), chéchia (bouclier)
  [.18, .6].forEach(f => P.bonus.push({ t:'the', x:M.L * f, y:-40 })); P.bonus.push({ t:'chechia', x:M.L * .4, y:-40 });
  P.bonus.forEach(b => { while(dansTrou(P, b.x) || P.obstacles.some(o => b.x > o.x - 30 && b.x < o.x + o.w + 30)) b.x += 25; });
  // les lanternes (elles redonnent un morceau de vie)
  for(let k = 1; k <= 3; k++){ let lx = M.L * k / 4; while(dansTrou(P, lx) || P.obstacles.some(o => lx > o.x - 60 && lx < o.x + o.w + 60)) lx += 30; P.lanternes.push(lx); }
  // une pièce posée dans un trou ou dans un obstacle remonte au-dessus
  P.pieces = P.pieces.filter(p => p.x > 400 && p.x < M.L - 200);
  return P;
}
export const dansTrou = (P, x) => P.trous.some(t => x > t.x && x < t.x + t.w);

/* ---------- une partie ---------- */
export function nouvellePartie(graine, mode = 'champion', monde = 1){
  const D = DIFF(monde), M = Object.assign({}, MODES[mode], { v:MODES[mode].v * D.v }), P = parcours(graine, mode, monde);
  return { M, P, monde, t:0, limite:(LIMITE[mode] || [])[monde] || Math.round(P.L / M.v * 2.4), etat:'course',
    h:{ sonne:0, sonneMax:0, x:120, y:0, vx:0, vy:0, sol:true, glisse:false, maintien:0, chute:0, glissade:0, trebuche:0, inv:0, the:0, chechia:false, morceaux:M.morceaux, coyote:0, tampon:0, mort:0, repartX:120, fin:0 },
    vies:M.vies, dinars:0, jasmins:0, ecrases:0, pris:new Set(), ennemis:P.ennemis.map(e => ({ ...e, x:e.x0, y:e.y0, actif:false, etourdi:0, parti:false })), tombes:new Set(), glisses:new Set(),
    lanterne:120, ev:[] };
}
const ev = (g, k, o) => g.ev.push(Object.assign({ k }, o || {}));

function blesse(g, n, x){ const h = g.h; if(h.inv > 0 || g.etat !== 'course') return false;
  if(h.chechia){ h.chechia = false; h.inv = 1; ev(g, 'bouclier'); return true; }
  h.morceaux -= n; ev(g, 'aie', { n, x });
  if(h.morceaux <= 0){ meurt(g); return true; }
  // il tombe, sonné : il reste par terre quelques secondes, puis se relève
  h.sonne = h.sonneMax = g.M.sonne; h.inv = g.M.sonne + 1.1; h.vx = 0; h.glissade = 0; h.trebuche = 0; ev(g, 'sonne'); return true; }
function meurt(g){ const h = g.h; h.morceaux = 0; g.vies = 0; g.etat = 'ko'; h.sonne = h.sonneMax = 99; h.vx = 0; ev(g, 'vie', { vies:0 }); ev(g, 'ko'); }

// les ennemis : ils se mettent en route quand le héros approche ; sauter dessus les étourdit
function ennemis(g, dt, seul, py = 0, haut = H_DEBOUT){ const h = g.h;
  for(const e of g.ennemis){
    if(!e.actif && e.x - h.x < 820) e.actif = true;
    if(!e.actif || e.parti) continue;
    if(e.etourdi > 0){ e.etourdi -= dt; if(e.etourdi <= 0) e.parti = true; continue; }
    e.x += e.vx * dt; if(e.t === 'mouette') e.y = e.y0 + Math.sin(g.t * 4 + e.x0) * 10;
    if(e.x < h.x - 900) { e.parti = true; continue; }
    if(seul) continue;
    const ex0 = e.x - e.w / 2, ex1 = e.x + e.w / 2, ey1 = e.y, ey0 = e.y - e.h;
    if(h.x + DEMI > ex0 && h.x - DEMI < ex1 && h.y > ey0 && h.y - haut < ey1){
      if(h.vy > 0 && py <= ey0 + 10){ e.etourdi = .7; h.vy = -560; h.maintien = 0; g.ecrases++; ev(g, 'ecrase', { e }); }
      else if(blesse(g, 1, e.x)) e.etourdi = .7; }
  } }

/* un pas de jeu. C = { saut, bas, vite, lent } (touches tenues) */
export function pas(g, C, dt = PAS){
  if(g.etat === 'arrive' || g.etat === 'ko' || g.etat === 'rate'){ g.t += dt; if(g.h.sonne > 0) g.h.sonne -= dt; return; }
  g.t += dt; const h = g.h, M = g.M, P = g.P;
  if(g.t >= g.limite && g.etat === 'course'){ g.etat = 'rate'; ev(g, 'rate'); return; }   // le TGM est parti sans nous
  h.inv = Math.max(0, h.inv - dt); h.the = Math.max(0, h.the - dt); h.trebuche = Math.max(0, h.trebuche - dt);
  // tombé dans un trou : on attend un peu, puis on repart avant le trou
  if(h.chute > 0){ h.chute -= dt; h.vy += G_ * dt; h.y += h.vy * dt; if(h.chute <= 0){ if(g.etat === 'course'){ h.x = h.repartX; h.y = 0; h.vy = 0; h.vx = 0; h.sol = true; h.inv = 1.3; } } return; }
  // sonné : il ne bouge plus jusqu'à ce qu'il soit relevé (les ennemis, eux, continuent)
  if(h.sonne > 0){ h.sonne -= dt; h.vx = 0; h.glisse = false; h.vy += G_ * dt; h.y = Math.min(0, h.y + h.vy * dt); if(h.y >= 0){ h.vy = 0; h.sol = true; } if(h.sonne <= 0) ev(g, 'releve'); ennemis(g, dt, true); return; }
  // la vitesse
  let cible = M.v * (C.vite ? 1.35 : C.lent ? .55 : 1) * (h.the > 0 ? 1.3 : 1);
  if(h.trebuche > 0) cible = M.v * .25;
  if(h.glissade > 0){ h.glissade -= dt; cible = Math.max(h.vx, M.v * 1.1); if(h.glissade <= 0){ blesse(g, 1, h.x); ev(g, 'tombe'); } }
  h.vx += Math.sign(cible - h.vx) * Math.min(Math.abs(cible - h.vx), (h.vx < 0 ? 1400 : 900) * dt);
  // sauter (avec un petit délai de grâce au bord et un appui mémorisé), glisser
  h.coyote = h.sol ? .1 : Math.max(0, h.coyote - dt); h.tampon = C.saut && !h.sautTenu ? .12 : Math.max(0, h.tampon - dt); h.sautTenu = !!C.saut;
  if(h.tampon > 0 && h.coyote > 0 && h.glissade <= 0){ h.vy = -SAUT; h.sol = false; h.coyote = 0; h.tampon = 0; h.maintien = MAINTIEN; ev(g, 'saut'); }
  h.glisse = !!C.bas && h.sol && h.glissade <= 0;
  let grav = G_; if(h.vy < 0 && C.saut && h.maintien > 0){ grav *= .42; h.maintien -= dt; } else h.maintien = 0;
  if(!h.sol && C.bas) grav *= 2.2;
  // bouger
  const px = h.x, py = h.y; h.x += h.vx * dt; h.vy += grav * dt; h.y += h.vy * dt; h.sol = false;
  const haut = h.glisse ? H_GLISSE : H_DEBOUT;
  // le sol (sauf dans les trous) et le dessus des obstacles
  if(h.y >= 0 && py <= .5 && !dansTrou(P, h.x)){ h.y = 0; h.vy = 0; h.sol = true; }
  for(const o of P.obstacles){ if(o.glisse || g.tombes.has(o)) continue;
    if(!(h.x + DEMI > o.x && h.x - DEMI < o.x + o.w)) continue;
    if(py <= -o.h + .5 && h.y >= -o.h && h.vy >= 0){ h.y = -o.h; h.vy = 0; h.sol = true; continue; }   // posé dessus
    if(h.y > -o.h + 1 && h.y - haut < 0){   // on le heurte de côté : il tombe (une poubelle renversée), on perd un morceau de vie
      if(blesse(g, 1, o.x)){ g.tombes.add(o); ev(g, 'renverse', { o }); }
      else if(h.inv <= 0 && px + DEMI <= o.x + 2) h.x = o.x - DEMI; } }
  if(h.y > 30 && h.chute <= 0){   // tombé dans un trou
    const t = P.trous.find(t => h.x + 60 > t.x && h.x - 60 < t.x + t.w); h.repartX = t ? t.x - 70 : h.x - 120; h.chute = .9; h.vx = 0; ev(g, 'trou');
    h.morceaux -= 2; ev(g, 'aie', { n:2 }); if(h.morceaux <= 0) meurt(g); return; }
  // glisser sur une peau de banane ou une flaque d'huile
  if(h.sol && h.y === 0 && h.glissade <= 0) for(const o of P.obstacles){ if(!o.glisse || g.glisses.has(o)) continue; if(h.x > o.x && h.x < o.x + o.w){ g.glisses.add(o); h.glissade = .75; ev(g, 'glisse', { o }); } }
  // le linge : il faut glisser dessous
  for(const l of P.linges){ if(h.x + DEMI > l.x && h.x - DEMI < l.x + l.w && h.y - haut < l.bas && h.y > l.haut && !l.touche){ if(blesse(g, 1, l.x)){ l.touche = true; ev(g, 'linge', { l }); } } }
  ennemis(g, dt, false, py, haut);
  // ramasser
  const cx = h.x, cy = h.y - haut / 2;
  P.pieces.forEach((p, i) => { if(g.pris.has('p' + i)) return; if(Math.abs(p.x - cx) < 26 && Math.abs(p.y - cy) < haut / 2 + 16){ g.pris.add('p' + i); g.dinars++; ev(g, 'piece', { i }); } });
  P.jasmins.forEach((p, i) => { if(g.pris.has('j' + i)) return; if(Math.abs(p.x - cx) < 30 && Math.abs(p.y - cy) < haut / 2 + 20){ g.pris.add('j' + i); g.jasmins++; ev(g, 'jasmin', { i }); } });
  P.bonus.forEach((b, i) => { if(g.pris.has('b' + i)) return; if(Math.abs(b.x - cx) < 28 && Math.abs(b.y - cy) < haut / 2 + 16){ g.pris.add('b' + i); if(b.t === 'the') h.the = 5; else h.chechia = true; ev(g, 'bonus', { t:b.t }); } });
  for(const lx of P.lanternes) if(h.x > lx && g.lanterne < lx){ g.lanterne = lx; const s = h.morceaux < M.morceaux; if(s) h.morceaux++; ev(g, 'lanterne', { x:lx, soin:s }); }   // la lanterne redonne un morceau de vie
  // la gare : on saute dans le TGM
  if(h.x >= P.gare + 120 && h.sol){ g.etat = 'arrive'; g.h.fin = g.t; ev(g, 'arrive', { t:g.t }); }
  if(h.x < 0) h.x = 0;
}

export function resultat(g){
  const P = g.P, nP = P.pieces.length, gagne = g.etat === 'arrive', reste = gagne ? Math.max(0, g.limite - g.h.fin) : 0;
  let etoiles = 0; if(gagne){ etoiles = 1; if(g.dinars >= nP * .6) etoiles++; if(g.jasmins >= 3) etoiles++; }
  return { gagne, etoiles, reste:Math.round(reste * 10) / 10, temps:Math.round((g.h.fin || g.t) * 10) / 10, dinars:g.dinars, total:nP, jasmins:g.jasmins,
    score:gagne ? Math.round(g.dinars * 10 + g.jasmins * 200 + g.ecrases * 50 + reste * 20) : 0 };
}
