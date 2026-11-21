/* L'aide de chaque jeu + le badge « Jeu propulsé par Anis Missaoui » (21/11, demandé par le papa).
   Chargé par explorateur.js sur les pages de jeux (liste AIDES ci-dessous, par adresse).
   - Un petit bouton ❔ (déplaçable, au bord droit) ouvre l'aide : « En bref » (le but, comment jouer, une astuce) puis « En détail ».
   - Au début de la partie, le badge « Jeu propulsé par Anis Missaoui » s'affiche quelques secondes, avec l'avatar de papa ;
     au survol (ou au toucher), c'est son héros du Jasmin qui danse (planche jeux/stage2/heros/anis.webp, ligne « danse »).
   Pour ajouter un jeu : une entrée dans AIDES { titre, bref:[…], detail:[[titre, texte]…] }. */
(function(){
  'use strict';
  if(window.__aideJeu) return; window.__aideJeu = 1;
  const AIDES = {
    'tebni': { titre:'Tebni تبني', bref:['🎯 Empile les pièces pour remplir des lignes entières : une ligne pleine disparaît et rapporte des points.', '👆 Glisse pour déplacer, touche pour tourner, glisse vite vers le bas pour poser (ou les boutons ◀ ▶ ⟳ ⬇ ⤓ 📦).', '💡 Garde une pièce longue de côté (📦) pour faire un « Tebni ! » : 4 lignes d\'un coup.'],
      detail:[['Le but', 'Les pièces tombent l\'une après l\'autre. Fais des lignes complètes : 1, 2, 3 ou 4 lignes d\'un coup donnent 100, 300, 500 ou 800 points (× le niveau). Toutes les 10 lignes, le niveau monte et les pièces tombent plus vite. La partie s\'arrête quand les pièces arrivent en haut.'],
        ['Les commandes', 'Sur tablette : glisser = déplacer, toucher = tourner, glisser vite vers le bas = poser tout de suite. Les boutons du bas font la même chose. Au clavier : flèches, ↑ ou X pour tourner, Espace pour poser, C pour garder, P pour la pause.'],
        ['La réserve 📦', 'Tu peux garder une pièce pour plus tard, une fois par pièce.'],
        ['Les réglages ⚙️', 'Le style (zellige ou « Classique en vrai »), le mode Tranquille (plus lent, pour Amine) ou Champion, l\'ombre de la pièce (où elle va tomber : non par défaut), le son, la langue du commentaire.']] },
    'kelma': { titre:'Kelma كلمة', bref:['🎯 Trace des mots avec le doigt en reliant des lettres voisines : elles disparaissent et rapportent des points.', '🌍 Choisis la langue : français, anglais ou arabe.', '💡 Les mots longs et les cases bonus (×2, ×3, pétards) rapportent beaucoup plus.'],
      detail:[['Le but', 'Vide la tour, ou atteins l\'objectif du niveau (nombre de mots, score, mot long). Un mot fait au moins 3 lettres ; on passe d\'une case à une case voisine (même en diagonale), chaque case une seule fois.'],
        ['Les modes', 'La tour · Une ligne tous les deux mots · Zarba ! (les lignes montent seules) · Bechwaya (sans temps) · Chrono (2 min) · Défi du jour (le même pour toute la famille) · Le trésor (pour Amine : 3 mots en images).'],
        ['Les pouvoirs', '💡 indice, 🔀 mélange, 🔨 marteau (enlève une lettre ou une brique), ❄️ gel, 🏁 finir.']] },
    'yajour': { titre:'Yajour ياجور', bref:['🎯 Ton super-héros s\'envole et fait tomber les constructions : réussis la mission du niveau.', '👆 Glisse le doigt pour viser (les points montrent le vol), lâche pour t\'envoler.', '💡 Vise le bas des tours et les caisses de feux d\'artifice : tout s\'écroule !'],
      detail:[['Les missions', 'Faire tomber un certain nombre de blocs du plateau, casser les jarres d\'or, ou libérer le chaton sans le faire tomber. Tu as un nombre de tirs limité.'],
        ['Les matières', 'Briques, bois, pierre, palmier, marbre (glisse), matelas (rebondit), jarres (se cassent), caisses de feux d\'artifice (explosent), zellige (piliers qui ne bougent pas).'],
        ['Les pouvoirs', '🪨 lourd, 💥 boum, 🔱 triple : un par tir. 3 étoiles = un pouvoir de plus.'],
        ['Les mondes', 'Sidi Bou Saïd, El Jem, le Sahara, Djerba (les potiers) et le fort de Tabarka : un monde s\'ouvre après 4 niveaux gagnés du précédent.']] },
    'khyout': { titre:'Khyout خيوط', bref:['🎯 Relie chaque paire de pelotes de la même couleur avec un fil, sans croiser les fils, et remplis toute la grille.', '👆 Pars d\'une pelote et glisse jusqu\'à l\'autre ; reviens en arrière sur ton fil pour corriger.', '💡 Commence par les pelotes près des bords et des coins.'],
      detail:[['Les règles', 'Toutes les paires doivent être reliées ET toutes les cases couvertes. Passer sur un autre fil le coupe (ou le bloque, selon les réglages).'],
        ['Les modes', 'Les niveaux (petites grilles pour Amine, puis 5×5 à 10×10), le chrono, le défi du jour, le monde des ponts (un fil passe dessus, l\'autre dessous).'],
        ['Les indices 💡', '1er appui : la couleur ; 2e : le début du fil ; 3e : le fil entier. Sans indice = 3 étoiles.']] },
    'kassar': { titre:'Kassar كسّار', bref:['🎯 Casse tous les carreaux de zellige : chaque nombre dit combien de coups il faut.', '👆 Mode tir : vise et lâche, les balles partent ensemble. Mode raquette : renvoie la balle avec la raquette.', '💡 Les jarres explosent et abîment leurs voisins ; la boule d\'or donne une balle de plus.'],
      detail:[['Mode tir', 'Après chaque tir, les carreaux descendent d\'une rangée et tu gagnes une balle. Si un carreau touche la ligne rouge, c\'est perdu.'],
        ['Mode raquette', 'Une balle, 3 vies ; l\'angle du renvoi dépend de l\'endroit où elle touche la raquette.'],
        ['Les mondes', 'La médina, Carthage (amphores qui abîment toute leur rangée), le Sahara (l\'oasis donne 3 balles).']] },
    'chkobba': { titre:'Chkobba شكبة', bref:['🎯 Ramasse le plus de cartes possible : une carte de même valeur, ou plusieurs dont la somme fait ta carte.', '🧹 Vider la table = une « chkobba » (1 point).', '💡 Le 7 de carreau (la haya) vaut un point : garde-le bien !'],
      detail:[['Les points de la manche', 'Le plus de cartes (karta), le plus de carreaux (dinari), le 7 de carreau (haya), le plus de 7 (bermila), et chaque chkobba.'],
        ['Jouer', 'Contre l\'ordi (Si Hamadi et ses amis) ou en ligne avec la famille : salon, invitation ou code de table. À 2, à 3, ou à 4 en équipes.']] },
    'koora': { titre:'Koora كرة', bref:['🎯 Ton ballon mange les nombres plus petits que lui et grandit ; évite les plus grands.', '👆 Glisse à gauche et à droite pour choisir ton chemin et tes portes (+, −, ×).', '💡 Au bout de la rue, casse les portes de la médina : il faut être assez grand !'],
      detail:[['Les modes', '🐢 Tranquille (additions, sans trou, pour Amine) ou 🐆 Champion (×, −, obstacles, trous).'],
        ['Les étoiles', 'Selon le nombre de portes (bab) cassées au bout de la rue. Les pièces achètent de nouveaux ballons.']] },
    'zarbia': { titre:'Zarbia', bref:['🎯 Sors de ta zarbia en déroulant un fil, reviens chez toi : tout ce que le fil entoure devient à toi.', '✂️ Coupe le fil des autres pour les éliminer ; sur ta zarbia, tu ne risques rien.', '💡 Fais des petites boucles quand quelqu\'un approche.'],
      detail:[['Les modes', '🐢 Tranquille (on renaît, victoire à 25 %) ou 🐆 Champion (on ne croise pas son propre fil, victoire à 75 %).'],
        ['En ligne', 'Jouer ensemble : salon, invitation ou code ; le créateur choisit le mode, les machines et la durée.']] },
    'jasmin-stage2': { titre:'Jasmin · Stage 2', bref:['🎯 Traverse les 23 mondes et trouve les jasmins ; la porte bleue est la sortie.', '🎮 ← → marcher, ↑ sauter, ↓ s\'accroupir, ↓ + Espace ramasser, Espace lancer.', '💡 Attrape un ennemi par derrière et lance-le sur les autres !'],
      detail:[['Les commandes', 'Sur tablette : joystick à gauche, boutons ⤒ Saut, ✋ Ramasser, 🎯 Lancer. Devant une échelle : ↑ pour monter. Rester accroupi sur une petite porte = passage secret.'],
        ['La vie', 'La barre en haut : un morceau en moins à chaque coup. Les lanternes sont des points de départ ; Pause › « Revenir à la dernière lanterne » si tu es coincé.'],
        ['Les objets', 'Clé (pour la porte fermée), levier et grille, caisses à pousser, murs fissurés à casser avec un objet lancé.']] },
    'ma-houma': { titre:'Ma Houma', bref:['🎯 Un quartier tunisien à faire vivre : pas de score, pas d\'échec, tu inventes tes histoires.', '👆 Glisse les personnages et les objets ; touche les meubles et les animaux pour voir ce qu\'ils font.', '💡 Trouve les 50 découvertes ⭐ (le thé à la menthe, le couscous, le bébé de la ferme…).'],
      detail:[['Les lieux', 'Dar Yasmine, le café, l\'école, le souk, la plage, la ferme, et les maisons d\'Essil, Salma et Amine. Ma maison : meuble et décore librement.'],
        ['En ligne', 'Va chez les autres, « 📣 Viens voir ! », discute, échange des objets (les deux doivent être d\'accord).']] },
    'les-ecuries': { titre:'Les Écuries', bref:['🎯 Occupe-toi de tes chevaux et gagne des concours.', '🧽 Pansage, foin, eau, pré : tes chevaux doivent être propres, nourris et contents.', '💡 Les leçons du club-house rapportent des pièces pour acheter chevaux et matériel.'],
      detail:[['Le club-house', 'Le filet et la selle, les robes et les races, le pansage : une leçon puis un quiz (5 pièces par bonne réponse).'],
        ['Nos écuries', 'Le pansage se fait une fois par jour : quand il est fini, ton cheval reste propre toute la journée (après un concours, juste un coup de couteau de chaleur). Chaque tache demande le bon outil. Nourrir, donner à boire, équiper.'],
        ['Son box', 'Le bouton « 🎀 Son box » ou la sellerie, onglet « Les boxes » : un abreuvoir automatique (il n\'a jamais soif), une balle de foin (il n\'a jamais trop faim), et des décorations : plaque dorée, fanions, fleurs, jasmin, lanterne, kilim, fer porte-bonheur, couverture. Les flots gagnés en concours s\'accrochent tout seuls.'],
        ['Les prés', 'Hamza, le palefrenier, emmène tes chevaux au pré : 3 chevaux au plus par pré. Son tableau montre qui est où. Au pré, le moral remonte tout seul ; quand tu soignes un cheval ou qu\'il part en concours, il revient à l\'écurie.'],
        ['Les concours', 'CSO, cross, dressage, course, hunter, western, et les galops 1 à 7. Les obstacles sont décorés : fleurs, zellige, jarres, palmiers, kilims.'],
        ['Concours entre nous', 'En ligne : crée un concours, invite ta sœur ou ton frère (ou donne le code), choisis l\'épreuve et partez tous en même temps, chacun avec son cheval. Pendant le parcours, un tableau montre où en sont les autres (et leurs points sur la carte). À la fin : le podium, et 50, 30 ou 20 pièces pour les trois premiers.']] },
    'serpent-legendes': { titre:'Serpent Légendes', bref:['🎯 Mange les pommes pour grandir sans te cogner.', '👆 Glisse le doigt (vue de dessus) ou touche à gauche / à droite (vue derrière le serpent).', '💡 Les pommes d\'or valent 10 pièces ; le coffre mystère coûte 30 pièces.'],
      detail:[['Les niveaux', 'Facile (on ressort de l\'autre côté), Normal (rochers), Expert (rapide).'],
        ['Les skins', 'Coffres, défis légendaires, Boutique du savoir (tickets gagnés dans les cours), cartes brillantes, mythiques et secrètes.'],
        ['La variante en ligne', 'Le bouton « 🌍 Serpent en ligne » : l\'arène où l\'on joue à plusieurs (voir son aide).']] },
    'serpent-arene': { titre:'L\'Arène des serpents', bref:['🎯 Mange les perles lumineuses du riad pour grandir et deviens le plus long serpent de l\'arène.', '💥 Touche la TÊTE d\'un serpent ennemi avec ta tête : il se transforme en perles ! Mais si ta tête touche le reste de son corps (ou le mur), c\'est toi qui perds ; et si un autre fonce dans ton corps, c\'est lui qui perd.', '💡 Le bouton BOOST fonce plus vite mais te fait perdre un peu de longueur : sers-t\'en pour passer devant un autre serpent.'],
      detail:[['Les commandes', 'Tablette : le rond en bas à gauche pour diriger (ou pose le doigt n\'importe où), le bouton BOOST en bas à droite. Ordinateur : les flèches du clavier pour diriger (deux à la fois pour les diagonales) ou la souris ; barre d\'espace (ou clic) pour le boost ; Échap pour la pause.'],
        ['Les modes', 'Tranquille : des serpents gentils, et si tu te cognes tu repars tout de suite (parfait pour Amine). Champion : 25 serpents rusés et une seule vie.'],
        ['Jouer ensemble', '« Jouer ensemble » : crée une partie et invite ton frère ou ta sœur (ou donne-leur le code à 4 lettres). Le créateur choisit la durée (3, 5 ou 10 min) et le nombre de serpents de la machine. On renaît toujours ; à la fin, le plus long serpent gagne.'],
        ['Ton serpent', 'Choisis une tête (fennec, chameau, chat… ou la tête d\'Essil, Salma, Amine, papa ou maman) et un corps (fourrures, zellige, jasmin, harissa…).'],
        ['Les missions', 'Des têtes se gagnent : 10 parties → le lion, 1 000 perles → le flamant, 3 serpents dans une partie → le poulpe, 5 minutes en vie → le guépard, une longueur de 1 000 → le hibou, 20 serpents → le dragon, 2 500 → le tigre blanc.'],
        ['La voix', 'Le bouton 🗣️ du menu choisit le commentaire : en arabe, en français ou sans voix.']] },
    'ludo-legendes': { titre:'Ludo Légendes', bref:['🎯 Fais le tour du plateau et ramène tous tes pions au centre avant les autres.', '🎲 Un 6 pour sortir un pion ; on rejoue après un 6.', '💡 Sur une étoile ou une case de départ, ton pion ne peut pas être renvoyé.'],
      detail:[['Les règles', 'Un pion capturé retourne à la maison. Il faut le compte exact pour arriver. 10 secondes pour jouer, sinon l\'ordinateur joue à ta place.'],
        ['En ligne', 'Crée une partie, invite (salon, code ou lien) ; l\'ordinateur remplace celui qui part.']] },
    'grimpe-glace': { titre:'Grimpe-Glace', bref:['🎯 Grimpe le plus haut possible dans la tour de glace, avant que l\'écran te rattrape.', '👆 ◀ ▶ pour courir : le héros saute tout seul au bord des plateformes.', '💡 Prends de l\'élan : plus tu cours vite, plus tu sautes haut (combos !).'],
      detail:[['Les plateformes', 'Glace (ça glisse), mobiles, fragiles, champignons-ressorts. Un nouveau monde tous les 50 étages.'],
        ['Les combos', 'Enchaîne des sauts de 2 étages ou plus pour gagner beaucoup de points.']] },
    'medina-express': { titre:'Médina Express', bref:['🎯 Cours le plus loin possible dans la médina et le long du TGM.', '👆 Glisse ← → pour changer de voie, ↑ pour sauter, ↓ pour glisser dessous.', '💡 Ramasse les pièces pour acheter des tenues ; le tapis volant passe au-dessus de tout.'],
      detail:[['Les modes', '🐢 Tranquille (3 cœurs) ou 🐆 Champion (une vie, de plus en plus vite, des trains qui foncent).'],
        ['Les bonus', '🧲 aimant, 🛡️ bouclier, 🥿 super babouches, ×2, 🪄 tapis volant.']] },
    'legende-du-jasmin-3': { titre:'La Légende du Jasmin', bref:['🎯 Traverse la Tunisie monde après monde et trouve les 3 jasmins dorés de chaque monde.', '🎮 Croix à gauche, A pour sauter, B pour courir ou lancer la harissa.', '💡 Saute sous les blocs 📚 : bonne réponse = tickets pour la Boutique du savoir.'],
      detail:[['Les dangers', 'Trous, eau, pics, ennemis (saute-leur dessus). Les lanternes 🏮 gardent ta place.'],
        ['Les secrets', 'Un bloc invisible ❤️ (une vie), une jarre magique vers une salle secrète, une maison au faux mur. Les dinars achètent des tenues.'],
        ['Les mondes', '27 mondes en images réalistes, du village de Sidi Bou Saïd au palais du Scorpion d\'Or.']] },
    'legende-du-jasmin-2': { titre:'La Légende du Jasmin 2', bref:['🎯 La même aventure que le Jasmin, avec les héros dessinés « en vrai ».', '🎮 Croix à gauche, A pour sauter, B pour courir.', '💡 Mêmes sauvegardes que le Jasmin 3.'], detail:[['À savoir', 'Le Jasmin 2 est gardé tel quel ; les nouveaux mondes sont dans le Jasmin (version 3) et le Stage 2.']] },
    'legende-du-jasmin': { titre:'La Légende du Jasmin (ancienne)', bref:['🎯 La toute première version du Jasmin.', '🎮 Croix à gauche, A pour sauter, B pour courir.'], detail:[['À savoir', 'Gardée en souvenir ; joue plutôt au Jasmin (version 3).']] },
    'atelier-du-jasmin': { titre:'L\'Atelier du Jasmin', bref:['🎯 Colorie les paysages de Tunisie, les costumes et les animaux, en 2D ou en 3D.', '👆 Choisis une couleur, touche une zone : elle se remplit.', '💡 Le bouton 🌈 montre un modèle en couleur ; 🧩 en fait un puzzle !'],
      detail:[['Les outils', 'Couleurs, motifs, dégradé, crayon et feutre, tampons, gomme, loupe, annuler.'],
        ['Mon serpent', 'Invente un skin pour Serpent Légendes (« 🎨 Ma création »).'],
        ['La carte', '🖨️ imprime ou envoie ton dessin avec un petit mot.']] },
    'serpentin': { titre:'Serpentin', bref:['🎯 Mange les bonbons pour grandir sans te cogner.', '👆 Glisse le doigt dans la direction où le serpent doit aller.', '💡 Choisis la tortue pour aller doucement.'], detail:[['Les mondes', 'Dragon, Usine à jouets, Halloween, Espace ; le mode « Les chiffres » fait manger les nombres dans l\'ordre.']] },
    'la-nuit-d-amine': { titre:'La Nuit d\'Amine', bref:['🎯 Des petits jeux d\'Halloween : mémoire, compter, couleurs, suites.', '👆 Écoute la consigne et touche la bonne réponse.'], detail:[['Les bonbons', 'Chaque jeu réussi remplit la cagnotte de bonbons.']] },
    'la-nuit-d-amine-2': { titre:'La Nuit d\'Amine 2', bref:['🎯 Mémoire, compter jusqu\'à 20, additions, comparer, et l\'histoire « Où est passé Minuit ? ».', '👆 Écoute la consigne et touche la bonne réponse.'], detail:[['Les bonbons', 'Chaque jeu réussi remplit la cagnotte de bonbons.']] },
    'concours-vrai': { titre:'Concours en vrai', bref:['🎯 Un parcours de CSO de 6 obstacles, le plus vite possible et sans faute.', '🐎 Choisis trot ou galop ; touche « Saute ! » quand le bouton devient vert.', '💡 Trop tôt ou trop tard : la barre tombe (4 points).'], detail:[['Les versions', 'A le cheval filmé, B le cheval des Écuries dans le décor en vrai, C un cheval 3D en vrai.']] },
    'concours-epreuves': { titre:'Les épreuves en vrai', bref:['🎯 Cross, hunter, dressage, course de galop et western dans un décor en vrai.', '🐎 Choisis l\'allure ; touche « Saute ! » au bon moment (bouton vert).', '💡 En course, garde du souffle pour « Pousse ! » à la fin.'], detail:[['Les épreuves', 'Cross (obstacles naturels), hunter (note de style), dressage (suis la reprise de lettre en lettre), course (3 adversaires, barre de souffle), western (fais le tour des tonneaux sans les faire tomber).']] }
  };
  const p = location.pathname, cle = (p.match(/([\w-]+)\.html$/) || [])[1] || '';
  const A = AIDES[cle]; if(!A) return;
  const css = document.createElement('style');
  css.textContent = `
#aideBt{position:fixed;right:max(4px,env(safe-area-inset-right));top:42%;z-index:2147480000;width:44px;height:44px;border-radius:50%;border:2px solid #fff;background:#1f3c88cc;color:#fff;font:800 22px/1 Nunito,system-ui,sans-serif;display:grid;place-items:center;cursor:pointer;box-shadow:0 3px 10px #0006;touch-action:none;-webkit-user-select:none;user-select:none;opacity:.8}
#aideBt:hover{opacity:1}
#aideFond{position:fixed;inset:0;z-index:2147480001;background:#0b1024b3;display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box}
#aideFond.on{display:flex}
#aideBoite{background:#fffdf7;color:#1b1530;border-radius:24px;width:min(560px,100%);max-height:calc(100dvh - 28px);overflow:auto;padding:18px 18px 14px;box-sizing:border-box;font:600 16px/1.5 Nunito,system-ui,sans-serif;box-shadow:0 10px 0 #0003}
#aideBoite h2{margin:0 0 8px;font:800 24px/1.2 "Bricolage Grotesque",Nunito,sans-serif}
#aideBoite .bref p{margin:6px 0;background:#f1eefc;border-radius:14px;padding:8px 12px}
#aideBoite details{margin:8px 0;background:#f5f7fb;border-radius:14px;padding:8px 12px}
#aideBoite summary{cursor:pointer;font-weight:800}
#aideBoite .bts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
#aideBoite button{min-height:46px;border:0;border-radius:14px;font:800 16px Nunito,system-ui,sans-serif;padding:0 16px;cursor:pointer}
#aideBoite .ok{background:#1f3c88;color:#fff;flex:1}
#aideBoite .ecoute{background:#ffe9a8;color:#3a2600}
.anisBadge{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,#0f766e,#1f3c88);color:#fff;border-radius:999px;padding:5px 16px 5px 5px;font:800 14px/1.2 Nunito,system-ui,sans-serif;box-shadow:0 4px 14px #0005;text-decoration:none}
.anisBadge .av{width:46px;height:46px;border-radius:50%;flex:none;background:#fff center/cover no-repeat;border:2px solid #fff;position:relative;overflow:hidden}
.anisBadge .av i{position:absolute;inset:-2px;display:none;background-repeat:no-repeat}
.anisBadge:hover .av i,.anisBadge.danse .av i{display:block;animation:anisDanse 1.1s steps(12) infinite}
.anisBadge:hover .av,.anisBadge.danse .av{background-image:none!important;background-color:#dff3ee}
.anisBadge small{display:block;font-weight:700;opacity:.85;font-size:11px}
#anisSplash{position:fixed;left:50%;top:calc(66px + env(safe-area-inset-top));transform:translateX(-50%);z-index:2147479999;transition:opacity .6s,transform .6s}
#anisSplash.part{opacity:0;transform:translate(-50%,-30px);pointer-events:none}
@keyframes anisDanse{to{background-position-x:var(--fin)}}
@media (prefers-reduced-motion:reduce){.anisBadge .av i{animation:none!important}}`;
  document.head.appendChild(css);
  // le héros de papa qui danse : planche 12 × 6 (ligne 6 = danse), cases 102 × 183
  function badge(){
    const a = document.createElement('span'); a.className = 'anisBadge'; a.tabIndex = 0;
    const h = 46, k = h * 1.25 / 183, W = 1224 * k, H = 1098 * k;
    a.innerHTML = `<span class="av" style="background-image:url(/jeux/avatars/anis.webp)"><i style="background-image:url(/jeux/stage2/heros/anis.webp?v=3);background-size:${W}px ${H}px;background-position:${(h - 102 * k) / 2 + 2}px ${-5 * 183 * k - 6}px;--fin:${(h - 102 * k) / 2 + 2 - W}px"></i></span><span>Jeu propulsé par<br>Anis Missaoui</span>`;
    a.addEventListener('touchstart', () => { a.classList.toggle('danse'); }, { passive:true });
    return a; }
  function pose(){
    if(!document.body){ setTimeout(pose, 60); return; }
    const bt = document.createElement('button'); bt.id = 'aideBt'; bt.type = 'button'; bt.textContent = '?'; bt.setAttribute('aria-label', 'Aide du jeu');
    const fond = document.createElement('div'); fond.id = 'aideFond'; fond.setAttribute('role', 'dialog'); fond.setAttribute('aria-modal', 'true');
    fond.innerHTML = `<div id="aideBoite"><h2></h2><div class="bref"></div><div class="det"></div><div class="sig" style="margin-top:12px"></div><div class="bts"><button class="ecoute" type="button">🔊 Écouter</button><button class="ok" type="button">J'ai compris !</button></div></div>`;
    fond.querySelector('h2').textContent = '❔ ' + A.titre;
    A.bref.forEach(t => { const q = document.createElement('p'); q.textContent = t; fond.querySelector('.bref').appendChild(q); });
    const det = document.createElement('details'); det.innerHTML = '<summary>📖 En détail</summary>';
    A.detail.forEach(([t, x]) => { const b = document.createElement('p'); b.innerHTML = '<b></b> '; b.querySelector('b').textContent = t + ' :'; b.appendChild(document.createTextNode(x)); det.appendChild(b); });
    fond.querySelector('.det').appendChild(det); fond.querySelector('.sig').appendChild(badge());
    document.body.appendChild(bt); document.body.appendChild(fond);
      const ouvre = () => { try{ window.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true })); }catch(e){} fond.classList.add('on'); };   // Échap met la plupart des jeux en pause
    const ferme = () => { fond.classList.remove('on'); try{ speechSynthesis.cancel(); }catch(e){} };
    fond.querySelector('.ok').onclick = ferme; fond.onclick = e => { if(e.target === fond) ferme(); };
    fond.querySelector('.ecoute').onclick = () => { try{ speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(A.bref.map(t => t.replace(/[^\p{L}\p{N}\s,.'!?:;«»()-]/gu, '')).join(' ')); u.lang = 'fr-FR'; speechSynthesis.speak(u); }catch(e){} };
    addEventListener('keydown', e => { if(e.key === 'Escape' && fond.classList.contains('on')){ e.stopPropagation(); ferme(); } }, true);
    // le bouton ❔ se déplace au doigt (il ne doit jamais gêner le jeu) ; un toucher court ouvre l'aide
    let d = null;
    bt.addEventListener('pointerdown', e => { d = { x:e.clientX, y:e.clientY, t:bt.getBoundingClientRect().top, b:false }; bt.setPointerCapture(e.pointerId); e.stopPropagation(); });
    bt.addEventListener('pointermove', e => { if(!d) return; if(Math.abs(e.clientY - d.y) > 6) d.b = true; if(d.b){ bt.style.top = Math.max(4, Math.min(innerHeight - 48, d.t + e.clientY - d.y)) + 'px'; } });
    bt.addEventListener('pointerup', e => { e.stopPropagation(); if(d && !d.b) ouvre(); else try{ sessionStorage.setItem('aide-pos', bt.style.top); }catch(x){} d = null; });
    try{ const s = sessionStorage.getItem('aide-pos'); if(s) bt.style.top = s; }catch(e){}
    // le badge au début, quelques secondes
    const sp = document.createElement('div'); sp.id = 'anisSplash'; sp.appendChild(badge()); document.body.appendChild(sp);
    setTimeout(() => sp.classList.add('part'), 5200); setTimeout(() => sp.remove(), 6000);
    window.__aideJeu = { ouvre, ferme, A };
  }
  pose();
})();
