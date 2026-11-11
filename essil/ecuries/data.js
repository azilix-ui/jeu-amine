/* Les Écuries d'Essil — le contenu : parties du filet et de la selle, robes, races, pansage, chevaux, sellerie, concours. */

// Les points sont en % de l'image (x, y). Images : ecuries/img/filet.webp et selle.webp.
export const FILET = [
  { id:'tetiere', n:'La têtière', x:43, y:19, r:'Elle passe derrière les oreilles : c\'est elle qui porte tout le filet.' },
  { id:'frontal', n:'Le frontal', x:33, y:27.5, r:'Il passe devant le front et empêche la têtière de glisser vers l\'arrière.' },
  { id:'sousgorge', n:'La sous-gorge', x:45.5, y:48, r:'Elle passe sous la gorge et empêche le filet de passer par-dessus les oreilles. On laisse la place d\'un poing.' },
  { id:'montant', n:'Le montant', x:35.5, y:46, r:'Il relie la têtière au mors. C\'est lui qu\'on règle pour mettre le mors à la bonne hauteur.' },
  { id:'muserolle', n:'La muserolle', x:20, y:55.5, r:'Elle entoure le chanfrein et empêche le cheval d\'ouvrir trop grand la bouche. On doit pouvoir glisser deux doigts.' },
  { id:'mors', n:'Le mors', x:26.5, y:71, r:'Il est dans la bouche du cheval, posé sur les barres. Il transmet les demandes des mains du cavalier.' },
  { id:'renes', n:'Les rênes', x:66, y:85, r:'Elles relient le mors aux mains du cavalier : elles servent à diriger et à ralentir.' }
];
export let SELLE = [];   // rempli plus bas (positions réglées sur l'image)
export const setSelle = a => { SELLE = a; };

export const ROBES = [
  { id:'alezan', n:'Alezan', d:'Poils roux, crins et bas des jambes de la même couleur (jamais de noir).' },
  { id:'bai', n:'Bai', d:'Corps marron, mais crins, queue et bas des jambes noirs.' },
  { id:'noir', n:'Noir', d:'Tout noir : poils et crins.' },
  { id:'gris', n:'Gris', d:'Mélange de poils blancs et noirs. Ici gris pommelé : avec des ronds plus clairs. Le cheval gris blanchit en vieillissant.' },
  { id:'isabelle', n:'Isabelle', d:'Corps jaune sable, crins, queue et bas des jambes noirs.' },
  { id:'palomino', n:'Palomino', d:'Corps doré, crins et queue blancs (crins lavés).' },
  { id:'pie', n:'Pie', d:'De grandes taches blanches et de grandes taches d\'une autre couleur.' },
  { id:'tachete', n:'Tacheté', d:'Plein de petites taches sur le corps : c\'est la robe de l\'Appaloosa.' },
  { id:'rouan', n:'Rouan', d:'Mélange de poils blancs, roux et noirs sur le corps : il paraît rosé. La tête et les jambes restent foncées.' },
  { id:'creme', n:'Crème', d:'Poils et crins très clairs, presque blancs, peau rose et yeux souvent bleus.' }
];
export const RACES = [
  { id:'arabe', n:'Pur-sang arabe', o:'Arabie', d:'Petite tête au profil creux, queue portée haut. Très endurant : le champion des longues distances.' },
  { id:'pursang', n:'Pur-sang anglais', o:'Angleterre', d:'Grand, fin, de longues jambes : c\'est le cheval de course, le plus rapide au galop.' },
  { id:'sellefrancais', n:'Selle français', o:'France', d:'Grand cheval de sport, puissant : un champion du saut d\'obstacles (CSO).' },
  { id:'frison', n:'Frison', o:'Pays-Bas', d:'Toujours noir, crinière longue et ondulée, des fanons (poils) en bas des jambes. Très élégant en dressage et à l\'attelage.' },
  { id:'shetland', n:'Shetland', o:'Écosse', d:'Tout petit poney très costaud, crinière très épaisse. Le premier poney de beaucoup d\'enfants.' },
  { id:'camargue', n:'Camargue', o:'France', d:'Petit cheval gris clair qui vit dans les marais du sud de la France. Il naît foncé et devient blanc.' },
  { id:'percheron', n:'Percheron', o:'France', d:'Cheval de trait énorme et très fort, souvent gris pommelé. Il tirait les charrues et les diligences.' },
  { id:'connemara', n:'Connemara', o:'Irlande', d:'Poney de sport gentil et courageux, très bon sauteur. Souvent gris ou isabelle.' },
  { id:'haflinger', n:'Haflinger', o:'Autriche', d:'Petit cheval de montagne alezan aux crins blonds presque blancs (crins lavés).' },
  { id:'fjord', n:'Fjord', o:'Norvège', d:'Robe isabelle claire, crinière en brosse à deux couleurs : noire au milieu, blanche sur les côtés.' },
  { id:'barbe', n:'Barbe', o:'Afrique du Nord', d:'Le cheval du Maghreb, celui de la Tunisie : solide, sobre, courageux, la queue attachée bas. Le cheval de la fantasia.' },
  { id:'espagnol', n:'Pure race espagnole', o:'Espagne', d:'On l\'appelle aussi andalou. Encolure ronde, longue crinière ondulée : la star du dressage et des spectacles.' }
];

