/* « Les histoires des prophètes » (Éveil religieux, saison 2) : FICHIER FABRIQUÉ par docs/eveil/episodes_prophetes.py, ne pas modifier à la main.
   Règles : jamais d'image d'un prophète, de Maryam ni d'un ange ; versets affichés, jamais lus par une voix artificielle ; textes relus par le papa. */
export const COUVERTURE = 'p2_c';
export const EPISODES = [
 {
  "n": 1,
  "titre": "Adam, le premier homme",
  "ar": "آدَمُ عَلَيْهِ السَّلَامُ",
  "img": "p1_b",
  "scenes": [
   {
    "img": "p1_a",
    "qui": "papa",
    "fr": "Avant les hommes, Allah créa le ciel et la terre, les montagnes, les mers, les plantes et les animaux. Tout ce qui existe, c’est Lui qui l’a créé.",
    "ar": "خَلَقَ اللهُ السَّمَاءَ وَالأَرْضَ، وَالجِبَالَ وَالبِحَارَ، وَالنَّبَاتَ وَالحَيَوَانَ.",
    "vid": true
   },
   {
    "img": "p1_b",
    "qui": "maman",
    "fr": "Puis Allah créa Adam, le premier homme, avec de l’argile, et lui donna la vie. Il lui apprit le nom de toutes les choses : l’arbre, l’oiseau, l’eau, l’étoile…",
    "ar": "ثُمَّ خَلَقَ اللهُ آدَمَ مِنْ طِينٍ، وَعَلَّمَهُ أَسْمَاءَ الأَشْيَاءِ كُلِّهَا.",
    "vid": true
   },
   {
    "coran": {
     "s": 2,
     "d": 31,
     "nom": "Al-Baqara (La Vache), verset 31",
     "v": [
      [
       "وَعَلَّمَ ءَادَمَ ٱلۡأَسۡمَآءَ كُلَّهَا ثُمَّ عَرَضَهُمۡ عَلَى ٱلۡمَلَـٰٓئِكَةِ فَقَالَ أَنۢبِـُٔونِي بِأَسۡمَآءِ هَـٰٓؤُلَآءِ إِن كُنتُمۡ صَٰدِقِينَ",
       "Et Il apprit à Adam tous les noms (de toutes choses), puis Il les présenta aux Anges et dit : « Informez-Moi des noms de ceux-là, si vous êtes véridiques ! » (dans votre prétention que vous êtes plus méritants qu’Adam)"
      ]
     ]
    },
    "img": "p1_b"
   },
   {
    "img": "p1_c",
    "qui": "papa",
    "fr": "Allah demanda aux anges de se prosterner devant Adam pour l’honorer. Tous obéirent, sauf Iblis, plein d’orgueil, qui dit : « Je suis meilleur que lui ! » L’orgueil, c’est se croire meilleur que les autres.",
    "ar": "وَأَمَرَ اللهُ المَلَائِكَةَ أَنْ يَسْجُدُوا لِآدَمَ، فَسَجَدُوا إِلَّا إِبْلِيسَ تَكَبَّرَ.",
    "vid": true
   },
   {
    "img": "p1_d",
    "qui": "maman",
    "fr": "Adam et sa femme Hawwa vivaient au Paradis. Ils pouvaient manger de tout, sauf des fruits d’un seul arbre. Iblis leur murmura d’y goûter ; ils l’écoutèrent et en mangèrent.",
    "ar": "سَكَنَ آدَمُ وَحَوَّاءُ الجَنَّةَ، وَنَهَاهُمَا اللهُ عَنْ شَجَرَةٍ وَاحِدَةٍ، فَهَمَسَ لَهُمَا إِبْلِيسُ فَأَكَلَا مِنْهَا.",
    "vid": true
   },
   {
    "img": "p1_e",
    "qui": "papa",
    "fr": "Ils furent très tristes d’avoir désobéi et demandèrent pardon à Allah, sincèrement. Allah leur pardonna. Puis ils descendirent sur la terre, où nous vivons tous : nous sommes leurs enfants.",
    "ar": "فَنَدِمَا وَطَلَبَا المَغْفِرَةَ، فَغَفَرَ اللهُ لَهُمَا، ثُمَّ نَزَلَا إِلَى الأَرْضِ.",
    "vid": true
   }
  ],
  "lecon": {
   "fr": "Quand on se trompe, on dit pardon sincèrement : Allah aime pardonner. Et attention à l'orgueil.",
   "ar": "إِذَا أَخْطَأْنَا نَطْلُبُ المَغْفِرَةَ، وَاللهُ يُحِبُّ أَنْ يَغْفِرَ."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 6 animaux du jardin : la voix te dit leur nom en arabe !",
    "ar": "المِسِ الحَيَوَانَاتِ السِّتَّةَ!",
    "fond": "p1_b",
    "objets": [
     [
      "🦌",
      "غَزَال"
     ],
     [
      "🐇",
      "أَرْنَب"
     ],
     [
      "🦚",
      "طَاوُوس"
     ],
     [
      "🐦",
      "عُصْفُور"
     ],
     [
      "🐢",
      "سُلَحْفَاة"
     ],
     [
      "🦋",
      "فَرَاشَة"
     ]
    ]
   },
   "salma": {
    "ordre": [
     "p1_a",
     "p1_b",
     "p1_d",
     "p1_e"
    ],
    "legendes": [
     "Allah crée le ciel et la terre",
     "Adam apprend le nom des choses",
     "L'arbre défendu",
     "Ils demandent pardon"
    ],
    "quiz": [
     {
      "q": "Avec quoi Allah a-t-il créé Adam ?",
      "c": [
       "De l'argile",
       "Du feu",
       "De la lumière"
      ],
      "b": 0
     },
     {
      "q": "Qu'ont fait Adam et Hawwa après leur erreur ?",
      "c": [
       "Ils ont demandé pardon",
       "Ils se sont cachés",
       "Ils ont accusé Iblis"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Que veut dire « الأَسْمَاء » ?",
      "c": [
       "Les noms",
       "Les cieux",
       "Les anges"
      ],
      "b": 0
     },
     {
      "q": "Qui a refusé de se prosterner devant Adam ?",
      "c": [
       "Iblis",
       "Les anges",
       "Hawwa"
      ],
      "b": 0
     },
     {
      "q": "Pourquoi Iblis a-t-il refusé ?",
      "c": [
       "Par orgueil",
       "Par peur",
       "Il n'avait pas entendu"
      ],
      "b": 0
     },
     {
      "q": "Comment s’appelait la femme d’Adam ?",
      "c": [
       "Hawwa",
       "Maryam",
       "Âsiya"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « مَغْفِرَة » ?",
      "c": [
       "Le pardon",
       "La patience",
       "Le jardin"
      ],
      "b": 0
     }
    ]
   }
  }
 },
 {
  "n": 2,
  "titre": "Nouh et l’arche",
  "ar": "نُوحٌ عَلَيْهِ السَّلَامُ",
  "img": "p2_c",
  "scenes": [
   {
    "img": "p2_a",
    "qui": "papa",
    "fr": "Bien plus tard, les gens avaient oublié Allah et adoraient des statues. Allah envoya Nouh pour leur rappeler d’adorer Allah seul et d’être bons. Il les appela pendant très, très longtemps : neuf cent cinquante ans, dit le Coran.",
    "ar": "نَسِيَ النَّاسُ اللهَ وَعَبَدُوا الأَصْنَامَ، فَأَرْسَلَ اللهُ نُوحًا يَدْعُوهُمْ زَمَنًا طَوِيلًا جِدًّا.",
    "vid": true
   },
   {
    "img": "p2_b",
    "qui": "maman",
    "fr": "Très peu de gens l’écoutèrent, et beaucoup se moquaient de lui. Allah lui demanda de construire un très grand bateau, une arche, loin de la mer. Les moqueurs riaient : « Un bateau sans eau ! » Mais Nouh continuait, patient et confiant.",
    "ar": "أَمَرَ اللهُ نُوحًا أَنْ يَصْنَعَ سَفِينَةً كَبِيرَةً، وَالنَّاسُ يَضْحَكُونَ، وَهُوَ يَصْبِرُ.",
    "vid": true
   },
   {
    "img": "p2_c",
    "qui": "papa",
    "fr": "Quand l’arche fut prête, Allah lui dit d’y faire monter un couple de chaque espèce d’animaux, et les croyants.",
    "ar": "وَحَمَلَ فِيهَا مِنْ كُلِّ الحَيَوَانَاتِ زَوْجَيْنِ، وَالمُؤْمِنِينَ.",
    "vid": true
   },
   {
    "coran": {
     "s": 11,
     "d": 41,
     "nom": "Houd, verset 41",
     "v": [
      [
       "وَقَالَ ٱرۡكَبُواْ فِيهَا بِسۡمِ ٱللَّهِ مَجۡرٜىٰهَا وَمُرۡسَىٰهَآۚ إِنَّ رَبِّي لَغَفُورٞ رَّحِيمٞ",
       "Et il dit : « Montez dedans. Que sa course et son mouillage soient au nom d’Allah. Certes mon Seigneur est Pardonneur et Miséricordieux »"
      ]
     ]
    },
    "img": "p2_c"
   },
   {
    "img": "p2_d",
    "qui": "maman",
    "fr": "Alors la pluie tomba du ciel, l’eau jaillit de la terre, et les vagues devinrent hautes comme des montagnes. L’arche flottait sur l’eau, protégée par Allah.",
    "ar": "ثُمَّ نَزَلَ المَطَرُ، وَارْتَفَعَتِ الأَمْوَاجُ، وَالسَّفِينَةُ تَطْفُو بِحِفْظِ اللهِ."
   },
   {
    "img": "p2_e",
    "qui": "papa",
    "fr": "Quand l’eau se retira, l’arche se posa sur le mont Djoudi. Les croyants et les animaux sortirent sur une terre toute neuve, lavée par la pluie, et remercièrent Allah.",
    "ar": "وَلَمَّا نَزَلَ المَاءُ، اسْتَقَرَّتِ السَّفِينَةُ عَلَى جَبَلِ الجُودِيِّ، فَشَكَرُوا اللهَ.",
    "vid": true
   }
  ],
  "lecon": {
   "fr": "Rester patient et faire confiance à Allah, même quand les autres se moquent.",
   "ar": "اصْبِرْ وَثِقْ بِاللهِ حَتَّى لَوْ ضَحِكَ النَّاسُ."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 8 animaux pour les faire monter dans l'arche !",
    "ar": "المِسِ الحَيَوَانَاتِ الثَّمَانِيَةَ!",
    "fond": "p2_c",
    "objets": [
     [
      "🐘",
      "فِيل"
     ],
     [
      "🐘",
      "فِيل"
     ],
     [
      "🦒",
      "زَرَافَة"
     ],
     [
      "🦒",
      "زَرَافَة"
     ],
     [
      "🦁",
      "أَسَد"
     ],
     [
      "🦁",
      "أَسَد"
     ],
     [
      "🐑",
      "خَرُوف"
     ],
     [
      "🐑",
      "خَرُوف"
     ]
    ]
   },
   "salma": {
    "ordre": [
     "p2_a",
     "p2_b",
     "p2_c",
     "p2_d"
    ],
    "legendes": [
     "Les gens oublient Allah",
     "Nouh construit l'arche",
     "Les animaux montent deux par deux",
     "L'arche sur les vagues"
    ],
    "quiz": [
     {
      "q": "Combien d'animaux de chaque espèce sont montés ?",
      "c": [
       "Deux",
       "Un",
       "Dix"
      ],
      "b": 0
     },
     {
      "q": "Que faisaient les moqueurs ?",
      "c": [
       "Ils riaient de Nouh",
       "Ils l'aidaient",
       "Ils dormaient"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Sur quelle montagne l'arche s'est-elle posée ?",
      "c": [
       "Le mont Djoudi",
       "Le mont Hirâ",
       "Le mont Sinaï"
      ],
      "b": 0
     },
     {
      "q": "Combien de temps Nouh a-t-il appelé son peuple ?",
      "c": [
       "950 ans",
       "40 ans",
       "100 ans"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « سَفِينَة » ?",
      "c": [
       "Un bateau",
       "Une montagne",
       "La pluie"
      ],
      "b": 0
     },
     {
      "q": "Dans le verset, au nom de qui l'arche avance-t-elle ?",
      "c": [
       "Au nom d'Allah",
       "Au nom de Nouh",
       "Au nom du roi"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « صَبْر » ?",
      "c": [
       "La patience",
       "La colère",
       "La pluie"
      ],
      "b": 0
     }
    ]
   }
  }
 },
 {
  "n": 3,
  "titre": "Ibrahim, l’ami d’Allah",
  "ar": "إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ",
  "img": "p3_c",
  "scenes": [
   {
    "img": "p3_a",
    "qui": "maman",
    "fr": "Ibrahim était un jeune homme qui réfléchissait beaucoup. Une nuit, il vit une étoile briller, puis elle disparut. Ensuite la lune, puis le soleil : eux aussi disparaissaient. Il comprit : « Mon Seigneur, c’est Celui qui a créé le ciel et la terre ! »",
    "ar": "نَظَرَ إِبْرَاهِيمُ إِلَى النَّجْمِ وَالقَمَرِ وَالشَّمْسِ، فَعَرَفَ أَنَّ رَبَّهُ هُوَ الَّذِي خَلَقَهَا كُلَّهَا."
   },
   {
    "img": "p3_b",
    "qui": "papa",
    "fr": "Son peuple adorait des statues de pierre. Ibrahim leur disait : « Elles ne vous entendent pas et ne peuvent pas vous aider ! » Un jour de fête, il cassa les statues, sauf la plus grande. « Demandez-lui qui a fait ça ! » Les gens comprirent qu’une statue ne parle pas… mais ils se fâchèrent.",
    "ar": "كَانَ قَوْمُهُ يَعْبُدُونَ الأَصْنَامَ، فَكَسَرَهَا وَتَرَكَ أَكْبَرَهَا لِيَعْرِفُوا أَنَّهَا لَا تَتَكَلَّمُ."
   },
   {
    "img": "p3_c",
    "qui": "maman",
    "fr": "Pour le punir, le roi fit allumer un immense feu et y fit jeter Ibrahim. Mais Ibrahim avait confiance en Allah. Et Allah dit au feu d’être frais et doux pour lui : le feu ne lui fit aucun mal.",
    "ar": "أَشْعَلُوا نَارًا عَظِيمَةً، فَجَعَلَهَا اللهُ بَارِدَةً عَلَيْهِ، فَلَمْ تَضُرَّهُ."
   },
   {
    "coran": {
     "s": 21,
     "d": 69,
     "nom": "Al-Anbiyâ’ (Les Prophètes), verset 69",
     "v": [
      [
       "قُلۡنَا يَٰنَارُ كُونِي بَرۡدٗا وَسَلَٰمًا عَلَىٰٓ إِبۡرَٰهِيمَ",
       "Nous dîmes : « O feu, sois pour Abraham une fraîcheur salutaire »"
      ]
     ]
    },
    "img": "p3_c"
   },
   {
    "img": "p3_d",
    "qui": "papa",
    "fr": "Plus tard, Ibrahim alla à La Mecque. Avec son fils Ismaïl, il construisit la Kaaba, pierre après pierre, pour qu’on y adore Allah seul. Tu te souviens ? C’est la maison que l’éléphant a refusé d’attaquer !",
    "ar": "وَبَنَى إِبْرَاهِيمُ مَعَ ابْنِهِ إِسْمَاعِيلَ الكَعْبَةَ فِي مَكَّةَ."
   }
  ],
  "lecon": {
   "fr": "Réfléchir avec sa tête, dire la vérité avec courage, et faire confiance à Allah.",
   "ar": "فَكِّرْ بِعَقْلِكَ، وَقُلِ الحَقَّ بِشَجَاعَةٍ، وَثِقْ بِاللهِ."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 7 étoiles dans le ciel d'Ibrahim !",
    "ar": "المِسِ النُّجُومَ السَّبْعَ!",
    "fond": "p3_a",
    "objet": "⭐",
    "n": 7
   },
   "salma": {
    "ordre": [
     "p3_a",
     "p3_b",
     "p3_c",
     "p3_d"
    ],
    "legendes": [
     "L'étoile, la lune et le soleil",
     "Les statues cassées",
     "Le feu devient frais",
     "La Kaaba à La Mecque"
    ],
    "quiz": [
     {
      "q": "Qu'est-ce qui n'a pas brûlé Ibrahim ?",
      "c": [
       "Le feu",
       "L'eau",
       "Le soleil"
      ],
      "b": 0
     },
     {
      "q": "Avec qui Ibrahim a-t-il construit la Kaaba ?",
      "c": [
       "Son fils Ismaïl",
       "Le roi",
       "Nouh"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Qu'a dit Allah au feu ?",
      "c": [
       "Sois fraîcheur et paix pour Ibrahim",
       "Brûle plus fort",
       "Éteins-toi pour toujours"
      ],
      "b": 0
     },
     {
      "q": "Quelle statue Ibrahim n'a-t-il pas cassée ?",
      "c": [
       "La plus grande",
       "La plus petite",
       "Aucune"
      ],
      "b": 0
     },
     {
      "q": "Qu'a regardé Ibrahim avant de comprendre ?",
      "c": [
       "Une étoile, la lune et le soleil",
       "La mer",
       "Une montagne"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « أَصْنَام » ?",
      "c": [
       "Des statues adorées",
       "Des étoiles",
       "Des pierres de la Kaaba"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « نَار » ?",
      "c": [
       "Le feu",
       "La lumière",
       "Le soleil"
      ],
      "b": 0
     }
    ]
   }
  }
 },
 {
  "n": 4,
  "titre": "Youssouf et le rêve",
  "ar": "يُوسُفُ عَلَيْهِ السَّلَامُ",
  "img": "p4_a",
  "scenes": [
   {
    "img": "p4_a",
    "qui": "papa",
    "fr": "Youssouf était un petit garçon très aimé de son père, Ya’qoub. Une nuit, il fit un rêve étrange : onze étoiles, le soleil et la lune se prosternaient devant lui. Son père lui dit : « Ne raconte pas ce rêve à tes frères. »",
    "ar": "رَأَى يُوسُفُ فِي المَنَامِ أَحَدَ عَشَرَ نَجْمًا وَالشَّمْسَ وَالقَمَرَ."
   },
   {
    "coran": {
     "s": 12,
     "d": 4,
     "nom": "Youssouf (Joseph), verset 4",
     "v": [
      [
       "إِذۡ قَالَ يُوسُفُ لِأَبِيهِ يَـٰٓأَبَتِ إِنِّي رَأَيۡتُ أَحَدَ عَشَرَ كَوۡكَبٗا وَٱلشَّمۡسَ وَٱلۡقَمَرَ رَأَيۡتُهُمۡ لِي سَٰجِدِينَ",
       "Quand Joseph dit à son père : « O mon père, j’ai vu [en songe], onze étoiles, et aussi le soleil et la lune ; je les ai vus prosternés devant moi »"
      ]
     ]
    },
    "img": "p4_a"
   },
   {
    "img": "p4_b",
    "qui": "maman",
    "fr": "Ses grands frères étaient jaloux. Un jour, ils l’emmenèrent loin et le laissèrent au fond d’un vieux puits sec. Youssouf avait peur, mais Allah était avec lui et le rassura.",
    "ar": "غَارَ إِخْوَتُهُ مِنْهُ، فَتَرَكُوهُ فِي بِئْرٍ، وَلَكِنَّ اللهَ كَانَ مَعَهُ."
   },
   {
    "img": "p4_c",
    "qui": "papa",
    "fr": "Une caravane passa, trouva Youssouf et l’emmena en Égypte. Il grandit en restant honnête et patient, même dans les moments difficiles.",
    "ar": "أَخَذَتْهُ قَافِلَةٌ إِلَى مِصْرَ، فَكَبِرَ صَادِقًا صَبُورًا."
   },
   {
    "img": "p4_d",
    "qui": "papa",
    "fr": "Allah lui avait appris à expliquer les rêves. Le roi rêva de sept vaches grasses et de sept vaches maigres. Youssouf expliqua : « Sept années de bonnes récoltes vont venir, puis sept années de famine. Gardez du blé ! »",
    "ar": "وَفَسَّرَ لِلْمَلِكِ رُؤْيَاهُ، فَأَمَرَهُمْ أَنْ يَحْفَظُوا القَمْحَ."
   },
   {
    "img": "p4_e",
    "qui": "maman",
    "fr": "Le roi confia les réserves de blé à Youssouf. Pendant la famine, ses frères vinrent en Égypte acheter du blé, sans le reconnaître. Youssouf leur dit qui il était, et au lieu de se venger, il leur pardonna : « Aujourd’hui, pas de reproche contre vous. » Toute la famille fut de nouveau réunie, et le rêve se réalisa.",
    "ar": "وَلَمَّا جَاءَ إِخْوَتُهُ، عَفَا عَنْهُمْ وَلَمْ يَلُمْهُمْ، وَاجْتَمَعَتِ العَائِلَةُ مِنْ جَدِيدٍ."
   }
  ],
  "lecon": {
   "fr": "La jalousie fait du mal ; le pardon réunit la famille.",
   "ar": "الغَيْرَةُ تُؤْذِي، وَالعَفْوُ يَجْمَعُ العَائِلَةَ."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 11 étoiles du rêve de Youssouf !",
    "ar": "المِسِ النُّجُومَ الأَحَدَ عَشَرَ!",
    "fond": "p4_a",
    "objet": "⭐",
    "n": 11
   },
   "salma": {
    "ordre": [
     "p4_a",
     "p4_b",
     "p4_c",
     "p4_e"
    ],
    "legendes": [
     "Le rêve des 11 étoiles",
     "Le vieux puits",
     "La caravane vers l’Égypte",
     "Le pardon et la famille réunie"
    ],
    "quiz": [
     {
      "q": "Pourquoi les frères ont-ils fait du mal à Youssouf ?",
      "c": [
       "Ils étaient jaloux",
       "Il avait menti",
       "Il était méchant"
      ],
      "b": 0
     },
     {
      "q": "Qu'a fait Youssouf quand ses frères sont revenus ?",
      "c": [
       "Il leur a pardonné",
       "Il s'est vengé",
       "Il les a chassés"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Que voulaient dire les 7 vaches grasses ?",
      "c": [
       "7 années de bonnes récoltes",
       "7 rois",
       "7 frères"
      ],
      "b": 0
     },
     {
      "q": "Combien d'étoiles Youssouf a-t-il vues en rêve ?",
      "c": [
       "11",
       "7",
       "12"
      ],
      "b": 0
     },
     {
      "q": "Comment s’appelait le père de Youssouf ?",
      "c": [
       "Ya’qoub",
       "Ibrahim",
       "Ismaïl"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « بِئْر » ?",
      "c": [
       "Un puits",
       "Une étoile",
       "Un rêve"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « عَفْو » ?",
      "c": [
       "Le pardon",
       "La jalousie",
       "Le blé"
      ],
      "b": 0
     }
    ]
   }
  }
 },
 {
  "n": 5,
  "titre": "Moussa et la mer",
  "ar": "مُوسَى عَلَيْهِ السَّلَامُ",
  "img": "p5_d",
  "scenes": [
   {
    "img": "p5_a",
    "qui": "maman",
    "fr": "En Égypte, Pharaon était un roi orgueilleux et dur avec les Banû Isrâ’îl. Quand Moussa naquit, Allah inspira à sa maman de le poser dans un panier sur le Nil. Le panier arriva au palais, et la femme de Pharaon, Âsiya, adopta le bébé avec amour. Allah le rendit même à sa maman pour qu’elle l’allaite !",
    "ar": "أَلْهَمَ اللهُ أُمَّ مُوسَى أَنْ تَضَعَهُ فِي صُنْدُوقٍ فِي النِّيلِ، فَوَصَلَ إِلَى القَصْرِ وَأَحَبَّتْهُ آسِيَةُ."
   },
   {
    "img": "p5_b",
    "qui": "papa",
    "fr": "Devenu grand, Moussa vit un feu sur la montagne, une nuit. Là, Allah lui parla et le choisit comme prophète. Moussa avait du mal à bien parler, alors il fit une belle invocation pour demander de l’aide, et Allah lui donna son frère Hâroun pour l’accompagner.",
    "ar": "رَأَى مُوسَى نَارًا عَلَى الجَبَلِ، وَهُنَاكَ كَلَّمَهُ اللهُ وَجَعَلَهُ نَبِيًّا."
   },
   {
    "coran": {
     "s": 20,
     "d": 25,
     "nom": "Tâ-Hâ, versets 25 à 28",
     "v": [
      [
       "قَالَ رَبِّ ٱشۡرَحۡ لِي صَدۡرِي",
       "[Moïse] dit : « Seigneur, ouvre-moi ma poitrine"
      ],
      [
       "وَيَسِّرۡ لِيٓ أَمۡرِي",
       "et facilite ma mission"
      ],
      [
       "وَٱحۡلُلۡ عُقۡدَةٗ مِّن لِّسَانِي",
       "et dénoue un nœud en ma langue"
      ],
      [
       "يَفۡقَهُواْ قَوۡلِي",
       "afin qu’ils comprennent mes paroles"
      ]
     ]
    },
    "img": "p5_b"
   },
   {
    "img": "p5_c",
    "qui": "maman",
    "fr": "Moussa et Hâroun demandèrent à Pharaon de laisser partir les Banû Isrâ’îl. Il refusa. Alors une nuit, Moussa partit avec eux. Arrivés devant la mer, ils virent Pharaon et ses soldats arriver derrière eux. Les gens eurent très peur, mais Moussa dit : « Non ! Mon Seigneur est avec moi, Il va me guider. »",
    "ar": "خَرَجَ مُوسَى بِقَوْمِهِ لَيْلًا، وَلَمَّا وَصَلُوا إِلَى البَحْرِ خَافُوا، فَقَالَ لَهُمْ: اللهُ مَعِي."
   },
   {
    "img": "p5_d",
    "qui": "papa",
    "fr": "Allah dit à Moussa de frapper la mer avec son bâton. Et la mer s’ouvrit en deux, avec un chemin sec au milieu, entre deux grands murs d’eau ! Tous traversèrent sans danger. Quand Pharaon voulut les suivre, la mer se referma derrière eux.",
    "ar": "ضَرَبَ مُوسَى البَحْرَ بِعَصَاهُ فَانْشَقَّ، وَعَبَرُوا فِي طَرِيقٍ يَابِسٍ."
   }
  ],
  "lecon": {
   "fr": "Quand on a peur, on demande l'aide d'Allah, et on garde courage.",
   "ar": "إِذَا خِفْنَا نَطْلُبُ العَوْنَ مِنَ اللهِ وَنَكُونُ شُجْعَانًا."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 6 poissons dans la mer ouverte !",
    "ar": "المِسِ الأَسْمَاكَ السِّتَّةَ!",
    "fond": "p5_d",
    "objet": "🐟",
    "n": 6
   },
   "salma": {
    "ordre": [
     "p5_a",
     "p5_b",
     "p5_c",
     "p5_d"
    ],
    "legendes": [
     "Le panier sur le Nil",
     "Le feu sur la montagne",
     "Devant la mer, la nuit",
     "La mer s’ouvre en deux"
    ],
    "quiz": [
     {
      "q": "Où la maman de Moussa a-t-elle posé son bébé ?",
      "c": [
       "Dans un panier sur le Nil",
       "Dans une grotte",
       "Sur une montagne"
      ],
      "b": 0
     },
     {
      "q": "Qu'est-il arrivé quand Moussa a frappé la mer ?",
      "c": [
       "Elle s'est ouverte en deux",
       "Elle a gelé",
       "Elle s'est mise à briller"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Qui a adopté Moussa au palais ?",
      "c": [
       "Âsiya, la femme de Pharaon",
       "Maryam",
       "Hawwa"
      ],
      "b": 0
     },
     {
      "q": "Qui était le frère de Moussa ?",
      "c": [
       "Hâroun",
       "Youssouf",
       "Ismaïl"
      ],
      "b": 0
     },
     {
      "q": "Que demande Moussa dans l'invocation de Tâ-Hâ ?",
      "c": [
       "Ouvre-moi ma poitrine et facilite ma mission",
       "Donne-moi une armée",
       "Fais tomber la pluie"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « بَحْر » ?",
      "c": [
       "La mer",
       "Le fleuve",
       "Le désert"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « عَصَا » ?",
      "c": [
       "Un bâton",
       "Un panier",
       "Un bateau"
      ],
      "b": 0
     }
    ]
   }
  }
 },
 {
  "n": 6,
  "titre": "Younous et le grand poisson",
  "ar": "يُونُسُ عَلَيْهِ السَّلَامُ",
  "img": "p6_b",
  "scenes": [
   {
    "img": "p6_a",
    "qui": "papa",
    "fr": "Younous appelait les gens de sa ville, Ninive, à adorer Allah, mais ils ne l’écoutaient pas. Fâché, il partit sans attendre la permission d’Allah, et monta sur un bateau.",
    "ar": "دَعَا يُونُسُ قَوْمَهُ فَلَمْ يُؤْمِنُوا، فَخَرَجَ غَاضِبًا وَرَكِبَ سَفِينَةً."
   },
   {
    "img": "p6_b",
    "qui": "maman",
    "fr": "En mer, une grosse tempête se leva et le bateau était trop lourd. Les marins tirèrent au sort qui devait quitter le bateau : ce fut Younous. Il se retrouva dans la mer, et un énorme poisson l’avala… sans lui faire de mal, car Allah le protégeait.",
    "ar": "هَبَّتْ عَاصِفَةٌ، فَنَزَلَ يُونُسُ فِي البَحْرِ، فَابْتَلَعَهُ حُوتٌ كَبِيرٌ وَلَمْ يُؤْذِهِ."
   },
   {
    "img": "p6_c",
    "qui": "papa",
    "fr": "Dans le ventre du poisson, au fond de la mer, dans la nuit, Younous comprit son erreur. Il demanda pardon à Allah avec une invocation que les musulmans répètent encore aujourd’hui.",
    "ar": "فِي بَطْنِ الحُوتِ، فِي الظَّلَامِ، تَابَ يُونُسُ وَدَعَا رَبَّهُ."
   },
   {
    "coran": {
     "s": 21,
     "d": 87,
     "nom": "Al-Anbiyâ’ (Les Prophètes), verset 87 (extrait)",
     "v": [
      [
       "فَنَادَىٰ فِي ٱلظُّلُمَٰتِ أَن لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبۡحَٰنَكَ إِنِّي كُنتُ مِنَ ٱلظَّـٰلِمِينَ",
       "Puis il fit, dans les ténèbres, l’appel que voici : « Pas de divinité à part Toi ! Pureté à Toi ! J’ai été vraiment du nombre des injustes. »"
      ]
     ]
    },
    "img": "p6_c"
   },
   {
    "img": "p6_d",
    "qui": "maman",
    "fr": "Allah entendit son appel et le sauva. Le poisson le déposa sur une plage, et Allah fit pousser une plante à grandes feuilles pour lui faire de l’ombre. Younous retourna dans sa ville : cette fois, tous les habitants crurent en Allah !",
    "ar": "فَنَجَّاهُ اللهُ، وَأَنْبَتَ لَهُ شَجَرَةً تُظِلُّهُ، ثُمَّ عَادَ إِلَى قَوْمِهِ فَآمَنُوا كُلُّهُمْ."
   }
  ],
  "lecon": {
   "fr": "Quand on se trompe, on peut toujours se tourner vers Allah : Il nous entend partout, même dans le noir.",
   "ar": "اللهُ يَسْمَعُنَا فِي كُلِّ مَكَانٍ، حَتَّى فِي الظَّلَامِ."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 7 bulles qui remontent vers la lumière !",
    "ar": "المِسِ الفُقَاعَاتِ السَّبْعَ!",
    "fond": "p6_c",
    "objet": "🫧",
    "n": 7
   },
   "salma": {
    "ordre": [
     "p6_a",
     "p6_b",
     "p6_c",
     "p6_d"
    ],
    "legendes": [
     "Younous part en bateau",
     "La tempête et le grand poisson",
     "Il demande pardon dans le noir",
     "La plage et la plante"
    ],
    "quiz": [
     {
      "q": "Qu'est-ce qui a avalé Younous ?",
      "c": [
       "Un énorme poisson",
       "Un requin méchant",
       "Une vague"
      ],
      "b": 0
     },
     {
      "q": "Qu'a fait Younous dans le ventre du poisson ?",
      "c": [
       "Il a demandé pardon à Allah",
       "Il a dormi",
       "Il a crié"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Que veut dire « حُوت » ?",
      "c": [
       "Un grand poisson",
       "Un bateau",
       "Une tempête"
      ],
      "b": 0
     },
     {
      "q": "Comment s’appelait la ville de Younous ?",
      "c": [
       "Ninive",
       "La Mecque",
       "Médine"
      ],
      "b": 0
     },
     {
      "q": "Qu'a fait Allah pousser sur la plage ?",
      "c": [
       "Une plante à grandes feuilles",
       "Un palmier",
       "Un olivier"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « ظُلُمَات » ?",
      "c": [
       "Les ténèbres",
       "Les vagues",
       "Les étoiles"
      ],
      "b": 0
     },
     {
      "q": "Qu'ont fait les habitants quand Younous est revenu ?",
      "c": [
       "Ils ont tous cru en Allah",
       "Ils se sont moqués",
       "Ils sont partis"
      ],
      "b": 0
     }
    ]
   }
  }
 },
 {
  "n": 7,
  "titre": "Issa, le bébé qui parle",
  "ar": "عِيسَى عَلَيْهِ السَّلَامُ",
  "img": "p7_b",
  "scenes": [
   {
    "img": "p7_a",
    "qui": "maman",
    "fr": "Maryam était une jeune fille très pieuse, qui priait Allah dans le temple. Zakariyyâ s’occupait d’elle. Chaque fois qu’il entrait, il trouvait près d’elle des fruits, même hors saison. « D’où viennent-ils ? » « D’Allah ! » répondait-elle.",
    "ar": "كَانَتْ مَرْيَمُ تَعْبُدُ اللهَ، وَكَانَ اللهُ يَرْزُقُهَا فَاكِهَةً فِي غَيْرِ وَقْتِهَا."
   },
   {
    "img": "p7_b",
    "qui": "papa",
    "fr": "Un jour, un ange lui annonça qu’elle aurait un bébé sans papa, par la volonté d’Allah, qui peut tout. Plus tard, seule sous un palmier, elle eut très mal et était inquiète. Allah lui dit de secouer le palmier : des dattes fraîches tombèrent, et un petit ruisseau coula à ses pieds.",
    "ar": "بَشَّرَهَا المَلَكُ بِوَلَدٍ، وَتَحْتَ النَّخْلَةِ أَكَلَتْ مِنَ التَّمْرِ وَشَرِبَتْ مِنَ المَاءِ."
   },
   {
    "img": "p7_c",
    "qui": "maman",
    "fr": "Quand elle revint avec le bébé, les gens la critiquèrent. Maryam ne répondit pas : elle montra le bébé du doigt. « Comment parler à un bébé au berceau ? » Et le bébé parla !",
    "ar": "أَشَارَتْ مَرْيَمُ إِلَى الطِّفْلِ، فَتَكَلَّمَ عِيسَى وَهُوَ رَضِيعٌ."
   },
   {
    "coran": {
     "s": 19,
     "d": 30,
     "nom": "Maryam, versets 30 et 31",
     "v": [
      [
       "قَالَ إِنِّي عَبۡدُ ٱللَّهِ ءَاتَىٰنِيَ ٱلۡكِتَٰبَ وَجَعَلَنِي نَبِيّٗا",
       "Mais (le bébé) dit : « Je suis vraiment le serviteur d’Allah. Il m’a donné le Livre et m’a désigné Prophète"
      ],
      [
       "وَجَعَلَنِي مُبَارَكًا أَيۡنَ مَا كُنتُ وَأَوۡصَٰنِي بِٱلصَّلَوٰةِ وَٱلزَّكَوٰةِ مَا دُمۡتُ حَيّٗا",
       "Où que je sois, Il m’a rendu béni ; et Il m’a recommandé, tant que je vivrai, la prière et la Zakât"
      ]
     ]
    },
    "img": "p7_c"
   },
   {
    "img": "p7_d",
    "qui": "papa",
    "fr": "Issa grandit et devint un grand prophète. Par la permission d’Allah, il guérissait les malades, et il façonna des oiseaux en argile qui s’envolèrent ! Il annonça aussi qu’un prophète viendrait après lui, nommé Ahmad : c’est notre Prophète Mohammed ﷺ. Les musulmans aiment Issa et sa maman Maryam.",
    "ar": "كَانَ عِيسَى يَشْفِي المَرْضَى بِإِذْنِ اللهِ، وَأَخْبَرَ أَنَّ نَبِيًّا سَيَأْتِي بَعْدَهُ، هُوَ أَحْمَدُ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ."
   }
  ],
  "lecon": {
   "fr": "Allah peut tout. Tous les prophètes sont frères : nous les aimons et les respectons tous.",
   "ar": "اللهُ يَقْدِرُ عَلَى كُلِّ شَيْءٍ، وَنَحْنُ نُحِبُّ كُلَّ الأَنْبِيَاءِ."
  },
  "jeux": {
   "amine": {
    "consigne": "Touche les 6 dattes qui tombent du palmier !",
    "ar": "المِسِ التَّمَرَاتِ السِّتَّ!",
    "fond": "p7_b",
    "objet": "🌰",
    "n": 6
   },
   "salma": {
    "ordre": [
     "p7_a",
     "p7_b",
     "p7_c",
     "p7_d"
    ],
    "legendes": [
     "Les fruits de Maryam",
     "Les dattes du palmier",
     "Le bébé qui parle",
     "Les oiseaux d’argile"
    ],
    "quiz": [
     {
      "q": "Qu'est-il tombé du palmier ?",
      "c": [
       "Des dattes fraîches",
       "Des pommes",
       "Des feuilles"
      ],
      "b": 0
     },
     {
      "q": "Qui a parlé quand il était encore bébé ?",
      "c": [
       "Issa",
       "Moussa",
       "Youssouf"
      ],
      "b": 0
     }
    ]
   },
   "essil": {
    "quiz": [
     {
      "q": "Quel nom Issa a-t-il annoncé pour le prophète d'après ?",
      "c": [
       "Ahmad",
       "Hâroun",
       "Ya’qoub"
      ],
      "b": 0
     },
     {
      "q": "Qui s’occupait de Maryam au temple ?",
      "c": [
       "Zakariyyâ",
       "Ibrahim",
       "Nouh"
      ],
      "b": 0
     },
     {
      "q": "Qu'a dit le bébé en premier ?",
      "c": [
       "Je suis le serviteur d'Allah",
       "Je suis un roi",
       "Bonjour maman"
      ],
      "b": 0
     },
     {
      "q": "Que veut dire « نَخْلَة » ?",
      "c": [
       "Un palmier",
       "Un ruisseau",
       "Un berceau"
      ],
      "b": 0
     },
     {
      "q": "Avec quoi Issa a-t-il façonné des oiseaux ?",
      "c": [
       "De l'argile",
       "Du bois",
       "De la pierre"
      ],
      "b": 0
     }
    ]
   }
  }
 }
];
