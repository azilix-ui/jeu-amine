/* Zarbia : la logique pure du jeu (aucun dessin, aucune page) — testée en Node par docs/zarbia/test-moteur.mjs.
   Le terrain est une grille de N × N cases. owner[c] = numéro du joueur à qui la case appartient (0 = personne),
   fil[c] = numéro du joueur dont le fil de laine passe sur la case (0 = aucun).
   Un joueur qui sort de sa zarbia déroule son fil ; en revenant chez lui, la boucle se ferme : le fil et tout ce
   qu'il entoure deviennent à lui (remplissage depuis le bord, connexité 4, avec une file, sans récursion).
   Couper le fil d'un autre l'élimine : sa zarbia redevient de la terre. */

export const N = 400;                 // cases de côté
export const DT = 1 / 60;             // pas fixe de la simulation
export const CH = 40;                 // taille d'un morceau (chunk) pour le dessin
export const NCH = N / CH;

export function createMonde(opts = {}){
  const M = {
    N, owner:new Uint8Array(N * N), fil:new Uint8Array(N * N),
    joueurs:[],                         // index = id (0 inutilisé)
    count:new Int32Array(64),           // cases possédées par joueur
    boite:Array.from({ length:64 }, vide), // la boîte qui contient la zarbia de chaque joueur (elle ne rétrécit qu'à sa mort)
    dirty:new Uint8Array(NCH * NCH),    // morceaux à redessiner
    tranquille:!!opts.tranquille,       // mode Amine : on ne meurt pas en croisant son propre fil
    events:[],                          // ce qui s'est passé (pour les sons, le texte, le réseau)
    t:0, rnd:rng(opts.seed || 1),
  };
  // tampons réutilisés (pas d'allocation dans la boucle)
  M._vu = new Uint32Array(N * N); M._gen = 0; M._file = new Int32Array(N * N);
  return M;
}

