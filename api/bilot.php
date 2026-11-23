<?php
/*
 * Bilot (belote coinchée) en ligne (23/11), sur le modèle de la Bilot : le serveur est l'ARBITRE : il mélange, distribue,
 * reçoit les enchères, vérifie chaque carte et n'envoie à chaque joueur que SA main. Toujours 4 places, en 2 équipes
 * (places 0 et 2 contre 1 et 3) ; les places vides sont jouées par l'ordinateur sur le serveur (une action toutes les 1,2 s).
 * Moteur : bilot_regles.php (copie fidèle de jeux/bilot/regles.js, vérifiée par docs/bilot/croise.mjs).
 *
 * Salon : POST action=hello client name tete status code -> {online, invites} ; action=invite client name tete to code
 * Partie (code de 4 caractères) :
 *   create  client name tete ensemble(1|0) cible(500|1000|1500) niveau(facile|moyen|malin) monde  -> {code}
 *   join    code client name tete         -> {ok}            (avant le début ; une place libre)
 *   config  code client ensemble cible niveau monde        (le créateur, avant le début)
 *   start   code client                   (le créateur : les vrais joueurs s'assoient, ensemble = équipiers d'abord ; l'ordinateur prend le reste)
 *   etat    code client                   -> {salle, jeu:vue de MA place, log}   (fait aussi jouer l'ordinateur)
 *   annonce code client k(passe|annonce|coinche|surcoinche) v c -> {ok} ou erreur
 *   jouer   code client carte             -> {ok} ou erreur
 *   quitter code client                   (sa place passe à l'ordinateur)
 *   rejouer code client                   (le créateur, après la fin : une nouvelle partie, mêmes places)
 * Base : famille-data/bilot.sqlite.
 * Chaque événement du journal reçoit un numéro « v » croissant : le client rejoue ceux qu'il n'a pas encore vus.
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();
require __DIR__ . '/bilot_regles.php';

const ONLINE_FOR = 15; const INVITE_FOR = 40; const ROOM_TTL = 10800; const BOT_MS = 1200; const PAUSE_MANCHE_MS = 7000; const ABSENT_S = 40;
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
// les adversaires de l'ordinateur : les personnages du Jasmin Stage 2, attablés au café
const PERSOS = [['garde', 'Si Hamadi'], ['marchand', 'Am Lamine'], ['voleur', 'Fethi'], ['controleur', 'Si Mokhtar']];

header('X-Content-Type-Options: nosniff'); header('Cache-Control: no-store');
function out(int $c, array $d): void { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function fail(int $c, string $m): void { out($c, ['error' => $m]); }
function db(): PDO {
    static $pdo = null; if ($pdo) return $pdo;
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__);
    $d = dirname($root) . '/famille-data'; if (!(is_dir($d) || @mkdir($d, 0750, true))) fail(500, 'Base indisponible.');
    $pdo = new PDO('sqlite:' . $d . '/bilot.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, host TEXT NOT NULL, state TEXT NOT NULL, updated INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS presence (client TEXT PRIMARY KEY, name TEXT NOT NULL, tete TEXT NOT NULL, status TEXT NOT NULL, code TEXT NOT NULL, ts INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS invites (id INTEGER PRIMARY KEY AUTOINCREMENT, dest TEXT NOT NULL, name TEXT NOT NULL, tete TEXT NOT NULL, code TEXT NOT NULL, ts INTEGER NOT NULL)');
    return $pdo;
}
function c_code($c): string { $c = strtoupper(trim((string)$c)); if (!preg_match('/^[' . CODE_CHARS . ']{4}$/', $c)) fail(400, 'Code de partie invalide.'); return $c; }
function c_client($c): string { $c = (string)$c; if (!preg_match('/^[a-z0-9]{8,20}$/', $c)) fail(400, 'Joueur invalide.'); return $c; }
function c_texte($t, int $max): string { $t = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$t) ?? ''); if ($t === '' || mb_strlen($t) > $max) fail(400, 'Texte invalide.'); return $t; }
function c_img($t): string { $t = (string)$t; return preg_match('#^[a-zA-Z0-9_./:-]{0,200}$#', $t) ? $t : ''; }
function ms(): int { return (int)floor(microtime(true) * 1000); }
function charge(string $code): array {
    $st = db()->prepare('SELECT host, state, updated FROM rooms WHERE code = ?'); $st->execute([$code]); $r = $st->fetch(PDO::FETCH_ASSOC);
    if (!$r || (int)$r['updated'] < time() - ROOM_TTL) fail(404, "Cette partie n'existe pas ou est terminée.");
    $s = json_decode($r['state'], true); $s['_host'] = $r['host']; return $s;
}
function sauve(string $code, array $s): void { $h = $s['_host']; unset($s['_host']); db()->prepare('UPDATE rooms SET state = ?, host = ?, updated = ? WHERE code = ?')->execute([json_encode($s, JSON_UNESCAPED_UNICODE), $h, time(), $code]); }
function siege(array $s, string $client): int { foreach ($s['sieges'] as $i => $p) if (($p['client'] ?? '') === $client && empty($p['bot'])) return $i; return -1; }
function regles(array &$s): void {
    $s['n'] = 4; $s['ensemble'] = (string)($_POST['ensemble'] ?? (($s['ensemble'] ?? true) ? '1' : '0')) !== '0';
    $c = (int)($_POST['cible'] ?? $s['cible'] ?? 1000); $s['cible'] = in_array($c, [500, 1000, 1500], true) ? $c : 1000;
    $nv = (string)($_POST['niveau'] ?? $s['niveau'] ?? 'moyen'); $s['niveau'] = in_array($nv, ['facile', 'moyen', 'malin'], true) ? $nv : 'moyen';
    $m = (string)($_POST['monde'] ?? $s['monde'] ?? 'sidibou'); $s['monde'] = in_array($m, ['sidibou', 'kairouan', 'tunis', 'djerba'], true) ? $m : 'sidibou';
    $hum = array_values(array_filter($s['sieges'] ?? [], fn($p) => empty($p['bot']))); $s['sieges'] = array_slice($hum, 0, 4);
}
/* numéroter les nouveaux événements du journal (ceux qui n'ont pas encore de « v ») */
function numerote(array &$s): void { $l = &$s['jeu']['log']; for ($i = count($l) - 1; $i >= 0 && !isset($l[$i]['v']); $i--) ; for ($k = $i + 1; $k < count($l); $k++) $l[$k]['v'] = ++$s['logN']; }
/* faire avancer la partie : l'ordinateur joue (une carte à la fois, avec un peu d'attente), la manche suivante démarre seule */
function avance(array &$s): bool {
    if (($s['etat'] ?? '') !== 'jeu') return false; $j = &$s['jeu']; $now = ms();
    if ($j['phase'] === 'manche' && $now - ($s['majT'] ?? 0) >= PAUSE_MANCHE_MS) { bil_nouvelle_manche($j); $s['majT'] = $now; return true; }
    if ($j['phase'] !== 'jeu' && $j['phase'] !== 'enchere') return false;
    $t = $j['tour']; $p = $s['sieges'][$t];
    $absent = empty($p['bot']) && $now / 1000 - ($s['vu'][$p['client']] ?? time()) > ABSENT_S;
    if ((empty($p['bot']) && !$absent) || $now - ($s['majT'] ?? 0) < BOT_MS) return false;
    $nv = !empty($p['bot']) ? $s['niveau'] : 'moyen'; $rnd = fn() => mt_rand() / (mt_getrandmax() + 1);
    $r = $j['phase'] === 'enchere' ? bil_encherir($j, $t, bil_choisir_enchere($j, $t, $nv, $rnd)) : bil_jouer($j, $t, bil_choisir_carte($j, $t, $nv, $rnd));
    if ($r['ok']) { $s['majT'] = $now; return true; }
    return false;
}
function vue_salle(array $s, string $client): array {
    $moi = siege($s, $client);
    $r = ['etat' => $s['etat'], 'n' => 4, 'ensemble' => $s['ensemble'], 'cible' => $s['cible'], 'niveau' => $s['niveau'], 'monde' => $s['monde'], 'hote' => $s['_host'] === $client, 'moi' => $moi,
          'sieges' => array_map(fn($p) => ['nom' => $p['nom'], 'tete' => $p['tete'] ?? '', 'bot' => !empty($p['bot']), 'perso' => $p['perso'] ?? null, 'remplace' => !empty($p['remplace'])], $s['sieges'])];
    if ($s['etat'] === 'jeu') { $r['jeu'] = bil_vue($s['jeu'], $moi); $r['log'] = array_values(array_filter(array_slice($s['jeu']['log'], -30), fn($e) => isset($e['v']))); }
    return $r;
}

