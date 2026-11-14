<?php
/*
 * Famille Missaoui — base de données des joueurs, records et progrès.
 *
 * La base (SQLite, un seul fichier) est rangée HORS du site public, dans le dossier
 * "famille-data" à côté de public_html : un redéploiement GitHub ne la touche pas.
 *
 * Public (les jeux) :
 *   GET  ?action=ping                                   -> état du serveur
 *   GET  ?action=highscores&game=serpentin&variant=V    -> meilleurs scores (un par joueur)
 *   GET  ?action=load&player=P&course=serpent3d         -> relit la collection d'un joueur
 *   GET  ?action=rewards&player=P                       -> cartes rares : jours d'apprentissage d'affilée, exploits mythiques
 *   POST action=visit    page player app screen ref     -> journal des visites (site.js, toutes les pages)
 *   POST action=score    player game variant score      -> enregistre une partie
 *   POST action=progress player course data(JSON)       -> enregistre les progrès d'un cours
 * Parents (mot de passe parent, le même que pour les voix de Nahki Tounsi) :
 *   GET  ?action=auth                                   -> le mot de passe existe-t-il ?
 *   POST action=setup  newpass                          -> crée le mot de passe (une seule fois)
 *   POST action=summary pass                            -> tout pour la page Progression
 *   POST action=visits  pass days                       -> journal des visites (IP, pays, ville, page, appareil), 60 jours au plus
 *   POST action=reset   pass player course [history] [scores] -> remet un cours à zéro, ou à l'état d'un instantané (history = id)
 * Remise à zéro : la table resets garde la date et l'état voulu ; chaque tablette l'applique à sa prochaine visite
 *   GET  ?action=resets&player=P&course=C               -> {ts, data} de la dernière remise à zéro (ts = 0 s'il n'y en a pas)
 *   (un envoi de progrès qui ne connaît pas la dernière remise à zéro est refusé : champ rst)
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();   // la porte du site : appareils de confiance seulement (quand la protection est activée)

const GAMES   = ['serpentin', 'serpent3d', 'ludo3d', 'grimpeglace', 'jasmin', 'medina'];
// Cours dont les progrès peuvent être relus par le jeu lui-même (collection de skins sur plusieurs appareils).
const READABLE = ['profil', 'atelier', 'serpent3d', 'salma-verbes', 'salma-geometrie', 'salma-symetrie', 'salma-monnaie', 'salma-meteo', 'ludo3d', 'grimpeglace', 'jasmin', 'amine-ecriture', 'amine-nombres', 'ecuries', 'medina', 'atelier-art', 'houma', 'defi', 'amine-lecture'];
const COURSES = ['profil', 'essil-deutsch', 'essil-latin', 'salma-english', 'salma-maths', 'salma-cheval', 'salma-verbes', 'salma-geometrie', 'salma-symetrie', 'salma-monnaie', 'salma-meteo', 'amine-halloween', 'amine-tounsi', 'amine-serpentin', 'amine-ecriture', 'amine-nombres', 'serpent3d', 'ludo3d', 'grimpeglace', 'jasmin', 'atelier', 'ecuries', 'medina', 'atelier-art', 'houma', 'defi', 'amine-lecture'];
// Jeu (classements) lié à un cours : une remise à zéro peut aussi effacer ses records.
const COURSE_GAME = ['serpent3d' => 'serpent3d', 'ludo3d' => 'ludo3d', 'grimpeglace' => 'grimpeglace', 'jasmin' => 'jasmin', 'medina' => 'medina', 'amine-serpentin' => 'serpentin'];
// Cours qui comptent comme « apprendre » (les jeux n'en font pas partie) : séries de jours et cartes secrètes.
const LEARNING = ['defi', 'amine-lecture', 'essil-deutsch', 'essil-latin', 'salma-english', 'salma-maths', 'salma-cheval', 'salma-verbes', 'salma-geometrie', 'salma-symetrie', 'salma-monnaie', 'salma-meteo', 'amine-halloween', 'amine-tounsi', 'amine-ecriture', 'amine-nombres'];
const MAX_DATA = 30000;
const BIG = ['atelier-art' => 400000, 'houma' => 200000];   // houma : avec les dessins sur les murs de Ma maison (13/11)   // les coloriages de l'Atelier (zones et couleurs, sans les vignettes) : plus gros, et sans historique
const MAX_WRITES = 240;        // écritures par adresse…
const WRITE_WINDOW = 600;      // …toutes les 10 minutes
const MAX_FAILS = 8;
const FAIL_WINDOW = 900;

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out(int $code, array $data): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function fail(int $code, string $msg): void { out($code, ['error' => $msg]); }

function base_dir(): string {
    $root = !empty($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') : dirname(__DIR__);
    return dirname($root);
}
function data_dir(): string {
    $d = base_dir() . '/famille-data';
    if (!(is_dir($d) || @mkdir($d, 0750, true)) || !is_writable($d)) fail(500, "Le serveur ne peut pas créer le dossier de la base.");
    return $d;
}
function auth_dir(): string { // partagé avec les voix de Nahki Tounsi
    $d = base_dir() . '/nahki-voix';
    if (!is_dir($d)) @mkdir($d, 0750, true);
    return $d;
}
function read_json(string $file): array {
    if (!is_file($file)) return [];
    $j = json_decode((string)file_get_contents($file), true);
    return is_array($j) ? $j : [];
}
function write_json(string $file, array $data): void {
    $tmp = $file . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    rename($tmp, $file);
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) fail(500, "SQLite n'est pas disponible sur ce serveur.");
    $pdo = new PDO('sqlite:' . data_dir() . '/famille.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=4000;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS players (name TEXT PRIMARY KEY COLLATE NOCASE, created TEXT NOT NULL, last_seen TEXT NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY, player TEXT NOT NULL COLLATE NOCASE, game TEXT NOT NULL, variant TEXT NOT NULL, score INTEGER NOT NULL, created TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS scores_board ON scores (game, variant, score DESC)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS progress (player TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL, data TEXT NOT NULL, updated TEXT NOT NULL, PRIMARY KEY (player, course))');
    $pdo->exec('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, player TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL, data TEXT NOT NULL, created TEXT NOT NULL)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS history_pc ON history (player, course, created)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS resets (player TEXT NOT NULL COLLATE NOCASE, course TEXT NOT NULL, ts INTEGER NOT NULL, data TEXT, PRIMARY KEY (player, course))');
    $pdo->exec('CREATE TABLE IF NOT EXISTS writes (ip TEXT NOT NULL, ts INTEGER NOT NULL)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY, ts INTEGER NOT NULL, ip TEXT NOT NULL, cc TEXT, page TEXT NOT NULL, player TEXT, ua TEXT, app INTEGER, screen TEXT, ref TEXT)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS visits_ts ON visits (ts)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS geo (ip TEXT PRIMARY KEY, cc TEXT, country TEXT, region TEXT, city TEXT, isp TEXT, ts INTEGER)');
    $pdo->exec('CREATE TABLE IF NOT EXISTS reglages (k TEXT PRIMARY KEY, v TEXT)');                                              // réglages des parents (temps d'écran…)
    $pdo->exec('CREATE TABLE IF NOT EXISTS ecran (player TEXT NOT NULL COLLATE NOCASE, jour TEXT NOT NULL, sec INTEGER NOT NULL, PRIMARY KEY (player, jour))');   // temps de jeu par jour
    $pdo->exec('CREATE TABLE IF NOT EXISTS demandes (id INTEGER PRIMARY KEY, player TEXT NOT NULL, jour TEXT NOT NULL, ts INTEGER NOT NULL, jeton TEXT NOT NULL, statut TEXT NOT NULL, min INTEGER NOT NULL DEFAULT 0, maj INTEGER NOT NULL)');   // « je demande plus de temps » (14/11)
    return $pdo;
}
function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }

function clean_player($p): string {
    $p = trim(preg_replace('/\s+/u', ' ', (string)$p));
    if ($p === '' || mb_strlen($p) > 20 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $p)) fail(400, 'Prénom invalide.');
    return mb_strtoupper(mb_substr($p, 0, 1)) . mb_substr($p, 1);
}
// Adresse du visiteur : derrière un proxy (CDN), la première adresse publique de X-Forwarded-For.
function client_ip(): string {
    // Chez Hostinger, REMOTE_ADDR est déjà l'adresse vraie du visiteur (le CDN la remplace) ; X-Forwarded-For, lui, peut être inventé (vu le 13/11)
    $r = (string)($_SERVER['REMOTE_ADDR'] ?? '');
    if (filter_var($r, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return $r;
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $h) {
        foreach (explode(',', (string)($_SERVER[$h] ?? '')) as $ip) {
            $ip = trim($ip);
            if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return $ip;
        }
    }
    return (string)($_SERVER['REMOTE_ADDR'] ?? '?');
}
const VISIT_DAYS = 60;   // le journal des visites est effacé au-delà
// Pays et ville des adresses IP, demandés à ip-api.com (100 adresses par appel) et gardés dans la table geo.
function resolve_geo(PDO $pdo, array $ips): void {
    $todo = [];
    foreach (array_unique($ips) as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            $pdo->prepare('INSERT OR REPLACE INTO geo (ip, cc, country, region, city, isp, ts) VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$ip, '', 'Réseau local', '', '', '', time()]);
            continue;
        }
        $todo[] = $ip;
    }
    foreach (array_chunk(array_slice($todo, 0, 300), 100) as $chunk) {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/json\r\n", 'content' => json_encode($chunk), 'timeout' => 5, 'ignore_errors' => true]]);
        $raw = @file_get_contents('http://ip-api.com/batch?fields=status,countryCode,country,regionName,city,isp,query&lang=fr', false, $ctx);
        $res = json_decode((string)$raw, true);
        if (!is_array($res)) break;
        foreach ($res as $g) {
            if (!is_array($g) || empty($g['query'])) continue;
            $ok = ($g['status'] ?? '') === 'success';
            $pdo->prepare('INSERT OR REPLACE INTO geo (ip, cc, country, region, city, isp, ts) VALUES (?, ?, ?, ?, ?, ?, ?)')
                ->execute([$g['query'], $ok ? ($g['countryCode'] ?? '') : '', $ok ? ($g['country'] ?? '') : 'Inconnu', $ok ? ($g['regionName'] ?? '') : '', $ok ? ($g['city'] ?? '') : '', $ok ? ($g['isp'] ?? '') : '', time()]);
        }
    }
}
function limit_writes(): void {
    $ip = hash('sha256', (string)($_SERVER['REMOTE_ADDR'] ?? '?'));
    $t = time();
    $pdo = db();
    $pdo->prepare('DELETE FROM writes WHERE ts < ?')->execute([$t - WRITE_WINDOW]);
    $st = $pdo->prepare('SELECT COUNT(*) FROM writes WHERE ip = ?'); $st->execute([$ip]);
    if ((int)$st->fetchColumn() >= MAX_WRITES) fail(429, 'Trop de messages, réessaie dans quelques minutes.');
    $pdo->prepare('INSERT INTO writes (ip, ts) VALUES (?, ?)')->execute([$ip, $t]);
}
function touch_player(string $p): void {
    $n = now();
    db()->prepare('INSERT INTO players (name, created, last_seen) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET last_seen = excluded.last_seen')->execute([$p, $n, $n]);
}
function check_pass(): void {
    $dir = auth_dir();
    $auth = read_json($dir . '/auth.json');
    if (empty($auth['hash'])) fail(409, 'setup');
    $failsFile = $dir . '/essais.json';
    $t = time();
    $fails = array_values(array_filter(read_json($failsFile), fn($x) => is_int($x) && $x > $t - FAIL_WINDOW));
    if (count($fails) >= MAX_FAILS) fail(429, "Trop d'essais. Réessaie dans 15 minutes.");
    if (!password_verify((string)($_POST['pass'] ?? ''), (string)$auth['hash'])) {
        $fails[] = $t; write_json($failsFile, $fails); usleep(500000);
        fail(403, 'Mot de passe incorrect.');
    }
}


/* ---------- Temps d'écran (13/11) ----------
   Réglages des parents dans reglages.ecran : {Essil:{on, semaine, weekend, nuit, matin, nuit_we, matin_we}, …} (minutes ; heures « HH:MM »).
   Week-end (14/11) : nuit_we vaut le vendredi et le samedi soir (pas d'école le lendemain), matin_we le samedi et le dimanche matin ;
   vides = les mêmes heures qu'en semaine. Le serveur envoie à la tablette les heures du moment (nuit, matin), la tablette ne change pas.
   Seuls les jeux comptent (famille.js envoie le temps passé sur une page de jeu) ; les cours restent libres.
   Un défi du jour réussi (cours « defi ») donne 10 minutes de plus ce jour-là. */
