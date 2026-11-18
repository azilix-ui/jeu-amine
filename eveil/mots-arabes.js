/* Éveil religieux (18/11, demande du papa) : dans les explications de papa et maman, les mots arabes (prénoms, noms
   d'Allah, de sourates, de lieux…) sont dits par une voix arabe (Mohammad, api/voix.php?l=ar) au lieu de la voix française.
   parties(texte) coupe un texte français en morceaux [texte, 'fr'|'ar'] ; le morceau arabe est remplacé par son écriture arabe
   (c'est elle qu'on envoie à la voix). L'affichage, lui, garde le texte d'origine. Le plus long d'abord (« Abû Bakr » avant « Abû »). */
export const LEXIQUE = [
  ['Allahou akbar', 'اللّٰهُ أَكْبَر'], ['Bismillah', 'بِسْمِ اللّٰه'], ['Allah', 'اللّٰه'],
  ['Mohammed', 'مُحَمَّد'], ['Ahmad', 'أَحْمَد'], ['Abdallah', 'عَبْدُ اللّٰه'], ['Âmina', 'آمِنَة'], ['Abd al-Muttalib', 'عَبْدُ الْمُطَّلِب'],
  ['Halîma', 'حَلِيمَة'], ['Banû Sa’d', 'بَنُو سَعْد'], ['Abû Tâlib', 'أَبُو طَالِب'], ['Khadîdja', 'خَدِيجَة'], ['Abû Bakr', 'أَبُو بَكْر'],
  ['Bilâl', 'بِلَال'], ['Alî', 'عَلِيّ'], ['Zayd', 'زَيْد'], ['Waraqa', 'وَرَقَة'], ['Fâtima', 'فَاطِمَة'], ['Umâma', 'أُمَامَة'],
  ['Omar', 'عُمَر'], ['Othmân', 'عُثْمَان'], ['Hamza', 'حَمْزَة'], ['Abraha', 'أَبْرَهَة'],
  ['Djibrîl', 'جِبْرِيل'], ['Mîkâ’îl', 'مِيكَائِيل'], ['Isrâfîl', 'إِسْرَافِيل'], ['Iblis', 'إِبْلِيس'],
  ['Adam', 'آدَم'], ['Hawwa', 'حَوَّاء'], ['Nouh', 'نُوح'], ['Houd', 'هُود'], ['Ibrahim', 'إِبْرَاهِيم'], ['Ismaïl', 'إِسْمَاعِيل'],
  ['Ya’qoub', 'يَعْقُوب'], ['Youssouf', 'يُوسُف'], ['Moussa', 'مُوسَى'], ['Hâroun', 'هَارُون'], ['Âsiya', 'آسِيَة'],
  ['Younous', 'يُونُس'], ['Zakariyyâ', 'زَكَرِيَّا'], ['Maryam', 'مَرْيَم'], ['Issa', 'عِيسَى'], ['Banû Isrâ’îl', 'بَنُو إِسْرَائِيل'],
  ['Kaaba', 'الْكَعْبَة'], ['Hirâ', 'حِرَاء'], ['Thawr', 'ثَوْر'], ['Tâ’if', 'الطَّائِف'], ['Yathrib', 'يَثْرِب'], ['Qubâ', 'قُبَاء'],
  ['Abwâ', 'الْأَبْوَاء'], ['Châm', 'الشَّام'], ['Djoudi', 'الْجُودِيّ'], ['Ahad', 'أَحَد'],
  ['Ramadan', 'رَمَضَان'], ['Rabî‘ al-Awwal', 'رَبِيعٌ الْأَوَّل'], ['Dhoul-Hijja', 'ذُو الْحِجَّة'], ['Zakât', 'الزَّكَاة'],
  ['Al-Fîl', 'الْفِيل'], ['Ad-Duhâ', 'الضُّحَى'], ['Al-‘Alaq', 'الْعَلَق'], ['At-Tawba', 'التَّوْبَة'], ['Al-Baqara', 'الْبَقَرَة'],
  ['Al-Anbiyâ’', 'الْأَنْبِيَاء'], ['Tâ-Hâ', 'طه'], ['Al-Ikhlâs', 'الْإِخْلَاص'], ['Al-Fâtiha', 'الْفَاتِحَة'], ['Al-Fâtiḥa', 'الْفَاتِحَة'],
  ['Al-Amîn', 'الْأَمِين'], ['al-Amîn', 'الْأَمِين'],
  // la sourate Al-Fâtiḥa
  ['cheikh Al-Husary', 'الشَّيْخ الْحُصَرِي'], ['Al-Husary', 'الْحُصَرِي'], ['Ar-Raḥmân', 'الرَّحْمٰن'], ['Ar-Raḥîm', 'الرَّحِيم'],
  ['Rabb', 'رَبّ'], ['ad-dîn', 'الدِّين'], ['iyyâka', 'إِيَّاكَ'], ['Oumm al-Kitâb', 'أُمُّ الْكِتَاب'], ['rak\'a', 'رَكْعَة'],
];
const echappe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RE = new RegExp('(?<![\\p{L}\\p{M}])(' + LEXIQUE.map(x => x[0]).sort((a, b) => b.length - a.length).map(echappe).join('|') + ')(?![\\p{L}\\p{M}])', 'gu');
const AR = new Map(LEXIQUE);
export function parties(t){
  const out = []; let i = 0; t = String(t || '');
  for(const m of t.matchAll(RE)){
    if(m.index > i) out.push([t.slice(i, m.index), 'fr']);
    out.push([AR.get(m[1]), 'ar']); i = m.index + m[1].length;
  }
  if(i < t.length) out.push([t.slice(i), 'fr']);
  // les bouts français sans lettre (« ’ », « , ») sont collés au morceau d'avant pour ne pas faire de silence
  return out.filter(p => p[1] === 'ar' || /[\p{L}\d]/u.test(p[0]));
}
