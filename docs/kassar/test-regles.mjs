// Kassar : les règles (node docs/kassar/test-regles.mjs) — vérification des niveaux, physique, et un robot qui joue chaque niveau.
import { nouvellePartieR, bougeR, lanceR, pasR, etoilesR, RQ, DT, nouvellePartie, tire, pas, verifie, NIVEAUX, yDe, visible, CW, CH, LIGNE, R, W, suivant, etoiles, reste, guide } from '../../jeux/kassar/regles.js';
let ok = 0, ko = 0; const t = (n, c, i = '') => { if(c) ok++; else { ko++; console.log('ÉCHEC', n, i); } };
NIVEAUX.forEach((n, i) => { const e = verifie(n); t('niveau ' + (i + 1) + ' vérifié', !e.length, e.join(' ; ')); });
// physique : une balle tirée tout droit vers un carreau 1 le casse et revient
{ const s = nouvellePartie({ rangs:['1111111'], balles:1, par:1 }); tire(s, Math.PI / 2); let k = 0; while(s.phase === 'vol' && k++ < 20000) pas(s);
  t('un tir casse un carreau', s.casses === 1, s.casses); t('la balle revient', s.phase !== 'vol'); t('gagné ? non, il en reste', s.phase === 'vise' && reste(s) === 6); t('les carreaux descendent', s.off === 6); }
// la jarre explose
{ const s = nouvellePartie({ rangs:['3J3', '...'].map(l => l.padEnd(7, '.')), balles:1, par:1 }); s.lx = 1.5 * CW; tire(s, Math.PI / 2); let k = 0; while(s.phase === 'vol' && k++ < 20000) pas(s);
  t('la jarre abîme ses voisins', s.cs.filter(b => b.k === 'n').every(b => b.hp <= 0 + 0) || s.casses >= 3, JSON.stringify(s.cs)); }
// la boule d'or donne une balle
{ const s = nouvellePartie({ rangs:['.......', '...+...'], balles:1, par:1 }); s.cs.push({ id:99, c:3, r:-3, k:'n', hp:50, hp0:50 }); tire(s, Math.PI / 2); let k = 0; while(s.phase === 'vol' && k++ < 40000) pas(s); t('boule d’or : +1 balle (et +1 par tir)', s.balles === 3, s.balles); }
// le guide s'arrête sur un carreau
{ const s = nouvellePartie({ rangs:['1111111'], balles:1, par:1 }); const g = guide(s, Math.PI / 2); t('guide jusqu’au carreau', g.fin && Math.abs(g.fin[1] - (yDe(s, s.cs[0]) + CH)) < 10, JSON.stringify(g.fin)); }
// un robot : vise le carreau le plus bas (avec un peu de hasard), 20 parties par niveau
let graine = 12345; const rnd = () => (graine = suivant(graine)) / 2 ** 32;
for(const [mode, facile] of [['normal', false], ['facile', true]]){ const res = [];
  NIVEAUX.forEach((niv, i) => { let g = 0, tours = 0, e3 = 0;
    for(let p = 0; p < 20; p++){ const s = nouvellePartie(niv, { facile }); let n = 0;
      while((s.phase === 'vise' || s.phase === 'vol') && n++ < 200){
        if(s.phase === 'vise'){ const cs = s.cs.filter(b => (b.k === 'n' || b.k === 'jarre') && visible(s, b)).sort((a, b) => b.r - a.r);
          const c = cs[Math.floor(rnd() * Math.min(3, cs.length))] || s.cs[0]; const tx = c ? c.c * CW + CW / 2 + (rnd() - .5) * CW : W / 2, ty = c ? yDe(s, c) + CH / 2 : 100;
          tire(s, Math.atan2(LIGNE - R - ty, tx - s.lx) + (rnd() - .5) * .3); }
        let k = 0; while(s.phase === 'vol' && k++ < 120 * 40) pas(s); if(s.phase === 'vol'){ s.phase = 'vise'; } }
      if(s.phase === 'gagne'){ g++; tours += s.tour; if(etoiles(s) === 3) e3++; } }
    res.push(`${i + 1}:${g}/20${g ? ' (' + (tours / g).toFixed(1) + ' tirs, ★★★ ' + e3 + ')' : ''}`); t(mode + ' niveau ' + (i + 1) + ' gagnable par le robot', g > 0); });
  console.log(mode, res.join('  ')); }
// le mode raquette : un robot qui suit la balle (avec un peu de retard et d'erreur), 10 parties par niveau, 4 minutes au plus
{ const s = nouvellePartieR({ rangs:['1111111'], balles:1, par:1 }); t('raquette : la balle attend sur la raquette', s.phase === 'colle' && s.bs[0].colle); bougeR(s, 50); t('raquette : la balle suit la raquette', s.bs[0].x === 50); lanceR(s); t('raquette : lancée', s.phase === 'jeu' && s.bs[0].vy < 0);
  bougeR(s, 300); let k = 0; while(s.phase === 'jeu' && k++ < 120 * 30) pasR(s); t('raquette : balle perdue = une vie de moins', s.vies === 2 || s.phase === 'gagne', s.vies); }
for(const facile of [false, true]){ const res = [];
  NIVEAUX.forEach((niv, i) => { let g = 0, tm = 0, e3 = 0;
    for(let p = 0; p < 10; p++){ const s = nouvellePartieR(niv, { facile }); let n = 0, cible = W / 2;
      while((s.phase === 'colle' || s.phase === 'jeu') && n++ < 120 * 240){
        if(s.phase === 'colle'){ bougeR(s, 40 + rnd() * (W - 80)); lanceR(s); }
        const b = s.bs.filter(b => b.vy > 0).sort((a, b) => b.y - a.y)[0] || s.bs[0];
        if(b && n % 6 === 0) cible = b.x + (rnd() - .5) * s.pl * .7;
        bougeR(s, s.px + Math.max(-7, Math.min(7, cible - s.px))); pasR(s); }
      if(s.phase === 'gagne'){ g++; tm += s.t; if(etoilesR(s) === 3) e3++; } }
    res.push(`${i + 1}:${g}/10${g ? ' (' + Math.round(tm / g) + ' s, ★★★ ' + e3 + ')' : ''}`); t('raquette ' + (facile ? 'facile' : 'normal') + ' niveau ' + (i + 1) + ' gagnable', g > 0); });
  console.log('raquette', facile ? 'facile' : 'normal', res.join('  ')); }
console.log(ok + ' tests réussis, ' + ko + ' échecs'); process.exit(ko ? 1 : 0);
