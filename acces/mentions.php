<?php
/*
 * Famille Missaoui — mentions légales et vie privée (21/11/2026, demandées par le papa).
 * Ouverte à tous (hors de la porte), comme la loi le demande (LCEN : identifier l'éditeur et l'hébergeur).
 * L'adresse de contact n'est jamais écrite dans le code (le dépôt est public) : c'est l'e-mail des alertes
 * réglé par Anis dans l'administration (reglages.alerte_email), affiché en clair seulement après un clic (contre les robots).
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-cache');
header('X-Frame-Options: DENY');
$mail = '';
try { $m = (string)ga_reglage('alerte_email'); if (filter_var($m, FILTER_VALIDATE_EMAIL)) $mail = $m; } catch (Throwable $e) {}
$code = $mail === '' ? '' : base64_encode(strrev($mail));
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Mentions légales · Famille Missaoui</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%E2%9A%96%EF%B8%8F%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
<style>
body{align-items:flex-start}
.porte.large{width:min(860px,100%);gap:18px}
.tete{display:flex;align-items:center;gap:14px;width:100%;justify-content:space-between;flex-wrap:wrap}
.tete h1{font-size:clamp(28px,6vw,40px);text-align:left;margin:0}
.petit{font:inherit;font-weight:800;font-size:15px;min-height:44px;padding:0 16px;border-radius:14px;border:0;background:#ffffff1c;color:#fbf6ea;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.carte{line-height:1.6;width:100%;box-sizing:border-box}
.carte h2{margin:0 0 8px}
.carte p{margin:6px 0}
.carte ul{margin:6px 0;padding-left:22px}
.carte li{margin:4px 0}
table{border-collapse:collapse;width:100%;font-size:15px}
td,th{border-bottom:1px solid var(--line);padding:8px 6px;text-align:left;vertical-align:top}
th{font-size:13px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em}
.scroll{overflow-x:auto}
#voirMail{font:inherit;font-weight:800;min-height:44px;padding:0 16px;border-radius:14px;border:2px solid var(--line);background:#f5f7fb;color:var(--ink);cursor:pointer}
.pied{color:#fbf6eaaa;font-size:14px;text-align:center;width:100%}
</style>
</head>
<body>
<main class="porte large">
  <div class="tete">
    <h1>⚖️ Mentions légales et vie privée</h1>
    <a class="petit" href="/">← Le site</a>
  </div>

  <section class="carte">
    <h2>L'éditeur du site</h2>
    <p><b>missaoui-family.com</b> est le site privé de la famille Missaoui : des cours et des jeux faits sur mesure pour les enfants de la famille, pour apprendre en s'amusant. Ce n'est pas un site commercial : rien n'y est vendu, il n'y a pas de publicité.</p>
    <p>Éditeur et directeur de la publication : <b>Anis Missaoui</b>, particulier.</p>
    <p>Contact : <?php if ($code !== ''): ?><button type="button" id="voirMail" data-c="<?= ga_h($code) ?>">✉️ Afficher l'adresse e-mail</button><?php else: ?>par l'administrateur du site, Anis Missaoui.<?php endif; ?></p>
  </section>

  <section class="carte">
    <h2>L'hébergeur</h2>
    <p><b>Hostinger International Ltd</b>, 61 Lordou Vironos Street, 6023 Larnaca, Chypre — <a href="https://www.hostinger.fr" rel="noopener">www.hostinger.fr</a>.</p>
  </section>

  <section class="carte">
    <h2>Un site à accès réservé</h2>
    <p>Le site n'est ouvert qu'à la famille et aux personnes qu'elle invite (appareils de la maison, liens d'invitation, appareils acceptés par l'administrateur). Les autres visiteurs ne voient que la page « Accès réservé ».</p>
  </section>

  <section class="carte">
    <h2>Vie privée : ce que le site garde</h2>
    <div class="scroll"><table>
      <thead><tr><th>Quoi</th><th>Pourquoi</th><th>Combien de temps</th></tr></thead>
      <tbody>
        <tr><td>Le prénom ou le pseudo choisi, l'avatar, les progrès dans les cours, les étoiles, les records, le temps de jeu</td><td>Faire marcher les cours et les jeux, retrouver ses progrès sur une autre tablette, suivi des enfants par leurs parents</td><td>Tant que le site existe (effaçable sur demande)</td></tr>
        <tr><td>Le journal des visites : adresse IP, pays et ville approximatifs (obtenus auprès du service ip-api.com), fournisseur d'accès, appareil, pages ouvertes, d'où vient la visite (lien d'invitation, autre site…)</td><td>Sécurité du site et suivi par les parents</td><td>60 jours, puis effacé</td></tr>
        <tr><td>Les messages du salon et des jeux en ligne</td><td>Discuter en famille ; les parents peuvent les relire</td><td>Les 600 derniers messages</td></tr>
        <tr><td>Les appareils de confiance et les invitations</td><td>La porte du site</td><td>La durée de l'accès donné (1 jour à 1 an)</td></tr>
      </tbody>
    </table></div>
    <p>Ces données ne sont vues que par les parents (Anis et Imen). Elles ne sont ni vendues ni données à quiconque ; seul le service ip-api.com reçoit les adresses IP pour indiquer le pays et la ville.</p>
  </section>

  <section class="carte">
    <h2>Les cookies</h2>
    <p>Le site n'utilise que des cookies <b>strictement nécessaires</b> à son fonctionnement : la carte de confiance de l'appareil (porte du site), la session de chacun, la connexion de l'administrateur et le mode « explorateur ». Les progrès des cours sont aussi gardés dans la tablette (stockage local). Aucun cookie de publicité, de réseau social ni de mesure d'audience extérieure : c'est pourquoi aucun bandeau ne demande votre accord.</p>
  </section>

  <section class="carte">
    <h2>Les enfants et les images</h2>
    <p>Les enfants apparaissent sur le site avec l'accord de leurs parents, sous forme d'<b>avatars dessinés</b> : aucune photo d'enfant, aucun document scolaire n'est publié. Les images, dessins animés et voix sont fabriqués pour le site (outils d'intelligence artificielle) ; aucun personnage protégé n'est utilisé.</p>
  </section>

  <section class="carte">
    <h2>Vos droits</h2>
    <p>Vous pouvez demander à voir, corriger ou effacer les données qui vous concernent (par exemple votre pseudo et votre journal de visites si vous avez été invité), ou vous opposer à leur conservation : écrivez à l'éditeur (adresse ci-dessus). Vous pouvez aussi vous adresser à la CNIL (<a href="https://www.cnil.fr" rel="noopener">www.cnil.fr</a>).</p>
  </section>

  <section class="carte">
    <h2>Droits d'auteur</h2>
    <p>© 2026 Anis Missaoui · Famille Missaoui · <b>Tous droits réservés</b>. Les cours, les jeux, les textes, les images, les dessins animés et les sons du site ne peuvent pas être copiés ni réutilisés sans l'accord de l'éditeur. Les bibliothèques libres utilisées (Three.js, Rapier, scroll-craft…) gardent leur propre licence.</p>
  </section>

  <p class="pied">Mise à jour : 21 novembre 2026</p>
</main>
<script>
(function(){ var b = document.getElementById('voirMail'); if(!b) return;
  b.onclick = function(){ var m = atob(b.dataset.c).split('').reverse().join(''), a = document.createElement('a'); a.href = 'mailto:' + m; a.textContent = m; b.replaceWith(a); };
})();
</script>
</body>
</html>
