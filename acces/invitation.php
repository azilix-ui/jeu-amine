<?php
/*
 * Famille Missaoui — un lien d'invitation (/acces/invitation.php?c=…), créé par Anis dans acces/admin.php.
 * Ouvrir le lien montre une page d'accueil avec un bouton « Entrer » : c'est le bouton (et pas la simple ouverture du lien)
 * qui donne l'accès, sinon l'aperçu automatique de WhatsApp ou des SMS « utiliserait » une invitation à usage unique.
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');

$code = (string)($_GET['c'] ?? $_POST['c'] ?? '');
$inv = null;
try {
    if (preg_match('/^[A-Za-z0-9_-]{20,64}$/', $code)) {
        $s = ga_db()->prepare('SELECT * FROM invitations WHERE code = ?'); $s->execute([$code]); $inv = $s->fetch() ?: null;
    }
    $valable = $inv && !$inv['revoque'] && (int)$inv['lien_expire'] > time() && ((int)$inv['usages_max'] === 0 || (int)$inv['usages'] < (int)$inv['usages_max']);
    if (ga_appareil() || ga_admin()) { header('Location: /', true, 303); exit; }   // déjà de confiance
    if (!$valable) { header('Location: /acces/?raison=invitation', true, 303); exit; }
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $db = ga_db(); $db->beginTransaction();
        $u = $db->prepare('UPDATE invitations SET usages = usages + 1 WHERE id = ? AND (usages_max = 0 OR usages < usages_max)'); $u->execute([$inv['id']]);
        if ($u->rowCount() !== 1) { $db->rollBack(); header('Location: /acces/?raison=invitation', true, 303); exit; }
        ga_nouvel_appareil('invitation', (int)$inv['duree'], (int)$inv['id'], trim(($inv['nom'] ? $inv['nom'] . ' · ' : '') . ga_nom_appareil(ga_ua())));
        $db->commit();
        header('Location: /', true, 303); exit;
    }
} catch (Throwable $e) { error_log('invitation : ' . $e->getMessage()); header('Location: /acces/?raison=invitation', true, 303); exit; }
$d = (int)$inv['duree'];
$duree = $d >= 300 * 86400 ? 'un an' : ($d >= 86400 ? round($d / 86400) . ' jour' . ($d >= 2 * 86400 ? 's' : '') : round($d / 3600) . ' heure' . ($d >= 7200 ? 's' : ''));
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Invitation · Famille Missaoui</title>
<meta property="og:title" content="Invitation · Famille Missaoui">
<meta property="og:description" content="Anis t'invite sur le site de jeux de la famille Missaoui.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%8F%A0%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
</head>
<body>
<main class="porte">
  <div class="famille" aria-hidden="true">
    <img src="/jeux/avatars/anis.webp" alt="" style="--i:0;--c:#0f766e" width="84" height="84">
    <img src="/jeux/avatars/imen.webp" alt="" style="--i:1;--c:#b4235a" width="84" height="84">
    <img src="/jeux/avatars/essil.webp" alt="" style="--i:2;--c:#7395e8" width="84" height="84">
    <img src="/jeux/avatars/salma.webp" alt="" style="--i:3;--c:#4fbf82" width="84" height="84">
    <img src="/jeux/avatars/amine.webp" alt="" style="--i:4;--c:#ff8c1a" width="84" height="84">
  </div>
  <span class="cadenas">💌 Invitation</span>
  <h1>Bienvenue<?= $inv['nom'] ? ', ' . ga_h($inv['nom']) : '' ?> !</h1>
  <p class="sous">Anis t'invite sur le site de jeux de la famille Missaoui. Cet appareil aura accès au site pendant <b><?= ga_h($duree) ?></b>.</p>
  <form method="post" style="width:100%;display:flex;justify-content:center">
    <input type="hidden" name="c" value="<?= ga_h($code) ?>">
    <button type="submit" style="padding:0 34px">Entrer sur le site →</button>
  </form>
  <p class="pied">© 2026 Anis Missaoui · Famille Missaoui</p>
</main>
</body>
</html>
