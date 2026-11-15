/* Koora (كرة) : les règles et les niveaux, sans aucun dessin (testés en Node : docs/koora/test-regles.mjs).
   L'enfant pousse sa koora (son ballon) dans une rue de la médina. Le ballon porte un nombre.
   Un nombre plus petit ou égal : on le mange (valeur + nombre). Un nombre plus grand : perdu (Champion) ou rebond (Tranquille).
   Des portes changent la valeur (+, −, ×), des obstacles gênent, et au bout de la rue des portes de la médina (bab) à casser :
   on casse un bab si sa valeur est ≥ à sa résistance, et on perd cette résistance.
   La piste : 10 m de large, 5 couloirs de 2 m (le ballon peut aller partout, les couloirs servent à poser les objets). */

export const LARG = 10, NV = 5, voieX = i => -4 + i * 2;
export const NIVEAUX = 30;

export function couleur(v){ return v < 10 ? '#2f7de1' : v < 50 ? '#2e9e4f' : v < 100 ? '#e8c21b' : v < 500 ? '#ef7d22' : v < 1000 ? '#8b4fd0' : '#d4a017'; }
export function rayon(v){ return Math.min(1.15, .42 + .22 * Math.log10(Math.max(1, v))); }

/* la fusion : renvoie la nouvelle valeur, ou null si le nombre est trop grand */
export function fusion(v, n){ return n <= v ? v + n : null; }
export function porte(v, op, a){ return op === '+' ? v + a : op === '-' ? Math.max(1, v - a) : op === 'x' ? v * a : v; }

