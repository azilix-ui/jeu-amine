<?php
/*
 * Mechmoum — toutes les routes de l'API (/reseau/api/…), appelées par l'interface compilée.
 * Mêmes adresses et mêmes réponses que le serveur Express d'origine (users, posts, comments, messages, stories, notifications),
 * plus : auth (comptes de la famille et invitations), temps-reel (à la place de Socket.IO), reels, signalements, admin.
 */
declare(strict_types=1);
require __DIR__ . '/lib.php';
ga_garde_api();   // la porte du site d'abord (appareils de confiance, invitations)

$methode = $_SERVER['REQUEST_METHOD'];
$chemin = trim((string)parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH), '/');
$chemin = preg_replace('#^reseau/api/?#', '', $chemin);
$p = $chemin === '' ? [] : array_map('rawurldecode', explode('/', $chemin));
$route = $p[0] ?? '';

// Les fichiers (photos, vidéos) : GET /media/<clé>
if ($route === 'media' && $methode === 'GET') mc_sert_media((string)($p[1] ?? ''));

// Toute écriture doit venir de l'interface (en-tête qu'un autre site ne peut pas envoyer) : pas de requête forgée.
if ($methode !== 'GET' && ($_SERVER['HTTP_X_MECHMOUM'] ?? '') !== '1') mc_err(400, 'Requête refusée.');
$db = mc_db();
$q = fn(string $k, $d = null) => $_GET[$k] ?? $d;

/* ===================== auth ===================== */
if ($route === 'auth') {
    $a = $p[1] ?? '';
    if ($a === 'session') {   // qui est connecté (+ ce que le site sait : session de la famille, réglages)
        $u = mc_moi(); $qui = function_exists('ga_qui') ? ga_qui() : null;
        mc_json(200, ['success' => true, 'user' => $u ? mc_profil_moi($u) : null, 'famille' => $qui ? ['nom' => $qui['nom'], 'role' => $qui['role']] : null,
            'adminSite' => ga_admin(), 'prive' => mc_reglage('prive', null, '1') === '1', 'nom' => 'Mechmoum']);
    }
    if ($a === 'famille' && $methode === 'POST') {   // entrer avec la session du site (code secret des enfants, mot de passe parent) ou l'administration
        $qui = function_exists('ga_qui') ? ga_qui() : null;
        $nom = $qui && isset(MC_FAMILLE[$qui['nom']]) && !$qui['ctrl_par'] ? $qui['nom'] : (ga_admin() ? 'Anis' : null);
        if (!$nom) mc_err(403, 'Entre d\'abord sur le site avec ton prénom et ton code (« Qui es-tu ? »).');
        $s = $db->prepare('SELECT * FROM users WHERE famille = ?'); $s->execute([$nom]); $u = $s->fetch();
        if (!$u || $u['etat'] !== 'actif') mc_err(403, 'Ce compte est suspendu.');
        mc_ouvre_session((int)$u['id']); mc_journal($nom, 'connexion', 'session du site');
        mc_ok('Connecté', ['user' => mc_profil_moi($u)]);
    }
    if ($a === 'connexion' && $methode === 'POST') {
        $id = mc_txt('identifiant', 60); $mdp = (string)(mc_corps()['motdepasse'] ?? '');
        $cle = 'cx:' . ga_ip();
        if (mc_trop($cle) || mc_trop('cx:' . strtolower($id), 6)) mc_err(429, 'Trop d\'essais. Réessaie dans 15 minutes.');
        $s = $db->prepare('SELECT * FROM users WHERE username = ?'); $s->execute([ltrim($id, '@')]); $u = $s->fetch();
        if (!$u || !$u['pass'] || !password_verify($mdp, $u['pass'])) { mc_echec($cle); mc_echec('cx:' . strtolower($id)); usleep(400000); mc_err(401, 'Identifiant ou mot de passe incorrect.'); }
        if ($u['etat'] !== 'actif') mc_err(403, 'Ce compte est suspendu. Demande à Anis.');
        if (password_needs_rehash($u['pass'], PASSWORD_DEFAULT)) $db->prepare('UPDATE users SET pass = ? WHERE id = ?')->execute([password_hash($mdp, PASSWORD_DEFAULT), $u['id']]);
        mc_ouvre_session((int)$u['id']); mc_journal($u['username'], 'connexion', 'mot de passe');
        mc_ok('Connecté', ['user' => mc_profil_moi($u)]);
    }
    if ($a === 'invitation') {   // un lien d'invitation est-il encore bon ?
        $inv = mc_invitation((string)$q('code', ''));
        mc_json(200, ['success' => (bool)$inv, 'nom' => $inv['nom'] ?? '', 'ouvert' => mc_reglage('prive', null, '1') !== '1']);
    }
    if ($a === 'inscription' && $methode === 'POST') {
        if (mc_trop('ins:' . ga_ip(), 10, 3600)) mc_err(429, 'Trop d\'essais. Réessaie plus tard.');
        $prive = mc_reglage('prive', null, '1') === '1';
        $inv = mc_invitation(mc_txt('code', 80));
        if ($prive && !$inv) { mc_echec('ins:' . ga_ip()); mc_err(403, 'Mechmoum est privé : il faut un lien d\'invitation valable.'); }
        if (mc_reglage('inscriptions', null, '1') !== '1' && !$inv) mc_err(403, 'Les inscriptions sont fermées.');
        $user = strtolower(mc_txt('username', 30)); $nom = mc_txt('name', 40); $mdp = (string)(mc_corps()['motdepasse'] ?? '');
        if (!preg_match('/^[a-z][a-z0-9._]{2,29}$/', $user)) mc_err(400, 'Nom d\'utilisateur : 3 à 30 caractères, lettres minuscules, chiffres, point ou tiret bas, en commençant par une lettre.');
        if (mb_strlen($nom) < 2) mc_err(400, 'Écris ton prénom.');
        if (strlen($mdp) < 10) mc_err(400, 'Mot de passe trop court (10 caractères au moins).');
        if (in_array($user, MC_FAMILLE, true) || mc_user_par($user)) mc_err(400, 'Ce nom d\'utilisateur est déjà pris.');
        $t = time();
        $db->prepare('INSERT INTO users (username, name, pass, invitation, cree, maj) VALUES (?, ?, ?, ?, ?, ?)')->execute([$user, $nom, password_hash($mdp, PASSWORD_DEFAULT), $inv['id'] ?? null, $t, $t]);
        $uid = (int)$db->lastInsertId();
        if ($inv) $db->prepare('UPDATE invitations SET usages = usages + 1 WHERE id = ?')->execute([$inv['id']]);
        $f = $db->prepare('INSERT OR IGNORE INTO follows (follower, followed, cree) VALUES (?, ?, ?)');   // il suit les parents pour commencer
        foreach ($db->query("SELECT id FROM users WHERE famille IN ('Anis', 'Imen')")->fetchAll(PDO::FETCH_COLUMN) as $pid) $f->execute([$uid, $pid, $t]);
        mc_journal($user, 'inscription', $inv ? 'invitation n° ' . $inv['id'] . ' (' . $inv['nom'] . ')' : 'libre');
        foreach ($db->query("SELECT id FROM users WHERE role = 'admin'")->fetchAll(PDO::FETCH_COLUMN) as $ad) mc_evt((int)$ad, 'notification', ['type' => 'inscription']);
        mc_ouvre_session($uid);
        mc_ok('Compte créé', ['user' => mc_profil_moi(mc_user_par((string)$uid))], 201);
    }
    if ($a === 'deconnexion' && $methode === 'POST') { mc_ferme_session(); mc_ok('Déconnecté'); }
    $u = mc_exige();
    if ($a === 'motdepasse' && $methode === 'POST') {
        $actuel = (string)(mc_corps()['actuel'] ?? ''); $nouveau = (string)(mc_corps()['nouveau'] ?? '');
        if ($u['pass'] && !password_verify($actuel, $u['pass'])) mc_err(400, 'Mot de passe actuel incorrect.');
        if (strlen($nouveau) < 10) mc_err(400, 'Mot de passe trop court (10 caractères au moins).');
        $db->prepare('UPDATE users SET pass = ?, maj = ? WHERE id = ?')->execute([password_hash($nouveau, PASSWORD_DEFAULT), time(), $u['id']]);
        mc_ok('Mot de passe changé');
    }
    if ($a === 'autres-sessions' && $methode === 'POST') {
        $db->prepare('DELETE FROM sessions WHERE user = ? AND hash != ?')->execute([$u['id'], hash('sha256', (string)$_COOKIE[MC_COOKIE])]);
        mc_ok('Les autres appareils sont déconnectés');
    }
    if ($a === 'supprimer' && $methode === 'POST') {
        if ($u['famille']) mc_err(403, 'Les comptes de la famille ne se suppriment pas ici (demande à Anis).');
        if ($u['pass'] && !password_verify((string)(mc_corps()['motdepasse'] ?? ''), $u['pass'])) mc_err(400, 'Mot de passe incorrect.');
        mc_supprime_compte((int)$u['id']); mc_journal($u['username'], 'suppression', 'par lui-même'); mc_cookie('', time() - 3600);
        mc_ok('Compte supprimé');
    }
    mc_err(404, 'Route inconnue');
}

