"""Éveil religieux, série 3 « Ma vie de petit musulman » (21/11) : écrit eveil/petit-musulman/episodes.js (même lecteur que les deux
autres séries) et, avec --scenes, la liste des images à demander à ComfyUI.
Les textes viennent du document claude.ai « Ma vie de petit musulman — textes à relire » : RIEN n'est publié avant le « c'est ok » du papa.
Règles : jamais d'image d'un prophète, d'un compagnon ni d'un ange ; pas de verset du Coran dans cette série (des invocations et
formules de tous les jours) ; hadiths cités par leur sens, avec « selon un hadith » et le recueil.
Usage : python3 docs/eveil/episodes_petit_musulman.py [--scenes]"""
import json, os, sys
R = os.path.join(os.path.dirname(__file__), '..', '..'); DST = os.path.join(R, 'eveil', 'petit-musulman')
VID = os.path.join(DST, 'vid')
# qui est dans l'image : e = Essil, s = Salma, a = Amine (références ComfyUI : houma_essil.png, houma_salma.png, eng_amine.png)
def sc(img, qui, fr, ar, p, enf):
    d = {'img': img, 'qui': qui, 'fr': fr.replace("'", '’'), 'ar': ar, '_p': p, '_enf': enf}
    if os.path.exists(os.path.join(VID, img + '.mp4')): d['vid'] = True
    return d
def q(question, bonne, *fausses): return {'q': question.replace("'", '’'), 'c': [bonne.replace("'", '’'), *[f.replace("'", '’') for f in fausses]], 'b': 0}

E = []
E.append({'n': 1, 'titre': 'Bismillah, on mange !', 'ar': 'بِسْمِ اللهِ', 'img': 'm1_a', 'scenes': [
  sc('m1_a', 'maman', "Toute la famille se met à table pour le dîner. Avant de manger, Amine dit : « Bismillah ! » Cela veut dire : au nom d'Allah. On commence ce qu'on fait de bien en pensant à Allah.",
     'قَبْلَ الأَكْلِ نَقُولُ: بِسْمِ اللهِ.', 'Around a family dinner table in a cosy Tunisian dining room with a big plate of couscous, the little boy raises his hands and says the blessing, the two girls smile, warm evening light.', 'esa'),
  sc('m1_c', 'maman', "Et si on a oublié de dire Bismillah au début ? On le dit dès qu'on s'en souvient : « Bismillah awwalahou wa âkhirahou » : au nom d'Allah, au début et à la fin.",
     'بِسْمِ اللهِ أَوَّلَهُ وَآخِرَهُ.', 'At the dinner table, the little boy suddenly remembers something with a finger raised and a funny surprised face, the teenage girl smiles kindly at him.', 'ea'),
  sc('m1_d', 'papa', "À la fin du repas, on dit : « Al-hamdou lillâh ! » : merci Allah pour cette bonne nourriture. Et on ne gaspille pas : Essil range le pain qui reste pour demain.",
     'بَعْدَ الأَكْلِ نَقُولُ: الحَمْدُ لِلّٰهِ.', 'After dinner, the teenage girl carefully puts the leftover bread into a cloth bag in a Tunisian kitchen with blue tiles, satisfied smile.', 'e')],
  'lecon': {'fr': "Avant de manger : Bismillah. Après : Al-hamdou lillâh. Et on ne gaspille pas la nourriture.", 'ar': 'بِسْمِ اللهِ فِي البِدَايَةِ، وَالحَمْدُ لِلّٰهِ فِي النِّهَايَةِ.'},
  'jeux': {
    'amine': {'consigne': 'Touche les 6 bonnes choses de la table : la voix te dit leur nom en arabe !', 'ar': 'المِسِ الطَّعَامَ!', 'fond': 'm1_a',
              'objets': [['🍞', 'خُبْز'], ['🥛', 'حَلِيب'], ['🍎', 'تُفَّاحَة'], ['💧', 'مَاء'], ['🍯', 'عَسَل'], ['🍊', 'بُرْتُقَالَة']]},
    'salma': {'ordre': ['m1_a', 'm1_c', 'm1_d'], 'legendes': ['On dit Bismillah', "On a oublié ? Bismillah awwalahou wa âkhirahou", 'On dit Al-hamdou lillâh'],
              'quiz': [q('Que dit-on avant de manger ?', 'Bismillah', 'Al-hamdou lillâh', "As-salâmou 'alaykoum"), q('Que dit-on à la fin du repas ?', 'Al-hamdou lillâh', 'Bismillah', 'Bonne nuit')]},
    'essil': {'quiz': [q('Que veut dire « بِسْمِ اللهِ » ?', "Au nom d'Allah", 'Merci Allah', 'Allah est le plus grand'),
                       q('Que dit-on si on a oublié Bismillah au début du repas ?', 'Bismillah awwalahou wa âkhirahou', 'Allâhou akbar', 'Soubhâna Allah'),
                       q('Que veut dire « الحَمْدُ لِلّٰهِ » ?', 'La louange est à Allah', "Au nom d'Allah", 'La paix sur vous'),
                       q('Que fait Essil avec le pain qui reste ?', 'Elle le garde pour demain', 'Elle le jette', 'Elle le donne au chat'),
                       q('Que veut dire « خُبْز » ?', 'Le pain', 'Le lait', "L'eau")]}}})