/* un petit générateur pseudo-aléatoire à graine (pour rejouer un bug à l'identique) */
export function rng(seed){ let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

const idx = (x, y) => y * N + x;
function marque(M, c){ const x = c % N, y = (c / N) | 0; M.dirty[((y / CH) | 0) * NCH + ((x / CH) | 0)] = 1; }
function setOwner(M, c, id){ const o = M.owner[c]; if(o === id) return; if(o) M.count[o]--; M.owner[c] = id; marque(M, c);
  if(id){ M.count[id]++; const b = M.boite[id], x = c % N, y = (c / N) | 0; if(x < b[0]) b[0] = x; if(y < b[1]) b[1] = y; if(x > b[2]) b[2] = x; if(y > b[3]) b[3] = y; } }
const vide = () => [N, N, -1, -1];

/* ajouter un joueur : { nom, couleur, humain, … } → id */
export function ajoute(M, info){
  let id = 1; while(M.joueurs[id] && !M.joueurs[id].libre) id++;
  const p = Object.assign({ id, x:0, y:0, a:0, vise:0, vitesse:16, vivant:false, trace:[], cx:-1, cy:-1, nouv:[], score:0, kills:0, meilleur:0, nait:0, mort:0 }, info, { id });
  M.joueurs[id] = p; return p;
}

/* faire naître (ou renaître) un joueur avec un disque de zarbia autour de (x, y) */
export function nait(M, p, x, y, r = 4){
  p.x = x + .5; p.y = y + .5; p.vivant = true; p.trace.length = 0; p.cx = x; p.cy = y; p.nait = M.t; p.mort = 0;
  for(let j = -r; j <= r; j++) for(let i = -r; i <= r; i++){ const X = x + i, Y = y + j; if(X < 0 || Y < 0 || X >= N || Y >= N || i * i + j * j > r * r + r * .6) continue; const c = idx(X, Y); if(M.fil[c] && M.fil[c] !== p.id) continue; setOwner(M, c, p.id); }
  M.events.push({ k:'nait', id:p.id, x, y, r });
}

/* le meilleur endroit libre pour naître : loin des autres, sur de la terre */
export function placeLibre(M, marge = 14){
  let best = null;
  for(let essai = 0; essai < 60; essai++){
    const x = marge + Math.floor(M.rnd() * (N - 2 * marge)), y = marge + Math.floor(M.rnd() * (N - 2 * marge));
    let pris = 0; for(let j = -8; j <= 8; j += 2) for(let i = -8; i <= 8; i += 2) if(M.owner[idx(x + i, y + j)] || M.fil[idx(x + i, y + j)]) pris++;
    let loin = 1e9; M.joueurs.forEach(q => { if(q && q.vivant) loin = Math.min(loin, Math.hypot(q.x - x, q.y - y)); });
    const s = -pris * 50 + Math.min(loin, 80);
    if(!best || s > best.s) best = { x, y, s };
  }
  return best;
}

/* les cases traversées entre deux points (sans trou : on passe toujours par une case voisine en 4-connexité) */
function traverse(x0, y0, x1, y1, out){
  let cx = Math.floor(x0), cy = Math.floor(y0); const ex = Math.floor(x1), ey = Math.floor(y1);
  const dx = x1 - x0, dy = y1 - y0, sx = Math.sign(dx), sy = Math.sign(dy);
  let tMaxX = dx ? ((sx > 0 ? cx + 1 - x0 : x0 - cx) / Math.abs(dx)) : Infinity, tMaxY = dy ? ((sy > 0 ? cy + 1 - y0 : y0 - cy) / Math.abs(dy)) : Infinity;
  const tdX = dx ? 1 / Math.abs(dx) : Infinity, tdY = dy ? 1 / Math.abs(dy) : Infinity;
  let n = 0;
  while((cx !== ex || cy !== ey) && n++ < 64){ if(tMaxX < tMaxY){ cx += sx; tMaxX += tdX; } else { cy += sy; tMaxY += tdY; } out.push(cx, cy); }
}

/* un pas de simulation. Ordre : directions → déplacements → cases traversées → fils coupés → éliminations → boucles fermées → captures */
const TMP = [];
export function pas(M, dt = DT){
  M.t += dt; const J = M.joueurs;
  // 1. tourner (8 rad/s au plus) et avancer
  for(const p of J){ if(!p || !p.vivant) continue;
    let d = p.vise - p.a; while(d > Math.PI) d -= 2 * Math.PI; while(d < -Math.PI) d += 2 * Math.PI;
    const tm = (p.tourne || 8) * dt; p.a += Math.max(-tm, Math.min(tm, d));
    const ox = p.x, oy = p.y; p.x += Math.cos(p.a) * p.vitesse * dt; p.y += Math.sin(p.a) * p.vitesse * dt;
    // les bords : on glisse le long du mur
    if(p.x < .5){ p.x = .5; } if(p.x > N - .5){ p.x = N - .5; } if(p.y < .5){ p.y = .5; } if(p.y > N - .5){ p.y = N - .5; }
    p.nouv.length = 0; TMP.length = 0; traverse(ox, oy, p.x, p.y, TMP); for(let i = 0; i < TMP.length; i += 2) p.nouv.push(idx(TMP[i], TMP[i + 1]));
  }
  // 2. qui coupe le fil de qui
  const morts = [];
  // (en ligne : seuls les joueurs de cette tablette — p.local — décident ; les autres tablettes envoient leurs propres coupures)
  for(const p of J){ if(!p || !p.vivant || p.local === false) continue;
    for(const c of p.nouv){ const f = M.fil[c];
      if(!f) continue;
      if(f !== p.id){ const q = J[f]; if(q && q.vivant && !morts.some(m => m.id === q.id)) morts.push({ id:q.id, par:p.id, c }); }
      else if(!M.tranquille && M.owner[c] !== p.id){ const k = p.trace.lastIndexOf(c); if(k >= 0 && k < p.trace.length - 6 && !morts.some(m => m.id === p.id)) morts.push({ id:p.id, par:p.id, c }); }
    } }
  // 3. les éliminations (avant les captures : un joueur éliminé à ce pas ne capture rien)
  for(const m of morts) elimine(M, J[m.id], m.par);
  // 4. les fils et les boucles
  for(const p of J){ if(!p || !p.vivant) continue;
    for(const c of p.nouv){
      if(M.owner[c] === p.id){ if(p.trace.length && p.local !== false) capture(M, p); continue; }
      if(M.fil[c] !== p.id){ M.fil[c] = p.id; marque(M, c); }
      p.trace.push(c);
    }
    p.cx = Math.floor(p.x); p.cy = Math.floor(p.y);
  }
  // 5. un joueur qui n'a plus une seule case est éliminé
  for(const p of J){ if(p && p.vivant && p.local !== false && M.count[p.id] <= 0 && M.t - p.nait > .2) elimine(M, p, 0); }
  for(const p of J){ if(p && p.vivant){ p.score = M.count[p.id] * 100 / (N * N); if(p.score > p.meilleur) p.meilleur = p.score; } }
}

/* fermer la boucle : le fil devient zarbia, puis tout ce qui est entouré */
export function capture(M, p){
  const id = p.id, O = M.owner, F = M.fil;
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  const avant = M.count[id];
  const changees = [];
  for(const c of p.trace){ if(F[c] === id) F[c] = 0; if(O[c] !== id){ changees.push(c); setOwner(M, c, id); } const x = c % N, y = (c / N) | 0; if(x < x0) x0 = x; if(x > x1) x1 = x; if(y < y0) y0 = y; if(y > y1) y1 = y; }
  // la boîte qui contient le fil (agrandie d'une case) : dehors, rien ne peut être entouré
  // la boucle s'appuie sur la zarbia (qui peut faire un U) : la boîte doit contenir le fil ET toute la zarbia
  const b = M.boite[id]; x0 = Math.max(0, Math.min(x0, b[0]) - 1); y0 = Math.max(0, Math.min(y0, b[1]) - 1); x1 = Math.min(N - 1, Math.max(x1, b[2]) + 1); y1 = Math.min(N - 1, Math.max(y1, b[3]) + 1);
  const g = ++M._gen === 0xffffffff ? (M._vu.fill(0), M._gen = 1) : M._gen, V = M._vu, Q = M._file; let h = 0, t = 0;
  const pousse = c => { if(V[c] !== g && O[c] !== id){ V[c] = g; Q[t++] = c; } };
  for(let x = x0; x <= x1; x++){ pousse(idx(x, y0)); pousse(idx(x, y1)); }
  for(let y = y0; y <= y1; y++){ pousse(idx(x0, y)); pousse(idx(x1, y)); }
  while(h < t){ const c = Q[h++], x = c % N, y = (c / N) | 0;
    if(x > x0) pousse(c - 1); if(x < x1) pousse(c + 1); if(y > y0) pousse(c - N); if(y < y1) pousse(c + N); }
  const prises = new Set();
  for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++){ const c = idx(x, y); if(O[c] !== id && V[c] !== g){ if(O[c]) prises.add(O[c]); changees.push(c); setOwner(M, c, id); } }
  p.trace.length = 0;
  const gain = M.count[id] - avant;
  M.events.push({ k:'capture', id, gain, chez:[...prises], cells:changees });
  return gain;
}

