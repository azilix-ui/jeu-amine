/* « La vie du Prophète ﷺ » — les 7 épisodes de la saison (textes relus et validés par le papa le 17/11 : document
   claude.ai « La vie du Prophète ﷺ — textes à relire »). Règle : on ne montre jamais le Prophète ﷺ, ni aucun prophète,
   ni les compagnons, ni les anges ; les images (ComfyUI) ne montrent que des lieux, des animaux, des objets, de la lumière.
   Chaque scène : img (img/<nom>.webp), qui ('papa' = voix Jon, 'maman' = voix Céline ; l'arabe = voix Mohammad),
   fr, ar. Une scène { coran } affiche des versets (texte uthmani de quran-json / quranenc.com, sens en français de
   Hamidullah) : jamais lus par une voix artificielle, seul le sens en français est lu.
   Les jeux : amine (toucher des objets), salma (remettre dans l'ordre + petit quiz), essil (quiz plus difficile). */

export const COUVERTURE = 'e2_d';
export const EPISODES = [
  {
    n:1, titre:'L’année de l’Éléphant', ar:'عام الفيل', img:'e1_d',
    scenes:[
      { img:'e1_a', qui:'papa', fr:'Il y a plus de mille quatre cents ans, à La Mecque, il y avait la Kaaba, la maison qu’Ibrahim et son fils Ismaïl avaient construite pour adorer Allah.',
        ar:'مُنْذُ أَكْثَرَ مِنْ أَلْفٍ وَأَرْبَعِمِائَةِ سَنَةٍ، كَانَتِ الكَعْبَةُ فِي مَكَّةَ، البَيْتُ الَّذِي بَنَاهُ إِبْرَاهِيمُ وَإِسْمَاعِيلُ عَلَيْهِمَا السَّلَامُ لِعِبَادَةِ اللهِ.' },
      { img:'e1_b', qui:'papa', fr:'Un roi appelé Abraha voulut la détruire. Il vint avec une grande armée et un énorme éléphant. Mais l’éléphant s’agenouilla et refusa d’avancer vers la Kaaba !',
        ar:'جَاءَ مَلِكٌ اسْمُهُ أَبْرَهَةُ بِجَيْشٍ كَبِيرٍ وَفِيلٍ ضَخْمٍ لِيَهْدِمَ الكَعْبَةَ، فَبَرَكَ الفِيلُ وَرَفَضَ أَنْ يَتَقَدَّمَ.' },
      { img:'e1_c', qui:'papa', fr:'Alors Allah envoya des nuées d’oiseaux, et l’armée repartit vaincue. On appela cette année « l’année de l’Éléphant ».',
        ar:'وَأَرْسَلَ اللهُ عَلَيْهِمْ طَيْرًا أَبَابِيلَ، فَسُمِّيَ ذَلِكَ العَامُ «عَامَ الفِيلِ».' },
      { coran:{ s:105, nom:'Al-Fîl (L’Éléphant)', v:[
        ['أَلَمۡ تَرَ كَيۡفَ فَعَلَ رَبُّكَ بِأَصۡحَٰبِ ٱلۡفِيلِ', 'N’as-tu pas vu comment ton Seigneur a agi envers les gens de l’Éléphant ?'],
        ['أَلَمۡ يَجۡعَلۡ كَيۡدَهُمۡ فِي تَضۡلِيلٖ', 'N’a-t-Il pas rendu leur ruse complètement vaine,'],
        ['وَأَرۡسَلَ عَلَيۡهِمۡ طَيۡرًا أَبَابِيلَ', 'et envoyé sur eux des oiseaux par volées,'],
        ['تَرۡمِيهِم بِحِجَارَةٖ مِّن سِجِّيلٖ', 'qui leur lançaient des pierres d’argile ?'],
        ['فَجَعَلَهُمۡ كَعَصۡفٖ مَّأۡكُولِۭ', 'Et Il les a rendus semblables à une paille mâchée.']] }, img:'e1_c' },
      { img:'e1_d', qui:'maman', fr:'Cette année-là, vers l’an 570, un bébé naquit à La Mecque. Sa maman s’appelait Âmina. Son papa, Abdallah, était mort avant sa naissance. Son grand-père, Abd al-Muttalib, tout heureux, l’appela Mohammed, « celui qui est loué ». Ce bébé allait devenir le dernier des prophètes, que la prière et la paix d’Allah soient sur lui.',
        ar:'فِي ذَلِكَ العَامِ وُلِدَ مُحَمَّدٌ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ. أُمُّهُ آمِنَةُ، وَأَبُوهُ عَبْدُ اللهِ تُوُفِّيَ قَبْلَ وِلَادَتِهِ، وَسَمَّاهُ جَدُّهُ عَبْدُ المُطَّلِبِ «مُحَمَّدًا».' },
    ],
    lecon:{ fr:'Allah protège Sa maison ; personne n’est plus fort que Lui.', ar:'اللهُ يَحْمِي بَيْتَهُ، وَلَا أَحَدَ أَقْوَى مِنْهُ.' },
    jeux:{
      amine:{ consigne:'Touche les 6 petits oiseaux qui volent dans le ciel !', ar:'المِسْ الطُّيُورَ السِّتَّةَ!', fond:'e1_c', objet:'🕊️', n:6 },
      salma:{ ordre:['e1_a', 'e1_b', 'e1_c', 'e1_d'], legendes:['La Kaaba à La Mecque', 'L’éléphant refuse d’avancer', 'Les oiseaux envoyés par Allah', 'La naissance du bébé Mohammed ﷺ'],
        quiz:[{ q:'Comment s’appelait la maman du Prophète ﷺ ?', c:['Âmina', 'Khadîdja', 'Halîma'], b:0 },
              { q:'Qui a donné le prénom Mohammed au bébé ?', c:['Son grand-père Abd al-Muttalib', 'Son oncle', 'Le roi Abraha'], b:0 }] },
      essil:{ quiz:[
        { q:'En quelle année environ est né le Prophète ﷺ ?', c:['Vers 570', 'Vers 622', 'Vers 610'], b:0, ex:'L’année de l’Éléphant, vers 570.' },
        { q:'Que veut dire le prénom « Mohammed » ?', c:['Celui qui est loué', 'Celui qui lit', 'Le digne de confiance'], b:0 },
        { q:'Quelle sourate raconte l’histoire de l’éléphant ?', c:['Al-Fîl (105)', 'Al-Fâtiha (1)', 'Al-Ikhlâs (112)'], b:0 },
        { q:'Que veut dire « طَيْرًا أَبَابِيلَ » ?', c:['Des oiseaux par volées', 'Des pierres d’argile', 'Une grande armée'], b:0 },
        { q:'Qui avait construit la Kaaba ?', c:['Ibrahim et son fils Ismaïl', 'Le roi Abraha', 'Abd al-Muttalib'], b:0 }] }
    }
  },
  {
    n:2, titre:'L’enfance dans le désert', ar:'الطفولة في البادية', img:'e2_a',
    scenes:[
      { img:'e2_a', qui:'maman', fr:'À cette époque, les familles de La Mecque confiaient leurs bébés à des nourrices du désert, où l’air est pur et où l’on parle un très bel arabe.',
        ar:'كَانَ أَهْلُ مَكَّةَ يُرْسِلُونَ أَطْفَالَهُمْ إِلَى البَادِيَةِ.' },
      { img:'e2_b', qui:'maman', fr:'Une dame de la tribu des Banû Sa’d, Halîma, prit le petit Mohammed. Depuis qu’il était chez elle, tout allait mieux : ses bêtes donnaient plus de lait, et sa famille était bénie.',
        ar:'أَخَذَتْ حَلِيمَةُ السَّعْدِيَّةُ مُحَمَّدًا صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، فَكَثُرَ الخَيْرُ فِي بَيْتِهَا.' },
      { img:'e2_c', qui:'papa', fr:'Quand il avait six ans, sa maman Âmina l’emmena voir sa famille à Yathrib, la future Médine. Au retour, elle tomba malade et mourut à Abwâ.',
        ar:'وَلَمَّا بَلَغَ سِتَّ سَنَوَاتٍ تُوُفِّيَتْ أُمُّهُ آمِنَةُ فِي الأَبْوَاءِ.' },
      { img:'e2_d', qui:'papa', fr:'Son grand-père Abd al-Muttalib s’occupa de lui avec beaucoup d’amour, puis mourut quand il avait huit ans. C’est alors son oncle Abû Tâlib qui l’éleva comme son propre fils. Le Prophète a connu la tristesse d’être orphelin : c’est pour cela qu’il aimait tant les orphelins.',
        ar:'فَكَفَلَهُ جَدُّهُ عَبْدُ المُطَّلِبِ، ثُمَّ عَمُّهُ أَبُو طَالِبٍ. عَرَفَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ حُزْنَ اليَتِيمِ، فَكَانَ يُحِبُّ الأَيْتَامَ وَيُوصِي بِهِمْ.' },
      { coran:{ s:93, nom:'Ad-Duhâ (Le jour montant)', v:[
        ['أَلَمۡ يَجِدۡكَ يَتِيمٗا فَـَٔاوَىٰ', 'Ne t’a-t-Il pas trouvé orphelin ? Alors Il t’a accueilli.'],
        ['وَوَجَدَكَ ضَآلّٗا فَهَدَىٰ', 'Ne t’a-t-Il pas trouvé égaré ? Alors Il t’a guidé.'],
        ['وَوَجَدَكَ عَآئِلٗا فَأَغۡنَىٰ', 'Ne t’a-t-Il pas trouvé pauvre ? Alors Il t’a enrichi.'],
        ['فَأَمَّا ٱلۡيَتِيمَ فَلَا تَقۡهَرۡ', 'Quant à l’orphelin, donc, ne le maltraite pas.']] }, img:'e2_d' },
    ],
    lecon:{ fr:'Être doux avec ceux qui sont seuls ou tristes, comme les orphelins.', ar:'كُنْ لَطِيفًا مَعَ الوَحِيدِ وَالحَزِينِ، مِثْلِ اليَتِيمِ.' },
    jeux:{
      amine:{ consigne:'Touche les 5 chèvres de Halîma pour leur donner à manger !', ar:'المِسِ المَاعِزَ الخَمْسَ!', fond:'e2_a', objet:'🐐', n:5 },
      salma:{ ordre:['e2_a', 'e2_b', 'e2_c', 'e2_d'], legendes:['Les bébés vont dans le désert', 'Chez Halîma, tout est béni', 'Sa maman Âmina meurt à Abwâ', 'Son oncle Abû Tâlib l’élève'],
        quiz:[{ q:'Qui était la nourrice du Prophète ﷺ ?', c:['Halîma', 'Âmina', 'Fâtima'], b:0 },
              { q:'Quel oncle l’a élevé ?', c:['Abû Tâlib', 'Abû Bakr', 'Abd al-Muttalib'], b:0 }] },
      essil:{ quiz:[
        { q:'Quel âge avait-il quand sa maman est morte ?', c:['6 ans', '8 ans', '12 ans'], b:0 },
        { q:'Qui l’a élevé après son grand-père ?', c:['Son oncle Abû Tâlib', 'Halîma', 'Waraqa'], b:0 },
        { q:'Pourquoi envoyait-on les bébés dans le désert ?', c:['Air pur et bel arabe', 'Pour apprendre le commerce', 'Pour fuir la guerre'], b:0 },
        { q:'Que dit la sourate Ad-Duhâ à propos de l’orphelin ?', c:['Ne le maltraite pas', 'Donne-lui un nom', 'Envoie-le au désert'], b:0 },
        { q:'Que veut dire « يَتِيم » ?', c:['Orphelin', 'Pauvre', 'Égaré'], b:0 }] }
    }
  },
  {
    n:3, titre:'Al-Amîn, le digne de confiance', ar:'الأمين', img:'e3_d',
    scenes:[
      { img:'e3_a', qui:'papa', fr:'Jeune, Mohammed gardait les moutons : il était patient et attentif.', ar:'رَعَى النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ الغَنَمَ.' },
      { img:'e3_c', qui:'papa', fr:'Plus tard, il devint commerçant. Il ne mentait jamais, ne trichait jamais, et rendait toujours ce qu’on lui confiait. Les gens de La Mecque l’appelaient al-Amîn : « celui à qui l’on peut faire confiance ».',
        ar:'ثُمَّ عَمِلَ فِي التِّجَارَةِ، وَكَانَ صَادِقًا أَمِينًا، فَسَمَّاهُ النَّاسُ «الأَمِينَ».' },
      { img:'e3_b', qui:'maman', fr:'Une dame respectée, Khadîdja, lui confia ses marchandises pour un voyage vers le Châm. Il revint avec un beau bénéfice, et on lui raconta combien il avait été honnête. Elle l’admirait tant qu’elle lui proposa de l’épouser. Il avait vingt-cinq ans. Ils vécurent heureux et eurent des enfants, dont Fâtima.',
        ar:'وَتَزَوَّجَ خَدِيجَةَ رَضِيَ اللهُ عَنْهَا وَهُوَ ابْنُ خَمْسٍ وَعِشْرِينَ سَنَةً.' },
      { img:'e3_d', qui:'papa', fr:'Quand il avait trente-cinq ans, on reconstruisit la Kaaba. Au moment de remettre la Pierre noire, chaque tribu voulait cet honneur. Ils décidèrent : « Le premier qui entrera choisira. » Ce fut Mohammed ! Il posa la pierre sur un manteau, demanda à chaque chef d’en tenir un bord, et tous la soulevèrent ensemble. Puis il la mit à sa place de ses mains. Tout le monde fut content.',
        ar:'وَلَمَّا اخْتَلَفَتِ القَبَائِلُ عَلَى وَضْعِ الحَجَرِ الأَسْوَدِ، وَضَعَهُ فِي ثَوْبٍ، وَأَمَرَ كُلَّ قَبِيلَةٍ أَنْ تَأْخُذَ بِطَرَفٍ، ثُمَّ وَضَعَهُ بِيَدِهِ فِي مَكَانِهِ، فَرَضِيَ الجَمِيعُ.' },
    ],
    lecon:{ fr:'Dire la vérité, rendre ce qu’on nous prête, et chercher la solution qui réconcilie.', ar:'قُلِ الصِّدْقَ، وَأَدِّ الأَمَانَةَ، وَابْحَثْ عَنِ الحَلِّ الَّذِي يُصْلِحُ بَيْنَ النَّاسِ.' },
    jeux:{
      amine:{ consigne:'Touche les 4 coins du manteau pour soulever la Pierre noire tous ensemble !', ar:'المِسْ أَطْرَافَ الثَّوْبِ الأَرْبَعَةَ!', fond:'e3_d', objet:'🤲', n:4 },
      salma:{ ordre:['e3_a', 'e3_c', 'e3_b', 'e3_d'], legendes:['Il garde les moutons', 'Il devient un commerçant honnête', 'Il épouse Khadîdja', 'Il remet la Pierre noire'],
        quiz:[{ q:'Que veut dire « al-Amîn » ?', c:['Le digne de confiance', 'Le plus fort', 'Le plus riche'], b:0 },
              { q:'Vrai ou faux : le Prophète ﷺ trichait parfois au marché.', c:['Faux', 'Vrai'], b:0 }] },
      essil:{ quiz:[
        { q:'Quel âge avait-il quand il a épousé Khadîdja ?', c:['25 ans', '40 ans', '35 ans'], b:0 },
        { q:'Comment a-t-il réglé la dispute de la Pierre noire ?', c:['Un manteau tenu par chaque tribu', 'Un tirage au sort', 'Il l’a donnée au plus fort'], b:0 },
        { q:'Vers quel pays partait la caravane de Khadîdja ?', c:['Le Châm (la Syrie)', 'L’Égypte', 'Le Yémen'], b:0 },
        { q:'Que veut dire « صَادِق » ?', c:['Sincère, qui dit vrai', 'Commerçant', 'Berger'], b:0 },
        { q:'Quel métier a-t-il fait d’abord, jeune ?', c:['Berger', 'Forgeron', 'Pêcheur'], b:0 }] }
    }
  },
  {
    n:4, titre:'La révélation dans la grotte de Hirâ', ar:'نزول الوحي في غار حراء', img:'e4_a',
    scenes:[
      { img:'e4_a', qui:'maman', fr:'Mohammed aimait aller seul dans une petite grotte, sur la montagne de Hirâ, pour réfléchir et prier Allah loin du bruit.', ar:'كَانَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَخْلُو فِي غَارِ حِرَاءٍ يَتَعَبَّدُ.' },
      { img:'e4_b', qui:'maman', fr:'Une nuit du mois de Ramadan, quand il avait quarante ans, l’ange Djibrîl vint et lui dit : « Lis ! » Il répondit : « Je ne sais pas lire. » Trois fois de suite. Puis l’ange récita les premiers versets du Coran.',
        ar:'وَفِي لَيْلَةٍ مِنْ رَمَضَانَ، وَهُوَ ابْنُ أَرْبَعِينَ، جَاءَهُ جِبْرِيلُ عَلَيْهِ السَّلَامُ فَقَالَ: «اقْرَأْ».', mot:'اقْرَأْ' },
      { coran:{ s:96, nom:'Al-‘Alaq', v:[
        ['ٱقۡرَأۡ بِٱسۡمِ رَبِّكَ ٱلَّذِي خَلَقَ', 'Lis, au nom de ton Seigneur qui a créé,'],
        ['خَلَقَ ٱلۡإِنسَٰنَ مِنۡ عَلَقٍ', 'qui a créé l’homme d’une adhérence.'],
        ['ٱقۡرَأۡ وَرَبُّكَ ٱلۡأَكۡرَمُ', 'Lis ! Ton Seigneur est le Très Noble,'],
        ['ٱلَّذِي عَلَّمَ بِٱلۡقَلَمِ', 'qui a enseigné par la plume,'],
        ['عَلَّمَ ٱلۡإِنسَٰنَ مَا لَمۡ يَعۡلَمۡ', 'a enseigné à l’homme ce qu’il ne savait pas.']] }, img:'e4_b' },
      { img:'e4_c', qui:'papa', fr:'Il rentra chez lui tout tremblant et dit à Khadîdja : « Couvre-moi, couvre-moi ! » Elle le rassura avec beaucoup d’amour : « Allah ne t’abandonnera jamais : tu es bon avec ta famille, tu aides les pauvres, tu accueilles les invités et tu secours ceux qui sont dans le malheur. »',
        ar:'فَرَجَعَ إِلَى خَدِيجَةَ رَضِيَ اللهُ عَنْهَا وَهُوَ يَرْجُفُ وَيَقُولُ: «زَمِّلُونِي»، فَطَمْأَنَتْهُ وَقَالَتْ: «كَلَّا وَاللهِ مَا يُخْزِيكَ اللهُ أَبَدًا».' },
      { img:'e4_c', qui:'papa', fr:'Elle l’emmena voir son cousin Waraqa, un vieux savant, qui lui expliqua que c’était le même ange qui était venu voir Moussa. Khadîdja fut la première personne à croire en lui.',
        ar:'وَكَانَتْ خَدِيجَةُ أَوَّلَ مَنْ آمَنَ بِهِ.' },
    ],
    lecon:{ fr:'Le premier mot du Coran est « Lis ! » : apprendre est très important en islam. Et quand quelqu’un a peur, on le rassure comme Khadîdja.', ar:'أَوَّلُ كَلِمَةٍ نَزَلَتْ: «اقْرَأْ»، فَالعِلْمُ مُهِمٌّ جِدًّا فِي الإِسْلَامِ.' },
    jeux:{
      amine:{ consigne:'Touche les 7 étoiles pour allumer le ciel au-dessus de la montagne !', ar:'المِسِ النُّجُومَ السَّبْعَ!', fond:'e4_a', objet:'⭐', n:7 },
      salma:{ ordre:['e4_a', 'e4_b', 'e4_c', 'e3_b'], legendes:['Il prie dans la grotte de Hirâ', 'L’ange lui dit : « Lis ! »', 'Khadîdja le rassure', 'Khadîdja croit la première'],
        quiz:[{ q:'Quel est le premier mot du Coran révélé ?', c:['Lis ! (اقْرَأْ)', 'Prie !', 'Écoute !'], b:0 },
              { q:'Qui a été la première à croire en lui ?', c:['Khadîdja', 'Halîma', 'Âmina'], b:0 }] },
      essil:{ quiz:[
        { q:'Quel âge avait-il lors de la première révélation ?', c:['40 ans', '25 ans', '35 ans'], b:0 },
        { q:'Pendant quel mois ?', c:['Ramadan', 'Rabî‘ al-Awwal', 'Dhoul-Hijja'], b:0 },
        { q:'Quel ange est venu le voir ?', c:['Djibrîl', 'Mîkâ’îl', 'Isrâfîl'], b:0 },
        { q:'Qui était Waraqa ?', c:['Le cousin savant de Khadîdja', 'Son oncle', 'Un marchand de Syrie'], b:0 },
        { q:'Quelle sourate commence par « اقْرَأْ » ?', c:['Al-‘Alaq (96)', 'Al-Fîl (105)', 'Ad-Duhâ (93)'], b:0 }] }
    }
  },
  {
    n:5, titre:'Les premiers musulmans et la patience', ar:'المسلمون الأوائل والصبر', img:'e5_d',
    scenes:[
      { img:'e5_a', qui:'papa', fr:'Les premiers à croire furent Khadîdja, son jeune cousin Alî, son ami Abû Bakr et Zayd. Puis d’autres suivirent, riches et pauvres. Mais beaucoup de chefs de La Mecque se moquaient d’eux et leur faisaient du mal.',
        ar:'أَوَّلُ مَنْ آمَنَ: خَدِيجَةُ وَعَلِيٌّ وَأَبُو بَكْرٍ وَزَيْدٌ رَضِيَ اللهُ عَنْهُمْ.' },
      { img:'e5_b', qui:'papa', fr:'Bilâl, un esclave devenu musulman, répétait sous le soleil brûlant : « Ahad, Ahad ! », Allah est Unique. Abû Bakr l’acheta et le libéra. Bilâl deviendra le premier muezzin de l’islam.',
        ar:'وَكَانَ بِلَالٌ يَصْبِرُ فِي الشَّمْسِ الحَارَّةِ وَيَقُولُ: «أَحَدٌ، أَحَدٌ».', mot:'أَحَدٌ أَحَدٌ' },
      { img:'e5_c', qui:'maman', fr:'Un jour, le Prophète alla à Tâ’if, une ville dans les montagnes, pour inviter ses habitants à l’islam. Ils le repoussèrent méchamment. Il repartit très triste.',
        ar:'وَفِي الطَّائِفِ آذَاهُ النَّاسُ.' },
      { img:'e5_d', qui:'maman', fr:'Alors l’ange des montagnes vint et proposa d’écraser la ville entre deux montagnes. Le Prophète répondit : « Non ! J’espère qu’Allah fera naître de leurs enfants des gens qui adoreront Allah seul. » Il a choisi le pardon.',
        ar:'فَلَمَّا جَاءَهُ مَلَكُ الجِبَالِ قَالَ: «بَلْ أَرْجُو أَنْ يُخْرِجَ اللهُ مِنْ أَصْلَابِهِمْ مَنْ يَعْبُدُ اللهَ وَحْدَهُ».' },
    ],
    lecon:{ fr:'Rester patient quand c’est difficile, et pardonner même à ceux qui nous ont fait de la peine.', ar:'اصْبِرْ عِنْدَ الصُّعُوبَةِ، وَسَامِحْ مَنْ أَحْزَنَكَ.' },
    jeux:{
      amine:{ consigne:'Touche les 5 cœurs : ce sont les gestes gentils !', ar:'المِسِ القُلُوبَ الخَمْسَةَ!', fond:'e5_d', objet:'💛', n:5 },
      salma:{ ordre:['e5_a', 'e5_b', 'e5_c', 'e5_d'], legendes:['Les premiers croyants', 'Bilâl dit : « Ahad, Ahad ! »', 'Il va à Tâ’if', 'Il choisit le pardon'],
        quiz:[{ q:'Qu’a choisi le Prophète ﷺ après Tâ’if ?', c:['Le pardon', 'La colère', 'La vengeance'], b:0 },
              { q:'Qui a libéré Bilâl ?', c:['Abû Bakr', 'Alî', 'Zayd'], b:0 }] },
      essil:{ quiz:[
        { q:'Que répétait Bilâl ?', c:['Ahad, Ahad (Allah est Unique)', 'Allahou akbar', 'Bismillah'], b:0 },
        { q:'Quel rôle aura Bilâl plus tard ?', c:['Premier muezzin', 'Premier calife', 'Chef de caravane'], b:0 },
        { q:'Qui étaient les quatre premiers croyants ?', c:['Khadîdja, Alî, Abû Bakr, Zayd', 'Âmina, Halîma, Abû Tâlib, Waraqa', 'Bilâl, Omar, Othmân, Hamza'], b:0 },
        { q:'Qu’espérait le Prophète ﷺ pour les gens de Tâ’if ?', c:['Que leurs enfants adorent Allah', 'Qu’ils partent', 'Qu’ils soient punis'], b:0 },
        { q:'Que veut dire « صَبْر » ?', c:['Patience', 'Pardon', 'Prière'], b:0 }] }
    }
  },
  {
    n:6, titre:'L’Hégire : de La Mecque à Médine', ar:'الهجرة', img:'e6_e',
    scenes:[
      { img:'e6_a', qui:'papa', fr:'À La Mecque, la vie devenait trop dure pour les musulmans. Allah permit au Prophète de partir vers Yathrib, où des gens l’attendaient. Il partit la nuit avec son ami Abû Bakr.',
        ar:'أَذِنَ اللهُ لِنَبِيِّهِ بِالهِجْرَةِ، فَخَرَجَ مَعَ أَبِي بَكْرٍ رَضِيَ اللهُ عَنْهُ.' },
      { img:'e6_b', qui:'papa', fr:'Ils se cachèrent trois nuits dans la grotte de Thawr. Les poursuivants arrivèrent juste devant la grotte ! Abû Bakr eut peur pour le Prophète, qui lui dit : « Ne t’attriste pas, Allah est avec nous. » Et personne ne les vit.',
        ar:'وَاخْتَبَأَا فِي غَارِ ثَوْرٍ ثَلَاثَ لَيَالٍ، وَقَالَ لَهُ: «لَا تَحْزَنْ إِنَّ اللهَ مَعَنَا».' },
      { coran:{ s:9, nom:'At-Tawba, verset 40 (extrait)', v:[
        ['إِذۡ يَقُولُ لِصَٰحِبِهِۦ لَا تَحۡزَنۡ إِنَّ ٱللَّهَ مَعَنَاۖ', 'Quand il disait à son compagnon : « Ne t’afflige pas, car Allah est avec nous. »']] }, img:'e6_b' },
      { img:'e6_b', qui:'maman', fr:'Selon la tradition, une araignée tissa sa toile et une colombe fit son nid à l’entrée de la grotte.', ar:'' },
      { img:'e6_c', qui:'maman', fr:'Après un long voyage dans le désert, ils arrivèrent à Qubâ, puis à Yathrib, qu’on appela ensuite Médine, « la ville du Prophète ». Tout le monde était en fête.',
        ar:'ثُمَّ وَصَلَ إِلَى المَدِينَةِ فَفَرِحَ النَّاسُ.' },
      { img:'e6_d', qui:'maman', fr:'Sa chamelle s’agenouilla sur un terrain qui appartenait à deux orphelins : il le leur acheta, et là, on construisit la mosquée.',
        ar:'وَبَرَكَتْ نَاقَتُهُ فِي مَكَانِ المَسْجِدِ.' },
      { img:'e6_e', qui:'maman', fr:'Le Prophète portait lui-même les briques avec ses compagnons !',
        ar:'وَبَنَى المَسْجِدَ مَعَ أَصْحَابِهِ يَحْمِلُ اللَّبِنَ بِيَدَيْهِ.' },
    ],
    lecon:{ fr:'Avoir confiance en Allah quand on a peur ; et travailler avec les autres, même quand on est le chef.', ar:'ثِقْ بِاللهِ عِنْدَ الخَوْفِ، وَاعْمَلْ مَعَ الآخَرِينَ.' },
    jeux:{
      amine:{ consigne:'Touche les 6 briques pour construire la mosquée !', ar:'المِسِ اللَّبِنَاتِ السِّتَّ!', fond:'e6_e', objet:'🧱', n:6 },
      salma:{ ordre:['e6_a', 'e6_b', 'e6_c', 'e6_e'], legendes:['Le départ la nuit', 'La grotte de Thawr', 'Le chemin vers Médine', 'La mosquée de Médine'],
        quiz:[{ q:'Avec qui le Prophète ﷺ a-t-il fait l’Hégire ?', c:['Abû Bakr', 'Bilâl', 'Alî'], b:0 },
              { q:'Que lui a-t-il dit dans la grotte ?', c:['Ne t’attriste pas, Allah est avec nous', 'Cours vite !', 'Cachons-nous mieux'], b:0 }] },
      essil:{ quiz:[
        { q:'En quelle année a eu lieu l’Hégire ?', c:['622', '570', '610'], b:0, ex:'C’est le début du calendrier musulman.' },
        { q:'Combien de nuits sont-ils restés dans la grotte de Thawr ?', c:['3', '7', '1'], b:0 },
        { q:'Comment s’appelait Médine avant ?', c:['Yathrib', 'Tâ’if', 'Qubâ'], b:0 },
        { q:'À qui appartenait le terrain de la mosquée ?', c:['À deux orphelins', 'À Abû Bakr', 'À un roi'], b:0 },
        { q:'Que veut dire « هِجْرَة » ?', c:['Émigration, départ', 'Victoire', 'Prière'], b:0 }] }
    }
  },
  {
    n:7, titre:'Sa bonté envers les enfants et les animaux', ar:'رحمته بالأطفال والحيوان', img:'e7_b',
    scenes:[
      { img:'e7_a', qui:'maman', fr:'Le Prophète aimait beaucoup les enfants. Quand il passait près d’eux, il les saluait le premier. Il portait sa petite-fille Umâma dans ses bras, même pendant la prière.',
        ar:'كَانَ النَّبِيُّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يُحِبُّ الأَطْفَالَ وَيُسَلِّمُ عَلَيْهِمْ.' },
      { img:'e7_a', qui:'maman', fr:'Il disait : « N’est pas des nôtres celui qui n’est pas miséricordieux envers nos petits. » Et aussi : « Ton sourire à ton frère est une aumône. »',
        ar:'وَقَالَ: «لَيْسَ مِنَّا مَنْ لَمْ يَرْحَمْ صَغِيرَنَا»، وَقَالَ: «تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ».' },
      { img:'e7_b', qui:'papa', fr:'Il nous a appris à être bons avec les animaux. Il a raconté l’histoire d’un homme qui vit un chien mourir de soif près d’un puits. L’homme descendit dans le puits, remplit sa chaussure d’eau et fit boire le chien. Allah fut content de lui et lui pardonna.',
        ar:'وَحَكَى لَنَا قِصَّةَ رَجُلٍ سَقَى كَلْبًا عَطْشَانَ فَشَكَرَ اللهُ لَهُ فَغَفَرَ لَهُ.' },
      { img:'e7_c', qui:'papa', fr:'Les compagnons demandèrent : « Avons-nous une récompense pour les animaux ? » Il répondit : « Pour tout être vivant, il y a une récompense. »',
        ar:'وَقَالَ: «فِي كُلِّ كَبِدٍ رَطْبَةٍ أَجْرٌ».' },
      { img:'enfants', qui:'maman', fr:'Sourire, saluer, être doux avec les plus petits et avec les animaux : c’est suivre l’exemple du Prophète, que la prière et la paix d’Allah soient sur lui.',
        ar:'الابْتِسَامَةُ وَالسَّلَامُ وَالرَّحْمَةُ بِالصِّغَارِ وَالحَيَوَانِ: هَذِهِ سُنَّةُ نَبِيِّنَا صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ.' },
    ],
    lecon:{ fr:'Sourire, saluer, être doux avec les plus petits et avec les animaux.', ar:'ابْتَسِمْ، وَسَلِّمْ، وَارْحَمِ الصِّغَارَ وَالحَيَوَانَ.' },
    jeux:{
      amine:{ consigne:'Touche les 5 gouttes d’eau pour donner à boire au chien qui a soif !', ar:'المِسْ قَطَرَاتِ المَاءِ الخَمْسَ!', fond:'e7_b', objet:'💧', n:5 },
      salma:{ ordre:['e7_a', 'e7_b', 'e7_c', 'enfants'], legendes:['Il salue les enfants', 'Le chien qui a soif', 'Une récompense pour les animaux', 'À nous de faire pareil !'],
        quiz:[{ q:'Selon le hadith, que vaut ton sourire à ton frère ?', c:['Une aumône (sadaqa)', 'Rien du tout', 'Un cadeau'], b:0 },
              { q:'Qui saluait les enfants le premier ?', c:['Le Prophète ﷺ', 'Les enfants', 'Personne'], b:0 }] },
      essil:{ quiz:[
        { q:'Qu’a fait l’homme pour le chien assoiffé ?', c:['Il l’a fait boire avec sa chaussure', 'Il l’a chassé', 'Il lui a donné du pain'], b:0 },
        { q:'Complète : « في كُلِّ كَبِدٍ رَطْبَةٍ … »', c:['أَجْرٌ (une récompense)', 'مَاءٌ (de l’eau)', 'صَدَقَةٌ (une aumône)'], b:0 },
        { q:'Qui était Umâma ?', c:['Sa petite-fille', 'Sa tante', 'Sa nourrice'], b:0 },
        { q:'Que veut dire « رَحْمَة » ?', c:['Miséricorde, douceur', 'Récompense', 'Sourire'], b:0 },
        { q:'Que veut dire « صَدَقَة » ?', c:['Une aumône, une bonne action', 'Une prière', 'Un voyage'], b:0 }] }
    }
  },
];
