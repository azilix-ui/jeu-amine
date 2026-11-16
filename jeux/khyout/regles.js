/* Khyout (خيوط, « les fils ») — les règles, sans dessin (testées en Node : docs/khyout/test-regles.mjs).
   On relie chaque paire de pelotes de laine de la même couleur par un fil ; les fils ne se croisent pas
   et, à la fin, toutes les cases de la grille sont couvertes.
   D'après le cahier des charges du papa (17/11, « Color Flow Puzzle »), adapté au site : JavaScript sans compilation,
   nom, couleurs, dessins et sons à nous.

   Un niveau : { n:taille, p:'chaîne n*n : "." vide, "+" un pont, ou une lettre a, b, c… = une pelote', s:'la solution' }
   Les PONTS (17/11) : sur une case pont, un fil passe tout droit à l'horizontale et un autre tout droit à la verticale.
   Pour tout gérer pareil, la grille devient un graphe : un nœud par case, et chaque pont compte pour DEUX nœuds
   (sa voie horizontale N + 2k et sa voie verticale N + 2k + 1, k = numéro du pont) ; la case du pont elle-même est « bloquée ».
   Une voie n'a que deux voisins (gauche/droite ou haut/bas) : un fil qui la traverse va donc forcément tout droit.
   La solution s a un caractère par nœud (n*n cases, puis 2 par pont) ; il faut remplir les deux voies de chaque pont.
   L'état d'une partie : P = { n, G:graphe, pel:[[i, j] par couleur], ch:[chemin par couleur = liste de nœuds] }. */

export const LETTRES = 'abcdefghijklmnop';
export const voisins = (n, i) => { const x = i % n, y = (i / n) | 0, v = []; if(x > 0) v.push(i - 1); if(x < n - 1) v.push(i + 1); if(y > 0) v.push(i - n); if(y < n - 1) v.push(i + n); return v; };
export const adjacent = (n, a, b) => { const dx = Math.abs(a % n - b % n), dy = Math.abs(((a / n) | 0) - ((b / n) | 0)); return dx + dy === 1; };

/* ---------- le graphe d'une grille (avec ou sans ponts) ---------- */
export function graphe(n, p){
  const N = n * n, ponts = [], kDe = new Map();
  for(let i = 0; i < N; i++) if(p[i] === '+'){ kDe.set(i, ponts.length); ponts.push(i); }
  const M = N + 2 * ponts.length, cell = new Int32Array(M), bloque = new Uint8Array(M);
  for(let i = 0; i < N; i++){ cell[i] = i; if(kDe.has(i)) bloque[i] = 1; }
  ponts.forEach((c, k) => { cell[N + 2 * k] = c; cell[N + 2 * k + 1] = c; });
  const vers = (c, depuis) => kDe.has(c) ? N + 2 * kDe.get(c) + (((c / n) | 0) === ((depuis / n) | 0) ? 0 : 1) : c;   // le nœud de la case c quand on y arrive depuis `depuis`
  const V = [];
  for(let i = 0; i < M; i++){
    if(bloque[i]){ V.push([]); continue; }
    if(i < N){ V.push(voisins(n, i).map(j => vers(j, i))); continue; }
    const c = cell[i], h = (i - N) % 2 === 0, x = c % n, out = [];
    if(h){ if(x > 0) out.push(vers(c - 1, c)); if(x < n - 1) out.push(vers(c + 1, c)); }
    else { if(c >= n) out.push(vers(c - n, c)); if(c + n < N) out.push(vers(c + n, c)); }
    V.push(out);
  }
  return { n, N, M, V, cell, bloque, ponts, vers, estPont:c => kDe.has(c), noeuds:c => kDe.has(c) ? [N + 2 * kDe.get(c), N + 2 * kDe.get(c) + 1] : [c] };
}

/* ---------- lire un niveau ---------- */
export function lire(niv){
  const n = niv.n, pel = [], G = graphe(n, niv.p);
  for(let i = 0; i < n * n; i++){ const c = niv.p[i]; if(c === '.' || c === '+') continue; const k = LETTRES.indexOf(c); (pel[k] || (pel[k] = [])).push(i); }
  return { n, G, pel, ch:pel.map(() => []), sol:niv.s || null };
}
export const cellule = (P, nd) => P.G.cell[nd];

