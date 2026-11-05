<?php
/*
 * Famille Missaoui — base de données des joueurs, records et progrès.
 *
 * La base (SQLite, un seul fichier) est rangée HORS du site public, dans le dossier
 * "famille-data" à côté de public_html : un redéploiement GitHub ne la touche pas.
 *
 * Public (les jeux) :
 *   GET  ?action=ping                                   -> état du serveur
 *   GET  ?action=highscores&game=serpentin&variant=V    -> meilleurs scores (un par joueur)
 *   GET  ?action=load&player=P&course=serpent3d         -> relit la collection d'un joueur
 *   GET  ?action=rewards&player=P                       -> cartes rares : jours d'apprentissage d'affilée, exploits mythiques
 *   POST action=visit    page player app screen ref     -> journal des visites (site.js, toutes les pages)
 *   POST action=score    player game variant score      -> enregistre une partie
 *   POST action=progress player course data(JSON)       -> enregistre les progrès d'un cours
 * Parents (mot de passe parent, le même que pour les voix de Nahki Tounsi) :
 *   GET  ?action=auth                                   -> le mot de passe existe-t-il ?
 *   POST action=setup  newpass                          -> crée le mot de passe (une seule fois)
 *   POST action=summary pass                            -> tout pour la page Progression
 *   POST action=visits  pass days                       -> journal des visites (IP, pays, ville, page, appareil), 60 jours au plus
 */
declare(strict_types=1);

const GAMES   = ['serpentin', 'serpent3d', 'ludo3d', 'grimpeglace', 'jasmin'];
// Cours dont les progrès peuvent être relus par le jeu lui-même (collection de skins sur plusieurs appareils).
const READABLE = ['profil', 'serpent3d', 'salma-verbes', 'salma-geometrie', 'salma-monnaie', 'ludo3d', 'grimpeglace', 'jasmin', 'amine-ecriture'];
const COURSES = ['profil', 'essil-deutsch', 'essil-latin', 'salma-english', 'salma-maths', 'salma-cheval', 'salma-verbes', 'salma-geometrie', 'salma-monnaie', 'amine-halloween', 'amine-tounsi', 'amine-serpentin', 'amine-ecriture', 'serpent3d', 'ludo3d', 'grimpeglace', 'jasmin'];
// Cours qui comptent comme « apprendre » (les jeux n'en font pas partie) : séries de jours et cartes secrètes.
const LEARNING = ['essil-deutsch', 'essil-latin', 'salma-english', 'salma-maths', 'salma-cheval', 'salma-verbes', 'salma-geometrie', 'salma-monnaie', 'amine-halloween', 'amine-tounsi', 'amine-ecriture'];
const MAX_DATA = 30000;
const MAX_WRITES = 240;        // écritures par adresse…
const WRITE_WINDOW = 600;      // …toutes les 10 minutes
const MAX_FAILS = 8;
const FAIL_WINDOW = 900;

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out(int $code, array $data): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(int $code, string $msg): void { out($code, ['error' => $msg]); }

