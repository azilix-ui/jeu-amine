/* Bilot (بيلوت) : la belote coinchée, les règles sans aucun dessin. Le même moteur existe en PHP (api/bilot_regles.php,
   l'arbitre des parties en ligne) : docs/bilot/test-regles.mjs vérifie les règles et docs/bilot/croise.mjs joue les mêmes
   parties dans les deux moteurs.

   32 cartes : 4 couleurs (d = carreau, c = cœur, p = pique, t = trèfle) × 8 hauteurs (7 8 9 T=10 V D R A). 'pV' = valet de pique.
   4 joueurs, 2 équipes : 0 et 2 contre 1 et 3 (l'équipe d'un joueur = j % 2). On tourne dans le sens 0 → 1 → 2 → 3.
   Une manche : le donneur distribue 8 cartes à chacun (3, 2, 3) ; ENCHÈRES : à partir de sa droite, chacun passe ou annonce
   un contrat plus fort (80, 90 … 160, ou capot = 250) dans une couleur d'atout ; un adversaire du preneur peut COINCHER (×2),
   puis le preneur peut SURCOINCHER (×4) ; trois « passe » après une annonce = on joue ; quatre « passe » = on redonne.
   JEU : 8 plis. On doit fournir la couleur demandée ; à l'atout, il faut monter si on peut. Sans la couleur : si son partenaire
   est maître du pli, on joue ce qu'on veut ; sinon on doit couper (et surcouper si on peut, sinon couper plus bas).
   Points des cartes : atout V 20, 9 14, A 11, 10 10, R 4, D 3, 8 et 7 0 ; autres couleurs : A 11, 10 10, R 4, D 3, V 2.
   Dix de der : 10 points au dernier pli (162 en tout). Belote-rebelote : le roi et la dame d'atout dans la même main = 20 points.
   SCORE : contrat réussi si les points du preneur (belote comprise) atteignent le contrat (capot : tous les plis) :
     preneurs = contrat × coinche + leurs points (arrondis à la dizaine) ; défense = ses points (rien si coinché).
   Contrat chuté : défense = (160 + contrat) × coinche ; preneurs = 0. La belote reste toujours à l'équipe qui l'a.
   Partie en 500, 1000 ou 1500 points. */

export const COULEURS = ['p', 'c', 'd', 't'];
export const HAUTEURS = ['7', '8', '9', 'T', 'V', 'D', 'R', 'A'];
export const NOMS_C = { p:'pique', c:'cœur', d:'carreau', t:'trèfle' };
export const SYM = { p:'♠', c:'♥', d:'♦', t:'♣' };
export const coul = c => c[0], haut = c => c[1];
const ORDRE_ATOUT = ['7', '8', 'D', 'R', 'T', 'A', '9', 'V'];      // du plus faible au plus fort
const ORDRE_SANS = ['7', '8', '9', 'V', 'D', 'R', 'T', 'A'];
const PTS_ATOUT = { V:20, 9:14, A:11, T:10, R:4, D:3, 8:0, 7:0 };
const PTS_SANS = { A:11, T:10, R:4, D:3, V:2, 9:0, 8:0, 7:0 };
export const CONTRATS = [80, 90, 100, 110, 120, 130, 140, 150, 160, 250];   // 250 = capot
export const equipe = j => j % 2;
export const points = (c, atout) => (coul(c) === atout ? PTS_ATOUT : PTS_SANS)[haut(c)];
export const force = (c, atout) => coul(c) === atout ? 100 + ORDRE_ATOUT.indexOf(haut(c)) : ORDRE_SANS.indexOf(haut(c));
export const arrondi = x => Math.round(x / 10) * 10;
export const nomContrat = v => v === 250 ? 'capot' : String(v);