/* ---------- l'occupation ---------- */
export const pelote = (P, i) => { for(let k = 0; k < P.pel.length; k++) if(P.pel[k][0] === i || P.pel[k][1] === i) return k; return -1; };
const voisinsG = (P, a, b) => P.G.V[a].indexOf(b) >= 0;
export const relie = (P, k) => { const c = P.ch[k]; if(c.length < 2) return false; const [a, b] = P.pel[k];
  if(!((c[0] === a && c[c.length - 1] === b) || (c[0] === b && c[c.length - 1] === a))) return false;
  for(let t = 1; t < c.length; t++) if(!voisinsG(P, c[t - 1], c[t])) return false; return true; };

export function bilan(P){   // ce que montre l'écran : paires reliées, cases couvertes (les 2 voies d'un pont comptent), et la victoire
  const G = P.G, o = new Array(G.M).fill(0); let conflit = false;
  P.pel.forEach(pp => pp.forEach(i => o[i]++));
  P.ch.forEach(c => c.forEach(i => { if(pelote(P, i) < 0) o[i]++; }));
  o.forEach(v => { if(v > 1) conflit = true; });
  let couvertes = 0, total = 0; for(let i = 0; i < G.M; i++){ if(G.bloque[i]) continue; total++; if(o[i] > 0) couvertes++; }
  const reliees = P.pel.filter((_, k) => relie(P, k)).length;
  return { reliees, paires:P.pel.length, couvertes, total, pct:Math.round(couvertes * 100 / total), gagne:!conflit && reliees === P.pel.length && couvertes === total, toutesReliees:reliees === P.pel.length };
}

/* ---------- le tracé (cahier des charges, partie F) ----------
   Un geste : on pose le doigt sur une pelote (le fil repart de là) ou sur un fil (on reprend à cet endroit), puis on glisse.
   Pendant le geste, les fils des autres couleurs sont gardés tels qu'au début (« photo ») : un fil coupé au passage
   se recolle si on revient en arrière. Règle de collision : 'couper' (on coupe l'autre fil) ou 'bloquer' (on s'arrête).
   Les fonctions reçoivent des CASES (là où est le doigt) ; sur un pont, la voie est choisie par le sens du geste. */
export function debut(P, i, regle = 'couper'){
  let k = pelote(P, i), ch;
  if(k >= 0) ch = [i];
  else { const nds = P.G.noeuds(i); k = P.ch.findIndex(c => nds.some(x => c.indexOf(x) >= 0)); if(k < 0) return null;
    const c = P.ch[k], t = Math.max(...nds.map(x => c.indexOf(x))); ch = c.slice(0, t + 1); }
  const G = { k, regle, photo:P.ch.map(c => c.slice()), avant:P.ch.map(c => c.slice()) };
  P.ch[k] = ch; recolle(P, G); return G;
}
function recolle(P, G){   // les autres fils = la photo, coupés là où passe le fil actif
  const pris = new Set(P.ch[G.k]);
  P.ch.forEach((_, d) => { if(d === G.k) return; const c = G.photo[d], t = c.findIndex(i => pris.has(i)); P.ch[d] = t < 0 ? c.slice() : c.slice(0, t); if(P.ch[d].length === 1 && t >= 0) P.ch[d] = []; });
}
export function dansFil(P, k, i){ const c = P.ch[k]; let t = -1; for(const x of P.G.noeuds(i)) t = Math.max(t, c.indexOf(x)); return t; }   // position de la case i dans le fil k (-1 : absente)
export function pas(P, G, i){   // essayer d'avancer le fil actif sur la case i (voisine de la tête) ; rend true si quelque chose a changé
  const c = P.ch[G.k], tete = c[c.length - 1], tc = P.G.cell[tete];
  if(i === tc) return false;
  const nd = P.G.estPont(i) ? P.G.vers(i, tc) : i;
  const deja = c.indexOf(nd);
  if(deja >= 0){ P.ch[G.k] = c.slice(0, deja + 1); recolle(P, G); return true; }   // retour en arrière
  if(!voisinsG(P, tete, nd)) return false;
  const [a, b] = P.pel[G.k], fin = c[0] === a ? b : a;
  if(c.length > 1 && (tete === a || tete === b)) return false;   // déjà relié : on ne va pas plus loin
  const p = pelote(P, nd); if(p >= 0 && p !== G.k) return false;  // la pelote d'une autre couleur
  if(p === G.k && nd !== fin) return false;
  if(G.regle === 'bloquer'){ for(let d = 0; d < P.ch.length; d++) if(d !== G.k && G.photo[d].indexOf(nd) >= 0) return false; }
  P.ch[G.k] = c.concat(nd); recolle(P, G); return true;
}
export function chemin(n, a, b){   // les cases de a vers b, une à une (le doigt a pu sauter des cases)
  const out = []; let x = a % n, y = (a / n) | 0; const bx = b % n, by = (b / n) | 0;
  while(x !== bx || y !== by){ if(Math.abs(bx - x) >= Math.abs(by - y)) x += Math.sign(bx - x); else y += Math.sign(by - y); out.push(y * n + x); }
  return out;
}
export function fin(P, G){   // fin du geste : un fil réduit à sa pelote = pas de fil ; rend true si les fils ont changé
  P.ch.forEach((c, k) => { if(c.length === 1) P.ch[k] = []; });
  return JSON.stringify(P.ch) !== JSON.stringify(G.avant);
}

