/* Fabrique les niveaux de Khyout : node docs/khyout/genere.mjs  → jeux/khyout/niveaux.js
   Chaque niveau est vérifié par le solveur (une seule solution) ; pas de doublon (même forme tournée ou retournée).
   Dans chaque tranche, la difficulté monte : plus de couleurs au début (fils courts, facile), moins à la fin,
   et parmi plusieurs essais on prend le plus « cherché » (nœuds du solveur) à mesure qu'on avance. */
import { fabrique, empreinte, resoudre } from '../../jeux/khyout/regles.js';
import { writeFileSync } from 'node:fs';
const vus = new Set();
function serie(nb, n, kHaut, kBas, graine, essaisParNiveau = 6){
  const out = [];
  for(let q = 0; q < nb; q++){
    const t = nb > 1 ? q / (nb - 1) : 0, k = Math.round(kHaut - t * (kHaut - kBas));
    const cands = [];
    for(let e = 0; cands.length < essaisParNiveau && e < essaisParNiveau * 6; e++){
      const niv = fabrique(n, k, graine + q * 1009 + e * 7, 300, k, k); if(!niv) continue;
      const f = empreinte(niv); if(vus.has(f) || cands.some(c => c.f === f)) continue; cands.push({ niv, f });
    }
    if(!cands.length) throw new Error('pas de niveau ' + n + 'x' + n + ' k=' + k);
    cands.sort((a, b) => a.niv.d - b.niv.d);
    const pris = cands[Math.min(cands.length - 1, Math.round(t * (cands.length - 1)))];
    vus.add(pris.f); const v = resoudre(pris.niv, 2, 2e6); if(v.n !== 1) throw new Error('vérification ratée');
    out.push({ n, p:pris.niv.p, s:pris.niv.s });
  }
  return out;
}
const PETITS = [...serie(10, 4, 3, 3, 11), ...serie(8, 4, 4, 4, 211), ...serie(12, 5, 5, 4, 411)];
const NIVEAUX = [
  ...serie(30, 5, 6, 4, 1001),     // 1-30 initiation
  ...serie(40, 6, 7, 5, 2001),     // 31-70 facile
  ...serie(40, 7, 8, 6, 3001),     // 71-110 intermédiaire
  ...serie(40, 8, 9, 7, 4001),     // 111-150 difficile
  ...serie(30, 9, 10, 8, 5001),    // 151-180 expert
  ...serie(20, 10, 12, 9, 6001),   // 181-200 extrême
];
const js = '/* Khyout : les niveaux, fabriqués par docs/khyout/genere.mjs (ne pas modifier à la main).\n   Chacun vérifié : une seule solution (solveur de regles.js). p = pelotes, s = solution. */\n' +
  'export const PETITS = ' + JSON.stringify(PETITS) + ';\nexport const NIVEAUX = ' + JSON.stringify(NIVEAUX) + ';\n';
writeFileSync(new URL('../../jeux/khyout/niveaux.js', import.meta.url), js.replace(/\},\{/g, '},\n{'));
console.log('petits', PETITS.length, 'niveaux', NIVEAUX.length, 'octets', js.length);
