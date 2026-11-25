# Mechmoum : le réseau de la famille (/reseau/)

**https://www.missaoui-family.com/reseau/** : un réseau privé à la façon d'Instagram, pour la famille et ses invités. *Mechmoum* (مشموم), c'est le petit bouquet de jasmin que l'on porte à l'oreille en Tunisie. Il est fait le 25/11/2026, à la demande du papa : il voulait « transformer le mur de la famille en un mur inspiré d'Instagram ». L'ancien mur (`mur.html`) reste en ligne et donne un lien vers Mechmoum.

## 1. D'où vient le code (analyse et licence)

- **Le dépôt d'abord proposé** (`AhmadZHassouneh/instagram-clone`) **n'a pas de licence** : on ne peut pas le réutiliser. Le papa a choisi un autre projet libre.
- **Le dépôt utilisé** : `rohityadav-sas/instagram-clone`, licence **MIT** (Rohit Yadav, 2025). Le texte de la licence est dans `reseau/LICENCES.txt` (en ligne) et dans `docs/reseau/front/LICENSE-instagram-clone.txt`.
- **Son architecture d'origine** :
  - l'interface : Next.js 15, React 19, Tailwind 4, TanStack Query, zustand, Radix UI, framer-motion ;
  - le serveur : Express et MongoDB ;
  - les comptes : better-auth (e-mail, Google, GitHub) ;
  - les photos : Cloudinary ;
  - le temps réel : Socket.IO.
- **Ce qu'il faisait** : publications (photo), stories, j'aime, commentaires, enregistrements, abonnements, blocage, recherche, notifications et messages privés.
- **Ce qui ne pouvait pas aller sur Hostinger** : le serveur Node permanent, MongoDB, Socket.IO et Cloudinary. Le papa a choisi l'option 1 :
  - on garde l'**interface** du projet, adaptée et compilée en pages fixes ;
  - on **réécrit le serveur en PHP + SQLite** dans le site, derrière la porte, avec les comptes de la famille ;
  - le temps réel se fait par **interrogation toutes les 2,5 s** ;
  - on **ajoute les Reels**.

## 2. Les fichiers