/* ---------- la solution d'une couleur (pour les indices) ---------- */
export function cheminSolution(P, k){
  if(!P.sol) return null; const L = LETTRES[k], [a, b] = P.pel[k], out = [a]; let prec = -1, cur = a;
  while(cur !== b){ const nx = P.G.V[cur].find(v => v !== prec && P.sol[v] === L && out.indexOf(v) < 0); if(nx == null) return null; prec = cur; cur = nx; out.push(cur); }
  return out;
}
export function poseSolution(P, k){   // indice 3 : le fil entier, les autres fils coupés là où il passe
  const s = cheminSolution(P, k); if(!s) return false; const G = { k, photo:P.ch.map(c => c.slice()) }; P.ch[k] = s; recolle(P, G); P.ch.forEach((c, d) => { if(c.length === 1) P.ch[d] = []; }); return true;
}
export function bonFil(P, k){ const s = cheminSolution(P, k), c = P.ch[k]; if(!s || c.length !== s.length) return false; const r = c[0] === s[0] ? c : c.slice().reverse(); return r.every((v, t) => v === s[t]); }

/* ---------- le solveur (partie G) : compte les solutions (s'arrête à `max`) ----------
   On prolonge les fils un par un depuis une de leurs pelotes, toujours la couleur qui a le moins de choix.
   Règle de recherche : un fil ne se touche pas lui-même (pas de « boucle inutile ») ; les niveaux publiés la respectent.
   Coupes : case vide coincée (moins de 2 sorties), couleur dont la tête ne peut plus rejoindre sa pelote,
   zone vide qu'aucune couleur ne peut remplir. `budget` = nombre de nœuds avant d'abandonner (rend -1). */