E.append({'n': 2, 'titre': "As-salâmou 'alaykoum", 'ar': 'السَّلَامُ عَلَيْكُمْ', 'img': 'm2_a', 'scenes': [
  sc('m2_a', 'papa', "Le matin, devant l'école, Amine retrouve son ami. Il lui dit : « As-salâmou 'alaykoum ! » Cela veut dire : que la paix soit sur vous.",
     'نُلْقِي السَّلَامَ: السَّلَامُ عَلَيْكُمْ.', 'In front of a Tunisian primary school with a blue gate in the morning, the little boy happily greets another little boy of his age, both wearing school bags.', 'a'),
  sc('m2_b', 'maman', "Son ami lui répond : « Wa 'alaykoum as-salâm ! » : et sur vous la paix. Quand quelqu'un nous salue, on répond toujours, gentiment.",
     'وَنَرُدُّ: وَعَلَيْكُمُ السَّلَامُ.', 'The two little boys shake hands and smile in front of the school, other children walking in, sunny morning.', 'a'),
  sc('m2_c', 'papa', "On peut dire le salut en entier : « As-salâmou 'alaykoum wa rahmatoullâhi wa barakâtouh » : que la paix soit sur vous, ainsi que la miséricorde d'Allah et Ses bénédictions. Essil salue ainsi ses grands-parents.",
     'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ.', 'The teenage girl warmly greets her smiling grandmother and grandfather at the blue door of their house in a white Tunisian village.', 'e'),
  sc('m2_d', 'maman', "Salma tient la porte à la voisine et lui sourit. Selon un hadith (At-Tirmidhî), sourire à son frère est une aumône : une bonne action offerte. Un salut et un sourire ne coûtent rien et rendent tout le monde heureux !",
     'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ صَدَقَةٌ.', 'In the stairwell of a building, the 8-year-old girl holds the door open for an elderly neighbour carrying a basket, and smiles at her.', 's')],
  'lecon': {'fr': "On salue avec « As-salâmou 'alaykoum », on répond « Wa 'alaykoum as-salâm », et on sourit.", 'ar': 'نُفْشِي السَّلَامَ وَنَبْتَسِمُ.'},
  'jeux': {
    'amine': {'consigne': 'Touche les 6 images : la voix te dit leur nom en arabe !', 'ar': 'المِسِ الصُّوَرَ!', 'fond': 'm2_a',
              'objets': [['👋', 'سَلَام'], ['😊', 'اِبْتِسَامَة'], ['🤝', 'مُصَافَحَة'], ['🏠', 'بَيْت'], ['🏫', 'مَدْرَسَة'], ['👵', 'جَدَّة']]},
    'salma': {'ordre': ['m2_a', 'm2_b', 'm2_c', 'm2_d'], 'legendes': ["Amine dit As-salâmou 'alaykoum", "Son ami répond Wa 'alaykoum as-salâm", 'Le salut en entier', 'Salma sourit à la voisine'],
              'quiz': [q("Que répond-on à « As-salâmou 'alaykoum » ?", "Wa 'alaykoum as-salâm", 'Bismillah', 'Merci'), q('Que veut dire « salâm » ?', 'La paix', 'Le pain', 'La prière')]},
    'essil': {'quiz': [q('Que veut dire « رَحْمَة » ?', 'La miséricorde', 'La bénédiction', 'La paix'),
                       q('Que veut dire « بَرَكَات » ?', 'Les bénédictions', 'Les prières', 'Les voyages'),
                       q('Selon le hadith (At-Tirmidhî), sourire à son frère est…', 'Une aumône (sadaqa)', 'Une prière', 'Un jeûne'),
                       q('Quelle est la réponse au salut ?', "Wa 'alaykoum as-salâm", "As-salâmou 'alaykoum", 'Al-hamdou lillâh'),
                       q('Que veut dire « صَدَقَة » ?', 'Une aumône, une bonne action offerte', 'Une prière', 'Un pèlerinage')]}}})

