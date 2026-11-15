<?php
/* Chkobba : le moteur de règles en PHP, copie fidèle de jeux/chkobba/regles.js (même hasard à graine, mêmes prises, mêmes points).
   Utilisé par api/chkobba.php (l'arbitre des parties en ligne). docs/chkobba/croise.mjs joue les mêmes parties dans les deux moteurs. */
declare(strict_types=1);

const CHK_COULEURS = ['d', 'c', 'p', 't'];
function chk_val(string $c): int { return (int)substr($c, 1); }
function chk_coul(string $c): string { return $c[0]; }
function chk_suivant(int $s): int { $s ^= ($s << 13) & 0xFFFFFFFF; $s ^= ($s >> 17); $s ^= ($s << 5) & 0xFFFFFFFF; $s &= 0xFFFFFFFF; return $s ?: 1; }
function chk_melange(int $seed): array {
    $p = []; foreach (CHK_COULEURS as $c) for ($v = 1; $v <= 10; $v++) $p[] = $c . $v;
    $s = ($seed & 0xFFFFFFFF) ?: 1;
    for ($i = count($p) - 1; $i > 0; $i--) { $s = chk_suivant($s); $j = $s % ($i + 1); [$p[$i], $p[$j]] = [$p[$j], $p[$i]]; }
    return ['paquet' => $p, 'seed' => $s];
}
function chk_entite(array $s, int $j): int { return $s['equipes'] ? $j % 2 : $j; }
function chk_nb_entites(array $s): int { return $s['equipes'] ? 2 : $s['n']; }

function chk_nouvelle_partie(int $n, bool $equipes, int $cible, int $seed, int $donneur = 0): array {
    $s = ['n' => $n, 'equipes' => $n === 4 && $equipes, 'cible' => $cible, 'seed' => ($seed & 0xFFFFFFFF) ?: 1, 'donneur' => ($donneur + $n - 1) % $n, 'manche' => 0,
          'total' => [], 'phase' => 'jeu', 'gagnant' => -1, 'version' => 0, 'log' => []];
    $s['total'] = array_fill(0, chk_nb_entites($s), 0);
    chk_nouvelle_manche($s); return $s;
}
function chk_nouvelle_manche(array &$s): void {
    $m = null;
    for ($k = 0; $k < 20; $k++) {
        $m = chk_melange($s['seed']); $s['seed'] = $m['seed'];
        $cpt = []; foreach (array_slice($m['paquet'], 0, 4) as $c) { $v = chk_val($c); $cpt[$v] = ($cpt[$v] ?? 0) + 1; }
        if (max($cpt) < 3) break;
    }
    $s['paquet'] = $m['paquet']; $s['tapis'] = array_splice($s['paquet'], 0, 4);
    $s['mains'] = []; $s['pris'] = []; $s['chk'] = [];
    for ($j = 0; $j < $s['n']; $j++) { $s['mains'][] = array_splice($s['paquet'], 0, 3); $s['pris'][] = []; $s['chk'][] = 0; }
    $s['donneur'] = ($s['donneur'] + 1) % $s['n']; $s['tour'] = ($s['donneur'] + 1) % $s['n']; $s['dernier'] = -1; $s['manche']++; $s['phase'] = 'jeu'; $s['points'] = null; $s['version']++;
    $s['log'][] = ['k' => 'donne', 'manche' => $s['manche'], 'donneur' => $s['donneur'], 'tapis' => $s['tapis'], 'v' => $s['version']];
}
function chk_options(string $carte, array $tapis): array {
    $v = chk_val($carte); $eg = array_values(array_filter($tapis, fn($c) => chk_val($c) === $v));
    if ($eg) return array_map(fn($c) => [$c], $eg);
    $res = []; $pris = [];
    $visite = function (int $i, int $somme) use (&$visite, &$res, &$pris, $tapis, $v) {
        if ($somme === $v) { if (count($pris) >= 2) $res[] = $pris; return; }
        if ($somme > $v) return;
        for ($k = $i; $k < count($tapis); $k++) { $pris[] = $tapis[$k]; $visite($k + 1, $somme + chk_val($tapis[$k])); array_pop($pris); }
    };
    $visite(0, 0);
    return $res;
}
function chk_meme(array $a, array $b): bool { if (count($a) !== count($b)) return false; foreach ($a as $x) if (!in_array($x, $b, true)) return false; return true; }