/* ===================== à partir d'ici, il faut être connecté ===================== */
$moi = mc_exige(); $mid = (int)$moi['id']; $caches = mc_ids_caches($mid);

/* ---------- temps réel ---------- */
if ($route === 'temps-reel') {
    $depuis = (int)$q('depuis', 0);
    if ($depuis <= 0) { $depuis = (int)$db->query('SELECT IFNULL(MAX(id), 0) FROM evenements')->fetchColumn(); $evts = []; }
    else { $s = $db->prepare('SELECT id, type, donnees FROM evenements WHERE pour = ? AND id > ? ORDER BY id LIMIT 200'); $s->execute([$mid, $depuis]);
        $evts = array_map(fn($e) => ['id' => (int)$e['id'], 'type' => $e['type'], 'donnees' => json_decode($e['donnees'], true)], $s->fetchAll());
        if ($evts) $depuis = end($evts)['id']; }
    $en = $db->query('SELECT id FROM users WHERE vu > ' . (time() - 30))->fetchAll(PDO::FETCH_COLUMN);
    mc_json(200, ['success' => true, 'evenements' => $evts, 'dernier' => $depuis, 'enLigne' => array_map('strval', $en)]);
}

/* ---------- les gens ---------- */
if ($route === 'users') {
    $a = $p[1] ?? '';
    if ($a === 'me' && $methode === 'GET') mc_json(200, ['message' => 'Profil', 'success' => true, 'data' => mc_profil_moi($moi)]);
    if ($a === 'suggested') {
        $lim = min(30, max(1, (int)$q('limit', 10)));
        $s = $db->prepare('SELECT u.*, (SELECT COUNT(*) FROM follows f2 WHERE f2.followed = u.id AND f2.follower IN (SELECT followed FROM follows WHERE follower = ?)) AS mutuels
            FROM users u WHERE u.id != ? AND u.etat = \'actif\' AND u.id NOT IN (SELECT followed FROM follows WHERE follower = ?) AND u.id NOT IN (' . mc_in($caches) . ')
            ORDER BY (u.famille IS NOT NULL) DESC, mutuels DESC, u.cree DESC LIMIT ' . $lim);
        $s->execute([$mid, $mid, $mid]);
        $r = [];
        foreach ($s->fetchAll() as $u) {
            $m = $db->prepare('SELECT u.username FROM follows f JOIN users u ON u.id = f.follower WHERE f.followed = ? AND f.follower IN (SELECT followed FROM follows WHERE follower = ?) LIMIT 3');
            $m->execute([$u['id'], $mid]);
            $r[] = mc_mini($u) + ['bio' => $u['bio'], 'name' => $u['name'], 'followedBy' => $m->fetchAll(PDO::FETCH_COLUMN), 'isFollowing' => false];
        }
        mc_json(200, ['message' => 'Suggestions', 'data' => $r, 'success' => true]);
    }
    if ($a === 'search') {
        $t = trim((string)$q('q', '')); if ($t === '') mc_err(400, 'Écris ce que tu cherches.');
        $s = $db->prepare('SELECT * FROM users WHERE id != ? AND etat = \'actif\' AND id NOT IN (' . mc_in($caches) . ') AND (username LIKE ? OR name LIKE ? OR bio LIKE ?) LIMIT ' . min(50, (int)$q('limit', 20)));
        $like = '%' . addcslashes($t, '%_') . '%'; $s->execute([$mid, $like, $like, $like]);
        $r = array_map(fn($u) => mc_mini($u) + ['bio' => $u['bio'], 'name' => $u['name'], 'followersCount' => mc_compte('followed', (int)$u['id']), 'isFollowing' => mc_suit($mid, (int)$u['id'])], $s->fetchAll());
        mc_json(200, ['message' => 'Membres', 'success' => true, 'data' => $r]);
    }
    if ($a === 'is-following') { $u = mc_user_par((string)($p[2] ?? '')); if (!$u) mc_err(404, 'Membre introuvable.'); mc_json(200, ['message' => 'success', 'success' => true, 'data' => mc_suit($mid, (int)$u['id'])]); }
    if ($a === 'toggle-follow' && $methode === 'POST') {
        $u = mc_user_par((string)($p[2] ?? '')); if (!$u || in_array((int)$u['id'], $caches, true)) mc_err(404, 'Membre introuvable.');
        if ((int)$u['id'] === $mid) mc_err(400, 'Tu ne peux pas t\'abonner à toi-même.');
        if (mc_suit($mid, (int)$u['id'])) { $db->prepare('DELETE FROM follows WHERE follower = ? AND followed = ?')->execute([$mid, $u['id']]); mc_denotifie('follow', $mid, (int)$u['id']); mc_ok('Tu ne suis plus ce membre.'); }
        $db->prepare('INSERT OR IGNORE INTO follows (follower, followed, cree) VALUES (?, ?, ?)')->execute([$mid, $u['id'], time()]);
        mc_notifie('follow', $mid, (int)$u['id']); mc_ok('Tu suis ce membre.');
    }
    if (($a === 'block' || $a === 'unblock') && $methode === 'POST') {
        $u = mc_user_par((string)($p[2] ?? '')); if (!$u) mc_err(404, 'Membre introuvable.');
        if ((int)$u['id'] === $mid) mc_err(400, 'Tu ne peux pas te bloquer toi-même.');
        if ($a === 'block') {
            $db->prepare('INSERT OR IGNORE INTO blocks (blocker, blocked, cree) VALUES (?, ?, ?)')->execute([$mid, $u['id'], time()]);
            $db->prepare('DELETE FROM follows WHERE (follower = ? AND followed = ?) OR (follower = ? AND followed = ?)')->execute([$mid, $u['id'], $u['id'], $mid]);
            mc_ok('@' . $u['username'] . ' est bloqué');
        }
        $db->prepare('DELETE FROM blocks WHERE blocker = ? AND blocked = ?')->execute([$mid, $u['id']]); mc_ok('@' . $u['username'] . ' est débloqué');
    }
    if ($a === 'profile' && ($p[2] ?? '') === 'edit' && $methode === 'POST') {
        $ch = []; $c = mc_corps();
        if (isset($c['name'])) { $n = mc_txt('name', 40); if (mb_strlen($n) < 1) mc_err(400, 'Écris ton nom.'); $ch['name'] = $n; }
        if (isset($c['bio'])) $ch['bio'] = mc_txt('bio', 150);
        if (isset($c['gender'])) $ch['gender'] = mc_txt('gender', 30);
        if (isset($c['username']) && !$moi['famille']) {
            $n = strtolower(mc_txt('username', 30));
            if (!preg_match('/^[a-z][a-z0-9._]{2,29}$/', $n)) mc_err(400, 'Nom d\'utilisateur non valable.');
            $o = mc_user_par($n); if ($o && (int)$o['id'] !== $mid) mc_err(400, 'Ce nom d\'utilisateur est déjà pris.');
            $ch['username'] = $n;
        }
        if (!empty($_FILES['image']['tmp_name'])) { $cle = mc_recoit_image($_FILES['image'], $mid, 512); if (str_starts_with($moi['image'], '/reseau/api/media/')) mc_efface_media(basename($moi['image'])); $ch['image'] = mc_media_url($cle); }
        if (isset($c['currentPassword'], $c['newPassword']) && $c['newPassword'] !== '') {
            if ($moi['pass'] && !password_verify((string)$c['currentPassword'], $moi['pass'])) mc_err(400, 'Mot de passe actuel incorrect.');
            if (strlen((string)$c['newPassword']) < 10) mc_err(400, 'Mot de passe trop court (10 caractères au moins).');
            $ch['pass'] = password_hash((string)$c['newPassword'], PASSWORD_DEFAULT);
        }
        if ($ch) { $ch['maj'] = time(); $set = implode(', ', array_map(fn($k) => "$k = ?", array_keys($ch))); $db->prepare("UPDATE users SET $set WHERE id = ?")->execute([...array_values($ch), $mid]); }
        mc_ok('Profil mis à jour.');
    }
    // /users/:id  /users/:id/followers  /users/:id/following
    $u = mc_user_par($a);
    if (!$u || in_array((int)$u['id'], array_diff($caches, mc_bloques_par($mid)), true) || $u['etat'] !== 'actif') mc_err(404, 'Ce compte n\'existe pas ou a été supprimé.');
    $b = $p[2] ?? '';
    if ($b === 'followers' || $b === 'following') {
        $s = $b === 'followers' ? $db->prepare('SELECT u.* FROM follows f JOIN users u ON u.id = f.follower WHERE f.followed = ? ORDER BY f.cree DESC')
                                : $db->prepare('SELECT u.* FROM follows f JOIN users u ON u.id = f.followed WHERE f.follower = ? ORDER BY f.cree DESC');
        $s->execute([$u['id']]);
        $r = [];
        foreach ($s->fetchAll() as $x) if (!in_array((int)$x['id'], $caches, true)) $r[] = mc_mini($x) + ['name' => $x['name'], 'isFollowing' => mc_suit($mid, (int)$x['id'])];
        mc_json(200, ['message' => 'ok', 'data' => $r, 'success' => true]);
    }
    $fo = $db->prepare('SELECT u.id AS _id, u.username FROM follows f JOIN users u ON u.id = f.follower WHERE f.followed = ?'); $fo->execute([$u['id']]);
    $fi = $db->prepare('SELECT u.id AS _id, u.username FROM follows f JOIN users u ON u.id = f.followed WHERE f.follower = ?'); $fi->execute([$u['id']]);
    $str = fn($l) => array_map(fn($x) => ['_id' => (string)$x['_id'], 'username' => $x['username']], $l);
    mc_json(200, ['message' => 'Profil', 'success' => true, 'data' => mc_mini($u) + ['name' => $u['name'], 'bio' => $u['bio'], 'gender' => $u['gender'],
        'followers' => $str($fo->fetchAll()), 'following' => $str($fi->fetchAll()), 'createdAt' => mc_iso((int)$u['cree']), 'isBlocked' => in_array((int)$u['id'], mc_bloques_par($mid), true),
        'postsCount' => mc_compte('posts', (int)$u['id']), 'famille' => (bool)$u['famille']]]);
}

/* ---------- les Shorts (27/11) : les petites vidéos d'une chaîne YouTube choisie par le papa, lues avec le lecteur officiel de YouTube.
   Liste lue sur le serveur (page /shorts de la chaîne, sinon le flux RSS de ses shorts), gardée 6 h dans les réglages. ---------- */
const MC_SHORTS = ['nom' => 'Quelle Histoire', 'handle' => 'QuelleHistoireParis', 'id' => 'UCoejzfiaEjCusdpdX9W8jBQ'];
function mc_web(string $url): string {
    $c = curl_init($url);
    curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_TIMEOUT => 12, CURLOPT_ENCODING => '',
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        CURLOPT_HTTPHEADER => ['Accept-Language: fr-FR,fr;q=0.9', 'Cookie: SOCS=CAI; CONSENT=YES+cb'] ]);
    $r = curl_exec($c); $ok = curl_getinfo($c, CURLINFO_HTTP_CODE) === 200; curl_close($c);
    return $ok && is_string($r) ? $r : '';
}
function mc_shorts(bool $force = false): array {
    $mem = json_decode(mc_reglage('shorts-cache'), true);
    if (!$force && is_array($mem) && ($mem['t'] ?? 0) > time() - 6 * 3600 && !empty($mem['v'])) return $mem['v'];
    $v = [];
    // 1) la page des shorts de la chaîne (environ 48 vidéos, les plus récentes d'abord)
    $h = mc_web('https://www.youtube.com/@' . MC_SHORTS['handle'] . '/shorts?hl=fr');
    if ($h && preg_match_all('/"reelWatchEndpoint":\{"videoId":"([\w-]{11})"/', $h, $m)) foreach ($m[1] as $id) $v[$id] = $v[$id] ?? '';
    if ($h && preg_match_all('/"shortsLockupViewModel".{0,4000}?"videoId":"([\w-]{11})"/s', $h, $m)) foreach ($m[1] as $id) $v[$id] = $v[$id] ?? '';
    if ($h && preg_match_all('/"accessibilityText":"([^"]{3,200}?)(?:, \d|\s*-\s*lire)[^"]*".{0,1500}?"videoId":"([\w-]{11})"/s', $h, $m, PREG_SET_ORDER))
        foreach ($m as $x) if (isset($v[$x[2]]) && $v[$x[2]] === '') $v[$x[2]] = json_decode('"' . $x[1] . '"') ?? $x[1];
    // 2) le flux RSS des shorts de la chaîne (les 15 derniers, avec leur titre)
    $x = mc_web('https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH' . substr(MC_SHORTS['id'], 2));
    if ($x && preg_match_all('#<yt:videoId>([\w-]{11})</yt:videoId>\s*(?:<[^>]+>[^<]*</[^>]+>\s*)*?<title>([^<]*)</title>#', $x, $m, PREG_SET_ORDER))
        foreach ($m as $e) $v[$e[1]] = ($v[$e[1]] ?? '') !== '' ? $v[$e[1]] : html_entity_decode($e[2], ENT_QUOTES);
    $l = [];
    foreach ($v as $id => $t) $l[] = ['id' => $id, 'titre' => $t];
    if (!$l && is_array($mem) && !empty($mem['v'])) return $mem['v'];   // YouTube ne répond pas : on garde l'ancienne liste
    if ($l) mc_reglage('shorts-cache', json_encode(['t' => time(), 'v' => $l]));
    return $l;
}
if ($route === 'shorts') {
    $l = mc_shorts(($_GET['frais'] ?? '') === '1' && mc_admin());
    mc_json(200, ['success' => true, 'chaine' => MC_SHORTS['nom'], 'lien' => 'https://www.youtube.com/@' . MC_SHORTS['handle'] . '/shorts', 'data' => $l]);
}

