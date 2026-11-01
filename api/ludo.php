<?php
/*
 * Ludo Légendes : les salons de partie en ligne (une partie = un code de 4 caractères).
 * Le serveur garde l'état de la partie et son numéro de version ; ce sont les tablettes
 * qui appliquent les règles. Chaque envoi doit porter la version qu'il a lue : si quelqu'un
 * a joué entre-temps, le serveur refuse (409) et renvoie l'état à jour.
 *
 *   GET  ?action=state&code=ABCD                 -> {v, state}
 *   POST action=create state(JSON)               -> {code, v}
 *   POST action=push code v state(JSON)          -> {v} ou 409 {v, state}
 *
 * Base à part (ludo.sqlite, hors du site public) pour ne pas gêner les autres jeux.
 */
declare(strict_types=1);

const MAX_STATE = 24000;
const MAX_WRITES = 1500;       // envois par adresse (toute la maison partage souvent la même)…
const WRITE_WINDOW = 600;      // …toutes les 10 minutes
const ROOM_TTL = 43200;        // une partie inactive disparaît après 12 heures
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out(int $code, array $data): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(int $code, string $msg): void { out($code, ['error' => $msg]); }

function data_dir(): string {
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__);
    $d = dirname($root) . '/famille-data';
    if (!(is_dir($d) || @mkdir($d, 0750, true)) || !is_writable($d)) fail(500, "Le serveur ne peut pas créer le dossier de la base.");
    return $d;
}
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) fail(500, "SQLite n'est pas disponible sur ce serveur.");
    $pdo = new PDO('sqlite:' . data_dir() . '/ludo.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, v INTEGER NOT NULL, state TEXT NOT NULL, updated INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS writes (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    return $pdo;
}
function limit_writes(): void {
    $ip = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '?'));
    $t = time(); $pdo = db();
    $pdo->prepare('DELETE FROM writes WHERE ts < ?')->execute([$t - WRITE_WINDOW]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM writes WHERE ip = ?'); $st->execute([$ip]);
    if ((int)$st->fetchColumn() >= MAX_WRITES) fail(429, 'Trop de coups joués, attends un peu.');
    $pdo->prepare('INSERT INTO writes (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
}
function clean_code($c): string {
    $c = strtoupper(trim((string)$c));
    if (!preg_match('/^[' . CODE_CHARS . ']{4}$/', $c)) fail(400, 'Code de partie invalide.');
    return $c;
}
function read_state(): string {
    $raw = (string)($_POST['state'] ?? '');
    if ($raw === '' || strlen($raw) > MAX_STATE) fail(400, 'Partie invalide.');
    $j = json_decode($raw, true);
    if (!is_array($j) || !isset($j['seats']) || !is_array($j['seats'])) fail(400, 'Partie invalide.');
    return json_encode($j, JSON_UNESCAPED_UNICODE);
}
function room(string $code): ?array {
    $st = db()->prepare('SELECT v, state, updated FROM rooms WHERE code = ?'); $st->execute([$code]);
    $r = $st->fetch(PDO::FETCH_ASSOC);
    if (!$r || (int)$r['updated'] < time() - ROOM_TTL) return null;
    return $r;
}

$action = (string)($_REQUEST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET' && $action === 'state') {
        $r = room(clean_code($_GET['code'] ?? ''));
        if (!$r) fail(404, "Cette partie n'existe pas ou est terminée.");
        out(200, ['v' => (int)$r['v'], 'state' => json_decode($r['state'], true)]);
    }
    if ($method !== 'POST') fail(405, 'Action inconnue.');

    if ($action === 'create') {
        limit_writes();
        $state = read_state();
        $pdo = db();
        $pdo->prepare('DELETE FROM rooms WHERE updated < ?')->execute([time() - ROOM_TTL]);
        for ($k = 0; $k < 20; $k++) {
            $code = '';
            for ($i = 0; $i < 4; $i++) $code .= CODE_CHARS[random_int(0, strlen(CODE_CHARS) - 1)];
            $st = $pdo->prepare('INSERT OR IGNORE INTO rooms (code, v, state, updated) VALUES (?, 1, ?, ?)');
            $st->execute([$code, $state, time()]);
            if ($st->rowCount() === 1) out(200, ['code' => $code, 'v' => 1]);
        }
        fail(500, 'Impossible de créer la partie.');
    }

    if ($action === 'push') {
        limit_writes();
        $code = clean_code($_POST['code'] ?? '');
        $v = (int)($_POST['v'] ?? -1);
        $state = read_state();
        $pdo = db();
        $st = $pdo->prepare('UPDATE rooms SET v = v + 1, state = ?, updated = ? WHERE code = ? AND v = ?');
        $st->execute([$state, time(), $code, $v]);
        if ($st->rowCount() === 1) out(200, ['v' => $v + 1]);
        $r = room($code);
        if (!$r) fail(404, "Cette partie n'existe pas ou est terminée.");
        out(409, ['v' => (int)$r['v'], 'state' => json_decode($r['state'], true)]);
    }

    fail(400, 'Action inconnue.');
} catch (Throwable $e) {
    fail(500, 'Erreur du serveur.');
}
