<?php
/*
 * Mechmoum — l'administration (/reseau/api/admin/…), incluse par index.php ($moi, $mid, $p, $methode, $db sont déjà là).
 * Anis (rôle admin, ou session administrateur du site) : tout. Un « modérateur » : signalements et contenus seulement.
 */
declare(strict_types=1);

$admin = mc_admin($moi);
$modo = $admin || $moi['role'] === 'moderateur';
if (!$modo) mc_err(403, 'Réservé à l\'administration.');
$a = $p[1] ?? ''; $id = (int)($p[2] ?? 0); $c = mc_corps();
$qui = $moi['username'];
$seulAdmin = function () use ($admin) { if (!$admin) mc_err(403, 'Réservé à Anis.'); };

if ($a === 'etat') {
    $n = fn($sql) => (int)$db->query($sql)->fetchColumn(); $t = time();
    mc_json(200, ['success' => true, 'admin' => $admin, 'stats' => [
        'membres' => $n("SELECT COUNT(*) FROM users WHERE etat = 'actif'"), 'suspendus' => $n("SELECT COUNT(*) FROM users WHERE etat != 'actif'"),
        'enLigne' => $n('SELECT COUNT(*) FROM users WHERE vu > ' . ($t - 60)), 'actifs7j' => $n('SELECT COUNT(*) FROM users WHERE vu > ' . ($t - 7 * 86400)),
        'publications' => $n('SELECT COUNT(*) FROM posts'), 'reels' => $n("SELECT COUNT(*) FROM posts WHERE type = 'video'"), 'stories' => $n("SELECT COUNT(*) FROM stories WHERE expire > $t"),
        'commentaires' => $n('SELECT COUNT(*) FROM comments'), 'messages' => $n('SELECT COUNT(*) FROM messages'), 'masques' => $n('SELECT (SELECT COUNT(*) FROM posts WHERE cache = 1) + (SELECT COUNT(*) FROM comments WHERE cache = 1)'),
        'signalements' => $n("SELECT COUNT(*) FROM signalements WHERE etat = 'ouvert'"), 'invitations' => $n("SELECT COUNT(*) FROM invitations WHERE revoquee = 0 AND expire > $t AND usages < usages_max"),
        'stockage' => (int)$db->query('SELECT IFNULL(SUM(taille), 0) FROM media')->fetchColumn(),
        'parJour' => $db->query('SELECT date(cree, \'unixepoch\', \'localtime\') j, COUNT(*) n FROM posts WHERE cree > ' . ($t - 14 * 86400) . ' GROUP BY j ORDER BY j')->fetchAll()],
        'reglages' => ['prive' => mc_reglage('prive', null, '1') === '1', 'inscriptions' => mc_reglage('inscriptions', null, '1') === '1', 'enfants_dm' => mc_reglage('enfants_dm', null, 'famille')]]);
}

