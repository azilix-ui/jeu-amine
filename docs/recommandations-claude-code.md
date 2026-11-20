# Améliorer le travail de Claude sur missaoui-family.com (20/11/2026)

Analyse faite avec le plugin **claude-code-setup** sur le dépôt `azilix-ui/jeu-amine` (250 pages HTML, JS sans compilation, PHP sur Hostinger, 11 fichiers de tests Node, ComfyUI et ElevenLabs).
Rien n'est installé : ce sont des propositions. Dites « vas-y » pour l'une d'elles et Claude la met en place.

## 1. Un garde-fou automatique après chaque modification (hook « PostToolUse »)
**Pourquoi** : une virgule oubliée dans un fichier `.js` ou `.php` casse une page entière sur la tablette. Aujourd'hui, Claude vérifie à la main.
**Quoi** : après chaque écriture de fichier, Claude Code lance tout seul `node --check` (fichiers `.js` / `.mjs`) ou `php -l` (fichiers `.php`), et voit l'erreur tout de suite.
**Où** : `.claude/settings.json` du dépôt. Ce n'est pas un « git hook » (vous n'en voulez pas) : ça ne touche ni aux commits ni à GitHub.

## 2. Les règles de la maison protégées (hook « PreToolUse »)
**Pourquoi** : certaines règles ne doivent jamais être oubliées, même dans une longue nuit de travail.
**Quoi** : Claude Code refuse de modifier les fichiers du **Jasmin 2** (gelé), et refuse d'écrire un fichier qui contient la clé ElevenLabs ou un mot de passe.

## 3. Un « skill » publier-site
**Pourquoi** : chaque publication répète les mêmes étapes (`version.sh`, commit avec les bonnes lignes, push, attendre Hostinger, vérifier en ligne, docs aux 3 endroits). Une étape oubliée = un site pas à jour ou des docs en retard.
**Quoi** : une commande `/publier-site` qui fait tout dans l'ordre, et s'arrête s'il reste un fichier non commité.

## 4. Deux assistants spécialisés (« subagents »)
- **vérificateur-tablette** : ouvre chaque page modifiée en tablette portrait et paysage (Playwright), regarde les captures, signale ce qui déborde ou ce qui reste muet. Il ne voit pas le travail en cours : il juge « à froid ».
- **relecteur-éveil** : relit tout nouveau texte de l'éveil religieux avec vos règles (pas d'image de prophète, de compagnon ni d'ange ; versets récités par Al-Husary, jamais par une voix de synthèse), avant de vous le proposer à valider.

## 5. Des connexions utiles (« MCP »)
- **Hostinger** (le plugin est déjà proposé dans votre catalogue) : voir si le site est en ligne, lire les erreurs du serveur, vider le cache, sans passer par le navigateur.
- **Playwright** : pour que Claude teste les pages dans un vrai navigateur, comme une personne.

## 6. Des permissions claires
Dans `.claude/settings.json` : autoriser sans demander `node`, `php -l`, `git add/commit/push`, `sh docs/outils/version.sh` ; toujours demander pour supprimer des fichiers ou toucher à `api/` en production.

## Ce que je conseille en premier
1 et 3 : ce sont les deux qui évitent le plus d'erreurs, pour un petit effort.
