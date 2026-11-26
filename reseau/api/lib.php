<?php
/*
 * Mechmoum (مشموم) — le réseau social privé de la famille Missaoui (26/11/2026).
 * Interface : reprise du projet « instagram-clone » de Rohit Yadav (licence MIT, voir /reseau/LICENCES.txt),
 * compilée en fichiers simples dans /reseau/. Le serveur d'origine (Node.js, MongoDB, Cloudinary, Socket.IO)
 * est remplacé par ce serveur PHP + SQLite : tout reste chez Hostinger, rien ne part chez un service extérieur.
 *
 * Ce fichier : la base, les sessions, les droits, les envois de fichiers, les réponses JSON.
 * Les routes sont dans index.php (mêmes adresses et mêmes réponses que le serveur d'origine, + reels, signalements, admin).
 */
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/acces/garde.php';

const MC_COOKIE = 'mch_s';
const MC_DUREE = 30 * 86400;          // une session dure 30 jours, prolongée quand on revient
const MC_IMG_MAX = 15 * 1024 * 1024;  // 15 Mo par photo
const MC_VID_MAX = 80 * 1024 * 1024;  // 80 Mo par vidéo
const MC_FAMILLE = ['Anis' => 'anis', 'Imen' => 'imen', 'Essil' => 'essil', 'Salma' => 'salma', 'Amine' => 'amine'];