/* les Shorts (28/11) : Anis choisit les chaînes YouTube et les vidéos du fil des Shorts, et peut cacher un short */
if ($a === 'shorts') {
    $seulAdmin();
    $s = mc_shorts_sources();
    $rend = fn(string $msg = '') => mc_json(200, ['success' => true, 'message' => $msg, 'sources' => mc_shorts_sources(), 'liste' => mc_shorts(false, true)]);
    if ($methode === 'GET') $rend();
    $f = (string)($c['faire'] ?? '');
    if ($f === 'ajouter') {
        $u = trim((string)($c['url'] ?? ''));
        if ($u === '') mc_err(400, 'Colle d\'abord le lien d\'une vidéo ou d\'une chaîne YouTube.');
        if (!preg_match('#^https?://#i', $u) && !preg_match('/^@|^[\w-]{11}$/', $u)) $u = 'https://' . $u;
        // une vidéo : /shorts/ID, watch?v=ID, youtu.be/ID, /embed/ID, /live/ID, ou l'identifiant seul
        $vid = null;
        if (preg_match('/^[\w-]{11}$/', $u)) $vid = $u;
        elseif (preg_match('#(?:youtu\.be/|/shorts/|/embed/|/live/|[?&]v=)([\w-]{11})#', $u, $m)) $vid = $m[1];
        if ($vid) {
            foreach ($s['videos'] as $x) if ($x['id'] === $vid) mc_err(400, 'Cette vidéo est déjà dans le fil.');
            $o = json_decode(mc_web('https://www.youtube.com/oembed?format=json&url=' . rawurlencode('https://www.youtube.com/watch?v=' . $vid)), true);
            $s['videos'][] = ['id' => $vid, 'titre' => mc_titre_propre(mb_substr((string)($o['title'] ?? ''), 0, 200)), 'chaine' => mb_substr((string)($o['author_name'] ?? 'YouTube'), 0, 80) ?: 'YouTube', 'ajout' => time()];
            $s['caches'] = array_values(array_diff($s['caches'], [$vid]));
            mc_shorts_sources($s); mc_journal($qui, 'short ajouté', $vid);
            $rend(is_array($o) ? '« ' . ($o['title'] ?? 'La vidéo') . ' » est en tête du fil.' : 'Vidéo ajoutée (YouTube n\'a pas donné son titre).');
        }
        // une chaîne : @nom, /channel/UC…, /c/nom, /user/nom
        $chemin = null;
        if (preg_match('#^@([\w.-]{2,100})$#u', $u, $m) || preg_match('#youtube\.com/@([\w.%-]{2,100})#iu', $u, $m)) $chemin = '@' . rawurldecode($m[1]);
        elseif (preg_match('#youtube\.com/channel/(UC[\w-]{22})#', $u, $m)) $chemin = 'channel/' . $m[1];
        elseif (preg_match('#youtube\.com/(c|user)/([\w.-]{2,100})#', $u, $m)) $chemin = $m[1] . '/' . $m[2];
        if (!$chemin) mc_err(400, 'Je ne reconnais pas ce lien. Colle le lien d\'une vidéo (youtube.com/shorts/…, youtu.be/…) ou d\'une chaîne (youtube.com/@…).');
        $h = mc_web('https://www.youtube.com/' . $chemin . '?hl=fr');
        $cid = str_starts_with($chemin, 'channel/') ? substr($chemin, 8) : null;
        if ($h && preg_match('/"externalId":"(UC[\w-]{22})"/', $h, $m)) $cid = $m[1];
        elseif (!$cid && $h && preg_match('#<meta itemprop="identifier" content="(UC[\w-]{22})"#', $h, $m)) $cid = $m[1];
        if (!$cid) mc_err(400, $h ? 'Je n\'ai pas trouvé cette chaîne sur YouTube. Vérifie le lien.' : 'YouTube n\'a pas répondu. Réessaie dans un moment.');
        foreach ($s['chaines'] as $x) if ($x['id'] === $cid) mc_err(400, 'Cette chaîne est déjà dans le fil.');
        $nom = $h && preg_match('#<meta property="og:title" content="([^"]{1,120})"#', $h, $m) ? html_entity_decode($m[1], ENT_QUOTES) : ltrim($chemin, '@');
        $ch = ['id' => $cid, 'chemin' => $chemin, 'nom' => $nom, 'ajout' => time()];
        $s['chaines'][] = $ch; mc_shorts_sources($s); mc_journal($qui, 'chaîne de shorts ajoutée', $nom);
        $n = count(mc_shorts_chaine($ch, true));
        $rend($n ? "La chaîne « $nom » est ajoutée : $n short(s)." : "La chaîne « $nom » est ajoutée, mais YouTube n'a pas encore donné ses shorts. Réessaie avec « Actualiser ».");
    }
    $vid = (string)($c['id'] ?? '');
    if ($f === 'retirer-chaine') {
        $avant = count($s['chaines']); $s['chaines'] = array_values(array_filter($s['chaines'], fn($x) => $x['id'] !== $vid));
        if (count($s['chaines']) === $avant) mc_err(404, 'Chaîne introuvable.');
        mc_reglage('shorts-cache-' . $vid, ''); mc_shorts_sources($s); mc_journal($qui, 'chaîne de shorts retirée', $vid); $rend('Chaîne retirée du fil.');
    }
    if ($f === 'retirer-video') {
        $s['videos'] = array_values(array_filter($s['videos'], fn($x) => $x['id'] !== $vid)); mc_shorts_sources($s); mc_journal($qui, 'short retiré', $vid); $rend('Vidéo retirée du fil.');
    }
    if ($f === 'cacher' || $f === 'montrer') {
        if (!preg_match('/^[\w-]{11}$/', $vid)) mc_err(400, 'Vidéo inconnue.');
        $s['caches'] = array_values(array_diff($s['caches'], [$vid])); if ($f === 'cacher') $s['caches'][] = $vid;
        mc_shorts_sources($s); mc_journal($qui, $f === 'cacher' ? 'short caché' : 'short remontré', $vid); $rend($f === 'cacher' ? 'Ce short est caché.' : 'Ce short est de nouveau dans le fil.');
    }
    if ($f === 'actualiser') { mc_shorts(true); $rend('Les chaînes sont relues sur YouTube.'); }
    mc_err(400, 'Action inconnue.');
}

