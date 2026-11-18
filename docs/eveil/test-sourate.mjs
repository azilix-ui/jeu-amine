// Tests de la rubrique « Sourate » : node docs/eveil/test-sourate.mjs
import { normAr, aligne, score, verdict, pareil } from '../../eveil/sourate/ecoute.js';
import { VERSETS, PHRASES } from '../../eveil/sourate/fatiha.js';
let ok = 0, ko = 0; const t = (c, m) => { if(c) ok++; else { ko++; console.log('ÉCHEC', m); } };
// les données
t(VERSETS.length === 7, '7 versets');
for(const v of VERSETS){
  t(v.mots.length === v.tj.length && v.tj.length === v.tr.length && v.tr.length === v.seg.length, 'mots alignés ' + v.n);
  t(v.seg.every((s, i) => s[1] > s[0] && (!i || s[0] >= v.seg[i - 1][1])), 'moments croissants ' + v.n);
  t(normAr(v.tj.map(w => w.map(p => p[0]).join('')).join(' ')).replace(/ا/g, '') === normAr(v.ar).replace(/ا/g, ''), 'tajwid = texte ' + v.n);
}
for(const k in PHRASES) t(PHRASES[k].length === 3 && PHRASES[k].every(Boolean), 'phrase ' + k);
// la tablette rend de l'arabe sans voyelles : chaque verset dit « comme on l'écrit » doit être reconnu en entier
const dit = ['بسم الله الرحمن الرحيم', 'الحمد لله رب العالمين', 'الرحمن الرحيم', 'مالك يوم الدين', 'اياك نعبد واياك نستعين', 'اهدنا الصراط المستقيم', 'صراط الذين انعمت عليهم غير المغضوب عليهم ولا الضالين'];
VERSETS.forEach((v, i) => t(score(v.mots, [dit[i]]) === 1, 'verset entier ' + v.n + ' : ' + score(v.mots, [dit[i]])));
// variantes de la tablette
t(score(VERSETS[0].mots, ['بسم الله الرحمان الرحيم']) === 1, 'رحمان');
t(score(VERSETS[3].mots, ['ملك يوم الدين']) === 1, 'ملك sans alif');
t(score(VERSETS[4].mots, ['إياك نعبد و إياك نستعين']) === 1, 'و décollé');
t(score(VERSETS[6].mots, ['صراط الذين أنعمت عليهم']) > .4 && score(VERSETS[6].mots, ['صراط الذين أنعمت عليهم']) < .6, 'moitié du verset 7');
t(score(VERSETS[1].mots, ['bonjour']) === 0 && score(VERSETS[1].mots, []) === 0, 'rien');
t(score(VERSETS[1].mots, ['الحمد لله', 'الحمد لله رب العالمين']) === 1, 'meilleure proposition');
t(verdict(1, 'Essil') === 'bravo' && verdict(.5, 'Essil') === 'moitie' && verdict(.5, 'Salma') === 'bravo', 'seuils');
t(verdict(0, 'Amine', true) === 'bravo' && verdict(0, 'Salma', false) === 'rien' && verdict(0, 'Salma', true) === 'moitie', 'a parlé');
console.log(ok + ' / ' + (ok + ko) + ' tests réussis'); if(ko) process.exit(1);