/* générateur pseudo-aléatoire à graine : un niveau est toujours le même */
export function rng(seed){ let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* fabriquer le niveau n (1…30) du mode 'tranquille' ou 'champion' */
export function niveau(n, mode = 'champion'){
  const T = mode === 'tranquille', d = Math.min(1, (n - 1) / 29), R = rng(n * 7919 + (T ? 1 : 2));
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const L = {
    n, mode, longueur:Math.round(T ? 120 + n * 3 : 150 + n * 5),
    vitesse:T ? 6 + 1.6 * d : 8 + 4 * d,
    depart:3, rangs:[], murs:[],
  };
  const pas = T ? 12 : 10 - 2 * d;                 // mètres entre deux rangées
  let sur = 2, vs = L.depart;                       // le couloir « sûr » et la valeur en le suivant
  for(let z = 24; z < L.longueur - 14; z += pas){
    const r = { z, cases:new Array(NV).fill(null) };
    const choix = R();
    const portes = (T ? n >= 4 : n >= 3) && choix < (T ? .2 : .25);
    const obst = !portes && n >= (T ? 8 : 6) && choix < (T ? .32 : .42);
    const prochain = Math.max(0, Math.min(NV - 1, sur + ri(-1, 1)));
    if(portes){
      // deux portes : à gauche (couloirs 0-1) et à droite (3-4) ; le couloir du milieu est le poteau
      const ops = T ? [['+', ri(1, 4)], ['+', ri(2, 6)]] : [
        n >= 6 && R() < .45 ? ['x', R() < .7 ? 2 : 3] : ['+', ri(2, Math.max(4, Math.round(vs * .5)))],
        R() < .5 ? ['-', ri(2, Math.max(3, Math.round(vs * .4)))] : ['+', ri(1, Math.max(3, Math.round(vs * .3)))]];
      if(R() < .5) ops.reverse();
      r.portes = [{ cote:-1, op:ops[0][0], a:ops[0][1] }, { cote:1, op:ops[1][0], a:ops[1][1] }];
      const g = porte(vs, ...ops[0]), dr = porte(vs, ...ops[1]);
      // le chemin sûr prend la meilleure porte ; il doit pouvoir y aller depuis son couloir
      const cote = sur < 2 ? -1 : sur > 2 ? 1 : g >= dr ? -1 : 1; vs = cote < 0 ? g : dr;
      sur = cote < 0 ? (sur <= 1 ? sur : 1) : (sur >= 3 ? sur : 3);
      L.rangs.push(r); continue;
    }
    for(let i = 0; i < NV; i++){
      if(i === prochain){
        // le couloir sûr : vide, ou un nombre qu'on peut manger
        if(R() < (T ? .75 : .7)){ const a = T ? ri(1, Math.min(4, vs)) : ri(1, Math.max(1, Math.round(vs * (.25 + .4 * R())))); r.cases[i] = { t:'nb', v:Math.min(a, vs) }; }
        continue;
      }
      const u = R();
      if(obst && u < .35 && Math.abs(i - prochain) >= 1){
        const k = R(); r.cases[i] = { t:'obst', o:!T && n >= 12 && k < .3 ? 'trou' : !T && n >= 16 && k < .55 ? 'charrette' : (T ? n >= 12 : n >= 20) && k < .7 ? 'chat' : 'caisses' };
        continue;
      }
      if(u < .45) r.cases[i] = { t:'nb', v:T ? vs + ri(1, 5) : vs + ri(1, Math.max(2, Math.round(vs * (.3 + .9 * d)))) };   // trop grand !
      else if(u < .75) r.cases[i] = { t:'nb', v:T ? ri(1, Math.min(5, vs)) : ri(1, Math.max(1, Math.round(vs * .6))) };   // un petit à manger
    }
    const c = r.cases[prochain]; if(c && c.t === 'nb') vs += c.v;
    sur = prochain; L.rangs.push(r);
  }
  // les bab de la fin : leurs résistances sont des parts de la meilleure valeur possible
  const best = meilleur(L);
  const parts = T ? [.12, .28, .5] : [.05, .1, .16, .26, .37];
  let cumul = 0;
  for(const f of parts){ let r = Math.max(1, joli(best.v * f)); if(L.murs.length === 0) r = Math.min(r, Math.max(1, Math.floor(vs * .5))); cumul += r; L.murs.push(r); }
  L.vSure = vs; L.vMax = best.v;
  return L;
}
function joli(x){ if(x < 20) return Math.round(x); if(x < 100) return Math.round(x / 5) * 5; if(x < 1000) return Math.round(x / 10) * 10; return Math.round(x / 50) * 50; }

/* le meilleur chemin (programmation dynamique sur les couloirs, ±1 couloir par rangée) :
   v = la plus grande valeur qu'on peut avoir en arrivant ; vs = la valeur du chemin le plus prudent qui existe (≥ 1 chemin gagnant) */
export function meilleur(L){
  let best = new Array(NV).fill(-1); best[2] = L.depart;
  for(const r of L.rangs){
    const nx = new Array(NV).fill(-1);
    for(let i = 0; i < NV; i++){ if(best[i] < 0) continue;
      for(let j = Math.max(0, i - 1); j <= Math.min(NV - 1, i + 1); j++){
        let v = best[i];
        if(r.portes){ if(j === 2) continue; const p = r.portes[j < 2 ? 0 : 1]; v = porte(v, p.op, p.a); }
        else { const c = r.cases[j]; if(c && c.t === 'obst') continue; if(c && c.t === 'nb'){ const f = fusion(v, c.v); if(f == null) continue; v = f; } }
        if(v > nx[j]) nx[j] = v; } }
    best = nx;
  }
  const v = Math.max(...best);
  return { v, vs:v, ok:v > 0 };
}

/* au bout de la rue : combien de bab on casse avec la valeur v, et ce qu'il reste */
export function casseMurs(v, murs){ let k = 0; for(const r of murs){ if(v >= r){ v -= r; k++; } else break; } return { k, reste:v }; }
export function etoiles(k, murs){ const n = murs.length; return k <= 0 ? 0 : k >= n ? 3 : k >= Math.ceil(n / 2) ? 2 : 1; }
export function score(vAvant, k){ return vAvant + 50 * k; }