if ($a === 'utilisateurs') {
    if ($methode === 'GET') {
        $l = $db->query('SELECT u.*, (SELECT COUNT(*) FROM posts WHERE author = u.id) np, (SELECT COUNT(*) FROM follows WHERE followed = u.id) nf,
            (SELECT COUNT(*) FROM signalements s WHERE s.etat = \'ouvert\' AND ((s.genre = \'user\' AND s.cible = u.id) OR (s.genre = \'post\' AND s.cible IN (SELECT id FROM posts WHERE author = u.id)))) ns,
            (SELECT nom FROM invitations i WHERE i.id = u.invitation) invit FROM users u ORDER BY (u.famille IS NULL), u.cree')->fetchAll();
        mc_json(200, ['success' => true, 'data' => array_map(fn($u) => mc_mini($u) + ['name' => $u['name'], 'role' => $u['role'], 'etat' => $u['etat'], 'famille' => $u['famille'],
            'posts' => (int)$u['np'], 'abonnes' => (int)$u['nf'], 'signalements' => (int)$u['ns'], 'invitation' => $u['invit'], 'aMotDePasse' => (bool)$u['pass'],
            'vu' => (int)$u['vu'] ? mc_iso((int)$u['vu']) : null, 'createdAt' => mc_iso((int)$u['cree'])], $l)]);
    }
    $seulAdmin();
    $u = mc_user_par((string)$id); if (!$u) mc_err(404, 'Compte introuvable.');
    $f = (string)($c['faire'] ?? '');
    if ($u['famille'] === 'Anis' && in_array($f, ['suspendre', 'role', 'supprimer'], true)) mc_err(400, 'On ne touche pas au compte d\'Anis.');
    if ($f === 'suspendre' || $f === 'reactiver') {
        $db->prepare('UPDATE users SET etat = ? WHERE id = ?')->execute([$f === 'suspendre' ? 'suspendu' : 'actif', $u['id']]);
        if ($f === 'suspendre') $db->prepare('DELETE FROM sessions WHERE user = ?')->execute([$u['id']]);
        mc_journal($qui, $f, '@' . $u['username']); mc_ok($f === 'suspendre' ? '@' . $u['username'] . ' est suspendu.' : '@' . $u['username'] . ' est réactivé.');
    }
    if ($f === 'role') {
        $r = (string)($c['role'] ?? ''); if (!in_array($r, ['membre', 'moderateur', 'admin'], true)) mc_err(400, 'Rôle inconnu.');
        $db->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$r, $u['id']]); mc_journal($qui, 'rôle', '@' . $u['username'] . ' → ' . $r); mc_ok('Rôle changé.');
    }
    if ($f === 'motdepasse') {   // un mot de passe provisoire, montré une seule fois à Anis
        $mdp = substr(strtr(base64_encode(random_bytes(12)), '+/=', 'xyz'), 0, 14);
        $db->prepare('UPDATE users SET pass = ? WHERE id = ?')->execute([password_hash($mdp, PASSWORD_DEFAULT), $u['id']]);
        $db->prepare('DELETE FROM sessions WHERE user = ?')->execute([$u['id']]);
        mc_journal($qui, 'mot de passe provisoire', '@' . $u['username']); mc_ok('Mot de passe provisoire créé.', ['motdepasse' => $mdp]);
    }
    if ($f === 'supprimer') {
        if ($u['famille']) mc_err(400, 'Les comptes de la famille ne se suppriment pas (suspends-le plutôt).');
        mc_supprime_compte((int)$u['id']); mc_journal($qui, 'compte supprimé', '@' . $u['username']); mc_ok('Compte supprimé.');
    }
    mc_err(400, 'Action inconnue.');
}

