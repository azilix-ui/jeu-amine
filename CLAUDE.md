# Famille Missaoui — site d'apprentissage des enfants

Fiche de mémoire du projet : à lire avant toute modification du site.

## Le projet en une phrase

**https://www.missaoui-family.com** regroupe les cours et les jeux faits sur mesure pour les trois enfants de la famille Missaoui, pour **apprendre en s'amusant**. Chaque enfant a son espace. Les contenus sont des pages HTML autonomes (sans serveur, sans framework), créées avec Claude.

## Les enfants et leurs contenus

| Enfant | Niveau / matières | Contenus en ligne | Couleur du site |
|---|---|---|---|
| **Essil** | collège : allemand, latin | `essil/deutsch-express.html` (Deutsch Express, allemand, 14 étapes), `essil/via-romana.html` (Via Romana, latin, 10 étapes) | bleu `#1f3c88` + rail rouge `#d7263d` |
| **Salma** | anglais débutant | `salma/english-garden.html` (Salma's English Garden, 8 thèmes : Hello, Animals, Colours, Numbers, Fruits, Family, Days, Months) | vert `#2e8b57` + ciel `#5aaedc` |
| **Amine** | 5 ans, grande section | `amine/la-nuit-d-amine.html` (Halloween 1 : mémoire, compter jusqu'à 10, couleurs, suites), `amine/la-nuit-d-amine-2.html` (Halloween 2 : mémoire 18 personnages, compter jusqu'à 20, additions, comparer, histoire « Où est passé Minuit ? »), `amine/nahki-tounsi.html` (Nahki Tounsi : derja tunisienne, 56 mots en 7 thèmes + nombres) | nuit `#2a1f4f` + citrouille `#ff8c1a` |

Ordre d'affichage voulu par la maman : **Essil, Salma, Amine** (de l'aîné au plus jeune). Le prénom des enfants peut apparaître sur le site (accord donné).

## Arborescence du site (dépôt GitHub)

```
index.html            accueil « Famille Missaoui » (3 cartes, une par enfant)
famille.css           style commun de l'accueil et des pages d'espace
essil/index.html      espace Essil  → deutsch-express.html, via-romana.html
salma/index.html      espace Salma  → english-garden.html
amine/index.html      espace Amine (« Les jeux d'Amine ») → 3 jeux
amine/voix/api.php    stockage en ligne des voix de Nahki Tounsi (PHP)
.htaccess             cache README/package.json/build.js ; redirige les anciens liens des jeux d'Amine
package.json, build.js  copie le site dans dist/ (filet de sécurité si Hostinger lance un « build »)
CLAUDE.md             cette fiche (bloquée en ligne par .htaccess)
```

Conventions :
- Chaque cours a une **pastille de retour** fixe en haut à gauche (« ← Essil », « ← Salma ») ; les jeux d'Amine ont un lien « ← Tous les jeux » ; les pages d'espace ont « ← Famille Missaoui ».
- Polices : accueil et espaces en **Bricolage Grotesque** (titres) + **Nunito** (texte). Chaque cours garde sa propre identité visuelle.
- Les progrès (étoiles, XP, bonbons) sont gardés dans le `localStorage` du navigateur : clés `salma-stars`, `essil-deutsch`, `essil-latin`, `amine-bonbons`, `amine-tounsi-etoiles`.

## Publication (workflow)

- Dépôt GitHub : **`azilix-ui/jeu-amine`** (public), branche **`main`**. Claude a les droits d'écriture (application GitHub Claude installée).
- Hostinger (hPanel › Sites web › missaoui-family.com › Avancé › Git) est relié au dépôt par l'application GitHub de Hostinger : **chaque `git push` sur `main` met le site à jour automatiquement** (environ 30 s à 1 min).
- La racine du dépôt est servie telle quelle dans `public_html`.
- Pour vérifier en ligne : le navigateur intégré du Claude desktop (site autorisé) ; le shell du conteneur et celui de l'ordinateur ne peuvent pas joindre le domaine (proxy).