const ENFANTS = ['Essil', 'Salma', 'Amine'];
const ECRAN_DEFAUT = ['on' => true, 'semaine' => 45, 'weekend' => 90, 'nuit' => '20:30', 'matin' => '07:00'];
const DEFI_BONUS = 600;
function reglage_get(string $k, $defaut) { $s = db()->prepare('SELECT v FROM reglages WHERE k = ?'); $s->execute([$k]); $v = $s->fetchColumn(); if ($v === false) return $defaut; $j = json_decode((string)$v, true); return $j === null ? $defaut : $j; }
function reglage_set(string $k, $v): void { db()->prepare('INSERT INTO reglages (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v')->execute([$k, json_encode($v, JSON_UNESCAPED_UNICODE)]); }
function jour_paris(): string { return (new DateTime('now', new DateTimeZone('Europe/Paris')))->format('Y-m-d'); }
function ecran_regles(): array { $r = reglage_get('ecran', []); $o = []; foreach (ENFANTS as $e) $o[$e] = array_merge(ECRAN_DEFAUT, is_array($r[$e] ?? null) ? $r[$e] : []); return $o; }
function ecran_etat(string $p): array {
    $p = mb_strtoupper(mb_substr($p, 0, 1)) . mb_substr($p, 1);
    if (!in_array($p, ENFANTS, true)) return ['libre' => true];
    $r = ecran_regles()[$p]; $j = jour_paris();
    $s = db()->prepare('SELECT sec FROM ecran WHERE player = ? AND jour = ?'); $s->execute([$p, $j]); $u = (int)$s->fetchColumn();
    $d = db()->prepare("SELECT data FROM progress WHERE player = ? AND course = 'defi'"); $d->execute([$p]); $dd = json_decode((string)$d->fetchColumn(), true);
    $bonus = !empty($dd['jours'][$j]['ok']) ? DEFI_BONUS : 0;
    $n = (int)(new DateTime('now', new DateTimeZone('Europe/Paris')))->format('N'); $we = in_array($n, [6, 7], true);
    $nuit = in_array($n, [5, 6], true) && !empty($r['nuit_we']) ? $r['nuit_we'] : $r['nuit'];      // ce soir : demain, pas d'école ?
    $matin = $we && !empty($r['matin_we']) ? $r['matin_we'] : $r['matin'];                          // ce matin : samedi ou dimanche ?
    return ['libre' => empty($r['on']), 'jour' => $j, 'limite' => (int)($we ? $r['weekend'] : $r['semaine']) * 60 + $bonus, 'bonus' => $bonus, 'utilise' => $u, 'nuit' => $nuit, 'matin' => $matin, 'weekend' => $we, 'demande' => demande_du_jour($p), 'now' => time()];
}