if ($a === 'signalements') {
    if ($methode === 'GET') {
        $etat = in_array($_GET['etat'] ?? 'ouvert', ['ouvert', 'traite', 'rejete', 'tous'], true) ? ($_GET['etat'] ?? 'ouvert') : 'ouvert';
        $s = $db->query('SELECT * FROM signalements' . ($etat === 'tous' ? '' : " WHERE etat = '$etat'") . ' ORDER BY cree DESC LIMIT 200');
        $l = $s->fetchAll(); $us = mc_users(array_column($l, 'par'));
        mc_json(200, ['success' => true, 'data' => array_map(fn($x) => ['_id' => (string)$x['id'], 'genre' => $x['genre'], 'raison' => $x['raison'], 'detail' => $x['detail'], 'etat' => $x['etat'],
            'decision' => $x['decision'], 'traitePar' => $x['traite_par'], 'par' => isset($us[(int)$x['par']]) ? mc_mini($us[(int)$x['par']]) : null,
            'cible' => mc_apercu($x['genre'], (int)$x['cible']), 'createdAt' => mc_iso((int)$x['cree'])], $l)]);
    }
    $s = $db->prepare('SELECT * FROM signalements WHERE id = ?'); $s->execute([$id]); $sg = $s->fetch(); if (!$sg) mc_err(404, 'Signalement introuvable.');
    $d = (string)($c['decision'] ?? '');
    if (!in_array($d, ['masquer', 'supprimer', 'rejeter', 'suspendre'], true)) mc_err(400, 'Décision inconnue.');
    if ($d === 'suspendre') { $seulAdmin(); $au = mc_apercu($sg['genre'], (int)$sg['cible'])['auteurId'] ?? null; if ($au) { $db->prepare("UPDATE users SET etat = 'suspendu' WHERE id = ? AND IFNULL(famille, '') != 'Anis'")->execute([$au]); $db->prepare('DELETE FROM sessions WHERE user = ?')->execute([$au]); } }
    if ($d === 'masquer' || $d === 'supprimer') mc_modere($sg['genre'], (int)$sg['cible'], $d);
    $db->prepare('UPDATE signalements SET etat = ?, decision = ?, traite_par = ?, traite_le = ? WHERE (id = ? OR (genre = ? AND cible = ? AND etat = \'ouvert\'))')
       ->execute([$d === 'rejeter' ? 'rejete' : 'traite', $d, $qui, time(), $id, $sg['genre'], $sg['cible']]);
    mc_journal($qui, 'signalement ' . $d, $sg['genre'] . ' #' . $sg['cible']);
    mc_ok('Signalement traité.');
}

if ($a === 'contenus') {
    if ($methode === 'GET') {
        $genre = $_GET['genre'] ?? 'post';
        if ($genre === 'comment') $l = $db->query('SELECT id FROM comments ORDER BY cree DESC LIMIT 100')->fetchAll(PDO::FETCH_COLUMN);
        elseif ($genre === 'story') $l = $db->query('SELECT id FROM stories WHERE expire > ' . time() . ' ORDER BY cree DESC LIMIT 100')->fetchAll(PDO::FETCH_COLUMN);
        else { $genre = 'post'; $l = $db->query('SELECT id FROM posts ORDER BY cree DESC LIMIT 100')->fetchAll(PDO::FETCH_COLUMN); }
        mc_json(200, ['success' => true, 'data' => array_map(fn($i) => mc_apercu($genre, (int)$i), $l)]);
    }
    $genre = (string)($c['genre'] ?? ''); $f = (string)($c['faire'] ?? '');
    if (!in_array($genre, ['post', 'comment', 'story', 'message'], true) || !in_array($f, ['masquer', 'afficher', 'supprimer'], true)) mc_err(400, 'Action inconnue.');
    mc_modere($genre, $id, $f); mc_journal($qui, $f, $genre . ' #' . $id); mc_ok('C\'est fait.');
}

