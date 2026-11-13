<?php // diagnostic temporaire (13/11) : quelles en-têtes d'adresse le serveur reçoit-il ? Sera supprimé tout de suite après.
header('Content-Type: application/json'); header('Cache-Control: no-store');
$o = []; foreach ($_SERVER as $k => $v) if (preg_match('/ADDR|FORWARD|REAL|CLIENT|CF_|HCDN|VIA|TRUE|X_HOST/', $k)) $o[$k] = $v;
echo json_encode($o);