function base_dir(): string {
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__);
    return dirname($root);
}
function data_dir(): string {
    $d = base_dir() . '/famille-data';
    if (!(is_dir($d) || @mkdir($d, 0750, true)) || !is_writable($d)) fail(500, "Le serveur ne peut pas créer le dossier de la base.");
    return $d;
}
function auth_dir(): string { // partagé avec les voix de Nahki Tounsi
    $d = base_dir() . '/nahki-voix';
    if (!is_dir($d)) @mkdir($d, 0750, true);
    return $d;
}
function read_json(string $file): array {
    if (!is_file($file)) return [];
    $j = json_decode((string)file_get_contents($file), true);
    return is_array($j) ? $j : [];
}
function write_json(string $file, array $data): void {
    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    rename($tmp, $file);
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) fail(500, "SQLite n'est pas disponible sur ce serveur.");
    $pdo = new PDO('sqlite:' . data_dir() . '/famille.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS players (name TEXT PRIMARY KEY COLLATE NOCASE, created TEXT NOT NULL, last_seen TEXT NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, player TEXT NOT NULL COLLATE NOCASE, game TEXT NOT NULL, variant TEXT NOT NULL, score INTEGER NOT NULL, created TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS scores_board ON scores (game, variant, score DESC)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS progress (player TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL, data TEXT NOT NULL, updated TEXT NOT NULL, PRIMARY KEY (player, course))');
    $pdo->exec('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, player TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL, data TEXT NOT NULL, created TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS history_pc ON history (player, course, created)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS writes (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, ip TEXT NOT NULL, cc TEXT, page TEXT NOT NULL, player TEXT, ua TEXT, app INTEGER, screen TEXT, ref TEXT)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS visits_ts ON visits (ts)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS geo (ip TEXT PRIMARY KEY, cc TEXT, country TEXT, region TEXT, city TEXT, isp TEXT, ts INTEGER)');
    return $pdo;
}
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }

