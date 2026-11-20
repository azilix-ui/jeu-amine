/* Serpent Légendes · l'arène (21/11) : les règles, sans dessin (importable en Node pour les tests).
   D'après le cahier des charges du papa « Snake Arena » (genre Snake.io), en version originale et tunisienne.
   - Le serpent avance toujours ; il tourne vers la direction voulue (rotation limitée, pas de demi-tour sec).
   - Il mange les perles et grandit ; le boost va plus vite mais coûte de la masse (des perles tombent derrière lui).
   - Si sa tête touche le corps d'un autre serpent : il meurt et son corps devient une pluie de perles.
     Tête contre tête : les deux meurent. On ne meurt pas sur son propre corps. Le bord de l'arène est mortel.
   - Simulation à pas fixe (30 par seconde), le dessin est interpolé.
   Chaque serpent est « local » (simulé ici : le joueur, et les machines sur la tablette qui les fait jouer)
   ou « distant » (en ligne : sa tablette envoie sa tête, on refait son corps avec le chemin reçu). */
export const CFG = { taille:3000, vitesse:170, boost:270, rotation:230 * Math.PI / 180, masse0:100, masseMinBoost:50, coutBoost:8,
  perle:2, captation:14, pas:1 / 30, ecartChemin:5, perles:700, maxPerles:2200 };