/* ---------- la musicothèque (26/11) : les morceaux du mur, à mettre sur une publication ---------- */
if ($route === 'musiques') mc_json(200, ['success' => true, 'data' => array_values(array_map(fn($m) => $m + ['ecoute' => str_starts_with($m['id'], 'el-') ? '/api/mur.php?mus=' . $m['id'] : '/mur/musique/' . $m['id'] . '.mp3'], mc_bibliotheque()))]);

/* ---------- les publications ---------- */
if ($route === 'posts') {
    $a = $p[1] ?? '';
    if ($a === 'create' && $methode === 'POST') {
        $cap = mc_txt('caption', 2200);
        [$filtre, $mus] = mc_filtre_musique($mid);
        if (!empty($_FILES['video']['tmp_name'])) {   // un reel (vidéo) + son affiche (image prise par la tablette)
            $v = mc_recoit_video($_FILES['video'], $mid);
            $po = !empty($_FILES['image']['tmp_name']) ? mc_recoit_image($_FILES['image'], $mid, 1080) : null;
            $db->prepare('INSERT INTO posts (author, caption, type, media, poster, cree, musique, filtre) VALUES (?, ?, \'video\', ?, ?, ?, ?, ?)')->execute([$mid, $cap, $v, $po, time(), $mus, $filtre]);
        } else {
            $cle = mc_recoit_image($_FILES['image'] ?? [], $mid);
            $db->prepare('INSERT INTO posts (author, caption, media, cree, musique, filtre) VALUES (?, ?, ?, ?, ?, ?)')->execute([$mid, $cap, $cle, time(), $mus, $filtre]);
        }
        mc_ok('C\'est publié !', ['data' => ['_id' => (string)$db->lastInsertId()]], 201);
    }
    if ($a === 'delete' && $methode === 'POST') {
        $po = mc_post((int)($p[2] ?? 0)); if (!$po) mc_err(404, 'Publication introuvable.');
        if ((int)$po['author'] !== $mid && !mc_admin($moi)) mc_err(403, 'Ce n\'est pas ta publication.');
        mc_supprime_post($po); if ((int)$po['author'] !== $mid) mc_journal($moi['username'], 'post supprimé', '#' . $po['id']);
        mc_ok('Publication supprimée.');
    }
    if ($a === 'toggle-like' && $methode === 'POST') {
        $po = mc_post_visible((int)($p[2] ?? 0), $caches);
        $s = $db->prepare('DELETE FROM likes WHERE post = ? AND user = ?'); $s->execute([$po['id'], $mid]);
        if ($s->rowCount()) { mc_denotifie('like', $mid, (int)$po['author'], (int)$po['id']); mc_ok('Je n\'aime plus'); }
        $db->prepare('INSERT OR IGNORE INTO likes (post, user, cree) VALUES (?, ?, ?)')->execute([$po['id'], $mid, time()]);
        mc_notifie('like', $mid, (int)$po['author'], (int)$po['id']); mc_ok('J\'aime');
    }
    if ($a === 'toggle-bookmark' && $methode === 'POST') {
        $po = mc_post_visible((int)($p[2] ?? 0), $caches);
        $s = $db->prepare('DELETE FROM bookmarks WHERE user = ? AND post = ?'); $s->execute([$mid, $po['id']]);
        if ($s->rowCount()) mc_ok('Retiré des enregistrements');
        $db->prepare('INSERT OR IGNORE INTO bookmarks (user, post, cree) VALUES (?, ?, ?)')->execute([$mid, $po['id'], time()]); mc_ok('Enregistré');
    }
    $base = 'SELECT p.* FROM posts p JOIN users u ON u.id = p.author WHERE p.cache = 0 AND u.etat = \'actif\' AND p.author NOT IN (' . mc_in($caches) . ')';
    if ($a === 'feed') {   // abonnements + mes propres publications (le serveur d'origine oubliait les siennes)
        $page = max(1, (int)$q('page', 1)); $lim = min(30, max(1, (int)$q('limit', 10)));
        $w = ' AND (p.author = ? OR p.author IN (SELECT followed FROM follows WHERE follower = ?))';
        $n = $db->prepare(str_replace('SELECT p.*', 'SELECT COUNT(*)', $base) . $w); $n->execute([$mid, $mid]); $total = (int)$n->fetchColumn();
        $s = $db->prepare($base . $w . ' ORDER BY p.cree DESC, p.id DESC LIMIT ' . $lim . ' OFFSET ' . (($page - 1) * $lim)); $s->execute([$mid, $mid]);
        $l = $s->fetchAll();
        mc_json(200, ['message' => 'Fil', 'success' => true, 'data' => mc_posts($l, $mid, $caches, true), 'pagination' => ['page' => $page, 'limit' => $lim, 'hasMore' => ($page - 1) * $lim + count($l) < $total, 'total' => $total]]);
    }
    if ($a === 'reels') {   // toutes les vidéos de ceux qu'on peut voir, les plus récentes d'abord
        $page = max(1, (int)$q('page', 1)); $lim = min(20, max(1, (int)$q('limit', 6)));
        $s = $db->query($base . ' AND p.type = \'video\' ORDER BY p.cree DESC, p.id DESC LIMIT ' . ($lim + 1) . ' OFFSET ' . (($page - 1) * $lim)); $l = $s->fetchAll();
        $plus = count($l) > $lim; if ($plus) array_pop($l);
        mc_json(200, ['message' => 'Reels', 'success' => true, 'data' => mc_posts($l, $mid, $caches, false), 'pagination' => ['page' => $page, 'hasMore' => $plus]]);
    }
    if ($a === 'explore') {   // les autres (pas mes abonnements), puis tout le reste si c'est vide : la famille est petite
        $lim = min(60, max(1, (int)$q('limit', 30))); $avant = $q('lastCreatedAt') ? mc_t((string)$q('lastCreatedAt')) : PHP_INT_MAX;
        $s = $db->prepare($base . ' AND p.author != ? AND p.cree < ? ORDER BY (p.author IN (SELECT followed FROM follows WHERE follower = ?)) ASC, p.cree DESC LIMIT ' . $lim);
        $s->execute([$mid, $avant, $mid]);
        mc_json(200, ['message' => 'Découvrir', 'data' => mc_posts($s->fetchAll(), $mid, $caches, true), 'success' => true]);
    }
    if ($a === 'search') {
        $t = trim((string)$q('q', '')); if ($t === '') mc_err(400, 'Écris ce que tu cherches.');
        $s = $db->prepare($base . ' AND p.caption LIKE ? ORDER BY p.cree DESC LIMIT ' . min(50, (int)$q('limit', 20))); $s->execute(['%' . addcslashes($t, '%_') . '%']);
        mc_json(200, ['message' => 'Publications', 'success' => true, 'data' => mc_posts($s->fetchAll(), $mid, $caches, false)]);
    }
    if ($a === 'bookmarks') {
        $s = $db->prepare(str_replace('FROM posts p', 'FROM bookmarks bk JOIN posts p ON p.id = bk.post', $base) . ' AND bk.user = ? ORDER BY bk.cree DESC'); $s->execute([$mid]);
        mc_json(200, ['message' => 'Enregistrés', 'success' => true, 'data' => mc_posts($s->fetchAll(), $mid, $caches, false)]);
    }
    if (($p[2] ?? '') === 'likes') {
        $po = mc_post_visible((int)$a, $caches);
        $s = $db->prepare('SELECT u.* FROM likes l JOIN users u ON u.id = l.user WHERE l.post = ? ORDER BY l.cree DESC'); $s->execute([$po['id']]);
        $r = []; foreach ($s->fetchAll() as $u) if (!in_array((int)$u['id'], $caches, true)) $r[] = mc_mini($u) + ['name' => $u['name'], 'isFollowing' => mc_suit($mid, (int)$u['id'])];
        mc_json(200, ['message' => 'J\'aime', 'data' => $r, 'success' => true]);
    }
    if ($a === 'un') { $po = mc_post_visible((int)($p[2] ?? 0), $caches); mc_json(200, ['success' => true, 'data' => mc_posts([$po], $mid, $caches, true)[0]]); }
    // /posts/:username : la grille d'un profil (avec ?type=video pour l'onglet Reels)
    $u = mc_user_par($a); if (!$u || in_array((int)$u['id'], $caches, true)) mc_err(404, 'Membre introuvable.');
    $lim = min(60, max(1, (int)$q('limit', 12))); $avant = $q('lastCreatedAt') ? mc_t((string)$q('lastCreatedAt')) : PHP_INT_MAX;
    $type = $q('type') === 'video' ? ' AND p.type = \'video\'' : '';
    $s = $db->prepare($base . ' AND p.author = ? AND p.cree < ?' . $type . ' ORDER BY p.cree DESC, p.id DESC LIMIT ' . ($lim + 1)); $s->execute([$u['id'], $avant]);
    $l = $s->fetchAll(); $plus = count($l) > $lim; if ($plus) array_pop($l);
    $posts = mc_posts($l, $mid, $caches, false);
    mc_json(200, ['message' => 'Publications', 'success' => true, 'data' => ['posts' => $posts, 'pagination' => ['has_more' => $plus, 'next_cursor' => $plus ? end($posts)['createdAt'] : null]]]);
}

