<?php
/* Bilot (belote coinchée) : le moteur de règles en PHP, copie fidèle de jeux/bilot/regles.js (même hasard à graine, mêmes
   enchères, mêmes plis, mêmes points, même ordinateur). Utilisé par api/bilot.php (l'arbitre des parties en ligne).
   docs/bilot/croise.mjs joue les mêmes parties (ordinateurs contre ordinateurs) dans les deux moteurs. */
declare(strict_types=1);

const BIL_COULEURS = ['p', 'c', 'd', 't'];
const BIL_HAUTEURS = ['7', '8', '9', 'T', 'V', 'D', 'R', 'A'];
const BIL_ORDRE_ATOUT = ['7', '8', 'D', 'R', 'T', 'A', '9', 'V'];
const BIL_ORDRE_SANS = ['7', '8', '9', 'V', 'D', 'R', 'T', 'A'];
const BIL_PTS_ATOUT = ['V' => 20, '9' => 14, 'A' => 11, 'T' => 10, 'R' => 4, 'D' => 3, '8' => 0, '7' => 0];
const BIL_PTS_SANS = ['A' => 11, 'T' => 10, 'R' => 4, 'D' => 3, 'V' => 2, '9' => 0, '8' => 0, '7' => 0];
const BIL_CONTRATS = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];