/* ---------- réponses ---------- */
function mc_json(int $code, array $d): never {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function mc_ok(string $message, array $plus = [], int $code = 200): never { mc_json($code, ['message' => $message, 'success' => true] + $plus); }
function mc_err(int $code, string $message): never { mc_json($code, ['message' => $message, 'success' => false]); }
function mc_iso(int $t): string { return gmdate('Y-m-d\TH:i:s.000\Z', $t); }
function mc_t(string $iso): int { $t = strtotime($iso); return $t ?: 0; }

/* ---------- la base ---------- */
function mc_dossier(): string { $d = ga_donnees() . '/reseau'; if (!is_dir($d)) mkdir($d, 0700, true); if (!is_dir("$d/media")) mkdir("$d/media", 0700, true); return $d; }
function mc_db(): PDO {
    static $db = null;
    if ($db) return $db;
    $db = new PDO('sqlite:' . mc_dossier() . '/mechmoum.sqlite');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $db->exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000');
    $db->exec(<<<SQL
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, name TEXT NOT NULL, image TEXT NOT NULL DEFAULT '', bio TEXT NOT NULL DEFAULT '', gender TEXT NOT NULL DEFAULT '',
  famille TEXT, role TEXT NOT NULL DEFAULT 'membre', pass TEXT, etat TEXT NOT NULL DEFAULT 'actif', invitation INTEGER, cree INTEGER NOT NULL, maj INTEGER NOT NULL, vu INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, cree INTEGER NOT NULL, expire INTEGER NOT NULL, appareil TEXT);
CREATE TABLE IF NOT EXISTS follows (follower INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, followed INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, cree INTEGER NOT NULL, PRIMARY KEY (follower, followed));
CREATE TABLE IF NOT EXISTS blocks (blocker INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, blocked INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, cree INTEGER NOT NULL, PRIMARY KEY (blocker, blocked));
CREATE TABLE IF NOT EXISTS media (cle TEXT PRIMARY KEY, owner INTEGER NOT NULL, mime TEXT NOT NULL, taille INTEGER NOT NULL, w INTEGER, h INTEGER, cree INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, caption TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT 'image', media TEXT NOT NULL, poster TEXT, cree INTEGER NOT NULL, cache INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS posts_author ON posts(author, cree);
CREATE TABLE IF NOT EXISTS import_mur (mur INTEGER PRIMARY KEY, post INTEGER, cree INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS import_mur_com (com INTEGER PRIMARY KEY, comment INTEGER);
CREATE TABLE IF NOT EXISTS likes (post INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, cree INTEGER NOT NULL, PRIMARY KEY (post, user));
CREATE TABLE IF NOT EXISTS bookmarks (user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, post INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, cree INTEGER NOT NULL, PRIMARY KEY (user, post));
CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY, post INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE, author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, text TEXT NOT NULL, cree INTEGER NOT NULL, cache INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS comments_post ON comments(post, cree);
CREATE TABLE IF NOT EXISTS stories (id INTEGER PRIMARY KEY, author INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, type TEXT NOT NULL DEFAULT 'image', media TEXT NOT NULL, poster TEXT, cree INTEGER NOT NULL, expire INTEGER NOT NULL, cache INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS story_views (story INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE, user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, cree INTEGER NOT NULL, PRIMARY KEY (story, user));
CREATE TABLE IF NOT EXISTS chats (id INTEGER PRIMARY KEY, a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, last_message INTEGER, cree INTEGER NOT NULL, UNIQUE (a, b));
CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, chat INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE, sender INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, message TEXT NOT NULL, cree INTEGER NOT NULL, cache INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS messages_chat ON messages(chat, cree);
CREATE TABLE IF NOT EXISTS message_reads (message INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE, user INTEGER NOT NULL, PRIMARY KEY (message, user));
CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY, type TEXT NOT NULL, de INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, post INTEGER REFERENCES posts(id) ON DELETE CASCADE, comment TEXT, lu INTEGER NOT NULL DEFAULT 0, cree INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS notif_a ON notifications(a, cree);
CREATE TABLE IF NOT EXISTS evenements (id INTEGER PRIMARY KEY, pour INTEGER NOT NULL, type TEXT NOT NULL, donnees TEXT NOT NULL, cree INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS evt_pour ON evenements(pour, id);
CREATE TABLE IF NOT EXISTS signalements (id INTEGER PRIMARY KEY, par INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, genre TEXT NOT NULL, cible INTEGER NOT NULL, raison TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', cree INTEGER NOT NULL, etat TEXT NOT NULL DEFAULT 'ouvert', decision TEXT, traite_par TEXT, traite_le INTEGER);
CREATE TABLE IF NOT EXISTS invitations (id INTEGER PRIMARY KEY, hash TEXT NOT NULL UNIQUE, nom TEXT NOT NULL DEFAULT '', cree_par TEXT NOT NULL, cree INTEGER NOT NULL, expire INTEGER NOT NULL, usages_max INTEGER NOT NULL DEFAULT 1, usages INTEGER NOT NULL DEFAULT 0, revoquee INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS reglages (cle TEXT PRIMARY KEY, valeur TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS journal (id INTEGER PRIMARY KEY, qui TEXT NOT NULL, action TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', ts INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS echecs (cle TEXT NOT NULL, ts INTEGER NOT NULL);
SQL);
    // 26/11 : la musique jouée par-dessus une vidéo (vidéos importées de l'ancien mur)
    $cols = array_column($db->query('PRAGMA table_info(posts)')->fetchAll(), 'name');
    if (!in_array('musique', $cols, true)) $db->exec('ALTER TABLE posts ADD COLUMN musique TEXT');
    $cs = array_column($db->query('PRAGMA table_info(stories)')->fetchAll(), 'name');
    if (!in_array('filtre', $cs, true)) { $db->exec("ALTER TABLE stories ADD COLUMN filtre TEXT NOT NULL DEFAULT ''"); $db->exec('ALTER TABLE stories ADD COLUMN musique TEXT'); }
    if (!in_array('filtre', $cols, true)) $db->exec("ALTER TABLE posts ADD COLUMN filtre TEXT NOT NULL DEFAULT ''");   // 26/11 : filtre de la photo ou de la vidéo
    mc_famille_comptes($db);
    return $db;
}
function mc_reglage(string $k, ?string $v = null, string $defaut = ''): string {
    $db = mc_db();
    if ($v !== null) { $db->prepare('INSERT INTO reglages (cle, valeur) VALUES (?, ?) ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur')->execute([$k, $v]); return $v; }
    $s = $db->prepare('SELECT valeur FROM reglages WHERE cle = ?'); $s->execute([$k]); $r = $s->fetchColumn();
    return $r === false ? $defaut : (string)$r;
}
function mc_journal(string $qui, string $action, string $detail = ''): void {
    mc_db()->prepare('INSERT INTO journal (qui, action, detail, ts) VALUES (?, ?, ?, ?)')->execute([$qui, $action, mb_substr($detail, 0, 500), time()]);
}
// Les 5 comptes de la famille existent dès le départ (avatar du site, rôle admin pour Anis) ; on y entre avec la session du site.
function mc_famille_comptes(PDO $db): void {
    if ($db->query("SELECT COUNT(*) FROM users WHERE famille IS NOT NULL")->fetchColumn() >= count(MC_FAMILLE)) return;
    $t = time(); $bios = ['Anis' => 'Le papa 🌼', 'Imen' => 'La maman 🌸', 'Essil' => '12 ans · cheval et dessin 🐴', 'Salma' => '8 ans · 🌈', 'Amine' => '5 ans · 🚀'];
    $s = $db->prepare('INSERT OR IGNORE INTO users (username, name, image, bio, famille, role, cree, maj) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    foreach (MC_FAMILLE as $nom => $u) $s->execute([$u, $nom, '/jeux/avatars/' . $u . '.webp', $bios[$nom], $nom, $nom === 'Anis' ? 'admin' : 'membre', $t, $t]);
    // toute la famille se suit : le fil n'est jamais vide
    $ids = $db->query("SELECT id FROM users WHERE famille IS NOT NULL")->fetchAll(PDO::FETCH_COLUMN);
    $f = $db->prepare('INSERT OR IGNORE INTO follows (follower, followed, cree) VALUES (?, ?, ?)');
    foreach ($ids as $a) foreach ($ids as $b) if ($a !== $b) $f->execute([$a, $b, $t]);
}

/* ---------- les sessions ---------- */
function mc_cookie(string $v, int $expire): void {
    setcookie(MC_COOKIE, $v, ['expires' => $expire, 'path' => '/reseau/', 'secure' => !empty($_SERVER['HTTPS']) || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https', 'httponly' => true, 'samesite' => 'Lax']);
}
function mc_ouvre_session(int $uid): void {
    $j = bin2hex(random_bytes(32)); $t = time();
    $a = function_exists('ga_appareil') ? ga_appareil() : null;
    mc_db()->prepare('INSERT INTO sessions (hash, user, cree, expire, appareil) VALUES (?, ?, ?, ?, ?)')->execute([hash('sha256', $j), $uid, $t, $t + MC_DUREE, $a ? (string)$a['id'] : null]);
    mc_cookie($j, $t + MC_DUREE);
}
function mc_ferme_session(): void {
    $j = (string)($_COOKIE[MC_COOKIE] ?? '');
    if (preg_match('/^[0-9a-f]{64}$/', $j)) mc_db()->prepare('DELETE FROM sessions WHERE hash = ?')->execute([hash('sha256', $j)]);
    mc_cookie('', time() - 3600);
}
// L'utilisateur connecté (ou null). Un compte suspendu n'est plus connecté.
function mc_moi(): ?array {
    static $cache = false;
    if ($cache !== false) return $cache;
    $cache = null;
    $j = (string)($_COOKIE[MC_COOKIE] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $j)) return null;
    $db = mc_db(); $h = hash('sha256', $j); $t = time();
    $s = $db->prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user WHERE s.hash = ? AND s.expire > ?'); $s->execute([$h, $t]);
    $u = $s->fetch();
    if (!$u || $u['etat'] !== 'actif') return null;
    if ((int)$u['vu'] < $t - 20) {
        $db->prepare('UPDATE users SET vu = ? WHERE id = ?')->execute([$t, $u['id']]);
        $db->prepare('UPDATE sessions SET expire = ? WHERE hash = ?')->execute([$t + MC_DUREE, $h]);
    }
    return $cache = $u;
}
function mc_exige(): array { $u = mc_moi(); if (!$u) mc_err(401, 'Connecte-toi d\'abord.'); return $u; }
function mc_admin(?array $u = null): bool { $u ??= mc_moi(); return ($u && $u['role'] === 'admin') || ga_admin(); }

/* ---------- trop d'essais ---------- */
function mc_trop(string $cle, int $max = 8, int $fenetre = 900): bool {
    $s = mc_db()->prepare('SELECT COUNT(*) FROM echecs WHERE cle = ? AND ts > ?'); $s->execute([$cle, time() - $fenetre]);
    return (int)$s->fetchColumn() >= $max;
}
function mc_echec(string $cle): void { $db = mc_db(); $db->prepare('INSERT INTO echecs (cle, ts) VALUES (?, ?)')->execute([$cle, time()]); $db->exec('DELETE FROM echecs WHERE ts < ' . (time() - 86400)); }

/* ---------- les gens ---------- */
function mc_user_par(string $id): ?array {
    $db = mc_db();
    if (preg_match('/^\d+$/', $id)) { $s = $db->prepare('SELECT * FROM users WHERE id = ?'); $s->execute([(int)$id]); $u = $s->fetch(); if ($u) return $u; }
    $s = $db->prepare('SELECT * FROM users WHERE username = ?'); $s->execute([$id]); return $s->fetch() ?: null;
}
// Bloqué dans un sens ou dans l'autre ?
function mc_bloque(int $a, int $b): bool {
    $s = mc_db()->prepare('SELECT 1 FROM blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)'); $s->execute([$a, $b, $b, $a]);
    return (bool)$s->fetchColumn();
}
function mc_ids_caches(int $moi): array {   // ceux que je ne dois pas voir (bloqués ou qui m'ont bloqué, suspendus)
    $s = mc_db()->prepare("SELECT blocked FROM blocks WHERE blocker = ? UNION SELECT blocker FROM blocks WHERE blocked = ? UNION SELECT id FROM users WHERE etat != 'actif'");
    $s->execute([$moi, $moi]); return array_map('intval', $s->fetchAll(PDO::FETCH_COLUMN));
}
function mc_suit(int $a, int $b): bool { $s = mc_db()->prepare('SELECT 1 FROM follows WHERE follower = ? AND followed = ?'); $s->execute([$a, $b]); return (bool)$s->fetchColumn(); }
// La petite fiche d'une personne, comme le serveur d'origine (emailVerified = le badge : un membre de la famille)
function mc_mini(array $u, bool $id = true): array {
    $r = ['username' => $u['username'], 'image' => $u['image'], 'emailVerified' => $u['famille'] !== null];
    if ($id) $r = ['_id' => (string)$u['id']] + $r;
    return $r;
}
function mc_users(array $ids): array {
    $ids = array_values(array_unique(array_map('intval', $ids))); if (!$ids) return [];
    $s = mc_db()->prepare('SELECT * FROM users WHERE id IN (' . implode(',', array_fill(0, count($ids), '?')) . ')'); $s->execute($ids);
    $r = []; foreach ($s->fetchAll() as $u) $r[(int)$u['id']] = $u; return $r;
}
function mc_in(array $ids): string { return $ids ? implode(',', array_map('intval', $ids)) : '0'; }

/* ---------- temps réel : des événements lus toutes les 2 à 3 secondes (à la place de Socket.IO) ---------- */
function mc_evt(int $pour, string $type, array $donnees): void {
    $db = mc_db();
    $db->prepare('INSERT INTO evenements (pour, type, donnees, cree) VALUES (?, ?, ?, ?)')->execute([$pour, $type, json_encode($donnees, JSON_UNESCAPED_UNICODE), time()]);
    if (random_int(1, 50) === 1) $db->exec('DELETE FROM evenements WHERE cree < ' . (time() - 3600));
}
function mc_notifie(string $type, int $de, int $a, ?int $post = null, ?string $comment = null): void {
    if ($de === $a || mc_bloque($de, $a)) return;
    $db = mc_db();
    if ($type !== 'comment') {   // un seul « aime » ou « s'abonne » par personne et par publication
        $s = $db->prepare('SELECT 1 FROM notifications WHERE type = ? AND de = ? AND a = ? AND IFNULL(post, 0) = ?'); $s->execute([$type, $de, $a, $post ?? 0]);
        if ($s->fetchColumn()) return;
    }
    $db->prepare('INSERT INTO notifications (type, de, a, post, comment, cree) VALUES (?, ?, ?, ?, ?, ?)')->execute([$type, $de, $a, $post, $comment, time()]);
    mc_evt($a, 'notification', ['type' => $type]);
}
function mc_denotifie(string $type, int $de, int $a, ?int $post = null): void {
    mc_db()->prepare('DELETE FROM notifications WHERE type = ? AND de = ? AND a = ? AND IFNULL(post, 0) = ?')->execute([$type, $de, $a, $post ?? 0]);
}

/* ---------- les fichiers ---------- */
function mc_media_url(?string $cle): string { return $cle ? '/reseau/api/media/' . $cle : ''; }
// Une photo : vérifiée (vraie image), réduite à 1440 px, réenregistrée (plus de position GPS ni d'infos de l'appareil).
function mc_recoit_image(array $f, int $owner, int $max = 1440): string {
    if (($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) mc_err(400, 'Choisis une photo.');
    if ($f['size'] > MC_IMG_MAX) mc_err(413, 'Photo trop lourde (15 Mo au plus).');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $src = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($f['tmp_name']), 'image/png' => @imagecreatefrompng($f['tmp_name']),
        'image/webp' => @imagecreatefromwebp($f['tmp_name']), 'image/gif' => @imagecreatefromgif($f['tmp_name']),
        default => false };
    if (!$src) mc_err(415, 'Ce fichier n\'est pas une photo (JPEG, PNG, WebP ou GIF).');
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {   // remettre la photo droite avant d'effacer ses infos
        $o = (int)(@exif_read_data($f['tmp_name'])['Orientation'] ?? 1);
        if ($o === 3) $src = imagerotate($src, 180, 0); elseif ($o === 6) $src = imagerotate($src, -90, 0); elseif ($o === 8) $src = imagerotate($src, 90, 0);
    }
    $w = imagesx($src); $h = imagesy($src); $k = min(1, $max / max($w, $h));
    $nw = max(1, (int)round($w * $k)); $nh = max(1, (int)round($h * $k));
    $dst = imagecreatetruecolor($nw, $nh); imagealphablending($dst, false); imagesavealpha($dst, true);
    imagecopyresampled($dst, $src, 0, 0, 0, 0, $nw, $nh, $w, $h);
    $cle = bin2hex(random_bytes(16)) . '.webp'; $chemin = mc_dossier() . '/media/' . $cle;
    if (!imagewebp($dst, $chemin, 84)) { $cle = substr($cle, 0, -5) . '.jpg'; $chemin = mc_dossier() . '/media/' . $cle; imagejpeg($dst, $chemin, 86); }
    mc_db()->prepare('INSERT INTO media (cle, owner, mime, taille, w, h, cree) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$cle, $owner, str_ends_with($cle, '.webp') ? 'image/webp' : 'image/jpeg', filesize($chemin), $nw, $nh, time()]);
    return $cle;
}
// Une vidéo (reel, story) : vérifiée (vrai MP4, MOV ou WebM, 80 Mo au plus) et rangée sous un nom au hasard.
// Ses infos cachées (lieu, appareil) sont effacées par la tablette avant l'envoi (comme sur le mur de la famille).
function mc_recoit_video(array $f, int $owner): string {
    if (($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) mc_err(400, 'Vidéo manquante.');
    if ($f['size'] > MC_VID_MAX) mc_err(413, 'Vidéo trop lourde (80 Mo au plus).');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['video/mp4' => 'mp4', 'video/quicktime' => 'mov', 'video/webm' => 'webm', 'video/x-m4v' => 'mp4'][$mime] ?? null;
    if (!$ext) mc_err(415, 'Ce fichier n\'est pas une vidéo (MP4, MOV ou WebM).');
    $cle = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], mc_dossier() . '/media/' . $cle)) mc_err(500, 'Envoi impossible.');
    mc_db()->prepare('INSERT INTO media (cle, owner, mime, taille, cree) VALUES (?, ?, ?, ?, ?)')->execute([$cle, $owner, $mime === 'video/quicktime' ? 'video/mp4' : $mime, (int)$f['size'], time()]);
    return $cle;
}
// 26/11 : la musique d'une publication. Un morceau envoyé (mp3, m4a, wav, ogg ; 15 Mo au plus) …
function mc_recoit_son(array $f, int $owner): string {
    if (($f['error'] ?? 1) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) mc_err(400, 'Morceau de musique manquant.');
    if ($f['size'] > 15 * 1024 * 1024) mc_err(413, 'Morceau trop lourd (15 Mo au plus).');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);
    $ext = ['audio/mpeg' => 'mp3', 'audio/mp3' => 'mp3', 'audio/mp4' => 'm4a', 'audio/x-m4a' => 'm4a', 'audio/aac' => 'm4a', 'video/mp4' => 'm4a', 'audio/wav' => 'wav', 'audio/x-wav' => 'wav', 'audio/ogg' => 'ogg', 'application/ogg' => 'ogg'][$mime] ?? null;
    if (!$ext) mc_err(415, 'Ce fichier n\'est pas une musique (MP3, M4A, WAV ou OGG).');
    $cle = bin2hex(random_bytes(16)) . '.' . $ext;
    if (!move_uploaded_file($f['tmp_name'], mc_dossier() . '/media/' . $cle)) mc_err(500, 'Envoi impossible.');
    $m = ['mp3' => 'audio/mpeg', 'm4a' => 'audio/mp4', 'wav' => 'audio/wav', 'ogg' => 'audio/ogg'][$ext];
    mc_db()->prepare('INSERT INTO media (cle, owner, mime, taille, cree) VALUES (?, ?, ?, ?, ?)')->execute([$cle, $owner, $m, (int)$f['size'], time()]);
    return $cle;
}
// … ou un morceau de la musicothèque du mur (mur/musique/liste.js), copié une seule fois dans Mechmoum
function mc_bibliotheque(): array {
    $js = @file_get_contents(ga_racine() . '/mur/musique/liste.js') ?: ''; $l = [];
    preg_match_all("/\\{\\s*id:'([a-z0-9-]+)',\\s*titre:'((?:[^'\\\\]|\\\\.)*)',\\s*emoji:'([^']*)'/u", $js, $m, PREG_SET_ORDER);
    foreach ($m as $x) $l[$x[1]] = ['id' => $x[1], 'titre' => stripslashes($x[2]), 'emoji' => $x[3]];
    return $l;
}
function mc_musique_biblio(string $id, int $owner): ?string {
    if (!preg_match('/^[a-z0-9-]{1,40}$/', $id)) return null;
    $cle = mc_reglage('mur-musique-' . $id);
    if ($cle && is_file(mc_dossier() . '/media/' . $cle)) return $cle;
    $f = str_starts_with($id, 'el-') ? ga_donnees() . '/mur-musique/' . $id . '.mp3' : ga_racine() . '/mur/musique/' . $id . '.mp3';
    if (!is_file($f)) return null;
    $cle = bin2hex(random_bytes(16)) . '.mp3';
    if (!@copy($f, mc_dossier() . '/media/' . $cle)) return null;
    mc_db()->prepare('INSERT INTO media (cle, owner, mime, taille, cree) VALUES (?, ?, ?, ?, ?)')->execute([$cle, $owner, 'audio/mpeg', filesize($f), time()]);
    mc_reglage('mur-musique-' . $id, $cle);
    return $cle;
}
const MC_FILTRES = ['', 'jasmin', 'sidibou', 'sahara', 'kairouan', 'vif', 'doux', 'vintage', 'nb'];
function mc_efface_media(?string $cle): void {
    if (!$cle || !preg_match('/^[0-9a-f]{32}\.(webp|jpg|mp4|mov|webm|mp3|m4a|wav|ogg)$/', $cle)) return;
    @unlink(mc_dossier() . '/media/' . $cle);
    mc_db()->prepare('DELETE FROM media WHERE cle = ?')->execute([$cle]);
}
// Servir un fichier : seulement à quelqu'un de connecté, avec les morceaux (Range) pour les vidéos sur iPhone.
function mc_sert_media(string $cle): never {
    if (!preg_match('/^[0-9a-f]{32}\.(webp|jpg|mp4|mov|webm|mp3|m4a|wav|ogg)$/', $cle)) { http_response_code(404); exit; }
    if (!mc_moi()) { http_response_code(401); exit; }
    $s = mc_db()->prepare('SELECT mime FROM media WHERE cle = ?'); $s->execute([$cle]); $mime = $s->fetchColumn();
    $f = mc_dossier() . '/media/' . $cle;
    if (!$mime || !is_file($f)) { http_response_code(404); exit; }
    $taille = filesize($f); $debut = 0; $fin = $taille - 1;
    header('Content-Type: ' . $mime); header('X-Content-Type-Options: nosniff'); header('Accept-Ranges: bytes');
    header('Cache-Control: private, max-age=31536000, immutable'); header('Content-Disposition: inline');
    if (preg_match('/bytes=(\d*)-(\d*)/', (string)($_SERVER['HTTP_RANGE'] ?? ''), $m)) {
        if ($m[1] !== '') { $debut = (int)$m[1]; if ($m[2] !== '') $fin = min((int)$m[2], $taille - 1); }
        elseif ($m[2] !== '') { $debut = max(0, $taille - (int)$m[2]); }
        if ($debut > $fin) { http_response_code(416); header("Content-Range: bytes */$taille"); exit; }
        http_response_code(206); header("Content-Range: bytes $debut-$fin/$taille");
    }
    header('Content-Length: ' . ($fin - $debut + 1));
    $h = fopen($f, 'rb'); fseek($h, $debut); $reste = $fin - $debut + 1;
    while ($reste > 0 && !feof($h)) { $b = fread($h, min(65536, $reste)); echo $b; $reste -= strlen($b); flush(); }
    fclose($h); exit;
}

/* ---------- lire la requête ---------- */
function mc_corps(): array {
    static $c = null; if ($c !== null) return $c;
    $c = $_POST;
    if (!$c && str_contains((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'json')) { $j = json_decode((string)file_get_contents('php://input'), true); $c = is_array($j) ? $j : []; }
    return $c;
}
function mc_txt(string $k, int $max = 2200): string { return mb_substr(trim((string)(mc_corps()[$k] ?? '')), 0, $max); }
