# Famille Missaoui — mémoire du projet

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

## Le projet en une phrase

**https://www.missaoui-family.com** regroupe les cours et les jeux faits sur mesure pour les enfants de la famille Missaoui, pour **apprendre en s'amusant**. Pages HTML autonomes (sans framework), créées avec Claude, publiées par GitHub → Hostinger.

## La famille

| Personne | Rôle | Couleur / avatar |
|---|---|---|
| **Anis** | le papa, propriétaire du site (c'est lui qui parle à Claude) | vert sarcelle `#0f766e`, `jeux/avatars/anis.webp` |
| **Imen** | la maman | framboise `#b4235a`, `jeux/avatars/imen.webp` |
| **Essil** | 12 ans, collège : allemand, latin, maths (vidéos géométrie et fractions), équitation (Les Écuries d'Essil) | bleu `#1f3c88` + rail rouge `#d7263d` |
| **Salma** | 8 ans, CE2 : anglais, français (conjugaison), maths (soustraction, géométrie, symétrie, monnaie), exposé cheval | vert `#1f6b44` + ciel `#5aaedc` |
| **Amine** | 5 ans, grande section : jeux, écriture (Ardoise magique), nombres (Planète des Nombres), derja tunisienne | nuit `#2a1f4f` + lune `#fff1bf` / citrouille `#ff8c1a` |

Ordre d'affichage voulu : **Essil, Salma, Amine**. Les prénoms et les avatars peuvent apparaître sur le site (accord du papa).

## Arborescence

```
index.html             accueil : titre « Famille Missaoui. » (point rouge), portrait de famille en avatars, 3 cartes enfants, bandeau jeux de famille
indexancien.html       ancienne page d'accueil (photos aimantées sur le frigo), gardée en ligne, noindex
famille.css            style commun accueil + espaces (version de cache : ?v=6)
famille.js             module commun : « Qui joue ? », scores, classements, suivi et relecture des progrès
site.js                chargé par toutes les pages : appli installable (service worker) + journal des visites
manifest.webmanifest, sw.js, icons/   l'application à installer sur l'écran d'accueil (voir docs/serveur.md)
progression.html       tableau de bord des parents (mot de passe parent), avec le journal des visites
essil/  index.html, deutsch-express.html, via-romana.html, videos-geometrie.html et videos-fractions.html (+ videos/ : épisodes « Pas à pas »), les-ecuries.html (club hippique 3D, + ecuries/ : code et images)
salma/  index.html, english-garden.html, weather-station.html (+ meteo/ : images et voix), atelier-des-verbes.html, atelier-des-formes.html, miroir-magique.html (symétrie), marche-d-ollie.html (monnaie, 3D), jardin-des-nombres.html, le-grand-galop.html, cheval/ (images et vidéos)
amine/  index.html, ardoise-magique.html (+ lettres.js : modèles des 78 lettres), planete-des-nombres.html (+ nombres/ : aliens, décor, voix des nombres), la-nuit-d-amine.html, la-nuit-d-amine-2.html, nahki-tounsi.html, serpentin.html, voix/api.php
jeux/   ma-houma.html (**Ma Houma** : quartier tunisien miniature, monde libre façon maison de poupées, voir docs/jeux-3d.md), les-ecuries.html (les Écuries pour toute la famille : même code que essil/ecuries/), serpent-legendes.html, ludo-legendes.html, grimpe-glace.html, medina-express.html (course infinie 3D, + medina/ : planches des corps animés), legende-du-jasmin-3.html (**« le Jasmin » = cette version** depuis le 13/11 : les 24 mondes « en vrai », + jasmin3/ : `reel.js` et images par monde), legende-du-jasmin-2.html (le Jasmin 2 : **sauvegarde, on n'y touche plus** ; héros et créatures « en vrai », + jasmin2/ : planches ; images de décor dans jasmin/), legende-du-jasmin.html (l'ancienne version aux héros dessinés, gardée en ligne, liée seulement depuis Progression), atelier-du-jasmin.html (coloriage 2D / 3D, + atelier/ : dessins au trait et voix), sons/ (bruitages ElevenLabs du Jasmin et de Ma Houma, `sons.js`, page d'écoute `ecoute.html`), maison/ (Ma maison de Ma Houma : 143 meubles, objets, arabesques et graffitis réalistes, `tex/` murs et sols, `catalogue.js`), houma/ (personnages de Ma Houma : debout, assis, gestes), avatars/ (5 avatars + têtes de profil `-profil` et « soupir » `-soupir` pour le héros du Jasmin, têtes vues de dos `-dos` pour Médina Express, 3 mascottes d'invités, 15 cartes légendes, illustrations Ludo et Grimpe-Glace), cartes/ (illustrations des skins)
lib/    three-0.170.0.module.min.js (Three.js, copié ici : aucune dépendance en ligne)
api/    famille.php (joueurs, records, progrès), ludo.php (parties de Ludo en ligne)
photos/ photos de famille de l'ancienne accueil (maison, salon, canapé)
docs/   la documentation (voir le tableau ci-dessus)
.htaccess  cache les .md et fichiers techniques, redirige les anciens liens, en-têtes anti-cache
package.json, build.js  copie le site dans dist/ si Hostinger lance un « build »
```

## Publication

- Dépôt GitHub **`azilix-ui/jeu-amine`** (public), branche **`main`**. Claude a les droits d'écriture.
- Hostinger est relié au dépôt : **chaque `git push` sur `main` met le site à jour** en 30 s à 1 min. La racine du dépôt = `public_html`.
- Données hors du site public (un redéploiement n'y touche pas) : `famille-data/` (bases SQLite) et `nahki-voix/` (voix et mot de passe parent), à côté de `public_html`.
- Vérifier en ligne avec le navigateur intégré du Claude desktop : le shell du conteneur et celui de l'ordinateur ne joignent pas le domaine (proxy). En local : `php -S` sur une copie du dépôt (les API marchent, les bases se créent à côté).
- Après une modification de `famille.css`, augmenter `?v=` dans les pages qui l'appellent (cache des tablettes). Les `.html/.css/.js` sont servis en `no-cache`.

### Ajouter un cours ou un jeu
1. Fichier dans le dossier de l'enfant (`salma/…`) ou dans `jeux/` s'il est pour toute la famille ; nom simple, sans accents.
2. En tête de page, le bloc commun (manifeste, icône Apple, `<script src="/site.js" defer>`) copié d'une autre page ; pastille de retour en haut, `<script src="../famille.js">` et `Famille.track('<cours>', '<Prénom>', ['<clé localStorage>'])`.
3. Déclarer le cours dans `COURSES` de `api/famille.php` (et dans `READABLE` s'il doit se relire sur une autre tablette), puis une carte dans `progression.html`.
4. Une carte dans `<enfant>/index.html` et un lien dans la carte de l'enfant sur `index.html`.
5. Tester (Playwright, portrait et paysage tablette), commit + push, vérifier en ligne, ajouter une ligne dans `docs/journal.md`.

## Règles à respecter

- **Voix off des vidéos** : **Céline** (ElevenLabs, `text2speech_v2`, voix `57ccb351-84d7-54ba-afd4-26b566ca6023`), et **Julian** (`95429266-c0ac-4137-a209-63b8812b0f23`) pour les autres projets ; choisies par le papa le 09/11. Ollie, la prof de Salma, parle français avec la voix de **Céline** (voix de femme, demandé le 10/11) ; en anglais c'est **Raina**. Toujours faire écouter des essais avant de choisir une nouvelle voix.
- **Bruitages** : ElevenLabs Sound Effects, compte Starter du papa (il se connecte lui-même). Voir `docs/higgsfield.md` › ElevenLabs.
- **Higgsfield** : toujours annoncer le prix exact en crédits (outil `get_cost`) et attendre l'accord du papa avant de générer. Montrer le résultat avant de publier.
- **Photos** : ne jamais publier de documents scolaires bruts ni de photos d'identité (planches avec numéros). Seuls des visages recadrés servent de référence à Higgsfield ; ce sont les avatars dessinés qui vont en ligne.
- **Pas de personnages protégés** (jeux vidéo, dessins animés, marques) : on invente des personnages originaux (ex. Poppy Playtime → monde « Usine à jouets » inventé).
- Ton chaleureux, jamais moqueur ; consignes lues à voix haute pour Amine qui ne lit pas encore.
- Tout en français ; tester sur tablette (tactile, cibles ≥ 48 px).
- **Réglage des têtes** du héros (Jasmin, Grimpe-Glace) : page claude.ai « Les têtes du Jasmin » (artifact `GmHsWJsfQKKV32z6t81upp`) ; le papa ajuste et enregistre, Claude relit le document `reglages/tetes` et recopie les valeurs dans `HEADCROP` / `HEADCROP_P` (voir `docs/jeux-3d.md`).

## Points ouverts

- [ ] **https://missaoui-family.com (sans www)** : la page répond (vu le 02/11 dans le navigateur), mais le DNS `A` de `@` et le certificat SSL sans www restent à vérifier dans hPanel.
- [ ] Redirection `http://` → `https://` non vérifiée (« Forcer HTTPS » dans hPanel › Sécurité › SSL).
- [ ] Deutsch Express affiche « Dijon-Ville » : à retirer si le papa le souhaite (pas encore décidé).
- [ ] Le mot de passe parent (voix + Progression) doit avoir été créé par le papa.
- [ ] Sauvegardes des bases (`famille-data/`) et des voix (`nahki-voix/`) : proposées, pas encore faites.
- [ ] Ludo en ligne : si la tablette hôte se ferme, les machines s'arrêtent (les vrais joueurs continuent).
- [ ] Mots de derja à faire confirmer par la famille : mémti, mankhar, wdhen, séq, bordgéni, njma, 7low.
