/* Kelma كلمة · la tour des mots (18/11) : les règles, SANS dessin (importables dans Node pour les tests).
   D'après le cahier des charges du papa « Jeu de lettres multilingue » : une grille de lettres, on trace un mot en passant
   d'une case à une case voisine (8 voisins), les lettres du mot disparaissent et les autres tombent. Français, anglais, arabe.
   Tout est déterministe : même graine + même version + même lexique = même partie (défi du jour, tests). */

export const VERSION = 1;

/* ---------- le hasard reproductible ---------- */
export function graine(s){ let h = 2166136261 >>> 0; s = String(s); for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
export function hasard(seed){ let a = typeof seed === 'number' ? seed >>> 0 : graine(seed); return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- les langues et la normalisation ----------
   FR : sans accents sur le plateau (É = E, Œ = OE) : plus simple pour les enfants (choix à confirmer par le papa).
   AR : on garde l'écriture arabe ; on enlève les harakât et le tatwîl ; أ إ آ ٱ → ا ; ى → ي ; ؤ → و ; ئ → ي ; ة reste ة. */
export function normFR(w){ const s = String(w).normalize('NFD').replace(/\p{M}/gu, '').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').toUpperCase(); return /^[A-Z]+$/.test(s) ? s : ''; }
export function normEN(w){ const s = String(w).toUpperCase(); return /^[A-Z]+$/.test(s) ? s : ''; }
export function normAR(w){ const s = String(w).replace(/[ً-ٰٟـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي');
  return /^[ءابتثجحخدذرزسشصضطظعغفقكلمنهوية]+$/.test(s) ? s : ''; }
export const LANGUES = {
  fr:{ nom:'Français', drapeau:'🇫🇷', norm:normFR, rtl:false, voix:'fr-FR' },
  en:{ nom:'English', drapeau:'🇬🇧', norm:normEN, rtl:false, voix:'en-GB' },
  ar:{ nom:'العربية', drapeau:'🇹🇳', norm:normAR, rtl:true, voix:'ar' },
};

/* les mots en images (le Trésor d'Amine, et les indices faciles) : toujours ajoutés au lexique */
export const MOTS_IMAGES = {
  fr:[['CHAT','🐱'],['LOUP','🐺'],['LAIT','🥛'],['LIT','🛏️'],['BUS','🚌'],['RAT','🐀'],['OURS','🐻'],['LUNE','🌙'],['PAIN','🍞'],['ROI','👑'],['MER','🌊'],['FEU','🔥'],
      ['PIED','🦶'],['MAIN','✋'],['LION','🦁'],['COQ','🐓'],['BOL','🥣'],['VELO','🚲'],['NEZ','👃'],['SEL','🧂'],['AMI','🤝'],['RIZ','🍚'],['SAC','👜'],['CLE','🔑'],
      ['POMME','🍎'],['VACHE','🐄'],['POULE','🐔'],['ARBRE','🌳'],['FLEUR','🌸'],['TRAIN','🚆'],['AVION','✈️'],['SINGE','🐒'],['TIGRE','🐯'],['ZEBRE','🦓'],['POIRE','🍐']],
  en:[['CAT','🐱'],['DOG','🐶'],['SUN','☀️'],['BUS','🚌'],['EGG','🥚'],['CAR','🚗'],['HAT','🎩'],['BED','🛏️'],['PIG','🐷'],['COW','🐄'],['FOX','🦊'],['BEE','🐝'],
      ['MOON','🌙'],['FISH','🐟'],['BALL','⚽'],['CAKE','🎂'],['STAR','⭐'],['TREE','🌳'],['BOOK','📖'],['MILK','🥛'],['LION','🦁'],['BIRD','🐦'],['FROG','🐸'],['DUCK','🦆'],
      ['APPLE','🍎'],['HOUSE','🏠'],['HORSE','🐴'],['TRAIN','🚆'],['PLANE','✈️'],['MOUSE','🐭']],
  ar:[['اسد','🦁'],['بيت','🏠'],['شمس','☀️'],['قمر','🌙'],['باب','🚪'],['فيل','🐘'],['كلب','🐶'],['سمك','🐟'],['موز','🍌'],['جمل','🐫'],['كتاب','📖'],['قلم','✏️'],
      ['حليب','🥛'],['خبز','🍞'],['بحر','🌊'],['عين','👁️'],['ورد','🌹'],['نمر','🐯'],['ديك','🐓'],['قطة','🐱'],['نحلة','🐝'],['تفاحة','🍎'],['نجمة','⭐'],['شجرة','🌳']],
};

/* ---------- le lexique : un tableau trié (recherche dichotomique), un Set, les fréquences des lettres ---------- */
export function lexique(lang, texte){
  const mots = String(texte).split('\n').filter(Boolean), set = new Set(mots), freq = {};
  for(const m of mots) for(const c of m) freq[c] = (freq[c] || 0) + 1;
  const L = Object.keys(freq).sort(), tot = L.reduce((a, c) => a + freq[c], 0), max = Math.max(...L.map(c => freq[c]));
  // valeur d'une lettre : 1 pour les plus fréquentes, jusqu'à 10 pour les plus rares
  const valeur = {}; L.forEach(c => { valeur[c] = Math.max(1, Math.min(10, 1 + Math.round(Math.log(max / freq[c]) * 1.6))); });
  // le sac : fréquences un peu aplaties (les lettres rares un peu plus souvent que dans le lexique), cumulées
  let cum = 0; const sac = L.map(c => [c, cum += Math.pow(freq[c] / tot, .85)]);
  return { lang, mots, set, freq, valeur, sac, total:cum };
}
export function aPrefixe(lex, p){ const a = lex.mots; let lo = 0, hi = a.length; while(lo < hi){ const m = (lo + hi) >> 1; if(a[m] < p) lo = m + 1; else hi = m; } return lo < a.length && a[lo].startsWith(p); }
export function tire(lex, r){ const x = r() * lex.total, s = lex.sac; let lo = 0, hi = s.length - 1; while(lo < hi){ const m = (lo + hi) >> 1; if(s[m][1] < x) lo = m + 1; else hi = m; } return s[lo][0]; }

/* ---------- la grille ---------- */
// une case : null (vide) ou { l:'A', b:'' } ; b = '' | 'dl' (lettre ×2, jasmin) | 'tl' (lettre ×3) | 'dm' (mot ×2, chéchia) | 'bombe' (pétards, 3×3) | 'col' (la colonne) | 'brique' (yajour : pas de lettre, cassée par un mot voisin)
export const BONUS = { dl:'Lettre × 2', tl:'Lettre × 3', dm:'Mot × 2', bombe:'Pétards : tout autour', col:'Toute la colonne', brique:'Brique (yajour)' };
export function voisins(W, H, i){ const x = i % W, y = (i / W) | 0, v = []; for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ if(!dx && !dy) continue; const X = x + dx, Y = y + dy; if(X >= 0 && Y >= 0 && X < W && Y < H) v.push(Y * W + X); } return v; }
export const adjacent = (W, a, b) => a !== b && Math.abs(a % W - b % W) <= 1 && Math.abs(((a / W) | 0) - ((b / W) | 0)) <= 1;

function caseHasard(lex, r, cfg){ const x = r();
  if(cfg.briques && x < cfg.briques) return { l:'', b:'brique' };
  const l = tire(lex, r), y = r(), p = cfg.bonus || 0;
  const b = y < p * .4 ? 'dl' : y < p * .55 ? 'tl' : y < p * .8 ? 'dm' : y < p * .92 ? 'bombe' : y < p ? 'col' : '';
  return { l, b }; }
export function grilleBrute(cfg, lex, r){ const { W, H } = cfg, c = new Array(W * H).fill(null), lignes = cfg.lignes ?? H;
  for(let y = H - lignes; y < H; y++) for(let x = 0; x < W; x++) c[y * W + x] = caseHasard(lex, r, cfg);
  return c; }

/* une grille équitable : on vérifie qu'il y a au moins K mots ; sinon on recommence avec une graine dérivée */
export function nouvellePartie(cfg, lex, seed){
  let cases, essai = 0, mots = [];
  do { const r = hasard(seed + ':' + essai); cases = cfg.images ? grilleImages(cfg, lex, r) : grilleBrute(cfg, lex, r);
    mots = cherche({ W:cfg.W, H:cfg.H, cases }, lex, { max:Math.max(cfg.K || 5, 8), min:cfg.min || 3 }); essai++;
  } while(mots.length < (cfg.K || 5) && essai < 40);
  return { v:VERSION, cfg, seed:String(seed), lang:lex.lang, W:cfg.W, H:cfg.H, cases, score:0, mots:[], tours:0, combo:0, dernierT:-1e9, fini:false, perdu:false, cibles:cfg.images ? cfg.images.map(x => x[0]) : null, trouves:[] };
}

/* le Trésor d'Amine : les mots en images sont posés sur des chemins dans la grille, le reste au hasard */
export function grilleImages(cfg, lex, r){
  const { W, H } = cfg, c = new Array(W * H).fill(null);
  const pose = (mot) => { for(let t = 0; t < 200; t++){ let i = (r() * W * H) | 0; if(c[i] && c[i].l !== mot[0]) continue; const ch = [i];
      const ok = (function suite(k){ if(k === mot.length) return true; const v = voisins(W, H, ch[k - 1]).filter(j => !ch.includes(j) && (!c[j] || c[j].l === mot[k])); for(let n = v.length - 1; n > 0; n--){ const m = (r() * (n + 1)) | 0; [v[n], v[m]] = [v[m], v[n]]; }
        for(const j of v){ ch.push(j); if(suite(k + 1)) return true; ch.pop(); } return false; })(1);
      if(ok && !c[i] || ok && c[i].l === mot[0]){ ch.forEach((j, k) => { c[j] = { l:mot[k], b:'' }; }); return true; } }
    return false; };
  for(const [m] of cfg.images) pose(m);
  for(let i = 0; i < c.length; i++) if(!c[i]) c[i] = { l:tire(lex, r), b:'' };
  return c;
}

/* ---------- jouer un mot ---------- */
export const MULT_LONG = n => n <= 3 ? 1 : n === 4 ? 1.2 : n === 5 ? 1.5 : n <= 7 ? 2 : 3;
// vérifie un chemin SANS rien modifier ; renvoie { ok, raison } ou { ok:true, mot, score, detail }
export function verifie(etat, chemin, lex, t = 0){
  const { W, H, cases } = etat, min = etat.cfg.min || 3;
  if(!Array.isArray(chemin) || !chemin.length) return { ok:false, raison:'vide' };
  const vu = new Set();
  for(let k = 0; k < chemin.length; k++){ const i = chemin[k];
    if(!Number.isInteger(i) || i < 0 || i >= W * H) return { ok:false, raison:'hors' };
    if(vu.has(i)) return { ok:false, raison:'deux fois' }; vu.add(i);
    if(k && !adjacent(W, chemin[k - 1], i)) return { ok:false, raison:'pas voisin' };
    const c = cases[i]; if(!c || !c.l) return { ok:false, raison:'case vide' }; }
  const mot = chemin.map(i => cases[i].l).join('');
  if([...mot].length < min) return { ok:false, raison:'trop court', mot };
  if(!lex.set.has(mot)) return { ok:false, raison:'inconnu', mot };
  return { ok:true, mot, ...calcule(etat, chemin, lex, t) };
}
export function calcule(etat, chemin, lex, t = 0){
  let s = 0, motX = 1; const detail = [];
  for(const i of chemin){ const c = etat.cases[i], v = lex.valeur[c.l] || 1, m = c.b === 'dl' ? 2 : c.b === 'tl' ? 3 : 1; s += v * m; if(c.b === 'dm') motX = Math.min(4, motX * 2); detail.push([c.l, v, m]); }
  const long = MULT_LONG(chemin.length), combo = t - etat.dernierT < 5000 ? Math.min(2, 1 + .25 * (etat.combo + 1)) : 1;
  return { score:Math.round(s * long * motX * combo), detail, long, motX, combo };
}
// joue un chemin : renvoie un NOUVEL état (l'ancien n'est jamais modifié) et ce qui a disparu (pour les animations)
export function joue(etat, chemin, lex, t = 0){
  const v = verifie(etat, chemin, lex, t); if(!v.ok) return { etat, res:v };
  const { W, H } = etat, cases = etat.cases.map(c => c && { ...c }), part = new Set(chemin);
  if(etat.cibles || etat.cfg.chercher){   // le Trésor : les lettres restent, on note le mot trouvé
    const n = { ...etat, trouves:etat.trouves.includes(v.mot) ? etat.trouves : [...etat.trouves, v.mot], score:etat.score + v.score, mots:[...etat.mots, v.mot], tours:etat.tours + 1 };
    n.fini = !!(etat.cibles && etat.cibles.every(m => n.trouves.includes(m))); return { etat:n, res:{ ...v, part:[...part] } };
  }
  for(const i of chemin){ const b = cases[i].b, x = i % W, y = (i / W) | 0;
    if(b === 'bombe') for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy; if(X >= 0 && Y >= 0 && X < W && Y < H && cases[Y * W + X]) part.add(Y * W + X); }
    if(b === 'col') for(let Y = 0; Y < H; Y++) if(cases[Y * W + x]) part.add(Y * W + x); }
  for(const i of chemin) for(const j of voisins(W, H, i)) if(cases[j] && cases[j].b === 'brique') part.add(j);   // un mot casse les briques voisines
  for(const i of part) cases[i] = null;
  const n = { ...etat, cases:gravite(cases, W, H), score:etat.score + v.score, mots:[...etat.mots, v.mot], tours:etat.tours + 1,
    combo:t - etat.dernierT < 5000 ? etat.combo + 1 : 0, dernierT:t };
  n.fini = n.cases.every(c => !c);
  return { etat:n, res:{ ...v, part:[...part] } };
}
export function gravite(cases, W, H){ const c = cases.slice();
  for(let x = 0; x < W; x++){ const col = []; for(let y = H - 1; y >= 0; y--) if(c[y * W + x]) col.push(c[y * W + x]);
    for(let y = H - 1, k = 0; y >= 0; y--, k++) c[y * W + x] = col[k] || null; }
  return c; }
// une nouvelle ligne arrive par le bas : tout monte d'un cran ; perdu si la ligne du haut n'est pas vide
export function ajouteLigne(etat, lex, r){
  const { W, H } = etat; for(let x = 0; x < W; x++) if(etat.cases[x]) return { ...etat, perdu:true, fini:true };
  const c = etat.cases.slice(W); for(let x = 0; x < W; x++) c.push(caseHasard(lex, r, etat.cfg));
  return { ...etat, cases:c };
}
// le mode tranquille : les trous du haut se remplissent de nouvelles lettres
export function remplit(etat, lex, r){ const c = etat.cases.map(x => x || caseHasard(lex, r, { ...etat.cfg, briques:0 })); return { ...etat, cases:c, fini:false }; }
// mélanger (pouvoir) : les lettres changent de place, les cases vides restent
export function melange(etat, r){ const idx = etat.cases.map((c, i) => c && c.l ? i : -1).filter(i => i >= 0), L = idx.map(i => etat.cases[i]);
  for(let n = L.length - 1; n > 0; n--){ const m = (r() * (n + 1)) | 0; [L[n], L[m]] = [L[m], L[n]]; }
  const c = etat.cases.slice(); idx.forEach((i, k) => { c[i] = L[k]; }); return { ...etat, cases:c }; }

/* ---------- chercher les mots (indices, fin de partie, robot des tests) : parcours en profondeur + préfixes ---------- */
export function cherche(etat, lex, o = {}){
  const { W, H, cases } = etat, max = o.max || 60, min = o.min || etat.cfg?.min || 3, prof = o.prof || 8, trouve = new Map(), t0 = Date.now(), lim = o.ms || 400;
  const vu = new Uint8Array(W * H), ch = [];
  function dfs(i, p){ if(trouve.size >= max * 4 || Date.now() - t0 > lim) return;
    const c = cases[i]; if(!c || !c.l || vu[i]) return; const q = p + c.l; if(!aPrefixe(lex, q)) return;
    vu[i] = 1; ch.push(i);
    if(ch.length >= min && lex.set.has(q) && !trouve.has(q)) trouve.set(q, ch.slice());
    if(ch.length < prof) for(const j of voisins(W, H, i)) dfs(j, q);
    vu[i] = 0; ch.pop(); }
  for(let i = 0; i < W * H; i++) dfs(i, '');
  const e = { ...etat, cfg:etat.cfg || {}, dernierT:-1e9, combo:0 };
  return [...trouve].map(([mot, chemin]) => ({ mot, chemin, score:calcule(e, chemin, lex).score })).sort((a, b) => b.score - a.score || b.mot.length - a.mot.length).slice(0, max);
}

/* ---------- les modes ---------- */
export const MODES = {
  bordj:   { nom:'La tour', ar:'البرج', desc:'Vide la tour de lettres : chaque mot fait tomber les lettres.', W:8, H:10, lignes:10, K:8, bonus:.08, briques:0, fin:'mots' },
  ligne:   { nom:'Une ligne par mot', ar:'سطر بسطر', desc:'Tous les deux mots, une nouvelle ligne monte. Ne laisse pas la tour déborder !', W:8, H:10, lignes:5, K:5, bonus:.07, parMot:2 },
  zarba:   { nom:'Zarba !', ar:'زربة', desc:'Les lignes montent toutes seules, de plus en plus vite.', W:8, H:10, lignes:5, K:5, bonus:.07, intervalle:14000, accel:.93 },
  bechwaya:{ nom:'Bechwaya', ar:'بالشوية', desc:'Tout doucement : pas de temps, pas de débordement, les lettres reviennent.', W:7, H:8, lignes:8, K:6, bonus:.06, remplit:true },
  chrono:  { nom:'Chrono', ar:'الساعة', desc:'Deux minutes pour faire le plus de points.', W:7, H:8, lignes:8, K:8, bonus:.08, remplit:true, duree:120000 },
  jour:    { nom:'Le défi du jour', ar:'تحدي اليوم', desc:'La même grille pour toute la famille aujourd\'hui. Trois minutes !', W:7, H:8, lignes:8, K:8, bonus:.08, remplit:true, duree:180000 },
  kenz:    { nom:'Le trésor', ar:'الكنز', desc:'Trouve les mots cachés dans la grille. Les lettres restent.', W:6, H:6, lignes:6, K:10, bonus:0, chercher:6 },
};
// les réglages selon l'enfant : Amine a une petite grille et le trésor en images
export function reglage(mode, joueur){
  const m = { ...MODES[mode] }; m.min = 3;
  if(joueur === 'Amine'){ m.W = Math.min(m.W, 5); m.H = Math.min(m.H, 6); m.lignes = Math.min(m.lignes, m.H); m.bonus = Math.min(m.bonus, .04); if(m.intervalle) m.intervalle *= 1.8; if(m.duree) m.duree *= 1.5; }
  else if(joueur === 'Salma'){ m.W = Math.min(m.W, 7); m.H = Math.min(m.H, 9); m.lignes = Math.min(m.lignes, m.H); if(m.intervalle) m.intervalle *= 1.3; }
  return m;
}
// le trésor en images : n mots à poser (courts pour Amine)
export function cfgImages(lang, joueur, r, n = 3){ const L = MOTS_IMAGES[lang].filter(([m]) => [...m].length <= (joueur === 'Amine' ? 4 : 5)), out = [];
  while(out.length < Math.min(n, L.length)){ const x = L[(r() * L.length) | 0]; if(!out.includes(x)) out.push(x); }
  const W = joueur === 'Amine' ? 5 : 6; return { ...MODES.kenz, W, H:W, lignes:W, images:out, K:out.length, min:3, chercher:out.length }; }

/* ---------- la campagne : 3 mondes de 8 niveaux (objectifs variés, tous vérifiés par le robot des tests) ---------- */
export const MONDES = [
  { id:'m1', nom:'Sidi Bou Saïd', ar:'سيدي بوسعيد', img:'m1' },
  { id:'m2', nom:'Le souk de Kairouan', ar:'سوق القيروان', img:'m2' },
  { id:'m3', nom:'Djerba', ar:'جربة', img:'m3' },
];
export const NIVEAUX = (() => { const L = [];
  const modele = [ ['bordj', 'mots', 4], ['bordj', 'score', 60], ['ligne', 'mots', 5], ['bordj', 'mots', 6], ['ligne', 'score', 100], ['bordj', 'long', 5], ['ligne', 'mots', 6], ['bordj', 'score', 160] ];
  MONDES.forEach((m, w) => modele.forEach(([mode, type, n], k) => L.push({ id:m.id + '-' + (k + 1), monde:m.id, n:k + 1, mode, but:{ type, n:type === 'long' ? n + (w ? 1 : 0) : Math.round(n * (1 + w * .25)) },
    briques:w >= 1 && k >= 3 ? .04 * w : 0, graine:'kelma-' + m.id + '-' + (k + 1) })));
  return L; })();
export function butAtteint(etat, but){ if(but.type === 'mots') return etat.mots.length >= but.n; if(but.type === 'score') return etat.score >= but.n; if(but.type === 'long') return etat.mots.some(m => [...m].length >= but.n); return false; }
export function texteBut(but){ return but.type === 'mots' ? `Trouve ${but.n} mots` : but.type === 'score' ? `Fais ${but.n} points` : `Trouve un mot de ${but.n} lettres`; }
export function texteButAr(but){ return but.type === 'mots' ? `اِبْحَثْ عَنْ ${but.n} كَلِمَات` : but.type === 'score' ? `اِجْمَعْ ${but.n} نُقْطَة` : `كَلِمَة مِنْ ${but.n} حُرُوف`; }
export function etoilesNiveau(etat, but){ if(!butAtteint(etat, but)) return 0; const r = but.type === 'score' ? etat.score / but.n : but.type === 'mots' ? etat.score / (but.n * 25) : etat.score / 80; return r >= 1.6 ? 3 : r >= 1.15 ? 2 : 1; }