function bil_coul(string $c): string { return $c[0]; }
function bil_haut(string $c): string { return $c[1]; }
function bil_equipe(int $j): int { return $j % 2; }
function bil_points(string $c, string $atout): int { return (bil_coul($c) === $atout ? BIL_PTS_ATOUT : BIL_PTS_SANS)[bil_haut($c)]; }
function bil_force(string $c, string $atout): int { return bil_coul($c) === $atout ? 100 + array_search(bil_haut($c), BIL_ORDRE_ATOUT, true) : (int)array_search(bil_haut($c), BIL_ORDRE_SANS, true); }
function bil_arrondi(int|float $x): int { return (int)(floor($x / 10 + 0.5) * 10); }   // comme Math.round (les .5 vont vers le haut)
function bil_suivant(int $s): int { $s ^= ($s << 13) & 0xFFFFFFFF; $s ^= ($s >> 17); $s ^= ($s << 5) & 0xFFFFFFFF; $s &= 0xFFFFFFFF; return $s ?: 1; }
function bil_melange(int $seed): array {
    $p = []; foreach (BIL_COULEURS as $c) foreach (BIL_HAUTEURS as $h) $p[] = $c . $h;
    $s = ($seed & 0xFFFFFFFF) ?: 1;
    for ($i = count($p) - 1; $i > 0; $i--) { $s = bil_suivant($s); $j = $s % ($i + 1); [$p[$i], $p[$j]] = [$p[$j], $p[$i]]; }
    return ['paquet' => $p, 'seed' => $s];
}
function bil_trie(array &$m): void {
    usort($m, fn($a, $b) => (array_search(bil_coul($a), BIL_COULEURS, true) - array_search(bil_coul($b), BIL_COULEURS, true)) ?: (array_search(bil_haut($a), BIL_ORDRE_SANS, true) - array_search(bil_haut($b), BIL_ORDRE_SANS, true)));
}
function bil_nouvelle_partie(int $cible, int $seed, int $donneur = 0): array {
    $s = ['n' => 4, 'cible' => $cible, 'seed' => ($seed & 0xFFFFFFFF) ?: 1, 'donneur' => ($donneur + 3) % 4, 'manche' => 0, 'total' => [0, 0], 'phase' => 'enchere', 'gagnant' => -1, 'version' => 0, 'log' => []];
    bil_nouvelle_manche($s); return $s;
}
function bil_nouvelle_manche(array &$s): void {
    $m = bil_melange($s['seed']); $s['seed'] = $m['seed'];
    $s['donneur'] = ($s['donneur'] + 1) % 4; $s['mains'] = [[], [], [], []];
    $k = 0; foreach ([3, 2, 3] as $n) for ($i = 1; $i <= 4; $i++) { $j = ($s['donneur'] + $i) % 4; array_push($s['mains'][$j], ...array_slice($m['paquet'], $k, $n)); $k += $n; }
    foreach ($s['mains'] as &$mm) bil_trie($mm); unset($mm);
    $s['encheres'] = []; $s['contrat'] = null; $s['coinche'] = 1; $s['passes'] = 0; $s['tour'] = ($s['donneur'] + 1) % 4;
    $s['pli'] = []; $s['plis'] = [0, 0]; $s['ramasse'] = [[], []]; $s['dernierPli'] = null; $s['belote'] = [0, 0]; $s['beloteVue'] = [false, false, false, false];
    $s['joues'] = []; $s['points'] = null; $s['manche']++; $s['phase'] = 'enchere'; $s['version']++;
    $s['log'][] = ['k' => 'donne', 'manche' => $s['manche'], 'donneur' => $s['donneur']];
}
function bil_encheres_permises(array $s, int $j): array {
    if ($s['phase'] !== 'enchere' || $s['tour'] !== $j) return [];
    $r = [['k' => 'passe']]; $C = $s['contrat'];
    if ($s['coinche'] === 1) {
        $min = $C ? (BIL_CONTRATS[array_search($C['v'], BIL_CONTRATS, true) + 1] ?? 0) : 80;
        if ($min) foreach (BIL_CONTRATS as $v) if ($v >= $min) foreach (BIL_COULEURS as $c) $r[] = ['k' => 'annonce', 'v' => $v, 'c' => $c];
        if ($C && bil_equipe($C['j']) !== bil_equipe($j)) $r[] = ['k' => 'coinche'];
    } elseif ($s['coinche'] === 2 && $C && bil_equipe($C['j']) === bil_equipe($j)) $r[] = ['k' => 'surcoinche'];
    return $r;
}
function bil_encherir(array &$s, int $j, array $a): array {
    if ($s['phase'] !== 'enchere') return ['ok' => false, 'err' => 'pas aux enchères'];
    if ($s['tour'] !== $j) return ['ok' => false, 'err' => 'pas ton tour'];
    $k = (string)($a['k'] ?? ''); $v = isset($a['v']) ? (int)$a['v'] : null; $c = isset($a['c']) ? (string)$a['c'] : null;
    $ok = false; foreach (bil_encheres_permises($s, $j) as $x) if ($x['k'] === $k && ($k !== 'annonce' || ($x['v'] === $v && $x['c'] === $c))) { $ok = true; break; }
    if (!$ok) return ['ok' => false, 'err' => 'annonce impossible'];
    $aa = ['k' => $k]; if ($k === 'annonce') { $aa['v'] = $v; $aa['c'] = $c; }
    $ev = [['k' => 'enchere', 'j' => $j, 'a' => $aa]]; $s['encheres'][] = ['j' => $j] + $aa;
    if ($k === 'annonce') { $s['contrat'] = ['v' => $v, 'c' => $c, 'j' => $j]; $s['passes'] = 0; }
    elseif ($k === 'coinche') { $s['coinche'] = 2; $s['passes'] = 0; }
    elseif ($k === 'surcoinche') $s['coinche'] = 4;
    else $s['passes']++;
    $s['version']++;
    $fini = $k === 'surcoinche' || ($s['coinche'] === 2 && $s['passes'] >= 2) || ($s['contrat'] && $s['coinche'] === 1 && $s['passes'] >= 3);
    if (!$s['contrat'] && $s['passes'] >= 4) { $ev[] = ['k' => 'redonne']; array_push($s['log'], ...$ev); bil_nouvelle_manche($s); return ['ok' => true, 'ev' => $ev]; }
    if ($fini) { $s['phase'] = 'jeu'; $s['tour'] = ($s['donneur'] + 1) % 4; $ev[] = ['k' => 'contrat', 'contrat' => $s['contrat'], 'coinche' => $s['coinche']]; }
    else {
        $s['tour'] = ($j + 1) % 4;
        if ($s['coinche'] === 2) while (bil_equipe($s['tour']) !== bil_equipe($s['contrat']['j'])) $s['tour'] = ($s['tour'] + 1) % 4;
    }
    array_push($s['log'], ...$ev); return ['ok' => true, 'ev' => $ev];
}
function bil_maitre(array $pli, string $atout): int {
    $dem = bil_coul($pli[0]['c']); $b = 0;
    for ($i = 1; $i < count($pli); $i++) { $c = $pli[$i]['c']; $m = $pli[$b]['c'];
        $plus = bil_coul($c) === $atout ? (bil_coul($m) !== $atout || bil_force($c, $atout) > bil_force($m, $atout)) : (bil_coul($m) !== $atout && bil_coul($c) === $dem && bil_force($c, $atout) > bil_force($m, $atout));
        if ($plus) $b = $i; }
    return $b;
}
function bil_permises(array $s, int $j): array {
    $main = $s['mains'][$j]; $A = $s['contrat']['c']; if (!$s['pli']) return $main;
    $dem = bil_coul($s['pli'][0]['c']);
    $memes = array_values(array_filter($main, fn($c) => bil_coul($c) === $dem)); $atouts = array_values(array_filter($main, fn($c) => bil_coul($c) === $A));
    $m = $s['pli'][bil_maitre($s['pli'], $A)]; $fort = -1; foreach ($s['pli'] as $x) if (bil_coul($x['c']) === $A) $fort = max($fort, bil_force($x['c'], $A));
    if ($memes) {
        if ($dem !== $A) return $memes;
        $plus = array_values(array_filter($memes, fn($c) => bil_force($c, $A) > $fort)); return $plus ?: $memes;
    }
    if (bil_equipe($m['j']) === bil_equipe($j)) return $main;
    if (!$atouts) return $main;
    $plus = array_values(array_filter($atouts, fn($c) => bil_force($c, $A) > $fort)); return $plus ?: $atouts;
}
function bil_jouer(array &$s, int $j, string $carte): array {
    if ($s['phase'] !== 'jeu') return ['ok' => false, 'err' => 'pas en jeu'];
    if ($s['tour'] !== $j) return ['ok' => false, 'err' => 'pas ton tour'];
    if (!in_array($carte, $s['mains'][$j], true)) return ['ok' => false, 'err' => 'carte absente'];
    if (!in_array($carte, bil_permises($s, $j), true)) return ['ok' => false, 'err' => 'carte interdite'];
    $A = $s['contrat']['c']; $ev = [];
    $s['mains'][$j] = array_values(array_filter($s['mains'][$j], fn($c) => $c !== $carte)); $s['pli'][] = ['j' => $j, 'c' => $carte]; $s['joues'][] = $carte;
    $e = ['k' => 'carte', 'j' => $j, 'c' => $carte];
    if (bil_coul($carte) === $A && (bil_haut($carte) === 'R' || bil_haut($carte) === 'D')) {
        $autre = $A . (bil_haut($carte) === 'R' ? 'D' : 'R');
        if ($s['beloteVue'][$j]) { $e['belote'] = 'rebelote'; $s['belote'][bil_equipe($j)] = 20; }
        elseif (in_array($autre, $s['mains'][$j], true)) { $e['belote'] = 'belote'; $s['beloteVue'][$j] = true; }
    }
    $ev[] = $e; $s['version']++;
    if (count($s['pli']) < 4) { $s['tour'] = ($j + 1) % 4; array_push($s['log'], ...$ev); return ['ok' => true, 'ev' => $ev]; }
    $g = $s['pli'][bil_maitre($s['pli'], $A)]['j']; $eq = bil_equipe($g);
    $s['plis'][$eq]++; foreach ($s['pli'] as $x) $s['ramasse'][$eq][] = $x['c']; $s['dernierPli'] = ['cartes' => $s['pli'], 'g' => $g];
    $ev[] = ['k' => 'pli', 'g' => $g, 'cartes' => array_map(fn($x) => $x['c'], $s['pli'])]; $s['pli'] = []; $s['tour'] = $g;
    $vide = true; foreach ($s['mains'] as $m) if ($m) $vide = false;
    if ($vide) bil_fin_manche($s, $ev, $g);
    array_push($s['log'], ...$ev); if (count($s['log']) > 80) $s['log'] = array_slice($s['log'], -80);
    return ['ok' => true, 'ev' => $ev];
}
function bil_fin_manche(array &$s, array &$ev, int $dernier): array {
    $A = $s['contrat']['c']; $P = bil_equipe($s['contrat']['j']); $D = 1 - $P; $K = $s['contrat']['v']; $m = $s['coinche'];
    $pts = [0, 0]; foreach ([0, 1] as $e) foreach ($s['ramasse'][$e] as $c) $pts[$e] += bil_points($c, $A);
    $pts[bil_equipe($dernier)] += 10;
    $capot = $s['plis'][$P] === 8; if ($capot) $pts[$P] = 252;
    $reussi = $K === 250 ? $capot : $pts[$P] + $s['belote'][$P] >= $K;
    $marque = [0, 0];
    if ($reussi) { $marque[$P] = $K * $m + bil_arrondi($pts[$P]); $marque[$D] = $m === 1 ? bil_arrondi($pts[$D]) : 0; }
    else { $marque[$D] = (160 + $K) * $m; $marque[$P] = 0; }
    $marque[0] += $s['belote'][0]; $marque[1] += $s['belote'][1];
    $s['total'][0] += $marque[0]; $s['total'][1] += $marque[1];
    $s['points'] = ['cartes' => $pts, 'belote' => $s['belote'], 'reussi' => $reussi, 'capot' => $capot, 'marque' => $marque, 'preneur' => $P, 'contrat' => $K, 'coinche' => $m, 'atout' => $A];
    $mx = max($s['total']);
    if ($mx >= $s['cible'] && $s['total'][0] !== $s['total'][1]) { $s['phase'] = 'fini'; $s['gagnant'] = array_search($mx, $s['total'], true); } else $s['phase'] = 'manche';
    $s['version']++; $ev[] = ['k' => 'fin', 'points' => $s['points'], 'total' => $s['total'], 'phase' => $s['phase'], 'gagnant' => $s['gagnant']];
    return $s['points'];
}
function bil_vue(array $s, int $j): array {
    return ['moi' => $j, 'main' => $j >= 0 ? $s['mains'][$j] : [], 'nMains' => array_map('count', $s['mains']), 'pli' => $s['pli'], 'dernierPli' => $s['dernierPli'],
        'encheres' => $s['encheres'], 'contrat' => $s['contrat'], 'coinche' => $s['coinche'], 'tour' => $s['tour'], 'donneur' => $s['donneur'], 'plis' => $s['plis'],
        'manche' => $s['manche'], 'total' => $s['total'], 'cible' => $s['cible'], 'phase' => $s['phase'], 'gagnant' => $s['gagnant'], 'points' => $s['points'], 'belote' => $s['belote'],
        'version' => $s['version'], 'permises' => ($s['phase'] === 'jeu' && $s['tour'] === $j) ? bil_permises($s, $j) : []];
}

