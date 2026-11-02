# Famille Missaoui — mémoire du projet

À lire avant toute modification du site. Cette fiche donne l'essentiel ; le détail est dans `docs/`.

| Fichier | Contenu |
|---|---|
| `CLAUDE.md` | cette fiche : la famille, l'arborescence, la publication, les règles |
| `docs/contenus.md` | chaque cours et jeu, enfant par enfant : ce qu'il fait, ses fichiers, ses sources |
| `docs/jeux-3d.md` | Serpent Légendes, Ludo Légendes (en ligne), Grimpe-Glace, collections, tickets du savoir |
| `docs/serveur.md` | PHP + SQLite, API, clés de sauvegarde, synchronisation, Progression, limites |
| `docs/higgsfield.md` | images et vidéos générées, crédits dépensés, identifiants à réutiliser, règles |
| `docs/journal.md` | l'historique daté de tout ce qui a été fait |
| `PRODUCT.md` | contexte produit (audience, principes) pour le skill Impeccable |

Ces fichiers `.md` sont bloqués en ligne par `.htaccess`. Une copie de cette fiche est dans le projet Claude « jeu et loisir Amine » (`claude/site-famille-missaoui.md`).

## Le projet en une phrase

**https://www.missaoui-family.com** regroupe les cours et les jeux faits sur mesure pour les enfants de la famille Missaoui, pour **apprendre en s'amusant**. Pages HTML autonomes (sans framework), créées avec Claude, publiées par GitHub → Hostinger.

## La famille

| Personne | Rôle | Couleur / avatar |
|---|---|---|
| **Anis** | le papa, propriétaire du site (c'est lui qui parle à Claude) | vert sarcelle `#0f766e`, `jeux/avatars/anis.webp` |
| **Imen** | la maman | framboise `#b4235a`, `jeux/avatars/imen.webp` |
| **Essil** | 12 ans, collège : allemand, latin | bleu `#1f3c88` + rail rouge `#d7263d` |
| **Salma** | 8 ans, CE2 : anglais, français (conjugaison), maths (soustraction, géométrie), exposé cheval | vert `#1f6b44` + ciel `#5aaedc` |
| **Amine** | 5 ans, grande section : jeux, écriture (Ardoise magique), derja tunisienne | nuit `#2a1f4f` + lune `#fff1bf` / citrouille `#ff8c1a` |

Ordre d'affichage voulu : **Essil, Salma, Amine**. Les prénoms et les avatars peuvent apparaître sur le site (accord du papa).

## Arborescence

```
index.html             accueil : titre « Famille Missaoui. » (point rouge), portrait de famille en avatars, 3 cartes enfants, bandeau jeux de famille
indexancien.html       ancienne page d'accueil (photos aimantées sur le frigo), gardée en ligne, noindex
famille.css            style commun accueil + espaces (version de cache : ?v=6)
famille.js             module commun : « Qui joue ? », scores, classements, suivi et relecture des progrès
progression.html       tableau de bord des parents (mot de passe parent)
essil/  index.html, deutsch-express.html, via-romana.html
salma/  index.html, english-garden.html, atelier-des-verbes.html, atelier-des-formes.html, jardin-des-nombres.html, le-grand-galop.html, cheval/ (images et vidéos)
amine/  index.html, ardoise-magique.html (+ lettres.js : modèles des 78 lettres), la-nuit-d-amine.html, la-nuit-d-amine-2.html, nahki-tounsi.html, serpentin.html, voix/api.php
jeux/   serpent-legendes.html, ludo-legendes.html, grimpe-glace.html, avatars/ (5 avatars, 15 cartes légendes, illustrations Ludo et Grimpe-Glace), cartes/ (illustrations des skins)
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
2. Pastille de retour en haut, `<script src="../famille.js">` et `Famille.track('<cours>', '<Prénom>', ['<clé localStorage>'])`.
3. Déclarer le cours dans `COURSES` de `api/famille.php` (et dans `READABLE` s'il doit se relire sur une autre tablette), puis une carte dans `progression.html`.
4. Une carte dans `<enfant>/index.html` et un lien dans la carte de l'enfant sur `index.html`.
5. Tester (Playwright, portrait et paysage tablette), commit + push, vérifier en ligne, ajouter une ligne dans `docs/journal.md`.

## Règles à respecter

- **Higgsfield** : toujours annoncer le prix exact en crédits (outil `get_cost`) et attendre l'accord du papa avant de générer. Montrer le résultat avant de publier.
- **Photos** : ne jamais publier de documents scolaires bruts ni de photos d'identité (planches avec numéros). Seuls des visages recadrés servent de référence à Higgsfield ; ce sont les avatars dessinés qui vont en ligne.
- **Pas de personnages protégés** (jeux vidéo, dessins animés, marques) : on invente des personnages originaux (ex. Poppy Playtime → monde « Usine à jouets » inventé).
- Ton chaleureux, jamais moqueur ; consignes lues à voix haute pour Amine qui ne lit pas encore.
- Tout en français ; tester sur tablette (tactile, cibles ≥ 48 px).

## Points ouverts

- [ ] **https://missaoui-family.com (sans www)** : la page répond (vu le 02/11 dans le navigateur), mais le DNS `A` de `@` et le certificat SSL sans www restent à vérifier dans hPanel.
- [ ] Redirection `http://` → `https://` non vérifiée (« Forcer HTTPS » dans hPanel › Sécurité › SSL).
- [ ] Deutsch Express affiche « Dijon-Ville » : à retirer si le papa le souhaite (pas encore décidé).
- [ ] Le mot de passe parent (voix + Progression) doit avoir été créé par le papa.
- [ ] Sauvegardes des bases (`famille-data/`) et des voix (`nahki-voix/`) : proposées, pas encore faites.
- [ ] Ludo en ligne : si la tablette hôte se ferme, les machines s'arrêtent (les vrais joueurs continuent).
- [ ] Mots de derja à faire confirmer par la famille : mémti, mankhar, wdhen, séq, bordgéni, njma, 7low.
