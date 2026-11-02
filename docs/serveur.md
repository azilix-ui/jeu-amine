# Serveur, données et synchronisation

Hébergement Hostinger (PHP + SQLite). Données hors du site public, à côté de `public_html` (sur Hostinger : `domains/missaoui-family.com/`) :

| Dossier | Contenu |
|---|---|
| `famille-data/famille.sqlite` | joueurs, records, progrès, historique, anti-abus |
| `famille-data/ludo.sqlite` | parties de Ludo en ligne |
| `nahki-voix/` | `auth.json` (hash du mot de passe parent), `index.json`, `sons/` (voix de Nahki Tounsi) |

## `api/famille.php`

- `GET ?action=ping` ; `GET ?action=highscores&game=G&variant=V&limit=N` ; `GET ?action=auth`.
- `GET ?action=load&player=P&course=C` : relit les progrès gardés sur le serveur, **seulement pour les cours de `READABLE`** = `serpent3d`, `salma-verbes`, `ludo3d`.
- `POST action=score` (player, game ∈ `GAMES` = serpentin, serpent3d, ludo3d ; variant ; score 0–5000).
- `POST action=progress` (player, course ∈ `COURSES`, data JSON ≤ 30 000 caractères).
- `POST action=setup` (création unique du mot de passe parent), `POST action=summary` (tout pour la page Progression, mot de passe parent).
- Tables : `players`, `scores`, `progress` (dernier état par joueur et cours), `history` (un instantané par heure au plus), `writes` (anti-abus : **240 écritures par 10 min et par adresse** ; toute la maison partage souvent la même adresse).
- `COURSES` : essil-deutsch, essil-latin, salma-english, salma-maths, salma-cheval, salma-verbes, amine-halloween, amine-tounsi, amine-serpentin, serpent3d, ludo3d.

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
| `salma-maths`, `salma-cheval`, `salma-verbes` | idem | Salma |
| `amine-bonbons` | amine-halloween | Amine |
| `amine-tounsi-etoiles` | amine-tounsi | Amine |
| `serpentin-best`, `serpentin-pref` | (records `serpentin`) | — |
| `serpent3d:<Prénom>` | serpent3d | chaque joueur |
| `ludo3d:<Prénom>` | ludo3d | chaque joueur |

Synchronisation entre tablettes : pour les cours de `READABLE`, la page relit la copie du serveur au démarrage et garde la plus récente (champ `t`) ; les autres cours restent d'abord sur l'appareil (le serveur garde une copie pour la page Progression seulement).

## `progression.html`

Mot de passe parent (le même que les voix). Cartes : Essil (Deutsch, Latin, Serpentin, Serpent Légendes, Ludo), Salma (English Garden, Atelier des Verbes, Jardin des Nombres, Grand Galop, Serpentin, Serpent Légendes, Ludo), Amine (Serpentin, Serpent Légendes, Ludo, cagnotte, Nahki). Gains de la semaine, records Serpentin, dernières parties (tous jeux), autres joueurs (amis invités).

**Mot de passe oublié** : supprimer `nahki-voix/auth.json` dans le gestionnaire de fichiers hPanel, puis en recréer un (les sons sont conservés).

## Cache et sécurité (`.htaccess`)

- Bloque en ligne tous les `.md`, `package.json`, `build.js`, `.gitignore`.
- `Cache-Control: no-cache, must-revalidate` pour html/css/js (les tablettes voient toujours la dernière version).
- Redirections 301 des anciens liens des jeux d'Amine vers `/amine/…`.