E.append({'n': 3, 'titre': "Les ablutions", 'ar': 'الوُضُوءُ', 'img': 'm3_b', 'scenes': [
  sc('m3_a', 'papa', "Avant la prière, on fait les ablutions : le woudoû'. Essil montre à Amine comment faire. D'abord, on pense dans son cœur : « Je fais mes ablutions pour prier. » Puis on dit : « Bismillah. »",
     'نَنْوِي، ثُمَّ نَقُولُ: بِسْمِ اللهِ.', 'In a clean bathroom with Tunisian blue and white tiles, the teenage girl stands next to the little boy in front of the sink and explains with a gentle gesture, the boy listens carefully.', 'ea'),
  sc('m3_b', 'maman', "On lave les mains trois fois. Puis on se rince la bouche trois fois, et le nez trois fois. Ensuite, on lave le visage trois fois, du front au menton et d'une oreille à l'autre.",
     'نَغْسِلُ اليَدَيْنِ، ثُمَّ نَتَمَضْمَضُ وَنَسْتَنْشِقُ، ثُمَّ نَغْسِلُ الوَجْهَ.', 'At the sink with blue tiles, the little boy washes his hands under the running tap, water drops sparkling, concentrated and happy.', 'a'),
  sc('m3_c', 'papa', "Puis les bras jusqu'aux coudes, le droit d'abord puis le gauche, trois fois. On passe les mains mouillées sur la tête, puis sur les oreilles. Enfin, on lave les pieds jusqu'aux chevilles, le droit puis le gauche.",
     'ثُمَّ اليَدَيْنِ إِلَى المِرْفَقَيْنِ، ثُمَّ نَمْسَحُ الرَّأْسَ وَالأُذُنَيْنِ، ثُمَّ نَغْسِلُ الرِّجْلَيْنِ.', 'The 8-year-old girl washes her right forearm up to the elbow at the sink, sleeves rolled up, blue tiles, soft light.', 's'),
  sc('m3_d', 'maman', "Salma ferme bien le robinet : on ne gaspille pas l'eau, même pour les ablutions. Et voilà : on est propre et prêt pour la prière !",
     'لَا نُسْرِفُ فِي المَاءِ.', 'The 8-year-old girl turns off the tap carefully and smiles, the little boy next to her dries his face with a towel, clean bathroom with blue tiles.', 'sa')],
  'lecon': {'fr': "Le woudoû' : les mains, la bouche, le nez, le visage, les bras, la tête, les oreilles, les pieds. Et sans gaspiller l'eau.", 'ar': 'الوُضُوءُ نَظَافَةٌ وَاسْتِعْدَادٌ لِلصَّلَاةِ.'},
  'jeux': {
    'amine': {'consigne': "Touche les 6 images du woudoû' : la voix te dit leur nom en arabe !", 'ar': 'المِسِ الصُّوَرَ!', 'fond': 'm3_b',
              'objets': [['💧', 'مَاء'], ['✋', 'يَد'], ['👃', 'أَنْف'], ['👄', 'فَم'], ['👂', 'أُذُن'], ['🦶', 'رِجْل']]},
    'salma': {'ordre': ['m3_a', 'm3_b', 'm3_c', 'm3_d'], 'legendes': ["L'intention et Bismillah", 'Les mains, la bouche, le nez, le visage', 'Les bras, la tête, les oreilles, les pieds', 'On ferme le robinet'],
              'quiz': [q('Que lave-t-on en premier ?', 'Les mains', 'Les pieds', 'La tête'), q('Combien de fois lave-t-on le visage ?', 'Trois fois', 'Une fois', 'Dix fois')]},
    'essil': {'quiz': [q('Que veut dire « الوُضُوء » ?', 'Les ablutions', 'La prière', 'Le jeûne'),
                       q("Jusqu'où lave-t-on les bras ?", "Jusqu'aux coudes", "Jusqu'aux poignets", "Jusqu'aux épaules"),
                       q('Par quel côté commence-t-on ?', 'Le droit', 'Le gauche', 'Peu importe'),
                       q('Que fait-on pour la tête ?', 'On passe les mains mouillées dessus', 'On la lave trois fois', 'Rien'),
                       q('Que veut dire « لَا نُسْرِفُ » ?', 'On ne gaspille pas', 'On se dépêche', 'On recommence')]}}})

