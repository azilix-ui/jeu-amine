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
 *   POST action=score    player game variant score      -> enregistre une partie
 *   POST action=progress player course data(JSON)       -> enregistre les progrès d'un cours
 * Parents (mot de passe parent, le même que pour les voix de Nahki Tounsi) :
 *   GET  ?action=auth                                   -> le mot de passe existe-t-il ?
 *   POST action=setup  newpass                          -> crée le mot de passe (une seule fois)
 *   POST action=summary pass                            -> tout pour la page Progression
 */
declare(strict_types=1);

const GAMES   = ['serpentin', 'serpent3d', 'ludo3d'];
// Cours dont les progrès peuvent être relus par le jeu lui-même (collection de skins sur plusieurs appareils).
const READABLE = ['serpent3d', 'salma-verbes', 'ludo3d'];
const COURSES = ['essil-deutsch', 'essil-latin', 'salma-english', 'salma-maths', 'salma-cheval', 'salma-verbes', 'amine-halloween', 'amine-tounsi', 'amine-serpentin', 'serpent3d', 'ludo3d'];
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
    return $pdo;
}
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }

function clean_player($p): string {
    $p = trim(preg_replace('/\s+/u', ' ', (string)$p));
    if ($p === '' || mb_strlen($p) > 20 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $p)) fail(400, 'Prénom invalide.');
    return mb_strtoupper(mb_substr($p, 0, 1)) . mb_substr($p, 1);
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

    if ($method !== 'POST') fail(405, 'Action inconnue.');

    if ($action === 'score') {
        limit_writes();
        $p = clean_player($_POST['player'] ?? '');
        $game = (string)($_POST['game'] ?? '');
        $variant = (string)($_POST['variant'] ?? '');
        $score = (int)($_POST['score'] ?? -1);
        if (!in_array($game, GAMES, true) || !preg_match('/^[a-z0-9\-]{1,40}$/', $variant)) fail(400, 'Jeu inconnu.');
        if ($score < 0 || $score > 5000) fail(400, 'Score invalide.');
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
