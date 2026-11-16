/* Kassar (كسّار, « le casseur ») : les règles, sans dessin (testées en Node : docs/kassar/).
   Mode tir : on vise, on lâche une rafale de balles qui rebondissent ; chaque carreau porte un nombre (ses points de vie) ;
   après chaque tir, les carreaux descendent d'une rangée ; s'ils arrivent en bas, c'est perdu. On gagne quand il ne reste
   plus de carreau à casser. Monde logique 360 × 640, pas fixe de 1/120 s (même partie sur toutes les tablettes).
   Carreaux : chiffres 1-9 puis lettres a-z (10 à 35) = points de vie ; '#' pierre (incassable) ; 'J' jarre (explose : −3 aux 8 voisins) ;
   '+' boule d'or (une balle de plus au prochain tir) ; '.' vide. Après chaque tir, on gagne aussi une balle. */
export const W = 360, H = 640, COLS = 7, CW = W / COLS, CH = 34, TOP = 64, LIGNE = 588, R = 6, V = 720, DT = 1 / 120, CADENCE = .065;
export const RANGS = Math.floor((LIGNE - TOP) / CH) - 1;   // rang où un carreau touche la ligne de tir : perdu
const BAS0 = 5;                                             // au départ, la rangée du bas du niveau est au rang 5

export function suivant(s){ s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; return s >>> 0; }
export const hpDe = ch => ch >= '1' && ch <= '9' ? +ch : ch >= 'a' && ch <= 'z' ? ch.charCodeAt(0) - 87 : 0;

export function nouvellePartie(niv, { facile = false } = {}){
  const n = niv.rangs.length, off = BAS0 - (n - 1), cs = [];
  niv.rangs.forEach((ligne, r) => [...ligne].forEach((ch, c) => {
    if(ch === '.' || c >= COLS) return;
    const k = ch === '#' ? 'mur' : ch === 'J' ? 'jarre' : ch === '+' ? 'bonus' : 'n', hp = k === 'n' ? hpDe(ch) : k === 'jarre' ? 1 : 0;
    cs.push({ id:cs.length, c, r, k, hp, hp0:hp });
  }));
  return { niv, facile, cs, off, tour:0, balles:(niv.balles || 3) + (facile ? 1 : 0), gagnees:0, lx:W / 2, phase:'vise',
    bs:[], t:0, aLancer:0, prochain:0, premier:null, score:0, casses:0, ev:[] };
}
export const yDe = (s, b) => TOP + (b.r + s.off) * CH;
export const visible = (s, b) => b.r + s.off >= 0;
export const reste = s => s.cs.filter(b => b.k === 'n' || b.k === 'jarre').length;

