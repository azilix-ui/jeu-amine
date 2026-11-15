/* Chkobba : les règles, sans aucun dessin. Le même moteur existe en PHP (api/chkobba.php, l'arbitre des parties en ligne) :
   docs/chkobba/test-regles.mjs vérifie les règles, et docs/chkobba/croise.mjs joue les mêmes parties dans les deux moteurs.
   40 cartes : 4 couleurs (d = carreau/deniers, c = cœur, p = pique, t = trèfle), valeurs 1 à 10 (dame = 8, valet = 9, roi = 10).
   Une carte = une chaîne : couleur + valeur ('d7' = le 7 de carreau, la Haya).
   Prise : d'abord une carte de même valeur (si plusieurs, on choisit laquelle), sinon des cartes dont la somme fait la valeur.
   Une prise possible avec la carte jouée est obligatoire (règle du cahier des charges du papa).
   Chkobba : une prise qui vide la table, sauf au tout dernier coup de la manche. */

export const COULEURS = ['d', 'c', 'p', 't'];
export const val = c => +c.slice(1), coul = c => c[0];

/* hasard à graine, identique en PHP (xorshift 32 bits) */
export function suivant(s){ s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s || 1; }
export function melange(seed){
  const p = []; for(const c of COULEURS) for(let v = 1; v <= 10; v++) p.push(c + v);
  let s = seed >>> 0 || 1;
  for(let i = p.length - 1; i > 0; i--){ s = suivant(s); const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; }
  return { paquet:p, seed:s };
}
export const entite = (s, j) => s.equipes ? j % 2 : j;
export const nbEntites = s => s.equipes ? 2 : s.n;

export function nouvellePartie({ n = 2, equipes = false, cible = 11, seed = 1, donneur = 0 } = {}){
  const s = { n, equipes:n === 4 && equipes, cible, seed:seed >>> 0 || 1, donneur:(donneur + n - 1) % n, manche:0, total:[], phase:'jeu', gagnant:-1, version:0, log:[] };
  s.total = new Array(nbEntites(s)).fill(0);
  nouvelleManche(s); return s;
}
export function nouvelleManche(s){
  let m;
  for(let k = 0; k < 20; k++){ m = melange(s.seed); s.seed = m.seed;
    const t = m.paquet.slice(0, 4), cpt = {}; t.forEach(c => cpt[val(c)] = (cpt[val(c)] || 0) + 1);
    if(Math.max(...Object.values(cpt)) < 3) break; }   // trois cartes de même valeur sur la table : on redistribue
  s.paquet = m.paquet; s.tapis = s.paquet.splice(0, 4);
  s.mains = []; s.pris = []; s.chk = [];
  for(let j = 0; j < s.n; j++){ s.mains.push(s.paquet.splice(0, 3)); s.pris.push([]); s.chk.push(0); }
  s.donneur = (s.donneur + 1) % s.n; s.tour = (s.donneur + 1) % s.n; s.dernier = -1; s.manche++; s.phase = 'jeu'; s.points = null; s.version++;
  s.log.push({ k:'donne', manche:s.manche, donneur:s.donneur });
}

/* les prises possibles d'une carte : une liste de listes de cartes de la table ([] = aucune prise, la carte est posée) */
export function options(carte, tapis){
  const v = val(carte), egales = tapis.filter(c => val(c) === v);
  if(egales.length) return egales.map(c => [c]);
  const res = [];
  const visite = (i, pris, somme) => { if(somme === v){ if(pris.length >= 2) res.push(pris.slice()); return; } if(somme > v) return;
    for(let k = i; k < tapis.length; k++){ pris.push(tapis[k]); visite(k + 1, pris, somme + val(tapis[k])); pris.pop(); } };
  visite(0, [], 0);
  return res;
}
const meme = (a, b) => a.length === b.length && a.every(x => b.includes(x));