// Le pansage, dans l'ordre où on le fait.
export const OUTILS = [
  { id:'curepied', n:'Le cure-pied', ou:'Sous les 4 sabots', d:'On commence par là ! On enlève la terre et les cailloux, du talon vers la pince, sans toucher la fourchette (la partie en V, sensible).' },
  { id:'etrille', n:'L\'étrille', ou:'Le corps, là où il y a des muscles', d:'En caoutchouc. On frotte en faisant des ronds pour décoller la boue séchée et les poils morts. Jamais sur la tête ni sur les jambes : ça fait mal sur les os.' },
  { id:'bouchon', n:'Le bouchon', ou:'Le corps et les jambes', d:'Une brosse aux poils durs. On brosse dans le sens du poil, à petits coups secs, pour chasser la poussière que l\'étrille a décollée.' },
  { id:'brossedouce', n:'La brosse douce', ou:'Tout le corps, la tête aussi', d:'Des poils fins et souples. Elle enlève la poussière fine et fait briller le poil. C\'est la seule brosse pour la tête.' },
  { id:'eponge', n:'L\'éponge', ou:'Les yeux, les naseaux', d:'Humide et propre, pour nettoyer le coin des yeux et les naseaux. On en garde une autre pour sous la queue.' },
  { id:'peigne', n:'Le peigne', ou:'La crinière et la queue', d:'On démêle mèche par mèche, en commençant par le bas, sans tirer, pour ne pas casser les crins.' },
  { id:'graisse', n:'La graisse à pieds', ou:'Les sabots', d:'À la fin, au pinceau, sur des sabots propres et secs : elle nourrit la corne et l\'empêche de se fendre.' },
  { id:'couteau', n:'Le couteau de chaleur', ou:'Le corps mouillé', d:'Après la douche ou quand le cheval a beaucoup transpiré, il sert à racler l\'eau pour qu\'il sèche vite.' }
];
export const ORDRE = ['curepied', 'etrille', 'bouchon', 'brossedouce', 'eponge', 'peigne', 'graisse'];
export const PANSAGE_QCM = [
  { q:'Pourquoi fait-on le pansage avant de monter ?', a:'Pour que rien ne blesse le cheval sous la selle', o:['Pour que rien ne blesse le cheval sous la selle', 'Pour qu\'il coure plus vite', 'Pour le réveiller'], w:'De la boue ou un caillou sous la selle ou la sangle, ça fait une blessure. Et on en profite pour vérifier qu\'il va bien.' },
  { q:'Par quoi commence-t-on le pansage ?', a:'Curer les pieds', o:['Peigner la queue', 'Curer les pieds', 'Passer la brosse douce'], w:'Un caillou coincé dans le sabot peut faire boiter : on cure toujours les pieds d\'abord.' },
  { q:'Où ne passe-t-on jamais l\'étrille ?', a:'Sur la tête et les jambes', o:['Sur l\'épaule', 'Sur la croupe', 'Sur la tête et les jambes'], w:'Là où l\'os est juste sous la peau, l\'étrille fait mal.' },
  { q:'Dans quel sens cure-t-on un pied ?', a:'Du talon vers la pince', o:['De la pince vers le talon', 'Du talon vers la pince', 'En rond'], w:'Du talon vers la pince (vers l\'avant du sabot), pour ne pas se blesser ni blesser la fourchette.' },
  { q:'Comment passe-t-on derrière un cheval ?', a:'Tout près, la main sur sa croupe, en lui parlant', o:['En courant', 'Tout près, la main sur sa croupe, en lui parlant', 'En se baissant sous sa queue'], w:'Ou alors très loin. Tout près, s\'il tape, le coup n\'a pas d\'élan ; et il sait où on est.' },
  { q:'Quelle brosse pour la tête ?', a:'La brosse douce', o:['Le bouchon', 'L\'étrille', 'La brosse douce'], w:'La tête est fragile : seulement la brosse douce, et l\'éponge pour les yeux et les naseaux.' },
  { q:'Comment démêle-t-on la queue ?', a:'Mèche par mèche, en partant du bas', o:['D\'un grand coup de haut en bas', 'Mèche par mèche, en partant du bas', 'Avec l\'étrille'], w:'On tient la queue, on se place sur le côté, et on démêle doucement du bas vers le haut.' }
];
export const HARNAIS_QCM = [
  { q:'On règle la muserolle pour pouvoir glisser dessous…', a:'deux doigts', o:['un poing', 'deux doigts', 'rien du tout'], w:'Deux doigts : assez serrée pour tenir, pas trop pour qu\'il puisse respirer et mâcher.' },
  { q:'Et sous la sous-gorge ?', a:'un poing', o:['un poing', 'un doigt', 'les deux mains'], w:'Un poing : elle ne doit jamais serrer la gorge.' },
  { q:'De quel côté se met-on pour seller et pour monter ?', a:'À gauche du cheval', o:['À droite du cheval', 'À gauche du cheval', 'Derrière'], w:'Par tradition, on fait presque tout à gauche : mettre le filet, seller, sangler, monter.' },
  { q:'Qu\'est-ce qu\'on met en premier sur le dos ?', a:'Le tapis', o:['La selle', 'La sangle', 'Le tapis'], w:'Le tapis, puis l\'amortisseur si on en a un, puis la selle. On dégage bien le garrot.' },
  { q:'Quand resangle-t-on ?', a:'Avant de monter, puis après quelques minutes', o:['Jamais', 'Avant de monter, puis après quelques minutes', 'Seulement après le galop'], w:'Le cheval gonfle le ventre au début : on resangle avant de monter et après la détente.' },
  { q:'À quoi sert l\'amortisseur ?', a:'À protéger le dos du cheval sous la selle', o:['À faire joli', 'À protéger le dos du cheval sous la selle', 'À tenir les étriers'], w:'Il absorbe les chocs et répartit le poids de la selle et du cavalier.' },
  { q:'À quoi servent les guêtres et les cloches ?', a:'À protéger les jambes et les pieds', o:['À courir plus vite', 'À protéger les jambes et les pieds', 'À tenir chaud'], w:'Les guêtres protègent les tendons et les boulets ; les cloches protègent le bas du pied si le cheval se marche dessus.' },
  { q:'Le licol sert à…', a:'attacher et mener le cheval à pied', o:['monter à cheval', 'attacher et mener le cheval à pied', 'tenir la selle'], w:'Avec une longe. On n\'attache jamais un cheval par les rênes !' }
];

