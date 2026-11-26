<?php
/* Les voix ElevenLabs des cours et des jeux (16/11) : api/voix.php?l=fr|en|de|la|ar&t=<phrase>[&p=amine]
   p=amine : en français, la voix « dessin animé » de Lulu (créée pour Amine) au lieu de Céline.
   Rend un MP3 de la phrase, dite par la voix française (Céline) ou anglaise (Alice) d'Ollie.
   Chaque phrase n'est fabriquée qu'une fois : elle est gardée dans famille-data/voix-cache/<voix>/<empreinte>.mp3
   et resservie ensuite sans dépenser de crédits. La clé API ElevenLabs est tapée par le papa dans l'administration
   (acces/admin.php › Les voix) : elle est rangée dans la base de la porte, jamais dans le dépôt GitHub.
   Garde-fou : un plafond de caractères par mois (réglable dans l'administration). Sans clé ou au-delà du plafond : 404,
   la page prend alors la voix de la tablette. */
declare(strict_types=1);
require dirname(__DIR__) . '/acces/garde.php';
ga_garde_api();

const VX_VOIX = ['fr' => '3fxbs2pB9bs8S6Z1N38A', 'en' => 'Xb7hH8MSUJpSbSDYk0k2', 'de' => 'tR9bEXIX9ixlxSis0fqv', 'la' => '3fxbs2pB9bs8S6Z1N38A', 'ar' => 'Hzk6QBi3fCYSXbJEkzKR'];
// Céline | Chaleureuse et immersive · Alice - Clear, Engaging Educator · Toni - Klar & Engagiert (allemand) · le latin : Céline, sans langue imposée
// arabe (17/11, choisie par le papa) : Mohammad - Warm Arabic, arabe standard, ajoutée à « Mes voix »
const VX_LULU = '0c3jkkHzeXchq2gHGH2z';   // Lulu - Je lis (Amine), Voice Design du papa
const VX_MODELE = 'eleven_multilingual_v2';
function vx_fin(int $code, string $msg = ''): void { http_response_code($code); header('Content-Type: text/plain; charset=utf-8'); header('Cache-Control: no-store'); echo $msg; exit; }
function vx_voix(string $l): string { $v = ga_reglage('voix_' . $l); return $v && preg_match('/^[A-Za-z0-9]{10,40}$/', $v) ? $v : VX_VOIX[$l]; }

$l = (string)($_GET['l'] ?? 'fr'); if (!isset(VX_VOIX[$l])) vx_fin(400);
$t = trim(preg_replace('/\s+/u', ' ', (string)($_GET['t'] ?? '')));
if ($t === '' || mb_strlen($t) > 400) vx_fin(400);
// 21/11 (demandé par le papa) : en français, les unités écrites en abrégé (cm, mm, km, m², cm³, °…) sont lues en toutes lettres,
// sinon la voix disait « cé-èm » ou l'anglais. « 1 cm » → « 1 centimètre », « 5 cm² » → « 5 centimètres carrés », « (cm) » → « (centimètres) ».
function vx_unites(string $t): string {
    static $U = ['km' => 'kilomètre', 'hm' => 'hectomètre', 'dam' => 'décamètre', 'dm' => 'décimètre', 'cm' => 'centimètre', 'mm' => 'millimètre', 'm' => 'mètre',
                 'kg' => 'kilogramme', 'mg' => 'milligramme', 'g' => 'gramme', 'cL' => 'centilitre', 'cl' => 'centilitre', 'mL' => 'millilitre', 'ml' => 'millilitre', 'dL' => 'décilitre', 'L' => 'litre'];
    $t = preg_replace('/(\d)\s*°\s*C\b/u', '$1 degrés Celsius', $t);
    $t = preg_replace_callback('/(\d+(?:[,.]\d+)?)?\s*°/u', fn($m) => ($m[1] ?? '') === '' ? ' degrés' : $m[1] . ((float)str_replace(',', '.', $m[1]) < 2 ? ' degré' : ' degrés'), $t);
    $t = preg_replace_callback('/(?<![\p{L}\d])(\d+(?:[,.]\d+)?\s*)?(km|hm|dam|dm|cm|mm|kg|mg|cL|cl|mL|ml|dL|m|g|L)([²³23])?(?![\p{L}\d])/u', function ($m) use ($U) {
        $n = trim($m[1] ?? ''); $u = $m[2]; $p = $m[3] ?? '';
        if ($n === '' && in_array($u, ['m', 'g', 'L'], true)) return $m[0];   // une lettre seule (le point m, la lettre L…) : on n'y touche pas
        $mot = $U[$u]; $pl = $n === '' || (float)str_replace(',', '.', $n) >= 2;
        $suf = $p === '²' || $p === '2' ? ($pl ? ' carrés' : ' carré') : ($p === '³' || $p === '3' ? ($pl ? ' cubes' : ' cube') : '');
        if ($p === '2' || $p === '3') { if ($n === '') return $m[0]; }
        return ($n !== '' ? $n . ' ' : '') . $mot . ($pl ? 's' : '') . $suf;
    }, $t);
    return trim(preg_replace('/\s+/u', ' ', $t));
}
if ($l === 'fr') $t = vx_unites($t);
$lulu = $l === 'fr' && ($_GET['p'] ?? '') === 'amine';
// d'autres voix françaises choisies par le papa (v=…) : Jon, la voix de papa dans « La vie du Prophète ﷺ » (17/11)
// 18/11 : le salon du site lit chaque message avec la voix de celui qui l'a écrit (explorateur.js, v=<prénom>) :
// Anis = Jon, Amine = Lulu ; Imen et les invités = la voix française du site (Céline) ; Salma = Lucie ; Essil = Clémence
const VX_AUTRES = ['jon' => 'bJ4Wa440PU9c765nkJkn', 'anis' => 'bJ4Wa440PU9c765nkJkn', 'amine' => VX_LULU, 'salma' => 'KmqhNPEmmOndTBOPk4mJ', 'essil' => 'i21CEl4V2LyRfaESBSjO'];   // Salma = Lucie, « jeune fille parisienne » ; Essil = Clémence (choisie par le papa, 18/11)
$autre = $l === 'fr' ? (VX_AUTRES[(string)($_GET['v'] ?? '')] ?? '') : '';
$voix = $lulu ? VX_LULU : ($autre ?: vx_voix($l));
$dir = ga_donnees() . '/voix-cache/' . $voix;
// 20/11 : un mot ou une syllabe seule (« to », « lune ») était lu avec l'accent anglais : le modèle multilingue devine la langue
// et ne suit pas language_code. Pour un texte français très court, on prend le modèle Turbo v2.5, qui suit language_code.
// 21/11 : Lulu (voix d'Amine, faite par Voice Design) lisait le français avec l'accent anglais dans le cours d'anglais :
// le modèle multilingue « devine » la langue d'après la voix. Pour Lulu, toujours Turbo v2.5, qui obéit à language_code=fr.
$modele = (($l === 'fr' && ($lulu || mb_strlen($t) <= 12)) || (($l === 'en' || $l === 'ar') && mb_strlen($t) <= 12)) ? 'eleven_turbo_v2_5' : VX_MODELE;   // 26/11 : aussi l'arabe très court (une lettre, une syllabe : Salma & Ghazala)   // 22/11 : aussi les mots anglais très courts (« she, grow ») des règles d'Essil
$f = $dir . '/' . sha1($modele . '|' . (in_array($l, ['fr', 'en'], true) ? '' : ($l === 'la' ? 'la-lent|' : $l . '|')) . $t) . '.mp3';   // fr/en : les clés d'avant restent valables