/* lancer la rafale vers l'angle a (radians, 0 = droite, π/2 = haut) */
export function tire(s, a){
  if(s.phase !== 'vise') return false;
  a = Math.max(.14, Math.min(Math.PI - .14, a));
  s.phase = 'vol'; s.a = a; s.t = 0; s.aLancer = s.balles; s.prochain = 0; s.premier = null; s.bs = []; s.tour++; s.ev.push({ k:'tir' });
  return true;
}
function touche(s, b, ball){
  if(b.k === 'bonus'){ s.cs.splice(s.cs.indexOf(b), 1); s.gagnees++; s.ev.push({ k:'bonus', b }); return false; }   // on la ramasse, la balle passe
  if(b.k === 'mur'){ s.ev.push({ k:'mur', b }); return true; }
  b.hp--; s.score++; s.ev.push({ k:'coup', b });
  if(b.hp <= 0) casse(s, b);
  return true;
}
function casse(s, b){
  const i = s.cs.indexOf(b); if(i < 0) return;
  s.cs.splice(i, 1); s.casses++; s.score += 10; s.ev.push({ k:'casse', b });
  if(b.k === 'jarre'){ s.ev.push({ k:'boum', b });
    for(const o of s.cs.slice()) if(o !== b && Math.abs(o.c - b.c) <= 1 && Math.abs(o.r - b.r) <= 1 && (o.k === 'n' || o.k === 'jarre')){ o.hp -= 3; s.score += 3; if(o.hp <= 0) casse(s, o); else s.ev.push({ k:'coup', b:o }); } }
}
/* une balle contre les carreaux : le plus proche touché, rebond (commun aux deux modes) */
function heurte(s, ball){
  // le carreau le plus proche touché
  let best = null, bd = 1e9;
  for(const b of s.cs){ if(!visible(s, b)) continue; const x0 = b.c * CW + 1.5, x1 = x0 + CW - 3, y0 = yDe(s, b) + 1.5, y1 = y0 + CH - 3;
    if(ball.x < x0 - R || ball.x > x1 + R || ball.y < y0 - R || ball.y > y1 + R) continue;
    const px = Math.max(x0, Math.min(x1, ball.x)), py = Math.max(y0, Math.min(y1, ball.y)), d = Math.hypot(ball.x - px, ball.y - py);
    if(d < R && d < bd){ bd = d; best = { b, px, py, d, x0, x1, y0, y1 }; } }
  if(best){ const { b } = best; let nx, ny;
    if(best.d > 1e-6){ nx = (ball.x - best.px) / best.d; ny = (ball.y - best.py) / best.d; }
    else { const pl = ball.x - best.x0, pr = best.x1 - ball.x, pt = ball.y - best.y0, pb = best.y1 - ball.y, m = Math.min(pl, pr, pt, pb);   // centre dedans
      [nx, ny] = m === pl ? [-1, 0] : m === pr ? [1, 0] : m === pt ? [0, -1] : [0, 1]; }
    if(touche(s, b, ball) && ball.vx * nx + ball.vy * ny < 0){ const d = ball.vx * nx + ball.vy * ny; ball.vx -= 2 * d * nx; ball.vy -= 2 * d * ny;
      ball.x += nx * (R - best.d + .3); ball.y += ny * (R - best.d + .3);
      const sp = Math.hypot(ball.vx, ball.vy); if(Math.abs(ball.vy) < sp * .12){ ball.vy = (ball.vy < 0 ? -1 : 1) * sp * .12; const k = Math.sqrt(sp * sp - ball.vy * ball.vy); ball.vx = Math.sign(ball.vx || 1) * k; } }   // jamais presque à plat
  }
}
/* un pas de 1/120 s */
export function pas(s){
  if(s.phase !== 'vol') return;
  s.t += DT;
  if(s.aLancer > 0 && s.t >= s.prochain){ s.bs.push({ x:s.lx, y:LIGNE - R, vx:Math.cos(s.a) * V, vy:-Math.sin(s.a) * V, ok:true }); s.aLancer--; s.prochain += CADENCE; }
  for(const ball of s.bs){
    if(!ball.ok) continue;
    for(let sub = 0; sub < 2; sub++){
      ball.x += ball.vx * DT / 2; ball.y += ball.vy * DT / 2;
      if(ball.x < R){ ball.x = R; ball.vx = Math.abs(ball.vx); }
      if(ball.x > W - R){ ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
      if(ball.y < TOP + R){ ball.y = TOP + R; ball.vy = Math.abs(ball.vy); }
      heurte(s, ball);
      if(ball.y >= LINE_R() && ball.vy > 0){ ball.ok = false; ball.y = LIGNE - R; if(s.premier === null){ s.premier = Math.max(R + 2, Math.min(W - R - 2, ball.x)); } break; }
    }
  }
  if(s.aLancer === 0 && s.bs.every(b => !b.ok)) finTour(s);
}
const LINE_R = () => LIGNE - R;
/* rappeler toutes les balles (bouton « ramener », ou au bout de 40 s) */
export function rappelle(s){ if(s.phase !== 'vol') return; s.aLancer = 0; s.bs.forEach(b => b.ok = false); if(s.premier === null) s.premier = s.lx; finTour(s); }
function finTour(s){
  s.lx = s.premier ?? s.lx; s.balles += s.gagnees + 1; s.gagnees = 0; s.bs = [];   // une balle de plus à chaque tir (et les boules d'or)
  if(!reste(s)){ s.phase = 'gagne'; s.ev.push({ k:'gagne' }); return; }
  if(!s.facile || s.tour % 2 === 0){ s.off++; s.ev.push({ k:'descend' }); }
  s.cs = s.cs.filter(b => !(b.k !== 'n' && b.k !== 'jarre' && b.r + s.off > RANGS));   // pierres et boules d'or tombées en bas : elles disparaissent
  if(s.cs.some(b => (b.k === 'n' || b.k === 'jarre') && b.r + s.off >= RANGS)){ s.phase = 'perdu'; s.ev.push({ k:'perdu' }); return; }
  s.phase = 'vise';
}
export const etoiles = s => s.phase !== 'gagne' ? 0 : s.tour <= s.niv.par ? 3 : s.tour <= s.niv.par + 3 ? 2 : 1;
export const scoreFinal = s => s.score + (s.phase === 'gagne' ? Math.max(0, s.niv.par + 5 - s.tour) * 25 : 0);

/* la trajectoire prévue (le guide en pointillés) : jusqu'au premier rebond sur un carreau, plus un petit bout */
export function guide(s, a, long = 330){
  a = Math.max(.14, Math.min(Math.PI - .14, a));
  let x = s.lx, y = LIGNE - R, vx = Math.cos(a), vy = -Math.sin(a), pts = [[x, y]], d = 0, rebonds = 0;
  while(d < long && rebonds < 2){
    x += vx * 3; y += vy * 3; d += 3;
    if(x < R || x > W - R){ vx = -vx; rebonds++; x = Math.max(R, Math.min(W - R, x)); }
    if(y < TOP + R){ vy = -vy; rebonds++; }
    const b = s.cs.find(b => b.k !== 'bonus' && visible(s, b) && x > b.c * CW - R + 1.5 && x < b.c * CW + CW - 1.5 + R && y > yDe(s, b) - R + 1.5 && y < yDe(s, b) + CH - 1.5 + R);
    if(b){ pts.push([x, y]); return { pts, fin:[x, y] }; }
    if(d % 9 < 3) pts.push([x, y]);
  }
  return { pts, fin:null };
}

/* vérification d'un niveau : chaque carreau à casser doit pouvoir être atteint (pas enfermé par des pierres) */
export function verifie(niv){
  const n = niv.rangs.length, g = niv.rangs.map(l => [...l.padEnd(COLS, '.')]), vu = new Set(), pile = [];
  for(let c = 0; c < COLS; c++) if(g[n - 1][c] !== '#'){ pile.push([n - 1, c]); }
  const libre = (r, c) => r >= 0 && r < n && c >= 0 && c < COLS && g[r][c] !== '#';
  // on peut aussi arriver par le dessous de toute la grille : la rangée du bas est ouverte ; on monte par les cases non-pierre
  while(pile.length){ const [r, c] = pile.pop(), k = r + ',' + c; if(vu.has(k) || !libre(r, c)) continue; vu.add(k); pile.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]); }
  const enfermes = []; g.forEach((l, r) => l.forEach((ch, c) => { if(ch !== '.' && ch !== '#' && !vu.has(r + ',' + c)) enfermes.push([r, c]); }));
  const err = []; if(enfermes.length) err.push('enfermés : ' + JSON.stringify(enfermes));
  if(!g.some(l => l.some(ch => ch !== '.' && ch !== '#' && ch !== '+'))) err.push('rien à casser');
  if(niv.rangs.some(l => l.length !== COLS)) err.push('rangée de mauvaise largeur');
  return err;
}