export function resoudre(niv, max = 2, budget = 400000){
  const P = lire(niv), GR = P.G, n = niv.n, N = GR.M, V = GR.V, K = P.pel.length, own = new Int8Array(N).fill(-1), tete = [], cible = [], fini = new Array(K).fill(false);
  for(let i = 0; i < N; i++) if(GR.bloque[i]) own[i] = -2;   // la case d'un pont : ses deux voies sont d'autres nœuds
  for(let k = 0; k < K; k++){ const [a, b] = P.pel[k]; own[a] = k; own[b] = k; tete[k] = a; cible[k] = b; }
  let sols = 0, noeuds = 0, premiere = null; let marque = 0;
  const libre = i => own[i] === -1;
  function coups(k){ const h = tete[k], out = [];
    for(const v of V[h]){ if(v === cible[k]){ out.push(v); continue; } if(!libre(v)) continue;
      let touche = false; for(const w of V[v]) if(w !== h && own[w] === k && w !== cible[k]){ touche = true; break; }   // ne pas se toucher soi-même
      if(!touche) out.push(v); }
    return out; }
  function ok(){
    for(let i = 0; i < N; i++){ if(!libre(i)) continue; let s = 0;   // une case vide doit avoir 2 sorties (vide, tête ou pelote d'arrivée d'une couleur pas finie)
      for(const v of V[i]){ if(libre(v)) s++; else { const k = own[v]; if(!fini[k] && (tete[k] === v || cible[k] === v)) s++; } }
      if(s < 2) return false; }
    // zones vides
    marque++; const zone = new Int32Array(N).fill(-1); let nz = 0;
    for(let i = 0; i < N; i++){ if(!libre(i) || zone[i] >= 0) continue; const pile = [i]; zone[i] = nz;
      while(pile.length){ const c = pile.pop(); for(const v of V[c]) if(libre(v) && zone[v] < 0){ zone[v] = nz; pile.push(v); } } nz++; }
    const utile = new Array(nz).fill(false);
    for(let k = 0; k < K; k++){ if(fini[k]) continue; const h = tete[k], c = cible[k];
      if(V[h].indexOf(c) >= 0){ continue; }
      const zh = new Set(), zc = new Set(); for(const v of V[h]) if(libre(v)) zh.add(zone[v]); for(const v of V[c]) if(libre(v)) zc.add(zone[v]);
      let commun = false; for(const z of zh) if(zc.has(z)){ commun = true; utile[z] = true; }
      if(!commun) return false; }
    for(let z = 0; z < nz; z++) if(!utile[z]) return false;
    return true; }
  function rec(){
    if(++noeuds > budget) throw 'budget';
    let best = -1, bc = null;
    for(let k = 0; k < K; k++){ if(fini[k]) continue; const c = coups(k); if(!c.length) return; if(!bc || c.length < bc.length){ best = k; bc = c; if(c.length === 1) break; } }
    if(best < 0){ for(let i = 0; i < N; i++) if(libre(i)) return; sols++; if(!premiere){ premiere = Array.from(own, k => k === -2 ? '+' : LETTRES[k]).join(''); } return; }
    const k = best, h = tete[k];
    for(const v of bc){
      if(v === cible[k]){ fini[k] = true; if(ok()) rec(); fini[k] = false; }
      else { own[v] = k; tete[k] = v; if(ok()) rec(); own[v] = -1; tete[k] = h; }
      if(sols >= max) return; }
  }
  try{ if(ok()) rec(); }catch(e){ if(e === 'budget') return { n:-1, noeuds, sol:premiere }; throw e; }
  return { n:sols, noeuds, sol:premiere };
}

/* ---------- le générateur (partie G) ----------
   1. (mode ponts) des ponts posés loin des bords ; 2. des fils posés un par un sur le graphe (marche au hasard qui préfère
   les cases coincées, au moins 3 nœuds, un fil ne se touche pas lui-même, il ne s'arrête pas sur un pont) ;
   3. on refuse les pelotes voisines, les ponts restés vides ou traversés deux fois par la même couleur ;
   4. le solveur doit trouver UNE seule solution. Graine = toujours le même niveau pour le même numéro. */