/* jouer un coup : renvoie { ok:true, ev:[…] } ou { ok:false, err } sans rien changer */
export function jouer(s, j, carte, prise = []){
  if(s.phase !== 'jeu') return { ok:false, err:'pas en jeu' };
  if(s.tour !== j) return { ok:false, err:'pas ton tour' };
  if(!s.mains[j].includes(carte)) return { ok:false, err:'carte absente' };
  const opts = options(carte, s.tapis);
  if(opts.length ? !opts.some(o => meme(o, prise)) : prise.length) return { ok:false, err:'prise impossible' };
  const ev = [];
  s.mains[j] = s.mains[j].filter(c => c !== carte);
  const dernierCoup = s.paquet.length === 0 && s.mains.every(m => m.length === 0);
  if(prise.length){
    s.tapis = s.tapis.filter(c => !prise.includes(c)); s.pris[j].push(carte, ...prise); s.dernier = j;
    const chk = s.tapis.length === 0 && !dernierCoup; if(chk) s.chk[j]++;
    ev.push({ k:'prise', j, carte, prise, chk });
  } else { s.tapis.push(carte); ev.push({ k:'pose', j, carte }); }
  s.version++;
  // la suite : joueur suivant, redistribution, ou fin de manche
  if(s.mains.every(m => m.length === 0)){
    if(s.paquet.length >= 3 * s.n){ for(let k = 0; k < s.n; k++) s.mains[(s.donneur + 1 + k) % s.n] = s.paquet.splice(0, 3); ev.push({ k:'redonne' }); }
    else { finManche(s, ev); s.log.push(...ev); return { ok:true, ev }; }
  }
  s.tour = (j + 1) % s.n;
  s.log.push(...ev); if(s.log.length > 60) s.log.splice(0, s.log.length - 60);
  return { ok:true, ev };
}

/* une majorité ne donne le point qu'à un seul gagnant (égalité en tête = personne) */
export function majorite(t){ const m = Math.max(...t); return t.map(x => x === m && t.filter(y => y === m).length === 1 ? 1 : 0); }

export function finManche(s, ev = []){
  if(s.tapis.length){ const q = s.dernier >= 0 ? s.dernier : s.donneur; s.pris[q].push(...s.tapis); ev.push({ k:'ramasse', j:q, cartes:s.tapis.slice() }); s.tapis = []; }
  const E = nbEntites(s), cartes = new Array(E).fill(0), dinari = new Array(E).fill(0), sept = new Array(E).fill(0), six = new Array(E).fill(0), haya = new Array(E).fill(0), chk = new Array(E).fill(0);
  for(let j = 0; j < s.n; j++){ const e = entite(s, j); chk[e] += s.chk[j];
    for(const c of s.pris[j]){ cartes[e]++; if(coul(c) === 'd') dinari[e]++; if(val(c) === 7) sept[e]++; if(val(c) === 6) six[e]++; if(c === 'd7') haya[e] = 1; } }
  // la bermila : le plus de 7 ; à égalité, le plus de 6 entre ceux-là ; sinon personne
  const m7 = Math.max(...sept), ex = sept.map(x => x === m7); let bermila = new Array(E).fill(0);
  if(ex.filter(Boolean).length === 1) bermila = ex.map(x => x ? 1 : 0);
  else { const m6 = Math.max(...six.filter((_, i) => ex[i])), g = six.map((x, i) => ex[i] && x === m6); if(g.filter(Boolean).length === 1) bermila = g.map(x => x ? 1 : 0); }
  const karta = majorite(cartes), din = majorite(dinari);
  const pts = cartes.map((_, e) => ({ cartes:cartes[e], dinari:dinari[e], sept:sept[e], six:six[e], karta:karta[e], din:din[e], haya:haya[e], bermila:bermila[e], chk:chk[e], total:karta[e] + din[e] + haya[e] + bermila[e] + chk[e] }));
  pts.forEach((p, e) => s.total[e] += p.total);
  s.points = pts;
  // fin de partie : quelqu'un a atteint la cible, seul en tête ; égalité en tête : une manche de plus
  const m = Math.max(...s.total);
  if(m >= s.cible && s.total.filter(x => x === m).length === 1){ s.phase = 'fini'; s.gagnant = s.total.indexOf(m); }
  else s.phase = 'manche';
  s.version++; ev.push({ k:'fin', points:pts, total:s.total.slice(), phase:s.phase, gagnant:s.gagnant });
  return pts;
}
export const totalCartes = s => s.tapis.length + s.paquet.length + s.mains.reduce((a, m) => a + m.length, 0) + s.pris.reduce((a, m) => a + m.length, 0);

