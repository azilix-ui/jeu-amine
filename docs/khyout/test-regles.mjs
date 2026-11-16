/* Tests des règles de Khyout : node docs/khyout/test-regles.mjs */
import { lire, bilan, debut, pas, fin, relie, resoudre, cheminSolution, poseSolution, empreinte, chemin } from '../../jeux/khyout/regles.js';
import { PETITS, NIVEAUX, PONTS } from '../../jeux/khyout/niveaux.js';
let ok = 0, ko = 0; const t = (nom, v) => { if(v) ok++; else { ko++; console.log('ÉCHEC :', nom); } };

// 1. tous les niveaux : une seule solution, la solution relie bien chaque paire et couvre tout, pas de doublon
const tous = [...PETITS.map((l, i) => ['petit ' + (i + 1), l]), ...NIVEAUX.map((l, i) => ['niveau ' + (i + 1), l]), ...PONTS.map((l, i) => ['pont ' + (i + 1), l])];
const vus = new Set();
for(const [nom, l] of tous){
  const r = resoudre(l, 2, 3e6); t(nom + ' : une seule solution', r.n === 1);
  const P = lire(l); P.pel.forEach((_, k) => poseSolution(P, k)); t(nom + ' : la solution gagne', bilan(P).gagne);
  const f = empreinte(l); t(nom + ' : pas de doublon', !vus.has(f)); vus.add(f);
  t(nom + ' : au moins 3 couleurs', P.pel.length >= 3 && P.pel.every(p => p.length === 2));
}
// tailles demandées par le cahier des charges
const tailles = [[0, 30, 5], [30, 70, 6], [70, 110, 7], [110, 150, 8], [150, 180, 9], [180, 200, 10]];
for(const [a, b, n] of tailles) t(`niveaux ${a + 1}-${b} en ${n}×${n}`, NIVEAUX.slice(a, b).every(l => l.n === n));
t('200 niveaux', NIVEAUX.length === 200); t('30 petits', PETITS.length === 30); t('40 niveaux à ponts', PONTS.length === 40);
t('chaque niveau du monde des ponts a au moins un pont', PONTS.every(l => l.p.indexOf('+') >= 0));
// les ponts au doigt : un fil horizontal et un fil vertical se croisent sur le pont, sans se couper
{ const l = PONTS.find(x => x.n === 6), P = lire(l), N = 36, q = l.p.indexOf('+'), k = [...l.p].filter(c => c === '+').length;
  const coulH = 'abcdefghijklmnop'.indexOf(l.s[N]), coulV = 'abcdefghijklmnop'.indexOf(l.s[N + 1]);
  for(const c of [coulH, coulV]){ const s = cheminSolution(P, c), cases = s.map(x => P.G.cell[x]); const G = debut(P, cases[0]); for(let t2 = 1; t2 < cases.length; t2++) pas(P, G, cases[t2]); fin(P, G); }
  t('pont : le fil horizontal est relié', relie(P, coulH)); t('pont : le fil vertical est relié aussi (pas coupé)', relie(P, coulV));
  P.pel.forEach((_, c) => { if(c !== coulH && c !== coulV){ const s = cheminSolution(P, c), cases = s.map(x => P.G.cell[x]); const G = debut(P, cases[0]); for(let t2 = 1; t2 < cases.length; t2++) pas(P, G, cases[t2]); fin(P, G); } });
  t('pont : la grille rejouée au doigt gagne', bilan(P).gagne);
  // tourner sur un pont est interdit
  const P2 = lire(l), x = q % 6, y = (q / 6) | 0, G2 = { k:0, regle:'couper', photo:P2.ch.map(c => c.slice()) };
  P2.ch[0] = [P2.pel[0][0]]; t('le graphe : une voie de pont n\'a que 2 voisins', P2.G.V[N].length === 2 && P2.G.V[N + 1].length === 2);
}

// 2. le tracé, en rejouant la solution avec le « doigt »
for(const l of [PETITS[0], NIVEAUX[0], NIVEAUX[120], NIVEAUX[199]]){
  const P = lire(l);
  P.pel.forEach((_, k) => { const s = cheminSolution(P, k); const G = debut(P, s[0]); for(let q = 1; q < s.length; q++) pas(P, G, s[q]); fin(P, G); });
  t('rejouer la solution ' + l.n + '×' + l.n, bilan(P).gagne);
}
// 3. retour en arrière, pelote d'une autre couleur refusée, coupe et recollage, règle « bloquer »
{ const l = NIVEAUX[40], P = lire(l), s0 = cheminSolution(P, 0), s1 = cheminSolution(P, 1);
  let G = debut(P, s0[0]); for(let q = 1; q < s0.length; q++) pas(P, G, s0[q]); fin(P, G); t('fil 0 relié', relie(P, 0));
  G = debut(P, s0[0]); t('repartir de la pelote efface le fil', P.ch[0].length === 1); for(let q = 1; q < 4; q++) pas(P, G, s0[q]); pas(P, G, s0[1]); t('retour en arrière', P.ch[0].length === 2); fin(P, G);
  const P2 = lire(l); P2.pel.forEach((_, k) => poseSolution(P2, k)); t('tout posé', bilan(P2).gagne);
  // un fil 1 qui passe sur le fil 0 : le fil 0 est coupé, puis recollé si on revient
  const autre = P2.pel[1][0], c0 = P2.ch[0], milieu = c0[Math.floor(c0.length / 2)];
  const G2 = debut(P2, milieu); t('reprendre un fil au milieu', G2 && G2.k === 0 && P2.ch[0].indexOf(milieu) === P2.ch[0].length - 1); fin(P2, G2);
  const P3 = lire(l); P3.pel.forEach((_, k) => poseSolution(P3, k));
  const c1 = P3.ch[1], pres = c1[c1.length - 2];   // la case avant la fin du fil 1 : un voisin d'un autre fil ?
  const k2 = P3.ch.findIndex((c, d) => d !== 1 && c.some(i => Math.abs(i % l.n - pres % l.n) + Math.abs(((i / l.n) | 0) - ((pres / l.n) | 0)) === 1 && P3.pel[d].indexOf(i) < 0));
  if(k2 >= 0){ const cible = P3.ch[k2].find(i => P3.pel[k2].indexOf(i) < 0 && Math.abs(i % l.n - pres % l.n) + Math.abs(((i / l.n) | 0) - ((pres / l.n) | 0)) === 1);
    const avant = P3.ch[k2].length, G3 = debut(P3, pres); pas(P3, G3, cible); t('le fil traversé est coupé', P3.ch[k2].length < avant); pas(P3, G3, pres); t('… et recollé si on revient', P3.ch[k2].length === avant); fin(P3, G3);
    const G4 = debut(P3, pres, 'bloquer'); t('règle « bloquer » : on ne passe pas', !pas(P3, G4, cible)); fin(P3, G4); }
  const P4 = lire(l), G5 = debut(P4, P4.pel[0][0]), voisinePelote = P4.pel.slice(1).flat().find(i => chemin(l.n, P4.pel[0][0], i).length === 1);
  if(voisinePelote != null) t('pelote d\'une autre couleur refusée', !pas(P4, G5, voisinePelote));
}
console.log(ok + ' tests réussis, ' + ko + ' échecs'); if(ko) process.exit(1);
