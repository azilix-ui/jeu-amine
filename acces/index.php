<?php
/*
 * Famille Missaoui — la page « accès réservé ».
 * Montrée à un appareil inconnu quand la protection est activée. L'administrateur (Anis) s'y connecte avec son identifiant
 * et son mot de passe ; l'appareil devient alors de confiance. Les invités, eux, ouvrent le lien d'invitation reçu.
 * Première fois (pas encore de compte administrateur) : on crée le compte, avec le mot de passe parent comme preuve.
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');

$suite = (string)($_GET['suite'] ?? $_POST['suite'] ?? '/');
if ($suite === '' || $suite[0] !== '/' || (strlen($suite) > 1 && ($suite[1] === '/' || $suite[1] === '\\')) || preg_match('/[\r\n]/', $suite)) $suite = '/';   // seulement une page de ce site
if (isset($_GET['etat'])) { header('Content-Type: application/json'); echo json_encode(['entre' => ga_peut_entrer()]); exit; }   // la page d'attente demande toutes les 5 s si Anis a accepté
$admin = ga_admin_fiche();
$creation = empty($admin['hash']);
$message = ''; $ok = ''; $msgDem = '';
$raison = (string)($_GET['raison'] ?? '');
if ($raison === 'invitation') $message = "Ce lien d'invitation n'est plus valable (trop ancien, déjà utilisé ou supprimé). Demande un nouveau lien à Anis.";
if (isset($_GET['sortie'])) $ok = 'Tu es déconnecté de l\'administration.';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' && ($_POST['quoi'] ?? '') === 'demande') {   // « Demander l'accès à Anis » avec son prénom
    $p = trim((string)($_POST['prenom'] ?? ''));
    if ($p === '') $msgDem = 'Écris ton prénom pour qu\'Anis te reconnaisse.'; else ga_note_demande('', $p);
    $_POST = [];
} elseif (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    try {
        if (ga_trop_essais()) { $message = "Trop d'essais. Réessaie dans 15 minutes."; }
        elseif ($creation) {
            // création du compte administrateur : le mot de passe parent (Progression, voix de Nahki) prouve que c'est bien la famille
            $auth = json_decode((string)@file_get_contents(dirname(ga_racine()) . '/nahki-voix/auth.json'), true);
            $id = trim((string)($_POST['id'] ?? '')); $pw = (string)($_POST['pw'] ?? ''); $pw2 = (string)($_POST['pw2'] ?? '');
            if (empty($auth['hash'])) $message = "Crée d'abord le mot de passe parent dans la page Progression.";
            elseif (!password_verify((string)($_POST['parent'] ?? ''), (string)$auth['hash'])) { ga_note_echec(); $message = 'Le mot de passe parent ne va pas.'; }
            elseif (!preg_match('/^[\p{L}0-9._@-]{3,40}$/u', $id)) $message = "L'identifiant doit faire de 3 à 40 lettres ou chiffres (sans espace).";
            elseif (mb_strlen($pw) < 10) $message = 'Le mot de passe administrateur doit faire au moins 10 caractères.';
            elseif ($pw !== $pw2) $message = 'Les deux mots de passe ne sont pas pareils.';
            elseif (!$creation = empty(ga_admin_fiche()['hash'])) $message = 'Le compte existe déjà.';
            else {
                ga_admin_ecrit(['id' => $id, 'hash' => password_hash($pw, PASSWORD_DEFAULT), 'cree' => date('c')]);
                ga_ouvre_session_admin(); if (!ga_appareil()) ga_nouvel_appareil('admin', GA_ANNEE);
                header('Location: /acces/admin.php?bienvenue=1', true, 303); exit;
            }
        } else {
            $id = trim((string)($_POST['id'] ?? '')); $pw = (string)($_POST['pw'] ?? '');
            if (!hash_equals(mb_strtolower((string)$admin['id']), mb_strtolower($id)) | !password_verify($pw, (string)$admin['hash'])) { ga_note_echec(); $message = 'Identifiant ou mot de passe incorrect.'; }
            else {
                ga_ouvre_session_admin();
                if (!ga_appareil()) ga_nouvel_appareil('admin', GA_ANNEE);   // l'appareil où Anis se connecte devient de confiance pour un an
                header('Location: ' . (($_POST['vers'] ?? '') === 'admin' ? '/acces/admin.php' : $suite), true, 303); exit;
            }
        }
    } catch (Throwable $e) { error_log('acces : ' . $e->getMessage()); $message = "Le serveur n'a pas pu enregistrer. Réessaie dans un moment."; }
}
$pourAdmin = isset($_GET['admin']) || ($_POST['vers'] ?? '') === 'admin';
$dedans = !$pourAdmin && (!$creation && !ga_active() || ga_appareil() || ga_admin() || (ga_active() && ga_peut_entrer()));
$dem = (!$dedans && !$creation && ga_active()) ? (ga_demande() ?: ga_note_demande('')) : null;
$attente = $dem && $dem['statut'] === 'attente';
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Accès réservé · Famille Missaoui</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%8F%A0%3C/text%3E%3C/svg%3E">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
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
  <span class="cadenas">🔒 Accès réservé</span>
  <h1>Famille Missaoui<span>.</span></h1>
<?php if ($dedans && !$_POST): ?>
  <p class="sous">Cet appareil a déjà accès au site de la famille.</p>
  <?php if ($ok): ?><div class="msg ok"><?= ga_h($ok) ?></div><?php endif; ?>
  <a class="retour" href="<?= ga_h($suite) ?>">Entrer sur le site →</a>
  <p class="pied"><a href="/acces/admin.php">Administration de l'accès</a></p>
<?php elseif ($creation): ?>
  <p class="sous">Première fois : crée le compte administrateur du site. Il servira à protéger le site et à inviter des proches.</p>
  <form class="carte" method="post" autocomplete="off">
    <h2>Créer le compte administrateur</h2>
    <p>Pour prouver que c'est bien toi, il faut le <b>mot de passe parent</b> (celui de la page Progression).</p>
    <?php if ($message): ?><div class="msg" role="alert"><?= ga_h($message) ?></div><?php endif; ?>
    <label>Mot de passe parent<input type="password" name="parent" required autocomplete="current-password"></label>
    <label>Ton identifiant<input name="id" required minlength="3" maxlength="40" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
    <label>Ton mot de passe administrateur (10 caractères au moins)<input type="password" name="pw" required minlength="10" autocomplete="new-password"></label>
    <label>Encore une fois<input type="password" name="pw2" required minlength="10" autocomplete="new-password"></label>
    <button type="submit">Créer mon compte</button>
  </form>
<?php else: ?>
  <p class="sous"><?= $pourAdmin ? 'Connecte-toi pour gérer l\'accès au site.' : 'Ce site est celui de la famille : il est ouvert seulement aux appareils de la maison et aux proches invités.' ?></p>
  <?php if (!$pourAdmin): ?><div class="carte" style="gap:12px">
    <div class="invit"><span style="font-size:28px" aria-hidden="true">💌</span><span><b>Tu as reçu une invitation ?</b>Ouvre simplement le lien qu'Anis t'a envoyé : il t'ouvre la porte.</span></div>
    <?php if ($attente): ?>
    <div class="invit" style="background:#e3f4ea;color:#1f6b44" role="status"><span style="font-size:28px" aria-hidden="true">⏳</span><span><b>Demande envoyée à Anis, <?= ga_h($dem['nom']) ?> !</b>Garde cette page ouverte : elle s'ouvrira toute seule dès qu'il accepte (tu peux aussi revenir plus tard).</span></div>
    <script>setInterval(async () => { try { const r = await fetch('/acces/?etat=1', { cache:'no-store', credentials:'same-origin' }); if((await r.json()).entre) location.href = <?= json_encode($suite) ?>; } catch(e){} }, 5000);</script>
    <?php elseif ($dem): ?>
    <form method="post" style="display:flex;flex-direction:column;gap:10px">
      <input type="hidden" name="quoi" value="demande"><input type="hidden" name="suite" value="<?= ga_h($suite) ?>">
      <?php if ($msgDem): ?><div class="msg" role="alert"><?= ga_h($msgDem) ?></div><?php endif; ?>
      <label>Pas d'invitation ? Demande l'accès à Anis<input name="prenom" maxlength="40" placeholder="Ton prénom" autocomplete="given-name" required></label>
      <button type="submit" style="background:var(--gold);box-shadow:0 6px 0 #c99a00;color:#3a2600">🛎️ Frapper à la porte</button>
    </form>
    <?php endif; ?>
  </div><?php endif; ?>
  <form class="carte" method="post">
    <h2>Connexion administrateur</h2>
    <?php if ($message): ?><div class="msg" role="alert"><?= ga_h($message) ?></div><?php endif; ?>
    <?php if ($ok): ?><div class="msg ok"><?= ga_h($ok) ?></div><?php endif; ?>
    <input type="hidden" name="suite" value="<?= ga_h($suite) ?>">
    <?php if ($pourAdmin): ?><input type="hidden" name="vers" value="admin"><?php endif; ?>
    <label>Identifiant<input name="id" required autocomplete="username" autocapitalize="none" spellcheck="false"></label>
    <label>Mot de passe<input type="password" name="pw" required autocomplete="current-password"></label>
    <button type="submit">Entrer</button>
  </form>
<?php endif; ?>
  <p class="pied">© 2026 Anis Missaoui · Famille Missaoui</p>
</main>
</body>
</html>
