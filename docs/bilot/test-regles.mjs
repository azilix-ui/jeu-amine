// node docs/bilot/test-regles.mjs : les règles de Bilot (belote coinchée) et l'ordinateur
import * as R from '../../jeux/bilot/regles.js';
let ok = 0, ko = 0; const t = (cond, msg) => { if(cond) ok++; else { ko++; console.log('ÉCHEC', msg); } };
const rnd = s => () => (s = R.suivant(s)) / 4294967296;
// 1. la donne
{ const s = R.nouvellePartie({ seed:7 }); t(s.mains.every(m => m.length === 8), '8 cartes chacun'); t(new Set(s.mains.flat()).size === 32, '32 cartes différentes'); t(s.phase === 'enchere', 'enchères'); t(s.tour === (s.donneur + 1) % 4, 'à droite du donneur'); }
// 2. 4 passes : on redonne
{ const s = R.nouvellePartie({ seed:3 }); const m0 = s.manche; for(let i = 0; i < 4; i++) R.encherir(s, s.tour, { k:'passe' }); t(s.manche === m0 + 1 && s.phase === 'enchere', 'quatre passes = redonne'); }
// 3. annonces, coinche, surcoinche
{ const s = R.nouvellePartie({ seed:11 }); const j0 = s.tour;
  t(R.encherir(s, j0, { k:'annonce', v:80, c:'c' }).ok, 'annonce 80 cœur'); t(!R.encherir(s, s.tour, { k:'annonce', v:80, c:'p' }).ok, 'pas 80 après 80');
  t(R.encherir(s, s.tour, { k:'coinche' }).ok, 'un adversaire coinche'); t(s.coinche === 2 && R.equipe(s.tour) === R.equipe(j0), 'la parole revient au preneur');
  t(R.encherir(s, s.tour, { k:'surcoinche' }).ok && s.coinche === 4 && s.phase === 'jeu', 'surcoinche : on joue'); t(s.tour === (s.donneur + 1) % 4, 'entame à droite du donneur'); }
{ const s = R.nouvellePartie({ seed:12 }); const j0 = s.tour; R.encherir(s, j0, { k:'annonce', v:100, c:'t' }); t(!R.encherir(s, (j0 + 2) % 4, { k:'coinche' }).ok, 'pas son tour');
  R.encherir(s, s.tour, { k:'passe' }); t(!R.encheresPermises(s, s.tour).some(x => x.k === 'coinche'), 'le partenaire ne coinche pas'); R.encherir(s, s.tour, { k:'passe' }); R.encherir(s, s.tour, { k:'passe' }); t(s.phase === 'jeu' && s.contrat.v === 100, '3 passes après une annonce'); }
// 4. le pli : fournir, couper, monter, partenaire maître
{ const s = { phase:'jeu', tour:1, contrat:{ v:80, c:'c', j:0 }, mains:[[], ['pA', 'p7', 'c9'], [], []], pli:[{ j:0, c:'pR' }], joues:[], beloteVue:[0,0,0,0], belote:[0,0], plis:[0,0], ramasse:[[],[]], log:[] };
  t(R.permises(s, 1).join() === 'pA,p7', 'fournir à pique');
  s.mains[1] = ['t7', 'c9', 'cV']; t(R.permises(s, 1).sort().join() === 'c9,cV', 'pas de pique : couper');
  s.pli = [{ j:3, c:'pA' }, { j:0, c:'p7' }]; s.tour = 1; s.mains[1] = ['t7', 'c9']; t(R.permises(s, 1).length === 2, 'partenaire maître : libre');
  s.pli = [{ j:0, c:'pA' }, { j:1, c:'cT' }]; s.tour = 2; s.mains[2] = ['c7', 'cA', 'd8']; t(R.permises(s, 2).join() === 'cA', 'surcouper');
  s.mains[2] = ['c7', 'c8', 'd8']; t(R.permises(s, 2).sort().join() === 'c7,c8', 'sous-couper si on ne peut pas monter');
  s.pli = [{ j:0, c:'c9' }]; s.tour = 1; s.mains[1] = ['cA', 'cV', 'p8']; t(R.permises(s, 1).join() === 'cV', 'à l\'atout, monter');
  t(R.maitre([{ j:0, c:'p7' }, { j:1, c:'pA' }, { j:2, c:'c7' }, { j:3, c:'pT' }], 'c') === 2, 'le petit atout gagne');
  t(R.maitre([{ j:0, c:'c9' }, { j:1, c:'cA' }], 'c') === 0, 'le 9 bat l\'as à l\'atout');
  t(R.maitre([{ j:0, c:'pV' }, { j:1, c:'pT' }], 'c') === 1, 'hors atout, le 10 bat le valet'); }
// 5. des centaines de parties entre ordinateurs : tout reste juste
const niv = ['facile', 'moyen', 'malin']; let parties = 0, manches = 0, reussis = 0, coinches = 0;
for(let g = 1; g <= 300; g++){
  const s = R.nouvellePartie({ seed:g * 7919, cible:1000 }), r = rnd(g), N = niv[g % 3]; let garde = 0;
  while(s.phase !== 'fini' && garde++ < 5000){
    if(s.phase === 'manche'){ R.nouvelleManche(s); continue; }
    if(s.phase === 'enchere'){ const a = R.choisirEnchere(s, s.tour, N, r); const x = R.encherir(s, s.tour, a); if(!x.ok){ t(false, 'enchère refusée ' + JSON.stringify(a) + ' ' + x.err); break; } continue; }
    const j = s.tour, c = R.choisirCarte(s, j, N, r); const x = R.jouer(s, j, c); if(!x.ok){ t(false, 'carte refusée ' + c + ' ' + x.err); break; }
    const tot = s.mains.flat().length + s.pli.length + s.ramasse[0].length + s.ramasse[1].length;
    if(tot !== 32){ t(false, 'cartes perdues'); break; }
    if(x.ev.some(e => e.k === 'fin')){ manches++; const p = s.points; t(p.capot || p.cartes[0] + p.cartes[1] === 162, '162 points par manche ' + p.cartes); if(p.reussi) reussis++; if(p.coinche > 1) coinches++; }
  }
  t(s.phase === 'fini', 'partie finie ' + g); parties++;
}
console.log(parties, 'parties,', manches, 'manches,', reussis, 'contrats réussis,', coinches, 'coinchées');
console.log(ok, 'tests réussis,', ko, 'échecs'); process.exit(ko ? 1 : 0);