E.append({'n': 4, 'titre': 'Les cinq prières', 'ar': 'الصَّلَاةُ', 'img': 'm4_a', 'scenes': [
  sc('m4_a', 'papa', "Cinq fois par jour, les musulmans prient Allah : Al-Fajr à l'aube, Adh-Dhohr à midi, Al-'Asr l'après-midi, Al-Maghrib au coucher du soleil et Al-'Ichâ' la nuit.",
     'نُصَلِّي خَمْسَ صَلَوَاتٍ: الفَجْرَ وَالظُّهْرَ وَالعَصْرَ وَالمَغْرِبَ وَالعِشَاءَ.', 'On a roof terrace at sunset, the three children look at the white minaret of a Tunisian neighbourhood mosque against an orange and purple sky.', 'esa'),
  sc('m4_b', 'maman', "On entend l'appel à la prière, l'adhân, depuis la mosquée du quartier. On se tourne vers la Qibla : la direction de la Ka'ba, à La Mecque. Amine déroule son petit tapis.",
     'نَتَّجِهُ إِلَى القِبْلَةِ.', 'In a calm living room, the little boy unrolls a small colourful prayer rug on the floor, a compass and a window showing the evening sky.', 'a'),
  sc('m4_c', 'papa', "On commence par « Allâhou akbar » : Allah est le plus grand. On se tient debout, on s'incline (le roukoû'), on se prosterne le front sur le sol (le soujoûd), puis on s'assoit. On finit en saluant : « As-salâmou 'alaykoum ».",
     'اللهُ أَكْبَرُ: قِيَامٌ، ثُمَّ رُكُوعٌ، ثُمَّ سُجُودٌ.', 'The teenage girl, wearing a white prayer veil, stands calmly on a prayer rug with her hands raised to her ears to begin the prayer, peaceful room, soft light.', 'e'),
  sc('m4_d', 'maman', "Essil, Salma et Amine prient ensemble, en rang, derrière papa. Dans la prière, on parle à Allah : on Le remercie et on Lui demande ce qui est bon. Le cœur devient calme et heureux.",
     'فِي الصَّلَاةِ نَشْكُرُ اللهَ وَنَدْعُوهُ.', 'Seen from behind, a father and the three children stand in a row on prayer rugs in a peaceful room, the girls wear prayer veils, evening light through the window.', 'esa')],
  'lecon': {'fr': "Cinq prières par jour, tournés vers la Qibla : on commence par « Allâhou akbar » et on finit par le salut.", 'ar': 'خَمْسُ صَلَوَاتٍ فِي اليَوْمِ وَاللَّيْلَةِ.'},
  'jeux': {
    'amine': {'consigne': 'Touche les 6 images : la voix te dit leur nom en arabe !', 'ar': 'المِسِ الصُّوَرَ!', 'fond': 'm4_a',
              'objets': [['🕌', 'مَسْجِد'], ['🕋', 'الكَعْبَة'], ['🌅', 'فَجْر'], ['☀️', 'شَمْس'], ['🌙', 'قَمَر'], ['⭐', 'نَجْمَة']]},
    'salma': {'ordre': ['m4_a', 'm4_b', 'm4_c', 'm4_d'], 'legendes': ['Les cinq prières de la journée', 'On se tourne vers la Qibla', "Allâhou akbar : on commence", 'On prie ensemble'],
              'quiz': [q('Combien de prières par jour ?', 'Cinq', 'Trois', 'Sept'), q('Quelle prière fait-on au coucher du soleil ?', 'Al-Maghrib', 'Al-Fajr', 'Adh-Dhohr')]},
    'essil': {'quiz': [q('Vers où se tourne-t-on pour prier ?', "Vers la Qibla, la Ka'ba à La Mecque", 'Vers le soleil', 'Vers la mer'),
                       q('Que veut dire « رُكُوع » ?', "S'incliner", 'Se prosterner', 'Se lever'),
                       q('Que veut dire « سُجُود » ?', 'Se prosterner', "S'incliner", "S'asseoir"),
                       q("Comment s'appelle l'appel à la prière ?", "L'adhân", 'La Qibla', 'Le minbar'),
                       q("Quelle est la prière de l'aube ?", 'Al-Fajr', "Al-'Asr", "Al-'Ichâ'")]}}})

