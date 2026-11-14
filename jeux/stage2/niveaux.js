/* La Légende du Jasmin — Stage 2 (14-15/11/2026, demandé par le papa) : les réglages et les mondes.
   Tout ce qui se règle est ici : la physique du héros, les ennemis, les objets, les difficultés, et la liste des mondes.
   Les cartes sont dans cartes/m<n>.js (une lettre = une case de 32 px), fabriquées par docs/stage2/cartes.py
   et vérifiées par docs/stage2/verifie.py (on ne doit jamais rester coincé) :

   .  vide                 #  mur / sol            =  planche (on passe dessous, on se pose dessus)
   H  échelle              ^  piquants (cactus, oursins… selon le monde)
   B  mur fissuré (une caisse, une pierre ou un sac lancé le casse)     F  faux mur (on passe à travers)
   G  grille (s'ouvre avec le levier le plus proche)     D  porte fermée à clé (on la touche en portant la clé)
   I  sol glissant (mosaïque cirée, quai mouillé, huile)   Y  sable mou (on va moins vite, on saute moins haut)
   W  eau (on y tombe : un cœur en moins, on revient au bord)   X  tuile qui s'effondre (elle revient après)
   U  rebond (auvent, pile de tapis : on rebondit très haut)   T  passage secret (rester accroupi ▼ dessus : on ressort au T suivant)
   R  rocher qui tombe du plafond quand on passe dessous
   @  départ    E  sortie    c  lanterne (point de reprise)    !  panneau (conseil, lu à voix haute)
   $  dinar     *  jasmin d'or (3 par monde)
   C  caisse    J  jarre     O  ballon    P  pierre    S  sac    K  clé    L  levier (sur le mur du fond)
   M  plateforme qui va et vient    V  plateforme qui monte et descend    Q  train / grand bateau (long, va loin)
   N  scooter (on monte dessus en le touchant)    A  tapis volant (idem ; ↓ + Espace pour descendre)
   g  garde qui patrouille   r  garde qui poursuit   d  chien   l  marchand qui lance des oranges
   z  chat qui dort   m  oiseau qui pique (mouette, faucon…)   b  chauve-souris   s  scorpion   x  crabe
   a  rat   n  serpent caché dans le sable   p  voleur (il prend des dinars)   t  contrôleur   h  chèvre qui fonce
   w  boss : le Crabe géant     y  boss : le Scorpion d'Or */

