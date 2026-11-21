<?php
/* Dépôt des musiques ElevenLabs du studio vidéo (21/11) : la page de la musique générée (elevenlabsusercontent.com) les envoie ici
   elle-même (rien à télécharger pour le papa). Protégé par un jeton dont seule l'empreinte est ici (dépôt public).
   Les sons vont dans famille-data/mur-musique/<id>.mp3 (hors du site public), servis par api/mur.php?mus=<id>. */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php';
header('Access-Control-Allow-Origin: https://elevenlabsusercontent.com');
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
const MM_EMPREINTE = '3beb6a104a3a0adb35b5b955dd8690cb1a21b4c69696bc125a6c3914d7db773f';
function mm_fin(int $c, array $r): void { http_response_code($c); echo json_encode($r); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') mm_fin(405, ['ok' => false]);
$d = json_decode((string)file_get_contents('php://input', false, null, 0, 4000000), true);
if (!is_array($d) || !hash_equals(MM_EMPREINTE, hash('sha256', (string)($d['jeton'] ?? '')))) mm_fin(403, ['ok' => false]);
$id = (string)($d['id'] ?? ''); if (!preg_match('/^[a-z0-9-]{2,30}$/', $id)) mm_fin(400, ['ok' => false, 'err' => 'nom']);
$mp3 = base64_decode((string)($d['son'] ?? ''), true);
if ($mp3 === false || strlen($mp3) < 1000 || strlen($mp3) > 2500000) mm_fin(400, ['ok' => false, 'err' => 'taille']);
if (substr($mp3, 0, 3) !== 'ID3' && !(ord($mp3[0]) === 0xFF && (ord($mp3[1]) & 0xE0) === 0xE0)) mm_fin(400, ['ok' => false, 'err' => 'mp3']);
$dir = dirname(ga_racine()) . '/famille-data/mur-musique'; if (!is_dir($dir) && !@mkdir($dir, 0750, true)) mm_fin(500, ['ok' => false]);
if (file_put_contents("$dir/$id.mp3", $mp3, LOCK_EX) === false) mm_fin(500, ['ok' => false]);
mm_fin(200, ['ok' => true, 'n' => count(glob("$dir/*.mp3") ?: [])]);
