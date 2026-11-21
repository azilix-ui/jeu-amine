"""Éveil religieux · rubrique « Sourate », 2e sourate (21/11) : fabrique eveil/sourate/nas.js (An-Nâs), même façon que la Fâtiḥa.
Usage : python3 -I sourate_nas.py <node_modules/quran-json> <docs/eveil/nas-sources.json> <eveil/sourate/nas.js>
Le texte arabe (uthmani) et le sens (Hamidullah) viennent de quran-json ; les couleurs du tajwid d'alquran.cloud ;
les moments des mots dans la récitation d'Al-Husary de quran.com (nas-sources.json). Rien n'est retapé à la main,
sauf les textes de la famille (lettres françaises, explications, phrases des conteurs), à faire relire par le papa
(document claude.ai « Sourate An-Nâs — textes à relire ») AVANT publication."""
import json, os, re, sys

qj, src, out = sys.argv[1], sys.argv[2], sys.argv[3]
sur = json.load(open(os.path.join(qj, 'dist/chapters/fr/114.json'), encoding='utf-8'))
S = json.load(open(src, encoding='utf-8'))

TR = [  # pour Salma : un mot français par mot arabe
    ['Qoul', "a'oûdhou", 'bi-rabbi', 'n-nâs'],
    ['Maliki', 'n-nâs'],
    ['Ilâhi', 'n-nâs'],
    ['Min', 'charri', 'l-waswâsi', 'l-khannâs'],
    ['Al-ladhî', 'youwaswisou', 'fî', 'soudoûri', 'n-nâs'],
    ['Mina', 'l-jinnati', 'wa n-nâs'],
]
MOT = [  # pour Salma : un mot à retenir (arabe, lettres françaises, sens)
    ['أَعُوذُ', "a'oûdhou", 'je cherche protection'],
    ['مَلِك', 'malik', 'le roi'],
    ['إِلَٰه', 'ilâh', 'Dieu, Celui qu\'on adore'],
    ['شَرّ', 'charr', 'le mal'],
    ['صُدُور', 'soudoûr', 'les poitrines, les cœurs'],
    ['النَّاس', 'an-nâs', 'les gens, les hommes'],
]
ESSIL = [  # explication (maman) et le mot avec sa racine
    ["An-Nâs et Al-Falaq sont les deux sourates de la protection (al-mou'awwidhatân). On demande la protection d'Allah, le Rabb : Celui qui crée les gens et prend soin d'eux.", 'أَعُوذُ', 'racine ع و ذ : chercher refuge, protection'],
    ["Allah est le Roi (Malik) des gens : tout Lui appartient et Il décide de toute chose.", 'مَلِك', 'racine م ل ك : posséder, régner'],
    ["Allah est l'Ilâh des gens : le seul qui mérite d'être adoré. Trois noms en trois versets : Rabb, Malik, Ilâh.", 'إِلَٰه', 'Celui qu\'on adore'],
    ["Al-waswâs, c'est celui qui chuchote de mauvaises idées ; al-khannâs, celui qui recule et se cache quand on se souvient d'Allah.", 'الْخَنَّاس', 'racine خ ن س : reculer, se cacher'],
    ["Il souffle ses mauvaises idées dans les poitrines, c'est-à-dire dans les cœurs des gens.", 'يُوَسْوِسُ', 'chuchoter de mauvaises pensées'],
    ["Ce chuchoteur peut être un djinn, qu'on ne voit pas, ou un être humain qui pousse au mal. On s'en protège en se souvenant d'Allah.", 'الْجِنَّة', 'les djinns, que l\'on ne voit pas'],
]
AMINE = [  # ce que dit papa, et la scène animée (aucune personne)
    ["Dis : je demande à Allah, qui prend soin de tous les gens, de me protéger.", 'sn1'],
    ["Allah est le Roi de tous les gens.", 'sn2'],
    ["Allah est le Dieu de tous les gens : c'est Lui seul qu'on adore.", 'sn3'],
    ["Protège-moi du chuchoteur qui veut nous faire faire des bêtises, et qui se cache.", 'sn4'],
    ["Celui qui chuchote de mauvaises idées dans le cœur des gens.", 'sn5'],
    ["Qu'il soit un djinn ou un être humain : Allah nous protège de tout cela.", 'sn6'],
]

