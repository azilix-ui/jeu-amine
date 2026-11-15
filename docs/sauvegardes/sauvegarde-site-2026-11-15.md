# Sauvegarde du site de la famille Missaoui — 15/11/2026

https://www.missaoui-family.com · dépôt GitHub `azilix-ui/jeu-amine` (branche `main`) · version 3.174 · dernier changement ab88795 15/11/2026 12:58

Ce fichier réunit toute la documentation du site en un seul document : la fiche du projet (`CLAUDE.md`) puis chaque fichier de `docs/`. Le code et les images sont dans le dépôt GitHub ; les données (bases SQLite `famille-data/`, voix `nahki-voix/`) sont sur Hostinger, à côté de `public_html`.

## État du dépôt

2135 fichiers, 178 Mo.

| Dossier | Fichiers |
|---|---|
| `jeux` | 1600 |
| `salma` | 263 |
| `amine` | 105 |
| `essil` | 59 |
| `docs` | 52 |
| `(racine)` | 21 |
| `photos` | 18 |
| `acces` | 6 |
| `api` | 5 |
| `icons` | 5 |
| `lib` | 1 |

## Sommaire

1. `CLAUDE.md`
2. `PRODUCT.md`
3. `docs/contenus.md`
4. `docs/higgsfield.md`
5. `docs/jeux-3d.md`
6. `docs/journal.md`
7. `docs/serveur.md`
8. `docs/videos.md`


---

# `CLAUDE.md`

## Famille Missaoui — mémoire du projet

À lire avant toute modification du site. Cette fiche donne l'essentiel ; le détail est dans `docs/`.

| Fichier | Contenu |
|---|---|
| `CLAUDE.md` | cette fiche : la famille, l'arborescence, la publication, les règles |
| `docs/contenus.md` | chaque cours et jeu, enfant par enfant : ce qu'il fait, ses fichiers, ses sources |
| `docs/jeux-3d.md` | Serpent Légendes, Ludo Légendes (en ligne), Grimpe-Glace, La Légende du Jasmin (et le Jasmin 2), L'Atelier du Jasmin (coloriage), Les Écuries d'Essil (club hippique), Médina Express (course infinie), Ma Houma (monde libre tunisien), collections, tickets du savoir |
| `docs/serveur.md` | PHP + SQLite, API, clés de sauvegarde, synchronisation, Progression (suivi, retour en arrière, remise à zéro), limites |
| `docs/higgsfield.md` | images et vidéos générées, crédits dépensés, identifiants à réutiliser, règles |
| `docs/journal.md` | l'historique daté de tout ce qui a été fait |
| `docs/videos.md` | les vidéos éducatives « étape par étape » : analyse du modèle, idées pour Essil, prix |
| `PRODUCT.md` | contexte produit (audience, principes) pour le skill Impeccable |

Ces fichiers `.md` sont bloqués en ligne par `.htaccess`. Une copie de cette fiche est dans le projet Claude « jeu et loisir Amine » (`claude/site-famille-missaoui.md`).

### Le projet en une phrase

**https://www.missaoui-family.com** regroupe les cours et les jeux faits sur mesure pour les enfants de la famille Missaoui, pour **apprendre en s'amusant**. Pages HTML autonomes (sans framework), créées avec Claude, publiées par GitHub → Hostinger.

### La famille

