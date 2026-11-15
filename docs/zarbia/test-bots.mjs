// Zarbia : 12 machines seules pendant 3 minutes (node docs/zarbia/test-bots.mjs) : personne ne bloque, les comptes restent justes.
import { createMonde, ajoute, nait, pas, placeLibre, classement } from '../../jeux/zarbia/moteur.js';
import { pense } from '../../jeux/zarbia/bots.js';
for(const mode of [false, true]){
  const M = createMonde({ seed:3, tranquille:mode }); const J = [];
  ['facile','facile','facile','facile','normal','normal','normal','normal','difficile','difficile','difficile','difficile'].forEach((n, i) => { const p = ajoute(M, { nom:'B' + i, niveau:n }); const l = placeLibre(M); nait(M, p, l.x, l.y); J.push(p); });
  const stats = { morts:{ facile:0, normal:0, difficile:0 }, captures:0, maxScore:0 }; let bloque = 0; const last = J.map(p => [p.x, p.y]);
  const t0 = Date.now();
  for(let k = 0; k < 60 * 180; k++){
    for(const p of J){ if(p.vivant) pense(M, p, 1 / 60); else if(M.t - p.mort > 2){ const l = placeLibre(M); nait(M, p, l.x, l.y); p.ia = null; } }
    pas(M);
    for(const e of M.events){ if(e.k === 'mort'){ stats.morts[M.joueurs[e.id].niveau]++; const w = e.par === e.id ? 'soi' : e.par ? 'coupé' : 'plus de case'; stats[w] = (stats[w] || 0) + 1; } if(e.k === 'capture') stats.captures++; } M.events.length = 0;
    if(k && k % 600 === 0) J.forEach((p, i) => { if(p.vivant && Math.hypot(p.x - last[i][0], p.y - last[i][1]) < 2){ bloque++; if(process.env.V) console.log('bloqué', p.niveau, p.bot && p.bot.etat, p.x.toFixed(1), p.y.toFixed(1), p.trace.length, M.count[p.id], p.bot && JSON.stringify(p.bot.cible)); } last[i] = [p.x, p.y]; });
  }
  const c = new Int32Array(64); for(const o of M.owner) if(o) c[o]++; let juste = true; for(let i = 1; i < 64; i++) if(c[i] !== M.count[i]) juste = false;
  const top = classement(M).slice(0, 3).map(p => p.niveau + ' ' + p.score.toFixed(1) + '%');
  console.log(mode ? 'Tranquille' : 'Champion', '|', Date.now() - t0, 'ms pour 3 min |', 'captures', stats.captures, '| morts', JSON.stringify(stats.morts), '| bloqués', bloque, '| comptes', juste ? 'justes' : 'FAUX', '| top', top.join(', '), stats.soi, stats['coupé'], stats['plus de case']);
}
