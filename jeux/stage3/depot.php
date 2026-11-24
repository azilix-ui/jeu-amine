<?php
/* Stage 3 (24/11) : reçoit un bruitage ElevenLabs (MP3) envoyé par la page du son (elevenlabsusercontent.com), sans téléchargement.
   Protégé par un jeton : seule son empreinte est ici (le dépôt est public). Rangé hors du site public : famille-data/stage3-sons/<nom>.mp3 (servi par son.php). */
$o = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
if (in_array($o, ['https://elevenlabsusercontent.com', 'https://elevenlabs.io'], true)) header('Access-Control-Allow-Origin: ' . $o);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
const S3_EMPREINTE = '7b014377bc1c2442f90b2e845ce28d398d8c194af5fb2486ccc9687a05f54b34';
function s3_fin(int $c, array $r): void { http_response_code($c); echo json_encode($r); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') s3_fin(405, ['ok' => false]);
$d = json_decode((string)file_get_contents('php://input', false, null, 0, 1200000), true);
if (!is_array($d) || !hash_equals(S3_EMPREINTE, hash('sha256', (string)($d['jeton'] ?? '')))) s3_fin(403, ['ok' => false]);
$n = (string)($d['nom'] ?? '');
if (!preg_match('/^[a-z]{2,10}[1-4]$/', $n)) s3_fin(400, ['ok' => false, 'err' => 'nom']);
$mp3 = base64_decode((string)($d['son'] ?? ''), true);
if ($mp3 === false || strlen($mp3) < 500 || strlen($mp3) > 800000 || !(substr($mp3, 0, 3) === 'ID3' || (ord($mp3[0]) === 0xFF && (ord($mp3[1]) & 0xE0) === 0xE0))) s3_fin(400, ['ok' => false, 'err' => 'mp3']);
$root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__, 2);
$dir = dirname($root) . '/famille-data/stage3-sons';
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) s3_fin(500, ['ok' => false, 'err' => 'dossier']);
if (file_put_contents($dir . '/' . $n . '.mp3', $mp3, LOCK_EX) === false) s3_fin(500, ['ok' => false, 'err' => 'ecriture']);
s3_fin(200, ['ok' => true, 'n' => count(glob($dir . '/*.mp3') ?: [])]);
