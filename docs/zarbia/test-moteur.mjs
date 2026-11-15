// Zarbia : tests de la logique (node docs/zarbia/test-moteur.mjs). Grille réelle, joueurs pilotés par des listes de caps.
import { createMonde, ajoute, nait, pas, N, compresse, decompresse, classement } from '../../jeux/zarbia/moteur.js';
let ok = 0, ko = 0;
const t = (nom, cond, info = '') => { if(cond){ ok++; } else { ko++; console.log('ÉCHEC', nom, info); } };
const compte = M => { const c = new Int32Array(64); for(const o of M.owner) if(o) c[o]++; return c; };
const coherent = M => { const c = compte(M); for(let i = 1; i < 64; i++) if(c[i] !== M.count[i]) return false; return true; };
// faire suivre à p une liste de points (cases), à sa vitesse
function chemin(M, p, pts, autres = () => {}){
  const v = M.joueurs.map(q => q && q.vitesse); M.joueurs.forEach(q => { if(q && q !== p) q.vitesse = 0; });
  for(const [x, y] of pts){ for(let k = 0; k < 2000; k++){ const dx = x + .5 - p.x, dy = y + .5 - p.y; if(Math.hypot(dx, dy) < .4 || !p.vivant) break; p.vise = Math.atan2(dy, dx); p.a = p.vise; autres(); pas(M); } }
  M.joueurs.forEach((q, i) => { if(q) q.vitesse = v[i]; });
}
const O = (M, x, y) => M.owner[y * N + x];

// 1. boucle rectangulaire
{ const M = createMonde(); const p = ajoute(M, { nom:'A' }); nait(M, p, 100, 100);
  const a0 = M.count[p.id]; chemin(M, p, [[110, 100], [110, 120], [100, 120], [100, 100]]);
  t('rectangle : capturé', O(M, 105, 110) === p.id && O(M, 108, 118) === p.id, M.count[p.id]);
  t('rectangle : pas plus', O(M, 112, 110) === 0 && O(M, 105, 123) === 0);
  t('rectangle : fil effacé', p.trace.length === 0 && !M.fil.some(f => f));
  t('rectangle : compte exact', coherent(M) && M.count[p.id] > a0 + 150, M.count[p.id]); }

// 2. zarbia en U, fermée par un petit fil : l'intérieur du U est pris (la boîte inclut toute la zarbia)
{ const M = createMonde(); const p = ajoute(M, { nom:'A' });
  for(let y = 50; y < 90; y++) for(let x = 50; x < 90; x++){ if(x < 54 || x > 85 || y > 85){ const c = y * N + x; M.owner[c] = p.id; M.count[p.id]++; const b = M.boite[p.id]; b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.max(b[2], x); b[3] = Math.max(b[3], y); } }
  p.vivant = true; p.x = 52.5; p.y = 52.5; p.nait = -1;
  chemin(M, p, [[52, 46], [87, 46], [87, 52]]);
  t('U : intérieur capturé', O(M, 70, 70) === p.id && O(M, 60, 80) === p.id, M.count[p.id]);
  t('U : compte', coherent(M)); }

// 3. contre le bord de la carte : le mur ne ferme pas une boucle
{ const M = createMonde(); const p = ajoute(M, { nom:'A' }); nait(M, p, 6, 200);
  chemin(M, p, [[6, 190], [0, 190], [0, 210], [6, 210], [6, 200]]);
  t('bord : capture correcte', O(M, 3, 195) === p.id && coherent(M)); }

// 4. capturer une partie de la zarbia d'un autre
{ const M = createMonde(); const p = ajoute(M, { nom:'A' }), q = ajoute(M, { nom:'B' }); nait(M, p, 100, 100); nait(M, q, 115, 100, 5);
  const qa = M.count[q.id];
  chemin(M, p, [[100, 108], [125, 108], [125, 92], [100, 92], [100, 100]]);
  t('vol : B a perdu des cases', M.count[q.id] < qa && O(M, 115, 100) === p.id, M.count[q.id]);
  t('vol : comptes', coherent(M)); }