// Les robes en 3D : corps, crins, bas des jambes, motif.
export const COAT = {
  alezan:{ b:'#b4551f', m:'#a34a1a', l:'#a8501d' }, bai:{ b:'#7a4320', m:'#17120f', l:'#17120f' }, noir:{ b:'#1d1b1c', m:'#0e0d0e', l:'#151314' },
  gris:{ b:'#9fa3a8', m:'#d9dadc', l:'#5d6166', p:'pomme' }, blanc:{ b:'#e9e6df', m:'#f4f2ec', l:'#d6d2c9' }, isabelle:{ b:'#d9b56c', m:'#1b1612', l:'#1b1612' },
  palomino:{ b:'#e0a94a', m:'#f7efdc', l:'#d9a044' }, pie:{ b:'#f1ede4', m:'#f1ede4', l:'#f1ede4', p:'pie', c2:'#2a2321' }, tachete:{ b:'#eeeae2', m:'#e6e2da', l:'#ddd8ce', p:'taches', c2:'#2b2624' },
  cremelave:{ b:'#c9762f', m:'#f6ecd4', l:'#c06f2b' }, dun:{ b:'#dcc38e', m:'#2a2420', l:'#3a312a' }
};
// vitesse, saut, dressage, endurance : de 1 à 5
export const CHEVAUX = [
  { id:'noisette', n:'Noisette', race:'Connemara', robe:'isabelle', t:.86, s:[2, 3, 2, 3], prix:0, d:'Ta première ponette : gentille, courageuse, elle saute tout ce qu\'on lui montre.' },
  { id:'flocon', n:'Flocon', race:'Shetland', robe:'pie', t:.64, s:[1, 1, 2, 4], prix:150, d:'Tout petit, très malin et un peu gourmand.' },
  { id:'soleil', n:'Soleil', race:'Haflinger', robe:'cremelave', t:.84, s:[2, 2, 3, 3], prix:300, d:'Un amour de petit cheval de montagne aux crins blonds.' },
  { id:'ecume', n:'Écume', race:'Camargue', robe:'blanc', t:.84, s:[3, 2, 2, 4], prix:400, d:'Elle adore l\'eau : parfaite pour le gué du cross.' },
  { id:'vanille', n:'Vanille', race:'Fjord', robe:'dun', t:.84, s:[2, 2, 3, 4], prix:450, d:'Calme et sûre, avec sa crinière en brosse.' },
  { id:'sirocco', n:'Sirocco', race:'Barbe', robe:'gris', t:.92, s:[3, 3, 3, 5], prix:600, d:'Le cheval de Tunisie : infatigable, il ne lâche jamais.' },
  { id:'titan', n:'Titan', race:'Percheron', robe:'gris', t:1.16, s:[1, 2, 3, 5], prix:650, d:'Un géant très doux. Pas rapide, mais rien ne l\'arrête.' },
  { id:'domino', n:'Domino', race:'Appaloosa', robe:'tachete', t:.95, s:[4, 3, 2, 3], prix:800, d:'Rapide et rigolo avec ses taches de dalmatien.' },
  { id:'eclair', n:'Éclair', race:'Selle français', robe:'alezan', t:1.04, s:[4, 5, 3, 3], prix:1000, bal:2, liste:1, d:'Un champion du saut d\'obstacles : il passe les plus grosses barres.' },
  { id:'tonnerre', n:'Tonnerre', race:'Frison', robe:'noir', t:1.04, s:[2, 2, 5, 3], prix:1000, d:'Majestueux : les juges de dressage l\'adorent.' },
  { id:'tornade', n:'Tornade', race:'Pur-sang anglais', robe:'bai', t:1.06, s:[5, 4, 2, 3], prix:1200, d:'La plus rapide de l\'écurie : imbattable au chrono.' },
  { id:'jasmin', n:'Jasmin', race:'Pur-sang arabe', robe:'blanc', t:.94, s:[4, 3, 4, 5], prix:1300, d:'Fin, léger, endurant : le prince du désert.' },
  { id:'duende', n:'Duende', race:'Pure race espagnole', robe:'gris', t:1.0, s:[3, 3, 5, 4], prix:1400, d:'L\'artiste : chaque pas est une danse.' }
];
export const STATS = ['Vitesse', 'Saut', 'Dressage', 'Endurance'];