function chk_jouer(array &$s, int $j, string $carte, array $prise): array {
    if ($s['phase'] !== 'jeu') return ['ok' => false, 'err' => 'pas en jeu'];
    if ($s['tour'] !== $j) return ['ok' => false, 'err' => 'pas ton tour'];
    if (!in_array($carte, $s['mains'][$j], true)) return ['ok' => false, 'err' => 'carte absente'];
    $opts = chk_options($carte, $s['tapis']); $bon = false;
    if ($opts) { foreach ($opts as $o) if (chk_meme($o, $prise)) $bon = true; } else $bon = count($prise) === 0;
    if (!$bon) return ['ok' => false, 'err' => 'prise impossible'];
    $ev = [];
    $s['mains'][$j] = array_values(array_filter($s['mains'][$j], fn($c) => $c !== $carte));
    $restant = 0; foreach ($s['mains'] as $m) $restant += count($m);
    $dernierCoup = count($s['paquet']) === 0 && $restant === 0;
    if ($prise) {
        $s['tapis'] = array_values(array_filter($s['tapis'], fn($c) => !in_array($c, $prise, true)));
        array_push($s['pris'][$j], $carte, ...$prise); $s['dernier'] = $j;
        $chk = count($s['tapis']) === 0 && !$dernierCoup; if ($chk) $s['chk'][$j]++;
        $ev[] = ['k' => 'prise', 'j' => $j, 'carte' => $carte, 'prise' => array_values($prise), 'chk' => $chk];
    } else { $s['tapis'][] = $carte; $ev[] = ['k' => 'pose', 'j' => $j, 'carte' => $carte]; }
    $s['version']++;
    if ($restant === 0) {
        if (count($s['paquet']) >= 3 * $s['n']) { for ($k = 0; $k < $s['n']; $k++) $s['mains'][($s['donneur'] + 1 + $k) % $s['n']] = array_splice($s['paquet'], 0, 3); $ev[] = ['k' => 'redonne']; }
        else { chk_fin_manche($s, $ev); chk_log($s, $ev); return ['ok' => true, 'ev' => $ev]; }
    }
    $s['tour'] = ($j + 1) % $s['n'];
    chk_log($s, $ev);
    return ['ok' => true, 'ev' => $ev];
}
function chk_log(array &$s, array $ev): void { foreach ($ev as $e) { $e['v'] = $s['version']; $s['log'][] = $e; } if (count($s['log']) > 60) $s['log'] = array_slice($s['log'], -60); }
function chk_majorite(array $t): array { $m = max($t); $nb = count(array_filter($t, fn($x) => $x === $m)); return array_map(fn($x) => $x === $m && $nb === 1 ? 1 : 0, $t); }