| Personne | Rôle | Couleur / avatar |
|---|---|---|
| **Anis** | le papa, propriétaire du site (c'est lui qui parle à Claude) | vert sarcelle `#0f766e`, `jeux/avatars/anis.webp` |
| **Imen** | la maman | framboise `#b4235a`, `jeux/avatars/imen.webp` |
| **Essil** | 12 ans, collège : allemand, latin, maths (vidéos géométrie et fractions), équitation (Les Écuries d'Essil) | bleu `#1f3c88` + rail rouge `#d7263d` |
| **Salma** | 8 ans, CE2 : anglais, français (conjugaison), maths (soustraction, géométrie, symétrie, monnaie), exposé cheval | vert `#1f6b44` + ciel `#5aaedc` |
| **Amine** | 5 ans, grande section : jeux, écriture (Ardoise magique), nombres (Planète des Nombres), derja tunisienne | nuit `#2a1f4f` + lune `#fff1bf` / citrouille `#ff8c1a` |

Ordre d'affichage voulu : **Essil, Salma, Amine**. Les prénoms et les avatars peuvent apparaître sur le site (accord du papa).

### Arborescence

```
index.html             accueil : d'abord l'écran « Qui es-tu ? » (5 avatars de la famille, dont les **nouveaux portraits 3D d'Essil, Salma et Amine** dans `jeux/avatars/qui/` — seulement là, les anciens avatars restent partout ailleurs — + invités Nour, Yasmine, Farès ; maquette Claude Design « Accueil Famille Missaoui — Qui es-tu ? », artifact `NXuEAchJfB4sw1q6CuzZJ3`) ; un enfant voit seulement ses cours + le bandeau des jeux de famille ; papa, maman et invités voient tout (titre, portrait, tableau du temps de jeu, 3 cartes enfants, jeux de famille) en mode explorateur ; en haut le **mur des nouveautés** (tableau en liège ComfyUI `jeux/avatars/qui/mur.webp`, papiers épinglés : tableau `NOUVEAUTES` dans index.html, à compléter à chaque nouveauté ; l'affiche de la famille `affiche-famille.jpg`) ; en bas : Progression, Administration
explorateur.js         mis en premier dans chaque page par acces/porte.php : le profil de la visite (sessionStorage) et le mode explorateur (bac à sable localStorage, cookie famille_explo, étiquette « Explorateur du site : <nom> » en bas à gauche, déplaçable) et le salon du site (qui est connecté, messages privés : api/houma.php, actions site et ecrit)
indexancien.html       ancienne page d'accueil (photos aimantées sur le frigo), gardée en ligne, noindex
famille.css            style commun accueil + espaces (version de cache : ?v=6)
famille.js             module commun : « Qui joue ? », scores, classements, suivi et relecture des progrès
version.js             la version du site affichée en bas de l'accueil (« Version 3.<n> · mise à jour du … »), refaite par `sh docs/outils/version.sh` avant chaque commit
site.js                chargé par toutes les pages : appli installable (service worker) + journal des visites
manifest.webmanifest, sw.js, icons/   l'application à installer sur l'écran d'accueil (voir docs/serveur.md)
progression.html       tableau de bord des parents (mot de passe parent), avec le journal des visites et l'onglet Réglages (temps d'écran, joueurs)
mur.html               le mur de la famille (messages, dessins, photos), + api/mur.php
defi.js                le défi du jour, en haut des espaces d'Essil, Salma et Amine
essil/  index.html, deutsch-express.html, via-romana.html, videos-geometrie.html et videos-fractions.html (+ videos/ : épisodes « Pas à pas »), les-ecuries.html (club hippique 3D, + ecuries/ : code et images)
salma/  index.html, english-garden.html, weather-station.html (+ meteo/ : images et voix), atelier-des-verbes.html, atelier-des-formes.html, miroir-magique.html (symétrie), marche-d-ollie.html (monnaie, 3D), jardin-des-nombres.html, le-grand-galop.html, cheval/ (images et vidéos)
amine/  index.html, ardoise-magique.html (+ lettres.js : modèles des 78 lettres), planete-des-nombres.html (+ nombres/ : aliens, décor, voix des nombres), la-nuit-d-amine.html, la-nuit-d-amine-2.html, nahki-tounsi.html, serpentin.html, je-lis.html (apprendre à lire, + lire/ : son.php, voix.php, depot.php ; les sons ElevenLabs sont dans famille-data/lire-voix), voix/api.php
jeux/   jasmin-stage2.html (**Jasmin · Stage 2** : échelles, objets à lancer, ennemis ; moteur et réglages dans jeux/stage2/, voir docs/jeux-3d.md), ma-houma.html (**Ma Houma** : quartier tunisien miniature, monde libre façon maison de poupées, voir docs/jeux-3d.md), les-ecuries.html (les Écuries pour toute la famille : même code que essil/ecuries/), serpent-legendes.html, ludo-legendes.html, grimpe-glace.html, medina-express.html (course infinie 3D, + medina/ : planches des corps animés), legende-du-jasmin-3.html (**« le Jasmin » = cette version** depuis le 13/11 : les 24 mondes « en vrai », + jasmin3/ : `reel.js` et images par monde), legende-du-jasmin-2.html (le Jasmin 2 : **sauvegarde, on n'y touche plus** sauf demande du papa (hérisson corrigé le 13/11), bouton à part « 🌸 Jasmin 2 » en bas de l'accueil ; héros et créatures « en vrai », + jasmin2/ : planches ; images de décor dans jasmin/), legende-du-jasmin.html (l'ancienne version aux héros dessinés, gardée en ligne, liée seulement depuis Progression), atelier-du-jasmin.html (coloriage 2D / 3D, + atelier/ : dessins au trait et voix), sons/ (bruitages ElevenLabs du Jasmin et de Ma Houma, `sons.js`, page d'écoute `ecoute.html`), maison/ (Ma maison de Ma Houma : 143 meubles, objets, arabesques et graffitis réalistes, `tex/` murs et sols, `catalogue.js`), houma/ (personnages de Ma Houma : debout, assis, gestes ; reel/ : carte du quartier et fonds en vraie photo), avatars/ (5 avatars + têtes de profil `-profil` et « soupir » `-soupir` pour le héros du Jasmin, têtes vues de dos `-dos` pour Médina Express, 3 mascottes d'invités, 15 cartes légendes, illustrations Ludo et Grimpe-Glace), cartes/ (illustrations des skins)
lib/    three-0.170.0.module.min.js (Three.js, copié ici : aucune dépendance en ligne)
api/    famille.php (joueurs, records, progrès), ludo.php (parties de Ludo en ligne), houma.php (Ma Houma en ligne : présence, discussion et messages vocaux, « Viens voir ! », troc), mur.php (le mur de la famille), reponse.php (répondre depuis la notification ntfy à « 🙋 je demande plus de temps » : hors de la porte, jeton à usage unique)
acces/  la porte du site (accès réservé) : garde.php, porte.php (toutes les pages passent par là), index.php (page « accès réservé »), invitation.php, admin.php (Anis) ; voir docs/serveur.md
photos/ photos de famille de l'ancienne accueil (maison, salon, canapé)
docs/   la documentation (voir le tableau ci-dessus)
.htaccess  cache les .md et fichiers techniques, redirige les anciens liens, en-têtes anti-cache
package.json, build.js  copie le site dans dist/ si Hostinger lance un « build »
```

### Publication

- Dépôt GitHub **`azilix-ui/jeu-amine`** (public), branche **`main`**. Claude a les droits d'écriture.
- Hostinger est relié au dépôt : **chaque `git push` sur `main` met le site à jour** en 30 s à 1 min. La racine du dépôt = `public_html`.
- Données hors du site public (un redéploiement n'y touche pas) : `famille-data/` (bases SQLite) et `nahki-voix/` (voix et mot de passe parent), à côté de `public_html`.
- Vérifier en ligne avec le navigateur intégré du Claude desktop : le shell du conteneur et celui de l'ordinateur ne joignent pas le domaine (proxy). En local : `php -S` sur une copie du dépôt (les API marchent, les bases se créent à côté).
- Après une modification de `famille.css`, augmenter `?v=` dans les pages qui l'appellent (cache des tablettes). Les `.html/.css/.js` sont servis en `no-cache`.

#### Ajouter un cours ou un jeu
1. Fichier dans le dossier de l'enfant (`salma/…`) ou dans `jeux/` s'il est pour toute la famille ; nom simple, sans accents.
2. En tête de page, le bloc commun (manifeste, icône Apple, `<script src="/site.js" defer>`) copié d'une autre page ; pastille de retour en haut, `<script src="../famille.js">` et `Famille.track('<cours>', '<Prénom>', ['<clé localStorage>'])`.
3. Déclarer le cours dans `COURSES` de `api/famille.php` (et dans `READABLE` s'il doit se relire sur une autre tablette), puis une carte dans `progression.html`.
4. Une carte dans `<enfant>/index.html` et un lien dans la carte de l'enfant sur `index.html`.
5. Un **jeu** (pas un cours) : ajouter son adresse dans `JEUX` de `famille.js` (temps d'écran). Tester (Playwright, portrait et paysage tablette), `sh docs/outils/version.sh` (version du site), commit + push, vérifier en ligne, ajouter une ligne dans `docs/journal.md`.

### Règles à respecter

- **Voix off des vidéos** : **Céline** (ElevenLabs, `text2speech_v2`, voix `57ccb351-84d7-54ba-afd4-26b566ca6023`), et **Julian** (`95429266-c0ac-4137-a209-63b8812b0f23`) pour les autres projets ; choisies par le papa le 09/11. Ollie, la prof de Salma, parle français avec la voix de **Céline** (voix de femme, demandé le 10/11) ; en anglais c'est **Raina**. Toujours faire écouter des essais avant de choisir une nouvelle voix.
- **Bruitages et voix ElevenLabs** : compte Starter du papa (il se connecte lui-même). Plus de crédits Higgsfield (14/11) : les voix se font avec ElevenLabs. **Ne plus lui faire accepter un téléchargement par fichier** : générer dans la page Text to Speech, garder les sons dans la page (IndexedDB), puis la page les envoie elle-même au site (`amine/lire/depot.php`, jeton) : rien à télécharger. Voix payantes de la bibliothèque (« tarif personnalisé ») : ne pas les ajouter sans son accord. Voir `docs/higgsfield.md` › ElevenLabs.
- **Higgsfield** : toujours annoncer le prix exact en crédits (outil `get_cost`) et attendre l'accord du papa avant de générer. Montrer le résultat avant de publier.
- **Photos** : ne jamais publier de documents scolaires bruts ni de photos d'identité (planches avec numéros). Seuls des visages recadrés servent de référence à Higgsfield ; ce sont les avatars dessinés qui vont en ligne.
- **Pas de personnages protégés** (jeux vidéo, dessins animés, marques) : on invente des personnages originaux (ex. Poppy Playtime → monde « Usine à jouets » inventé).
- **Version du site** : avant **chaque** commit, lancer `sh docs/outils/version.sh` (numéro = nombre de commits, date du jour) puis l'ajouter au commit. Bas de l'accueil : © 2026 Anis Missaoui, version, et le badge « Jeux propulsés par Anis Missaoui » (demandé le 13/11) ; © aussi en bas des espaces d'Essil, Salma et Amine.
- **Accès réservé** (13/11) : la porte `acces/` (voir `docs/serveur.md`). Une nouvelle API PHP doit commencer par `require … '/acces/garde.php'; ga_garde_api();`. Ne jamais saisir le mot de passe administrateur ni le mot de passe parent : c'est le papa qui les tape.
- Ton chaleureux, jamais moqueur ; consignes lues à voix haute pour Amine qui ne lit pas encore.
- Tout en français ; tester sur tablette (tactile, cibles ≥ 48 px).
- **Réglage des têtes** du héros (Jasmin, Grimpe-Glace) : page claude.ai « Les têtes du Jasmin » (artifact `GmHsWJsfQKKV32z6t81upp`) ; le papa ajuste et enregistre, Claude relit le document `reglages/tetes` et recopie les valeurs dans `HEADCROP` / `HEADCROP_P` (voir `docs/jeux-3d.md`).

### Points ouverts

- [ ] **https://missaoui-family.com (sans www)** : la page répond (vu le 02/11 dans le navigateur), mais le DNS `A` de `@` et le certificat SSL sans www restent à vérifier dans hPanel.
- [ ] Redirection `http://` → `https://` non vérifiée (« Forcer HTTPS » dans hPanel › Sécurité › SSL).
- [ ] Deutsch Express affiche « Dijon-Ville » : à retirer si le papa le souhaite (pas encore décidé).
- [ ] Le mot de passe parent (voix + Progression) doit avoir été créé par le papa.
- [ ] Sauvegardes des bases (`famille-data/`) et des voix (`nahki-voix/`) : proposées, pas encore faites.
- [ ] Ludo en ligne : si la tablette hôte se ferme, les machines s'arrêtent (les vrais joueurs continuent).
- [ ] Mots de derja à faire confirmer par la famille : mémti, mankhar, wdhen, séq, bordgéni, njma, 7low.


---

# `PRODUCT.md`

## Product

<!-- impeccable:product-schema 1 -->

### Platform

web

### Users

- **Essil**, 12 ans, au collège. Travaille l'allemand (Deutsch Express) et le latin (Via Romana) : vocabulaire, grammaire, civilisation, en étapes courtes avec correction immédiate.
- **Salma**, 8 ans, CE2. Anglais (English Garden), conjugaison (L'Atelier des Verbes), soustraction (Le Jardin des Nombres) et le quiz de son exposé sur le cheval (Le Grand Galop), avec Ollie le hibou.
- **Amine**, 5 ans, grande section de maternelle. Joue à des jeux éducatifs : mémoire, compter jusqu'à 20, couleurs, suites logiques, une histoire interactive, la derja tunisienne (Nahki Tounsi) et Serpentin.
- **Anis, le papa** (propriétaire du site) : crée les contenus avec Claude, enregistre sa voix pour la derja, suit la progression des enfants sur la page Progression, et joue aussi aux jeux de famille.
- **Imen, la maman** : joue aux jeux de famille (Serpent Légendes, Ludo Légendes) avec son avatar.
- Le site est **fait pour la famille**. Les jeux acceptent un autre prénom : un ami peut être invité à une partie de Ludo en ligne par un lien, mais il n'y a pas d'autre public visé (ni école, ni grand public).

### Product Purpose

Faire apprendre les enfants en s'amusant, à la maison, avec des cours et des jeux faits sur mesure pour chacun : leur niveau, leurs leçons de classe, leurs goûts (Halloween, dragons…), leurs langues (allemand, latin, anglais, derja tunisienne). Réussite : les enfants y reviennent d'eux-mêmes, progressent, et les parents voient cette progression.

### Positioning

Un site d'apprentissage **fait pour une seule famille** : chaque cours part du programme réel de l'enfant (ex. le cours d'allemand du 9 octobre d'Essil), chaque jeu porte son prénom, et la derja est enseignée avec la voix du papa. Aucune plateforme scolaire générique ne peut offrir ce sur-mesure.

### Operating Context

- Utilisé **surtout sur tablette tactile**, à la maison ; parfois sur l'ordinateur familial (Windows, Edge ou Chrome).
- Chaque enfant a son espace : `essil/`, `salma/`, `amine/`. L'accueil `index.html` les réunit avec des liens directs vers chaque cours et jeu.
- Les progrès sont gardés dans le navigateur de l'appareil, puis copiés automatiquement sur le serveur (base SQLite) pour la page Progression des parents.
- Serpentin demande « Qui joue ? » avant la partie et tient un classement en ligne partagé entre les enfants.
- Amine ne sait pas encore lire : ses jeux passent par la voix (consignes lues à voix haute) et par de grandes images.

### Capabilities and Constraints

- Site statique en HTML, CSS et JavaScript, sans framework ni étape de construction, servi par Hostinger depuis le dépôt GitHub `azilix-ui/jeu-amine` (branche `main`, déploiement automatique).
- Deux petits programmes PHP : `amine/voix/api.php` (voix du papa pour Nahki Tounsi) et `api/famille.php` (joueurs, records, progrès). Les données sont hors du site public.
- Mot de passe parent unique pour enregistrer les voix et voir la Progression.
- Les jeux d'Amine récompensent avec une cagnotte de bonbons partagée ; les cours d'Essil avec des XP et des grades ; celui de Salma avec des étoiles.
- Pas de personnages protégés (jeux vidéo, dessins animés, marques) : on invente des personnages originaux.
- Les voix de synthèse des navigateurs ne parlent pas la derja : c'est la voix enregistrée du papa qui fait foi.
- Synchronisation entre appareils : faite pour Serpent Légendes, Ludo Légendes et L'Atelier des Verbes ; les autres cours restent sur l'appareil (copie serveur pour la Progression seulement).
- Jeux 3D (Three.js) pour toute la famille, avec collections (coffres, raretés, défis légendaires) ; les exercices rapportent des tickets 🎟️ dépensés dans les jeux.
- Images et vidéos générées avec Higgsfield (avatars, cartes légendes, vidéos du cheval) : prix annoncé avant chaque génération.

### Brand Commitments

- Nom du site : **Famille Missaoui** (missaoui-family.com). Les prénoms des enfants apparaissent sur le site, avec l'accord du papa.
- Chaque enfant a son univers : Essil, le train bleu et le rail rouge de Deutsch Express ; Salma, le jardin et le ciel d'English Garden ; Amine, la nuit d'Halloween et sa citrouille. Les cours et jeux gardent chacun leur identité propre.
- Langue du site : le français ; les langues apprises apparaissent dans leurs leçons.
- Ton : chaleureux, encourageant, jamais moqueur ; on félicite (« Bravo Amine ! », « Wunderbar ! », « ya3tik essa77a »).

### Evidence on Hand

- Contenus réels : les cours de classe d'Essil (allemand, latin), le vocabulaire d'anglais de Salma, 56 mots de derja vérifiables par la famille.
- Sources sur l'ordinateur du papa : `OneDrive\Salma etude\` et `OneDrive\Amine\grande section\`. Deux photos WhatsApp de documents scolaires y sont rangées et ne sont pas publiées.
- Pas de témoignages, statistiques ou contenus inventés à ajouter.

### Product Principles

1. **Sur mesure avant tout** : chaque contenu part du programme et des goûts réels de l'enfant, pas d'un modèle générique.
2. **Le jeu porte l'apprentissage** : chaque partie fait réviser quelque chose (compter, lire, conjuguer), sans que cela ressemble à un devoir.
3. **Adapté à l'âge** : voix et images pour Amine, consignes courtes pour Salma, exercices exigeants mais rapides pour Essil.
4. **Encourager, jamais punir** : on peut toujours réessayer ; l'erreur se corrige avec douceur.
5. **Les parents voient sans surveiller** : la progression est visible pour eux, discrète pour les enfants.

### Accessibility & Inclusion

- **Tablette tactile d'abord** : grandes zones de toucher, aucun geste fin, pas de survol nécessaire, page qui ne bouge pas pendant les jeux.
- Un lecteur de 5 ans qui ne lit pas encore : toute consigne destinée à Amine est aussi dite à voix haute.
- Texte bien lisible sur l'écran d'une tablette, en lumière de jour comme le soir.


---

# `docs/contenus.md`

## Les contenus, enfant par enfant

Chaque cours garde sa propre identité visuelle ; l'accueil et les pages d'espace utilisent `famille.css` (Bricolage Grotesque + Nunito).

### Essil (12 ans, collège)

| Cours | Fichier | Contenu | Sauvegarde |
|---|---|---|---|
| Deutsch Express | `essil/deutsch-express.html` | allemand, 14 étapes d'après son cours du 9 octobre ; XP et grades | `essil-deutsch` |
| Pas à pas · Géométrie | `essil/videos-geometrie.html` | vidéos « étape par étape » (voir `docs/videos.md`) : onglets d'épisodes : 1 « La clôture des chèvres » (le périmètre : carré, rectangle, forme en L, cercle et π), 2 « Carreler la cuisine de mamie » (l'aire : rectangle, forme en L, triangle, disque) ; voix de Céline ; pour chacun « Ce qu'il faut retenir » et un petit défi de 5 questions, 3 « Le piège du fermier » (même périmètre, pas la même aire ; le cercle optimise), 4 « Le bassin de Kairouan » (le volume, litres, m³, cylindre), 5 « Le minaret qui ne tombe pas » (angles droit, aigu, obtus, plat ; somme des angles du triangle = 180°) | aucune (page à regarder) |
| Pas à pas · Les fractions | `essil/videos-fractions.html` | 3 vidéos « étape par étape » (voir `docs/videos.md`) : 1 « Le gâteau de l'Aïd » (numérateur, dénominateur, fractions égales, amplifier, simplifier), 2 « Le potager de Jeddi » (additionner et soustraire : même dénominateur, mettre au même dénominateur, piège 1/2 + 1/3 ≠ 2/5), 3 « La citronnade de Tata » (multiplier, l'inverse, diviser) ; voix de Céline ; fractions écrites empilées comme au tableau ; « Ce qu'il faut retenir » et un défi de 5 questions par épisode ; dernier épisode ouvert gardé dans `essil-fractions` | aucune (page à regarder) |
| Les Écuries d'Essil | `essil/les-ecuries.html` (+ `essil/ecuries/`) | club hippique demandé par Essil (voir `docs/jeux-3d.md`) : leçons et quiz (parties du filet et de la selle, 10 robes, 12 races, pansage et brosses), pièces, écurie 3D (panser, nourrir, équiper), sellerie, marchand de chevaux, concours 3D (CSO, cross, dressage) | `ecuries:<Prénom>` {coins, horses, owned, best, ecole, n} Ouvert à toute la famille par `jeux/les-ecuries.html` (même code, un club par joueur ; liens chez Salma, Amine et sur l'accueil). |
| Via Romana | `essil/via-romana.html` | latin, 10 étapes : vocabulaire, grammaire, civilisation | `essil-latin` |

Sources : `OneDrive\Salma etude\Essil\` (`Essil Deutsch Express … v2 - cours.html` publiée, `Essil Via Romana Latin.html`, 2 photos WhatsApp non publiées).

### Salma (8 ans, CE2)

| Cours | Fichier | Contenu | Sauvegarde |
|---|---|---|---|
| Salma's English Garden | `salma/english-garden.html` | anglais, 8 thèmes (Hello, Animals, Colours, Numbers, Fruits, Family, Days, Months), avec Ollie le hibou ; toutes les phrases sont des voix enregistrées (Higgsfield : Raina en anglais, Céline pour le français d'Ollie) dans `salma/english/voix/` | `salma-stars` |
| L'Atelier des Verbes | `salma/atelier-des-verbes.html` | conjugaison d'après ses fiches **C58** (groupes du verbe) et **C59** (présent). 8 étapes : trois paniers (piège « aller »), test du « nous » (-ir 2e/3e groupe), 1er groupe, 2e groupe, 3e groupe (-s -s -t, -dre, -x), les 12 verbes du tableau, piège -cer/-ger, phrases à trous. Règle avant chaque étape, fiche de leçon lue à voix haute, carnet (étoiles, verbes à revoir, verbes maîtrisés). **1 ticket 🎟️ par bonne réponse, +3 pour un sans-faute**, à dépenser dans Serpent Légendes | `salma-verbes` {stars, done, tickets, verbs{inf:{ok,ko}}, t} |
| Salma's Weather Station | `salma/weather-station.html` | anglais débutant : **la météo et les saisons**. Salma est présentatrice météo (image d'accueil Higgsfield avec son avatar). 10 temps (sunny, cloudy, rainy, windy, snowy, stormy, foggy, rainbow, hot, cold) et 4 saisons, illustrés par **la même petite maison tunisienne** sous chaque temps (14 images Higgsfield). **47 voix anglaises Higgsfield** (`seed_audio`, voix Raina choisie par le papa) dans `salma/meteo/voix/` : le mot, la phrase « It's sunny. », les vêtements, les questions « What's the weather like in London? ». 5 activités : **Learn** (14 cartes à écouter, 3 ⭐ quand tout est écouté), **Listen!** (on entend la phrase, on touche l'image), **Memory** (image ↔ mot), **Dress up!** (choisir les 3 vêtements qui vont avec le temps), **On air!** (carte de 6 villes, choisir la bonne phrase). 1 ticket 🎟️ par bonne réponse, +3 pour un sans-faute, ajoutés à la boutique de Serpent Légendes | `salma-meteo` {stars, done, tickets, errs, seen, t} |
| Le Marché d'Ollie | `salma/marche-d-ollie.html` | la monnaie d'après ses fiches **MES 1** « L'euro » (7 billets, 8 pièces) et **MES 2** « La monnaie : valeur des centimes » (100 ct = 1 €, 10 fois 10 ct = 1 €). Comptoir de marché en **3D** (Three.js) : pièces et billets dessinés (simplifiés, marqués « billet de jeu ») qui tombent sur le plateau, tirelire-cochon, étiquette de prix et objet à acheter. 8 étapes : billet ou pièce, sa valeur (pièges 2 c / 2 €, 10 c plus petite que 5 c), ranger du plus petit au plus grand (on touche les objets 3D), 100 ct = 1 € (démonstration animée : 100 pièces de 1 c puis 10 de 10 c se changent en 1 €), compter la tirelire (on touche chaque pièce, elle saute dans le cochon et le total s'affiche), faire l'appoint (porte-monnaie, prix exact, « il manque… / c'est trop »), bureau d'échange (€ ↔ ct, combien de pièces), assez d'argent ? Leçon recopiée, carnet. **1 ticket 🎟️ par bonne réponse, +3 pour un sans-faute** ; skin exclusif « Serpent Monnaie » (45 🎟️) dans Serpent Légendes | `salma-monnaie` {stars, done, tickets, errs, t} |
| L'Atelier des Formes | `salma/atelier-des-formes.html` | géométrie d'après sa leçon **GEOM 6** « Les polygones : décrire des polygones ». 7 étapes avec Ollie : polygone ou pas (fermée, segments), sommets et côtés (on touche chaque sommet), chasse à l'angle droit (équerre posée dans les coins, codage), carré ou rectangle (règle : on touche les côtés pour les mesurer, figures penchées), qui suis-je (devinettes), décris-moi (fiche sommets / côtés / angles droits / côtés égaux / nom), construis-la (ardoise). **Ardoise à figures** : quadrillage à points, on relie les points (glisser ou toucher point par point) ; Ollie corrige : figure pas fermée, côtés qui se croisent, puis nom de la figure, angles droits codés en vert, longueur de chaque côté ; défis (carré de 3, rectangle 5 × 2, triangle rectangle, pentagone, carré penché…). Leçon recopiée (tableau triangle rectangle / rectangle / carré), carnet. **1 ticket 🎟️ par bonne réponse, +3 pour un sans-faute**, +1 par défi réussi sur l'ardoise | `salma-geometrie` {stars, done, tickets, figs{nom:{ok,ko}}, t} |
| Le Miroir Magique | `salma/miroir-magique.html` | **la symétrie** (programme de CE2, demandé par le papa le 11/11 ; pas de fiche de sa maîtresse pour l'instant : à ajuster si elle en rapporte une). 7 étapes avec Ollie : symétrique ou pas (la figure **se plie** à l'écran : verte si les moitiés se superposent, rouge si ça dépasse ; piège du parallélogramme), où est l'axe (4 droites à toucher, figures penchées), combien d'axes (0 à 4 ; les diagonales du rectangle), le bon reflet (3 dessins : le vrai, la figure glissée, le reflet décalé), colorier le reflet sur quadrillage (axe vertical : cœur, sapin, fusée… ; 3 essais, croix rouges sur les cases fausses), le reflet dans l'eau (axe horizontal, en couleurs), point par point (placer A′, B′… sur les nœuds, l'aide montre le nombre de carreaux jusqu'à l'axe). **Mon miroir magique** : dessin libre 16 × 16 avec 1, 2 ou 4 axes (rosaces), gardé avec les progrès. Leçon, carnet, tickets 🎟️ pour Serpent Légendes. Même gabarit que l'Atelier des Formes (figures dans `SH` avec leurs axes, moitiés `HALVES`/`TOPS`, figures à points `PFIGS`). Voix du navigateur (pas de crédits). | `salma-symetrie` |
| Le Jardin des Nombres | `salma/jardin-des-nombres.html` | soustraction avec retenue, méthode de sa maîtresse « retenue en bas » (on ajoute 10 en haut et 1 dizaine en bas), 8 étapes, cahier à petits carreaux, retenues en rouge | `salma-maths` |
| Le Grand Galop | `salma/le-grand-galop.html` | quiz de son exposé « Le cheval » : 6 obstacles = 6 Galops + Grand Prix, QCM, vrai/faux, photos, relier, robes dessinées, rythme des allures au sabot, écoute des sabots, fiche de révision. Vidéos Higgsfield : allures (pas, trot, galop) et « Salma à cheval » (dessin animé / réaliste) avec sa vraie voix qui compte en anglais | `salma-cheval` {stars, done, gp} |

Sources : `OneDrive\Salma etude\` (English Garden v2 publiée), `exposé\` (photos et texte de l'exposé), `françaiss\` (photos des fiches C58 et C59), `math\` (photo de la leçon GEOM 6 + sa transcription `.md`), `math\math2\` (photos des fiches MES 1 et MES 2), `salma compte.mp4` (vidéo papa + Salma qui compte), `video-cheval\` (copies des vidéos).

### Amine (5 ans, grande section)

| Jeu | Fichier | Contenu | Sauvegarde |
|---|---|---|---|
| La Planète des Nombres | `amine/planete-des-nombres.html` + `amine/nombres/` | les nombres de 0 à 60 chez les aliens (il sait compter jusqu'à 50), tout est dit à voix haute. 5 jeux de 5 questions : **compter** des aliens (chaque alien touché reçoit son numéro, dit par la voix), **trouver** le nombre entendu sur la bonne soucoupe, le nombre **d'après ou d'avant**, le **plus grand ou le plus petit**, **donner** le bon nombre d'étoiles à un alien. 2 essais, puis la réponse est montrée et dite. Une étoile = 4 bonnes réponses sur 5 du premier coup ; 3 étoiles gagnées et les nombres montent de 10 (réglage « Jusqu'à 10 … 60 » en bas du menu, 50 au départ ; compter et donner s'arrêtent à 20 objets). Sauvegarde `amine-nombres` (`{max, wins, stars:{jeu:n}, rounds}`), cours `amine-nombres` | Voix : Julian (Higgsfield), un fichier par nombre (`nombres/voix/0.mp3` … `60.mp3`) et 19 consignes, enchaînés par `say(['trouve', 27])`. Images Higgsfield : 6 aliens originaux, soucoupe, décor, accueil |
| L'Ardoise magique | `amine/ardoise-magique.html` + `amine/lettres.js` | apprendre à écrire sur une ardoise en 3D (monde de Serpent Légendes, serpent mascotte qui suit la craie). 4 cahiers : **attaché** (modèle de l'école française, avec départ et sortie, le plus important), MAJUSCULES bâton, minuscules script, **Mon prénom** (AMINE, amine en attaché et en script). Pour chaque lettre : regarder la démonstration → repasser 2 fois sur les pointillés (point vert de départ, flèche du sens, correction geste par geste : sens, départ, rester sur les points) → écrire 2 fois tout seul (modèle en petit dans le coin, correction du dessin entier recalé : vert = réussi, rouge = oublié) → 1 à 3 étoiles. Ordre : les lettres de son prénom d'abord, puis par familles de gestes. **1 carte toutes les 6 étoiles** (15 cartes = skins de Serpent Légendes, dont l'exclusif « Craie magique ») ; tickets 🎟️ pour la boutique du serpent ; ardoise personnalisable (cadre, fond, craie) débloquée par les étoiles. Écran d'accueil : Amine devant son ardoise (Higgsfield). Cartes illustrées (`jeux/cartes/`), 1 chance sur 10 d'être **brillante** ✨ | `amine-ecriture` {stars{c:a, M:A, s:a, p:caps…}, done, tickets, cards, shiny, slate, t} |
| La Nuit d'Amine | `amine/la-nuit-d-amine.html` | Halloween : mémoire, compter jusqu'à 10, couleurs, suites | `amine-bonbons` (cagnotte commune) |
| La Nuit d'Amine 2 | `amine/la-nuit-d-amine-2.html` | mémoire 18 personnages, compter jusqu'à 20, additions, comparer, histoire « Où est passé Minuit ? » | `amine-bonbons` |
| Je lis ! (14/11) | `amine/je-lis.html` | apprendre à lire par les sons, comme à l'école : 4 étapes de 6 questions — **les voyelles** (A É I O U Y, avec images), **les sons qui chantent** (M L R S F N V CH, puis P T B), **les syllabes** (M + A = MA, les lettres se collent), **mes premiers mots** (papa, maman, moto, lama, tomate… et les prénoms de la famille avec leurs avatars ; mot en syllabes de couleur, chaque syllabe se réécoute). Tout est lu à voix haute : **voix enregistrées avec ElevenLabs** (14/11 : **Lulu**, voix de dessin animé créée pour Amine avec Voice Design ; **Papi Olivier**, grand-père rigolo ; **Jon le conteur**, douce), une phrase courte par son, rangés sur le serveur dans `famille-data/lire-voix/<voix>/<clé>.mp3` (servis par `amine/lire/son.php`, liste `amine/lire/voix.php`, envoyés depuis ElevenLabs par `amine/lire/depot.php` ; lecture Web Audio qui coupe les blancs et égalise le volume ; Lulu par défaut tant qu'on n'a pas choisi une autre voix à la main), choix dans le menu **🔊 La voix** ; la voix de la tablette reste possible et prend le relais d'une phrase manquante (avec un garde-fou si elle ne finit pas). Police **Andika** (faite pour apprendre à lire), MAJUSCULES ou minuscules. 1 étoile et 2 tickets 🎟️ par étape réussie (5 sur 6 du premier coup) | `amine-lecture` {stars, best, tickets, rounds, casse}, cours `amine-lecture` (ticket source de la Boutique du savoir) |
| Nahki Tounsi | `amine/nahki-tounsi.html` | derja tunisienne, 56 mots en 7 thèmes + nombres ; voix enregistrée par le papa (🎙️ Ma voix) | `amine-tounsi-etoiles` |
| Serpentin | `amine/serpentin.html` | snake 2D pour tablette : 4 mondes (Dragon, Usine à jouets, Halloween, Espace), 3 vitesses (Tortue, Lapin, Guépard), mode « Les chiffres » 1 à 10 ; « Qui joue ? », records en ligne ; bonbons seulement pour Amine | `serpentin-best`, `serpentin-pref` |

Nahki Tounsi : écriture `3` = ع, `7` = ح, `kh` = خ, `q` = ق, `dh` = ض/ظ. Ordre de lecture d'un mot : enregistrement de l'appareil → enregistrement en ligne → voix de synthèse (Edge a « Arabe (Tunisie) »). Sources : `OneDrive\Amine\grande section\`.

### Pour toute la famille (dans `jeux/`)

- **Serpent Légendes**, **Ludo Légendes**, **Médina Express** (course infinie à 3 voies dans la médina et le long du TGM, records en ligne), **Grimpe-Glace** (tour de glace) et **La Légende du Jasmin** (plateforme 2.5D en Tunisie, blocs savoir) : voir `docs/jeux-3d.md`.
- Les deux jeux proposent dans « Qui joue ? » les 3 enfants, puis Anis et Imen (avatars), ou un autre prénom (un ami invité).

### Pages communes

- **Le défi du jour** (14/11, `defi.js`) : une carte en haut des espaces d'Essil, Salma et Amine. Chaque jour une mission courte, la même sur toutes les tablettes (tirée à partir de la date) : Amine 4 questions lues à voix haute (compter, lettres, couleurs, premier son d'un mot, nombre d'après), Salma 5 (soustraction, tables, conjugaison, anglais, monnaie, géométrie), Essil 5 (allemand, latin, multiplication, fractions, nombres relatifs). Une question ratée se recommence. Réussi : **5 tickets 🎟️** (Boutique du savoir de Serpent Légendes, source `defi`) + **10 minutes de jeu** ce jour-là ; 10 tickets de bonus tous les 7 jours d'affilée. Sauvegarde `defi:<Prénom>` {jours, tickets, serie, record}, cours `defi`.
- **Le mur de la famille** (14/11, `mur.html` + `api/mur.php`) : messages, dessins (atelier de dessin intégré) et photos (réduites à 1280 px puis **réencodées par le serveur** : plus de position GPS ni d'infos de l'appareil). Réactions ❤️ 👏 😂 😮. Chacun efface ses messages (jeton gardé dans le navigateur) ; retirer celui d'un autre demande le mot de passe parent. Bouton « 🧱 Le mur de la famille » sur l'accueil. Données : `famille-data/mur.sqlite` et `famille-data/mur/<id>.webp` (dans les sauvegardes).
- **Qui joue ?** (14/11, `famille.js`) : les invités déjà venus ont un bouton chacun (fini de retaper son prénom) ; un prénom proche de celui de la famille ou d'un invité connu (« Aniss ») propose « Tu voulais dire Anis ? » ; un nouveau prénom demande « tu t'appelles bien … ? » ; les suites de lettres au hasard sont refusées. Progression › Réglages › « Les joueurs » : fusionner ou supprimer un faux prénom.
- **Temps d'écran** (14/11, `famille.js` + `api/famille.php`) : sur les pages de **jeux** (liste `JEUX` dans `famille.js`, à compléter pour un nouveau jeu) seulement, pour Essil, Salma et Amine : 45 min par jour en semaine, 1 h 30 le week-end, pause nuit de 20 h 30 à 7 h (réglables enfant par enfant dans Progression › Réglages), + 10 min si le défi du jour est réussi. Écran doux « C'est l'heure de faire une pause » (ou « Bonne nuit ») avec « 📚 Aller à mes cours » ; un parent débloque 15 min avec le mot de passe parent. Les cours restent toujours libres.

- `index.html` : nouvelle accueil (maquette validée dans Claude Design le 01/11/2026, canevas « Accueil Famille Missaoui ») ; avatars petits qui grandissent ×1,9 au survol ou au toucher ; toucher un enfant ouvre son espace.
- `indexancien.html` : l'ancienne accueil (photos aimantées sur la porte du frigo), lien en pied de page.
- `progression.html` : tableau de bord des parents ; une carte par cours et par jeu (voir `docs/serveur.md`).


---

# `docs/higgsfield.md`

## Higgsfield : images et vidéos de la famille

Compte du papa (forfait **Plus**), relié à Claude par le connecteur MCP Higgsfield. Workspace `4e64cbea-0ec9-4fa0-a4ee-549fc3718306`. Préférence : pas de projet créé automatiquement.

### Règles

1. **Toujours donner le prix exact avant de générer** (`get_cost: true`), attendre l'accord, puis montrer le résultat avant de publier.
2. Envoyer seulement des **visages recadrés** (jamais une planche de photos d'identité avec numéros, ni un document scolaire).
3. Pas de personnage protégé ni de style nommé d'après une marque ; personnages et créatures originaux.
4. Télécharger les fichiers (domaines `d8j0ntlcm91z4.cloudfront.net`, `d2ol7oe51mr4n9.cloudfront.net`, `upload.higgsfield.ai` autorisés), les alléger (ffmpeg → `.webp` / `.mp4` 960 px) avant de les mettre sur le site, et copier les originaux PNG sur le PC.
5. Envoi d'une image de référence : `media_upload` → `curl -X PUT` → `media_confirm` (type image).

### Modèles utilisés

| Modèle | Usage | Prix constaté |
|---|---|---|
| `flux_3_image` (1k) | avatars, cartes, illustrations, avec images de référence (rôle `image_references`, jusqu'à 10) | 2 crédits / image |
| `seedance_2_5` (5 s, 720p, 16:9) | vidéos ; `mode: omni_reference` + `start_image` pour animer une image | 35 crédits / vidéo |

### Ce qui a été généré (790 → 505 crédits)

| Date | Quoi | Fichiers sur le site | Crédits |
|---|---|---|---|
| 01/11 | Cheval au pas, au trot, au galop (vidéos) | `salma/cheval/{pas,trot,galop}.mp4` + `-poster.webp` | 105 |
| 01/11 | Salma à cheval : 2 images (réaliste, dessin animé) + 2 vidéos ; son = sa vraie voix | `salma/cheval/salma-{realiste,cartoon}.mp4` | 74 |
| 01/11 | Avatars Essil, Salma, Amine | `jeux/avatars/{essil,salma,amine}.webp` | 6 |
| 01/11 | Cartes légendes des enfants (×3 légendes) | `jeux/avatars/<enfant>-{dragon,licorne,phenix}.webp` | 18 (une relance gratuite) |
| 01/11 | Avatars Anis, Imen | `jeux/avatars/{anis,imen}.webp` | 4 |
| 02/11 | Cartes légendes d'Anis et Imen + illustration Ludo (famille autour du plateau) | `jeux/avatars/{anis,imen}-*.webp`, `jeux/avatars/ludo-famille.webp` | 14 |
| 02/11 | 15 cartes illustrées de l'Ardoise magique (un serpent par skin) + Amine devant son ardoise (écran d'accueil) | `jeux/cartes/<skin>.webp`, `amine/ardoise-amine.webp` | 32 |
| 02/11 | Cartes rares : 4 mythiques (Amine, Salma, Essil, les 3 ensemble) + 4 secrètes | `jeux/cartes/{alphabet,polyglotte,hydre,aurore,tonnerre,arclune,tresor}.webp` | 16 |
| 02/11 | Illustration de Grimpe-Glace (la famille saute dans la tour de glace, les 5 avatars en référence) | `jeux/avatars/grimpe-glace.webp` | 2 |
| 04/11 | La Légende du Jasmin : titre (la famille sur les toits de Sidi Bou Saïd, 5 avatars), 5 fonds de monde (21:9), le Scorpion d'Or | `jeux/jasmin/{titre,monde1…5,boss}.webp` | 14 |
| 05/11 | La Légende du Jasmin : 4 nouveaux fonds de monde (21:9, `flux_3_image`) : médina de Tunis, Carthage, Djerba, Matmata (jobs 18469668…, 379786bb…, 4a552b16…, a1aa2957…) | `jeux/jasmin/monde6…9.webp` | 8 |
| 05/11 | La Légende du Jasmin : 4 fonds de plus (21:9, `flux_3_image`) : Tabarka, El Jem, Chott el-Jérid, Lézard Rouge (jobs 9f3b5685…, f6f2202d…, 1c4d4753…, 7bbe527c…) | `jeux/jasmin/monde10…13.webp` | 8 |
| 05/11 | Mascottes de La Légende du Jasmin : Nour (garçon, jasmin à l'oreille) et Farès (jeune homme) (jobs 77ea6059…, ee81e6cb…) | `jeux/avatars/mascotte-{nour,fares}.webp` | 4 |
| 05/11 | Mascotte fille Yasmine (job 34da25b6…) | `jeux/avatars/mascotte-yasmine.webp` | 2 |
| 09/11 | Salma's Weather Station : 14 images (la même maison sous chaque temps et à chaque saison, 1:1) + image d'accueil (Salma présentatrice, avatar en référence, 16:9) (`flux_3_image`) | `salma/meteo/*.webp` | 30 |
| 09/11 | Salma's Weather Station : 47 voix anglaises (`seed_audio`, voix **Raina** `1c3a4775-9afb-52c1-a2bf-b6543231a9a1` choisie par le papa, `speech_rate` −15, mp3), découpées et rognées | `salma/meteo/voix/*.mp3` | ~8 |
| 09/11 | La Légende du Jasmin : 6 fonds (21:9) : Kairouan, Ksar Ouled Soltane, Ichkeul, Tamerza, aqueduc de Zaghouan (+ un Sidi Bou Saïd non utilisé : ce monde existait déjà) | `jeux/jasmin/monde14…18.webp` | 12 |
| 09/11 | Vidéo 1 d'Essil « La clôture des chèvres » : 12 images 9:16 + voix off française (Elodie, refaite en wav car le mp3 coupait les fins) | PC : `videos temple\perimetre-cloture-des-chevres.mp4` | ≈ 44 |
| 09/11 | Essais de 6 voix françaises (ElevenLabs, MiniMax) puis toute la voix off de la vidéo 1 avec **Céline** | `essil/videos/perimetre.mp4` | ≈ 8 |
| 09/11 | Épisode 2 d'Essil « Carreler la cuisine de mamie » (l'aire) : 11 images 9:16 + 14 phrases de Céline | `essil/videos/aire.mp4` | ≈ 27 |
| 10/11 | English Garden de Salma : 171 phrases enregistrées (anglais **Raina** `seed_audio` en wav ; français d'Ollie refait avec **Céline**), découpées en clips | `salma/english/voix/*.mp3` | ≈ 17 |
| 10/11 | Épisodes 3, 4, 5 d'Essil (le piège du fermier, le bassin de Kairouan, le minaret) : 27 images 9:16 `flux_3_image` + 33 phrases de Céline | `essil/videos/{piege,volume,angles}.mp4` | ≈ 72 |
| 10/11 | L'Atelier du Jasmin : 19 paysages au trait (4:3 ; Sidi Bou Saïd refait une fois, le premier était sorti en couleurs), 9 costumes au trait (3:4), 1 essai, l'image d'accueil (16:9) (`flux_3_image`) + 10 consignes de Julian (2 prises ElevenLabs) | `jeux/atelier/*.webp`, `jeux/atelier/voix/*.mp3` | ≈ 62 |
| 10/11 | Jasmin : l'image d'accueil animée (la famille saute, boucle de 5 s ; `kling3_0`, mode std, sans son, même image au début et à la fin pour boucler) | `jeux/jasmin/titre.mp4` | 7,5 |
| 10/11 | L'Atelier du Jasmin, suite : 20 dessins au trait (14 animaux de la ferme, 6 paysages), 47 modèles en couleur (un par dessin : `flux_3_image` avec le trait en `image_references`, consigne « Color this exact coloring page. Keep exactly the same drawing… bright cheerful flat colors »), 3 consignes de Julian | `jeux/atelier/{a-*,p-*,m-*}.webp`, `jeux/atelier/voix/{animaux,modele,envoyer}.mp3` | 134,75 |
| 11/11 | L'Atelier du Jasmin : 3 consignes de Julian pour le puzzle (`text2speech_v2`, `variant: elevenlabs` obligatoire) | `jeux/atelier/voix/{puzzle,puzzle-go,puzzle-bravo}.mp3` | ≈ 0,3 |
| 11/11 | Pas à pas · Les fractions : 27 images 9:16 (`flux_3_image`) + 33 phrases de Céline (une par prise) + 9 prises groupées non utilisées | `essil/videos/fractions-*.mp4` | ≈ 67 |
| 11/11 | Les Écuries d'Essil : 12 races, 10 robes, 8 outils de pansage, le filet, la selle, l'image d'accueil (`flux_3_image`) + 3 refaites (selle sortie avec un pommeau western, cure-pied sorti sans crochet) | `essil/ecuries/img/*.webp` | 72 |
| 11/11 | Médina Express : 8 têtes vues de dos (`flux_3_image`, 1:1, l'avatar en référence, « same character… seen exactly from behind… The face is not visible at all ») ; essai de corps animé pour Essil : 1 image de dos en course sur fond vert + 1 vidéo `kling3_0` std 3 s sans son (6,5 crédits : 2 l'image + 4,5 la vidéo) | `jeux/avatars/*-dos.webp`, `jeux/medina/corps-essil.webp` | 34 |
| 11/11 | Médina Express, corps animés : 7 images de dos sur fond vert (14), 23 vidéos `kling3_0` std 3 s sans son à **4,5 crédits** (103,5 : course, saut, accroupi pour 8 personnages), 44 planches habillées `flux_3_image` à 2 crédits (88 : 40 tenues, 1 essai, 3 astronautes refaits sans vrai gain). Planche verte envoyée par `media_upload`, `aspect_ratio: auto` ; l'image revient en 976 × 1065, poses et places conservées | `jeux/medina/corps-*.webp` (48), scripts `docs/medina-corps/` | 205,5 |
| 11/11 | Médina Express, le policier : 1 image de dos sur fond vert (`flux_3_image`, l'image de départ d'Anis en référence pour le style et la pose, job `d7005857-e7c7-44ce-bb08-b86bdfe06f7a`) + 1 vidéo de course `kling3_0` std 3 s | `jeux/medina/policier.webp` | 6,5 |
| 11/11 | Jasmin 2, héros de profil : 8 images debout de profil sur fond vert (16), 8 vidéos de course (36), 8 vidéos de saut **non utilisées** (36 : la tête sort du cadre), 1 course refaite pour Nour (4,5 : le mot « treadmill » avait fait apparaître un tapis de course) | `jeux/jasmin2/corps-*.webp` (8), script `docs/jasmin2-corps/sheet2.py` | 92,5 |
| 11/11 | Jasmin 2, face, soupir et tenues : 8 images de face (16), 8 retouches « soupir » à partir de l'image de face (16), 40 planches habillées (80 ; 1 échec non facturé, relancé). Consigne des tenues : « keep the same 24 figures (side views facing right, and front views in the last row)… » ; l'astronaute des 3 mascottes garde une combinaison crème | `jeux/jasmin2/corps-*.webp` (48) | 112 |
| 11/11 | Jasmin 2, créatures : 4 images 1:1 sur fond vert (scorpion, crabe de face, mouette, Scorpion d'Or ; 8) + 6 vidéos `kling3_0` std 3 s 1:1 (marche du scorpion, du crabe, vol de la mouette, boss qui fonce, sonné, qui lance ; 27). Toutes réussies du premier coup | `jeux/jasmin2/{scorpion,crabe,mouette,scorpion-or}.webp` | 35 |
| 11/11 | Jasmin 2, chat, grenouille, cigogne : 3 images 1:1 (6) + 3 vidéos `kling3_0` std 3 s (13,5), réussies du premier coup | `jeux/jasmin2/{chat,grenouille,cigogne}.webp` | 19,5 |
| 11/11 | Jasmin, formule mixte : 5 images (10 : faucon, chauve-souris de face, hérisson en deux vues dans une image 16:9, cactus sur fond bleu, poisson) + 2 vidéos de vol (9). Une image du poisson refusée à tort par le filtre (« nsfw », non facturée) : relancée sans le mot « plump » | `jeux/jasmin2/{faucon,chauve-souris,herisson,herisson-boule,cactus,poisson}.webp` | 19 |
| 11/11 | Jasmin, 3 mondes et l'ivrogne : 3 décors 21:9 (6, avec `monde7.webp` envoyé comme référence de style, media `0ec6927f-7085-40e5-84df-b9f01a9a5d20`), l'ivrogne en deux poses dans une image 16:9 (2), la chèvre (2), le poulpe (2) | `jeux/jasmin/monde19-21.webp`, `jeux/jasmin2/{ivrogne,chevre,poulpe}.webp` | 12 |
| 11/11 | Jasmin, 3 décors de plus 21:9 (Bizerte, Testour, Monastir), même référence de style | `jeux/jasmin/monde22-24.webp` | 6 |
| 10/11 | La Planète des Nombres (Amine) : 8 aliens (2 refaits pour être bien originaux : le vert à un œil et le rose à grandes oreilles rappelaient des personnages connus), soucoupe, décor et accueil (`flux_3_image`, fond blanc détouré par remplissage depuis les bords) ; voix de Julian : les nombres de 0 à 59 en 6 prises de dix (« Zéro. Un. … Neuf. Voilà. », découpées aux silences avec `split2.py`), « Soixante » et 19 consignes à part | `amine/nombres/*.webp`, `amine/nombres/voix/*.mp3` | 28 |
| 10/11 | Nouvel avatar de Salma : 3 propositions (`flux_3_image`, 1:1), références = 3 gros plans de son visage recadrés (sans le fond ni son frère) + l'avatar d'Essil pour le style ; choix 1 retenu (job 1960c07c…) | `jeux/avatars/salma.webp` | 6 |
| 10/11 | Salma refaite sur 9 images (retouche `flux_3_image` : 1re référence = l'ancienne image, 2e = le nouvel avatar ; consigne « Edit the first image. Keep everything exactly the same… Only change the girl… ») + vidéo d'accueil du Jasmin refaite (`kling3_0`, 5 s, std, sans son, même image au début et à la fin) | `jeux/avatars/salma-{dragon,licorne,phenix}.webp`, `ludo-famille`, `grimpe-glace`, `jeux/cartes/{verbes,hydre}.webp`, `jeux/jasmin/titre.{webp,mp4}`, `salma/meteo/titre.webp` | 25,5 |
| 10/11 | Têtes de profil pour le héros du Jasmin : 8 images (`flux_3_image`, 1:1, l'avatar en référence, « same character… clean side profile view… looking to the RIGHT ») | `jeux/avatars/*-profil.webp` | 16 |
| 11/11 | Têtes « soupir » du héros du Jasmin : 8 images (`flux_3_image`, 1:1, l'avatar en référence, « Exactly the same image… Only the expression changes: a funny bored sigh… ») — même cadrage que l'avatar, donc même réglage de tête | `jeux/avatars/*-soupir.webp` | 16 |
| | **Total** (solde Higgsfield le 11/11 au soir : 1,1 crédit ; renouvellement vers le 7/12, les crédits non utilisés sont remis à zéro) | | **≈ 1 330** |

La carte mythique de Salma (`verbes`) a une crête de plumes qui rappelle une coiffe ; publiée telle quelle à la demande du papa (02/11).

Originaux PNG sur le PC : `OneDrive\Amine\grande section\avatars serpent legendes\` (avatars, cartes, illustration ; sous-dossier `cartes ardoise\` pour les cartes des skins et les cartes rares) et `OneDrive\Salma etude\video-cheval\` (vidéos de Salma).

### Identifiants à réutiliser (même visage, même style)

Avatars (à passer en `image_references` pour garder la ressemblance) :

| Personne | Job de l'avatar | Visage recadré (media) |
|---|---|---|
| Essil | `b227d137-954b-4b50-92b9-48d38093f44d` | `b9b454c0-6984-4a8f-8a58-65e1c6fb25d1` |
| Salma | `1960c07c-bf62-41bc-84bf-441acc842e25` (nouvel avatar du 10/11 ; l'ancien : `6f770cde-3515-4b15-a440-199ce7fa29b0`) | `9d549ae9-421c-4bc2-b097-f85bc5a05cbc` (et photo de la vidéo : `85b8bc08-b5b9-46ee-b7b9-bfcab9174a83`) |
| Amine | `5f2f13ce-4ac0-474e-a2f6-ac2c9009ec46` | `99a026b6-35df-49d8-8a73-04d6a5a2debb` |
| Anis | `89ebb3d9-6c6a-4e61-8ff4-79fd2ae7ce2c` | `be2d86c4-32d0-4204-ab4d-fce778095040` |
| Imen | `9a51905a-ec98-49a9-9a17-3fbf1f85ab10` | `fd516196-f994-4f02-8093-5c20cb0201b9` |

Tenues des avatars : Essil sweat bleu marine à étoile dorée (fond bleu-violet) ; Salma sweat rose zippé, cheveux lisses mi-longs (fond bleu-vert ; depuis le 10/11) ; Amine tee-shirt orange au petit dragon vert (fond violet-orange) ; Anis polo bleu col rose (fond vert sarcelle) ; Imen haut bordeaux, cheveux longs lisses (fond framboise-corail).

### Style des prompts qui marchent

- Avatars : « Stylized 3D animated-movie character portrait of the [âge] [girl/boy/man/woman] in the reference photo: keep face shape, eyes, eyebrows, hair recognizable… Head and shoulders, centered, facing camera. Plain smooth gradient background… Bright cheerful video game avatar, high quality render, no text. »
- Cartes légendes : « …the same [person] as the reference (same face, hair, outfit), proudly riding on the back of a giant friendly cartoon [snake-dragon doré / serpent licorne nacré arc-en-ciel / serpent phénix de feu]… raises one fist in victory… Trophy card composition, ornate thin golden frame… no text. » Format 4:3.
- Une génération peut échouer (statut `failed`) : relancer une fois, elle n'est normalement pas facturée ; vérifier le solde ensuite.
- Voix (`seed_audio`, 0,1 crédit la phrase) : pas plus de 3 ou 4 demandes à la fois (sinon erreur 429) ; une prise de plusieurs phrases séparées par des lignes vides se découpe aux silences, mais les petits mots enchaînés vite se découpent mal : une phrase par demande est plus sûr. **En mp3, les phrases de plus de ~6 s sont coupées à la fin : demander `format: wav`.** Une prise a été refusée deux fois (« nsfw ») sans raison : la refaire en phrases séparées.
- Vidéo (prix vérifiés le 09/11, clip 9:16 de 10 s) : Grok Imagine 1.5 Lite 10 crédits, Kling 3.0 sans son 15 (avec son 20), Wan 2.6 15, Seedance 2.5 70.
- Dessins à colorier (`flux_3_image`, 2 crédits) : « Simple children's coloring book page for a 5-year-old, strictly black and white line art, absolutely no color. [scène]. Bold thick uniform black outlines on a pure white background, only big simple closed shapes (about 40 areas), no tiny details, no texture, no shading, no gray, no hatching, no solid black areas, no text, no frame. » Ne pas écrire « white houses » ni « blue » : le dessin sort colorié. Pour un personnage : « Full body, front view, standing, centered… whole character visible from head to feet… hair is outlined, not filled ». Ensuite : niveaux de gris, contraste (70 → 190), WebP.
- Schémas à légender (filet, selle) : demander « no text, no labels », puis regarder l'image de près et vérifier chaque partie ; pour une selle anglaise, écrire « absolutely no horn » (sinon un pommeau western apparaît). Les numéros sont posés par nous (positions en %).
- Mascottes des invités (références) : Nour `29f9748f-b058-4efa-ac06-bffd967ba649`, Yasmine `f2eeda05-aedf-48d3-ad5d-999b40f59a3e`, Farès `bee2dfe5-42b3-46f9-a241-4ce1e94f010e`.
- Personnage animé à incruster (fond vert) : demander « perfectly flat solid pure green chroma key background, no shadow » pour l'image, puis en vidéo « runs in place… stays exactly centered… static locked camera… background stays flat green ». Le découpage du vert se fait bien (vert − max(rouge, bleu)).


### ComfyUI en local (depuis le 12/11) : la solution gratuite quand il n'y a plus de crédits

- **Où** : PC du papa (« laptopimen »), Comfy Desktop, RTX 5060 Laptop 8 Go, 32 Go de RAM. ComfyUI doit être ouvert, ainsi que l'application Claude.
- **Comment Claude s'en sert** : navigateur intégré de l'application Claude sur `http://127.0.0.1:8188` (`/prompt` pour lancer, `/queue`, `/history`, `/object_info`) ; fichiers par le dossier connecté `C:\Users\azili\AppData\Local\Comfy-Desktop\ComfyUI-Shared` (`input`, `output` ; les gros lots passent en zip). Une image de `output` se recharge avec `nom.png [output]`. Le shell du PC ne joint pas ComfyUI (seul le navigateur intégré le peut).
- **Modèles installés** : Wan 2.2 image vers vidéo 14B (haut et bas bruit) + accélérateurs lightx2v 4 étapes, VAE wan 2.1, encodeur umt5 ; Wan 2.2 5B ; **FLUX.2 klein 4B** (`flux-2-klein-4b-fp8`, `qwen_3_4b`, `flux2-vae`, 12,5 Go, téléchargés le 12/11 avec l'accord du papa par le gestionnaire de ComfyUI : `POST /v2/manager/queue/install_model` puis `/v2/manager/queue/start`).
- **Vitesses mesurées** : vidéo Wan 480 × 832, 33 images, 4 étapes : environ 75 s ; image FLUX.2 klein (texte ou retouche, 4 étapes) : 4 à 10 s.
- **Ce que ça fait bien** : faire bouger un personnage ou une créature existants (s'asseoir, courir, nager), changer une tenue en gardant le visage, créer un objet isolé sur fond uni. Demander un fond uni vert (bleu ou magenta si l'objet est vert) pour détourer.
- **Recettes** : graphes décrits dans le journal du 12/11 ; scripts `docs/houma/entree_comfy.py`, `build_assis.py`, `build_tenues.py`, `detoure.py`, `docs/jasmin2-corps/objets_comfy.py`, `bande_comfy.py`.
- **Règle** : gratuit, donc pas de prix à annoncer ; mais tout **téléchargement de modèle** se demande au papa (nom, source, taille).

#### Nuit du 12 au 13/11 : Ma maison
- 81 meubles/objets (texte → image, FLUX.2 klein 4B, 4 étapes, ~20 s chacun avec la file pleine) : prompt « Photorealistic studio product photo of … straight front view … isolated on a flat uniform pure green background » (fond bleu pour ce qui est vert ou blanc : plantes, dinosaure, tortue, lapin, toilettes, couscoussier, darbouka). Liste et prompts : `docs/maison/catalogue.py`.
- 20 textures 768 px (« Seamless flat texture photo, … ») rendues raccordables par miroir.
- Gestes : 5 retouches par personnage et par tenue (8 × 10 × 5 = 400 images) depuis l'image debout (`input/houma_<id>[_<tenue>].png` ou `output/houma2/<id>_<tenue>_00001_.png`), prompt « The same person with exactly the same face, hair, body and the same clothes, now … Full body visible … same size and same position in the frame … plain flat bright green background », graine 777. Le cadrage est bien gardé : le saut reste en l'air.
- Astuce : `POST /prompt` avec `"front": true` fait passer une image devant la file.

### ElevenLabs Sound Effects (depuis le 12/11) : les bruitages

- Compte ElevenLabs du papa, **formule Starter** (~6 $/mois, 30 000 crédits, usage commercial, pas de mention obligatoire). Il se connecte lui-même dans le navigateur intégré ; Claude n'entre jamais le mot de passe.
- Claude génère dans `elevenlabs.io/app/sound-effects` (modèle v3, durée auto, ambiances : boucle activée + 15 s), puis télécharge les 4 variantes en MP3 depuis l'onglet **Historique** (un fichier par variante, nommé `<20 premiers caractères du prompt>_#<n>-….mp3`, dans `Téléchargements` du PC ; copie dans `Téléchargements\sons-11labs\`).
- Liste des sons et prompts : `docs/sons/sons.json`. Préparation : `python3 docs/sons/prepare.py <dossier des mp3>` → `jeux/sons/<jeu>-<nom>.mp3` (mono, niveau égalisé, silences coupés, longueur plafonnée) + `jeux/sons/variantes/` + `choix.json`.
- Choix de variante : automatique (la plus proche d'une durée idéale), à corriger à l'oreille par le papa sur `jeux/sons/ecoute.html` (« pièce 3 » → mettre 3 dans `docs/sons/choix.json` et relancer).
- 1re session (12-13/11) : 34 sons × 4 variantes = 136 fichiers.
- 2e session (13/11, nuit) : 24 ambiances du Jasmin (`jasmin-amb-1` à `24`, boucle + 15 s, prompts dans `docs/sons/sons.json`) ; 2 à 5 variantes selon les mondes.
#### 13/11 (après-midi) : Jasmin 3 et Ma Houma
- Les aides ComfyUI sont maintenant écrites dans `docs/comfy/aides.js` (à recoller dans l'onglet 127.0.0.1:8188 si la page est rechargée) : `__t2i`, `__edit`, `__assis` (Wan 2.2), `__fpb`, `__q`.
- Jasmin 3 : 7 images par monde × 23 (fond 1792×768, décor du milieu 1536×640 détouré, 4 textures 768, pics détourés). Fond bleu pour le décor des mondes 2, 4, 10, 15, 17, 18, 19, 21, 23 et pour les pics des mondes 2, 14, 15, 16, 17, 19, 23.
- Ma Houma : 32 tenues debout + 32 yeux fermés + 32 vidéos assises (Wan) + 160 gestes ; Imen en sport refaite en violet (le vert clair partait au détourage). 62 décorations, dont 20 arabesques et graffitis.


### ElevenLabs : les voix de « Je lis ! » (14/11)
- Le papa n'a plus de crédits Higgsfield : les voix se font avec son compte ElevenLabs Starter (30 000 crédits par mois ; 31 291 restants le 14/11 à 1 h).
- **Voix** : **Lulu - Je lis (Amine)**, créée avec *Voice Design* (description : jeune femme française joyeuse, voix de dessin animé pour enfants, articulation claire ; 171 crédits) ; **Olivier - Eccentric and Aged** (acteur français, vieux personnage de dessin animé) et **Jon - Le Narrateur Cinématique** (voix française douce pour histoires d'enfants), ajoutées depuis la bibliothèque (gratuites). Philippine et Darling ont un **tarif personnalisé** (0,25 $ / 1000 crédits facturés par leur auteur) : non ajoutées.
- **Méthode sans téléchargements** : page Text to Speech, modèle Eleven v4 ; une phrase par génération, tapée par un petit script dans l'éditeur ; le son arrive dans la page (lecteur `data:audio/mpeg`) et il est rangé dans la base du navigateur (IndexedDB `jelis`), puis **envoyé directement au site** par la page elle-même (`fetch` vers `amine/lire/depot.php`, protégé par un jeton dont seule l'empreinte SHA-256 est dans le dépôt public ; le jeton n'est gardé que dans la page de génération) : **aucun téléchargement à accepter**. Les sons sont rangés hors du site public dans `famille-data/lire-voix/<voix>/<clé>.mp3` (un redéploiement n'y touche pas, et pas dans le dépôt GitHub), servis par `amine/lire/son.php`, listés par `amine/lire/voix.php`. Le silence et le volume sont réglés à la lecture (Web Audio). Pour refaire un son : le régénérer dans la page et le renvoyer, il remplace l'ancien. Pour une nouvelle série de sons il faudra un nouveau jeton (en générer un, mettre son empreinte dans `depot.php`). 157 phrases par voix (≈ 930 caractères, chaque génération en donne 2 versions).

### 14/11 (soir) : portraits de la famille avec ComfyUI
- Sources : photos et vidéos du papa dans `OneDrive\Amine\grande section\avatar\version2` (selfie d'Anis, Salma en rose, Essil, Amine dans les vidéos avec papa) ; images des vidéos tirées avec ffmpeg sur le PC ; visages recadrés dans `ComfyUI-Shared/input/v2/`. **Les photos ne sont jamais publiées.**
- Portrait : `__edit([visage], « Stylise <description> as a 3D animated family movie character, staying very close to the real person: keep the exact same warm olive-tan North African (Tunisian) skin tone…, head and shoulders, plain <couleur de l'enfant> background »)`. Sans la phrase sur le teint, la peau sort trop claire (essai v2). Choix du papa : v2 Salma, v3 Essil et Amine.
- Coloriage : 1) personnage en couleur, en pied, style livre de coloriage (`__edit` sur une toile 768×1024 avec le portrait en haut) ; 2) le même en noir et blanc (« all colours removed… only clean thick black outlines ») ; seuil à 150 pour un noir et blanc pur.
- Affiche : `__edit` avec 6 images (toile 896×1152 + 5 portraits, 0,45 Mpx chacun, toile à 1,1 Mpx), tenues décrites une à une sinon Imen disparaît ou change de robe ; graine 8484 retenue ; titre posé ensuite (Playwright, police Bricolage Grotesque).
- Mur : `__t2i` 1600×704 « empty cork noticeboard in a sky-blue wooden frame on a whitewashed Tunisian wall, bougainvillea », graine 8080.


### 14/11 (nuit) : Jasmin · Stage 2, monde 1 avec ComfyUI
- Images fixes (FLUX.2 klein, `__t2i`, préfixe `s2/m1_<nom>`) : photo de ruelle de la médina (`fond`), façades (`maisons`, fond vert), textures carrées `t_mur` (mur à la chaux), `t_fissure` (enduit fissuré), `t_planche` (planches turquoise), `t_dessus` (tuiles vertes : on garde la bande de tuiles), objets sur fond vert (caisse, ballon rond en cuir, pierre, clé, levier, grille, porte verrouillée, porte de sortie, échelle, sac), ennemis de profil sur fond vert 832 × 480 (garde en jebba et chéchia, chien, vieux marchand avec une orange). La pierre grise a des reflets verts : `build_m1.py` la découpe en ovale.
- Animations (Wan 2.2 image → vidéo, aide `__anim`) : le garde qui marche, le chien qui court, le marchand qui lève l'orange (il ne la lance pas vraiment : la bande suit l'aller-retour du bras). Les images fixes sont copiées dans `input/s2_<nom>.png` avant.


---

# `docs/jeux-3d.md`

## Les jeux de la famille (3D, Grimpe-Glace, La Légende du Jasmin)

Serpent et Ludo utilisent Three.js 0.170 (`lib/three-0.170.0.module.min.js`), sans autre dépendance en ligne que Google Fonts. Ils partagent le même univers : panneaux sombres posés sur la scène 3D, raretés **commun** (gris-vert), **rare** (bleu), **épique** (violet), **légendaire** (or), coffres mystère, défis légendaires et **cartes légendes** Higgsfield.

Avatars et cartes : `jeux/avatars/<prénom>.webp` (essil, salma, amine, anis, imen) et `jeux/avatars/<prénom>-<légende>.webp` (légende = dragon, licorne, phenix ; 15 cartes). Si l'image manque, le jeu affiche un émoji (🚆 🦉 🎃 🧔 👩) ou la première lettre du prénom.

### Serpent Légendes — `jeux/serpent-legendes.html`

- **Caméras** : vue du dessus (glisser le doigt ou croix) ou derrière le serpent (↰ ↱ ou toucher gauche/droite de l'écran).
- **Niveaux** : Facile (murs magiques, on ressort de l'autre côté : pour Amine), Normal (rochers), Expert (rapide). Niveau +1 toutes les 6 pommes.
- **Mondes** : Prairie ; Plage, Neige, Espace débloqués par le record 15 / 25 / 40, ou achetés avec des tickets ; **Bibliothèque** uniquement avec des tickets.
- **Pièces** : 2 par pomme, 10 par pomme d'or (rare, 8 s). **Coffre** 30 pièces : commun 55 %, rare 32 %, épique 13 %, toujours un skin nouveau.
- **28 skins** : 6 communs, 5 rares (zèbre, abeille, pastèque, coccinelle, chat tigré), 4 épiques animés (arc-en-ciel, lave, cristal de glace, galaxie), 3 légendaires par défi (Dragon d'or : longueur 30 ; Licorne étoilée : 600 pièces gagnées en tout ; Phénix : 10 pommes d'or), 2 « Savoir » (Crayon magique en boutique, Craie magique par l'Ardoise), 4 **mythiques** et 4 **secrets** (ci-dessous). Les illustrations des cartes sont dans `jeux/cartes/<skin>.webp` (montrées dans « Mes skins », floues tant que le skin n'est pas gagné).
- **Brillants ✨** : chaque skin gagné (coffre, défi, boutique, mythique, secret) a 1 chance sur 10 d'être brillant (`data.shiny`) : reflet arc-en-ciel sur la carte, vague de lumière sur le serpent. Les cartes de l'Ardoise tirent leur chance sur l'Ardoise (`amine-ecriture.shiny`).
- **Mythiques 🔥** (rose, au-dessus de Légendaire ; seulement pour Essil, Salma, Amine) : Serpent de l'Alphabet (Amine : 26 lettres attachées à 2 ⭐ ou plus), Serpent des Verbes (Salma : 3 ⭐ aux 8 étapes de l'Atelier), Serpent Polyglotte (Essil : chaque leçon de Deutsch Express et Via Romana, 24), **Hydre Missaoui** (les 3 enfants apprennent pendant une même semaine ; gagnée par chacun). Calculés par le serveur (`?action=rewards`).
- **Secrets 🌙** : Aurore boréale, Tonnerre, Arc-de-Lune, Trésor ; un par tranche de **5 jours d'apprentissage d'affilée** (jours où un cours a changé, jeux exclus). Cachés (« ??? ») tant qu'ils ne sont pas gagnés ; la série du jour s'affiche en 5 pastilles.
- **Cartes de l'Ardoise magique** : les cartes gagnées par Amine (`amine-ecriture.cards`) sont ajoutées à ses skins au chargement (« 🃏 nouvelle carte ! »). Skin exclusif **Craie magique** (rareté Savoir).
- **Boutique du savoir 🎟️** (écran Skins, visible seulement pour un joueur qui a une source de tickets) : Plage 15, Neige 30, Espace 50, Bibliothèque 70, Crayon magique 40, Serpent Monnaie 45 (pièces d'or, d'argent et de cuivre). Sources déclarées dans `STUDY` (Salma ← `salma-verbes` + `salma-geometrie` + `salma-monnaie` + `jasmin`, tickets additionnés ; Essil ← `jasmin` ; Amine ← `amine-ecriture` + `jasmin` ; Amine ← `amine-ecriture`, tickets + cartes). Tickets disponibles = tickets gagnés (le plus grand entre la copie locale et le serveur) − `spentT`.
- **Sauvegarde** `serpent3d:<Prénom>` {coins, total, skins, shiny, skin, best{facile,normal,expert}, maxLen, gold, games, spentT, bought, t}, préférences `serpent3d-prefs`. Records en ligne `serpent3d` par niveau.

### Ludo Légendes — `jeux/ludo-legendes.html`

- **Règles classiques simplifiées** : un 6 pour sortir ; on rejoue après un 6, une capture ou un pion arrivé ; un pion capturé retourne à la maison, sauf sur les 8 cases sûres (4 départs + 4 étoiles) ; arrivée au compte exact ; la partie s'arrête au premier joueur qui a tous ses pions au centre. 2 ou 4 pions par joueur, 2 à 4 joueurs (places 0 rouge, 1 vert, 2 jaune, 3 bleu ; à 2 joueurs : rouge contre jaune).
- **Plateau** : grille 15 × 15, 52 cases de tour (`TRACK`), 5 cases d'allée par couleur (`HOME`), progression d'un pion 0 → 56 (−1 = maison).
- **Contre la machine** : IA par score (capture > arrivée > sortie > entrée dans l'allée > case sûre ; évite les cases à portée d'un adversaire).
- **En ligne, chacun sur sa tablette** : « Créer en ligne » → salon avec un code de 4 caractères ; « Rejoindre » + code, ou **lien d'invitation** `…/jeux/ludo-legendes.html?code=ABCD` (bouton « 📤 Inviter un ami » : partage natif, sinon WhatsApp / SMS / copier ; l'ami écrit son prénom et arrive dans le salon). L'hôte peut ajouter ou retirer des machines et lance la partie ; **c'est sa tablette qui fait jouer les machines**. Chaque tablette voit sa couleur en bas à gauche. Partie disponible 12 h ; rejoindre avec le même code reprend sa place (identifiant d'appareil `ludo-client`).
- **Fonctionnement réseau** : la tablette dont c'est le tour lance le dé et joue, calcule le nouvel état complet et l'envoie avec la version lue ; le serveur refuse (409) si quelqu'un a joué entre-temps. Les autres tablettes interrogent le serveur chaque seconde et rejouent l'animation du dernier coup (`ev`). Détails dans `docs/serveur.md`.
- **Pièces** : 40 / 20 / 12 / 10 selon la place, +3 par pion renvoyé, +2 par pion arrivé. **Coffre** 40 pièces : un pion, un dé ou un plateau non possédé.
- **Collection** : pions (classique, bille de verre, champignon, petit roi, robot, fusée), dés (blanc, bois, doré, cristal, feu, galaxie), plateaux (Jardin, Désert tunisien, Château, Espace) ; **pions légendaires** par défi (Dragon d'or : 3 victoires ; Licorne étoilée : 15 pions renvoyés ; Phénix : 25 six) avec leur carte légende.
- **Sauvegarde** `ludo3d:<Prénom>` {coins, total, owned[cat:id], pawn, dice, board, wins, games, caps, sixes, t}, préférences `ludo3d-prefs`, dernier code `ludo-last`. Records en ligne : victoires (`ludo3d`, variante `victoires`).
- Illustration de l'écran d'accueil : `jeux/avatars/ludo-famille.webp` (la famille autour d'un plateau géant, Higgsfield).

### Grimpe-Glace — `jeux/grimpe-glace.html` (2D)

Jeu de plateformes vertical sans fin, inspiré des jeux de tour des années 2000 (nom et héros originaux). Moteur maison en Canvas 2D, sans dépendance ; physique à pas fixe (120 pas / s).
- **Héros** : l'avatar du joueur (`avatars/<prénom>.webp`, visage dans un cercle) en tenue d'hiver streetwear (bonnet, sweat à sa couleur, pantalon large, baskets), dessiné et animé en code (course, saut, chute, glissade, vrille dans les grands sauts).
- **Saut automatique** : le héros s'envole quand il dépasse le **bord** d'une plateforme, ou quand il court contre un mur. Hauteur = 790 + 0,86 × vitesse (vitesse max 560) : avec de l'élan on franchit 3 à 4 étages. Option « bouton Saut » dans les réglages (et Espace au clavier). Inertie et glisse : accélération progressive, freinage faible (glace bleu clair : très faible), rebond sur les murs en l'air.
- **Étages** tous les 92 unités ; largeur qui diminue avec la hauteur ; types : normale, étroite, glace (glisse), mobile (◀ ▶), fragile (se casse 0,55 s après l'atterrissage), champignon-ressort (saut × 1,55) ; étoiles bonus (+50). Un grand palier tous les 50 étages, qui annonce un nouveau monde.
- **6 mondes** : la Tour de Givre, la Grotte de Cristal, le Ciel d'Aurore, le Royaume des Nuages, le Palais du Dragon de Glace, le Cosmos Gelé (couleurs, aurore, cristaux ou braises, parallaxe).
- **Tour qui monte** dès l'étage 5, un cran plus vite toutes les 30 s (8 vitesses, « Plus vite ! »). On perd en tombant sous l'écran.
- **Score** = 10 × étage max + combos + étoiles. **Combo** : sauts de 2 étages ou plus enchaînés avant que la barre (3 s) se vide ; bonus = étages du combo². Messages « Bien ! Super ! Génial ! Fantastique ! Incroyable ! » et « Joli combo… Combo COSMIQUE ! ».
- **Tenues** débloquées par l'étage record : Classique, Écharpe arc-en-ciel (25), Cape de givre (60), Couronne de glace (100), Ailes de cristal (160), Aura dorée (250).
- **Sons** : bruitages et musique électro / hip-hop synthétisés en WebAudio (originaux), coupables séparément.
- **Commandes** : boutons ◀ ▶ en bas sur tablette (multitouch), flèches ou Q / D au clavier, Échap pause, R recommencer, manette. Plein écran dans les réglages.
- **Sauvegarde** `grimpeglace:<Prénom>` {best, bestFloor, bestCombo, games, tenue, t} (relue sur le serveur), préférences `grimpeglace-prefs`. Records en ligne `grimpeglace`, variantes `score` (jusqu'à 999 999) et `etages`.
- Illustration du menu : `jeux/avatars/grimpe-glace.webp` (la famille saute dans la tour de glace, Higgsfield).

### La Légende du Jasmin — `jeux/legende-du-jasmin.html` (plateforme 2.5D)

Jeu de plateforme original à défilement horizontal, univers tunisien (cahier des charges du papa : `OneDrive\Amine\grande section\projet clone mario\`, version solo). Moteur maison Canvas 2D, physique à pas fixe, niveaux construits par morceaux (`buildLevel` : départ, trou, escalier, blocs, plateformes, pics, plateformes mobiles, dalles fragiles, maison secrète, lanterne, sortie).
- **Héros** : l'avatar du joueur (visage) en tunique à ses couleurs. Saut variable (appui court / long), tolérance au bord (`coyote`) et appui mémorisé, contrôle en l'air, course qui accélère toute seule (ou B / Maj).
- **18 mondes** (fonds Higgsfield en parallaxe, répétés en miroir), dans l'ordre du voyage `ORDER = [1, 6, 7, 15, 10, 17, 11, 14, 2, 12, 18, 13, 8, 9, 16, 3, 4, 5]` : Sidi Bou Saïd · la Médina de Tunis (toits, chats, **tapis volants**) · les Ruines de Carthage (pierres qui s'effritent, crabes, mouettes) · **l'Aqueduc de Zaghouan** (monde 15 : le canal de l'aqueduc `M.aqueduct` pousse le héros, cases `v` vers l'avant et `u` vers l'arrière, piliers `a` au-dessus de la rivière ; cigognes) · la Côte de Tabarka (criques `M.sea` : on **nage**, A = une brasse, bond hors de l'eau ; poissons, corail) · **le Lac d'Ichkeul** (monde 17 : on traverse le marais sur le dos des **flamants roses** `M.flamingo` ; grenouilles, cigognes, roseaux) · l'Amphithéâtre d'El Jem (**pierres qui tombent** `stone` : elles tremblent 0,45 s puis tombent, remontent ; ascenseurs de pierre) · **Kairouan** (monde 14 : la Grande Mosquée, on **nage** dans les bassins des Aghlabides, les ressorts sont des **tapis roulés**, chats, arcades) · l'Oasis de Tozeur · le Chott el-Jérid (**mirages** `m` : plateformes qui pâlissent puis disparaissent, chacune à son rythme) · **le Canyon de Tamerza** (monde 18 : la cascade et son bassin où l'on nage ; **coups de vent** : cycle de 7 s, « 💨 Le vent se lève ! » puis une rafale de 2,4 s qui pousse vers l'arrière, traits blancs à l'écran ; rochers qui tombent) · le Lézard Rouge (**le petit train** `M.train` traverse les gorges et s'arrête à chaque quai) · l'Île de Djerba (**marée** dans les cuvettes `w`) · les Maisons de Matmata (**tunnels** dans le noir) · **le Ksar Ouled Soltane** (monde 16 : on grimpe les greniers ghorfas, ascenseur, **sacs de grain** qui tombent au bout d'une corde, hérissons) · les Dunes du Sahara · les Montagnes d'Aïn Draham (glace) · le Palais du Scorpion d'Or (boss, toujours la fin). Les numéros de monde (1 à 18) ne changent pas : ils servent aux sauvegardes et aux records ; seul le numéro affiché suit l'ordre du voyage. Effet 2.5D : chaque bloc a une face du dessus et une face de côté.
- **Commandes tactiles** : croix ◀ ▶ en une seule zone (on glisse le pouce sans le lever), A saut, B course/tir ; toutes les touches se relâchent quand plus aucun doigt ne touche l'écran ou qu'un menu s'ouvre. Vitesse plafonnée (205, 285 en courant, 360 avec le thé).
- **Blocs** : 📚 savoir (question selon qui joue : Amine = compter, lettres, couleurs ; Salma = soustraction, monnaie, conjugaison, géométrie, anglais ; Essil = allemand, latin, multiplication ; Anis et Imen = Tunisie + additions ; **invités** = culture tunisienne niveau adulte, en français, sans calcul ni langues (`QUIZ_TN`, 65 questions : histoire, géographie, cuisine, musique, sport, tirées sans répétition)) ; 🪔 bonus (🎩 chéchia = un coup en plus, 🌶️ harissa = piments à lancer avec B, 🍵 thé à la menthe = vitesse) ; 🪙 dinars ; briques cassables.
- **Ennemis** : scorpion, faucon, hérisson (en boule quand on saute dessus, on le fait rouler), cactus qui lance des figues de Barbarie. **Boss** : le Scorpion d'Or (fonce, se cogne au mur, sonné ⭐ : on lui saute sur le dos ; 3 coups ; en phase 2 il lance des braises).
- **Dangers** : trous, eau / braises, pics (par paires). Plateformes mobiles, dalles fragiles, derbouka-tremplin. Lanternes 🏮 = points de sauvegarde (chaque lanterne se pose sur un sol sûr, et la réapparition cherche toujours un sol sans eau ni pics : `safeSpot`). Porte bleue = sortie. 3 **jasmins dorés** 🌼 par niveau (dont un dans une maison secrète, derrière un faux mur).
- **Fin de niveau** : temps, dinars, jasmins, ennemis, bonnes réponses, score, 1 à 3 étoiles (fini ; 60 % des dinars ; 3 jasmins). 5 vies par essai. Le monde suivant du voyage se débloque (`isOpen` : premier monde, ou monde d'avant réussi ; les mondes 1 à 5 déjà ouverts avec l'ancien `unlocked` le restent ; un monde ouvert dans l'ancien voyage à 13 mondes `ORDER13` le reste aussi).
- **Tickets 🎟️** : 1 par bonne réponse + 2 par jasmin trouvé la première fois ; ajoutés à la Boutique du savoir de Serpent Légendes (Essil, Salma et Amine).
- **Commandes** : croix à gauche, A (saut) et B (tir / course) à droite, taille réglable ; clavier (flèches / Q D, Espace / Z, Maj / X, Échap) ; manette. Paysage (message « tourne la tablette » en portrait).
- **Sons** : musique originale en mode hijaz avec rythme de darbouka (maqsoum), bruitages synthétisés.
- **Sauvegarde** `jasmin:<Prénom>` {unlocked, best{n:{score,stars,time}}, gems{n:[…]}, tickets, answers{ok,ko}, games, t}, réglages `jasmin-prefs`. Records en ligne `jasmin`, variantes `monde1` à `monde18`.
- Images : `jeux/jasmin/` (titre, monde1 à monde18, boss).

- **Mascottes** (joueurs hors famille) : trois héros tunisiens Higgsfield, **Nour** (garçon au jasmin, gilet turquoise), **Yasmine** (fille à la tresse et au jasmin, gilet corail) et **Farès** (jeune homme, gilet bleu roi). Dans « Qui joue ? », l'invité écrit son **pseudo** puis touche sa tête ; le choix est gardé avec le pseudo (et son historique) et retrouvé sur les autres tablettes (voir `docs/serveur.md`). Images `jeux/avatars/mascotte-{nour,yasmine,fares}.webp`. Les mascottes s'affichent aussi dans Serpent Légendes, Ludo Légendes et Grimpe-Glace (classements, bouton du joueur, et le héros de Grimpe-Glace).

- Rond de tête du héros : cadrage par avatar dans `HEADCROP` (`[gauche, haut, taille]` en fraction de l'image, recadrage carré), lu par `headCrop()`. Le papa règle les valeurs dans la page « Les têtes du Jasmin » (artifact claude.ai `GmHsWJsfQKKV32z6t81upp`, document `reglages/tetes`), puis Claude les recopie ici et dans Grimpe-Glace (même table `HEADCROP`). Regard du héros (11/11) : `h.lookProf` passe à vrai dès qu'il bouge et le reste à l'arrêt ; après 10 s immobile (`h.still`), retour de face + soupir de 2,2 s (`h.sigh` : épaules haussées, tête `avatarSigh` = `<prénom>-soupir.webp`, nuages de souffle, `sfx.sigh`). Tête de profil (`avatarProf`, `HEADCROP_P` ; la tête suit alors le retournement du corps, alors que la tête de face est remise à l'endroit). Plus de cercle blanc autour de la tête depuis le 10/11 (trait `rgba(20,30,60,.35)` de 1 px).
- Retouches du 10/11 : image d'accueil fixe, animée au survol de la souris ou au toucher (`jasmin/titre.mp4`, Kling, 5 s) ; pièces à hauteur de tête ramassées en passant ; hérisson : 7 piquants, +100 par saut tant qu'il en reste, puis il s'en va (700 points au plus, ou +200 par ennemi renversé si on le fait rouler).

#### Secrets et astuces (pour les parents, à ne pas dévoiler tout de suite)
Dans **chaque monde** il y a trois sortes de secrets :
- **Le bloc invisible ❤️** (`i`, posé par `hid()`) : rien ne se voit, mais en sautant au bon endroit on tape un bloc caché qui apparaît : **une vie en plus**, 3 dinars, +500. Il est toujours à 4 cases au-dessus du sol, au-dessus d'un chemin plat : presque toujours **juste à la fin du premier long passage plat** (au début du monde), parfois un deuxième plus loin.
- **La jarre magique 🏺** (`warp`) : une grande jarre décorée, posée sur un passage plat après la première lanterne (dans le palais : juste avant la lanterne). Quand on s'arrête devant, elle brille et une flèche ⬇ apparaît : **on ne bouge plus une seconde** (ou flèche du bas / S au clavier) et on est aspiré dans la **salle secrète** : une vingtaine de dinars, une rangée de blocs dinars et un cœur ❤️. La jarre au bout de la salle ramène **plus loin dans le niveau** (raccourci). Les dinars de la salle ne comptent pas dans les 60 % de l'étoile : c'est du bonus.
- **La maison au faux mur** : une petite maison blanche de 3 cases ; son mur du bas se traverse et cache un jasmin doré 🌼 + un dinar.

Autres astuces :
- **Les 3 jasmins** de chaque monde : un au-dessus d'un escalier de plateformes, un dans la maison au faux mur, un troisième selon le monde (ressort-derbouka, cuvette de Djerba à marée basse, fond de la crique de Tabarka, au-dessus du train ou de l'ascenseur…). Dans le noir de Matmata, les jasmins brillent un peu.
- **Bloc 🪔** = bonus (chéchia : un coup en plus ; harissa : touche B / Maj / X pour lancer des piments ; thé à la menthe : on court très vite 9 s). Un seul par monde.
- **Briques** : on les casse en tapant dessous ; un ennemi posé dessus tombe en même temps.
- **Hérisson** : on saute dessus, il se roule en boule ; on le pousse et il renverse tous les ennemis sur son chemin (+200).
- **Saut** : appui court = petit saut, appui long = grand saut ; en courant (B ou 1 s d'élan) on saute plus loin. On peut encore sauter une fraction de seconde après le bord. **Sauter sur un ennemi en tenant A** fait rebondir très haut.
- **Nager** (Tabarka) : chaque appui sur A = une brasse ; sans appuyer on coule doucement (pour attraper ce qui est au fond) ; en remontant contre un rocher, on bondit hors de l'eau.
- **Pierres d'El Jem** : elles tremblent avant de tomber : on passe vite, ou on attend qu'elles remontent.
- **Mirages** : une plateforme qui pâlit va disparaître : saute !
- **Le Lézard Rouge** s'arrête 2 s à chaque quai : on monte en marchant, on descend en marchant.
- **Boss** : il fonce, se cogne au mur et reste sonné ⭐ : c'est seulement là qu'on lui saute sur le dos (3 fois). Les piments de harissa l'abîment aussi.
- **Blocs savoir désactivés** (Réglages) : chaque bloc 📚 donne directement 3 dinars, mais plus de tickets.
- **Étoiles** : 1 = fini, 2 = 60 % des dinars, 3 = les 3 jasmins. Les jasmins trouvés une première fois rapportent 2 tickets chacun.

#### Ludo : temps de jeu et joueurs qui partent (10/11)
- `TURN_MS = 10000` : dans `tick()`, chaque nouvelle étape (`ev.n` + tour + phase) relance le sablier `#hg` (SVG dont le sable descend, barre, secondes). L'appareil du joueur joue tout seul à 10 s (`timeUp(false)` : dé au hasard, ou le pion que choisirait l'ordinateur).
- L'« arbitre » (`arbiter()`) fait jouer l'ordinateur et remplace les absents : l'hôte s'il est présent, sinon le premier joueur encore là (présence = le salon, `hello` toutes les 4 s). S'il doit jouer pour quelqu'un (à 10 s + 4 s), il compte `miss` ; au 2e coup manqué, ou si le joueur n'est plus vu depuis 20 s, la place devient `bot:true, left:true` et l'hôte passe à l'arbitre si c'était lui.
- Bouton ✕ en ligne : la place devient `left` tout de suite et l'hôte est transmis. Chaque appareil qui voit une place passer `left` affiche l'annonce (`announceLeft`). En revenant avec le code, `joinOnline` rend la place au joueur.

#### Ludo : accueil et salon (10/11)
Accueil = carte `.mcard` (`.mhead` : image, titre, bouton `#who` ; `.mbody` : `.modes`, `#salonMenu`, `.mrow`). Réglages de la partie dans l'écran `#opts` (fenêtre posée sur le menu). Salon : voir `docs/serveur.md`.

#### Ludo en ligne : discussion (10/11)
Bouton 💬 (uniquement en ligne) : emojis, phrases toutes faites, message libre. Détail du serveur dans `docs/serveur.md`.

### La Légende du Jasmin 2 — `jeux/legende-du-jasmin-2.html` (11/11)

**Depuis le 11/11 (demande du papa), « le Jasmin » désigne cette version.** Tous les liens du site (accueil, espaces des enfants, Serpent Légendes) mènent à `legende-du-jasmin-2.html`, qui s'appelle simplement « La Légende du Jasmin ». L'ancienne page `legende-du-jasmin.html` reste en ligne, marquée « ancienne version », et n'est liée que depuis le bas de la page Progression. Toute évolution du Jasmin se fait donc dans le fichier `-2` ; ne corriger l'ancienne que pour un bug.

Demandé par le papa : reprendre les personnages « en vrai » de Médina Express dans le Jasmin, en gardant l'ancienne version. Le Jasmin 2 est une **copie du Jasmin** où seul le héros change : même aventure, mêmes 18 mondes, **même sauvegarde** (`jasmin:<Prénom>`) et mêmes records (`jasmin`), donc les progrès passent d'une version à l'autre. Un lien sur l'écran-titre de chacune mène à l'autre ; lien sur l'accueil.
- **Le héros** : une planche de profil par personnage (famille et 3 mascottes), `jeux/jasmin2/corps-<id>.webp`, 1056 × 1152, 6 × 4 cases, tourné vers la droite (le jeu le retourne pour aller à gauche) : cases 0-11 la foulée, 12-15 le bond qui monte, 16-19 le bond qui descend, 20-23 debout. Code : `loadBody()` (charge la planche et mesure la tête et les pieds de la case « debout »), `drawBody()` (choisit l'image : debout, foulée selon `h.phase`, bond selon `h.vy`, nage = bond penché), branche `if(bodySheet)` au début de `drawHero` ; chéchia, flamme d'harissa et soupir « pff… » redessinés par-dessus. Hauteur 76 px × `TAILLE2` (Amine .8 … Anis 1.08) ; la boîte de collision ne change pas. Sans planche (pas encore chargée), l'ancien héros s'affiche.
- **Fabrication** (`docs/jasmin2-corps/sheet2.py`) : image `flux_3_image` du personnage debout de profil sur fond vert (références : l'avatar + l'image de dos de Médina Express, pour garder la tenue) → vidéo `kling3_0` std 3 s « court sur place, vue de profil » → foulée qui boucle + image de départ pour « debout ». **Ne pas écrire « treadmill » dans la consigne** (Nour a couru sur un vrai tapis de course, vidéo refaite). Les vidéos de saut de profil n'ont pas servi : le personnage sort du cadre par le haut (tête coupée) ; le saut du jeu est donc la foulée la plus ouverte. Pour un vrai saut groupé, il faudrait une image de départ avec plus de vide au-dessus de la tête.
- **De face et soupir** (11/11, comme dans le Jasmin 1) : au départ le héros est **de face** (case 21) ; dès qu'il bouge il passe de profil et le reste à l'arrêt (case 20) ; après **10 s sans bouger** il se remet de face, hausse les épaules et souffle (case 22, nuages et « pff… », `sfx.sigh`), puis reste de face. Images : `flux_3_image` de face (références : avatar + image de profil), puis la même image retouchée pour le soupir (« shrugs… eyes closed, cheeks puffed… ») ; `docs/jasmin2-corps/face.py` les met à la taille du héros de profil et les range dans la planche.
- **Tenues** (11/11) : les 6 tenues de Médina Express, sur les planches de profil (`corps-<id>-<tenue>.webp`, 48 planches en tout, faites avec `docs/medina-corps/skin.py`). **Même garde-robe et mêmes pièces que Médina Express** : le menu lit `medina:<Prénom>` (`skins`, `coins`), une tenue achetée dans un jeu est à soi dans l'autre, et un achat fait ici retire les pièces de Médina Express (la sauvegarde `medina` est alors suivie par `Famille.track`). La tenue portée dans le Jasmin 2 est gardée dans `jasmin:<Prénom>.tenue`. Code : `TENUES`, `garde()`, `tenue()`, `renderTenues()`.
- **La bourse** (11/11, demandé par le papa) : avant, le compteur 🪙 repartait de zéro à chaque monde et les dinars ne servaient qu'au score et aux étoiles. Ils s'additionnent maintenant dans `save.bourse` (dans `jasmin:<Prénom>`), à la fin d'un monde (gagné ou perdu) et quand on quitte ou recommence (`encaisse()`). Le compteur en jeu affiche la bourse entière ; l'écran de fin garde le détail du monde (« 🪙 40/36 », qui compte pour la 2e étoile) et la bourse. **Les tenues s'achètent avec la bourse**, au prix `prixDinars(k)` = la moitié du prix en pièces de Médina Express (75, 150, 300, 500, 1000) ; si la bourse ne suffit pas, les pièces de Médina Express paient au plein tarif. La garde-robe reste commune aux deux jeux. Rattrapage à la première ouverture : 30 dinars par monde déjà réussi.
- **Fin de monde** (11/11, demandé par le papa) : l'écran « Niveau réussi » (et « Plus de vies ») propose aussi de **changer de tenue** (même garde-robe et mêmes achats que le menu : `renderTenuesIn`, `tenueTap`, zones `TZONES`) et de **changer de héros** (bouton `#eWho`). Si le nouveau héros n'a pas encore ouvert le monde suivant, « Monde suivant » mène à la carte des mondes. Écran resserré sur téléphone (`max-height:520px`).
- **Bandeau du haut** (11/11, demandé par le papa) : sous les vies, la bourse et le score, une deuxième ligne affiche **le prénom du joueur et le monde** (« Amine · Monde 1 : Sidi Bou Saïd »), raccourcie par « … » si elle dépasse (`drawHUD`).
- **Créatures « en vrai »** (11/11, Jasmin 2 seulement) : le scorpion (`jasmin2/scorpion.webp`), le crabe (`crabe.webp`, mondes 7, 8 et 10), la mouette (`mouette.webp`, mondes 7 et 8) et le **Scorpion d'Or** (`scorpion-or.webp` : ligne 0 il marche ou fonce, ligne 1 il est sonné, ligne 2 il lance ses braises). 12 images par ligne, tournées vers la droite. Code : table `BETE`, `bete(nom, image, ligne)`, branches au début des dessins dans `drawEnt` et `drawBoss` ; tant qu'une planche n'est pas chargée, l'ancien dessin reste. Ajoutés ensuite le même jour : le **chat** de la médina (`chat.webp`, mondes 6, 11 et 14), la **grenouille** du marais (`grenouille.webp`, monde 17, elle saute sur place) et la **cigogne** (`cigogne.webp`, mondes 15 et 17). Puis, en **formule mixte** (moins chère) : le **faucon** (`faucon.webp`) et la **chauve-souris** (`chauve-souris.webp`, Matmata) sont animés par une vidéo ; le **hérisson** (`herisson.webp` + `herisson-boule.webp`, tirés d'une seule image à deux vues), le **cactus** (`cactus.webp`, généré sur fond **bleu** puisqu'il est vert) et le **poisson** (`poisson.webp`, Tabarka) sont une **image seule** que le code fait bouger : le hérisson se dandine et sa boule tourne, le cactus respire, le poisson est dessiné par tranches pour que sa queue ondule (`docs/jasmin2-corps/image.py`). Tous les ennemis sont donc « en vrai ». **12/11, avec ComfyUI en local (gratuit)** : la chèvre, le hérisson, le poisson et le poulpe sont maintenant **animés pour de vrai** (Wan 2.2 image vers vidéo à partir de l'image fixe, boucle de 12 images trouvée par `docs/jasmin2-corps/bande_comfy.py` → `jasmin2/<nom>-anim.webp`, entrées `chevreA`, `herissonA`, `poissonA`, `poulpeA` de `BETE` ; l'image fixe et le mouvement du code restent en secours). Et six **objets** dessinés par le code sont devenus des images (`jasmin2/obj-*.webp`, FLUX.2 klein, `docs/jasmin2-corps/objets_comfy.py`, table `OBJ`, fonction `obj()`) : boulet de Monastir, orange du Cap Bon, grenade de Testour, figue de Barbarie, bouteille de l'ivrogne, braise du Scorpion d'Or. Le **cactus** et l'**ivrogne** sont animés à leur tour le 12/11 au matin (`cactusA` : il se dandine, deux bras lui ont poussé ; `ivrogneA` : il tangue, l'image du lancer reste l'ancienne ; fond **bleu** pour détourer le cactus). Restent dessinés : la pierre sculptée à visage, le sac de grain, les plateformes. **Quatre tenues de plus (12/11)** dans le Jasmin et Médina Express, garde-robe commune : pyjama 100, tablier d'école 200, tenue de plage 400, tenue de fête 800 pièces. Fabrication gratuite avec ComfyUI : la planche de base posée sur fond vert est retouchée **en entier** par FLUX.2 klein (« dans chacune des 24 poses, change la tenue… », 1,2 mégapixel, environ 40 s), puis remise au format par `docs/medina-corps/skin.py` (64 planches : 8 personnages × 4 tenues × 2 jeux). Restent dessinés par le code : les figues et les braises lancées, la pierre qui tombe, et les plateformes vivantes (flamants, tapis volants). Fabrication : 1 image `flux_3_image` sur fond vert + 1 vidéo `kling3_0` de 3 s par animation, puis `docs/jasmin2-corps/bete.py` (boucle trouvée toute seule, toutes les images recadrées sur le même rectangle). Les collisions ne changent pas.
- **Trois mondes de plus (11/11, 21 en tout, dans la nouvelle version seulement)** : **19 Dougga** (gradins du théâtre en escaliers, pierres qui tombent, les `scorp` y sont des **chèvres** qui chargent, vitesse 78 au lieu de 45, `chevre.webp`), **20 Kerkennah** (barques `kind:'boat'` qui vont et viennent, crique où l'on nage, les `bird` y sont des **poulpes**, `poulpe.webp`, les `scorp` des crabes), **21 Cap Bon** (piles de poteries en dalles fragiles, les `stone` y sont de grosses **oranges** dessinées par le code). Décors `jasmin/monde19` à `21.webp` (1568 × 672, `flux_3_image` 21:9 avec `monde7.webp` en référence de style). Ordre : `ORDER = [1, 6, 7, 19, 15, 10, 21, 17, 11, 14, 2, 12, 18, 13, 8, 20, 9, 16, 3, 4, 5]` ; `ORDER18` garde ouvert ce qui l'était. Pour ajouter un monde : une entrée dans `WORLDS`, sa place dans `ORDER`, une branche dans `buildLevel`, une phrase dans `STORY`, une couleur de brique dans la liste de `drawTiles`, et un décor de case si on ne veut pas la mosaïque du palais.
- **Encore trois mondes (11/11, 24 en tout)** : **22 Bizerte** (le **pont mobile** `pont(k, dist)` = `mover` vertical `kind:'pont'` large comme le trou, entre deux pylônes ; barques ; crabes et mouettes), **23 Testour** (l'**horloge qui tourne à l'envers** : `horloge(k, y, dist)` = `mover` d'axe `'c'` qui tourne en cercle dans le sens inverse, plateforme au bout de l'aiguille, cadran aux chiffres inversés ; les `stone` sont des grenades ; chats), **24 Monastir** (tour du ribat avec ascenseur, cuvettes à marée comme à Djerba, la marée vaut maintenant pour les mondes 8 et 24, et les `scorp` sont des **boulets** qui roulent, vitesse 70, dessinés par le code ; mouettes). Aucun ennemi nouveau en image. Décors `jasmin/monde22` à `24.webp`. Ordre : `ORDER = [1, 6, 7, 19, 23, 15, 10, 21, 17, 22, 11, 14, 24, 2, 12, 18, 13, 8, 20, 9, 16, 3, 4, 5]`, `ORDER21` garde ouvert ce qui l'était. Un ivrogne caché dans chacun.
- **L'ivrogne comique** (11/11, demandé par le papa) : `ivre(dx)` pose un `cactus` de `kind:'ivrogne'` ; il ne bouge pas, titube (« hips ! ») et lance toutes les 2,9 s une **bouteille** (`figue` avec `bottle:true`, dessinée par le code, qui tourne et éclate au sol) vers le héros à moins de 420 px ; la bouteille ou le contact de côté coûtent un coup ; en lui **sautant dessus** on le fait tomber comme les autres ennemis (+100), contrairement au cactus. Image `jasmin2/ivrogne.webp` (2 poses tirées d'une seule image : il titube, il lance). Deux dans la Médina (un sur un toit, un après la deuxième lanterne), et un caché dans chacun des trois nouveaux mondes.
- **Corrigé le 11/11 (Jasmin 1 et 2)** : après une vie perdue pendant le combat final, le boss restait en `wait` pour toujours (`respawn()` le remettait en attente alors que `bossgate` ne le réveille qu'une fois) ; `respawn()` le remet maintenant en `intro` si `g.bossOn`.
- **Corrigé le 11/11 (Jasmin 1 et 2)** : dans le dernier monde, entrer dans la salle secrète (rangée après l'arène) déclenchait le combat du boss ; au retour la caméra restait sur l'arène et le héros n'était plus à l'écran. Le déclencheur `bossgate` exige maintenant `!g.inRoom` et une position dans l'arène.

**Son (13/11)** : bouton **⚙️** à côté de ⏸ pendant la partie → met le jeu en pause et ouvre l'écran « Le son » (`#jopts`) : 🔊 bruitages, 🎵 musique, 🌿 ambiance du monde (Oui/Non, gardés dans `jasmin-prefs` : `sound`, `music`, `amb`). Aussi dans ⚙️ Réglages du menu. **Ambiance de chaque monde** : `jeux/sons/jasmin-amb-<n>.mp3` (ElevenLabs, 15 s en boucle, vagues, vent, souk, oud lointain…), chargée seulement en entrant dans le monde (`ambStart`/`ambStop`, branchés sur `musicStart`/`musicStop` : coupée en pause, à la mort et en fin de niveau).
**Chaque bruitage à part (13/11 matin)** : bouton « 🎚️ Régler chaque bruitage » (dans ⚙️ Le son et dans Réglages) → écran `#sndlist` : pour les 21 sons (`SFX_NOMS` : saut, atterrissage, chute, pièce, gemme, brique, bloc, bonus, ennemi, aïe, piment, ressort, lampe, portail, plouf, boss, victoire, bonne/mauvaise réponse, soupir, clic) : ▶ écouter, 🎙️ nouveau (enregistré ElevenLabs), 🎹 ancien (le bip fabriqué en code d'avant), 🔇 rien. Gardé dans `jasmin-prefs.snd[clé]` ('new' par défaut) ; boutons « Tout nouveau / Tout ancien ».

### La Légende du Jasmin 3 (13/11) : les 24 mondes « en vrai » — c'est désormais « le Jasmin » du site
- `jeux/legende-du-jasmin-3.html` = copie du Jasmin 2 avec 3 crochets (`R3.fond`, `R3.caseDe`, `R3.objet`) vers `jeux/jasmin3/reel.js`. Même sauvegarde, mêmes tenues, records et sons que le Jasmin 2. Lien depuis le menu du Jasmin 2 (« ✨ Essayer le Jasmin 3 ») et retour.
- **Les 24 mondes sont en réaliste** (`MONDES` = m1 à m24). Chaque monde `jeux/jasmin3/m<n>/` : `fond` (photo), `maisons` (décor du milieu), `oursins` (les pics du monde : agaves, cactus, glaçons, braseros, tessons, oursins, chardons, ancres…), `t_mur`, `t_dessus`, `t_bois_bleu` (plateformes), `t_mer` (eau, lave au Palais). Les objets (coffres, dinars, lanterne, jarre…) et ce qui bouge (barque, flamant, train, tapis volant quand l'image arrive) sont communs, dans `m1`. Le pont de Bizerte et l'horloge de Testour gardent leur mécanique dessinée.
- **Le Jasmin 2 ne bouge plus** (demande du papa, 13/11) : il reste en ligne comme sauvegarde ; tous les liens du site (accueil, espaces des enfants, Serpent Légendes) mènent au Jasmin 3. Mêmes sauvegardes.
- Prompts des 23 mondes : voir `docs/higgsfield.md` (section ComfyUI) ; fabrication `docs/jasmin3/build.py <dossier> <monde> [maisons,oursins si fond bleu]`.
- Monde 1, images ComfyUI (FLUX.2 klein) dans `jeux/jasmin3/m1/` : photo du village (`fond`, parallaxe 0,15), rangée de maisons blanches aux portes bleues (`maisons`, parallaxe 0,45, voilée), murs à la chaux (`t_mur`) avec un liseré de faïence bleue sur le dessus (`t_dessus`), plateformes en planches bleues (`t_bois_bleu`), mer (`t_mer`), oursins à la place des pics, coffres (pièce / livre / lampe / vide, avec le petit symbole par-dessus), briques, dinar au jasmin, jasmin d'or, lanterne (point de passage), jarre (passage secret), trampoline, panneau en bois, porte bleue (celle de Ma Houma), chéchia, harissa, thé à la menthe.
- Fabrication : `docs/jasmin3/build.py <dossier PNG> <monde>` (détourage, textures raccordées par miroir).

### La Légende du Jasmin · Stage 2 — `jeux/jasmin-stage2.html` (14-15/11, demandé par le papa)
Les enfants avaient fini les 24 mondes du Jasmin 3 : le Stage 2 est plus difficile et plus riche (inspiré d'un cahier des charges « remake » collé par le papa, **sans rien reprendre** d'un jeu existant : personnages, images et sons sont à nous). **Les 10 mondes sont jouables** depuis la nuit du 15/11.
- **Commandes (liste du papa, 15/11)** : ← → marcher · ↑ sauter (garder ↑ = plus haut ; ↑ avec ← ou → = saut en avançant ; devant une échelle sans ← → : monter) · ↓ s'accroupir, ↓ + ← → ramper · **↓ + Espace ramasser / déposer** · **Espace lancer** (ou tirer un levier tout près) · rester accroupi sur une petite porte ▼ = passage secret · sur l'échelle ← ou → la lâche. Tablette : joystick à gauche (haut = sauter / monter, bas = s'accroupir), boutons ⤒ Saut, ✋ Ramasser (= ↓ + Espace), 🎯 Lancer (= Espace). Manette : A saute, B = Espace, X ramasse. E et F restent cachés au clavier.
- **Barre de vie** en haut au milieu (en morceaux : 6 / 5 / 4 selon la difficulté), qui clignote quand elle est presque vide ; la barre du boss apparaît dessous. Vies (🧒 × n), dinars et jasmins en haut à gauche.
- **On ne reste jamais coincé** (demande du 15/11 : le papa était arrivé devant la porte sans la clé, sous un mur trop haut) : `docs/stage2/verifie.py` simule le héros case par case (marcher, tomber, sauts de 3 cases, échelles, planches, rebonds, caisses, passages, tapis, sable) et vérifie, étape par étape (levier → clé → mur fissuré → sortie), que de **chaque** case atteignable on peut rejoindre la suite ; `docs/stage2/cartes.py` fabrique les 10 cartes et lance la vérification (0 problème exigé). Dans le monde 1, échelle ajoutée à droite de la maison et une deuxième au bord de la fosse aux cactus. En plus : toucher la porte fermée sans clé affiche et dit « il faut la clé », et Pause › **📍 Revenir à la dernière lanterne** (sans perdre de vie, les objets reviennent à leur place). Une clé tombée dans l'eau ou hors du monde revient à sa place.
- **Les 10 mondes** (images ComfyUI FLUX.2 klein dans `jeux/stage2/m<n>/`, ce qui manque est pris dans `m1/`) :
  1. Ruelles de la médina (Tunis) : apprendre ; 2. Toits de la médina : tuiles qui s'effondrent, auvents qui font rebondir, voleur, passage secret, levier ; 3. TGM et métro léger : trains qui vont et viennent, contrôleurs, **scooter** sur la route du bord de mer ; 4. Citernes de Carthage : **dans le noir** (lanternes), eau, pierres glissantes, chauves-souris, rats ; 5. Catacombes de Sousse : noir, trois galeries, rochers qui tombent, sol qui s'effondre, salle secrète avec la clé, porte ; 6. Port de La Goulette : barques, quai mouillé, crabes, **boss : le Crabe géant** ; 7. Chenini : terrasses et échelles, chèvres qui foncent, faucons, rochers, grenier secret ; 8. Sahara de Douz : sable mou, serpents cachés, **tapis volant** au-dessus du canyon ; 9. Souks de Kairouan : piles de tapis qui font rebondir, huile qui glisse, voleurs, clé tout en haut ; 10. Palais du Bardo : mosaïques cirées, gardes, grille et levier, **boss final : le Scorpion d'Or**.
- **Terrains** (lettres des cartes, légende complète dans `niveaux.js`) : I glissant, Y sable mou (plus lent, saut plus bas), W eau (un morceau de vie en moins, retour au dernier endroit sûr), X tuile qui s'effondre (revient après 4 s), U rebond, T passage secret (par paires, de gauche à droite), R rocher qui tombe (il tremble avant), M/V plateformes, Q train, N scooter, A tapis volant.
- **Ennemis** (personne ne meurt : on les chasse) : garde, garde qui poursuit, chien, marchand aux oranges, chat qui dort, oiseau (mouette ou faucon), chauve-souris (pendue au plafond, pique quand on passe), scorpion, crabe, rat, serpent (caché, sort quand on approche), voleur (prend jusqu'à 3 dinars et s'enfuit ; on les récupère en l'attrapant), contrôleur, chèvre (fonce, s'étourdit contre les murs). **Boss** : marche, charge (étourdi s'il se cogne au mur), tire (bulles, braises) ; on le touche avec les objets (jarres et pierres qui reviennent), et on lui saute dessus quand il est étourdi ★ ; 3/4/5 coups selon la difficulté ; la sortie s'ouvre quand il s'enfuit.
- **Gestes du héros (ComfyUI)** : `docs/stage2/gestes.py` → `jeux/stage2/heros/<id>.webp` + `heros.js` (planche 12 × 5 : grimper de dos, ramper, accroupi, porter les bras levés, lancer), pour les 8 personnages en tenue de base, et pour Essil, Salma et Amine en tenues astronaute, foot, jebba, or et super-héros (clés `amine-astro`…) : retouches FLUX de `houma_<id>[_<tenue>].png` + vidéos Wan 2.2 pour ramper et porter. Tenues fête, pyjama, plage, tablier (15/11, Salma grimpait de face en tablier) : image de départ = l'image de face (n° 21) de `jasmin2/corps-<id>-<tenue>.webp` agrandie sur fond vert (`houma_<id>_<tenue>.png` dans `input/`) ; la tenue de plage (bleue et turquoise) est faite sur **fond magenta** (`gestes.py` détoure alors le magenta). Les autres personnages en tenue (Nour, Yasmine, Farès, papa, maman) gardent l'ancien dessin.
- **Fichiers** : `jeux/stage2/niveaux.js` (réglages, mondes, textes des panneaux), `cartes/m1…m10.js`, `moteur.js` (canvas 2D, 120 pas/s), `m<n>/` (décors), `en/` (ennemis fixes, scooter), `<nom>-anim.webp` (ennemis animés), `heros/`. Fabrication : `build_m1.py`, `build_mondes.py` (mondes 2-10), `bande_marchand.py`, `bande_comfy.py` (`SORTIE=jeux/stage2`), `gestes.py`, `cartes.py` + `verifie.py`.
- Sauvegarde `stage2:<joueur>` (mondes ouverts, records) ; suivi `jasmin-s2` ; les dinars vont dans la bourse du Jasmin. Lien : menu du Jasmin 3 et mur des nouveautés. En portrait, la vue garde au moins 18 cases de large.

### L'Atelier du Jasmin — `jeux/atelier-du-jasmin.html` (coloriage, 2D ou 3D) (10/11)

Demandé par le papa : colorier les paysages des mondes du Jasmin, créer les costumes de Nour, Yasmine et Farès, et inventer un skin pour le jeu de serpents, « dans un monde 3D avec des sons et des animations ».

- **Accueil** : l'enfant choisit **2D** (à plat, comme un cahier) ou **3D** (en relief, sur une terrasse de Sidi Bou Saïd). Le choix se change dans le menu (pastille 🖍️ 2D / 🧊 3D). Three.js n'est chargé que si l'enfant choisit la 3D ; si la 3D ne démarre pas, on repasse en 2D.
- **Menu** : 🏞️ Les paysages (18), 👘 Les costumes (3 amis × 3 tenues), 🐍 Mon serpent, 🖼️ Ma galerie, 🎭 Le spectacle.
- **Dessins** (`jeux/atelier/*.webp`, Higgsfield `flux_3_image`, trait noir sur blanc, 1024 × 768 pour les paysages `p-…`, 768 × 1024 pour les costumes `c-…`) :
  - paysages : sidi, medina, carthage, kairouan, eljem, zaghouan, tabarka, aindraham, ichkeul, djerba, matmata, ksar, dunes, tozeur, chott, lezard, tamerza, palais ;
  - costumes : Nour (jebba de fête, pêcheur de Djerba, prince du désert), Yasmine (farmla et chéchia, melia berbère, caftan de fête), Farès (jebba brodée, cavalier du désert, farmla et sarouel).
- **Moteur de coloriage** (aucune dépendance) : au chargement, le dessin est découpé en **zones** (tout ce qui n'est pas un trait, par remplissage de proche en proche) ; un toucher remplit la zone, avec une animation en cercle depuis le doigt. La couleur passe 3 pixels sous les traits (pas de liseré blanc). Si le doigt tombe sur un trait ou une zone minuscule, on prend la zone voisine la plus proche. Pour les personnages, le fond autour (zones qui touchent le bord) n'est pas coloriable et reste transparent : c'est ce qui donne les silhouettes découpées.
- **Outils** : 20 couleurs, 5 motifs (uni, rayures, pois, zellige, arc-en-ciel), **dégradé** (11/11 : la couleur choisie en haut de la zone vers le blanc en bas ; le bouton « 2 » puis une couleur de la palette change la 2e couleur, pour un dégradé entre deux couleurs ; enregistré comme motif `d#rrggbb`), gomme, ↩️ annuler, 🧽 tout effacer (deux touchers), ✔ Fini (qui s'agite quand 90 % des zones sont coloriées).
- **3D** : la toile est posée sur un chevalet (paysages) ou devient une silhouette debout sur un socle (costumes) ; un toucher court colorie (lancer de rayon → coordonnées dans le dessin), un glissement tourne autour, deux doigts ou la molette zooment. Décor : terrasse en zellige, muret, maisons blanches à dômes bleus, mer, buissons de jasmin, pétales qui volent.
- **Mon serpent** : couleur de la tête, 3 couleurs du corps, motif (uni, rayures, bandes, pois, dégradé, arc-en-ciel), effet (normal, brillant, lumineux), chapeau (couronne, cornes, antennes, oreilles, auréole, ailes, corne de licorne, crête, lune), nom. Aperçu animé (2D) ou serpent 3D qui tourne sur son tapis. **Serpent Légendes** le lit (`atelierSkin` / `setAtelierSkin`) : il apparaît dans « Mes skins » sous « 🎨 Ma création » (rareté `atelier`), avec un lien pour le créer ou le changer (`atelier-du-jasmin.html?go=serpent`).
- **Le spectacle** : le dernier paysage colorié devient le décor, les trois amis (dans le dernier costume colorié de chacun, sinon au trait) sautillent devant, le serpent de l'enfant passe. 🔀 Changer prend d'autres dessins.
- **Sons** : petits bruits Web Audio (une note de la gamme hijaz par couleur), musique douce générée (🎵 / 🔇), consignes dites par **Julian** (`jeux/atelier/voix/*.mp3` : accueil, menu, paysage, costume, colorie, bravo, galerie, serpent, pret, spectacle).
- **Sauvegarde** : `atelier:<Prénom>` (petit : mode, dessins finis, skin ; envoyé au serveur, cours `atelier`, relu sur une autre tablette) et `atelier-art:<Prénom>` (les coloriages, sous forme de points [x, y, couleur, motif], et leurs vignettes ; ils restent sur la tablette). Une remise à zéro par un parent vide aussi les coloriages.
- **Ajouts du 10/11 (soir)** :
  - **Loupe** : boutons ➕ ➖ 🔲 posés sur le dessin, pincement à deux doigts, molette. En 2D le canvas `#cv` reçoit un `transform` (objet `Z`, jusqu'à × 6) ; dessin agrandi, on le déplace en glissant ; le coloriage se fait au **lâcher** d'un toucher court. En 3D : `T.zoomBy()`, zoom jusqu'à × 5 et vecteur `pan` (glisser déplace le dessin au lieu de tourner autour).
  - **Modèle en couleur** : bouton 🌈 → vignette `#pip` (`atelier/m-<id>.webp`, 800 × 600 ou 600 × 800), qu'on touche pour la voir en grand. Choix gardé dans `atelier-modele`. Chaque modèle est le dessin au trait recolorié par Higgsfield (le trait en image de référence).
  - **Carte à imprimer ou à envoyer** : bouton 🖨️ (et dans la fenêtre « Bravo ») → `openCard()` : le dessin dans un cadre, un petit mot (champ libre ou idées toutes faites), en haut ou en bas, signature facultative. « Imprimer » : `window.print()` avec une image seule (`#printImg`, règles `@media print`, page A4 tournée selon le dessin). « Envoyer » : partage du système (`navigator.share` avec le fichier : WhatsApp, Messages, e-mail…) ; si l'appareil ne sait pas partager un fichier, l'image est téléchargée. « Enregistrer » : téléchargement du JPEG.
  - **Nouveaux dessins** : 14 animaux de la ferme (`a-…`, liste `ANIM`, bouton « Les animaux ») et 6 paysages (Bizerte, Monastir, Nabeul, Dougga, Chebika, Kerkennah) → 24 paysages, 14 animaux, 9 costumes. Les animaux servent aussi de décor au spectacle.
  - Voix de Julian ajoutées : `animaux`, `modele`, `envoyer`.
- **Ajouts du 11/11** :
  - **Puzzle** 🧩 (bouton dans la barre du coloriage, 2D et 3D) : une fenêtre demande « Facile 8 / Moyen 16 / Difficile 32 pièces » (4 × 2, 4 × 4, 8 × 4 ; tourné pour les costumes en hauteur) et, si l'enfant a déjà colorié, quelle image prendre : **son coloriage** ou **le modèle en couleur** (sinon c'est le modèle). Vraies pièces de puzzle (tenons et creux tirés au hasard, `pzPath`) dessinées sur des canvas ; plateau à gauche en paysage, en haut en portrait, pièces rangées en vrac dans le bac (`pzMixAll`). On glisse une pièce : près de sa place (30 %, 38 % en facile) elle s'aimante et se fixe. 👻 montre l'image en transparence sur le plateau (allumé d'office en facile), 🔀 remélange. À la fin : confettis, voix, fenêtre « Encore / Plus difficile / Colorier ». Le meilleur niveau réussi par dessin est gardé dans `S.puz[id]` (affiché « ⭐ réussi » sous le niveau). Voix de Julian : `puzzle`, `puzzle-go`, `puzzle-bravo`. Code : objet `PZ` (exposé en `window.__pz` pour les tests).
  - **Dessins réparés** : dans « Le lapin », le trait de l'horizon s'arrêtait à 4 px du bord gauche, donc le ciel et l'herbe ne faisaient qu'une zone (colorier le ciel coloriait l'herbe) ; trait prolongé jusqu'au bord. Dans « Le Ribat de Monastir », la plage et la mer étaient une seule zone (pas de trait entre les deux) ; une ligne de rivage a été tracée. Contrôle fait sur les 38 paysages et animaux : on compare les zones du dessin au modèle en couleur (une grande zone où le modèle a deux couleurs bien différentes = fuite probable). Les autres alertes (arbre à pommes, auvents de la médina, terrain du Lézard rouge) sont normales. Images chargées avec `?v=2` et cache de l'appli `missaoui-v4`.
- **Crayons, tampons, motifs, feuilles blanches, pas à pas (11/11)** :
  - **✏️ crayon noir** et **🖍️ feutre** (couleur choisie) : un doigt qui glisse trace un trait (deux doigts : loupe). Le trait **ferme les zones** : après chaque trait, `resegment()` recalcule les zones et chaque nouvelle zone garde la couleur de celle dont elle vient. Trait = `[couleur, épaisseur, [x, y, …]]`. En 2D seulement (en 3D, un message le dit).
  - **🧵 plus de motifs** (plateau `#tray`, liste `PATX`) : arabesque `b`, fleurs `f`, étoiles `s`, cœurs `h`, losanges `k`, damier `c`, chevrons `v`, écailles `e` (fonction `tint`).
  - **😀 tampons** : 48 emojis (`STAMPS`), 3 tailles ; un toucher pose le tampon (`[x, y, emoji, taille]`, calque `stampCv`).
  - **↩️ annuler** défait aussi les traits et les tampons (historique par instantanés `snap()` / `restore()`, 40 pas) ; 🧽 efface tout.
  - **Je dessine** (`pick:l`) : 6 feuilles blanches `l-1` … `l-6` (1024 × 768, sans image). **Dessin pas à pas** (`pick:d`, table `LESSONS`) : chat, poisson, maison, fleur, bateau, papillon ; à chaque étape le modèle s'affiche en pointillés bleus à repasser (barre `#lesson`, ⬅ ➜), puis on colorie. Les deux passent en 2D tout seuls. Pas de voix pour les étapes (texte seulement).
  - Sauvegarde : `it.s` (traits) et `it.k` (tampons) à côté de `it.f` ; sur le serveur `[date, zones, traits, tampons]` (les dessins les plus lourds sont laissés de côté au-delà de 340 Ko).
- **Sauvegarde des coloriages (11/11)** : sur la tablette, `atelier-art:<Prénom>` garde les zones coloriées et une vignette par dessin ; `atelier-traits:<Prénom>` (zones seules, sans vignette) part sur le serveur (cours `atelier-art`). À l'ouverture, les dessins du serveur absents de la tablette ou plus récents y sont recopiés et leurs vignettes se refont en arrière-plan (`mergeTraits`, `remakeThumbs`) : les coloriages suivent l'enfant d'une tablette à l'autre, entre le navigateur et l'appli installée, et reviennent si la tablette a été vidée. Si la tablette est pleine, un message le dit. Une remise à zéro de l'Atelier par un parent efface toujours les dessins (champ `rst`).
- Progression : carte « 🎨 Atelier du Jasmin » (paysages et costumes finis, serpent, façon de jouer).

### Les Écuries d'Essil — `essil/les-ecuries.html` (club hippique, 3D) (11/11)

**Sauvegarde sur plusieurs appareils (correctif du 11/11)** : au démarrage, au retour sur l'onglet et toutes les minutes, `sync` relit le serveur et `merge` **réunit** les deux sauvegardes au lieu de garder la plus récente : chevaux et matériel présents d'un côté ou de l'autre, meilleurs classements, meilleures notes d'école, pièces et cheval courant de l'appareil le plus récent. Un achat ne peut donc plus disparaître parce qu'un onglet est resté ouvert ailleurs (c'est arrivé à Essil : PC le matin, tablette le soir). Un cheval ne se revend pas, donc réunir ne ressuscite rien. À la fusion on n'avance pas `S.t`.

**Ouvert à toute la famille le 11/11** : `jeux/les-ecuries.html` est la même page, rangée avec les jeux de famille (liens chez Salma, chez Amine et sur l'accueil). Elle charge le même code (`essil/ecuries/jeu.js`, dont le dossier d'images est maintenant trouvé avec `import.meta.url`) et garde les mêmes sauvegardes `ecuries:<Prénom>` : chacun a son club, ses pièces et ses chevaux, et le titre s'adapte (« Les Écuries de Salma », « d'Amine »). Aucune image nouvelle. Carte Écuries ajoutée pour Amine dans Progression.

Demandé par Essil : réviser les parties du filet et de la selle, apprendre les robes et les races, le pansage et l'utilité des brosses ; gagner des pièces pour acheter des chevaux ; entrer dans « nos écuries », brosser avec toutes les brosses, nourrir ; faire des concours de CSO, de cross et de dressage en montant ; acheter licols, filets, selles, tapis, amortisseurs, jambières (guêtres) et cloches de plusieurs couleurs. Choix du papa : concours en 3D, images Higgsfield, tout livré d'un coup.

- **Fichiers** : `essil/les-ecuries.html` (écrans et style), `essil/ecuries/data.js` (tout le contenu : parties, robes, races, outils, questions, chevaux, sellerie, épreuves), `jeu.js` (interface, sauvegarde, quiz, magasins, sons), `monde.js` (la 3D : écurie et concours), `cheval.js` (le cheval fabriqué par le code), `img/` (33 images Higgsfield). Three.js n'est chargé qu'en entrant à l'écurie ou en concours.
- **La cour** (menu) : 🎓 le club-house, 🏠 nos écuries, 🏆 les concours, 🛒 la sellerie, 🐴 le marchand de chevaux. « Qui joue ? » comme les autres jeux : chacun a sa propre écurie.
- **Le club-house** (3 cours, chacun avec « j'apprends » et un quiz de 10 questions ; **5 pièces par bonne réponse du premier coup, + 25 pour un sans-faute**) :
  - *Le filet et la selle* : deux schémas à numéros (`FILET` 7 parties, `SELLE` 10 parties ; positions en % de l'image, réglées à la main sur `img/filet.webp` et `img/selle.webp` : si on change l'image, il faut les refaire). Quiz : « Touche : la têtière » + questions (deux doigts sous la muserolle, un poing sous la sous-gorge, on selle à gauche, tapis puis amortisseur puis selle…).
  - *Les robes et les races* : 10 robes (alezan, bai, noir, gris, isabelle, palomino, pie, tacheté, rouan, crème) et 12 races (pur-sang arabe, pur-sang anglais, selle français, frison, shetland, camargue, percheron, connemara, haflinger, fjord, barbe, pure race espagnole). Quiz : une image, quatre noms.
  - *Le pansage* : 8 outils dans l'ordre (cure-pied, étrille, bouchon, brosse douce, éponge, peigne, graisse à pieds, couteau de chaleur), où et comment. Quiz : reconnaître l'outil, remettre le pansage dans l'ordre, questions de sécurité.
- **Nos écuries** (3D) : tous les chevaux côte à côte dans leurs boxes ; on glisse pour se promener, on touche un cheval pour s'en occuper. **Pansage pour de vrai** : des taches posées sur le cheval, chacune demande le bon outil (boue → étrille, puis elle devient poussière → bouchon ; poil terne et tête → brosse douce ; yeux et naseaux → éponge ; nœuds des crins → peigne ; pieds → cure-pied, puis graisse). Mauvais outil : une phrase explique lequel prendre. Pansage complet : + 30 pièces. Cheval propre : on peut le caresser à la brosse (cœurs, moral). **Nourrir** : foin, granulés, eau, carotte, pomme (3 friandises par heure au plus). **Équiper** : on choisit licol, filet, selle, tapis, amortisseur, guêtres, cloches parmi ce qu'on a acheté, et on voit le cheval harnaché. Trois jauges : propreté, appétit, moral ; elles baissent avec le temps (`decay`) et après un concours.
- **La sellerie** : 7 rayons, 12 couleurs (3 cuirs pour le filet et la selle). **Le marchand** : 13 chevaux (`CHEVAUX` : race, robe, taille, vitesse / saut / dressage / endurance de 1 à 5, de 150 à 1 400 pièces) ; Noisette, ponette connemara isabelle, est offerte au départ avec 100 pièces.
- **Les concours** (3D, 9 épreuves : Club 3, Club 1, Club Élite ; une médaille débloque la suivante). Commandes : ◀ ▶ tourner, ＋ － changer d'allure (arrêt, pas, trot, galop), 🐎 sauter ; au clavier, flèches et Espace. Petite carte, flèche vers le prochain obstacle. La « forme du jour » (propreté, appétit, moral) change un peu la vitesse et la détente.
  - **CSO** : carrière de 70 × 50 m, 6 à 10 obstacles (verticaux et oxers) à sauter dans l'ordre, fanion rouge à droite. Barre tombée ou refus : 4 points ; 3 refus : éliminée ; 1 point par 4 s de temps dépassé.
  - **Cross** : grande boucle dans la campagne, troncs, haies, stères de bois et un gué à traverser. Refus : 20 points ; 0,4 point par seconde dépassée. Le galop fatigue (jauge verte, selon l'endurance du cheval).
  - **Dressage** : carrière 20 × 40 avec ses lettres. La figure est dessinée au sol (bleu = pas, jaune = trot, rose = galop) ; le juge note chaque figure sur 10 selon la précision et l'allure ; arrêts en X (3 s immobile). Reprises dans `courseDressage`.
  - Gains : de 20 à 420 pièces selon l'épreuve et la place (🥇 sans faute ou ≥ 70 %).
- **Le cheval 3D** (`cheval.js`) : corps, encolure, tête, jambes articulées (pas à 4 temps, trot en diagonales, galop, saut jambes repliées), robe peinte sur une petite texture (pie, tacheté, pommelé), balzanes, liste, fanons du frison, crinière en brosse du fjord ; matériel posé dessus dans la couleur achetée ; la cavalière (bombe, veste bleue, queue-de-cheval). Repères `anchors` pour poser les taches du pansage.
- **Sauvegarde** : `ecuries:<Prénom>` {coins, horses{id:{eq, dirt, faim, moral}}, owned, cur, best, ecole, n} ; cours `ecuries` dans `api/famille.php` (COURSES et READABLE) ; carte « 🐴 Les Écuries d'Essil » dans Progression (Essil, et Salma si elle y joue).
- Pour tester : `window.__ecu` ({S, world, go, coins, save}) ; en concours `world.ride()` donne l'état.

### Médina Express — `jeux/medina-express.html` (course infinie 3D) (11/11)

D'après le cahier des charges du papa (`grande section\clone subway\`, course infinie à trois voies), adapté au site : univers original, une seule page autonome, avatars de la famille, records sur le serveur. Demande : mondes médina et TGM, avatars comme dans le Jasmin, pour toute la famille et les amis, avec des records.

- **Le jeu** : le coureur avance tout seul sur 3 voies ; glisser ← → (ou flèches) pour changer de voie, ↑ sauter, ↓ glisser dessous ; toucher le bord gauche ou droit de l'écran marche aussi. Trois sortes d'obstacles : bas (à sauter), hauts (passer dessous), pleins (changer de voie), plus les longs (étal de souk, wagon du TGM qui peut rouler vers soi). On ne peut pas entrer de côté dans un wagon : le jeu refuse le changement de voie.
- **Deux mondes** fabriqués par le code : la **médina** (maisons blanches, portes et volets bleus, coupoles, bannes, voûtes, lampions ; caisses d'oranges, tapis roulés, bannes basses, charrettes, étals) et le **TGM** (rails, caténaire, la mer et ses bateaux, gares blanches et bleues ; barrières, portiques, blocs avec sens interdit, wagons blancs et bleus). « Le voyage » alterne les deux tous les 520 m en passant sous une porte (bab).
- **Deux façons de jouer** : 🐢 Tranquille (lent, 3 cœurs, proposé d'office à Amine) et 🐆 Champion (de 11,5 à 27 m/s, une seule vie). Un classement pour chacune.
- **Bonus** (`POWERS`) : 🧲 aimant 10 s, 🛡️ bouclier (absorbe un choc), 🥿 super babouches (saut plus haut) 10 s, ×2 15 s, 🪄 tapis volant 8 s (on vole au-dessus de tout, pièces en l'air).
- **Parcours toujours possible** (`row`) : chaque rangée garde une voie « sûre », voisine de la précédente et jamais bouchée par un obstacle plein ni par un wagon ; au début elle est vide, plus loin elle peut demander un saut ou une glissade. L'écart entre rangées suit la vitesse.
- **Le coureur** : corps fabriqué par le code à la couleur du joueur, et sa **tête** en médaillon (avatar de la famille recadré avec `HEADCROP`, mascotte pour un invité, initiale sinon), toujours tournée vers l'écran.
- **Records** : `Famille.score('medina', 'normal' | 'doux', score)` et `Famille.highscores` (10 premiers, au menu et en fin de course, avec la place obtenue). Score = mètres parcourus + 5 par pièce (doublés avec ×2). Sauvegarde `medina:<Prénom>` {best, bestDoux, coins, games, dist, far} ; jeu `medina` dans `api/famille.php` (GAMES, COURSES, READABLE, COURSE_GAME, plafond 999 999). Carte « 🚋 Médina Express » dans Progression.
- **Technique** : une boîte, un cylindre et une sphère partagés par tout le décor ; 8 tronçons de 24 m recyclés ; obstacles, pièces et bonus dans des réserves (`take` / `give`) ; la netteté baisse toute seule si la tablette rame. Pour tester : `window.__mx` ({G, state, act, start, objs}).
- **Ajouts du 11/11 (2e passe, demandés par le papa)** :
  - **Champion plus rapide et plus dur** : de 15 à 36 m/s (la vitesse monte deux fois plus vite), rangées plus serrées, et des **trains qui foncent** sur le coureur (wagon du TGM, triporteur dans la médina). Pour rester juste, une voie est gardée vide avant et après (`G.res`), un triangle ⚠ clignote au-dessus de la voie et un klaxon prévient.
  - **Tête vue de dos** pendant la course (`jeux/avatars/<nom>-dos.webp`, 8 images Higgsfield cadrées comme l'avatar, donc même `HEADCROP`) ; de face au menu (`showHead`).
  - **Tenues** (`SKINS`, achetées avec les pièces ramassées, gardées dans `save.skins`) : classique, jebba et chéchia (150), maillot de foot (300), super-héros avec cape (600), astronaute (1 000), tout en or (2 000).
  - **Corps animés « en vrai »** (11/11, pour les 8 personnages : Essil, Salma, Amine, Anis, Imen, Nour, Yasmine, Farès) : un corps entier, vu de dos, remplace le corps en blocs et la tête en médaillon. Une planche par personnage et par tenue : `jeux/medina/corps-<id>[-<tenue>].webp`, 1056 × 1152, 6 × 4 cases de 176 × 288 : cases 0-11 la foulée, 12-19 le **vrai saut** (appel, envol, jambes groupées, réception), 20-23 la **vraie glissade** (accroupi). 48 planches (8 × 6 tenues), 5,5 Mo en tout, chargées une à la fois. Dans le jeu : `CORPS` (planches disponibles), `TAILLE` (échelle par personnage : Amine .78 … Anis 1.06), un `Sprite` `H.film` dont on déplace la texture ; l'image du saut suit la vitesse verticale (`G.jv`), celle de la glissade le temps restant ; chute = sprite qui se couche. Un joueur sans planche (prénom inconnu) garde le corps en blocs.
  - **Fabrication d'une planche** (`docs/medina-corps/sheet.py`) : image `flux_3_image` du personnage de dos sur fond vert (avatar en référence) → 3 vidéos `kling3_0` std de 3 s sans son depuis cette image (« court sur place », « saute sur place », « s'accroupit et se relève », caméra fixe, fond vert) → le script enlève le vert, trouve tout seul une foulée qui boucle, la montée-descente du saut et la phase accroupie, recentre et range les 24 images.
  - **Tenues sur les corps animés** (`docs/medina-corps/skin.py`) : on envoie la planche entière sur fond vert à `flux_3_image` (« Edit this sprite sheet: keep the same 24 figures… Only change the outfit… ») : les 24 poses restent à leur place, seule la tenue change (2 crédits la planche). Le script remet l'image à 1056 × 1152, enlève le vert et recale chaque case sur la silhouette d'origine (au plus 8 px) pour que le personnage ne tremble pas. Tenues : jebba et chéchia, maillot de foot n° 10, super-héros (violet, cape turquoise à étoile : inventé, pas un héros connu), astronaute, tout en or. Limite connue : pour les 3 mascottes, la combinaison d'astronaute garde un pantalon crème.
- **La fin de course : le policier** (11/11) : quand le coureur échoue, un policier tunisien (uniforme bleu marine, casquette blanche, gants blancs) arrive en courant derrière lui avec un coup de sifflet, le relève, une voiture de police blanche à bande bleue (gyrophare, sirène, plaque « POLICE ») s'arrête à côté, ils montent et elle repart ; puis l'écran des scores. 3 s en tout, on peut toucher l'écran (ou une touche) après 0,7 s pour passer. Code : `COP`, `arrest()` (appelée dans `tick` tant que `G.dead`), `copOff()`, sons `sfx.whistle` et `sfx.siren`. Le policier est une planche comme les coureurs (`jeux/medina/policier.webp`, seule la foulée sert) ; la voiture est faite de blocs par le code.
- **Pas encore fait** : missions, musique.


### Ma Houma — `jeux/ma-houma.html` (monde libre tunisien, 2D) (12/11)

**Demande du papa (11/11)** : son cahier des charges « MiniMondes » (`C:\Users\azili\OneDrive\Amine\grande section\toca\cahier_des_charges_monde_interactif_style_toca.md` : monde miniature façon maison de poupées numérique, sans score ni échec), **adapté au site** et à un **quartier tunisien** avec la famille et les mascottes. « Houma » = le quartier, en tunisien. Aucun élément repris d'un jeu existant : décors, personnages et objets sont dessinés ici. Aucun crédit Higgsfield.

- **Technique** : une page autonome (pas de Phaser ni de compilation, contrairement au cahier des charges, pour rester dans le fonctionnement du site). Scène logique 1280 × 720 en éléments HTML positionnés + SVG, mise à l'échelle par `fit()` ; en portrait le décor remplit la hauteur et **se fait glisser** au doigt (`panX`). Sons synthétisés (`sfx`).
- **Tout est piloté par des données** : `CHARS` (8 personnages), `OUTFITS` (6 tenues), `ITEMS` (une soixantaine de types d'objets, 110 objets posés dans le monde), `FIXED` (une quarantaine de meubles), `PLACES` (lieux : décor `bg`, sols `floors`, meubles, objets, places de départ), `RULES` (interactions, dans l'ordre), `DISC` (découvertes), `MAP` (la carte). **Ajouter un lieu** = une entrée dans `PLACES` + passer sa case de `MAP` à « ouvert ».
- **Personnages** : Anis, Imen, Essil, Salma, Amine, Nour, Yasmine, Farès, **« en vrai » comme dans le Jasmin et Médina Express** (demandé par le papa le 12/11, à la place des corps dessinés du premier jet). `docs/houma/build.py` découpe dans les planches `jeux/jasmin2/corps-<id>[-<tenue>].webp` la case 21 (de face) et la case 22 (yeux fermés, pour dormir) et écrit `jeux/houma/c-<id>[-<tenue>].webp` (48 petites images, 700 Ko en tout) + `jeux/houma/corps.js` (repères : tête, cou, main). `doll()` affiche l'image, coupée aux hanches quand il est assis ou au bain, tournée quand il dort, et pose par-dessus chéchia, chapeau de paille, lunettes et machmoum d'après la taille de la tête. Tailles `k` différentes (`HK` = hauteur de base).
- **Lieu ouvert : Dar Yasmine** (la maison, en coupe sur 2 niveaux) : cuisine (frigo, placard, évier, feu), patio (fontaine, jasmin, lanterne, canari, porte bleue cloutée), salon (banquette, meïda, étagère, radio), chambre (armoire bleue, lit, chevet, lampe), terrasse (citronnier, tabouret, linge, vue sur la mer), salle de bain (baignoire, lavabo, étagère). Voir plus bas les quatre autres lieux, ouverts le 12/11.
- **Gestes** : glisser un personnage (il se pose sur le sol le plus proche, s'assoit sur la banquette ou le tabouret, se couche dans le lit, entre dans le bain) ; glisser un objet (il tombe sur la surface en dessous : sol, table, étagère, intérieur d'un meuble ouvert) ; le lâcher sur un personnage (il le tient, le mange, le boit, s'habille, met l'accessoire) ; toucher un meuble (ouvrir/fermer, allumer, eau, musique) ; toucher un personnage (il saute et enlève son dernier accessoire). La cible qui réagira s'éclaire pendant le geste (`aim`).
- **Enchaînements** : théière → eau (évier, lavabo, fontaine) → feu → thé → verre → on boit ; marmite sur le feu → couscous ; arrosoir rempli → jasmin fleuri → machmoum à cueillir, ou citronnier → citron ; vêtements de l'armoire = les 6 tenues réalistes existantes (tous les jours, jebba, foot, astronaute, super-héros, or : ils reviennent seuls sur leur cintre) ; chéchia, chapeau de paille, lunettes, machmoum ; les aliments mangés reviennent à leur place après 5 s.
- **Bouton « ✕ Quitter »** en haut à gauche (retour à l'accueil du site), demandé le 12/11.
- **Progression** : 42 **découvertes ⭐** (album en haut à droite), jamais obligatoires. Carte « 🏘️ Ma Houma » dans Progression (découvertes, lieux visités, ce qui reste à trouver).
- **Sauvegarde** : `houma:<joueur>` (un monde par joueur : personnages, objets, états des meubles, découvertes), cours **`houma`** (lisible sur une autre tablette). `fill()` répare une sauvegarde incomplète ou abîmée. Entre deux appareils : le monde le plus récent, **découvertes réunies**. Réglages ⚙️ : tout ranger dans le lieu, recommencer son monde (les découvertes restent).
- **Tests (Playwright, réels)** : scénario complet à la souris (ouvrir, habiller, coucher, bain, veillée, jasmin, machmoum, thé, couscous, manger, chat, darbouka : 17 découvertes), rechargement (monde retrouvé), sauvegarde abîmée (pas de plantage), doigt sur téléphone portrait et paysage et tablette portrait (glisser un personnage, faire défiler le décor). Pas testé sur un vrai iPad ou iPhone.
- **Les quatre autres lieux (12/11, « continue vers les autres mondes »)**, chacun sur un seul niveau :
  - **Le Café du Jasmin** : comptoir (évier, feu), étagère de verres, vitrine de bambalounis et de makrouds, deux tables, banc, tabouret, canari, radio, vue sur la mer ; citronnades, cartes, journal, le chat.
  - **L'école du quartier** : tableau (3 dessins à la craie : lettres latines et arabes, 2 + 3 = 5, soleil et maison), bureau, 3 pupitres (on s'y assoit derrière la table), étagère de livres, cahiers, crayons, globe, cartables ; dans la cour : cloche, drapeau tunisien, banc, fontaine, ballon, hérisson, grenouille, cigogne.
  - **Le souk** : 4 étals (fruits et légumes ; harissa, piment, balance, pain ; poteries de Nabeul, chéchia, chapeau ; machmoum, darbouka, fouta, lunettes), tapis, lanternes, couffin, chèvre, chat, et la **jarre** d'où sort un petit scorpion gentil quand on la touche.
  - **La plage** : mer où l'on **se baigne** (sol d'eau `'w'` dans `floors` : le personnage est coupé aux hanches derrière la vague), barque (2 places), transat et parasol (sieste), marchand de glaces, château de sable (3 états), palmier (dattes), cactus souriant, seau, pelle, bouée, coquillages, cerf-volant, crabe, mouette, poulpe, poisson.
- **Les animaux sont les créatures « en vrai » du Jasmin** (demandé par le papa) : les images de `jeux/jasmin2/` (chat, chèvre, cigogne, crabe, grenouille, hérisson et sa boule, mouette, poisson, poulpe, scorpion, cactus) sont utilisées telles quelles, animées par `.spr` quand la planche a 12 cases. Ici ce ne sont plus des ennemis : on les caresse, on les promène, on les prend dans la main. `fly:1` = il reste où on le lâche (il vole ou il nage).
- **Profondeurs** : meubles 100 ; personnage dans la mer 60 et vague 80 ; personnage assis ou au bain 1500 ; devant des meubles (`front` : pupitre, barque, baignoire) 2500 ; objets 3000 ; personnages debout 5000.
- **42 découvertes** en tout (dont « Visiter tout le quartier »).
- **Vraies poses assises, faites avec ComfyUI sur le PC du papa (12/11, gratuit)** : plus de crédits Higgsfield, le papa a installé **ComfyUI** (Comfy Desktop, RTX 5060 Laptop 8 Go, modèles **Wan 2.2 image vers vidéo 14B** + accélérateurs lightx2v 4 étapes ; pas de modèle d'image). Claude le pilote par le **navigateur intégré** de l'application Claude à `http://127.0.0.1:8188` (API `/prompt`, `/history`, `/queue`) ; les fichiers passent par le dossier connecté `C:\Users\azili\AppData\Local\Comfy-Desktop\ComfyUI-Shared` (`input` et `output`). Chaîne : `docs/houma/entree_comfy.py` (personnage debout de face sur fond vert 480 × 832) → vidéo 33 images, 4 étapes, « s'assoit en tailleur face à la caméra » (**environ 75 s par vidéo**) → `docs/houma/build_assis.py` (détourage du vert, recadrage) → `jeux/houma/s-<id>[-<tenue>].webp` + `jeux/houma/assis.js`. Dans le jeu : `seatOf()` ; sur un siège, au pupitre, en barque ou au bain le personnage est **assis en tailleur** (même taille de tête qu'debout) ; sans image pour la tenue, ou dans la mer, on garde le personnage debout coupé aux hanches. **Les 48 poses (8 personnages × 6 tenues) sont faites** (nuit du 12/11, 47 vidéos en un peu plus d'une heure).
- **Dix tenues (nuit du 12/11)** : aux 6 tenues du Jasmin s'ajoutent **pyjama, tablier d'école, tenue de fête** (robe fuchsia brodée pour Imen, Essil, Salma et Yasmine ; gilet rouge brodé, sarouel et chéchia pour Anis, Amine, Nour et Farès) et **tenue de plage**, créées avec **FLUX.2 klein 4B** dans ComfyUI (retouche de la tenue du personnage debout, le visage reste ; environ 5 s l'image), puis une retouche « yeux fermés » pour dormir et une vidéo Wan 2.2 pour la pose assise. `docs/houma/build_tenues.py` (debout + yeux fermés → `c-<id>-<tenue>.webp`, repères ajoutés à `corps.js`), `build_assis.py`, et `detoure.py` (détourage commun : tout ce qui est plutôt vert et relié au bord, plus les trous franchement verts ; résiste aux verts différents et aux ombres au sol). L'armoire a 10 cintres. 45 découvertes.
- **La voix (12/11)** : `say()` lit à voix haute les messages, les découvertes, le nom du lieu, du personnage invité ou touché et des objets, avec la voix française du navigateur (gratuite) ; le bouton 🔊 coupe bruitages et voix. La voix de Céline demanderait des crédits Higgsfield. **Les vraies voix de la famille (12/11)** : ⚙️ › « 🎙️ Les voix de la famille » : après le mot de passe parent (tapé par le parent, jamais par Claude), chacun enregistre au micro son prénom et le nom des 5 lieux (3 s au plus) ; `voix(clé)` joue l'enregistrement s'il existe, sinon `say()` lit le texte. Même service que Nahki Tounsi (`amine/voix/api.php`, clés `houma:<id>` et `houma:lieu-<lieu>`, sons gardés dans `nahki-voix/` hors du site). ComfyUI ne propose des voix que par des services payants (nœuds « partner » ElevenLabs, Fish Audio, HeyGen) : pas utilisé.
- **Reste à faire** : de nouvelles tenues réalistes (pyjama, tablier d'école, robe de fête : 2 crédits la planche, soit 16 crédits par tenue pour les 8 personnages) et une vraie pose assise, après le renouvellement des crédits et avec l'accord du papa.

**Bruitages (13/11)** : `jeux/sons/sons.js` (module `Sons` : préchargement, décodage dès l'arrivée, `jouer`, `boucle`, `stop`). Ma Houma remplace ses bips par `houma-*.mp3` (`SONS_H` : prendre, poser, porte-ouvre/ferme pour les placards, eau, croque, gorgée, miaou, oiseau, habit, étoile ; `sfx.drum` → doum/tek) et lance une **ambiance en boucle** par lieu (`ambiance(pid)` → `houma-amb-<lieu>.mp3`, coupée sur la carte et en sourdine). Le Jasmin 2 : `S(fn, nom)` joue `jasmin-<nom>.mp3` si prêt, sinon le bip (saut, atterrir, piece, gemme, brique, bonus, ecrase, aie, feu, ressort, lampe, boss, portail, plouf, chute, victoire). Détails : `docs/higgsfield.md` › ElevenLabs.

#### Ma maison (13/11, nuit) : la maison à meubler
- Sur la carte : **🏡 Ma maison** → 5 pièces (`ROOMS` : salon, cuisine, chambre, salle de bain, jardin), lieux `m-<pièce>` dans `PLACES` (sol à 3 profondeurs). On passe d'une pièce à l'autre par les **portes ◀ ▶** sur les côtés ou le bouton 🏠 ; **glisser un meuble ou un personnage sur une porte** l'emmène dans la pièce voisine.
- Barre du haut (dans la maison) : 🛋️ **catalogue** (81 objets réalistes, 6 onglets : salon, cuisine, chambre, bain, jardin, murs), 🎨 **murs et sol** (10 textures de mur + 8 couleurs, 10 textures de sol + 3 couleurs, ciel pour le jardin).
- Données : `S.deco[uid] = { t, p, x, y, k (taille), r (angle), f (retourné), z (devant/derrière), on (posé sur), s (allumé) }`, `S.mur[pièce] = { m, s }`, `S.mi[pièce]` (premiers meubles posés : `ROOM0`). 160 objets au plus.
- Chaque objet posé devient un **FIXED fabriqué à la volée** (`decoDef`) : places assises (`seats`), lits (`bed`), bains (`bath`), dessus où poser (`surf`), lumière (`glow`) viennent de `MB` (fractions de l'image). Tout le reste du moteur marche donc tel quel : s'asseoir sur le canapé, se coucher, poser un objet du quartier sur la table.
- **Gestes au doigt** : glisser = déplacer (ce qui est posé dessus et les personnages assis suivent) ; toucher = action (lampe, télé, radio, piano, eau, fusée qui décolle, trampoline, toboggan, balançoire, cheval à bascule, animaux…) + barre d'outils (➖ ➕ ↺ ↻ ⇋ ⧉ ⬆️ ⬇️ 🗑️) ; **double toucher** = retourner ; **pincer** = agrandir/réduire ; **tourner à deux doigts** = pivoter (aimanté droit sous 6°) ; un petit objet lâché sur une table se pose dessus (`supportAt`).
- **Gestes des personnages** : toucher un personnage ouvre une bulle 👋 💃 🦘 👏 😴 😘 (+ 🎩 pour enlever un accessoire). Images réalistes `jeux/houma/g-<id>[-<tenue>].webp` pour les 8 personnages × 14 tenues (5 cases : salut, danse A, danse B, saut, bravo ; danse = alternance A/B), repères `jeux/houma/gestes.js` ; dodo et bisou gardent l'image habituelle avec une petite animation.
- 17 découvertes de plus (`DISC`, et `HDISC` dans Progression) : meubler, 20 objets, peintre, pincer, retourner, poser sur une table, déménager, télé, musique, fusée, trampoline, toboggan, balançoire, chien, cuisine, geste, danse.
- Images : `docs/maison/catalogue.py` (liste + prompts), `docs/maison/build.py` (détourage → `jeux/maison/<id>.webp`, textures raccordées par miroir → `jeux/maison/tex/`, `jeux/maison/catalogue.js`), `docs/houma/build_gestes.py`.
- **13/11 (après-midi)** : 
  - **4 tenues de plus** pour les 8 personnages (`sport`, `sortie`, `chic` = robe pour les filles / costume pour les garçons, `hiver`), debout + yeux fermés (`c-*`), assis (`s-*`, Wan 2.2) et gestes ; cintres dans l'armoire de Dar Yasmine (14 tenues).
  - **Garde-robe** : toucher l'armoire ou la commode de la maison → qui s'habille → la tenue (`gardeRobe`).
  - **42 décorations de plus** (fauteuil suspendu, coussins, lanterne, four à pain, gâteau, plateau à thé, lit cabane, ordinateur, maison de poupée, château, veilleuse, boîte à musique, tente, cabane dans l'arbre, chat, poules, âne, mouton, cheval et chameau où l'on monte, panier de basket, but de foot…) avec leurs actions (`MB`).
  - **Arabesques et graffitis** (onglet 🎨, catégorie `peint`, 20 images) : posés au mur en `mix-blend-mode:multiply`, ils prennent le grain du mur.
  - **🖌️ Peindre sur les murs** : bombe (trait doux + gouttes), pinceau, gomme, 12 couleurs, 3 épaisseurs, annuler, tout effacer. `S.peint[pièce]` = traits en entiers, 12 000 nombres au plus ; la sauvegarde `houma` passe dans `BIG` (200 000, sans historique dans Progression).
  - Découvertes : graffeur, habits, anniversaire, cavalier.



#### Ma Houma, nuit du 14/11 : la carte en vrai, les maisons des enfants, la ferme
- **La carte du quartier** est une vraie image (ComfyUI, FLUX.2 klein, vue aérienne d'un quartier tunisien au bord de la mer : maisons blanches aux portes bleues, café, école, souk, plage, ferme) : `jeux/houma/reel/carte.webp`, posée au-dessus du dessin d'avant (qui reste si l'image manque). Les panneaux `MAP` sont placés sur l'image (en % de la scène).
- **Les maisons** (`HOUSES` : même moteur que Ma maison, pièces `<lettre>-<pièce>`, portes ◀ ▶ entre les pièces d'une même maison, bouton 🏠 = pièces de la maison + autres maisons) :
  - **Dar Essil** 🐴 (chambre : moucharabieh, poster du cheval, trophées, selle, bureau ; salon : arche bleue, dokkana, plateau en cuivre, lanterne de fer, niche, carte d'Europe ; patio : fontaine, citronnier, jasmin, cage bleue, grande jarre) ;
  - **Dar Salma** 🎨 (chambre fleurie : licorne, coiffeuse, guirlande ; atelier : chevalet, tableau de dessins, maison de poupée, coffre peint ; terrasse face à la mer) ;
  - **Dar Amine** 🚀 (chambre étoilée : mobile des planètes, lit cabane, astronaute, fusée ; salle de jeux : tapis des routes, garage, voiture de course, dino, train ; jardin : toboggan, trampoline, lapin).
  - Le dehors (patio, terrasse, jardin, ferme) a un **fond en vraie photo** (`PHOTOS`, `jeux/houma/reel/<pièce>.webp`) tant que le mur reste « ciel ».
- **La ferme** 🐄 (enclos des moutons, poulailler, étable) : mouton, chèvre, âne, poules, canard, vache, cheval… Un animal a **faim** 3 h après son repas (🌾 au-dessus de lui). Le toucher quand il y a du foin ou des grains dans la pièce, ou poser le foin à côté de lui : il mange, fait un cœur et donne parfois **un œuf, du lait ou de la laine** à ramasser (panier `S.panier`). Nourri **3 jours différents** : un **bébé** naît (poussins pour les poules, agneau pour le mouton). Données : `S.ferme[uid] = { r, j, b }`.
- **43 objets de plus** dans le catalogue (`docs/maison/catalogue.py`, onglets 🇹🇳 Tunisie, 🧒 Essil, Salma, Amine, 🐄 La ferme), 400 objets au plus dans toutes les maisons. 4 découvertes de plus : nourrir, récolter, un bébé, visiter les maisons des enfants.

#### Ma Houma en ligne (14/11, demandé par le papa) : jouer ensemble
Choix du papa : **discussion libre + messages vocaux**, **échange validé par les deux**, **ouvert tout le temps**. Code : `jeux/houma/ligne.js` (chargé après le code de `ma-houma.html`, il utilise ses variables), serveur `api/houma.php`.
- **Boutons** 👫 (les amis) et 💬 (la discussion) dans la barre du haut, avec une pastille rouge (échange à traiter, messages non lus). Les **têtes des amis connectés** (point vert) en haut à droite : on touche pour aller chez eux. Petites **cartes** en bas à gauche pour les nouveautés (lues à voix haute).
- **Aller chez un ami** : on charge son monde (`Famille.load('houma', nom)`), on le remplace le temps de la visite (`HL.visite = {nom, mien, retour}`), bandeau « Chez Salma · 🏡 Rentrer chez moi ». On peut regarder et jouer, **rien n'est enregistré** (`save`, `saveNow`, `sync`, `found` ne font rien pendant la visite ; décorer est caché). Si l'ami est connecté, on arrive dans la pièce où il est ; sinon dans sa chambre (Dar Essil / Dar Salma / Dar Amine, Ma maison pour les autres). Son monde se met à jour toutes les 6 s (ses changements arrivent 15 à 20 s après).
- **📣 Viens voir !** (panneau des amis, dans une pièce de son propre monde) : les autres reçoivent « Salma te montre L'atelier ! · 🚪 J'y vais ».
- **Discussion** : texte libre (300 caractères), 12 émojis, 8 phrases prêtes, **messages vocaux** (🎤 puis ⏹, 60 s au plus, MediaRecorder webm ou mp4) ; chaque message écrit a un 🔊 (voix de la tablette) et les nouveaux sont lus à voix haute (pour Amine).
- **Le troc** : A choisit un objet (meuble ou animal de ses maisons, ou un produit du panier : œuf, lait, laine) → B voit l'objet et choisit ce qu'il donne (ou « 🎁 c'est un cadeau ? », ou « Non merci ») → A dit « ✅ D'accord ! » : A fait son échange tout de suite, B le reçoit à son prochain passage (une seule fois, même avec deux tablettes : `applique`). Ce qu'on reçoit va dans sa chambre (les animaux dans l'enclos de la ferme). 6 propositions en attente au plus ; sans réponse, une proposition s'efface après 2 jours.
- 4 découvertes ⭐ : aller chez un ami, montrer sa maison, envoyer un message, faire un échange.
- **Parents** : Progression › onglet **💬 Houma en ligne** : tous les messages (écouter les vocaux, effacer un message) et tous les échanges.
- Limite : l'hébergement n'a pas de vrai direct ; chaque tablette demande les nouveautés toutes les 3 s (assez pour discuter et échanger, pas pour courir ensemble).



---

# `docs/journal.md`

## Journal du projet

Une ligne par réalisation, la plus ancienne en premier. Ajouter une ligne à chaque mise en ligne.

### Octobre 2026

- **21/10** : La Nuit d'Amine (Halloween, 4 mini-jeux : mémoire, compter jusqu'à 10, couleurs, suites).
- **21/10** : La Nuit d'Amine 2 (mémoire 10 paires / 18 personnages, compter jusqu'à 20, additions, comparer, histoire interactive « Où est passé Minuit ? »).
- **22-23/10** : Nahki Tounsi (derja tunisienne, 56 mots) + mode « 🎙️ Ma voix » (le papa enregistre les mots ; aucune voix de synthèse ne parle la derja).
- **29/10** : mise en ligne sur Hostinger via GitHub (`azilix-ui/jeu-amine`) ; page « Famille Missaoui » avec les espaces Essil, Salma, Amine ; cours d'Essil (Deutsch Express, Via Romana) et de Salma (English Garden) publiés ; voix de Nahki Tounsi gardées en ligne (PHP).
- **30/10** : Serpentin (snake 2D pour tablette, 4 mondes, 3 vitesses, mode chiffres ; Poppy Playtime remplacé par un monde inventé « Usine à jouets »).
- **30/10** : base de données famille (SQLite) : « Qui joue ? », records en ligne, suivi automatique des progrès de tous les cours, page Progression pour les parents ; en-têtes anti-cache (Chrome gardait l'ancienne version).
- **30/10** : skill Impeccable installé ; `PRODUCT.md`, audit de l'accueil et corrections (contraste, cibles tactiles).
- **30/10** : photos de famille sur l'accueil en tirages aimantés « porte du frigo » (publiques, à la demande du papa), puis réduites de 60-70 %.
- **30/10** : Le Jardin des Nombres (Salma, CE2) : soustraction avec retenue « en bas », 8 étapes, Ollie en maîtresse.

### Novembre 2026

- **01/11** : Le Grand Galop (Salma) : quiz de l'exposé « Le cheval », 6 Galops + Grand Prix, fiche de révision.
- **01/11** : connexion de Higgsfield ; vidéos du pas, du trot et du galop intégrées au Grand Galop (105 crédits).
- **01/11** : « Salma à cheval » (dessin animé + réaliste) en haut du Grand Galop, avec sa vraie voix qui compte en anglais (74 crédits) ; copies sur le PC.
- **01/11** : correction des fiches : le propriétaire du site est **le papa** (et non la maman).
- **01/11** : **Serpent Légendes** (snake 3D, 2 caméras, 3 niveaux, 4 mondes, 18 skins, coffres, défis légendaires, sauvegarde serveur) ; lien depuis l'accueil et les 3 espaces ; carte Progression.
- **01/11** : avatars Higgsfield d'Essil, Salma, Amine (6 crédits) et 9 cartes légendes (18 crédits).
- **01/11** : Anis et Imen ajoutés : avatars (4 crédits), boutons dans « Qui joue ? », profils dans les jeux.
- **01/11** : **nouvelle page d'accueil** avec les avatars (maquette Claude Design validée, titre au point rouge gardé, avatars ×1,9 au survol) ; ancienne accueil gardée dans `indexancien.html`.
- **02/11** : **L'Atelier des Verbes** (Salma, conjugaison C58 + C59, 8 étapes, fiche, carnet) et **tickets du savoir 🎟️** à dépenser dans la Boutique du savoir de Serpent Légendes (monde Bibliothèque et skin Crayon magique exclusifs).
- **02/11** : **Ludo Légendes** (Ludo 3D, contre la machine ou en ligne chacun sur sa tablette avec un code, collection de pions / dés / plateaux, pions légendaires et cartes légendes) ; serveur `api/ludo.php`.
- **02/11** : cartes légendes d'Anis et Imen + illustration de la famille autour du Ludo (14 crédits ; solde 569).
- **02/11** : bouton « 📤 Inviter un ami » dans le salon du Ludo (lien `?code=ABCD`) ; « Qui joue ? » corrigé pour les téléphones.
- **02/11** : documentation réorganisée : `CLAUDE.md` + `docs/` (contenus, jeux 3D, serveur, Higgsfield, journal) ; fiche du projet Claude mise à jour.
- **02/11** : **L'Ardoise magique** (Amine) : écrire les lettres en attaché, MAJUSCULES, minuscules et son prénom sur une ardoise 3D ; démonstration, pointillés corrigés geste par geste, écriture seule corrigée ; cartes → skins de Serpent Légendes (dont Craie magique), tickets, ardoise personnalisable.
- **02/11** : cartes illustrées de l'Ardoise (15 serpents) et écran d'accueil « Amine à l'ardoise » (32 crédits) ; illustrations aussi dans « Mes skins » de Serpent Légendes.
- **02/11** : **cartes rares** dans Serpent Légendes : brillantes ✨ (1 sur 10), 4 **mythiques** (exploits de chaque enfant + Hydre Missaoui à gagner ensemble), 4 **secrètes** (5 jours d'apprentissage d'affilée) ; API `?action=rewards` (16 crédits ; solde 521). Carte mythique de Salma publiée telle quelle.
- **02/11** : **L'Atelier des Formes** (Salma, géométrie GEOM 6 : les polygones) : 7 étapes avec équerre et règle virtuelles, et une **ardoise à figures** où Ollie corrige ses tracés (fermeture, croisements, nom, angles droits, longueurs) ; tickets 🎟️ pour Serpent Légendes.
- **02/11** : **Grimpe-Glace** (jeu de plateformes vertical, pour toute la famille) : l'avatar grimpe une tour de glace magique, saut automatique au bord, inertie et glisse, combos, 6 mondes, plateformes spéciales, tenues, musique et bruitages originaux, records en ligne ; illustration Higgsfield (2 crédits ; solde 519).
- **02/11** : le site s'installe comme une **application** (icône avec les avatars, manifeste, service worker, bouton « 📲 Installer l'appli ») ; **journal des visites** (IP, pays, ville, page, appareil, prénom) dans la page Progression, effacé après 60 jours.
- **03/11** : **Le Marché d'Ollie** (Salma, la monnaie MES 1 + MES 2) : comptoir de marché en 3D, 8 étapes (reconnaître, ranger, 100 ct = 1 €, tirelire, faire l'appoint, échange, assez d'argent ?), tickets 🎟️ et skin exclusif « Serpent Monnaie » dans Serpent Légendes.
- **04/11** : **La Légende du Jasmin** (jeu de plateforme 2.5D original, univers tunisien, d'après le cahier des charges du papa, version solo) : avatars de la famille, 5 mondes de Sidi Bou Saïd au palais du Scorpion d'Or (boss), blocs savoir 📚 adaptés à chaque enfant, bonus chéchia / harissa / thé, jasmins cachés, musique hijaz ; tickets 🎟️ pour Serpent Légendes ; 7 images Higgsfield (14 crédits).
- **05/11** : Jasmin, correction : aux mondes 4 et 5, une lanterne était posée au-dessus du lac (on réapparaissait dans l'eau) ; les lanternes et la réapparition cherchent maintenant un sol sûr.
- **05/11** : Jasmin, **4 nouveaux mondes** tunisiens : la Médina de Tunis (tapis volants, chats), les Ruines de Carthage (pierres qui s'effritent, crabes, mouettes), l'Île de Djerba (la marée monte et descend dans les cuvettes), les Maisons de Matmata (tunnels dans le noir, torches, chauves-souris) ; 9 mondes dans l'ordre du voyage, le palais reste la fin ; questions sur la Tunisie en plus ; les dalles fragiles n'ont plus le dessus noir ; 4 fonds Higgsfield (8 crédits).
- **05/11** : Jasmin, **vrais secrets à la Mario** dans les 13 mondes : bloc invisible ❤️ (une vie en plus), **jarre magique** vers une salle secrète pleine de dinars qui ressort plus loin ; et **4 mondes de plus** : la Côte de Tabarka (on nage), l'Amphithéâtre d'El Jem (pierres qui tombent), le Chott el-Jérid (mirages), le Lézard Rouge (le petit train) ; 13 mondes, 39 jasmins ; 4 fonds Higgsfield (8 crédits).
- **05/11** : Jasmin, **mascottes** pour les invités (fini le rond avec la première lettre du prénom) : Nour et Farès, héros tunisiens à la chéchia, dessinés par Higgsfield (4 crédits).
- **05/11** : mascotte fille **Yasmine** (2 crédits) ; « Qui joue ? » : un invité écrit son **pseudo** et **choisit sa tête** (Nour, Yasmine, Farès) à côté des avatars de la famille ; la tête est gardée avec le pseudo, retrouvée sur les autres tablettes, et affichée dans tous les jeux de la famille.
- **05/11** : Jasmin, les **invités** ont leurs propres blocs savoir : 65 questions de culture tunisienne niveau adulte, en français, sans calcul (le latin, l'allemand et les calculs restent pour la famille).
- **05/11** : Jasmin, corrections tablette : la vitesse grimpait sans fin quand on tenait une flèche (maintenant plafonnée), la croix ◀ ▶ est une seule zone où l'on glisse le pouce d'une flèche à l'autre, plus aucune touche ne reste « enfoncée » quand on lève les doigts ou qu'on met en pause, et un souci de son ne peut plus bloquer les boutons du menu pause.
- **09/11** : **Salma's Weather Station** (Salma, anglais débutant, la météo) : 5 activités (Learn, Listen!, Memory, Dress up!, On air!), 15 images et 47 voix anglaises Higgsfield, tickets 🎟️ pour Serpent Légendes, carte dans Progression.
- **09/11** : Jasmin, **5 nouveaux mondes** (18 en tout) : Kairouan (bassins, tapis-ressorts), l'Aqueduc de Zaghouan (le courant pousse), le Ksar Ouled Soltane (greniers, sacs de grain), le Lac d'Ichkeul (flamants roses-plateformes), le Canyon de Tamerza (cascade, coups de vent). Sidi Bou Saïd proposé au départ existait déjà (monde 1) : remplacé par Zaghouan. Les mondes déjà ouverts le restent.
- **09/11** : analyse de la vidéo « électricité » (style « Étape par étape ») et 5 idées de vidéos de géométrie pour Essil, dans `docs/videos.md` (pas encore produites : en attente de l'accord du papa sur le prix).
- **09/11** : **vidéo 1 pour Essil**, « La clôture des chèvres » (le périmètre : carré, rectangle, forme en L, cercle et π), 1 min 47, format vertical, voix off française, schémas exacts ; ≈ 44 crédits. Sur le PC dans `videos temple`.
- **09/11** : voix off : le papa choisit **Céline** (et Julian pour les autres projets) parmi 7 essais ; la vidéo 1 refaite avec Céline est **en ligne** dans l'espace d'Essil (`essil/videos-geometrie.html`), avec les formules à retenir et un petit défi.
- **09/11** : **épisode 2 pour Essil**, « Carreler la cuisine de mamie » (l'aire), en ligne ; la page Pas à pas a des onglets d'épisodes ; sous-titres corrigés (ponctuation collée au mot) dans les deux épisodes.
- **09/11** : son coupé ou muet dans Salma's Weather Station : 17 voix découpées dans des prises longues (phrases « It's sunny. », 4 questions, « Well done / Great job / Try again ») étaient **muettes** (fondu de fin mal calé lors du découpage) ; redécoupées, et toutes les voix passent maintenant par Web Audio (préchargées et décodées au premier toucher, plus de blocage sur tablette). English Garden (voix du navigateur) rendue plus fiable : phrases gardées en mémoire, petite attente après une coupure.
- **10/11** : **English Garden enregistré** : les 171 phrases (mots, « Where is the cat? », félicitations, conversation avec Ollie) sont des voix Higgsfield (Raina en anglais, Céline pour le français d'Ollie) dans `salma/english/voix/` (+ `manifest.json` : phrase → fichier), jouées par Web Audio comme la Weather Station ; la voix du navigateur ne sert plus qu'en secours. « Where is the grapes? » corrigé en « Where are the grapes? » ; le thème Hello! ne dit plus « Find... ».
- **10/11** : Ollie (English Garden) parle français avec la voix de Céline. Pas à pas · Géométrie : épisodes 3 (le piège du fermier), 4 (le bassin de Kairouan, le volume) et 5 (le minaret, les angles) en ligne, avec formules et défis.
- **10/11** : **L'Atelier du Jasmin** (`jeux/atelier-du-jasmin.html`) : coloriage de 18 paysages de Tunisie et de 9 costumes (Nour, Yasmine, Farès), en **2D ou en 3D** au choix dès l'accueil, création d'un **skin de serpent** utilisable dans Serpent Légendes (« 🎨 Ma création »), galerie, spectacle, sons, musique et consignes à voix haute. Liens sur l'accueil et dans les trois espaces.
- **10/11** : **Progression : suivre un cours et revenir en arrière** : les parents voient l'évolution d'un cours instantané par instantané, peuvent revenir à un état d'avant ou remettre un cours à zéro (les tablettes s'alignent toutes seules ; un ancien état ne peut plus être renvoyé). Carte « Atelier du Jasmin » dans Progression.
- **10/11** : **La Légende du Jasmin**, trois retouches demandées par le papa : l'image d'accueil reste fixe et s'anime quand on la survole à la souris (en boucle) ou qu'on la touche sur tablette (une fois) : la famille saute (vidéo de 5 s, `jasmin/titre.mp4`) ; les pièces posées à hauteur de tête se ramassent en passant, sans sauter (la zone de ramassage s'arrêtait pile à 28 px, portée à 38) ; le hérisson ne donne plus +100 à l'infini : +100 par piquant (il en a 7, dessinés un à un), chaque saut lui en enlève un et au dernier il s'en va.
- **10/11** : **L'Atelier du Jasmin**, perfectionné à la demande du papa : **loupe** (➕ ➖, pincement, molette ; on déplace le dessin agrandi en glissant) pour colorier les petits détails, en 2D et en 3D ; **modèle en couleur** de chaque dessin (bouton 🌈) pour donner des idées ; **carte à imprimer ou à envoyer** (bouton 🖨️ : un petit mot écrit sur le dessin, impression, envoi par WhatsApp ou message avec le partage de l'appareil, enregistrement de l'image) ; **20 nouveaux dessins** : 14 animaux de la ferme (chat, chatons, chien, chiot, cheval, jument et poulain, âne, vache, mouton, chèvre, poule, coq, lapin, cane) et 6 paysages tunisiens (Bizerte, Monastir, Nabeul, Dougga, Chebika, Kerkennah). Higgsfield : 134,75 crédits.
- **10/11** : **Ludo Légendes en ligne** : **discussion entre les joueurs** d'une même partie. Bouton 💬 en haut à droite (salon d'attente, partie, fin) avec pastille des messages non lus ; 12 emojis qui s'envolent en grand sur l'écran de tous avec le prénom, 8 phrases toutes faites, et un champ pour écrire (120 caractères). Les messages écrits s'affichent en bulle. Rien en partie contre la machine.
- **10/11** : **Progression** devient un **tableau de bord en rubriques** (onglets) : 📊 Vue d'ensemble (chiffres clés, graphique des pages ouvertes par enfant jour par jour, une carte par enfant), 📅 Activités (nombre d'ouvertures de chaque page par enfant, puis le détail jour par jour avec les heures et les progrès), 🎓 Cours et jeux (les cartes détaillées, un enfant à la fois), 🧭 Suivi (retour en arrière, remise à zéro), 🏆 Records, 🌍 Journal (adresses IP, lieu, fournisseur, appareil ; filtre famille / autres et recherche). Une seule période (24 h, 7, 30 ou 60 jours) pour toutes les rubriques. Rien de changé côté serveur.
- **10/11** : **La Planète des Nombres** pour Amine (`amine/planete-des-nombres.html`) : cinq jeux de nombres chez les aliens, de 0 à 60, entièrement à la voix (Julian) : compter, trouver le nombre entendu, avant et après, plus grand et plus petit, donner le bon nombre d'étoiles. Aliens, soucoupe et décor Higgsfield (28 crédits). Carte dans Progression, dans l'espace d'Amine et sur l'accueil.
- **10/11** : **Ludo Légendes : le salon**. À l'arrivée, « Qui joue ? » s'ouvre tout seul (enfants, parents, ou un pseudo avec une tête Nour, Yasmine ou Farès, comme dans le Jasmin). Le menu montre « Dans le salon » : tous ceux qui ont la page du Ludo ouverte, avec ce qu'ils font. **✉ Inviter** crée la partie et envoie l'invitation (l'autre voit « Salma t'invite… » avec Rejoindre / Plus tard) ; **▶ Rejoindre** entre directement dans une partie qui attend des joueurs. Les codes et le lien WhatsApp restent possibles. Testé à quatre navigateurs sur le serveur d'essai.
- **10/11** : **Ludo Légendes, accueil refait comme celui du Jasmin** : une seule carte au centre qui tient dans l'écran (PC, tablette, téléphone ; deux colonnes en paysage), avec l'image de la famille, le titre, puis un grand bouton « Qui joue ? » (avatar, prénom, « Toucher pour changer de joueur », qui clignote tant que personne n'est choisi), les trois façons de jouer, le salon, et une ligne Réglages / Collection / Records / pièces. Le choix du nombre de joueurs, des pions et du plateau passe dans une fenêtre « ⚙️ Réglages ».
- **10/11** : **Ludo Légendes : le sablier**. Chaque joueur a 10 secondes pour lancer le dé, puis 10 secondes pour bouger un pion ; un sablier avec une barre et les secondes s'affiche sous la consigne (il devient rouge et tic-tac sur les 3 dernières). Passé ce temps, l'ordinateur joue à sa place. En ligne, si un joueur quitte (bouton ✕) ou ferme sa page, l'ordinateur 🤖 prend sa place (il garde son prénom et sa tête, avec un petit robot) et les autres voient « 👋 Karim a quitté la partie. L'ordinateur joue à sa place. » Il peut revenir avec le code et reprendre sa place.
- **10/11** : **Nouvel avatar de Salma** (choisi par le papa parmi trois) : refait d'après des photos récentes (cheveux lisses mi-longs, sweat rose), dans le style des autres avatars. Même fichier `jeux/avatars/salma.webp`, donc il change partout (accueil, Progression, jeux, « Qui joue ? ») ; le cache de l'appli installée passe en `missaoui-v2` pour que les tablettes le voient. Les cartes légendes et les grandes illustrations de famille gardent l'ancienne Salma.
- **10/11** : **Salma redessinée partout** avec son nouvel avatar (cheveux lisses, sweat rose) : ses 3 cartes légendes, la carte mythique « Serpent des Verbes », la carte « Hydre Missaoui » (les trois enfants), l'illustration du Ludo, celle de Grimpe-Glace, l'accueil du Jasmin (image + vidéo animée refaite) et l'accueil de la Weather Station. Les autres personnages et les décors sont gardés à l'identique (retouche Higgsfield avec l'ancienne image + le nouvel avatar en référence). Cache de l'appli : `missaoui-v3`. Originaux PNG sur le PC : `avatars serpent legendes\salma nouvelle 2026-11-10\`.
- **10/11** : **Rond de tête des héros** (La Légende du Jasmin et Grimpe-Glace) : cadrage du visage réglé avatar par avatar par le papa sur la page « Les têtes du Jasmin » (claude.ai), recopié dans `HEADCROP` des deux jeux ; le cercle blanc autour de la tête est retiré (trait très fin à la place).
- **10/11** : **Jasmin : tête de profil quand le héros marche**. 8 têtes de profil (regard vers la droite) générées pour les 5 avatars de la famille et les 3 têtes d'invités (`jeux/avatars/<prénom>-profil.webp`, `mascotte-<id>-profil.webp`). Arrêté : la tête de face ; dès qu'il marche, la tête de profil tournée dans le sens de la marche. Cadrage réglable dans la page « Les têtes du Jasmin » (bouton « De profil »), valeurs dans `HEADCROP_P`.
- **11/11** : **Jasmin : le héros regarde là où il va, et soupire**. De face au départ ; de profil dès qu'il bouge, et il reste tourné vers la dernière direction quand il s'arrête. Après 10 s sans bouger, il se remet de face, hausse les épaules et soupire : tête « soupir » (yeux mi-clos, joues gonflées, 8 images Higgsfield `*-soupir.webp`), petits nuages de souffle, « pff… » et un petit bruit de souffle.
- **11/11** : **Atelier du Jasmin : puzzle et dessins réparés**. Bouton 🧩 sur chaque planche : facile (8 pièces), moyen (16) ou difficile (32), avec son coloriage ou le modèle en couleur ; vraies pièces à glisser qui s'aimantent, image fantôme 👻, mélange 🔀, bravo et niveau réussi gardé. 3 consignes de Julian. Fuites de couleur corrigées : « Le lapin » (ciel et herbe ne faisaient qu'une zone, trait d'horizon prolongé) et « Le Ribat de Monastir » (plage et mer, rivage tracé). Cache de l'appli `missaoui-v4`.
- **11/11** : **Pas à pas · Les fractions** pour Essil (`essil/videos-fractions.html`) : 3 vidéos avec la voix de Céline, comme la géométrie. 1 « Le gâteau de l'Aïd » (fractions égales, amplifier, simplifier), 2 « Le potager de Jeddi » (additionner et soustraire en mettant au même dénominateur), 3 « La citronnade de Tata » (multiplier, inverse, diviser). Schémas exacts dessinés par nous, fractions écrites empilées sur la page, « Ce qu'il faut retenir » et un défi de 5 questions par épisode. Carte dans l'espace d'Essil, lien sur l'accueil. ≈ 67 crédits Higgsfield.
- **11/11** : **Les Écuries d'Essil** (`essil/les-ecuries.html`), le jeu de cheval demandé par Essil : club-house (filet et selle, robes et races, pansage : leçons et quiz qui rapportent des pièces), écurie en 3D (pansage avec les vraies brosses dans le bon ordre, nourrir, équiper), sellerie (7 rayons, 12 couleurs), marchand (13 chevaux), concours en 3D où l'on monte (CSO, cross, dressage, 3 niveaux chacun). 36 images Higgsfield (72 crédits). Carte dans l'espace d'Essil, lien sur l'accueil, carte dans Progression.
- **11/11** : **Médina Express** (`jeux/medina-express.html`), course infinie en 3D d'après le cahier des charges du papa : 3 voies, sauter, glisser, deux mondes (médina, TGM) et « le voyage » qui alterne, 5 bonus dont le tapis volant, coureur avec la tête du joueur, modes Tranquille (3 cœurs) et Champion, classements en ligne pour la famille et les invités. Lien sur l'accueil, carte dans Progression. Aucune image générée (0 crédit).
- **11/11** : **Médina Express, 2e passe** : mode Champion plus rapide et plus dur avec des trains qui foncent (voie réservée, alerte ⚠, klaxon), tête des joueurs **vue de dos** pendant la course (8 images), 6 **tenues** à acheter avec les pièces, et un essai de corps animé « Essil en vrai » tiré d'une vidéo Higgsfield. 34 crédits.
- **11/11** : **Médina Express, 3e passe** : corps animés « en vrai » pour les 8 personnages (famille et mascottes), avec un **vrai saut** et une **vraie glissade** (planches de 24 images tirées de vidéos Higgsfield), et les 5 tenues payantes dessinées sur ces corps (48 planches). Tailles différentes selon le personnage. Menu réparé sur téléphone (la rangée des tenues élargissait la page). Cache de l'appli : `missaoui-v5`. 205,5 crédits (solde : 303,6).
- **11/11** : **Médina Express : le policier**. À la fin d'une course, un policier tunisien rattrape le coureur en sifflant, le relève et l'embarque dans sa voiture (gyrophare, sirène), puis les scores s'affichent ; on peut passer la scène en touchant l'écran. 6,5 crédits (solde : 297,1).
- **11/11** : **La Légende du Jasmin 2** (`jeux/legende-du-jasmin-2.html`) : le Jasmin avec les héros « en vrai » de Médina Express, vus de profil (8 planches : debout, course, bond). L'ancienne version reste ; les deux partagent la sauvegarde et les records. 92,5 crédits, dont 36 de vidéos de saut inutilisables (tête hors cadre) et 4,5 pour refaire la course de Nour (solde : 204,6).
- **11/11** : **Jasmin 2 : vue de face, soupir et tenues**. Le héros « en vrai » démarre de face, passe de profil quand il bouge, et après 10 s d'arrêt se remet de face et souffle, comme dans le Jasmin 1. Les 6 tenues de Médina Express sont dans le menu (même garde-robe et mêmes pièces que Médina Express ; 48 planches). 112 crédits (solde : 92,6).
- **11/11** : **Jasmin 1 et 2, dernier monde : le héros ne disparaît plus au retour de la salle secrète**. La salle secrète est rangée après l'arène du boss ; en y entrant, le combat se déclenchait (la porte se fermait, la caméra restait sur l'arène). Le déclencheur (`bossgate`) ne vaut plus que dans l'arène et hors de la salle secrète.
- **11/11** : **Jasmin 2 : créatures « en vrai »**. Le scorpion, le crabe, la mouette et le Scorpion d'Or (il marche, fonce, est sonné, lance ses braises) sont animés à partir de vidéos Higgsfield. 35 crédits (solde : 57,6).
- **11/11** : **Jasmin 2 : chat, grenouille et cigogne « en vrai »** (19,5 crédits, solde : 38,1). **Les Écuries ouvertes à toute la famille** : `jeux/les-ecuries.html`, même jeu et même code que chez Essil, un club par joueur, liens chez Salma, Amine et sur l'accueil (0 crédit).
- **11/11** : **« Le Jasmin », c'est maintenant le Jasmin 2.** Tous les liens du site mènent à la nouvelle version, renommée « La Légende du Jasmin » ; l'ancienne reste en ligne, accessible seulement depuis le bas de la page Progression.
- **11/11** : **Le Jasmin : les derniers ennemis « en vrai »** en formule mixte : faucon et chauve-souris animés par vidéo, hérisson, cactus et poisson en image seule animée par le code. 19 crédits (solde : 19,1).
- **11/11** : **Jasmin (les deux versions), combat final : le Scorpion d'Or ne reste plus figé.** Quand il touchait le héros, celui-ci réapparaissait mais le boss passait « en attente » pour toujours (seule la porte de l'arène le réveillait, et elle ne sert qu'une fois) : arène fermée, jeu bloqué. Il reprend maintenant le combat tout seul après 1,3 s, et les braises en l'air sont effacées.
- **11/11** : **Le Jasmin passe à 21 mondes** : Dougga (théâtre romain, chèvres), Kerkennah (barques, poulpes), Cap Bon (poteries, oranges qui tombent). Nouvel ennemi demandé par le papa : **l'ivrogne comique** qui lance des bouteilles à esquiver (2 dans la Médina, 1 caché dans chaque nouveau monde). 12 crédits (solde : 7,1).
- **11/11** : **Jasmin : la bourse.** Les dinars ramassés s'additionnent d'un monde à l'autre (le compteur ne repart plus de zéro) et servent à acheter les tenues dans le Jasmin (75 à 1000 dinars). Rattrapage : 30 dinars par monde déjà réussi.
- **11/11** : Jasmin : l'ivrogne tombe quand on lui saute dessus, comme les autres ennemis.
- **11/11** : **Le Jasmin passe à 24 mondes** : Bizerte (pont mobile, barques), Testour (horloge qui tourne à l'envers, grenades), Monastir (tour du ribat, marée, boulets). 6 crédits (solde : 1,1).
- **11/11** : Atelier du Jasmin : les coloriages sont aussi gardés sur le serveur (cours `atelier-art`) et reviennent sur une autre tablette, dans l'appli installée ou après un vidage du navigateur ; message si la tablette est pleine. Cause du souci d'Amine : les dessins n'étaient gardés que sur la tablette où ils avaient été faits (aucune remise à zéro en base).
- **11/11** : Atelier du Jasmin : nouveau motif **dégradé** (de la couleur choisie vers le blanc, ou entre deux couleurs avec le bouton « 2 »).
- **11/11** : Atelier du Jasmin : crayon noir et feutre (ferment les zones), 8 motifs de plus (arabesque, fleurs, étoiles, cœurs…), tampons (48 emojis, 3 tailles), annuler pour tout, feuilles blanches « Je dessine », 6 dessins pas à pas (chat, poisson, maison, fleur, bateau, papillon).
- **11/11** : Jasmin : à la fin d'un monde, la boîte « Monde suivant » permet aussi de changer de tenue (et d'en acheter) et de changer de héros.
- **11/11** : Jasmin : le bandeau du haut affiche aussi le prénom du joueur et le nom du monde.
- **11/11** : **Le Miroir Magique** (`salma/miroir-magique.html`, cours `salma-symetrie`) : la symétrie niveau CE2 pour Salma, 7 étapes (pliage, axe, nombre d'axes, bon reflet, coloriage sur quadrillage, reflet dans l'eau, point par point) et un miroir magique pour dessiner des rosaces. Tickets pour Serpent Légendes, carte dans Progression. Aucun crédit.
- **11/11** : **Écuries : chevaux perdus entre deux appareils (Essil)**. Cause : le jeu gardait « la sauvegarde la plus récente » ; l'onglet du PC, resté ouvert depuis le matin avec 6 chevaux, a réenregistré par-dessus les achats du soir faits sur la tablette. Correctif (`essil/ecuries/jeu.js`, `?v=3`) : `merge` **réunit** les deux sauvegardes (chevaux et matériel de l'un ou de l'autre, meilleurs records, pièces de l'appareil le plus récent) ; `sync` au démarrage, au retour sur l'onglet (`visibilitychange`, `focus`) et toutes les minutes. Récupération : rouvrir le jeu sur l'appareil qui a encore tous les chevaux.
- **11/11** : Écuries, sauvegarde d'Essil : à la demande du papa, les 7 chevaux manquants ont été remis à la main sur le serveur (13 chevaux en tout) et 400 pièces ajoutées (170 → 570), par un envoi `action=progress` depuis le site.
- **12/11** : **Ma Houma** (`jeux/ma-houma.html`, cours `houma`) : première version jouable du monde libre demandé par le papa (cahier des charges « MiniMondes », adapté au site et à un quartier tunisien). Carte du quartier, **Dar Yasmine** (maison en coupe, 6 pièces), 8 personnages (famille + Nour, Yasmine, Farès), 7 tenues, 36 objets, 22 meubles, 21 découvertes ⭐, sauvegarde par joueur, carte dans Progression. Café, école, souk et plage : en travaux, après validation. Aucun crédit.
- **12/11** : Ma Houma : les personnages dessinés sont remplacés par les **personnages réalistes** du Jasmin (vus de face, découpés dans les planches existantes, aucun crédit) avec leurs 6 tenues ; bouton **✕ Quitter** ; 22 découvertes.
- **12/11** : Ma Houma : ouverture des **4 autres lieux** (Café du Jasmin, école du quartier, souk, plage avec baignade et barque) ; les animaux sont les **créatures réalistes du Jasmin** (chat, chèvre, cigogne, crabe, grenouille, hérisson, mouette, poisson, poulpe, scorpion, cactus), devenues des amis. 110 objets, 42 découvertes. Aucun crédit.
- **12/11** : **ComfyUI en local** (PC du papa, gratuit) : Claude le pilote par le navigateur intégré et le dossier `ComfyUI-Shared`. Premier usage : les **vraies poses assises** de Ma Houma (Wan 2.2 image vers vidéo, environ 75 s par vidéo) pour les 8 personnages en tenue de tous les jours ; les 5 autres tenues (40 vidéos) sont en file d'attente.
- **12/11** : Ma Houma : les **48 poses assises** (8 personnages × 6 tenues) sont en ligne, toutes faites avec ComfyUI en local. Modèle d'image **FLUX.2 klein 4B** téléchargé dans ComfyUI avec l'accord du papa (3 fichiers, 12,5 Go, par le gestionnaire de ComfyUI).
- **12/11 (nuit, pendant que le papa dort, à sa demande)** : avec ComfyUI en local : Ma Houma reçoit **4 tenues réalistes de plus** (pyjama, tablier d'école, tenue de fête, plage : debout, yeux fermés et assis pour les 8 personnages, 10 tenues en tout) ; le Jasmin reçoit **6 objets en vrai** (boulet, orange, grenade, figue, bouteille, braise) et **4 créatures animées pour de vrai** (chèvre, hérisson, poisson, poulpe), aussi utilisées dans Ma Houma. ComfyUI documenté dans `docs/higgsfield.md`.
- **12/11 (matin)** : à la demande du papa : **cactus et ivrogne animés** dans le Jasmin ; **Ma Houma parle** (voix française du navigateur) ; **4 tenues de plus dans le Jasmin et Médina Express** (pyjama 100, tablier 200, plage 400, fête 800 pièces ; 64 planches retouchées en entier par FLUX.2 klein dans ComfyUI, gratuit).
- **12/11 (soir)** : Ma Houma : **studio des voix** pour les parents (⚙️ › Les voix de la famille) : chacun enregistre son prénom et le nom des lieux avec sa vraie voix, protégé par le mot de passe parent, via `amine/voix/api.php`.
- **12-13/11 (nuit)** : **vrais bruitages** dans le Jasmin (16 sons : saut, pièce, gemme, boss, victoire…) et Ma Houma (13 sons + darbouka doum/tek + **5 ambiances en boucle** : souk, plage, café, école, maison), générés avec **ElevenLabs Sound Effects** (formule Starter prise par le papa ce soir-là). 4 variantes par son ; page d'écoute `jeux/sons/ecoute.html` pour changer de variante. Les bips restent en secours si un son ne charge pas.
- **13/11 (nuit, le papa dort, à sa demande)** : Ma Houma › **Ma maison** : 5 pièces à meubler et décorer librement, **81 meubles et objets réalistes** et **20 textures** de murs/sols faits avec ComfyUI (FLUX.2 klein, gratuit, sur le PC du papa), gestes au doigt (glisser, pincer, tourner, double toucher, portes entre les pièces), meubles qui s'animent, et **gestes réalistes des personnages** (salut, danse, saut, bravo) faits avec ComfyUI.
- **13/11 (nuit, demandé par le papa à 2 h)** : Jasmin : bouton **⚙️ du son** à côté de la pause (bruitages / musique / ambiance), et une **ambiance sonore pour chacun des 24 mondes** (ElevenLabs, style tunisien et oriental : mer de Sidi Bou Saïd, souk de Tunis, vent du Sahara, train du Lézard Rouge, flamants d'Ichkeul…), écoutables sur `jeux/sons/ecoute.html`.
- **13/11 (matin)** : Jasmin : écran **🎚️ Chaque bruitage** : chaque son (saut, chute, pièce…) se règle seul : nouveau (enregistré), ancien (le bip codé d'avant) ou rien, avec ▶ pour écouter.
- **13/11 (midi)** : **Jasmin 3, essai** : Sidi Bou Saïd entièrement « en vrai » (fond photo, maisons, murs à la chaux et faïence, mer, coffres, dinars, lanterne, jarre…), 22 images ComfyUI ; les 23 autres mondes attendent l'avis du papa.
- **13/11 (après-midi)** : **Jasmin 3 complet** : les 24 mondes en images réalistes ComfyUI (161 images : photo, décor du milieu, sol, dessus, plateformes, eau, pics par monde) ; tous les liens du site mènent au Jasmin 3, le Jasmin 2 reste en sauvegarde sans changement. **Ma Houma** : 4 tenues (sport, sortie, chic, hiver), garde-robe, 42 décorations, 20 arabesques et graffitis, peinture libre sur les murs.
- **13/11 (soir)** : Ma Houma : **gestes réalistes des 4 nouvelles tenues** (32 planches, ComfyUI) et tenue de sport d'Imen refaite en violet (le fond vert l'effaçait) ; Jasmin 3 : **tapis volant** réaliste du monde 6.
- **13/11 (soir)** : **Jasmin 3 sur PC** : le héros et le sol avançaient par à-coups sur les écrans de PC (60, 75, 144 Hz) car le jeu calcule 120 pas par seconde : chaque image est maintenant dessinée entre deux pas (positions adoucies), la caméra tombe pile sur un pixel, et la photo du fond et la rangée de maisons floutée sont préparées une fois par monde au lieu de chaque image. Le Jasmin 2 n'est pas modifié.
- **13/11 (soir)** : **Jasmin 3** : le **hérisson** est revenu (Dunes du Sahara et autres mondes) : depuis l'ajout des chèvres de Dougga (commit 918612d), sa ligne de réglage était collée dans un commentaire, il n'avait ni taille ni vitesse et disparaissait. Le même défaut reste dans le Jasmin 2 (non modifié, à la demande du papa).
- **13/11 (soir)** : hérisson corrigé aussi dans le **Jasmin 2** (demande du papa). **Accueil** : deux boutons **🌼 Jasmin 3** et **🌸 Jasmin 2**, badge « **Jeux propulsés par Anis Missaoui** » (avatar, dégradé, fusée), **© 2026 Anis Missaoui** et **numéro de version** en bas (`version.js`, refait par `docs/outils/version.sh` avant chaque commit) ; © aussi en bas des espaces d'Essil, Salma et Amine.
- **13/11 (nuit)** : **la porte du site** (`acces/`) : page « accès réservé » aux couleurs du site avec les avatars de la famille, compte administrateur d'Anis (créé par lui, prouvé par le mot de passe parent), maison reconnue par son adresse IP, appareils de confiance, liens d'invitation à durée limitée, visites refusées. **En pause** tant qu'Anis ne l'active pas. Testé en local (création du compte, maison, invitation à usage unique, retrait d'un appareil, API 401).
- **13/11 (nuit)** : protection **activée** par le papa et vérifiée (inconnu → « Accès réservé », lien direct d'un jeu aussi, API refusée ; la maison entre seule). Ajout : **les appareils qui frappent à la porte** : un inconnu peut écrire son prénom et frapper ; Anis lui fait confiance d'un clic depuis l'administration, où qu'il soit.
- **14/11 (nuit)** : 7 améliorations demandées par le papa : **sauvegardes** hebdomadaires (8 gardées, téléchargement dans l'administration) ; **Qui joue ?** (invités connus en boutons, « Tu voulais dire Anis ? », prénoms au hasard refusés, fusion/suppression dans Progression) ; **alertes** e-mail + ntfy quand quelqu'un frappe à la porte ; **défi du jour** (5 tickets + 10 min de jeu) ; **Je lis !** pour Amine (voyelles, sons, syllabes, premiers mots, voix de l'appareil) ; **temps d'écran** (45 min / 1 h 30 week-end, nuit 20 h 30, cours libres, réglable dans Progression › Réglages) ; **le mur de la famille**.
- **14/11 (nuit)** : **Je lis !** : lien sur l'accueil (carte d'Amine), voix plus fiable (une phrase après l'autre, garde-fou si la voix de la tablette se tait), menu **🔊 La voix** ; voix ElevenLabs Lulu (créée pour Amine), Papi Olivier, Jon le conteur. **Ma Houma** : carte du quartier en vraie photo, maisons d'Essil, Salma et Amine (décor tunisien réaliste), **la ferme** (animaux à nourrir, œufs, lait, laine, bébés), 43 objets ComfyUI, fonds en photo pour les patios, terrasses, jardin et ferme.
- **14/11 (nuit, suite)** : les voix de **Je lis !** (Lulu, Papi Olivier, Jon : 157 sons chacune) sont envoyées par la page ElevenLabs directement au site (`amine/lire/depot.php`) : plus aucun téléchargement à accepter. Lecture Web Audio (blancs coupés, volume égal), Lulu par défaut.
- **14/11 (matin)** : **Ma Houma en ligne** (demandé par le papa) : les enfants se voient connectés, vont les uns chez les autres (on regarde et on joue, rien ne change chez l'autre), « 📣 Viens voir ! », discussion libre avec émojis, phrases prêtes et **messages vocaux**, **troc d'objets** validé par les deux (meubles, animaux, œufs, lait, laine). Historique et effacement pour les parents dans Progression (onglet 💬). `api/houma.php`, `jeux/houma/ligne.js`.
- **14/11 (matin)** : temps d'écran : **heures de nuit du week-end** (Progression › Réglages) : « 🌙 Week-end : pause nuit » (vendredi et samedi soir) et « ☀️ Week-end : les jeux reviennent à » (samedi et dimanche matin), réglables par enfant ; au départ, les mêmes heures qu'en semaine.
- **14/11 (matin)** : **tableau du temps de jeu** sur l'accueil (ce qu'il reste à chaque enfant, pause de nuit, temps en plus, demandes en attente) et **« 🙋 Demander plus de temps »** sur l'écran de pause : notification **ntfy** au papa avec boutons +15 min / +30 min / Non (`api/reponse.php`, jeton à usage unique), réponse aussi possible dans Progression ; la tablette se débloque toute seule.
- **14/11 (midi)** : **nouvel accueil « Qui es-tu ? »** (maquette Claude Design) : la famille en grand + les invités Nour, Yasmine, Farès. Un enfant voit seulement ses cours et le bandeau des jeux de famille ; papa, maman et les invités voient tout en **mode explorateur** (rien ne compte pour les enfants : bac à sable localStorage + le serveur n'enregistre rien à leur nom), étiquette « Explorateur du site : <nom> » en haut à droite. Lien Administration en bas de l'accueil. Pas de mot de passe (choix du papa).
- **14/11 (après-midi)** : l'étiquette explorateur passe **en bas à gauche, déplaçable** ; la toucher ouvre **le salon du site** : qui est connecté et sur quelle page, et **discussion privée** avec chacun (les enfants reçoivent une bulle lue à voix haute, où qu'ils soient sur le site). Sur « Qui es-tu ? », **un visiteur écrit son prénom et choisit son avatar**.
- **14/11 (soir)** : **nouveaux avatars 3D** (ComfyUI, FLUX.2 klein, d'après les photos du dossier `avatar/version2` du papa ; v2 pour Salma, v3 pour Essil et Amine ; rien de changé pour Anis) **seulement sur « Qui es-tu ? »** (`jeux/avatars/qui/`). **Coloriages de la famille** (Anis, Imen, Essil, Salma, Amine) dans l'Atelier, rubrique « La famille Missaoui » (`c-<nom>-1` / `m-c-<nom>-1`). **Affiche de la famille** à Sidi Bou Saïd (`jeux/avatars/qui/affiche-famille.jpg`, titre ajouté en Bricolage Grotesque). **Mur des nouveautés** réaliste sur l'accueil (liège au cadre bleu sur la chaux, papiers épinglés, filtrés selon le profil). Photos et essais restent sur le PC (`ComfyUI-Shared/output/fam`), non publiés.
- **14/11 (nuit)** : **La Légende du Jasmin · Stage 2** (demandé par le papa, les enfants avaient fini le Jasmin 3) : nouveau moteur avec échelles, ramper, prendre/poser/lancer des objets, caisse à pousser, levier et grille, mur fissuré et pièce secrète, clé et porte, ennemis qui dorment, patrouillent, poursuivent (garde, chien, marchand aux oranges, chat, mouette), 3 difficultés. **Monde 1 « Les ruelles de la médina »** prêt (images et animations ComfyUI) ; 9 autres mondes annoncés. Lien depuis le Jasmin 3 et le mur des nouveautés.
- **15/11 (nuit)** : **Jasmin · Stage 2, les 10 mondes** (demande du papa) : nouvelles commandes (↑ saute, ↓ s'accroupit, ↓ + Espace ramasse, Espace lance, rester accroupi = passage secret), **barre de vie** en haut au milieu, plus jamais coincé (vérificateur des cartes, échelles ajoutées, « Revenir à la dernière lanterne », message à la porte fermée), mondes 2 à 10 avec terrains glissants, sable, eau, tuiles qui tombent, rebonds, rochers, nuit des souterrains, trains, barques, **scooter**, **tapis volant**, 8 nouveaux ennemis et **2 boss** (Crabe géant, Scorpion d'Or) ; décors et ennemis ComfyUI ; gestes du héros (grimper, ramper, s'accroupir, porter, lancer) faits avec ComfyUI pour les 8 personnages.
- **15/11 (midi)** : Stage 2 : Salma grimpait l'échelle de face (sa tenue « tablier » n'avait pas de gestes ComfyUI) → gestes faits pour les 4 dernières tenues (tablier, pyjama, fête, plage) d'Essil, Salma et Amine ; la tenue de plage sur fond magenta. Images fixes en ligne tout de suite, mouvements animés ensuite.


---

# `docs/serveur.md`

## Serveur, données et synchronisation

Hébergement Hostinger (PHP + SQLite). Données hors du site public, à côté de `public_html` (sur Hostinger : `domains/missaoui-family.com/`) :

| Dossier | Contenu |
|---|---|
| `famille-data/famille.sqlite` | joueurs, records, progrès, historique, anti-abus |
| `famille-data/ludo.sqlite` | parties de Ludo en ligne |
| `famille-data/houma-ligne.sqlite`, `famille-data/houma-voix/<id>.<webm/mp4>` | Ma Houma en ligne (`api/houma.php`) : présence, messages (600 gardés), messages vocaux, échanges ; compris dans la sauvegarde |
| `famille-data/lire-voix/<voix>/<clé>.mp3` | les voix ElevenLabs de « Je lis ! » (Lulu, Olivier, Jon), déposées par `amine/lire/depot.php` (jeton), servies par `son.php`, listées par `voix.php` ; comprises dans la sauvegarde |
| `nahki-voix/` | `auth.json` (hash du mot de passe parent), `index.json`, `sons/` (voix de Nahki Tounsi) |

### `api/famille.php`

- `GET ?action=ping` ; `GET ?action=highscores&game=G&variant=V&limit=N` ; `GET ?action=auth`.
- `GET ?action=load&player=P&course=C` : relit les progrès gardés sur le serveur, **seulement pour les cours de `READABLE`** = `serpent3d`, `salma-verbes`, `salma-geometrie`, `salma-symetrie`, `salma-monnaie`, `salma-meteo`, `ludo3d`, `grimpeglace`, `jasmin`, `amine-ecriture`.
- `GET ?action=rewards&player=P` : pour les cartes rares de Serpent Légendes. Renvoie `days` (jours d'apprentissage sur 120 jours), `streak` (série en cours), `secrets` (nombre de tranches de 5 jours d'affilée, max 4) et `myth` {alphabet, verbes, polyglotte : {v, goal} ; hydre : {v = enfants actifs cette semaine, done}}. Un « jour d'apprentissage » = un instantané dans `history` pour un cours de `LEARNING` (tous les cours sauf les jeux), en heure de Paris.
- `POST action=score` (player, game ∈ `GAMES` = serpentin, serpent3d, ludo3d, grimpeglace, jasmin ; variant ; score 0–5000, jusqu'à 999 999 pour grimpeglace et jasmin).
- `POST action=progress` (player, course ∈ `COURSES`, data JSON ≤ 30 000 caractères).
- `POST action=setup` (création unique du mot de passe parent), `POST action=summary` (tout pour la page Progression, mot de passe parent).
- Tables : `players`, `scores`, `progress` (dernier état par joueur et cours), `history` (un instantané par heure au plus), `writes` (anti-abus : **240 écritures par 10 min et par adresse** ; toute la maison partage souvent la même adresse).
- `COURSES` : essil-deutsch, essil-latin, salma-english, salma-maths, salma-cheval, salma-verbes, salma-geometrie, salma-symetrie, salma-monnaie, salma-meteo, amine-halloween, amine-tounsi, amine-serpentin, amine-ecriture, serpent3d, ludo3d.

### `api/ludo.php` (parties en ligne)

- `GET ?action=state&code=ABCD` → {v, state} ; `POST action=create state` → {code, v} ; `POST action=push code v state` → {v} ou **409** {v, state} si la version a changé.
- Codes : 4 caractères parmi `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. État ≤ 24 000 caractères. Parties effacées après 12 h d'inactivité. **1500 envois par 10 min et par adresse** (base à part pour ne pas gêner les autres jeux).
- Le serveur ne vérifie pas les règles : ce sont les tablettes qui jouent (famille de confiance).

### `famille.js` (chargé par toutes les pages)

- `Famille.player()`, `Famille.setPlayer(n)`, `Famille.choosePlayer({title, extra, avatar})` (« Qui joue ? » : Essil, Salma, Amine ; `extra` = Anis, Imen ; un autre prénom), `Famille.score`, `Famille.highscores`, `Famille.track(cours, joueur, clés)` (envoi toutes les 15 s et à la fermeture), `Famille.load(cours, joueur)`.
- Joueur courant de l'appareil : `famille-joueur` ; envois en attente hors connexion : `famille-attente`.

### Clés de sauvegarde (localStorage) → cours suivi

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

### Application installable et journal des visites

- **`site.js`**, chargé en tête de **toutes** les pages (avec `<link rel="manifest">`, l'icône Apple et les balises « web app ») : enregistre le service worker et note chaque ouverture de page (`POST action=visit` : page, prénom de « Qui joue ? », appli installée ou non, taille d'écran, site d'origine ; au plus une fois toutes les 10 min par page et par onglet).
- **`manifest.webmanifest`** : « Famille Missaoui » (nom court « Missaoui »), plein écran sans barre du navigateur, raccourcis vers les 3 espaces et Grimpe-Glace. Icônes `icons/` (192, 512, « maskable », Apple 180) faites avec les avatars des 3 enfants et le point rouge du titre.
- **`sw.js`** (service worker, version `missaoui-v1` : l'augmenter pour forcer un grand ménage) : pages, CSS et JS d'abord par le réseau (toujours la dernière version), copie gardée pour le hors-connexion ; images et Three.js d'abord depuis la copie ; API, voix et vidéos toujours par le réseau.
- Bouton **« 📲 Installer l'appli »** sur l'accueil : vraie fenêtre d'installation sur Android / Chrome / Edge, explications pour Safari sur iPad et iPhone (Partager → « Sur l'écran d'accueil »).
- **Journal des visites** (table `visits` : heure, IP, page, prénom, navigateur, appli, écran, origine ; table `geo` : pays, région, ville, fournisseur par IP). L'IP est `REMOTE_ADDR` quand elle est publique (depuis le 13/11 : `X-Forwarded-For` pouvait être inventé), sinon la première adresse publique de `CF-Connecting-IP` / `X-Real-IP` / `X-Forwarded-For`. Le pays et la ville sont demandés à **ip-api.com** (par lots de 100) seulement quand un parent ouvre le journal, puis gardés. **Effacé après 60 jours** (`VISIT_DAYS`). Lecture : `POST action=visits pass days` (mot de passe parent), affichée dans `progression.html` (24 h / 7 / 30 / 60 jours ; visiteurs regroupés par IP, puis toutes les pages ouvertes).

### `progression.html`

Mot de passe parent (le même que les voix). Cartes : Essil (Deutsch, Latin, Serpentin, Serpent Légendes, Ludo), Salma (English Garden, Atelier des Verbes, Marché d'Ollie, Atelier des Formes, Jardin des Nombres, Grand Galop, Serpentin, Serpent Légendes, Ludo), Amine (Ardoise magique, Serpentin, Serpent Légendes, Ludo, cagnotte, Nahki). Gains de la semaine, records Serpentin, dernières parties (tous jeux), autres joueurs (amis invités), **journal des visites**.

**Mot de passe oublié** : supprimer `nahki-voix/auth.json` dans le gestionnaire de fichiers hPanel, puis en recréer un (les sons sont conservés).

### Suivre un cours, revenir en arrière, remettre à zéro (10/11)

Demandé par le papa : un soir, c'est lui qui a parcouru le cours d'anglais de Salma ; il faut pouvoir le remettre « comme pas vu ».

- **Progression › 🧭 Suivre un cours et revenir en arrière** (en haut de la page) : on choisit un enfant puis un cours ; le tableau montre les instantanés (un par heure d'activité au plus, 120 jours) avec où il en était et ce qu'il a gagné. « ↩ Revenir à cet état » remet le cours comme à cette date (ce qui a été fait après est oublié) ; « 🗑 Remettre ce cours à zéro » efface tout (pour un jeu, une case permet d'effacer aussi ses records des classements).
- **Serveur** : `POST action=reset pass player course [history=<id>] [scores=1]` ; la table `resets (player, course, ts, data)` garde la date et l'état voulu (`data` vide = zéro). `GET ?action=resets&player=&course=` le relit.
- **Tablettes** : `Famille.track` demande d'abord `resets` ; si la date est plus récente que celle déjà appliquée (`famille-rst:<cours>:<Prénom>`), les clés du cours sont vidées (ou remises à l'état choisi) et la page se recharge. Un envoi de progrès qui ne connaît pas la dernière remise à zéro (champ `rst`) est **refusé** par le serveur, qui renvoie la remise à appliquer : une tablette restée ouverte ne peut donc pas réécrire l'ancien état.
- Les jours d'apprentissage (séries, cartes secrètes) viennent de l'historique : un retour en arrière les corrige aussi.
- Limite : les coloriages de l'Atelier restent sur la tablette ; une remise à zéro de l'Atelier les vide à la prochaine visite sur cette tablette.

### Cache et sécurité (`.htaccess`)

- Bloque en ligne tous les `.md`, `package.json`, `build.js`, `.gitignore`.
- `Cache-Control: no-cache, must-revalidate` pour html/css/js (les tablettes voient toujours la dernière version).
- Redirections 301 des anciens liens des jeux d'Amine vers `/amine/…`.

### Têtes des invités (05/11)
- `famille.js` : dans « Qui joue ? », un invité écrit son pseudo et choisit sa tête parmi les mascottes (`Famille.mascots` : nour, yasmine, fares). `Famille.head(nom)` renvoie la mascotte d'un invité (null pour la famille ; à défaut de choix, une mascotte tirée du pseudo). Gardé dans `localStorage['famille-tetes']` et envoyé au serveur comme progrès du « cours » `profil` (`{tete:id}`).
- API : `GET ?action=heads` → `{heads:{pseudo:id}}` (lu par `Famille.loadHeads()` au démarrage des jeux, pour les classements). `profil` est dans `COURSES` et `READABLE` ; la page Progression l'ignore.

### Discussion de Ludo en ligne (10/11)

- Table `chat (id, code, ts, seat, name, text)` dans `ludo.sqlite`, à part de l'état de la partie : un message ne peut pas faire échouer un coup.
- `POST action=chat code seat name text` → `{id}` (texte de 1 à 120 caractères, prénom de 24 au plus, caractères de contrôle retirés, même limite d'envois que les coups). On garde les 60 derniers messages par partie ; ils disparaissent avec la partie (12 h).
- Lecture sans requête en plus : la tablette ajoute `since=<dernier id>` à son `GET action=state` (une fois par seconde) et reçoit `chat: [...]`.
- Côté page (`jeux/ludo-legendes.html`) : `chatSend`, `chatReceive`, `chatAdd` ; tout est affiché avec `textContent` (aucun HTML venant d'un message). Un message fait seulement d'emojis s'envole à l'écran ; un texte s'affiche en bulle. L'historique reçu en rejoignant la partie est rangé dans la fenêtre sans animation.

### Progression : tableau de bord en rubriques (10/11)

`progression.html` affiche six onglets (`TABS`, fonction `draw()`), mémorisés dans `sessionStorage` (`prog-tab`, `prog-kid`, `prog-days`). Les données viennent des deux mêmes appels qu'avant : `summary` (progrès, historique de 120 jours, records) et `visits` (30 jours chargés une fois, 60 si on le demande ; le filtre de période se fait dans la page). Les « activités des enfants » sont les lignes du journal des visites qui portent le prénom d'un enfant, regroupées par page et par jour (`activiteHTML`) ; les « progrès » sont les écarts entre deux états successifs de l'historique (`gains()`). Limite : une page n'est notée qu'une fois toutes les 10 minutes, on compte donc des ouvertures, pas un temps passé.

### Salon de Ludo (10/11)

- Tables `presence (client, name, tete, status, code, ts)` et `invites (dest, name, tete, code, ts)` dans `ludo.sqlite`.
- `POST action=hello client name tete status code` toutes les 4 s (onglet visible seulement) → `{online, invites}` : les joueurs vus depuis moins de 15 s (40 au plus), et les invitations reçues (valables 40 s, effacées une fois lues). `status` : `menu`, `salon` (avec le code de sa partie en attente), `joue`, `machine`.
- `POST action=invite client name tete to code` (limite d'envois comme les coups ; la partie doit exister).
- `client` = identifiant aléatoire de la tablette (`ludo-client` dans le navigateur). Le salon est visible par toute personne qui ouvre la page du Ludo : il n'y a pas de mot de passe.

### Les coloriages de l'Atelier sur le serveur (11/11)

Cours **`atelier-art`** (dans `COURSES` et `READABLE`) : clé `atelier-traits:<Prénom>` = `{ rst, items:{ <dessin>:[date, [[x, y, couleur, motif], …]] } }`. Taille limite à part (`BIG` dans `api/famille.php` : 400 000 octets au lieu de `MAX_DATA` = 30 000), **pas d'historique** et absent du résumé de Progression (trop lourd). Au-delà de 64 Ko, l'envoi « en partant » (`sendBeacon`) est refusé par le navigateur : `famille.js` retombe sur l'envoi normal, et l'envoi toutes les 15 s fait le reste.


### La porte du site (accès réservé, 13/11/2026)

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


### Temps d'écran, défi du jour, joueurs (14/11)

- `api/famille.php` : tables `reglages` (k, v JSON ; `ecran` = {Essil:{on, semaine, weekend, nuit, matin, nuit_we, matin_we}, …} ; `nuit_we` = pause nuit du vendredi et du samedi soir, `matin_we` = reprise du samedi et du dimanche matin (ajoutés le 14/11 ; par défaut les heures de la semaine) : le serveur envoie à la tablette les heures du moment) et `ecran` (player, jour « AAAA-MM-JJ » heure de Paris, sec).
  - `GET ?action=ecran&player=P` → {libre, jour, limite (s, + 600 si le défi du jour est réussi), bonus, utilise, nuit, matin, weekend} ; `{libre:true}` pour un joueur qui n'est pas un enfant.
  - `POST action=ecran player sec` (60 s au plus par envoi, envoyé chaque minute de page visible par `famille.js`).
  - `POST action=reglages pass data={ecran:{…}, ecran_plus:{Amine:15}}` (Progression › Réglages) ; `POST action=ecran_plus pass player min` (« Un parent débloque 15 minutes » sur l'écran de pause).
  - `POST action=joueur_fusion pass player vers` (scores, historique, progrès et visites passent au bon prénom ; un cours déjà commencé par le bon prénom garde ses progrès) ; `POST action=joueur_supprime pass player`.
  - `summary` renvoie aussi `ecran` et `aujourdhui`.
- Cours ajoutés : `defi` (défi du jour) et `amine-lecture` (Je lis !), dans `COURSES`, `READABLE` et `LEARNING`.
- `api/mur.php` : le mur de la famille (voir `docs/contenus.md`), gardé par la porte comme les autres API.

### `api/houma.php` (Ma Houma en ligne, 14/11)
- `salut` (toutes les 3 s : client, nom, lieu, chez, depuis) → qui est là (15 s), nouveaux messages, échanges qui me concernent. `dit` (texte), `voix` (fichier audio vérifié : webm, mp4, ogg, wav ; 1,5 Mo, 60 s), `montre` (lieu), `?son=ID`.
- Troc : `propose` → `repond` (contre ou non) → `conclut` (oui/non, par celui qui a proposé) ; `annule` ; `applique` (le receveur, une seule fois). États : offre, contre, fait, non, annule, perime (2 jours).
- Parents (mot de passe parent) : `historique` (600 messages, 200 échanges), `efface`. Onglet « 💬 Houma en ligne » de Progression.
- Limite : 120 envois par adresse et par 10 minutes. Seuls les appareils de confiance passent (`ga_garde_api()`).

### Tableau du temps de jeu et « 🙋 Demander plus de temps » (14/11)
- **Accueil** (`index.html`, section `#tdj`) : pour Essil, Salma et Amine, ce qu'il reste à jouer aujourd'hui, la jauge, la pause de nuit, le temps en plus accordé et les demandes en attente. `GET api/famille.php?action=ecran_tous` (toutes les minutes). Caché si l'API ne répond pas.
- **Écran de pause** (`famille.js`) : bouton « 🙋 Demander plus de temps » → `POST action=demande player` → table `demandes` (id, player, jour, ts, jeton, statut attente/oui/non/oubliee, min, maj) et notification **ntfy** (publiée en JSON sur `https://ntfy.sh/`, même canal secret que les alertes de la porte, `ga_canal_ntfy()`, réglé dans l'administration) avec 3 boutons : +15 min, +30 min, Non. Toucher la notification ouvre `api/reponse.php` (+15, +30, +1 h, non).
- `api/reponse.php` : **hors de la porte** (le téléphone n'est pas forcément un appareil de confiance), n'accepte que `d=ID&t=JETON` (32 caractères, usage unique, 12 h ; essais ratés comptés par `ga_note_echec`).
- Une réponse « oui » retire les minutes du temps joué et la tablette de l'enfant (qui relit l'état toutes les 5 s pendant l'attente) lève la pause pendant ces minutes, même la nuit (`famille-ecran-deblocage`). « Non » : l'enfant peut redemander après 30 min ; 6 demandes par jour au plus.
- On peut aussi répondre dans Progression › Réglages (carte de l'enfant : `action=demande_reponse`, mot de passe parent). `ecran_etat()` renvoie `demande` (la dernière du jour) et `now`.

### « Qui es-tu ? » et le mode explorateur (14/11)
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



---

# `docs/videos.md`

## Vidéos éducatives « étape par étape »

Analyse de la vidéo modèle (`OneDrive\Amine\grande section\videos temple\électricité.mp4`, envoyée par le papa le 09/11) et idées de vidéos de géométrie pour Essil. **Épisodes 1 (le périmètre) et 2 (l'aire) produits le 09/11** (formule A, voix de Céline) et en ligne ; les épisodes 3 à 5 attendent le feu vert du papa.

### La vidéo modèle : « Étape par étape — L'élec »

- **Format** : vertical 9:16 (1440 × 2560), 1 min 51, voix off en français, aucune musique envahissante.
- **Le moteur du récit** : une chaîne de 12 maillons, toujours la même forme :
  1. un **problème** concret (« au bout de quelques heures, la pile est vide ») ;
  2. **« Alors tu… »** : la solution, que le spectateur invente lui-même (« tu fais tourner un aimant dans une bobine ») ;
  3. **« Ça s'appelle… »** : le mot savant arrive seulement maintenant, comme une récompense (« un alternateur ») ;
  4. **« Mais… »** : la solution crée un nouveau problème, un cran plus grand, et la chaîne repart.

  Les maillons : pile → alternateur → manivelle → roue à aubes / turbine → barrage → 50 km de fil qui chauffe → transformateur (400 000 volts) → ligne à haute tension (30 m de haut) → poste de transformation (230 volts) → réseau → prise de terre → disjoncteur. Fin : « Félicitations, tu as construit le réseau électrique. »
- **Pourquoi ça marche** :
  - Le spectateur est l'inventeur, il dit « tu ».
  - Chaque « Mais… » ouvre une question, et on veut entendre la réponse.
  - Le vocabulaire vient après le besoin.
  - Les nombres sont concrets et frappants (50 km, 400 000 V, 230 V).
  - L'échelle grandit : la table d'atelier, la rivière, la vallée, la ville, puis la maison.
- **L'image** :
  - Un diorama 3D « low-poly » aux couleurs douces.
  - Une seule caméra qui voyage sans coupure et recule quand l'échelle grandit.
  - Un petit personnage sans visage (pull rouge) qui fait les gestes.
  - Le jour et la nuit montrent un problème : le soir, toute la ville allume en même temps.
- **Le texte à l'écran** :
  - Les sous-titres apparaissent **mot à mot**, au centre, en blanc cerné de noir.
  - À chaque notion clé, un grand **titre jaune** en capitales, avec le nombre : BARRAGE · 50 KILOMÈTRES · 400 000 VOLTS · LIGNE À HAUTE TENSION.
- **Le rythme** : une phrase toutes les 2 à 4 s, un nouveau plan environ toutes les 4 s.

### Cinq vidéos de géométrie pour Essil (même recette)

Chaque vidéo dure environ 1 min 30 et compte 10 à 12 maillons « problème → Alors tu… → Ça s'appelle… → Mais… ». Le décor est un village tunisien en low-poly : oliviers, maisons blanches, portes bleues. Les nombres et les formules sont écrits **par nous au montage**, jamais par l'IA (qui se trompe sur les chiffres).

1. **« Le périmètre : la clôture des chèvres »**
   - Les chèvres s'échappent du champ carré. Alors tu poses une clôture et tu mesures chaque côté. Ça s'appelle le **périmètre** : 4 × 25 m = **100 MÈTRES**.
   - Mais le champ du voisin est rectangulaire : **P = 2 × (L + l)**.
   - Mais le jardin a une forme en L : on additionne tous les côtés.
   - Mais l'enclos du chameau est rond. Alors tu fais le tour avec une corde, puis tu la poses le long du diamètre : elle fait toujours un peu plus de 3 fois le diamètre. Ça s'appelle **π ≈ 3,14** et **P = π × d**.
   - Félicitations, tu as inventé le périmètre.
2. **« L'aire : carreler la cuisine de mamie »**
   - Combien de carreaux ? Tu poses des carrés de 1 m de côté, 6 par rangée sur 4 rangées. Ça s'appelle l'**aire** : 6 × 4 = **24 m²**.
   - Mais la pièce est en L : tu la coupes en deux rectangles.
   - Mais un mur est en biais : un triangle, c'est la moitié d'un rectangle, donc **b × h ÷ 2**.
   - Mais le tapis est rond : tu le coupes en parts de pizza et tu les ranges tête-bêche, ce qui fait presque un rectangle. **A = π × r²**.
3. **« Périmètre ou aire ? Le piège du fermier »**
   - Le fermier a **16 m** de clôture : quel champ est le plus grand ? Un 7 × 1 donne 7 m², un 4 × 4 donne **16 m²**.
   - Même périmètre, mais pas la même aire. Et le cercle fait encore mieux, environ 20 m².
   - Ça s'appelle optimiser. C'est pour ça que les bulles, les gouttes et les igloos sont ronds.
4. **« Le volume : remplir le bassin de Kairouan »**
   - Combien d'eau pour le bassin ? Tu le remplis de cubes de 1 m. Ça s'appelle le **volume** : L × l × h, en **m³**.
   - Mais on achète l'eau en litres : **1 m³ = 1 000 LITRES**.
   - Mais le bassin des Aghlabides est presque rond : c'est presque un cylindre, donc aire du disque × hauteur. On fait le lien avec le monde 14 du Jasmin.
5. **« Les angles : le minaret qui ne tombe pas »**
   - Le maçon veut un mur bien droit. Alors il utilise un fil à plomb et une équerre. Ça s'appelle l'**ANGLE DROIT, 90°**.
   - Mais le toit penche : un angle aigu, puis un angle obtus.
   - Mais pour la coupole, la somme des angles d'un triangle fait toujours **180°**.

### Comment les produire, et combien ça coûte

Chaque vidéo compte environ 11 plans. Les prix ont été vérifiés le 09/11 :

| Formule | Ce qu'on obtient | Crédits par vidéo |
|---|---|---|
| A. Images animées | 11 illustrations Higgsfield (même style) + voix off française + montage chez nous (lents mouvements de caméra, sous-titres mot à mot, titres jaunes, nombres et formules exacts) | ≈ 25 |
| B. Animation légère | 11 illustrations, puis chacune animée en clip de 10 s (Grok Imagine 1.5 Lite, 10 crédits) + voix + montage | ≈ 135 |
| C. Animation soignée | idem avec Kling 3.0 sans son (15 crédits le clip) | ≈ 190 |

À essayer d'abord : la voix off française de `seed_audio` (0,1 crédit la phrase). Voici le pilote proposé au papa :
- la vidéo 1 (le périmètre) en formule A ;
- puis, si le style plaît, la même vidéo en formule B pour comparer.

### Vidéo 1 : « La clôture des chèvres » (09/11)

- **Version en ligne** (voix de Céline, 1 min 50) : page `essil/videos-geometrie.html` avec la vidéo (`essil/videos/perimetre.mp4`, 720 × 1280, 9 Mo), « Ce qu'il faut retenir » (les 4 formules) et un petit défi de 5 questions corrigées ; carte dans l'espace d'Essil et lien sur l'accueil.
- Sur le PC dans `OneDrive\Amine\grande section\videos temple\` : `perimetre-cloture-des-chevres-celine.mp4` (1080 × 1920, la bonne) et `perimetre-cloture-des-chevres.mp4` (première version, voix Elodie).
- Les 12 images viennent de `flux_3_image` (9:16) : un diorama low-poly tunisien, avec un petit personnage en tunique bleue et chéchia rouge. Ce sont les jobs 7bcafcbf, 28fdb601, 6d027ffd, a2f08948, 831d3bfe, 14167a56, e6658994, 931e243e, 6c4a22e3, 14938218, bec676ae, 90eeba96.
- **Voix off retenue par le papa : Céline** (`text2speech_v2`, `variant: elevenlabs`, voix `57ccb351-84d7-54ba-afd4-26b566ca6023`, 0,3 crédit la phrase), et **Julian** (`95429266-c0ac-4137-a209-63b8812b0f23`) pour les autres projets. Les essais des 7 voix sont sur le PC (`voix-essai`). La première version utilisait `seed_audio` Elodie, sans choix du papa : erreur à ne pas refaire.
- Avec ElevenLabs, chaque phrase finit parfois par un petit bruit après un blanc : `build.py` l'enlève (dernier morceau de moins de 0,45 s après un silence).
  - **Piège** : en `mp3`, les phrases longues sont coupées à la fin. Il faut demander du **`wav`**.
  - Pour être sûr que la fin n'est pas coupée, on ajoute « ... Voilà. » à la fin du texte, puis on coupe juste avant ce mot.
- Le montage se fait avec `docs/video-perimetre/build.py` et `diagrams.py` (ffmpeg + libass, police Poppins). Il comprend :
  - un zoom lent sur chaque image ;
  - des sous-titres mot à mot, au centre ;
  - des titres jaunes qui apparaissent sur le mot clé ;
  - des schémas exacts, dessinés par nous, en bas de l'écran ;
  - l'étiquette « PAS À PAS · le périmètre ».
- Coût : ≈ 44 crédits pour la première version (images 24, voix Elodie refaites en wav) + ≈ 8 pour les essais de voix et la voix de Céline.

### Épisode 2 : « Carreler la cuisine de mamie » (09/11)

- Le fil : les carreaux de 1 m² (6 × 4 = 24 m², A = L × l) → le salon en L coupé en deux rectangles (8 × 3 + 3 × 4 = 36 m²) → le coin en biais : un triangle, la moitié d'un rectangle (4 × 3 ÷ 2 = 6 m²) → le tapis rond découpé en parts de pizza rangées tête-bêche, presque un rectangle π × r de long et r de large (A = π × r², r = 1 m → ≈ 3,14 m²).
- 11 images `flux_3_image` (jobs 721790d5, a93ada3d, 9882c265, a691d392, c06f62a8, 8c7d0157, 93dff616, 1e95436e, 28ca8032, 16eb8d11, c3def506), 14 phrases de Céline, montage `docs/video-aire/`. 1 min 58. ≈ 27 crédits.
- En ligne : `essil/videos/aire.mp4` ; la page `essil/videos-geometrie.html` a maintenant des **onglets d'épisodes** (le dernier épisode s'ouvre par défaut, puis celui regardé la dernière fois ; `?ep=perimetre` ou `?ep=aire`), chacun avec ses formules à retenir et son défi de 5 questions.
- Sur le PC : `videos temple\aire-cuisine-de-mamie.mp4`.
- Correction faite aux deux épisodes : les « : », « ! », « ? » isolés (espace français) restent collés au mot d'avant dans les sous-titres.
- **Genjutsu** (crédits gratuits proposés par Higgsfield) : il redessine une vidéo existante dans un autre style en gardant ses mouvements, ou fait bouger un personnage d'après une vidéo modèle ; il n'anime pas des images fixes, donc pas utile pour ces épisodes.

### Épisodes 3, 4 et 5 (10/11)

Même recette (9 images 9:16 `flux_3_image` par épisode, 11 phrases de Céline, schémas exacts dessinés en Python, sous-titres mot à mot). Sources du montage : `docs/video-episodes-3-5/`.

- **3. Le piège du fermier** (`essil/videos/piege.mp4`) : 16 m de clôture → 7 × 1 = 7 m², 6 × 2 = 12 m², 5 × 3 = 15 m², 4 × 4 = 16 m² ; même périmètre, pas la même aire ; en cercle, r ≈ 2,5 m et A ≈ 20 m² : c'est le cercle qui enferme le plus de place (bulles, gouttes, nids).
- **4. Le bassin de Kairouan** (`essil/videos/volume.mp4`) : cubes de 1 cm³ (5 × 3 = 15 par couche, 4 couches = 60 cm³), V = L × l × h, 1 L = 1 000 cm³, 1 m³ = 1 000 L ; bassin rond : aire du fond × hauteur (r = 2 m, h = 1 m → ≈ 12,5 m³ ≈ 12 500 L).
- **5. Le minaret qui ne tombe pas** (`essil/videos/angles.mp4`) : fil à plomb, angle droit 90°, équerre, aigu / obtus / plat 180°, les trois coins d'un triangle forment un angle plat → somme = 180° (60° + 70° → 50°).
- Découpage des prises de Céline : alignement par programmation dynamique sur la durée attendue de chaque phrase (`align.py`), plus fiable que « couper aux plus grands silences » car Céline fait parfois de longues pauses au milieu d'une phrase.
- Sur la page : chaque épisode a ses formules à retenir et son défi de 5 questions (`?ep=piege`, `?ep=volume`, `?ep=angles`).
- Sur le PC : `videos temple\piege-du-fermier.mp4`, `volume-bassin-de-kairouan.mp4`, `angles-minaret.mp4`.

### Les fractions pour Essil : 3 épisodes (11/11)

Demandé par le papa : « un cours de mathématique expliquant les opérations sur les fractions, où il faut unifier le dénominateur ». Même recette que la géométrie (problème → « Alors tu… » → « Ça s'appelle… » → « Mais… »), 9 images `flux_3_image` 9:16 par épisode (village tunisien low-poly, petit garçon en tunique bleue et chéchia rouge), 11 phrases de Céline, schémas exacts dessinés en Python (gâteaux coupés, bandes de jardin, bouteilles, fractions écrites empilées). Page : `essil/videos-fractions.html` (onglets `?ep=gateau`, `?ep=potager`, `?ep=citronnade`). Sources du montage : `docs/video-fractions/`.

- **1. Le gâteau de l'Aïd** (`essil/videos/fractions-gateau.mp4`) : 4 enfants → 1/4 ; numérateur / dénominateur ; 4 cousins arrivent → chaque part recoupée en deux : 1/4 = 2/8 (fractions égales) ; × 2 en haut et en bas = **amplifier** (3/4 = 6/8 = 9/12) ; il reste 6/8 → ÷ 2 = 3/4 = **simplifier**. « L'outil secret pour additionner. »
- **2. Le potager de Jeddi** (`essil/videos/fractions-potager.mp4`) : tomates 1/5 + piments 2/5 = 3/5 (on additionne les hauts) ; oignons 1/2 + fèves 1/3 : pas la même taille, et surtout pas 2/5 ; on redécoupe en sixièmes (6 = 2 × 3) : 3/6 + 2/6 = 5/6 = **mettre au même dénominateur** ; 1/4 + 3/8 = 2/8 + 3/8 = 5/8 ; soustraction 5/6 − 1/3 = 5/6 − 2/6 = 3/6 = 1/2.
- **3. La citronnade de Tata** (`essil/videos/fractions-citronnade.mp4`) : la moitié des 3/4 de la bouteille = 1/2 × 3/4 = 3/8 (haut × haut, bas × bas, pas besoin du même dénominateur) ; 3/2 L en verres de 1/4 L : 6 verres ; diviser = multiplier par **l'inverse** (on retourne la fraction) : 3/2 × 4 = 12/2 = 6.
- Voix : une prise par phrase cette fois (texte + « … Voilà. »), puis `cutsingle.py` enlève « Voilà » (parfois coupé en deux morceaux) et les petits souffles. Plus sûr que les prises de 4 phrases : dans une de ces prises, le découpage automatique se trompait de frontière. Les prises groupées faites d'abord (9) n'ont pas servi.
- Titres jaunes : taille réduite automatiquement quand le texte est long (`\fs`), pour ne pas déborder de l'écran.
- Coût : 27 images × 2 = 54 crédits, voix ≈ 13 crédits (33 phrases + les 9 prises groupées inutilisées) → ≈ 67 crédits.
- Sur le PC : `videos temple\fractions-1-gateau-de-l-aid.mp4`, `fractions-2-potager-de-jeddi.mp4`, `fractions-3-citronnade.mp4`.
