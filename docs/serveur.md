# Serveur, données et synchronisation

Hébergement Hostinger (PHP + SQLite). Données hors du site public, à côté de `public_html` (sur Hostinger : `domains/missaoui-family.com/`) :

| Dossier | Contenu |
|---|---|
| `famille-data/famille.sqlite` | joueurs, records, progrès, historique, anti-abus |
| `famille-data/ludo.sqlite` | parties de Ludo en ligne |
| `famille-data/houma-ligne.sqlite`, `famille-data/houma-voix/<id>.<webm/mp4>` | Ma Houma en ligne (`api/houma.php`) : présence, messages (600 gardés), messages vocaux, échanges ; compris dans la sauvegarde |
| `famille-data/lire-voix/<voix>/<clé>.mp3` | les voix ElevenLabs de « Je lis ! » (Lulu, Olivier, Jon), déposées par `amine/lire/depot.php` (jeton), servies par `son.php`, listées par `voix.php` ; comprises dans la sauvegarde |
| `nahki-voix/` | `auth.json` (hash du mot de passe parent), `index.json`, `sons/` (voix de Nahki Tounsi) |

## `api/famille.php`

- `GET ?action=ping` ; `GET ?action=highscores&game=G&variant=V&limit=N` ; `GET ?action=auth`.
- `GET ?action=load&player=P&course=C` : relit les progrès gardés sur le serveur, **seulement pour les cours de `READABLE`** = `serpent3d`, `salma-verbes`, `salma-geometrie`, `salma-symetrie`, `salma-monnaie`, `salma-meteo`, `ludo3d`, `grimpeglace`, `jasmin`, `amine-ecriture`.
- `GET ?action=rewards&player=P` : pour les cartes rares de Serpent Légendes. Renvoie `days` (jours d'apprentissage sur 120 jours), `streak` (série en cours), `secrets` (nombre de tranches de 5 jours d'affilée, max 4) et `myth` {alphabet, verbes, polyglotte : {v, goal} ; hydre : {v = enfants actifs cette semaine, done}}. Un « jour d'apprentissage » = un instantané dans `history` pour un cours de `LEARNING` (tous les cours sauf les jeux), en heure de Paris.
- `POST action=score` (player, game ∈ `GAMES` = serpentin, serpent3d, ludo3d, grimpeglace, jasmin ; variant ; score 0–5000, jusqu'à 999 999 pour grimpeglace et jasmin).
- `POST action=progress` (player, course ∈ `COURSES`, data JSON ≤ 30 000 caractères).
- `POST action=setup` (création unique du mot de passe parent), `POST action=summary` (tout pour la page Progression, mot de passe parent).
- Tables : `players`, `scores`, `progress` (dernier état par joueur et cours), `history` (un instantané par heure au plus), `writes` (anti-abus : **240 écritures par 10 min et par adresse** ; toute la maison partage souvent la même adresse).
- `COURSES` : essil-deutsch, essil-latin, salma-english, salma-maths, salma-cheval, salma-verbes, salma-geometrie, salma-symetrie, salma-monnaie, salma-meteo, amine-halloween, amine-tounsi, amine-serpentin, amine-ecriture, serpent3d, ludo3d.

## `api/ludo.php` (parties en ligne)

- `GET ?action=state&code=ABCD` → {v, state} ; `POST action=create state` → {code, v} ; `POST action=push code v state` → {v} ou **409** {v, state} si la version a changé.
- Codes : 4 caractères parmi `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. État ≤ 24 000 caractères. Parties effacées après 12 h d'inactivité. **1500 envois par 10 min et par adresse** (base à part pour ne pas gêner les autres jeux).
- Le serveur ne vérifie pas les règles : ce sont les tablettes qui jouent (famille de confiance).

## `famille.js` (chargé par toutes les pages)

- `Famille.player()`, `Famille.setPlayer(n)`, `Famille.choosePlayer({title, extra, avatar})` (« Qui joue ? » : Essil, Salma, Amine ; `extra` = Anis, Imen ; un autre prénom), `Famille.score`, `Famille.highscores`, `Famille.track(cours, joueur, clés)` (envoi toutes les 15 s et à la fermeture), `Famille.load(cours, joueur)`.
- Joueur courant de l'appareil : `famille-joueur` ; envois en attente hors connexion : `famille-attente`.

## Clés de sauvegarde (localStorage) → cours suivi

| Clé | Cours (serveur) | Joueur |
|---|---|---|
| `essil-deutsch`, `essil-latin` | idem | Essil |
| `salma-stars` | salma-english | Salma |
| `salma-maths`, `salma-cheval`, `salma-verbes`, `salma-geometrie`, `salma-symetrie`, `salma-monnaie`, `salma-meteo` | idem | Salma |
| `amine-bonbons` | amine-halloween | Amine |
| `amine-tounsi-etoiles` | amine-tounsi | Amine |
| `amine-ecriture` | amine-ecriture | Amine |
| `serpentin-best`, `serpentin-pref` | (records `serpentin`) | — |
| `serpent3d:<Prénom>` | serpent3d | chaque joueur |
| `ludo3d:<Prénom>` | ludo3d | chaque joueur |
| `grimpeglace:<Prénom>` | grimpeglace | chaque joueur |
| `jasmin:<Prénom>` | jasmin | chaque joueur |

Synchronisation entre tablettes : pour les cours de `READABLE`, la page relit la copie du serveur au démarrage et garde la plus récente (champ `t`) ; les autres cours restent d'abord sur l'appareil (le serveur garde une copie pour la page Progression seulement).

## Application installable et journal des visites

- **`site.js`**, chargé en tête de **toutes** les pages (avec `<link rel="manifest">`, l'icône Apple et les balises « web app ») : enregistre le service worker et note chaque ouverture de page (`POST action=visit` : page, prénom de « Qui joue ? », appli installée ou non, taille d'écran, site d'origine ; au plus une fois toutes les 10 min par page et par onglet).
- **`manifest.webmanifest`** : « Famille Missaoui » (nom court « Missaoui »), plein écran sans barre du navigateur, raccourcis vers les 3 espaces et Grimpe-Glace. Icônes `icons/` (192, 512, « maskable », Apple 180) faites avec les avatars des 3 enfants et le point rouge du titre.
- **`sw.js`** (service worker, version `missaoui-v1` : l'augmenter pour forcer un grand ménage) : pages, CSS et JS d'abord par le réseau (toujours la dernière version), copie gardée pour le hors-connexion ; images et Three.js d'abord depuis la copie ; API, voix et vidéos toujours par le réseau.
- Bouton **« 📲 Installer l'appli »** sur l'accueil : vraie fenêtre d'installation sur Android / Chrome / Edge, explications pour Safari sur iPad et iPhone (Partager → « Sur l'écran d'accueil »).
- **Journal des visites** (table `visits` : heure, IP, page, prénom, navigateur, appli, écran, origine ; table `geo` : pays, région, ville, fournisseur par IP). L'IP est `REMOTE_ADDR` quand elle est publique (depuis le 13/11 : `X-Forwarded-For` pouvait être inventé), sinon la première adresse publique de `CF-Connecting-IP` / `X-Real-IP` / `X-Forwarded-For`. Le pays et la ville sont demandés à **ip-api.com** (par lots de 100) seulement quand un parent ouvre le journal, puis gardés. **Effacé après 60 jours** (`VISIT_DAYS`). Lecture : `POST action=visits pass days` (mot de passe parent), affichée dans `progression.html` (24 h / 7 / 30 / 60 jours ; visiteurs regroupés par IP, puis toutes les pages ouvertes).

## `progression.html`

Mot de passe parent (le même que les voix). Cartes : Essil (Deutsch, Latin, Serpentin, Serpent Légendes, Ludo), Salma (English Garden, Atelier des Verbes, Marché d'Ollie, Atelier des Formes, Jardin des Nombres, Grand Galop, Serpentin, Serpent Légendes, Ludo), Amine (Ardoise magique, Serpentin, Serpent Légendes, Ludo, cagnotte, Nahki). Gains de la semaine, records Serpentin, dernières parties (tous jeux), autres joueurs (amis invités), **journal des visites**.

**Mot de passe oublié** : supprimer `nahki-voix/auth.json` dans le gestionnaire de fichiers hPanel, puis en recréer un (les sons sont conservés).

## Suivre un cours, revenir en arrière, remettre à zéro (10/11)

Demandé par le papa : un soir, c'est lui qui a parcouru le cours d'anglais de Salma ; il faut pouvoir le remettre « comme pas vu ».

- **Progression › 🧭 Suivre un cours et revenir en arrière** (en haut de la page) : on choisit un enfant puis un cours ; le tableau montre les instantanés (un par heure d'activité au plus, 120 jours) avec où il en était et ce qu'il a gagné. « ↩ Revenir à cet état » remet le cours comme à cette date (ce qui a été fait après est oublié) ; « 🗑 Remettre ce cours à zéro » efface tout (pour un jeu, une case permet d'effacer aussi ses records des classements).
- **Serveur** : `POST action=reset pass player course [history=<id>] [scores=1]` ; la table `resets (player, course, ts, data)` garde la date et l'état voulu (`data` vide = zéro). `GET ?action=resets&player=&course=` le relit.
- **Tablettes** : `Famille.track` demande d'abord `resets` ; si la date est plus récente que celle déjà appliquée (`famille-rst:<cours>:<Prénom>`), les clés du cours sont vidées (ou remises à l'état choisi) et la page se recharge. Un envoi de progrès qui ne connaît pas la dernière remise à zéro (champ `rst`) est **refusé** par le serveur, qui renvoie la remise à appliquer : une tablette restée ouverte ne peut donc pas réécrire l'ancien état.
- Les jours d'apprentissage (séries, cartes secrètes) viennent de l'historique : un retour en arrière les corrige aussi.
- Limite : les coloriages de l'Atelier restent sur la tablette ; une remise à zéro de l'Atelier les vide à la prochaine visite sur cette tablette.

## Cache et sécurité (`.htaccess`)

- Bloque en ligne tous les `.md`, `package.json`, `build.js`, `.gitignore`.
- `Cache-Control: no-cache, must-revalidate` pour html/css/js (les tablettes voient toujours la dernière version).
- Redirections 301 des anciens liens des jeux d'Amine vers `/amine/…`.

## Têtes des invités (05/11)
- `famille.js` : dans « Qui joue ? », un invité écrit son pseudo et choisit sa tête parmi les mascottes (`Famille.mascots` : nour, yasmine, fares). `Famille.head(nom)` renvoie la mascotte d'un invité (null pour la famille ; à défaut de choix, une mascotte tirée du pseudo). Gardé dans `localStorage['famille-tetes']` et envoyé au serveur comme progrès du « cours » `profil` (`{tete:id}`).
- API : `GET ?action=heads` → `{heads:{pseudo:id}}` (lu par `Famille.loadHeads()` au démarrage des jeux, pour les classements). `profil` est dans `COURSES` et `READABLE` ; la page Progression l'ignore.

## Discussion de Ludo en ligne (10/11)

- Table `chat (id, code, ts, seat, name, text)` dans `ludo.sqlite`, à part de l'état de la partie : un message ne peut pas faire échouer un coup.
- `POST action=chat code seat name text` → `{id}` (texte de 1 à 120 caractères, prénom de 24 au plus, caractères de contrôle retirés, même limite d'envois que les coups). On garde les 60 derniers messages par partie ; ils disparaissent avec la partie (12 h).
- Lecture sans requête en plus : la tablette ajoute `since=<dernier id>` à son `GET action=state` (une fois par seconde) et reçoit `chat: [...]`.
- Côté page (`jeux/ludo-legendes.html`) : `chatSend`, `chatReceive`, `chatAdd` ; tout est affiché avec `textContent` (aucun HTML venant d'un message). Un message fait seulement d'emojis s'envole à l'écran ; un texte s'affiche en bulle. L'historique reçu en rejoignant la partie est rangé dans la fenêtre sans animation.

## Progression : tableau de bord en rubriques (10/11)

`progression.html` affiche six onglets (`TABS`, fonction `draw()`), mémorisés dans `sessionStorage` (`prog-tab`, `prog-kid`, `prog-days`). Les données viennent des deux mêmes appels qu'avant : `summary` (progrès, historique de 120 jours, records) et `visits` (30 jours chargés une fois, 60 si on le demande ; le filtre de période se fait dans la page). Les « activités des enfants » sont les lignes du journal des visites qui portent le prénom d'un enfant, regroupées par page et par jour (`activiteHTML`) ; les « progrès » sont les écarts entre deux états successifs de l'historique (`gains()`). Limite : une page n'est notée qu'une fois toutes les 10 minutes, on compte donc des ouvertures, pas un temps passé.

## Salon de Ludo (10/11)

- Tables `presence (client, name, tete, status, code, ts)` et `invites (dest, name, tete, code, ts)` dans `ludo.sqlite`.
- `POST action=hello client name tete status code` toutes les 4 s (onglet visible seulement) → `{online, invites}` : les joueurs vus depuis moins de 15 s (40 au plus), et les invitations reçues (valables 40 s, effacées une fois lues). `status` : `menu`, `salon` (avec le code de sa partie en attente), `joue`, `machine`.
- `POST action=invite client name tete to code` (limite d'envois comme les coups ; la partie doit exister).
- `client` = identifiant aléatoire de la tablette (`ludo-client` dans le navigateur). Le salon est visible par toute personne qui ouvre la page du Ludo : il n'y a pas de mot de passe.

## Les coloriages de l'Atelier sur le serveur (11/11)

Cours **`atelier-art`** (dans `COURSES` et `READABLE`) : clé `atelier-traits:<Prénom>` = `{ rst, items:{ <dessin>:[date, [[x, y, couleur, motif], …]] } }`. Taille limite à part (`BIG` dans `api/famille.php` : 400 000 octets au lieu de `MAX_DATA` = 30 000), **pas d'historique** et absent du résumé de Progression (trop lourd). Au-delà de 64 Ko, l'envoi « en partant » (`sendBeacon`) est refusé par le navigateur : `famille.js` retombe sur l'envoi normal, et l'envoi toutes les 15 s fait le reste.


## La porte du site (accès réservé, 13/11/2026)

Demandé par le papa : le site n'est ouvert qu'à la maison, aux appareils de confiance et aux invités. Dossier `acces/` :

| Fichier | Rôle |
|---|---|
| `acces/garde.php` | la bibliothèque (fonctions `ga_*`) : base `famille-data/acces.sqlite` (tables `reglages`, `ips`, `appareils`, `invitations`, `sessions`, `refus`, `echecs`), compte `famille-data/acces-admin.json` (identifiant + empreinte du mot de passe), `ga_peut_entrer()`, `ga_garde_api()` |
| `acces/porte.php` | toutes les pages `.html`, les dossiers et `photos/` y passent (règles `mod_rewrite` dans `.htaccess`) : page servie si l'appareil est de confiance, sinon redirection vers `/acces/?suite=…` (photos : 403) |
| `acces/index.php` | la page « accès réservé » (avatars de la famille, connexion administrateur) ; la première fois : création du compte administrateur, avec le **mot de passe parent** comme preuve |
| `acces/invitation.php?c=…` | un lien d'invitation : page de bienvenue + bouton « Entrer » (c'est le bouton qui donne l'accès, pas l'aperçu automatique de WhatsApp) |
| `acces/admin.php` | l'administration (Anis) : activer / mettre en pause, adresses IP de la maison, invitations (durée du lien 1 h à 30 j, durée de l'accès 1 j à 1 an, 1 / 3 / 5 / illimité appareils), appareils de confiance (renommer, retirer), visites refusées (60 j), mot de passe |
| `acces/porte.css` | le style commun de ces pages |

- **Sauvegardes** (13/11) : une fois par semaine, après la première page servie (le visiteur n'attend pas : `litespeed_finish_request`), `ga_sauvegarde()` fait `famille-data/sauvegardes/sauvegarde-AAAA-MM-JJ.zip` : les bases SQLite copiées avec `VACUUM INTO`, les `.json` de famille-data, et tout `nahki-voix/`. 8 gardées. Administration › « Les sauvegardes » : liste, ⬇️ Télécharger (`admin.php?telecharger=…`, session administrateur), « Faire une sauvegarde maintenant ». **Restaurer** : dézipper dans le dossier au-dessus de public_html (hPanel › Gestionnaire de fichiers), en remplaçant `famille-data/` et `nahki-voix/`.
- **Alertes** (13/11) : quand un appareil écrit son prénom et frappe, `ga_alerte()` envoie un e-mail (`mail()`, adresse dans `reglages.alerte_email`, réglée par Anis dans l'administration : **jamais dans le code**, le dépôt est public) et une notification **ntfy** (`https://ntfy.sh/<canal secret>`, `reglages.alerte_ntfy`, tiré au hasard ; Anis s'abonne dans l'appli ntfy). 10 par heure au plus, bouton « Envoyer une alerte d'essai ».
- **Les appareils qui frappent à la porte** (13/11, demandé par le papa) : un appareil refusé reçoit un cookie `mf_demande` (30 jours, table `demandes` ; les robots ne sont pas notés). Sur la page « Accès réservé » il peut écrire son prénom et « Frapper à la porte » (statut `attente`, la page demande toutes les 5 s si c'est accepté). Dans l'administration, Anis voit ces appareils (prénom, appareil, IP, pages) et touche « Faire confiance » (1 jour à 1 an) : l'appareil reçoit sa carte de confiance à sa page suivante, où qu'il soit.

- **Appareil de confiance** = cookie `mf_appareil` (jeton aléatoire ; la base garde son empreinte SHA-256), `HttpOnly`, `Secure`, `SameSite=Lax`. Viennent de : la maison (IP enregistrée → carte valable un an, gardée ensuite hors de la maison), la connexion d'Anis (un an), une invitation (durée choisie). Session administrateur : cookie `mf_admin`, 12 h, `SameSite=Strict` ; actions en `POST` JSON avec l'en-tête `X-Garde: 1`.
- **Adresse IP** : `REMOTE_ADDR` (chez Hostinger, le CDN y met déjà la vraie adresse du visiteur, vu le 13/11 ; `X-Forwarded-For` peut être inventé par le visiteur, testé) ; `X-Forwarded-For` (adresse la plus à droite) seulement si la connexion vient d'une adresse privée (relais). En IPv6, même bloc /64 = même maison. Le détail brut est affiché dans « Secours et détails techniques » de l'administration.
- **API** (`api/famille.php`, `api/ludo.php`, `api/houma.php`, `api/mur.php`, `amine/voix/api.php`) : `ga_garde_api()` répond 401 aux appareils inconnus. Les images, sons, scripts et vidéos des jeux restent publics (seules les pages et les photos de famille sont gardées).
- **Tant que la protection n'est pas activée** (ou sans compte administrateur), tout le monde entre comme avant. Une panne de la porte (exception) laisse entrer, pour ne jamais enfermer la famille dehors.
- **Secours** : un fichier vide `famille-data/acces-ouvert` (gestionnaire de fichiers hPanel) ouvre le site à tous. Mot de passe administrateur oublié : supprimer `famille-data/acces-admin.json`, puis recréer le compte (mot de passe parent). Trop d'essais : 8 par 15 min et par adresse.
- Test en local : `php -S` avec un routeur qui imite les règles `.htaccess` (voir le journal du 13/11).


## Temps d'écran, défi du jour, joueurs (14/11)

- `api/famille.php` : tables `reglages` (k, v JSON ; `ecran` = {Essil:{on, semaine, weekend, nuit, matin, nuit_we, matin_we}, …} ; `nuit_we` = pause nuit du vendredi et du samedi soir, `matin_we` = reprise du samedi et du dimanche matin (ajoutés le 14/11 ; par défaut les heures de la semaine) : le serveur envoie à la tablette les heures du moment) et `ecran` (player, jour « AAAA-MM-JJ » heure de Paris, sec).
  - `GET ?action=ecran&player=P` → {libre, jour, limite (s, + 600 si le défi du jour est réussi), bonus, utilise, nuit, matin, weekend} ; `{libre:true}` pour un joueur qui n'est pas un enfant.
  - `POST action=ecran player sec` (60 s au plus par envoi, envoyé chaque minute de page visible par `famille.js`).
  - `POST action=reglages pass data={ecran:{…}, ecran_plus:{Amine:15}}` (Progression › Réglages) ; `POST action=ecran_plus pass player min` (« Un parent débloque 15 minutes » sur l'écran de pause).
  - `POST action=joueur_fusion pass player vers` (scores, historique, progrès et visites passent au bon prénom ; un cours déjà commencé par le bon prénom garde ses progrès) ; `POST action=joueur_supprime pass player`.
  - `summary` renvoie aussi `ecran` et `aujourdhui`.
- Cours ajoutés : `defi` (défi du jour) et `amine-lecture` (Je lis !), dans `COURSES`, `READABLE` et `LEARNING`.
- `api/mur.php` : le mur de la famille (voir `docs/contenus.md`), gardé par la porte comme les autres API.

## `api/houma.php` (Ma Houma en ligne, 14/11)
- `salut` (toutes les 3 s : client, nom, lieu, chez, depuis) → qui est là (15 s), nouveaux messages, échanges qui me concernent. `dit` (texte), `voix` (fichier audio vérifié : webm, mp4, ogg, wav ; 1,5 Mo, 60 s), `montre` (lieu), `?son=ID`.
- Troc : `propose` → `repond` (contre ou non) → `conclut` (oui/non, par celui qui a proposé) ; `annule` ; `applique` (le receveur, une seule fois). États : offre, contre, fait, non, annule, perime (2 jours).
- Parents (mot de passe parent) : `historique` (600 messages, 200 échanges), `efface`. Onglet « 💬 Houma en ligne » de Progression.
- Limite : 120 envois par adresse et par 10 minutes. Seuls les appareils de confiance passent (`ga_garde_api()`).

