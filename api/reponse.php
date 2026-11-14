<?php
/*
 * Répondre à « 🙋 Je demande plus de temps » depuis le téléphone du papa (14/11/2026).
 * La notification ntfy a trois boutons (+15 min, +30 min, Non) qui envoient ici un POST ; toucher la notification ouvre cette page.
 * Cette page n'est PAS derrière la porte du site (le téléphone n'est pas forcément un appareil de confiance) :
 * elle n'accepte qu'une demande précise avec son jeton secret à usage unique (32 caractères), valable 12 heures.
 *   GET  ?d=ID&t=JETON          -> la page avec les boutons
 *   POST ?d=ID&t=JETON&m=MIN    -> la réponse (m = 0 : non)
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php';   // seulement pour ga_donnees() et ga_ip() : pas de ga_garde_api() ici
header('X-Content-Type-Options: nosniff'); header('Cache-Control: no-store'); header('X-Robots-Tag: noindex');

function page(string $titre, string $corps, int $code = 200): void {
    http_response_code($code); header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>' . htmlspecialchars($titre) . '</title><style>'
       . 'body{margin:0;font-family:system-ui,sans-serif;background:#f3f5f9;color:#18202e;display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}'
       . '.b{background:#fff;border-radius:24px;padding:24px;max-width:420px;width:100%;box-shadow:0 8px 30px #0002;text-align:center}h1{font-size:24px;margin:.2em 0}p{font-size:17px;color:#5b667a}'
       . 'form{display:grid;gap:10px;margin-top:16px}button{font:inherit;font-size:19px;font-weight:700;min-height:56px;border:0;border-radius:16px;background:#0f766e;color:#fff}button.n{background:#e6eaf0;color:#18202e}.e{font-size:56px}'
       . '@media (prefers-color-scheme:dark){body{background:#10141c;color:#eef1f6}.b{background:#1a2130}p{color:#a3aec2}button.n{background:#2a3447;color:#eef1f6}}</style></head><body><div class="b">'
       . $corps . '</div></body></html>';
    exit;
}
$id = (int)($_GET['d'] ?? $_POST['d'] ?? 0); $jeton = (string)($_GET['t'] ?? $_POST['t'] ?? '');
if ($id < 1 || !preg_match('/^[0-9a-f]{32}$/', $jeton)) page('Demande inconnue', '<div class="e">🤔</div><h1>Demande inconnue</h1>', 404);
if (ga_trop_essais()) page('Trop d’essais', '<div class="e">⏳</div><h1>Trop d’essais</h1><p>Réessaie dans 15 minutes.</p>', 429);

$f = ga_donnees() . '/famille.sqlite';
if (!is_file($f)) page('Demande inconnue', '<div class="e">🤔</div><h1>Demande inconnue</h1>', 404);
$db = new PDO('sqlite:' . $f, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
$db->exec('PRAGMA busy_timeout=4000;');
$s = $db->prepare('SELECT * FROM demandes WHERE id = ?'); $s->execute([$id]); $d = $s->fetch();
if (!$d || !hash_equals((string)$d['jeton'], $jeton)) { ga_note_echec(); page('Demande inconnue', '<div class="e">🤔</div><h1>Demande inconnue</h1>', 404); }
$p = htmlspecialchars((string)$d['player']);
if ($d['statut'] !== 'attente') {
    $t = $d['statut'] === 'oui' ? "$p a déjà reçu {$d['min']} minutes de plus." : ($d['statut'] === 'non' ? "Tu as déjà répondu non à $p." : "Cette demande a été remplacée par une plus récente.");
    page('Déjà répondu', '<div class="e">✅</div><h1>Déjà répondu</h1><p>' . $t . '</p>');
}
if ((int)$d['ts'] < time() - 43200) page('Trop tard', '<div class="e">🌙</div><h1>Demande trop ancienne</h1><p>Cette demande date de plus de 12 heures.</p>');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $m = max(0, min(120, (int)($_GET['m'] ?? $_POST['m'] ?? 0))); $t = time();
    $u = $db->prepare("UPDATE demandes SET statut = ?, min = ?, maj = ? WHERE id = ? AND statut = 'attente'"); $u->execute([$m > 0 ? 'oui' : 'non', $m, $t, $id]);
    if ($u->rowCount() && $m > 0) $db->prepare('UPDATE ecran SET sec = MAX(0, sec - ?) WHERE player = ? AND jour = ?')->execute([$m * 60, $d['player'], $d['jour']]);
    page('C’est fait', $m > 0 ? "<div class=\"e\">🎉</div><h1>+$m minutes pour $p</h1><p>La tablette de $p se débloque dans quelques secondes.</p>"
                              : "<div class=\"e\">💛</div><h1>C’est noté</h1><p>Pas de temps en plus pour $p cette fois. La tablette lui affiche ta réponse.</p>");
}
$quand = (new DateTime('@' . (int)$d['ts']))->setTimezone(new DateTimeZone('Europe/Paris'))->format('H:i');
$h = '?d=' . $id . '&t=' . $jeton;
page("$p demande du temps", "<div class=\"e\">🙋</div><h1>$p demande plus de temps de jeu</h1><p>Demande envoyée à $quand.</p>"
    . "<form method=\"post\" action=\"$h&m=15\"><button>+15 minutes</button></form><form method=\"post\" action=\"$h&m=30\"><button>+30 minutes</button></form>"
    . "<form method=\"post\" action=\"$h&m=60\"><button>+1 heure</button></form><form method=\"post\" action=\"$h&m=0\"><button class=\"n\">Non, pas maintenant</button></form>");
