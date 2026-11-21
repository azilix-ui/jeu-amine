<?php
/*
 * Famille Missaoui — l'administration de l'accès au site (Anis seulement).
 * GET : la page. POST (fetch, en-tête X-Garde) : les actions, réponses en JSON.
 *   etat · activer(on) · ip_ajoute(ip?, nom) · ip_supprime(id) · appareil_renomme(id, nom) · appareil_revoque(id)
 *   invitation_cree(nom, lien, duree, usages) · invitation_supprime(id) · mdp(ancien, nouveau) · sortir
 *   sauvegarde (en faire une maintenant) · alertes(email, email_on, ntfy_on) · alerte_essai · ntfy_nouveau
 *   GET ?telecharger=sauvegarde-AAAA-MM-JJ.zip : télécharge une sauvegarde
 *   voix(cle?, max?) : la clé API ElevenLabs des voix des cours (jamais renvoyée) et le plafond de caractères par mois
 *   demande_accepte(id, duree) · demande_ignore(id) : les appareils inconnus qui ont frappé à la porte (cookie mf_demande)
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');

function ga_etat_admin(): array {
    $admin = ga_admin_fiche(); $db = ga_db(); $t = time();
        $moi = ga_appareil(); $ip = ga_ip();
        $schema = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
        $base = $schema . '://' . ($_SERVER['HTTP_HOST'] ?? 'www.missaoui-family.com');
        $invs = $db->query('SELECT i.*, (SELECT COUNT(*) FROM appareils a WHERE a.invitation = i.id AND a.revoque = 0 AND a.expire > ' . $t . ') AS actifs FROM invitations i WHERE i.revoque = 0 ORDER BY i.cree DESC LIMIT 60')->fetchAll();
        foreach ($invs as &$v) { $v['lien'] = $base . '/acces/invitation.php?c=' . $v['code']; unset($v['code']); } unset($v);
        return [
            'actif' => ga_reglage('actif') === '1', 'secours' => is_file(ga_donnees() . '/acces-ouvert'), 'admin' => $admin['id'],
            'ip' => $ip, 'ip_maison' => ga_ip_maison($ip), 'moi' => $moi ? (int)$moi['id'] : 0,
            'brut' => ['remote' => (string)($_SERVER['REMOTE_ADDR'] ?? ''), 'xff' => (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''), 'cf' => (string)($_SERVER['HTTP_CF_CONNECTING_IP'] ?? ''), 'real' => (string)($_SERVER['HTTP_X_REAL_IP'] ?? '')],
            'ips' => $db->query('SELECT id, ip, nom, cree FROM ips ORDER BY cree')->fetchAll(),
            'appareils' => $db->query('SELECT id, nom, via, invitation, cree, expire, vu, ip, ua FROM appareils WHERE revoque = 0 AND expire > ' . $t . ' ORDER BY vu DESC')->fetchAll(),
            'invitations' => $invs,
            'passes' => (function() use ($db, $t, $base){ $l = $db->query('SELECT id, code, nom, jeu, tab, cree, expire, utilise FROM passes WHERE revoque = 0 AND expire > ' . $t . ' ORDER BY cree DESC LIMIT 40')->fetchAll();
                foreach ($l as &$x) { $x['lien'] = $base . '/acces/partie.php?c=' . $x['code']; $x['nomjeu'] = GA_PASSE_JEUX[$x['jeu']][0] ?? $x['jeu']; unset($x['code']); } unset($x); return $l; })(),
            'jeux_passe' => array_map(fn($k, $v) => [$k, $v[0]], array_keys(GA_PASSE_JEUX), GA_PASSE_JEUX),
            'sauvegardes' => ga_liste_sauvegardes(), 'zip' => class_exists('ZipArchive'),
            'alertes' => ['email' => (string)ga_reglage('alerte_email'), 'email_on' => ga_reglage('alerte_email_on') !== '0', 'ntfy' => ga_canal_ntfy(), 'ntfy_on' => ga_reglage('alerte_ntfy_on') !== '0'],
            'demandes' => $db->query("SELECT id, nom, statut, duree, cree, vu, ip, ua, page, pages FROM demandes WHERE statut IN ('vu', 'attente', 'accepte') AND vu > " . ($t - 30 * 86400) . " ORDER BY (statut = 'attente') DESC, vu DESC LIMIT 60")->fetchAll(),
            'refus' => $db->query('SELECT ts, ip, page, ua FROM refus ORDER BY ts DESC LIMIT 80')->fetchAll(),
            'voix' => (function(){ [$m, $n] = array_pad(explode(':', (string)ga_reglage('voix_compteur')), 2, '0'); $d = ga_donnees() . '/voix-cache'; $nb = 0; if (is_dir($d)) foreach (glob($d . '/*/*.mp3') ?: [] as $x) $nb++;
                return ['cle' => (string)ga_reglage('elevenlabs_cle') !== '', 'max' => (int)(ga_reglage('voix_max') ?: 100000), 'mois' => $m === ga_voix_periode() ? (int)$n : 0, 'phrases' => $nb, 'erreur' => (string)ga_reglage('voix_erreur')]; })(),
        ];
}
function rep(int $code, array $d): void { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
$admin = ga_admin_fiche();
if (empty($admin['hash'])) { header('Location: /acces/', true, 303); exit; }

if (isset($_GET['telecharger'])) {   // une sauvegarde, pour Anis seulement
    $n = basename((string)$_GET['telecharger']); $f = ga_dossier_sauvegardes() . '/' . $n;
    if (!ga_admin() || !preg_match('/^sauvegarde-\d{4}-\d{2}-\d{2}\.zip$/', $n) || !is_file($f)) { http_response_code(404); exit('Sauvegarde introuvable.'); }
    header('Content-Type: application/zip'); header('Content-Disposition: attachment; filename="famille-missaoui-' . $n . '"'); header('Content-Length: ' . filesize($f));
    readfile($f); exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (($_SERVER['HTTP_X_GARDE'] ?? '') !== '1') rep(400, ['error' => 'Requête refusée.']);
    if (!ga_admin()) rep(401, ['error' => 'Ta connexion a expiré : reconnecte-toi.']);
    $in = json_decode((string)file_get_contents('php://input'), true) ?: [];
    $a = (string)($in['action'] ?? ''); $db = ga_db(); $t = time();
    $id = (int)($in['id'] ?? 0); $nom = mb_substr(trim((string)($in['nom'] ?? '')), 0, 60);
    try {
        if ($a === 'activer') {
            if (!empty($in['on']) && !ga_appareil()) rep(400, ['error' => "Cet appareil n'est pas encore de confiance : recharge la page puis réessaie."]);
            ga_reglage('actif', !empty($in['on']) ? '1' : '0');
        } elseif ($a === 'ip_ajoute') {
            $ip = trim((string)($in['ip'] ?? '')) ?: ga_ip();
            if (!filter_var($ip, FILTER_VALIDATE_IP)) rep(400, ['error' => "Cette adresse IP n'est pas valable."]);
            $db->prepare('INSERT INTO ips (ip, nom, cree) VALUES (?, ?, ?)')->execute([$ip, $nom ?: 'Maison', $t]);
        } elseif ($a === 'ip_supprime') {
            $db->prepare('DELETE FROM ips WHERE id = ?')->execute([$id]);
        } elseif ($a === 'appareil_renomme') {
            $db->prepare('UPDATE appareils SET nom = ? WHERE id = ?')->execute([$nom ?: 'Appareil', $id]);
        } elseif ($a === 'appareil_revoque') {
            $db->prepare('UPDATE appareils SET revoque = 1 WHERE id = ?')->execute([$id]);
        } elseif ($a === 'sauvegarde') {
            if (!ga_sauvegarde()) rep(500, ['error' => "La sauvegarde n'a pas pu être faite."]);
        } elseif ($a === 'alertes') {
            $m = trim((string)($in['email'] ?? ''));
            if ($m !== '' && !filter_var($m, FILTER_VALIDATE_EMAIL)) rep(400, ['error' => "Cette adresse e-mail n'est pas valable."]);
            ga_reglage('alerte_email', $m); ga_reglage('alerte_email_on', !empty($in['email_on']) ? '1' : '0'); ga_reglage('alerte_ntfy_on', !empty($in['ntfy_on']) ? '1' : '0');
        } elseif ($a === 'alerte_essai') {
            $r = ga_alerte('🛎️ Essai : quelqu\'un frappe à la porte', "Ceci est un essai depuis l'administration du site. Les vraies alertes arrivent quand un appareil inconnu écrit son prénom et frappe à la porte.", true);
            $e0 = ga_etat_admin(); $e0['essai'] = $r; rep(200, $e0);
        } elseif ($a === 'voix') {
            $c = trim((string)($in['cle'] ?? ''));
            if ($c !== '') { if (!preg_match('/^[A-Za-z0-9_\-]{20,120}$/', $c)) rep(400, ['error' => "Cette clé ne ressemble pas à une clé ElevenLabs."]); ga_reglage('elevenlabs_cle', $c); ga_reglage('voix_erreur', ''); }
            if (!empty($in['oublie'])) ga_reglage('elevenlabs_cle', '');
            if (isset($in['max'])) ga_reglage('voix_max', (string)max(0, min(200000, (int)$in['max'])));
        } elseif ($a === 'ntfy_nouveau') {
            ga_reglage('alerte_ntfy', 'missaoui-' . bin2hex(random_bytes(8)));
        } elseif ($a === 'demande_accepte') {
            $duree = max(86400, min(GA_ANNEE, (int)($in['duree'] ?? GA_ANNEE)));
            $db->prepare("UPDATE demandes SET statut = 'accepte', duree = ? WHERE id = ? AND statut IN ('vu', 'attente', 'ignore')")->execute([$duree, $id]);
        } elseif ($a === 'demande_ignore') {
            $db->prepare("UPDATE demandes SET statut = 'ignore' WHERE id = ?")->execute([$id]);
        } elseif ($a === 'invitation_cree') {
            if ($nom === '') rep(400, ['error' => "Écris d'abord le prénom de la personne invitée."]);   // 20/11 : il arrive sur le site avec ce prénom
            if (function_exists('ga_qui_nom_invite') && ga_qui_nom_invite($nom) === null) rep(400, ['error' => "Ce prénom ne va pas pour un invité (pas celui de quelqu'un de la famille, des lettres seulement)."]);
            $lien = max(600, min(30 * 86400, (int)($in['lien'] ?? 86400)));
            $duree = max(3600, min(GA_ANNEE, (int)($in['duree'] ?? 7 * 86400)));
            $usages = max(0, min(50, (int)($in['usages'] ?? 1)));
            $code = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
            $db->prepare('INSERT INTO invitations (code, nom, cree, lien_expire, duree, usages_max) VALUES (?, ?, ?, ?, ?, ?)')->execute([$code, $nom, $t, $t + $lien, $duree, $usages]);
        } elseif ($a === 'passe_cree') {   // 21/11 : inviter un ami à UN jeu, 3 heures
            try { ga_passe_cree((string)($in['jeu'] ?? ''), $nom); } catch (RuntimeException $e) { rep(400, ['error' => $e->getMessage()]); }
        } elseif ($a === 'passe_supprime') {
            $db->prepare('UPDATE passes SET revoque = 1 WHERE id = ?')->execute([$id]);
        } elseif ($a === 'invitation_supprime') {
            $db->prepare('UPDATE invitations SET revoque = 1 WHERE id = ?')->execute([$id]);
            $db->prepare('UPDATE appareils SET revoque = 1 WHERE invitation = ?')->execute([$id]);   // les invités entrés avec ce lien n'ont plus accès
        } elseif ($a === 'mdp') {
            if (!password_verify((string)($in['ancien'] ?? ''), (string)$admin['hash'])) { ga_note_echec(); rep(400, ['error' => "L'ancien mot de passe ne va pas."]); }
            $n = (string)($in['nouveau'] ?? ''); if (mb_strlen($n) < 10) rep(400, ['error' => 'Le nouveau mot de passe doit faire au moins 10 caractères.']);
            $admin['hash'] = password_hash($n, PASSWORD_DEFAULT); ga_admin_ecrit($admin);
        } elseif ($a === 'sortir') {
            $db->prepare('DELETE FROM sessions WHERE hash = ?')->execute([hash('sha256', (string)($_COOKIE[GA_COOKIE_ADMIN] ?? ''))]);
            ga_cookie(GA_COOKIE_ADMIN, '', 1, 'Strict'); rep(200, ['ok' => true]);
        } elseif ($a !== 'etat') rep(400, ['error' => 'Action inconnue.']);

        rep(200, ga_etat_admin());
    } catch (Throwable $e) { error_log('admin acces : ' . $e->getMessage()); rep(500, ['error' => "Le serveur n'a pas pu enregistrer."]); }
}
if (!ga_admin()) { header('Location: /acces/?admin=1', true, 303); exit; }
if (!ga_appareil()) ga_nouvel_appareil('admin', GA_ANNEE);
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Accès au site · Famille Missaoui</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%94%91%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
<style>
body{align-items:flex-start}
.porte.large{width:min(920px,100%);gap:18px}
.tete{display:flex;align-items:center;gap:14px;width:100%;justify-content:space-between;flex-wrap:wrap}
.tete h1{font-size:clamp(28px,6vw,40px);text-align:left}
.tete .boutons{display:flex;gap:10px;flex-wrap:wrap}
.petit{font:inherit;font-weight:800;font-size:15px;min-height:44px;padding:0 16px;border-radius:14px;border:0;background:#ffffff1c;color:#fbf6ea;box-shadow:none;margin:0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.carte .petit{background:#eef1f6;color:var(--ink)}
.carte .petit.rouge{background:#fde8eb;color:#8a1426}
.carte .petit.vert{background:var(--mint);color:#0d2a1d}
.etat{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.etat .rond{width:22px;height:22px;border-radius:50%;background:#c9ced8;flex:none}
.etat.on .rond{background:#2e9e6e;box-shadow:0 0 0 6px #2e9e6e33}
.etat b{font-size:20px}
.liste{display:flex;flex-direction:column;gap:8px}
.ligne{display:flex;align-items:center;gap:12px;padding:12px;border-radius:16px;background:#f5f7fb;flex-wrap:wrap}
.ligne .q{flex:1 1 220px;min-width:0}
.ligne .q b{display:block;overflow-wrap:anywhere}
.ligne .q small{color:var(--soft);display:block;overflow-wrap:anywhere}
.badge{font-size:12px;font-weight:800;padding:3px 8px;border-radius:999px;background:#e6ecfa;color:#1f3c88;margin-left:6px;vertical-align:middle}
.badge.moi{background:#fff1bf;color:#7a5200}
.grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
select{font:inherit;font-size:17px;padding:12px;border-radius:14px;border:2px solid var(--line);background:#f7f8fb;color:var(--ink);min-height:52px}
.lienbox{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:6px}
.lienbox input{flex:1 1 260px;font-size:14px;min-height:44px;padding:8px 10px}
.vide{color:var(--soft);font-style:italic}
.conseil{background:#fff7dd;color:#3a2600;border-radius:16px;padding:12px 14px;line-height:1.45}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#18202e;color:#fff;padding:12px 18px;border-radius:14px;font-weight:700;box-shadow:0 10px 30px #0006;opacity:0;transition:opacity .2s;pointer-events:none;max-width:calc(100% - 32px)}
.toast.vu{opacity:1}
details summary{cursor:pointer;font-weight:800;color:var(--soft)}
</style>
</head>
<body>
<main class="porte large">
  <div class="tete">
    <h1>🔑 L'accès au site</h1>
    <div class="boutons"><a class="petit" href="/acces/aide.php">📖 Aide</a><a class="petit" href="/">← Le site</a><button class="petit" id="sortir" type="button">Se déconnecter</button></div>
  </div>

  <section class="carte">
    <div class="etat" id="etat"><span class="rond"></span><span style="flex:1 1 240px"><b id="etatTxt">…</b><br><span id="etatSous" style="color:var(--soft)"></span></span><button class="petit vert" id="bascule" type="button"></button></div>
    <div class="conseil" id="conseil" hidden></div>
  </section>

  <section class="carte" id="secSessions">
    <h2>👤 Les sessions de la famille</h2>
    <p>Quand c'est en marche, chacun entre avec son code : les enfants avec leur code secret (4 chiffres ou 3 cartes, choisi la première fois), papa et maman avec le mot de passe parent, les invités avec leur prénom. Tu peux prendre la main sur la session d'un enfant pour faire des essais.</p>
    <div class="etat" id="sesEtat"><span class="rond"></span><span style="flex:1 1 240px"><b id="sesTxt">…</b></span><button class="petit vert" id="sesBascule" type="button">…</button></div>
    <div class="liste" id="sesListe"></div>
    <h3 style="margin:16px 0 6px">Voir le site comme un enfant, ici</h3>
    <div class="lienbox"><select id="sesVoirNom"><option>Amine</option><option>Salma</option><option>Essil</option></select>
      <label style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="sesVoirEcrit" style="min-height:0;width:22px;height:22px"> enregistrer pour de vrai</label>
      <button class="petit vert" id="sesVoir" type="button">👀 Voir comme lui (30 min)</button></div>
    <h3 style="margin:16px 0 6px">Les codes secrets des enfants</h3>
    <div class="liste" id="sesCodes"></div>
  </section>

  <section class="carte">
    <h2>🛎️ Les appareils qui frappent à la porte</h2>
    <p>Les appareils inconnus qui ont essayé d'entrer ces 30 derniers jours, où qu'ils soient. Si tu reconnais quelqu'un, touche « Faire confiance » : son appareil entre dès sa prochaine page (ou tout de suite s'il attend sur la page « Accès réservé »). Ceux qui ont écrit leur prénom sont en haut.</p>
    <div class="liste" id="dems"></div>
  </section>

  <section class="carte">
    <h2>🏠 L'adresse internet de la maison</h2>
    <p>Tout appareil qui se connecte depuis cette adresse (la box de la maison) entre sans rien demander, et devient de confiance pour un an, même en dehors de la maison. L'adresse de la box peut changer : mets-la à jour depuis la maison s'il le faut.</p>
    <p>Ton adresse en ce moment : <b id="monIp">…</b> <span id="monIpEtat"></span></p>
    <div class="liste" id="ips"></div>
    <div class="lienbox"><input id="ipNom" placeholder="Nom (ex. Maison)" maxlength="60"><button class="petit vert" id="ipAjout" type="button">＋ Ajouter mon adresse actuelle</button></div>
  </section>

  <section class="carte">
    <h2>💌 Inviter quelqu'un</h2>
    <p>Crée un lien et envoie-le (SMS, WhatsApp…). La personne ouvre le lien puis touche « Entrer » : son appareil a accès pendant la durée choisie.</p>
    <div class="grille">
      <label>Son prénom (il arrivera avec)<input id="invNom" placeholder="ex. Leïla" maxlength="20" required></label>
      <label>Le lien marche pendant<select id="invLien"><option value="3600">1 heure</option><option value="86400" selected>1 jour</option><option value="259200">3 jours</option><option value="604800">7 jours</option><option value="2592000">30 jours</option></select></label>
      <label>L'accès dure<select id="invDuree"><option value="86400">1 jour</option><option value="604800" selected>7 jours</option><option value="2592000">30 jours</option><option value="7776000">3 mois</option><option value="31536000">1 an</option></select></label>
      <label>Nombre d'appareils<select id="invUsages"><option value="1" selected>1 seul</option><option value="3">3</option><option value="5">5</option><option value="0">sans limite</option></select></label>
    </div>
    <button type="button" id="invCree">Créer le lien d'invitation</button>
    <div class="liste" id="invs"></div>
  </section>

  <section class="carte">
    <h2>🎮 Inviter un ami à un jeu</h2>
    <p>Ton ami ne pourra ouvrir que <b>ce jeu</b>, pendant <b>3 heures</b>, sur un seul appareil : rien d'autre du site. Pour jouer contre toi à la Chkobba, le plus simple est le bouton « Inviter un ami » à ta table en ligne (il arrive directement à ta table).</p>
    <div class="grille">
      <label>Le jeu<select id="paJeu"></select></label>
      <label>Son prénom<input id="paNom" placeholder="ex. Mourad" maxlength="20"></label>
    </div>
    <button type="button" id="paCree">Créer le lien de partie</button>
    <div class="liste" id="passes"></div>
  </section>

  <section class="carte">
    <h2>📱 Les appareils de confiance</h2>
    <p>Retirer un appareil lui ferme la porte tout de suite (il devra repasser par la maison, une invitation ou ta connexion).</p>
    <div class="liste" id="apps"></div>
  </section>

  <section class="carte">
    <h2>🚫 Les visites refusées</h2>
    <p>Les dernières tentatives d'appareils inconnus (gardées 60 jours).</p>
    <div class="liste" id="refus"></div>
  </section>

  <section class="carte">
    <h2>🔔 Être prévenu</h2>
    <p>Quand un appareil inconnu écrit son prénom et frappe à la porte, tu reçois une alerte (10 par heure au plus).</p>
    <label>Ton adresse e-mail<input id="alMail" type="email" placeholder="ton.adresse@exemple.com" autocomplete="email"></label>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="alMailOn" style="min-height:0;width:24px;height:24px"> Alerte par e-mail</label>
    <label style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" id="alNtfyOn" style="min-height:0;width:24px;height:24px"> Notification sur le téléphone (appli ntfy)</label>
    <div class="conseil" style="background:#eef1f6;color:var(--ink)"><b>Pour la notification :</b> installe l'appli gratuite <b>ntfy</b> (App Store ou Play Store), touche « + » (S'abonner), et écris ce nom de canal secret :<br><b id="alNtfy" style="font-family:monospace;font-size:17px;user-select:all"></b> <button class="petit" type="button" id="alCopie">Copier</button><br><small>Garde ce nom pour toi : quelqu'un qui le connaît verrait aussi les alertes. <button class="petit" type="button" id="alNouveau" style="min-height:32px;font-size:13px">Changer de canal</button></small></div>
    <div class="lienbox"><button class="petit vert" type="button" id="alOk">Enregistrer</button><button class="petit" type="button" id="alEssai">Envoyer une alerte d'essai</button></div>
  </section>

  <section class="carte">
    <h2>🔊 Les voix des cours (ElevenLabs)</h2>
    <p>Ollie parle avec de vraies voix ElevenLabs (Céline en français, Alice en anglais) au lieu de la voix de la tablette. Chaque phrase est fabriquée une seule fois, puis gardée sur le site : elle ne coûte des crédits que la première fois.</p>
    <p id="vxEtat"></p>
    <label>Clé API ElevenLabs <small>(sur elevenlabs.io › Developers › API Keys : « Create Key », droit « Text to Speech »)</small><input id="vxCle" type="password" autocomplete="off" placeholder="colle ta clé ici (elle ne sera plus jamais affichée)"></label>
    <label>Plafond par mois (caractères ; 1 caractère ≈ 1 crédit)<input id="vxMax" type="number" min="0" max="200000" step="1000"></label>
    <div class="lienbox"><button class="petit vert" type="button" id="vxOk">Enregistrer</button><button class="petit" type="button" id="vxEssai">🔊 Écouter un essai</button><button class="petit rouge" type="button" id="vxOublie">Effacer la clé</button></div>
  </section>

  <section class="carte">
    <h2>💾 Les sauvegardes</h2>
    <p>Chaque semaine, le site garde tout seul une copie des progrès des enfants, des scores, des voix de Nahki et des accès (les 8 dernières semaines). Télécharge-en une de temps en temps sur ton PC ou sur OneDrive : c'est ta copie de secours si le serveur avait un problème.</p>
    <div class="liste" id="sauv"></div>
    <button class="petit vert" type="button" id="sauvOk" style="align-self:flex-start">💾 Faire une sauvegarde maintenant</button>
  </section>

  <section class="carte">
    <h2>🔒 Mon mot de passe</h2>
    <p>Identifiant : <b id="adminId"></b></p>
    <div class="grille">
      <label>Ancien mot de passe<input type="password" id="mdpA" autocomplete="current-password"></label>
      <label>Nouveau (10 caractères au moins)<input type="password" id="mdpN" autocomplete="new-password" minlength="10"></label>
    </div>
    <button type="button" class="petit vert" id="mdpOk" style="align-self:flex-start">Changer le mot de passe</button>
    <details><summary>Secours et détails techniques</summary>
      <p style="margin-top:8px">Si un jour plus personne n'arrive à entrer : dans hPanel › Gestionnaire de fichiers, crée un fichier vide nommé <b>acces-ouvert</b> dans le dossier <b>famille-data</b> (à côté de public_html). Le site s'ouvre à tous jusqu'à ce que tu le supprimes. Mot de passe oublié : supprime <b>famille-data/acces-admin.json</b>, puis recrée le compte avec le mot de passe parent.</p>
      <p id="brut" style="font-family:monospace;font-size:13px;overflow-wrap:anywhere"></p>
    </details>
  </section>
  <p class="pied">© 2026 Anis Missaoui · Famille Missaoui</p>
</main>
<div class="toast" id="toast" role="status"></div>
<script>
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const quand = ts => ts ? new Date(ts * 1000).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—';
const jour = ts => new Date(ts * 1000).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
const duree = s => s >= 300 * 86400 ? '1 an' : s >= 80 * 86400 ? '3 mois' : s >= 86400 ? Math.round(s / 86400) + ' jour' + (s >= 2 * 86400 ? 's' : '') : Math.round(s / 3600) + ' h';
const nav = ua => { ua = ua || ''; return /iPad|Macintosh.*Mobile/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Macintosh/.test(ua) ? 'Mac' : /bot|crawl|spider|preview|facebookexternalhit|WhatsApp/i.test(ua) ? 'robot' : 'autre'; };
const nomApp = ua => { ua = ua || ''; const os = /iPad/.test(ua) ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? (/Mobile/.test(ua) ? 'Téléphone Android' : 'Tablette Android') : /Windows/.test(ua) ? 'PC Windows' : /Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Appareil';
  const n = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : ''; return n ? os + ' · ' + n : os; };
let E = null;
function toast(t){ const el = $('toast'); el.textContent = t; el.classList.add('vu'); clearTimeout(toast.k); toast.k = setTimeout(() => el.classList.remove('vu'), 2600); }
async function api(action, data = {}){
  const r = await fetch('/acces/admin.php', { method:'POST', headers:{ 'Content-Type':'application/json', 'X-Garde':'1' }, credentials:'same-origin', body:JSON.stringify({ action, ...data }) });
  const j = await r.json().catch(() => ({ error:'Réponse illisible du serveur.' }));
  if(r.status === 401){ location.href = '/acces/?admin=1'; throw 0; }
  if(!r.ok || j.error){ toast(j.error || 'Erreur.'); throw 0; }
  return j;
}
async function charge(action = 'etat', data){ E = await api(action, data); dessine(); }
/* 20/11 : les sessions par personne (api/qui.php) */
let S = null;
async function qui(action, data = {}){
  const f = new FormData(); f.append('action', action); Object.entries(data).forEach(([k, v]) => f.append(k, v));
  const r = await fetch('/api/qui.php', { method:'POST', headers:{ 'X-Garde':'1' }, credentials:'same-origin', body:f });
  const j = await r.json().catch(() => ({ error:'Réponse illisible du serveur.' }));
  if(!r.ok || j.error){ toast(j.error || 'Erreur.'); throw 0; } return j; }
async function chargeSessions(){ try{ S = await qui('admin_liste'); }catch(e){ return; } dessineSessions(); }
function dessineSessions(){
  $('sesEtat').classList.toggle('on', S.actif); $('sesTxt').textContent = S.actif ? 'Les sessions sont en marche' : 'Les sessions sont à l\'arrêt (on choisit son avatar sans code, comme avant)';
  $('sesBascule').textContent = S.actif ? 'Mettre à l\'arrêt' : 'Mettre en marche'; $('sesBascule').className = 'petit ' + (S.actif ? '' : 'vert');
  const min = t => Math.max(0, Math.ceil((t - S.now) / 60));
  $('sesListe').innerHTML = S.sessions.length ? S.sessions.map(q => `<div class="ligne"><div class="q"><b>${esc(q.nom)}${q.moi ? ' (cet appareil)' : ''} <small style="color:var(--soft)">· ${q.role === 'enfant' ? 'enfant' : q.role === 'parent' ? 'parent' : 'invité'}</small></b>
      ${esc(q.appareil || '')} · ${q.page ? 'sur ' + esc(q.page) + ' · ' : ''}vu ${quand(q.vu)}${q.ctrl ? `<br><b style="color:#b45309">🔧 ${q.ctrl.voir ? 'tu le vois comme lui' : 'tu as la main'} · ${q.ctrl.ecrit ? 'enregistré pour de vrai' : 'rien n\'est enregistré'} · encore ${min(q.ctrl.fin)} min</b>` : ''}</div>
      ${q.role === 'enfant' && !q.ctrl ? `<button class="petit vert" data-prend="${q.id}" type="button">🔧 Prendre la main</button>` : ''}
      ${q.ctrl ? `<button class="petit" data-rend="${q.id}" type="button">Rendre</button>` : ''}
      <button class="petit" data-ferme="${q.id}" type="button">Fermer</button></div>`).join('') : '<p class="vide">Personne n\'est entré pour l\'instant.</p>';
  $('sesCodes').innerHTML = ['Essil', 'Salma', 'Amine'].map(n => `<div class="ligne"><div class="q"><b>${n}</b>${S.codes[n] ? (S.codes[n] === 'cartes' ? '🃏 3 cartes' : '🔢 4 chiffres') : '<span class="vide">pas encore choisi (il le choisira la première fois)</span>'}</div>
      ${S.codes[n] ? `<button class="petit" data-codezero="${n}" type="button">Remettre à zéro</button>` : ''}</div>`).join('');
}
$('sesBascule').onclick = async () => { if(S.actif && !confirm('Mettre les sessions à l\'arrêt ? Chacun choisira de nouveau son avatar sans code.')) return;
  if(!S.actif && !confirm('Mettre les sessions en marche ? Sur chaque tablette, il faudra entrer avec son code (les enfants le choisiront la première fois).')) return;
  await qui('admin_interrupteur', { on:S.actif ? '' : '1' }); toast(S.actif ? 'Sessions à l\'arrêt' : 'Sessions en marche 👤'); chargeSessions(); };
$('sesVoir').onclick = async () => { const j = await qui('admin_voir', { nom:$('sesVoirNom').value, ecrit:$('sesVoirEcrit').checked ? '1' : '' }); location.href = j.aller; };
document.addEventListener('click', async e => { const d = e.target.closest('button')?.dataset; if(!d) return;
  if(d.prend){ const ecrit = confirm('Enregistrer pour de vrai ce que tu feras sur sa session ?\n\nOK = oui, ses progrès comptent\nAnnuler = non, rien n\'est enregistré (conseillé pour des essais)');
    await qui('admin_prend', { id:d.prend, minutes:30, ecrit:ecrit ? '1' : '' }); toast('Tu as la main : la tablette change dans quelques secondes 🔧'); chargeSessions(); }
  if(d.rend){ await qui('admin_rend', { id:d.rend }); toast('Rendu 👍'); chargeSessions(); }
  if(d.ferme && confirm('Fermer cette session ? La personne devra entrer de nouveau avec son code.')){ await qui('admin_ferme', { id:d.ferme }); chargeSessions(); }
  if(d.codezero && confirm('Remettre à zéro le code secret de ' + d.codezero + ' ? Il en choisira un nouveau la prochaine fois.')){ await qui('admin_code_zero', { nom:d.codezero }); chargeSessions(); } });
chargeSessions(); setInterval(() => { if(!document.hidden) chargeSessions(); }, 15000);
function dessine(){
  const on = E.actif;
  $('etat').classList.toggle('on', on);
  $('etatTxt').textContent = on ? 'Protection activée' : 'Protection en pause : tout le monde entre';
  $('etatSous').textContent = on ? 'Seuls la maison, les appareils de confiance et les invités entrent.' : 'Prépare la maison et tes appareils, puis active.';
  $('bascule').textContent = on ? 'Mettre en pause' : 'Activer la protection';
  $('bascule').className = 'petit ' + (on ? 'rouge' : 'vert');
  const c = $('conseil'); const msgs = [];
  if(E.secours) msgs.push('⚠️ Le fichier de secours <b>acces-ouvert</b> est présent : le site reste ouvert à tous tant qu\'il existe.');
  if(!E.ips.length) msgs.push('Conseil : ajoute d\'abord l\'adresse de la maison (depuis le Wi-Fi de la maison), pour que les tablettes des enfants entrent toutes seules.');
  c.innerHTML = msgs.join('<br>'); c.hidden = !msgs.length;
  $('monIp').textContent = E.ip; $('monIpEtat').innerHTML = E.ip_maison ? '<span class="badge">c\'est la maison</span>' : '';
  $('ips').innerHTML = E.ips.length ? E.ips.map(x => `<div class="ligne"><span class="q"><b>${esc(x.nom)}</b><small>${esc(x.ip)} · ajoutée le ${jour(x.cree)}</small></span><button class="petit rouge" data-ipdel="${x.id}">Retirer</button></div>`).join('') : '<p class="vide">Aucune adresse pour l\'instant.</p>';
  $('invs').innerHTML = E.invitations.map(v => { const fini = v.lien_expire * 1000 < Date.now() || (v.usages_max && v.usages >= v.usages_max);
    return `<div class="ligne"><span class="q"><b>${esc(v.nom || 'Invitation')}</b><small>${fini ? 'Lien terminé' : 'Lien valable jusqu\'au ' + quand(v.lien_expire)} · accès ${duree(v.duree)} · ${v.usages}/${v.usages_max || '∞'} appareil(s) · ${v.actifs} entré(s)</small>
      ${fini ? '' : `<span class="lienbox"><input readonly value="${esc(v.lien)}"><button class="petit" data-copie="${esc(v.lien)}">Copier</button>${navigator.share ? `<button class="petit" data-partage="${esc(v.lien)}" data-nom="${esc(v.nom)}">Envoyer</button>` : ''}</span>`}</span>
      <button class="petit rouge" data-invdel="${v.id}">Supprimer</button></div>`; }).join('');
  if(!$('paJeu').options.length) $('paJeu').innerHTML = (E.jeux_passe || []).map(([k, n]) => `<option value="${k}">${esc(n)}</option>`).join('');
  $('passes').innerHTML = (E.passes || []).length ? E.passes.map(v => `<div class="ligne"><span class="q"><b>${esc(v.nom)} · ${esc(v.nomjeu)}${v.tab ? ' · table ' + esc(v.tab) : ''}</b><small>${v.utilise ? 'Entré le ' + quand(v.utilise) : 'Lien pas encore ouvert'} · jusqu'à ${quand(v.expire)}</small>
      ${v.utilise ? '' : `<span class="lienbox"><input readonly value="${esc(v.lien)}"><button class="petit" data-copie="${esc(v.lien)}">Copier</button>${navigator.share ? `<button class="petit" data-partage="${esc(v.lien)}" data-nom="${esc(v.nom)}" data-jeu="${esc(v.nomjeu)}">Envoyer</button>` : ''}</span>`}</span>
      <button class="petit rouge" data-passedel="${v.id}">Retirer</button></div>`).join('') : '<p class="vide">Aucune partie en cours.</p>';
  const optD = '<option value="86400">1 jour</option><option value="604800">7 jours</option><option value="2592000">30 jours</option><option value="31536000" selected>1 an</option>';
  $('dems').innerHTML = E.demandes.length ? E.demandes.map(d => `<div class="ligne"><span class="q"><b>${d.nom ? esc(d.nom) : esc(nomApp(d.ua))}${d.statut === 'attente' ? '<span class="badge moi">attend ta réponse</span>' : ''}${d.statut === 'accepte' ? '<span class="badge">accepté</span>' : ''}</b>
      <small>${d.nom ? esc(nomApp(d.ua)) + ' · ' : ''}${esc(d.ip)} · vu le ${quand(d.vu)} · ${d.pages} page(s)${d.page ? ' · ' + esc(d.page) : ''}</small></span>
      ${d.statut === 'accepte' ? '<small style="color:var(--soft)">Il entrera à sa prochaine page.</small>' : `<select data-dur="${d.id}" aria-label="Durée de l'accès">${optD}</select><button class="petit vert" data-ok="${d.id}">Faire confiance</button><button class="petit" data-non="${d.id}">Ignorer</button>`}</div>`).join('') : '<p class="vide">Personne n\'a frappé à la porte pour l\'instant.</p>';
  const al = E.alertes; if(document.activeElement !== $('alMail')) $('alMail').value = al.email; $('alMailOn').checked = al.email_on; $('alNtfyOn').checked = al.ntfy_on; $('alNtfy').textContent = al.ntfy;
  const ko = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' ko';
  $('sauv').innerHTML = !E.zip ? '<p class="vide">Le serveur ne sait pas faire de fichiers zip : préviens Claude.</p>' : E.sauvegardes.length ? E.sauvegardes.map(v => `<div class="ligne"><span class="q"><b>${jour(v.date)}</b><small>${ko(v.taille)}</small></span><a class="petit vert" href="/acces/admin.php?telecharger=${encodeURIComponent(v.nom)}">⬇️ Télécharger</a></div>`).join('') : '<p class="vide">Pas encore de sauvegarde : la première se fera toute seule à la prochaine visite du site, ou maintenant avec le bouton.</p>';
  $('apps').innerHTML = E.appareils.length ? E.appareils.map(a => `<div class="ligne"><span class="q"><b>${esc(a.nom)}${a.id === E.moi ? '<span class="badge moi">cet appareil</span>' : ''}<span class="badge">${a.via === 'maison' ? 'maison' : a.via === 'admin' ? 'toi' : a.via === 'accepte' ? 'accepté par toi' : 'invité'}</span></b>
      <small>Vu le ${quand(a.vu)} · ${esc(a.ip)} · accès jusqu'au ${jour(a.expire)}</small></span>
      <button class="petit" data-ren="${a.id}" data-nom="${esc(a.nom)}">Renommer</button>${a.id === E.moi ? '' : `<button class="petit rouge" data-appdel="${a.id}">Retirer</button>`}</div>`).join('') : '<p class="vide">Aucun appareil pour l\'instant.</p>';
  $('refus').innerHTML = E.refus.length ? E.refus.map(r => `<div class="ligne"><span class="q"><b>${esc(r.ip)} <span class="badge">${nav(r.ua)}</span></b><small>${quand(r.ts)} · ${esc(r.page)}</small></span></div>`).join('') : '<p class="vide">Aucune visite refusée.</p>';
  const vx = E.voix; $('vxEtat').innerHTML = (vx.cle ? '✅ Clé enregistrée.' : '⚠️ Pas encore de clé : les cours prennent la voix de la tablette.') + ` Depuis le 20 (renouvellement ElevenLabs) : <b>${vx.mois}</b> caractères sur ${vx.max} · ${vx.phrases} phrases gardées.` + (vx.erreur ? ` <br>Dernière erreur : ${esc(vx.erreur)}` : ''); if(document.activeElement !== $('vxMax')) $('vxMax').value = vx.max;
  $('adminId').textContent = E.admin;
  $('brut').textContent = 'REMOTE_ADDR ' + E.brut.remote + ' · X-Forwarded-For ' + (E.brut.xff || '—') + ' · CF ' + (E.brut.cf || '—') + ' · X-Real-IP ' + (E.brut.real || '—');
}
$('bascule').onclick = async () => {
  if(!E.actif && !E.ips.length && !confirm("Aucune adresse de maison n'est enregistrée : les tablettes des enfants devront être invitées une par une. Activer quand même ?")) return;
  if(E.actif && !confirm('Mettre la protection en pause ? Tout le monde pourra de nouveau entrer.')) return;
  await charge('activer', { on:!E.actif }); toast(E.actif ? 'Protection activée 🔒' : 'Protection en pause');
};
$('ipAjout').onclick = async () => { await charge('ip_ajoute', { nom:$('ipNom').value }); $('ipNom').value = ''; toast('Adresse ajoutée 🏠'); };
$('invCree').onclick = async () => {
  if(!$('invNom').value.trim()){ toast('Écris d\'abord le prénom de la personne invitée'); $('invNom').focus(); return; }
  await charge('invitation_cree', { nom:$('invNom').value, lien:+$('invLien').value, duree:+$('invDuree').value, usages:+$('invUsages').value });
  $('invNom').value = ''; const l = E.invitations[0]; if(l) { try { await navigator.clipboard.writeText(l.lien); toast('Lien créé et copié 💌'); } catch(e){ toast('Lien créé 💌'); } }
};
$('paCree').onclick = async () => {
  if(!$('paNom').value.trim()){ toast('Écris d\'abord le prénom de ton ami'); $('paNom').focus(); return; }
  await charge('passe_cree', { jeu:$('paJeu').value, nom:$('paNom').value }); $('paNom').value = '';
  const l = (E.passes || [])[0]; if(l){ try { await navigator.clipboard.writeText(l.lien); toast('Lien de partie créé et copié 🎮'); } catch(e){ toast('Lien de partie créé 🎮'); } }
};
$('alOk').onclick = async () => { await charge('alertes', { email:$('alMail').value.trim(), email_on:$('alMailOn').checked, ntfy_on:$('alNtfyOn').checked }); toast('Alertes enregistrées 🔔'); };
$('alEssai').onclick = async () => { const r = await api('alerte_essai'); E = r; dessine(); const e = r.essai || {}; toast(['e-mail ' + (e.email === null ? 'non réglé' : e.email ? 'envoyé' : 'pas parti'), 'ntfy ' + (e.ntfy === null ? 'éteint' : e.ntfy ? 'envoyé' : 'pas parti')].join(' · ')); };
$('alCopie').onclick = async () => { try { await navigator.clipboard.writeText(E.alertes.ntfy); toast('Nom du canal copié'); } catch(e){} };
$('alNouveau').onclick = async () => { if(confirm('Changer de canal ? Il faudra te réabonner dans l\'appli ntfy avec le nouveau nom.')) await charge('ntfy_nouveau'); };
$('vxOk').onclick = async () => { await charge('voix', { cle:$('vxCle').value.trim(), max:+$('vxMax').value }); $('vxCle').value = ''; toast('Voix enregistrées 🔊'); };
$('vxOublie').onclick = async () => { if(confirm('Effacer la clé ElevenLabs du site ?')) { await charge('voix', { oublie:1 }); toast('Clé effacée'); } };
$('vxEssai').onclick = async () => { const a = new Audio('/api/voix.php?l=fr&t=' + encodeURIComponent('Bonjour Salma ! Je suis Ollie, ta maîtresse.') ); a.onerror = () => toast('Pas de son : vérifie la clé (voir la dernière erreur).'); try { await a.play(); setTimeout(() => { const b = new Audio('/api/voix.php?l=en&t=' + encodeURIComponent('Hello Salma! The cat is under the table.')); b.play().catch(() => {}); }, 3500); } catch(e){ toast('Pas de son : vérifie la clé.'); } setTimeout(() => charge(), 9000); };
$('sauvOk').onclick = async () => { $('sauvOk').disabled = true; $('sauvOk').textContent = '💾 Sauvegarde en cours…'; try { await charge('sauvegarde'); toast('Sauvegarde faite 💾'); } finally { $('sauvOk').disabled = false; $('sauvOk').textContent = '💾 Faire une sauvegarde maintenant'; } };
$('mdpOk').onclick = async () => { await charge('mdp', { ancien:$('mdpA').value, nouveau:$('mdpN').value }); $('mdpA').value = $('mdpN').value = ''; toast('Mot de passe changé'); };
$('sortir').onclick = async () => { await api('sortir'); location.href = '/acces/?sortie=1'; };
document.addEventListener('click', async e => {
  const b = e.target.closest('button'); if(!b) return; const d = b.dataset;
  if(d.ok){ const sel = document.querySelector(`[data-dur="${d.ok}"]`); await charge('demande_accepte', { id:+d.ok, duree:+(sel ? sel.value : 31536000) }); toast('Accepté : la porte s\'ouvrira pour lui 🔓'); }
  if(d.non) await charge('demande_ignore', { id:+d.non });
  if(d.ipdel && confirm('Retirer cette adresse ?')) await charge('ip_supprime', { id:+d.ipdel });
  if(d.invdel && confirm('Supprimer cette invitation ? Les appareils entrés avec ce lien perdront aussi l\'accès.')) await charge('invitation_supprime', { id:+d.invdel });
  if(d.passedel && confirm('Retirer cette invitation à jouer ? Ton ami ne pourra plus jouer.')) await charge('passe_supprime', { id:+d.passedel });
  if(d.appdel && confirm('Retirer cet appareil ? Il ne pourra plus entrer.')) await charge('appareil_revoque', { id:+d.appdel });
  if(d.ren){ const n = prompt('Nouveau nom de cet appareil :', d.nom); if(n) await charge('appareil_renomme', { id:+d.ren, nom:n }); }
  if(d.copie){ try { await navigator.clipboard.writeText(d.copie); toast('Lien copié'); } catch(err){ toast('Sélectionne le lien pour le copier'); } }
  if(d.partage){ try { await navigator.share({ title:'Invitation · Famille Missaoui', text:d.jeu ? 'Viens faire une partie de ' + d.jeu + ' avec moi' + (d.nom ? ', ' + d.nom : '') + ' ! Ouvre ce lien puis touche « Jouer ».' : 'Je t\'invite sur le site de jeux de la famille Missaoui' + (d.nom ? ', ' + d.nom : '') + ' : ouvre ce lien puis touche « Entrer ».', url:d.partage }); } catch(err){} }
});
charge();
setInterval(() => { if(!document.hidden && !(document.activeElement && /INPUT|SELECT/.test(document.activeElement.tagName))) charge().catch(() => {}); }, 20000);   // la liste se met à jour toute seule
<?php if (isset($_GET['bienvenue'])): ?>toast('Compte créé, bienvenue Anis 👋');<?php endif; ?>
</script>
</body>
</html>
