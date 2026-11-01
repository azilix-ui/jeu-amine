# Famille Missaoui — site d'apprentissage des enfants

Fiche de mémoire du projet : à lire avant toute modification du site.

## Le projet en une phrase

**https://www.missaoui-family.com** regroupe les cours et les jeux faits sur mesure pour les trois enfants de la famille Missaoui, pour **apprendre en s'amusant**. Chaque enfant a son espace. Les contenus sont des pages HTML autonomes (sans serveur, sans framework), créées avec Claude.

## Les enfants et leurs contenus

| Enfant | Niveau / matières | Contenus en ligne | Couleur du site |
|---|---|---|---|
| **Essil** | collège : allemand, latin | `essil/deutsch-express.html` (Deutsch Express, allemand, 14 étapes), `essil/via-romana.html` (Via Romana, latin, 10 étapes) | bleu `#1f3c88` + rail rouge `#d7263d` |
| **Salma** | primaire (CE2) : anglais, maths | `salma/english-garden.html` (Salma's English Garden, 8 thèmes : Hello, Animals, Colours, Numbers, Fruits, Family, Days, Months), `salma/jardin-des-nombres.html` (Le Jardin des Nombres : soustraction avec retenue, 8 étapes, méthode « retenue en bas » de sa maîtresse), `salma/le-grand-galop.html` (Le Grand Galop : quiz de son exposé sur le cheval, 6 obstacles = 6 Galops + Grand Prix, fiche de révision ; images dans `salma/cheval/`) | vert `#2e8b57` + ciel `#5aaedc` |
| **Amine** | 5 ans, grande section | `amine/la-nuit-d-amine.html` (Halloween 1 : mémoire, compter jusqu'à 10, couleurs, suites), `amine/la-nuit-d-amine-2.html` (Halloween 2 : mémoire 18 personnages, compter jusqu'à 20, additions, comparer, histoire « Où est passé Minuit ? »), `amine/nahki-tounsi.html` (Nahki Tounsi : derja tunisienne, 56 mots en 7 thèmes + nombres), `amine/serpentin.html` (Serpentin : snake pour tablette, 4 mondes Dragon / Usine à jouets / Halloween / Espace, 3 vitesses Tortue / Lapin / Guépard, mode « Les chiffres » 1 à 10) | nuit `#2a1f4f` + citrouille `#ff8c1a` |

Ordre d'affichage voulu par le papa : **Essil, Salma, Amine** (de l'aîné au plus jeune). Le prénom des enfants peut apparaître sur le site (accord donné).

## Arborescence du site (dépôt GitHub)

```
index.html            accueil « Famille Missaoui » (3 cartes ; chaque cours/jeu y est un lien direct)
famille.css           style commun de l'accueil et des pages d'espace
essil/index.html      espace Essil  → deutsch-express.html, via-romana.html
salma/index.html      espace Salma  → english-garden.html
amine/index.html      espace Amine (« Les jeux d'Amine ») → 4 jeux
amine/voix/api.php    stockage en ligne des voix de Nahki Tounsi (PHP)
api/famille.php       base de données famille (PHP + SQLite) : joueurs, records, progrès
famille.js            module commun : « Qui joue ? », scores, classements, suivi des progrès
progression.html      tableau de bord des parents (mot de passe parent)
.htaccess             cache README/package.json/build.js ; redirige les anciens liens des jeux d'Amine
package.json, build.js  copie le site dans dist/ (filet de sécurité si Hostinger lance un « build »)
CLAUDE.md             cette fiche (bloquée en ligne par .htaccess)
```