/* ---------- les commentaires ---------- */
if ($route === 'comments') {
    $a = $p[1] ?? '';
    if ($a === 'create' && $methode === 'POST') {
        $po = mc_post_visible((int)($p[2] ?? 0), $caches);
        $t = mc_txt('text', 1000); if ($t === '') mc_err(400, 'Écris ton commentaire.');
        $db->prepare('INSERT INTO comments (post, author, text, cree) VALUES (?, ?, ?, ?)')->execute([$po['id'], $mid, $t, time()]);
        $cid = (int)$db->lastInsertId();
        mc_notifie('comment', $mid, (int)$po['author'], (int)$po['id'], mb_substr($t, 0, 120));
        mc_ok('Commentaire publié', ['data' => mc_comment(['id' => $cid, 'post' => $po['id'], 'author' => $mid, 'text' => $t, 'cree' => time()], $moi)], 201);
    }
    if ($a === 'delete' && $methode === 'POST') {
        $s = $db->prepare('SELECT c.*, p.author AS pauteur FROM comments c JOIN posts p ON p.id = c.post WHERE c.id = ?'); $s->execute([(int)($p[2] ?? 0)]); $c = $s->fetch();
        if (!$c) mc_err(404, 'Commentaire introuvable.');
        // l'auteur du commentaire, l'auteur de la publication, ou l'administration
        if ((int)$c['author'] !== $mid && (int)$c['pauteur'] !== $mid && !mc_admin($moi)) mc_err(403, 'Tu ne peux pas supprimer ce commentaire.');
        $db->prepare('DELETE FROM comments WHERE id = ?')->execute([$c['id']]); mc_ok('Commentaire supprimé');
    }
    if ($a === 'get') {
        $po = mc_post_visible((int)($p[2] ?? 0), $caches);
        $s = $db->prepare('SELECT * FROM comments WHERE post = ? AND cache = 0 AND author NOT IN (' . mc_in($caches) . ') ORDER BY cree'); $s->execute([$po['id']]);
        $l = $s->fetchAll(); $us = mc_users(array_column($l, 'author'));
        mc_json(200, ['message' => 'Commentaires', 'success' => true, 'data' => array_map(fn($c) => mc_comment($c, $us[(int)$c['author']]), $l)]);
    }
}