function chk_fin_manche(array &$s, array &$ev): array {
    if ($s['tapis']) { $q = $s['dernier'] >= 0 ? $s['dernier'] : $s['donneur']; array_push($s['pris'][$q], ...$s['tapis']); $ev[] = ['k' => 'ramasse', 'j' => $q, 'cartes' => $s['tapis']]; $s['tapis'] = []; }
    $E = chk_nb_entites($s); $z = array_fill(0, $E, 0);
    $cartes = $z; $dinari = $z; $sept = $z; $six = $z; $haya = $z; $chk = $z;
    for ($j = 0; $j < $s['n']; $j++) { $e = chk_entite($s, $j); $chk[$e] += $s['chk'][$j];
        foreach ($s['pris'][$j] as $c) { $cartes[$e]++; if (chk_coul($c) === 'd') $dinari[$e]++; if (chk_val($c) === 7) $sept[$e]++; if (chk_val($c) === 6) $six[$e]++; if ($c === 'd7') $haya[$e] = 1; } }
    $m7 = max($sept); $ex = array_map(fn($x) => $x === $m7, $sept); $bermila = $z;
    if (count(array_filter($ex)) === 1) $bermila = array_map(fn($x) => $x ? 1 : 0, $ex);
    else { $m6 = max(array_values(array_filter($six, fn($x, $i) => $ex[$i], ARRAY_FILTER_USE_BOTH)));
        $g = []; foreach ($six as $i => $x) $g[] = $ex[$i] && $x === $m6;
        if (count(array_filter($g)) === 1) $bermila = array_map(fn($x) => $x ? 1 : 0, $g); }
    $karta = chk_majorite($cartes); $din = chk_majorite($dinari);
    $pts = [];
    for ($e = 0; $e < $E; $e++) { $t = $karta[$e] + $din[$e] + $haya[$e] + $bermila[$e] + $chk[$e];
        $pts[] = ['cartes' => $cartes[$e], 'dinari' => $dinari[$e], 'sept' => $sept[$e], 'six' => $six[$e], 'karta' => $karta[$e], 'din' => $din[$e], 'haya' => $haya[$e], 'bermila' => $bermila[$e], 'chk' => $chk[$e], 'total' => $t];
        $s['total'][$e] += $t; }
    $s['points'] = $pts;
    $m = max($s['total']);
    if ($m >= $s['cible'] && count(array_filter($s['total'], fn($x) => $x === $m)) === 1) { $s['phase'] = 'fini'; $s['gagnant'] = array_search($m, $s['total'], true); }
    else $s['phase'] = 'manche';
    $s['version']++; $ev[] = ['k' => 'fin', 'points' => $pts, 'total' => $s['total'], 'phase' => $s['phase'], 'gagnant' => $s['gagnant']];
    return $pts;
}
function chk_vue(array $s, int $j): array {
    return ['n' => $s['n'], 'equipes' => $s['equipes'], 'cible' => $s['cible'], 'moi' => $j, 'main' => $j >= 0 ? $s['mains'][$j] : [], 'nMains' => array_map('count', $s['mains']), 'tapis' => $s['tapis'], 'nPaquet' => count($s['paquet']),
            'nPris' => array_map('count', $s['pris']), 'chk' => $s['chk'], 'tour' => $s['tour'], 'donneur' => $s['donneur'], 'dernier' => $s['dernier'], 'manche' => $s['manche'], 'total' => $s['total'], 'phase' => $s['phase'], 'gagnant' => $s['gagnant'], 'points' => $s['points'], 'version' => $s['version']];
}
function chk_coups(array $main, array $tapis): array { $r = []; foreach ($main as $c) { $o = chk_options($c, $tapis); if ($o) foreach ($o as $p) $r[] = ['carte' => $c, 'prise' => $p]; else $r[] = ['carte' => $c, 'prise' => []]; } return $r; }
/* l'ordinateur (mêmes notes que choisir() en JS) */
function chk_choisir(array $s, int $j, string $niveau): array {
    $coups = chk_coups($s['mains'][$j], $s['tapis']);
    if ($niveau === 'facile') return $coups[random_int(0, count($coups) - 1)];
    $vues = array_merge($s['mains'][$j], $s['tapis']); foreach ($s['pris'] as $p) $vues = array_merge($vues, $p); $vues = array_flip($vues);
    $inv = []; foreach (CHK_COULEURS as $c) for ($v = 1; $v <= 10; $v++) if (!isset($vues[$c . $v])) $inv[] = $c . $v;
    $mainsAdv = -1; for ($k = 0; $k < $s['n']; $k++) if ($k !== $j && (!$s['equipes'] || $k % 2 !== $j % 2)) $mainsAdv += count($s['mains'][$k]);
    $reste = 0; foreach ($s['mains'] as $m) $reste += count($m); $dernierCoup = count($s['paquet']) === 0 && $reste === 1;
    $best = null; $bn = -INF;
    foreach ($coups as $m) {
        $note = 0.0; $pris = $m['prise'] ? array_merge([$m['carte']], $m['prise']) : [];
        if ($pris) { $note += 5 * count($pris); foreach ($pris as $c) { if (chk_coul($c) === 'd') $note += 8; if (chk_val($c) === 7) $note += 12; if ($c === 'd7') $note += 40; } if (count($m['prise']) === count($s['tapis']) && !$dernierCoup) $note += 100; }
        else { $c = $m['carte']; if (chk_coul($c) === 'd') $note -= 8; if (chk_val($c) === 7) $note -= 12; if ($c === 'd7') $note -= 40; $note -= chk_val($c) * .3; }
        $rt = $pris ? array_values(array_filter($s['tapis'], fn($c) => !in_array($c, $m['prise'], true))) : array_merge($s['tapis'], [$m['carte']]);
        if ($rt && !$dernierCoup) { $somme = array_sum(array_map('chk_val', $rt)); $aEg = false; foreach ($rt as $c) if (chk_val($c) === $somme) $aEg = true;
            $v = count($rt) === 1 ? chk_val($rt[0]) : ($somme <= 10 && !$aEg ? $somme : 0);
            if ($v) { $p = .5; if ($niveau === 'malin') { $k = count(array_filter($inv, fn($c) => chk_val($c) === $v)); $p = $inv ? min(1, $k * max(1, $mainsAdv) / count($inv)) : 0; } $note -= 70 * $p; } }
        $note += mt_rand() / mt_getrandmax() * 2;
        if ($note > $bn) { $bn = $note; $best = $m; }
    }
    return $best;
}
