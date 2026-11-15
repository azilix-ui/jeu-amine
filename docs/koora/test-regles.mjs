// Koora : tests des règles et des 60 niveaux (node docs/koora/test-regles.mjs)
import { niveau, fusion, porte, meilleur, casseMurs, etoiles, rayon, couleur, NIVEAUX } from '../../jeux/koora/regles.js';
let ok = 0, ko = 0; const t = (n, c, i = '') => { if(c) ok++; else { ko++; console.log('ÉCHEC', n, i); } };
// le mini-simulateur du cahier des charges
let v = 10; v = fusion(v, 1); t('10+1', v === 11); v = fusion(v, 5) - 1; t('11+5', v + 1 === 16); t('10 + 20 perd', fusion(10, 20) === null); t('égal double', fusion(20, 20) === 40);
t('porte −', porte(5, '-', 9) === 1); t('porte ×', porte(7, 'x', 3) === 21);
t('murs', JSON.stringify(casseMurs(100, [10, 25, 50, 100, 250])) === JSON.stringify({ k:3, reste:15 }));
t('étoiles', etoiles(0, [1,2,3,4,5]) === 0 && etoiles(1, [1,2,3,4,5]) === 1 && etoiles(3, [1,2,3,4,5]) === 2 && etoiles(5, [1,2,3,4,5]) === 3);
t('rayon plafonné', rayon(1e9) === 1.15 && rayon(1) < rayon(50)); t('couleurs', couleur(5) !== couleur(15) && couleur(2000) === '#d4a017');
for(const mode of ['tranquille', 'champion']){ const lignes = [];
  for(let n = 1; n <= NIVEAUX; n++){ const L = niveau(n, mode), L2 = niveau(n, mode);
    t(`${mode} ${n} même graine`, JSON.stringify(L) === JSON.stringify(L2));
    const b = meilleur(L);
    t(`${mode} ${n} un chemin gagnant`, b.ok && L.vSure >= L.murs[0], `vSure ${L.vSure} mur1 ${L.murs[0]}`);
    t(`${mode} ${n} tous les bab possibles au mieux`, casseMurs(L.vMax, L.murs).k === L.murs.length, `${L.vMax} ${L.murs}`);
    t(`${mode} ${n} murs croissants`, L.murs.every((r, i) => !i || r >= L.murs[i - 1]));
    if(mode === 'tranquille') t(`${mode} ${n} pas de ×, de − ni de trou`, L.rangs.every(r => (!r.portes || r.portes.every(p => p.op === '+')) && r.cases.every(c => !c || c.o !== 'trou')));
    if(n % 5 === 1 || n === 30) lignes.push(`n${n}: ${L.longueur} m, ${L.vitesse.toFixed(1)} m/s, ${L.rangs.length} rangées, sûr ${L.vSure}, max ${L.vMax}, bab ${L.murs.join('/')}`);
  }
  console.log(mode + '\n  ' + lignes.join('\n  '));
}
console.log(ok + ' tests réussis, ' + ko + ' échecs'); process.exit(ko ? 1 : 0);