/* ---------- les stories (24 heures) ---------- */
if ($route === 'stories') {
    $a = $p[1] ?? '';
    if ($a === '' && $methode === 'POST') {
        $v = !empty($_FILES['video']['tmp_name']);
        $cle = $v ? mc_recoit_video($_FILES['video'], $mid) : mc_recoit_image($_FILES['image'] ?? [], $mid, 1440);
        $po = $v && !empty($_FILES['image']['tmp_name']) ? mc_recoit_image($_FILES['image'], $mid, 1080) : null;
        $t = time(); [$filtre, $mus] = mc_filtre_musique($mid);
        $db->prepare('INSERT INTO stories (author, type, media, poster, cree, expire, filtre, musique) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')->execute([$mid, $v ? 'video' : 'image', $cle, $po, $t, $t + 86400, $filtre, $mus]);
        $s = $db->prepare('SELECT * FROM stories WHERE id = ?'); $s->execute([$db->lastInsertId()]);
        mc_ok('Story publiée', ['story' => mc_story($s->fetch(), $moi, $mid)], 201);
    }
    if ($a === '' && $methode === 'GET') {
        mc_menage();
        $s = $db->prepare('SELECT * FROM stories WHERE expire > ? AND cache = 0 AND author NOT IN (' . mc_in($caches) . ') AND (author = ? OR author IN (SELECT followed FROM follows WHERE follower = ?)) ORDER BY cree');
        $s->execute([time(), $mid, $mid]); $l = $s->fetchAll(); $us = mc_users(array_column($l, 'author'));
        $g = [];
        foreach ($l as $st) {
            $au = (int)$st['author'];
            $g[$au] ??= ['author' => ['_id' => (string)$au, 'username' => $us[$au]['username'], 'image' => $us[$au]['image']], 'stories' => [], 'hasNewStory' => false, 'isOwn' => $au === $mid];
            $x = mc_story($st, $us[$au], $mid); $g[$au]['stories'][] = $x; if (!$x['isViewed']) $g[$au]['hasNewStory'] = true;
        }
        uasort($g, fn($x, $y) => [$y['isOwn'], $y['hasNewStory']] <=> [$x['isOwn'], $x['hasNewStory']]);
        mc_json(200, ['message' => 'Stories', 'success' => true, 'stories' => array_values($g)]);
    }
    if ($a === 'user') {
        $au = (int)($p[2] ?? 0); if (in_array($au, $caches, true)) mc_err(404, 'Membre introuvable.');
        $s = $db->prepare('SELECT * FROM stories WHERE author = ? AND expire > ? AND cache = 0 ORDER BY cree'); $s->execute([$au, time()]);
        $u = mc_users([$au])[$au] ?? null; if (!$u) mc_err(404, 'Membre introuvable.');
        mc_json(200, ['message' => 'ok', 'success' => true, 'stories' => array_map(fn($st) => mc_story($st, $u, $mid), $s->fetchAll())]);
    }
    $s = $db->prepare('SELECT * FROM stories WHERE id = ?'); $s->execute([(int)$a]); $st = $s->fetch();
    if (!$st || in_array((int)$st['author'], $caches, true)) mc_err(404, 'Story introuvable.');
    if (($p[2] ?? '') === 'view' && $methode === 'POST') {
        if ((int)$st['author'] !== $mid) $db->prepare('INSERT OR IGNORE INTO story_views (story, user, cree) VALUES (?, ?, ?)')->execute([$st['id'], $mid, time()]);
        mc_ok('Vue');
    }
    if (($p[2] ?? '') === 'viewers') {   // qui a vu ma story (seulement l'auteur)
        if ((int)$st['author'] !== $mid) mc_err(403, 'Seul l\'auteur voit qui a regardé.');
        $v = $db->prepare('SELECT u.* FROM story_views v JOIN users u ON u.id = v.user WHERE v.story = ? ORDER BY v.cree DESC'); $v->execute([$st['id']]);
        mc_json(200, ['success' => true, 'data' => array_map(fn($u) => mc_mini($u) + ['name' => $u['name']], $v->fetchAll())]);
    }
    if ($methode === 'DELETE' || ($p[2] ?? '') === 'delete') {
        if ((int)$st['author'] !== $mid && !mc_admin($moi)) mc_err(403, 'Tu ne peux supprimer que tes stories.');
        mc_efface_media($st['media']); mc_efface_media($st['poster']); mc_efface_musique($st['musique'] ?? null); $db->prepare('DELETE FROM stories WHERE id = ?')->execute([$st['id']]);
        mc_ok('Story supprimée');
    }
    if ($st['expire'] < time()) mc_err(404, 'Cette story a disparu (24 h).');
    mc_json(200, ['message' => 'Story', 'success' => true, 'story' => mc_story($st, mc_users([(int)$st['author']])[(int)$st['author']], $mid)]);
}

