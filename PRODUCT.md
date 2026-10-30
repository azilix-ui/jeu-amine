# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Essil**, au collège. Travaille l'allemand (Deutsch Express) et le latin (Via Romana) : vocabulaire, grammaire, civilisation, en étapes courtes avec correction immédiate.
- **Salma**, en primaire. Débute l'anglais (Salma's English Garden) : vocabulaire de base, jours, mois, avec Ollie le hibou.
- **Amine**, 5 ans, grande section de maternelle. Joue à des jeux éducatifs : mémoire, compter jusqu'à 20, couleurs, suites logiques, une histoire interactive, la derja tunisienne (Nahki Tounsi) et Serpentin.
- **La maman** (propriétaire du site) : crée les contenus avec Claude, enregistre sa voix pour la derja, suit la progression des enfants sur la page Progression.
- Le site est **réservé à la famille**. Serpentin accepte un autre prénom que ceux des enfants, mais il n'y a pas d'autre public visé (ni école, ni amis, ni grand public).

## Product Purpose

Faire apprendre les enfants en s'amusant, à la maison, avec des cours et des jeux faits sur mesure pour chacun : leur niveau, leurs leçons de classe, leurs goûts (Halloween, dragons…), leurs langues (allemand, latin, anglais, derja tunisienne). Réussite : les enfants y reviennent d'eux-mêmes, progressent, et les parents voient cette progression.

## Positioning

Un site d'apprentissage **fait pour une seule famille** : chaque cours part du programme réel de l'enfant (ex. le cours d'allemand du 9 octobre d'Essil), chaque jeu porte son prénom, et la derja est enseignée avec la voix de la maman. Aucune plateforme scolaire générique ne peut offrir ce sur-mesure.

## Operating Context

- Utilisé **surtout sur tablette tactile**, à la maison ; parfois sur l'ordinateur familial (Windows, Edge ou Chrome).
- Chaque enfant a son espace : `essil/`, `salma/`, `amine/`. L'accueil `index.html` les réunit avec des liens directs vers chaque cours et jeu.
- Les progrès sont gardés dans le navigateur de l'appareil, puis copiés automatiquement sur le serveur (base SQLite) pour la page Progression des parents.
- Serpentin demande « Qui joue ? » avant la partie et tient un classement en ligne partagé entre les enfants.
- Amine ne sait pas encore lire : ses jeux passent par la voix (consignes lues à voix haute) et par de grandes images.

## Capabilities and Constraints

- Site statique en HTML, CSS et JavaScript, sans framework ni étape de construction, servi par Hostinger depuis le dépôt GitHub `azilix-ui/jeu-amine` (branche `main`, déploiement automatique).
- Deux petits programmes PHP : `amine/voix/api.php` (voix de la maman pour Nahki Tounsi) et `api/famille.php` (joueurs, records, progrès). Les données sont hors du site public.
- Mot de passe parent unique pour enregistrer les voix et voir la Progression.
- Les jeux d'Amine récompensent avec une cagnotte de bonbons partagée ; les cours d'Essil avec des XP et des grades ; celui de Salma avec des étoiles.
- Pas de personnages protégés (jeux vidéo, dessins animés, marques) : on invente des personnages originaux.
- Les voix de synthèse des navigateurs ne parlent pas la derja : c'est la voix enregistrée de la maman qui fait foi.
- Non décidé : synchroniser les progrès d'un appareil à l'autre (aujourd'hui, ils restent sur l'appareil où l'enfant a travaillé).

## Brand Commitments

- Nom du site : **Famille Missaoui** (missaoui-family.com). Les prénoms des enfants apparaissent sur le site, avec l'accord de la maman.
- Chaque enfant a son univers : Essil, le train bleu et le rail rouge de Deutsch Express ; Salma, le jardin et le ciel d'English Garden ; Amine, la nuit d'Halloween et sa citrouille. Les cours et jeux gardent chacun leur identité propre.
- Langue du site : le français ; les langues apprises apparaissent dans leurs leçons.
- Ton : chaleureux, encourageant, jamais moqueur ; on félicite (« Bravo Amine ! », « Wunderbar ! », « ya3tik essa77a »).

## Evidence on Hand

- Contenus réels : les cours de classe d'Essil (allemand, latin), le vocabulaire d'anglais de Salma, 56 mots de derja vérifiables par la famille.
- Sources sur l'ordinateur de la maman : `OneDrive\Salma etude\` et `OneDrive\Amine\grande section\`. Deux photos WhatsApp de documents scolaires y sont rangées et ne sont pas publiées.
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
