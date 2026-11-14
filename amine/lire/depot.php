<?php
/* Reçoit un son de la page ElevenLabs (fetch depuis elevenlabs.io). Protégé par un jeton : seule son empreinte est ici
   (le dépôt GitHub est public), le jeton lui-même n'est connu que de la page de génération. */
require __DIR__ . '/_commun.php';
header('Access-Control-Allow-Origin: https://elevenlabs.io');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
const LV_EMPREINTE = '67c33c24f21ac2ff13972c5c2c316fe4ed3817bad0b8bb8c278e4540d60c3062';
function lv_fin(int $code, array $r): void { http_response_code($code); echo json_encode($r); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') lv_fin(405, ['ok' => false]);
$d = json_decode((string)file_get_contents('php://input', false, null, 0, 600000), true);
if (!is_array($d) || !hash_equals(LV_EMPREINTE, hash('sha256', (string)($d['jeton'] ?? '')))) lv_fin(403, ['ok' => false]);
$v = (string)($d['voix'] ?? ''); $k = (string)($d['cle'] ?? '');
if (!in_array($v, LV_VOIX, true) || !lv_cle_ok($k)) lv_fin(400, ['ok' => false, 'err' => 'nom']);
$mp3 = base64_decode(preg_replace('#^data:audio/[a-z0-9.+-]+;base64,#', '', (string)($d['son'] ?? '')), true);
if ($mp3 === false || strlen($mp3) < 500 || strlen($mp3) > 400000) lv_fin(400, ['ok' => false, 'err' => 'taille']);
$t = substr($mp3, 0, 3);
if ($t !== 'ID3' && !(ord($mp3[0]) === 0xFF && (ord($mp3[1]) & 0xE0) === 0xE0)) lv_fin(400, ['ok' => false, 'err' => 'mp3']);
$dir = lv_dossier() . '/' . $v;
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) lv_fin(500, ['ok' => false, 'err' => 'dossier']);
if (file_put_contents($dir . '/' . $k . '.mp3', $mp3, LOCK_EX) === false) lv_fin(500, ['ok' => false, 'err' => 'ecriture']);
lv_fin(200, ['ok' => true, 'n' => count(glob($dir . '/*.mp3') ?: [])]);
