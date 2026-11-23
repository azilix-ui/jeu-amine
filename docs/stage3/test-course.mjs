// Stage 3 (la course du TGM) : un robot court chaque parcours et doit attraper le train, dans les deux modes.
// node docs/stage3/test-course.mjs [graines]
import { nouvellePartie, pas, resultat, parcours, PAS, dansTrou, NMONDES, LIMITE } from '../../jeux/stage3/course.js';
const N = +(process.argv[2] || 60); let ok = 0, ko = 0; const stats = {};
function robot(g){
  const h = g.h, P = g.P, v = Math.max(120, h.vx), C = { saut:false, bas:false, vite:false, lent:false };
  const devant = (x0, x1) => x1 > h.x - 16 && x0 - h.x < v * .30 + 30;
  let proche = 1e9; const note = x => { if(x > h.x - 20) proche = Math.min(proche, x - h.x); };
  let long = false;   // un saut long (trou, obstacle haut) : on garde le bouton
  for(const o of P.obstacles){ if(g.tombes.has(o) || g.glisses.has(o)) continue; note(o.x); if(o.glisse){ if(devant(o.x, o.x + o.w) && o.x - h.x > 4){ C.saut = true; if(o.w > 60) long = true; } continue; }
    if(h.y > -o.h && devant(o.x, o.x + o.w) && o.x - h.x > 0){ C.saut = true; } }
  for(const t of P.trous){ note(t.x); if(t.x - h.x > -10 && t.x - h.x < v * .12 + 20){ C.saut = true; } if(t.x + t.w > h.x && t.x - h.x < 260) long = true; }
  for(const l of P.linges){ note(l.x); if(l.x - h.x < 70 && l.x + l.w > h.x - 20){ C.bas = true; C.saut = false; } }
  for(const e of g.ennemis){ if(!e.actif || e.parti || e.etourdi > 0) continue; const d = e.x - e.w / 2 - h.x, ferme = v - e.vx; note(e.x - e.w);
    if(e.t === 'mouette'){ if(d > -e.w - 30 && d < ferme * .30 + 30){ C.bas = true; C.saut = false; } }   // rester baissé tant qu'elle passe
    else if(d > 0 && d < ferme * .30 + 30) C.saut = true; }
  if(!h.sol && h.vy < 0 && long) C.saut = true;   // garder le saut pour aller loin
  if(!h.sol && h.vy > 0 && h.y < -25) C.saut = false;   // lâcher en redescendant, pour pouvoir réappuyer en touchant le sol
  if(!h.sol && h.vy > 0) for(const l of P.linges) if(l.x - h.x < 140 && l.x + l.w > h.x) C.bas = true;   // redescendre vite avant le linge
  C.vite = proche > 420 || !h.sol;
  return C;
}
const temps = { tranquille:[], champion:[] };
for(const mode of ['tranquille', 'champion']) for(let m = 1; m <= NMONDES; m++){
  const s = stats[mode + ' m' + m] = { gagne:0, etoiles:[0, 0, 0, 0], degats:0, reste:0, n:0, t:0, chocs:0 };
  for(let k = 1; k <= N; k++){
    const g = nouvellePartie(k * 7919, mode, m); g.limite = 1e9; let morceaux = 0;
    for(let i = 0; i < 120 * 600 && g.etat === 'course'; i++){ const avant = g.h.morceaux; pas(g, robot(g), PAS); if(g.h.morceaux < avant) morceaux += avant - g.h.morceaux; for(const e of g.ev) if(e.k === 'sonne') s.chocs++; g.ev.length = 0; }
    const r = resultat(g); s.n++; s.degats += morceaux;
    if(r.gagne){ s.gagne++; s.t += r.temps; ok++; } else { ko++; if(ko < 8) console.log('perdu', mode, 'monde', m, 'graine', k, g.etat, Math.round(g.h.x), '/', g.P.L); }
  }
  temps[mode][m] = s.t / Math.max(1, s.gagne);
}
for(const [m, s] of Object.entries(stats)) console.log(m, `${s.gagne}/${s.n} arrivés, ${(s.degats / s.n).toFixed(1)} morceaux perdus, ${(s.chocs / s.n).toFixed(1)} chocs, temps moyen ${(s.t / Math.max(1, s.gagne)).toFixed(1)} s`);
for(const mode of ['tranquille', 'champion']) console.log('LIMITE', mode, '= le double, arrondi à 5 s :', JSON.stringify(temps[mode].map((t, m) => m ? Math.round(t * 2 / 5) * 5 : 0)), ' (dans course.js :', JSON.stringify(LIMITE[mode]) + ')');
// chaque jasmin s'attrape : élan en courant vite, saut tenu au bon endroit
let jok = 0, jn = 0;
for(const mode of ['tranquille', 'champion']) for(let m = 1; m <= NMONDES; m++) for(let k = 1; k <= 6; k++){ const P0 = parcours(k * 7919, mode, m);
  P0.jasmins.forEach((jz, i) => { jn++; let pris = false;
    for(let D = 60; D <= 340 && !pris; D += 10){ const g = nouvellePartie(k * 7919, mode, m); g.ennemis.length = 0; g.limite = 1e9; g.h.x = jz.x - D - 160; g.h.vx = g.M.v * 1.35; g.lanterne = g.h.x;
      for(let s = 0; s < 120 * 4 && !pris && g.etat === 'course'; s++){ pas(g, { vite:true, saut:g.h.x > jz.x - D }); if(g.pris.has('j' + i)) pris = true; } }
    if(pris) jok++; else console.log('jasmin impossible', mode, k, i); }); }
console.log(`${jok}/${jn} jasmins attrapables`);
// le même parcours pour la même graine (la course en ligne)
console.log(JSON.stringify(parcours(42, 'champion')) === JSON.stringify(parcours(42, 'champion')) ? 'même graine = même parcours ✓' : 'ÉCHEC graine');
process.exit(ko > N * NMONDES * 2 * .05 ? 1 : 0);