// 5. aucun trou dans le fil, même très vite et en diagonale
{ const M = createMonde(); const p = ajoute(M, { nom:'A' }); nait(M, p, 200, 200); p.vitesse = 50;
  p.vise = p.a = .7; for(let i = 0; i < 40; i++) pas(M);
  let trou = 0; for(let i = 1; i < p.trace.length; i++){ const a = p.trace[i - 1], b = p.trace[i]; const d = Math.abs(a % N - b % N) + Math.abs(((a / N) | 0) - ((b / N) | 0)); if(d !== 1) trou++; }
  t('fil sans trou', trou === 0 && p.trace.length > 20, trou + ' / ' + p.trace.length); }

// 6. couper le fil d'un autre l'élimine, sa zarbia disparaît
{ const M = createMonde(); const p = ajoute(M, { nom:'A' }), q = ajoute(M, { nom:'B' }); nait(M, p, 100, 100); nait(M, q, 140, 100);
  chemin(M, q, [[140, 112], [120, 112]]);  // B sort et déroule son fil
  chemin(M, p, [[125, 100], [125, 125]]);  // A traverse le fil de B
  t('coupe : B éliminé', !q.vivant && M.count[q.id] === 0 && !M.owner.includes(q.id) && !M.fil.includes(q.id));
  t('coupe : A vivant, 1 élimination', p.vivant && p.kills === 1); t('coupe : comptes', coherent(M)); }

// 7. se couper soi-même : éliminé en Champion, pas en Tranquille
for(const tranquille of [false, true]){ const M = createMonde({ tranquille }); const p = ajoute(M, { nom:'A' }); nait(M, p, 100, 100);
  chemin(M, p, [[100, 110], [110, 110], [110, 115], [105, 115], [105, 105]]);
  t('soi-même ' + (tranquille ? 'tranquille' : 'champion'), p.vivant === tranquille); }

// 8. deux joueurs se coupent au même pas : les deux sont éliminés, aucun ne capture
{ const M = createMonde(); const p = ajoute(M, { nom:'A' }), q = ajoute(M, { nom:'B' }); nait(M, p, 100, 100); nait(M, q, 100, 140);
  chemin(M, p, [[100, 120], [110, 120]]); chemin(M, q, [[110, 140], [110, 125]]);
  // A va vers le fil de B pendant que B va vers le fil de A, au même pas
  for(const c of q.trace) M.fil[c] = q.id;
  const fa = p.trace.slice(-1)[0];
  p.x = 109.7; p.y = 125.5; p.a = p.vise = 0; // A juste avant le fil de B (x=110)
  q.x = 103.5; q.y = 121.3; q.a = q.vise = -Math.PI / 2;
  for(let k = 0; k < 30 && (p.vivant || q.vivant); k++) pas(M);
  t('simultané : les deux', !p.vivant && !q.vivant, p.vivant + ' ' + q.vivant); t('simultané : comptes', coherent(M)); }

// 9. compression réseau
{ const cells = [5, 6, 7, 8, 400, 401, 799, 1200, 1201]; t('compresse', JSON.stringify(decompresse(compresse(cells))) === JSON.stringify(cells)); }

// 10. stabilité : 13 joueurs au hasard pendant 60 s
{ const M = createMonde({ seed:7 }); const J = []; for(let i = 0; i < 13; i++){ const p = ajoute(M, { nom:'J' + i }); nait(M, p, 30 + (i % 4) * 100, 30 + Math.floor(i / 4) * 100); J.push(p); }
  const t0 = Date.now(); for(let k = 0; k < 3600; k++){ if(k % 30 === 0) J.forEach(p => { if(p.vivant) p.vise = p.a + (M.rnd() - .5) * 3; else nait(M, p, 30 + Math.floor(M.rnd() * 340), 30 + Math.floor(M.rnd() * 340)); }); pas(M); M.events.length = 0; }
  t('stabilité : comptes', coherent(M)); console.log('60 s de jeu à 13 :', Date.now() - t0, 'ms ; vivants', classement(M).length); }

console.log(ok + ' tests réussis, ' + ko + ' échecs'); process.exit(ko ? 1 : 0);