/* ---------- « Je demande plus de temps » (14/11, demandé par le papa) ----------
   Sur l'écran de pause, l'enfant touche « 🙋 Demander plus de temps » : le papa reçoit une notification ntfy (même canal secret
   que les alertes de la porte) avec trois boutons (+15 min, +30 min, Non). Les boutons appellent api/reponse.php avec un jeton
   à usage unique (le téléphone n'est pas forcément un appareil de confiance). On peut aussi répondre dans Progression › Réglages.
   La tablette de l'enfant relit l'état toutes les 5 s : « oui » lève la pause pendant les minutes données (même la nuit). */
const DEMANDES_PAR_JOUR = 6;
function demande_du_jour(string $p): ?array {
    $s = db()->prepare('SELECT id, statut, min, ts, maj FROM demandes WHERE player = ? AND jour = ? ORDER BY id DESC LIMIT 1'); $s->execute([$p, jour_paris()]);
    $d = $s->fetch(PDO::FETCH_ASSOC); if (!$d) return null;
    return ['id' => (int)$d['id'], 'statut' => $d['statut'], 'min' => (int)$d['min'], 'ts' => (int)$d['ts'], 'maj' => (int)$d['maj']];
}
function hmin(int $s): string { $m = (int)round($s / 60); return $m >= 60 ? intdiv($m, 60) . ' h ' . str_pad((string)($m % 60), 2, '0', STR_PAD_LEFT) : $m . ' min'; }
function demande_notifie(string $p, int $id, string $jeton, array $e): bool {
    $base = 'https://www.missaoui-family.com/api/reponse.php?d=' . $id . '&t=' . $jeton;
    $pourquoi = $e['utilise'] >= $e['limite'] ? 'a fini son temps de jeu (' . hmin($e['utilise']) . ' sur ' . hmin($e['limite']) . ')' : 'est en pause de nuit (depuis ' . $e['nuit'] . ')';
    $actions = [['action' => 'http', 'label' => '+15 min', 'url' => $base . '&m=15', 'method' => 'POST', 'clear' => true],
                ['action' => 'http', 'label' => '+30 min', 'url' => $base . '&m=30', 'method' => 'POST', 'clear' => true],
                ['action' => 'http', 'label' => 'Non', 'url' => $base . '&m=0', 'method' => 'POST', 'clear' => true]];
    $msg = ['topic' => ga_canal_ntfy(), 'title' => "🙋 $p demande plus de temps de jeu", 'message' => "$p $pourquoi. Touche +15 min, +30 min ou Non (ou ouvre la notification).",
            'tags' => ['raising_hand'], 'priority' => 4, 'click' => $base, 'actions' => $actions];
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 5, 'ignore_errors' => true, 'header' => "Content-Type: application/json",
        'content' => json_encode($msg, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]]);
    $r = @file_get_contents('https://ntfy.sh/', false, $ctx);
    $ok = $r !== false && isset($http_response_header[0]) && strpos($http_response_header[0], ' 200') !== false;
    return $ok;
}
/** donne la réponse d'un parent à une demande (Progression ou bouton de la notification) */
function demande_repond(int $id, int $m): array {
    $s = db()->prepare('SELECT * FROM demandes WHERE id = ?'); $s->execute([$id]); $d = $s->fetch(PDO::FETCH_ASSOC);
    if (!$d) return ['ok' => false, 'msg' => 'Cette demande n’existe plus.'];
    if ($d['statut'] !== 'attente') return ['ok' => false, 'msg' => 'Déjà répondu : ' . ($d['statut'] === 'oui' ? '+' . $d['min'] . ' min.' : 'non.'), 'player' => $d['player']];
    $m = max(0, min(120, $m)); $t = time();
    db()->prepare('UPDATE demandes SET statut = ?, min = ?, maj = ? WHERE id = ? AND statut = \'attente\'')->execute([$m > 0 ? 'oui' : 'non', $m, $t, $id]);
    if ($m > 0) db()->prepare('UPDATE ecran SET sec = MAX(0, sec - ?) WHERE player = ? AND jour = ?')->execute([$m * 60, $d['player'], $d['jour']]);
    return ['ok' => true, 'msg' => $m > 0 ? $d['player'] . ' a ' . $m . ' minutes de jeu en plus.' : 'C’est noté : pas de temps en plus pour ' . $d['player'] . '.', 'player' => $d['player']];
}