/* ---------- l'ordinateur (mêmes décisions que regles.js ; $rnd : fonction () => float dans [0, 1[) ---------- */
function bil_compte(array $main, callable $f): int { return count(array_filter($main, $f)); }
function bil_estime(array $main, string $c): int {
    $at = array_values(array_filter($main, fn($x) => bil_coul($x) === $c)); $e = 0;
    $a = fn($h) => bil_compte($at, fn($x) => bil_haut($x) === $h) > 0;
    if ($a('V')) $e += 22; if ($a('9')) $e += 15; if ($a('A')) $e += 10;
    $e += count($at) * 9; if (count($at) >= 5) $e += 10;
    if ($a('R') && $a('D')) $e += 20;
    foreach (BIL_COULEURS as $k) if ($k !== $c) { $m = array_values(array_filter($main, fn($x) => bil_coul($x) === $k));
        $mA = bil_compte($m, fn($x) => bil_haut($x) === 'A') > 0;
        if ($mA) $e += 11; if (bil_compte($m, fn($x) => bil_haut($x) === 'T') > 0 && $mA) $e += 7; if (!$m) $e += 6; }
    return $e + 30;
}
function bil_a_annonce(array $P, int $v, string $c): bool { foreach ($P as $x) if ($x['k'] === 'annonce' && $x['v'] === $v && $x['c'] === $c) return true; return false; }
function bil_a(array $P, string $k): bool { foreach ($P as $x) if ($x['k'] === $k) return true; return false; }
function bil_choisir_enchere(array $s, int $j, string $niveau, callable $rnd): array {
    $P = bil_encheres_permises($s, $j); $main = $s['mains'][$j]; $C = $s['contrat'];
    if ($niveau === 'facile') {
        if (!$C && $rnd() < .5) { $cs = BIL_COULEURS; usort($cs, fn($a, $b) => bil_compte($main, fn($x) => bil_coul($x) === $b) - bil_compte($main, fn($x) => bil_coul($x) === $a)); return ['k' => 'annonce', 'v' => 80, 'c' => $cs[0]]; }
        return ['k' => 'passe'];
    }
    if (bil_a($P, 'coinche')) {
        $at = array_values(array_filter($main, fn($x) => bil_coul($x) === $C['c'])); $as = bil_compte($main, fn($x) => bil_haut($x) === 'A' && bil_coul($x) !== $C['c']);
        $tient = (bil_compte($at, fn($x) => bil_haut($x) === 'V') ? 2 : 0) + (bil_compte($at, fn($x) => bil_haut($x) === '9') ? 1 : 0) + (count($at) >= 3 ? 1 : 0) + $as;
        if ($tient >= ($niveau === 'malin' ? 4 : 5) && $C['v'] >= 100) return ['k' => 'coinche'];
    }
    if (bil_a($P, 'surcoinche')) return bil_estime($main, $C['c']) >= $C['v'] + 40 ? ['k' => 'surcoinche'] : ['k' => 'passe'];
    $best = null;
    foreach (BIL_COULEURS as $c) { $e = bil_estime($main, $c);
        if ($C && bil_equipe($C['j']) === bil_equipe($j) && $C['c'] === $c) $e += 10;
        if ($C && bil_equipe($C['j']) === bil_equipe($j) && $C['c'] !== $c) $e -= 15;
        if (!$best || $e > $best['e']) $best = ['c' => $c, 'e' => $e]; }
    if ($C && bil_equipe($C['j']) === bil_equipe($j)) {
        $at = array_values(array_filter($main, fn($x) => bil_coul($x) === $C['c'])); $plus = bil_compte($main, fn($x) => bil_haut($x) === 'A' && bil_coul($x) !== $C['c']) * 10;
        if (bil_compte($at, fn($x) => bil_haut($x) === 'V')) $plus += 20; if (bil_compte($at, fn($x) => bil_haut($x) === '9')) $plus += 10;
        $v = (int)min(160, floor(($C['v'] + $plus) / 10) * 10);
        if ($plus >= 20 && $v > $C['v'] && bil_a_annonce($P, $v, $C['c'])) return ['k' => 'annonce', 'v' => $v, 'c' => $C['c']];
        return ['k' => 'passe'];
    }
    $v = (int)min(160, floor($best['e'] / 10) * 10 - ($niveau === 'malin' ? 0 : 10));
    if ($v >= 80 && bil_a_annonce($P, $v, $best['c'])) return ['k' => 'annonce', 'v' => $v, 'c' => $best['c']];
    return ['k' => 'passe'];
}
function bil_choisir_carte(array $s, int $j, string $niveau, callable $rnd): string {
    $L = bil_permises($s, $j); $A = $s['contrat']['c']; if (count($L) === 1) return $L[0];
    if ($niveau === 'facile') return $L[(int)floor($rnd() * count($L))];
    $tombees = array_flip($niveau === 'malin' ? $s['joues'] : array_slice($s['joues'], -8));
    $main = $s['mains'][$j]; $preneur = bil_equipe($s['contrat']['j']) === bil_equipe($j);
    $estMaitre = function (string $c) use ($A, $tombees, $main): bool { foreach (BIL_HAUTEURS as $h) { $x = bil_coul($c) . $h; if (bil_force($x, $A) > bil_force($c, $A) && !isset($tombees[$x]) && !in_array($x, $main, true)) return false; } return true; };
    $pts = fn($c) => bil_points($c, $A);
    $faible = function (array $arr) use ($pts, $A) { usort($arr, fn($a, $b) => ($pts($a) - $pts($b)) ?: (bil_force($a, $A) - bil_force($b, $A))); return $arr[0]; };
    $parPoints = function (array $arr) use ($pts) { usort($arr, fn($a, $b) => $pts($b) - $pts($a)); return $arr[0]; };
    $parForce = function (array $arr) use ($A) { usort($arr, fn($a, $b) => bil_force($a, $A) - bil_force($b, $A)); return $arr[0]; };
    if (!$s['pli']) {
        $atouts = array_values(array_filter($main, fn($c) => bil_coul($c) === $A));
        $restants = 8 - count(array_filter(array_keys($tombees), fn($c) => bil_coul((string)$c) === $A)) - count($atouts);
        if ($preneur && $atouts && $restants > 0) { foreach ($atouts as $c) if ($estMaitre($c)) return $c; }
        $maitres = array_values(array_filter($L, fn($c) => bil_coul($c) !== $A && $estMaitre($c))); if ($maitres) return $parPoints($maitres);
        $non = array_values(array_filter($L, fn($c) => bil_coul($c) !== $A)); return $faible($non ?: $L);
    }
    $mi = bil_maitre($s['pli'], $A); $gagnant = $s['pli'][$mi]; $dernier = count($s['pli']) === 3;
    $gagne = function (string $c) use ($s, $j, $A) { $t = $s['pli']; $t[] = ['j' => $j, 'c' => $c]; return bil_maitre($t, $A) === count($t) - 1; };
    if (bil_equipe($gagnant['j']) === bil_equipe($j) && ($dernier || $estMaitre($gagnant['c']))) {
        $non = array_values(array_filter($L, fn($c) => bil_coul($c) !== $A)); return $parPoints($non ?: $L); }
    $gagnantes = array_values(array_filter($L, $gagne));
    if ($gagnantes) {
        $sur = array_values(array_filter($gagnantes, fn($c) => $dernier || $estMaitre($c)));
        if ($sur) return $parForce($sur);
        $valeur = 0; foreach ($s['pli'] as $x) $valeur += $pts($x['c']); if ($valeur >= 10) return $parForce($gagnantes);
    }
    return $faible($L);
}