export function hasard(seed){ let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function touche(GR, set, v, prec){ for(const w of GR.V[v]) if(w !== prec && set.has(w)) return true; return false; }
function remplit(GR, k, R){   // des fils qui couvrent la grille, posés un par un (marche au hasard qui préfère les cases coincées)
  const { N:NC, M:N, V } = GR, own = new Int16Array(N).fill(-1), fils = [], cible = (N - GR.ponts.length) / k;
  for(let i = 0; i < N; i++) if(GR.bloque[i]) own[i] = -2;
  const libres = i => V[i].filter(v => own[v] === -1).length;
  while(true){
    const vides = []; for(let i = 0; i < NC; i++) if(own[i] === -1) vides.push(i);   // un fil commence toujours sur une vraie case
    if(!vides.length) break;
    let m = 9; vides.forEach(i => m = Math.min(m, libres(i)));
    const cands = vides.filter(i => libres(i) === m), d = cands[(R() * cands.length) | 0];
    const c = fils.length, f = [d], set = new Set(f); own[d] = c;
    const long = Math.max(3, Math.round(cible * (.6 + R() * .9)));
    while(f.length < long || f[f.length - 1] >= NC){   // on ne s'arrête pas au milieu d'un pont
      const h = f[f.length - 1];
      const opts = V[h].filter(v => own[v] === -1 && !touche(GR, set, v, h));
      if(!opts.length) break;
      let best = 9; opts.forEach(v => best = Math.min(best, libres(v)));
      const bons = opts.filter(o => libres(o) === best), v = R() < .75 ? bons[(R() * bons.length) | 0] : opts[(R() * opts.length) | 0];
      f.push(v); set.add(v); own[v] = c;
    }
    fils.push(f);
  }
  for(let i = NC; i < N; i++) if(own[i] === -1) return null;   // une voie de pont restée vide
  // les fils trop courts : on essaie de les coller au bout d'un voisin
  for(let tour = 0; tour < 3; tour++){
    for(let c = 0; c < fils.length; c++){ const f = fils[c]; if(!f || f.length >= 3) continue;
      let colle = false;
      for(const bout of [f[0], f[f.length - 1]]){
        for(const v of V[bout]){ const d = own[v]; if(d < 0 || d === c || !fils[d]) continue; const g = fils[d];
          const ordre = bout === f[0] ? f.slice() : f.slice().reverse();
          let neuf = null;
          if(g[g.length - 1] === v) neuf = g.concat(ordre); else if(g[0] === v) neuf = ordre.slice().reverse().concat(g);
          if(!neuf) continue;
          const set = new Set(), okk = neuf.every((x, t) => { const r = !V[x].some(w => set.has(w) && w !== neuf[t - 1]); set.add(x); return r; });
          if(!okk) continue;
          fils[d] = neuf; neuf.forEach(x => own[x] = d); fils[c] = null; colle = true; break; }
        if(colle) break; }
    }
  }
  const out = fils.filter(Boolean); if(out.some(f => f.length < 3 || f[0] >= NC || f[f.length - 1] >= NC)) return null; return out;
}
function placePonts(n, nb, R){   // des ponts loin des bords et pas collés entre eux
  const p = new Array(n * n).fill('.'), pris = [];
  for(let e = 0; e < 200 && pris.length < nb; e++){ const x = 1 + ((R() * (n - 2)) | 0), y = 1 + ((R() * (n - 2)) | 0);
    if(pris.some(([a, b]) => Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1)) continue; pris.push([x, y]); p[y * n + x] = '+'; }
  return p;
}
export function fabrique(n, k, seed, essais = 300, kmin = k - 1, kmax = k + 1, nPonts = 0){
  const R = hasard(seed), N = n * n;
  for(let e = 0; e < essais; e++){
    const base = placePonts(n, nPonts, R), GR = graphe(n, base.join(''));
    if(GR.ponts.length !== nPonts) continue;
    const fils = remplit(GR, k, R); if(!fils || fils.length < kmin || fils.length > kmax || fils.length > LETTRES.length) continue;
    const s = new Array(GR.M).fill('+'), p = base.slice(); let bon = true;
    fils.forEach((f, c) => { f.forEach(i => s[i] = LETTRES[c]); p[f[0]] = LETTRES[c]; p[f[f.length - 1]] = LETTRES[c]; if(adjacent(n, f[0], f[f.length - 1])) bon = false; });
    // chaque pont doit être traversé par deux couleurs différentes
    GR.ponts.forEach((_, q) => { if(s[N + 2 * q] === s[N + 2 * q + 1]) bon = false; });
    if(!bon) continue;
    const niv = { n, p:p.join(''), s:s.join('') };
    const r = resoudre(niv, 2, n <= 7 ? 200000 : 600000);
    if(r.n === 1){ niv.s = r.sol; niv.d = r.noeuds; return niv; }
  }
  return null;
}
// une forme qui ne dépend pas des symétries ni des couleurs : pour éliminer les doublons
export function empreinte(niv){
  const n = niv.n, formes = [];
  const T = [(x, y) => [x, y], (x, y) => [n - 1 - x, y], (x, y) => [x, n - 1 - y], (x, y) => [n - 1 - x, n - 1 - y], (x, y) => [y, x], (x, y) => [n - 1 - y, x], (x, y) => [y, n - 1 - x], (x, y) => [n - 1 - y, n - 1 - x]];
  for(const f of T){ const q = new Array(n * n); for(let i = 0; i < n * n; i++){ const [x, y] = f(i % n, (i / n) | 0); q[y * n + x] = niv.p[i]; }
    const ren = {}; let c = 0; formes.push(q.map(ch => ch === '.' || ch === '+' ? ch : (ren[ch] || (ren[ch] = LETTRES[c++]))).join('')); }
  return formes.sort()[0];
}