$action = (string)($_REQUEST['action'] ?? '');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET' && $action === 'ping') {
        db();
        out(200, ['ok' => true, 'sqlite' => true]);
    }

    if ($method === 'GET' && $action === 'auth') {
        $auth = read_json(auth_dir() . '/auth.json');
        out(200, ['setup' => empty($auth['hash'])]);
    }

    // La tête choisie par chaque invité (mascotte Nour, Yasmine ou Farès), pour l'afficher dans les classements
    if ($method === 'GET' && $action === 'heads') {
        $heads = [];
        foreach (db()->query("SELECT player, data FROM progress WHERE course = 'profil'") as $r) {
            $d = json_decode((string)$r['data'], true);
            if (is_array($d) && in_array($d['tete'] ?? '', ['nour', 'yasmine', 'fares'], true)) $heads[$r['player']] = $d['tete'];
        }
        out(200, ['heads' => $heads]);
    }

    if ($method === 'GET' && $action === 'highscores') {
        $game = (string)($_GET['game'] ?? '');
        $variant = (string)($_GET['variant'] ?? '');
        if (!in_array($game, GAMES, true) || !preg_match('/^[a-z0-9\-]{1,40}$/', $variant)) fail(400, 'Jeu inconnu.');
        $lim = max(1, min(20, (int)($_GET['limit'] ?? 10)));
        $st = db()->prepare('SELECT player, MAX(score) AS score, COUNT(*) AS games FROM scores WHERE game = ? AND variant = ? GROUP BY player ORDER BY score DESC, MIN(created) ASC LIMIT ' . $lim);
        $st->execute([$game, $variant]);
        out(200, ['scores' => array_map(fn($r) => ['player' => $r['player'], 'score' => (int)$r['score'], 'games' => (int)$r['games']], $st->fetchAll(PDO::FETCH_ASSOC))]);
    }

    if ($method === 'GET' && $action === 'load') {
        $p = clean_player($_GET['player'] ?? '');
        $course = (string)($_GET['course'] ?? '');
        if (!in_array($course, READABLE, true)) fail(400, 'Cours inconnu.');
        $st = db()->prepare('SELECT data, updated FROM progress WHERE player = ? AND course = ?'); $st->execute([$p, $course]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        out(200, ['data' => $r ? json_decode($r['data'], true) : null, 'updated' => $r ? $r['updated'] : null]);
    }

    if ($method === 'GET' && $action === 'resets') {
        $p = clean_player($_GET['player'] ?? '');
        $course = (string)($_GET['course'] ?? '');
        if (!in_array($course, COURSES, true)) fail(400, 'Cours inconnu.');
        $st = db()->prepare('SELECT ts, data FROM resets WHERE player = ? AND course = ?'); $st->execute([$p, $course]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        out(200, ['ts' => $r ? (int)$r['ts'] : 0, 'data' => $r && $r['data'] !== null ? json_decode((string)$r['data'], true) : null]);
    }

    if ($method === 'GET' && $action === 'rewards') {
        $p = clean_player($_GET['player'] ?? '');
        $pdo = db();
        $tz = new DateTimeZone('Europe/Paris');
        $in = implode(',', array_fill(0, count(LEARNING), '?'));
        $since = gmdate('Y-m-d\TH:i:s\Z', time() - 120 * 86400);
        $daysOf = function (string $who) use ($pdo, $tz, $in, $since): array {
            $st = $pdo->prepare("SELECT created FROM history WHERE player = ? AND course IN ($in) AND created >= ?");
            $st->execute(array_merge([$who], LEARNING, [$since]));
            $d = [];
            foreach ($st->fetchAll(PDO::FETCH_COLUMN) as $c) { $d[(new DateTime((string)$c))->setTimezone($tz)->format('Y-m-d')] = true; }
            $d = array_keys($d); sort($d); return $d;
        };
        // séries de jours d'affilée : une carte secrète par tranche de 5 jours
        $days = $daysOf($p); $secrets = 0; $run = 0; $prev = null; $cur = 0;
        foreach ($days as $d) {
            $t = (new DateTime($d, $tz))->getTimestamp();
            $run = ($prev !== null && abs($t - $prev - 86400) < 7200) ? $run + 1 : 1;
            if ($run % 5 === 0) $secrets++;
            $prev = $t;
        }
        $today = (new DateTime('now', $tz))->format('Y-m-d'); $yest = (new DateTime('yesterday', $tz))->format('Y-m-d');
        if ($days && in_array(end($days), [$today, $yest], true)) $cur = $run;
        // exploits mythiques
        $prog = function (string $who, string $course) use ($pdo): array {
            $st = $pdo->prepare('SELECT data FROM progress WHERE player = ? AND course = ?'); $st->execute([$who, $course]);
            $d = json_decode((string)$st->fetchColumn(), true); return is_array($d) ? ($d[$course] ?? []) : [];
        };
        $e = $prog('Amine', 'amine-ecriture'); $alpha = 0;
        foreach (($e['stars'] ?? []) as $k => $v) if (preg_match('/^c:[a-z]$/', (string)$k) && $v >= 2) $alpha++;
        $vb = $prog('Salma', 'salma-verbes'); $verbes = count(array_filter($vb['stars'] ?? [], fn($v) => $v >= 3));
        $units = function (array $d): int { $u = []; foreach (($d['best'] ?? []) as $k => $v) { if ($v && substr((string)$k, -4) !== ':lex') $u[explode(':', (string)$k)[0]] = true; } return count($u); };
        $poly = min(14, $units($prog('Essil', 'essil-deutsch'))) + min(10, $units($prog('Essil', 'essil-latin')));
        // Hydre : les trois enfants apprennent la même semaine
        $weeks = []; $now = (new DateTime('now', $tz))->format('o-W'); $thisWeek = 0;
        foreach (['Essil', 'Salma', 'Amine'] as $k) {
            $w = array_unique(array_map(fn($d) => (new DateTime($d, $tz))->format('o-W'), $daysOf($k)));
            $weeks[] = $w; if (in_array($now, $w, true)) $thisWeek++;
        }
        $together = count(array_intersect(...$weeks)) > 0;
        out(200, ['days' => count($days), 'streak' => $cur, 'secrets' => min(4, $secrets),
            'myth' => ['alphabet' => ['v' => min(26, $alpha), 'goal' => 26], 'verbes' => ['v' => min(8, $verbes), 'goal' => 8],
                'polyglotte' => ['v' => $poly, 'goal' => 24], 'hydre' => ['v' => $thisWeek, 'goal' => 3, 'done' => $together]]]);
    }

    // temps d'écran : les règles du jour pour un enfant (lu par famille.js sur les pages de jeu)
    if ($method === 'GET' && $action === 'ecran') {
        out(200, ecran_etat((string)($_GET['player'] ?? '')));
    }
    // le tableau de bord de l'accueil : le temps de jeu des trois enfants
    if ($method === 'GET' && $action === 'ecran_tous') {
        out(200, ['enfants' => array_combine(ENFANTS, array_map('ecran_etat', ENFANTS)), 'now' => time()]);
    }
    if ($method !== 'POST') fail(405, 'Action inconnue.');

    // Mode explorateur (14/11) : papa, maman ou un invité essaient les cours des enfants (profil choisi sur l'accueil).
    // explorateur.js pose le cookie famille_explo : rien de ce qui concerne Essil, Salma ou Amine n'est enregistré.
    if (!empty($_COOKIE['famille_explo']) && in_array($action, ['score', 'progress', 'ecran', 'demande'], true)) {
        $q = mb_convert_case(trim((string)($_POST['player'] ?? '')), MB_CASE_TITLE, 'UTF-8');
        if (in_array($q, ENFANTS, true)) out(200, ['ok' => true, 'explorateur' => true, 'libre' => true, 'personalBest' => false, 'best' => 0, 'rank' => 0]);
    }
    if ($action === 'visit') {
        $pdo = db();
        $ip = client_ip(); $t = time();
        $page = (string)($_POST['page'] ?? '');
        if (!preg_match('~^/[\w\-./%]{0,119}$~u', $page)) out(200, ['ok' => false]);
        $st = $pdo->prepare('SELECT COUNT(*) FROM visits WHERE ip = ? AND ts > ?'); $st->execute([$ip, $t - 600]);
        if ((int)$st->fetchColumn() > 150) out(200, ['ok' => false]);           // anti-abus
        $st = $pdo->prepare('SELECT COUNT(*) FROM visits WHERE ip = ? AND page = ? AND ts > ?'); $st->execute([$ip, $page, $t - 120]);
        if ((int)$st->fetchColumn() > 0) out(200, ['ok' => true]);              // déjà noté il y a moins de 2 minutes
        $pl = trim((string)($_POST['player'] ?? ''));
        $pl = ($pl !== '' && mb_strlen($pl) <= 20 && preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $pl)) ? $pl : '';
        $cc = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', (string)($_SERVER['HTTP_CF_IPCOUNTRY'] ?? $_SERVER['HTTP_X_COUNTRY_CODE'] ?? '')), 0, 2));
        $screen = preg_match('/^\d{2,5}x\d{2,5}$/', (string)($_POST['screen'] ?? '')) ? (string)$_POST['screen'] : '';
        $ref = preg_replace('/[^\w\-.:]/', '', substr((string)($_POST['ref'] ?? ''), 0, 80));
        $pdo->prepare('INSERT INTO visits (ts, ip, cc, page, player, ua, app, screen, ref) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$t, $ip, $cc, $page, $pl, mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300), ($_POST['app'] ?? '') === '1' ? 1 : 0, $screen, $ref]);
        if (mt_rand(1, 40) === 1) {
            $pdo->prepare('DELETE FROM visits WHERE ts < ?')->execute([$t - VISIT_DAYS * 86400]);
            $pdo->exec('DELETE FROM geo WHERE ip NOT IN (SELECT DISTINCT ip FROM visits)');
        }
        out(200, ['ok' => true]);
    }

    if ($action === 'visits') {
        check_pass();
        $pdo = db();
        $days = max(1, min(VISIT_DAYS, (int)($_POST['days'] ?? 7)));
        $pdo->prepare('DELETE FROM visits WHERE ts < ?')->execute([time() - VISIT_DAYS * 86400]);
        $st = $pdo->prepare('SELECT DISTINCT v.ip FROM visits v LEFT JOIN geo g ON g.ip = v.ip WHERE v.ts >= ? AND g.ip IS NULL'); $st->execute([time() - $days * 86400]);
        $missing = $st->fetchAll(PDO::FETCH_COLUMN);
        if ($missing) resolve_geo($pdo, $missing);
        $st = $pdo->prepare('SELECT v.ts, v.ip, v.page, v.player, v.ua, v.app, v.screen, v.ref, COALESCE(NULLIF(g.cc, \'\'), v.cc) AS cc, g.country, g.region, g.city, g.isp FROM visits v LEFT JOIN geo g ON g.ip = v.ip WHERE v.ts >= ? ORDER BY v.ts DESC LIMIT 3000');
        $st->execute([time() - $days * 86400]);
        $rows = $st->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) { $r['ts'] = (int)$r['ts']; $r['app'] = (int)$r['app']; } unset($r);
        out(200, ['days' => $days, 'keep' => VISIT_DAYS, 'visits' => $rows]);
    }

    if ($action === 'score') {
        limit_writes();
        $p = clean_player($_POST['player'] ?? '');
        $game = (string)($_POST['game'] ?? '');
        $variant = (string)($_POST['variant'] ?? '');
        $score = (int)($_POST['score'] ?? -1);
        if (!in_array($game, GAMES, true) || !preg_match('/^[a-z0-9\-]{1,40}$/', $variant)) fail(400, 'Jeu inconnu.');
        if ($score < 0 || $score > (in_array($game, ['grimpeglace', 'jasmin', 'medina'], true) ? 999999 : 5000)) fail(400, 'Score invalide.');
        touch_player($p);
        $st = db()->prepare('SELECT MAX(score) FROM scores WHERE game = ? AND variant = ? AND player = ?'); $st->execute([$game, $variant, $p]);
        $best = (int)$st->fetchColumn();
        db()->prepare('INSERT INTO scores (player, game, variant, score, created) VALUES (?, ?, ?, ?, ?)')->execute([$p, $game, $variant, $score, now()]);
        $st = db()->prepare('SELECT COUNT(*) FROM (SELECT player, MAX(score) s FROM scores WHERE game = ? AND variant = ? GROUP BY player) WHERE s > ?');
        $st->execute([$game, $variant, max($best, $score)]);
        out(200, ['ok' => true, 'personalBest' => $score > $best, 'best' => max($best, $score), 'rank' => (int)$st->fetchColumn() + 1]);
    }

    if ($action === 'progress') {
        limit_writes();
        $p = clean_player($_POST['player'] ?? '');
        $course = (string)($_POST['course'] ?? '');
        if (!in_array($course, COURSES, true)) fail(400, 'Cours inconnu.');
        $raw = (string)($_POST['data'] ?? '');
        if ($raw === '' || strlen($raw) > (BIG[$course] ?? MAX_DATA) || !is_array(json_decode($raw, true))) fail(400, 'Progrès invalides.');
        $data = json_encode(json_decode($raw, true), JSON_UNESCAPED_UNICODE);
        $pdo = db();
        // Un parent a remis ce cours à zéro : la tablette doit d'abord l'appliquer (famille.js), sinon elle renverrait l'ancien état.
        $st = $pdo->prepare('SELECT ts, data FROM resets WHERE player = ? AND course = ?'); $st->execute([$p, $course]);
        $rs = $st->fetch(PDO::FETCH_ASSOC);
        if ($rs && (int)$rs['ts'] > (int)($_POST['rst'] ?? 0)) out(200, ['ok' => false, 'reset' => ['ts' => (int)$rs['ts'], 'data' => $rs['data'] !== null ? json_decode((string)$rs['data'], true) : null]]);
        touch_player($p);
        $st = $pdo->prepare('SELECT data FROM progress WHERE player = ? AND course = ?'); $st->execute([$p, $course]);
        $prev = $st->fetchColumn();
        $n = now();
        if ($prev !== $data) {
            $pdo->prepare('INSERT INTO progress (player, course, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(player, course) DO UPDATE SET data = excluded.data, updated = excluded.updated')->execute([$p, $course, $data, $n]);
            if (isset(BIG[$course])) out(200, ['ok' => true, 'changed' => true]);
            // Un instantané par heure au plus : sert à voir la progression dans le temps.
            $st = $pdo->prepare('SELECT created FROM history WHERE player = ? AND course = ? ORDER BY created DESC LIMIT 1'); $st->execute([$p, $course]);
            $last = $st->fetchColumn();
            if (!$last || strtotime((string)$last) < time() - 3600) {
                $pdo->prepare('INSERT INTO history (player, course, data, created) VALUES (?, ?, ?, ?)')->execute([$p, $course, $data, $n]);
            } else {
                $pdo->prepare('UPDATE history SET data = ? WHERE player = ? AND course = ? AND created = ?')->execute([$data, $p, $course, $last]);
            }
        }
        out(200, ['ok' => true, 'changed' => $prev !== $data]);
    }

    if ($action === 'setup') {
        $dir = auth_dir();
        $auth = read_json($dir . '/auth.json');
        if (!empty($auth['hash'])) fail(409, 'Le mot de passe existe déjà.');
        $pw = (string)($_POST['newpass'] ?? '');
        if (mb_strlen($pw) < 6) fail(400, 'Le mot de passe doit faire au moins 6 caractères.');
        write_json($dir . '/auth.json', ['hash' => password_hash($pw, PASSWORD_DEFAULT), 'cree' => date('c')]);
        out(200, ['ok' => true]);
    }

    if ($action === 'reset') {
        check_pass();
        $p = clean_player($_POST['player'] ?? '');
        $course = (string)($_POST['course'] ?? '');
        if (!in_array($course, COURSES, true) || $course === 'profil') fail(400, 'Cours inconnu.');
        $pdo = db();
        $hid = (int)($_POST['history'] ?? 0);
        $data = null;
        $pdo->beginTransaction();
        if ($hid > 0) {   // revenir à un instantané : il devient l'état actuel, ce qui a été fait après est oublié
            $st = $pdo->prepare('SELECT data, created FROM history WHERE id = ? AND player = ? AND course = ?'); $st->execute([$hid, $p, $course]);
            $h = $st->fetch(PDO::FETCH_ASSOC);
            if (!$h) { $pdo->rollBack(); fail(404, 'Instantané introuvable.'); }
            $data = (string)$h['data'];
            $pdo->prepare('DELETE FROM history WHERE player = ? AND course = ? AND id > ?')->execute([$p, $course, $hid]);
            $pdo->prepare('INSERT INTO progress (player, course, data, updated) VALUES (?, ?, ?, ?) ON CONFLICT(player, course) DO UPDATE SET data = excluded.data, updated = excluded.updated')->execute([$p, $course, $data, (string)$h['created']]);
        } else {          // remise à zéro complète
            $pdo->prepare('DELETE FROM history WHERE player = ? AND course = ?')->execute([$p, $course]);
            $pdo->prepare('DELETE FROM progress WHERE player = ? AND course = ?')->execute([$p, $course]);
        }
        $scores = 0;
        if (($_POST['scores'] ?? '') === '1' && isset(COURSE_GAME[$course])) {
            $st = $pdo->prepare('DELETE FROM scores WHERE player = ? AND game = ?'); $st->execute([$p, COURSE_GAME[$course]]); $scores = $st->rowCount();
        }
        $pdo->prepare('INSERT INTO resets (player, course, ts, data) VALUES (?, ?, ?, ?) ON CONFLICT(player, course) DO UPDATE SET ts = excluded.ts, data = excluded.data')->execute([$p, $course, time(), $data]);
        $pdo->commit();
        out(200, ['ok' => true, 'scores' => $scores]);
    }

    // temps d'écran : une page de jeu ajoute le temps passé (60 s au plus par envoi)
    if ($method === 'POST' && $action === 'ecran') {
        $p = clean_player($_POST['player'] ?? ''); $sec = max(0, min(60, (int)($_POST['sec'] ?? 0)));
        if (in_array($p, ENFANTS, true) && $sec > 0) db()->prepare('INSERT INTO ecran (player, jour, sec) VALUES (?, ?, ?) ON CONFLICT(player, jour) DO UPDATE SET sec = sec + excluded.sec')->execute([$p, jour_paris(), $sec]);
        out(200, ecran_etat($p));
    }
    // réglages des parents (temps d'écran) : écrire
    if ($action === 'reglages') {
        check_pass();
        $in = json_decode((string)($_POST['data'] ?? ''), true); if (!is_array($in)) fail(400, 'Réglages illisibles.');
        $e = []; foreach (ENFANTS as $k) { $x = $in['ecran'][$k] ?? []; $hh = fn($v, $d) => preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string)$v) ? (string)$v : $d;
            $e[$k] = ['on' => !empty($x['on']), 'semaine' => max(5, min(600, (int)($x['semaine'] ?? 45))), 'weekend' => max(5, min(600, (int)($x['weekend'] ?? 90))), 'nuit' => $hh($x['nuit'] ?? '', '20:30'), 'matin' => $hh($x['matin'] ?? '', '07:00')];
            $e[$k]['nuit_we'] = $hh($x['nuit_we'] ?? '', $e[$k]['nuit']); $e[$k]['matin_we'] = $hh($x['matin_we'] ?? '', $e[$k]['matin']); }
        reglage_set('ecran', $e);
        if (isset($in['ecran_plus']) && is_array($in['ecran_plus'])) {   // « 15 minutes de plus aujourd'hui » : on retire du temps déjà joué
            foreach ($in['ecran_plus'] as $k => $m) if (in_array($k, ENFANTS, true)) db()->prepare('UPDATE ecran SET sec = MAX(0, sec - ?) WHERE player = ? AND jour = ?')->execute([max(0, min(240, (int)$m)) * 60, $k, jour_paris()]);
        }
        out(200, ['ok' => true, 'ecran' => ecran_regles(), 'aujourdhui' => array_combine(ENFANTS, array_map('ecran_etat', ENFANTS))]);
    }
    // « Un parent débloque » depuis l'écran de pause : du temps de jeu en plus aujourd'hui (mot de passe parent)
    if ($action === 'ecran_plus') {
        check_pass();
        $p = clean_player($_POST['player'] ?? ''); $m = max(5, min(120, (int)($_POST['min'] ?? 15)));
        if (in_array($p, ENFANTS, true)) db()->prepare('UPDATE ecran SET sec = MAX(0, sec - ?) WHERE player = ? AND jour = ?')->execute([$m * 60, $p, jour_paris()]);
        $e = ecran_etat($p); $e['nuit_levee'] = true; out(200, $e);
    }
    // « 🙋 Demander plus de temps » (écran de pause) : une notification au papa
    if ($action === 'demande') {
        $p = clean_player($_POST['player'] ?? ''); if (!in_array($p, ENFANTS, true)) fail(400, 'Joueur inconnu.');
        $e = ecran_etat($p); $d = $e['demande']; $t = time();
        if ($d && $d['statut'] === 'attente' && $d['ts'] > $t - 7200) out(200, $e);                         // déjà demandé : on attend
        if ($d && $d['statut'] === 'non' && $d['maj'] > $t - 1800) fail(429, 'On t’a déjà répondu non. Tu pourras redemander dans un moment.');
        $s = db()->prepare('SELECT COUNT(*) FROM demandes WHERE player = ? AND jour = ?'); $s->execute([$p, jour_paris()]);
        if ((int)$s->fetchColumn() >= DEMANDES_PAR_JOUR) fail(429, 'Tu as déjà beaucoup demandé aujourd’hui. Demande à papa ou maman de vive voix !');
        db()->prepare("UPDATE demandes SET statut = 'oubliee', maj = ? WHERE player = ? AND statut = 'attente'")->execute([$t, $p]);
        $jeton = bin2hex(random_bytes(16));
        db()->prepare("INSERT INTO demandes (player, jour, ts, jeton, statut, maj) VALUES (?, ?, ?, ?, 'attente', ?)")->execute([$p, jour_paris(), $t, $jeton, $t]);
        $id = (int)db()->lastInsertId();
        $e = ecran_etat($p); $e['envoye'] = demande_notifie($p, $id, $jeton, $e);
        out(200, $e);
    }
    // répondre à une demande depuis Progression (mot de passe parent)
    if ($action === 'demande_reponse') {
        check_pass(); $r = demande_repond((int)($_POST['id'] ?? 0), (int)($_POST['min'] ?? 0));
        out(200, $r + ['aujourdhui' => array_combine(ENFANTS, array_map('ecran_etat', ENFANTS))]);
    }
    // joueurs : fusionner un faux prénom dans le bon (« Aniss » → « Anis »), ou le supprimer
    if ($action === 'joueur_fusion' || $action === 'joueur_supprime') {
        check_pass();
        $de = clean_player($_POST['player'] ?? ''); $pdo = db(); $pdo->beginTransaction();
        if ($action === 'joueur_fusion') {
            $vers = clean_player($_POST['vers'] ?? ''); if (mb_strtolower($vers) === mb_strtolower($de)) fail(400, 'Choisis un autre joueur.');
            $n = now(); $pdo->prepare('INSERT INTO players (name, created, last_seen) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING')->execute([$vers, $n, $n]);
            $pdo->prepare('UPDATE scores SET player = ? WHERE player = ?')->execute([$vers, $de]);
            $pdo->prepare('UPDATE history SET player = ? WHERE player = ?')->execute([$vers, $de]);
            $pdo->prepare('UPDATE OR IGNORE progress SET player = ? WHERE player = ?')->execute([$vers, $de]);   // un cours déjà commencé par le bon prénom garde ses progrès
            $pdo->prepare('UPDATE visits SET player = ? WHERE player = ?')->execute([$vers, $de]);
        } else {
            $pdo->prepare('DELETE FROM scores WHERE player = ?')->execute([$de]);
            $pdo->prepare('DELETE FROM history WHERE player = ?')->execute([$de]);
            $pdo->prepare('UPDATE visits SET player = NULL WHERE player = ?')->execute([$de]);
        }
        foreach (['progress', 'resets', 'ecran', 'players'] as $t) $pdo->prepare("DELETE FROM $t WHERE " . ($t === 'players' ? 'name' : 'player') . ' = ?')->execute([$de]);
        $pdo->commit();
        out(200, ['ok' => true]);
    }

    if ($action === 'summary') {
        check_pass();
        $pdo = db();
        $players = $pdo->query('SELECT name, created, last_seen FROM players ORDER BY last_seen DESC')->fetchAll(PDO::FETCH_ASSOC);
        $progress = $pdo->query("SELECT player, course, data, updated FROM progress WHERE course <> 'atelier-art'")->fetchAll(PDO::FETCH_ASSOC);
        $since = gmdate('Y-m-d\TH:i:s\Z', time() - 35 * 86400);
        $since = gmdate('Y-m-d\TH:i:s\Z', time() - 120 * 86400);
        $st = $pdo->prepare('SELECT id, player, course, data, created FROM history WHERE created >= ? ORDER BY created ASC'); $st->execute([$since]);
        $history = $st->fetchAll(PDO::FETCH_ASSOC);
        $best = $pdo->query('SELECT player, game, variant, MAX(score) AS best, COUNT(*) AS games, MAX(created) AS last FROM scores GROUP BY player, game, variant')->fetchAll(PDO::FETCH_ASSOC);
        $recent = $pdo->query('SELECT player, game, variant, score, created FROM scores ORDER BY created DESC LIMIT 30')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($progress as &$r) $r['data'] = json_decode($r['data'], true); unset($r);
        foreach ($history as &$r) { $r['data'] = json_decode($r['data'], true); $r['id'] = (int)$r['id']; } unset($r);
        $resets = $pdo->query('SELECT player, course, ts FROM resets')->fetchAll(PDO::FETCH_ASSOC);
        out(200, ['players' => $players, 'progress' => $progress, 'history' => $history, 'best' => $best, 'recent' => $recent, 'resets' => $resets, 'ecran' => ecran_regles(), 'aujourdhui' => array_combine(ENFANTS, array_map('ecran_etat', ENFANTS))]);
    }

    fail(400, 'Action inconnue.');
} catch (Throwable $e) {
    fail(500, 'Erreur du serveur.');
}
