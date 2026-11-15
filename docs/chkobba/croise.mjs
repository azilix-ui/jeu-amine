// Chkobba : les deux moteurs (JS du jeu, PHP de l'arbitre) jouent les mêmes parties (le premier coup permis à chaque fois) et doivent finir pareil.
// node docs/chkobba/croise.mjs
import { execFileSync } from 'node:child_process';
import { nouvellePartie, nouvelleManche, jouer, coupsPermis } from '../../jeux/chkobba/regles.js';
const php = `<?php require '${new URL('../../api/chkobba_regles.php', import.meta.url).pathname}';
$out = []; foreach ([[2, false], [3, false], [4, true]] as [$n, $eq]) for ($g = 1; $g <= 15; $g++) {
  $s = chk_nouvelle_partie($n, $eq, 21, $g * 7919 + $n); $trace = [];
  while ($s['phase'] !== 'fini') { if ($s['phase'] === 'manche') { chk_nouvelle_manche($s); continue; }
    $j = $s['tour']; $c = chk_coups($s['mains'][$j], $s['tapis'])[0]; chk_jouer($s, $j, $c['carte'], $c['prise']); $trace[] = $c['carte'] . ':' . implode('+', $c['prise']); }
  $out[] = ['n' => $n, 'g' => $g, 'total' => $s['total'], 'manches' => $s['manche'], 'trace' => md5(implode(' ', $trace))]; }
echo json_encode($out);`;
const P = JSON.parse(execFileSync('php', ['-r', php.replace(/^<\?php/, '')]).toString());
const crypto = await import('node:crypto'); let ok = 0, ko = 0;
for(const [n, eq] of [[2, false], [3, false], [4, true]]) for(let g = 1; g <= 15; g++){
  const s = nouvellePartie({ n, equipes:eq, cible:21, seed:g * 7919 + n }), trace = [];
  while(s.phase !== 'fini'){ if(s.phase === 'manche'){ nouvelleManche(s); continue; } const j = s.tour, c = coupsPermis(s.mains[j], s.tapis)[0]; jouer(s, j, c.carte, c.prise); trace.push(c.carte + ':' + c.prise.join('+')); }
  const p = P.find(x => x.n === n && x.g === g), h = crypto.createHash('md5').update(trace.join(' ')).digest('hex');
  if(p && p.trace === h && JSON.stringify(p.total) === JSON.stringify(s.total) && p.manches === s.manche) ok++; else { ko++; console.log('DIFFÉRENT', n, g, s.total, p && p.total, s.manche, p && p.manches); }
}
console.log(ok + ' parties identiques, ' + ko + ' différentes'); process.exit(ko ? 1 : 0);