/* ---------- les messages privés ---------- */
if ($route === 'messages') {
    $a = $p[1] ?? '';
    if ($a === 'last') {
        $s = $db->prepare('SELECT * FROM chats WHERE (a = ? OR b = ?) ORDER BY IFNULL((SELECT cree FROM messages WHERE id = chats.last_message), cree) DESC'); $s->execute([$mid, $mid]);
        $chats = []; $deja = [];
        foreach ($s->fetchAll() as $c) {
            $autre = (int)$c['a'] === $mid ? (int)$c['b'] : (int)$c['a']; if (in_array($autre, $caches, true)) continue;
            $u = mc_users([$autre])[$autre] ?? null; if (!$u) continue; $deja[] = $autre;
            $lm = null; if ($c['last_message']) { $m = $db->prepare('SELECT * FROM messages WHERE id = ?'); $m->execute([$c['last_message']]); $x = $m->fetch(); if ($x) $lm = ['_id' => (string)$x['id'], 'message' => $x['cache'] ? 'Message retiré par la modération' : $x['message'], 'createdAt' => mc_iso((int)$x['cree'])]; }
            $n = $db->prepare('SELECT COUNT(*) FROM messages m WHERE m.chat = ? AND m.sender != ? AND NOT EXISTS (SELECT 1 FROM message_reads r WHERE r.message = m.id AND r.user = ?)'); $n->execute([$c['id'], $mid, $mid]);
            $chats[] = ['_id' => (string)$c['id'], 'members' => [mc_mini($u)], 'last_message' => $lm, 'unreadCount' => (int)$n->fetchColumn()];
        }
        $s = $db->prepare('SELECT DISTINCT u.* FROM users u WHERE u.id != ? AND u.etat = \'actif\' AND u.id NOT IN (' . mc_in(array_merge($caches, $deja)) . ') AND (u.id IN (SELECT followed FROM follows WHERE follower = ?) OR u.id IN (SELECT follower FROM follows WHERE followed = ?))');
        $s->execute([$mid, $mid, $mid]);
        $dispo = array_values(array_filter(array_map(fn($u) => mc_peut_ecrire($moi, $u) ? mc_mini($u) : null, $s->fetchAll())));
        mc_json(200, ['message' => 'Conversations', 'success' => true, 'data' => ['existingChats' => $chats, 'availableUsersForNewChat' => $dispo]]);
    }
    if ($a === 'envoyer' && $methode === 'POST') {   // à la place de socket.emit("sendMessage")
        $u = mc_user_par(mc_txt('receiver', 60)); $txt = mc_txt('content', 2000);
        if (!$u || in_array((int)$u['id'], $caches, true)) mc_json(200, ['success' => false, 'message' => 'Destinataire introuvable.', 'data' => null]);
        if ($txt === '') mc_json(200, ['success' => false, 'message' => 'Message vide.', 'data' => null]);
        if (!mc_peut_ecrire($moi, $u)) mc_json(200, ['success' => false, 'message' => 'Les enfants n\'écrivent qu\'à la famille.', 'data' => null]);
        if (mc_trop('msg:' . $mid, 40, 60)) mc_json(200, ['success' => false, 'message' => 'Doucement : trop de messages d\'un coup.', 'data' => null]);
        mc_echec('msg:' . $mid);
        [$x, $y] = [min($mid, (int)$u['id']), max($mid, (int)$u['id'])];
        $db->prepare('INSERT OR IGNORE INTO chats (a, b, cree) VALUES (?, ?, ?)')->execute([$x, $y, time()]);
        $c = $db->prepare('SELECT id FROM chats WHERE a = ? AND b = ?'); $c->execute([$x, $y]); $cid = (int)$c->fetchColumn();
        $t = time(); $db->prepare('INSERT INTO messages (chat, sender, message, cree) VALUES (?, ?, ?, ?)')->execute([$cid, $mid, $txt, $t]); $msg = (int)$db->lastInsertId();
        $db->prepare('INSERT OR IGNORE INTO message_reads (message, user) VALUES (?, ?)')->execute([$msg, $mid]);
        $db->prepare('UPDATE chats SET last_message = ? WHERE id = ?')->execute([$msg, $cid]);
        $out = ['_id' => (string)$msg, 'sender' => (string)$mid, 'chat' => (string)$cid, 'message' => $txt, 'read_by' => [(string)$mid], 'createdAt' => mc_iso($t)];
        mc_evt((int)$u['id'], 'newMessage', $out);
        mc_json(200, ['success' => true, 'message' => 'Envoyé', 'data' => $out]);
    }
    if ($a === 'lus' && $methode === 'POST') {
        $cid = (int)(mc_corps()['chatId'] ?? 0); $ids = array_map('intval', (array)(mc_corps()['messageIds'] ?? []));
        $c = $db->prepare('SELECT * FROM chats WHERE id = ? AND (a = ? OR b = ?)'); $c->execute([$cid, $mid, $mid]); $chat = $c->fetch();
        if (!$chat || !$ids) mc_json(200, ['success' => false]);
        $r = $db->prepare('INSERT OR IGNORE INTO message_reads (message, user) SELECT id, ? FROM messages WHERE id = ? AND chat = ?');
        foreach (array_slice($ids, 0, 500) as $i) $r->execute([$mid, $i, $cid]);
        $autre = (int)$chat['a'] === $mid ? (int)$chat['b'] : (int)$chat['a'];
        mc_evt($autre, 'messagesRead', ['chatId' => (string)$cid, 'readerId' => (string)$mid]);
        mc_json(200, ['success' => true]);
    }
    if ($a === 'ecrit' && $methode === 'POST') { $u = mc_user_par(mc_txt('receiver', 60)); if ($u && !in_array((int)$u['id'], $caches, true)) mc_evt((int)$u['id'], 'typing', ['sender' => (string)$mid]); mc_json(200, ['success' => true]); }
    // /messages/:identifier : la conversation avec quelqu'un (les plus récents d'abord, comme l'origine)
    $u = mc_user_par($a); if (!$u || in_array((int)$u['id'], $caches, true)) mc_err(404, 'Membre introuvable.');
    $c = $db->prepare('SELECT id FROM chats WHERE a = ? AND b = ?'); $c->execute([min($mid, (int)$u['id']), max($mid, (int)$u['id'])]); $cid = $c->fetchColumn();
    if (!$cid) mc_err(404, 'Conversation introuvable.');
    $s = $db->prepare('SELECT * FROM messages WHERE chat = ? ORDER BY cree DESC, id DESC LIMIT 500'); $s->execute([$cid]); $l = $s->fetchAll();
    $lus = []; if ($l) { $r = $db->query('SELECT message, user FROM message_reads WHERE message IN (' . mc_in(array_column($l, 'id')) . ')'); foreach ($r->fetchAll() as $x) $lus[(int)$x['message']][] = (string)$x['user']; }
    mc_json(200, ['message' => 'Messages', 'success' => true, 'data' => array_map(fn($m) => ['_id' => (string)$m['id'], 'sender' => (string)$m['sender'], 'chat' => (string)$m['chat'],
        'message' => $m['cache'] ? '🚫 Message retiré par la modération' : $m['message'], 'read_by' => $lus[(int)$m['id']] ?? [], 'createdAt' => mc_iso((int)$m['cree'])], $l)]);
}