/* éliminer un joueur : son fil et sa zarbia disparaissent */
export function elimine(M, p, par){
  if(!p || !p.vivant) return;
  p.vivant = false; p.mort = M.t;
  for(const c of p.trace) if(M.fil[c] === p.id){ M.fil[c] = 0; marque(M, c); }
  p.trace.length = 0;
  const O = M.owner; for(let c = 0; c < O.length; c++) if(O[c] === p.id){ O[c] = 0; marque(M, c); }
  M.count[p.id] = 0; M.boite[p.id] = vide(); p.score = 0;
  if(par && par !== p.id && M.joueurs[par]) M.joueurs[par].kills++;
  M.events.push({ k:'mort', id:p.id, par });
}

/* appliquer une capture reçue d'une autre tablette (liste de cases) */
export function appliqueCases(M, id, cells){ for(const c of cells) setOwner(M, c, id); const p = M.joueurs[id]; if(p){ for(const c of p.trace) if(M.fil[c] === id){ M.fil[c] = 0; marque(M, c); } p.trace.length = 0; } }

/* le classement : les vivants par surface */
export const classement = M => M.joueurs.filter(p => p && p.vivant).sort((a, b) => M.count[b.id] - M.count[a.id]);

/* compression d'une liste de cases pour le réseau : boîte + bandes horizontales */
export function compresse(cells){
  if(!cells.length) return '';
  const s = [...cells].sort((a, b) => a - b), out = []; let d = s[0], prev = s[0];
  for(let i = 1; i <= s.length; i++){ if(i < s.length && s[i] === prev + 1 && (s[i] % N) !== 0){ prev = s[i]; continue; } out.push(d.toString(36) + (prev > d ? '+' + (prev - d).toString(36) : '')); if(i < s.length){ d = prev = s[i]; } }
  return out.join(',');
}
export function decompresse(txt){ const r = []; if(!txt) return r; for(const b of txt.split(',')){ const [a, n] = b.split('+'); const d = parseInt(a, 36), k = n ? parseInt(n, 36) : 0; for(let i = 0; i <= k; i++) r.push(d + i); } return r; }

/* en ligne : remettre exactement la zarbia d'un joueur comme sa tablette la voit (envoyé toutes les 4 secondes) */
export function resynchro(M, id, cells){
  const g = ++M._gen, V = M._vu; for(const c of cells){ V[c] = g; if(M.owner[c] !== id) setOwner(M, c, id); }
  const O = M.owner; for(let c = 0; c < O.length; c++) if(O[c] === id && V[c] !== g) setOwner(M, c, 0);
}
export function casesDe(M, id){ const r = [], O = M.owner; for(let c = 0; c < O.length; c++) if(O[c] === id) r.push(c); return r; }
