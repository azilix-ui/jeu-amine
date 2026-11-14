<?php
/*
 * Ma Houma en ligne (14/11/2026, demandé par le papa) : les enfants jouent ensemble dans la houma.
 * Qui est là, la discussion (texte libre et messages vocaux), « Viens voir ! » et le troc d'objets.
 * Seuls les appareils de confiance passent (la porte du site garde ce fichier comme les autres API).
 * Pas de vrai direct sur l'hébergement : chaque tablette demande les nouveautés toutes les 3 secondes.
 *
 *   POST action=salut client nom lieu chez depuis     -> {en_ligne:[{nom, lieu, chez}], msgs:[…id > depuis], trocs:[…], dernier}
 *        (à renvoyer toutes les 3 secondes ; on disparaît après 15 secondes sans nouvelles)
 *   POST action=dit nom texte                         -> {id}                        message écrit (300 caractères)
 *   POST action=voix nom duree audio(fichier)         -> {id}                        message vocal (60 s, 1,5 Mo)
 *   POST action=montre nom lieu titre                 -> {id}                        « Viens voir ! » : les autres peuvent venir dans ce lieu
 *   GET  ?son=ID                                      -> le message vocal
 * Le troc (les deux enfants valident) :
 *   POST action=propose de a donne(JSON)              -> {id}     A propose un objet à B                       (statut « offre »)
 *   POST action=repond id nom contre(JSON|vide)|non=1 -> {ok}     B choisit ce qu'il donne en échange, ou dit non (« contre » / « non »)
 *   POST action=conclut id nom oui=1|0                -> {ok}     A accepte (« fait » : A a déjà fait son échange) ou refuse
 *   POST action=annule id nom                         -> {ok}     l'un des deux annule avant la fin
 *   POST action=applique id nom                       -> {ok}     B a reçu l'objet (une seule fois, même avec deux tablettes)
 * Les parents (mot de passe parent, le même que pour les voix) :
 *   POST action=historique pass                       -> {msgs, trocs}  tout l'historique (les 600 derniers messages)
 *   POST action=efface id pass                        -> {ok}     efface un message
 * Le salon du site (14/11, l'étiquette en bas à gauche de chaque page, explorateur.js) : qui est sur le site et messages privés.
 *   POST action=site client nom av page depuis      -> {en_ligne:[{nom, av, page}], msgs:[mes messages privés, id > depuis]}  (toutes les 8 s)
 *   POST action=ecrit de a texte                    -> {id}     un message privé (300 caractères) ; il n'apparaît pas dans la discussion de la houma
 * Données : famille-data/houma-ligne.sqlite et famille-data/houma-voix/<id>.<ext> (hors du site public).
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();

const HL_TEXTE = 300;
const HL_SON_MAX = 1500000;
const HL_EN_LIGNE = 15;        // secondes
const HL_GARDE = 600;          // messages gardés (les plus anciens et leur son disparaissent)
const HL_ENVOIS = 120;         // messages, trocs et « viens voir » par adresse…
const HL_FENETRE = 600;        // …toutes les 10 minutes
const HL_TROC_VIE = 172800;    // une proposition sans réponse s'efface après 2 jours

header('X-Content-Type-Options: nosniff');
function out(int $c, array $d): void { http_response_code($c); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function fail(int $c, string $m): void { out($c, ['error' => $m]); }
function hl_dossier(): string { $d = dirname(ga_racine()) . '/famille-data/houma-voix'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function hl(): PDO {
    static $p = null; if ($p) return $p;
    $dd = dirname(ga_racine()) . '/famille-data'; if (!is_dir($dd)) @mkdir($dd, 0750, true);
    $p = new PDO('sqlite:' . $dd . '/houma-ligne.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $p->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $p->exec('CREATE TABLE IF NOT EXISTS presence (client TEXT PRIMARY KEY, nom TEXT NOT NULL, lieu TEXT, chez TEXT, vu INTEGER NOT NULL)');
    $p->exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY, nom TEXT NOT NULL, type TEXT NOT NULL, texte TEXT, lieu TEXT, son TEXT, duree INTEGER, ts INTEGER NOT NULL, ip TEXT)');
    $p->exec('CREATE TABLE IF NOT EXISTS trocs (id INTEGER PRIMARY KEY, de TEXT NOT NULL, a TEXT NOT NULL, donne TEXT NOT NULL, contre TEXT, statut TEXT NOT NULL, ts INTEGER NOT NULL, maj INTEGER NOT NULL, app_a INTEGER NOT NULL DEFAULT 0, app_b INTEGER NOT NULL DEFAULT 0)');
    $p->exec('CREATE TABLE IF NOT EXISTS envois (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    $p->exec('CREATE TABLE IF NOT EXISTS site (client TEXT PRIMARY KEY, nom TEXT NOT NULL, av TEXT, page TEXT, vu INTEGER NOT NULL)');
    $cols = array_column($p->query('PRAGMA table_info(messages)')->fetchAll(), 'name');
    if (!in_array('a', $cols, true)) $p->exec("ALTER TABLE messages ADD COLUMN a TEXT NOT NULL DEFAULT ''");   // destinataire d'un message privé ('' = la houma)
    return $p;
}
function nom($a): string {
    $a = trim(preg_replace('/\s+/u', ' ', (string)$a));
    if ($a === '' || mb_strlen($a) > 20 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $a)) fail(400, 'Choisis qui joue.');
    return mb_strtoupper(mb_substr($a, 0, 1)) . mb_substr($a, 1);
}
function court($s, int $n): string { return mb_substr(trim(preg_replace('/[\x00-\x1F\x7F]/u', ' ', (string)$s)), 0, $n); }
function lieu($s): string { $s = (string)$s; return preg_match('/^[a-z0-9-]{1,30}$/', $s) ? $s : ''; }
// un objet du troc : {k:'d', t, u, n} (un objet de la maison) ou {k:'p', t, n} (un produit du panier)
function objet($j): ?array {
    if ($j === null || $j === '') return null;
    $o = json_decode((string)$j, true);
    if (!is_array($o) || !in_array($o['k'] ?? '', ['d', 'p'], true) || !preg_match('/^[a-z0-9_]{1,40}$/', (string)($o['t'] ?? ''))) fail(400, 'Objet inconnu.');
    $r = ['k' => $o['k'], 't' => $o['t'], 'n' => court($o['n'] ?? '', 40)];
    if ($o['k'] === 'd') { if (!preg_match('/^[a-z0-9]{1,24}$/', (string)($o['u'] ?? ''))) fail(400, 'Objet inconnu.'); $r['u'] = $o['u']; $r['g'] = max(.35, min(3, (float)($o['g'] ?? 1))); }
    return $r;
}
function limite(): void {
    $ip = ga_ip(); $t = time();
    hl()->prepare('DELETE FROM envois WHERE ts < ?')->execute([$t - HL_FENETRE]);
    $s = hl()->prepare('SELECT COUNT(*) FROM envois WHERE ip = ?'); $s->execute([$ip]);
    if ((int)$s->fetchColumn() >= HL_ENVOIS) fail(429, 'Doucement ! Attends un peu avant d\'envoyer encore.');
    hl()->prepare('INSERT INTO envois (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
}
function ajoute(string $nom, string $type, string $texte, string $lieu = '', string $son = '', int $duree = 0, string $a = ''): int {
    hl()->prepare('INSERT INTO messages (nom, type, texte, lieu, son, duree, ts, ip, a) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')->execute([$nom, $type, $texte, $lieu, $son, $duree, time(), ga_ip(), $a]);
    $id = (int)hl()->lastInsertId();
    foreach (hl()->query('SELECT id, son FROM messages WHERE id <= ' . ($id - HL_GARDE)) as $v) { if ($v['son']) @unlink(hl_dossier() . '/' . $v['id'] . '.' . $v['son']); }
    hl()->exec('DELETE FROM messages WHERE id <= ' . ($id - HL_GARDE));
    return $id;
}
function msg_out(array $m): array { return ['id' => (int)$m['id'], 'nom' => $m['nom'], 'type' => $m['type'], 'texte' => (string)$m['texte'], 'lieu' => (string)$m['lieu'], 'son' => $m['son'] ? 1 : 0, 'duree' => (int)$m['duree'], 'ts' => (int)$m['ts'], 'a' => (string)($m['a'] ?? '')]; }
function troc_out(array $t): array { return ['id' => (int)$t['id'], 'de' => $t['de'], 'a' => $t['a'], 'donne' => json_decode($t['donne'], true), 'contre' => $t['contre'] ? json_decode($t['contre'], true) : null, 'statut' => $t['statut'], 'ts' => (int)$t['ts'], 'maj' => (int)$t['maj'], 'app_a' => (int)$t['app_a'], 'app_b' => (int)$t['app_b']]; }
function troc(int $id): array { $s = hl()->prepare('SELECT * FROM trocs WHERE id = ?'); $s->execute([$id]); $t = $s->fetch(); if (!$t) fail(404, 'Ce troc n\'existe plus.'); return $t; }
function parent(): void {
    if (ga_trop_essais()) fail(429, "Trop d'essais. Réessaie dans 15 minutes.");
    $auth = json_decode((string)@file_get_contents(dirname(ga_racine()) . '/nahki-voix/auth.json'), true);
    if (empty($auth['hash']) || !password_verify((string)($_POST['pass'] ?? ''), (string)$auth['hash'])) { ga_note_echec(); fail(403, 'Mot de passe parent incorrect.'); }
}
const HL_MIME = ['webm' => 'audio/webm', 'mp4' => 'audio/mp4', 'ogg' => 'audio/ogg', 'wav' => 'audio/wav'];

try {
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET'; $a = (string)($_POST['action'] ?? '');
    if ($m === 'GET' && isset($_GET['son'])) {
        $s = hl()->prepare('SELECT son FROM messages WHERE id = ?'); $s->execute([(int)$_GET['son']]); $x = (string)$s->fetchColumn();
        $f = hl_dossier() . '/' . (int)$_GET['son'] . '.' . $x;
        if (!$x || !isset(HL_MIME[$x]) || !is_file($f)) { http_response_code(404); exit; }
        header('Content-Type: ' . HL_MIME[$x]); header('Cache-Control: private, max-age=31536000, immutable'); header('Content-Length: ' . filesize($f)); readfile($f); exit;
    }
    if ($m !== 'POST') fail(405, 'Action inconnue.');
    $t = time();

    if ($a === 'salut') {
        $nom = nom($_POST['nom'] ?? ''); $client = (string)($_POST['client'] ?? '');
        if (!preg_match('/^[0-9a-z]{8,40}$/', $client)) fail(400, 'Appareil inconnu.');
        hl()->prepare('DELETE FROM presence WHERE vu < ?')->execute([$t - HL_EN_LIGNE]);
        hl()->prepare('INSERT OR REPLACE INTO presence (client, nom, lieu, chez, vu) VALUES (?, ?, ?, ?, ?)')->execute([$client, $nom, lieu($_POST['lieu'] ?? ''), court($_POST['chez'] ?? '', 20), $t]);
        $en = []; foreach (hl()->query('SELECT nom, lieu, chez, vu FROM presence ORDER BY vu DESC') as $p) if (!isset($en[$p['nom']])) $en[$p['nom']] = ['nom' => $p['nom'], 'lieu' => $p['lieu'], 'chez' => $p['chez']];
        $depuis = (int)($_POST['depuis'] ?? 0);
        $s = $depuis > 0 ? hl()->prepare("SELECT * FROM messages WHERE id > ? AND a = '' ORDER BY id LIMIT 60") : hl()->prepare("SELECT * FROM (SELECT * FROM messages WHERE id > ? AND a = '' ORDER BY id DESC LIMIT 40) ORDER BY id");
        $s->execute([$depuis]); $msgs = array_map('msg_out', $s->fetchAll());
        hl()->prepare("UPDATE trocs SET statut = 'perime', maj = ? WHERE statut IN ('offre', 'contre') AND maj < ?")->execute([$t, $t - HL_TROC_VIE]);
        $s = hl()->prepare("SELECT * FROM trocs WHERE (de = ? OR a = ?) AND (statut IN ('offre', 'contre') OR (statut = 'fait' AND ((a = ? AND app_b = 0) OR (de = ? AND app_a = 0))) OR maj > ?) ORDER BY id DESC LIMIT 30");
        $s->execute([$nom, $nom, $nom, $nom, $t - 900]);
        $d = (int)hl()->query("SELECT COALESCE(MAX(id), 0) FROM messages WHERE a = ''")->fetchColumn();
        out(200, ['en_ligne' => array_values($en), 'msgs' => $msgs, 'trocs' => array_map('troc_out', $s->fetchAll()), 'dernier' => $d, 'now' => $t]);
    }
    if ($a === 'site') {
        $nom = nom($_POST['nom'] ?? ''); $client = (string)($_POST['client'] ?? '');
        if (!preg_match('/^[0-9a-z]{8,40}$/', $client)) fail(400, 'Appareil inconnu.');
        $av = preg_match('/^[a-z]{2,12}$/', (string)($_POST['av'] ?? '')) ? (string)$_POST['av'] : '';
        hl()->prepare('DELETE FROM site WHERE vu < ?')->execute([$t - 25]);
        hl()->prepare('INSERT OR REPLACE INTO site (client, nom, av, page, vu) VALUES (?, ?, ?, ?, ?)')->execute([$client, $nom, $av, court($_POST['page'] ?? '', 60), $t]);
        $en = []; foreach (hl()->query('SELECT nom, av, page FROM site ORDER BY vu DESC') as $p) if (!isset($en[$p['nom']])) $en[$p['nom']] = $p;
        $depuis = (int)($_POST['depuis'] ?? 0);
        $s = $depuis > 0 ? hl()->prepare("SELECT * FROM messages WHERE id > ? AND a <> '' AND (a = ? OR nom = ?) ORDER BY id LIMIT 60")
                         : hl()->prepare("SELECT * FROM (SELECT * FROM messages WHERE id > ? AND a <> '' AND (a = ? OR nom = ?) ORDER BY id DESC LIMIT 40) ORDER BY id");
        $s->execute([$depuis, $nom, $nom]);
        out(200, ['en_ligne' => array_values($en), 'msgs' => array_map('msg_out', $s->fetchAll()), 'now' => $t]);
    }
    if ($a === 'ecrit') {
        $de = nom($_POST['de'] ?? ''); $vers = nom($_POST['a'] ?? ''); if ($de === $vers) fail(400, 'Choisis à qui écrire.');
        $x = court($_POST['texte'] ?? '', HL_TEXTE); if ($x === '') fail(400, 'Le message est vide.');
        limite(); out(200, ['id' => ajoute($de, 't', $x, '', '', 0, $vers)]);
    }
    if ($a === 'dit') {
        $nom = nom($_POST['nom'] ?? ''); $x = court($_POST['texte'] ?? '', HL_TEXTE); if ($x === '') fail(400, 'Le message est vide.');
        limite(); out(200, ['id' => ajoute($nom, 't', $x)]);
    }
    if ($a === 'montre') {
        $nom = nom($_POST['nom'] ?? ''); $l = lieu($_POST['lieu'] ?? ''); if ($l === '') fail(400, 'Lieu inconnu.');
        limite(); out(200, ['id' => ajoute($nom, 'm', court($_POST['titre'] ?? '', 60), $l)]);
    }
    if ($a === 'voix') {
        $nom = nom($_POST['nom'] ?? ''); $f = $_FILES['audio'] ?? null;
        if (!$f || ($f['error'] ?? 1) !== UPLOAD_ERR_OK) fail(400, 'Le message vocal n\'est pas arrivé.');
        if ($f['size'] < 800 || $f['size'] > HL_SON_MAX) fail(400, 'Le message vocal est trop long.');
        $h = (string)file_get_contents($f['tmp_name'], false, null, 0, 12);
        $x = substr($h, 0, 4) === "\x1A\x45\xDF\xA3" ? 'webm' : (substr($h, 4, 4) === 'ftyp' ? 'mp4' : (substr($h, 0, 4) === 'OggS' ? 'ogg' : (substr($h, 0, 4) === 'RIFF' && substr($h, 8, 4) === 'WAVE' ? 'wav' : '')));
        if ($x === '') fail(400, 'Ce son n\'est pas reconnu.');
        limite(); $id = ajoute($nom, 'v', '', '', $x, max(1, min(60, (int)($_POST['duree'] ?? 0))));
        if (!move_uploaded_file($f['tmp_name'], hl_dossier() . '/' . $id . '.' . $x)) { hl()->prepare('DELETE FROM messages WHERE id = ?')->execute([$id]); fail(500, 'Le serveur n\'a pas pu garder le son.'); }
        out(200, ['id' => $id]);
    }
    if ($a === 'propose') {
        $de = nom($_POST['de'] ?? ''); $vers = nom($_POST['a'] ?? ''); if ($de === $vers) fail(400, 'Choisis un ami.');
        $o = objet($_POST['donne'] ?? ''); if (!$o) fail(400, 'Choisis un objet.');
        $s = hl()->prepare("SELECT COUNT(*) FROM trocs WHERE de = ? AND statut IN ('offre', 'contre')"); $s->execute([$de]); if ((int)$s->fetchColumn() >= 6) fail(429, 'Tu as déjà 6 trocs en attente : attends les réponses !');
        limite();
        hl()->prepare("INSERT INTO trocs (de, a, donne, statut, ts, maj) VALUES (?, ?, ?, 'offre', ?, ?)")->execute([$de, $vers, json_encode($o, JSON_UNESCAPED_UNICODE), $t, $t]);
        out(200, ['id' => (int)hl()->lastInsertId()]);
    }
    if ($a === 'repond') {
        $T = troc((int)($_POST['id'] ?? 0)); $nom = nom($_POST['nom'] ?? '');
        if ($T['a'] !== $nom || $T['statut'] !== 'offre') fail(409, 'Ce troc a déjà changé.');
        if (!empty($_POST['non'])) { hl()->prepare("UPDATE trocs SET statut = 'non', maj = ? WHERE id = ?")->execute([$t, $T['id']]); out(200, ['ok' => true]); }
        $o = objet($_POST['contre'] ?? '');
        hl()->prepare("UPDATE trocs SET statut = 'contre', contre = ?, maj = ? WHERE id = ?")->execute([$o ? json_encode($o, JSON_UNESCAPED_UNICODE) : null, $t, $T['id']]);
        out(200, ['ok' => true]);
    }
    if ($a === 'conclut') {
        $T = troc((int)($_POST['id'] ?? 0)); $nom = nom($_POST['nom'] ?? '');
        if ($T['de'] !== $nom || $T['statut'] !== 'contre') fail(409, 'Ce troc a déjà changé.');
        $oui = !empty($_POST['oui']);
        $s = hl()->prepare("UPDATE trocs SET statut = ?, app_a = ?, maj = ? WHERE id = ? AND statut = 'contre'"); $s->execute([$oui ? 'fait' : 'non', $oui ? 1 : 0, $t, $T['id']]);
        if (!$s->rowCount()) fail(409, 'Ce troc a déjà changé.');
        out(200, ['ok' => true]);
    }
    if ($a === 'annule') {
        $T = troc((int)($_POST['id'] ?? 0)); $nom = nom($_POST['nom'] ?? '');
        if (!in_array($nom, [$T['de'], $T['a']], true) || !in_array($T['statut'], ['offre', 'contre'], true)) fail(409, 'Ce troc a déjà changé.');
        hl()->prepare("UPDATE trocs SET statut = 'annule', maj = ? WHERE id = ?")->execute([$t, $T['id']]);
        out(200, ['ok' => true]);
    }
    if ($a === 'applique') {
        $T = troc((int)($_POST['id'] ?? 0)); $nom = nom($_POST['nom'] ?? '');
        if ($T['a'] !== $nom || $T['statut'] !== 'fait') fail(409, 'Ce troc a déjà changé.');
        $s = hl()->prepare('UPDATE trocs SET app_b = 1, maj = ? WHERE id = ? AND app_b = 0'); $s->execute([$t, $T['id']]);
        out(200, ['ok' => $s->rowCount() > 0]);
    }
    if ($a === 'historique') {
        parent();
        $msgs = array_map('msg_out', hl()->query('SELECT * FROM messages ORDER BY id DESC LIMIT 600')->fetchAll());
        $trocs = array_map('troc_out', hl()->query('SELECT * FROM trocs ORDER BY id DESC LIMIT 200')->fetchAll());
        out(200, ['msgs' => $msgs, 'trocs' => $trocs]);
    }
    if ($a === 'efface') {
        parent(); $id = (int)($_POST['id'] ?? 0);
        $s = hl()->prepare('SELECT son FROM messages WHERE id = ?'); $s->execute([$id]); $x = (string)$s->fetchColumn();
        if ($x) @unlink(hl_dossier() . '/' . $id . '.' . $x);
        hl()->prepare('DELETE FROM messages WHERE id = ?')->execute([$id]);
        out(200, ['ok' => true]);
    }
    fail(400, 'Action inconnue.');
} catch (Throwable $e) {
    fail(500, 'Le serveur de la houma a un souci. Réessaie dans un moment.');
}
