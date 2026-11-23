<?php
/*
 * Chkobba : les voix enregistrées par la famille pour commenter la partie (à la place, ou en plus, des bulles écrites).
 * Chaque voix appartient à un personnage (garde = Si Hamadi, marchand = Am Lamine, voleur = Fethi, controleur = Si Mokhtar,
 * commentateur = la voix qui commente toute la partie) et à une situation (chk, haya, boude, pose, gagne, perd, debut, manche ;
 * pour le Bilot, depuis le 23/11 : prend, coinche, belote, capot, chute). Les mêmes personnages jouent aux deux jeux.
 *   GET  ?liste=1                                   -> {voix:{perso:{situation:[{id, de, ts}]}}}
 *   GET  ?son=<perso>-<situation>-<id>              -> le son
 *   POST action=ajoute perso situation de audio     -> {id}       (8 s au plus, 400 Ko)
 *   POST action=enleve perso situation id           -> {ok}
 * Fichiers : famille-data/chkobba-voix/<perso>-<situation>-<id>.<ext> (+ index.json : qui a enregistré, quand).
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();

const CV_PERSOS = ['garde', 'marchand', 'voleur', 'controleur', 'commentateur'];
const CV_SITU = ['chk', 'haya', 'boude', 'pose', 'gagne', 'perd', 'debut', 'manche', 'prend', 'coinche', 'belote', 'capot', 'chute'];   // les 5 dernières : le Bilot (23/11)
const CV_MAX = 400000; const CV_PAR_SITU = 12;
const CV_MIME = ['webm' => 'audio/webm', 'mp4' => 'audio/mp4', 'ogg' => 'audio/ogg', 'wav' => 'audio/wav'];

header('X-Content-Type-Options: nosniff');
function out(int $c, array $d): void { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function fail(int $c, string $m): void { out($c, ['error' => $m]); }
function dossier(): string { $d = dirname(ga_racine()) . '/famille-data/chkobba-voix'; if (!is_dir($d) && !@mkdir($d, 0750, true)) fail(500, 'Dossier indisponible.'); return $d; }
function index_lit(): array { $j = json_decode((string)@file_get_contents(dossier() . '/index.json'), true); return is_array($j) ? $j : []; }
function index_ecrit(array $i): void { file_put_contents(dossier() . '/index.json', json_encode($i, JSON_UNESCAPED_UNICODE), LOCK_EX); }
function perso(string $p): string { if (!in_array($p, CV_PERSOS, true)) fail(400, 'Personnage inconnu.'); return $p; }
function situ(string $s): string { if (!in_array($s, CV_SITU, true)) fail(400, 'Situation inconnue.'); return $s; }

$m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($m === 'GET' && isset($_GET['son'])) {
    $k = (string)$_GET['son'];
    if (!preg_match('/^([a-z]+)-([a-z]+)-([a-z0-9]{6,16})$/', $k, $q) || !in_array($q[1], CV_PERSOS, true) || !in_array($q[2], CV_SITU, true)) { http_response_code(404); exit; }
    foreach (CV_MIME as $x => $type) { $f = dossier() . "/$k.$x"; if (is_file($f)) { header('Content-Type: ' . $type); header('Cache-Control: private, max-age=31536000, immutable'); header('Content-Length: ' . filesize($f)); readfile($f); exit; } }
    http_response_code(404); exit;
}
if ($m === 'GET') {
    $v = []; $i = index_lit();
    foreach (glob(dossier() . '/*-*-*.*') ?: [] as $f) {
        if (!preg_match('/^([a-z]+)-([a-z]+)-([a-z0-9]{6,16})\.[a-z0-9]+$/', basename($f), $q)) continue;
        $k = "$q[1]-$q[2]-$q[3]"; $v[$q[1]][$q[2]][] = ['id' => $q[3], 'de' => $i[$k]['de'] ?? '', 'ts' => $i[$k]['ts'] ?? filemtime($f)];
    }
    out(200, ['voix' => (object)$v]);
}
if ($m !== 'POST') fail(405, 'Méthode refusée.');
$a = (string)($_POST['action'] ?? ''); $p = perso((string)($_POST['perso'] ?? '')); $s = situ((string)($_POST['situation'] ?? ''));
if ($a === 'ajoute') {
    $f = $_FILES['audio'] ?? null;
    if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) fail(400, 'La voix n\'est pas arrivée.');
    if ($f['size'] < 600 || $f['size'] > CV_MAX) fail(400, 'La voix est trop longue (8 secondes au plus).');
    $h = (string)file_get_contents($f['tmp_name'], false, null, 0, 12);
    $x = substr($h, 0, 4) === "\x1A\x45\xDF\xA3" ? 'webm' : (substr($h, 4, 4) === 'ftyp' ? 'mp4' : (substr($h, 0, 4) === 'OggS' ? 'ogg' : (substr($h, 0, 4) === 'RIFF' && substr($h, 8, 4) === 'WAVE' ? 'wav' : '')));
    if ($x === '') fail(400, 'Ce son n\'est pas reconnu.');
    if (count(glob(dossier() . "/$p-$s-*.*") ?: []) >= CV_PAR_SITU) fail(429, 'Il y a déjà ' . CV_PAR_SITU . ' voix ici : enlèves-en une d\'abord.');
    $id = base_convert((string)time(), 10, 36) . bin2hex(random_bytes(2));
    if (!move_uploaded_file($f['tmp_name'], dossier() . "/$p-$s-$id.$x")) fail(500, 'Le serveur n\'a pas pu garder la voix.');
    $de = mb_substr(trim(preg_replace('/[^\p{L}\p{N} \'-]/u', '', (string)($_POST['de'] ?? ''))), 0, 24);
    $i = index_lit(); $i["$p-$s-$id"] = ['de' => $de, 'ts' => time()]; index_ecrit($i);
    out(200, ['id' => $id]);
}
if ($a === 'enleve') {
    $id = (string)($_POST['id'] ?? ''); if (!preg_match('/^[a-z0-9]{6,16}$/', $id)) fail(400, 'Voix inconnue.');
    foreach (array_keys(CV_MIME) as $x) @unlink(dossier() . "/$p-$s-$id.$x");
    $i = index_lit(); unset($i["$p-$s-$id"]); index_ecrit($i);
    out(200, ['ok' => true]);
}
fail(400, 'Action inconnue.');
