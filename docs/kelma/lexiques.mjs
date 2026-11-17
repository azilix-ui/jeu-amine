// Kelma (18/11) : fabrique les trois lexiques du jeu dans jeux/kelma/lex/ (un mot par ligne, déjà normalisé).
// Usage : node lexiques.mjs <dossier node_modules> <arabicdictionary.sqlite d'Arramooz> <jeux/kelma/lex>
//   FR : an-array-of-french-words (MIT, d'après la liste de Letterpress) ; EN : an-array-of-english-words (MIT) ;
//   AR : Arramooz Alwaseet de Taha Zerrouki (GPL v2 ; noms et verbes, formes de base) ; mots grossiers retirés avec
//   naughty-words (LDNOOBW, CC BY 4.0). Les normalisations sont dans jeux/kelma/regles.js (normFR, normEN, normAR).
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
import { normFR, normEN, normAR, MOTS_IMAGES } from '../../jeux/kelma/regles.js';
const [NM, SQL, OUT] = process.argv.slice(2);
fs.mkdirSync(OUT, { recursive:true });
const lit = p => JSON.parse(fs.readFileSync(path.join(NM, p), 'utf8'));
const gros = l => new Set(lit('naughty-words/' + l + '.json').flatMap(w => String(w).split(/\s+/)));
function ecrit(lang, mots, norm, min = 3, max = 9){
  const bad = new Set([...gros(lang)].map(norm)), s = new Set();
  for(const w of mots){ const n = norm(w); if(n && n.length >= min && n.length <= max && !bad.has(n)) s.add(n); }
  for(const [w] of MOTS_IMAGES[lang]) s.add(norm(w));
  const L = [...s].sort(); fs.writeFileSync(path.join(OUT, lang + '.txt'), L.join('\n') + '\n'); console.log(lang, L.length, 'mots');
}
ecrit('fr', lit('an-array-of-french-words/index.json'), normFR);
ecrit('en', lit('an-array-of-english-words/index.json').filter(w => /^[a-z]+$/.test(w)), normEN);
const ar = execFileSync('python3', ['-I', '-c', 'import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); print("\\n".join(r[0] for r in c.execute("select unvocalized from nouns union select unvocalized from verbs") if r[0]))', SQL], { maxBuffer:1e8 }).toString().split('\n');
ecrit('ar', ar, normAR, 3, 8);