function clean_player($p): string {
    $p = trim(preg_replace('/\s+/u', ' ', (string)$p));
    if ($p === '' || mb_strlen($p) > 20 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $p)) fail(400, 'Prénom invalide.');
    return mb_strtoupper(mb_substr($p, 0, 1)) . mb_substr($p, 1);
}
// Adresse du visiteur : derrière un proxy (CDN), la première adresse publique de X-Forwarded-For.
function client_ip(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
        foreach (explode(',', (string)($_SERVER[$h] ?? '')) as $ip) {
            $ip = trim($ip);
            if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return $ip;
        }
    }
    return (string)($_SERVER['REMOTE_ADDR'] ?? '?');
}
const VISIT_DAYS = 60;   // le journal des visites est effacé au-delà
// Pays et ville des adresses IP, demandés à ip-api.com (100 adresses par appel) et gardés dans la table geo.
function resolve_geo(PDO $pdo, array $ips): void {
    $todo = [];
    foreach (array_unique($ips) as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            $pdo->prepare('INSERT OR REPLACE INTO geo (ip, cc, country, region, city, isp, ts) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$ip, '', 'Réseau local', '', '', '', time()]);
            continue;
        }
        $todo[] = $ip;
    }
    foreach (array_chunk(array_slice($todo, 0, 300), 100) as $chunk) {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => json_encode($chunk), 'timeout' => 5, 'ignore_errors' => true]]);
        $raw = @file_get_contents('http://ip-api.com/batch?fields=status,countryCode,country,regionName,city,isp,query&lang=fr', false, $ctx);
        $res = json_decode((string)$raw, true);
        if (!is_array($res)) break;
        foreach ($res as $g) {
            if (!is_array($g) || empty($g['query'])) continue;
            $ok = ($g['status'] ?? '') === 'success';
            $pdo->prepare('INSERT OR REPLACE INTO geo (ip, cc, country, region, city, isp, ts) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$g['query'], $ok ? ($g['countryCode'] ?? '') : '', $ok ? ($g['country'] ?? '') : 'Inconnu', $ok ? ($g['regionName'] ?? '') : '', $ok ? ($g['city'] ?? '') : '', $ok ? ($g['isp'] ?? '') : '', time()]);
        }
    }
}
function limit_writes(): void {
    $ip = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '?'));
    $t = time();
    $pdo = db();
    $pdo->prepare('DELETE FROM writes WHERE ts < ?')->execute([$t - WRITE_WINDOW]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM writes WHERE ip = ?'); $st->execute([$ip]);
    if ((int)$st->fetchColumn() >= MAX_WRITES) fail(429, 'Trop de messages, réessaie dans quelques minutes.');
    $pdo->prepare('INSERT INTO writes (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
}
function touch_player(string $p): void {
    $n = now();
    db()->prepare('INSERT INTO players (name, created, last_seen) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET last_seen = excluded.last_seen')->execute([$p, $n, $n]);
}
function check_pass(): void {
    $dir = auth_dir();
    $auth = read_json($dir . '/auth.json');
    if (empty($auth['hash'])) fail(409, 'setup');
    $failsFile = $dir . '/essais.json';
    $t = time();
    $fails = array_values(array_filter(read_json($failsFile), fn($x) => is_int($x) && $x > $t - FAIL_WINDOW));
    if (count($fails) >= MAX_FAILS) fail(429, "Trop d'essais. Réessaie dans 15 minutes.");
    if (!password_verify((string)($_POST['pass'] ?? ''), (string)$auth['hash'])) {
        $fails[] = $t; write_json($failsFile, $fails); usleep(500000);
        fail(403, 'Mot de passe incorrect.');
    }
}

$action = (string)($_REQUEST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET' && $action === 'ping') {
        db();
        out(200, ['ok' => true, 'sqlite' => true]);
    }

    if ($method === 'GET' && $action === 'auth') {
        $auth = read_json(auth_dir() . '/auth.json');
        out(200, ['setup' => empty($auth['hash'])]);
    }

    // La tête choisie par chaque invité (mascotte Nour, Yasmine ou Farès), pour l'afficher dans les classements
    if ($method === 'GET' && $action === 'heads') {
        $heads = [];
        foreach (db()->query("SELECT player, data FROM progress WHERE course = 'profil'") as $r) {
            $d = json_decode((string)$r['data'], true);
            if (is_array($d) && in_array($d['tete'] ?? '', ['nour', 'yasmine', 'fares'], true)) $heads[$r['player']] = $d['tete'];
        }
        out(200, ['heads' => $heads]);
    }

    if ($method === 'GET' && $action === 'highscores') {
        $game = (string)($_GET['game'] ?? '');
        $variant = (string)($_GET['variant'] ?? '');
        if (!in_array($game, GAMES, true) || !preg_match('/^[a-z0-9\-]{1,40}$/', $variant)) fail(400, 'Jeu inconnu.');
        $lim = max(1, min(20, (int)($_GET['limit'] ?? 10)));
        $st = db()->prepare('SELECT player, MAX(score) AS score, COUNT(*) AS games FROM scores WHERE game = ? AND variant = ? GROUP BY player ORDER BY score DESC, MIN(created) ASC LIMIT ' . $lim);
        $st->execute([$game, $variant]);
        out(200, ['scores' => array_map(fn($r) => ['player' => $r['player'], 'score' => (int)$r['score'], 'games' => (int)$r['games']], $st->fetchAll(PDO::FETCH_ASSOC))]);
    }

    if ($method === 'GET' && $action === 'load') {
        $p = clean_player($_GET['player'] ?? '');
        $course = (string)($_GET['course'] ?? '');
        if (!in_array($course, READABLE, true)) fail(400, 'Cours inconnu.');
        $st = db()->prepare('SELECT data, updated FROM progress WHERE player = ? AND course = ?'); $st->execute([$p, $course]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        out(200, ['data' => $r ? json_decode($r['data'], true) : null, 'updated' => $r ? $r['updated'] : null]);
    }

    if ($method === 'GET' && $action === 'rewards') {
        $p = clean_player($_GET['player'] ?? '');
        $pdo = db();
        $tz = new DateTimeZone('Europe/Paris');
        $in = implode(',', array_fill(0, count(LEARNING), '?'));
        $since = gmdate('Y-m-d\TH:i:s\Z', time() - 120 * 86400);
        $daysOf = function (string $who) use ($pdo, $tz, $in, $since): array {
            $st = $pdo->prepare("SELECT created FROM history WHERE player = ? AND course IN ($in) AND created >= ?");
            $st->execute(array_merge([$who], LEARNING, [$since]));
            $d = [];
            foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $c) { $d[(new DateTime((string)$c))->setTimezone($tz)->format('Y-m-d')] = true; }
            $d = array_keys($d); sort($d); return $d;
        };
        // séries de jours d'affilée : une carte secrète par tranche de 5 jours
        $days = $daysOf($p); $secrets = 0; $run = 0; $prev = null; $cur = 0;
        foreach ($days as $d) {
            $t = (new DateTime($d, $tz))->getTimestamp();
            $run = ($prev !== null && abs($t - $prev - 86400) < 7200) ? $run + 1 : 1;
            if ($run % 5 === 0) $secrets++;
            $prev = $t;
        }
        $today = (new DateTime('now', $tz))->format('Y-m-d'); $yest = (new DateTime('yesterday', $tz))->format('Y-m-d');
        if ($days && in_array(end($days), [$today, $yest], true)) $cur = $run;
        // exploits mythiques
        $prog = function (string $who, string $course) use ($pdo): array {
            $st = $pdo->prepare('SELECT data FROM progress WHERE player = ? AND course = ?'); $st->execute([$who, $course]);
            $d = json_decode((string)$st->fetchColumn(), true); return is_array($d) ? ($d[$course] ?? []) : [];
        };
        $e = $prog('Amine', 'amine-ecriture'); $alpha = 0;
        foreach (($e['stars'] ?? []) as $k => $v) if (preg_match('/^c:[a-z]$/', (string)$k) && $v >= 2) $alpha++;
        $vb = $prog('Salma', 'salma-verbes'); $verbes = count(array_filter($vb['stars'] ?? [], fn($v) => $v >= 3));
        $units = function (array $d): int { $u = []; foreach (($d['best'] ?? []) as $k => $v) { if ($v && substr((string)$k, -4) !== ':lex') $u[explode(':', (string)$k)[0]] = true; } return count($u); };
        $poly = min(14, $units($prog('Essil', 'essil-deutsch'))) + min(10, $units($prog('Essil', 'essil-latin')));
        // Hydre : les trois enfants apprennent la même semaine
        $weeks = []; $now = (new DateTime('now', $tz))->format('o-W'); $thisWeek = 0;
        foreach (['Essil', 'Salma', 'Amine'] as $k) {
            $w = array_unique(array_map(fn($d) => (new DateTime($d, $tz))->format('o-W'), $daysOf($k)));
            $weeks[] = $w; if (in_array($now, $w, true)) $thisWeek++;
        }
        $together = count(array_intersect(...$weeks)) > 0;
        out(200, ['days' => count($days), 'streak' => $cur, 'secrets' => min(4, $secrets),
            'myth' => ['alphabet' => ['v' => min(26, $alpha), 'goal' => 26], 'verbes' => ['v' => min(8, $verbes), 'goal' => 8],
                'polyglotte' => ['v' => $poly, 'goal' => 24], 'hydre' => ['v' => $thisWeek, 'goal' => 3, 'done' => $together]]]);
    }

    if ($method !== 'POST') fail(405, 'Action inconnue.');

    if ($action === 'visit') {
        $pdo = db();
        $ip = client_ip(); $t = time();
        $page = (string)($_POST['page'] ?? '');
        if (!preg_match('~^/[\w\-./%]{0,119}$~u', $page)) out(200, ['ok' => false]);
        $st = $pdo->prepare('SELECT COUNT(*) FROM visits WHERE ip = ? AND ts > ?'); $st->execute([$ip, $t - 600]);
        if ((int)$st->fetchColumn() > 150) out(200, ['ok' => false]);           // anti-abus
        $st = $pdo->prepare('SELECT COUNT(*) FROM visits WHERE ip = ? AND page = ? AND ts > ?'); $st->execute([$ip, $page, $t - 120]);
        if ((int)$st->fetchColumn() > 0) out(200, ['ok' => true]);              // déjà noté il y a moins de 2 minutes
        $pl = trim((string)($_POST['player'] ?? ''));
        $pl = ($pl !== '' && mb_strlen($pl) <= 20 && preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $pl)) ? $pl : '';
        $cc = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', (string)($_SERVER['HTTP_CF_IPCOUNTRY'] ?? $_SERVER['HTTP_X_COUNTRY_CODE'] ?? '')), 0, 2));
        $screen = preg_match('/^\d{2,5}x\d{2,5}$/', (string)($_POST['screen'] ?? '')) ? (string)$_POST['screen'] : '';
        $ref = preg_replace('/[^\w\-.:]/', '', substr((string)($_POST['ref'] ?? ''), 0, 80));
        $pdo->prepare('INSERT INTO visits (ts, ip, cc, page, player, ua, app, screen, ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$t, $ip, $cc, $page, $pl, mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300), ($_POST['app'] ?? '') === '1' ? 1 : 0, $screen, $ref]);
        if (mt_rand(1, 40) === 1) {
            $pdo->prepare('DELETE FROM visits WHERE ts < ?')->execute([$t - VISIT_DAYS * 86400]);
            $pdo->exec('DELETE FROM geo WHERE ip NOT IN (SELECT DISTINCT ip FROM visits)');
        }
        out(200, ['ok' => true]);
    }

    if ($action === 'visits') {
        check_pass();
        $pdo = db();
        $days = max(1, min(VISIT_DAYS, (int)($_POST['days'] ?? 7)));
        $pdo->prepare('DELETE FROM visits WHERE ts < ?')->execute([time() - VISIT_DAYS * 86400]);
        $st = $pdo->prepare('SELECT DISTINCT v.ip FROM visits v LEFT JOIN geo g ON g.ip = v.ip WHERE v.ts >= ? AND g.ip IS NULL'); $st->execute([time() - $days * 86400]);
        $missing = $st->fetchAll(PDO::FETCH_COLUMN);
        if ($missing) resolve_geo($pdo, $missing);
        $st = $pdo->prepare('SELECT v.ts, v.ip, v.page, v.player, v.ua, v.app, v.screen, v.ref, COALESCE(NULLIF(g.cc, \'\'), v.cc) AS cc, g.country, g.region, g.city, g.isp FROM visits v LEFT JOIN geo g ON g.ip = v.ip WHERE v.ts >= ? ORDER BY v.ts DESC LIMIT 3000');
        $st->execute([time() - $days * 86400]);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) { $r['ts'] = (int)$r['ts']; $r['app'] = (int)$r['app']; } unset($r);
        out(200, ['days' => $days, 'keep' => VISIT_DAYS, 'visits' => $rows]);
    }

    if ($action === 'score') {
        limit_writes();
        $p = clean_player($_POST['player'] ?? '');
        $game = (string)($_POST['game'] ?? '');
        $variant = (string)($_POST['variant'] ?? '');
        $score = (int)($_POST['score'] ?? -1);
        if (!in_array($game, GAMES, true) || !preg_match('/^[a-z0-9\-]{1,40}$/', $variant)) fail(400, 'Jeu inconnu.');
        if ($score < 0 || $score > (in_array($game, ['grimpeglace', 'jasmin'], true) ? 999999 : 5000)) fail(400, 'Score invalide.');
        touch_player($p);
        $st = db()->prepare('SELECT MAX(score) FROM scores WHERE game = ? AND variant = ? AND player = ?'); $st->execute([$game, $variant, $p]);
        $best = (int)$st->fetchColumn();
        db()->prepare('INSERT INTO scores (player, game, variant, score, created) VALUES (?, ?, ?, ?, ?)')->execute([$p, $game, $variant, $score, now()]);
        $st = db()->prepare('SELECT COUNT(*) FROM (SELECT player, MAX(score) s FROM scores WHERE game = ? AND variant = ? GROUP BY player) WHERE s > ?');
        $st->execute([$game, $variant, max($best, $score)]);
        out(200, ['ok' => true, 'personalBest' => $score > $best, 'best' => max($best, $score), 'rank' => (int)$st->fetchColumn() + 1]);
    }

    if ($action === 'progress') {
        limit_writes();
        $p = clean_player($_POST['player'] ?? '');
        $course = (string)($_POST['course'] ?? '');
        if (!in_array($course, COURSES, true)) fail(400, 'Cours inconnu.');
        $raw = (string)($_POST['data'] ?? '');
        if ($raw === '' || strlen($raw) > MAX_DATA || !is_array(json_decode($raw, true))) fail(400, 'Progrès invalides.');
        $data = json_encode(json_decode($raw, true), JSON_UNESCAPED_UNICODE);
        touch_player($p);
        $pdo = db();
        $st = $pdo->prepare('SELECT data FROM progress WHERE player = ? AND course = ?'); $st->execute([$p, $course]);
        $prev = $st->fetchColumn();
        $n = now();
        if ($prev !== $data) {
            $pdo->prepare('INSERT INTO progress (player, course, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(player, course) DO UPDATE SET data = excluded.data, updated = excluded.updated')->execute([$p, $course, $data, $n]);
            // Un instantané par heure au plus : sert à voir la progression dans le temps.
            $st = $pdo->prepare('SELECT created FROM history WHERE player = ? AND course = ? ORDER BY created DESC LIMIT 1'); $st->execute([$p, $course]);
            $last = $st->fetchColumn();
            if (!$last || strtotime((string)$last) < time() - 3600) {
                $pdo->prepare('INSERT INTO history (player, course, data, created) VALUES (?, ?, ?, ?)')->execute([$p, $course, $data, $n]);
            } else {
                $pdo->prepare('UPDATE history SET data = ? WHERE player = ? AND course = ? AND created = ?')->execute([$data, $p, $course, $last]);
            }
        }
        out(200, ['ok' => true, 'changed' => $prev !== $data]);
    }

    if ($action === 'setup') {
        $dir = auth_dir();
        $auth = read_json($dir . '/auth.json');
        if (!empty($auth['hash'])) fail(409, 'Le mot de passe existe déjà.');
        $pw = (string)($_POST['newpass'] ?? '');
        if (mb_strlen($pw) < 6) fail(400, 'Le mot de passe doit faire au moins 6 caractères.');
        write_json($dir . '/auth.json', ['hash' => password_hash($pw, PASSWORD_DEFAULT), 'cree' => date('c')]);
        out(200, ['ok' => true]);
    }

    if ($action === 'summary') {
        check_pass();
        $pdo = db();
        $players = $pdo->query('SELECT name, created, last_seen FROM players ORDER BY last_seen DESC')->fetchAll(PDO::FETCH_ASSOC);
        $progress = $pdo->query('SELECT player, course, data, updated FROM progress')->fetchAll(PDO::FETCH_ASSOC);
        $since = gmdate('Y-m-d\TH:i:s\Z', time() - 35 * 86400);
        $st = $pdo->prepare('SELECT player, course, data, created FROM history WHERE created >= ? ORDER BY created ASC'); $st->execute([$since]);
        $history = $st->fetchAll(PDO::FETCH_ASSOC);
        $best = $pdo->query('SELECT player, game, variant, MAX(score) AS best, COUNT(*) AS games, MAX(created) AS last FROM scores GROUP BY player, game, variant')->fetchAll(PDO::FETCH_ASSOC);
        $recent = $pdo->query('SELECT player, game, variant, score, created FROM scores ORDER BY created DESC LIMIT 30')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($progress as &$r) $r['data'] = json_decode($r['data'], true); unset($r);
        foreach ($history as &$r) $r['data'] = json_decode($r['data'], true); unset($r);
        out(200, ['players' => $players, 'progress' => $progress, 'history' => $history, 'best' => $best, 'recent' => $recent]);
    }

    fail(400, 'Action inconnue.');
} catch (Throwable $e) {
    fail(500, 'Erreur du serveur.');
}
