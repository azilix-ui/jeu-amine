<?php
/*
 * Famille Missaoui — chaque page du site (.html, dossiers) et les photos de famille passent par ici (règles dans .htaccess).
 * Appareil de confiance (ou protection pas encore activée) : la page est servie telle quelle.
 * Sinon : direction la page « accès réservé » (acces/index.php), qui ramène ensuite à la page demandée.
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';

$racine = realpath(ga_racine());
$chemin = rawurldecode((string)parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH));
if ($chemin === '' || substr($chemin, -1) === '/') $chemin .= 'index.html';
$fichier = realpath($racine . $chemin);
$ext = strtolower(pathinfo((string)$fichier, PATHINFO_EXTENSION));
$TYPES = ['html' => 'text/html; charset=utf-8', 'webp' => 'image/webp', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png'];
if (!$fichier || strpos($fichier, $racine . DIRECTORY_SEPARATOR) !== 0 || !is_file($fichier) || !isset($TYPES[$ext])) {
    http_response_code(404); header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Page introuvable</title><p style="font-family:sans-serif;padding:40px">Cette page n\'existe pas. <a href="/">Retour à l\'accueil</a></p>'; exit;
}
if (!ga_peut_entrer()) {
    ga_note_refus($chemin);
    if ($ext === 'html') ga_note_demande($chemin);
    header('Cache-Control: no-store');
    if ($ext === 'html') { header('Location: /acces/?suite=' . rawurlencode((string)($_SERVER['REQUEST_URI'] ?? '/')), true, 302); exit; }
    http_response_code(403); exit;
}
header('Content-Type: ' . $TYPES[$ext]);
header('X-Content-Type-Options: nosniff');
header($ext === 'html' ? 'Cache-Control: private, no-cache, must-revalidate' : 'Cache-Control: private, max-age=86400');   // private : le CDN de Hostinger ne garde jamais une page pour tout le monde
if (ga_active()) header('X-Robots-Tag: noindex, nofollow');
header('Content-Length: ' . filesize($fichier));
readfile($fichier);
