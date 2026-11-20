<?php
/*
 * Famille Missaoui — entrer sur le site (sessions par personne, 20/11/2026). Voir acces/session.php.
 * GET  ?action=moi                        → qui est cet appareil (même chose que window.FAMILLE_QUI dans les pages)
 * POST action=entrer   nom, code[, type]  → un enfant (son code) ou un parent (mot de passe parent ; Anis : aussi celui de l'administration)
 * POST action=cree_code nom, type, code   → la première fois, l'enfant choisit son code (4 chiffres ou 3 cartes)
 * POST action=invite   nom, av            → un invité (pas de code) ; av = une mascotte ou l'avatar d'un membre de la famille
 * POST action=sortir                      → fermer la session de cet appareil
 * POST action=rendre                      → finir une prise de main (bouton « Rendre la tablette » du bandeau)
 * Administration (session administrateur d'Anis, en-tête X-Garde: 1) :
 * POST action=admin_liste | admin_interrupteur(on) | admin_prend(id, minutes, ecrit) | admin_rend(id) | admin_ferme(id)
 *      | admin_voir(nom, ecrit) | admin_code_zero(nom)
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function rep(int $c, array $d): void { http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }

$a = (string)($_REQUEST['action'] ?? '');
$post = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
try {
    if ($a === 'moi') rep(200, ga_qui_public());
    if (!$post) rep(405, ['error' => 'Action inconnue.']);

    /* ---------- l'administration ---------- */
    if (strpos($a, 'admin_') === 0) {
        if (!ga_admin() || ($_SERVER['HTTP_X_GARDE'] ?? '') !== '1') rep(403, ['error' => 'Réservé à l\'administration.']);
        $db = ga_qui_db(); $t = time(); $id = (string)($_POST['id'] ?? '');
        $ligne = function() use ($db, $id) { if (!preg_match('/^[0-9a-f]{16}$/', $id)) rep(400, ['error' => 'Session inconnue.']);
            $s = $db->prepare('SELECT * FROM qui WHERE substr(hash, 1, 16) = ? AND expire > ?'); $s->execute([$id, time()]); $q = $s->fetch(); if (!$q) rep(404, ['error' => 'Cette session n\'existe plus.']); return $q; };
        if ($a === 'admin_interrupteur') { ga_reglage('sessions', !empty($_POST['on']) ? '1' : '0'); rep(200, ['ok' => true, 'actif' => ga_qui_actif()]); }
        if ($a === 'admin_prend') {
            $q = $ligne(); if (!ga_qui_enfant((string)$q['nom'])) rep(400, ['error' => 'On ne prend la main que sur la session d\'un enfant.']);
            $m = max(5, min(30, (int)($_POST['minutes'] ?? 30)));
            $db->prepare('UPDATE qui SET ctrl_par = ?, ctrl_fin = ?, ctrl_ecrit = ?, ctrl_retour = NULL WHERE hash = ?')->execute(['Anis', $t + $m * 60, !empty($_POST['ecrit']) ? 1 : 0, $q['hash']]);
            rep(200, ['ok' => true]);
        }
        if ($a === 'admin_rend') { ga_qui_rend($ligne()); rep(200, ['ok' => true]); }
        if ($a === 'admin_ferme') { $q = $ligne(); $db->prepare('DELETE FROM qui WHERE hash = ?')->execute([$q['hash']]); rep(200, ['ok' => true]); }
        if ($a === 'admin_voir') {   // « voir le site comme Amine » sur CET appareil (celui d'Anis)
            $nom = ga_qui_nom((string)($_POST['nom'] ?? '')); if (!ga_qui_enfant($nom)) rep(400, ['error' => 'Choisis un enfant.']);
            if (!ga_qui_actif()) rep(400, ['error' => 'Mets d\'abord les sessions en marche.']);
            $q = ga_qui();
            if (!$q || $q['ctrl_par']) { if ($q) ga_qui_rend($q); ga_qui_ouvre('Anis', 'parent'); $j = (string)$_COOKIE[GA_QUI_COOKIE]; $h = hash('sha256', $j); }
            else $h = $q['hash'];
            $s = $db->prepare('SELECT nom FROM qui WHERE hash = ?'); $s->execute([$h]); $avant = (string)$s->fetchColumn();
            $db->prepare('UPDATE qui SET nom = ?, role = \'enfant\', ctrl_par = \'Anis\', ctrl_fin = ?, ctrl_ecrit = ?, ctrl_retour = ? WHERE hash = ?')
               ->execute([$nom, $t + GA_QUI_CTRL, !empty($_POST['ecrit']) ? 1 : 0, $avant ?: 'Anis', $h]);
            rep(200, ['ok' => true, 'aller' => '/' . strtolower($nom) . '/']);
        }
        if ($a === 'admin_code_zero') {
            $nom = ga_qui_nom((string)($_POST['nom'] ?? '')); if (!ga_qui_enfant($nom)) rep(400, ['error' => 'Choisis un enfant.']);
            $db->prepare('DELETE FROM qui_codes WHERE nom = ?')->execute([$nom]); rep(200, ['ok' => true]);
        }
        if ($a === 'admin_liste') {
            $l = [];
            foreach ($db->query('SELECT * FROM qui WHERE expire > ' . $t . ' ORDER BY vu DESC LIMIT 60') as $q)
                $l[] = ['id' => substr($q['hash'], 0, 16), 'nom' => $q['nom'], 'role' => $q['role'], 'appareil' => $q['nom_appareil'], 'page' => $q['page'], 'vu' => (int)$q['vu'], 'cree' => (int)$q['cree'],
                        'ctrl' => $q['ctrl_par'] ? ['fin' => (int)$q['ctrl_fin'], 'ecrit' => (bool)$q['ctrl_ecrit'], 'voir' => (bool)$q['ctrl_retour']] : null,
                        'moi' => isset($_COOKIE[GA_QUI_COOKIE]) && hash_equals($q['hash'], hash('sha256', (string)$_COOKIE[GA_QUI_COOKIE]))];
            rep(200, ['actif' => ga_qui_actif(), 'sessions' => $l, 'codes' => ga_qui_codes_types(), 'now' => $t]);
        }
        rep(400, ['error' => 'Action inconnue.']);
    }

    if (!ga_qui_actif()) rep(409, ['error' => 'Les sessions ne sont pas en marche.']);

    if ($a === 'sortir') { ga_qui_ferme(); rep(200, ['ok' => true]); }
    if ($a === 'rendre') { $q = ga_qui(); if ($q && $q['ctrl_par']) ga_qui_rend($q); rep(200, ['ok' => true]); }

    if ($a === 'entrer' || $a === 'cree_code') {
        $nom = ga_qui_nom((string)($_POST['nom'] ?? '')); $code = (string)($_POST['code'] ?? '');
        if (!ga_qui_famille($nom)) rep(400, ['error' => 'Choisis ton avatar.']);
        if (ga_qui_trop_essais($nom)) rep(429, ['error' => 'Trop d\'essais. Attends un petit quart d\'heure, ou demande à papa.']);
        if (in_array($nom, GA_QUI_PARENTS, true)) {
            $ok = false;
            $auth = json_decode((string)@file_get_contents(dirname(ga_racine()) . '/nahki-voix/auth.json'), true);
            if (is_array($auth) && !empty($auth['hash']) && password_verify($code, (string)$auth['hash'])) $ok = true;
            $adm = ga_admin_fiche();
            if (!$ok && $nom === 'Anis' && !empty($adm['hash']) && password_verify($code, (string)$adm['hash'])) $ok = true;
            if (!$ok) { ga_qui_echec($nom); rep(400, ['error' => 'Ce n\'est pas le bon mot de passe.']); }
            ga_qui_ouvre($nom, 'parent'); rep(200, ['ok' => true]);
        }
        $db = ga_qui_db(); $s = $db->prepare('SELECT * FROM qui_codes WHERE nom = ?'); $s->execute([$nom]); $c = $s->fetch();
        if ($a === 'cree_code') {
            if ($c) rep(409, ['error' => 'Tu as déjà un code secret.']);
            $p = ga_qui_code_propre((string)($_POST['type'] ?? ''), $code); if (!$p) rep(400, ['error' => 'Ce code ne va pas.']);
            $db->prepare('INSERT INTO qui_codes (nom, type, hash, cree) VALUES (?, ?, ?, ?)')->execute([$nom, (string)$_POST['type'], password_hash($p, PASSWORD_DEFAULT), time()]);
            ga_qui_ouvre($nom, 'enfant'); rep(200, ['ok' => true]);
        }
        if (!$c) rep(200, ['creer' => true]);   // pas encore de code : la page lui propose d'en choisir un
        $p = ga_qui_code_propre((string)$c['type'], $code);
        if (!$p || !password_verify($p, (string)$c['hash'])) { ga_qui_echec($nom); rep(400, ['error' => 'Ce n\'est pas ton code. Essaie encore !']); }
        ga_qui_ouvre($nom, 'enfant'); rep(200, ['ok' => true]);
    }

    if ($a === 'invite') {
        $nom = ga_qui_nom_invite((string)($_POST['nom'] ?? ''));
        if ($nom === null) rep(400, ['error' => 'Écris ton prénom (pas celui de quelqu\'un de la famille).']);
        $av = (string)($_POST['av'] ?? 'nour'); if (!in_array($av, GA_QUI_AVATARS, true)) $av = 'nour';
        $t = time();
        ga_qui_db()->prepare('INSERT INTO qui_invites (nom, av, cree, vu) VALUES (?, ?, ?, ?) ON CONFLICT(nom) DO UPDATE SET av = excluded.av, vu = excluded.vu')->execute([$nom, $av, $t, $t]);
        ga_qui_ouvre($nom, 'invite', $av); rep(200, ['ok' => true, 'nom' => $nom]);
    }
    rep(400, ['error' => 'Action inconnue.']);
} catch (Throwable $e) {
    error_log('qui.php : ' . $e->getMessage());
    rep(500, ['error' => 'Petit souci du serveur. Réessaie.']);
}
