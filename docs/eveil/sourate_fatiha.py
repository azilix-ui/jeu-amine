"""Éveil religieux · rubrique « Sourate » (18/11) : fabrique eveil/sourate/fatiha.js.
Usage : python3 -I sourate_fatiha.py <node_modules/quran-json> <docs/eveil/fatiha-sources.json> <eveil/sourate/fatiha.js>
Le texte arabe (uthmani) et le sens (Hamidullah) viennent de quran-json ; les couleurs du tajwid d'alquran.cloud ;
les moments des mots dans la récitation d'Al-Husary de quran.com (fatiha-sources.json). Rien n'est retapé à la main,
sauf les textes de la famille (lettres françaises, explications, phrases des conteurs), relus par le papa
(document claude.ai « Sourate Al-Fatiha — textes à relire »)."""
import json, os, re, sys

qj, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
sur = json.load(open(os.path.join(qj, 'dist/chapters/fr/1.json'), encoding='utf-8'))
S = json.load(open(src, encoding='utf-8'))

# les textes de la famille, verset par verset
TR = [  # pour Salma : un mot français par mot arabe
    ['Bismi', 'l-lâhi', 'r-raḥmâni', 'r-raḥîm'],
    ['Al-ḥamdou', 'li-llâhi', 'rabbi', "l-'âlamîn"],
    ['Ar-raḥmâni', 'r-raḥîm'],
    ['Mâliki', 'yawmi', 'd-dîn'],
    ['Iyyâka', "na'boudou", 'wa iyyâka', "nasta'în"],
    ['Ihdinâ', 's-sirâta', 'l-moustaqîm'],
    ['Sirâta', 'l-ladhîna', "an'amta", "'alayhim", 'ghayri', 'l-maghdoûbi', "'alayhim", 'wa lâ', 'd-dâllîn'],
]
MOT = [  # pour Salma : un mot à retenir (arabe, lettres françaises, sens)
    ['بِسْمِ', 'bismi', 'au nom de'],
    ['الْحَمْدُ', 'al-ḥamdou', 'la louange (dire merci à Allah)'],
    ['الرَّحِيم', 'ar-raḥîm', 'le Très Miséricordieux'],
    ['يَوْم', 'yawm', 'le jour'],
    ['نَعْبُدُ', "na'boudou", 'nous adorons'],
    ['الصِّرَاط', 'as-sirât', 'le chemin'],
    ['أَنْعَمْتَ', "an'amta", 'Tu as comblé de bienfaits'],
]
ESSIL = [  # explication (maman) et le mot avec sa racine
    ["On commence tout ce qu'on fait au nom d'Allah. Selon beaucoup de savants, Ar-Raḥmân dit que Sa miséricorde touche toute la création, et Ar-Raḥîm qu'Il est miséricordieux envers les croyants.", 'الرَّحْمَن', 'racine ر ح م : la miséricorde (رَحْمَة)'],
    ["On loue et on remercie Allah pour tout. Il est le Rabb : Celui qui crée, nourrit et prend soin de tous les mondes, les humains, les animaux et tout ce qui existe.", 'رَبّ', 'le Seigneur qui prend soin'],
    ["Sa miséricorde revient une deuxième fois, juste avant de parler du Jour du jugement.", 'الْعَالَمِين', '(verset 2) : les mondes'],
    ["Allah est le Maître du Jour où chacun reçoit la récompense de ce qu'il a fait. Ici, « ad-dîn » veut dire la rétribution.", 'مَالِك', 'racine م ل ك : posséder, régner'],
    ["Le cœur de la sourate : on parle directement à Allah. Le mot « iyyâka » est mis en premier pour dire « Toi seul » : on n'adore que Lui et on ne demande l'aide qu'à Lui.", 'نَسْتَعِين', 'racine ع و ن : l\'aide'],
    ["La première demande du Coran : être guidé sur le droit chemin, et y rester.", 'اهْدِنَا', 'racine ه د ي : la guidée (هِدَايَة)'],
    ["Le chemin des gens qu'Allah a comblés de bienfaits, comme les prophètes et les gens de bien ; pas celui de ceux qui ont mérité Sa colère, ni celui des égarés.", 'أَنْعَمْتَ', 'racine ن ع م : le bienfait (نِعْمَة)'],
]
AMINE = [  # ce que dit papa, et la scène animée
    ["On commence toujours au nom d'Allah, qui est très bon et plein d'amour.", 'sf1'],
    ["Merci, Allah ! C'est Lui qui a créé le ciel, la mer, les animaux, et nous.", 'sf2'],
    ["Allah est très bon : Il nous aime et Il nous pardonne.", 'sf3'],
    ["Un jour, Allah récompensera tout le bien qu'on a fait.", 'sf4'],
    ["Toi seul, nous Te prions, et c'est à Toi seul qu'on demande de l'aide.", 'sf5'],
    ["Montre-nous le bon chemin.", 'sf6'],
    ["Le chemin des gens que Tu aimes et que Tu combles de bienfaits, pas le chemin de ceux qui se perdent.", 'sf7'],
]

