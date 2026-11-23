<?php
/*
 * Famille Missaoui — le mur de la famille (13/11/2026) : messages, dessins et photos de créations, visibles par la famille
 * et les proches de confiance (la porte du site garde ce fichier comme les autres API).
 *
 *   GET  ?action=liste[&avant=ID]                -> 30 messages {id, auteur, texte, img, cree, reac{❤️,👏,😂}, mien, moi[]}
 *   GET  ?img=ID                                 -> l'image d'un message (WebP)
 *   POST action=poste auteur texte [image=dataURL] jeton  -> nouveau message (l'image est réencodée : plus de position GPS ni d'infos de l'appareil)
 *   POST action=poste … genre=polaroid deco=<style>  -> (17/11) une photo prise avec la caméra + un petit mot, accrochée comme un polaroid ;
 *                                                3 images par personne et par jour (heure de Paris), photo du jour et images envoyées comptées ensemble ; effacer ne rend pas le droit
 *   GET  ?action=quota&auteur=X                  -> {restant} : photos polaroid encore permises aujourd'hui
 *   POST action=reagit id emoji jeton            -> met ou enlève une réaction
 *   POST action=supprime id (jeton de l'auteur | pass = mot de passe parent | Anis administrateur, sans mot de passe : 21/11)
 *   POST action=video auteur texte musique jeton + fichier « video » (mp4 ou webm, 30 s, fabriqué par le studio de la page) + poster (JPEG)
 *                                                -> (21/11) une petite vidéo ; 10 vidéos par personne et par jour (22/11) ; brut=1 volv volm : l'original, musique posée à la lecture
 *   GET  ?vid=ID                                 -> la vidéo (avec les requêtes « Range » qu'exige Safari)
 *   POST action=commente id auteur texte jeton   -> (23/11) un commentaire sous une photo ou une vidéo (200 caractères) ; « coms » dans la liste
 *   POST action=decommente cid jeton             -> efface son commentaire (ou Anis administrateur)
 * Le « jeton » est un nombre au hasard gardé dans le navigateur : il dit « c'est moi qui ai écrit ça » (pour pouvoir effacer son message).
 * Données : famille-data/mur.sqlite et famille-data/mur/<id>.webp (hors du site public).
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();

const MUR_EMOJIS = ['❤️', '👏', '😂', '😮'];
const MUR_TEXTE = 500;
const MUR_IMAGE_MAX = 2500000;   // la photo arrive déjà réduite par la page (1280 px), en JPEG
const MUR_VIDEO_MAX = 60000000;  // 22/11 : 30 s en bonne qualité (720 × 1280 à 6 Mbit/s, ou l'original filmé) : environ 25 Mo au plus
const MUR_VIDEOS_JOUR = 10;   // 22/11 : demande des enfants (avant : 3)

header('X-Content-Type-Options: nosniff');
function out(int $c, array $d): void { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function fail(int $c, string $m): void { out($c, ['error' => $m]); }
function dossier(): string { $d = dirname(ga_racine()) . '/famille-data/mur'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function mur(): PDO {
    static $p = null; if ($p) return $p;
    $p = new PDO('sqlite:' . dirname(ga_racine()) . '/famille-data/mur.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $p->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $p->exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, auteur TEXT NOT NULL, texte TEXT, img INTEGER NOT NULL DEFAULT 0, jeton TEXT NOT NULL, cree INTEGER NOT NULL, ip TEXT)');
    $p->exec('CREATE TABLE IF NOT EXISTS reactions (message INTEGER NOT NULL, jeton TEXT NOT NULL, emoji TEXT NOT NULL, PRIMARY KEY (message, jeton, emoji))');
    $p->exec('CREATE TABLE IF NOT EXISTS envois (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    // 17/11 : les photos polaroid (genre, style du cadre) et le compte des photos du jour par personne
    $cols = array_column($p->query('PRAGMA table_info(messages)')->fetchAll(), 'name');
    if (!in_array('genre', $cols, true)) $p->exec("ALTER TABLE messages ADD COLUMN genre TEXT NOT NULL DEFAULT ''");
    if (!in_array('deco', $cols, true)) $p->exec("ALTER TABLE messages ADD COLUMN deco TEXT NOT NULL DEFAULT ''");
    $p->exec('CREATE TABLE IF NOT EXISTS photos_jour (auteur TEXT NOT NULL, jour TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (auteur, jour))');
    $p->exec('CREATE TABLE IF NOT EXISTS commentaires (id INTEGER PRIMARY KEY, message INTEGER NOT NULL, auteur TEXT NOT NULL, texte TEXT NOT NULL, jeton TEXT NOT NULL, cree INTEGER NOT NULL)');   // 23/11
    if (!in_array('media', $cols, true)) $p->exec("ALTER TABLE messages ADD COLUMN media TEXT NOT NULL DEFAULT ''");   // 21/11 : « mp4|joyeux » pour une vidéo
    return $p;
}
function auteur($a): string {
    $a = trim(preg_replace('/\s+/u', ' ', (string)$a));
    if ($a === '' || mb_strlen($a) > 20 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $a)) fail(400, 'Choisis qui écrit.');
    return mb_strtoupper(mb_substr($a, 0, 1)) . mb_substr($a, 1);
}
const MUR_PHOTOS_JOUR = 10;   // 23/11 : comme les vidéos (avant 3)
const MUR_DECOS = ['polaroid', 'jasmin', 'zellige', 'etoiles', 'mer'];
function jour(): string { return (new DateTime('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d'); }
function photos_prises(string $qui): int { $s = mur()->prepare('SELECT n FROM photos_jour WHERE auteur = ? AND jour = ?'); $s->execute([mb_strtolower($qui), jour()]); return (int)$s->fetchColumn(); }
function ini_octets(string $k): int { $v = trim((string)ini_get($k)); $n = (int)$v; $u = strtolower(substr($v, -1)); return $u === 'g' ? $n << 30 : ($u === 'm' ? $n << 20 : ($u === 'k' ? $n << 10 : ($n ?: PHP_INT_MAX))); }
function jeton(): string { $j = (string)($_POST['jeton'] ?? $_GET['jeton'] ?? ''); return preg_match('/^[0-9a-f]{32,64}$/', $j) ? hash('sha256', $j) : ''; }

try {
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET'; $a = (string)($_REQUEST['action'] ?? '');
    if ($m === 'GET' && isset($_GET['img'])) {
        $f = dossier() . '/' . (int)$_GET['img'] . '.webp';
        if (!is_file($f)) { http_response_code(404); exit; }
        header('Content-Type: image/webp'); header('Cache-Control: private, max-age=31536000, immutable'); header('Content-Length: ' . filesize($f)); readfile($f); exit;
    }
    if ($m === 'GET' && isset($_GET['mus'])) {   // 21/11 : les musiques ElevenLabs du studio (famille-data/mur-musique, déposées le 21/11 par un mur/depot.php à jeton, retiré ensuite : voir docs/serveur.md)
        $id = (string)$_GET['mus']; $f = dirname(ga_racine()) . '/famille-data/mur-musique/' . $id . '.mp3';
        if (!preg_match('/^[a-z0-9-]{2,30}$/', $id) || !is_file($f)) { http_response_code(404); exit; }
        header('Content-Type: audio/mpeg'); header('Cache-Control: private, max-age=604800'); header('Content-Length: ' . filesize($f)); readfile($f); exit;
    }
    if ($m === 'GET' && isset($_GET['vid'])) {   // 21/11 : la vidéo, par morceaux (Safari ne lit une vidéo que si le serveur accepte « Range »)
        $id = (int)$_GET['vid']; $f = '';
        foreach (['mp4' => 'video/mp4', 'webm' => 'video/webm'] as $x => $mime) if (is_file(dossier() . "/$id.$x")) { $f = dossier() . "/$id.$x"; break; }
        if ($f === '') { http_response_code(404); exit; }
        $n = filesize($f); $de = 0; $a2 = $n - 1;
        header('Content-Type: ' . $mime); header('Accept-Ranges: bytes'); header('Cache-Control: private, max-age=31536000, immutable');
        if (preg_match('/bytes=(\d*)-(\d*)/', (string)($_SERVER['HTTP_RANGE'] ?? ''), $rg)) {
            if ($rg[1] === '' && $rg[2] !== '') { $de = max(0, $n - (int)$rg[2]); } else { $de = (int)$rg[1]; if ($rg[2] !== '') $a2 = min($a2, (int)$rg[2]); }
            if ($de > $a2 || $de >= $n) { http_response_code(416); header("Content-Range: bytes */$n"); exit; }
            http_response_code(206); header("Content-Range: bytes $de-$a2/$n");
        }
        header('Content-Length: ' . ($a2 - $de + 1));
        $h = fopen($f, 'rb'); fseek($h, $de); $reste = $a2 - $de + 1;
        while ($reste > 0 && !feof($h)) { $bloc = fread($h, min(65536, $reste)); echo $bloc; $reste -= strlen($bloc); flush(); }
        fclose($h); exit;
    }
    if ($m === 'GET' && $a === 'quota') {
        $q = auteur($_GET['auteur'] ?? '');
        out(200, ['restant' => max(0, MUR_PHOTOS_JOUR - photos_prises($q)), 'max' => MUR_PHOTOS_JOUR, 'videos' => max(0, MUR_VIDEOS_JOUR - photos_prises('🎬' . $q)), 'videos_max' => MUR_VIDEOS_JOUR, 'envoi_max' => min(MUR_VIDEO_MAX, ini_octets('upload_max_filesize'), ini_octets('post_max_size') - 400000)]);
    }
    if ($m === 'GET' && $a === 'liste') {
        $avant = (int)($_GET['avant'] ?? 0); $j = jeton();
        $s = mur()->prepare('SELECT id, auteur, texte, img, cree, jeton, genre, deco, media FROM messages' . ($avant ? ' WHERE id < ?' : '') . ' ORDER BY id DESC LIMIT 30'); $s->execute($avant ? [$avant] : []);
        $l = $s->fetchAll(); $ids = array_column($l, 'id'); $reac = []; $moi = []; $coms = [];
        if ($ids) {
            $in = implode(',', array_map('intval', $ids));
            foreach (mur()->query("SELECT message, emoji, COUNT(*) n FROM reactions WHERE message IN ($in) GROUP BY message, emoji") as $r) $reac[$r['message']][$r['emoji']] = (int)$r['n'];
            if ($j) { $q = mur()->prepare("SELECT message, emoji FROM reactions WHERE message IN ($in) AND jeton = ?"); $q->execute([$j]); foreach ($q as $r) $moi[$r['message']][] = $r['emoji']; }
            foreach (mur()->query("SELECT id, message, auteur, texte, jeton, cree FROM commentaires WHERE message IN ($in) ORDER BY id") as $r)
                $coms[$r['message']][] = ['id' => (int)$r['id'], 'auteur' => $r['auteur'], 'texte' => $r['texte'], 'cree' => (int)$r['cree'], 'mien' => $j !== '' && hash_equals($r['jeton'], $j)];
        }
        out(200, ['messages' => array_map(fn($x) => ['id' => (int)$x['id'], 'auteur' => $x['auteur'], 'texte' => $x['texte'], 'img' => (bool)$x['img'], 'cree' => (int)$x['cree'],
            'genre' => $x['genre'], 'deco' => $x['deco'], 'media' => $x['media'], 'reac' => $reac[$x['id']] ?? (object)[], 'moi' => $moi[$x['id']] ?? [], 'coms' => $coms[$x['id']] ?? [], 'mien' => $j !== '' && hash_equals($x['jeton'], $j)], $l), 'emojis' => MUR_EMOJIS, 'admin' => ga_passe_autorise()]);
    }
    if ($m !== 'POST') fail(405, 'Action inconnue.');
    $j = jeton();
    if ($a === 'poste') {
        if (!$j) fail(400, 'Recharge la page.');
        $ip = hash('sha256', ga_ip()); $t = time(); $db = mur();
        $db->prepare('DELETE FROM envois WHERE ts < ?')->execute([$t - 3600]);
        $c = $db->prepare('SELECT COUNT(*) FROM envois WHERE ip = ?'); $c->execute([$ip]); if ((int)$c->fetchColumn() >= 30) fail(429, 'Beaucoup de messages en peu de temps : réessaie dans un moment.');
        $qui = auteur($_POST['auteur'] ?? ''); $txt = trim(mb_substr((string)($_POST['texte'] ?? ''), 0, MUR_TEXTE));
        $data = (string)($_POST['image'] ?? ''); $img = null;
        if ($data !== '') {
            if (!preg_match('#^data:image/(jpeg|png|webp);base64,#', $data, $mm)) fail(400, "Cette image n'est pas lisible.");
            $bin = base64_decode(substr($data, strpos($data, ',') + 1), true);
            if ($bin === false || strlen($bin) > MUR_IMAGE_MAX) fail(400, 'Image trop lourde.');
            $img = @imagecreatefromstring($bin); if (!$img) fail(400, "Cette image n'est pas lisible.");
            $w = imagesx($img); $h = imagesy($img); $k = min(1, 1280 / max($w, $h));
            if ($k < 1) { $n = imagecreatetruecolor((int)round($w * $k), (int)round($h * $k)); imagealphablending($n, false); imagesavealpha($n, true); imagecopyresampled($n, $img, 0, 0, 0, 0, imagesx($n), imagesy($n), $w, $h); imagedestroy($img); $img = $n; }
        }
        if ($txt === '' && !$img) fail(400, 'Écris un message ou ajoute une image.');
        $genre = ($_POST['genre'] ?? '') === 'polaroid' ? 'polaroid' : ''; $deco = '';
        if ($genre) {
            if (!$img) fail(400, 'Prends d\'abord ta photo 📸');
            if (mb_strlen($txt) > 90) $txt = mb_substr($txt, 0, 90);
            $deco = in_array($_POST['deco'] ?? '', MUR_DECOS, true) ? (string)$_POST['deco'] : 'polaroid';
        }
        // la limite du jour (17/11, 19 h) : 3 images par personne et par jour, TOUTES comptées (photo du jour ET bouton « 🖼️ Image »,
        // qui ouvre aussi l'appareil photo sur la tablette : c'est par là que Salma en avait mis plus de 3)
        if ($img) {
            if (photos_prises($qui) >= MUR_PHOTOS_JOUR) fail(429, 'Tu as déjà accroché tes ' . MUR_PHOTOS_JOUR . ' photos aujourd\'hui : à demain ! 📸 (tu peux encore écrire un petit mot)');
            $db->prepare('INSERT INTO photos_jour (auteur, jour, n) VALUES (?, ?, 1) ON CONFLICT(auteur, jour) DO UPDATE SET n = n + 1')->execute([mb_strtolower($qui), jour()]);
            $db->prepare('DELETE FROM photos_jour WHERE jour < ?')->execute([(new DateTime('-7 days', new DateTimeZone('Europe/Paris')))->format('Y-m-d')]);
        }
        $db->prepare('INSERT INTO messages (auteur, texte, img, jeton, cree, ip, genre, deco) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')->execute([$qui, $txt, $img ? 1 : 0, $j, $t, $ip, $genre, $deco]);
        $id = (int)$db->lastInsertId();
        if ($img) { imagepalettetotruecolor($img); imagewebp($img, dossier() . '/' . $id . '.webp', 82); imagedestroy($img); }   // réencodée : aucune info cachée de la photo d'origine
        $db->prepare('INSERT INTO envois (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
        out(200, ['ok' => true, 'id' => $id]);
    }
    if ($a === 'video') {   // 21/11 : une petite vidéo du studio (filmée, importée, ou des photos animées, avec ou sans musique)
        if (!$j) fail(400, 'Recharge la page.');
        $qui = auteur($_POST['auteur'] ?? ''); $txt = trim(mb_substr((string)($_POST['texte'] ?? ''), 0, 200));
        $mus = preg_match('/^[a-z0-9-]{1,30}$/', (string)($_POST['musique'] ?? '')) ? (string)$_POST['musique'] : '';
        // 22/11 : « brut » = la vidéo d'origine (pas refabriquée) : la musique est jouée par-dessus à la lecture, avec les deux volumes choisis
        $brut = ($_POST['brut'] ?? '') === '1'; $vv = max(0, min(1, (float)($_POST['volv'] ?? 1))); $vm = max(0, min(1, (float)($_POST['volm'] ?? .7)));
        $v = $_FILES['video'] ?? null;
        if (!$v || ($v['error'] ?? 1) !== UPLOAD_ERR_OK) fail(400, ($v['error'] ?? 0) === UPLOAD_ERR_INI_SIZE ? 'Vidéo trop lourde pour le serveur.' : "La vidéo n'est pas arrivée : réessaie.");
        if ($v['size'] > MUR_VIDEO_MAX) fail(400, 'Vidéo trop lourde (' . round(MUR_VIDEO_MAX / 1e6) . ' Mo au plus).');
        $tete = (string)file_get_contents($v['tmp_name'], false, null, 0, 12);
        $ext = substr($tete, 0, 4) === "\x1A\x45\xDF\xA3" ? 'webm' : (substr($tete, 4, 4) === 'ftyp' ? 'mp4' : '');
        if ($ext === '') fail(400, "Ce fichier n'est pas une vidéo lisible.");
        if (photos_prises('🎬' . $qui) >= MUR_VIDEOS_JOUR) fail(429, 'Tu as déjà posté tes ' . MUR_VIDEOS_JOUR . ' vidéos aujourd\'hui : à demain ! 🎬');
        $pd = (string)($_POST['poster'] ?? ''); $img = null;
        if (preg_match('#^data:image/(jpeg|png|webp);base64,#', $pd)) { $bin = base64_decode(substr($pd, strpos($pd, ',') + 1), true); if ($bin !== false && strlen($bin) < MUR_IMAGE_MAX) $img = @imagecreatefromstring($bin) ?: null; }
        $db = mur(); $t = time(); $ip = hash('sha256', ga_ip());
        $db->prepare('INSERT INTO photos_jour (auteur, jour, n) VALUES (?, ?, 1) ON CONFLICT(auteur, jour) DO UPDATE SET n = n + 1')->execute([mb_strtolower('🎬' . $qui), jour()]);
        $db->prepare('INSERT INTO messages (auteur, texte, img, jeton, cree, ip, genre, deco, media) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([$qui, $txt, $img ? 1 : 0, $j, $t, $ip, 'video', '', $ext . '|' . $mus . ($brut ? '|o|' . round($vv, 2) . '|' . round($vm, 2) : '')]);
        $id = (int)$db->lastInsertId();
        if (!move_uploaded_file($v['tmp_name'], dossier() . "/$id.$ext")) { $db->prepare('DELETE FROM messages WHERE id = ?')->execute([$id]); fail(500, "La vidéo n'a pas pu être rangée."); }
        if ($img) { imagepalettetotruecolor($img); imagewebp($img, dossier() . '/' . $id . '.webp', 80); imagedestroy($img); }
        out(200, ['ok' => true, 'id' => $id]);
    }
    if ($a === 'reagit') {
        $id = (int)($_POST['id'] ?? 0); $e = (string)($_POST['emoji'] ?? '');
        if (!$j || !in_array($e, MUR_EMOJIS, true)) fail(400, 'Réaction inconnue.');
        $d = mur()->prepare('DELETE FROM reactions WHERE message = ? AND jeton = ? AND emoji = ?'); $d->execute([$id, $j, $e]);
        if ($d->rowCount() === 0) mur()->prepare('INSERT OR IGNORE INTO reactions (message, jeton, emoji) SELECT id, ?, ? FROM messages WHERE id = ?')->execute([$j, $e, $id]);
        out(200, ['ok' => true]);
    }
    if ($a === 'commente') {   // 23/11 : commenter une photo ou une vidéo
        if (!$j) fail(400, 'Recharge la page.');
        $id = (int)($_POST['id'] ?? 0); $qui = auteur($_POST['auteur'] ?? ''); $txt = trim(preg_replace('/\s+/u', ' ', mb_substr((string)($_POST['texte'] ?? ''), 0, 200)));
        if ($txt === '') fail(400, 'Écris ton commentaire.');
        $ip = hash('sha256', ga_ip()); $t = time(); $db = mur();
        $db->prepare('DELETE FROM envois WHERE ts < ?')->execute([$t - 3600]);
        $c = $db->prepare('SELECT COUNT(*) FROM envois WHERE ip = ?'); $c->execute([$ip]); if ((int)$c->fetchColumn() >= 60) fail(429, 'Beaucoup de messages en peu de temps : réessaie dans un moment.');
        $e = $db->prepare('SELECT 1 FROM messages WHERE id = ?'); $e->execute([$id]); if (!$e->fetchColumn()) fail(404, 'Ce message a été effacé.');
        $db->prepare('INSERT INTO envois (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
        $db->prepare('INSERT INTO commentaires (message, auteur, texte, jeton, cree) VALUES (?, ?, ?, ?, ?)')->execute([$id, $qui, $txt, $j, $t]);
        out(200, ['ok' => true, 'id' => (int)$db->lastInsertId()]);
    }
    if ($a === 'decommente') {
        $cid = (int)($_POST['cid'] ?? 0); $s = mur()->prepare('SELECT jeton FROM commentaires WHERE id = ?'); $s->execute([$cid]); $jt = $s->fetchColumn();
        if ($jt === false) out(200, ['ok' => true]);
        if (!($j && hash_equals((string)$jt, $j)) && !ga_passe_autorise()) fail(403, 'Seul celui qui a écrit ce commentaire peut l\'effacer.');
        mur()->prepare('DELETE FROM commentaires WHERE id = ?')->execute([$cid]); out(200, ['ok' => true]);
    }
    if ($a === 'supprime') {
        $id = (int)($_POST['id'] ?? 0);
        $s = mur()->prepare('SELECT jeton FROM messages WHERE id = ?'); $s->execute([$id]); $jt = $s->fetchColumn();
        if ($jt === false) out(200, ['ok' => true]);
        $parent = false;
        if (!($j && hash_equals((string)$jt, $j)) && !ga_passe_autorise()) {   // pas l'auteur ni Anis administrateur : il faut le mot de passe parent
            $auth = json_decode((string)@file_get_contents(dirname(ga_racine()) . '/nahki-voix/auth.json'), true);
            if (ga_trop_essais()) fail(429, "Trop d'essais. Réessaie dans 15 minutes.");
            if (empty($auth['hash']) || !password_verify((string)($_POST['pass'] ?? ''), (string)$auth['hash'])) { ga_note_echec(); fail(403, 'Mot de passe parent incorrect.'); }
        }
        mur()->prepare('DELETE FROM messages WHERE id = ?')->execute([$id]); mur()->prepare('DELETE FROM reactions WHERE message = ?')->execute([$id]); mur()->prepare('DELETE FROM commentaires WHERE message = ?')->execute([$id]);
        foreach (['webp', 'mp4', 'webm'] as $x) @unlink(dossier() . '/' . $id . '.' . $x);
        out(200, ['ok' => true]);
    }
    fail(400, 'Action inconnue.');
} catch (Throwable $e) { error_log('mur : ' . $e->getMessage()); fail(500, 'Erreur du serveur.'); }
