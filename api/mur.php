<?php
/*
 * Famille Missaoui — le mur de la famille (13/11/2026) : messages, dessins et photos de créations, visibles par la famille
 * et les proches de confiance (la porte du site garde ce fichier comme les autres API).
 *
 *   GET  ?action=liste[&avant=ID]                -> 30 messages {id, auteur, texte, img, cree, reac{❤️,👏,😂}, mien, moi[]}
 *   GET  ?img=ID                                 -> l'image d'un message (WebP)
 *   POST action=poste auteur texte [image=dataURL] jeton  -> nouveau message (l'image est réencodée : plus de position GPS ni d'infos de l'appareil)
 *   POST action=reagit id emoji jeton            -> met ou enlève une réaction
 *   POST action=supprime id (jeton de l'auteur | pass = mot de passe parent)
 * Le « jeton » est un nombre au hasard gardé dans le navigateur : il dit « c'est moi qui ai écrit ça » (pour pouvoir effacer son message).
 * Données : famille-data/mur.sqlite et famille-data/mur/<id>.webp (hors du site public).
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();

const MUR_EMOJIS = ['❤️', '👏', '😂', '😮'];
const MUR_TEXTE = 500;
const MUR_IMAGE_MAX = 2500000;   // la photo arrive déjà réduite par la page (1280 px), en JPEG

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
    return $p;
}
function auteur($a): string {
    $a = trim(preg_replace('/\s+/u', ' ', (string)$a));
    if ($a === '' || mb_strlen($a) > 20 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $a)) fail(400, 'Choisis qui écrit.');
    return mb_strtoupper(mb_substr($a, 0, 1)) . mb_substr($a, 1);
}
function jeton(): string { $j = (string)($_POST['jeton'] ?? $_GET['jeton'] ?? ''); return preg_match('/^[0-9a-f]{32,64}$/', $j) ? hash('sha256', $j) : ''; }

try {
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET'; $a = (string)($_REQUEST['action'] ?? '');
    if ($m === 'GET' && isset($_GET['img'])) {
        $f = dossier() . '/' . (int)$_GET['img'] . '.webp';
        if (!is_file($f)) { http_response_code(404); exit; }
        header('Content-Type: image/webp'); header('Cache-Control: private, max-age=31536000, immutable'); header('Content-Length: ' . filesize($f)); readfile($f); exit;
    }
    if ($m === 'GET' && $a === 'liste') {
        $avant = (int)($_GET['avant'] ?? 0); $j = jeton();
        $s = mur()->prepare('SELECT id, auteur, texte, img, cree, jeton FROM messages' . ($avant ? ' WHERE id < ?' : '') . ' ORDER BY id DESC LIMIT 30'); $s->execute($avant ? [$avant] : []);
        $l = $s->fetchAll(); $ids = array_column($l, 'id'); $reac = []; $moi = [];
        if ($ids) {
            $in = implode(',', array_map('intval', $ids));
            foreach (mur()->query("SELECT message, emoji, COUNT(*) n FROM reactions WHERE message IN ($in) GROUP BY message, emoji") as $r) $reac[$r['message']][$r['emoji']] = (int)$r['n'];
            if ($j) { $q = mur()->prepare("SELECT message, emoji FROM reactions WHERE message IN ($in) AND jeton = ?"); $q->execute([$j]); foreach ($q as $r) $moi[$r['message']][] = $r['emoji']; }
        }
        out(200, ['messages' => array_map(fn($x) => ['id' => (int)$x['id'], 'auteur' => $x['auteur'], 'texte' => $x['texte'], 'img' => (bool)$x['img'], 'cree' => (int)$x['cree'],
            'reac' => $reac[$x['id']] ?? (object)[], 'moi' => $moi[$x['id']] ?? [], 'mien' => $j !== '' && hash_equals($x['jeton'], $j)], $l), 'emojis' => MUR_EMOJIS]);
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
        $db->prepare('INSERT INTO messages (auteur, texte, img, jeton, cree, ip) VALUES (?, ?, ?, ?, ?, ?)')->execute([$qui, $txt, $img ? 1 : 0, $j, $t, $ip]);
        $id = (int)$db->lastInsertId();
        if ($img) { imagepalettetotruecolor($img); imagewebp($img, dossier() . '/' . $id . '.webp', 82); imagedestroy($img); }   // réencodée : aucune info cachée de la photo d'origine
        $db->prepare('INSERT INTO envois (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
        out(200, ['ok' => true, 'id' => $id]);
    }
    if ($a === 'reagit') {
        $id = (int)($_POST['id'] ?? 0); $e = (string)($_POST['emoji'] ?? '');
        if (!$j || !in_array($e, MUR_EMOJIS, true)) fail(400, 'Réaction inconnue.');
        $d = mur()->prepare('DELETE FROM reactions WHERE message = ? AND jeton = ? AND emoji = ?'); $d->execute([$id, $j, $e]);
        if ($d->rowCount() === 0) mur()->prepare('INSERT OR IGNORE INTO reactions (message, jeton, emoji) SELECT id, ?, ? FROM messages WHERE id = ?')->execute([$j, $e, $id]);
        out(200, ['ok' => true]);
    }
    if ($a === 'supprime') {
        $id = (int)($_POST['id'] ?? 0);
        $s = mur()->prepare('SELECT jeton FROM messages WHERE id = ?'); $s->execute([$id]); $jt = $s->fetchColumn();
        if ($jt === false) out(200, ['ok' => true]);
        $parent = false;
        if (!($j && hash_equals((string)$jt, $j))) {   // pas l'auteur : il faut le mot de passe parent
            $auth = json_decode((string)@file_get_contents(dirname(ga_racine()) . '/nahki-voix/auth.json'), true);
            if (ga_trop_essais()) fail(429, "Trop d'essais. Réessaie dans 15 minutes.");
            if (empty($auth['hash']) || !password_verify((string)($_POST['pass'] ?? ''), (string)$auth['hash'])) { ga_note_echec(); fail(403, 'Mot de passe parent incorrect.'); }
        }
        mur()->prepare('DELETE FROM messages WHERE id = ?')->execute([$id]); mur()->prepare('DELETE FROM reactions WHERE message = ?')->execute([$id]);
        @unlink(dossier() . '/' . $id . '.webp');
        out(200, ['ok' => true]);
    }
    fail(400, 'Action inconnue.');
} catch (Throwable $e) { error_log('mur : ' . $e->getMessage()); fail(500, 'Erreur du serveur.'); }