Conventions :
- Chaque cours a une **pastille de retour** fixe en haut à gauche (« ← Essil », « ← Salma ») ; les jeux d'Amine ont un lien « ← Tous les jeux » ; les pages d'espace ont « ← Famille Missaoui ».
- Polices : accueil et espaces en **Bricolage Grotesque** (titres) + **Nunito** (texte). Chaque cours garde sa propre identité visuelle.
- Couleurs d'identité dans `famille.css` (variables) : `--essil-card` #1f3c88 + `--essil-rail` #d7263d, `--salma-card` #1f6b44 + `--salma-sky` #5aaedc, `--amine-card` #2a1f4f + `--amine-moon` #fff1bf. Texte blanc dessus : contraste ≥ 4,5:1 vérifié (audit Impeccable du 30/10/2026). Contour de sélection jaune `--ring-on-card` sur les cartes de couleur.
- Les progrès (étoiles, XP, bonbons) sont gardés dans le `localStorage` du navigateur : clés `salma-stars`, `essil-deutsch`, `essil-latin`, `amine-bonbons` (cagnotte commune des jeux d'Amine), `amine-tounsi-etoiles`, `serpentin-best`, `serpentin-pref`.

## Publication (workflow)

- Dépôt GitHub : **`azilix-ui/jeu-amine`** (public), branche **`main`**. Claude a les droits d'écriture (application GitHub Claude installée).
- Hostinger (hPanel › Sites web › missaoui-family.com › Avancé › Git) est relié au dépôt par l'application GitHub de Hostinger : **chaque `git push` sur `main` met le site à jour automatiquement** (environ 30 s à 1 min).
- La racine du dépôt est servie telle quelle dans `public_html`.
- Pour vérifier en ligne : le navigateur intégré du Claude desktop (site autorisé) ; le shell du conteneur et celui de l'ordinateur ne peuvent pas joindre le domaine (proxy).

### Ajouter un nouveau cours
1. Récupérer le fichier HTML (dossiers sources ci-dessous). Publier la **dernière version** seulement.
2. Le copier dans le dossier de l'enfant avec un nom simple, sans espaces ni accents (`salma/maths-garden.html`).
3. Ajouter la pastille de retour juste après `<body>` (copier celle d'un cours existant).
4. Ajouter une carte dans `<enfant>/index.html` ET un lien direct dans la carte de l'enfant sur `index.html` (accueil famille). Après une modif de `famille.css`, augmenter `?v=` dans les 3 pages qui l'appellent (cache des tablettes).
5. Ne jamais publier de photos personnelles ni de documents scolaires bruts.
6. Commit + push sur `main`, puis vérifier la page en ligne.

## Dossiers sources sur l'ordinateur du papa (OneDrive)

- `C:\Users\azili\OneDrive\Amine\grande section\` : jeux d'Amine (versions hors-ligne) + copie du site dans `site-jeux-amine\` (ancienne version, avant la page famille).
- `C:\Users\azili\OneDrive\Salma etude\` : `Salma English Garden.html` (v1) et `… v2 - jours et mois.html` (publiée) ; `Essil\` : `Essil Deutsch Express.html` (v1), `… v2 - cours.html` (publiée), `Essil Via Romana Latin.html` (publiée), et 2 photos WhatsApp (sources, **non publiées**).

## Base de données famille (records et progression)

- `api/famille.php` + SQLite. Fichier de base : `famille-data/famille.sqlite`, **hors du site public** (à côté de `public_html`, comme `nahki-voix/`). Un redéploiement GitHub n'y touche pas.
- Tables : `players` (prénom, première et dernière visite), `scores` (joueur, jeu, variante, score, date), `progress` (dernier état des progrès par joueur et par cours), `history` (un instantané par heure au plus, pour voir l'évolution), `writes` (anti-abus : 240 écritures max par 10 min et par adresse).
- `famille.js` est chargé par tous les cours et jeux. Il envoie toutes les 15 s, et à la fermeture de la page, le contenu des clés `localStorage` du cours (`Famille.track(cours, joueur, clés)`). Les envois ratés attendent le retour du réseau.
- Correspondance cours → joueur → clés : `essil-deutsch`/Essil/`essil-deutsch`, `essil-latin`/Essil/`essil-latin`, `salma-english`/Salma/`salma-stars`, `salma-maths`/Salma/`salma-maths`, `salma-cheval`/Salma/`salma-cheval`, `amine-halloween`/Amine/`amine-bonbons` (cagnotte), `amine-tounsi`/Amine/`amine-tounsi-etoiles`. Pour un nouveau cours : l'ajouter à `COURSES` dans `api/famille.php`, à `metric` dans `progression.html`, et appeler `Famille.track` en bas de la page.
- Serpentin : écran « Qui joue ? » (Essil, Salma, Amine ou un autre prénom, gardé sur l'appareil). Classement en ligne par variante `vitesse-mode` (ex. `lapin-eat`). La cagnotte de bonbons ne se remplit que quand le joueur est Amine.
- `progression.html` (lien en bas de l'accueil) : protégée par le **même mot de passe parent** que les voix de Nahki Tounsi (`nahki-voix/auth.json`). Affiche XP, grade, épreuves et étoiles par unité (Essil), étoiles par thème (Salma), cagnotte, Nahki et records Serpentin (Amine), gains de la semaine, dernières parties.
- Limite connue : les progrès des cours restent d'abord dans le navigateur ; le serveur garde une copie pour le suivi, mais elle ne revient pas sur un autre appareil.

## Nahki Tounsi : la voix du papa en ligne

- Aucune voix de synthèse ne parle vraiment la derja : le papa enregistre les mots elle-même (bouton **🎙️ Ma voix** dans le jeu).
- Ordre de lecture d'un mot : enregistrement de l'appareil → enregistrement en ligne → voix de synthèse (Edge a une voix « Arabe (Tunisie) »).
- `amine/voix/api.php` : `GET ?action=list`, `GET ?action=play&k=MOT&v=N` (publics) ; `POST action=setup|login|save|delete` (mot de passe parent). 3 Mo max par son, 400 sons max, blocage 15 min après 8 mauvais mots de passe.
- Les données sont **hors du site public**, dans le dossier `nahki-voix/` à côté de `public_html` (sur Hostinger : `domains/missaoui-family.com/nahki-voix/`) : `auth.json` (hash du mot de passe), `index.json` (mot → fichier), `sons/`. Un redéploiement GitHub ne les touche pas.
- **Mot de passe oublié** : dans hPanel › Gestionnaire de fichiers, supprimer `nahki-voix/auth.json`, puis rouvrir 🎙️ Ma voix pour en créer un nouveau (les sons sont conservés).
- Écriture des mots : `3` = ع, `7` = ح, `kh` = خ, `q` = ق, `dh` = ض/ظ. Mots à faire confirmer par la famille : mémti, mankhar, wdhen, séq, bordgéni, njma, 7low.

## Points ouverts

- [ ] **https://missaoui-family.com (sans www) ne répond pas** : vérifier dans hPanel l'enregistrement DNS `A` de `@` et que le certificat SSL couvre aussi le domaine sans www.
- [ ] Redirection `http://` → `https://` non vérifiée (activer « Forcer HTTPS » dans hPanel › Sécurité › SSL si besoin).
- [ ] Deutsch Express affiche « Dijon-Ville · ton cours (cours du 9 octobre) » : indique la ville ; à retirer si le papa le souhaite.
- [ ] Le mot de passe parent de Nahki Tounsi doit être créé par le papa dès la mise en ligne (la première personne qui le crée en devient le propriétaire).
- [ ] Connecteur Hostinger ajouté dans Claude mais pas encore chargé dans une conversation : l'utiliser pour DNS/SSL quand il sera disponible.

## Règles de contenu

- Pas de personnages protégés (jeux vidéo, dessins animés, marques) dessinés dans les jeux : on invente des personnages originaux. Exemple : pour Serpentin, Amine voulait les personnages de Poppy Playtime ; ils sont remplacés par le monde « Usine à jouets » et ses peluches-monstres inventées.

## Historique

- 21/10/2026 : La Nuit d'Amine (Halloween, 4 mini-jeux).
- 21/10/2026 : La Nuit d'Amine 2 (mémoire 10 paires, compter jusqu'à 20, histoire interactive).
- 22-23/10/2026 : Nahki Tounsi (derja) + mode « Ma voix ».
- 29/10/2026 : mise en ligne sur Hostinger via GitHub ; page « Famille Missaoui » avec les espaces Essil, Salma, Amine ; voix de Nahki Tounsi gardée en ligne (PHP).
- 30/10/2026 : Serpentin (snake pour tablette, 4 mondes, 3 vitesses, mode chiffres).
- 30/10/2026 : base de données famille (SQLite) : « Qui joue ? » et records en ligne dans Serpentin, suivi automatique des progrès de tous les cours, page Progression pour les parents ; en-têtes anti-cache pour que les tablettes voient toujours la dernière version.
- 30/10/2026 : photos de famille sur l'accueil, en tirages aimantés sur la « porte du frigo » (un aimant par couleur d'enfant, agrandissement au toucher). Publiques, à la demande du papa.
- 30/10/2026 : Le Jardin des Nombres (Salma, CE2) : soustraction avec retenue par compensation (« on ajoute 10 en haut et 1 dizaine en bas »), 8 étapes de l'échauffement aux problèmes, Ollie en maîtresse, cahier à petits carreaux, retenues en rouge.
- 01/11/2026 : Le Grand Galop (Salma) : quiz de l'exposé « Le cheval » (source : `OneDrive\Salma etude\exposé\`), QCM, vrai/faux, photos, relier, robes dessinées, rythme des allures au sabot, écoute des sabots ; progression par Galops.
- 01/11/2026 : vidéos Higgsfield (Seedance 2.5, 5 s, 35 crédits chacune) du pas, du trot et du galop dans Le Grand Galop : `salma/cheval/{pas,trot,galop}.mp4` (960 px, sans son, ~400 Ko) + affiches `-poster.webp`. Section « Regarde les allures » sur la fiche, vidéo au-dessus du sabot dans les questions de rythme, vidéo révélée après la réponse à « Écoute les sabots ». Toujours annoncer le prix exact en crédits avant une génération Higgsfield.
- 01/11/2026 : « Salma à cheval » en haut du Grand Galop : deux vidéos (dessin animé et réaliste, FLUX 3 à partir de sa photo puis Seedance 2.5, 74 crédits) avec sa vraie voix qui compte en anglais (ses 9 réponses extraites de `OneDrive\Salma etude\salma compte.mp4`). Muettes par défaut, bouton « Écouter Salma compter ». Fichiers `salma/cheval/salma-{cartoon,realiste}.mp4`.
- 01/11/2026 : **Serpent Légendes** (`jeux/serpent-legendes.html`), snake en 3D pour les trois enfants (Three.js 0.170 copié dans `lib/`, aucune dépendance en ligne). Deux caméras (vue du dessus / derrière le serpent), trois niveaux (Facile = murs magiques, Normal = rochers, Expert = rapide), quatre mondes (Prairie ; Plage, Neige, Espace débloqués par le record 15/25/40). Pièces : 2 par pomme, 10 par pomme d'or. Coffre à 30 pièces (commun 55 %, rare 32 %, épique 13 %, toujours un skin nouveau). 18 skins dont 3 légendaires gagnés par défi (Dragon d'or : longueur 30 ; Licorne étoilée : 600 pièces gagnées ; Phénix : 10 pommes d'or). Sauvegarde par joueur `serpent3d:<Prénom>` synchronisée sur le serveur (cours `serpent3d`, relue par `GET ?action=load`, seul cours relisible). Records `serpent3d` par niveau. Avatars dans `jeux/avatars/{essil,salma,amine,anis,imen}.webp` (Anis = papa, Imen = maman, boutons dans « Qui joue ? » du jeu) et cartes trophées `jeux/avatars/<prénom>-<skin>.webp` (repli sur émoji si absents). Les photos d'identité sources (OneDrive\Amine\grande section\photos) ne sont jamais publiées : seuls les visages recadrés servent de référence à Higgsfield.
- 01/11/2026 : nouvelle page d'accueil avec les avatars de la famille (maquette validée dans Claude Design) : titre « Famille Missaoui. » au point rouge gardé, portrait de famille (Anis et Imen derrière, les enfants devant ; avatars petits qui grandissent ×1,9 au survol ou au toucher), cartes des enfants avec leur avatar, bandeau « Serpent Légendes, pour toute la famille ». L'ancienne page (photos aimantées sur le frigo) reste en ligne : `indexancien.html` (lien en pied de page, noindex).