export const COULEURS = [['noir', 'Noir', '#1e1e24'], ['havane', 'Havane', '#5a3420'], ['cognac', 'Cognac', '#a8622a'], ['marine', 'Bleu marine', '#1f3c88'], ['ciel', 'Bleu ciel', '#58b6e8'], ['turquoise', 'Turquoise', '#19b3a6'],
  ['vert', 'Vert sapin', '#1f7a4d'], ['rouge', 'Rouge', '#d7263d'], ['rose', 'Rose', '#ff6fa8'], ['violet', 'Violet', '#8a4fd8'], ['jaune', 'Jaune', '#ffc928'], ['blanc', 'Blanc', '#f4f1ea']];
export const HEX = Object.fromEntries(COULEURS.map(c => [c[0], c[2]]));
const TOUT = COULEURS.map(c => c[0]), CUIR = ['havane', 'noir', 'cognac'];
export const RAYONS = [
  { id:'licol', n:'Licol', ic:'🪢', prix:40, cols:TOUT, d:'Pour attacher et mener ton cheval à l\'écurie.' },
  { id:'filet', n:'Filet', ic:'🎗️', prix:120, cols:CUIR, d:'Pour monter : têtière, frontal, montants, muserolle, mors et rênes.' },
  { id:'selle', n:'Selle', ic:'💺', prix:200, cols:CUIR, d:'En cuir, avec ses étriers et sa sangle.' },
  { id:'tapis', n:'Tapis de selle', ic:'🟦', prix:60, cols:TOUT, d:'Sous la selle : il protège le dos et boit la transpiration.' },
  { id:'amortisseur', n:'Amortisseur', ic:'☁️', prix:50, cols:TOUT, d:'Entre le tapis et la selle : il amortit les chocs.' },
  { id:'guetres', n:'Guêtres', ic:'🦵', prix:70, cols:TOUT, d:'Les jambières : elles protègent les tendons.' },
  { id:'cloches', n:'Cloches', ic:'🔔', prix:40, cols:TOUT, d:'Sur les pieds de devant : elles protègent les talons.' }
];
export const NOURRITURE = [
  { id:'foin', n:'Foin', ic:'🌾', f:35, m:2, d:'La base du repas : le cheval mange du fourrage presque toute la journée.' },
  { id:'granules', n:'Granulés', ic:'🥣', f:25, m:4, d:'La ration : de l\'énergie pour le travail. Pas juste avant ni juste après l\'effort.' },
  { id:'eau', n:'Eau', ic:'💧', f:8, m:3, d:'Un cheval boit 30 à 50 litres par jour : de l\'eau propre, toujours.' },
  { id:'carotte', n:'Carotte', ic:'🥕', f:8, m:12, gour:1, d:'Une friandise. On la donne la main bien à plat.' },
  { id:'pomme', n:'Pomme', ic:'🍎', f:8, m:12, gour:1, d:'Une friandise, coupée en quartiers. Pas trop : c\'est sucré !' }
];

