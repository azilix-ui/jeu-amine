<?php
/*
 * Jasmin · Stage 3, la course du TGM en ligne (23/11) : copie de l'API de l'Arène (même salon, même relais de messages),
 * avec sa propre base (stage3.sqlite), 6 coureurs au plus, et le héros et la tenue de chacun.
 * Le serveur ne fait que passer les messages : chaque tablette fait courir son héros sur le même parcours (même graine)
 * et envoie sa position ; les autres coureurs sont dessinés en transparence. L'arrivée (temps) est envoyée à tous.
 *
 *   POST action=hello client name tete status code   -> {online, invites}
 *   POST action=invite client name tete to code       -> {ok}
 *   POST action=create client state(JSON)             -> {code}
 *   GET  ?action=room&code=ABCD                        -> {state, host}
 *   POST action=join code client name tete heros tenue -> {state, host}   (avant le départ seulement)
 *   POST action=update code client state(JSON)        -> {ok}       (le créateur : mode, départ)
 *   POST action=sync code client since msgs(JSON)     -> {id, msgs}
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();

const MAX_STATE = 8000;
const MAX_MSGS = 90000;        // taille d'un envoi (une grosse capture compressée tient largement)
const ONLINE_FOR = 15;
const INVITE_FOR = 40;
const ROOM_TTL = 7200;         // une partie inactive disparaît après 2 heures
const KEEP_MSGS = 90;          // secondes pendant lesquelles on garde les messages
const MAX_WRITES = 300;        // créations et invitations par adresse…
const WRITE_WINDOW = 600;      // …toutes les 10 minutes
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out(int $code, array $data): void { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function fail(int $code, string $msg): void { out($code, ['error' => $msg]); }
function data_dir(): string {
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__);
    $d = dirname($root) . '/famille-data';
    if (!(is_dir($d) || @mkdir($d, 0750, true)) || !is_writable($d)) fail(500, "Le serveur ne peut pas créer le dossier de la base.");
    return $d;
}
function db(): PDO {
    static $pdo = null; if ($pdo) return $pdo;
    if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) fail(500, "SQLite n'est pas disponible sur ce serveur.");
    $pdo = new PDO('sqlite:' . data_dir() . '/stage3.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000; PRAGMA synchronous=NORMAL;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, host TEXT NOT NULL, state TEXT NOT NULL, updated INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS msgs (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL, client TEXT NOT NULL, body TEXT NOT NULL, ts INTEGER NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS msgs_code ON msgs (code, id)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS presence (client TEXT PRIMARY KEY, name TEXT NOT NULL, tete TEXT NOT NULL, status TEXT NOT NULL, code TEXT NOT NULL, ts INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS invites (id INTEGER PRIMARY KEY AUTOINCREMENT, dest TEXT NOT NULL, name TEXT NOT NULL, tete TEXT NOT NULL, code TEXT NOT NULL, ts INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS writes (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    return $pdo;
}
function limit_writes(): void {
    $ip = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '?')); $t = time(); $pdo = db();
    $pdo->prepare('DELETE FROM writes WHERE ts < ?')->execute([$t - WRITE_WINDOW]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM writes WHERE ip = ?'); $st->execute([$ip]);
    if ((int)$st->fetchColumn() >= MAX_WRITES) fail(429, 'Trop de parties créées, attends un peu.');
    $pdo->prepare('INSERT INTO writes (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
}
function clean_code($c): string { $c = strtoupper(trim((string)$c)); if (!preg_match('/^[' . CODE_CHARS . ']{4}$/', $c)) fail(400, 'Code de partie invalide.'); return $c; }
function clean_client($c): string { $c = (string)$c; if (!preg_match('/^[a-z0-9]{8,20}$/', $c)) fail(400, 'Joueur invalide.'); return $c; }
function clean_text($t, int $max): string { $t = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$t) ?? ''); if ($t === '' || mb_strlen($t) > $max) fail(400, 'Texte invalide.'); return $t; }
function clean_img($t): string { $t = (string)$t; return preg_match('#^[a-zA-Z0-9_./:-]{0,200}$#', $t) ? $t : ''; }
function read_json(string $k, int $max): array { $raw = (string)($_POST[$k] ?? ''); if ($raw === '' || strlen($raw) > $max) fail(400, 'Données invalides.'); $j = json_decode($raw, true); if (!is_array($j)) fail(400, 'Données invalides.'); return $j; }
function room(string $code): ?array {
    $st = db()->prepare('SELECT host, state, updated FROM rooms WHERE code = ?'); $st->execute([$code]);
    $r = $st->fetch(PDO::FETCH_ASSOC); if (!$r || (int)$r['updated'] < time() - ROOM_TTL) return null; return $r;
}

$action = (string)($_REQUEST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
try {
    if ($method === 'GET' && $action === 'room') {
        $r = room(clean_code($_GET['code'] ?? '')); if (!$r) fail(404, "Cette partie n'existe pas ou est terminée.");
        out(200, ['state' => json_decode($r['state'], true), 'host' => $r['host']]);
    }
    if ($method !== 'POST') fail(405, 'Action inconnue.');

    if ($action === 'sync') {
        $code = clean_code($_POST['code'] ?? ''); $client = clean_client($_POST['client'] ?? '');
        $since = max(0, (int)($_POST['since'] ?? 0)); $raw = (string)($_POST['msgs'] ?? '');
        if (strlen($raw) > MAX_MSGS) fail(413, 'Envoi trop gros.');
        $pdo = db(); $t = time();
        if ($raw !== '' && $raw !== '[]') { if (!is_array(json_decode($raw, true))) fail(400, 'Données invalides.'); $pdo->prepare('INSERT INTO msgs (code, client, body, ts) VALUES (?, ?, ?, ?)')->execute([$code, $client, $raw, $t]); }
        if (random_int(0, 60) === 0) { $pdo->prepare('DELETE FROM msgs WHERE ts < ?')->execute([$t - KEEP_MSGS]); $pdo->prepare('UPDATE rooms SET updated = ? WHERE code = ?')->execute([$t, $code]); }
        if ($since === 0) { $st = $pdo->prepare('SELECT COALESCE(MAX(id), 0) FROM msgs'); $st->execute(); out(200, ['id' => (int)$st->fetchColumn(), 'msgs' => []]); }
        $st = $pdo->prepare('SELECT id, client, body FROM msgs WHERE code = ? AND id > ? ORDER BY id LIMIT 400'); $st->execute([$code, $since]);
        $res = []; $last = $since;
        foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $m) { $last = (int)$m['id']; if ($m['client'] !== $client) $res[] = ['id' => $last, 'c' => $m['client'], 'm' => json_decode($m['body'], true)]; }
        out(200, ['id' => $last, 'msgs' => $res]);
    }

    if ($action === 'hello' || $action === 'invite') {
        $client = clean_client($_POST['client'] ?? ''); $name = clean_text($_POST['name'] ?? '', 24); $tete = clean_img($_POST['tete'] ?? '');
        $pdo = db(); $t = time();
        if ($action === 'invite') {
            limit_writes(); $to = clean_client($_POST['to'] ?? ''); $code = clean_code($_POST['code'] ?? '');
            if ($to === $client) fail(400, 'Joueur invalide.'); if (!room($code)) fail(404, "Cette partie n'existe pas ou est terminée.");
            $pdo->prepare('DELETE FROM invites WHERE ts < ? OR (dest = ? AND code = ?)')->execute([$t - INVITE_FOR, $to, $code]);
            $pdo->prepare('INSERT INTO invites (dest, name, tete, code, ts) VALUES (?, ?, ?, ?, ?)')->execute([$to, $name, $tete, $code, $t]);
            out(200, ['ok' => true]);
        }
        $status = (string)($_POST['status'] ?? 'menu'); if (!in_array($status, ['menu', 'salon', 'joue'], true)) $status = 'menu';
        $code = ($status === 'menu' || ($_POST['code'] ?? '') === '') ? '' : clean_code($_POST['code'] ?? '');
        $pdo->prepare('INSERT OR REPLACE INTO presence (client, name, tete, status, code, ts) VALUES (?, ?, ?, ?, ?, ?)')->execute([$client, $name, $tete, $status, $code, $t]);
        if (random_int(0, 20) === 0) $pdo->prepare('DELETE FROM presence WHERE ts < ?')->execute([$t - 300]);
        $st = $pdo->prepare('SELECT client, name, tete, status, code FROM presence WHERE ts >= ? AND client <> ? ORDER BY name COLLATE NOCASE LIMIT 40'); $st->execute([$t - ONLINE_FOR, $client]);
        $online = $st->fetchAll(PDO::FETCH_ASSOC);
        $st = $pdo->prepare('SELECT name, tete, code FROM invites WHERE dest = ? AND ts >= ? ORDER BY id'); $st->execute([$client, $t - INVITE_FOR]);
        $inv = $st->fetchAll(PDO::FETCH_ASSOC); if ($inv) $pdo->prepare('DELETE FROM invites WHERE dest = ?')->execute([$client]);
        out(200, ['online' => $online, 'invites' => $inv]);
    }

    if ($action === 'create') {
        limit_writes(); $client = clean_client($_POST['client'] ?? ''); $state = read_json('state', MAX_STATE);
        $pdo = db(); $pdo->prepare('DELETE FROM rooms WHERE updated < ?')->execute([time() - ROOM_TTL]);
        for ($k = 0; $k < 20; $k++) {
            $code = ''; for ($i = 0; $i < 4; $i++) $code .= CODE_CHARS[random_int(0, strlen(CODE_CHARS) - 1)];
            $st = $pdo->prepare('INSERT OR IGNORE INTO rooms (code, host, state, updated) VALUES (?, ?, ?, ?)'); $st->execute([$code, $client, json_encode($state, JSON_UNESCAPED_UNICODE), time()]);
            if ($st->rowCount() === 1) out(200, ['code' => $code]);
        }
        fail(500, 'Impossible de créer la partie.');
    }

    if ($action === 'join') {
        $code = clean_code($_POST['code'] ?? ''); $client = clean_client($_POST['client'] ?? '');
        $pdo = db(); $pdo->exec('BEGIN IMMEDIATE');
        $r = room($code); if (!$r) { $pdo->exec('ROLLBACK'); fail(404, "Cette partie n'existe pas ou est terminée."); }
        $s = json_decode($r['state'], true); $js = $s['joueurs'] ?? [];
        $deja = false; foreach ($js as $j) if (($j['client'] ?? '') === $client) $deja = true;
        if (!$deja) {
            if (($s['etat'] ?? '') !== 'attente') { $pdo->exec('ROLLBACK'); fail(409, 'La partie a déjà commencé.'); }
            if (count($js) >= 6) { $pdo->exec('ROLLBACK'); fail(409, 'La course est pleine (6 coureurs).'); }
            $heros = (string)($_POST['heros'] ?? ''); if (!in_array($heros, ['essil', 'salma', 'amine', 'anis', 'imen', 'nour', 'yasmine', 'fares'], true)) $heros = 'nour';
            $tenue = (string)($_POST['tenue'] ?? ''); if (!preg_match('/^[a-z]{2,10}$/', $tenue)) $tenue = 'classique';
            $js[] = ['client' => $client, 'nom' => clean_text($_POST['name'] ?? '', 24), 'tete' => clean_img($_POST['tete'] ?? ''), 'heros' => $heros, 'tenue' => $tenue];
            $s['joueurs'] = $js; $pdo->prepare('UPDATE rooms SET state = ?, updated = ? WHERE code = ?')->execute([json_encode($s, JSON_UNESCAPED_UNICODE), time(), $code]);
        }
        $pdo->exec('COMMIT'); out(200, ['state' => $s, 'host' => $r['host']]);
    }

    if ($action === 'update') {
        $code = clean_code($_POST['code'] ?? ''); $client = clean_client($_POST['client'] ?? ''); $state = read_json('state', MAX_STATE);
        $r = room($code); if (!$r) fail(404, "Cette partie n'existe pas ou est terminée.");
        if ($r['host'] !== $client) fail(403, 'Seul le créateur de la partie peut la lancer.');
        db()->prepare('UPDATE rooms SET state = ?, updated = ? WHERE code = ?')->execute([json_encode($state, JSON_UNESCAPED_UNICODE), time(), $code]);
        out(200, ['ok' => true]);
    }
    fail(400, 'Action inconnue.');
} catch (Throwable $e) {
    fail(500, 'Erreur du serveur.');
}
