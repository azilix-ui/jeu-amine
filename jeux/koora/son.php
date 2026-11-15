<?php
/* Koora : sert un bruitage ElevenLabs rangé hors du site public (son.php?n=coupe2), ou la liste (son.php?liste=1). */
$root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__, 2);
$dir = dirname($root) . '/famille-data/koora-sons';
if (isset($_GET['liste'])) { header('Content-Type: application/json'); header('Cache-Control: no-store'); echo json_encode(array_map(fn($f) => basename($f, '.wav'), glob($dir . '/*.wav') ?: [])); exit; }
$n = (string)($_GET['n'] ?? ''); $f = $dir . '/' . $n . '.wav';
if (!preg_match('/^[a-z]{2,12}[1-4]$/', $n) || !is_file($f)) { http_response_code(404); exit; }
header('Content-Type: audio/wav'); header('Content-Length: ' . (string)filesize($f)); header('Cache-Control: public, max-age=86400');
readfile($f);
