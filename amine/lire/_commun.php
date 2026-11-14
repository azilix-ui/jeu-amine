<?php
/* Les voix de « Je lis ! » (14/11/2026) : enregistrées dans la page Text to Speech d'ElevenLabs, envoyées une par une
   par depot.php (sans téléchargement à accepter), rangées hors du site public dans famille-data/lire-voix/<voix>/<clé>.mp3
   (un redéploiement GitHub n'y touche pas), servies par son.php, listées par voix.php. */
const LV_VOIX = ['lulu', 'olivier', 'jon'];
function lv_dossier(): string {
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__, 2);
    return dirname($root) . '/famille-data/lire-voix';
}
function lv_cle_ok(string $k): bool { return (bool)preg_match('/^[a-z0-9-]{1,60}$/', $k); }