### Ajouter un nouveau cours
1. Récupérer le fichier HTML (dossiers sources ci-dessous). Publier la **dernière version** seulement.
2. Le copier dans le dossier de l'enfant avec un nom simple, sans espaces ni accents (`salma/maths-garden.html`).
3. Ajouter la pastille de retour juste après `<body>` (copier celle d'un cours existant).
4. Ajouter une carte dans `<enfant>/index.html` (et mettre à jour la liste sur `index.html` si besoin).
5. Ne jamais publier de photos personnelles ni de documents scolaires bruts.
6. Commit + push sur `main`, puis vérifier la page en ligne.

## Dossiers sources sur l'ordinateur de la maman (OneDrive)

- `C:\Users\azili\OneDrive\Amine\grande section\` : jeux d'Amine (versions hors-ligne) + copie du site dans `site-jeux-amine\` (ancienne version, avant la page famille).
- `C:\Users\azili\OneDrive\Salma etude\` : `Salma English Garden.html` (v1) et `… v2 - jours et mois.html` (publiée) ; `Essil\` : `Essil Deutsch Express.html` (v1), `… v2 - cours.html` (publiée), `Essil Via Romana Latin.html` (publiée), et 2 photos WhatsApp (sources, **non publiées**).

## Nahki Tounsi : la voix de la maman en ligne

- Aucune voix de synthèse ne parle vraiment la derja : la maman enregistre les mots elle-même (bouton **🎙️ Ma voix** dans le jeu).
- Ordre de lecture d'un mot : enregistrement de l'appareil → enregistrement en ligne → voix de synthèse (Edge a une voix « Arabe (Tunisie) »).
- `amine/voix/api.php` : `GET ?action=list`, `GET ?action=play&k=MOT&v=N` (publics) ; `POST action=setup|login|save|delete` (mot de passe parent). 3 Mo max par son, 400 sons max, blocage 15 min après 8 mauvais mots de passe.
- Les données sont **hors du site public**, dans le dossier `nahki-voix/` à côté de `public_html` (sur Hostinger : `domains/missaoui-family.com/nahki-voix/`) : `auth.json` (hash du mot de passe), `index.json` (mot → fichier), `sons/`. Un redéploiement GitHub ne les touche pas.
- **Mot de passe oublié** : dans hPanel › Gestionnaire de fichiers, supprimer `nahki-voix/auth.json`, puis rouvrir 🎙️ Ma voix pour en créer un nouveau (les sons sont conservés).
- Écriture des mots : `3` = ع, `7` = ح, `kh` = خ, `q` = ق, `dh` = ض/ظ. Mots à faire confirmer par la famille : mémti, mankhar, wdhen, séq, bordgéni, njma, 7low.

## Points ouverts

- [ ] **https://missaoui-family.com (sans www) ne répond pas** : vérifier dans hPanel l'enregistrement DNS `A` de `@` et que le certificat SSL couvre aussi le domaine sans www.
- [ ] Redirection `http://` → `https://` non vérifiée (activer « Forcer HTTPS » dans hPanel › Sécurité › SSL si besoin).
- [ ] Deutsch Express affiche « Dijon-Ville · ton cours (cours du 9 octobre) » : indique la ville ; à retirer si la maman le souhaite.
- [ ] Le mot de passe parent de Nahki Tounsi doit être créé par la maman dès la mise en ligne (la première personne qui le crée en devient la propriétaire).
- [ ] Connecteur Hostinger ajouté dans Claude mais pas encore chargé dans une conversation : l'utiliser pour DNS/SSL quand il sera disponible.

## Historique

- 21/10/2026 : La Nuit d'Amine (Halloween, 4 mini-jeux).
- 21/10/2026 : La Nuit d'Amine 2 (mémoire 10 paires, compter jusqu'à 20, histoire interactive).
- 22-23/10/2026 : Nahki Tounsi (derja) + mode « Ma voix ».
- 29/10/2026 : mise en ligne sur Hostinger via GitHub ; page « Famille Missaoui » avec les espaces Essil, Salma, Amine ; voix de Nahki Tounsi gardée en ligne (PHP).
