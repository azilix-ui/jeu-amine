# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Essil**, 12 ans, au collège. Travaille l'allemand (Deutsch Express) et le latin (Via Romana) : vocabulaire, grammaire, civilisation, en étapes courtes avec correction immédiate.
- **Salma**, 8 ans, CE2. Anglais (English Garden), conjugaison (L'Atelier des Verbes), soustraction (Le Jardin des Nombres) et le quiz de son exposé sur le cheval (Le Grand Galop), avec Ollie le hibou.
- **Amine**, 5 ans, grande section de maternelle. Joue à des jeux éducatifs : mémoire, compter jusqu'à 20, couleurs, suites logiques, une histoire interactive, la derja tunisienne (Nahki Tounsi) et Serpentin.
- **Anis, le papa** (propriétaire du site) : crée les contenus avec Claude, enregistre sa voix pour la derja, suit la progression des enfants sur la page Progression, et joue aussi aux jeux de famille.
- **Imen, la maman** : joue aux jeux de famille (Serpent Légendes, Ludo Légendes) avec son avatar.
- Le site est **fait pour la famille**. Les jeux acceptent un autre prénom : un ami peut être invité à une partie de Ludo en ligne par un lien, mais il n'y a pas d'autre public visé (ni école, ni grand public).

## Product Purpose

Faire apprendre les enfants en s'amusant, à la maison, avec des cours et des jeux faits sur mesure pour chacun : leur niveau, leurs leçons de classe, leurs goûts (Halloween, dragons…), leurs langues (allemand, latin, anglais, derja tunisienne). Réussite : les enfants y reviennent d'eux-mêmes, progressent, et les parents voient cette progression.

## Positioning

Un site d'apprentissage **fait pour une seule famille** : chaque cours part du programme réel de l'enfant (ex. le cours d'allemand du 9 octobre d'Essil), chaque jeu porte son prénom, et la derja est enseignée avec la voix du papa. Aucune plateforme scolaire générique ne peut offrir ce sur-mesure.

## Operating Context

- Utilisé **surtout sur tablette tactile**, à la maison ; parfois sur l'ordinateur familial (Windows, Edge ou Chrome).
- Chaque enfant a son espace : `essil/`, `salma/`, `amine/`. L'accueil `index.html` les réunit avec des liens directs vers chaque cours et jeu.
- Les progrès sont gardés dans le navigateur de l'appareil, puis copiés automatiquement sur le serveur (base SQLite) pour la page Progression des parents.
- Serpentin demande « Qui joue ? » avant la partie et tient un classement en ligne partagé entre les enfants.
- Amine ne sait pas encore lire : ses jeux passent par la voix (consignes lues à voix haute) et par de grandes images.

## Capabilities and Constraints

- Site statique en HTML, CSS et JavaScript, sans framework ni étape de construction, servi par Hostinger depuis le dépôt GitHub `azilix-ui/jeu-amine` (branche `main`, déploiement automatique).
- Deux petits programmes PHP : `amine/voix/api.php` (voix du papa pour Nahki Tounsi) et `api/famille.php` (joueurs, records, progrès). Les données sont hors du site public.
- Mot de passe parent unique pour enregistrer les voix et voir la Progression.
- Les jeux d'Amine récompensent avec une cagnotte de bonbons partagée ; les cours d'Essil avec des XP et des grades ; celui de Salma avec des étoiles.
- Pas de personnages protégés (jeux vidéo, dessins animés, marques) : on invente des personnages originaux.
- Les voix de synthèse des navigateurs ne parlent pas la derja : c'est la voix enregistrée du papa qui fait foi.
- Synchronisation entre appareils : faite pour Serpent Légendes, Ludo Légendes et L'Atelier des Verbes ; les autres cours restent sur l'appareil (copie serveur pour la Progression seulement).
- Jeux 3D (Three.js) pour toute la famille, avec collections (coffres, raretés, défis légendaires) ; les exercices rapportent des tickets 🎟️ dépensés dans les jeux.
- Images et vidéos générées avec Higgsfield (avatars, cartes légendes, vidéos du cheval) : prix annoncé avant chaque génération.

## Brand Commitments

- Nom du site : **Famille Missaoui** (missaoui-family.com). Les prénoms des enfants apparaissent sur le site, avec l'accord du papa.
- Chaque enfant a son univers : Essil, le train bleu et le rail rouge de Deutsch Express ; Salma, le jardin et le ciel d'English Garden ; Amine, la nuit d'Halloween et sa citrouille. Les cours et jeux gardent chacun leur identité propre.
- Langue du site : le français ; les langues apprises apparaissent dans leurs leçons.
- Ton : chaleureux, encourageant, jamais moqueur ; on félicite (« Bravo Amine ! », « Wunderbar ! », « ya3tik essa77a »).

## Evidence on Hand

- Contenus réels : les cours de classe d'Essil (allemand, latin), le vocabulaire d'anglais de Salma, 56 mots de derja vérifiables par la famille.
- Sources sur l'ordinateur du papa : `OneDrive\Salma etude\` et `OneDrive\Amine\grande section\`. Deux photos WhatsApp de documents scolaires y sont rangées et ne sont pas publiées.
- Pas de témoignages, statistiques ou contenus inventés à ajouter.

## Product Principles

1. **Sur mesure avant tout** : chaque contenu part du programme et des goûts réels de l'enfant, pas d'un modèle générique.
2. **Le jeu porte l'apprentissage** : chaque partie fait réviser quelque chose (compter, lire, conjuguer), sans que cela ressemble à un devoir.
3. **Adapté à l'âge** : voix et images pour Amine, consignes courtes pour Salma, exercices exigeants mais rapides pour Essil.
4. **Encourager, jamais punir** : on peut toujours réessayer ; l'erreur se corrige avec douceur.
5. **Les parents voient sans surveiller** : la progression est visible pour eux, discrète pour les enfants.

## Accessibility & Inclusion

- **Tablette tactile d'abord** : grandes zones de toucher, aucun geste fin, pas de survol nécessaire, page qui ne bouge pas pendant les jeux.
- Un lecteur de 5 ans qui ne lit pas encore : toute consigne destinée à Amine est aussi dite à voix haute.
- Texte bien lisible sur l'écran d'une tablette, en lumière de jour comme le soir.