// Les concours. Hauteurs en mètres.
export const EPREUVES = [
  { id:'cso1', k:'cso', n:'CSO · Club 3', ic:'🚧', h:.55, nb:6, d:'6 obstacles de 55 cm', gain:[120, 80, 50, 20] },
  { id:'cso2', k:'cso', n:'CSO · Club 1', ic:'🚧', h:.8, nb:8, d:'8 obstacles de 80 cm', gain:[220, 150, 90, 30], need:'cso1' },
  { id:'cso3', k:'cso', n:'CSO · Club Élite', ic:'🏅', h:1.05, nb:10, d:'10 obstacles de 1,05 m', gain:[380, 260, 160, 40], need:'cso2' },
  { id:'cross1', k:'cross', n:'Cross · Club 3', ic:'🌲', h:.5, nb:7, d:'7 obstacles naturels, un gué', gain:[150, 100, 60, 20] },
  { id:'cross2', k:'cross', n:'Cross · Club 1', ic:'🌲', h:.75, nb:10, d:'10 obstacles, plus vite', gain:[260, 180, 110, 30], need:'cross1' },
  { id:'cross3', k:'cross', n:'Cross · Club Élite', ic:'🏅', h:.95, nb:13, d:'13 obstacles, chrono serré', gain:[420, 300, 180, 40], need:'cross2' },
  { id:'dres1', k:'dressage', n:'Dressage · Club 3', ic:'🎩', d:'Pas et trot, un cercle, deux arrêts', gain:[130, 90, 50, 20] },
  { id:'dres2', k:'dressage', n:'Dressage · Club 1', ic:'🎩', d:'Avec du galop et une diagonale', gain:[240, 160, 100, 30], need:'dres1' },
  { id:'dres3', k:'dressage', n:'Dressage · Club Élite', ic:'🏅', d:'Serpentine, cercle au galop, transitions', gain:[400, 280, 170, 40], need:'dres2' }
];
setSelle([
  { id:'pommeau', n:'Le pommeau', x:38, y:15, r:'L\'avant de la selle, relevé au-dessus du garrot. Il ne doit jamais toucher le garrot.' },
  { id:'siege', n:'Le siège', x:56, y:22, r:'Le creux où le cavalier s\'assoit.' },
  { id:'troussequin', n:'Le troussequin', x:77, y:13, r:'L\'arrière relevé de la selle : il cale le bassin du cavalier.' },
  { id:'petitquartier', n:'Le petit quartier', x:45, y:27, r:'Le petit rabat de cuir qui cache l\'attache de l\'étrivière (le couteau d\'étrivière).' },
  { id:'quartier', n:'Le quartier', x:49, y:52, r:'Le grand pan de cuir sous la jambe du cavalier : il protège la jambe des boucles de la sangle.' },
  { id:'taquet', n:'Le taquet', x:27, y:45, r:'Le bourrelet à l\'avant du quartier : il cale le genou, surtout à l\'obstacle.' },
  { id:'etriviere', n:'L\'étrivière', x:37, y:50, r:'La courroie de cuir qui porte l\'étrier. On la règle à la longueur de sa jambe.' },
  { id:'etrier', n:'L\'étrier', x:37, y:74, r:'On y pose l\'avant du pied, le talon plus bas que la pointe.' },
  { id:'panneaux', n:'Les panneaux', x:71, y:31, r:'Les coussins sous la selle : ils reposent sur le dos du cheval, de chaque côté de la colonne.' },
  { id:'sangle', n:'La sangle', x:50, y:87.5, r:'Elle passe sous le ventre et tient la selle en place. On la serre petit à petit.' }
]);