/* ---------- les notifications ---------- */
if ($route === 'notifications') {
    $a = $p[1] ?? '';
    if ($a === 'all') {
        $s = $db->prepare('SELECT * FROM notifications WHERE a = ? AND de NOT IN (' . mc_in($caches) . ') ORDER BY cree DESC LIMIT 200'); $s->execute([$mid]); $l = $s->fetchAll();
        $us = mc_users(array_column($l, 'de')); $ps = [];
        if ($l) foreach ($db->query('SELECT * FROM posts WHERE id IN (' . mc_in(array_filter(array_column($l, 'post'))) . ')')->fetchAll() as $x) $ps[(int)$x['id']] = $x;
        mc_json(200, ['success' => true, 'data' => array_values(array_filter(array_map(function ($n) use ($us, $ps, $mid) {
            $u = $us[(int)$n['de']] ?? null; if (!$u) return null; $po = $n['post'] ? ($ps[(int)$n['post']] ?? null) : null;
            return ['_id' => (string)$n['id'], 'type' => $n['type'], 'from' => mc_mini($u), 'to' => (string)$mid, 'post' => $po ? ['_id' => (string)$po['id'], 'image' => mc_media_url($po['poster'] ?: ($po['type'] === 'image' ? $po['media'] : null))] : null,
                'comment' => $n['comment'], 'isRead' => (bool)$n['lu'], 'isFollowing' => mc_suit($mid, (int)$u['id']), 'createdAt' => mc_iso((int)$n['cree'])];
        }, $l)))]);
    }
    if ($a === 'unread-count') { $s = $db->prepare('SELECT COUNT(*) FROM notifications WHERE a = ? AND lu = 0'); $s->execute([$mid]); mc_json(200, ['success' => true, 'count' => (int)$s->fetchColumn()]); }
    if ($a === 'read-all' && $methode === 'POST') { $db->prepare('UPDATE notifications SET lu = 1 WHERE a = ?')->execute([$mid]); mc_json(200, ['success' => true, 'message' => 'Tout est lu.']); }
    if (($p[2] ?? '') === 'read' && $methode === 'POST') { $db->prepare('UPDATE notifications SET lu = 1 WHERE id = ? AND a = ?')->execute([(int)$a, $mid]); mc_json(200, ['success' => true]); }
}

/* ---------- les signalements (tout le monde) ---------- */
if ($route === 'signalements' && $methode === 'POST') {
    $genre = mc_txt('genre', 20); $cible = (int)(mc_corps()['cible'] ?? 0); $raison = mc_txt('raison', 40);
    if (!in_array($genre, ['post', 'comment', 'story', 'user', 'message'], true) || $cible <= 0 || $raison === '') mc_err(400, 'Signalement incomplet.');
    if (mc_trop('sig:' . $mid, 20, 3600)) mc_err(429, 'Trop de signalements d\'un coup.');
    mc_echec('sig:' . $mid);
    $db->prepare('INSERT INTO signalements (par, genre, cible, raison, detail, cree) VALUES (?, ?, ?, ?, ?, ?)')->execute([$mid, $genre, $cible, $raison, mc_txt('detail', 500), time()]);
    foreach ($db->query("SELECT id FROM users WHERE role IN ('admin', 'moderateur')")->fetchAll(PDO::FETCH_COLUMN) as $ad) mc_evt((int)$ad, 'notification', ['type' => 'signalement']);
    mc_ok('Merci, l\'administration va regarder.', [], 201);
}

/* ---------- l'administration ---------- */
if ($route === 'admin') { require __DIR__ . '/admin.php'; }

mc_err(404, 'Route inconnue');

