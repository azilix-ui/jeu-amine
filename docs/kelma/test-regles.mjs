// Kelma : tests des règles (node docs/kelma/test-regles.mjs)
import fs from 'node:fs';
import * as K from '../../jeux/kelma/regles.js';
const lex = {}; for(const l of ['fr', 'en', 'ar']) lex[l] = K.lexique(l, fs.readFileSync(new URL('../../jeux/kelma/lex/' + l + '.txt', import.meta.url), 'utf8'));
let n = 0, ok = 0; const t = (nom, v) => { n++; if(v) ok++; else console.log('ÉCHEC', nom); };
// normalisation
t('fr accents', K.normFR('Élève') === 'ELEVE' && K.normFR('cœur') === 'COEUR' && K.normFR("aujourd'hui") === '');
t('ar harakat/alif', K.normAR('أَسَدٌ') === 'اسد' && K.normAR('مُوسَى') === 'موسي' && K.normAR('ـكتـاب') === 'كتاب' && K.normAR('مدرسة') === 'مدرسة');
t('lexique fr', lex.fr.set.has('CHAT') && lex.fr.set.has('MAISON') && !lex.fr.set.has('XQZ'));
t('lexique en', lex.en.set.has('HOUSE') && lex.en.set.has('CAT'));
t('lexique ar', lex.ar.set.has('كتاب') && lex.ar.set.has('قلم') && lex.ar.set.has('بيت'));
t('prefixe', K.aPrefixe(lex.fr, 'MAIS') && !K.aPrefixe(lex.fr, 'QXZ'));
// grille et chemins
const cfg = { W:4, H:4, lignes:4, min:3 };
const e = { cfg, W:4, H:4, cases:'CHATXOXXXXXXXXXX'.split('').map(l => ({ l, b:'' })), score:0, mots:[], tours:0, combo:0, dernierT:-1e9 };
t('mot valide', K.verifie(e, [0, 1, 2, 3], lex.fr).ok);
t('pas voisin refusé', K.verifie(e, [0, 2, 1], lex.fr).raison === 'pas voisin');
t('case répétée refusée', K.verifie(e, [0, 1, 0], lex.fr).raison === 'deux fois');
t('hors grille refusé', K.verifie(e, [0, 1, 99], lex.fr).raison === 'hors');
t('mot inconnu', K.verifie(e, [3, 2, 1], lex.fr).raison === 'inconnu');
const avant = JSON.stringify(e), r = K.joue(e, [3, 2, 1], lex.fr);
t('mot inconnu ne change rien', JSON.stringify(r.etat) === avant && JSON.stringify(e) === avant);
const j = K.joue(e, [0, 1, 2, 3], lex.fr);
t('joue retire et fait tomber', j.res.ok && j.etat.cases.slice(0, 4).every(c => c === null) && JSON.stringify(e) === avant);
t('déterminisme', JSON.stringify(K.joue(e, [0, 1, 2, 3], lex.fr, 0)) === JSON.stringify(K.joue(e, [0, 1, 2, 3], lex.fr, 0)));
// gravité
const G = K.gravite([{ l:'A' }, null, null, { l:'B' }, null, null], 3, 2);
const G2 = K.gravite([{ l:'A' }, null, null, null, { l:'B' }, null], 3, 2);
t('gravité', G[3].l === 'B' && G[0].l === 'A' && G2[3].l === 'A' && G2[0] === null && G2[4].l === 'B');
// bombe et briques
const e2 = { ...e, cases:e.cases.map((c, i) => i === 1 ? { l:'H', b:'bombe' } : i === 6 ? { l:'', b:'brique' } : c) };
const j2 = K.joue(e2, [0, 1, 2, 3], lex.fr); t('bombe + brique', j2.res.part.length > 4);
// parties reproductibles et équitables
for(const l of ['fr', 'en', 'ar']) for(const m of Object.keys(K.MODES)){ if(m === 'kenz') continue;
  const c = { ...K.reglage(m, 'Essil') }, a = K.nouvellePartie(c, lex[l], 'test-' + m), b = K.nouvellePartie(c, lex[l], 'test-' + m);
  t('même graine ' + l + ' ' + m, JSON.stringify(a.cases) === JSON.stringify(b.cases));
  t('au moins K mots ' + l + ' ' + m, K.cherche(a, lex[l], { max:20 }).length >= Math.min(c.K, 5)); }
// le trésor en images (Amine) : chaque mot posé est trouvable
for(const l of ['fr', 'en', 'ar']) for(let s = 0; s < 20; s++){ const c = K.cfgImages(l, 'Amine', K.hasard('img' + s)), p = K.nouvellePartie(c, lex[l], 'img' + l + s);
  const tous = K.cherche(p, lex[l], { max:5000, ms:5000 }).map(x => x.mot); t('trésor ' + l + s + ' ' + c.images.map(x => x[0]).join(','), c.images.every(([m]) => tous.includes(m))); }
// le robot joue chaque niveau de la campagne et doit atteindre le but
for(const nv of K.NIVEAUX){ for(const l of ['fr', 'en', 'ar']){
  const c = { ...K.reglage(nv.mode, 'Essil'), briques:nv.briques }, r = K.hasard(nv.graine + 'robot');
  let s = K.nouvellePartie(c, lex[l], nv.graine + '-' + l), coups = 0;
  while(!K.butAtteint(s, nv.but) && !s.fini && coups++ < 60){ const m = K.cherche(s, lex[l], { max:30 }); if(!m.length){ if(c.parMot){ s = K.ajouteLigne(s, lex[l], r); continue; } break; }   // plus de mot : une ligne arrive (comme dans le jeu)
    const pick = nv.but.type === 'long' ? (m.find(x => [...x.mot].length >= nv.but.n) || m[0]) : nv.but.type === 'mots' && !c.parMot ? m.reduce((a, x) => [...x.mot].length < [...a.mot].length ? x : a) : m[0];
    s = K.joue(s, pick.chemin, lex[l], coups * 10000).etat; if(c.parMot && s.tours % c.parMot === 0) s = K.ajouteLigne(s, lex[l], r); }
  t('niveau ' + nv.id + ' ' + l + ' (' + K.texteBut(nv.but) + ')', K.butAtteint(s, nv.but)); } }
console.log(ok + ' / ' + n + ' tests réussis');
process.exit(ok === n ? 0 : 1);