def tajwid(t):   # « [h:1[ٱ]للَّهِ » -> mots = listes de [texte, classe] ; une marque qui enjambe un espace est coupée en deux
    t = re.sub(r'\[(\w)(:\d+)?\[([^\]\s]+) ([^\]\s]+)\]', r'[\1\2[\3] [\1\2[\4]', t)
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
    V.append({ 'n':k + 1, 'ar':v['text'], 'mots':ar, 'tj':tj, 'fr':v['translation'].replace('«', '« ').replace('»', ' »').replace('  ', ' ').replace(':', ' :').replace('  ', ' '), 'tr':TR[k], 'seg':seg,
               'mot':MOT[k], 'essil':ESSIL[k][0], 'racine':ESSIL[k][1:], 'amine':AMINE[k][0], 'scene':AMINE[k][1] })

PH = {
    'debut': ["Aujourd'hui, on apprend An-Nâs, la dernière sourate du Coran. Écoute bien cheikh Al-Husary, puis répète après lui.",
              'اَلْيَوْمَ نَتَعَلَّمُ سُورَةَ النَّاسِ. اِسْتَمِعْ إِلَى الشَّيْخِ، ثُمَّ رَدِّدْ بَعْدَهُ.', 'اَلْيَوْمَ نَتَعَلَّمُ سُورَةَ النَّاسِ. اِسْتَمِعِي إِلَى الشَّيْخِ، ثُمَّ رَدِّدِي بَعْدَهُ.'],
    'ecoute': ['Écoute.', 'اِسْتَمِعْ.', 'اِسْتَمِعِي.'],
    'atoi': ['À toi ! Répète.', 'دَوْرُكَ! رَدِّدْ.', 'دَوْرُكِ! رَدِّدِي.'],
    'bravo': ["Bravo, c'est très bien !", 'أَحْسَنْتَ!', 'أَحْسَنْتِ!'],
    'moitie': ['Très bien ! On le redit encore une fois.', 'جَيِّدٌ! نُعِيدُهَا مَرَّةً أُخْرَى.', 'جَيِّدٌ! نُعِيدُهَا مَرَّةً أُخْرَى.'],
    'rien': ["Je ne t'ai pas entendu. Parle un peu plus fort, près de la tablette.", 'لَمْ أَسْمَعْكَ، تَكَلَّمْ بِصَوْتٍ أَعْلَى.', 'لَمْ أَسْمَعْكِ، تَكَلَّمِي بِصَوْتٍ أَعْلَى.'],
    'continue': ["Ce n'est pas grave, on continue. Tu y arriveras !", 'لَا بَأْسَ، نُوَاصِلُ.', 'لَا بَأْسَ، نُوَاصِلُ.'],
    'fin': ["Bravo ! Tu as appris An-Nâs, la sourate de la protection.", 'مَا شَاءَ اللهُ! حَفِظْتَ سُورَةَ النَّاسِ.', 'مَا شَاءَ اللهُ! حَفِظْتِ سُورَةَ النَّاسِ.'],
    'seul': ['Maintenant, récite toute la sourate tout seul. Je t\'écoute !', 'وَالْآنَ اِقْرَأِ السُّورَةَ كُلَّهَا وَحْدَكَ.', 'وَالْآنَ اِقْرَئِي السُّورَةَ كُلَّهَا وَحْدَكِ.'],
}
SAVOIR = "An-Nâs veut dire « les gens, les hommes » : c'est la dernière sourate du Coran (la 114e), 6 versets. Avec Al-Falaq, on les appelle « al-mou'awwidhatân », les deux sourates de la protection : on les récite le matin, le soir et avant de dormir."

js = ('/* Fabriqué par docs/eveil/sourate_nas.py : ne pas modifier à la main. Textes de la famille relus par le papa.\n'
      '   Arabe (uthmani) et sens (Hamidullah) : quran-json ; tajwid : alquran.cloud ; moments des mots (ms) : quran.com (Al-Husary). */\n'
      'export const SOURATE = ' + json.dumps({ 'n':114, 'nom':'An-Nâs', 'ar':'النَّاس', 'fr':'Les hommes', 'savoir':SAVOIR, 'avant':6230, 'cartes':['sncover', 'sn4', 'sn1'] }, ensure_ascii=False) + ';\n'
      'export const VERSETS = ' + json.dumps(V, ensure_ascii=False) + ';\n'
      'export const PHRASES = ' + json.dumps(PH, ensure_ascii=False) + ';\n')
open(out, 'w', encoding='utf-8').write(js)
print(out, len(js) // 1024, 'Ko,', len(V), 'versets')