$a = (string)($_REQUEST['action'] ?? '');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') fail(405, 'Action inconnue.');
try {
    if ($a === 'hello' || $a === 'invite') {
        $client = c_client($_POST['client'] ?? ''); $name = c_texte($_POST['name'] ?? '', 24); $tete = c_img($_POST['tete'] ?? ''); $pdo = db(); $t = time();
        if ($a === 'invite') { $to = c_client($_POST['to'] ?? ''); $code = c_code($_POST['code'] ?? '');
            $pdo->prepare('DELETE FROM invites WHERE ts < ? OR (dest = ? AND code = ?)')->execute([$t - INVITE_FOR, $to, $code]);
            $pdo->prepare('INSERT INTO invites (dest, name, tete, code, ts) VALUES (?, ?, ?, ?, ?)')->execute([$to, $name, $tete, $code, $t]); out(200, ['ok' => true]); }
        $status = (string)($_POST['status'] ?? 'menu'); if (!in_array($status, ['menu', 'salon', 'joue'], true)) $status = 'menu';
        $code = ($status === 'menu' || ($_POST['code'] ?? '') === '') ? '' : c_code($_POST['code']);
        $pdo->prepare('INSERT OR REPLACE INTO presence (client, name, tete, status, code, ts) VALUES (?, ?, ?, ?, ?, ?)')->execute([$client, $name, $tete, $status, $code, $t]);
        $st = $pdo->prepare('SELECT client, name, tete, status, code FROM presence WHERE ts >= ? AND client <> ? ORDER BY name COLLATE NOCASE LIMIT 40'); $st->execute([$t - ONLINE_FOR, $client]); $online = $st->fetchAll(PDO::FETCH_ASSOC);
        $st = $pdo->prepare('SELECT name, tete, code FROM invites WHERE dest = ? AND ts >= ?'); $st->execute([$client, $t - INVITE_FOR]); $inv = $st->fetchAll(PDO::FETCH_ASSOC);
        if ($inv) $pdo->prepare('DELETE FROM invites WHERE dest = ?')->execute([$client]);
        out(200, ['online' => $online, 'invites' => $inv]);
    }
    if ($a === 'create') {
        $client = c_client($_POST['client'] ?? ''); $s = ['etat' => 'attente', 'sieges' => [['client' => $client, 'nom' => c_texte($_POST['name'] ?? '', 24), 'tete' => c_img($_POST['tete'] ?? '')]], 'vu' => [$client => time()]];
        $s['_host'] = $client; regles($s); unset($s['_host']);
        $pdo = db(); $pdo->prepare('DELETE FROM rooms WHERE updated < ?')->execute([time() - ROOM_TTL]);
        for ($k = 0; $k < 20; $k++) { $code = ''; for ($i = 0; $i < 4; $i++) $code .= CODE_CHARS[random_int(0, strlen(CODE_CHARS) - 1)];
            $st = $pdo->prepare('INSERT OR IGNORE INTO rooms (code, host, state, updated) VALUES (?, ?, ?, ?)'); $st->execute([$code, $client, json_encode($s, JSON_UNESCAPED_UNICODE), time()]);
            if ($st->rowCount() === 1) out(200, ['code' => $code]); }
        fail(500, 'Impossible de créer la partie.');
    }
    // toutes les autres actions touchent une partie : sous verrou (une seule écriture à la fois)
    $code = c_code($_POST['code'] ?? ''); $client = c_client($_POST['client'] ?? ''); $pdo = db(); $pdo->exec('BEGIN IMMEDIATE');
    $s = charge($code); $s['vu'][$client] = time(); $moi = siege($s, $client); $hote = $s['_host'] === $client; $change = false;
    if ($a === 'join') {
        if ($moi < 0) { if ($s['etat'] !== 'attente') { $pdo->exec('ROLLBACK'); fail(409, 'La partie a déjà commencé.'); }
            if (count($s['sieges']) >= $s['n']) { $pdo->exec('ROLLBACK'); fail(409, 'La partie est pleine.'); }
            $s['sieges'][] = ['client' => $client, 'nom' => c_texte($_POST['name'] ?? '', 24), 'tete' => c_img($_POST['tete'] ?? '')]; }
        $change = true;
    } elseif ($a === 'config') {
        if (!$hote || $s['etat'] !== 'attente') { $pdo->exec('ROLLBACK'); fail(403, 'Seul le créateur règle la partie.'); } regles($s); $change = true;
    } elseif ($a === 'start' || $a === 'rejouer') {
        if (!$hote) { $pdo->exec('ROLLBACK'); fail(403, 'Seul le créateur lance la partie.'); }
        if ($a === 'start' && $s['etat'] !== 'attente') { $pdo->exec('ROLLBACK'); out(200, vue_salle($s, $client)); }
        if ($a === 'start') {   // les vrais joueurs s'assoient : « ensemble » = le 2e est l'équipier du créateur (places 0 et 2)
            $hum = array_values(array_filter($s['sieges'], fn($p) => empty($p['bot']))); $ordre = $s['ensemble'] ? [0, 2, 1, 3] : [0, 1, 2, 3];
            $libres = array_values(array_filter(PERSOS, fn($p) => !in_array($p[0], array_column($s['sieges'], 'perso'), true)));
            $pl = array_fill(0, 4, null); foreach ($hum as $k => $p) $pl[$ordre[$k]] = $p;
            foreach ($pl as $i => $p) if (!$p) { $q = array_shift($libres); $pl[$i] = ['client' => '', 'nom' => $q[1], 'perso' => $q[0], 'bot' => true]; }
            $s['sieges'] = $pl;
        }
        $s['jeu'] = bil_nouvelle_partie($s['cible'], random_int(1, 0x7FFFFFFF), random_int(0, 3)); $s['logN'] = 0; $s['etat'] = 'jeu'; $s['majT'] = ms(); $change = true;
    } elseif ($a === 'jouer' || $a === 'annonce') {
        if ($s['etat'] !== 'jeu' || $moi < 0) { $pdo->exec('ROLLBACK'); fail(409, "Tu n'es pas à cette table."); }
        if ($a === 'jouer') $r = bil_jouer($s['jeu'], $moi, (string)($_POST['carte'] ?? ''));
        else { $e = ['k' => (string)($_POST['k'] ?? '')]; if ($e['k'] === 'annonce') { $e['v'] = (int)($_POST['v'] ?? 0); $e['c'] = (string)($_POST['c'] ?? ''); }
            $r = bil_encherir($s['jeu'], $moi, $e); }
        if (!$r['ok']) { $pdo->exec('ROLLBACK'); fail(409, 'Refusé : ' . $r['err']); }
        $s['majT'] = ms(); $change = true;
    } elseif ($a === 'quitter') {
        if ($moi >= 0) { $s['sieges'][$moi]['bot'] = true; $s['sieges'][$moi]['remplace'] = true; $s['sieges'][$moi]['nom'] .= ' 🤖';
            if ($hote) { foreach ($s['sieges'] as $p) if (empty($p['bot'])) { $s['_host'] = $p['client']; break; } } $change = true; }
    } elseif ($a !== 'etat') { $pdo->exec('ROLLBACK'); fail(400, 'Action inconnue.'); }
    if (avance($s)) $change = true;
    if ($s['etat'] === 'jeu') numerote($s);
    sauve($code, $s); $pdo->exec('COMMIT');
    out(200, vue_salle($s, $client));
} catch (Throwable $e) { try { db()->exec('ROLLBACK'); } catch (Throwable $e2) {} fail(500, 'Erreur du serveur.'); }