if ($a === 'invitations') {
    $seulAdmin();
    if ($methode === 'GET') {
        $l = $db->query('SELECT i.*, (SELECT GROUP_CONCAT(username, \', \') FROM users WHERE invitation = i.id) comptes FROM invitations i ORDER BY cree DESC LIMIT 100')->fetchAll();
        mc_json(200, ['success' => true, 'data' => array_map(fn($i) => ['_id' => (string)$i['id'], 'nom' => $i['nom'], 'creePar' => $i['cree_par'], 'usages' => (int)$i['usages'], 'usagesMax' => (int)$i['usages_max'],
            'expire' => mc_iso((int)$i['expire']), 'valable' => !$i['revoquee'] && $i['expire'] > time() && $i['usages'] < $i['usages_max'], 'revoquee' => (bool)$i['revoquee'],
            'comptes' => (string)$i['comptes'], 'createdAt' => mc_iso((int)$i['cree'])], $l)]);
    }
    if ($id && ($p[3] ?? '') === 'revoquer') { $db->prepare('UPDATE invitations SET revoquee = 1 WHERE id = ?')->execute([$id]); mc_journal($qui, 'invitation retirée', '#' . $id); mc_ok('Invitation retirée.'); }
    $nom = mc_txt('nom', 40); $jours = max(1, min(30, (int)($c['jours'] ?? 7))); $max = max(1, min(20, (int)($c['usages'] ?? 1)));
    $code = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');   // montré une seule fois : la base ne garde que son empreinte
    $db->prepare('INSERT INTO invitations (hash, nom, cree_par, cree, expire, usages_max) VALUES (?, ?, ?, ?, ?, ?)')->execute([hash('sha256', $code), $nom, $qui, time(), time() + $jours * 86400, $max]);
    mc_journal($qui, 'invitation créée', $nom . ' · ' . $jours . ' j · ' . $max);
    mc_ok('Invitation créée.', ['code' => $code, 'lien' => '/reseau/inscription/?code=' . $code], 201);
}