E.append({'n': 5, 'titre': "Ramadan et l'Aïd", 'ar': 'رَمَضَانُ وَالعِيدُ', 'img': 'm5_b', 'scenes': [
  sc('m5_a', 'maman', "Voici le mois de Ramadan ! Les grands jeûnent : ils ne mangent pas et ne boivent pas, de l'aube jusqu'au coucher du soleil. Les enfants s'entraînent petit à petit, une demi-journée par exemple.",
     'فِي رَمَضَانَ نَصُومُ مِنَ الفَجْرِ إِلَى المَغْرِبِ.', 'On a roof terrace at dusk, the three children point at a thin crescent moon in the sky above the white houses, festive lanterns hanging.', 'esa'),
  sc('m5_b', 'papa', "Au coucher du soleil, à l'appel du Maghrib, on rompt le jeûne, souvent avec des dattes et un verre de lait ou d'eau : c'est l'iftâr. Toute la famille est réunie autour de la chorba.",
     'عِنْدَ المَغْرِبِ نُفْطِرُ عَلَى التَّمْرِ.', 'A Tunisian Ramadan iftar table with dates, milk, a steaming bowl of chorba soup and brik, the three children sit around it, joyful family atmosphere, lanterns.', 'esa'),
  sc('m5_c', 'maman', "Pendant Ramadan, on pense à ceux qui ont faim : on partage et on donne. Avant l'Aïd, chaque famille donne la zakât al-fitr, pour que les plus pauvres puissent aussi faire la fête.",
     'نَتَصَدَّقُ وَنُعْطِي زَكَاةَ الفِطْرِ.', 'The teenage girl and the 8-year-old girl carry a basket full of food and bags to give to a neighbour at a blue door, kind faces, evening.', 'es'),
  sc('m5_d', 'papa', "Et voici l'Aïd al-Fitr ! On met de beaux habits, on va à la prière de l'Aïd, on rend visite à la famille, on mange des gâteaux, et on se dit : « Aïd moubârak ! »",
     'عِيدٌ مُبَارَكٌ!', 'Eid morning in a Tunisian street decorated with garlands, the three children wear beautiful new traditional festive clothes and hold a plate of Tunisian pastries, very happy.', 'esa')],
  'lecon': {'fr': "Ramadan : jeûner, partager et prier. Puis la joie de l'Aïd en famille.", 'ar': 'رَمَضَانُ شَهْرُ الصِّيَامِ وَالخَيْرِ.'},
  'jeux': {
    'amine': {'consigne': 'Touche les 6 images de Ramadan : la voix te dit leur nom en arabe !', 'ar': 'المِسِ الصُّوَرَ!', 'fond': 'm5_b',
              'objets': [['🌙', 'هِلَال'], ['🌴', 'نَخْلَة'], ['🥛', 'حَلِيب'], ['🍲', 'شُرْبَة'], ['🎁', 'هَدِيَّة'], ['🍪', 'حَلْوَى']]},
    'salma': {'ordre': ['m5_a', 'm5_b', 'm5_c', 'm5_d'], 'legendes': ['Le mois de Ramadan commence', "L'iftâr avec des dattes", 'On partage avec les plus pauvres', "La joie de l'Aïd"],
              'quiz': [q('Avec quoi rompt-on souvent le jeûne ?', 'Des dattes', 'Des frites', 'Des bonbons'), q("Que dit-on le jour de l'Aïd ?", 'Aïd moubârak', 'Bonne nuit', 'Bon appétit')]},
    'essil': {'quiz': [q('De quand à quand jeûne-t-on ?', "De l'aube au coucher du soleil", 'De midi à minuit', 'Le jour et la nuit'),
                       q('Que veut dire « إِفْطَار » ?', 'La rupture du jeûne', "Le repas avant l'aube", 'La prière'),
                       q("Que donne-t-on avant la prière de l'Aïd al-Fitr ?", 'La zakât al-fitr', 'Des fleurs', 'Rien'),
                       q('Que veut dire « هِلَال » ?', 'Le croissant de lune', "L'étoile", 'Le soleil'),
                       q("Comment s'appelle le repas pris avant l'aube ?", 'Le souhoûr', "L'iftâr", "Le 'ichâ'")]}}})

