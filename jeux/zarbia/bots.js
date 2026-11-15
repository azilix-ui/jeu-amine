/* Zarbia : les joueurs de la machine. Machine à états : AGRANDIR (une boucle rectangulaire hors de sa zarbia),
   RENTRER (le fil est menacé ou trop long), ATTAQUER (un fil ennemi tout près), ÉVITER (le bord).
   Ils ne voient que ce qu'un joueur voit (positions et fils), jamais les commandes à venir.
   Trois niveaux : la différence est dans les décisions et le risque, pas dans la vitesse. */
import { N } from './moteur.js';

export const NIVEAUX = {
  facile:   { L:[5, 12],  W:[5, 10],  pense:.35, peur:.6,  attaque:0,  erreur:.25, maxFil:45 },
  normal:   { L:[9, 22],  W:[7, 16],  pense:.18, peur:1.1, attaque:10, erreur:.06, maxFil:80 },
  difficile:{ L:[12, 32], W:[9, 22],  pense:.1,  peur:1.5, attaque:20, erreur:0,   maxFil:120 },
};
const clamp = v => Math.max(3, Math.min(N - 4, v));
const idx = (x, y) => y * N + x;

/* la case de ma zarbia la plus proche (recherche en anneaux) */
function chezMoi(M, p, R = 90){
  const x0 = Math.floor(p.x), y0 = Math.floor(p.y), O = M.owner;
  if(O[idx(x0, y0)] === p.id) return [x0, y0, 0];
  for(let r = 1; r < R; r++){
    let best = null, bd = 1e9;
    for(let i = -r; i <= r; i++){
      for(const [x, y] of [[x0 + i, y0 - r], [x0 + i, y0 + r], [x0 - r, y0 + i], [x0 + r, y0 + i]]){
        if(x < 0 || y < 0 || x >= N || y >= N || O[idx(x, y)] !== p.id) continue;
        const d = Math.hypot(x - x0, y - y0); if(d < bd){ bd = d; best = [x, y, d]; } } }
    if(best) return best;
  }
  return null;
}

/* une direction vers de la terre libre (ou chez un autre) : on regarde quelques rayons */
function direction(M, p){
  let best = 0, bs = -1e9;
  for(let k = 0; k < 10; k++){ const a = M.rnd() * Math.PI * 2; let s = 0;
    for(let d = 4; d <= 30; d += 2){ const x = Math.floor(p.x + Math.cos(a) * d), y = Math.floor(p.y + Math.sin(a) * d);
      if(x < 2 || y < 2 || x >= N - 2 || y >= N - 2){ s -= 6; continue; }
      const o = M.owner[idx(x, y)]; s += o === p.id ? -2 : o ? 1.5 : 1; }
    s += M.rnd() * 3; if(s > bs){ bs = s; best = a; } }
  return best;
}

export function pense(M, p, dt){
  const B = p.ia || (p.ia = { etat:'agrandir', t:0, plan:null, cible:null }), niv = NIVEAUX[p.niveau || 'normal'];
  B.t -= dt; if(B.t > 0){ if(B.plan && B.plan.pts && B.plan.etape < 3 && B.etat === 'agrandir') avance(p, B); vise(p, B.cible); return; }
  B.t = niv.pense * (.7 + M.rnd() * .6);
  const dedans = M.owner[idx(Math.floor(p.x), Math.floor(p.y))] === p.id && !p.trace.length;
  const maison = p.trace.length ? chezMoi(M, p) : null;

  // le danger : un ennemi plus près de mon fil que moi de ma zarbia
  if(p.trace.length){
    let menace = 1e9;
    for(const q of M.joueurs){ if(!q || !q.vivant || q === p) continue;
      for(let i = 0; i < p.trace.length; i += 4){ const c = p.trace[i]; const d = Math.hypot(q.x - (c % N) - .5, q.y - ((c / N) | 0) - .5); if(d < menace) menace = d; } }
    const dm = maison ? maison[2] : 50;
    if(menace < dm * niv.peur + 3 || p.trace.length > niv.maxFil){ B.etat = 'rentrer'; }
  }
  // attaquer un fil tout proche
  if(niv.attaque && B.etat !== 'rentrer'){
    let cib = null, cd = niv.attaque;
    for(const q of M.joueurs){ if(!q || !q.vivant || q === p || !q.trace.length) continue;
      for(let i = 0; i < q.trace.length; i += 2){ const c = q.trace[i], x = c % N + .5, y = ((c / N) | 0) + .5, d = Math.hypot(x - p.x, y - p.y); if(d < cd){ cd = d; cib = [x, y]; } } }
    if(cib && p.trace.length < niv.maxFil * .6){ B.etat = 'attaque'; B.cible = cib; vise(p, cib); return; }
    if(B.etat === 'attaque') B.etat = p.trace.length ? 'rentrer' : 'agrandir';
  }

  if(B.etat === 'rentrer'){
    if(dedans){ B.etat = 'agrandir'; B.plan = null; }
    else if(maison){ B.cible = [maison[0] + .5, maison[1] + .5]; vise(p, B.cible); return; }
  }
  // agrandir : une boucle rectangulaire
  if(!B.plan || dedans && B.plan.fini){
    const a = direction(M, p), s = M.rnd() < .5 ? 1 : -1, L = niv.L[0] + M.rnd() * (niv.L[1] - niv.L[0]), W = niv.W[0] + M.rnd() * (niv.W[1] - niv.W[0]);
    B.plan = { a, s, L, W, etape:0, sortie:null, fini:false };
  }
  const P = B.plan;
  if(dedans && P.etape === 0){ B.cible = [clamp(p.x + Math.cos(P.a) * 40), clamp(p.y + Math.sin(P.a) * 40)]; vise(p, B.cible); return; }
  if(!P.sortie){ P.sortie = [p.x, p.y]; }
  const [ex, ey] = P.sortie, ca = Math.cos(P.a), sa = Math.sin(P.a), px = -sa * P.s, py = ca * P.s;
  const pts = [[ex + ca * P.L, ey + sa * P.L], [ex + ca * P.L + px * P.W, ey + sa * P.L + py * P.W], [ex + px * P.W, ey + py * P.W]].map(([x, y]) => [clamp(x), clamp(y)]);
  P.pts = pts; if(P.etape < 3) avance(p, B);
  if(P.etape >= 3){ if(dedans){ P.fini = true; B.plan = null; } else if(maison) B.cible = [maison[0] + .5, maison[1] + .5]; }
  else B.cible = pts[P.etape];
  // une petite erreur de temps en temps (niveau facile)
  if(niv.erreur && p.trace.length < 6 && M.rnd() < niv.erreur) B.cible = [clamp(p.x + (M.rnd() - .5) * 20), clamp(p.y + (M.rnd() - .5) * 20)];
  vise(p, B.cible);
}
/* passer au coin suivant dès qu'on y est (ou qu'on l'a dépassé) : sinon on ferait demi-tour sur son propre fil */
function avance(p, B){ const P = B.plan, [tx, ty] = P.pts[P.etape], dx = tx - p.x, dy = ty - p.y;
  if(Math.hypot(dx, dy) < 2.2 || dx * Math.cos(p.a) + dy * Math.sin(p.a) < 0){ P.etape++; B.cible = P.etape < 3 ? P.pts[P.etape] : B.cible; } }
function vise(p, c){ if(c) p.vise = Math.atan2(c[1] - p.y, c[0] - p.x); }
