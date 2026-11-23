// Bilot : les deux moteurs (JS du jeu, PHP de l'arbitre) jouent les mêmes parties, ordinateurs contre ordinateurs
// (niveaux facile, moyen, malin mélangés, même hasard à graine) et doivent finir pareil, coup pour coup.
// node docs/bilot/croise.mjs
import { execFileSync } from 'node:child_process';
import { nouvellePartie, nouvelleManche, encherir, jouer, choisirEnchere, choisirCarte, suivant } from '../../jeux/bilot/regles.js';
const N = 40, NIV = ['facile', 'moyen', 'malin'];
const php = `require '${new URL('../../api/bilot_regles.php', import.meta.url).pathname}';
$NIV = ['facile', 'moyen', 'malin']; $out = [];
for ($g = 1; $g <= ${N}; $g++) {
  $s = bil_nouvelle_partie([500, 1000, 1500][$g % 3], $g * 7919, $g % 4); $r = $g * 31337; $trace = [];
  $rnd = function () use (&$r) { $r = bil_suivant($r); return $r / 4294967296; };
  $tours = 0;
  while ($s['phase'] !== 'fini' && $tours++ < 5000) {
    if ($s['phase'] === 'manche') { bil_nouvelle_manche($s); continue; }
    $j = $s['tour']; $n = $NIV[($j + $g) % 3];
    if ($s['phase'] === 'enchere') { $a = bil_choisir_enchere($s, $j, $n, $rnd); $x = bil_encherir($s, $j, $a); $trace[] = $a['k'] . ($a['v'] ?? '') . ($a['c'] ?? ''); }
    else { $c = bil_choisir_carte($s, $j, $n, $rnd); $x = bil_jouer($s, $j, $c); $trace[] = $c; }
    if (!$x['ok']) { $trace[] = 'ERREUR ' . $x['err']; break; }
  }
  $out[] = ['g' => $g, 'total' => $s['total'], 'manches' => $s['manche'], 'trace' => md5(implode(' ', $trace)), 'n' => count($trace)]; }
echo json_encode($out);`;
const P = JSON.parse(execFileSync('php', ['-r', php], { maxBuffer: 1 << 24 }).toString());
const crypto = await import('node:crypto'); let ok = 0, ko = 0, coups = 0;
for(let g = 1; g <= N; g++){
  const s = nouvellePartie({ cible:[500, 1000, 1500][g % 3], seed:g * 7919, donneur:g % 4 }); let r = g * 31337; const trace = [];
  const rnd = () => { r = suivant(r); return r / 4294967296; };
  let tours = 0;
  while(s.phase !== 'fini' && tours++ < 5000){
    if(s.phase === 'manche'){ nouvelleManche(s); continue; }
    const j = s.tour, n = NIV[(j + g) % 3]; let x;
    if(s.phase === 'enchere'){ const a = choisirEnchere(s, j, n, rnd); x = encherir(s, j, a); trace.push(a.k + (a.v ?? '') + (a.c ?? '')); }
    else { const c = choisirCarte(s, j, n, rnd); x = jouer(s, j, c); trace.push(c); }
    if(!x.ok){ trace.push('ERREUR ' + x.err); break; }
  }
  const p = P.find(x => x.g === g), h = crypto.createHash('md5').update(trace.join(' ')).digest('hex'); coups += trace.length;
  if(p && p.trace === h && JSON.stringify(p.total) === JSON.stringify(s.total) && p.manches === s.manche) ok++;
  else { ko++; console.log('DIFFÉRENT', g, s.total, p && p.total, s.manche, p && p.manches, trace.length, p && p.n); }
}
console.log(ok + ' parties identiques, ' + ko + ' différentes (' + coups + ' coups comparés)'); process.exit(ko ? 1 : 0);