/* ---------- recopier l'ancien mur de la famille (26/11) : photos, dessins et vidéos, avec leurs commentaires ---------- */
if ($a === 'migrer-mur') {
    $seulAdmin();
    $src = ga_donnees() . '/mur.sqlite'; $dos = ga_donnees() . '/mur';
    if (!is_file($src)) mc_json(200, ['success' => true, 'total' => 0, 'faits' => 0, 'restants' => 0, 'textes' => 0, 'absent' => true]);
    $mur = new PDO('sqlite:' . $src); $mur->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); $mur->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $mur->exec('PRAGMA busy_timeout = 4000');
    $cols = array_column($mur->query('PRAGMA table_info(messages)')->fetchAll(), 'name');
    $g = in_array('genre', $cols, true) ? 'genre' : "''"; $md = in_array('media', $cols, true) ? 'media' : "''";
    $tous = $mur->query("SELECT id, auteur, texte, img, cree, $g AS genre, $md AS media FROM messages ORDER BY id")->fetchAll();
    $avecMedia = array_values(array_filter($tous, fn($x) => $x['genre'] === 'video' || (int)$x['img'] === 1));
    $deja = array_flip(array_map('intval', $db->query('SELECT mur FROM import_mur')->fetchAll(PDO::FETCH_COLUMN)));
    $aFaire = array_values(array_filter($avecMedia, fn($x) => !isset($deja[(int)$x['id']])));
    $etat = fn($faits = 0, $sautes = []) => mc_json(200, ['success' => true, 'total' => count($avecMedia), 'faits' => $faits, 'restants' => count($aFaire) - $faits - count($sautes),
        'deja' => count($deja), 'textes' => count($tous) - count($avecMedia), 'sautes' => $sautes]);
    if ($methode !== 'POST') $etat();

    // qui a écrit sur le mur → quel compte de la famille (sinon le compte d'Anis, avec le prénom devant le texte)
    $comptes = []; foreach ($db->query('SELECT id, famille FROM users WHERE famille IS NOT NULL')->fetchAll() as $u) $comptes[mb_strtolower($u['famille'])] = (int)$u['id'];
    $alias = ['papa' => 'anis', 'maman' => 'imen'];
    $qui = function (string $nom) use ($comptes, $alias): array {
        $k = mb_strtolower(trim($nom)); $k = $alias[$k] ?? $k;
        return isset($comptes[$k]) ? [$comptes[$k], ''] : [$comptes['anis'], trim($nom)];
    };
    $copie = function (string $fichier, int $owner, string $mime, string $ext) use ($db): ?string {
        if (!is_file($fichier)) return null;
        $cle = bin2hex(random_bytes(16)) . '.' . $ext;
        if (!@copy($fichier, mc_dossier() . '/media/' . $cle)) return null;
        $wh = $ext === 'webp' ? (@getimagesize($fichier) ?: [null, null]) : [null, null];
        $db->prepare('INSERT INTO media (cle, owner, mime, taille, w, h, cree) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$cle, $owner, $mime, filesize($fichier), $wh[0], $wh[1], time()]);
        return $cle;
    };
    // la musique d'une vidéo « d'origine » (jouée par-dessus) : copiée une seule fois dans Mechmoum
    $musiques = [];
    $musique = function (string $id) use (&$musiques, $copie, $comptes): ?string {
        if ($id === '' || !preg_match('/^[a-z0-9-]{1,40}$/', $id)) return null;
        if (isset($musiques[$id])) return $musiques[$id];
        $cle = mc_reglage('mur-musique-' . $id);
        if ($cle && is_file(mc_dossier() . '/media/' . $cle)) return $musiques[$id] = $cle;
        $f = str_starts_with($id, 'el-') ? ga_donnees() . '/mur-musique/' . $id . '.mp3' : ga_racine() . '/mur/musique/' . $id . '.mp3';
        $cle = $copie($f, $comptes['anis'], 'audio/mpeg', 'mp3');
        if ($cle) mc_reglage('mur-musique-' . $id, $cle);
        return $musiques[$id] = $cle;
    };

    $faits = 0; $sautes = []; $debut = microtime(true);
    foreach ($aFaire as $m) {
        if ($faits >= 20 || microtime(true) - $debut > 20) break;   // par petits paquets : l'écran relance tout seul
        [$auteur, $prenom] = $qui((string)$m['auteur']);
        $texte = trim((string)$m['texte']); if ($prenom !== '') $texte = '📌 ' . $prenom . ($texte !== '' ? ' : ' . $texte : '');
        $id = (int)$m['id']; $poster = (int)$m['img'] === 1 ? $copie("$dos/$id.webp", $auteur, 'image/webp', 'webp') : null;
        if ($m['genre'] === 'video') {
            $p = explode('|', (string)$m['media']); $ext = in_array($p[0] ?? '', ['mp4', 'webm'], true) ? $p[0] : 'mp4';
            $video = $copie("$dos/$id.$ext", $auteur, $ext === 'webm' ? 'video/webm' : 'video/mp4', $ext);
            if (!$video) { $sautes[] = $id; $db->prepare('INSERT OR IGNORE INTO import_mur (mur, post, cree) VALUES (?, NULL, ?)')->execute([$id, time()]); mc_efface_media($poster); continue; }
            $mus = null; if (($p[2] ?? '') === 'o' && ($k = $musique((string)($p[1] ?? '')))) $mus = $k . '|' . round((float)($p[3] ?? 1), 2) . '|' . round((float)($p[4] ?? .7), 2);
            $db->prepare('INSERT INTO posts (author, caption, type, media, poster, cree, musique) VALUES (?, ?, \'video\', ?, ?, ?, ?)')->execute([$auteur, mb_substr($texte, 0, 2200), $video, $poster, (int)$m['cree'], $mus]);
        } else {
            if (!$poster) { $sautes[] = $id; $db->prepare('INSERT OR IGNORE INTO import_mur (mur, post, cree) VALUES (?, NULL, ?)')->execute([$id, time()]); continue; }
            $db->prepare('INSERT INTO posts (author, caption, type, media, cree) VALUES (?, ?, \'image\', ?, ?)')->execute([$auteur, mb_substr($texte, 0, 2200), $poster, (int)$m['cree']]);
        }
        $post = (int)$db->lastInsertId();
        $db->prepare('INSERT OR REPLACE INTO import_mur (mur, post, cree) VALUES (?, ?, ?)')->execute([$id, $post, time()]);
        try {
            $c = $mur->prepare('SELECT id, auteur, texte, cree FROM commentaires WHERE message = ? ORDER BY id'); $c->execute([$id]);
            foreach ($c->fetchAll() as $co) {
                [$ca, $cp] = $qui((string)$co['auteur']);
                $db->prepare('INSERT INTO comments (post, author, text, cree) VALUES (?, ?, ?, ?)')->execute([$post, $ca, mb_substr(($cp !== '' ? $cp . ' : ' : '') . $co['texte'], 0, 1000), (int)$co['cree']]);
                $db->prepare('INSERT OR IGNORE INTO import_mur_com (com, comment) VALUES (?, ?)')->execute([(int)$co['id'], (int)$db->lastInsertId()]);
            }
        } catch (Throwable $e) { /* ancien mur sans commentaires */ }
        $faits++;
    }
    mc_journal($moi['username'], 'mur recopié', $faits . ' publication(s)' . ($sautes ? ', ' . count($sautes) . ' fichier(s) manquant(s)' : ''));
    $etat($faits, $sautes);
}