/* les mondes et les niveaux (le monde 1 d'abord ; 2 et 3 viendront) */
export const MONDES = [
  { id:'medina', nom:'La médina', fond:'fond-medina', tuiles:['turquoise', 'bleu', 'vert', 'jaune', 'rouge', 'violet'] },
  { id:'carthage', nom:'Carthage', fond:'fond-carthage', tuiles:['mosaique', 'jaune', 'rouge', 'bleu', 'turquoise', 'violet'] },
  { id:'sahara', nom:'Le Sahara', fond:'fond-sahara', tuiles:['jaune', 'rouge', 'violet', 'turquoise', 'vert', 'bleu'] },
];
export const NIVEAUX = [
  { m:0, nom:'Premier tir', balles:3, par:3, aide:'Glisse ton doigt pour viser, lâche pour tirer ! Le nombre sur un carreau dit combien de coups il faut pour le casser.',
    rangs:['1111111', '1.1.1.1'] },
  { m:0, nom:'Deux coups', balles:3, par:5, aide:'Un carreau 2 se casse en deux coups.',
    rangs:['2222222', '1.2.2.1', '1111111'] },
  { m:0, nom:'La boule d’or', balles:3, par:5, aide:'Touche une boule d’or : tu auras une balle de plus au prochain tir !',
    rangs:['3.3.3.3', '2+2+2+2', '1111111', '.2.+.2.'] },
  { m:0, nom:'L’étoile', balles:4, par:5, aide:'Vise les trous : les balles rebondissent derrière les carreaux !',
    rangs:['...4...', '..333..', '+22222+', '..333..', '...4...'] },
  { m:0, nom:'Boum la jarre !', balles:4, par:5, aide:'La jarre explose et abîme les carreaux tout autour !',
    rangs:['3333333', '33J3J33', '3333333', '1+111+1'] },
  { m:0, nom:'Les pierres', balles:5, par:6, aide:'Les pierres grises ne se cassent pas : fais rebondir tes balles dessus.',
    rangs:['3333333', '#.333.#', '3.#.#.3', '2+2.2+2', '#1...1#'] },
  { m:0, nom:'La porte bleue', balles:5, par:9, aide:'Casse le carreau du milieu pour ouvrir la porte.',
    rangs:['3333333', '3#####3', '3#454#3', '3#4J4#3', '3#.+.#3', '2#...#2', '1+...+1'] },
  { m:0, nom:'Le damier', balles:5, par:8, aide:'Compte bien : il y a des 5, des 6 et des 7.',
    rangs:['7.7.7.7', '.6.6.6.', '5.5J5.5', '.6+6+6.', '7.7.7.7', '.4.4.4.'] },
  { m:0, nom:'Les fenêtres', balles:6, par:8, aide:'Les jarres en chaîne : une explosion peut en allumer une autre !',
    rangs:['6666666', '6J6J6J6', '6666666', '#.#+#.#', '4444444', '2+222+2'] },
  { m:0, nom:'Bab el Bhar', balles:6, par:11, aide:'La grande porte de la médina ! Casse tout pour passer.',
    rangs:['9999999', '7#777#7', '7#7J7#7', '6666666', '5+5J5+5', '#44444#', '3.3+3.3', '2222222'] },
];

