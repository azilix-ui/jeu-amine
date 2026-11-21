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

## `api/arene.php` et `api/ecuries.php` (21/11)
Deux copies de l'API de Zarbia (salon `hello`/`invite`, parties `create`/`room`/`join`/`update`, relais de messages `sync`), chacune avec sa base dans `famille-data/` : `arene.sqlite` (L'Arène des serpents, 6 joueurs, champ `skin` « tête:corps ») et `ecuries-duel.sqlite` (« Concours entre nous » des Écuries, 6 cavaliers). Elles commencent par `ga_garde_api()`. Le serveur ne fait que passer les messages (gardés 90 s).

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

## Tableau du temps de jeu et « 🙋 Demander plus de temps » (14/11)
- **Accueil** (`index.html`, section `#tdj`) : pour Essil, Salma et Amine, ce qu'il reste à jouer aujourd'hui, la jauge, la pause de nuit, le temps en plus accordé et les demandes en attente. `GET api/famille.php?action=ecran_tous` (toutes les minutes). Caché si l'API ne répond pas.
- **Écran de pause** (`famille.js`) : bouton « 🙋 Demander plus de temps » → `POST action=demande player` → table `demandes` (id, player, jour, ts, jeton, statut attente/oui/non/oubliee, min, maj) et notification **ntfy** (publiée en JSON sur `https://ntfy.sh/`, même canal secret que les alertes de la porte, `ga_canal_ntfy()`, réglé dans l'administration) avec 3 boutons : +15 min, +30 min, Non. Toucher la notification ouvre `api/reponse.php` (+15, +30, +1 h, non).
- `api/reponse.php` : **hors de la porte** (le téléphone n'est pas forcément un appareil de confiance), n'accepte que `d=ID&t=JETON` (32 caractères, usage unique, 12 h ; essais ratés comptés par `ga_note_echec`).
- Une réponse « oui » retire les minutes du temps joué et la tablette de l'enfant (qui relit l'état toutes les 5 s pendant l'attente) lève la pause pendant ces minutes, même la nuit (`famille-ecran-deblocage`). « Non » : l'enfant peut redemander après 30 min ; 6 demandes par jour au plus.
- On peut aussi répondre dans Progression › Réglages (carte de l'enfant : `action=demande_reponse`, mot de passe parent). `ecran_etat()` renvoie `demande` (la dernière du jour) et `now`.

## « Qui es-tu ? » et le mode explorateur (14/11)
- À chaque visite, l'accueil demande « Qui es-tu ? » (`#qui` dans `index.html`). Le choix dure le temps de la visite : `sessionStorage['famille-profil'] = {nom, type:'enfant'|'explo'}` ; `/?profil` (bouton « Changer ») le redemande. Pas de mot de passe (choix du papa).
- **Un enfant** : l'accueil ne montre que ses cours (les liens de sa carte qui ne sont pas dans `jeux/`) et le bandeau des jeux de famille, avec son temps de jeu restant ; `famille-joueur` est mis à son prénom.
- **Papa, maman, Nour, Yasmine, Farès = mode explorateur** (`explorateur.js`, mis par `acces/porte.php` juste après `<head>` dans chaque page) :
  1. bac à sable : `window.localStorage` est remplacé par une couche qui écrit dans `sessionStorage` (`explo:<clé>`) et lit le vrai en dessous ; les vraies données de la tablette ne bougent pas (vérifié) ;
  2. cookie `famille_explo` : `api/famille.php` répond « ok » sans rien enregistrer pour `score`, `progress`, `ecran`, `demande` quand le joueur est Essil, Salma ou Amine ;
  3. le joueur de la visite est l'explorateur (pas de limite de temps) ;
  4. étiquette verte « Explorateur du site : <nom> » **en bas à gauche** de chaque page, **déplaçable** (glisser ; la place est gardée pendant la visite) ; la toucher ouvre le salon (ci-dessous).
- **Un visiteur peut écrire son prénom et choisir son avatar** (Nour, Yasmine ou Farès) : profil `{nom, type:'explo', av}` ; sa tête est enregistrée comme celle d'un joueur (`progress` cours `profil`). Les prénoms de la famille sont refusés.
- **Le salon du site** (tout le monde, `explorateur.js`) : chaque page envoie toutes les 8 s `api/houma.php` `action=site` (client, nom, av, titre de la page) ; on disparaît après 25 s. Toucher l'étiquette : « Sur le site en ce moment » (qui, sur quelle page) → « 💬 Écrire » : discussion privée (`action=ecrit`, 300 caractères, émojis). Les messages privés ont un destinataire (colonne `a` de `messages`) et ne s'affichent pas dans la discussion de Ma Houma. Un enfant n'a pas d'étiquette : une bulle « 💬 Anis : … · Répondre » apparaît (et est lue à voix haute) quand on lui écrit, puis une pastille ronde reste en bas à gauche. Les parents voient aussi les messages privés dans Progression › 💬 Houma en ligne (« → destinataire (privé) »).
- Pied de l'accueil : Progression, **Administration** (`acces/admin.php`), Changer d'avatar.

## Temps passé sur chaque page (16/11)

`site.js` compte le temps où la page est **visible** et l'envoie chaque minute (`POST action=temps page player sec`, et ce qui reste quand on quitte la page). Table `temps (player, page, h, sec)` de `famille.sqlite` : secondes par joueur, par page et par heure (60 jours, comme le journal des visites ; rien n'est noté pour Essil, Salma ou Amine en mode explorateur). L'action `visits` renvoie aussi `temps`. Dans Progression › Vue d'ensemble, survoler (ou toucher) une barre de couleur ouvre une bulle : les coins du site ouverts par cet enfant ce jour-là (ou à cette heure-là), combien de fois et le temps passé. Avant le 16/11, seules les ouvertures sont connues.


## Les voix ElevenLabs des cours (`api/voix.php`, 16/11)
- `GET api/voix.php?l=fr|en&t=<phrase>` (derrière la porte) rend le MP3 de la phrase : français = **Céline | Chaleureuse et immersive** (`3fxbs2pB9bs8S6Z1N38A`), anglais = **Alice - Clear, Engaging Educator** (`Xb7hH8MSUJpSbSDYk0k2`), allemand = **Toni - Clear & Committed for Education** (`tR9bEXIX9ixlxSis0fqv`), latin = Céline sans langue imposée, plus lentement (`l=la`, vitesse 0,8) ; Céline et Toni ajoutées à « Mes voix » du compte (voix de la bibliothèque, sans tarif en plus), modèle `eleven_multilingual_v2`. Changeables par les réglages `voix_fr` / `voix_en` de la base de la porte.
- Chaque phrase est fabriquée **une seule fois** puis gardée dans `famille-data/voix-cache/<voix>/<sha1>.mp3` (hors du dépôt, une sauvegarde ne la perd pas au redéploiement).
- La **clé API** ElevenLabs est tapée par le papa dans l'administration (`acces/admin.php` › 🔊 Les voix des cours) : rangée dans la base de la porte (`reglages.elevenlabs_cle`), jamais renvoyée à la page, jamais dans le dépôt. Plafond de caractères par mois (`voix_max`, 15 000 par défaut ; compteur `voix_compteur`) ; dernière erreur dans `voix_erreur`.
- Sans clé, au-delà du plafond ou si ElevenLabs refuse : 404 / 429 / 502, et la page prend la voix de la tablette.
- Utilisé par le moteur des cours d'Ollie (`salma/ollie/cours.js`) : les sons déjà enregistrés d'abord (`famille-data/lire-voix/ollie/`), sinon `api/voix.php`, sinon la tablette.
- **Présence** (17/11) : `api/houma.php` action `site` garde aussi `url` (l'adresse de la page) ; action **`presents`** (lecture seule, sans se compter) : `{ en_ligne:[{nom, page, url, vu}] }`, pour les pastilles vertes/rouges de l'accueil et la ligne « connecté · sur … · le temps décompte » du tableau du temps de jeu (index.html, `JEUX_SITE` = copie de `JEUX` de famille.js : à garder pareil).
- **`l=ar`** (17/11) : l'arabe, voix **Mohammad - Warm Arabic** (`Hzk6QBi3fCYSXbJEkzKR`, arabe standard, choisie par le papa, ajoutée à « Mes voix », sans tarif en plus). Commentaires de Khyout et de Yajour.
- **`v=jon`** (17/11, en français) : la voix **Jon** (`bJ4Wa440PU9c765nkJkn`, déjà dans « Mes voix »), choisie par le papa pour la voix de papa dans « La vie du Prophète ﷺ » (vitesse 0,92). Liste `VX_AUTRES` dans `api/voix.php`.
- **Le salon du site lit les messages avec la voix de celui qui écrit** (18/11) : `explorateur.js` (`litMessage`) appelle `voix.php?l=fr&v=<prénom>` : `anis` = Jon, `amine` = Lulu (dans `VX_AUTRES`) , `salma` = Lucie, `essil` = Clémence ; Imen et les invités = Céline. L'annonce « Message de … » est dite par la voix du site (Lulu pour Amine). Bouton 🔊 sur chaque message ; rien n'est lu quand la voix est coupée (touche V).
- **Messages vocaux privés** (18/11) : bouton 🎤 dans la conversation du salon (30 s au plus, MediaRecorder) → `api/houma.php` action `voix` avec `a` = le destinataire (même stockage que les vocaux de Ma Houma, `famille-data/houma-voix/`), réécoute ▶ par `?son=ID`. Pour Amine, l'invitation dit « 🎤 Touche le micro ».
- **`&p=amine`** (16/11, 23 h) : en français, la voix « dessin animé » **Lulu - Je lis (Amine)** (`0c3jkkHzeXchq2gHGH2z`, Voice Design du papa, vitesse 0,9).
- **Toutes les pages qui parlent** (16/11, 23 h, demandé par le papa) : `explorateur.js` (mis en tête de chaque page par la porte) remplace `speechSynthesis.speak/cancel/pause/resume` : les phrases en fr/en/de passent par `api/voix.php` (file d'attente, phrases longues coupées à 330 caractères, événements `start`/`end` renvoyés à la page, `speaking`/`pending` exacts) ; autres langues (derja, arabe, latin des anciens cours) et serveur en panne → la voix de la tablette. Pour **Amine** (joueur Amine, ou un enfant dans `/amine/`) → `p=amine` (Lulu) ; papa et maman entendent Céline partout. Les phrases qui changent (nombres, prénoms) coûtent une fois par variante : surveiller le plafond du mois (`voix_max`) dans l'administration.
- **Couper les consignes orales** : touche **V** sur ordinateur (P = pause dans les jeux), bouton 🗣️/🔇 dans le panneau de l'étiquette « Explorateur », bouton « 🗣️ Consignes » du menu du Jasmin · Stage 2. `window.FamilleVoix` = `{ on(), regler(b), basculer(), change(f) }`, réglage gardé sur l'appareil (`localStorage famille-voix`). Les voix enregistrées de Je lis, de l'Épicerie de Lulu, des cours d'Ollie et de Deutsch Express / Via Romana respectent aussi ce réglage.
- **Un seul lecteur de son : `FamilleSon`** (19/11, sons qui sautaient ou tablette muette dans l'Éveil religieux) : sur tablette (surtout iPad), chaque `new Audio()` lancé après une attente (sans toucher l'écran) peut être refusé ; le code passait alors à la voix de la tablette, qui se taisait aussi, et le texte avançait sans le son. Des dizaines de lecteurs ouverts finissaient par faire taire la tablette. `explorateur.js` crée **un seul** élément audio, « débloqué » au premier toucher (un petit silence joué pendant le toucher), réutilisé pour toutes les voix : `FamilleSon.joue(url, {onStart, onTemps(ms), volume})` → `true` fini, `false` arrêté, `null` impossible ; `stop()`, `pause()`, `reprend()`, `precharge(url)` (la voix suivante est demandée pendant que celle-ci joue, pour qu'elle parte en même temps que son texte). Si la tablette refuse quand même, un bouton « 🔊 Touche pour entendre » apparaît et le son repart de là (on ne saute plus la phrase). Autour du micro : `avantMicro()` / `apresMicro()` (`navigator.audioSession` en `play-and-record` puis `playback` : sur iPad le son revient sur le haut-parleur à plein volume après l'écoute, au lieu de l'écouteur du téléphone ; 0,45 s de pause avant de rejouer). La couche des consignes (`speechSynthesis`) passe aussi par ce lecteur. Utilisé par `eveil/prophete/lecteur.js` (les deux saisons), `eveil/sourate/jeu.js` et `eveil/livre/livre.js` ; sans `explorateur.js` (en local), chaque page garde son ancien lecteur.


### Après un appel FaceTime (20/11)
Sur iPad, un appel (FaceTime, téléphone), Siri ou une alarme interrompt le son de la page : les `AudioContext` passent en `interrupted`/`suspended` et l'élément `<audio>` est mis en pause, sans reprise automatique. `explorateur.js` remplace `AudioContext` par un petit constructeur qui garde la liste des moteurs de la page et les relance (`resume`) au retour sur la page (`visibilitychange`, `pageshow`, `focus`) et au premier toucher ; `FamilleSon` se redébloque au toucher suivant et reprend une voix coupée. Le moteur des cours (`salma/ollie/cours.js`) refait un moteur neuf s'il refuse de repartir, et une phrase qui ne peut pas passer par Web Audio passe par `FamilleSon` (bouton « 🔊 Touche pour entendre » si l'iPad refuse).

### Le salon du site, version 2 (20/11)
- Le bouton des messages est toujours visible pour Essil, Salma et Amine. La liste montre toute la famille (`FAMN` dans `explorateur.js`), en ligne ou non ; on peut écrire à quelqu'un qui n'est pas là (il lira plus tard).
- **« Toute la famille »** : messages avec `a = 'Famille'` (`ecrit` et `voix`), acceptés seulement si l'auteur est de la famille (`HL_FAMILLE` dans `api/houma.php`) et renvoyés par `site` seulement à la famille.
- Phrases prêtes, « ding » (Web Audio) à l'arrivée d'un message, nouvelles toutes les 3 s quand le panneau est ouvert (8 s sinon).

## Les sessions par personne (20/11, demandées par le papa)
Interrupteur dans l'administration (`acces/admin.php` › 👤 Les sessions de la famille), **à l'arrêt par défaut** : à l'arrêt, tout marche comme avant. Secours : un fichier vide `famille-data/sessions-arret` arrête les sessions sans l'administration.
- **Code** : `acces/session.php` (fonctions `ga_qui*`, inclus par `garde.php`) et `api/qui.php` (entrer, choisir son code, invité, sortir, rendre ; actions `admin_*` pour l'administration, en-tête `X-Garde: 1` + session administrateur).
- **Base** `famille-data/acces.sqlite` : `qui` (empreinte du jeton, nom, rôle enfant/parent/invite, avatar, appareil de la porte, vu, fin, page, et la prise de main : `ctrl_par`, `ctrl_fin`, `ctrl_ecrit`, `ctrl_retour`), `qui_codes` (code des enfants : type `chiffres` ou `cartes`, empreinte `password_hash` de « n:1234 » ou « c:3-7-1 »), `qui_invites` (prénom et avatar des invités), `qui_echecs` (5 essais par appareil et par personne en 15 min).
- **Cookie `mf_qui`** : jeton aléatoire, HttpOnly, Secure, SameSite=Lax ; la session dure 30 jours et se prolonge quand on revient ; elle ne vaut que sur son appareil de confiance (quand la porte est active).
- **Entrer** : un enfant avec son code secret (4 chiffres ou 3 cartes parmi 🐱🌙⭐🚀🍉🐴⚽🌸🐢, choisi la première fois, remis à zéro par Anis) ; papa et maman avec le mot de passe parent (Anis aussi avec celui de l'administration) ; un invité avec son prénom (déjà rempli s'il vient d'une **invitation**, dont le prénom est maintenant obligatoire, ou s'il a **frappé à la porte**, où le prénom ne peut pas être celui de la famille) et un avatar : une mascotte, ou l'image d'un membre de la famille (`f-amine`… : juste l'image, `Famille.head()` rend alors `img` = l'avatar et `id` = une mascotte pour les jeux qui fabriquent `mascotte-<id>.webp`). Ses scores restent à son nom.
- **Dans les pages** : `acces/porte.php` met `window.FAMILLE_QUI = {actif, nom, role, av, ctrl, v}` avant `explorateur.js` ; `explorateur.js` en fait le profil (enfant → normal ; parent, invité, essais d'Anis → bac à sable) et envoie sur `/?suite=<page>` quand personne n'est entré ; `famille.js` : « Qui joue ? » rend directement le joueur de la session.
- **Ce que le serveur accepte** (`ga_qui_peut_ecrire`) : `api/famille.php` (score, progress, ecran, demande, temps) n'écrit au nom d'un enfant que depuis SA session ; `api/houma.php` remplace `nom`/`de` par le nom de la session (on ne peut ni écrire ni lire les messages d'un autre).
- **Prise de main** (administration, liste des sessions) : « 🔧 Prendre la main » sur la session d'un enfant (30 min ; « enregistrer pour de vrai » en option) : la tablette le voit en moins de 8 s (le salon renvoie `quiv`, la page se recharge), bandeau « 🔧 Papa fait des essais » avec « Rendre la tablette », pas de limite de temps (`ga_qui_libre`), rien n'est enregistré par défaut. « 👀 Voir comme Amine » : la même chose sur l'appareil d'Anis, qui revient ensuite à sa propre session (`ctrl_retour`).