E.append({'n': 6, 'titre': 'Être gentil avec tous', 'ar': 'الأَخْلَاقُ الحَسَنَةُ', 'img': 'm6_c', 'scenes': [
  sc('m6_a', 'papa', "Être un bon musulman, c'est aussi être gentil. D'abord avec ses parents : Salma aide maman à mettre la table, Amine range ses jouets, et on parle aux parents avec respect.",
     'نُطِيعُ الوَالِدَيْنِ وَنُسَاعِدُهُمَا.', 'In a bright Tunisian living room, the 8-year-old girl sets plates on the table and the little boy puts his toys back into a box, cheerful.', 'sa'),
  sc('m6_b', 'maman', "Avec les voisins aussi : on leur porte un peu de notre plat, on ne fait pas de bruit le soir, on les aide. Essil porte les courses de la voisine âgée.",
     'نُحْسِنُ إِلَى الجَارِ.', 'In a narrow white and blue street, the teenage girl carries heavy shopping bags for an elderly neighbour who walks with a cane and smiles gratefully.', 'e'),
  sc('m6_c', 'papa', "Et avec les animaux ! Selon un hadith (Al-Boukhârî et Mouslim), un homme donna à boire à un chien qui mourait de soif, et Allah lui pardonna. Amine remplit le bol d'eau du chat du quartier.",
     'نَرْحَمُ الحَيَوَانَ، وَفِي كُلِّ كَبِدٍ رَطْبَةٍ أَجْرٌ.', 'On a doorstep of a medina street, the little boy pours water from a jug into a bowl for a thirsty tabby cat, tender and sunny.', 'a'),
  sc('m6_d', 'maman', "Partager, aider, dire merci, pardonner à son frère ou à sa sœur : chaque bonne action compte. Le soir, chacun raconte la gentillesse qu'il a faite aujourd'hui.",
     'كُلُّ عَمَلٍ طَيِّبٍ صَدَقَةٌ.', 'In the evening on a sofa with Tunisian cushions, the three children sit together and talk happily, sharing a plate of fruit, warm lamp light.', 'esa')],
  'lecon': {'fr': "On est gentil avec les parents, les voisins et les animaux : chaque bonne action compte.", 'ar': 'نُحْسِنُ إِلَى الجَمِيعِ.'},
  'jeux': {
    'amine': {'consigne': 'Touche les 6 images : la voix te dit leur nom en arabe !', 'ar': 'المِسِ الصُّوَرَ!', 'fond': 'm6_c',
              'objets': [['🐱', 'قِطّ'], ['🐶', 'كَلْب'], ['🐦', 'عُصْفُور'], ['👩', 'أُمّ'], ['👨', 'أَب'], ['🏡', 'جَار']]},
    'salma': {'ordre': ['m6_a', 'm6_b', 'm6_c', 'm6_d'], 'legendes': ['On aide ses parents', 'On aide la voisine', 'On donne à boire au chat', 'On raconte sa bonne action'],
              'quiz': [q('Que fait Amine pour le chat ?', "Il lui donne de l'eau", 'Il le chasse', "Il l'ignore"), q('Comment parle-t-on à ses parents ?', 'Avec respect', 'En criant', 'On ne leur parle pas')]},
    'essil': {'quiz': [q('Que veut dire « الجَار » ?', 'Le voisin', 'Le frère', "L'ami"),
                       q('Que veut dire « الوَالِدَان » ?', 'Les parents', 'Les voisins', 'Les enfants'),
                       q("Dans le hadith, pourquoi l'homme a-t-il été pardonné ?", 'Il a donné à boire à un chien assoiffé', 'Il a construit une maison', 'Il a beaucoup voyagé'),
                       q('Que veut dire « خُلُق » ?', 'Le caractère, la manière de se comporter', 'La nourriture', 'Le travail'),
                       q('Que fait-on pour un voisin ?', "On partage et on l'aide", 'On fait du bruit', "On l'ignore")]}}})