/* hasard à graine, identique en PHP (xorshift 32 bits, comme la Chkobba) */
export function suivant(s){ s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s || 1; }
export function melange(seed){
  const p = []; for(const c of COULEURS) for(const h of HAUTEURS) p.push(c + h);
  let s = seed >>> 0 || 1;
  for(let i = p.length - 1; i > 0; i--){ s = suivant(s); const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  return { paquet:p, seed:s };
}
const trieMain = m => m.sort((a, b) => COULEURS.indexOf(coul(a)) - COULEURS.indexOf(coul(b)) || ORDRE_SANS.indexOf(haut(a)) - ORDRE_SANS.indexOf(haut(b)));

export function nouvellePartie({ cible = 1000, seed = 1, donneur = 0 } = {}){
  const s = { n:4, cible, seed:seed >>> 0 || 1, donneur:(donneur + 3) % 4, manche:0, total:[0, 0], phase:'enchere', gagnant:-1, version:0, log:[] };
  nouvelleManche(s); return s;
}
export function nouvelleManche(s){
  const m = melange(s.seed); s.seed = m.seed;
  s.donneur = (s.donneur + 1) % 4; s.mains = [[], [], [], []];
  // la donne : 3, 2, puis 3 cartes à chacun, en commençant à droite du donneur
  let k = 0; for(const n of [3, 2, 3]) for(let i = 1; i <= 4; i++){ const j = (s.donneur + i) % 4; s.mains[j].push(...m.paquet.slice(k, k + n)); k += n; }
  s.mains.forEach(trieMain);
  s.encheres = []; s.contrat = null; s.coinche = 1; s.passes = 0; s.tour = (s.donneur + 1) % 4;
  s.pli = []; s.plis = [0, 0]; s.ramasse = [[], []]; s.dernierPli = null; s.belote = [0, 0]; s.beloteVue = [false, false, false, false];
  s.joues = []; s.points = null; s.manche++; s.phase = 'enchere'; s.version++;
  s.log.push({ k:'donne', manche:s.manche, donneur:s.donneur });
}

/* ---------- les enchères ----------
   a = { k:'passe' } | { k:'annonce', v:80…250, c:'p'|'c'|'d'|'t' } | { k:'coinche' } | { k:'surcoinche' } */
export function encheresPermises(s, j){
  const r = [{ k:'passe' }]; if(s.phase !== 'enchere' || s.tour !== j) return [];
  const C = s.contrat;
  if(s.coinche === 1){
    const min = C ? CONTRATS[CONTRATS.indexOf(C.v) + 1] : 80;
    if(min) for(const v of CONTRATS) if(v >= min) for(const c of COULEURS) r.push({ k:'annonce', v, c });
    if(C && equipe(C.j) !== equipe(j)) r.push({ k:'coinche' });
  } else if(s.coinche === 2 && C && equipe(C.j) === equipe(j)) r.push({ k:'surcoinche' });
  return r;
}
export function encherir(s, j, a){
  if(s.phase !== 'enchere') return { ok:false, err:'pas aux enchères' };
  if(s.tour !== j) return { ok:false, err:'pas ton tour' };
  const ok = encheresPermises(s, j).some(x => x.k === a.k && (x.k !== 'annonce' || (x.v === a.v && x.c === a.c)));
  if(!ok) return { ok:false, err:'annonce impossible' };
  const ev = [{ k:'enchere', j, a:{ k:a.k, v:a.v, c:a.c } }]; s.encheres.push({ j, k:a.k, v:a.v, c:a.c });
  if(a.k === 'annonce'){ s.contrat = { v:a.v, c:a.c, j }; s.passes = 0; }
  else if(a.k === 'coinche'){ s.coinche = 2; s.passes = 0; }
  else if(a.k === 'surcoinche'){ s.coinche = 4; }
  else s.passes++;
  s.version++;
  // fin des enchères : surcoinche ; coinche suivie du tour de l'équipe du preneur (2 passes) ; 3 passes après une annonce ; 4 passes sans annonce
  const fini = a.k === 'surcoinche' || (s.coinche === 2 && s.passes >= 2) || (s.contrat && s.coinche === 1 && s.passes >= 3);
  if(!s.contrat && s.passes >= 4){ ev.push({ k:'redonne' }); s.log.push(...ev); nouvelleManche(s); return { ok:true, ev }; }
  if(fini){ s.phase = 'jeu'; s.tour = (s.donneur + 1) % 4; ev.push({ k:'contrat', contrat:{ ...s.contrat }, coinche:s.coinche }); }
  else {
    s.tour = (j + 1) % 4;
    // après une coinche, seule l'équipe du preneur parle encore (surcoincher ou passer)
    if(s.coinche === 2) while(equipe(s.tour) !== equipe(s.contrat.j)) s.tour = (s.tour + 1) % 4;
  }
  s.log.push(...ev); return { ok:true, ev };
}

/* ---------- le jeu de la carte ---------- */
export function maitre(pli, atout){   // l'indice (dans le pli) de la carte qui gagne pour l'instant
  const dem = coul(pli[0].c); let b = 0;
  for(let i = 1; i < pli.length; i++){ const c = pli[i].c, m = pli[b].c;
    if(coul(c) === atout ? (coul(m) !== atout || force(c, atout) > force(m, atout)) : (coul(m) !== atout && coul(c) === dem && force(c, atout) > force(m, atout))) b = i; }
  return b;
}
export function permises(s, j){
  const main = s.mains[j], A = s.contrat.c; if(!s.pli.length) return main.slice();
  const dem = coul(s.pli[0].c), memes = main.filter(c => coul(c) === dem), atouts = main.filter(c => coul(c) === A);
  const mi = maitre(s.pli, A), m = s.pli[mi], fortAtout = s.pli.filter(x => coul(x.c) === A).reduce((a, x) => Math.max(a, force(x.c, A)), -1);
  if(memes.length){
    if(dem !== A) return memes;
    const plus = memes.filter(c => force(c, A) > fortAtout); return plus.length ? plus : memes;   // à l'atout : monter si on peut
  }
  if(equipe(m.j) === equipe(j)) return main.slice();          // le partenaire est maître : on est libre
  if(!atouts.length) return main.slice();
  const plus = atouts.filter(c => force(c, A) > fortAtout); return plus.length ? plus : atouts;   // couper, surcouper si possible
}
export function jouer(s, j, carte){
  if(s.phase !== 'jeu') return { ok:false, err:'pas en jeu' };
  if(s.tour !== j) return { ok:false, err:'pas ton tour' };
  if(!s.mains[j].includes(carte)) return { ok:false, err:'carte absente' };
  if(!permises(s, j).includes(carte)) return { ok:false, err:'carte interdite' };
  const A = s.contrat.c, ev = [];
  s.mains[j] = s.mains[j].filter(c => c !== carte); s.pli.push({ j, c:carte }); s.joues.push(carte);
  const e = { k:'carte', j, c:carte };
  // belote-rebelote : le roi et la dame d'atout de la même main
  if(coul(carte) === A && (haut(carte) === 'R' || haut(carte) === 'D')){
    const autre = A + (haut(carte) === 'R' ? 'D' : 'R');
    if(s.beloteVue[j]){ e.belote = 'rebelote'; s.belote[equipe(j)] = 20; }
    else if(s.mains[j].includes(autre)){ e.belote = 'belote'; s.beloteVue[j] = true; }
  }
  ev.push(e); s.version++;
  if(s.pli.length < 4){ s.tour = (j + 1) % 4; s.log.push(...ev); return { ok:true, ev }; }
  // le pli est complet
  const g = s.pli[maitre(s.pli, A)].j, eq = equipe(g);
  s.plis[eq]++; s.ramasse[eq].push(...s.pli.map(x => x.c)); s.dernierPli = { cartes:s.pli.slice(), g };
  ev.push({ k:'pli', g, cartes:s.pli.map(x => x.c) }); s.pli = []; s.tour = g;
  if(s.mains.every(m => !m.length)) finManche(s, ev, g);
  s.log.push(...ev); if(s.log.length > 80) s.log.splice(0, s.log.length - 80);
  return { ok:true, ev };
}
export function finManche(s, ev = [], dernier = 0){
  const A = s.contrat.c, P = equipe(s.contrat.j), D = 1 - P, K = s.contrat.v, m = s.coinche;
  const pts = [0, 0]; for(const e of [0, 1]) for(const c of s.ramasse[e]) pts[e] += points(c, A);
  pts[equipe(dernier)] += 10;                                     // dix de der
  const capot = s.plis[P] === 8; if(capot) pts[P] = 252;          // tous les plis : 252
  const reussi = K === 250 ? capot : pts[P] + s.belote[P] >= K;
  const marque = [0, 0];
  if(reussi){ marque[P] = K * m + arrondi(pts[P]); marque[D] = m === 1 ? arrondi(pts[D]) : 0; }
  else { marque[D] = (160 + K) * m; marque[P] = 0; }
  marque[0] += s.belote[0]; marque[1] += s.belote[1];
  s.total[0] += marque[0]; s.total[1] += marque[1];
  s.points = { cartes:pts, belote:s.belote.slice(), reussi, capot, marque, preneur:P, contrat:K, coinche:m, atout:A };
  const mx = Math.max(...s.total);
  if(mx >= s.cible && s.total[0] !== s.total[1]){ s.phase = 'fini'; s.gagnant = s.total.indexOf(mx); } else s.phase = 'manche';
  s.version++; ev.push({ k:'fin', points:s.points, total:s.total.slice(), phase:s.phase, gagnant:s.gagnant });
  return s.points;
}

/* ce qu'un joueur a le droit de voir : sa main, le nombre de cartes des autres, le pli en cours, le dernier pli, les enchères, les scores */
export function vue(s, j){
  return { moi:j, main:j >= 0 ? s.mains[j].slice() : [], nMains:s.mains.map(m => m.length), pli:s.pli.map(x => ({ ...x })), dernierPli:s.dernierPli,
    encheres:s.encheres.map(x => ({ ...x })), contrat:s.contrat ? { ...s.contrat } : null, coinche:s.coinche, tour:s.tour, donneur:s.donneur, plis:s.plis.slice(),
    manche:s.manche, total:s.total.slice(), cible:s.cible, phase:s.phase, gagnant:s.gagnant, points:s.points, belote:s.belote.slice(), version:s.version,
    permises:(s.phase === 'jeu' && s.tour === j) ? permises(s, j) : [] };
}

/* ---------- l'ordinateur ----------
   facile : une annonce rare, une carte permise au hasard ; moyen : il estime sa main et joue proprement ;
   malin : il compte aussi les cartes tombées pour savoir qui est maître (jamais les cartes cachées des autres). */
export function estime(main, c){   // ce que vaut une main avec l'atout c (à peu près les points qu'on peut espérer avec son partenaire)
  const at = main.filter(x => coul(x) === c); let e = 0;
  if(at.some(x => haut(x) === 'V')) e += 22; if(at.some(x => haut(x) === '9')) e += 15; if(at.some(x => haut(x) === 'A')) e += 10;
  e += at.length * 9; if(at.length >= 5) e += 10;
  if(at.some(x => haut(x) === 'R') && at.some(x => haut(x) === 'D')) e += 20;
  for(const k of COULEURS) if(k !== c){ const m = main.filter(x => coul(x) === k);
    if(m.some(x => haut(x) === 'A')) e += 11; if(m.some(x => haut(x) === 'T') && m.some(x => haut(x) === 'A')) e += 7; if(!m.length) e += 6; }
  return e + 30;   // le partenaire apporte en moyenne une trentaine de points
}
export function choisirEnchere(s, j, niveau = 'moyen', rnd = Math.random){
  const P = encheresPermises(s, j), main = s.mains[j], C = s.contrat;
  if(niveau === 'facile'){ if(!C && rnd() < .5){ const c = COULEURS.slice().sort((a, b) => main.filter(x => coul(x) === b).length - main.filter(x => coul(x) === a).length)[0]; return { k:'annonce', v:80, c }; } return { k:'passe' }; }
  // coincher : les adversaires ont annoncé haut, et on tient leur atout ou beaucoup d'as
  if(P.some(x => x.k === 'coinche')){
    const at = main.filter(x => coul(x) === C.c), as = main.filter(x => haut(x) === 'A' && coul(x) !== C.c).length;
    const tient = (at.some(x => haut(x) === 'V') ? 2 : 0) + (at.some(x => haut(x) === '9') ? 1 : 0) + (at.length >= 3 ? 1 : 0) + as;
    if(tient >= (niveau === 'malin' ? 4 : 5) && C.v >= 100) return { k:'coinche' };
  }
  if(P.some(x => x.k === 'surcoinche')) return estime(main, C.c) >= C.v + 40 ? { k:'surcoinche' } : { k:'passe' };
  let best = null;
  for(const c of COULEURS){ let e = estime(main, c);
    if(C && equipe(C.j) === equipe(j) && C.c === c) e += 10;                     // soutenir le partenaire
    if(C && equipe(C.j) === equipe(j) && C.c !== c) e -= 15;
    if(!best || e > best.e) best = { c, e }; }
  // soutien : le partenaire a annoncé, on ajoute 10 par as et 20 pour le valet ou le 9 de son atout
  if(C && equipe(C.j) === equipe(j)){
    const at = main.filter(x => coul(x) === C.c); let plus = main.filter(x => haut(x) === 'A' && coul(x) !== C.c).length * 10;
    if(at.some(x => haut(x) === 'V')) plus += 20; if(at.some(x => haut(x) === '9')) plus += 10;
    const v = Math.min(160, Math.floor((C.v + plus) / 10) * 10);
    if(plus >= 20 && v > C.v && P.some(x => x.k === 'annonce' && x.v === v && x.c === C.c)) return { k:'annonce', v, c:C.c };
    return { k:'passe' };
  }
  const v = Math.min(160, Math.floor(best.e / 10) * 10 - (niveau === 'malin' ? 0 : 10));
  if(v >= 80 && P.some(x => x.k === 'annonce' && x.v === v && x.c === best.c)) return { k:'annonce', v, c:best.c };
  return { k:'passe' };
}
export function choisirCarte(s, j, niveau = 'moyen', rnd = Math.random){
  const L = permises(s, j), A = s.contrat.c; if(L.length === 1) return L[0];
  if(niveau === 'facile') return L[Math.floor(rnd() * L.length)];
  const tombees = new Set(niveau === 'malin' ? s.joues : s.joues.slice(-8));
  const main = s.mains[j], preneur = equipe(s.contrat.j) === equipe(j);
  // une carte est « maîtresse » si aucune carte plus forte de sa couleur n'est encore cachée
  const estMaitre = c => { for(const h of HAUTEURS){ const x = coul(c) + h; if(force(x, A) > force(c, A) && !tombees.has(x) && !main.includes(x)) return false; } return true; };
  const pts = c => points(c, A), faible = arr => arr.slice().sort((a, b) => pts(a) - pts(b) || force(a, A) - force(b, A))[0];
  if(!s.pli.length){   // on ouvre le pli
    const atouts = main.filter(c => coul(c) === A), restants = 8 - [...tombees].filter(c => coul(c) === A).length - atouts.length;
    if(preneur && atouts.length && restants > 0){ const m = atouts.find(estMaitre); if(m) return m; }
    const maitres = L.filter(c => coul(c) !== A && estMaitre(c)); if(maitres.length) return maitres.sort((a, b) => pts(b) - pts(a))[0];
    return faible(L.filter(c => coul(c) !== A).length ? L.filter(c => coul(c) !== A) : L);
  }
  const mi = maitre(s.pli, A), gagnant = s.pli[mi], dernier = s.pli.length === 3;
  const gagne = c => { const t = s.pli.concat([{ j, c }]); return maitre(t, A) === t.length - 1; };
  if(equipe(gagnant.j) === equipe(j) && (dernier || estMaitre(gagnant.c))){   // le partenaire tient le pli : on le charge
    const non = L.filter(c => coul(c) !== A); const cand = non.length ? non : L; return cand.sort((a, b) => pts(b) - pts(a))[0]; }
  const gagnantes = L.filter(gagne);
  if(gagnantes.length){
    const sur = gagnantes.filter(c => dernier || estMaitre(c));
    if(sur.length) return sur.sort((a, b) => force(a, A) - force(b, A))[0];
    const valeurPli = s.pli.reduce((a, x) => a + pts(x.c), 0); if(valeurPli >= 10) return gagnantes.sort((a, b) => force(a, A) - force(b, A))[0];
  }
  return faible(L);
}