if (!is_file($f)) {
    $cle = (string)ga_reglage('elevenlabs_cle');
    if ($cle === '') vx_fin(404, 'pas de clé');
    // le plafond du mois
    $mois = ga_voix_periode(); [$m, $n] = array_pad(explode(':', (string)ga_reglage('voix_compteur')), 2, '0');
    $n = $m === $mois ? (int)$n : 0; $max = (int)(ga_reglage('voix_max') ?: 100000);   // 21/11 : 15 000 était atteint (compte Creator : 138 676 caractères par mois)
    if ($n + mb_strlen($t) > $max) vx_fin(429, 'plafond du mois');
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) vx_fin(500);
    $verrou = fopen($f . '.lock', 'c'); if ($verrou) flock($verrou, LOCK_EX);
    if (!is_file($f)) {   // pas fabriquée entre-temps par une autre tablette
        $ch = curl_init('https://api.elevenlabs.io/v1/text-to-speech/' . $voix . '?output_format=mp3_44100_64');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => ['xi-api-key: ' . $cle, 'Content-Type: application/json', 'Accept: audio/mpeg'],
            CURLOPT_POSTFIELDS => json_encode(array_merge(['text' => $t, 'model_id' => $modele], $l === 'la' ? [] : ['language_code' => $l]) + [
                'voice_settings' => ['stability' => $l === 'la' ? 0.65 : 0.5, 'similarity_boost' => 0.75, 'style' => 0.2, 'speed' => $l === 'la' ? 0.8 : ($l === 'en' || $lulu ? 0.9 : ($autre ? 0.92 : 0.95))]], JSON_UNESCAPED_UNICODE)]);
        // 21/11 : trop de phrases demandées en même temps (429) ou ElevenLabs qui hoquette (5xx) : on réessaie 2 fois avant d'abandonner
        for ($essai = 0; ; $essai++) {
            $mp3 = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            if ($essai >= 2 || !($code === 429 || $code >= 500 || $code === 0)) break;
            usleep(700000 * ($essai + 1));
        }
        curl_close($ch);
        if ($code !== 200 || !is_string($mp3) || strlen($mp3) < 300) {
            if ($verrou) { flock($verrou, LOCK_UN); fclose($verrou); }
            error_log('voix ElevenLabs : HTTP ' . $code . ' ' . substr(is_string($mp3) ? $mp3 : '', 0, 200));
            ga_reglage('voix_erreur', date('d/m H:i') . ' — HTTP ' . $code);
            vx_fin(502, 'ElevenLabs : ' . $code);
        }
        file_put_contents($f, $mp3, LOCK_EX);
        ga_reglage('voix_compteur', $mois . ':' . ($n + mb_strlen($t)));
    }
    if ($verrou) { flock($verrou, LOCK_UN); fclose($verrou); @unlink($f . '.lock'); }
}
header('Content-Type: audio/mpeg');
header('Content-Length: ' . filesize($f));
header('Cache-Control: private, max-age=31536000, immutable');
readfile($f);
