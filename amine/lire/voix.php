<?php
/* La liste des sons enregistrés, pour la page : window.LIRE_VOIX = { lulu: { r: <date>, k: [clés…] }, … } */
require __DIR__ . '/_commun.php';
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
$out = [];
foreach (LV_VOIX as $v) {
    $fs = glob(lv_dossier() . '/' . $v . '/*.mp3') ?: [];
    if (!$fs) continue;
    $r = 0; $k = [];
    foreach ($fs as $f) { $k[] = basename($f, '.mp3'); $r = max($r, filemtime($f)); }
    sort($k); $out[$v] = ['r' => $r, 'k' => $k];
}
echo 'window.LIRE_VOIX = ' . json_encode((object)$out) . ";\n";
