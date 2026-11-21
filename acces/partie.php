<?php
/*
 * Famille Missaoui — un laissez-passer de partie (/acces/partie.php?c=…, 21/11/2026, demandé par le papa).
 * Anis invite un ami à UN jeu (depuis la Chkobba en ligne, ou l'administration). Comme pour les invitations, c'est le bouton
 * « Jouer » qui donne l'accès (pas l'aperçu automatique de WhatsApp). Un seul appareil, valable 3 heures après la création du lien.
 * L'appareil reçoit le cookie mf_partie : il n'ouvre que ce jeu (voir ga_passe dans garde.php et acces/porte.php).
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');

$code = (string)($_GET['c'] ?? $_POST['c'] ?? '');
$p = null;
try {
    if (preg_match('/^[A-Za-z0-9_-]{20,64}$/', $code)) { $s = ga_db()->prepare('SELECT * FROM passes WHERE code = ?'); $s->execute([$code]); $p = $s->fetch() ?: null; }
    $ok = $p && !$p['revoque'] && (int)$p['expire'] > time() && isset(GA_PASSE_JEUX[$p['jeu']]);
    if ($ok && (ga_appareil() || ga_admin())) { header('Location: ' . ga_passe_page($p), true, 303); exit; }   // la famille (Anis qui essaie son lien)
    $deja = ga_passe();
    if ($ok && $deja && (int)$deja['id'] === (int)$p['id']) { header('Location: ' . ga_passe_page($p), true, 303); exit; }   // déjà entré avec ce lien
    if ($ok && $p['utilise']) $ok = false;   // un seul appareil
    if ($ok && ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
        $jeton = bin2hex(random_bytes(32));
        $u = ga_db()->prepare('UPDATE passes SET hash = ?, utilise = ?, ip = ?, ua = ? WHERE id = ? AND utilise IS NULL AND revoque = 0');
        $u->execute([hash('sha256', $jeton), time(), ga_ip(), ga_ua(), $p['id']]);
        if ($u->rowCount() === 1) {
            ga_cookie(GA_COOKIE_PASSE, $jeton, (int)$p['expire']);
            header('Location: ' . ga_passe_page($p), true, 303); exit;
        }
        $ok = false;
    }
} catch (Throwable $e) { error_log('partie : ' . $e->getMessage()); $ok = false; }
$jeu = $p && isset(GA_PASSE_JEUX[$p['jeu']]) ? GA_PASSE_JEUX[$p['jeu']][0] : 'un jeu';
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Invitation à jouer · Famille Missaoui</title>
<meta property="og:title" content="Invitation à jouer · Famille Missaoui">
<meta property="og:description" content="Anis t'invite à faire une partie.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
</head>
<body>
<main class="porte">
  <div class="famille" aria-hidden="true"><img src="/jeux/avatars/anis.webp" alt="" style="--i:0;--c:#0f766e" width="84" height="84"></div>
<?php if ($ok): ?>
  <span class="cadenas">🎮 Invitation à jouer</span>
  <h1>Salut <?= ga_h($p['nom']) ?> !</h1>
  <p class="sous">Anis t'invite à faire une partie de <b><?= ga_h($jeu) ?></b>. Ton invitation marche jusqu'à <b><?= date('H:i', (int)$p['expire']) ?></b> (heure de Paris), sur cet appareil seulement.<br><small>Le site note ton prénom et ta visite : voir les <a href="/acces/mentions.php" style="color:inherit">mentions légales</a>.</small></p>
  <form method="post" style="width:100%;display:flex;justify-content:center">
    <input type="hidden" name="c" value="<?= ga_h($code) ?>">
    <button type="submit" style="padding:0 34px">Jouer →</button>
  </form>
<?php else: ?>
  <span class="cadenas">⏰ Invitation terminée</span>
  <h1>Oups !</h1>
  <p class="sous">Cette invitation à jouer n'est plus valable : elle a déjà servi sur un autre appareil, ou les 3 heures sont passées. Demande un nouveau lien à Anis.</p>
<?php endif; ?>
  <p class="pied">© 2026 Anis Missaoui · Famille Missaoui · <a href="/acces/mentions.php" style="color:inherit">Mentions légales et vie privée</a></p>
</main>
</body>
</html>
