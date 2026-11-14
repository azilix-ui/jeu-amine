<?php
/*
 * Famille Missaoui — la porte du site (13/11/2026).
 *
 * Le site n'est ouvert qu'aux appareils de confiance :
 *   - ceux qui viennent de l'adresse internet (IP) de la maison : ils sont reconnus tout seuls et gardent ensuite l'accès partout ;
 *   - ceux où l'administrateur (Anis) s'est connecté ;
 *   - ceux qui ont ouvert un lien d'invitation encore valable (durée du lien et durée de l'accès choisies par Anis).
 * Les autres voient la page « accès réservé » (acces/index.php).
 *
 * Tant que la protection n'est pas activée (page acces/admin.php), tout le monde entre, comme avant.
 * Secours : créer le fichier famille-data/acces-ouvert (gestionnaire de fichiers hPanel) ouvre le site à tous.
 *
 * Données (hors du site public) : famille-data/acces.sqlite, famille-data/acces-admin.json.
 * Toutes les fonctions commencent par ga_ : ce fichier est inclus dans les API, qui ont leurs propres fonctions.
 */
declare(strict_types=1);
date_default_timezone_set('Europe/Paris');

const GA_ANNEE = 365 * 86400;
const GA_ADMIN_DUREE = 12 * 3600;     // une connexion administrateur dure 12 heures
const GA_ESSAIS = 8;                  // essais de mot de passe…
const GA_ESSAIS_FENETRE = 900;        // …par 15 minutes et par adresse
const GA_COOKIE = 'mf_appareil';
const GA_COOKIE_ADMIN = 'mf_admin';
const GA_COOKIE_DEMANDE = 'mf_demande';   // un appareil inconnu qui frappe à la porte (30 jours) : Anis peut lui faire confiance à distance

function ga_racine(): string { return dirname(__DIR__); }                    // public_html
function ga_donnees(): string {
    $d = dirname(ga_racine()) . '/famille-data';
    if (!is_dir($d)) @mkdir($d, 0750, true);
    return $d;
}
function ga_db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $pdo = new PDO('sqlite:' . ga_donnees() . '/acces.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS reglages (k TEXT PRIMARY KEY, v TEXT)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS ips (id INTEGER PRIMARY KEY, ip TEXT NOT NULL, nom TEXT, cree INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS appareils (id INTEGER PRIMARY KEY, hash TEXT UNIQUE NOT NULL, nom TEXT, via TEXT, invitation INTEGER, cree INTEGER NOT NULL, expire INTEGER NOT NULL, vu INTEGER, ip TEXT, ua TEXT, revoque INTEGER NOT NULL DEFAULT 0)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS invitations (id INTEGER PRIMARY KEY, code TEXT UNIQUE NOT NULL, nom TEXT, cree INTEGER NOT NULL, lien_expire INTEGER NOT NULL, duree INTEGER NOT NULL, usages_max INTEGER NOT NULL, usages INTEGER NOT NULL DEFAULT 0, revoque INTEGER NOT NULL DEFAULT 0)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expire INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS refus (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, ip TEXT, page TEXT, ua TEXT)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS echecs (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    // statut : vu (refusé, sans nom) · attente (il a écrit son prénom) · accepte (Anis a dit oui, l'appareil sera reconnu à sa prochaine page) · fait · ignore
    $pdo->exec('CREATE TABLE IF NOT EXISTS demandes (id INTEGER PRIMARY KEY, hash TEXT UNIQUE NOT NULL, nom TEXT, statut TEXT NOT NULL, duree INTEGER, cree INTEGER NOT NULL, vu INTEGER NOT NULL, ip TEXT, ua TEXT, page TEXT, pages INTEGER NOT NULL DEFAULT 0)');
    return $pdo;
}
function ga_reglage(string $k, ?string $v = null): ?string {
    if ($v !== null) { ga_db()->prepare('INSERT INTO reglages (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v')->execute([$k, $v]); return $v; }
    $s = ga_db()->prepare('SELECT v FROM reglages WHERE k = ?'); $s->execute([$k]); $r = $s->fetchColumn();
    return $r === false ? null : (string)$r;
}
function ga_admin_fiche(): array {
    $f = ga_donnees() . '/acces-admin.json';
    if (!is_file($f)) return [];
    $j = json_decode((string)file_get_contents($f), true);
    return is_array($j) ? $j : [];
}
function ga_admin_ecrit(array $a): void {
    $f = ga_donnees() . '/acces-admin.json'; file_put_contents($f . '.tmp', json_encode($a, JSON_UNESCAPED_UNICODE), LOCK_EX); rename($f . '.tmp', $f);
}
// La protection est-elle en marche ? (compte administrateur créé + activée, et pas de fichier de secours)
function ga_active(): bool {
    if (is_file(ga_donnees() . '/acces-ouvert')) return false;
    if (empty(ga_admin_fiche()['hash'])) return false;
    return ga_reglage('actif') === '1';
}