/* ce qu'un joueur a le droit de voir : sa main, le nombre de cartes des autres, la table, les tas (nombres), les chkobbas, les scores */
export function vue(s, j){
  return { n:s.n, equipes:s.equipes, cible:s.cible, moi:j, main:j >= 0 ? s.mains[j].slice() : [], nMains:s.mains.map(m => m.length), tapis:s.tapis.slice(), nPaquet:s.paquet.length,
    nPris:s.pris.map(p => p.length), chk:s.chk.slice(), tour:s.tour, donneur:s.donneur, dernier:s.dernier, manche:s.manche, total:s.total.slice(), phase:s.phase, gagnant:s.gagnant, points:s.points, version:s.version };
}

/* ---------- l'ordinateur ----------
   facile : un coup permis au hasard ; moyen : le meilleur coup selon une note ; malin : la même note, avec le risque calculé
   d'après les cartes qu'il n'a pas encore vues (jamais les cartes cachées des autres). */
export function coupsPermis(main, tapis){ const r = []; for(const c of main){ const o = options(c, tapis); if(o.length) o.forEach(p => r.push({ carte:c, prise:p })); else r.push({ carte:c, prise:[] }); } return r; }
export function choisir(s, j, niveau = 'moyen', rnd = Math.random){
  const coups = coupsPermis(s.mains[j], s.tapis);
  if(niveau === 'facile') return coups[Math.floor(rnd() * coups.length)];
  // les cartes qu'il ne voit pas : ni dans sa main, ni sur la table, ni déjà prises (les tas sont connus de tous à la chkobba)
  const vues = new Set([...s.mains[j], ...s.tapis, ...s.pris.flat()]);
  const invisibles = []; for(const c of COULEURS) for(let v = 1; v <= 10; v++) if(!vues.has(c + v)) invisibles.push(c + v);
  const adv = []; for(let k = 0; k < s.n; k++) if(k !== j && (!s.equipes || k % 2 !== j % 2)) adv.push(k);
  const mainsAdv = adv.reduce((a, k) => a + s.mains[k].length, 0) - 1;   // le prochain adversaire, à peu près
  const dernierCoup = s.paquet.length === 0 && s.mains.reduce((a, m) => a + m.length, 0) === 1;
  let best = null;
  for(const m of coups){
    let note = 0; const pris = m.prise.length ? [m.carte, ...m.prise] : [];
    if(pris.length){ note += 5 * pris.length; for(const c of pris){ if(coul(c) === 'd') note += 8; if(val(c) === 7) note += 12; if(c === 'd7') note += 40; } if(m.prise.length === s.tapis.length && !dernierCoup) note += 100; }
    else { if(coul(m.carte) === 'd') note -= 8; if(val(m.carte) === 7) note -= 12; if(m.carte === 'd7') note -= 40; note -= val(m.carte) * .3; }
    // le risque de laisser une chkobba : la table restante peut-elle être prise d'un coup ?
    const reste = pris.length ? s.tapis.filter(c => !m.prise.includes(c)) : [...s.tapis, m.carte];
    if(reste.length && !dernierCoup){ const somme = reste.reduce((a, c) => a + val(c), 0);
      const v = reste.length === 1 ? val(reste[0]) : somme <= 10 && !reste.some(c => val(c) === somme) ? somme : 0;
      if(v){ let p = .5; if(niveau === 'malin'){ const k = invisibles.filter(c => val(c) === v).length; p = invisibles.length ? Math.min(1, k * Math.max(1, mainsAdv) / invisibles.length) : 0; } note -= 70 * p; } }
    note += rnd() * 2;
    if(!best || note > best.note) best = { ...m, note };
  }
  return { carte:best.carte, prise:best.prise };
}