def tajwid(t):   # « [h:1[ٱ]للَّهِ » -> mots = listes de [texte, classe]
    mots = []
    for w in t.split(' '):
        parts, i = [], 0
        for m in re.finditer(r'\[(\w)(?::\d+)?\[(.*?)\]', w):
            if m.start() > i: parts.append([w[i:m.start()], ''])
            parts.append([m.group(2), m.group(1)]); i = m.end()
        if i < len(w): parts.append([w[i:], ''])
        mots.append(parts)
    return mots

V = []
for k, v in enumerate(sur['verses']):
    ar = v['text'].split(' ')
    tj = tajwid(S['tajwid'][k])
    seg = [[s[2], s[3]] for s in S['segments'][k]]
    assert len(ar) == len(tj) == len(TR[k]) == len(seg), (k, len(ar), len(tj), len(TR[k]), len(seg))
    V.append({ 'n':k + 1, 'ar':v['text'], 'mots':ar, 'tj':tj, 'fr':v['translation'], 'tr':TR[k], 'seg':seg,
               'mot':MOT[k], 'essil':ESSIL[k][0], 'racine':ESSIL[k][1:], 'amine':AMINE[k][0], 'scene':AMINE[k][1] })

# les phrases des conteurs : [français, arabe au masculin, arabe au féminin]
PH = {
    'debut': ["Aujourd'hui, on apprend Al-Fâtiḥa, la sourate qui ouvre le Coran. Écoute bien cheikh Al-Husary, puis répète après lui.",
              'اَلْيَوْمَ نَتَعَلَّمُ سُورَةَ الْفَاتِحَةِ. اِسْتَمِعْ إِلَى الشَّيْخِ، ثُمَّ رَدِّدْ بَعْدَهُ.', 'اَلْيَوْمَ نَتَعَلَّمُ سُورَةَ الْفَاتِحَةِ. اِسْتَمِعِي إِلَى الشَّيْخِ، ثُمَّ رَدِّدِي بَعْدَهُ.'],
    'ecoute': ['Écoute.', 'اِسْتَمِعْ.', 'اِسْتَمِعِي.'],
    'atoi': ['À toi ! Répète.', 'دَوْرُكَ! رَدِّدْ.', 'دَوْرُكِ! رَدِّدِي.'],
    'bravo': ["Bravo, c'est très bien !", 'أَحْسَنْتَ!', 'أَحْسَنْتِ!'],
    'moitie': ['Très bien ! On le redit encore une fois.', 'جَيِّدٌ! نُعِيدُهَا مَرَّةً أُخْرَى.', 'جَيِّدٌ! نُعِيدُهَا مَرَّةً أُخْرَى.'],
    'rien': ["Je ne t'ai pas entendu. Parle un peu plus fort, près de la tablette.", 'لَمْ أَسْمَعْكَ، تَكَلَّمْ بِصَوْتٍ أَعْلَى.', 'لَمْ أَسْمَعْكِ، تَكَلَّمِي بِصَوْتٍ أَعْلَى.'],
    'continue': ["Ce n'est pas grave, on continue. Tu y arriveras !", 'لَا بَأْسَ، نُوَاصِلُ.', 'لَا بَأْسَ، نُوَاصِلُ.'],
    'fin': ["Bravo ! Tu as appris Al-Fâtiḥa, la sourate qu'on récite à chaque prière.", 'مَا شَاءَ اللهُ! حَفِظْتَ سُورَةَ الْفَاتِحَةِ.', 'مَا شَاءَ اللهُ! حَفِظْتِ سُورَةَ الْفَاتِحَةِ.'],
    'seul': ['Maintenant, récite toute la sourate tout seul. Je t\'écoute !', 'وَالْآنَ اِقْرَأِ السُّورَةَ كُلَّهَا وَحْدَكَ.', 'وَالْآنَ اِقْرَئِي السُّورَةَ كُلَّهَا وَحْدَكِ.'],
}
SAVOIR = "Al-Fâtiḥa veut dire « l'ouverture » : elle ouvre le Coran. 7 versets, révélée à La Mecque. On la récite à chaque rak'a de la prière. On l'appelle aussi « Oumm al-Kitâb » (la mère du Livre) et « les sept versets répétés »."

js = ('/* Fabriqué par docs/eveil/sourate_fatiha.py : ne pas modifier à la main. Textes de la famille relus par le papa.\n'
      '   Arabe (uthmani) et sens (Hamidullah) : quran-json ; tajwid : alquran.cloud ; moments des mots (ms) : quran.com (Al-Husary). */\n'
      'export const SOURATE = ' + json.dumps({ 'n':1, 'nom':'Al-Fâtiḥa', 'ar':'الفَاتِحَة', 'fr':"L'ouverture", 'savoir':SAVOIR, 'avant':0 }, ensure_ascii=False) + ';\n'
      'export const VERSETS = ' + json.dumps(V, ensure_ascii=False) + ';\n'
      'export const PHRASES = ' + json.dumps(PH, ensure_ascii=False) + ';\n')
open(out, 'w', encoding='utf-8').write(js)
print(out, len(js) // 1024, 'Ko,', len(V), 'versets')
