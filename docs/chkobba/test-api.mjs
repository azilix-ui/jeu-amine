// Chkobba : l'arbitre en ligne (api/chkobba.php) sur un serveur local (php -S 127.0.0.1:8773 à la racine du dépôt).
// Une partie à 4 (2 contre 2) : deux humains (A et B) et deux places de l'ordinateur ; A et B jouent le premier coup permis.
import { coupsPermis } from '../../jeux/chkobba/regles.js';
const U = process.argv[2] || 'http://127.0.0.1:8773/api/chkobba.php';
const post = async d => { const r = await fetch(U, { method:'POST', body:new URLSearchParams(d) }); const j = await r.json(); if(!r.ok) throw new Error(j.error); return j; };
let ok = 0, ko = 0; const t = (n, c, i = '') => { if(c) ok++; else { ko++; console.log('ÉCHEC', n, i); } };
const A = 'aaaaaaaa' + Date.now().toString(36).slice(-4), B = 'bbbbbbbb' + Date.now().toString(36).slice(-4);
const { code } = await post({ action:'create', client:A, name:'Salma', n:4, cible:11, niveau:'moyen', monde:'kairouan' });
t('code', /^[A-Z0-9]{4}$/.test(code));
await post({ action:'join', code, client:B, name:'Amine' });
let e = await post({ action:'start', code, client:A });
t('4 places', e.sieges.length === 4 && e.sieges.filter(s => s.bot).length === 2, JSON.stringify(e.sieges));
t('équipes', e.jeu.equipes === true);
t('ma main seulement', e.jeu.main.length === 3 && !('mains' in e.jeu) && e.jeu.nMains.every(n => n === 3));
let refus = 0; try{ await post({ action:'jouer', code, client:B, carte:e.jeu.main[0], prise:'[]' }); }catch(err){ refus++; }
t('coup refusé (pas son tour ou pas sa carte)', refus === 1 || e.jeu.tour === 1);
let fini = false, coups = 0, triche = 0;
for(let k = 0; k < 2000 && !fini; k++){
  for(const C of [A, B]){
    e = await post({ action:'etat', code, client:C });
    if(e.jeu.phase === 'fini'){ fini = true; break; }
    if(e.jeu.phase === 'jeu' && e.jeu.tour === e.moi){
      // essai de triche : jouer une carte qu'on n'a pas
      if(coups === 3){ try{ await post({ action:'jouer', code, client:C, carte:e.jeu.main.includes('d1') ? 'd2' : 'd1', prise:'[]' }); }catch(err){ triche++; } }
      const m = coupsPermis(e.jeu.main, e.jeu.tapis)[0]; await post({ action:'jouer', code, client:C, carte:m.carte, prise:JSON.stringify(m.prise) }); coups++; }
  }
  await new Promise(r => setTimeout(r, 250));
}
t('partie finie', fini, JSON.stringify(e.jeu && { phase:e.jeu.phase, total:e.jeu.total, manche:e.jeu.manche }));
t('triche refusée', triche === 1);
console.log('coups des humains :', coups, '· manches :', e.jeu.manche, '· total :', e.jeu.total.join(' – '), '· gagnant : équipe', e.jeu.gagnant);
await post({ action:'quitter', code, client:B }); e = await post({ action:'etat', code, client:A });
t('B remplacé par l\'ordinateur', e.sieges[1].bot && e.sieges[1].remplace);
console.log(ok + ' tests réussis, ' + ko + ' échecs'); process.exit(ko ? 1 : 0);
