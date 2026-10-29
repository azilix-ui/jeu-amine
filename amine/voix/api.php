<?php
/*
 * Nahki Tounsi — les voix de la famille.
 * Garde les enregistrements sur le serveur pour qu'Amine les entende sur tous les appareils.
 * Les sons et le mot de passe sont rangés HORS du site public (dossier "nahki-voix"
 * à côté de public_html) : un redéploiement depuis GitHub ne les efface pas.
 *
 * GET  ?action=list               -> liste des mots enregistrés (public)
 * GET  ?action=play&k=MOT&v=N      -> le son (public)
 * POST action=setup  newpass       -> crée le mot de passe parent (une seule fois)
 * POST action=login  pass          -> vérifie le mot de passe
 * POST action=save   pass k audio  -> enregistre / remplace le son d'un mot
 * POST action=delete pass k        -> efface le son d'un mot
 */
declare(strict_types=1);

const MAX_BYTES = 3 * 1024 * 1024;   // 3 Mo par son, largement assez pour un mot
const MAX_ITEMS = 400;
const MAX_FAILS = 8;                  // essais ratés autorisés…
const FAIL_WINDOW = 900;              // …par tranche de 15 minutes

header('X-Content-Type-Options: nosniff');

function out(int $code, array $data): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(int $code, string $msg): void { out($code, ['error' => $msg]); }

function data_dir(): string {
    $candidates = [];
    if (!empty($_SERVER['DOCUMENT_ROOT'])) {
        $candidates[] = dirname(rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/')) . '/nahki-voix';
    }
    $candidates[] = dirname(__DIR__, 3) . '/nahki-voix';
    foreach ($candidates as $d) {
        if ((is_dir($d) || @mkdir($d, 0750, true)) && is_writable($d)) {
            if (!is_dir($d . '/sons')) @mkdir($d . '/sons', 0750, true);
            return $d;
        }
    }
    fail(500, "Le serveur ne peut pas créer le dossier des enregistrements.");
    return '';
}

function read_json(string $file): array {
    if (!is_file($file)) return [];
    $j = json_decode((string)file_get_contents($file), true);
    return is_array($j) ? $j : [];
}
function write_json(string $file, array $data): void {
    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file);
}

function check_pass(string $dir): void {
    $auth = read_json($dir . '/auth.json');
    if (empty($auth['hash'])) fail(409, 'setup');
    $failsFile = $dir . '/essais.json';
    $now = time();
    $fails = array_values(array_filter(read_json($failsFile), fn($t) => is_int($t) && $t > $now - FAIL_WINDOW));
    if (count($fails) >= MAX_FAILS) fail(429, "Trop d'essais. Réessaie dans 15 minutes.");
    if (!password_verify((string)($_POST['pass'] ?? ''), (string)$auth['hash'])) {
        $fails[] = $now;
        write_json($failsFile, $fails);
        usleep(500000);
        fail(403, 'Mot de passe incorrect.');
    }
}

function clean_key($k): string {
    $k = trim((string)$k);
    if ($k === '' || mb_strlen($k) > 120 || preg_match('/[\x00-\x1F]/u', $k) || !mb_check_encoding($k, 'UTF-8')) {
        fail(400, 'Mot invalide.');
    }
    return $k;
}

$dir = data_dir();
$indexFile = $dir . '/index.json';
$action = (string)($_REQUEST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET' && $action === 'list') {
    $index = read_json($indexFile);
    $voix = [];
    foreach ($index as $k => $e) $voix[$k] = (int)($e['v'] ?? 0);
    $auth = read_json($dir . '/auth.json');
    out(200, ['setup' => empty($auth['hash']), 'voix' => $voix]);
}

if ($method === 'GET' && $action === 'play') {
    $k = clean_key($_GET['k'] ?? '');
    $index = read_json($indexFile);
    if (!isset($index[$k])) fail(404, 'Pas encore enregistré.');
    $path = $dir . '/sons/' . basename((string)$index[$k]['f']);
    if (!is_file($path)) fail(404, 'Son introuvable.');
    header('Content-Type: ' . (string)$index[$k]['m']);
    header('Content-Length: ' . filesize($path));
    header('Cache-Control: public, max-age=31536000, immutable');
    readfile($path);
    exit;
}

if ($method !== 'POST') fail(405, 'Action inconnue.');

if ($action === 'setup') {
    $auth = read_json($dir . '/auth.json');
    if (!empty($auth['hash'])) fail(409, 'Le mot de passe existe déjà.');
    $p = (string)($_POST['newpass'] ?? '');
    if (mb_strlen($p) < 6) fail(400, 'Le mot de passe doit faire au moins 6 caractères.');
    write_json($dir . '/auth.json', ['hash' => password_hash($p, PASSWORD_DEFAULT), 'cree' => date('c')]);
    out(200, ['ok' => true]);
}

check_pass($dir);

if ($action === 'login') out(200, ['ok' => true]);

if ($action === 'save') {
    $k = clean_key($_POST['k'] ?? '');
    $f = $_FILES['audio'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) fail(400, "Le son n'est pas arrivé.");
    if ($f['size'] <= 0 || $f['size'] > MAX_BYTES) fail(413, 'Le son est trop long (3 Mo maximum).');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']) ?: 'application/octet-stream';
    $ok = ['audio/webm' => 'webm', 'video/webm' => 'webm', 'audio/ogg' => 'ogg', 'application/ogg' => 'ogg',
           'audio/mpeg' => 'mp3', 'audio/mp4' => 'm4a', 'video/mp4' => 'm4a', 'audio/x-m4a' => 'm4a',
           'audio/wav' => 'wav', 'audio/x-wav' => 'wav', 'audio/aac' => 'aac', 'video/3gpp' => '3gp', 'audio/3gpp' => '3gp'];
    if (!isset($ok[$mime])) fail(415, "Ce fichier n'est pas un son reconnu ($mime).");
    $playMime = str_starts_with($mime, 'video/') ? 'audio/' . substr($mime, 6) : $mime;
    if ($mime === 'application/ogg') $playMime = 'audio/ogg';
    $index = read_json($indexFile);
    if (!isset($index[$k]) && count($index) >= MAX_ITEMS) fail(507, 'Trop de sons enregistrés.');
    $v = time();
    $name = sha1($k) . '-' . $v . '.' . $ok[$mime];
    if (!move_uploaded_file($f['tmp_name'], $dir . '/sons/' . $name)) fail(500, "Impossible d'enregistrer le son.");
    if (isset($index[$k]['f'])) @unlink($dir . '/sons/' . basename((string)$index[$k]['f']));
    $index[$k] = ['f' => $name, 'm' => $playMime, 'v' => $v];
    write_json($indexFile, $index);
    out(200, ['ok' => true, 'v' => $v]);
}

if ($action === 'delete') {
    $k = clean_key($_POST['k'] ?? '');
    $index = read_json($indexFile);
    if (isset($index[$k]['f'])) @unlink($dir . '/sons/' . basename((string)$index[$k]['f']));
    unset($index[$k]);
    write_json($indexFile, $index);
    out(200, ['ok' => true]);
}

fail(400, 'Action inconnue.');