E.append({'n': 7, 'titre': 'Mes invocations de la journée', 'ar': 'أَذْكَارُ اليَوْمِ', 'img': 'm7_d', 'scenes': [
  sc('m7_a', 'maman', "Le matin, en se réveillant, Amine dit : « Al-hamdou lillâhi lladhî ahyânâ ba'da mâ amâtanâ wa ilayhi n-nouchoûr » : louange à Allah qui nous a rendu la vie après le sommeil, et c'est vers Lui que nous retournerons.",
     'الحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ.', 'Morning sunlight in a child bedroom, the little boy wakes up, sits in his bed and stretches with a big smile, birds at the window.', 'a'),
  sc('m7_b', 'papa', "En sortant de la maison, Salma dit : « Bismillah, tawakkaltou 'ala Allah » : au nom d'Allah, je place ma confiance en Allah.",
     'بِسْمِ اللهِ، تَوَكَّلْتُ عَلَى اللهِ.', 'The 8-year-old girl with her school bag steps out of a blue Tunisian front door into a sunny street, confident and smiling.', 's'),
  sc('m7_c', 'maman', "Atchoum ! Quand Essil éternue, elle dit : « Al-hamdou lillâh ». Salma lui répond : « Yarhamouki Allah » (qu'Allah te fasse miséricorde). Et Essil répond : « Yahdîkoumou Allah wa youslihou bâlakoum » (qu'Allah vous guide et améliore votre état).",
     'يَرْحَمُكِ اللهُ. يَهْدِيكُمُ اللهُ وَيُصْلِحُ بَالَكُمْ.', 'In the kitchen, the teenage girl sneezes into a tissue with a funny face, the 8-year-old girl next to her laughs kindly.', 'es'),
  sc('m7_d', 'papa', "Le soir, au lit, Amine dit : « Bismika Allâhoumma amoûtou wa ahyâ » : c'est en Ton nom, ô Allah, que je m'endors et que je me réveille. Bonne nuit !",
     'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.', 'At night in a cosy child bedroom with a night light, the little boy lies in bed under a blanket with his eyes closing, moonlight and stars through the window.', 'a')],
  'lecon': {'fr': "Une petite invocation pour chaque moment : au réveil, en sortant, quand on éternue, avant de dormir.", 'ar': 'نَذْكُرُ اللهَ فِي كُلِّ وَقْتٍ.'},
  'jeux': {
    'amine': {'consigne': 'Touche les 6 images de la journée : la voix te dit leur nom en arabe !', 'ar': 'المِسِ الصُّوَرَ!', 'fond': 'm7_a',
              'objets': [['☀️', 'صَبَاح'], ['🚪', 'بَاب'], ['🤧', 'عُطَاس'], ['🛏️', 'سَرِير'], ['🌙', 'لَيْل'], ['🏠', 'بَيْت']]},
    'salma': {'ordre': ['m7_a', 'm7_b', 'm7_c', 'm7_d'], 'legendes': ['Au réveil', 'En sortant de la maison', 'Quand on éternue', 'Avant de dormir'],
              'quiz': [q('Que dit-on quand on éternue ?', 'Al-hamdou lillâh', 'Bismillah', 'Aïd moubârak'), q('Que dit-on en sortant de la maison ?', "Bismillah, tawakkaltou 'ala Allah", 'Bonne nuit', "Wa 'alaykoum as-salâm")]},
    'essil': {'quiz': [q("Que répond-on à une fille qui éternue et dit Al-hamdou lillâh ?", 'Yarhamouki Allah', 'Bismillah', 'Amîn'),
                       q('Que veut dire « تَوَكَّلْتُ عَلَى اللهِ » ?', 'Je place ma confiance en Allah', 'Je remercie Allah', 'Je demande pardon'),
                       q('Que veut dire « اللَّهُمَّ » ?', 'Ô Allah', 'Merci', 'La paix'),
                       q('Quand dit-on « بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا » ?', 'Avant de dormir', 'Avant de manger', 'En entrant à la mosquée'),
                       q('Que veut dire « يَهْدِيكُمُ اللهُ » ?', "Qu'Allah vous guide", "Qu'Allah vous pardonne", "Qu'Allah vous nourrisse")]}}})

