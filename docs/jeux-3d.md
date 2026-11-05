# Les jeux de la famille (3D, Grimpe-Glace, La Légende du Jasmin)

Serpent et Ludo utilisent Three.js 0.170 (`lib/three-0.170.0.module.min.js`), sans autre dépendance en ligne que Google Fonts. Ils partagent le même univers : panneaux sombres posés sur la scène 3D, raretés **commun** (gris-vert), **rare** (bleu), **épique** (violet), **légendaire** (or), coffres mystère, défis légendaires et **cartes légendes** Higgsfield.

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
- **Boutique du savoir 🎟️** (écran Skins, visible seulement pour un joueur qui a une source de tickets) : Plage 15, Neige 30, Espace 50, Bibliothèque 70, Crayon magique 40, Serpent Monnaie 45 (pièces d'or, d'argent et de cuivre). Sources déclarées dans `STUDY` (Salma ← `salma-verbes` + `salma-geometrie` + `salma-monnaie` + `jasmin`, tickets additionnés ; Essil ← `jasmin` ; Amine ← `amine-ecriture` + `jasmin` ; Amine ← `amine-ecriture`, tickets + cartes). Tickets disponibles = tickets gagnés (le plus grand entre la copie locale et le serveur) − `spentT`.
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

## Grimpe-Glace — `jeux/grimpe-glace.html` (2D)

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

## La Légende du Jasmin — `jeux/legende-du-jasmin.html` (plateforme 2.5D)

Jeu de plateforme original à défilement horizontal, univers tunisien (cahier des charges du papa : `OneDrive\Amine\grande section\projet clone mario\`, version solo). Moteur maison Canvas 2D, physique à pas fixe, niveaux construits par morceaux (`buildLevel` : départ, trou, escalier, blocs, plateformes, pics, plateformes mobiles, dalles fragiles, maison secrète, lanterne, sortie).
- **Héros** : l'avatar du joueur (visage) en tunique à ses couleurs. Saut variable (appui court / long), tolérance au bord (`coyote`) et appui mémorisé, contrôle en l'air, course qui accélère toute seule (ou B / Maj).
- **9 mondes** (fonds Higgsfield en parallaxe, répétés en miroir), dans l'ordre du voyage `ORDER = [1, 6, 7, 2, 8, 9, 3, 4, 5]` : Sidi Bou Saïd, la Médina de Tunis (toits, chats, **tapis volants** = plateformes mobiles), les Ruines de Carthage (pierres qui s'effritent, crabes, mouettes, colonnes), l'Oasis de Tozeur, l'Île de Djerba (**marée** : les cuvettes de sable mouillé `w` se remplissent et se vident ; sous la surface `tideY(t)` on tombe à l'eau), les Maisons de Matmata (**tunnels** `M.roof` dans le noir : le héros, les torches, les lanternes et les jasmins éclairent ; chauves-souris), les Dunes du Sahara, les Montagnes d'Aïn Draham (glace), le Palais du Scorpion d'Or (boss, toujours la fin). Les numéros de monde (1 à 9) ne changent pas : ils servent aux sauvegardes et aux records ; seul le numéro affiché suit l'ordre du voyage. Effet 2.5D : chaque bloc a une face du dessus et une face de côté.
- **Blocs** : 📚 savoir (question selon qui joue : Amine = compter, lettres, couleurs ; Salma = soustraction, monnaie, conjugaison, géométrie, anglais ; Essil = allemand, latin, multiplication ; parents et amis = Tunisie, calcul) ; 🪔 bonus (🎩 chéchia = un coup en plus, 🌶️ harissa = piments à lancer avec B, 🍵 thé à la menthe = vitesse) ; 🪙 dinars ; briques cassables.
- **Ennemis** : scorpion, faucon, hérisson (en boule quand on saute dessus, on le fait rouler), cactus qui lance des figues de Barbarie. **Boss** : le Scorpion d'Or (fonce, se cogne au mur, sonné ⭐ : on lui saute sur le dos ; 3 coups ; en phase 2 il lance des braises).
- **Dangers** : trous, eau / braises, pics (par paires). Plateformes mobiles, dalles fragiles, derbouka-tremplin. Lanternes 🏮 = points de sauvegarde (chaque lanterne se pose sur un sol sûr, et la réapparition cherche toujours un sol sans eau ni pics : `safeSpot`). Porte bleue = sortie. 3 **jasmins dorés** 🌼 par niveau (dont un dans une maison secrète, derrière un faux mur).
- **Fin de niveau** : temps, dinars, jasmins, ennemis, bonnes réponses, score, 1 à 3 étoiles (fini ; 60 % des dinars ; 3 jasmins). 5 vies par essai. Le monde suivant du voyage se débloque (`isOpen` : premier monde, ou monde d'avant réussi ; les mondes 1 à 5 déjà ouverts avec l'ancien `unlocked` le restent).
- **Tickets 🎟️** : 1 par bonne réponse + 2 par jasmin trouvé la première fois ; ajoutés à la Boutique du savoir de Serpent Légendes (Essil, Salma et Amine).
- **Commandes** : croix à gauche, A (saut) et B (tir / course) à droite, taille réglable ; clavier (flèches / Q D, Espace / Z, Maj / X, Échap) ; manette. Paysage (message « tourne la tablette » en portrait).
- **Sons** : musique originale en mode hijaz avec rythme de darbouka (maqsoum), bruitages synthétisés.
- **Sauvegarde** `jasmin:<Prénom>` {unlocked, best{n:{score,stars,time}}, gems{n:[…]}, tickets, answers{ok,ko}, games, t}, réglages `jasmin-prefs`. Records en ligne `jasmin`, variantes `monde1` à `monde9`.
- Images : `jeux/jasmin/` (titre, monde1 à monde9, boss).

## Tester

- Local : `php -S 127.0.0.1:8770 -t <lien vers le dépôt>` puis Playwright avec `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader` (WebGL logiciel, animations lentes mais justes). Les crochets de test : `window.__serpent`, `window.__ludo`.
- Ludo en ligne : deux contextes Playwright (deux « tablettes ») sur le même serveur local ; vérifier que `G.ev.n` et `G.pawns` sont identiques des deux côtés.
