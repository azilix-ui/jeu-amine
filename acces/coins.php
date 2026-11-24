<?php
/*
 * Famille Missaoui — « Tes coins du site » (24/11) : ce que voit un invité dont le lien d'invitation n'ouvre que certains coins.
 * Servie par acces/porte.php à la place de l'accueil, et à la place de toute page qui n'est pas dans ses coins.
 */
declare(strict_types=1);

function ga_page_coins(array $coins, bool $ferme): void {
    $l = ga_coins_liste(); $nom = '';
    try { $a = ga_appareil(); if ($a && $a['invitation']) { $s = ga_db()->prepare('SELECT nom FROM invitations WHERE id = ?'); $s->execute([(int)$a['invitation']]); $nom = (string)$s->fetchColumn(); } } catch (Throwable $e) {}
    $btn = '';
    foreach ($coins as $k) {
        if (!isset($l[$k])) continue; [$titre, $emo, $pages] = $l[$k];
        $btn .= '<a class="coin" href="' . ga_h($pages[0]) . '"><span>' . $emo . '</span>' . ga_h($titre) . '</a>';
    }
    http_response_code($ferme ? 403 : 200);
    header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow');
    ?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Tes coins du site · Famille Missaoui</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
<style>
.coins{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;width:100%}
.coin{display:flex;align-items:center;gap:12px;min-height:64px;padding:12px 16px;border-radius:18px;background:#f5f7fb;color:var(--ink);font-weight:800;font-size:18px;text-decoration:none;border:2px solid var(--line)}
.coin:hover,.coin:focus-visible{border-color:#2e9e6e}
.coin span{font-size:30px}
.ferme{background:#fff7dd;color:#3a2600;border-radius:16px;padding:12px 14px;line-height:1.45;width:100%}
</style>
</head>
<body>
<main class="porte">
  <h1><?= $nom !== '' ? 'Bienvenue, ' . ga_h($nom) . ' !' : 'Bienvenue !' ?></h1>
  <?php if ($ferme): ?><p class="ferme">🔒 Ce coin du site n'est pas ouvert pour toi. Voici ceux que tu peux visiter :</p>
  <?php else: ?><p>Voici les coins du site de la famille Missaoui ouverts pour toi :</p><?php endif; ?>
  <?php if ($btn !== ''): ?><div class="coins"><?= $btn ?></div>
  <?php else: ?><p class="ferme">Aucun coin n'est encore ouvert pour toi : demande à Anis.</p><?php endif; ?>
  <p style="color:var(--soft);font-size:14px">Famille Missaoui · © 2026 Anis Missaoui</p>
</main>
</body>
</html>
<?php
}
