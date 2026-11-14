/* La Légende du Jasmin — Stage 2 (14/11/2026, demandé par le papa) : les réglages et les mondes.
   Tout ce qui se règle est ici : la physique du héros, les ennemis, les objets, les difficultés, et la liste des mondes.
   Les cartes sont dans cartes/m<n>.js (une lettre = une case de 32 px) :

   .  vide                 #  mur / sol            =  planche (on passe dessous, on se pose dessus)
   H  échelle              ^  cactus (aïe)          B  mur fissuré (une caisse, une pierre ou un sac lancé le casse)
   F  faux mur (on passe à travers : passage secret) G  grille (s'ouvre avec le levier le plus proche)
   D  porte fermée à clé (s'ouvre si on la touche en portant la clé)
   @  départ    E  sortie    c  lanterne (point de reprise)    !  panneau (conseil, lu à voix haute)
   $  dinar     *  jasmin d'or (3 par monde)
   C  caisse    J  jarre     O  ballon    P  pierre    S  sac    K  clé    L  levier (sur le mur du fond)
   M  plateforme qui va et vient (horizontale)    V  plateforme qui monte et descend
   g  garde qui patrouille     r  garde qui poursuit     d  chien     l  marchand qui lance des oranges
   z  chat qui dort (se réveille au bruit)     m  mouette qui pique */

window.S2 = {
  // la physique (pixels et secondes). Le saut monte d'environ 3,5 cases : un mur de 4 cases demande une caisse ou une échelle.
  PH: { marche:180, course:260, acc:1500, accAir:1000, frein:1800, g:1200, gTenu:1150, gCoupe:2600, gChute:1700, saut:505, chuteMax:650,
        coyote:.1, tampon:.12, echelle:120, rampe:80, lourd:.65, sautLourd:.85, pousse:70 },
  T: 32, HW: 10, HH: 40, HHbas: 22,

  // les ennemis : vitesse (px/s), vue (cases), dégâts (cœurs), étourdi (s), coups pour le chasser
  ENNEMIS: {
    g: { nom:'garde', vit:55, chasse:0, vue:5, deg:1, etourdi:3, pv:2 },
    r: { nom:'garde', vit:60, chasse:120, vue:6, abandon:10, deg:1, etourdi:2.5, pv:2 },
    d: { nom:'chien', vit:70, chasse:190, vue:7, abandon:12, deg:1, etourdi:2.5, pv:1, bond:true },
    l: { nom:'marchand', vit:0, vue:9, deg:1, etourdi:3, pv:2, tir:2.2 },
    z: { nom:'chat', vit:0, chasse:170, vue:5, deg:1, etourdi:2, pv:1, dort:true },
    m: { nom:'mouette', vit:70, vue:6, deg:1, etourdi:2, pv:1, vole:true }
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
  // les difficultés (choisies au départ) : ennemis gardés, vitesse des ennemis, cœurs, vies
  DIFF: {
    facile: { nom:'Facile', ic:'🌼', garde:.5, vit:.75, coeurs:5, vies:5 },
    normal: { nom:'Normal', ic:'⭐', garde:.8, vit:.9, coeurs:4, vies:3 },
    difficile: { nom:'Difficile', ic:'🔥', garde:1, vit:1.1, coeurs:3, vies:3 }
  },

  // les 10 mondes du Stage 2 (seul le 1 est prêt ; les autres arrivent après l'avis des enfants)
  MONDES: [
    { n:1, nom:'Les ruelles de la médina', lieu:'Tunis', pret:true, amb:'amb-1',
      histoire:"La caravane du Scorpion d'Or a caché les jasmins dorés dans toute la Tunisie ! Tout commence dans les ruelles de la médina de Tunis : apprends à porter, lancer et grimper.",
      panneaux:[
        '◀ ▶ pour marcher, Espace (ou A) pour sauter.',
        'Prends la jarre (E ou ✋), puis lance-la (F ou 🎯) sur le chat qui dort !',
        'Ce mur est trop haut… Pousse la caisse ou porte-la (E), puis grimpe dessus.',
        '▲ et ▼ pour monter à l’échelle.',
        'Le levier ouvre la grille : lance-lui le ballon, ou grimpe sur les planches pour le tirer (E).',
        '▼ Accroupis-toi et rampe sous l’étal du souk.',
        'Ce mur est fissuré… Lance-lui la pierre !',
        'La porte est fermée à clé : la clé est sur le toit de la maison.'
      ] },
    { n:2, nom:'Les toits de la médina', lieu:'Tunis' },
    { n:3, nom:'Le TGM et le métro léger', lieu:'Tunis' },
    { n:4, nom:'Les citernes de Carthage', lieu:'Carthage' },
    { n:5, nom:'Les catacombes de Sousse', lieu:'Sousse' },
    { n:6, nom:'Le port de La Goulette', lieu:'La Goulette' },
    { n:7, nom:'Le village de Chenini', lieu:'Tataouine' },
    { n:8, nom:'Le Sahara de Douz', lieu:'Douz' },
    { n:9, nom:'Les souks de Kairouan', lieu:'Kairouan' },
    { n:10, nom:'Le palais du Bardo', lieu:'Tunis' }
  ]
};
