// Chkobba : tests du moteur JS (node docs/chkobba/test-regles.mjs)
import { nouvellePartie, nouvelleManche, options, jouer, finManche, majorite, totalCartes, choisir, melange, coupsPermis, vue } from '../../jeux/chkobba/regles.js';
let ok = 0, ko = 0; const t = (n, c, i = '') => { if(c) ok++; else { ko++; console.log('ÉCHEC', n, i); } };
const S = a => JSON.stringify([...a].sort());
// paquet
{ const m = melange(42); t('40 cartes uniques', new Set(m.paquet).size === 40); t('même graine', S(melange(42).paquet) === S(m.paquet) && melange(42).paquet.join() === m.paquet.join()); t('graines différentes', melange(43).paquet.join() !== m.paquet.join()); }
// prises
t('égalité prioritaire', S(options('c7', ['d3', 'p4', 't7']).flat()) === S(['t7']));
t('deux égales = deux choix', options('c5', ['d5', 'p5', 't2']).length === 2);
t('somme', S(options('c8', ['d7', 'p1', 't3', 'c5']).map(o => o.join('+'))) === S(['d7+p1', 't3+c5']));
t('aucune prise', options('c2', ['d7', 'p5']).length === 0);
t('une seule carte ne fait pas une somme', options('c6', ['d2', 'p9']).length === 0);
// coups
{ const s = nouvellePartie({ n:2, seed:7 }); s.tapis = ['d3', 'p4']; s.mains = [['c7', 'c2', 't9'], ['d1', 'd2', 'd5']]; s.paquet = s.paquet.slice(0, 30); s.tour = 1; s.pris = [[], []];
  const tot = totalCartes(s);
  t('pas ton tour', !jouer(s, 0, 'c7', ['d3', 'p4']).ok);
  s.tour = 0;
  t('prise obligatoire', !jouer(s, 0, 'c7', []).ok); t('fausse prise', !jouer(s, 0, 'c7', ['d3']).ok); t('carte absente', !jouer(s, 0, 'd9', []).ok);
  const r = jouer(s, 0, 'c7', ['d3', 'p4']); t('chkobba', r.ok && r.ev[0].chk && s.chk[0] === 1 && s.tapis.length === 0);
  t('conservation', totalCartes(s) === tot); t('tour suivant', s.tour === 1);
  t('pose', jouer(s, 1, 'd5', []).ok && s.tapis.includes('d5')); }
// pas de chkobba au dernier coup ; le reste de la table va au dernier preneur
{ const s = nouvellePartie({ n:2, seed:3 }); s.paquet = []; s.tapis = ['d4']; s.mains = [['c4'], []]; s.tour = 0; s.pris = [['t1'], ['p2']]; s.chk = [0, 0];
  const r = jouer(s, 0, 'c4', ['d4']); t('dernier coup sans chkobba', r.ok && s.chk[0] === 0 && s.phase !== 'jeu'); }
{ const s = nouvellePartie({ n:2, seed:3 }); s.paquet = []; s.tapis = ['d4', 'c9']; s.mains = [[], ['t2']]; s.tour = 1; s.dernier = 0; s.pris = [['t1'], ['p2']];
  jouer(s, 1, 't2', []); t('ramassage par le dernier preneur', s.pris[0].includes('c9') && s.pris[0].includes('t2')); }
// points
t('majorité unique', majorite([5, 3]).join() === '1,0' && majorite([4, 4]).join() === '0,0' && majorite([2, 5, 5]).join() === '0,0,0');
{ const s = nouvellePartie({ n:2, seed:1 }); s.tapis = []; s.paquet = []; s.mains = [[], []]; s.chk = [2, 1]; s.dernier = 0;
  s.pris = [['d7', 'c7', 'd1', 'd2', 'p3', 't3', 'c6', 'p6'], ['p7', 't7', 'd3', 'c1', 'c2']]; const pts = finManche(s);
  t('karta', pts[0].karta === 1 && pts[1].karta === 0); t('dinari', pts[0].din === 1); t('haya', pts[0].haya === 1 && pts[1].haya === 0);
  t('bermila à égalité de 7 : les 6', pts[0].bermila === 1 && pts[1].bermila === 0, JSON.stringify(pts)); t('chkobbas', pts[0].chk === 2 && pts[1].chk === 1);
  t('totaux', s.total[0] === 6 && s.total[1] === 1, s.total.join()); }
// parties entières : 2, 3 et 4 joueurs (équipes), l'ordi contre l'ordi
for(const [n, eq] of [[2, false], [3, false], [4, true]]){
  let parties = 0, maxManches = 0, illegal = 0, conserve = true;
  for(let g = 1; g <= 60; g++){ const s = nouvellePartie({ n, equipes:eq, cible:21, seed:g * 977 });
    let garde = 0;
    while(s.phase !== 'fini' && garde++ < 5000){
      if(s.phase === 'manche'){ nouvelleManche(s); continue; }
      const j = s.tour, m = choisir(s, j, ['facile', 'moyen', 'malin'][j % 3]); const r = jouer(s, j, m.carte, m.prise); if(!r.ok) illegal++;
      if(s.phase === 'jeu' && totalCartes(s) !== 40) conserve = false;
      if(s.phase !== 'jeu' && s.pris.reduce((a, p) => a + p.length, 0) !== 40) conserve = false;
    }
    if(s.phase === 'fini') parties++; maxManches = Math.max(maxManches, s.manche); }
  t(`${n} joueurs : 60 parties finies`, parties === 60, parties); t(`${n} joueurs : aucun coup illégal`, illegal === 0, illegal); t(`${n} joueurs : 40 cartes toujours`, conserve);
  console.log(`${n} joueurs${eq ? ' (2 contre 2)' : ''} : 60 parties à 21, au plus ${maxManches} manches`);
}
// le niveau malin bat le facile
{ let gm = 0; for(let g = 1; g <= 200; g++){ const s = nouvellePartie({ n:2, cible:11, seed:g * 31 + 5 }); while(s.phase !== 'fini'){ if(s.phase === 'manche'){ nouvelleManche(s); continue; } const j = s.tour, m = choisir(s, j, j === (g % 2) ? 'malin' : 'facile'); jouer(s, j, m.carte, m.prise); } if(s.gagnant === g % 2) gm++; }
  console.log('malin contre facile :', gm, '/ 200'); t('malin > facile', gm > 130, gm); }
// la vue d'un joueur ne contient pas les mains des autres
{ const s = nouvellePartie({ n:4, equipes:true, seed:9 }); const v = JSON.stringify(vue(s, 1)); t('vue privée', [0, 2, 3].every(k => s.mains[k].every(c => !vue(s, 1).main.includes(c))) && !v.includes('"mains"')); t('vue : ma main', vue(s, 1).main.join() === s.mains[1].join()); }
console.log(ok + ' tests réussis, ' + ko + ' échecs'); process.exit(ko ? 1 : 0);
