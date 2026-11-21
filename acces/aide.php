<?php
/*
 * Famille Missaoui — l'aide de l'administration (21/11/2026, demandée par le papa) :
 * tout le fonctionnement du site, depuis le début, au même endroit. Réservée à l'administration (Anis).
 * À tenir à jour à chaque nouveauté importante (en plus de docs/journal.md).
 */
declare(strict_types=1);
require __DIR__ . '/garde.php';
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
if (!ga_admin()) { header('Location: /acces/?admin=1', true, 303); exit; }
?><!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#14102b">
<title>Aide · Famille Missaoui</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ctext y=%22.9em%22 font-size=%2290%22%3E%F0%9F%93%96%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Nunito:wght@400;600;700;800&display=swap">
<link rel="stylesheet" href="/acces/porte.css?v=1">
<style>
body{align-items:flex-start}
.porte.large{width:min(940px,100%);gap:18px}
.tete{display:flex;align-items:center;gap:14px;width:100%;justify-content:space-between;flex-wrap:wrap}
.tete h1{font-size:clamp(28px,6vw,40px);text-align:left}
.petit{font:inherit;font-weight:800;font-size:15px;min-height:44px;padding:0 16px;border-radius:14px;border:0;background:#ffffff1c;color:#fbf6ea;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.carte{line-height:1.55}
.carte h2{margin:0 0 8px}
.carte h3{margin:16px 0 4px;font-size:18px}
.carte p{margin:6px 0}
.carte ul,.carte ol{margin:6px 0;padding-left:22px}
.carte li{margin:3px 0}
.carte code{background:#eef1f6;border-radius:6px;padding:1px 6px;font-size:.92em;overflow-wrap:anywhere}
.sommaire{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.sommaire a{display:block;background:#f5f7fb;border-radius:14px;padding:10px 12px;color:var(--ink);text-decoration:none;font-weight:800}
.sommaire a:hover{background:#e6ecfa}
.conseil{background:#fff7dd;color:#3a2600;border-radius:16px;padding:12px 14px;margin:10px 0}
.alerte{background:#fde8eb;color:#5c0d19;border-radius:16px;padding:12px 14px;margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:15px}
td,th{border-bottom:1px solid var(--line);padding:7px 6px;text-align:left;vertical-align:top}
th{font-size:13px;color:var(--soft);text-transform:uppercase;letter-spacing:.04em}
.scroll{overflow-x:auto}
details{background:#f5f7fb;border-radius:14px;padding:8px 12px;margin:8px 0}
details summary{cursor:pointer;font-weight:800}
#cherche{width:100%;box-sizing:border-box;font:inherit;font-size:17px;min-height:52px;padding:0 14px;border-radius:14px;border:2px solid var(--line)}
.cache{display:none}
</style>
</head>
<body>
<main class="porte large">
  <div class="tete">
    <h1>📖 Aide du site</h1>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="petit" href="/acces/admin.php">← L'administration</a><a class="petit" href="/">Le site</a></div>
  </div>

  <section class="carte">
    <p>Tout le fonctionnement de <b>missaoui-family.com</b>, depuis le début : la porte, les sessions, la prise de main, les cours, les jeux, les voix, la Progression, et quoi faire si quelque chose ne marche pas. Cette page est réservée à l'administration.</p>
    <input id="cherche" type="search" placeholder="🔎 Chercher dans l'aide (ex. code, FaceTime, invitation…)" aria-label="Chercher dans l'aide">
    <div class="sommaire" style="margin-top:12px">
      <a href="#bref">🏠 Le site en bref</a><a href="#porte">🚪 La porte (accès réservé)</a><a href="#sessions">👤 Les sessions</a><a href="#main">🔧 Prendre la main</a>
      <a href="#accueil">🙋 « Qui es-tu ? » et les espaces</a><a href="#ecran">⏱️ Temps d'écran et défi du jour</a><a href="#progression">📊 La Progression</a><a href="#salon">💬 Salon et mur</a>
      <a href="#voix">🔊 Les voix et le son</a><a href="#cours">📚 Les cours</a><a href="#jeux">🎮 Les jeux</a><a href="#eveil">🌙 Éveil religieux</a>
      <a href="#images">🎨 Images et vidéos</a><a href="#publier">🚀 Mises à jour</a><a href="#pannes">🛟 En cas de souci</a>
    </div>
  </section>

  <section class="carte" id="bref">
    <h2>🏠 Le site en bref</h2>
    <p>Le site regroupe les cours et les jeux faits sur mesure pour <b>Essil</b> (12 ans, collège), <b>Salma</b> (8 ans, CE2) et <b>Amine</b> (5 ans, grande section), pour apprendre en s'amusant. Papa (Anis) et maman (Imen) l'explorent aussi, et les invités (Nour, Yasmine, Farès ou un prénom) peuvent venir jouer.</p>
    <ul>
      <li><b>Adresse</b> : <code>https://www.missaoui-family.com</code> (avec www).</li>
      <li><b>Fabrication</b> : des pages web simples, écrites avec Claude, rangées sur GitHub (<code>azilix-ui/jeu-amine</code>) ; chaque mise à jour part toute seule chez Hostinger (voir <a href="#publier">Mises à jour</a>).</li>
      <li><b>Les données</b> (progrès, scores, messages, voix, codes) sont sur le serveur, à côté du site, dans <code>famille-data/</code> et <code>nahki-voix/</code> : une mise à jour du site ne les efface jamais. Une sauvegarde est faite chaque semaine (Administration › Les sauvegardes).</li>
      <li><b>L'appli</b> : sur l'accueil, « 📲 Installer l'appli » met le site sur l'écran d'accueil de la tablette (sur iPad : Partager › « Sur l'écran d'accueil »).</li>
      <li><b>La version</b> du site est écrite en bas de l'accueil (« Version 3.… · mise à jour du … »).</li>
    </ul>
  </section>

  <section class="carte" id="porte">
    <h2>🚪 La porte (accès réservé)</h2>
    <p>Le site n'est ouvert qu'aux appareils de confiance. Les autres voient la page « Accès réservé ».</p>
    <h3>Qui peut entrer</h3>
    <ul>
      <li><b>La maison</b> : les appareils branchés sur la box de la maison (adresses IP enregistrées dans « Les adresses de la maison ») entrent seuls et reçoivent une carte de confiance d'un an, qui marche ensuite partout.</li>
      <li><b>Toi</b> : en te connectant à l'administration (identifiant + mot de passe), ton appareil devient de confiance.</li>
      <li><b>Une invitation</b> : « Inviter quelqu'un » crée un lien (durée du lien, durée de l'accès, nombre d'appareils). <b>Le prénom est obligatoire</b> : l'invité arrive sur le site avec ce prénom déjà écrit. Tu l'envoies par WhatsApp ; c'est le bouton « Entrer » de la page qui donne l'accès (pas l'aperçu de WhatsApp).</li>
      <li><b>Frapper à la porte</b> : un inconnu écrit son prénom (pas celui de quelqu'un de la famille) et frappe. Tu reçois une alerte (ntfy sur le téléphone, et e-mail si réglé) ; dans « Les appareils qui frappent à la porte », « Faire confiance » le laisse entrer. Il retrouve son prénom pour entrer comme invité, et ses scores restent à son nom.</li>
    </ul>
    <h3>Gérer</h3>
    <ul>
      <li><b>Les appareils de confiance</b> : les renommer, les retirer (l'appareil retiré revoit « Accès réservé »).</li>
      <li><b>Mettre la porte en pause</b> : tout le monde entre (le bouton en haut de l'administration).</li>
      <li><b>Les visites refusées</b> (60 jours) et le détail technique de ton adresse (« Secours et détails techniques »).</li>
    </ul>
    <div class="alerte"><b>Secours</b> : si plus personne ne peut entrer, crée un fichier vide <code>famille-data/acces-ouvert</code> dans le gestionnaire de fichiers d'Hostinger (hPanel) : le site s'ouvre à tous. Mot de passe administrateur oublié : supprime <code>famille-data/acces-admin.json</code> puis recrée le compte (le mot de passe parent sert de preuve).</div>
  </section>

  <section class="carte" id="sessions">
    <h2>👤 Les sessions par personne (depuis le 20/11)</h2>
    <p>Chacun entre avec son code : le serveur sait qui est là, et un enfant ne peut plus jouer ou écrire à la place d'un autre. <b>Interrupteur</b> : Administration › « 👤 Les sessions de la famille » › Mettre en marche / à l'arrêt. À l'arrêt, on choisit son avatar sans code, comme avant.</p>
    <h3>Comment on entre</h3>
    <ul>
      <li><b>Les enfants</b> : ils touchent leur avatar sur « Qui es-tu ? » puis tapent leur <b>code secret</b>. La première fois, l'enfant choisit son code : <b>4 chiffres</b> ou <b>3 cartes</b> (🐱🌙⭐🚀🍉🐴⚽🌸🐢, dans l'ordre), et le refait une deuxième fois pour être sûr. Ensuite, il reste connecté <b>30 jours</b> sur sa tablette.</li>
      <li><b>Papa et maman</b> : le <b>mot de passe parent</b> (le même que la Progression). Papa peut aussi taper celui de l'administration.</li>
      <li><b>Les invités</b> : ils écrivent leur prénom (déjà rempli s'ils viennent d'une invitation ou s'ils ont frappé à la porte) et choisissent un avatar : Nour, Yasmine, Farès, ou <b>l'image</b> d'un membre de la famille (avec l'image d'Amine, on n'entre pas dans l'espace ni dans la session d'Amine : c'est juste le dessin). Ils explorent tout ; leurs propres scores restent à leur nom.</li>
    </ul>
    <h3>Ce qui est protégé</h3>
    <ul>
      <li>Les progrès et les scores d'un enfant ne s'enregistrent que depuis <b>sa</b> session. Un parent ou un invité qui ouvre un cours d'enfant est en <b>mode explorateur</b> : il essaie tout, rien ne compte.</li>
      <li>Dans le salon, chacun écrit et lit sous son vrai nom.</li>
      <li>« Qui joue ? » dans les jeux prend directement la personne connectée.</li>
      <li>5 codes faux de suite : il faut attendre un quart d'heure.</li>
    </ul>
    <h3>À savoir</h3>
    <ul>
      <li><b>La première fois compte</b> : celui qui touche l'avatar d'un enfant sans code choisit son code. Sois à côté de chaque enfant la première fois, ou remets le code à zéro après (Administration › « Les codes secrets des enfants » › Remettre à zéro).</li>
      <li><b>Sur iPad</b>, l'appli installée et Safari ne partagent pas la connexion : il faut entrer une fois dans chacun.</li>
      <li><b>Changer de personne</b> sur une tablette : bouton « ⇄ Changer d'avatar » (ou l'adresse <code>/?profil</code>), puis le code de la nouvelle personne.</li>
      <li><b>Fermer une session</b> à distance : Administration › liste des sessions › Fermer (la personne devra retaper son code).</li>
    </ul>
    <div class="alerte"><b>Secours</b> : si les sessions posent un problème, mets-les à l'arrêt dans l'administration. Sans accès à l'administration : crée un fichier vide <code>famille-data/sessions-arret</code> dans hPanel.</div>
  </section>

  <section class="carte" id="main">
    <h2>🔧 Prendre la main sur la tablette d'un enfant</h2>
    <p>Pour faire des essais sur la session d'un enfant, sans abîmer ses progrès.</p>
    <ol>
      <li>Administration › « 👤 Les sessions de la famille » : la liste dit qui est connecté, sur quel appareil, sur quelle page, vu il y a combien de temps.</li>
      <li>Sur la ligne de l'enfant : <b>🔧 Prendre la main</b>. Le site demande si ce que tu feras doit être <b>enregistré pour de vrai</b> (« Annuler » = non, conseillé pour des essais).</li>
      <li>En moins de 8 secondes, la tablette de l'enfant se recharge et affiche le bandeau <b>« 🔧 Papa fait des essais sur la session de … »</b> avec le temps restant.</li>
      <li>Pendant ce temps : pas de limite de temps de jeu ni de pause de nuit, toutes les pages s'ouvrent, et rien n'est enregistré (sauf si tu l'as demandé).</li>
      <li>Pour finir : le bouton <b>« Rendre la tablette »</b> du bandeau, <b>« Rendre »</b> dans l'administration, ou tout seul au bout de <b>30 minutes</b>.</li>
    </ol>
    <h3>Voir le site comme un enfant, sur ton appareil</h3>
    <p>Administration › « Voir le site comme un enfant, ici » : choisis l'enfant (et « enregistrer pour de vrai » si besoin), puis <b>👀 Voir comme lui</b>. Tu vois ses vraies données sur ton propre appareil ; le bandeau « Revenir à moi » te rend ta session (fin automatique après 30 minutes).</p>
    <div class="conseil">Le site ne peut pas montrer l'écran de la tablette à distance ni cliquer dessus depuis ton téléphone : un site web n'a pas ce droit. « Prendre la main » met la tablette en mode papa ; « Voir comme » ouvre la session de l'enfant chez toi.</div>
  </section>

  <section class="carte" id="accueil">
    <h2>🙋 « Qui es-tu ? », les espaces et la navigation</h2>
    <ul>
      <li><b>« Qui es-tu ? »</b> (l'accueil) : les 5 avatars de la famille (pastille verte = connecté maintenant, rouge = pas là), et en dessous l'entrée des invités.</li>
      <li><b>Un enfant</b> arrive directement dans <b>son espace</b> : Essil (le cartable et la cour), Salma (les étagères), Amine (le chemin, avec des boutons 🔊 lus par Lulu). En haut, un petit film animé ; « Reprendre » rouvre le dernier cours ; en bas, « Tous les jeux de la famille ». Le lien « 🏠 Accueil de la famille » ramène à l'accueil, d'où « 🏠 Mon espace » ramène dans son espace.</li>
      <li><b>Papa, maman et les invités</b> voient tout l'accueil : le mur des nouveautés (les papiers épinglés), le tableau du temps de jeu, les cartes des trois enfants, les jeux de la famille, la carte « Se cultiver ». Ils sont en <b>mode explorateur</b> : l'étiquette en bas à gauche (« Explorateur du site : … ») le rappelle ; la toucher ouvre le salon.</li>
      <li><b>Le mur des nouveautés</b> : chaque nouveauté y a son papier, avec un lien.</li>
    </ul>
  </section>

  <section class="carte" id="ecran">
    <h2>⏱️ Temps d'écran, demande de temps, défi du jour</h2>
    <ul>
      <li><b>Le temps d'écran</b> ne compte que sur les <b>jeux</b> (les cours restent toujours libres) : par défaut 45 min en semaine, 1 h 30 le week-end, pause de nuit de 20 h 30 à 7 h (week-end réglable à part). Tout se règle enfant par enfant dans Progression › Réglages.</li>
      <li>À la fin du temps : écran « C'est l'heure de faire une pause », avec « 📚 Aller à mes cours ». Un parent peut débloquer 15 minutes avec le mot de passe parent.</li>
      <li><b>« 🙋 Demander plus de temps »</b> : tu reçois une notification ntfy avec +15 min / +30 min / Non ; la tablette se débloque toute seule. On peut aussi répondre dans Progression › Réglages.</li>
      <li><b>Le défi du jour</b> (en haut des espaces) : 4 ou 5 questions selon l'enfant ; réussi = 5 tickets 🎟️ et <b>10 minutes de jeu</b> en plus ce jour-là ; bonus tous les 7 jours d'affilée.</li>
      <li><b>Les tickets 🎟️</b> gagnés dans les cours s'échangent dans la Boutique du savoir de Serpent Légendes.</li>
    </ul>
  </section>

  <section class="carte" id="progression">
    <h2>📊 La Progression (mot de passe parent)</h2>
    <ul>
      <li><b>Vue d'ensemble</b> : chiffres clés, pages ouvertes par enfant jour par jour, temps passé (survoler une barre).</li>
      <li><b>Activités</b> : ce que chaque enfant a ouvert et fait, jour par jour.</li>
      <li><b>Cours et jeux</b> : une carte par cours (étoiles, « à revoir », tickets).</li>
      <li><b>Suivi</b> : l'historique d'un cours ; « ↩ Revenir à cet état » ou « 🗑 Remettre ce cours à zéro » (par exemple si un parent a fait le cours à la place de l'enfant).</li>
      <li><b>Records</b>, <b>Journal</b> des visites (adresses, lieu, appareil ; 60 jours), <b>Houma en ligne</b> (tous les messages du salon et de Ma Houma), <b>Réglages</b> (temps d'écran, joueurs : fusionner ou supprimer un faux prénom).</li>
    </ul>
    <div class="conseil">Mot de passe parent oublié : supprimer <code>nahki-voix/auth.json</code> dans hPanel, puis en recréer un (les sons sont gardés).</div>
  </section>

  <section class="carte" id="salon">
    <h2>💬 Le salon, Ma Houma en ligne, le mur de la famille</h2>
    <ul>
      <li><b>Le salon</b> (bouton des messages sur chaque page) : qui est connecté et sur quelle page ; messages privés à quelqu'un (même s'il n'est pas là : il lira plus tard), ou à « Toute la famille ». <b>Depuis le 20/11 : du texte, des émojis et des phrases toutes prêtes seulement</b> (plus de messages vocaux ni de lecture à voix haute).</li>
      <li><b>Ma Houma en ligne</b> : aller chez les autres, « 📣 Viens voir ! », discussion écrite, troc d'objets validé par les deux.</li>
      <li><b>Le mur de la famille</b> (<code>mur.html</code>) : messages, dessins, photos (réencodées : plus de position GPS), réactions ; <b>3 photos par personne et par jour</b> ; chacun efface les siens, effacer ceux d'un autre demande le mot de passe parent.</li>
    </ul>
  </section>

  <section class="carte" id="voix">
    <h2>🔊 Les voix et le son</h2>
    <ul>
      <li>Toutes les voix des pages passent par <b>ElevenLabs</b> (ta clé API, tapée dans Administration › « 🔊 Les voix des cours », jamais montrée). Chaque phrase n'est fabriquée qu'une fois puis gardée sur le serveur. Un <b>plafond de caractères par mois</b> se règle au même endroit.</li>
      <li>Les voix : <b>Céline</b> (français), <b>Alice</b> (anglais), <b>Toni</b> (allemand), <b>Mohammad</b> (arabe, commentaires des jeux), <b>Lulu</b> (voix dessin animé, pour tout ce qui est dit à Amine), <b>Jon</b> (la voix de papa dans l'Éveil).</li>
      <li><b>Touche V</b> (sur ordinateur) : couper ou remettre les consignes orales. Elle ne réagit pas quand on écrit.</li>
      <li><b>Mots courts</b> : depuis le 20/11, un mot ou une syllabe seule est forcé en français (avant, « to » ou « lune » pouvaient être dits avec l'accent anglais).</li>
      <li><b>iPad et FaceTime</b> : après un appel, le son des pages repart tout seul ; si la tablette refuse, un bouton « 🔊 Touche pour entendre » apparaît.</li>
      <li>Les bruitages des jeux sont faits avec ElevenLabs puis envoyés directement au site : tu n'as jamais de fichier à télécharger.</li>
    </ul>
  </section>

  <section class="carte" id="cours">
    <h2>📚 Les cours</h2>
    <p>La plupart des cours d'Ollie (le hibou) suivent le même principe : un petit <b>dessin animé</b> au début, puis des étapes qui s'ouvrent l'une après l'autre, une leçon avant chaque étape, et le <b>contrôle</b> : les réponses s'allument après la lecture, une erreur donne un indice, la deuxième montre la correction et la question revient à la fin, et « Doucement ! » si on répond trop vite. 1 ticket 🎟️ par bonne réponse du premier coup.</p>
    <div class="scroll"><table>
      <tr><th>Enfant</th><th>Cours</th></tr>
      <tr><td><b>Essil</b></td><td>Deutsch Express 1 et 2 (allemand, voix Toni) · Via Romana I et II (latin) · Pas à pas : géométrie (5 vidéos) et fractions (3 vidéos) · Les Écuries d'Essil, le Concours en vrai et les Épreuves en vrai (équitation)</td></tr>
      <tr><td><b>Salma</b></td><td>Anglais : English Garden, Weather Station, Ollie's House, My First English 1 à 5 (elle répète à voix haute, la tablette écoute) · Français : Atelier des Verbes, Fabrique des Phrases 1 et 2, Machine du Futur · Maths : Jardin des Nombres, Atelier des Formes, Miroir Magique, Marché d'Ollie, Pâtisserie d'Ollie, Les Doubles d'Ollie, Les Tables du Souk · Le Grand Galop (son exposé sur le cheval)</td></tr>
      <tr><td><b>Amine</b></td><td>Je lis ! (voix Lulu) · La Planète des Nombres · L'Épicerie de Lulu · Les dessins animés de Lumi (compter, lire les syllabes) · L'Ardoise magique (écrire) · Nahki Tounsi (la derja, avec ta voix) · La Nuit d'Amine 1 et 2 · Serpentin · Monsieur Loup</td></tr>
    </table></div>
    <p>Pour Amine, les réponses restent grises pendant la consigne, une réponse fausse est barrée, il compte chaque objet avant de répondre, et la tortue « Doucement ! » arrive s'il touche au hasard.</p>
  </section>

  <section class="carte" id="jeux">
    <h2>🎮 Les jeux de la famille</h2>
    <p>Chaque jeu a un bouton <b>❔ Aide</b> (le but et les commandes en court, puis en détail) et le badge « Jeu propulsé par Anis Missaoui ». Les jeux comptent dans le temps d'écran des enfants.</p>
    <div class="scroll"><table>
      <tr><th>Jeu</th><th>En deux mots</th></tr>
      <tr><td>🌼 La Légende du Jasmin</td><td>Plateforme en Tunisie, 27 mondes en images réalistes, blocs savoir selon l'enfant. Le Jasmin 2 reste en sauvegarde, sans changement.</td></tr>
      <tr><td>🦂 Jasmin · Stage 2</td><td>23 mondes plus difficiles : échelles, objets à lancer, ennemis à attraper, 2 boss.</td></tr>
      <tr><td>🧱 Tebni</td><td>Le jeu de briques façon Tetris (zellige ou « Classique en vrai ») ; l'ombre de la pièce est une option (Non par défaut).</td></tr>
      <tr><td>🐉 Serpent Légendes</td><td>Le serpent 3D, ses skins, ses coffres (30 pièces), la Boutique du savoir.</td></tr>
      <tr><td>🐍 L'Arène des serpents</td><td>La variante « arène » du cahier des charges (21/11) : un serpent à tête d'animal ou à la tête d'un enfant mange les perles d'un riad ; joystick à gauche, BOOST à droite. Tranquille (14 serpents gentils, on renaît), Champion (25 serpents, une vie), et <b>en ligne</b> (salon, invitations, code à 4 lettres, 3/5/10 min, 0/8/16 machines). 7 têtes à gagner par missions. Commentaire en arabe, en français ou coupé. Bruitages ElevenLabs de Zarbia, Koora et Kassar.</td></tr>
      <tr><td>🎲 Ludo Légendes</td><td>Contre la machine ou en ligne (salon, invitations, sablier de 10 s).</td></tr>
      <tr><td>❄️ Grimpe-Glace · 🚋 Médina Express</td><td>Plateforme vers le haut · course infinie dans la médina et le TGM.</td></tr>
      <tr><td>🏺 Yajour</td><td>Puzzle physique 3D : le super-héros fait tomber les constructions (25 niveaux, 5 mondes).</td></tr>
      <tr><td>⚽ Koora · 💥 Kassar · 🧶 Khyout · 🔤 Kelma</td><td>Calcul en 3D · casse-carreaux · relier les pelotes · la tour des mots (français, anglais, arabe).</td></tr>
      <tr><td>🟩 Zarbia · 🃏 Chkobba</td><td>Territoire façon Paper.io · le jeu de cartes tunisien (contre l'ordi ou en ligne).</td></tr>
      <tr><td>🏘️ Ma Houma · 🎨 L'Atelier du Jasmin</td><td>Le quartier à faire vivre (en ligne) · coloriage 2D / 3D.</td></tr>
      <tr><td>🐴 Les Écuries</td><td>Le club hippique (un club par joueur). Depuis le 21/11 (demandes d'Essil) : pansage une fois par jour et plus court ; obstacles décorés ; <b>les prés</b> avec Hamza le palefrenier (3 chevaux par pré, son tableau « qui est où ») ; <b>les boxes</b> à décorer, abreuvoir automatique et balle de foin ; <b>Concours entre nous</b> en ligne (même épreuve en même temps, podium et primes).</td></tr>
    </table></div>
  </section>

  <section class="carte" id="eveil">
    <h2>🌙 Éveil religieux</h2>
    <ul>
      <li>« La vie du Prophète ﷺ » et « Les histoires des prophètes » (film, livre, jeux), la rubrique « Sourate » (Al-Fâtiḥa verset par verset), le livre animé « Nouh et l'arche ».</li>
      <li>Règles : jamais d'image du Prophète ﷺ, d'un prophète, d'un compagnon ni d'un ange ; les versets sont <b>récités par un vrai récitant</b> (cheikh Al-Husary), jamais par une voix artificielle ; pas de batailles ; « selon la tradition » quand un récit est incertain ; <b>tout nouveau texte est relu et validé par toi (ou Imen) avant d'être publié</b>.</li>
    </ul>
  </section>

  <section class="carte" id="images">
    <h2>🎨 Images, vidéos, voix : comment c'est fabriqué</h2>
    <ul>
      <li><b>ComfyUI</b> sur ton ordinateur (gratuit) : les images réalistes (FLUX.2 klein) et les petits films (Wan 2.2). Claude le pilote quand l'ordinateur est allumé avec ComfyUI ouvert ; les fichiers passent par le dossier <code>ComfyUI-Shared</code>. Un nouveau modèle à télécharger demande toujours ton accord.</li>
      <li><b>Higgsfield</b> : plus de crédits ; Claude annonce toujours le prix exact et attend ton accord.</li>
      <li><b>ElevenLabs</b> (ton compte) : les voix et les bruitages.</li>
      <li>Jamais de personnage protégé (dessins animés, jeux vidéo, marques), jamais de photo brute de la famille ni de document scolaire en ligne.</li>
    </ul>
  </section>

  <section class="carte" id="publier">
    <h2>🚀 Les mises à jour</h2>
    <ul>
      <li>Chaque changement fait par Claude est envoyé sur GitHub ; Hostinger met le site à jour tout seul, en général en 1 à 3 minutes, <b>parfois une dizaine</b>.</li>
      <li>Les tablettes voient toujours la dernière version des pages (pas de vieux cache). Si une page semble ancienne : la recharger.</li>
      <li>La documentation complète (pour Claude) est dans le dépôt (<code>CLAUDE.md</code>, <code>docs/</code>), dans le projet Claude « jeu et loisir Amine », et en copie dans ton dossier <code>OneDrive › Amine › grande section › documentation site</code>.</li>
    </ul>
  </section>

  <section class="carte" id="pannes">
    <h2>🛟 En cas de souci</h2>
    <details><summary>Personne ne peut entrer sur le site</summary><p>Fichier vide <code>famille-data/acces-ouvert</code> dans hPanel (le site s'ouvre à tous), puis regarde la porte dans l'administration.</p></details>
    <details><summary>Un enfant a oublié son code</summary><p>Administration › « Les codes secrets des enfants » › Remettre à zéro : il en choisit un nouveau la prochaine fois.</p></details>
    <details><summary>Les sessions font des bêtises</summary><p>Administration › Mettre à l'arrêt (ou fichier vide <code>famille-data/sessions-arret</code>). Tout redevient comme avant ; les codes restent gardés.</p></details>
    <details><summary>Un enfant est bloqué par le temps d'écran</summary><p>Sur sa tablette : « Un parent débloque 15 minutes » (mot de passe parent), ou réponds à sa demande ntfy, ou change ses réglages dans Progression › Réglages. Ou prends la main (pas de limite pendant les essais).</p></details>
    <details><summary>Plus de son sur l'iPad</summary><p>Toucher l'écran une fois (le son repart) ; vérifier le bouton du silence de l'iPad ; si un bouton « 🔊 Touche pour entendre » apparaît, le toucher. La touche V ou le bouton 🗣️ ont peut-être coupé les consignes.</p></details>
    <details><summary>Les voix ne parlent plus (voix de la tablette à la place)</summary><p>Administration › Les voix des cours : clé API ElevenLabs absente, plafond du mois atteint, ou compte ElevenLabs à court de crédits.</p></details>
    <details><summary>Un parent a fait un cours à la place d'un enfant</summary><p>Progression › Suivi › Revenir à l'état d'avant, ou Remettre ce cours à zéro. Avec les sessions en marche, ça n'arrive plus : un parent est toujours en mode explorateur.</p></details>
    <details><summary>Une mise à jour n'apparaît pas</summary><p>Attendre quelques minutes (Hostinger), puis recharger la page. Le numéro de version en bas de l'accueil dit si la mise à jour est arrivée.</p></details>
    <details><summary>Mot de passe administrateur ou parent oublié</summary><p>Administrateur : supprimer <code>famille-data/acces-admin.json</code> puis recréer le compte. Parent : supprimer <code>nahki-voix/auth.json</code> puis en recréer un.</p></details>
  </section>
</main>
<script>
// Chercher dans l'aide : on ne garde que les cartes qui contiennent le mot
const champ = document.getElementById('cherche'), cartes = [...document.querySelectorAll('section.carte')].slice(1);
const sans = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
champ.oninput = () => { const q = sans(champ.value.trim());
  cartes.forEach(c => { const ok = !q || sans(c.textContent).includes(q); c.classList.toggle('cache', !ok);
    if(ok && q) c.querySelectorAll('details').forEach(d => { if(sans(d.textContent).includes(q)) d.open = true; }); }); };
</script>
</body>
</html>
