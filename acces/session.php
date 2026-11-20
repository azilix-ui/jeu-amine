<?php
/*
 * Famille Missaoui — les sessions par personne (20/11/2026, demandées par le papa).
 * Inclus par garde.php : toutes les fonctions commencent par ga_qui.
 *
 * Avant : on touchait un avatar sur « Qui es-tu ? » et le site le croyait (le prénom vivait dans l'onglet).
 * Maintenant (quand l'interrupteur « Sessions » de l'administration est en marche) :
 *   - chaque personne a une session tenue par le serveur : cookie mf_qui (jeton aléatoire, HttpOnly : aucun script ne le lit ;
 *     la base ne garde que son empreinte), liée à l'appareil de confiance de la porte ;
 *   - les enfants entrent avec LEUR code secret, au choix 4 chiffres ou 3 cartes (créé la première fois, remis à zéro par Anis) ;
 *     papa et maman avec le mot de passe parent (Anis aussi avec celui de l'administration) ;
 *   - un invité entre avec son prénom (déjà rempli s'il est venu par une invitation ou s'il a frappé à la porte),
 *     choisit un avatar (une mascotte ou l'avatar d'un membre de la famille, juste l'image) ; ses scores restent à son nom ;
 *   - les API prennent le joueur de la session : un enfant ne peut plus écrire au nom d'un autre, un parent ou un invité
 *     n'écrit jamais au nom d'un enfant (mode explorateur) ;
 *   - Anis (administration) peut PRENDRE LA MAIN sur la tablette d'un enfant (mode essais, 30 min, sans limite de temps,
 *     sans rien enregistrer par défaut) ou VOIR LE SITE COMME un enfant depuis son propre appareil.
 * Interrupteur à l'arrêt : tout marche comme avant (rien n'est lu ici).
 */
declare(strict_types=1);

const GA_QUI_COOKIE = 'mf_qui';
const GA_QUI_DUREE = 30 * 86400;       // une session dure 30 jours (elle se prolonge quand on revient)
const GA_QUI_CTRL = 30 * 60;           // une prise de main dure 30 minutes au plus
const GA_QUI_ENFANTS = ['Essil', 'Salma', 'Amine'];
const GA_QUI_PARENTS = ['Anis', 'Imen'];
const GA_QUI_CARTES = ['🐱', '🌙', '⭐', '🚀', '🍉', '🐴', '⚽', '🌸', '🐢'];
const GA_QUI_AVATARS = ['nour', 'yasmine', 'fares', 'f-anis', 'f-imen', 'f-essil', 'f-salma', 'f-amine'];

function ga_qui_db(): PDO {
    static $fait = false; $db = ga_db();
    if (!$fait) {
        $fait = true;
        $db->exec('CREATE TABLE IF NOT EXISTS qui (hash TEXT PRIMARY KEY, nom TEXT NOT NULL, role TEXT NOT NULL, av TEXT, appareil INTEGER, cree INTEGER NOT NULL, vu INTEGER NOT NULL, expire INTEGER NOT NULL, page TEXT, nom_appareil TEXT, ctrl_par TEXT, ctrl_fin INTEGER, ctrl_ecrit INTEGER NOT NULL DEFAULT 0, ctrl_retour TEXT)');
        $db->exec('CREATE TABLE IF NOT EXISTS qui_codes (nom TEXT PRIMARY KEY, type TEXT NOT NULL, hash TEXT NOT NULL, cree INTEGER NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS qui_invites (nom TEXT PRIMARY KEY, av TEXT, cree INTEGER NOT NULL, vu INTEGER NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS qui_echecs (cle TEXT NOT NULL, ts INTEGER NOT NULL)');
    }
    return $db;
}
// L'interrupteur de l'administration (arrêt par défaut : rien ne change tant qu'Anis ne l'a pas mis en marche)
function ga_qui_actif(): bool { try { return ga_reglage('sessions') === '1' && !is_file(ga_donnees() . '/sessions-arret'); } catch (Throwable $e) { return false; } }

function ga_qui_nom(string $n): string { $n = trim(preg_replace('/\s+/u', ' ', $n)); return mb_convert_case(mb_substr($n, 0, 20), MB_CASE_TITLE, 'UTF-8'); }
function ga_qui_famille(string $n): bool { return in_array($n, GA_QUI_ENFANTS, true) || in_array($n, GA_QUI_PARENTS, true); }
function ga_qui_enfant(string $n): bool { return in_array(ga_qui_nom($n), GA_QUI_ENFANTS, true); }
// Un prénom d'invité acceptable : des lettres, pas un prénom de la famille (même écrit autrement : « anis », « Aniss »)
function ga_qui_nom_invite(string $n): ?string {
    $n = ga_qui_nom($n);
    if (mb_strlen($n) < 2 || !preg_match("/^[\p{L}][\p{L}\p{M} '\-]*$/u", $n)) return null;
    $simple = fn($s) => preg_replace('/[^a-z]/', '', strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) ?: $s));
    foreach (array_merge(GA_QUI_ENFANTS, GA_QUI_PARENTS) as $f) { $a = $simple($n); $b = strtolower($f); if ($a === $b || ($a !== '' && levenshtein($a, $b) <= 1)) return null; }
    return $n;
}