/* ---------- le mode raquette (16/11) ----------
   Les mêmes niveaux, mais une seule balle qu'on renvoie avec une raquette glissée du doigt. Les carreaux ne descendent pas.
   Points de vie divisés par deux (arrondi au-dessus, 4 au plus) : sinon trop long avec une balle. La boule d'or lance une balle de plus.
   3 vies (5 en Tranquille) ; la balle part de la raquette quand on touche l'écran ; elle accélère un peu à chaque renvoi. */
export const RQ = { y:LIGNE - 4, h:12, larg:66, largF:88, v:400, vF:340, vMax:1.4 };
export function nouvellePartieR(niv, { facile = false } = {}){
  const s = nouvellePartie(niv, { facile }); s.mode = 'raquette'; s.off = 1; s.phase = 'colle';
  s.cs.forEach(b => { if(b.k === 'n'){ b.hp = b.hp0 = Math.min(4, Math.ceil(b.hp / 2)); } });
  Object.assign(s, { vies:facile ? 5 : 3, viesPerdues:0, px:W / 2, pl:facile ? RQ.largF : RQ.larg, v0:facile ? RQ.vF : RQ.v, acc:1, renvois:0, t:0 });
  s.bs = [{ x:W / 2, y:RQ.y - R - 1, vx:0, vy:0, ok:true, colle:true }];
  return s;
}
export function bougeR(s, x){ s.px = Math.max(s.pl / 2, Math.min(W - s.pl / 2, x)); for(const b of s.bs) if(b.colle) b.x = s.px; }
export function lanceR(s){
  if(s.phase !== 'colle') return false;
  const a = Math.PI / 2 + (Math.random() - .5) * .5, v = s.v0 * s.acc;
  for(const b of s.bs) if(b.colle){ b.colle = false; b.vx = Math.cos(a) * v; b.vy = -Math.sin(a) * v; }
  s.phase = 'jeu'; s.ev.push({ k:'tir' }); return true;
}
export function pasR(s){
  if(s.phase !== 'jeu') return;
  s.t += DT;
  for(const ball of s.bs){
    if(!ball.ok || ball.colle) continue;
    for(let sub = 0; sub < 3; sub++){
      ball.x += ball.vx * DT / 3; ball.y += ball.vy * DT / 3;
      if(ball.x < R){ ball.x = R; ball.vx = Math.abs(ball.vx); s.ev.push({ k:'bord' }); }
      if(ball.x > W - R){ ball.x = W - R; ball.vx = -Math.abs(ball.vx); s.ev.push({ k:'bord' }); }
      if(ball.y < TOP + R){ ball.y = TOP + R; ball.vy = Math.abs(ball.vy); s.ev.push({ k:'bord' }); }
      const n0 = s.gagnees; heurte(s, ball);
      if(s.gagnees > n0){ s.gagnees = n0; const sp = Math.hypot(ball.vx, ball.vy), a = Math.PI / 2 + (Math.random() - .5) * 1.2;   // boule d'or : une balle de plus
        s.bs.push({ x:ball.x, y:ball.y, vx:Math.cos(a) * sp, vy:-Math.sin(a) * sp, ok:true }); }
      // la raquette : l'angle de renvoi dépend de l'endroit touché (bord = plus penché)
      if(ball.vy > 0 && ball.y + R >= RQ.y && ball.y - R <= RQ.y + RQ.h && ball.x >= s.px - s.pl / 2 - R && ball.x <= s.px + s.pl / 2 + R){
        const u = Math.max(-1, Math.min(1, (ball.x - s.px) / (s.pl / 2))), a = Math.PI / 2 - u * 1.05;
        s.renvois++; s.acc = Math.min(RQ.vMax, s.acc + .015); const v = s.v0 * s.acc;
        ball.vx = Math.cos(a) * v; ball.vy = -Math.sin(a) * v; ball.y = RQ.y - R - .5; s.ev.push({ k:'raquette' }); }
      if(ball.y > H + R){ ball.ok = false; break; }
    }
  }
  s.bs = s.bs.filter(b => b.ok);
  if(!reste(s)){ s.phase = 'gagne'; s.ev.push({ k:'gagne' }); return; }
  if(!s.bs.length){
    s.vies--; s.viesPerdues++; s.ev.push({ k:'vie' });
    if(s.vies <= 0){ s.phase = 'perdu'; s.ev.push({ k:'perdu' }); return; }
    s.phase = 'colle'; s.acc = Math.max(1, s.acc - .1); s.bs = [{ x:s.px, y:RQ.y - R - 1, vx:0, vy:0, ok:true, colle:true }];
  }
}
export const etoilesR = s => s.phase !== 'gagne' ? 0 : s.viesPerdues === 0 ? 3 : s.viesPerdues === 1 ? 2 : 1;
export const scoreFinalR = s => s.score + (s.phase === 'gagne' ? s.vies * 50 + Math.max(0, 120 - Math.round(s.t)) * 2 : 0);