if ($a === 'reglages' && $methode === 'POST') {
    $seulAdmin();
    if (isset($c['prive'])) mc_reglage('prive', !empty($c['prive']) && $c['prive'] !== 'false' && $c['prive'] !== '0' ? '1' : '0');
    if (isset($c['inscriptions'])) mc_reglage('inscriptions', !empty($c['inscriptions']) && $c['inscriptions'] !== 'false' && $c['inscriptions'] !== '0' ? '1' : '0');
    if (isset($c['enfants_dm'])) mc_reglage('enfants_dm', $c['enfants_dm'] === 'tous' ? 'tous' : 'famille');
    mc_journal($qui, 'réglages', json_encode(array_intersect_key($c, array_flip(['prive', 'inscriptions', 'enfants_dm']))));
    mc_ok('Réglages enregistrés.');
}

if ($a === 'journal') {
    mc_json(200, ['success' => true, 'data' => array_map(fn($x) => ['qui' => $x['qui'], 'action' => $x['action'], 'detail' => $x['detail'], 'createdAt' => mc_iso((int)$x['ts'])],
        $db->query('SELECT * FROM journal ORDER BY id DESC LIMIT 300')->fetchAll())]);
}

if ($a === 'sauvegarde' && $methode === 'POST') {   // une copie complète : la base (copie propre) + tous les fichiers, dans un zip
    $seulAdmin();
    if (!class_exists('ZipArchive')) mc_err(500, 'ZipArchive manque sur le serveur.');
    $dos = mc_dossier(); $tmp = $dos . '/sauvegarde-' . date('Ymd-His') . '.sqlite'; @unlink($tmp);
    $db->exec('VACUUM INTO ' . $db->quote($tmp));
    $zip = $dos . '/mechmoum-sauvegarde-' . date('Y-m-d-His') . '.zip'; $z = new ZipArchive();
    $z->open($zip, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $z->addFile($tmp, 'mechmoum.sqlite');
    foreach (glob($dos . '/media/*') as $f) $z->addFile($f, 'media/' . basename($f));
    $z->addFromString('LISEZMOI.txt', "Sauvegarde de Mechmoum du " . date('d/m/Y H:i') . ".\nRestauration : voir docs/reseau.md (section Sauvegarde et restauration).\n");
    $z->close(); @unlink($tmp);
    foreach (array_slice(array_reverse(glob($dos . '/mechmoum-sauvegarde-*.zip')), 3) as $vieux) @unlink($vieux);   // on garde les 3 dernières
    mc_journal($qui, 'sauvegarde', basename($zip));
    mc_ok('Sauvegarde prête.', ['fichier' => basename($zip), 'taille' => filesize($zip)]);
}
if ($a === 'sauvegarde' && $methode === 'GET') {
    $seulAdmin();
    $f = basename((string)($_GET['f'] ?? ''));
    if (!preg_match('/^mechmoum-sauvegarde-[\d-]+\.zip$/', $f) || !is_file(mc_dossier() . '/' . $f)) {
        mc_json(200, ['success' => true, 'data' => array_map(fn($x) => ['fichier' => basename($x), 'taille' => filesize($x), 'date' => mc_iso(filemtime($x))], array_reverse(glob(mc_dossier() . '/mechmoum-sauvegarde-*.zip')))]);
    }
    header('Content-Type: application/zip'); header('Content-Disposition: attachment; filename="' . $f . '"'); header('Content-Length: ' . filesize(mc_dossier() . '/' . $f));
    readfile(mc_dossier() . '/' . $f); exit;
}

mc_err(404, 'Route inconnue');

/* ---------- les aides de la modération ---------- */
function mc_apercu(string $genre, int $id): array {
    $db = mc_db(); $r = ['genre' => $genre, '_id' => (string)$id, 'existe' => false];
    $one = function ($sql) use ($db, $id) { $s = $db->prepare($sql); $s->execute([$id]); return $s->fetch() ?: null; };
    if ($genre === 'post' && ($x = $one('SELECT * FROM posts WHERE id = ?'))) $r = ['existe' => true, 'auteurId' => (int)$x['author'], 'texte' => $x['caption'], 'type' => $x['type'], 'cache' => (bool)$x['cache'],
        'image' => mc_media_url($x['type'] === 'video' ? ($x['poster'] ?: null) : $x['media']), 'video' => $x['type'] === 'video' ? mc_media_url($x['media']) : null, 'createdAt' => mc_iso((int)$x['cree'])] + $r;
    if ($genre === 'comment' && ($x = $one('SELECT * FROM comments WHERE id = ?'))) $r = ['existe' => true, 'auteurId' => (int)$x['author'], 'texte' => $x['text'], 'cache' => (bool)$x['cache'], 'postId' => (string)$x['post'], 'createdAt' => mc_iso((int)$x['cree'])] + $r;
    if ($genre === 'story' && ($x = $one('SELECT * FROM stories WHERE id = ?'))) $r = ['existe' => true, 'auteurId' => (int)$x['author'], 'type' => $x['type'], 'cache' => (bool)$x['cache'],
        'image' => mc_media_url($x['type'] === 'video' ? ($x['poster'] ?: null) : $x['media']), 'video' => $x['type'] === 'video' ? mc_media_url($x['media']) : null, 'createdAt' => mc_iso((int)$x['cree'])] + $r;
    if ($genre === 'message' && ($x = $one('SELECT * FROM messages WHERE id = ?'))) $r = ['existe' => true, 'auteurId' => (int)$x['sender'], 'texte' => $x['message'], 'cache' => (bool)$x['cache'], 'createdAt' => mc_iso((int)$x['cree'])] + $r;
    if ($genre === 'user' && ($x = $one('SELECT * FROM users WHERE id = ?'))) $r = ['existe' => true, 'auteurId' => (int)$x['id'], 'texte' => $x['bio'], 'image' => $x['image'], 'etat' => $x['etat']] + $r;
    if (isset($r['auteurId'])) { $u = mc_users([$r['auteurId']])[$r['auteurId']] ?? null; $r['auteur'] = $u ? mc_mini($u) + ['name' => $u['name']] : null; }
    return $r;
}
function mc_modere(string $genre, int $id, string $faire): void {
    $db = mc_db();
    $table = ['post' => 'posts', 'comment' => 'comments', 'story' => 'stories', 'message' => 'messages'][$genre] ?? null;
    if (!$table) return;
    if ($faire === 'supprimer') {
        if ($genre === 'post' || $genre === 'story') { $s = $db->prepare("SELECT media, poster, musique FROM $table WHERE id = ?"); $s->execute([$id]); if ($m = $s->fetch()) { mc_efface_media($m['media']); mc_efface_media($m['poster']); mc_efface_musique($m['musique']); } }
        $db->prepare("DELETE FROM $table WHERE id = ?")->execute([$id]);
    } else $db->prepare("UPDATE $table SET cache = ? WHERE id = ?")->execute([$faire === 'masquer' ? 1 : 0, $id]);
}