// La session de ce visiteur (ou null). Une prise de main finie est levée ici (et « voir comme » revient à la personne d'avant).
function ga_qui(): ?array {
    static $cache = false;
    if ($cache !== false) return $cache;
    $cache = null;
    if (!ga_qui_actif()) return null;
    $j = (string)($_COOKIE[GA_QUI_COOKIE] ?? '');
    if (!preg_match('/^[0-9a-f]{64}$/', $j)) return null;
    try {
        $db = ga_qui_db(); $h = hash('sha256', $j); $t = time();
        $s = $db->prepare('SELECT * FROM qui WHERE hash = ? AND expire > ?'); $s->execute([$h, $t]); $q = $s->fetch();
        if (!$q) return null;
        $app = ga_appareil();
        if (ga_active() && $q['appareil'] && (!$app || (int)$app['id'] !== (int)$q['appareil'])) return null;   // le cookie ne vaut que sur son appareil
        if ($q['ctrl_par'] && (int)$q['ctrl_fin'] <= $t) { ga_qui_rend($q); $s->execute([$h, $t]); $q = $s->fetch() ?: null; if (!$q) return null; }
        if ((int)$q['vu'] < $t - 300) {   // on prolonge la session de quelqu'un qui revient
            $db->prepare('UPDATE qui SET vu = ?, expire = ? WHERE hash = ?')->execute([$t, $t + GA_QUI_DUREE, $h]);
            $q['vu'] = $t;
        }
        return $cache = $q;
    } catch (Throwable $e) { error_log('qui : ' . $e->getMessage()); return null; }
}
// Ce que la page doit savoir (injecté dans chaque page par porte.php, et rendu par api/qui.php?action=moi)
function ga_qui_public(): array {
    $r = ['actif' => ga_qui_actif()];
    if (!$r['actif']) return $r;
    $q = ga_qui();
    if ($q) {
        $r['nom'] = $q['nom']; $r['role'] = $q['role']; $r['av'] = (string)$q['av'];
        if ($q['ctrl_par']) $r['ctrl'] = ['par' => $q['ctrl_par'], 'fin' => (int)$q['ctrl_fin'], 'ecrit' => (bool)$q['ctrl_ecrit'], 'retour' => (string)$q['ctrl_retour']];
    } else {
        $r['suggestion'] = ga_qui_suggestion();
    }
    $r['v'] = $q ? substr(hash('sha256', $q['nom'] . '|' . $q['role'] . '|' . $q['ctrl_par'] . '|' . $q['ctrl_fin'] . '|' . $q['ctrl_ecrit']), 0, 12) : '-';
    $r['codes'] = ga_qui_codes_types();
    return $r;
}
// Le prénom déjà connu de cet appareil d'invité (invitation ou « frapper à la porte »)
function ga_qui_suggestion(): string {
    try {
        $a = ga_appareil(); if (!$a) return '';
        if ($a['invitation']) { $s = ga_db()->prepare('SELECT nom FROM invitations WHERE id = ?'); $s->execute([$a['invitation']]); $n = (string)$s->fetchColumn(); if ($n !== '') return ga_qui_nom_invite($n) ?? ''; }
        if ($a['via'] === 'accepte' && strpos((string)$a['nom'], ' · ') !== false) return ga_qui_nom_invite(explode(' · ', (string)$a['nom'])[0]) ?? '';
    } catch (Throwable $e) {}
    return '';
}
function ga_qui_codes_types(): array {
    $r = []; foreach (ga_qui_db()->query('SELECT nom, type FROM qui_codes') as $c) $r[$c['nom']] = $c['type']; return $r;
}
// Ouvre une session sur cet appareil (remplace celle d'avant : une seule personne à la fois par appareil et par navigateur)
function ga_qui_ouvre(string $nom, string $role, string $av = ''): void {
    $db = ga_qui_db(); $t = time(); $old = (string)($_COOKIE[GA_QUI_COOKIE] ?? '');
    if (preg_match('/^[0-9a-f]{64}$/', $old)) $db->prepare('DELETE FROM qui WHERE hash = ?')->execute([hash('sha256', $old)]);
    $app = ga_appareil(); $j = bin2hex(random_bytes(32));
    $db->prepare('INSERT INTO qui (hash, nom, role, av, appareil, cree, vu, expire, nom_appareil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
       ->execute([hash('sha256', $j), $nom, $role, $av, $app ? (int)$app['id'] : null, $t, $t, $t + GA_QUI_DUREE, $app ? (string)$app['nom'] : ga_nom_appareil(ga_ua())]);
    ga_cookie(GA_QUI_COOKIE, $j, $t + 400 * 86400); $_COOKIE[GA_QUI_COOKIE] = $j;
    if (random_int(1, 20) === 1) $db->prepare('DELETE FROM qui WHERE expire < ?')->execute([$t]);
}
function ga_qui_ferme(): void {
    $j = (string)($_COOKIE[GA_QUI_COOKIE] ?? '');
    if (preg_match('/^[0-9a-f]{64}$/', $j)) ga_qui_db()->prepare('DELETE FROM qui WHERE hash = ?')->execute([hash('sha256', $j)]);
    ga_cookie(GA_QUI_COOKIE, '', 1); unset($_COOKIE[GA_QUI_COOKIE]);
}
// Fin d'une prise de main : la tablette revient à l'enfant ; « voir comme » revient à la personne d'avant (Anis)
function ga_qui_rend(array $q): void {
    $db = ga_qui_db();
    if ($q['ctrl_retour']) $db->prepare('UPDATE qui SET nom = ctrl_retour, role = ?, av = \'\', ctrl_par = NULL, ctrl_fin = NULL, ctrl_ecrit = 0, ctrl_retour = NULL WHERE hash = ?')
                              ->execute([in_array($q['ctrl_retour'], GA_QUI_PARENTS, true) ? 'parent' : (in_array($q['ctrl_retour'], GA_QUI_ENFANTS, true) ? 'enfant' : 'invite'), $q['hash']]);
    else $db->prepare('UPDATE qui SET ctrl_par = NULL, ctrl_fin = NULL, ctrl_ecrit = 0 WHERE hash = ?')->execute([$q['hash']]);
}

/* ---------- Les codes des enfants ---------- */
// Un code : « n:1234 » (4 chiffres) ou « c:3-7-1 » (3 cartes dans l'ordre, parmi les 9)
function ga_qui_code_propre(string $type, string $code): ?string {
    if ($type === 'chiffres' && preg_match('/^\d{4}$/', $code)) return 'n:' . $code;
    if ($type === 'cartes' && preg_match('/^[0-8]-[0-8]-[0-8]$/', $code)) return 'c:' . $code;
    return null;
}
function ga_qui_essais_cle(string $nom): string { $a = ga_appareil(); return ($a ? 'a' . $a['id'] : 'ip' . ga_ip()) . ':' . $nom; }
function ga_qui_trop_essais(string $nom): bool {
    $s = ga_qui_db()->prepare('SELECT COUNT(*) FROM qui_echecs WHERE cle = ? AND ts > ?'); $s->execute([ga_qui_essais_cle($nom), time() - 900]);
    return (int)$s->fetchColumn() >= 5;
}
function ga_qui_echec(string $nom): void {
    $db = ga_qui_db(); $db->prepare('INSERT INTO qui_echecs (cle, ts) VALUES (?, ?)')->execute([ga_qui_essais_cle($nom), time()]);
    $db->prepare('DELETE FROM qui_echecs WHERE ts < ?')->execute([time() - 86400]); usleep(400000);
}

/* ---------- Ce que les API ont le droit d'écrire ---------- */
// Peut-on enregistrer quelque chose (scores, progrès, temps d'écran) au nom de $joueur depuis cet appareil ?
function ga_qui_peut_ecrire(string $joueur): bool {
    if (!ga_qui_actif()) return true;   // interrupteur à l'arrêt : le fonctionnement d'avant (cookie famille_explo)
    $j = ga_qui_nom($joueur); $q = ga_qui();
    if (!ga_qui_enfant($j)) return true;                                           // un invité, un parent : ses propres scores
    if (!$q) return false;                                                         // personne n'est entré : rien au nom d'un enfant
    if ($q['ctrl_par']) return $q['nom'] === $j && (bool)$q['ctrl_ecrit'];         // essais d'Anis : rien, sauf s'il l'a demandé
    return $q['nom'] === $j;                                                       // un enfant n'écrit que pour lui
}
// La limite de temps de jeu ne s'applique pas pendant les essais d'Anis
function ga_qui_libre(string $joueur): bool {
    if (!ga_qui_actif()) return false;
    $q = ga_qui(); return $q && $q['ctrl_par'] && $q['nom'] === ga_qui_nom($joueur);
}
// Le nom à utiliser dans le salon (on ne peut pas écrire sous le nom d'un autre)
function ga_qui_nom_salon(string $demande): string {
    if (!ga_qui_actif()) return $demande;
    $q = ga_qui(); return $q ? (string)$q['nom'] : $demande;
}
function ga_qui_note_page(string $page): void {
    $q = ga_qui(); if (!$q || $page === '') return;
    if ($q['page'] !== $page || (int)$q['vu'] < time() - 60) try { ga_qui_db()->prepare('UPDATE qui SET page = ?, vu = ? WHERE hash = ?')->execute([mb_substr($page, 0, 80), time(), $q['hash']]); } catch (Throwable $e) {}
}
