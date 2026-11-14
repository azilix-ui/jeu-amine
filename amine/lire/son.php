<?php
/* Sert un son de « Je lis ! » : son.php?v=lulu&k=bravo */
require __DIR__ . '/_commun.php';
$v = (string)($_GET['v'] ?? ''); $k = (string)($_GET['k'] ?? '');
$f = lv_dossier() . '/' . $v . '/' . $k . '.mp3';
if (!in_array($v, LV_VOIX, true) || !lv_cle_ok($k) || !is_file($f)) { http_response_code(404); exit; }
header('Content-Type: audio/mpeg');
header('Content-Length: ' . filesize($f));
header('Cache-Control: public, max-age=2592000');   // l'adresse change (paramètre r) quand le son est refait
readfile($f);
