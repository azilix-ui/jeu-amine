// Tests de l'arène : node docs/arene/test-moteur.mjs
import { perdTete, nouvelleArene, nouveauSerpent, pas, CFG, rayon, longueur, meurt, mangeFixe, placeSure, renait, classement } from '../../jeux/arene/moteur.js';
import { pensent } from '../../jeux/arene/ia.js';
let ok = 0, ko = 0; const t = (n, c) => { if(c) ok++; else { ko++; console.log('✗', n); } };
const FX = Math.round(1 / 30 / CFG.pas);   // les boucles ci-dessous comptaient en pas de 1/30 s (60 pas par seconde depuis le 21/11)
// 1. même graine, mêmes perles
const A1 = nouvelleArene({ graine:42 }), A2 = nouvelleArene({ graine:42 });
t('graine', JSON.stringify([...A1.perles.values()].slice(0, 20)) === JSON.stringify([...A2.perles.values()].slice(0, 20)));
t('perle mangée revient ailleurs, pareil partout', mangeFixe(A1, 5, 0) && mangeFixe(A2, 5, 0) && A1.perles.get('f5').x === A2.perles.get('f5').x && A1.perles.get('f5').g === 1);
t('pas deux fois la même génération', !mangeFixe(A1, 5, 0));
// 2. avance, grandit, longueur
const A = nouvelleArene({ graine:1, perles:0 }); const s = nouveauSerpent(A, { x:1500, y:1500, a:0, nom:'Amine' }); s.invinc = 0;
for(let k = 0; k < 30 * FX; k++) pas(A); t('avance ~170 u/s', Math.abs(s.x - 1500 - CFG.vitesse) < 8);
A.perles.set('x', { id:'x', x:s.x + 10, y:s.y, v:3, c:0, drop:true, ne:-9 }); const m0 = s.masse; pas(A); t('mange une perle', s.masse > m0 && !A.perles.has('x'));
let L = 0; for(let j = 1; j < s.chemin.length; j++) L += Math.hypot(s.chemin[j].x - s.chemin[j - 1].x, s.chemin[j].y - s.chemin[j - 1].y);
t('longueur du corps', Math.abs(L - longueur(s.masse)) < 12);
// 3. rotation limitée
s.vise = s.a + Math.PI; const a0 = s.a; pas(A); t('pas de demi-tour sec', Math.abs(s.a - a0) <= CFG.rotation * CFG.pas + 1e-6);
// 4. boost : plus vite, coûte de la masse, s'arrête au seuil
s.vise = s.a; s.masse = 120; s.veutBoost = true; const x0 = s.x; pas(A); t('boost plus rapide', s.x - x0 > CFG.vitesse * CFG.pas * 1.3);
let tombees = 0; for(let k = 0; k < 200 * FX; k++){ s.vise = s.a + .5; pas(A); tombees += A.events.filter(e => e.k === 'drop').length; A.events.length = 0; A.perles.clear(); } t('boost s\'arrête au seuil (' + Math.round(s.masse) + ')', s.vivant && s.masse < 75 && s.masse > 40);
t('le boost fait tomber des perles', tombees > 10);
// 5. collision : la tête de B touche le corps de A
const B = nouvelleArene({ graine:2, perles:0 }); const a = nouveauSerpent(B, { x:1000, y:1000, a:0, masse:300 }), b = nouveauSerpent(B, { x:1060, y:300, a:-Math.PI / 2 });
a.invinc = b.invinc = 0; a.vise = 0; for(let k = 0; k < 40 * FX; k++) pas(B);
b.x = a.chemin[10].x; b.y = a.chemin[10].y - 60; b.chemin = b.chemin.map((q, i) => ({ x:b.x, y:b.y - i * 5 })); b.a = b.vise = Math.PI / 2;
for(let k = 0; k < 20 * FX && b.vivant; k++) pas(B);
t('B meurt sur le corps de A', !b.vivant && a.vivant && a.kills === 1);
t('B devient des perles', [...B.perles.values()].filter(p => p.drop).length >= 6);
// 6. bord mortel, son propre corps non
const C = nouvelleArene({ graine:3, perles:0 }); const c = nouveauSerpent(C, { x:40, y:1500, a:Math.PI }); c.invinc = 0; for(let k = 0; k < 10 * FX; k++) pas(C); t('bord mortel', !c.vivant);
const D = nouvelleArene({ graine:4, perles:0 }); const d = nouveauSerpent(D, { x:1500, y:1500, a:0, masse:900 }); d.invinc = 0; d.vise = 99; for(let k = 0; k < 300 * FX; k++){ d.vise = d.a + 1; pas(D); } t('son propre corps ne tue pas', d.vivant);
// 7. tête contre tête (21/11, règle du papa) : un seul meurt. Bien de face : le héros gagne contre la machine
const E = nouvelleArene({ graine:5, perles:0 }); const e1 = nouveauSerpent(E, { x:1400, y:1500, a:0 }), e2 = nouveauSerpent(E, { x:1600, y:1500, a:Math.PI, bot:{} }); e1.invinc = e2.invinc = 0;
for(let k = 0; k < 40 * FX; k++) pas(E); t('tête contre tête de face : le héros gagne', e1.vivant && !e2.vivant && e1.kills === 1);
// 7b. entre deux machines : celui qui fonce sur l'autre gagne, et un seul des deux perd
const E2 = nouvelleArene({ graine:6, perles:0 }); const h2 = nouveauSerpent(E2, { x:1500, y:1410, a:Math.PI / 2, bot:{} }), m2 = nouveauSerpent(E2, { x:1400, y:1500, a:0, bot:{} }); h2.invinc = m2.invinc = 0;
for(let k = 0; k < 60 * FX && h2.vivant && m2.vivant; k++){ h2.vise = Math.PI / 2; m2.vise = 0; pas(E2); }
t('deux machines : un seul perd', h2.vivant !== m2.vivant); t('perdTete symétrique', perdTete(h2, m2) !== perdTete(m2, h2));
const E3 = nouvelleArene({ graine:7, perles:0 }); const h3 = nouveauSerpent(E3, { x:1500, y:1410, a:Math.PI / 2 }), m3 = nouveauSerpent(E3, { x:1400, y:1500, a:0, bot:{} }); h3.invinc = m3.invinc = 0;
for(let k = 0; k < 60 * FX && h3.vivant && m3.vivant; k++){ h3.vise = Math.PI / 2; m3.vise = 0; pas(E3); }
t('le héros touche la tête de la machine : la machine meurt', h3.vivant && !m3.vivant);
// 7c. la machine touche le corps du héros : la machine meurt
const E4 = nouvelleArene({ graine:8, perles:0 }); const h4 = nouveauSerpent(E4, { x:1500, y:1500, a:0, masse:300 }); h4.invinc = 0; for(let k = 0; k < 120; k++) pas(E4);
const m4 = nouveauSerpent(E4, { x:h4.x - 120, y:h4.y - 80, a:Math.PI / 2, bot:{} }); m4.invinc = 0;
for(let k = 0; k < 90 && h4.vivant && m4.vivant; k++){ m4.vise = Math.PI / 2; h4.vise = 0; pas(E4); } t('la machine touche le corps du héros : elle meurt', h4.vivant && !m4.vivant);
// 8. 25 machines, 3 minutes : pas de plantage, les machines survivent un moment, la masse reste cohérente
const F = nouvelleArene({ graine:9 }); for(let i = 0; i < 25; i++){ const p = placeSure(F); nouveauSerpent(F, { ...p, bot:'b' + i, niveau:['facile', 'normal', 'difficile'][i % 3] }); }
let morts = 0; F.events.length = 0; const t0 = Date.now();
for(let k = 0; k < 30 * FX * 180; k++){ pensent(F, CFG.pas); pas(F); for(const ev of F.events) if(ev.k === 'mort'){ morts++; renait(F, ev.s, placeSure(F)); } F.events.length = 0; }
const ms = Date.now() - t0;
t('3 min de jeu à 25 machines en moins de 25 s de calcul (' + ms + ' ms)', ms < 25000);
t('les machines meurent parfois mais pas sans arrêt (' + morts + ' morts)', morts > 3 && morts < 600);
t('masses finies', F.serpents.every(s => isFinite(s.masse) && s.masse > 0));
t('perles bornées', F.perles.size <= CFG.maxPerles);
console.log(`${ok} réussis, ${ko} ratés · classement : ${classement(F).slice(0, 3).map(s => Math.round(s.masse)).join(', ')}`);
process.exit(ko ? 1 : 0);
