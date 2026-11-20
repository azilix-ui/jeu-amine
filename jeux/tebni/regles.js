/* Tebni (تبني, « tu construis ») : les règles du jeu de briques (façon Tetris classique), sans aucun dessin, importables en Node.
   Grille 10 × 20 (+ 2 rangées cachées au-dessus), 7 pièces, rotation « SRS » avec ses petits décalages contre les murs,
   sac de 7 pièces (chaque pièce revient une fois par sac), pièce de côté (réserve), chute rapide, chute douce, verrouillage différé.
   Tests : node docs/tebni/test-regles.mjs */

export const L = 10, H = 20, CACHE = 2;
export const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
// formes de départ (orientation 0), coordonnées [x, y] dans une boîte ; y vers le bas
const FORMES = {
  I:[[0, 1], [1, 1], [2, 1], [3, 1]], O:[[1, 0], [2, 0], [1, 1], [2, 1]], T:[[1, 0], [0, 1], [1, 1], [2, 1]],
  S:[[1, 0], [2, 0], [0, 1], [1, 1]], Z:[[0, 0], [1, 0], [1, 1], [2, 1]], J:[[0, 0], [0, 1], [1, 1], [2, 1]], L:[[2, 0], [0, 1], [1, 1], [2, 1]],
};
const BOITE = { I:4, O:4, T:3, S:3, Z:3, J:3, L:3 };
// rotation d'un quart de tour dans le sens des aiguilles d'une montre, dans la boîte de taille n
const tourne = (c, n) => c.map(([x, y]) => [n - 1 - y, x]);
export const CASES = {};
for(const p of PIECES){ CASES[p] = [FORMES[p]]; for(let r = 1; r < 4; r++) CASES[p].push(p === 'O' ? FORMES.O : tourne(CASES[p][r - 1], BOITE[p])); }
// décalages essayés quand la rotation cogne (SRS, y vers le bas)
const KICK = {
  '0>1':[[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '1>0':[[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2':[[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], '2>1':[[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3':[[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '3>2':[[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0':[[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], '0>3':[[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};
const KICK_I = {
  '0>1':[[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]], '1>0':[[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2':[[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]], '2>1':[[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3':[[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]], '3>2':[[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0':[[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]], '0>3':[[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

/* ---------- le hasard (graine fixe : même graine, même suite de pièces) ---------- */
export function hasard(graine){ let a = graine >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function sac(alea){ const s = PIECES.slice(); for(let i = s.length - 1; i > 0; i--){ const j = Math.floor(alea() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; }

/* ---------- les vitesses ---------- */
// secondes par rangée selon le niveau (courbe classique) ; « tranquille » : deux fois plus lent, et plafonné
export function gravite(niveau, mode){ const n = Math.max(1, niveau);
  const t = Math.pow(0.8 - (n - 1) * 0.007, n - 1);
  return mode === 'tranquille' ? Math.max(0.28, t * 2) : Math.max(0.02, t); }
export const POINTS = [0, 100, 300, 500, 800];   // 1, 2, 3, 4 lignes (× niveau)

/* ---------- la partie ---------- */
export function nouvellePartie({ graine = 1, mode = 'champion', niveau = 1 } = {}){
  const P = { mode, graine, alea:hasard(graine), grille:[], file:[], piece:null, reserve:null, reserveUtilisee:false,
    score:0, lignes:0, niveau, niveau0:niveau, combo:-1, fini:false, chute:0, verrou:0, bouges:0, pieces:0, tetris:0, ev:[] };
  for(let y = 0; y < H + CACHE; y++) P.grille.push(new Array(L).fill(null));
  remplis(P); suivante(P); return P;
}
function remplis(P){ while(P.file.length < 7) P.file.push(...sac(P.alea)); }
export const cases = (p, r = p.r, x = p.x, y = p.y) => CASES[p.t][r].map(([a, b]) => [x + a, y + b]);
export function libre(P, p, r = p.r, x = p.x, y = p.y){
  for(const [a, b] of cases(p, r, x, y)){ if(a < 0 || a >= L || b >= H + CACHE) return false; if(b >= 0 && P.grille[b][a]) return false; }
  return true;
}
function suivante(P, t){
  remplis(P); const type = t || P.file.shift(); remplis(P);
  const p = { t:type, r:0, x:type === 'O' ? 3 : 3, y:type === 'I' ? CACHE - 1 : CACHE };
  P.piece = p; P.chute = 0; P.verrou = 0; P.bouges = 0;
  if(!libre(P, p)){ p.y--; if(!libre(P, p)){ P.fini = true; P.ev.push({ t:'fin' }); } }
}
export function ombre(P){ const p = P.piece; let y = p.y; while(libre(P, p, p.r, p.x, y + 1)) y++; return y; }
const surSol = P => !libre(P, P.piece, P.piece.r, P.piece.x, P.piece.y + 1);
function bougee(P){ if(surSol(P) && P.bouges < 15){ P.verrou = 0; P.bouges++; } }   // déplacer une pièce posée laisse un peu de temps (15 fois au plus)

export function deplace(P, dx){ if(P.fini) return false; const p = P.piece; if(!libre(P, p, p.r, p.x + dx, p.y)) return false; p.x += dx; bougee(P); P.ev.push({ t:'bouge' }); return true; }
export function tourneP(P, sens = 1){
  if(P.fini) return false; const p = P.piece; if(p.t === 'O') return true;
  const r2 = (p.r + (sens > 0 ? 1 : 3)) % 4, k = (p.t === 'I' ? KICK_I : KICK)[p.r + '>' + r2];
  for(const [dx, dy] of k){ if(libre(P, p, r2, p.x + dx, p.y - dy)){ p.r = r2; p.x += dx; p.y -= dy; bougee(P); P.ev.push({ t:'tourne' }); return true; } }
  return false;
}
export function chuteDouce(P){ if(P.fini) return false; const p = P.piece; if(!libre(P, p, p.r, p.x, p.y + 1)) return false; p.y++; P.score += 1; P.chute = 0; return true; }
export function chuteRapide(P){ if(P.fini) return 0; const p = P.piece, y = ombre(P), n = y - p.y; p.y = y; P.score += 2 * n; P.ev.push({ t:'pose', dur:true, n }); pose(P); return n; }
export function reserve(P){
  if(P.fini || P.reserveUtilisee) return false;
  const t = P.piece.t; if(P.reserve){ const r = P.reserve; P.reserve = t; suivante(P, r); } else { P.reserve = t; suivante(P); }
  P.reserveUtilisee = true; P.ev.push({ t:'reserve' }); return true;
}
function pose(P){
  const p = P.piece; let dehors = true;
  for(const [a, b] of cases(p)){ if(b >= 0) P.grille[b][a] = p.t; if(b >= CACHE) dehors = false; }
  P.pieces++; P.reserveUtilisee = false;
  if(dehors){ P.fini = true; P.ev.push({ t:'fin' }); return; }   // posée tout en haut, hors de la grille : perdu
  const pleines = [];
  for(let y = 0; y < H + CACHE; y++) if(P.grille[y].every(Boolean)) pleines.push(y);
  if(pleines.length){
    for(const y of pleines){ P.grille.splice(y, 1); P.grille.unshift(new Array(L).fill(null)); }
    const n = pleines.length; P.combo++; P.lignes += n; if(n === 4) P.tetris++;
    const gain = POINTS[n] * P.niveau + (P.combo > 0 ? 50 * P.combo * P.niveau : 0); P.score += gain;
    const vide = P.grille.every(r => r.every(c => !c)); if(vide) P.score += 1000 * P.niveau;
    P.ev.push({ t:'lignes', n, rangs:pleines.map(y => y - CACHE), gain, combo:P.combo, vide });
    const nv = P.niveau0 + Math.floor(P.lignes / 10); if(nv > P.niveau){ P.niveau = nv; P.ev.push({ t:'niveau', n:nv }); }
  } else P.combo = -1;
  suivante(P);
}
// fait avancer le temps (dt en secondes) : la gravité, puis le verrouillage après 0,5 s sur le sol
export function pas(P, dt, douce = false){
  if(P.fini) return;
  const g = gravite(P.niveau, P.mode), lim = douce ? Math.min(g, 0.04) : g;
  if(surSol(P)){ P.verrou += dt; if(P.verrou >= 0.5){ P.ev.push({ t:'pose', dur:false }); pose(P); } return; }
  P.chute += dt;
  while(P.chute >= lim && !surSol(P)){ P.chute -= lim; P.piece.y++; if(douce) P.score += 1; }
  if(surSol(P)) P.chute = 0;
}
// pour le dessin : la grille visible (sans les rangées cachées)
export const visible = P => P.grille.slice(CACHE);