window.S2 = {
  // la physique (pixels et secondes). Le saut monte d'environ 3,5 cases : un mur de 4 cases demande une caisse ou une échelle.
  PH: { marche:190, course:250, acc:1500, accAir:1000, frein:1800, g:1200, gTenu:1150, gCoupe:2600, gChute:1700, saut:505, chuteMax:650,
        coyote:.1, tampon:.14, echelle:130, rampe:85, lourd:.7, sautLourd:.88, pousse:75, rebond:720, rebondFort:880,
        scooter:300, tapis:230, passage:.6 },
  T: 32, HW: 10, HH: 40, HHbas: 22,

  // les ennemis : type de comportement, vitesse (px/s), vue (cases), dégâts (cœurs), étourdi (s), coups pour le chasser, image (sp)
  ENNEMIS: {
    g: { nom:'garde', type:'patrouille', vit:55, chasse:0, vue:5, deg:1, etourdi:3, pv:2, sp:'garde', taille:[18, 62] },
    r: { nom:'garde', type:'patrouille', vit:60, chasse:120, vue:6, abandon:10, deg:1, etourdi:2.5, pv:2, sp:'garde', taille:[18, 62] },
    d: { nom:'chien', type:'patrouille', vit:70, chasse:190, vue:7, abandon:12, deg:1, etourdi:2.5, pv:1, bond:true, sp:'chien', taille:[26, 34] },
    l: { nom:'marchand', type:'tireur', vit:0, vue:9, deg:1, etourdi:3, pv:2, tir:2.2, proj:'orange', sp:'marchand', taille:[18, 60] },
    z: { nom:'chat', type:'patrouille', vit:0, chasse:170, vue:5, deg:1, etourdi:2, pv:1, dort:true, sp:'chat', taille:[24, 26] },
    m: { nom:'oiseau', type:'vol', vit:70, vue:6, deg:1, etourdi:2, pv:1, sp:'mouette', taille:[30, 22] },
    b: { nom:'chauve-souris', type:'vol', suspendu:true, vit:80, vue:4, deg:1, etourdi:2, pv:1, sp:'chauve', taille:[28, 20] },
    s: { nom:'scorpion', type:'patrouille', vit:65, chasse:120, vue:4, abandon:8, deg:1, etourdi:2, pv:1, sp:'scorpion', taille:[28, 20] },
    x: { nom:'crabe', type:'patrouille', vit:55, chasse:105, vue:4, abandon:8, deg:1, etourdi:2, pv:1, sp:'crabe', taille:[30, 20] },
    a: { nom:'rat', type:'patrouille', vit:100, chasse:160, vue:5, abandon:9, deg:1, etourdi:2, pv:1, sp:'rat', taille:[26, 16] },
    n: { nom:'serpent', type:'serpent', vit:0, vue:2.5, deg:1, etourdi:2, pv:1, sp:'serpent', taille:[30, 30] },
    p: { nom:'voleur', type:'voleur', vit:80, chasse:200, vue:7, abandon:12, deg:0, etourdi:2.5, pv:1, sp:'voleur', taille:[18, 58] },
    t: { nom:'contrôleur', type:'patrouille', vit:60, chasse:150, vue:7, abandon:11, deg:1, etourdi:2.5, pv:2, sp:'controleur', taille:[18, 62] },
    h: { nom:'chèvre', type:'chevre', vit:40, charge:340, vue:7, deg:1, etourdi:2, pv:2, sp:'chevre', taille:[34, 32] },
    w: { nom:'le Crabe géant', type:'boss', vit:55, charge:280, vue:12, deg:1, etourdi:2.5, pv:4, proj:'bulle', sp:'crabe', grand:3, taille:[92, 52] },
    y: { nom:'le Scorpion d’Or', type:'boss', vit:60, charge:300, vue:14, deg:1, etourdi:2.5, pv:5, proj:'braise', sp:'scorpionor', taille:[100, 92] }
  },
  // les objets : lourd = plus lent et casse les murs fissurés ; casse = se brise en tombant ; rebond = rebondit
  OBJETS: {
    C: { nom:'caisse', lourd:true, solide:true, casseMur:true, lance:[300, -200] },
    J: { nom:'jarre', casse:true, lance:[380, -240] },
    O: { nom:'ballon', rebond:.62, lance:[420, -300] },
    P: { nom:'pierre', casseMur:true, lance:[400, -230], petit:true },
    S: { nom:'sac', lourd:true, casseMur:true, lance:[320, -200] },
    K: { nom:'clé', cle:true, lance:[300, -220], petit:true }
  },
  // les difficultés (choisies au départ) : ennemis gardés, vitesse des ennemis, points de vie, vies, force des boss
  DIFF: {
    facile: { nom:'Facile', ic:'🌼', garde:.5, vit:.75, coeurs:6, vies:5, boss:3 },
    normal: { nom:'Normal', ic:'⭐', garde:.8, vit:.9, coeurs:5, vies:3, boss:4 },
    difficile: { nom:'Difficile', ic:'🔥', garde:1, vit:1.1, coeurs:4, vies:3, boss:5 }
  },

  /* les 10 mondes. img = les images propres au monde (dossier m<n>/ ; ce qui manque est pris dans m1/),
     sombre = il fait noir (on voit autour du héros et des lanternes), sprites = images d'ennemis propres au monde,
     plat = plateformes mobiles (dist en cases, vit), platImg = image des plateformes (barque…), ciel = dégradé */
  MONDES: [
    { n:1, nom:'Les ruelles de la médina', lieu:'Tunis', pret:true,
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_fissure', 'caisse', 'ballon', 'pierre', 'cle', 'levier', 'grille', 'porte_verrou', 'porte_sortie', 'echelle', 'sac'],
      histoire:"La caravane du Scorpion d'Or a caché les jasmins dorés dans toute la Tunisie ! Tout commence dans les ruelles de la médina de Tunis : apprends à porter, lancer et grimper.",
      panneaux:[
        '← → pour marcher, ↑ pour sauter. ↑ avec ← ou → : saut en avançant.',
        'Accroupis-toi (↓) et appuie sur Espace pour ramasser la jarre. Puis Espace : tu la lances sur le chat !',
        'Ce mur est trop haut… Pousse la caisse contre le mur, puis grimpe dessus.',
        'Devant l’échelle : ↑ pour monter, ↓ pour descendre, ← ou → pour la lâcher.',
        'Le levier ouvre la grille : monte sur les planches et lance-lui le ballon, ou mets-toi devant et appuie sur Espace.',
        '↓ avec ← ou → : tu rampes sous l’étal du souk.',
        'Ce mur est fissuré… Ramasse la pierre (↓ + Espace) et lance-la (Espace) !',
        'La porte est fermée à clé : la clé est sur le toit de la maison. Il y a une échelle de chaque côté.'
      ] },
    { n:2, nom:'Les toits de la médina', lieu:'Tunis', pret:true, ciel:['#f6a35c', '#fde3b8'],
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_effondre', 't_rebond', 'pic'],
      histoire:"Un voleur file sur les toits avec un jasmin d'or ! Saute d'une terrasse à l'autre, rebondis sur les auvents… et attention aux tuiles qui s'écroulent.",
      panneaux:[
        'Saute de toit en toit ! Si tu tombes dans la ruelle, une échelle te ramène sur les toits.',
        'Les tuiles rouges qui tremblent vont tomber : ne reste pas dessus !',
        'L’auvent rayé fait rebondir très haut. Garde ↑ appuyé pour rebondir encore plus haut.',
        'Regarde en l’air : un jasmin d’or ! Et attention au voleur sur le toit d’en face.',
        'Le voleur prend tes dinars ! Saute-lui dessus ou lance-lui un objet pour les récupérer.',
        'Accroupis-toi (↓) sur la petite porte et reste baissé : c’est un passage secret.',
        'Le levier ouvre la grille : mets-toi devant et appuie sur Espace.',
        'Plus que quelques toits : la sortie est tout au bout. Rebondis sur l’auvent pour les dinars !'
      ] },
    { n:3, nom:'Le TGM et le métro léger', lieu:'Tunis', pret:true, ciel:['#7fc4f0', '#e8f4ff'],
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 'pic', 'train'], plat:{ dist:5, vit:.9 },
      histoire:"Le jasmin suivant est parti vers La Marsa… Prends le TGM, traverse la gare, et file sur le scooter le long de la mer !",
      panneaux:[
        'Le train va et vient : saute dessus quand il arrive, il t’emmène de l’autre côté.',
        'Le contrôleur te poursuit ! Saute-lui dessus, ou ramasse le sac (↓ + Espace) et lance-le (Espace).',
        'Le scooter ! Touche-le pour monter. → pour accélérer, ← pour freiner, ↑ pour sauter les plots.',
        'Pour descendre du scooter : ↓ + Espace.',
        'Encore un train à prendre, puis la sortie.'
      ] },
    { n:4, nom:'Les citernes de Carthage', lieu:'Carthage', pret:true, sombre:true, ciel:['#1b2433', '#3a4a5c'],
      img:['fond', 't_mur', 't_dessus', 't_planche', 't_glisse', 't_eau', 'pic'], sprites:{},
      histoire:"Sous Carthage dorment d'immenses citernes romaines pleines d'eau. Il fait noir : allume les lanternes, et ne glisse pas sur les pierres mouillées !",
      panneaux:[
        'Il fait noir ! Chaque lanterne allumée éclaire la citerne et sert de point de reprise.',
        'Les pierres mouillées glissent : avance doucement.',
        'Ne tombe pas dans l’eau : tu perds un peu de vie et tu reviens au bord.',
        'Les chauves-souris dorment au plafond : elles se réveillent quand tu passes dessous.',
        'Un mur fissuré… et justement, voilà une pierre.'
      ] },
    { n:5, nom:'Les catacombes de Sousse', lieu:'Sousse', pret:true, sombre:true, ciel:['#120d0a', '#2b2018'],
      img:['fond', 't_mur', 't_dessus', 't_planche', 't_effondre', 'pic'],
      histoire:"Sous la ville de Sousse, des kilomètres de galeries anciennes. Des rochers tombent du plafond, des passages secrets se cachent partout…",
      panneaux:[
        'Quand le plafond tremble, un rocher va tomber : passe vite !',
        'Les pierres du sol qui tremblent vont s’effondrer… et tu tomberas dans la galerie du dessous.',
        'Les rats courent vite : saute-leur dessus.',
        'Accroupis-toi sur la petite porte et reste baissé : un passage secret.',
        'La porte est fermée à clé : la clé est cachée dans une salle secrète de la galerie du milieu.'
      ] },
    { n:6, nom:'Le port de La Goulette', lieu:'La Goulette', pret:true, ciel:['#5fb7e8', '#dff3ff'], plat:{ dist:5, vit:.7 }, platImg:'barque',
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_glisse', 't_eau', 'pic'],
      histoire:"Au vieux port de La Goulette, le Crabe géant garde un jasmin d'or entre ses pinces. Saute de barque en barque… et attention au quai mouillé !",
      panneaux:[
        'Les barques bougent : saute dessus au bon moment.',
        'Le quai est mouillé, ça glisse !',
        'Les crabes marchent de côté : saute-leur dessus.',
        'Une petite porte au bout du quai… Accroupis-toi dessus et reste baissé !',
        'Le Crabe géant ! Lance-lui les jarres. Quand il est étourdi (★), saute-lui dessus.',
      ] },
    { n:7, nom:'Le village de Chenini', lieu:'Tataouine', pret:true, ciel:['#f2b766', '#fbe7c2'], sprites:{ m:'faucon' },
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_effondre', 'pic'],
      histoire:"Chenini, le village berbère accroché à la montagne. Grimpe d'étage en étage par les échelles des greniers, sans réveiller les chèvres…",
      panneaux:[
        'Les échelles mènent d’un étage à l’autre du village.',
        'La chèvre fonce quand elle te voit ! Écarte-toi : elle se cogne au mur et reste étourdie.',
        'Des cailloux tombent de la falaise quand tu passes dessous.',
        'Les pierres qui tremblent vont tomber.',
        'Le faucon pique sur toi : accroupis-toi ou lance-lui quelque chose.'
      ] },
    { n:8, nom:'Le Sahara de Douz', lieu:'Douz', pret:true, ciel:['#f7c873', '#fff1cf'], sprites:{ m:'faucon' },
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_sable', 'pic'],
      histoire:"Les grandes dunes de Douz, la porte du désert. Le sable mou te ralentit… heureusement, un tapis volant t'attend !",
      panneaux:[
        'Le sable mou te ralentit et tu sautes moins haut.',
        'Le serpent se cache dans le sable : il sort quand tu passes tout près !',
        'Le tapis volant ! Touche-le pour monter : ← → ↑ ↓ pour voler.',
        'Pour descendre du tapis : ↓ + Espace.',
        'Les scorpions du désert : saute-leur dessus.'
      ] },
    { n:9, nom:'Les souks de Kairouan', lieu:'Kairouan', pret:true, ciel:['#6aa8e0', '#f3e6cf'],
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_glisse', 't_rebond', 'pic'],
      histoire:"Dans les souks de Kairouan, la ville des tapis, les voleurs se cachent dans la foule et les marchands lancent leurs fruits…",
      panneaux:[
        'Les piles de tapis font rebondir très haut !',
        'De l’huile d’olive renversée : ça glisse !',
        'Le voleur prend tes dinars : rattrape-le !',
        'Les passages secrets relient les boutiques : accroupis-toi sur la petite porte.',
        'La clé de la grande porte est chez le marchand de tapis, tout en haut.'
      ] },
    { n:10, nom:'Le palais du Bardo', lieu:'Tunis', pret:true, ciel:['#3d6fb8', '#cfe0f5'],
      img:['fond', 'maisons', 't_mur', 't_dessus', 't_planche', 't_glisse', 'pic'],
      histoire:"Le Scorpion d'Or s'est caché au palais du Bardo, au milieu des plus belles mosaïques du monde. C'est le dernier combat !",
      panneaux:[
        'Les mosaïques sont cirées : ça glisse beaucoup !',
        'Les gardes du palais sont nombreux : sois malin.',
        'Le levier ouvre la grande grille du palais.',
        'Le Scorpion d’Or ! Lance-lui les jarres, et saute-lui dessus quand il est étourdi (★). Évite ses braises !'
      ] }
  ]
};
