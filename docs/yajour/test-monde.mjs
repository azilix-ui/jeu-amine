/* Tests de Yajour : node docs/yajour/test-monde.mjs [numéro de niveau]
   1. la physique est déterministe (même tir = même résultat) ; 2. un robot trouve, pour CHAQUE niveau, des tirs qui gagnent
   avec le nombre de tirs permis (recherche sur une grille d'angles, tir après tir). */
import RAPIER from '../../lib/rapier3d-compat-0.14.0.es.js';
import { NIVEAUX, monde, simuleTir, bilan, etoiles, score } from '../../jeux/yajour/monde.js';
await RAPIER.init();
let ok = 0, ko = 0; const t = (nom, v) => { if(v) ok++; else { ko++; console.log('ÉCHEC :', nom); } };
const rejoue = (niv, tirs) => { const S = monde(RAPIER, niv); for(const [a, e, p] of tirs) simuleTir(S, a, e, p); return S; };
// 1. déterminisme
{ const A = rejoue(NIVEAUX[1], [[2, 12]]), B = rejoue(NIVEAUX[1], [[2, 12]]);
  t('même tir, même résultat', A.corps.every((c, i) => { const p = c.rb.translation(), q = B.corps[i].rb.translation(); return c.parti === B.corps[i].parti && (c.parti || Math.abs(p.x - q.x) + Math.abs(p.y - q.y) + Math.abs(p.z - q.z) < 1e-6); })); }
// 2. le robot
const AZ = [-14, -10, -7, -4, -2, 0, 2, 4, 7, 10, 14], EL = [0, 3, 6, 9, 12, 16, 20, 25, 30, 38];
const seul = process.argv[2] ? [+process.argv[2] - 1] : NIVEAUX.map((_, i) => i);
for(const i of seul){ const niv = NIVEAUX[i]; let tirs = [], gagne = false; const t0 = Date.now();
  for(let n = 0; n < niv.tirs && !gagne; n++){
    let best = null;
    for(const az of AZ) for(const el of EL){ const S = rejoue(niv, [...tirs, [az, el, null]]), b = bilan(S), v = (b.ok ? 1000 : 0) + b.fait / b.total * 100 + b.sortis - (b.chatTombe ? 500 : 0);
      if(!best || v > best.v) best = { v, az, el, b, S }; if(b.ok) break; }
    tirs.push([best.az, best.el, null]); gagne = best.b.ok;
    if(gagne) console.log(`niveau ${i + 1} « ${niv.nom} » : gagné en ${tirs.length} tir(s) ${JSON.stringify(tirs.map(x => x.slice(0, 2)))}, ${etoiles(best.S, niv.tirs - tirs.length)} étoile(s), score ${score(best.S, niv.tirs - tirs.length)} / par ${niv.par} (${Date.now() - t0} ms)`);
  }
  if(!gagne) console.log(`niveau ${i + 1} « ${niv.nom} » : PAS GAGNÉ (${JSON.stringify(tirs)})`);
  t(`niveau ${i + 1} gagnable`, gagne);
}
console.log(ok + ' tests réussis, ' + ko + ' échecs'); if(ko) process.exit(1);