/* ===================== les aides des routes ===================== */
function mc_bloques_par(int $moi): array { $s = mc_db()->prepare('SELECT blocked FROM blocks WHERE blocker = ?'); $s->execute([$moi]); return array_map('intval', $s->fetchAll(PDO::FETCH_COLUMN)); }
function mc_compte(string $quoi, int $id): int {
    $sql = ['followed' => 'SELECT COUNT(*) FROM follows WHERE followed = ?', 'follower' => 'SELECT COUNT(*) FROM follows WHERE follower = ?', 'posts' => 'SELECT COUNT(*) FROM posts WHERE author = ? AND cache = 0', 'bookmarks' => 'SELECT COUNT(*) FROM bookmarks WHERE user = ?'][$quoi];
    $s = mc_db()->prepare($sql); $s->execute([$id]); return (int)$s->fetchColumn();
}
function mc_profil_moi(array $u): array {
    $id = (int)$u['id']; $s = mc_db()->prepare('SELECT post FROM bookmarks WHERE user = ?'); $s->execute([$id]);
    return mc_mini($u) + ['name' => $u['name'], 'email' => '', 'bio' => $u['bio'], 'gender' => $u['gender'], 'role' => $u['role'], 'famille' => $u['famille'],
        'followers' => mc_compte('followed', $id), 'following' => mc_compte('follower', $id), 'followersCount' => mc_compte('followed', $id), 'followingCount' => mc_compte('follower', $id),
        'bookmarks' => array_map('strval', $s->fetchAll(PDO::FETCH_COLUMN)), 'bookmarksCount' => mc_compte('bookmarks', $id), 'aMotDePasse' => (bool)$u['pass'],
        'admin' => mc_admin($u), 'createdAt' => mc_iso((int)$u['cree'])];
}
// Un enfant de la famille n'écrit (et ne reçoit de message) que de la famille, sauf si Anis l'ouvre dans les réglages.
function mc_peut_ecrire(array $de, array $a): bool {
    if (mc_reglage('enfants_dm', null, 'famille') === 'tous') return true;
    $enfant = fn($u) => in_array($u['famille'], ['Essil', 'Salma', 'Amine'], true);
    if ($enfant($de) && !$a['famille']) return false;
    if ($enfant($a) && !$de['famille']) return false;
    return true;
}
function mc_post(int $id): ?array { $s = mc_db()->prepare('SELECT * FROM posts WHERE id = ?'); $s->execute([$id]); return $s->fetch() ?: null; }
function mc_post_visible(int $id, array $caches): array {
    $po = mc_post($id);
    if (!$po || $po['cache'] || in_array((int)$po['author'], $caches, true)) mc_err(404, 'Publication introuvable.');
    return $po;
}
function mc_comment(array $c, array $u): array {
    return ['_id' => (string)$c['id'], 'text' => $c['text'], 'author' => mc_mini($u), 'post' => ['_id' => (string)$c['post']], 'likes' => [], 'createdAt' => mc_iso((int)$c['cree'])];
}
function mc_story(array $st, array $u, int $moi): array {
    $db = mc_db(); $v = $db->prepare('SELECT user FROM story_views WHERE story = ?'); $v->execute([$st['id']]); $vus = array_map('strval', $v->fetchAll(PDO::FETCH_COLUMN));
    $video = $st['type'] === 'video';
    return ['_id' => (string)$st['id'], 'type' => $st['type'], 'image' => mc_media_url($video ? ($st['poster'] ?: null) : $st['media']), 'video' => $video ? mc_media_url($st['media']) : null,
        'author' => ['_id' => (string)$u['id'], 'username' => $u['username'], 'image' => $u['image']],
        'viewers' => (int)$st['author'] === $moi ? $vus : [], 'viewersCount' => count($vus), 'isViewed' => (int)$st['author'] === $moi || in_array((string)$moi, $vus, true),
        'filtre' => (string)($st['filtre'] ?? ''), 'musique' => mc_musique($st['musique'] ?? null),
        'expiresAt' => mc_iso((int)$st['expire']), 'createdAt' => mc_iso((int)$st['cree']), 'updatedAt' => mc_iso((int)$st['cree'])];
}
// Les publications, avec leurs « j'aime », commentaires et enregistrements (en peu de requêtes)
function mc_posts(array $l, int $moi, array $caches, bool $avecComments): array {
    if (!$l) return [];
    $db = mc_db(); $ids = mc_in(array_column($l, 'id'));
    $likes = []; foreach ($db->query("SELECT l.post, u.* FROM likes l JOIN users u ON u.id = l.user WHERE l.post IN ($ids) ORDER BY l.cree")->fetchAll() as $x) if (!in_array((int)$x['id'], $caches, true)) $likes[(int)$x['post']][] = mc_mini($x);
    $nc = []; foreach ($db->query("SELECT post, COUNT(*) n FROM comments WHERE post IN ($ids) AND cache = 0 AND author NOT IN (" . mc_in($caches) . ") GROUP BY post")->fetchAll() as $x) $nc[(int)$x['post']] = (int)$x['n'];
    $nb = []; foreach ($db->query("SELECT post, COUNT(*) n FROM bookmarks WHERE post IN ($ids) GROUP BY post")->fetchAll() as $x) $nb[(int)$x['post']] = (int)$x['n'];
    $mes = []; $s = $db->prepare("SELECT post FROM bookmarks WHERE user = ? AND post IN ($ids)"); $s->execute([$moi]); foreach ($s->fetchAll(PDO::FETCH_COLUMN) as $x) $mes[(int)$x] = true;
    $coms = [];
    if ($avecComments) {
        $cl = $db->query("SELECT * FROM comments WHERE post IN ($ids) AND cache = 0 AND author NOT IN (" . mc_in($caches) . ") ORDER BY cree")->fetchAll();
        $cu = mc_users(array_column($cl, 'author'));
        foreach ($cl as $c) if (isset($cu[(int)$c['author']])) $coms[(int)$c['post']][] = mc_comment($c, $cu[(int)$c['author']]);
    }
    $us = mc_users(array_column($l, 'author'));
    return array_values(array_filter(array_map(function ($po) use ($us, $likes, $nc, $nb, $mes, $coms, $avecComments) {
        $u = $us[(int)$po['author']] ?? null; if (!$u) return null; $id = (int)$po['id']; $video = $po['type'] === 'video';
        $r = ['_id' => (string)$id, 'caption' => $po['caption'], 'type' => $po['type'], 'image' => mc_media_url($video ? ($po['poster'] ?: null) : $po['media']), 'video' => $video ? mc_media_url($po['media']) : null, 'musique' => mc_musique($po['musique'] ?? ''), 'filtre' => (string)($po['filtre'] ?? ''),
            'author' => mc_mini($u, false) + ['_id' => (string)$u['id']], 'likes' => $likes[$id] ?? [], 'isBookmarked' => isset($mes[$id]), 'bookmarksCount' => $nb[$id] ?? 0,
            'commentsCount' => $nc[$id] ?? 0, 'createdAt' => mc_iso((int)$po['cree'])];
        if ($avecComments) $r['comments'] = $coms[$id] ?? [];
        return $r;
    }, $l)));
}
// « cle|volume vidéo|volume musique » → ce que l'interface joue par-dessus la vidéo
// 26/11 : le filtre et la musique envoyés avec une publication ou une story
function mc_filtre_musique(int $mid): array {
    $filtre = mc_txt('filtre', 20); if (!in_array($filtre, MC_FILTRES, true)) $filtre = '';
    // la musique (un morceau de la musicothèque du mur, ou un morceau envoyé), jouée par-dessus : « clé|volume vidéo|volume musique|titre|p (envoyé) »
    $mus = null; $vv = max(0, min(1, (float)($_POST['volV'] ?? 1))); $vm = max(0, min(1, (float)($_POST['volM'] ?? .8)));
    if (!empty($_FILES['son']['tmp_name'])) {
        $k = mc_recoit_son($_FILES['son'], $mid); $t = str_replace('|', ' ', mc_txt('titreMusique', 60)) ?: 'Ma musique';
        $mus = $k . '|' . round($vv, 2) . '|' . round($vm, 2) . '|' . $t . '|p';
    } elseif (($id = mc_txt('musique', 40)) !== '') {
        $bib = mc_bibliotheque(); if (!isset($bib[$id])) mc_err(400, 'Musique inconnue.');
        $k = mc_musique_biblio($id, $mid); if (!$k) mc_err(404, 'Cette musique n\'est pas sur le serveur.');
        $mus = $k . '|' . round($vv, 2) . '|' . round($vm, 2) . '|' . str_replace('|', ' ', $bib[$id]['emoji'] . ' ' . $bib[$id]['titre']);
    }
    return [$filtre, $mus];
}
// le morceau envoyé part avec ce qui le porte (pas ceux de la musicothèque, partagés)
function mc_efface_musique(?string $m): void { $x = explode('|', (string)$m); if (($x[4] ?? '') === 'p') mc_efface_media($x[0]); }
function mc_musique(?string $m): ?array {
    if (!$m) return null; $x = explode('|', $m);
    return ['src' => mc_media_url($x[0]), 'volV' => (float)($x[1] ?? 1), 'volM' => (float)($x[2] ?? .7), 'titre' => $x[3] ?? ''];
}
// Le ménage (1 fois sur 20) : les stories finies depuis 2 jours (et leurs fichiers), les notifications lues de plus de 6 mois
function mc_menage(): void {
    if (random_int(1, 20) !== 1) return;
    $db = mc_db(); $t = time();
    foreach ($db->query('SELECT id, media, poster, musique FROM stories WHERE expire < ' . ($t - 2 * 86400))->fetchAll() as $st) { mc_efface_media($st['media']); mc_efface_media($st['poster']); mc_efface_musique($st['musique']); $db->prepare('DELETE FROM stories WHERE id = ?')->execute([$st['id']]); }
    $db->exec('DELETE FROM notifications WHERE lu = 1 AND cree < ' . ($t - 180 * 86400));
}
function mc_supprime_post(array $po): void {
    mc_efface_media($po['media']); mc_efface_media($po['poster']);
    mc_efface_musique($po['musique'] ?? null);
    mc_db()->prepare('DELETE FROM posts WHERE id = ?')->execute([$po['id']]);
}
function mc_supprime_compte(int $uid): void {
    $db = mc_db();
    foreach ($db->query("SELECT media, poster FROM posts WHERE author = $uid UNION ALL SELECT media, poster FROM stories WHERE author = $uid")->fetchAll() as $m) { mc_efface_media($m['media']); mc_efface_media($m['poster']); }
    $s = $db->prepare('SELECT image FROM users WHERE id = ?'); $s->execute([$uid]); $im = (string)$s->fetchColumn();
    if (str_starts_with($im, '/reseau/api/media/')) mc_efface_media(basename($im));
    $db->prepare('DELETE FROM users WHERE id = ? AND famille IS NULL')->execute([$uid]);
}
function mc_invitation(string $code): ?array {
    if (!preg_match('/^[A-Za-z0-9_-]{20,80}$/', $code)) return null;
    $s = mc_db()->prepare('SELECT * FROM invitations WHERE hash = ? AND revoquee = 0 AND expire > ? AND usages < usages_max'); $s->execute([hash('sha256', $code), time()]);
    return $s->fetch() ?: null;
}