// hasard reproductible (même graine = même arène sur toutes les tablettes)
export function hasard(graine){ let s = graine >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const h2 = (a, b) => { let x = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(b + 0x632BE5AB, 0xC2B2AE35); x ^= x >>> 13; x = Math.imul(x, 0x27D4EB2F); x ^= x >>> 16; return (x >>> 0) / 4294967296; };

export const rayon = m => Math.min(34, 9 + Math.sqrt(Math.max(0, m)) * .62);           // l'épaisseur du serpent
export const longueur = m => 60 + Math.max(0, m) * 1.7;                                  // la longueur de son corps
const tourne = m => CFG.rotation * Math.max(.45, 1 - Math.max(0, m - 100) / 3500);       // les gros tournent un peu moins vite

export function nouvelleArene(o = {}){
  const A = { t:0, tick:0, graine:o.graine >>> 0 || 1, taille:o.taille || CFG.taille, serpents:[], perles:new Map(), gen:[], nbFixes:o.perles || CFG.perles,
    events:[], idDrop:0, prefixe:o.prefixe || 'l', mode:o.mode || 'tranquille', grille:new Map(), cellule:72 };
  for(let i = 0; i < A.nbFixes; i++){ A.gen[i] = 0; poseFixe(A, i); }
  return A;
}
// les perles « fixes » : leur place dépend seulement de la graine, de leur numéro et de leur génération (pareil partout)
function poseFixe(A, i){
  const g = A.gen[i], r1 = h2(A.graine + i * 7919, g * 2 + 1), r2 = h2(A.graine + i * 104729, g * 2 + 2), r3 = h2(i, A.graine + g);
  const m = 60, x = m + r1 * (A.taille - 2 * m), y = m + r2 * (A.taille - 2 * m);
  A.perles.set('f' + i, { id:'f' + i, i, g, x, y, v:r3 < .08 ? 6 : r3 < .3 ? 3 : 1, c:Math.floor(r3 * 997) % 8, fixe:true });
}
export function mangeFixe(A, i, g){ if(A.gen[i] !== g) return false; A.gen[i] = g + 1; poseFixe(A, i); return true; }
export function ajouteDrop(A, x, y, v, c, id){
  if(A.perles.size >= CFG.maxPerles) return null;
  id = id || A.prefixe + ':' + (++A.idDrop); x = Math.max(20, Math.min(A.taille - 20, x)); y = Math.max(20, Math.min(A.taille - 20, y));
  const p = { id, x, y, v, c, drop:true, ne:A.t }; A.perles.set(id, p); return p;
}

export function nouveauSerpent(A, o){
  const s = { id:o.id ?? A.serpents.length, nom:o.nom || 'Serpent', skin:o.skin || 'fennec', x:o.x, y:o.y, a:o.a ?? 0, vise:o.a ?? 0, masse:o.masse || CFG.masse0,
    boost:false, veutBoost:false, chemin:[], vivant:true, kills:0, local:o.local !== false, bot:o.bot || null, niveau:o.niveau || 'normal', client:o.client || null,
    nes:A.t, meilleur:o.masse || CFG.masse0, mange:0, frac:0, px:o.x, py:o.y, pa:o.a ?? 0, invinc:o.invinc ?? 2 };
  for(let k = 0; k < 24; k++) s.chemin.push({ x:s.x - Math.cos(s.a) * k * CFG.ecartChemin, y:s.y - Math.sin(s.a) * k * CFG.ecartChemin });
  A.serpents.push(s); return s;
}
// une place sûre pour (re)naître : loin des têtes et des bords
export function placeSure(A, rnd = Math.random){
  let best = null, bd = -1;
  for(let k = 0; k < 40; k++){
    const x = 300 + rnd() * (A.taille - 600), y = 300 + rnd() * (A.taille - 600);
    let d = 1e9; for(const s of A.serpents) if(s.vivant) for(let j = 0; j < s.chemin.length; j += 6){ const q = s.chemin[j]; d = Math.min(d, Math.hypot(q.x - x, q.y - y)); }
    if(d > bd){ bd = d; best = { x, y, a:Math.atan2(A.taille / 2 - y, A.taille / 2 - x) }; } if(d > 500) break;
  }
  return best;
}
export function renait(A, s, pl){ s.x = s.px = pl.x; s.y = s.py = pl.y; s.a = s.vise = s.pa = pl.a; s.masse = CFG.masse0; s.vivant = true; s.boost = false; s.chemin = []; s.invinc = 2; s.nes = A.t; s.frac = 0;
  for(let k = 0; k < 24; k++) s.chemin.push({ x:s.x - Math.cos(s.a) * k * CFG.ecartChemin, y:s.y - Math.sin(s.a) * k * CFG.ecartChemin }); }

// la grille des corps (pour les collisions et les machines) : chaque point du chemin, avec son serpent
function rangeGrille(A){
  const G = A.grille, c = A.cellule; G.clear();
  for(const s of A.serpents){ if(!s.vivant) continue; const ch = s.chemin, r = rayon(s.masse);
    for(let j = 3; j < ch.length; j += 2){ const q = ch[j], k = ((q.x / c) | 0) * 4096 + ((q.y / c) | 0); let l = G.get(k); if(!l) G.set(k, l = []); l.push(s, q.x, q.y, r); } }
}
export function corpsProches(A, x, y, rr, cb){
  const c = A.cellule, n = Math.ceil(rr / c), cx = (x / c) | 0, cy = (y / c) | 0;
  for(let i = cx - n; i <= cx + n; i++) for(let j = cy - n; j <= cy + n; j++){ const l = A.grille.get(i * 4096 + j); if(!l) continue;
    for(let k = 0; k < l.length; k += 4) if(cb(l[k], l[k + 1], l[k + 2], l[k + 3]) === false) return; }
}

// avance un serpent local d'un pas
function avance(A, s, dt){
  s.px = s.x; s.py = s.y; s.pa = s.a;
  let d = s.vise - s.a; while(d > Math.PI) d -= 2 * Math.PI; while(d < -Math.PI) d += 2 * Math.PI;
  const tr = tourne(s.masse) * dt; s.a += Math.max(-tr, Math.min(tr, d));
  s.boost = s.veutBoost && s.masse > CFG.masseMinBoost;
  const v = s.boost ? CFG.boost : CFG.vitesse;
  s.x += Math.cos(s.a) * v * dt; s.y += Math.sin(s.a) * v * dt;
  if(s.boost){ s.masse -= CFG.coutBoost * dt; s.frac += CFG.coutBoost * dt;
    if(s.frac >= 2){ s.frac -= 2; const q = s.chemin[s.chemin.length - 1]; const p = ajouteDrop(A, q.x + (Math.random() - .5) * 8, q.y + (Math.random() - .5) * 8, 1.6, 7); if(p) A.events.push({ k:'drop', s, p }); } }
  pousseChemin(s);
}
export function pousseChemin(s){
  const ch = s.chemin, t = ch[0];
  if(!t || Math.hypot(s.x - t.x, s.y - t.y) >= CFG.ecartChemin) ch.unshift({ x:s.x, y:s.y }); else { t.x = s.x; t.y = s.y; }
  // on coupe le corps à sa longueur
  let L = longueur(s.masse), acc = 0;
  for(let j = 1; j < ch.length; j++){ acc += Math.hypot(ch[j].x - ch[j - 1].x, ch[j].y - ch[j - 1].y); if(acc > L){ ch.length = j + 1; break; } }
}

// la tête d'un serpent local touche-t-elle un autre corps (ou le bord) ?
function collision(A, s){
  const r = rayon(s.masse) * .82, T = A.taille;
  if(s.x < r || s.y < r || s.x > T - r || s.y > T - r) return { bord:true };
  if(s.invinc > 0) return null;
  let par = null;
  corpsProches(A, s.x, s.y, 40, (o, x, y, ro) => { if(o === s || !o.vivant) return; if(Math.hypot(x - s.x, y - s.y) < r + ro * .8){ par = o; return false; } });
  if(!par) for(const o of A.serpents){ if(o === s || !o.vivant) continue; const ch = o.chemin;   // les 3 premiers points (le cou) ne sont pas dans la grille
    for(let j = 0; j < Math.min(3, ch.length); j++) if(Math.hypot(ch[j].x - s.x, ch[j].y - s.y) < r + rayon(o.masse) * .8){ par = o; break; } if(par) break; }
  return par ? { par, tete:par.chemin.length && Math.hypot(par.x - s.x, par.y - s.y) < r + rayon(par.masse) } : null;
}
// un serpent meurt : son corps devient des perles (le nombre de perles suit sa masse)
export function meurt(A, s, par, local = true){
  if(!s.vivant) return []; s.vivant = false; s.boost = false;
  const drops = []; if(local){ const ch = s.chemin, n = Math.max(6, Math.min(140, Math.round(s.masse / 4))), val = Math.max(1, s.masse * .7 / n);
    for(let k = 0; k < n; k++){ const q = ch[Math.floor(k / n * (ch.length - 1))]; const p = ajouteDrop(A, q.x + (Math.random() - .5) * 18, q.y + (Math.random() - .5) * 18, Math.round(val * 10) / 10, (k + s.id) % 8); if(p) drops.push(p); } }
  if(par && par !== s) par.kills++;
  A.events.push({ k:'mort', s, par, drops }); return drops;
}

// mange les perles autour de la tête
function mange(A, s){
  const r = rayon(s.masse) + CFG.captation;
  for(const p of A.perles.values()){
    if(Math.abs(p.x - s.x) > r + 6 || Math.abs(p.y - s.y) > r + 6) continue;
    if(Math.hypot(p.x - s.x, p.y - s.y) > r) continue;
    if(p.drop && A.t - p.ne < .5 && s.boost) continue;   // pas ses propres perles de boost tout de suite
    s.masse += p.v * CFG.perle / 2 * (p.fixe ? 1 : 1); s.mange += 1;
    if(p.fixe){ mangeFixe(A, p.i, p.g); A.events.push({ k:'mangeF', s, i:p.i, g:p.g, p }); }
    else { A.perles.delete(p.id); A.events.push({ k:'mangeD', s, id:p.id, p }); }
  }
  if(s.masse > s.meilleur) s.meilleur = s.masse;
}

// un pas de simulation pour tous les serpents locaux (les distants sont avancés par le réseau)
export function pas(A, dt = CFG.pas){
  A.t += dt; A.tick++;
  for(const s of A.serpents) if(s.vivant && s.local){ if(s.invinc > 0) s.invinc -= dt; avance(A, s, dt); }
  rangeGrille(A);
  const morts = [];
  for(const s of A.serpents){ if(!s.vivant || !s.local) continue; const c = collision(A, s); if(c) morts.push([s, c]); }
  for(const [s, c] of morts) meurt(A, s, c.bord ? null : c.par);
  for(const s of A.serpents) if(s.vivant && s.local) mange(A, s);
  // les perles tombées disparaissent doucement (pour ne pas en avoir trop)
  if(A.tick % 30 === 0) for(const p of A.perles.values()) if(p.drop && A.t - p.ne > 90) A.perles.delete(p.id);
}

export const classement = A => A.serpents.filter(s => s.vivant).sort((a, b) => b.masse - a.masse);
export const score = s => Math.round(s.masse);
