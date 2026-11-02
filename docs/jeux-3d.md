# Les jeux 3D de la famille

Les deux jeux utilisent Three.js 0.170 (`lib/three-0.170.0.module.min.js`), sans autre dépendance en ligne que Google Fonts. Ils partagent le même univers : panneaux sombres posés sur la scène 3D, raretés **commun** (gris-vert), **rare** (bleu), **épique** (violet), **légendaire** (or), coffres mystère, défis légendaires et **cartes légendes** Higgsfield.

Avatars et cartes : `jeux/avatars/<prénom>.webp` (essil, salma, amine, anis, imen) et `jeux/avatars/<prénom>-<légende>.webp` (légende = dragon, licorne, phenix ; 15 cartes). Si l'image manque, le jeu affiche un émoji (🚆 🦉 🎃 🧔 👩) ou la première lettre du prénom.

## Serpent Légendes — `jeux/serpent-legendes.html`

- **Caméras** : vue du dessus (glisser le doigt ou croix) ou derrière le serpent (↰ ↱ ou toucher gauche/droite de l'écran).
- **Niveaux** : Facile (murs magiques, on ressort de l'autre côté : pour Amine), Normal (rochers), Expert (rapide). Niveau +1 toutes les 6 pommes.
- **Mondes** : Prairie ; Plage, Neige, Espace débloqués par le record 15 / 25 / 40, ou achetés avec des tickets ; **Bibliothèque** uniquement avec des tickets.
- **Pièces** : 2 par pomme, 10 par pomme d'or (rare, 8 s). **Coffre** 30 pièces : commun 55 %, rare 32 %, épique 13 %, toujours un skin nouveau.
- **28 skins** : 6 communs, 5 rares (zèbre, abeille, pastèque, coccinelle, chat tigré), 4 épiques animés (arc-en-ciel, lave, cristal de glace, galaxie), 3 légendaires par défi (Dragon d'or : longueur 30 ; Licorne étoilée : 600 pièces gagnées en tout ; Phénix : 10 pommes d'or), 2 « Savoir » (Crayon magique en boutique, Craie magique par l'Ardoise), 4 **mythiques** et 4 **secrets** (ci-dessous). Les illustrations des cartes sont dans `jeux/cartes/<skin>.webp` (montrées dans « Mes skins », floues tant que le skin n'est pas gagné).
- **Brillants ✨** : chaque skin gagné (coffre, défi, boutique, mythique, secret) a 1 chance sur 10 d'être brillant (`data.shiny`) : reflet arc-en-ciel sur la carte, vague de lumière sur le serpent. Les cartes de l'Ardoise tirent leur chance sur l'Ardoise (`amine-ecriture.shiny`).
- **Mythiques 🔥** (rose, au-dessus de Légendaire ; seulement pour Essil, Salma, Amine) : Serpent de l'Alphabet (Amine : 26 lettres attachées à 2 ⭐ ou plus), Serpent des Verbes (Salma : 3 ⭐ aux 8 étapes de l'Atelier), Serpent Polyglotte (Essil : chaque leçon de Deutsch Express et Via Romana, 24), **Hydre Missaoui** (les 3 enfants apprennent pendant une même semaine ; gagnée par chacun). Calculés par le serveur (`?action=rewards`).
- **Secrets 🌙** : Aurore boréale, Tonnerre, Arc-de-Lune, Trésor ; un par tranche de **5 jours d'apprentissage d'affilée** (jours où un cours a changé, jeux exclus). Cachés (« ??? ») tant qu'ils ne sont pas gagnés ; la série du jour s'affiche en 5 pastilles.
- **Cartes de l'Ardoise magique** : les cartes gagnées par Amine (`amine-ecriture.cards`) sont ajoutées à ses skins au chargement (« 🃏 nouvelle carte ! »). Skin exclusif **Craie magique** (rareté Savoir).
- **Boutique du savoir 🎟️** (écran Skins, visible seulement pour un joueur qui a une source de tickets) : Plage 15, Neige 30, Espace 50, Bibliothèque 70, Crayon magique 40. Sources déclarées dans `STUDY` (Salma ← `salma-verbes` ; Amine ← `amine-ecriture`, tickets + cartes). Tickets disponibles = tickets gagnés (le plus grand entre la copie locale et le serveur) − `spentT`.
- **Sauvegarde** `serpent3d:<Prénom>` {coins, total, skins, shiny, skin, best{facile,normal,expert}, maxLen, gold, games, spentT, bought, t}, préférences `serpent3d-prefs`. Records en ligne `serpent3d` par niveau.

## Ludo Légendes — `jeux/ludo-legendes.html`

- **Règles classiques simplifiées** : un 6 pour sortir ; on rejoue après un 6, une capture ou un pion arrivé ; un pion capturé retourne à la maison, sauf sur les 8 cases sûres (4 départs + 4 étoiles) ; arrivée au compte exact ; la partie s'arrête au premier joueur qui a tous ses pions au centre. 2 ou 4 pions par joueur, 2 à 4 joueurs (places 0 rouge, 1 vert, 2 jaune, 3 bleu ; à 2 joueurs : rouge contre jaune).
- **Plateau** : grille 15 × 15, 52 cases de tour (`TRACK`), 5 cases d'allée par couleur (`HOME`), progression d'un pion 0 → 56 (−1 = maison).
- **Contre la machine** : IA par score (capture > arrivée > sortie > entrée dans l'allée > case sûre ; évite les cases à portée d'un adversaire).
- **En ligne, chacun sur sa tablette** : « Créer en ligne » → salon avec un code de 4 caractères ; « Rejoindre » + code, ou **lien d'invitation** `…/jeux/ludo-legendes.html?code=ABCD` (bouton « 📤 Inviter un ami » : partage natif, sinon WhatsApp / SMS / copier ; l'ami écrit son prénom et arrive dans le salon). L'hôte peut ajouter ou retirer des machines et lance la partie ; **c'est sa tablette qui fait jouer les machines**. Chaque tablette voit sa couleur en bas à gauche. Partie disponible 12 h ; rejoindre avec le même code reprend sa place (identifiant d'appareil `ludo-client`).
- **Fonctionnement réseau** : la tablette dont c'est le tour lance le dé et joue, calcule le nouvel état complet et l'envoie avec la version lue ; le serveur refuse (409) si quelqu'un a joué entre-temps. Les autres tablettes interrogent le serveur chaque seconde et rejouent l'animation du dernier coup (`ev`). Détails dans `docs/serveur.md`.
- **Pièces** : 40 / 20 / 12 / 10 selon la place, +3 par pion renvoyé, +2 par pion arrivé. **Coffre** 40 pièces : un pion, un dé ou un plateau non possédé.
- **Collection** : pions (classique, bille de verre, champignon, petit roi, robot, fusée), dés (blanc, bois, doré, cristal, feu, galaxie), plateaux (Jardin, Désert tunisien, Château, Espace) ; **pions légendaires** par défi (Dragon d'or : 3 victoires ; Licorne étoilée : 15 pions renvoyés ; Phénix : 25 six) avec leur carte légende.
- **Sauvegarde** `ludo3d:<Prénom>` {coins, total, owned[cat:id], pawn, dice, board, wins, games, caps, sixes, t}, préférences `ludo3d-prefs`, dernier code `ludo-last`. Records en ligne : victoires (`ludo3d`, variante `victoires`).
- Illustration de l'écran d'accueil : `jeux/avatars/ludo-famille.webp` (la famille autour d'un plateau géant, Higgsfield).

## Tester

- Local : `php -S 127.0.0.1:8770 -t <lien vers le dépôt>` puis Playwright avec `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` (WebGL logiciel, animations lentes mais justes). Les crochets de test : `window.__serpent`, `window.__ludo`.
- Ludo en ligne : deux contextes Playwright (deux « tablettes ») sur le même serveur local ; vérifier que `G.ev.n` et `G.pawns` sont identiques des deux côtés.