/* L'adresse du visiteur. REMOTE_ADDR est l'adresse vraie de la connexion ; X-Forwarded-For peut être écrit par n'importe qui,
   on ne le lit donc que si la connexion vient d'un relais du réseau interne (adresse privée), et on prend l'adresse la plus à droite
   (celle que le relais a ajoutée). */
function ga_ip(): string {
    $r = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    $public = fn($ip) => (bool)filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    if ($r !== '' && !$public($r)) {
        $x = array_reverse(array_map('trim', explode(',', (string)($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))));
        foreach ($x as $ip) if ($public($ip)) return $ip;
    }
    return $r;
}
// Une adresse IPv4 doit être exactement la même ; en IPv6 la box donne un bloc /64 à la maison : on compare les 4 premiers groupes.
function ga_ip_pareille(string $a, string $b): bool {
    if ($a === $b) return true;
    $pa = @inet_pton($a); $pb = @inet_pton($b);
    if ($pa === false || $pb === false || strlen($pa) !== 16 || strlen($pb) !== 16) return false;
    return substr($pa, 0, 8) === substr($pb, 0, 8);
}
function ga_ip_maison(string $ip): bool {
    foreach (ga_db()->query('SELECT ip FROM ips') as $r) if (ga_ip_pareille($ip, (string)$r['ip'])) return true;
    return false;
}
function ga_ua(): string { return mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300); }
// Un nom lisible pour l'appareil : « iPad · Safari », « Windows · Chrome »…
function ga_nom_appareil(string $ua): string {
    $os = preg_match('/iPad/i', $ua) ? 'iPad' : (preg_match('/iPhone/i', $ua) ? 'iPhone' : (preg_match('/Android/i', $ua) ? (preg_match('/Mobile/i', $ua) ? 'Téléphone Android' : 'Tablette Android') : (preg_match('/Windows/i', $ua) ? 'PC Windows' : (preg_match('/Macintosh/i', $ua) ? (preg_match('/Mobile/i', $ua) ? 'iPad' : 'Mac') : (preg_match('/Linux/i', $ua) ? 'Linux' : 'Appareil')))));
    $nav = preg_match('/Edg\//', $ua) ? 'Edge' : (preg_match('/SamsungBrowser/', $ua) ? 'Samsung' : (preg_match('/Firefox|FxiOS/', $ua) ? 'Firefox' : (preg_match('/Chrome|CriOS/', $ua) ? 'Chrome' : (preg_match('/Safari/', $ua) ? 'Safari' : ''))));
    return $nav ? "$os · $nav" : $os;
}
function ga_cookie(string $nom, string $val, int $expire, string $samesite = 'Lax'): void {
    setcookie($nom, $val, ['expires' => $expire, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https', 'httponly' => true, 'samesite' => $samesite]);
}
// Donne à cet appareil sa carte de confiance (un jeton gardé dans un cookie ; la base ne garde que son empreinte).
function ga_nouvel_appareil(string $via, int $duree, ?int $invitation = null, ?string $nom = null): int {
    $jeton = bin2hex(random_bytes(32)); $t = time(); $exp = $t + max(3600, $duree);
    $ua = ga_ua();
    ga_db()->prepare('INSERT INTO appareils (hash, nom, via, invitation, cree, expire, vu, ip, ua) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([hash('sha256', $jeton), $nom ?: ga_nom_appareil($ua), $via, $invitation, $t, $exp, $t, ga_ip(), $ua]);
    ga_cookie(GA_COOKIE, $jeton, min($exp, $t + 400 * 86400));
    $_COOKIE[GA_COOKIE] = $jeton;
    return (int)ga_db()->lastInsertId();
}
// L'appareil de ce visiteur (ou null) ; met à jour « vu le » au plus toutes les 10 minutes.
function ga_appareil(): ?array {
    $j = (string)($_COOKIE[GA_COOKIE] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $j)) return null;
    $s = ga_db()->prepare('SELECT * FROM appareils WHERE hash = ? AND revoque = 0 AND expire > ?'); $s->execute([hash('sha256', $j), time()]);
    $a = $s->fetch(); if (!$a) return null;
    if ((int)$a['vu'] < time() - 600) ga_db()->prepare('UPDATE appareils SET vu = ?, ip = ?, ua = ? WHERE id = ?')->execute([time(), ga_ip(), ga_ua(), $a['id']]);
    return $a;
}
function ga_admin(): bool {
    $j = (string)($_COOKIE[GA_COOKIE_ADMIN] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $j)) return false;
    $s = ga_db()->prepare('SELECT 1 FROM sessions WHERE hash = ? AND expire > ?'); $s->execute([hash('sha256', $j), time()]);
    return (bool)$s->fetchColumn();
}
function ga_ouvre_session_admin(): void {
    $j = bin2hex(random_bytes(32)); $exp = time() + GA_ADMIN_DUREE;
    ga_db()->prepare('DELETE FROM sessions WHERE expire < ?')->execute([time()]);
    ga_db()->prepare('INSERT INTO sessions (hash, expire) VALUES (?, ?)')->execute([hash('sha256', $j), $exp]);
    ga_cookie(GA_COOKIE_ADMIN, $j, $exp, 'Strict'); $_COOKIE[GA_COOKIE_ADMIN] = $j;
}
// Le visiteur peut-il entrer ? Un appareil de la maison sans carte en reçoit une (valable un an).
function ga_peut_entrer(): bool {
    try {
        if (!ga_active()) return true;
        if (ga_appareil() || ga_admin()) return true;
        if (ga_ip_maison(ga_ip())) { ga_nouvel_appareil('maison', GA_ANNEE); return true; }
        $d = ga_demande();
        if ($d && $d['statut'] === 'accepte') {   // Anis lui a fait confiance depuis l'administration
            ga_db()->prepare("UPDATE demandes SET statut = 'fait' WHERE id = ?")->execute([$d['id']]);
            ga_nouvel_appareil('accepte', (int)$d['duree'] ?: GA_ANNEE, null, trim(($d['nom'] ? $d['nom'] . ' · ' : '') . ga_nom_appareil(ga_ua())));
            ga_cookie(GA_COOKIE_DEMANDE, '', 1);
            return true;
        }
        return false;
    } catch (Throwable $e) {
        error_log('garde : ' . $e->getMessage());
        return true;   // une panne de la porte ne doit jamais enfermer la famille dehors
    }
}
function ga_note_refus(string $page): void {
    try {
        $db = ga_db(); $t = time();
        $db->prepare('INSERT INTO refus (ts, ip, page, ua) VALUES (?, ?, ?, ?)')->execute([$t, ga_ip(), mb_substr($page, 0, 200), ga_ua()]);
        if (random_int(1, 50) === 1) $db->prepare('DELETE FROM refus WHERE ts < ?')->execute([$t - 60 * 86400]);
    } catch (Throwable $e) {}
}
// L'appareil inconnu qui frappe à la porte (cookie mf_demande), ou null
function ga_demande(): ?array {
    $j = (string)($_COOKIE[GA_COOKIE_DEMANDE] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $j)) return null;
    $s = ga_db()->prepare('SELECT * FROM demandes WHERE hash = ?'); $s->execute([hash('sha256', $j)]);
    return $s->fetch() ?: null;
}
function ga_robot(string $ua): bool { return $ua === '' || (bool)preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|WhatsApp|Discord|Telegram|curl|wget|python|Go-http|HeadlessChrome|Lighthouse|monitor/i', $ua); }
// Note la visite d'un appareil refusé (pour la liste « Appareils qui frappent à la porte ») ; un robot n'est pas noté.
function ga_note_demande(string $page, ?string $nom = null): ?array {
    try {
        $ua = ga_ua(); $t = time(); $db = ga_db(); $d = ga_demande();
        if (!$d) {
            if (ga_robot($ua) && $nom === null) return null;
            $j = bin2hex(random_bytes(32));
            $db->prepare("INSERT INTO demandes (hash, statut, cree, vu, ip, ua, page) VALUES (?, 'vu', ?, ?, ?, ?, ?)")->execute([hash('sha256', $j), $t, $t, ga_ip(), $ua, mb_substr($page, 0, 200)]);
            ga_cookie(GA_COOKIE_DEMANDE, $j, $t + 30 * 86400); $_COOKIE[GA_COOKIE_DEMANDE] = $j;
            if (random_int(1, 30) === 1) $db->prepare("DELETE FROM demandes WHERE vu < ? AND statut IN ('vu', 'ignore', 'fait')")->execute([$t - 30 * 86400]);
            $d = ga_demande();
        }
        $statut = $d['statut']; $alerte = false;
        if ($nom !== null) { $nom = mb_substr(trim(preg_replace('/\s+/u', ' ', $nom)), 0, 40); if ($statut === 'vu' || $statut === 'ignore') { $statut = 'attente'; $alerte = true; } }
        $db->prepare('UPDATE demandes SET vu = ?, ip = ?, ua = ?, page = COALESCE(?, page), pages = pages + ?, nom = COALESCE(?, nom), statut = ? WHERE id = ?')
           ->execute([$t, ga_ip(), $ua, $page === '' ? null : mb_substr($page, 0, 200), $page === '' ? 0 : 1, $nom ?: null, $statut, $d['id']]);
        if ($alerte) ga_alerte("🛎️ $nom frappe à la porte", "$nom demande l'accès au site de la famille depuis cet appareil : " . ga_nom_appareil($ua) . ' (adresse ' . ga_ip() . ").\nOuvre l'administration et touche « Faire confiance » si tu le reconnais.");
        return ga_demande();
    } catch (Throwable $e) { error_log('demande : ' . $e->getMessage()); return null; }
}
// Pour les API : réponse 401 si l'appareil n'est pas de confiance.
function ga_garde_api(): void {
    if (ga_peut_entrer()) return;
    ga_note_refus((string)($_SERVER['REQUEST_URI'] ?? ''));
    http_response_code(401); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
    echo json_encode(['error' => 'acces', 'message' => "Accès réservé à la famille."], JSON_UNESCAPED_UNICODE); exit;
}
// Trop d'essais de mot de passe depuis cette adresse ?
function ga_trop_essais(): bool {
    $s = ga_db()->prepare('SELECT COUNT(*) FROM echecs WHERE ip = ? AND ts > ?'); $s->execute([ga_ip(), time() - GA_ESSAIS_FENETRE]);
    return (int)$s->fetchColumn() >= GA_ESSAIS;
}
function ga_note_echec(): void {
    ga_db()->prepare('INSERT INTO echecs (ip, ts) VALUES (?, ?)')->execute([ga_ip(), time()]);
    ga_db()->prepare('DELETE FROM echecs WHERE ts < ?')->execute([time() - 86400]);
    usleep(600000);
}
function ga_h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }

/* ---------- Sauvegardes (13/11) ----------
   Une fois par semaine (à la première page ouverte après 7 jours), une copie de famille-data (bases SQLite copiées proprement
   avec VACUUM INTO, réglages) et de nahki-voix (mot de passe parent, voix) dans famille-data/sauvegardes/sauvegarde-AAAA-MM-JJ.zip.
   Les 8 dernières sont gardées. Anis les télécharge depuis l'administration. */
const GA_SAUVEGARDES_GARDEES = 8;
function ga_dossier_sauvegardes(): string { $d = ga_donnees() . '/sauvegardes'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function ga_liste_sauvegardes(): array {
    $l = glob(ga_dossier_sauvegardes() . '/sauvegarde-*.zip') ?: []; rsort($l);
    return array_map(fn($f) => ['nom' => basename($f), 'taille' => filesize($f), 'date' => filemtime($f)], $l);
}
function ga_sauvegarde(): ?string {
    if (!class_exists('ZipArchive')) return null;
    @set_time_limit(120);
    $dos = ga_dossier_sauvegardes(); $tmp = $dos . '/tmp-' . bin2hex(random_bytes(4)); @mkdir($tmp, 0750);
    $nom = 'sauvegarde-' . date('Y-m-d') . '.zip'; $zipf = $dos . '/' . $nom . '.part';
    $z = new ZipArchive(); if ($z->open($zipf, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) return null;
    $data = ga_donnees();
    foreach (glob($data . '/*') ?: [] as $f) {
        $b = basename($f);
        if (is_dir($f) || preg_match('/(-wal|-shm|-journal|\.tmp|\.part)$/', $b)) continue;
        if (substr($b, -7) === '.sqlite') {   // copie cohérente de la base, même pendant qu'on joue
            $copie = $tmp . '/' . $b;
            try { $p = new PDO('sqlite:' . $f); $p->exec('VACUUM INTO ' . $p->quote($copie)); $p = null; $z->addFile($copie, 'famille-data/' . $b); }
            catch (Throwable $e) { $z->addFile($f, 'famille-data/' . $b); }
        } else $z->addFile($f, 'famille-data/' . $b);
    }
    $murd = $data . '/mur';   // les images du mur de la famille
    if (is_dir($murd)) foreach (glob($murd . '/*.webp') ?: [] as $f) $z->addFile($f, 'famille-data/mur/' . basename($f));
    foreach (glob($data . '/lire-voix/*/*.mp3') ?: [] as $f) $z->addFile($f, 'famille-data/lire-voix/' . basename(dirname($f)) . '/' . basename($f));   // les voix de « Je lis ! »
    $voix = dirname(ga_racine()) . '/nahki-voix';
    if (is_dir($voix)) {
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($voix, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $f) if ($f->isFile()) $z->addFile($f->getPathname(), 'nahki-voix/' . substr($f->getPathname(), strlen($voix) + 1));
    }
    $z->setArchiveComment('Famille Missaoui · sauvegarde du ' . date('d/m/Y H:i'));
    $ok = $z->close();
    foreach (glob($tmp . '/*') ?: [] as $f) @unlink($f); @rmdir($tmp);
    if (!$ok) { @unlink($zipf); return null; }
    rename($zipf, $dos . '/' . $nom);
    foreach (array_slice(ga_liste_sauvegardes(), GA_SAUVEGARDES_GARDEES) as $v) @unlink($dos . '/' . $v['nom']);
    ga_reglage('sauvegarde_derniere', (string)time());
    return $nom;
}
// Appelée après chaque page servie : lance la sauvegarde de la semaine si elle est due (une seule à la fois).
function ga_sauvegarde_si_due(): void {
    try {
        if ((int)(ga_reglage('sauvegarde_derniere') ?? 0) > time() - 7 * 86400) return;
        $verrou = fopen(ga_dossier_sauvegardes() . '/.verrou', 'c'); if (!$verrou || !flock($verrou, LOCK_EX | LOCK_NB)) return;
        if ((int)(ga_reglage('sauvegarde_derniere') ?? 0) > time() - 7 * 86400) return;
        ga_reglage('sauvegarde_derniere', (string)time());   // même en cas d'échec, on ne réessaie pas à chaque page
        ga_sauvegarde();
        flock($verrou, LOCK_UN);
    } catch (Throwable $e) { error_log('sauvegarde : ' . $e->getMessage()); }
}

/* ---------- Alertes (13/11) : quelqu'un frappe à la porte ----------
   Par e-mail (adresse réglée par Anis dans l'administration, jamais écrite dans le code : le dépôt GitHub est public)
   et par l'appli ntfy (canal secret tiré au hasard). 10 alertes par heure au plus. */
function ga_canal_ntfy(): string {
    $c = ga_reglage('alerte_ntfy');
    if (!$c) $c = ga_reglage('alerte_ntfy', 'missaoui-' . bin2hex(random_bytes(8)));
    return $c;
}
function ga_alerte(string $titre, string $texte, bool $essai = false): array {
    $res = ['email' => null, 'ntfy' => null];
    try {
        if (!$essai) {
            $t = time(); $l = array_values(array_filter(json_decode(ga_reglage('alertes_recentes') ?? '[]', true) ?: [], fn($x) => $x > $t - 3600));
            if (count($l) >= 10) return $res;
            $l[] = $t; ga_reglage('alertes_recentes', json_encode($l));
        }
        $lien = 'https://www.missaoui-family.com/acces/admin.php';
        $mail = ga_reglage('alerte_email');
        if ($mail && filter_var($mail, FILTER_VALIDATE_EMAIL) && ga_reglage('alerte_email_on') !== '0') {
            $res['email'] = @mail($mail, '=?UTF-8?B?' . base64_encode($titre) . '?=', $texte . "\n\nOuvrir l'administration : $lien\n\n— Le site de la famille Missaoui",
                "From: Famille Missaoui <noreply@missaoui-family.com>\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit");
        }
        if (ga_reglage('alerte_ntfy_on') !== '0') {
            $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 5, 'ignore_errors' => true,
                'header' => "Title: =?UTF-8?B?" . base64_encode($titre) . "?=\r\nClick: $lien\r\nTags: bellhop_bell\r\nContent-Type: text/plain; charset=utf-8", 'content' => $texte]]);
            $r = @file_get_contents('https://ntfy.sh/' . ga_canal_ntfy(), false, $ctx);
            $res['ntfy'] = $r !== false;
        }
    } catch (Throwable $e) { error_log('alerte : ' . $e->getMessage()); }
    return $res;
}
