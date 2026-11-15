<?php
/* Koora (15/11) : reçoit un bruitage fait dans la page Sound Effects d'ElevenLabs (fetch depuis elevenlabs.io),
   déjà converti en WAV par la page (le format d'ElevenLabs, Ogg Opus, ne se lit pas sur tous les iPad).
   Protégé par un jeton : seule son empreinte est ici (le dépôt est public), le jeton n'est connu que de la page de génération.
   Les sons sont rangés hors du site public : famille-data/koora-sons/<nom>.wav (servis par son.php). */
header('Access-Control-Allow-Origin: https://elevenlabs.io');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
const KS_EMPREINTE = '4e587611ac3ccafcd9e8d8297554b8177fb1e0ea166a35be967f7491c1bcfd5d';
function ks_fin(int $code, array $r): void { http_response_code($code); echo json_encode($r); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') ks_fin(405, ['ok' => false]);
$d = json_decode((string)file_get_contents('php://input', false, null, 0, 1200000), true);
if (!is_array($d) || !hash_equals(KS_EMPREINTE, hash('sha256', (string)($d['jeton'] ?? '')))) ks_fin(403, ['ok' => false]);
$n = (string)($d['nom'] ?? '');
if (!preg_match('/^[a-z]{2,12}[1-4]$/', $n)) ks_fin(400, ['ok' => false, 'err' => 'nom']);
$wav = base64_decode((string)($d['son'] ?? ''), true);
if ($wav === false || strlen($wav) < 500 || strlen($wav) > 800000 || substr($wav, 0, 4) !== 'RIFF' || substr($wav, 8, 4) !== 'WAVE') ks_fin(400, ['ok' => false, 'err' => 'wav']);
$root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__, 2);
$dir = dirname($root) . '/famille-data/koora-sons';
if (!is_dir($dir) && !@mkdir($dir, 0750, true)) ks_fin(500, ['ok' => false, 'err' => 'dossier']);
if (file_put_contents($dir . '/' . $n . '.wav', $wav, LOCK_EX) === false) ks_fin(500, ['ok' => false, 'err' => 'ecriture']);
ks_fin(200, ['ok' => true, 'n' => count(glob($dir . '/*.wav') ?: [])]);
