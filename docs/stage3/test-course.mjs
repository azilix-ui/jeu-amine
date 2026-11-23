// Stage 3 (la course du TGM) : un robot court chaque parcours et doit attraper le train, dans les deux modes.
// node docs/stage3/test-course.mjs [graines]
import { nouvellePartie, pas, resultat, parcours, PAS, dansTrou } from '../../jeux/stage3/course.js';
const N = +(process.argv[2] || 60); let ok = 0, ko = 0; const stats = {};
function robot(g){
  const h = g.h, P = g.P, v = Math.max(120, h.vx), C = { saut:false, bas:false, vite:true, lent:false };
  const devant = (x0, x1) => x1 > h.x - 16 && x0 - h.x < v * .30 + 30;
  for(const o of P.obstacles){ if(g.tombes.has(o) || g.glisses.has(o)) continue; if(o.glisse){ if(devant(o.x, o.x + o.w) && o.x - h.x > 4) C.saut = true; continue; }
    if(h.y > -o.h && devant(o.x, o.x + o.w) && o.x - h.x > 0){ C.saut = true; if(o.h > 60) C.saut = true; } }
  for(const t of P.trous) if(t.x - h.x > -10 && t.x - h.x < v * .12 + 20) C.saut = true;
  for(const l of P.linges) if(l.x - h.x < 70 && l.x + l.w > h.x - 20){ C.bas = true; C.saut = false; }
  for(const e of g.ennemis){ if(!e.actif || e.parti || e.etourdi > 0) continue; const d = e.x - e.w / 2 - h.x, ferme = v - e.vx;
    if(d > 0 && d < ferme * .30 + 30){ if(e.t === 'mouette'){ C.bas = true; C.saut = false; } else C.saut = true; } }
  if(!h.sol && h.vy < 0) C.saut = true;   // garder le saut pour aller loin
  return C;
}
for(const mode of ['tranquille', 'champion']){
  const s = stats[mode] = { gagne:0, etoiles:[0, 0, 0, 0], degats:0, reste:0, n:0 };
  for(let k = 1; k <= N; k++){
    const g = nouvellePartie(k * 7919, mode); let morceaux = 0;
    for(let i = 0; i < 120 * 400 && g.etat === 'course'; i++){ const avant = g.h.morceaux; pas(g, robot(g), PAS); if(g.h.morceaux < avant) morceaux += avant - g.h.morceaux; }
    const r = resultat(g); s.n++; s.degats += morceaux; s.etoiles[r.etoiles]++;
    if(r.gagne){ s.gagne++; s.reste += r.reste; ok++; } else { ko++; if(ko < 6) console.log('perdu', mode, k, g.etat, Math.round(g.h.x), '/', g.P.L, 'vies', g.vies); }
  }
}
for(const [m, s] of Object.entries(stats)) console.log(m, `${s.gagne}/${s.n} TGM attrapés, étoiles ${JSON.stringify(s.etoiles)}, ${(s.degats / s.n).toFixed(1)} morceaux perdus par course, ${(s.reste / Math.max(1, s.gagne)).toFixed(1)} s d'avance`);
// chaque jasmin s'attrape : élan en courant vite, saut tenu au bon endroit
let jok = 0, jn = 0;
for(const mode of ['tranquille', 'champion']) for(let k = 1; k <= 15; k++){ const P0 = parcours(k * 7919, mode);
  P0.jasmins.forEach((jz, i) => { jn++; let pris = false;
    for(let D = 60; D <= 340 && !pris; D += 10){ const g = nouvellePartie(k * 7919, mode); g.ennemis.length = 0; g.h.x = jz.x - D - 160; g.h.vx = g.M.v * 1.35; g.lanterne = g.h.x;
      for(let s = 0; s < 120 * 4 && !pris && g.etat === 'course'; s++){ pas(g, { vite:true, saut:g.h.x > jz.x - D }); if(g.pris.has('j' + i)) pris = true; } }
    if(pris) jok++; else console.log('jasmin impossible', mode, k, i); }); }
console.log(`${jok}/${jn} jasmins attrapables`);
// le même parcours pour la même graine (la course en ligne)
console.log(JSON.stringify(parcours(42, 'champion')) === JSON.stringify(parcours(42, 'champion')) ? 'même graine = même parcours ✓' : 'ÉCHEC graine');
process.exit(ko > N * .05 ? 1 : 0);