REFS = {'e': 'houma_essil.png', 's': 'houma_salma.png', 'a': 'eng_amine.png'}
NOMS = {'e': 'the teenage girl (12 years old)', 's': 'the 8-year-old girl', 'a': 'the little boy (5 years old)'}
if '--scenes' in sys.argv:   # la liste pour ComfyUI : [références, demande, graine, préfixe]
    out = []
    for e in E:
        for k, s in enumerate(e['scenes']):
            refs = [REFS[c] for c in s['_enf']]
            qui = ', '.join(f"{NOMS[c]} is exactly the person of image {i + 2} (same face, hair, skin tone)" for i, c in enumerate(s['_enf']))
            p = (f"Cartoon still from a 3D animated family movie, gentle and warm. {qui}. {s['_p']} "
                 "Only these children, each appearing once. No text, no letters. Wide landscape cinematic shot, warm colours, high quality animation style. The first image only gives the picture size.")
            out.append([refs, p, 9500 + e['n'] * 10 + k, 'pm/' + s['img']])
    print(json.dumps(out, ensure_ascii=False))
else:
    for e in E:
        for s in e['scenes']: s.pop('_p'); s.pop('_enf')
    os.makedirs(DST, exist_ok=True)
    open(os.path.join(DST, 'episodes.js'), 'w').write(
        "/* « Ma vie de petit musulman » (Éveil religieux, série 3) : FICHIER FABRIQUÉ par docs/eveil/episodes_petit_musulman.py, ne pas modifier à la main.\n"
        "   Textes relus par le papa. Règles : jamais d'image d'un prophète, d'un compagnon ni d'un ange ; pas de verset du Coran ici. */\n"
        "export const COUVERTURE = 'm4_a';\nexport const EPISODES = " + json.dumps(E, ensure_ascii=False, indent=1) + ';\n')
    print(len(E), 'épisodes')
