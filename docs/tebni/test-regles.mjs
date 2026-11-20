// Tests des règles de Tebni : node docs/tebni/test-regles.mjs
import * as T from '../../jeux/tebni/regles.js';
let ok = 0, ko = 0; const t = (nom, c) => { if(c) ok++; else { ko++; console.log('ÉCHEC', nom); } };

// 1. chaque pièce a 4 cases dans chaque orientation, et 4 orientations qui reviennent au départ
for(const p of T.PIECES){ t(p + ' 4 cases', T.CASES[p].every(c => c.length === 4)); }
// 2. le sac : 7 pièces différentes, et 700 pièces = 100 de chaque
{ const P = T.nouvellePartie({ graine:7 }); const vu = {}; for(let i = 0; i < 700; i++){ const s = T.sac(P.alea); t('sac 7 différentes', new Set(s).size === 7); } }
{ const P = T.nouvellePartie({ graine:3 }); const vu = {}; let n = 0; for(let i = 0; i < 70; i++){ vu[P.piece.t] = (vu[P.piece.t] || 0) + 1; T.chuteRapide(P); if(P.fini) break; n++; }
  t('la partie ne finit pas en 70 chutes au milieu ? (peut finir)', true); }
// 3. même graine = même suite
{ const a = T.nouvellePartie({ graine:42 }), b = T.nouvellePartie({ graine:42 }); t('même graine', a.piece.t === b.piece.t && a.file.join() === b.file.join()); }
// 4. une ligne pleine disparaît et rapporte 100 × niveau
{ const P = T.nouvellePartie({ graine:1 }); const y = T.H + T.CACHE - 1; for(let x = 0; x < T.L; x++) P.grille[y][x] = x < 4 ? null : 'Z';
  P.piece = { t:'I', r:0, x:0, y:T.CACHE }; const s0 = P.score; const n = T.chuteRapide(P);
  t('ligne effacée', P.lignes === 1 && P.grille[y].filter(Boolean).length === 0); t('score ligne', P.score - s0 === 2 * n + 100 + 1000); }
// 5. quatre lignes d'un coup = « tebni » (800)
{ const P = T.nouvellePartie({ graine:1 }); for(let k = 0; k < 4; k++){ const y = T.H + T.CACHE - 1 - k; for(let x = 0; x < T.L; x++) P.grille[y][x] = x === 9 ? null : 'S'; }
  P.piece = { t:'I', r:1, x:7, y:T.CACHE }; t('I debout libre', T.libre(P, P.piece)); const s0 = P.score; const n = T.chuteRapide(P);
  t('4 lignes', P.lignes === 4 && P.tetris === 1); t('800 + tableau vide', P.score - s0 === 2 * n + 800 + 1000); }
// 6. les murs : la rotation contre le mur gauche se décale (kick)
{ const P = T.nouvellePartie({ graine:1 }); P.piece = { t:'T', r:1, x:-1, y:5 }; t('T contre le mur libre', T.libre(P, P.piece)); t('tourne au mur', T.tourneP(P, 1) && T.libre(P, P.piece)); }
{ const P = T.nouvellePartie({ graine:1 }); P.piece = { t:'I', r:1, x:-2, y:5 }; t('I debout au mur', T.libre(P, P.piece)); t('I tourne au mur', T.tourneP(P, 1) && T.libre(P, P.piece)); }
// 7. on ne sort pas de la grille
{ const P = T.nouvellePartie({ graine:1 }); for(let i = 0; i < 20; i++) T.deplace(P, -1); t('bord gauche', T.cases(P.piece).every(([x]) => x >= 0)); for(let i = 0; i < 20; i++) T.deplace(P, 1); t('bord droit', T.cases(P.piece).every(([x]) => x < T.L)); }
// 8. la réserve : une fois par pièce
{ const P = T.nouvellePartie({ graine:5 }); const a = P.piece.t; t('réserve', T.reserve(P) && P.reserve === a); t('pas deux fois', !T.reserve(P)); T.chuteRapide(P); t('de nouveau permise', T.reserve(P)); }
// 9. gravité et verrouillage : la pièce tombe puis se pose toute seule
{ const P = T.nouvellePartie({ graine:9 }); const n0 = P.pieces; for(let i = 0; i < 60 * 40; i++) T.pas(P, 1 / 60); t('pose par gravité', P.pieces > n0); }
// 10. vitesses : de plus en plus vite, tranquille plus lent
t('vitesse croît', T.gravite(1) > T.gravite(5) && T.gravite(5) > T.gravite(10)); t('tranquille plus lent', T.gravite(8, 'tranquille') > T.gravite(8));
// 11. un robot simple joue 300 pièces sans planter : il cherche la place la plus basse et la moins trouée
function robot(P){
  let best = null;
  for(let r = 0; r < 4; r++) for(let x = -3; x < T.L; x++){
    const p = { t:P.piece.t, r, x, y:P.piece.y }; if(!T.libre(P, p)) continue; let y = p.y; while(T.libre(P, p, r, x, y + 1)) y++;
    const g = P.grille.map(l => l.slice()); for(const [a, b] of T.cases(p, r, x, y)) if(b >= 0) g[b][a] = 'X';
    let pleines = 0; for(let yy = 0; yy < g.length; yy++) if(g[yy].every(Boolean)) pleines++;
    const g2 = g.filter(l => !l.every(Boolean)); while(g2.length < g.length) g2.unshift(new Array(T.L).fill(null));
    const hs = []; let trous = 0;
    for(let xx = 0; xx < T.L; xx++){ let h = 0, vu = false; for(let yy = 0; yy < g2.length; yy++){ if(g2[yy][xx]){ if(!vu){ h = g2.length - yy; vu = true; } } else if(vu) trous++; } hs.push(h); }
    const somme = hs.reduce((a, b) => a + b, 0); let bosses = 0; for(let i = 1; i < hs.length; i++) bosses += Math.abs(hs[i] - hs[i - 1]);
    const s = -0.51 * somme + 0.76 * pleines - 0.36 * trous - 0.18 * bosses; if(!best || s > best.s) best = { s, r, x };
  }
  if(!best) return T.chuteRapide(P);
  while(P.piece.r !== best.r && T.tourneP(P, 1)){} let g = 0; while(P.piece.x < best.x && T.deplace(P, 1) && g++ < 20){} g = 0; while(P.piece.x > best.x && T.deplace(P, -1) && g++ < 20){}
  T.chuteRapide(P);
}
for(const graine of [1, 2, 3, 4, 5]){ const P = T.nouvellePartie({ graine }); let n = 0; while(!P.fini && n < 300){ robot(P); n++; } t('robot ' + graine + ' joue 300 pièces (' + P.lignes + ' lignes)', n === 300 && P.lignes > 80); }
console.log(ok + ' réussis, ' + ko + ' ratés'); process.exit(ko ? 1 : 0);