| Où | Quoi |
|---|---|
| `reseau/` | l'interface compilée (`next build`, export statique, `basePath: /reseau`) : `index.html`, `explore/`, `reels/`, `messages/`, `notifications/`, `search/`, `u/` (profil, `?n=nom`), `p/` (une publication, `?id=`), `login/`, `inscription/` (`?code=`), `admin/`, `_next/` |
| `reseau/api/index.php` | le serveur : toutes les routes `/reseau/api/…` (le `.htaccess` du dossier y renvoie tout) |
| `reseau/api/lib.php` | les aides : base, sessions, droits, limites d'essais, réception et service des photos et vidéos |
| `reseau/api/admin.php` | l'administration (tableau, membres, signalements, contenus, invitations, réglages, journal, sauvegarde) |
| `reseau/sw.js`, `enregistre-sw.js`, `manifest.webmanifest`, `icone-*.png` | l'application à installer (PWA) |
| `famille-data/reseau/mechmoum.sqlite` | la base (hors du site public, un redéploiement n'y touche pas) |
| `famille-data/reseau/media/` | les photos et vidéos envoyées |
| `famille-data/reseau/mechmoum-sauvegarde-*.zip` | les 3 dernières sauvegardes |
| `docs/reseau/front/` | **le code source de l'interface** (TypeScript, à reconstruire) |
| `docs/reseau/construit.sh` | reconstruit l'interface et la recopie dans `reseau/` |

## 3. Les comptes et l'entrée

- **La famille** (Anis, Imen, Essil, Salma, Amine) a ses comptes, créés tout seuls avec les avatars du site. Tout le monde s'abonne à tout le monde. Ils ont le badge vert « famille ».
- **Entrer** : celui qui est déjà entré sur le site (« Qui es-tu ? » et son code, ou le mot de passe parent) entre d'un toucher : « Entrer comme … ». L'administrateur du site entre comme Anis.
- **Les invités** :
  - Anis crée un **lien d'invitation** dans l'administration (pour qui, durée de 1 à 30 jours, 1 à 10 comptes) ;
  - l'invité choisit son nom d'utilisateur et un mot de passe de 10 caractères au moins ;
  - il s'abonne tout seul à Anis et Imen ;
  - le lien n'est montré qu'une fois : la base ne garde que son empreinte (SHA-256).
- **La porte du site** reste devant Mechmoum. Un invité « limité » du site n'y entre que si Anis a coché le coin « 🌼 Mechmoum » dans son invitation du site (`acces/garde.php`, coin `reseau`).

## 4. Ce que fait Mechmoum

- **Publications** :
  - photo, ou vidéo qui devient un reel (la vignette est prise dans la vidéo par le navigateur) ;
  - légende, j'aime (double toucher), commentaires, enregistrer ;
  - menu « … » : signaler, supprimer, suivre ;
  - les vidéos se lancent sans le son quand elles sont à l'écran.
- **Stories** :
  - photo ou vidéo, pendant 24 h ;
  - le visionneur plein écran : toucher à gauche pour reculer, à droite pour avancer, appui long pour la pause ;
  - sur sa propre story : « vue par … » et supprimer ;
  - sur celle d'un autre : signaler.
- **Reels** : les vidéos l'une après l'autre en plein écran, en glissant vers le haut, avec j'aime, commentaires et enregistrer.
- **Profils** :
  - onglets Publications, Reels et Enregistrés ;
  - abonnés et abonnements ;
  - Modifier le profil (photo, prénom, bio, pronom ; les comptes de la famille gardent leur nom) ;
  - Paramètres (mot de passe, déconnecter les autres appareils, se déconnecter, supprimer son compte, pour les invités seulement) ;
  - bloquer, signaler, « Écrire ».
- **Messages privés** :
  - conversations, « en train d'écrire… », « Vu ✓✓ », en ligne ;
  - sur téléphone, la liste ou la conversation, avec un bouton retour.
  - **Les enfants** (Essil, Salma, Amine) n'échangent qu'avec la famille, sauf si Anis l'ouvre dans les réglages.
- **Notifications** : j'aime, commentaires et abonnements, avec la pastille sur l'icône.
- **Découvrir et Rechercher** : les membres et les légendes.
- **Tout est en français.** Les dates sont écrites « il y a 3 min ». Les cibles font au moins 44 à 48 px.

## 5. Écrans (PC, iPad, iPhone, Android)

- **PC** : une colonne de navigation avec les noms, et à droite « Suggestions pour toi ».
- **iPad** : la même colonne en icônes. En paysage, la publication ouverte s'affiche à côté des commentaires.
- **Téléphone** : une barre en haut (logo, administration, notifications, messages) et une barre en bas (accueil, découvrir, publier, reels, profil). Les marges de l'iPhone (encoche, barre du bas) sont respectées.
- Le logo et les couleurs sont inventés pour Mechmoum : jasmin blanc sur sarcelle et bleu, polices Nunito et Lobster **copiées dans le site** (Fontsource, pas de Google Fonts).
- Testé avec Playwright en 1440×900, 820×1180, 1180×820, 390×844 et 412×915 : toutes les pages s'affichent, sans erreur JavaScript.

## 6. L'administration (`/reseau/admin/`)

Anis (rôle admin, ou administrateur du site) voit tout. Un **modérateur** (rôle donné par Anis) voit seulement les signalements, les contenus et le journal.

- **Tableau de bord** :
  - membres, en ligne, actifs sur 7 jours, publications, reels, stories, commentaires, messages, signalements ouverts, contenus masqués, invitations, place des fichiers ;
  - les **réglages** : réseau privé (sur invitation, activé par défaut), inscriptions ouvertes, enfants qui peuvent écrire aux invités (désactivé par défaut).
- **Signalements** (raisons simples : méchant, fait peur, privé, faux, autre) : masquer, supprimer, suspendre l'auteur, ou « ce n'est rien ».
- **Contenus** : les 100 dernières publications, commentaires et stories, avec masquer, réafficher et supprimer.
- **Membres** :
  - suspendre ou réactiver (la session est coupée) ;
  - rôle membre, modérateur ou administrateur ;
  - mot de passe provisoire, montré une fois ;
  - supprimer un invité avec tout son contenu.
  - Le compte d'Anis est protégé, et les comptes de la famille ne se suppriment pas.
- **Invitations** : créer, voir qui s'est inscrit, retirer.
- **Journal** : chaque action d'administration, chaque connexion et chaque inscription.
- **Sauvegardes** : faire une sauvegarde, puis télécharger le .zip.

## 7. Sécurité

- **Sessions** :
  - un jeton aléatoire de 32 octets dans le cookie `mch_s` (HttpOnly, SameSite=Lax, Secure en https, chemin `/reseau/`) ;
  - la base n'en garde que l'empreinte ;
  - la session dure 30 jours.
- **Mots de passe** : `password_hash` (bcrypt, re-haché si besoin), 10 caractères au moins.
- **Essais limités** :
  - connexion : 8 par adresse IP et 6 par nom en 15 minutes, avec un petit délai à chaque échec ;
  - inscription : 10 par heure ;
  - signalements : 20 par heure ;
  - messages : limités aussi.
- **Requêtes forgées** : tout ce qui n'est pas un GET exige l'en-tête `X-Mechmoum: 1`, qu'un autre site ne peut pas envoyer sans autorisation CORS.
- **Fichiers** :
  - le type est vérifié par le contenu (`finfo`), pas par le nom ;
  - les **photos sont ré-encodées** en WebP par GD : cela enlève l'EXIF, donc la position GPS du téléphone, redresse l'orientation, et limite la taille à 1440 px ; 15 Mo au plus ;
  - les vidéos : mp4, mov ou webm, 80 Mo au plus ;
  - les fichiers ont des noms aléatoires, hors du site public ;
  - ils sont servis **seulement à un membre connecté**, avec `nosniff` et la lecture par morceaux (Range) pour l'iPhone.
- **Données** :
  - chaque route vérifie la session ;
  - les comptes bloqués et suspendus sont cachés partout ;
  - un contenu masqué disparaît ;
  - l'API ne passe jamais par le cache du service worker ;
  - toutes les requêtes SQL sont préparées.
- **La porte du site** reste en plus devant tout (`ga_garde_api()`).

## 8. L'application à installer (PWA)

- `manifest.webmanifest` (portée `/reseau/`, icônes 192, 512 et masquable, raccourcis Reels et Messages), `apple-touch-icon` 180 px.
- `sw.js` :
  - les fichiers de `_next/static/` viennent du cache d'abord ;
  - les pages viennent du réseau d'abord, avec la copie gardée hors connexion ;
  - l'API ne passe jamais par le cache.
- Le service worker du site (`/sw.js`, version `missaoui-v6`) laisse maintenant `/reseau/` à celui de Mechmoum.
- **Installer** :
  - iPad ou iPhone (Safari) : Partager → « Sur l'écran d'accueil » ;
  - Android (Chrome) : menu → « Installer l'application » ;
  - PC (Chrome ou Edge) : l'icône d'installation dans la barre d'adresse.

## 9. Les bugs du projet d'origine (corrigés)

- Le fil n'affichait pas ses propres publications.
- La date « 2 hours ago » était écrite en dur sous chaque publication.
- Le menu « … » utilisait la même clé de cache pour tous les auteurs : l'état « suivre » était faux.
- Les auteurs des commentaires de Découvrir n'étaient pas chargés. Le champ `full_name` n'existe pas.
- On recevait une notification pour son propre commentaire, et l'auteur d'une publication ne pouvait pas supprimer les commentaires reçus.
- Le visionneur de stories appelait « story suivante » à l'intérieur d'une mise à jour d'état (double saut possible).
- Les écouteurs de messages et de notifications étaient ajoutés à chaque affichage et `off()` enlevait ceux des autres composants.
- Le message provisoire n'était pas retiré en cas d'échec (mauvais identifiant).
- La bio ne pouvait pas être vidée.
- Les images `next/image` oubliaient le `basePath`.
- Le profil était bloqué à 12 publications.

## 10. Déployer

1. Modifier le code dans `docs/reseau/front/src/`.
2. `sh docs/reseau/construit.sh` : il faut Node 20 ou plus. La commande construit dans un dossier temporaire et recopie dans `reseau/` sans toucher à `reseau/api/`.
3. Tester en local :
   - lancer `php -S 127.0.0.1:8775 -t . routeur.php`, avec un petit routeur qui renvoie `/reseau/api/` vers `reseau/api/index.php` et les pages vers `acces/porte.php` ;
   - la base locale se crée dans `../famille-data/reseau/` ;
   - les tests Playwright couvrent les pages en 5 tailles, plus le parcours : publier une photo, un reel et une story, commenter, signaler, traiter dans l'administration, inviter, s'inscrire, le lien qui ne sert qu'une fois, un invité qui ne peut pas écrire à un enfant.
4. `python3 docs/outils/verifie_js.py`, `sh docs/outils/version.sh`, commit, push. Hostinger publie en 1 minute environ.
5. Le serveur PHP (`reseau/api/*.php`) se modifie directement : pas de construction.

## 11. Sauvegarder et restaurer

- **Sauvegarder** : Administration → Sauvegardes → « Faire une sauvegarde maintenant », puis **Télécharger**.
  - Le .zip contient `mechmoum.sqlite` (une copie propre faite par `VACUUM INTO`, même pendant que le site tourne), le dossier `media/` et un `LISEZMOI.txt`.
  - Le serveur garde les 3 dernières. Il faut en garder des copies sur l'ordinateur (OneDrive).
- **Restaurer** (hPanel → Gestionnaire de fichiers, ou FTP) :
  1. Si possible, mettre le réseau en pause : Administration → Réglages → couper « Inscriptions ouvertes », et prévenir la famille.
  2. Dans `famille-data/reseau/`, renommer la base actuelle en `mechmoum.sqlite.ancienne` et le dossier `media` en `media.ancien`.
  3. Envoyer le `mechmoum.sqlite` du .zip et son dossier `media/` à la même place.
  4. Supprimer les fichiers `mechmoum.sqlite-wal` et `mechmoum.sqlite-shm` s'ils existent.
  5. Ouvrir `/reseau/` : on doit retrouver les publications. Si tout va bien, supprimer `.ancienne` et `.ancien` quelques jours plus tard.
- **Perte totale du site** : le dépôt GitHub redonne tout le code. Il suffit de remettre `famille-data/reseau/` depuis la dernière sauvegarde.

## 11 bis. Filtres et musique (26/11)

- **Filtres** (à la publication d'une photo ou d'une vidéo) : Normal, Jasmin, Sidi Bou, Sahara, Kairouan, Vif, Doux, Vintage, Noir et blanc (`docs/reseau/front/src/lib/filtres.ts`, liste aussi dans `MC_FILTRES` de `lib.php`).
  - Le filtre est **gardé à part** (`posts.filtre`) et appliqué à l'affichage (CSS `filter`) : la photo ou la vidéo d'origine reste intacte.
  - Il marche sur tous les navigateurs, même anciens.
- **Musique** sur une photo ou une vidéo :
  - **les 14 morceaux du mur** de la famille, écoutables avant de choisir ; un morceau est copié une seule fois dans Mechmoum (`mc_musique_biblio`, réglage `mur-musique-<id>`) ;
  - ou **son propre morceau** (mp3, m4a, wav, ogg ; 15 Mo au plus ; `mc_recoit_son`), effacé avec la publication ;
  - réglage des volumes : son de la vidéo et musique.
  - La musique est jouée par-dessus : sur une vidéo, elle suit la lecture ; sur une photo, on touche 🔊 ; une étiquette « ♪ titre » s'affiche.
  - Champ `posts.musique` = « clé|volume vidéo|volume musique|titre|p » (p = morceau envoyé).
  - Route `GET /reseau/api/musiques` (la musicothèque, lue dans `mur/musique/liste.js`).
- **Droits** : Mechmoum est privé, mais une chanson du commerce reste protégée. Mieux vaut des morceaux à soi ou libres.
- Les stories n'ont pas encore de filtre ni de musique.

## 12. L'ancien mur recopié (26/11)

- **Administration › Tableau de bord › « 🧱 L'ancien mur de la famille »** : le bouton « Recopier les N dans Mechmoum » copie les photos, les dessins et les vidéos du mur (`famille-data/mur.sqlite` et `famille-data/mur/`) en publications de Mechmoum. Ce sont des **copies** : le mur n'est ni effacé ni changé.
- **Ce qui est gardé** :
  - la date d'origine, le texte et l'auteur ; « Papa » et « Maman » vont aux comptes d'Anis et d'Imen ;
  - un invité du mur, qui n'a pas de compte, passe sur le compte d'Anis, avec « 📌 Prénom : » devant le texte ;
  - les commentaires.
- **La musique des vidéos** : celle d'une vidéo envoyée « d'origine » (jouée par-dessus) est copiée une fois dans Mechmoum et rejouée pendant la vidéo, avec les volumes choisis (colonne `posts.musique`). Les autres vidéos ont déjà la musique dedans.
- **Ce qui n'est pas copié** :
  - les réactions emoji du mur (elles étaient anonymes) ;
  - les messages sans image (ils restent sur le mur).
- On peut relancer sans risque : chaque message n'est copié qu'une fois (tables `import_mur`, `import_mur_com`). Le travail se fait par paquets de 20, et l'écran relance tout seul.
- Route : `GET/POST /reseau/api/admin/migrer-mur` (Anis seulement).

## 13. Combien de temps les choses restent

- **Publications, reels, commentaires, messages privés, profils** : **sans limite de temps**, jusqu'à ce que l'auteur ou l'administration les supprime. La seule limite est la place de l'hébergement (voir « Photos et vidéos » dans le tableau de bord).
- **Stories** : visibles 24 h. Leurs fichiers sont **effacés du serveur 2 jours après** (ménage fait de temps en temps, `mc_menage()`).
- **Notifications** : celles qui sont lues partent après 6 mois.
- **Sessions** : 30 jours sans revenir. Les essais de connexion ratés sont gardés 24 h, les événements du temps réel 1 h.
- **Sauvegardes** : les 3 dernières restent sur le serveur.
- **L'ancien mur** (`mur.html`) : ses photos, vidéos et messages restent aussi sans limite de temps, jusqu'à ce qu'on les efface.

## 14. Ce qui reste possible

- Pas encore de notifications « push » sur le téléphone : on voit les nouveautés en ouvrant l'application.
- Le temps réel se fait par interrogation : 2,5 s quand la page est ouverte, 15 s quand l'onglet est caché.
